import { useEffect, useState } from "react"
import {
  Table,
  Button,
  Form,
  Input,
  Row,
  Col,
  Pagination,
  message,
  Popconfirm,
  Card,
  Tooltip,
  Modal
} from "antd"

import { debounce } from "lodash"
import { ExclamationCircleFilled, LeftOutlined } from "@ant-design/icons"
import { useLocation, useNavigate } from "react-router-dom"
import ConstantsForm from "./components/constantsForm"
import {
  useCreateBotConstant,
  useDeleteBotConstant,
  useFetchBotConstantsPage,
  useUpdateBotConstant
} from "@/api/botConstants"
import queryString from "query-string"
import { useFetchBotInfo } from "@/api/bot"
import { useFetchAgentConstantList } from "@/api/agent"
import { usePreviousLocation } from "@/router/PreviousLocationProvider"
import { useInitPublishData, useStudioPublishData } from "@/hooks/useStudioPublishData"

function BotConstants() {
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)
  const { botNo, agentNo } = queryParams
  const { data: botDetails = {} } = useFetchBotInfo(botNo)
  const { setPrevLocation } = usePreviousLocation()

  const [visible, setVisible] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentRecord, setCurrentRecord] = useState({})
  const [filterForm] = Form.useForm()
  const [form] = Form.useForm()
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [params, setParams] = useState({})
  const navigate = useNavigate()
  const [sortAndFilterState, setSortAndFilterState] = useState({
    orderField: "",
    asc: ""
  })

  // 获取版本发布配置数据
  useInitPublishData()
  const { isPublishDisabled } = useStudioPublishData()

  const { mutate: createBotConstant } = useCreateBotConstant()
  const { mutate: deleteBotConstant } = useDeleteBotConstant()
  const { mutate: updateBotConstant, isLoading } = useUpdateBotConstant()
  // useFetchAgentConstantList
  const listFetch = agentNo ? useFetchAgentConstantList : useFetchBotConstantsPage
  const { data: { data: tableList = [], totalCount } = {}, refetch } = listFetch({
    ...params,
    ...sortAndFilterState,
    botNo,
    agentNo,
    pageNum: pagination.current,
    pageSize: pagination.pageSize
  })

  const handleDelete = async (record) => {
    try {
      await deleteBotConstant(record)
      message.success(`删除成功`)
    } catch (error) {
      message.error(`删除失败`)
      console.log(":===>>>  error:", error)
    } finally {
      refetch()
    }
  }

  const isIframeStyle = () => {
    const { search } = location
    const queryParams = queryString.parse(search)
    const { isIframe } = queryParams
    return isIframe == "true"
  }

  const backToBotList = () => {
    if (isIframeStyle()) {
      // 返回上一页
      window.history.back()
    } else {
      navigate(`/addBot/${botNo}`)
    }
  }

  const onBackCancel = () => {
    const isModified = form.isFieldsTouched()
    setPrevLocation("/botConstants")
    if (isModified) {
      Modal.confirm({
        title: "请确认您的修改是否已经保存",
        icon: <ExclamationCircleFilled />,
        content: "点击【确认】则返回空间工作流页，点击【取消】则取消返回",
        onOk() {
          backToBotList()
        },
        onCancel() {}
      })
    } else {
      backToBotList()
    }
  }

  const columns = [
    {
      title: "全局常量名称",
      width: 200,
      dataIndex: "key",
      key: "key"
    },
    {
      title: "常量描述",
      width: 200,
      dataIndex: "desc",
      key: "desc"
    },
    {
      title: "常量类型",
      width: 100,
      dataIndex: "type",
      key: "type"
    },
    {
      title: "创建信息",
      width: 150,
      dataIndex: "gmtCreated",
      key: "gmtCreated",
      sorter: true,
      render: (_, record) => {
        return (
          <div>
            {record.creatorDisplayName}
            <br />
            {record.gmtCreated}
          </div>
        )
      }
    },
    {
      title: "更新信息",
      width: 150,
      dataIndex: "gmtModified",
      key: "gmtModified",
      sorter: true,
      render: (_, record) => {
        return (
          <div>
            {record.modifierDisplayName}
            <br />
            {record.gmtModified}
          </div>
        )
      }
    },
    {
      title: "操作",
      width: 160,
      key: "operation",
      render: (_, record) => (
        <>
          <Button type="link" onClick={() => handleEdit(record)} className="p-0 ml-4">
            编辑
          </Button>
          <Popconfirm
            title="【删除】常量后，关联工作流可能出现异常"
            onConfirm={() => handleDelete(record)}
            okText="确认"
            cancelText="取消"
          >
            <Button disabled={record.status === 8 || isPublishDisabled} type="link">
              删除
            </Button>
          </Popconfirm>
        </>
      )
    }
  ]

  const handleQuery = debounce(() => {
    filterForm.validateFields().then((values) => {
      setPagination((prev) => {
        return {
          ...prev,
          current: 1,
          pageSize: pagination.pageSize
        }
      })
      setParams(values)
    })
  }, 1000)

  const handleSortOrFilterChange = (pagination, filters, sorter) => {
    const { order, field } = sorter
    setSortAndFilterState({
      orderField: !order ? "" : field === "gmtCreated" ? "gmt_created" : "",
      asc: order === "ascend" ? "true" : order === "descend" ? "false" : ""
    })
  }

  const handleEdit = (record) => {
    setCurrentRecord(record)
    setIsEditing(true)
    form.setFieldsValue({
      ...record
    })
    setVisible(true)
  }

  const handleSave = () => {
    form.validateFields().then((values) => {
      const api = isEditing ? updateBotConstant : createBotConstant
      const params = {
        ...currentRecord,
        ...values,
        key: isEditing ? values.key : `constant.${values.key}`,
        botNo,
        agentNo
      }
      if (isEditing) {
        // @ts-ignore
        params.id = currentRecord.id
      }
      api(params, {
        onSuccess: (e) => {
          if (e.success) {
            message.success("保存成功")
            setVisible(false)
            form.resetFields()
            refetch()
          } else {
            message.error(e.message)
          }
        }
      })
    })
  }

  useEffect(() => {
    if (!isEditing) {
      form.resetFields()
    }
  }, [form, visible, isEditing])

  return (
    <div>
      <Card
        bordered={false}
        style={{
          boxShadow: "none",
          background: "transparent"
        }}
        headStyle={{
          paddingLeft: 0
        }}
        title={
          <div className="px-4">
            <Tooltip title="返回空间工作流页">
              <Button type="link" onClick={onBackCancel}>
                <LeftOutlined />
              </Button>
              {botDetails.botName} 全局常量
            </Tooltip>
          </div>
        }
      >
        <Form form={filterForm} layout="horizontal">
          <Row gutter={16} justify="space-between">
            <Col span={6}>
              <Form.Item name="query">
                <Input placeholder="请输入常量描述" onChange={handleQuery} allowClear />
              </Form.Item>
            </Col>
            <Col
              span={12}
              style={{
                display: "flex",
                justifyContent: "flex-end",
                paddingRight: 20
              }}
            >
              <Button
                type="primary"
                disabled={isPublishDisabled}
                onClick={() => {
                  setVisible(true)
                  setIsEditing(false)
                  setCurrentRecord({})
                }}
              >
                新建常量
              </Button>
            </Col>
          </Row>
        </Form>
        <Table
          columns={columns}
          dataSource={tableList}
          pagination={false}
          scroll={{ y: "calc(100vh - 390px)" }}
          onChange={handleSortOrFilterChange}
          style={{ marginTop: 16 }}
          className="table-style-v2"
          rowClassName={(record, index) => {
            if (index % 2 === 0) {
              return "table-style-v2-even-row"
            } else {
              return "table-style-v2-odd-row"
            }
          }}
        />

        <Pagination
          // className="fixed-pagination pagination-v2"
          current={pagination.current}
          pageSize={pagination.pageSize}
          total={totalCount}
          onChange={(page, pageSize) => setPagination({ current: page, pageSize })}
          showSizeChanger={true}
          style={{ marginTop: "10px", textAlign: "right" }}
          showTotal={(total) => `共 ${total} 条`}
        />
      </Card>

      <ConstantsForm
        form={form}
        visible={visible}
        agentNo={agentNo || undefined}
        isEditing={isEditing}
        currentRecord={currentRecord}
        onSave={handleSave}
        onCancel={() => setVisible(false)}
        isLoading={isLoading}
        isPublishDisabled={isPublishDisabled}
      />
    </div>
  )
}

export default BotConstants
