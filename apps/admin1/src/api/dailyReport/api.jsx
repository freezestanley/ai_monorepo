import { Get, Post } from "@/api/server"
import { botPrefix } from "@/constants"
import { getTokenAndServiceName } from "@/api/sso"

// 获取调用日志概览
export const fetchCallLogsOverview = (params) => {
  return Get(`${botPrefix}/admin/dailyReports/overview`, params).then((res) => res.data)
}

// 获取工作流调用情况
export const fetchSkillOverview = (params) => {
  return Get(`${botPrefix}/admin/dailyReports/${params.proportionCode}`, params).then(
    (res) => res.data
  )
}

// 获取调用top榜
export const fetchTopOverview = (params) => {
  return Get(`${botPrefix}/admin/dailyReports/${params.dimensionCode}`, params).then(
    (res) => res.data
  )
}

// 获取调用趋势
export const fetchCallTrendOverview = (params) => {
  return Get(`${botPrefix}/admin/dailyReports/skillCallsTrend`, params).then((res) => res.data)
}

// 获取聚合周期范围
export const fetchMetricCyclesList = (params) => {
  return Get(`${botPrefix}/admin/dailyReports/metricCycles`, params).then((res) => res.data)
}

export const fetchPieChartOfPerSkillUsage = (params) => {
  return Post(`${botPrefix}/admin/report/v2/bot-usage/pie-chart-of-per-skill-usage`, params).then(
    (res) => res.data
  )
}

/**
 * 获取空间列表
 * @param {*} params
 * @returns
 */
export const fetchBotListByTagNo = (params) => {
  return Get(`${botPrefix}/admin/bot/listRestricted`, params).then((res) => res.data)
}

/**
 * 获取空间使用概览
 * @param {*} params
 * @returns
 */
export const fetchBotUsageOverview = (params) => {
  return Post(`${botPrefix}/admin/report/v2/bot-usage/overview`, params).then((res) => res.data)
}

// 获取工作流调用次数趋势
export const fetchSkillCallsTrend = (params) => {
  return Post(`${botPrefix}/admin/report/v2/bot-usage/skill-calls-trend`, params).then(
    (res) => res.data
  )
}

// 获取模型Token调用量趋势
export const fetchModelTotalUsageTrend = (params) => {
  return Post(`${botPrefix}/admin/report/v2/bot-usage/model-total-usage-trend`, params).then(
    (res) => res.data
  )
}

// 获取各模型调用Token量趋势
export const fetchPerModelUsageTrend = (params) => {
  return Post(`${botPrefix}/admin/report/v2/bot-usage/per-model-usage-trend`, params).then(
    (res) => res.data
  )
}

// 获取模型调用Token量明细
export const fetchModelUsageDetails = (params) => {
  return Post(`${botPrefix}/admin/report/v2/bot-usage/page-model-usage`, params).then(
    (res) => res.data
  )
}

// 获取模型调用总Token占比
export const fetchModelUsagePieChart = (params) => {
  return Post(`${botPrefix}/admin/report/v2/bot-usage/pie-chart-of-per-model-usage`, params).then(
    (res) => res.data
  )
}

/**
 * 查询模型计费信息
 * @param {Object} params - 查询参数
 * @param {number} params.startTime - 开始时间戳
 * @param {number} params.endTime - 结束时间戳
 * @param {Array<string>} params.modelList - 模型列表
 * @param {string} params.unit - 时间单位 (day/month)
 * @param {string} botNo - 空间编号
 * @returns {Promise} 返回计费信息
 */
export function queryModelBilling(params, botNo) {
  // 构建新的 URL 路径，始终包含 botNo
  const urlPath = `${botPrefix}/admin/report/v2/bot-usage/${botNo}/apiTokenBilling`

  return Post(urlPath, params)
}

/**
 * 导出模型计费明细 - 使用fetch避免axios拦截器干扰
 * @param {string} botNo - 空间编号
 * @param {string} date - 导出日期，格式：YYYY-MM-DD
 * @returns {Promise} 返回Response对象
 */
export async function exportModelBillingDetail(botNo, date) {
  const { token, serviceName } = await getTokenAndServiceName()

  const urlPath = `${botPrefix}/admin/report/v2/bot-usage/${botNo}/exportApiTokenBilling`

  const response = await fetch(urlPath, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Cache-Control": "no-cache",
      "X-Usercenter-Session": token,
      "X-Service-Name": serviceName
    },
    body: JSON.stringify({ date })
  })

  if (!response.ok) {
    throw new Error(`下载失败，status: ${response.status}`)
  }

  return response
}
