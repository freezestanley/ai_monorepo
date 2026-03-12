import React, { useState } from "react"
import { Blip, RadarConfig, Quadrant } from "../../type"
import { RingLabels } from "../../config"
import TechRadar from "./TechRadar"
// import Tooltip from './Tooltip'

interface RadarProps {
  /** Complete list of blips to be distributed across all quadrants */
  /** 在所有象限中分布的完整技术点列表 */
  blips: Blip[]
  /** Radar configuration including scale and ring definitions */
  /** 雷达配置，包括缩放比例和环定义 */
  config: RadarConfig
  /** Active quadrant to display (if null, display all) */
  activeQuadrant?: Quadrant | null
  /** Callback when a blip is clicked */
  /** 点击技术点时的回调函数 */
  onBlipClick?: (blip: Blip) => void
  /** Callback when a tooltip is clicked */
  /** 点击工具提示时的回调函数 */
  onTooltipClick?: (blip: Blip) => void
  /** Currently selected blip */
  selectedBlip?: Blip | null

  // Layout controls
  /** 布局控制 - 是否水平翻转 */
  flipX?: boolean
  /** 布局控制 - 是否垂直翻转 */
  flipY?: boolean
  /** 是否显示环标签 */
  showRingLabels?: boolean
  /** 是否显示水印 */
  showWatermark?: boolean
  /** 是否显示原点 */
  showOrigin?: boolean
  /** 是否显示雷达标签 */
  showRadarLabel?: boolean

  // Ring configuration
  /** 环标签数组（例如：["采用", "试用", "评估", "暂缓"]） */
  ringLabels?: string[]
  /** 环背景颜色数组或单一颜色 */
  ringBackgroundColors?: string[] | string
  /** 环悬停背景颜色数组或单一颜色 */
  ringHoverBackgroundColors?: string[] | string
  /** 环线条样式 */
  ringLineStyle?: any
  /** 环标签样式 */
  ringLabelStyle?: any

  // Axis styles
  axisLineStyle?: any
  xAxisLineStyle?: any
  yAxisLineStyle?: any

  // Origin styles
  originStyle?: any
  originHoverStyle?: any
  originText?: string

  // RadarBlip styles
  blipStyle?: any
  blipHoverStyle?: any

  // Tooltip configuration
  showBlipTooltips?: boolean

  // Radar label configuration
  radarLabel?: string
  radarLabelPosition?: any
  radarLabelStyle?: any

  // Props editor configuration
  showPropsEditor?: boolean
  propsEditorPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right"
  onPropsUpdate?: (updatedProps: any) => void

  // Data for origin point
  data?: any

  // Custom quadrant configuration - supports all TechRadar props for quadrant-specific overrides
  quadrantConfigs?: {
    [key in Quadrant]?: {
      // Layout controls
      flipX?: boolean
      flipY?: boolean
      showWatermark?: boolean
      showRingLabels?: boolean
      showOrigin?: boolean
      showRadarLabel?: boolean

      // Ring configuration
      ringLabels?: string[]
      ringBackgroundColors?: string[] | string
      ringHoverBackgroundColors?: string[] | string
      ringLineStyle?: any
      ringLabelStyle?: any

      // Axis styles
      axisLineStyle?: any
      xAxisLineStyle?: any
      yAxisLineStyle?: any

      // Origin styles
      originStyle?: any
      originHoverStyle?: any
      originText?: string

      // RadarBlip styles
      blipStyle?: any
      blipHoverStyle?: any

      // Tooltip configuration
      showBlipTooltips?: boolean

      // Radar label configuration
      radarLabel?: string
      radarLabelPosition?: any
      radarLabelStyle?: any

      // Props editor configuration
      showPropsEditor?: boolean
      propsEditorPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right"

      // Data for origin point
      data?: any
    }
  }

  // Container styling
  className?: string
  style?: React.CSSProperties

  // Grid layout configuration
  gridColumns?: number
  gridRows?: number
  gap?: number | string

  // Quadrant-specific data
  quadrantData?: {
    [key in Quadrant]?: any
  }

  // Quadrant-specific labels
  quadrantLabels?: {
    [key in Quadrant]?: string
  }

  // Quadrant label position configuration
  quadrantLabelPosition?:
    | "top-left"
    | "top-right"
    | "top-center"
    | "bottom-left"
    | "bottom-right"
    | "bottom-center"
    | {
        [key in Quadrant]?:
          | "top-left"
          | "top-right"
          | "top-center"
          | "bottom-left"
          | "bottom-right"
          | "bottom-center"
      }
}

const Radar: React.FC<RadarProps> = ({
  blips,
  config,
  activeQuadrant = null,
  selectedBlip = null,
  onBlipClick = () => {},
  onTooltipClick,

  // Layout defaults
  flipX = false,
  flipY = true,
  showRingLabels = true,
  showWatermark = true,
  showOrigin = true,
  showRadarLabel = true,

  // Ring defaults
  ringLabels = RingLabels,
  ringBackgroundColors = ["#d1e7dd", "#cfe2ff", "#fff3cd", "#f8d7da"],
  ringHoverBackgroundColors = ["#badbcc", "#b6d4fe", "#ffecb5", "#f5c2c7"],
  ringLineStyle,
  ringLabelStyle,

  // Axis defaults
  axisLineStyle,
  xAxisLineStyle = { strokeWidth: 2, color: "#3b82f6", strokeDashArray: "none" },
  yAxisLineStyle = { strokeWidth: 2, color: "#ef4444", strokeDashArray: "none" },

  // Origin defaults
  originStyle = {
    circle: { radius: 8, fill: "#1e293b", stroke: "none" },
    border: { radius: 12, fill: "none", stroke: "#10b981", strokeWidth: 1.5 },
    text: { fontSize: 12, color: "#ffffff", fontWeight: "bold" }
  },
  originHoverStyle = {
    circle: { radius: 8, fill: "#10b981", stroke: "none" },
    border: { radius: 12, fill: "none", stroke: "#10b981", strokeWidth: 1.5 },
    text: { fontSize: 12, color: "#ffffff", fontWeight: "bold" }
  },
  originText = "•",

  // RadarBlip defaults
  blipStyle = {
    size: 14,
    strokeColor: "#ffffff",
    strokeWidth: 1.5,
    fillColor: "#059669",
    haloColor: "#ffffff",
    haloOpacity: 0.3,
    textSize: 10,
    textColor: "#ffffff",
    textFontWeight: "bold" as const,
    hoverScale: 1.25,
    transitionDuration: 300
  },
  blipHoverStyle = {
    hoverScale: 1.5,
    haloOpacity: 0.5
  },

  // Tooltip defaults
  showBlipTooltips = true,

  // Radar label defaults
  radarLabel = "Tech Radar",
  radarLabelPosition = { x: 250, y: 530 },
  radarLabelStyle = {
    fontSize: 18,
    color: "#1e293b",
    fontWeight: "bold",
    fontFamily: "system-ui, sans-serif"
  },

  // Props editor defaults
  showPropsEditor = false,
  propsEditorPosition = "top-right",
  onPropsUpdate,

  // Data defaults
  data = {
    quadrant: Quadrant.I,
    technology: "Core Technologies",
    description: "Foundation technologies driving innovation",
    metrics: {
      adoption: 95,
      stability: 98,
      performance: 92
    }
  },

  // Custom quadrant configuration
  quadrantConfigs = {},

  // Container styling
  className = "",
  style = {},

  // Grid layout
  gridColumns = 2,
  gridRows = 2,
  gap = 2,

  // Quadrant-specific data defaults
  quadrantData = {},
  quadrantLabels = {},
  quadrantLabelPosition = {
    [Quadrant.I]: "top-left",
    [Quadrant.II]: "top-right",
    [Quadrant.III]: "bottom-left",
    [Quadrant.IV]: "bottom-right"
  }
}) => {
  // Filter blips for each quadrant
  const getQuadrantBlips = (quadrant: Quadrant): Blip[] => {
    return blips.filter((blip) => blip.quadrant === quadrant)
  }

  const [hoveredQuadrant, setHoveredQuadrant] = useState<Quadrant | null>(null)

  const baseTechRadarProps = {
    config,
    selectedBlip,
    onBlipClick,
    onTooltipClick,

    // Layout
    showRingLabels,
    showOrigin,
    showRadarLabel,

    // Ring
    ringLabels,
    ringBackgroundColors,
    ringHoverBackgroundColors,
    ringLineStyle,
    ringLabelStyle,

    // Axis
    axisLineStyle,
    xAxisLineStyle,
    yAxisLineStyle,

    // Origin
    originStyle,
    originHoverStyle,
    originText,

    // RadarBlip
    blipStyle,
    blipHoverStyle,

    // Tooltip
    showBlipTooltips,

    // Radar label
    radarLabel,
    radarLabelPosition,
    radarLabelStyle,

    // Props editor
    showPropsEditor,
    propsEditorPosition,
    onPropsUpdate
  }

  // eslint-disable-next-line complexity
  const getQuadrantConfig = (quadrant: Quadrant) => {
    const quadrantSpecific = quadrantConfigs?.[quadrant] || {}
    const quadrantBlips = getQuadrantBlips(quadrant)

    return {
      ...baseTechRadarProps,
      blips: quadrantBlips,
      quadrant,
      // Layout controls - allow quadrant-specific overrides
      flipX: quadrantSpecific.flipX ?? flipX,
      flipY: quadrantSpecific.flipY ?? flipY,
      showWatermark: quadrantSpecific.showWatermark ?? showWatermark,
      showRingLabels: quadrantSpecific.showRingLabels ?? showRingLabels,
      showOrigin: quadrantSpecific.showOrigin ?? showOrigin,
      showRadarLabel: quadrantSpecific.showRadarLabel ?? showRadarLabel,

      // Ring configuration - allow quadrant-specific overrides
      ringLabels: quadrantSpecific.ringLabels ?? ringLabels,
      ringBackgroundColors: quadrantSpecific.ringBackgroundColors ?? ringBackgroundColors,
      ringHoverBackgroundColors:
        quadrantSpecific.ringHoverBackgroundColors ?? ringHoverBackgroundColors,
      ringLineStyle: quadrantSpecific.ringLineStyle ?? ringLineStyle,
      ringLabelStyle: quadrantSpecific.ringLabelStyle ?? ringLabelStyle,

      // Axis styles - allow quadrant-specific overrides
      axisLineStyle: quadrantSpecific.axisLineStyle ?? axisLineStyle,
      xAxisLineStyle: quadrantSpecific.xAxisLineStyle ?? xAxisLineStyle,
      yAxisLineStyle: quadrantSpecific.yAxisLineStyle ?? yAxisLineStyle,

      // Origin styles - allow quadrant-specific overrides
      originStyle: quadrantSpecific.originStyle ?? originStyle,
      originHoverStyle: quadrantSpecific.originHoverStyle ?? originHoverStyle,
      originText: quadrantSpecific.originText ?? originText,

      // RadarBlip styles - allow quadrant-specific overrides
      blipStyle: quadrantSpecific.blipStyle ?? blipStyle,
      blipHoverStyle: quadrantSpecific.blipHoverStyle ?? blipHoverStyle,

      // Tooltip configuration - allow quadrant-specific overrides
      showBlipTooltips: quadrantSpecific.showBlipTooltips ?? showBlipTooltips,

      // Radar label configuration - allow quadrant-specific overrides
      radarLabel: quadrantSpecific.radarLabel ?? radarLabel,
      radarLabelPosition: quadrantSpecific.radarLabelPosition ?? radarLabelPosition,
      radarLabelStyle: quadrantSpecific.radarLabelStyle ?? radarLabelStyle,

      // Props editor configuration - allow quadrant-specific overrides
      showPropsEditor: quadrantSpecific.showPropsEditor ?? showPropsEditor,
      propsEditorPosition: quadrantSpecific.propsEditorPosition ?? propsEditorPosition,

      // Data - quadrant-specific data takes precedence
      data: quadrantData?.[quadrant] ?? quadrantSpecific.data ?? data
    }
  }

  const isSingleQuadrant = activeQuadrant !== null && activeQuadrant !== undefined

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: isSingleQuadrant ? "1fr" : `repeat(${gridColumns}, 1fr)`,
    gridTemplateRows: isSingleQuadrant ? "1fr" : `repeat(${gridRows}, 1fr)`,
    gap: isSingleQuadrant ? "0px" : typeof gap === "number" ? `${gap}px` : gap,
    position: "relative",
    maxWidth: isSingleQuadrant ? "70%" : "100%", // Limit width for single quadrant
    margin: isSingleQuadrant ? "0 auto" : "0", // Center single quadrant
    ...style
  }

  /** 获取特定象限的位置 */
  const getQuadrantPosition = (quadrant: Quadrant): string => {
    if (typeof quadrantLabelPosition === "string") {
      return quadrantLabelPosition
    }
    return quadrantLabelPosition[quadrant] || "top-left"
  }

  /** 定义象限标签的定位样式 */
  const getQuadrantHeaderStyle = (position: string): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: "absolute",
      zIndex: 10,
      pointerEvents: "none"
    }

    switch (position) {
      case "top-left":
        return { ...baseStyle, top: "4%", left: "4%" }
      case "top-right":
        return { ...baseStyle, top: "4%", right: "4%" }
      case "top-center":
        return { ...baseStyle, top: "4%", left: "50%", transform: "translateX(-50%)" }
      case "bottom-left":
        return { ...baseStyle, bottom: "4%", left: "4%" }
      case "bottom-right":
        return { ...baseStyle, bottom: "4%", right: "4%" }
      case "bottom-center":
        return { ...baseStyle, bottom: "4%", left: "50%", transform: "translateX(-50%)" }
      default:
        return { ...baseStyle, top: "4%", left: "4%" }
    }
  }

  // 象限标签样式
  const quadrantTitleStyle: React.CSSProperties = {
    margin: "10px", // Reduced margin to push it more outwards relative to content
    padding: "4px 8px",
    fontSize: "min(20px, 1vw)",
    fontWeight: "bold",
    color: "#1e293b",
    borderRadius: "4px",
    whiteSpace: "pre-line", // Changed to pre-line to support newlines
    textAlign: "center" // Center alignment
  }

  return (
    <div className={`radar-grid ${className}`} style={gridStyle}>
      {/* 水平环标签-定位为与象限环对齐 */}
      {!isSingleQuadrant && (
        <div
          style={{
            position: "absolute",
            width: "100%",
            fontSize: "clamp(10px, 1.2vw, 14px)",
            fontWeight: "bold",
            color: "#9ca3af", // gray-400
            top: "47%",
            height: "6%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pointerEvents: "none",
            zIndex: 5
          }}
        >
          {/* Left side labels (Adopt -> Hold) */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
              marginLeft: "2%",
              width: "46%"
            }}
          >
            {ringLabels.map((label, index) => (
              <div
                key={`left-${index}`}
                style={{
                  padding: "2px 4px",
                  margin: "2px 0",
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  width: "25%",
                  textAlign: "center",
                  fontSize: "clamp(9px, 1vw, 12px)"
                }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Right side labels (Hold -> Adopt) */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-end",
              marginRight: "2%",
              width: "46%"
            }}
          >
            {[...ringLabels].reverse().map((label, index) => (
              <div
                key={`right-${index}`}
                style={{
                  padding: "2px 4px",
                  margin: "2px 0",
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  borderRadius: "4px",
                  width: "30%",
                  textAlign: "center",
                  fontSize: "clamp(9px, 1vw, 12px)"
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 垂直环标签-定位为与象限环对齐 */}
      {!isSingleQuadrant && (
        <div
          style={{
            position: "absolute",
            height: "100%",
            fontSize: "clamp(10px, 1.2vw, 14px)",
            fontWeight: "bold",
            color: "#9ca3af", // gray-400
            left: "47%",
            width: "6%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            pointerEvents: "none",
            zIndex: 5
          }}
        >
          {/* Top labels (Adopt -> Hold) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginTop: "20%",
              height: "45%",
              justifyContent: "center"
            }}
          >
            {ringLabels.map((label, index) => (
              <div
                key={`top-${index}`}
                style={{
                  padding: "4px 8px",
                  margin: "2px 0",
                  height: "25%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center"
                }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Bottom labels (Hold -> Adopt) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: "-44%",
              height: "45%"
            }}
          >
            {[...ringLabels].reverse().map((label, index) => (
              <div
                key={`bottom-${index}`}
                style={{
                  padding: "4px 8px",
                  margin: "2px 0",
                  height: "25%"
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      )}
      {[Quadrant.I, Quadrant.II, Quadrant.III, Quadrant.IV].map((quadrant) => {
        // 如果有激活象限且不是当前象限，则跳过渲染
        if (isSingleQuadrant && activeQuadrant !== quadrant) {
          return null
        }

        const quadrantConfig = getQuadrantConfig(quadrant)
        const quadrantLabel = quadrantLabels?.[quadrant] || `Quadrant ${quadrant + 1}`

        const currentPosition = getQuadrantPosition(quadrant)

        return (
          <div
            key={quadrant}
            className="radar-quadrant"
            style={{ position: "relative", aspectRatio: "1 / 1" }}
            onMouseEnter={() => setHoveredQuadrant(quadrant)}
            onMouseLeave={() => setHoveredQuadrant(null)}
          >
            {/* Mask for non-hovered quadrants */}
            {hoveredQuadrant !== null && hoveredQuadrant !== quadrant && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "rgba(247, 248, 249,0.8)",
                  opacity: 0.9,
                  zIndex: 20,
                  pointerEvents: "none"
                }}
              />
            )}
            <div
              className={`quadrant-header quadrant-header-${currentPosition}`}
              style={getQuadrantHeaderStyle(currentPosition)}
            >
              <h3
                className={`quadrant-title quadrant-title-${currentPosition}`}
                style={quadrantTitleStyle}
              >
                {quadrantLabel}
              </h3>
            </div>

            <TechRadar {...quadrantConfig} />
          </div>
        )
      })}
    </div>
  )
}

export default Radar
