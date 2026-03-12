import { useState } from "react"
import { Card, Table, Button, Space, Popconfirm, Input, Typography } from "antd"
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from "@ant-design/icons"
import AddTypeModal from "../AddTypeModal"
import useInfoTypeTable from "./useInfoTypeTable"
import "./styles.scss"

const { Title } = Typography
const { Search } = Input

const InfoType = () => {
  // 使用自定义 hook 管理表格数据
  const {
    loading,
    dataSource,
    pagination,
    sortInfo,
    handleTableChange,
    handleSearch,
    handleDelete,
    addNewType,
    refreshData
  } = useInfoTypeTable()

  // 模态框相关状态
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)

  // 添加类别
  const handleAdd = () => {
    setEditingRecord(null)
    setModalVisible(true)
  }

  // 编辑类别
  const handleEdit = (record) => {
    debugger
    setEditingRecord(record)
    setModalVisible(true)
  }

  // 模态框确认
  const handleModalOk = () => {
    refreshData()
    setModalVisible(false)
    setEditingRecord(null)
  }

  // 模态框取消
  const handleModalCancel = () => {
    setModalVisible(false)
    setEditingRecord(null)
  }

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80
    },
    {
      title: "类别名称",
      dataIndex: "name",
      key: "name",
      width: 200
    },
    {
      title: "类别描述",
      dataIndex: "description",
      key: "description",
      ellipsis: true
    },
    // {
    //   title: "排序",
    //   dataIndex: "categorySort",
    //   key: "categorySort",
    //   width: 100,
    // sorter: {
    //   multiple: 1
    // },
    // sortDirections: ['ascend', 'descend']
    // },
    {
      title: "状态",
      dataIndex: "enabledStatus",
      key: "enabledStatus",
      width: 100,
      render: (status) => (
        <span className={`status-tag ${status === "Y" ? "active" : "inactive"}`}>
          {status === "Y" ? "启用" : "禁用"}
        </span>
      )
    },
    {
      title: "创建时间",
      dataIndex: "gmtCreated",
      key: "gmtCreated",
      width: 180
      // sorter: (a, b) => a - b,
      // sortDirections: ['ascend', 'descend']
    },
    {
      title: "修改时间",
      dataIndex: "gmtModified",
      key: "gmtModified"
      // sorter: (a, b) => a - b,
      // sortDirections: ['ascend' | 'descend']
    },
    {
      title: "创建人",
      dataIndex: "creator",
      key: "creator"
      // sorter: (a, b) => a === b
    },
    {
      title: "操作",
      key: "action",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个类别吗？"
            description="当该类别下有消息,该类别将不能删除"
            onConfirm={() => handleDelete(record.categoryNo)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div className="info-type-page">
      <Card>
        <div className="page-header">
          <Title level={4}>消息类别管理</Title>

          <div className="header-actions">
            <Search
              placeholder="搜索类别名称"
              allowClear
              style={{ width: 300 }}
              onSearch={handleSearch}
              enterButton={<SearchOutlined />}
            />

            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增类别
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          rowKey="id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: false,
            showTotal: (total, range) => `共 ${total} 条记录，显示第 ${range[0]}-${range[1]} 条`
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
          sortDirections={["ascend", "descend"]}
        />
      </Card>

      <AddTypeModal
        visible={modalVisible}
        editingRecord={editingRecord}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
      />
    </div>
  )
}

export default InfoType
