import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  batchDetail,
  saveIntention,
  IntentionExtractResultReceive,
  IntentionListByPage,
  IntentionReferencelistByPage,
  IntentionOperationLogListByPage,
  IntentionreFerenceGetVoiceUrl
} from "./api"
import { QUERY_KEYS } from "@/constants/queryKeys"

// 获取批次详情
export const useFetchBatchExtractorDetail = (intentionId) => {
  return useQuery([QUERY_KEYS.BATCH_EXTRACTOR_DETAIL, intentionId], () => batchDetail(intentionId))
}

//保存意图
export const useFetchSaveIntention = () => {
  const queryClient = useQueryClient()
  return useMutation(saveIntention, {
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.BATCH_EXTRACTOR_SAVE])
    }
  })
}
//意图萃取结果接收
export const useFetchIntentionExtractResultReceive = (params) => {
  return useQuery([QUERY_KEYS.BATCH_EXTRACTOR_RESULT_RECEIVE, params], () =>
    IntentionExtractResultReceive(params)
  )
}

//萃取详情接口
export const useFetchIntentionListByPage = (params) => {
  const queryClient = useQueryClient()
  return useMutation(IntentionListByPage, {
    onSuccess: (v) => {
      console.log("v", v)
      queryClient.invalidateQueries([QUERY_KEYS.BATCH_EXTRACTOR_LISTBYPAGE])
    }
  })
}
//语料接口
export const useFetchIntentionReferencelistByPage = (params) => {
  return useQuery([QUERY_KEYS.BATCH_EXTRACTOR_REFERENCE_LISTBYPAGE, params], () =>
    IntentionReferencelistByPage(params)
  )
}
//操作历史接口
export const useFetchIntentionOperationLogListByPage = (params) => {
  return useQuery([QUERY_KEYS.BATCH_EXTRACTOR_REFERENCE_LISTBYPAGE, params], () =>
    IntentionOperationLogListByPage(params)
  )
}
//获取录音链接
export const useFetchIntentionreFerenceGetVoiceUrl = () => {
  const queryClient = useQueryClient()
  return useMutation(IntentionreFerenceGetVoiceUrl, {
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.BATCH_EXTRACTOR_INTENTION_FERENCE_GETVOICEURL])
    }
  })
}
