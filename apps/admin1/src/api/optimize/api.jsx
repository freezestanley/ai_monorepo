import { Get, Post, Put } from "@/api/server"
import { botPrefix } from "@/constants"
const prefix = botPrefix
/**
 * 获取优化订单详情
 * GET /admin/bot/optimizationOrder/detail/{orderNo}
 * @param {*} params
 */
export const fetchOptimizationOrderDetail = ({ orderNo, ...params }) => {
  return Get(`${prefix}/admin/bot/optimizationOrder/detail/${orderNo}`, params).then(
    (res) => res.data
  )
}

/**
 * 【查R】拉取优化订单列表
 * POST /admin/bot/optimizationOrder/page
 * @param {*} params
 */
export const fetchOptimizationOrderListByPage = ({ ...params }) => {
  return Post(`${prefix}/admin/bot/optimizationOrder/page`, params).then((res) => res.data)
}

/**
 * 创建优化单校验
 * POST /admin/bot/optimizationOrder/preCheck
 * @param {*} data
 */
export const getCreateOptimizationPreCheck = (data) => {
  return Get(`${prefix}/admin/bot/optimizationOrder/link/resource/preCheck`, data).then(
    (res) => res
  )
}

/**
 * 创建优化订单
 * POST /admin/optimizationOrder/create
 * @param {*} data
 */
export const createOptimizationOrder = (data) => {
  return Post(`${prefix}/admin/bot/optimizationOrder/create`, data).then((res) => res)
}

/**
 * 优化单编辑
 * PUT /admin/bot/optimizationOrder/update
 * @param {*} data
 */
export const updateOptimizationOrder = (data) => {
  return Put(`${prefix}/admin/bot/optimizationOrder/update`, data).then((res) => res)
}

/**
 * 获取优化单状态
 * GET /dictionary/optimizationStatus
 */
export const getOptimizationStatus = () => {
  return Get(`${prefix}/dictionary/optimizationStatus`).then((res) => res.data)
}

/**
 * 获取优化单优先级
 * GET /dictionary/optimizationPriority
 */
export const getOptimizationPriority = () => {
  return Get(`${prefix}/dictionary/optimizationPriority`).then((res) => res.data)
}

/**
 * 获取优化单优化方向
 * GET /dictionary/optimizationOption
 */
export const getOptimizationOption = () => {
  return Get(`${prefix}/dictionary/optimizationOption`).then((res) => res.data)
}

/**
 * 获取受理人列表
 * GET admin/bot/{botNo}/authUser/page
 * @param {*} params
 */
export const fetchAuthUserList = ({ botNo, ...params }) => {
  return Get(`${prefix}/admin/bot/${botNo}/authUser/page`, params).then(
    (res) => res.data?.list || []
  )
}

/**
 * 获取优化单选择列表
 * GET /admin/bot/optimizationOrder/select/{requestId}
 * @param {*} requestId
 */
export const fetchOptimizationOrderSelect = (requestId) => {
  return Get(`${prefix}/admin/bot/optimizationOrder/select/${requestId}`).then(
    (res) => res.data || []
  )
}

/**
 * 获取优化单来源
 * GET /dictionary/optimizationSource
 */
export const getOptimizationSource = (params) => {
  return Get(`${prefix}/dictionary/optimizationSource`, params).then((res) => res.data || [])
}

// GET /admin/sessionResponse/queryOne
export const fetchSessionResponse = (params) => {
  return Get(`${prefix}/admin/sessionResponse/queryOne`, { ...params }).then((res) => res.data)
}

// GET /admin/sessionResponse/queryOneByOrder
export const fetchQueryOneByOrderResponse = (params) => {
  return Get(`${prefix}/admin/sessionResponse/queryOneByOrder`, { ...params }).then(
    (res) => res.data
  )
}

/**
 * 获取优化看板数据总览
 * POST /admin/bot/optimizationOrder/report/overview
 */
export const fetchOptimizationOverview = (params) => {
  return Post(`${prefix}/admin/bot/optimizationOrder/report/overview`, params).then(
    (res) => res.data
  )
}

/**
 * 获取优化单处理进度指标
 * POST /admin/bot/optimizationOrder/report/metricList
 */
export const fetchOptimizationOrderMetrics = (params) => {
  return Post(`${prefix}/admin/bot/optimizationOrder/report/metricList`, params).then(
    (res) => res.data
  )
}

export const fetchOptimizationOrderPieChartMetrics = async (params) => {
  const { data } = await Post(
    `${prefix}/admin/bot/optimizationOrder/report/metricPieChartList`,
    params
  )
  return data
}

/**
 * 获取受理人优化进度
 * POST /admin/bot/optimizationOrder/report/getMetricByProcessor
 */
export const fetchOptimizationOrderProcessorMetrics = async (params) => {
  const { data } = await Post(
    `${prefix}/admin/bot/optimizationOrder/report/getMetricByProcessor`,
    params
  )
  return data
}
