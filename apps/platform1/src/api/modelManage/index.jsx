/*
 * @Author: Dyton
 * @Date: 2024-03-16 15:40:30
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-05-23 10:54:14
 * @FilePath: /za-aigc-platform-admin-static/src/api/modelManage/index.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import { useQuery, useMutation } from "@tanstack/react-query"
import { fetchModelList, fetchChangeModelStatus, fetchSaveModel, fetchModelTypes } from "./api"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { mutationCallback } from "../tools"

/**
 * @description: 模型管理 首页列表
 * @return {*}
 */
export const useModelsListApi = (params) => {
  return useQuery([QUERY_KEYS.MODELS_LIST, params], () => fetchModelList({ ...params }))
}
/**
 * @description: 模型管理 模态类型
 * @return {*}
 */
export const useModelTypesApi = (params) => {
  return useQuery([QUERY_KEYS.MODELS_TYPES, params], () => fetchModelTypes({ ...params }))
}
/**
 * @description: 新增/编辑
 * @return {*}
 */
export const useSaveModelApi = (cb) => useMutation(fetchSaveModel, { ...mutationCallback(cb) })

/**
 * @description: 模型状态变更
 * @return {*}
 */
export const useChangeModelStatusApi = (cb) =>
  useMutation(fetchChangeModelStatus, { ...mutationCallback(cb) })
