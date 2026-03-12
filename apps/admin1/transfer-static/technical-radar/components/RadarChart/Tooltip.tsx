import React, { useEffect, useState, useRef } from "react"
import { Blip } from "../../type"

export interface TooltipProps {
  // 位置和尺寸
  x: number
  y: number
  visible: boolean

  // 数据
  blip: Blip

  // 连接线指示器（可选）
  blipScreenX?: number
  blipScreenY?: number

  // 变换效果 - removed flipX/flipY as tooltip should always be readable

  // 事件处理
  onTooltipClick?: (blip: Blip) => void

  // 样式定制
  backgroundColor?: string
  borderColor?: string
  textColor?: string
  secondaryTextColor?: string
  accentColor?: string

  // 其他属性
  style?: React.CSSProperties
  className?: string
}

/** 工具提示组件 */
const Tooltip: React.FC<TooltipProps> = ({
  x,
  y,
  visible,
  blip,
  onTooltipClick,
  backgroundColor = "rgba(73, 77, 75)", // slate-800 with opacity
  borderColor = "transparent",
  textColor = "white",
  style,
  className = ""
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [adjustedPosition, setAdjustedPosition] = useState({ x, y })

  // Simple position update with basic bounds checking
  useEffect(() => {
    if (!visible) return

    const finalX = x
    const finalY = y

    const margin = 10
    const estimatedWidth = 200
    // const estimatedHeight = 100

    // Keep within horizontal bounds
    if (finalX + estimatedWidth / 2 > window.innerWidth - margin) {
      // logic to shift if too far right
    }

    setAdjustedPosition({ x: finalX, y: finalY })
  }, [x, y, visible])

  if (!visible) return null

  // 处理点击事件
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation() // 阻止事件冒泡
    if (onTooltipClick) {
      onTooltipClick(blip)
    }
  }

  return (
    <div
      ref={tooltipRef}
      className={`tech-radar-tooltip ${className}`}
      style={{
        position: "fixed",
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
        background: backgroundColor,
        border: `1px solid ${borderColor}`,
        borderRadius: "4px",
        padding: "8px 12px",
        color: textColor,
        fontSize: "12px",
        fontFamily: "system-ui, sans-serif",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        cursor: onTooltipClick ? "pointer" : "default",
        zIndex: 9999,
        pointerEvents: "auto",
        minWidth: "140px",
        maxWidth: "220px",
        transition: "none",
        // Transform to center horizontally on anchor and move up
        transform: "translate(-50%, -100%)",
        marginTop: "-10px", // Space for arrow
        ...style
      }}
      onClick={handleClick}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto auto",
          gap: "4px 12px",
          alignItems: "center"
        }}
      >
        {/* Row 1 */}
        <div style={{ color: "#9ca3af", textAlign: "left" }}>技术点:</div>
        <div style={{ color: "#fff", textAlign: "right", fontWeight: "500" }}>{blip.name}</div>

        {/* Row 2 */}
        <div style={{ color: "#9ca3af", textAlign: "left" }}>类型:</div>
        <div style={{ color: "#fff", textAlign: "right" }}>{blip.quadrantKeyName}</div>

        {/* Row 3 */}
        <div style={{ color: "#9ca3af", textAlign: "left" }}>定位:</div>
        <div style={{ color: "#fff", textAlign: "right" }}>{blip.ringKeyName}</div>
      </div>

      {/* Arrow */}
      <div
        style={{
          position: "absolute",
          bottom: "-6px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "0",
          height: "0",
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderTop: `6px solid ${backgroundColor}`
        }}
      />
    </div>
  )
}

export default Tooltip
