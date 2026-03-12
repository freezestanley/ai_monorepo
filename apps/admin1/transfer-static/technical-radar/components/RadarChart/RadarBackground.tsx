import React, { useMemo } from "react"
import { RadarConfig } from "../../type"

interface LineStyle {
  strokeWidth?: number
  strokeDashArray?: string
  color?: string
}

interface CircleStyle {
  radius?: number
  fill?: string
  stroke?: string
  strokeWidth?: number
  strokeDashArray?: string
}

interface TextStyle {
  fontSize?: number
  color?: string
  fontWeight?: "normal" | "bold" | "bolder" | number
  fontFamily?: string
}

interface OriginStyle {
  circle?: CircleStyle
  border?: CircleStyle
  text?: TextStyle
}

interface RingLabelStyle {
  fontSize?: number
  color?: string
  fontWeight?: "normal" | "bold" | "bolder" | number
  fontFamily?: string
  position?: "inside" | "outside"
  offset?: number
}

interface RadarBackgroundProps {
  config: RadarConfig
  width: number
  height: number
  flipX?: boolean
  flipY?: boolean
  showRingLabels?: boolean

  // Axis line styles (deprecated - use xAxisLineStyle and yAxisLineStyle instead)
  axisLineStyle?: LineStyle

  // Individual axis line styles
  xAxisLineStyle?: LineStyle
  yAxisLineStyle?: LineStyle

  ringLineStyle?: LineStyle
  ringLabelStyle?: RingLabelStyle

  // Origin point props
  showOrigin?: boolean
  originStyle?: OriginStyle
  originHoverStyle?: OriginStyle
  originText?: string
  onOriginClick?: () => void

  // Quadrant data for origin point
  data?: any

  // Props editor configuration
  showPropsEditor?: boolean
  propsEditorPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right"
  onPropsUpdate?: (updatedProps: any) => void
}

// Default Constants
const DEFAULT_AXIS_LINE_STYLE = {
  strokeWidth: 2,
  color: "#94a3b8",
  strokeDashArray: "none"
}

const DEFAULT_RING_LINE_STYLE = {
  strokeWidth: 1.5,
  color: "#94a3b8",
  strokeDashArray: "none"
}

const DEFAULT_RING_LABEL_STYLE: RingLabelStyle = {
  fontSize: 10,
  color: "#64748b",
  fontWeight: "bold",
  fontFamily: "system-ui, sans-serif",
  position: "outside",
  offset: 20
}

const RadarBackground: React.FC<RadarBackgroundProps> = ({
  config,
  flipX = false,
  flipY = false,
  showRingLabels = true,
  axisLineStyle,
  xAxisLineStyle,
  yAxisLineStyle,
  ringLineStyle,
  ringLabelStyle
}) => {
  // Get all ring indices present in the config, sorted descending (Outer -> Inner)
  const ringIndices = useMemo(
    () =>
      Object.keys(config.rings)
        .map(Number)
        .sort((a, b) => b - a),
    [config.rings]
  )

  // Determine the outermost ring index to calculate axis length
  const maxRingIndex = ringIndices.length > 0 ? ringIndices[0] : 0
  const maxRadius = config.rings[maxRingIndex]?.radius || 0

  // Calculate label offsets based on flip states
  const labelOffsets = useMemo(() => {
    const baseOffset = 20
    return {
      // X-axis label: when flipX is true, labels should be on the left side
      xLabelX: flipX ? -baseOffset : baseOffset,
      xLabelY: 0,
      // Y-axis label: when flipY is true, labels should be on the bottom side
      yLabelX: 0,
      yLabelY: flipY ? baseOffset : -baseOffset
    }
  }, [flipX, flipY])

  // Merge with user-provided styles
  const xAxisStyle = useMemo(
    () => ({ ...DEFAULT_AXIS_LINE_STYLE, ...axisLineStyle, ...xAxisLineStyle }),
    [axisLineStyle, xAxisLineStyle]
  )
  const yAxisStyle = useMemo(
    () => ({ ...DEFAULT_AXIS_LINE_STYLE, ...axisLineStyle, ...yAxisLineStyle }),
    [axisLineStyle, yAxisLineStyle]
  )
  const ringStyle = useMemo(
    () => ({ ...DEFAULT_RING_LINE_STYLE, ...ringLineStyle }),
    [ringLineStyle]
  )
  const labelStyle = useMemo(
    () => ({ ...DEFAULT_RING_LABEL_STYLE, ...ringLabelStyle }),
    [ringLabelStyle]
  )

  return (
    <g className="radar-background select-none">
      {/* Total Area Background */}
      <rect
        x={0}
        y={-config.scale}
        width={config.scale}
        height={config.scale}
        fill="#d3d3f1ff"
        className="transition-colors duration-300 group-hover:!fill-[#c0c0e8ff]"
      />

      {ringIndices.map((ringIndex) => {
        const ringConfig = config.rings[ringIndex]
        const innerRadius = ringIndex === 0 ? 0 : config.rings[ringIndex - 1]?.radius || 0
        const outerRadius = ringConfig.radius
        const labelRadius = (innerRadius + outerRadius) / 2

        return (
          <React.Fragment key={ringIndex}>
            {/* Sector Path for Fill with Hover Effect */}
            <path
              d={`M 0,0 L 0,${-outerRadius} A ${outerRadius},${outerRadius} 0 0 1 ${outerRadius},0 Z`}
              fill={ringConfig.color}
              className={`transition-colors duration-300 ${ringConfig.hoverColor ? "cursor-pointer" : ""}`}
              onMouseEnter={
                ringConfig.hoverColor
                  ? (e) => {
                      e.currentTarget.style.fill = ringConfig.hoverColor!
                    }
                  : undefined
              }
              onMouseLeave={
                ringConfig.hoverColor
                  ? (e) => {
                      e.currentTarget.style.fill = ringConfig.color
                    }
                  : undefined
              }
            />

            {/* Arc Stroke */}
            <path
              d={`M 0,${-outerRadius} A ${outerRadius},${outerRadius} 0 0 1 ${outerRadius},0`}
              fill="none"
              stroke={ringStyle.color}
              strokeWidth={ringStyle.strokeWidth}
              strokeDasharray={
                ringStyle.strokeDashArray === "none" ? undefined : ringStyle.strokeDashArray
              }
            />

            {/* Labels */}
            {showRingLabels && (
              <>
                {/* X-Axis Label - positioned outside the coordinate lines */}
                <text
                  x={flipX ? -labelRadius : labelRadius}
                  y={flipY ? labelOffsets.xLabelY - 15 : labelOffsets.xLabelY + 20}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={labelStyle.color}
                  fontSize={labelStyle.fontSize}
                  fontWeight={labelStyle.fontWeight}
                  fontFamily={labelStyle.fontFamily}
                  className="uppercase tracking-wider"
                  transform={`scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`}
                >
                  {ringConfig.name}
                </text>

                {/* Y-Axis Label - positioned outside the coordinate lines */}
                <text
                  x={flipX ? labelOffsets.yLabelX + 15 : labelOffsets.yLabelX - 20}
                  y={flipY ? labelRadius : -labelRadius}
                  writingMode="tb"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={labelStyle.color}
                  fontSize={labelStyle.fontSize}
                  fontWeight={labelStyle.fontWeight}
                  fontFamily={labelStyle.fontFamily}
                  className="uppercase tracking-wider"
                  transform={`scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`}
                >
                  {ringConfig.name}
                </text>
              </>
            )}
          </React.Fragment>
        )
      })}

      {/* Axis Lines */}
      {/* X-Axis Line */}
      <line
        x1={0}
        y1={0}
        x2={config.scale}
        y2={0}
        stroke={xAxisStyle.color}
        strokeWidth={xAxisStyle.strokeWidth}
        strokeDasharray={
          xAxisStyle.strokeDashArray === "none" ? undefined : xAxisStyle.strokeDashArray
        }
      />
      {/* Y-Axis Line */}
      <line
        x1={0}
        y1={0}
        x2={0}
        y2={-config.scale}
        stroke={yAxisStyle.color}
        strokeWidth={yAxisStyle.strokeWidth}
        strokeDasharray={
          yAxisStyle.strokeDashArray === "none" ? undefined : yAxisStyle.strokeDashArray
        }
      />

      {/* 交互式原点 */}
      {/* {showOrigin && (
        <RadarOrigin originStyle={originStyle} originHoverStyle={originHoverStyle} originText={originText} onOriginClick={onOriginClick} />
      )} */}

      {/* Props JSON Editor */}
      {/* {showPropsEditor && <RadarPropsEditor position={editorPosition} data={propsData} onUpdate={onPropsUpdate} />} */}
    </g>
  )
}

export default RadarBackground
