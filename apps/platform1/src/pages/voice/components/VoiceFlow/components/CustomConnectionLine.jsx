import React, { memo } from "react"
import { BaseEdge, getSmoothStepPath } from "reactflow"

// 使用memo包装自定义连接线组件，避免不必要的重渲染
const CustomConnectionLine = ({ fromX, fromY, toX, toY, fromNode, fromHandle, toHandle }) => {
  // 检查是否是无效的连接
  const isSourceTag = fromHandle && fromHandle.id && fromHandle.id.includes("handle-")
  const isTargetTag = toHandle && toHandle.id && toHandle.id.includes("handle-")
  const isSelfLoop = fromNode && toHandle && fromNode.id === toHandle.nodeId

  // 如果是无效连接，使用红色线条
  const isValidConnection = !(isSourceTag && isTargetTag) && !isSelfLoop
  const lineColor = isValidConnection ? "#7F56D9" : "#FF4D4F"
  const lineStyle = {
    stroke: lineColor,
    strokeWidth: 1.2,
    strokeDasharray: isValidConnection ? "none" : "5,5" // 无效连接使用虚线
  }

  const [edgePath] = getSmoothStepPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
    borderRadius: 10
  })

  return <BaseEdge path={edgePath} style={lineStyle} />
}

export default memo(CustomConnectionLine)
