import { Blip, RadarConfig, Ring } from "../technical-radar/type"
import { MAX_SCALE } from "../technical-radar/config"

/**
 * Converts polar coordinates to cartesian, relative to bottom-left origin (0, height)
 * We treat the quadrant as a quarter circle (0 to 90 degrees)
 */
export const polarToCartesian = (
  radius: number,
  angleInDegrees: number
): { x: number; y: number } => {
  const angleInRadians = (angleInDegrees * Math.PI) / 180
  return {
    x: radius * Math.cos(angleInRadians),
    y: radius * Math.sin(angleInRadians)
  }
}

/**
 *为光点分配X/Y坐标，确保它们保持在特定的环内
 *并且尽量不要重叠太多（有边界的简单随机分布）。
 */
export const layoutBlips = (blips: Blip[], config: RadarConfig): Blip[] => {
  // Deep copy to avoid mutating source if strict
  const layoutBlips = JSON.parse(JSON.stringify(blips))

  const sortedBlips = layoutBlips.sort((a: Blip, b: Blip) => a.ring - b.ring)

  // Previous radius end point
  const getInnerRadius = (ring: Ring) => {
    if (ring === Ring.Adopt) return 0
    return config.rings[(ring - 1) as Ring].radius
  }

  return sortedBlips.map((blip: Blip) => {
    // If blip has defined x and y, use them (normalized)
    // The input coordinates are in range [-1000000, 1000000]
    // We map them to [0, 340] (max radius) using Euclidean distance
    if (typeof blip.x === "number" && typeof blip.y === "number") {
      // Calculate magnitude using Euclidean distance
      const magnitude = Math.sqrt(blip.x * blip.x + blip.y * blip.y)
      const normalizedMagnitude = magnitude / MAX_SCALE

      // Calculate angle
      const theta = Math.atan2(blip.y, blip.x)

      // Map to circular chart radius
      // Max radius is determined by the Hold ring radius
      const r = normalizedMagnitude * config.rings[Ring.Hold].radius

      return {
        ...blip,
        x: Math.abs(r * Math.cos(theta)),
        y: Math.abs(r * Math.sin(theta))
      }
    }

    const outerRadius = config.rings[blip.ring].radius
    const innerRadius = getInnerRadius(blip.ring)

    // Add some padding so points don't touch the lines
    const padding = 15
    const safeInner = innerRadius + padding
    const safeOuter = outerRadius - padding

    // Random radius within the ring strip
    const r = safeInner + Math.random() * (safeOuter - safeInner)

    // Random angle between 5 degrees and 85 degrees (to avoid axes)
    const theta = 5 + Math.random() * 80

    const coords = polarToCartesian(r, theta)

    return {
      ...blip,
      x: coords.x,
      y: coords.y
    }
  })
}
