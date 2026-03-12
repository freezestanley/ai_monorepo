import { useState, useCallback } from "react"
import { Link, useLocation } from "react-router-dom"
import queryString from "query-string"
import { Button, Table, Row, Col, Form, Select, DatePicker, Input, Breadcrumb, Tooltip } from "antd"
import PageContainer from "@/components/PageContainer"
import { useFetchListLogByPage } from "@/api/talkManagement"
import ViewDrawer from "./components/viewDrawer"
import styles from "./index.module.scss"

export const OperationLogSubType = {
  ADD: "新增",
  UPDATE: "修改",
  DELETE: "删除",
  ENABLE: "启用",
  DISABLE: "禁用",
  MOVE: "移动",
  BIND: "绑定",
  UNBIND: "解绑"
}

const OperationLog = () => {
  const [form] = Form.useForm()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [pagination, setPagination] = useState({ pageNum: 1, pageSize: 10 })
  const [searchParams, setSearchParams] = useState({})
  const [viewData, setViewData] = useState({})
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search) ?? {}
  const { botNo, templateName, templateId } = queryParams
  const {
    data: logListData,
    isLoading: listLoading,
    refetch: refetchListLogByPage
  } = useFetchListLogByPage({
    ...pagination,
    ...searchParams,
    bizId: templateId,
    operationLogType: !templateId ? "DIALOGUE_USABLE" : "KNOWLEDGE_TEMPLATE"
  })

  const onSearchTable = useCallback(
    (value) => {
      const { _time, ...params } = value
      let [beginTime, endTime] = _time || []
      if (beginTime) {
        beginTime = beginTime.format("YYYY-MM-DD HH:mm:ss")
      }
      if (endTime) {
        endTime = endTime.format("YYYY-MM-DD HH:mm:ss")
      }
      const val = { ...params, beginTime, endTime }
      setSearchParams((preState) => {
        if (JSON.stringify(preState) === JSON.stringify(val)) {
          refetchListLogByPage()
        }
        return val
      })
    },
    [refetchListLogByPage]
  )

  const columns = [
    {
      title: "操作类型",
      dataIndex: "operationLogSubType",
      render: (text) => OperationLogSubType[text]
    },
    {
      title: "操作人",
      dataIndex: "operator"
    },
    {
      title: "操作时间",
      dataIndex: "operationTime"
    },
    {
      title: "操作描述",
      dataIndex: "operationDesc",
      render: (text) =>
        text && (
          <Tooltip title={text}>{text?.length > 80 ? text?.slice(0, 80) + "..." : text}</Tooltip>
        )
    },
    {
      title: "操作",
      dataIndex: "action",
      fixed: "right",
      render: (_, record) => {
        return (
          <Button
            style={{ paddingRight: 0, paddingLeft: 0 }}
            type="link"
            onClick={() => {
              setViewData(record)
              setDrawerOpen(true)
            }}
          >
            查看
          </Button>
        )
      }
    }
  ]

  return (
    <PageContainer
      headerTitle={
        <Breadcrumb
          className={styles.breadcrumb}
          items={[
            ...(!templateId
              ? [
                  {
                    title: <Link to={`/talkManagement?botNo=${botNo}`}>全部话术</Link>
                  }
                ]
              : [
                  {
                    title: <Link to={`/templateManage?botNo=${botNo}`}>模板管理</Link>
                  },
                  {
                    title: (
                      <Link to={`/templateDetail?botNo=${botNo}&templateId=${templateId}`}>
                        {templateName}
                      </Link>
                    )
                  }
                ]),
            {
              title: "操作日志"
            }
          ]}
        />
      }
      headerCustomeSearch={
        <div className={styles["search-box"]}>
          <Form form={form} layout="horizontal" onFinish={(value) => onSearchTable(value)}>
            <Row gutter={24}>
              <Col span={6}>
                <Form.Item name="operationLogSubType">
                  <Select
                    placeholder="请选择操作类型"
                    options={Object.entries(OperationLogSubType).map(([key, value]) => ({
                      label: value,
                      value: key
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="modifier">
                  <Input placeholder="请输入操作人" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="_time">
                  <DatePicker.RangePicker placeholder={["开始时间", "结束时间"]} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item>
                  <Button htmlType="submit" type="primary" style={{ marginRight: 8 }}>
                    查询
                  </Button>
                  <Button
                    onClick={() => {
                      form.resetFields()
                      onSearchTable({})
                    }}
                  >
                    重置
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </div>
      }
    >
      <Table
        rowKey={(record) =>
          record.operationDesc + record.operationTime + record.operationLogSubType
        }
        loading={listLoading}
        columns={columns}
        dataSource={logListData?.records}
        pagination={{
          className: "pr-2",
          current: pagination.pageNum,
          pageSize: pagination.pageSize,
          total: logListData?.total,
          onChange: (page, pageSize) => setPagination({ pageNum: page, pageSize }),
          showSizeChanger: true,
          style: { marginTop: "15px", textAlign: "right" },
          showTotal: (total) => `共 ${total} 条`
        }}
        scroll={{ x: "max-content" }}
      />
      <ViewDrawer viewData={viewData} visiable={drawerOpen} setVisiable={setDrawerOpen} />
    </PageContainer>
  )
}

export default OperationLog
