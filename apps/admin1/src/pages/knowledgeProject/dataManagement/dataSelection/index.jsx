import { useCallback, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import queryString from "query-string"
import PageContainer from "@/components/PageContainer"
import { useSSO } from "@/components/SSOProvider"
import { Button, Form, Input, Table, Checkbox, Row, Col } from "antd"
import { useDataSetInfoListApi, useFetchReRunDataSetInfoApi } from "@/api/dataManagement"
import { useJumpExtractTaskParamsApi } from "@/api/knowledgeExtraction"
import { skillTypeEnum } from "@/pages/knowledgeProject/knowledgeManage/extractionType"
import { useMemoryStorage } from "@/components/MemoryProvider"
import { MEMORY_STORAGE_KEYS } from "@/constants/memoryStorage"
import FormDrawer from "./components/formDrawer"
import styles from "../index.module.scss"

const DataSelection = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search) ?? {}
  const { botNo } = queryParams
  const { userInfo = {} } = useSSO()
  const [form] = Form.useForm()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerData, setDrawerData] = useState({ mode: "add", id: null })
  const mpk = MEMORY_STORAGE_KEYS.DATA_SELECTION_PAGINATION
  const { setMemoryPagination, getMemoryPagination } = useMemoryStorage()
  const [pagination, setPagination] = useState(getMemoryPagination(mpk))
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [seachData, setSeachData] = useState({})
  const [isOnlyMine, setIsOnlyMine] = useState(false)

  // 数据圈选列表
  const {
    data: tableData,
    isLoading: listLoading,
    refetch: refetchDataSetInfoList
  } = useDataSetInfoListApi({
    pageNum: pagination.current,
    pageSize: pagination.pageSize,
    botNo,
    ...seachData
  })
  const { mutate: fetchReRunDataSetInfo } = useFetchReRunDataSetInfoApi()
  const { mutate: jumpExtractTaskParams } = useJumpExtractTaskParamsApi()

  const onSearchTable = useCallback(
    (val) => {
      setSeachData((preState) => {
        if (JSON.stringify(preState) === JSON.stringify(val)) {
          refetchDataSetInfoList()
        }
        return val
      })
    },
    [refetchDataSetInfoList]
  )

  const jumpUrl = useCallback(
    (params) => {
      const { botNo, batchCode, skillType } = params || {}
      let url = `/InstanceBatchExtractorDetail?batchCode=${batchCode}&botNo=${botNo}&source=dataSelection`
      if (skillType === "1") {
        jumpExtractTaskParams(
          { botNo, batchCode },
          {
            onSuccess: (res) => {
              if (res?.success) {
                const { knowledgeBaseNo, catalogNo, structureNo, key, value } = res.data || {}
                url = `/viewStructureKnowledgeDetail?knowledgeBaseNo=${knowledgeBaseNo}&catalogNo=${catalogNo}&structureNo=${structureNo}&botNo=${botNo}&searchKey=${key}&searchValue=${value}`
                navigate(url)
              }
            }
          }
        )
      } else {
        navigate(url)
      }
    },
    [jumpExtractTaskParams, navigate]
  )

  const columns = [
    {
      title: "数据集名称",
      dataIndex: "dataSetName"
    },
    {
      title: "用途说明",
      dataIndex: "desc"
    },
    {
      title: "总数",
      dataIndex: "totalCount"
    },
    {
      title: "开始时间",
      dataIndex: "beginDate"
    },
    {
      title: "结束时间",
      dataIndex: "endDate"
    },
    {
      title: "创建人",
      dataIndex: "creator"
    },
    {
      title: "工作流类型",
      dataIndex: "skillType",
      filters: Object.entries(skillTypeEnum).map(([value, text]) => ({
        value,
        text
      })),
      onFilter: (value, record) => {
        return record.bindTaskInfo?.skillType === value
      },
      render: (_, record) => skillTypeEnum[record.bindTaskInfo?.skillType]
    },
    {
      title: "萃取任务",
      dataIndex: "bindTaskInfo",
      render: (text) => text?.taskName
    },
    {
      title: "操作",
      dataIndex: "action",
      fixed: "right",
      width: 250,
      render: (_, record) => (
        <>
          <Button
            style={{ paddingRight: 0, paddingLeft: 0 }}
            type="link"
            onClick={() => {
              setDrawerData({
                mode: record?.bindTaskInfo?.id ? "view" : "edit",
                id: record.id
              })
              setDrawerOpen(true)
            }}
          >
            {record?.bindTaskInfo?.id ? "查看任务" : "新增任务"}
          </Button>
          <Button
            style={{ paddingRight: "5px" }}
            type="link"
            disabled={!["2", "8", "9"].includes(record.status)}
            onClick={() => fetchReRunDataSetInfo([{ id: record.id }])}
          >
            重跑
          </Button>
          <Button
            style={{ paddingRight: "5px" }}
            type="link"
            onClick={() => {
              setDrawerData({ mode: "copy", id: record.id })
              setDrawerOpen(true)
            }}
          >
            复制
          </Button>
          {!!record?.bindTaskInfo?.id && (
            <Button
              type="link"
              onClick={() => {
                jumpUrl(record.bindTaskInfo)
              }}
            >
              详情
            </Button>
          )}
        </>
      )
    }
  ]

  return (
    <PageContainer
      headerTitle="数据圈选"
      headerCustomeSearch={
        <div className={styles["searchbox"]}>
          <Form
            form={form}
            layout="horizontal"
            onFinish={(value) =>
              onSearchTable({
                ...value,
                ...(isOnlyMine ? { creator: userInfo.adAccount } : {})
              })
            }
          >
            <Row gutter={24}>
              <Col span={6}>
                <Form.Item label="名称" name="name">
                  <Input placeholder="请输入数据集名称或萃取任务名称" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="创建人" name="creator">
                  <Input placeholder="请输入创建人" disabled={isOnlyMine} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item>
                  <Checkbox
                    checked={isOnlyMine}
                    onChange={(e) => {
                      setIsOnlyMine(e.target.checked)
                      form.setFieldsValue({ creator: "" })
                    }}
                  >
                    仅我创建
                  </Checkbox>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Button htmlType="submit" type="primary" style={{ marginRight: 8 }}>
                  查询
                </Button>
                <Button
                  onClick={() => {
                    form.resetFields()
                    setIsOnlyMine(false)
                    onSearchTable({})
                  }}
                >
                  重置
                </Button>
              </Col>
            </Row>
          </Form>
        </div>
      }
    >
      <div style={{ textAlign: "right", width: "100%", marginBottom: "10px" }}>
        <Button
          disabled={!selectedRowKeys.length}
          style={{ marginRight: 8 }}
          onClick={() => fetchReRunDataSetInfo(selectedRowKeys.map((id) => ({ id })))}
        >
          批量重跑
        </Button>
        <Button
          type="primary"
          onClick={() => {
            setDrawerData({ mode: "add", id: null })
            setDrawerOpen(true)
          }}
        >
          创建
        </Button>
      </div>
      <Table
        rowKey={"id"}
        loading={listLoading}
        columns={columns}
        dataSource={tableData?.records ?? []}
        pagination={{
          className: "pr-2",
          current: pagination.pageNum,
          pageSize: pagination.pageSize,
          total: tableData?.total,
          onChange: (page, pageSize) => {
            setMemoryPagination(mpk, { current: page, pageSize })
            setPagination({ current: page, pageSize })
          },
          showSizeChanger: true,
          style: { marginTop: "15px", textAlign: "right" },
          showTotal: (total) => `共 ${total} 条`
        }}
        rowSelection={{
          fixed: true,
          selectedRowKeys,
          onChange: setSelectedRowKeys,
          getCheckboxProps: (record) => ({
            disabled: !["2", "8", "9"].includes(record.status)
          })
        }}
        scroll={{ x: "max-content" }}
      />
      <FormDrawer {...drawerData} botNo={botNo} visiable={drawerOpen} setVisiable={setDrawerOpen} />
    </PageContainer>
  )
}

export default DataSelection
