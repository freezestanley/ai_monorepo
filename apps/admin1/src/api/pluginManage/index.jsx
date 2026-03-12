/*
 * @Author: Dyton
 * @Date: 2024-03-16 15:40:30
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-04-19 10:56:22
 * @FilePath: /za-aigc-platform-admin-static/src/api/pluginManage/index.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import { message } from "antd"
import { useQuery, useMutation } from "@tanstack/react-query"
import {
  fetchPluginDetail,
  fetchPluginList,
  fetchPluginDeleteV2,
  fetchPluginSubList,
  fetchCancelSubscribe,
  fetchSubscribe,
  fetchPluginEnable,
  fetchPluginCreate,
  fetchPluginEditBase,
  fetchPluginEditShare,
  fetchPluginDelete,
  createPlugin,
  updatePlugin,
  showAdvanceSetting
} from "./api"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { mutationCallback } from "../tools"

/**
 * @description: 插件详情
 * @return {*}
 */
export const usePluginDetailApi = (params) => {
  return useQuery([QUERY_KEYS.PLUGIN_DETAIL, params], () => fetchPluginDetail({ ...params }))
}

// 获取列表
export const usePluginListApi = (params) => {
  return useQuery([QUERY_KEYS.PLUGIN_LIST, params], () => fetchPluginList({ ...params }), {
    enabled: params?.disabledInit ? false : true
  })
}

// 删除
export const usePluginDeleteApi = (cb) => {
  return useMutation(fetchPluginDeleteV2, {
    ...mutationCallback(cb)
  })
}

// 获取订阅列表
export const usePluginSubListApi = (params) => {
  return useQuery([QUERY_KEYS.PLUGIN_SUB_LIST, params], () => fetchPluginSubList({ ...params }), {
    enabled: params?.disabledInit ? false : true
  })
}

// 取消订阅
export const useCancelSubscribeApi = (cb) =>
  useMutation(fetchCancelSubscribe, { ...mutationCallback(cb) })

// 订阅
export const useSubscribeApi = (cb) => useMutation(fetchSubscribe, { ...mutationCallback(cb) })

// 启用、停用
export const usePluginChangeStatus = (cb) =>
  useMutation(fetchPluginEnable, { ...mutationCallback(cb) })

// 新增
export const usePluginCreate = (cb) => useMutation(fetchPluginCreate, { ...mutationCallback(cb) })

// 修改基础信息
export const usePluginEditBase = (cb) =>
  useMutation(fetchPluginEditBase, { ...mutationCallback(cb) })

// 修改共享信息
export const usePluginEditShare = (cb) =>
  useMutation(fetchPluginEditShare, { ...mutationCallback(cb) })

// 删除
export const usePluginDelete = (cb) => useMutation(fetchPluginDelete, { ...mutationCallback(cb) })

// 插件新增
export const useCreatePlugin = () => {
  return useMutation(createPlugin)
}

// 插件修改
export const useUpdatePlugin = () => {
  return useMutation(updatePlugin)
}

// 获取高级设置
export const useShowAdvanceSetting = (params, options = {}) => {
  return useQuery(
    [QUERY_KEYS.SHOW_ADVANCE_SETTING, params],
    () => showAdvanceSetting({ ...params }),
    {
      enabled: !!params?.botNo,
      onSuccess: (data) => {
        if (!data?.success && data?.message) {
          message.error(data?.message)
        }
      },
      ...options
    }
  )
}
