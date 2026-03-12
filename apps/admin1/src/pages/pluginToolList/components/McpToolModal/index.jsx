import React, { useState, useEffect } from "react"
import { Modal, Table, Button, Input, message, Empty, Spin, Tooltip } from "antd"
import { useFetchMcpToolList } from "@/api/pluginTool"
import { initMcpTool } from "@/api/pluginTool/api"
import styles from "./index.module.scss"

const { Search } = Input

function McpToolModal({ visible, onClose, onSelect, pluginNo, botNo }) {
  const [searchText, setSearchText] = useState("")
  const [selectedTool, setSelectedTool] = useState(null)
  const [loading, setLoading] = useState(false)

  const { data = {}, isLoading } = useFetchMcpToolList({
    pluginNo
  })

  // 确保每次打开模态框时清空选择
  useEffect(() => {
    if (visible) {
      setSelectedTool(null)
      setSearchText("")
    }
  }, [visible])

  console.log("MCP工具列表数据:", data)
  const toolList = data.data || []

  const filteredTools = toolList.filter(
    (tool) =>
      tool.toolName.toLowerCase().includes(searchText.toLowerCase()) ||
      tool.toolDesc.toLowerCase().includes(searchText.toLowerCase())
  )

  const columns = [
    {
      title: "工具名称",
      dataIndex: "toolName",
      key: "toolName",
      width: 200
    },
    {
      title: "工具描述",
      dataIndex: "toolDesc",
      key: "toolDesc",
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text} placement="topLeft" overlayStyle={{ maxWidth: "500px" }}>
          <span>{text}</span>
        </Tooltip>
      )
    }
  ]

  const handleRowSelect = (record) => {
    console.log("选择工具:", record)
    setSelectedTool(record)
  }

  const handleSearch = (value) => {
    setSearchText(value)
  }

  const handleConfirm = async () => {
    if (!selectedTool) {
      message.warning("请先选择一个MCP工具")
      return
    }

    try {
      setLoading(true)
      console.log("确认选择工具:", selectedTool)

      // 将整个MCP工具对象传给后端
      const response = await initMcpTool({
        botNo,
        pluginNo,
        data: selectedTool
      })

      if (response && response.success) {
        message.success("MCP工具初始化成功")
        // 关闭弹窗
        onClose()
        // 刷新当前页面
        window.location.reload()
      } else {
        message.error(response?.message || "初始化MCP工具失败")
      }
    } catch (error) {
      console.error("初始化MCP工具出错:", error)
      message.error("初始化MCP工具失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title="选择MCP工具"
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="submit" type="primary" onClick={handleConfirm} loading={loading}>
          确定
        </Button>
      ]}
    >
      <div className={styles["mcp-tool-modal"]}>
        <div className={styles["search-wrapper"]}>
          <Search
            placeholder="搜索工具名称或描述"
            allowClear
            enterButton="搜索"
            onSearch={handleSearch}
            style={{ width: 300, marginBottom: 16 }}
          />
        </div>

        <Spin spinning={isLoading || loading}>
          {filteredTools.length > 0 ? (
            <Table
              rowKey="toolName"
              columns={columns}
              dataSource={filteredTools}
              pagination={false}
              scroll={{ y: 400 }}
              rowSelection={{
                type: "radio",
                selectedRowKeys: selectedTool ? [selectedTool.toolName] : [],
                onChange: (_, selectedRows) => {
                  if (selectedRows.length > 0) {
                    setSelectedTool(selectedRows[0])
                  }
                }
              }}
              onRow={(record) => ({
                onClick: () => handleRowSelect(record)
              })}
            />
          ) : (
            <Empty description="暂无MCP工具" />
          )}
        </Spin>
      </div>
    </Modal>
  )
}

export default McpToolModal
