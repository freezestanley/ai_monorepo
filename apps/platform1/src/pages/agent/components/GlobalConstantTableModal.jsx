import React from "react"
import { Modal, Table, Input, Button } from "antd"

const GlobalConstantTableModal = ({
  open,
  onCancel,
  loading,
  dataSource,
  pageNum,
  pageSize,
  total,
  onPageChange,
  query,
  onQueryChange,
  onSearch,
  onEditConstant
}) => {
  const columns = [
    {
      title: "全局常量名称",
      dataIndex: "key",
      key: "key",
      ellipsis: true
    },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      ellipsis: true
    },
    {
      title: "描述",
      dataIndex: "desc",
      key: "desc",
      ellipsis: true
    }
  ]

  return (
    <Modal title="全局常量列表" open={open} onCancel={onCancel} footer={null} width={800}>
      <div className="flex items-center justify-between mb-4 gap-2">
        <Input
          placeholder="请输入常量名称关键词，按Enter搜索"
          value={query}
          onChange={(e) => {
            const val = e.target.value
            onQueryChange?.(val)
            if (!val) {
              onSearch("")
            }
          }}
          onPressEnter={(e) => onSearch(e.target.value)}
          allowClear
          style={{ width: 280 }}
        />
        <Button onClick={onEditConstant} className="ml-2">
          编辑全局常量
        </Button>
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        pagination={{
          current: pageNum,
          pageSize,
          total,
          onChange: onPageChange,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`
        }}
        scroll={{ y: 360 }}
      />
    </Modal>
  )
}

export default GlobalConstantTableModal
