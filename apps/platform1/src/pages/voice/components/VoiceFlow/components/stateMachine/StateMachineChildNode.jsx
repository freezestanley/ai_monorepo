import React, { memo, useState, useRef, useEffect } from "react"
import { Handle, Position } from "reactflow"
import { Tag, Popconfirm } from "antd"
import { EditOutlined, DeleteOutlined, EllipsisOutlined } from "@ant-design/icons"
import voiceTitle from "@/assets/img/voiceTitle.png"
import { useStudioPublishData } from "@/hooks/useStudioPublishData"
import "./StateMachineChildNode.scss"

const StateMachineChildNode = memo(({ data, id, selected }) => {
  const [isHovered, setIsHovered] = useState(false)
  const nodeRef = useRef(null)
  const contentRef = useRef(null)

  const { isPublishDisabled } = useStudioPublishData()

  // 动态调整节点宽度
  useEffect(() => {
    if (nodeRef.current && contentRef.current) {
      // 计算内容实际需要的宽度
      const contentWidth = contentRef.current.scrollWidth
      // 子节点设置较小的宽度，最小250px，最大400px
      const newWidth = Math.max(250, Math.min(330, contentWidth + 40))
      nodeRef.current.style.width = `${newWidth}px`
    }
  }, [data.content])

  const handleEdit = (e) => {
    e.stopPropagation() // 阻止事件冒泡
    if (data.onEdit) {
      data.onEdit(id)
    }
  }

  const handleDelete = (e) => {
    e.stopPropagation() // 阻止事件冒泡
    if (data.onDelete) {
      data.onDelete(id)
    }
  }

  // 根据side决定连接点位置
  // 左侧子节点 -> 连接点在右侧
  // 右侧子节点 -> 连接点在左侧
  const handlePosition = data.side === "left" ? Position.Right : Position.Left

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
      className="voice-flow-custom-node state-machine-child-node"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 连接点 */}
      <Handle type="target" position={handlePosition} />

      {/* 节点主体 - 使用与普通节点相同的结构 */}
      <div className="node-content">
        <div className="node-content-title">
          <div className="flex justify-start items-center">
            <img className="w-[24px] h-[24px]" src={voiceTitle} alt="节点" />
            {/* {(data?.ctiOrder || data?.isMounted || data?.nonInterrupt === 10) && (
              <Tag className="mx-1 mt-1 text-[12px] -mr-1" color={data?.ctiOrder ? "#f50" : "red"}>
                {data?.isMounted && data?.nonInterrupt === 10
                  ? "挂机-打断"
                  : data?.isMounted
                    ? "挂机"
                    : "打断"}

               
              </Tag>
            )} */}

            {(data?.ctiOrder || data?.isMounted || data?.nonInterrupt === 10) && (
              <Tag
                className="mx-1 mt-1 text-[12px] -mr-1"
                color={data?.ctiOrder || data?.isMounted ? "#f50" : "#f50"}
              >
                {(data?.ctiOrder === "toOver" || data?.isMounted) && data?.nonInterrupt === 10
                  ? "挂机-打断"
                  : (data?.ctiOrder === "toQueue" || data?.isMounted) && data?.nonInterrupt === 10
                    ? "转人工-打断"
                    : data?.ctiOrder === "toOver"
                      ? "挂机"
                      : data?.ctiOrder === "toQueue"
                        ? "转人工"
                        : "打断"}
              </Tag>
            )}
            <span className="ml-2 mt-1 text-[16px] text-[#181B25] font-[500] truncate block max-w-[200px]">
              {data.title || "子节点"}
            </span>
          </div>
          {/* 显示删除按钮 - 与普通节点保持一致 */}
          {!isPublishDisabled && (isHovered || selected) && (
            <div className="flex items-center gap-1 absolute top-[15px] right-[10px] z-10">
              <Popconfirm
                title="确认删除该节点？"
                description="删除后无法恢复，确认要删除吗？"
                onConfirm={handleDelete}
                okText="确认"
                cancelText="取消"
                placement="topRight"
                trigger="click"
              >
                <div className="delete-button" onClick={(e) => e.stopPropagation()}>
                  <i className="iconfont icon-shanchu text-[16px]"></i>
                </div>
              </Popconfirm>
            </div>
          )}
        </div>
        <div className="node-content-text mt-3">
          <div
            ref={contentRef}
            className="text-[12px] text-[#181B25] font-[400] p-1 bg-[#F5F7FA] rounded-[4px] max-h-[120px] overflow-auto whitespace-pre-wrap break-words"
          >
            {data.content || "点击编辑节点内容"}
          </div>
        </div>
      </div>
    </div>
  )
})

export default StateMachineChildNode
