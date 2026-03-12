import { Post, Get } from "@/api/server"
import { technicalRadarPrefix } from "@/constants"
import { infoInterceptors } from "../tools"

/** 技术雷达-列表 */
export const fetchTechnicalRadarListApi = (params) => {
  return Get(`${technicalRadarPrefix}/admin/technicalRadar/technology/approve/page`, params).then(
    (res) => infoInterceptors(res)?.data
  )
}

/** 技术雷达-详情 */
export const fetchTechnicalRadarDetailApi = (technologyNo) => {
  return Get(
    `${technicalRadarPrefix}/admin/technicalRadar/technology/info?technologyNo=${technologyNo}`
  ).then((res) => infoInterceptors(res)?.data)
}

/** 技术雷达-审批 */
export const fetchTechnicalRadarApproveApi = (param) => {
  return Post(`${technicalRadarPrefix}/admin/technicalRadar/technology/approve`, param).then(
    (res) => infoInterceptors(res)
  )
}
