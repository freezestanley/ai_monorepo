import { Get, Post, Upload } from "@/api/server"
import { nluPrefix, flywheelPrefix } from "@/constants"
const prefix = nluPrefix

/**
 * 通话列表获取
 * POST /api/v1/nlu/audio/page
 * @param {*} params
 */
export const fetchAudioPage = (params) => {
  return Post(`${prefix}/api/v1/nlu/audio/page`, params).then((res) => res.data)
}

/**
 * 通话详情获取
 * GET /api/v1/nlu/audio/info?webcallId=1
 * @param {*} params
 */
export const fetchAudioInfo = (params) => {
  return Get(`${prefix}/api/v1/nlu/audio/info`, params).then((res) => res.data)
}

/**
 * 通话详情获取(使用sessionId)
 * GET /api/v1/nlu/audio/info?sessionId=1
 * @param {*} params
 */
export const fetchAudioInfo2 = (params) => {
  return Get(`${flywheelPrefix}/api/call/detail`, params).then((res) => res.data)
}

/**
 * 获取通话状态枚举
 * GET /api/v1/nlu/audio/getEnumStatus
 * @param {*} params
 */
export const fetchAudioEnumStatus = (params) => {
  return Get(`${prefix}/api/v1/nlu/audio/getEnumStatus`, params).then((res) => res.data)
}

/**
 * 导入
 * GET /api/v1/intention-script-config/reflect/import?agentNo=XXX
 * @param {*} params
 */
export const fetchImportReflect = ({ botNo, agentNo, formData }) => {
  return Upload(
    `${prefix}/fin/api/v1/intention-script-config/reflect/import?botNo=${botNo}&agentNo=${agentNo}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  ).then((res) => res)
}

/**
 * 导出
 * GET /api/v1/intention-script-config/reflect/export?agentNo=XXX
 * @param {*} params
 */
export const fetchExportReflect = (params) => {
  const url = `${prefix}/fin/api/v1/intention-script-config/reflect/export`
  return Get(url, params, {
    responseType: "blob"
  }).then((res) => ({ res, url }))
}
