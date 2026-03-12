export const ConditionNode = (props) => {
  const { size = { width: 36, height: 36 }, data } = props
  const { label } = data

  const rectFill = "#FFFFFF" // 背景颜色
  const rectStroke = "#000" // 边框颜色
  const strokeWidth = 1 // 边框宽度
  const borderRadius = 4 // 圆角半径

  const centerX = size.width / 2
  const centerY = size.height / 2

  return (
    <div
      className="conditionNodeContainer"
      style={{
        width: size.width,
        height: size.height,
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      <svg width={size.width} height={size.height}>
        <rect
          x={strokeWidth}
          y={strokeWidth}
          width={size.width - 2 * strokeWidth}
          height={size.height - 2 * strokeWidth}
          fill={rectFill}
          stroke={rectStroke}
          strokeWidth={strokeWidth}
          rx={borderRadius}
          ry={borderRadius}
          transform={`rotate(45, ${centerX}, ${centerY})`} // 使用SVG内部的旋转
        />
        <text
          x={centerX}
          y={centerY}
          fill="#000"
          textAnchor="middle"
          alignmentBaseline="middle"
          fontSize="11"
        >
          {label}
        </text>
      </svg>
    </div>
  )
}

export default ConditionNode
