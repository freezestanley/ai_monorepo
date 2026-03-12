import { memo, useState } from "react"
import { EdgeLabelRenderer, getSmoothStepPath } from "reactflow"
import { Button, Input, Popover, message } from "antd"

// 高亮样式常量
const highlightStyle = {
  opacity: 1,
  stroke: "rgba(127, 86, 217, 1)",
  strokeWidth: 1.5,
  strokeDasharray: "15, 5",
  animation: "flowAnimation 1s linear infinite",
  boxShadow: "0 0 10px 0 rgba(127, 86, 217, 0.3)"
}

// 自定义边组件
const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  selected,
  markerEnd,
  style,
  data
}) => {
  const [rulePopoverOpen, setRulePopoverOpen] = useState(false)
  const [ruleInputValue, setRuleInputValue] = useState(data?.intentionRule || "")
  const [isHovered, setIsHovered] = useState(false)
  // 计算边的路径和中点坐标 - 使用平滑步进路径
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    borderRadius: 10 // 添加圆角使连接线更平滑
  })

  // 删除边的处理函数
  const onEdgeDelete = (evt) => {
    evt.stopPropagation()
    // 使用从 data 中获取的回调函数
    if (data?.onDeleteEdge) {
      data.onDeleteEdge(id)
      console.log(`尝试删除连接线: ${id}`) // 添加日志便于调试
    }
  }

  // 处理规则保存
  const handleRuleSave = () => {
    if (data?.onUpdateEdgeRule) {
      data.onUpdateEdgeRule(id, ruleInputValue)
      message.success("规则保存成功")
    }
    setRulePopoverOpen(false)
  }

  // 处理规则取消
  const handleRuleCancel = () => {
    setRuleInputValue(data?.intentionRule || "")
    setRulePopoverOpen(false)
  }

  // 规则编辑弹窗内容
  const rulePopoverContent = (
    <div className="flex flex-col gap-2 w-64">
      <Input
        placeholder="请输入规则"
        value={ruleInputValue}
        onChange={(e) => setRuleInputValue(e.target.value)}
        onPressEnter={handleRuleSave}
      />
      <div className="flex justify-end gap-2">
        <Button size="small" onClick={handleRuleCancel}>
          取消
        </Button>
        <Button size="small" type="primary" onClick={handleRuleSave}>
          确定
        </Button>
      </div>
    </div>
  )

  // 合并样式，选中时应用高亮样式
  const edgeStyle = {
    ...style,
    ...(selected ? highlightStyle : {})
  }

  // 检查是否为状态机模式，如果是则不允许删除连接线
  const isStateMachine = data?.flowType === 2

  return (
    <>
      {/* 添加一个不可见的更宽的路径，用于增加点击区域 */}
      <path
        className="react-flow__edge-interaction-path"
        d={edgePath}
        strokeWidth={20}
        stroke="transparent"
        fill="none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      {/* 显示的实际边 */}
      <path
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        style={edgeStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      {selected && !isStateMachine && (
        <EdgeLabelRenderer>
          <div
            className="absolute z-10 nodrag nopan"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px"
            }}
          >
            {/* 规则显示和编辑 */}
            {data?.intentionRule ? (
              <Popover
                content={rulePopoverContent}
                title="编辑规则"
                trigger="click"
                open={rulePopoverOpen}
                onOpenChange={setRulePopoverOpen}
                placement="top"
              >
                <div className="bg-white border border-[#a481e6] rounded px-2 py-1 text-xs text-gray-700 shadow-sm cursor-pointer hover:bg-gray-50">
                  规则: {data.intentionRule}
                </div>
              </Popover>
            ) : (
              <Popover
                content={rulePopoverContent}
                title="添加规则"
                trigger="click"
                open={rulePopoverOpen}
                onOpenChange={setRulePopoverOpen}
                placement="top"
              >
                <Button className="-mt-2" type="primary" size="small">
                  添加规则
                </Button>
              </Popover>
            )}

            {/* 删除按钮 */}
            <button className="edge-delete-button mt-2" onClick={onEdgeDelete}>
              删除连线
            </button>
          </div>
        </EdgeLabelRenderer>
      )}

      {/* 显示所有规则模式 - 当data.showAllRules为true且连线未被选中时显示 */}
      {data?.showAllRules && data?.intentionRule && !selected && (
        <EdgeLabelRenderer>
          <div
            className="absolute z-10 nodrag nopan"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "none"
            }}
          >
            <div className="bg-[#f5f0ff] border border-[#d1bbfe] rounded px-2 py-1 text-xs text-[#7F56D9] shadow-sm">
              {data.intentionRule}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}

      {/* hover时显示规则 - 当鼠标悬停在连线上且有规则且未被选中时显示 */}
      {isHovered && data?.intentionRule && !selected && !data?.showAllRules && (
        <EdgeLabelRenderer>
          <div
            className="absolute z-10 nodrag nopan"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "none"
            }}
          >
            <div className="bg-[#f5f0ff] border border-[#d1bbfe] rounded px-2 py-1 text-xs text-[#7F56D9] shadow-sm">
              规则: {data.intentionRule}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export default memo(CustomEdge)
