import { Get, Post, Put } from "@/api/server"
import { DEFAULTNAMESPACE, botPrefix } from "@/constants"
import { infoInterceptors } from "../tools"

const prefix = botPrefix
/**
 * 批量保存来源标签
 *  /admin/sourceTag/batchSave
 */
export const batchSaveSourceTag = (data) => {
  return Post(`${prefix}/admin/sourceTag/batchSave`, data).then((res) => infoInterceptors(res))
}

/**
 * 获取来源标签列表
 * /admin/sourceTag/list
 */
export const fetchSourceTag = (data) => {
  return Post(`${prefix}/admin/sourceTag/list`, data).then((res) => res)
}

export const fetchSourceTagPro = (data) => {
  return Post(`${prefix}/admin/sourceTag/list`, data).then((res) => res)
}
