/*
 * @Author: Dyton
 * @Date: 2024-03-16 15:40:30
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-05-23 10:57:40
 * @FilePath: /za-aigc-platform-admin-static/src/api/modelManage/api.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import { Get, Post, Put } from "@/api/server"
import { botPrefix } from "@/constants"
import { infoInterceptors } from "../tools"

/**
 * @description: 模型管理 首页列表
 * @return {*}
 */
export const fetchModelList = (params) => {
  const url = `${botPrefix}/admin/llmConfig/page`
  return Get(url, params).then((res) => infoInterceptors(res)?.data)
}

/**
 * @description: 模型管理 模态类型列表
 * @return {*}
 */
export const fetchModelTypes = (params) => {
  const url = `${botPrefix}/dictionary/modalType`
  return Get(url, params).then((res) => infoInterceptors(res)?.data)
}

/**
 * @description: 保存/编辑
 * @return {*}
 */
export const fetchSaveModel = (params) => {
  const url = `${botPrefix}/admin/llmConfig/save`
  return Post(url, { ...params }).then((res) => res)
}

/**
 * @description: 模型  变更状态
 * @return {*}
 */
export const fetchChangeModelStatus = (params) => {
  const { configNo } = params
  console.log(params)

  const url = `${botPrefix}/admin/llmConfig/${configNo}/changeStatus`
  return Put(url, { ...params }).then((res) => res)
}
