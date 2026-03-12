import React, { useMemo, useState, useRef } from "react"
import { Blip, RadarConfig, Quadrant, Ring } from "../../type"
import RadarBackground from "./RadarBackground"
import RadarBlip, { RadarBlipStyle } from "./RadarBlip"
import { layoutBlips } from "../../../utils/geometry"
import Tooltip from "./Tooltip"

// Style configuration interfaces
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

interface RingLabelStyle extends TextStyle {
  position?: "inside" | "outside"
  offset?: number
}

interface TechRadarProps {
  blips: Blip[]
  config: RadarConfig
  quadrant: Quadrant
  selectedBlip?: Blip | null
  onBlipClick: (blip: Blip) => void

  // Quadrant origin data
  data?: any // Data for quadrant origin point

  // Basic layout controls
  flipX?: boolean
  flipY?: boolean
  showOrigin?: boolean
  showWatermark?: boolean
  showRingLabels?: boolean
  ringLabels?: string[]

  // Axis line styles (deprecated - use xAxisLineStyle and yAxisLineStyle instead)
  axisLineStyle?: LineStyle

  // Individual axis line styles
  xAxisLineStyle?: LineStyle
  yAxisLineStyle?: LineStyle

  // Ring background colors (array for each ring or single color for all)
  ringBackgroundColors?: string[] | string

  // Ring hover background colors (array for each ring or single color for all)
  ringHoverBackgroundColors?: string[] | string

  // Ring border line styles
  ringLineStyle?: LineStyle

  // Origin point styles
  originStyle?: OriginStyle
  originHoverStyle?: OriginStyle
  originText?: string

  // Ring labels text styles
  ringLabelStyle?: RingLabelStyle

  // RadarBlip styles
  blipStyle?: RadarBlipStyle
  blipHoverStyle?: RadarBlipStyle

  // Tooltip configuration
  showBlipTooltips?: boolean
  onTooltipClick?: (blip: Blip) => void

  // Props editor configuration
  showPropsEditor?: boolean
  propsEditorPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right"
  onPropsUpdate?: (updatedProps: any) => void

  // Radar label configuration
  showRadarLabel?: boolean
  radarLabel?: string
  radarLabelPosition?:
    | "top-left"
    | "top-right"
    | "top-center"
    | "bottom-left"
    | "bottom-right"
    | "bottom-center"
    | { x: number; y: number }
  radarLabelStyle?: TextStyle
}

/** 主容器组件 */
const TechRadar: React.FC<TechRadarProps> = ({
  blips,
  config: initialConfig,
  quadrant,
  selectedBlip,
  onBlipClick,
  data,
  flipX = false,
  flipY = false,
  showOrigin = true,
  showWatermark = true,
  showRingLabels = true,
  ringLabels,
  axisLineStyle,
  xAxisLineStyle,
  yAxisLineStyle,
  ringBackgroundColors,
  ringHoverBackgroundColors,
  ringLineStyle,
  originStyle,
  originHoverStyle,
  originText = "•",
  ringLabelStyle,
  blipStyle,
  blipHoverStyle,
  showBlipTooltips = true,
  onTooltipClick,
  showPropsEditor = false,
  propsEditorPosition = "top-right",
  onPropsUpdate
  // showRadarLabel = true,
  // radarLabel = 'Tech Radar',
  // radarLabelPosition,
  // radarLabelStyle
}) => {
  const domref = useRef<HTMLDivElement>(null)

  // Dynamically calculate config if ringLabels are provided
  const activeConfig = useMemo(() => {
    let baseConfig = initialConfig

    // Handle ringLabels
    if (ringLabels && ringLabels.length > 0) {
      const count = ringLabels.length
      // Assume max radius is based on the Hold ring or scale
      const maxRadius = initialConfig.rings[Ring.Hold]?.radius || 440
      const step = maxRadius / count
      const defaultColors = ["#eef4f0", "#ffffff", "#f8fafc", "#ffffff", "#f1f5f9"]
      const defaultHoverColors = ["#d1e7dd", "#e3f2fd", "#fff3cd", "#f8d7da"]

      const newRings: RadarConfig["rings"] = {}

      ringLabels.forEach((label: string, index: number) => {
        let color: string
        let hoverColor: string | undefined

        // Handle ringBackgroundColors prop
        if (ringBackgroundColors) {
          if (Array.isArray(ringBackgroundColors)) {
            color =
              ringBackgroundColors[index] ||
              ringBackgroundColors[index % ringBackgroundColors.length] ||
              defaultColors[index % defaultColors.length]
          } else {
            color = ringBackgroundColors
          }
        } else {
          color = defaultColors[index % defaultColors.length]
        }

        // Handle ringHoverBackgroundColors prop
        if (ringHoverBackgroundColors) {
          if (Array.isArray(ringHoverBackgroundColors)) {
            hoverColor =
              ringHoverBackgroundColors[index] ||
              ringHoverBackgroundColors[index % ringHoverBackgroundColors.length] ||
              defaultHoverColors[index % defaultHoverColors.length]
          } else {
            hoverColor = ringHoverBackgroundColors
          }
        } else {
          hoverColor = defaultHoverColors[index % defaultHoverColors.length]
        }

        newRings[index] = {
          name: label,
          radius: Math.round((index + 1) * step),
          color,
          hoverColor
        }
      })

      baseConfig = {
        ...baseConfig,
        rings: newRings
      }
    } else if (ringBackgroundColors || ringHoverBackgroundColors) {
      // Handle ringBackgroundColors and ringHoverBackgroundColors for existing config
      const updatedRings: RadarConfig["rings"] = {}

      Object.entries(baseConfig.rings).forEach(
        ([key, ringConfig]: [
          string,
          { name: string; radius: number; color: string; hoverColor?: string }
        ]) => {
          const index = parseInt(key)
          let color: string = ringConfig.color
          let hoverColor: string | undefined = ringConfig.hoverColor

          if (ringBackgroundColors) {
            if (Array.isArray(ringBackgroundColors)) {
              color =
                ringBackgroundColors[index] ||
                ringBackgroundColors[index % ringBackgroundColors.length] ||
                ringConfig.color
            } else {
              color = ringBackgroundColors
            }
          }

          if (ringHoverBackgroundColors) {
            if (Array.isArray(ringHoverBackgroundColors)) {
              hoverColor =
                ringHoverBackgroundColors[index] ||
                ringHoverBackgroundColors[index % ringHoverBackgroundColors.length] ||
                ringConfig.hoverColor
            } else {
              hoverColor = ringHoverBackgroundColors
            }
          }

          updatedRings[index] = {
            name: ringConfig.name,
            radius: ringConfig.radius,
            color,
            hoverColor
          }
        }
      )

      baseConfig = {
        ...baseConfig,
        rings: updatedRings
      }
    }

    return baseConfig
  }, [initialConfig, ringLabels, ringBackgroundColors, ringHoverBackgroundColors])

  //过滤当前象限和可用环的光点
  //这可以防止光点在属于不再存在的环索引时崩溃
  const currentQuadrantBlips = useMemo(() => {
    const availableRings = Object.keys(activeConfig.rings).map(Number)

    const filtered = blips.filter((b) => b.quadrant === quadrant && availableRings.includes(b.ring))

    return layoutBlips(filtered, activeConfig)
  }, [blips, quadrant, activeConfig])

  const width = activeConfig.scale
  const height = activeConfig.scale

  const romanNumerals = ["I", "II", "III", "IV"]

  // SVG ref for coordinate calculations
  const svgRef = React.useRef<SVGSVGElement>(null)

  // Animation for mounting
  const [mounted, setMounted] = useState(false)
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Track hovered blip for z-index management
  const [hoveredBlipId, setHoveredBlipId] = useState<number | string>("")

  // Tooltip state management - simplified
  const [tooltipState, setTooltipState] = useState<{
    visible: boolean
    blip: Blip | null
    x: number
    y: number
  }>({
    visible: false,
    blip: null,
    x: 0,
    y: 0
  })

  // 处理光点悬停事件
  const handleBlipMouseEnter = (blip: Blip, event?: React.MouseEvent) => {
    setHoveredBlipId(blip.id)

    if (showBlipTooltips && event) {
      const target = event.currentTarget as Element
      const rect = target.getBoundingClientRect()

      setTooltipState({
        visible: true,
        blip,
        x: rect.left + rect.width / 2,
        y: rect.top
      })
    }
  }

  // 操纵鼠标移动以更新工具提示位置 - 不再跟随鼠标
  const handleBlipMouseMove = (blip: Blip, event: React.MouseEvent) => {
    // Tooltip position is fixed at the blip location, so we don't update on move
  }

  const handleBlipMouseLeave = () => {
    setHoveredBlipId("")
    setTooltipState({
      visible: false,
      blip: null,
      x: 0,
      y: 0
    })
  }

  // Reorder blips for proper z-index: hovered blip should be last in DOM
  const orderedBlips = useMemo(() => {
    if (hoveredBlipId === null) return currentQuadrantBlips

    const hoveredBlip = currentQuadrantBlips.find((blip) => blip.id === hoveredBlipId)
    const otherBlips = currentQuadrantBlips.filter((blip) => blip.id !== hoveredBlipId)

    return hoveredBlip ? [...otherBlips, hoveredBlip] : currentQuadrantBlips
  }, [currentQuadrantBlips, hoveredBlipId])

  // Calculate transformation for the main group
  // 移除内部填充以缩小象限间的间隙
  const offset = 0
  const originX = flipX ? width + offset : offset
  const originY = flipY ? offset : height + offset
  const scaleX = flipX ? -1 : 1
  const scaleY = flipY ? -1 : 1

  return (
    <div
      ref={domref}
      className="relative flex justify-center items-center p-0 bg-transparent w-full h-full opacity-80 hover:opacity-100 transition-opacity duration-300"
      style={{ overflow: "visible" }}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        className={`transition-opacity duration-700 ${mounted ? "opacity-100" : "opacity-0"}`}
        style={{ overflow: "visible" }}
      >
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="100%" height="100%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 
          坐标系转换：
          我们转换到计算出的角点，并在需要时应用缩放来镜像轴。
        */}
        <g
          className="group"
          transform={`translate(${originX}, ${originY}) scale(${scaleX}, ${scaleY})`}
        >
          <RadarBackground
            config={activeConfig}
            width={width}
            height={height}
            flipX={flipX}
            flipY={flipY}
            showRingLabels={showRingLabels}
            axisLineStyle={axisLineStyle}
            xAxisLineStyle={xAxisLineStyle}
            yAxisLineStyle={yAxisLineStyle}
            ringLineStyle={ringLineStyle}
            ringLabelStyle={ringLabelStyle}
            showOrigin={showOrigin}
            originStyle={originStyle}
            originHoverStyle={originHoverStyle}
            originText={originText}
            onOriginClick={() =>
              alert("Core Origin: Represents the most fundamental technologies.")
            }
            data={data}
            showPropsEditor={showPropsEditor}
            propsEditorPosition={propsEditorPosition}
            onPropsUpdate={onPropsUpdate}
          />

          {/* 气泡层-技术点 */}
          {orderedBlips.map((blip) => (
            <RadarBlip
              key={blip.id}
              blip={blip}
              isSelected={blip.id === selectedBlip?.id}
              onClick={onBlipClick}
              flipX={flipX}
              flipY={flipY}
              style={blipStyle}
              hoverStyle={blipHoverStyle}
              showTooltip={showBlipTooltips}
              onTooltipClick={onTooltipClick}
              onMouseEnter={handleBlipMouseEnter}
              onMouseMove={handleBlipMouseMove}
              onMouseLeave={handleBlipMouseLeave}
            />
          ))}
        </g>
      </svg>

      {/* Decorative quadrant label overlay */}
      {showWatermark && (
        <div
          className={`absolute text-slate-200 text-7xl font-black opacity-30 pointer-events-none select-none
            ${flipY ? "bottom-6" : "top-6"}
            ${flipX ? "left-6" : "right-6"}
        `}
        >
          {romanNumerals[quadrant]}
        </div>
      )}

      {/* Tooltip rendered outside SVG */}
      {tooltipState.visible && tooltipState.blip && (
        <Tooltip
          x={tooltipState.x}
          y={tooltipState.y}
          visible={tooltipState.visible}
          blip={tooltipState.blip}
          onTooltipClick={onTooltipClick}
        />
      )}
    </div>
  )
}

export default TechRadar
