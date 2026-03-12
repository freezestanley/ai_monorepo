import { botPrefix } from "@/constants"
import { Get, Put } from "../server"
/**
 * 获取空间可用性治理列表
 * @param {*} params
 * @returns
 */
export const fetchAvailableLimitPage = (params) => {
  return Get(`${botPrefix}/admin/limit/page`, params).then((res) => res.data)
}

/**
 * 获取空间可用性治理默认数据
 * @param {*} params
 * @returns
 */
export const fetchAvailableLimitDefaultData = (params) => {
  return Get(`${botPrefix}/admin/limit/default`, params).then((res) => res.data)
}

/**
 * 保存或更新可用性数据
 * @param {*} params
 * @returns
 */
export const saveOrUpdateAvailableLimitData = (params) => {
  return Put(`${botPrefix}/admin/limit/save-or-update`, params).then((res) => res)
}
