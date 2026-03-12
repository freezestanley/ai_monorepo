import React, { useState } from "react"
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  message,
  Pagination
} from "antd"
import { EditOutlined, DeleteOutlined } from "@ant-design/icons"
import {
  useDeleteAuthPermissionGroup,
  useDeleteTag,
  useFetchAuthPermissionGroupPage,
  useGetTagPage,
  useSaveAuthPermissionGroup,
  useSaveTag
} from "@/api/permission"
import { debounce } from "lodash"

function GroupManageMent() {
  const [visible, setVisible] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [form] = Form.useForm()
  const [filterForm] = Form.useForm()
  const [params, setParams] = useState({})
  const [sortAndFilterState, setSortAndFilterState] = useState({
    orderField: "",
    asc: ""
  })

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10
  })

  const { data: { list = [], totalCount } = {}, refetch } = useGetTagPage({
    pageNum: pagination.current,
    pageSize: pagination.pageSize,
    ...sortAndFilterState,
    ...params
  })

  const { mutate: savePermissionGroup } = useSaveTag()
  const { mutate: deletePermissionGroup } = useDeleteTag()

  const tableList = list

  const handleSortOrFilterChange = (pagination, filters, sorter) => {
    const { order, field } = sorter
    setSortAndFilterState({
      orderField: !order ? "" : field === "gmtCreated" ? "gmt_created" : "",
      asc: order === "ascend" ? "true" : order === "descend" ? "false" : ""
    })
  }

  const handleDelete = (record) => {
    // 二次确认
    Modal.confirm({
      title: "确认删除该标签吗？",
      icon: <DeleteOutlined />,
      content: "删除后不可恢复",
      okText: "确认",
      cancelText: "取消",
      onOk: () => {
        deletePermissionGroup(
          { tagNo: record.tagNo },
          {
            onSuccess: (e) => {
              if (e.success) {
                message.success("删除成功")
                refetch()
              } else {
                message.error(e.message)
              }
            }
          }
        )
      }
    })
  }

  const columns = [
    { title: "标签", dataIndex: "value" },
    { title: "标签code", dataIndex: "code" },
    {
      title: "创建时间",
      dataIndex: "gmtCreated",
      sorter: true
    },
    {
      title: "操作",
      render: (record) => (
        <>
          <Button className="p-0" type="link" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" style={{ marginLeft: 8 }} onClick={() => handleDelete(record)}>
            删除
          </Button>
        </>
      )
    }
  ]

  const handleEdit = (record) => {
    console.log(record)
    form.setFieldsValue(record)
    setIsEditing(true)
    setCurrentRecord(record)
    setVisible(true)
  }

  const handleCreate = () => {
    form.resetFields()
    setIsEditing(false)
    setCurrentRecord(null)
    setVisible(true)
  }

  const handleOk = () => {
    console.log(currentRecord)
    form
      .validateFields()
      .then((values) => {
        console.log("Received values of form:", values)
        const params = {
          ...values,
          tagNo: currentRecord?.tagNo,
          modifier: currentRecord?.modifier
        }

        savePermissionGroup(params, {
          onSuccess: (e) => {
            if (e.success) {
              message.success("保存成功")
              // 关闭弹窗
              setVisible(false)
              refetch()
            } else {
              message.error(e.message)
            }
          }
        })

        setVisible(false)
      })
      .catch((info) => {
        console.log("Failed:", info)
      })
  }

  const handleCancel = () => {
    setVisible(false)
  }

  const handleQuery = debounce(() => {
    filterForm
      .validateFields()
      .then((values) => {
        // 这里的values即为查询条件，你可以进行相应的查询操作
        console.log(values)
        setParams(values)
        setPagination({ pageSize: pagination.pageSize, current: 1 })
      })
      .catch((errorInfo) => {
        // Handle filterForm validation failure
        console.log("Failed:", errorInfo)
      })
  }, 1000)

  const handleReset = () => {
    filterForm.resetFields()
    setParams({})
  }

  return (
    <div>
      <Form form={filterForm} layout="horizontal">
        <Row gutter={24} justify="space-between">
          <Col span={6}>
            <Form.Item
              name="query"
              rules={[{ required: false, message: "请输入标签或者标签code!" }]}
            >
              <Input placeholder="请输入标签/标签code" allowClear onChange={handleQuery} />
            </Form.Item>
          </Col>
          <Col
            span={6}
            style={{
              display: "flex",
              justifyContent: "flex-end",
              paddingRight: 30
            }}
          >
            <Button type="primary" onClick={handleCreate}>
              新建
            </Button>
          </Col>
        </Row>
      </Form>
      <Table
        columns={columns}
        dataSource={tableList}
        pagination={false}
        scroll={{ y: 706 }}
        onChange={handleSortOrFilterChange}
      />

      <Pagination
        className="fixed-pagination"
        current={pagination.current}
        pageSize={pagination.pageSize}
        total={totalCount}
        onChange={(page, pageSize) => setPagination({ current: page, pageSize })}
        showSizeChanger={true}
        style={{ marginTop: "15px", textAlign: "right" }}
        showTotal={(total) => `共 ${total} 条`}
      />
      <Modal
        title={isEditing ? "编辑标签" : "新建标签"}
        visible={visible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form
          form={form}
          labelCol={{
            span: 6
          }}
          wrapperCol={{
            span: 16
          }}
        >
          <Form.Item name="value" label="标签" rules={[{ required: true, message: "请输入标签!" }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="code"
            label="标签code"
            rules={[{ required: true, message: "请输入标签code!" }]}
          >
            <Input disabled={isEditing} />
          </Form.Item>
          {isEditing && (
            <Form.Item name="createTime" label="创建时间">
              {currentRecord.gmtCreated}
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  )
}

export default GroupManageMent
