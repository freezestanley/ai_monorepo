/*
 * @Author: Dyton
 * @Date: 2024-03-16 15:40:30
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-04-19 11:53:18
 * @FilePath: /za-aigc-platform-admin-static/src/api/pluginManage/api.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import { Get, Post, Delete } from "@/api/server"
import { botPrefix } from "@/constants"
import { infoInterceptors } from "../tools"

/**
 * @description: 工具详情
 * @params {*} botNo
 * @params {*} id
 * @return {*}
 */
export const fetchPluginDetail = (params) => {
  const { botNo, pluginNo } = params
  const url = `${botPrefix}/admin/${botNo}/plugin/detail/${pluginNo}`
  return Get(url, params).then((res) => infoInterceptors(res)?.data)
}

// 获取列表
export const fetchPluginList = (params) => {
  const { botNo } = params
  const url = `${botPrefix}/admin/${botNo}/plugin/owner/list`
  return Get(url, params).then((res) => infoInterceptors(res)?.data)
}

export const fetchPluginDeleteV2 = (params) => {
  const { botNo, pluginNo } = params
  const url = `${botPrefix}/admin/${botNo}/plugin/${pluginNo}/delete`
  return Delete(url, { ...params }).then((res) => res || {})
}

export const fetchPluginReference = (params) => {
  const { botNo, pluginNo } = params
  return Get(`${botPrefix}/admin/${botNo}/plugin/${pluginNo}/getAgentReferences`).then(
    (res) => res || {}
  )
}

// 获取订阅列表
export const fetchPluginSubList = (params) => {
  const { botNo } = params
  const url = `${botPrefix}/admin/bot/${botNo}/page-subscribed-resource`
  return Get(url, params).then((res) => infoInterceptors(res)?.data)
}

// 取消订阅
export const fetchCancelSubscribe = (params) => {
  const { botNo } = params
  const url = `${botPrefix}/admin/bot/${botNo}/cancel-subscribe`
  return Post(url, { ...params }).then((res) => infoInterceptors(res))
}

// 订阅
export const fetchSubscribe = (params) => {
  const { botNo } = params
  const url = `${botPrefix}/admin/bot/${botNo}/subscribe`
  return Post(url, { ...params }).then((res) => infoInterceptors(res))
}

// 启用、停用
export const fetchPluginEnable = (params) => {
  const { botNo } = params
  const url = `${botPrefix}/admin/${botNo}/plugin/updateStatus`
  return Post(url, { ...params }).then((res) => infoInterceptors(res))
}

// 新增
export const fetchPluginCreate = (params) => {
  const { botNo } = params
  const url = `${botPrefix}/admin/${botNo}/plugin/create`
  return Post(url, { ...params }).then((res) => infoInterceptors(res))
}

// 修改基础信息
export const fetchPluginEditBase = (params) => {
  const { botNo } = params
  const url = `${botPrefix}/admin/${botNo}/plugin/base/update`
  return Post(url, { ...params }).then((res) => infoInterceptors(res))
}
// 修改共享信息
export const fetchPluginEditShare = (params) => {
  const { botNo } = params
  const url = `${botPrefix}/admin/${botNo}/plugin/share/update`
  return Post(url, { ...params }).then((res) => infoInterceptors(res))
}

// 删除
export const fetchPluginDelete = (params) => {
  const { botNo, id } = params
  const url = `${botPrefix}/admin/${botNo}/plugin/delete/${id}`
  return Post(url, { ...params }).then((res) => infoInterceptors(res))
}

/***
 * POST /admin/{botNo}/plugin/create 插件新增
 */
export const createPlugin = ({ botNo, ...data }) => {
  return Post(`${botPrefix}/admin/${botNo}/plugin/create`, data).then((res) => res || {})
}

/***
 * POST /admin/{botNo}/plugin/base/update 插件-修改基础信息
 */
export const updatePlugin = ({ botNo, ...data }) => {
  return Post(`${botPrefix}/admin/${botNo}/plugin/base/update`, data).then((res) => res || {})
}

/***
 * POST /admin/${botNo}/plugin/showAdvanceSetting 插件-是否展示高级配置
 */
export const showAdvanceSetting = ({ botNo }) => {
  return Get(`${botPrefix}/admin/${botNo}/plugin/showAdvanceSetting`).then((res) => res || {})
}
