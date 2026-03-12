// 用户 - 分页查询

import { botPrefix } from "@/constants"
import { Delete, Get, Put } from "../server"

/**
 * 获取空间常量页面列表
 * @param {*} params
 * @returns
 */
export const fetchBotConstantsPage = (params) => {
  return Get(`${botPrefix}/admin/bot/constant/${params.botNo}/page`, params).then((res) => res.data)
}

/**
 * 创建空间常量
 * @param {*} params
 * @returns
 */
export const createBotConstant = (params) => {
  return Put(`${botPrefix}/admin/bot/constant`, params).then((res) => res)
}

/**
 * 删除空间常量
 * @param {*} params
 * @returns
 */
export const deleteBotConstant = (params) => {
  return Delete(`${botPrefix}/admin/bot/constant/${params.id}`).then((res) => res)
}

/**
 * 更新空间常量
 * @param {*} params
 * @returns
 */
export const updateBotConstant = (params) => {
  return Put(`${botPrefix}/admin/bot/constant/${params.id}`, params).then((res) => res)
}
