import MarkdownRenderer from "@/components/MarkdownRenderer"

export const StartNode = (props) => {
  const { size = { width: 240, height: 104 }, data } = props //{ width: 72, height: 33 }
  const { width = 240, height = 104 } = size
  const { label, fontFill, fontSize } = data

  const borderRadius = 10 // 这是你给出的border-radius的值，但在SVG中它实际上不用于rect元素。取而代之的是rx和ry属性。
  const strokeWidth = 1 // 边框宽度

  return (
    <div
      className="container"
      style={{
        width,
        height,
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      <svg width={width} height={height}>
        <rect
          x={strokeWidth / 2} // 为了保证边框完整展示
          y={strokeWidth / 2}
          width={width - strokeWidth}
          height={height - strokeWidth}
          rx={borderRadius} // 圆角
          ry={borderRadius}
          fill="none"
          stroke="#000"
          strokeWidth={strokeWidth}
        />
      </svg>
      {/* 单行,不换行展示 */}
      <span
        style={{
          position: "absolute",
          whiteSpace: "nowrap",
          color: fontFill || "black",
          fontSize: fontSize || 10
        }}
      >
        {/* <MarkdownRenderer content={label} /> */}
        {label}
      </span>
    </div>
  )
}

export default StartNode
