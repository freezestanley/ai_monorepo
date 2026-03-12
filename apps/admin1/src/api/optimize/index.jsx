import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  fetchOptimizationOrderDetail,
  fetchOptimizationOrderListByPage,
  fetchSessionResponse,
  updateOptimizationOrder,
  getOptimizationStatus,
  getOptimizationPriority,
  getOptimizationOption,
  fetchAuthUserList,
  createOptimizationOrder,
  getOptimizationSource,
  fetchOptimizationOrderSelect,
  fetchOptimizationOverview,
  fetchOptimizationOrderMetrics,
  fetchOptimizationOrderPieChartMetrics,
  fetchOptimizationOrderProcessorMetrics
} from "./api"
import { QUERY_KEYS } from "@/constants/queryKeys"

/**
 * 获取优化订单详情
 */
export const useFetchOptimizationOrderDetail = (params, options = {}) => {
  return useQuery(
    [QUERY_KEYS.OPTIMIZATION_ORDER_DETAIL, params],
    () => fetchOptimizationOrderDetail(params),
    {
      enabled: options.enabled !== undefined ? options.enabled : !!params.orderNo,
      ...options
    }
  )
}

/**
 * 【查R】拉取优化订单列表
 */
export const useFetchOptimizationOrderListByPage = (params) => {
  return useQuery([QUERY_KEYS.OPTIMIZATION_ORDER_LIST_BY_PAGE, params], () =>
    fetchOptimizationOrderListByPage(params)
  )
}

/**
 * 使用useMutation创建优化订单
 */
export const useCreateOptimizationOrder = (params) => {
  return useMutation(createOptimizationOrder, params)
}

/**
 * 使用useMutation进行优化单编辑
 */
export const useUpdateOptimizationOrder = () => {
  const queryClient = useQueryClient()
  return useMutation(updateOptimizationOrder, {
    onSuccess: (d) => {
      queryClient.invalidateQueries([QUERY_KEYS.OPTIMIZATION_ORDER_LIST_BY_PAGE])
    }
  })
}

/**
 * 获取优化单状态
 */
export const useGetOptimizationStatus = () => {
  return useQuery([QUERY_KEYS.OPTIMIZATION_STATUS], getOptimizationStatus)
}

/**
 * 获取优化单优先级
 */
export const useGetOptimizationPriority = () => {
  return useQuery([QUERY_KEYS.OPTIMIZATION_PRIORITY], getOptimizationPriority)
}

/**
 * 获取优化单优化方向
 */
export const useGetOptimizationOption = () => {
  return useQuery([QUERY_KEYS.OPTIMIZATION_OPTION], getOptimizationOption)
}

/**
 * 获取受理人列表
 */
export const useFetchAuthUserList = (params) => {
  return useQuery([QUERY_KEYS.AUTH_USER_LIST, params], () => fetchAuthUserList(params))
}

/**
 * 获取优化来源
 */
export const useGetOptimizationSource = () => {
  return useQuery(["optimizationSource"], () => getOptimizationSource())
}

/**
 * 获取会话响应
 */
export const useFetchSessionResponse = (params) => {
  return useQuery([QUERY_KEYS.SESSION_RESPONSE, params], () => fetchSessionResponse(params))
}

/**
 * 获取优化单选择列表
 */
export const useFetchOptimizationOrderSelect = (requestId) => {
  return useQuery(
    ["optimizationOrderSelect", requestId],
    () => fetchOptimizationOrderSelect(requestId),
    {
      enabled: !!requestId
    }
  )
}

/**
 * 获取优化看板数据总览
 */
export const useFetchOptimizationOverview = (params) => {
  return useQuery(
    [QUERY_KEYS.OPTIMIZATION_OVERVIEW, params],
    () => fetchOptimizationOverview(params),
    {
      enabled: !!params?.botNo && !!params?.startTime && !!params?.endTime
    }
  )
}

/**
 * 获取优化单处理进度指标
 */
export const useFetchOptimizationOrderMetrics = (params) => {
  return useQuery(
    [QUERY_KEYS.OPTIMIZATION_ORDER_METRICS, params],
    () => fetchOptimizationOrderMetrics(params),
    {
      enabled: !!params?.botNo && !!params?.startTime && !!params?.endTime
    }
  )
}

export const useFetchOptimizationOrderPieChartMetrics = (params) => {
  const { botNo, startTime, endTime, metrics, metricCycle } = params
  return useQuery({
    queryKey: [
      "optimization-order-pie-chart-metrics",
      botNo,
      startTime,
      endTime,
      metrics,
      metricCycle
    ],
    queryFn: () => fetchOptimizationOrderPieChartMetrics(params),
    enabled: !!botNo && !!startTime && !!endTime && !!metrics && !!metricCycle
  })
}

/**
 * 获取受理人优化进度
 */
export const useFetchOptimizationOrderProcessorMetrics = (params) => {
  const { botNo, startTime, endTime } = params
  return useQuery({
    queryKey: ["optimization-order-processor-metrics", botNo, startTime, endTime],
    queryFn: () => fetchOptimizationOrderProcessorMetrics(params),
    enabled: !!botNo && !!startTime && !!endTime
  })
}
