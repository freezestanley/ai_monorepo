import { Get, Post } from "@/api/server"
import { technicalRadarPrefix } from "@/constants"

/** 技术申报-新增 */
export const queryTechnicalDeclaration = async (params: any) =>
  Post(`${technicalRadarPrefix}/admin/technicalRadar/technology`, params).then((res) => res.data)

/** 技术申报-记录 */
export const queryTechnicalDeclarationHistory = async (params: any) =>
  Get(`${technicalRadarPrefix}/admin/technicalRadar/technology/declaration/page`, params).then(
    (res) => res.data
  )

/** 雷达点 */
export const queryTechnicalRadarPoint = async () =>
  Get(`${technicalRadarPrefix}/admin/technicalRadar/technology/all`).then((res) => res.data)

/** 雷达点-详情 */
export const queryTechnicalRadarPointDetail = async (params: any) =>
  Get(`${technicalRadarPrefix}/admin/technicalRadar/technology/info`, params).then(
    (res) => res.data
  )

/** 雷达点-列表 */
export const queryTechnicalRadarPointList = async (params: any) =>
  Get(`${technicalRadarPrefix}/admin/technicalRadar/technology/page`, params).then(
    (res) => res.data
  )

/** 技术雷达-象限定义 */
export const queryTechnicalRadarQuadrant = async () =>
  Get(`${technicalRadarPrefix}/admin/technicalRadar/quadrant/list`).then((res) => res.data)

/** 技术雷达-环定义 */
export const queryTechnicalRadarRing = async () =>
  Get(`${technicalRadarPrefix}/admin/technicalRadar/ring/list`).then((res) => res.data)
