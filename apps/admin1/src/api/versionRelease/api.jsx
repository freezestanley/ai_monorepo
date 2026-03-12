import { Get, Post } from "@/api/server"
import { botPrefix as prefix } from "@/constants"

/**
 * 获取空间发布配置
 * @param {*} params
 */
export const getPublishConfig = (params) => {
  return Get(`${prefix}/admin/publish-config/get/${params.targetType}/${params.targetId}`)
}

/**
 * 分页查询发布单
 * @param {*} params
 */
export const fetchPublishOrderList = (params) => {
  return Post(`${prefix}/admin/publish/orders/pageQuery`, params)
}

/**
 * 打开发布配置（切换到标准发布模式）
 * @param {*} params
 */
export const openPublishConfig = (params) => {
  return Post(`${prefix}/admin/publish-config/open/${params.targetType}/${params.targetId}`)
}

/**
 * 关闭发布配置（切换到原直接发布的模式）
 * @param {*} params
 */
export const closePublishConfig = (params) => {
  return Post(`${prefix}/admin/publish-config/close/${params.targetType}/${params.targetId}`)
}

/**
 * 终止发布单
 * @param {*} params
 */
export const stopPublishOrder = (params) => {
  return Post(`${prefix}/admin/publish/orders/${params.publishOrderId}/stop`)
}

/**
 * 分页获取发布变更记录列表（支持状态和实体查询）
 * @param {*} params
 */
export const fetchPublishEntityChangeList = (params) => {
  return Post(`${prefix}/admin/publish/entity-change-records/page-list`, params)
}

/**
 * 创建发布单
 * @param {*} params
 */
export const createPublishOrder = (params) => {
  return Post(`${prefix}/admin/publish/orders/create`, params)
}

/**
 * 获取发布单详情
 * @param {*} params
 */
export const fetchPublishOrderDetail = (params) => {
  return Get(`${prefix}/admin/publish/orders/${params.publishOrderId}`)
}

/**
 * 执行发布
 * @param {*} params
 */
export const fetchPublishOrder = (params) => {
  return Post(`${prefix}/admin/publish/orders/publish`, params)
}

/**
 * 回退发布
 * @param {*} params
 */
export const fetchPublishOrderStepBack = (params) => {
  return Post(`${prefix}/admin/publish/orders/publish/step-back`, params)
}

/**
 * 跳过确认
 * @param {*} params
 */
export const fetchPublishOrderSkipConfirm = (params) => {
  return Post(`${prefix}/admin/publish/orders/skip-confirm`, params)
}

/**
 * 回滚发布单
 * @param {*} params
 */
export const fetchPublishOrderRollBack = (params) => {
  return Post(`${prefix}/admin/publish/orders/publish/roll-back`, params)
}

/**
 * 分页查询发布事件记录
 * @param {*} params
 */
export const fetchPublishEventRecords = (params) => {
  return Post(`${prefix}/admin/publish/event-records/pageQuery`, params)
}

/**
 * 取消删除
 * @param {*} params
 */
export const fetchPublishEntityChangeRecords = (params) => {
  return Post(`${prefix}/admin/publish/entity-change-records/cancel-delete`, params)
}

/**
 * 开启灰度发布(配置)
 * @param {*} params
 */
export const fetchPublishGrayscale = (params) => {
  return Post(`${prefix}/admin/publish/grayscale/start`, params)
}

/**
 * 停止灰度发布
 * @param {*} params
 */
export const fetchPublishGrayscaleStop = (params) => {
  return Post(`${prefix}/admin/publish/grayscale/stop`, params)
}

/**
 * 根据发布单ID查询灰度计划
 * @param {*} params
 */
export const fetchPublishGrayPlan = (params) => {
  return Get(`${prefix}/admin/publish/gray-plans/order/${params.publishOrderId}`)
}
