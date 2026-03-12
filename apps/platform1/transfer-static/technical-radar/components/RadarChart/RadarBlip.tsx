import React, { useState } from "react"
import { Blip } from "../../type"

export interface RadarBlipStyle {
  size?: number // Circle radius size
  strokeColor?: string // Circle stroke/border color
  strokeWidth?: number // Circle stroke width
  fillColor?: string // Circle fill color
  haloColor?: string // Hover halo color
  haloOpacity?: number // Hover halo opacity
  textSize?: number // Text font size
  textColor?: string // Text color
  textFontWeight?: "normal" | "bold" | "bolder" | number // Text font weight
  hoverScale?: number // Scale factor on hover
  transitionDuration?: number // Transition duration in ms
}

interface RadarBlipProps {
  blip: Blip
  isSelected?: boolean
  onClick: (blip: Blip) => void
  flipX?: boolean
  flipY?: boolean
  style?: RadarBlipStyle
  hoverStyle?: RadarBlipStyle
  showTooltip?: boolean
  onTooltipClick?: (blip: Blip) => void
  onMouseEnter?: (blip: Blip, event?: React.MouseEvent) => void
  onMouseMove?: (blip: Blip, event: React.MouseEvent) => void
  onMouseLeave?: () => void
}

/** 雷达点组件 */
const RadarBlip: React.FC<RadarBlipProps> = ({
  blip,
  isSelected = false,
  onClick,
  flipX = false,
  flipY = false,
  style = {},
  hoverStyle = {},
  // showTooltip = true,
  // onTooltipClick,
  onMouseEnter,
  onMouseMove,
  onMouseLeave
}) => {
  // Click animation state
  const [isClicked, setIsClicked] = useState(false)
  // Hover state for z-index control
  const [isHovered, setIsHovered] = useState(false)
  if (blip.x === undefined || blip.y === undefined) return null

  // Default values
  const defaultStyle: RadarBlipStyle = {
    size: 11,
    strokeColor: "#ffffff",
    strokeWidth: 1.5,
    fillColor: "#059669", // emerald-700
    haloColor: "#ffffff",
    haloOpacity: 0.3,
    textSize: 10,
    textColor: "#ffffff",
    textFontWeight: "bold",
    hoverScale: 1.25,
    transitionDuration: 300
  }

  // Merge default with provided styles
  const finalStyle = { ...defaultStyle, ...style }
  const finalHoverStyle = { ...finalStyle, ...hoverStyle }

  const handleClick = () => {
    setIsClicked(true)
    onClick(blip)

    // Reset click animation after 300ms
    setTimeout(() => setIsClicked(false), 300)
  }

  const handleMouseEnter = (event: React.MouseEvent) => {
    setIsHovered(true)
    onMouseEnter?.(blip, event)
  }

  const handleMouseMove = (event: React.MouseEvent) => {
    onMouseMove?.(blip, event)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    onMouseLeave?.()
  }

  return (
    <g
      data-blip-id={blip.id}
      transform={`translate(${blip.x}, -${blip.y})`} // Negative Y because SVG Y increases downwards
      className="cursor-pointer"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        zIndex: isHovered ? 9999 : "auto"
      }}
    >
      {/* 
        We use transform-box: view-box and transform-origin: 0 0 to ensure the scaling happens
        exactly around the coordinate origin (the center of the blip), independent of the bounding box
        of the content (which might be slightly off-center due to text).
      */}
      <g
        className="group transition-transform ease-out"
        style={{
          transformBox: "view-box",
          transformOrigin: "0 0",
          transitionDuration: `${finalStyle.transitionDuration}ms`,
          transform: isClicked
            ? "scale(0.8)"
            : isHovered || isSelected
              ? `scale(${finalHoverStyle.hoverScale || finalStyle.hoverScale})`
              : "scale(1)"
        }}
      >
        {/* Drop shadow / halo for better visibility */}
        <circle
          r={finalStyle.size! + 3}
          fill={finalHoverStyle.haloColor || finalStyle.haloColor}
          className="transition-opacity"
          style={{
            opacity:
              isHovered || isSelected ? finalHoverStyle.haloOpacity || finalStyle.haloOpacity : 0,
            transitionDuration: `${finalStyle.transitionDuration}ms`
          }}
        />

        {/* Main Circle */}
        <circle
          r={finalStyle.size}
          fill={isClicked ? "#f59e0b" : finalStyle.fillColor} // Amber color when clicked
          stroke={finalStyle.strokeColor}
          strokeWidth={finalStyle.strokeWidth}
          className="shadow-sm transition-all"
          style={{
            transitionDuration: `${finalStyle.transitionDuration}ms`
          }}
        />

        {/* Number Label */}
        <text
          y="0.5" // Slight visual adjustment for optical centering
          dominantBaseline="central"
          textAnchor="middle"
          fill={finalStyle.textColor}
          fontSize={finalStyle.textSize}
          fontWeight={finalStyle.textFontWeight}
          className="pointer-events-none select-none transition-all"
          // Counter-scale the text if the parent group is flipped, so numbers aren't mirrored
          transform={`scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`}
          style={{
            transitionDuration: `${finalStyle.transitionDuration}ms`
          }}
        >
          {blip.id}
        </text>
      </g>

      {/* Tooltip (Simple SVG Title) */}
      {/* <title>{`${blip.label} (${blip.isNew ? 'New' : 'Moved'})`}</title> */}
    </g>
  )
}

export default RadarBlip
