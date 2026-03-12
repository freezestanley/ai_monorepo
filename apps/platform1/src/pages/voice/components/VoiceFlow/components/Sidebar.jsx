import React, { useCallback, memo } from "react"
import "../styles/Sidebar.scss"
import { Button } from "antd"
import { PlusOutlined } from "@ant-design/icons"
import { message } from "antd/lib"

const Sidebar = memo(({ onAddNode, flowType }) => {
  const onDragStart = useCallback((event, nodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType)
    event.dataTransfer.setData("application/node-id", `node_${Date.now()}`)
    event.dataTransfer.effectAllowed = "move"
  }, [])

  const handleAddNode = () => {
    if (onAddNode) {
      onAddNode()
      message.success("新节点已添加到画布！")
    }
  }

  // 状态机模式下隐藏添加节点按钮
  if (flowType === 2) {
    return null
  }

  return (
    <div className="voice-flow-sidebar">
      <div
        className="voice-flow-node"
        draggable
        onDragStart={(event) => onDragStart(event, "content")}
      >
        <Button
          color="primary"
          variant="outlined"
          icon={<PlusOutlined className="text-[#7f56d9]" />}
          onClick={handleAddNode}
          className=""
        >
          <span className="text-[#7f56d9]">添加节点</span>
        </Button>
      </div>
    </div>
  )
})

export default Sidebar
