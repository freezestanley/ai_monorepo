import React, { memo, useState, useRef, useEffect } from "react"
import { Handle, Position } from "reactflow"
import { PlusOutlined } from "@ant-design/icons"
import { Tag } from "antd"
import voiceTitle from "@/assets/img/voiceTitle.png"
import { useStudioPublishData } from "@/hooks/useStudioPublishData"
import "./StateMachineRootNode.scss"

const StateMachineRootNode = memo(({ data, id, selected }) => {
  const [isHovered, setIsHovered] = useState(false)
  const nodeRef = useRef(null)
  const contentRef = useRef(null)
  const { isPublishDisabled } = useStudioPublishData()

  // 动态调整节点宽度
  useEffect(() => {
    if (nodeRef.current && contentRef.current) {
      // 计算内容实际需要的宽度
      const contentWidth = contentRef.current.scrollWidth
      // 设置合适的宽度，最小300px，最大600px
      const newWidth = Math.max(300, Math.min(330, contentWidth + 40))
      nodeRef.current.style.width = `${newWidth}px`
    }
  }, [data.content])

  const handleAddLeftNode = (e) => {
    e.stopPropagation() // 阻止事件冒泡到节点点击事件
    if (!isPublishDisabled && data.onAddChild) {
      data.onAddChild("left")
    }
  }

  const handleAddRightNode = (e) => {
    e.stopPropagation() // 阻止事件冒泡到节点点击事件
    if (!isPublishDisabled && data.onAddChild) {
      data.onAddChild("right")
    }
  }

  // 高亮样式
  const nodeContentHighlightStyle = data?.isHighlighted
    ? {
        borderRadius: "8px",
        border: "1px solid var(---, #7f56d9)",
        background: "rgba(220, 213, 255, 0.10)",
        boxShadow: "0px 4px 24px 0px rgba(24, 27, 37, 0.12)"
      }
    : {}

  return (
    <div
      ref={nodeRef}
      style={nodeContentHighlightStyle}
      className="voice-flow-custom-node state-machine-root-node"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 左侧按钮作为连接点 */}
      <div className="add-node-btn left-btn" onClick={handleAddLeftNode}>
        <Handle
          type="source"
          position={Position.Left}
          id="left"
          style={{
            background: "transparent",
            border: "none",
            width: "24px",
            height: "24px",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1,
            borderRadius: "50%"
          }}
        />
        <PlusOutlined />
      </div>

      {/* 右侧按钮作为连接点 */}
      <div className="add-node-btn right-btn" onClick={handleAddRightNode}>
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          style={{
            background: "transparent",
            border: "none",
            width: "24px",
            height: "24px",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1,
            borderRadius: "50%"
          }}
        />
        <PlusOutlined />
      </div>

      {/* 节点主体 - 使用与普通节点相同的结构 */}
      <div className="node-content">
        <div className="node-content-title">
          <div className="flex justify-start items-center">
            <img className="w-[24px] h-[24px]" src={voiceTitle} alt="开场白" />
            <span className="ml-2 mt-1 text-[14px] font-[500] truncate block max-w-[200px] px-1 py-0.5 bg-[#7f56d9] rounded-[4px]  text-white">
              开场白
            </span>
          </div>
          {/* 根节点不显示删除按钮 */}
        </div>
        <div className="node-content-text mt-3">
          <div
            ref={contentRef}
            className="text-[12px] text-[#181B25] font-[400] p-1 bg-[#F5F7FA] rounded-[4px] max-h-[120px] overflow-auto whitespace-pre-wrap break-words"
          >
            {data.content || "点击编辑开场白内容"}
          </div>
        </div>
      </div>
    </div>
  )
})

export default StateMachineRootNode
