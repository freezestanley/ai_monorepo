import { Get, Post, Put } from "@/api/server"
import { DEFAULTNAMESPACE, knowledgeExtractorPrefix } from "@/constants"
import { getTokenAndServiceName } from "../sso"
import { customDownload } from "@/utils"
import { infoInterceptors } from "../tools"
import moment from "moment"
const prefix = knowledgeExtractorPrefix

//知识萃取批次详情
export const batchDetail = (intentionId) => {
  return Get(`${prefix}/finance/intention/${intentionId}`).then((res) => res.data)
}
//意图审核保存
export const saveIntention = (params) => {
  return Post(`${prefix}/finance/intention/save`, params).then((res) => infoInterceptors(res).data)
}
//意图萃取结果接收
export const IntentionExtractResultReceive = (params) => {
  return Post(`${prefix}/finance/intention/extract/result/receive`, params).then((res) => res.data)
}
//萃取批次详情列表查询
export const IntentionListByPage = (params) => {
  return Post(`${prefix}/finance/intention/listByPage`, params).then((res) => res.data)
}
//语料接口
export const IntentionReferencelistByPage = (params) => {
  return Post(`${prefix}/finance/corpus/reference/listByPage`, params).then((res) => res.data)
}
//操作历史接口
export const IntentionOperationLogListByPage = (params) => {
  return Post(`${prefix}/finance/operationLog/listByPage`, params).then((res) => res.data)
}
//萃取批次详情导出
export const exportIntention = (data) => {
  // 写成fetch获取文件流,并且post
  return fetch(`${prefix}/finance/intention/export`, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "X-Usercenter-Session": getTokenAndServiceName().token
    }
  }).then((res) =>
    res.blob().then(async (blob) => {
      customDownload({
        blob,
        defaultFilename: moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
      })
    })
  )
}

//录音链接
export const IntentionreFerenceGetVoiceUrl = (params) => {
  return Post(`${prefix}/finance/corpus/reference/getVoiceUrl`, params).then((res) => res.data)
}
