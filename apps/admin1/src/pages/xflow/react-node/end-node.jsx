export const EndNode = (props) => {
  const { size = { width: 50, height: 50 }, data } = props
  const { width, height } = size
  const { label, stroke, fill, fontFill, fontSize } = data
  const radius = Math.min(width, height) / 2 // 半径为宽高中较小值的一半
  const circleStroke = "#A2B1C3" // 你想要的圆边框的颜色
  const innerCircleRadius = radius / 2 // 内圆半径是外圆的一半
  const strokeWidth = 1 // 你可以按需设置边框宽度

  return (
    <div
      className="container"
      style={{
        width,
        fontSize: 10,
        height,
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      <svg width={width} height={height}>
        <circle
          cx={radius}
          cy={radius}
          r={radius - strokeWidth}
          fill="none"
          stroke={circleStroke}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={radius}
          cy={radius}
          r={innerCircleRadius - strokeWidth}
          fill="none"
          stroke={circleStroke}
          strokeWidth={strokeWidth}
        />
      </svg>
      {/* 单行,不换行展示 */}
      <span
        style={{
          position: "absolute",
          whiteSpace: "nowrap"
        }}
      >
        {label}
      </span>
    </div>
  )
}

export default EndNode
