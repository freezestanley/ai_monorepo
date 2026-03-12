import { Get, Post, Put } from "@/api/server"
import { getTokenAndServiceName } from "@/api/sso"
import { fetchCallLogsList, fetchOptimizationOrdersList } from "@/api/userFeedback/api"
import { botPrefix } from "@/constants"
import dayjs from "dayjs"
import { isStudio } from "@/config.env"

export const getSearchParams = (params) => {
  const {
    skillName,
    responseContext,
    skillVersionName,
    errMsg,
    requestContext,
    requestUser,
    feedbackDescription,
    ...otherParams
  } = params || {}
  return {
    skillNameLike: skillName,
    responseContextLike: responseContext,
    skillVersionNameLike: skillVersionName,
    errMsgLike: errMsg,
    requestContextLike: requestContext,
    requestUserLike: requestUser,
    feedbackDescriptionLike: feedbackDescription,
    ...otherParams
  }
}

export const searchApi = async (
  { current: pageNum, startTime, endTime, ...restParams },
  sorter
) => {
  const requestParams = {
    pageNum,
    startTime: startTime && dayjs(startTime).format("YYYY-MM-DD HH:mm:ss"),
    endTime: endTime && dayjs(endTime).format("YYYY-MM-DD HH:mm:ss"),
    ...getSearchParams(restParams)
  }
  if (sorter) {
    requestParams.sortField = sorter.field
    if (sorter.order) {
      requestParams.order =
        sorter.order === "descend" ? "DESC" : sorter.order === "ascend" ? "ASC" : ""
    }
  }
  const {
    list = [],
    totalCount = 0,
    realTotal = 0
  } = await fetchOptimizationOrdersList(requestParams)
  return {
    data: list,
    total: totalCount,
    realTotal
  }
}

/**
 * 导出调用日志
 * @param {*} data
 * @returns
 */
export const exportCallRecords = (data = {}, studioenv) => {
  return fetch(`${botPrefix}/admin/sessionResponse/export/OPTIMIZATION_ORDER`, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "X-Usercenter-Session": String(getTokenAndServiceName().token),
      ...(isStudio()
        ? {
            botno: data.botNo || undefined,
            studioenv: studioenv || "prd"
          }
        : {})
    }
  })
    .then((res) => {
      res.blob().then((blob) => {
        let link = document.createElement("a")
        link.href = window.URL.createObjectURL(blob)
        link.download = `调用日志-${dayjs().format("YYYY-MM-DD-HH:mm:ss")}.xlsx`
        link.click()
      })
      return true
    })
    .catch((e) => {
      console.log("下载失败:", e)
      return false
    })
}

export const exportOptimizationOrder = (data = {}, studioenv) => {
  return fetch(`${botPrefix}/admin/bot/optimizationOrder/export`, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "X-Usercenter-Session": String(getTokenAndServiceName().token),
      ...(isStudio()
        ? {
            botno: data.botNo || undefined,
            studioenv: studioenv || "prd"
          }
        : {})
    }
  })
    .then((res) => {
      res.blob().then((blob) => {
        let link = document.createElement("a")
        link.href = window.URL.createObjectURL(blob)
        link.download = `优化工单-${dayjs().format("YYYY-MM-DD-HH:mm:ss")}.xlsx`
        link.click()
      })
      return true
    })
    .catch((e) => {
      console.log("下载失败:", e)
      return false
    })
}

export const updateOptimizationStatus = (params) => {
  return Post(`${botPrefix}/optimization/updateStatus`, params).then((res) => res.data)
}

export const updateOptimizationPriority = (params) => {
  return Post(`${botPrefix}/optimization/priority/update`, params).then((res) => res.data)
}

export const updateOptimizationOrder = (params) => {
  return Put(`${botPrefix}/admin/optimizationOrder/update`, params).then((res) => res.data)
}

export const updateOptimizationFields = (params) => {
  return Put(`${botPrefix}/admin/bot/optimizationOrder/updateAssignFields`, params).then(
    (res) => res
  )
}
