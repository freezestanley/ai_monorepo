// api.js
import { Get, Post } from "@/api/server"
import { botPrefix } from "@/constants"
import { PAGE_CODE } from "@/constants/pageCode"

// Prompt-反馈标签
export const fetchFeedbackTag = (params) => {
  return Get(`${botPrefix}/dictionary/feedbackTag`).then((res) => res.data)
}

// Prompt-反馈来源
export const fetchFeedbackSource = (params) => {
  return Get(`${botPrefix}/dictionary/feedbackSource`, params).then((res) => res.data)
}

// Prompt-获取用户反馈列表
export const fetchUserFeedbackList = (params) => {
  return Post(`${botPrefix}/admin/sessionResponse/${PAGE_CODE.USER_FEED_BACK}`, params).then(
    (res) => res.data
  )
}

// Prompt-获取安全告警列表
export const fetchSafeFeedbackList = (params) => {
  return Post(`${botPrefix}/admin/sessionResponse/${PAGE_CODE.SECURITY_ALARM}`, params).then(
    (res) => res.data
  )
}

// Prompt-用户自定义列更新
export const updateFeedbackColumns = (params) => {
  return Post(`${botPrefix}/admin/pageField/relation/save`, params).then((res) => res.data)
}

// Prompt-获取页面的自定义列
export const fetchFeedbackColumns = (pageCode) => {
  return Get(
    `${botPrefix}/admin/pageField/relation/list?pageCode=${pageCode}`
    // @ts-ignore
  ).then((res) => res.data)
}

// 调用日志-获取调用日志
export const fetchCallLogsList = (params) => {
  return Post(`${botPrefix}/admin/sessionResponse/${PAGE_CODE.CALL_LOGS}`, params).then(
    (res) => res
  )
}

export const fetchOptimizationOrdersList = (params) => {
  return Post(`${botPrefix}/admin/bot/optimizationOrder/page`, params).then((res) => res.data)
}

// 调用日志-获取页面的自定义列
export const fetchCallLogsColumns = (pageCode) => {
  return Get(
    `${botPrefix}/admin/pageField/relation/list?pageCode=${pageCode}`
    // @ts-ignore
  ).then((res) => res.data)
}

// 调用日志-获取会话执行过程
// /admin/sessionResponse/execute-process/render-to-markdown
export const fetchCallLogsExecuteProcess = (params) => {
  return Get(`${botPrefix}/admin/sessionResponse/execute-process/render-to-markdown`, params).then(
    (res) => res.data
  )
}

// get /admin/sessionResponse/execute-process
export const fetchCallLogsExecuteProcessForStructureData = (params) => {
  return Get(`${botPrefix}/admin/sessionResponse/execute-process`, params).then((res) => res.data)
}

// get /admin/sessionResponse/execute-process-order
export const fetchCallLogsExecuteProcessOrderForStructureData = (params) => {
  return Get(`${botPrefix}/admin/sessionResponse/execute-process-order`, params).then(
    (res) => res.data
  )
}

// 检查是否启用执行过程 tab
export const checkEnableExecuteProcess = (params) => {
  return Get(`${botPrefix}/admin/sessionResponse/enable-execute-process`, params).then(
    (res) => res.data
  )
}

// 调用日志-标注
export const fetchSetCallLogsMark = (params) => {
  return Post(
    `${botPrefix}/admin/sessionResponse/${params.pageCode}/mark/${params.requestId}`,
    params
  ).then((res) => res)
}

// 调用日志-标注查询
export const fetchCallLogsMarkDetail = (params) => {
  return Get(
    `${botPrefix}/admin/sessionResponse/${params.pageCode}/markDetail/${params.requestId}`,
    params
  ).then((res) => res.data)
}

// 调用日志-召回faq查询
export const fetchCallLogsFaqRecord = (params) => {
  return Get(
    `${botPrefix}/admin/sessionResponse/${params.pageCode}/faqRecord/${params.requestId}`,
    params
  ).then((res) => res.data)
}

// 调用日志-调用日志优化
export const fetchCallLogsOptimize = (params) => {
  return Post(
    `${botPrefix}/admin/sessionResponse/${params.pageCode}/optimize/${params.requestId}`,
    params
  ).then((res) => res)
}
