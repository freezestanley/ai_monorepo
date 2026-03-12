import { Quadrant, RadarConfig, Ring, TechnologyPositionType, TechnologyType } from "./type"

/**
 * 环-文案（外=>内）
 * @description ['Hold', 'Assess', 'Trial', 'Adopt']
 */
export const RingLabels = ["Hold", "Assess", "Trial", "Adopt"]

// 基于450px比例的1000000范围的比例因子
export const MAX_SCALE = 1000000
const CHART_SCALE = 780
// 雷达点点的大小
const blipStyleSize = 16

export const RADAR_CONFIG: RadarConfig = {
  scale: CHART_SCALE, // Background/Container size
  rings: {
    [Ring.Adopt]: { name: "Adopt", radius: 195, color: "#ffffff", hoverColor: "#ffffff" },
    [Ring.Trial]: { name: "Trial", radius: 390, color: "#ffffff", hoverColor: "#ffffff" },
    [Ring.Assess]: { name: "Assess", radius: 585, color: "#ffffff", hoverColor: "#ffffff" },
    [Ring.Hold]: { name: "Hold", radius: 780, color: "#ffffff", hoverColor: "#ffffff" }
  }
}

/** Layout controls */
export const layoutControlsConfig = {
  gridColumns: 2,
  gridRows: 2,
  gap: "clamp(20px, 4vw, 60px)"
}

/** Axis styles */
export const axisLineStyleConfig = {
  axisLineStyle: {
    strokeWidth: 1,
    color: "#000000" // Matches ring border color
  },
  xAxisLineStyle: { strokeWidth: 1, color: "#000000" },
  yAxisLineStyle: { strokeWidth: 1, color: "#000000" }
}

/** radarLabel 配置 */
export const radarLabelConfig = {
  radarLabel: "Complete Tech Radar",
  radarLabelPosition: "bottom-center",
  radarLabelStyle: {
    fontSize: 20,
    color: "#1e293b",
    fontWeight: "bold",
    fontFamily: "system-ui, sans-serif"
  }
}

/** 象限标签 */
export const quadrantLabelConfig = {
  [Quadrant.I]: "Infrastructure\n基础设施",
  [Quadrant.II]: "Models & Agents\n模型与智能体",
  [Quadrant.III]: "Frameworks\n开发框架",
  [Quadrant.IV]: "Techniques\n技术与方法"
}

/** 象限配置 */
export const quadrantConfig = {
  [Quadrant.I]: {
    flipX: true,
    flipY: false,
    showWatermark: false,
    showRingLabels: false,
    showRadarLabel: false,
    showOrigin: false,
    ringLabels: RingLabels,
    ringBackgroundColors: ["#ffffff", "#ffffff", "#ffffff", "#ffffff"],
    ringHoverBackgroundColors: ["#ffffff", "#ffffff", "#ffffff", "#ffffff"],

    // Ring border styles
    ringLineStyle: {
      strokeWidth: 1,
      color: "#000000"
    },
    blipStyle: {
      size: blipStyleSize,
      strokeColor: "#ffffff",
      strokeWidth: 1.5,
      fillColor: "#ef4444", // Red for quadrant I
      haloColor: "#ffffff",
      haloOpacity: 0.3,
      textSize: 10,
      textColor: "#ffffff",
      textFontWeight: "bold",
      hoverScale: 1.25,
      transitionDuration: 300
    },
    // Origin configuration for quadrant I
    originStyle: {
      circle: { radius: 8, fill: "#ef4444", stroke: "none" },
      border: { radius: 12, fill: "none", stroke: "#ef4444", strokeWidth: 1.5 },
      text: { fontSize: 12, color: "#ffffff", fontWeight: "bold" }
    },
    originHoverStyle: {
      circle: { radius: 8, fill: "#dc2626", stroke: "none" },
      border: { radius: 12, fill: "none", stroke: "#dc2626", strokeWidth: 1.5 },
      text: { fontSize: 12, color: "#ffffff", fontWeight: "bold" }
    },
    originText: "⚡",
    data: {
      quadrant: Quadrant.I,
      technology: "Languages & Frameworks",
      description: "Programming languages and development frameworks",
      metrics: {
        adoption: 85,
        stability: 90,
        performance: 88
      }
    }
  },
  [Quadrant.II]: {
    flipX: false,
    flipY: false,
    showWatermark: false,
    showRingLabels: false,
    showRadarLabel: false,
    showOrigin: false,
    ringLabels: RingLabels,
    ringBackgroundColors: ["#ffffff", "#ffffff", "#ffffff", "#ffffff"],
    ringHoverBackgroundColors: ["#ffffff", "#ffffff", "#ffffff", "#ffffff"],

    // Ring border styles
    ringLineStyle: {
      strokeWidth: 1,
      color: "#000000"
    },
    blipStyle: {
      size: blipStyleSize,
      fillColor: "#3b82f6", // Blue for quadrant II
      textColor: "#ffffff"
    },
    // Origin configuration for quadrant II
    originStyle: {
      circle: { radius: 8, fill: "#3b82f6", stroke: "none" },
      border: { radius: 12, fill: "none", stroke: "#3b82f6", strokeWidth: 1.5 },
      text: { fontSize: 12, color: "#ffffff", fontWeight: "bold" }
    },
    originHoverStyle: {
      circle: { radius: 8, fill: "#2563eb", stroke: "none" },
      border: { radius: 12, fill: "none", stroke: "#2563eb", strokeWidth: 1.5 },
      text: { fontSize: 12, color: "#ffffff", fontWeight: "bold" }
    },
    originText: "🛠️",
    data: {
      quadrant: Quadrant.II,
      technology: "Tools",
      description: "Development tools and utilities",
      metrics: {
        adoption: 78,
        stability: 85,
        performance: 82
      }
    }
  },
  [Quadrant.III]: {
    flipX: true,
    flipY: true,
    showWatermark: false,
    showRingLabels: false,
    showRadarLabel: false,
    showOrigin: false,
    ringLabels: RingLabels,
    ringBackgroundColors: ["#ffffff", "#ffffff", "#ffffff", "#ffffff"],
    ringHoverBackgroundColors: ["#ffffff", "#ffffff", "#ffffff", "#ffffff"],

    // Ring border styles
    ringLineStyle: {
      strokeWidth: 1,
      color: "#000000"
    },
    blipStyle: {
      size: blipStyleSize,
      fillColor: "#10b981", // Green for quadrant III
      textColor: "#ffffff"
    },
    // Origin configuration for quadrant III
    originStyle: {
      circle: { radius: 8, fill: "#10b981", stroke: "none" },
      border: { radius: 12, fill: "none", stroke: "#10b981", strokeWidth: 1.5 },
      text: { fontSize: 12, color: "#ffffff", fontWeight: "bold" }
    },
    originHoverStyle: {
      circle: { radius: 8, fill: "#059669", stroke: "none" },
      border: { radius: 12, fill: "none", stroke: "#059669", strokeWidth: 1.5 },
      text: { fontSize: 12, color: "#ffffff", fontWeight: "bold" }
    },
    originText: "☁️",
    data: {
      quadrant: Quadrant.III,
      technology: "Platforms",
      description: "Infrastructure and deployment platforms",
      metrics: {
        adoption: 92,
        stability: 95,
        performance: 90
      }
    }
  },
  [Quadrant.IV]: {
    flipX: false,
    flipY: true,
    showWatermark: false,
    showRingLabels: false,
    showRadarLabel: false,
    showOrigin: false,
    ringLabels: RingLabels,
    ringBackgroundColors: ["#ffffff", "#ffffff", "#ffffff", "#ffffff"],
    ringHoverBackgroundColors: ["#ffffff", "#ffffff", "#ffffff", "#ffffff"],

    // Ring border styles
    ringLineStyle: {
      strokeWidth: 1,
      color: "#000000"
    },
    blipStyle: {
      size: blipStyleSize,
      fillColor: "#f59e0b", // Yellow for quadrant IV
      textColor: "#1e293b"
    },
    // Origin configuration for quadrant IV
    originStyle: {
      circle: { radius: 8, fill: "#f59e0b", stroke: "none" },
      border: { radius: 12, fill: "none", stroke: "#f59e0b", strokeWidth: 1.5 },
      text: { fontSize: 12, color: "#1e293b", fontWeight: "bold" }
    },
    originHoverStyle: {
      circle: { radius: 8, fill: "#d97706", stroke: "none" },
      border: { radius: 12, fill: "none", stroke: "#d97706", strokeWidth: 1.5 },
      text: { fontSize: 12, color: "#1e293b", fontWeight: "bold" }
    },
    originText: "📚",
    data: {
      quadrant: Quadrant.IV,
      technology: "Techniques",
      description: "Development practices and methodologies",
      metrics: {
        adoption: 75,
        stability: 88,
        performance: 80
      }
    }
  }
}

/**
 * 技术类型枚举
 */
export const TechnologyTypeEnum: TechnologyType[] = [
  { label: "Infrastructure（基础设施）", value: "infrastructure" },
  { label: "Models & Agents（模型与智能体）", value: "model_and_agents" },
  { label: "Frameworks（开发框架）", value: "frameworks" },
  { label: "Techniques（技术与方法）", value: "techniques" }
]
/**
 * 技术定位枚举
 */
export const TechnologyPositionEnum: TechnologyPositionType[] = [
  { label: "adopt（采纳）", value: "adopt" },
  { label: "trial（试验）", value: "trial" },
  { label: "assess（评估）", value: "assess" },
  { label: "hold（暂缓或禁止）", value: "hold" }
]

// Helper to get radius range for a ring
export const getRadiusRange = (ring: Ring): [number, number] => {
  const rings = RADAR_CONFIG.rings
  switch (ring) {
    case Ring.Adopt:
      return [0, rings[Ring.Adopt].radius]
    case Ring.Trial:
      return [rings[Ring.Adopt].radius, rings[Ring.Trial].radius]
    case Ring.Assess:
      return [rings[Ring.Trial].radius, rings[Ring.Assess].radius]
    case Ring.Hold:
      return [rings[Ring.Assess].radius, rings[Ring.Hold].radius]
    default:
      return [0, rings[Ring.Adopt].radius]
  }
}

// Helper to get quadrant and ring from coordinate
export const getRingAndQuadrantFromCoordinate = (
  x: number,
  y: number
): { ring: Ring; quadrant: Quadrant } => {
  // Determine Quadrant based on signs
  // I: Top Left (x<0, y>0)
  // II: Top Right (x>0, y>0)
  // III: Bottom Left (x<0, y<0)
  // IV: Bottom Right (x>0, y<0)
  let quadrant: Quadrant
  if (x < 0 && y > 0) quadrant = Quadrant.I
  else if (x >= 0 && y > 0) quadrant = Quadrant.II
  else if (x < 0 && y <= 0) quadrant = Quadrant.III
  else quadrant = Quadrant.IV

  // Calculate distance from origin
  // Using Euclidean distance (sqrt(x^2 + y^2)) to match backend logic
  // Backend ranges: Adopt < 250k, Trial < 500k, Assess < 750k, Hold < 1M
  const distance = Math.sqrt(x * x + y * y)

  // Determine Ring based on backend distance thresholds
  let ring: Ring
  if (distance <= 250000) ring = Ring.Adopt
  else if (distance <= 500000) ring = Ring.Trial
  else if (distance <= 750000) ring = Ring.Assess
  else ring = Ring.Hold

  return { ring, quadrant }
}
