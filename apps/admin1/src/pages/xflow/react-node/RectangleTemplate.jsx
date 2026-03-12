import React from "react"

// 公共长方形模板
const RectangleNode = (props) => {
  const { size = { width: 240, height: 104 }, data } = props //{ width: 72, height: 33 }
  const { width, height } = size
  const { label } = data

  const rectFill = "#FFFFFF" // 背景颜色
  const rectStroke = "#000" // 边框颜色
  const strokeWidth = 1 // 边框宽度
  const borderRadius = 2 // 圆角半径

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
        <rect
          x={strokeWidth}
          y={strokeWidth}
          width={width - 2 * strokeWidth}
          height={height - 2 * strokeWidth}
          fill={rectFill}
          stroke={rectStroke}
          strokeWidth={strokeWidth}
          rx={borderRadius} // 设置x轴的圆角半径
          ry={borderRadius} // 设置y轴的圆角半径
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

export default RectangleNode
