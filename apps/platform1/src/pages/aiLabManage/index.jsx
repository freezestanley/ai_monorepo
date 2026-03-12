import { useState } from "react"
import { Table, Button, Modal, Form, Input, Row, Col, Pagination, message, Tooltip } from "antd"
import { DeleteOutlined, EditOutlined } from "@ant-design/icons"
import { debounce } from "lodash"
import StatusSwitch from "./components/StatusSwitch"
import {
  useFetchApplicationList,
  useDeleteApplication,
  useApplicationStatus
} from "@/api/application"
import ApplicationFormModal from "./components/ApplicationFormModal"

const AiLabManage = () => {
  const [filterForm] = Form.useForm()
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [params, setParams] = useState({})
  const [visible, setVisible] = useState(false)
  const [curData, setCurData] = useState(null)
  const { data, isLoading } = useFetchApplicationList({
    pageSize: pagination.pageSize,
    pageNum: pagination.current,
    ...params
  })
  const { mutate: deleteApplication } = useDeleteApplication()
  const { mutate: updateRobotStatus } = useApplicationStatus()

  const handleQuery = debounce(() => {
    filterForm.validateFields().then((values) => {
      setPagination((prev) => {
        return {
          ...prev,
          current: 1
        }
      })
      setParams((pre) => {
        return {
          ...pre,
          ...values
        }
      })
    })
  }, 1000)

  const handleSortOrFilterChange = (pagination, _filters = {}, sorter) => {
    const { order, field } = sorter
    let orderField
    if (field === "gmtCreated") {
      orderField = "gmt_created"
    } else if (field === "gmtModified") {
      orderField = "gmt_modified"
    }
    setParams((pre) => ({
      ...pre,
      orderField,
      asc: !order ? undefined : order === "ascend"
    }))
  }

  // 状态改变的处理
  const handleStatusChange = (record, cb) => {
    updateRobotStatus(
      {
        appNo: record.appNo,
        status: record.status === 1 ? 0 : 1
      },
      {
        onSuccess: (res) => {
          if (res.success) {
            message.success(res.message)
            cb && cb()
          } else {
            message.error(res.message)
          }
        }
      }
    )
  }

  const handleDelete = (record) => {
    // 二次确认
    Modal.confirm({
      title: "确认删除该应用吗？",
      icon: <DeleteOutlined />,
      content: "删除后不可恢复",
      okText: "确认",
      cancelText: "取消",
      onOk() {
        deleteApplication(record.appNo, {
          onSuccess: (e) => {
            if (e.success) {
              message.success("删除成功")
            } else {
              message.error(e.message)
            }
          }
        })
      }
    })
  }

  const columns = [
    {
      title: "应用编号",
      width: 180,
      dataIndex: "appNo",
      key: "appNo"
    },
    {
      title: "应用名称",
      width: 200,
      dataIndex: "appName",
      key: "appName"
    },
    {
      title: "应用描述",
      dataIndex: "appDesc",
      key: "appDesc",
      width: 300
    },
    {
      title: "创建信息",
      dataIndex: "gmtCreated",
      key: "gmtCreated",
      width: 180,
      sorter: true,
      render: (gmtCreator, record) => {
        return (
          <Tooltip
            title={
              <>
                <div>{record.creator}</div>
                <div>{gmtCreator}</div>
              </>
            }
          >
            <div>{record.creator}</div>
            <div>{gmtCreator}</div>
          </Tooltip>
        )
      }
    },
    {
      title: "更新信息",
      dataIndex: "gmtModified",
      key: "gmtModified",
      sorter: true,
      width: 180,
      render: (gmtModified, record) => {
        return (
          <Tooltip
            title={
              <>
                <div>{record.modifier}</div>
                <div>{gmtModified}</div>
              </>
            }
          >
            <div>{record.modifier}</div>
            <div>{gmtModified}</div>
          </Tooltip>
        )
      }
    },
    {
      title: "操作",
      width: 210,
      key: "operation",
      fixed: "right",
      render: (_, record) => (
        <>
          <StatusSwitch record={record} handleStatusChange={handleStatusChange} />
          <Button
            type="link"
            onClick={() => {
              setVisible(true)
              setCurData(record)
            }}
            className="p-0 ml-4"
          >
            编辑
          </Button>
          <Button type="link" className="p-0 ml-4" onClick={() => handleDelete(record)}>
            删除
          </Button>
        </>
      )
    }
  ]

  return (
    <>
      <Form form={filterForm} layout="horizontal">
        <Row gutter={16} justify="space-between">
          <Col span={6}>
            <Form.Item name="keyword">
              <Input placeholder="请输入应用名称/应用编号" onChange={handleQuery} allowClear />
            </Form.Item>
          </Col>
          <Col
            span={12}
            style={{
              display: "flex",
              justifyContent: "flex-end"
            }}
          >
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                setVisible(true)
                setCurData(null)
              }}
            >
              新建应用
            </Button>
          </Col>
        </Row>
      </Form>
      <Table
        rowKey="appNo"
        columns={columns}
        dataSource={data?.data}
        loading={isLoading}
        pagination={false}
        className="pb-4"
        scroll={{ x: "max-content" }}
        onChange={handleSortOrFilterChange}
        style={{ marginTop: 16 }}
      />
      <Pagination
        className="fixed-pagination"
        current={pagination.current}
        pageSize={pagination.pageSize}
        total={data?.totalCount ?? 0}
        onChange={(page, pageSize) => setPagination({ current: page, pageSize })}
        showSizeChanger={true}
        style={{ marginTop: "15px", textAlign: "right" }}
        showTotal={(total) => `共 ${total} 条`}
      />
      <ApplicationFormModal
        curData={curData}
        visible={visible}
        onCancel={() => setVisible(false)}
      />
    </>
  )
}

export default AiLabManage
