/*
 * @Author: Dyton
 * @Date: 2024-12-19 10:00:00
 * @Descripttion: 声音市集相关API
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-12-19 10:00:00
 * @FilePath: /za-aigc-platform-admin-static/src/api/timbre/api.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import { Get, Post, Upload } from "@/api/server"
import { infoInterceptors } from "../tools"
import { timbrePrefix } from "@/constants"

/**
 * @description: 获取声音市集列表
 * @param {Object} params - 请求参数
 * @param {string} params.botNo - 空间编号
 * @param {number} params.pageSize - 每页数量
 * @param {number} params.pageNum - 页码
 * @param {string} params.timbreName - 声音名称
 * @return {Promise}
 */
export const fetchTimbreMarketList = (params) => {
  const { botNo, pageSize, pageNum, timbreName } = params
  const url = `${timbrePrefix}/api/v1/nlu/timbre-config/market/page`
  const requestParams = {
    subscriptionMode: 0,
    pageSize,
    pageNum
  }

  if (botNo) {
    requestParams.botNo = botNo
  }

  if (timbreName) {
    requestParams.timbreName = timbreName
  }

  return Post(url, requestParams).then((res) => infoInterceptors(res)?.data)
}

/**
 * @description: 更新声音订阅状态
 * @param {Object} params - 请求参数
 * @param {string} params.botNo - 空间编号
 * @param {number} params.timbreId - 声音ID
 * @param {string} params.subscriptionStatus - 目标订阅状态 Y/N
 * @return {Promise}
 */
export const updateTimbreSubscriptionStatus = ({ botNo, timbreId, subscriptionStatus }) => {
  return Post(`${timbrePrefix}/api/v1/nlu/timbre-config/updateSubscriptionStatus`, {
    botNo,
    timbreId,
    subscriptionStatus
  })
}

/**
 * @description: 获取个人音色列表
 * @param {Object} params - 请求参数
 * @param {string} params.botNo - 空间编号
 * @param {string} params.timbreName - 声音名称
 * @param {string} params.gender - 性别
 * @param {string} params.enabled - 是否启用
 * @param {number} params.pageSize - 每页数量
 * @param {number} params.pageNum - 页码
 * @return {Promise}
 */
export const fetchPersonalTimbreList = (params) => {
  return Post(`${timbrePrefix}/api/v1/nlu/timbre-config/personal/page`, params).then(
    (res) => res?.data
  )
}

/**
 * @description: 获取个人音色列表（新版，POST /personal/list）
 * @param {Object} params - 请求参数 { botNo, timbreName }
 * @return {Promise}
 */
export const fetchPersonalTimbreListV2 = (params) => {
  return Post(`${timbrePrefix}/api/v1/nlu/timbre-config/personal/list`, params).then(
    (res) => res?.data || []
  )
}

/**
 * @description: 更新音色启用状态
 * @param {Object} params - 请求参数
 * @param {string} params.botNo - 空间编号
 * @param {number} params.timbreId - 音色ID
 * @param {string} params.enabled - 目标状态 Y（启用）/N（停用）
 * @return {Promise}
 */
export const updateTimbreEnabledStatus = ({ botNo, timbreId, enabled }) => {
  return Post(`${timbrePrefix}/api/v1/nlu/timbre-config/updateEnabledStatus`, {
    botNo,
    timbreId,
    enabled
  })
}

/**
 * @description: 创建或更新音色
 * @param {Object} params - 请求参数
 * @param {string} params.botNo - 空间编号
 * @param {number} params.timbreId - 音色ID（更新时必填，新增时不填）
 * @param {string} params.timbreCode - 音色编码
 * @param {number} params.timbreModelId - 复刻模型ID
 * @param {string} params.timbreName - 音色名称
 * @param {number} params.subscriptionMode - 订阅模式 -1/0/1
 * @param {string} params.enabled - 启用状态 Y/N
 * @param {string} params.gender - 性别 男/女 male/female
 * @param {string} params.avatarUrl - 音色头像URL
 * @param {Array} params.subscribableBotNos - 指定可订阅的空间编号列表
 * @param {string} params.description - 音色卡片描述
 * @param {string} params.remark - 备注
 * @return {Promise}
 */
export const createOrUpdateTimbre = (params) => {
  return Post(`${timbrePrefix}/api/v1/nlu/timbre-config/createOrUpdate`, params)
}

/**
 * @description: 获取音色模型列表
 * @param {Object} params - 请求参数
 * @param {string} params.botNo - 空间编号
 * @return {Promise}
 */
export const fetchTimbreModelList = (params) => {
  return Post(`${timbrePrefix}/api/v1/nlu/timbre-config/model/list`, params)
}

/**
 * @description: 上传音色头像
 * @param {FormData} formData - 包含 file 字段的 FormData
 * @return {Promise}
 */
export const uploadTimbreAvatar = (formData) => {
  return Upload(`${timbrePrefix}/api/v1/nlu/timbre-config/uploadAvatar`, formData)
}

/**
 * @description: 获取音色详情
 * @param {Object} params - { botNo, timbreId }
 * @return {Promise}
 */
export const fetchTimbreDetail = (params) => {
  return Post(`${timbrePrefix}/api/v1/nlu/timbre-config/detail`, params)
}

/**
 * @description: 获取公共声音市集列表
 * @param {Object} params - 请求参数 { pageSize, pageNum }
 * @return {Promise}
 */
export const fetchPublicTimbreList = (params) => {
  return Post(`${timbrePrefix}/api/v1/nlu/timbre-config/market/public/page`, params).then(
    (res) => res?.data?.list || []
  )
}
