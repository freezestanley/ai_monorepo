import { getTokenAndServiceName } from "@/api/sso"
import { fetchCallLogsList } from "@/api/userFeedback/api"
import { botPrefix } from "@/constants"
import { message } from "antd"
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
    // @ts-ignore
    requestParams.sortField = sorter.field
    if (sorter.order) {
      // @ts-ignore
      requestParams.order =
        sorter.order === "descend" ? "DESC" : sorter.order === "ascend" ? "ASC" : ""
    }
  }
  const res = await fetchCallLogsList(requestParams)
  const { list = [], totalCount = 0, realTotal = 0 } = res?.data || {}
  if (!res.success && res.message) {
    message.error(res.message, 7, () => {})
  }
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
  // 写成fetch获取文件流,并且post
  return fetch(`${botPrefix}/admin/sessionResponse/export/CALL_RECORDS`, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "X-Usercenter-Session": getTokenAndServiceName().token,
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
        // 昵称为

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
