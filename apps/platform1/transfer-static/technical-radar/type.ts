export interface Blip {
  id: string | number
  label: string
  /** 环 */
  ring: Ring
  /** 象限 */
  quadrant: Quadrant
  quadrantKey: string
  isNew?: boolean
  x?: number
  y?: number
  description?: string

  /** 接口返回值相关 */
  quadrantKeyName: string
  name: string
  ringKeyName: string
  technologyNo: string
}

/** 象限 */
export enum Quadrant {
  I = 0,
  II = 1,
  III = 2,
  IV = 3
}
/** 环 */
export enum Ring {
  Adopt = 0,
  Trial = 1,
  Assess = 2,
  Hold = 3
}

export interface RadarConfig {
  scale: number
  rings: {
    [key: number]: {
      name: string
      radius: number
      color: string
      hoverColor?: string
    }
  }
}
/**
 * 技术类型枚举-ts
 */
export interface TechnologyType {
  label: string
  value: string
}

/**
 * 技术定位枚举-ts
 */
export interface TechnologyPositionType {
  label: string
  value: string
}
