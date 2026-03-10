import { useState } from 'react'
import { Card, Table, Button, Space, Popconfirm, Input, Typography } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import AddTypeModal from './components/AddTypeModal'
import useNewsTypeTable from './hooks/useNewsTypeTable'
import type { CategoryItem } from './types'
import './styles.scss'

const { Title } = Typography
const { Search } = Input

const NewsType = () => {
  const {
    loading,
    dataSource,
    pagination,
    // sortInfo,
    handleTableChange,
    handleSearch,
    handleDelete,
    refreshData,
  } = useNewsTypeTable()

  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<CategoryItem | null>(null)

  const handleAdd = () => {
    setEditingRecord(null)
    setModalVisible(true)
  }

  const handleEdit = (record: CategoryItem) => {
    setEditingRecord(record)
    setModalVisible(true)
  }

  const handleModalOk = () => {
    refreshData()
    setModalVisible(false)
    setEditingRecord(null)
  }

  const handleModalCancel = () => {
    setModalVisible(false)
    setEditingRecord(null)
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '类别名称', dataIndex: 'name', key: 'name', width: 200 },
    { title: '类别描述', dataIndex: 'description', key: 'description', ellipsis: true },
    // { title: "排序", dataIndex: "categorySort", key: "categorySort", width: 100,
    //   sorter: { multiple: 1 }, sortDirections: ['ascend', 'descend'] },
    {
      title: '状态',
      dataIndex: 'enabledStatus',
      key: 'enabledStatus',
      width: 100,
      render: (status: string) => (
        <span className={`status-tag ${status === 'Y' ? 'active' : 'inactive'}`}>
          {status === 'Y' ? '启用' : '禁用'}
        </span>
      ),
    },
    { title: '创建时间', dataIndex: 'gmtCreated', key: 'gmtCreated', width: 180 },
    { title: '修改时间', dataIndex: 'gmtModified', key: 'gmtModified' },
    { title: '创建人', dataIndex: 'creator', key: 'creator' },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: unknown, record: CategoryItem) => (
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
      ),
    },
  ]

  return (
    <div className="news-type-page">
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
            showTotal: (total: number, range: [number, number]) =>
              `共 ${total} 条记录，显示第 ${range[0]}-${range[1]} 条`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
          sortDirections={['ascend', 'descend']}
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

export default NewsType
