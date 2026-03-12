import { Post } from "@/api/server"
import { getTokenAndServiceName } from "@/api/sso"
import { isStudio } from "@/config.env"
import dayjs from "dayjs"

// admin 端数据报表接口前缀
const reportStudioPrefix = "/reportStudio"
/**
 * 获取数据总览KPI指标
 * @param {Object} params 请求参数
 * @param {string} params.startTime 开始时间
 * @param {string} params.endTime 结束时间
 * @param {string[]} params.queryTypes 查询类型数组
 * @returns {Promise}
 */
/**
 * 获取柱状图数据（活跃空间数 / 大模型调用次数）
 * @param {Object} params
 * @param {"DAY"|"WEEK"|"MONTH"} params.metricCycle
 * @param {"active_robot_count"|"big_model_call_count"} params.queryType
 * @param {string} params.startTime
 * @param {string} params.endTime
 */
export const fetchDashboardBar = (params) => {
  const requestData = {
    metricCycle: params.metricCycle,
    queryType: params.queryType,
    startTime: params.startTime,
    endTime: params.endTime,
    botNoList: params.botNoList
  }

  return Post(`${reportStudioPrefix}/admin/dashboard/bar`, requestData).then((res) => res.data)
}

/**
 * 获取折线图数据
 * @param {Object} params
 * @param {"DAY"|"WEEK"|"MONTH"} params.metricCycle
 * @param {"active_skill_count"|"skill_call_count"|"active_agent_count"|"agent_call_count"|"doc_knowledge_count"|"qa_knowledge_count"} params.queryType
 * @param {string} params.startTime
 * @param {string} params.endTime
 */
export const fetchDashboardLine = (params) => {
  const requestData = {
    metricCycle: params.metricCycle,
    startTime: params.startTime,
    endTime: params.endTime,
    module: "management_platform",
    queryType: params.queryType,
    type: "line",
    botNoList: params.botNoList
  }

  return Post(`${reportStudioPrefix}/admin/dashboard/line`, requestData).then((res) => res.data)
}

/**
 * 获取表格数据（空间/模型维度调用次数&token）
 * @param {Object} params
 * @param {string} params.startTime
 * @param {string} params.endTime
 * @param {number} params.pageNum
 * @param {number} params.pageSize
 * @param {"callCount"|"totalToken"|"promptToken"|"completionToken"} [params.sortField]
 * @param {"desc"|"asc"} [params.sortOrder]
 * @param {"bot_invo_token_count"|"model_invo_token_count"} params.queryType
 */
export const fetchDashboardTable = (params) => {
  const requestData = {
    ...params
  }

  return Post(`${reportStudioPrefix}/admin/dashboard/table`, requestData).then((res) => res.data)
}

/**
 * 导出Dashboard图表/表格数据（流下载）
 * @param {Object} params
 * @param {"bar"|"line"|"table"} params.viewType
 * @param {Object} params.queryParams 其余参数与对应查询接口保持一致
 */
export const exportDashboardView = ({ viewType, queryParams, title }) => {
  const exportDataURL = `${reportStudioPrefix}/admin/dashboard/${viewType}/export`

  return fetch(exportDataURL, {
    method: "POST",
    body: JSON.stringify(queryParams),
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "X-Usercenter-Session": getTokenAndServiceName().token,
      "X-Service-Name": getTokenAndServiceName().serviceName,
      ...(isStudio() ? { botno: undefined, studioenv: "prd" } : {})
    }
  })
    .then((res) => {
      if (res.status === 200) {
        return res.blob().then((blob) => {
          const link = document.createElement("a")
          link.href = window.URL.createObjectURL(blob)
          const fileName = `${title || "数据报表"}-${dayjs().format("YYYY-MM-DD-HH:mm:ss")}.xlsx`
          link.download = fileName
          link.click()
          return true
        })
      } else {
        throw new Error("导出失败")
      }
    })
    .catch((e) => {
      console.error("导出失败:", e)
      return false
    })
}

export const fetchDashboardKPI = (params) => {
  // 固定的查询类型数组，包含所有需要的指标
  const queryTypes = [
    "active_robot_count", // 活跃空间数
    "active_users_count", // 活跃用户
    "active_skill_count", // 活跃工作流数
    "skill_call_count", // 工作流调用次数
    "active_agent_count", // 活跃Agent数
    "agent_call_count", // Agent调用次数
    "model_call_count", // 被调用模型数
    "model_token_all_count", // 模型Token调用总量
    "knowledge_data_count" // 知识库数据量
  ]

  const requestData = {
    startTime: params.startTime,
    endTime: params.endTime,
    queryTypes: queryTypes,
    botNoList: params.botNoList
  }

  return Post(`${reportStudioPrefix}/admin/dashboard/kpi`, requestData).then((res) => res.data)
}
