import { QUERY_KEYS } from "@/constants/queryKeys"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  fetchAvailableLimitDefaultData,
  fetchAvailableLimitPage,
  saveOrUpdateAvailableLimitData
} from "./api"

/**
 * 获取带分页的用户列表。
 * @param {Object} params - 查询参数。
 */
export const useFetchAvailableLimitPage = (params) => {
  return useQuery([QUERY_KEYS.AVAILABLE_LIMIT_PAGE, params], () => fetchAvailableLimitPage(params))
}
/**
 * 获取带分页的用户列表。
 * @param {Object} params - 查询参数。
 */
export const useFetchAvailableLimitDefaultData = (params) => {
  return useQuery([QUERY_KEYS.AVAILABLE_LIMIT_DEFAULT_DATA, params], () =>
    fetchAvailableLimitDefaultData(params)
  )
}
/**
 * 保存或更新可用性数据
 */
export const useSaveOrUpdateAvailableLimitData = () => {
  return useMutation(saveOrUpdateAvailableLimitData)
}
