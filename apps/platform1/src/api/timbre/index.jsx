/*
 * @Author: Dyton
 * @Date: 2024-12-19 10:00:00
 * @Descripttion: 声音市集相关API hooks
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-12-19 10:00:00
 * @FilePath: /za-aigc-platform-admin-static/src/api/timbre/index.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  fetchTimbreMarketList,
  updateTimbreEnabledStatus,
  createOrUpdateTimbre,
  fetchTimbreModelList,
  fetchTimbreDetail
} from "./api"
import { QUERY_KEYS } from "@/constants/queryKeys"

/**
 * @description: 获取声音市集列表
 * @param {Object} params - 请求参数
 * @return {*}
 */
export const useTimbreMarketListApi = (params) => {
  return useQuery([QUERY_KEYS.TIMBRE_MARKET, params], () => fetchTimbreMarketList({ ...params }))
}

/**
 * @description: 获取声音市集列表，无限滚动版
 * @param {Object} params - 请求参数
 * @return {*}
 */
export const useInfiniteTimbreMarketListApi = (params) => {
  return useInfiniteQuery(
    [QUERY_KEYS.TIMBRE_MARKET, params],
    ({ pageParam = 1 }) => fetchTimbreMarketList({ ...params, pageNum: pageParam }),
    {
      getNextPageParam: (lastPage, pages) => {
        if (lastPage.list.length < params.pageSize) {
          return undefined // 没有更多数据了
        }
        return pages.length + 1 // 返回下一页的页码
      }
    }
  )
}

/**
 * @description: 更新音色启用状态
 * @return {*}
 */
export const useUpdateTimbreEnabledStatus = () => {
  const queryClient = useQueryClient()

  return useMutation((params) => updateTimbreEnabledStatus(params), {
    onSuccess: (data, variables) => {
      // 更新成功后，可以刷新相关查询
      queryClient.invalidateQueries([QUERY_KEYS.TIMBRE_MARKET])
      // 如果有个人音色列表的查询，也可以刷新
      queryClient.invalidateQueries([QUERY_KEYS.TIMBRE_PERSONAL])
    }
  })
}

/**
 * @description: 创建或更新音色
 * @return {*}
 */
export const useCreateOrUpdateTimbre = () => {
  const queryClient = useQueryClient()

  return useMutation((params) => createOrUpdateTimbre(params), {
    onSuccess: (data, variables) => {
      // 创建或更新成功后，刷新相关查询
      queryClient.invalidateQueries([QUERY_KEYS.TIMBRE_MARKET])
      queryClient.invalidateQueries([QUERY_KEYS.TIMBRE_PERSONAL])
    }
  })
}

/**
 * @description: 获取音色模型列表
 * @param {Object} params - 请求参数
 * @return {*}
 */
export const useTimbreModelList = (params) => {
  return useQuery([QUERY_KEYS.TIMBRE_MODEL, params], () => fetchTimbreModelList(params), {
    enabled: !!params?.botNo
  })
}

/**
 * @description: 获取音色详情
 * @param {Object} params - { botNo, timbreId }
 * @return {*}
 */
export const useTimbreDetail = (params) => {
  return useQuery([QUERY_KEYS.TIMBRE_DETAIL, params], () => fetchTimbreDetail(params), {
    enabled: !!params?.botNo && !!params?.timbreId
  })
}
