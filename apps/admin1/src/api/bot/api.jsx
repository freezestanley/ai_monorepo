/*
 * @Author: Dyton
 * @Date: 2023-10-19 14:40:51
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2023-10-23 19:19:32
 * @FilePath: /za-aigc-platform-admin-static/src/api/bot/api.jsx
 * Copyright (c) 2023 by ZA-智能中台, All Rights Reserved.
 */
import { Get, Post, Put, Delete, Patch } from "@/api/server"
import { botPrefix } from "@/constants"

const prefix = botPrefix
// BOT-聊天模型列表
export const fetchChatModelList = (botNo = "") => {
  return Get(`${prefix}/admin/bot/chatModel/list?botNo=${botNo}`).then((res) => res.data)
}

// BOT-上下线
export const updateBotStatus = ({ botNo, status }) => {
  return Put(`${prefix}/admin/bot/${botNo}/updateStatus`, { status }).then((res) => res)
}

// BOT-新增
export const saveBot = (data) => {
  return Post(`${prefix}/admin/bot/create`, data).then((res) => res)
}

// Bot-编辑
export const updateBot = (botNo, data) => {
  return Put(`${prefix}/admin/bot/${botNo}`, data).then((res) => res)
}

export const updateBotBasicSettings = (botNo, data) => {
  return Put(`${prefix}/admin/bot/${botNo}/basic/settings`, data).then((res) => res)
}

// BOT-删除
export const deleteBot = (botNo) => {
  return Delete(`${prefix}/admin/bot/${botNo}`).then((res) => res)
}

// BOT-查询基础信息
/**
 *
 * @param {*} botNo
 * @returns
 */
export const fetchBotInfo = (botNo) => {
  return Get(`${prefix}/admin/bot/${botNo}`).then((res) => res.data)
}

// BOT-查询空间列表
export const fetchBotList = (params) => {
  return Get(`${prefix}/admin/bot/list-simple`, params).then((res) => res.data)
}

// BOT-查询空间列表
export const fetchNamespaceList = () => {
  return Get(`${prefix}/admin/authPermissionGroup/listRestricted`).then((res) => res.data)
}

// BOT-分页查询
export const fetchBotListByPage = (params) => {
  return Get(`${prefix}/admin/bot/listByPage`, params).then((res) => res.data)
}

// 应用端列表
// GET /dictionary/llmModelType
export const fetchAppPlatformTypes = () => {
  return Get(`${prefix}/dictionary/applicationPlatformType`).then((res) => res.data)
}

// BOT-检查是否为普通管理员
export const checkIsGeneralAdmin = (botNo) => {
  // return Get(`${prefix}/bots/${botNo}/isGeneralAdmin`).then((res) => res.data)
  return Get(`${prefix}/admin/authUser/isAdmin?botNo=${botNo}`).then((res) => res.data)
}
