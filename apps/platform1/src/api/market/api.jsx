/*
 * @Author: Dyton
 * @Date: 2024-03-16 15:40:30
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-05-22 17:53:43
 * @FilePath: /za-aigc-platform-admin-static/src/api/market/api.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import { Get, Post } from "@/api/server"
import { botPrefix } from "@/constants"
import { infoInterceptors } from "../tools"

/**
 * @description: 市集首页，根据类型查询各组别内容
 * @params {*} botNo
 * @params {*} query
 * @params {*} bizType
 * @return {*}
 */
export const fetchMarketHome = (params) => {
  const { botNo } = params
  const url = `${botPrefix}/admin/bot/${botNo}/page-subscribable-resource`
  return Post(url, params).then((res) => infoInterceptors(res)?.data)
}

/**
 * @description: 取消订阅
 * @params {*} botNo
 * @params {*} query
 * @params {*} bizType
 * @return {*}
 */
export const fetchCancelSubscribe = (params) => {
  const { botNo } = params
  const url = `${botPrefix}/admin/bot/${botNo}/cancel-subscribe`
  return Post(url, { ...params }).then((res) => res)
}

/**
 * @description: 订阅
 * @params {*} botNo
 * @params {*} query
 * @params {*} bizType
 * @return {*}
 */
export const fetchSubscribe = (params) => {
  const { botNo } = params
  const url = `${botPrefix}/admin/bot/${botNo}/subscribe`
  return Post(url, { ...params }).then((res) => res)
}

/**
 * @description: 查询可订阅资源列表
 * @params {*} query
 * @params {*} bizType
 * @return {*}
 */
export const fetchSubscribableResources = (params) => {
  const url = `${botPrefix}/admin/bot/page-subscribable-resource`
  return Post(url, params, { headers: { "X-Platform-Type": "web" } }).then(
    (res) => infoInterceptors(res)?.data
  )
}

/**
 * @description: 来源空间搜索
 * @params {*} botNo
 * @params {*} bizType
 * @returns {*}
 */
export const fetchSubscribableBots = (params) => {
  const url = `${botPrefix}/admin/bot/list-subscribable-bots`
  return Get(url, params).then((res) => infoInterceptors(res)?.data)
}

/**
 * @description: 获取空间列表
 * @return {*}
 */
export const fetchBotList = () => {
  const url = `${botPrefix}/bots`
  return Get(url, {}, { headers: { "X-Platform-Type": "web" } }).then((res) =>
    infoInterceptors(res)
  )
}

/**
 * @description: 获取空间详情
 * @return {*}
 */
export const fetchBotExtendInfo = () => {
  const url = `${botPrefix}/bots/extendInfo`
  return Post(url, {}).then((res) => infoInterceptors(res))
}
