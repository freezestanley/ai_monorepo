/*
 * @Author: Dyton
 * @Date: 2024-03-16 15:40:30
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-04-19 11:52:36
 * @FilePath: /za-aigc-platform-admin-static/src/api/market/index.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import { useQuery, useMutation, useInfiniteQuery } from "@tanstack/react-query"
import {
  fetchMarketHome,
  fetchCancelSubscribe,
  fetchSubscribe,
  fetchSubscribableResources,
  fetchBotList,
  fetchSubscribableBots
} from "./api"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { mutationCallback } from "../tools"

/**
 * @description: 市集首页，根据类型查询各组别内容
 * @return {*}
 */
export const useMarketHomeListApi = (params) => {
  return useQuery([QUERY_KEYS.MARKET_HOME, params], () => fetchMarketHome({ ...params }))
}
/**
 * @description: 市集首页，根据类型查询各组别内容,无限滚动版
 * @return {*}
 */
export const useInfiniteMarketHomeListApi = (params) => {
  return useInfiniteQuery(
    [QUERY_KEYS.MARKET_HOME, params],
    ({ pageParam = 1 }) => fetchMarketHome({ ...params, pageNum: pageParam }),
    {
      getNextPageParam: (lastPage, pages) => {
        if (lastPage?.list?.length < params.pageSize) {
          return undefined // 没有更多数据了
        }
        return pages.length + 1 // 返回下一页的页码
      }
    }
  )
}
/**
 * @description: 取消订阅
 * @return {*}
 */
export const useCancelSubscribeApi = (cb) =>
  useMutation(fetchCancelSubscribe, { ...mutationCallback(cb) })

/**
 * @description: 订阅
 * @return {*}
 */
export const useSubscribeApi = (cb) => useMutation(fetchSubscribe, { ...mutationCallback(cb) })

/**
 * @description: 查询可订阅资源列表
 * @return {*}
 */
export const useSubscribableResourcesApi = (params) => {
  return useInfiniteQuery(
    [QUERY_KEYS.SUBSCRIBABLE_RESOURCES, params],
    ({ pageParam = 1 }) => fetchSubscribableResources({ ...params, pageNum: pageParam }),
    {
      getNextPageParam: (lastPage, pages) => {
        if (lastPage?.list?.length < params.pageSize) {
          return undefined // 没有更多数据了
        }
        return pages.length + 1 // 返回下一页的页码
      }
    }
  )
}

/**
 * @description: 获取空间列表
 * @return {*}
 */
export const useBotList = () => {
  return useQuery([QUERY_KEYS.BOT_LIST], fetchBotList)
}

/**
 * @description: 来源空间搜索
 * @returns {*}
 */
export const useSubscribableBots = (params) => {
  return useQuery([QUERY_KEYS.SUBSCRIBABLE_BOTS, params], () => fetchSubscribableBots(params))
}
