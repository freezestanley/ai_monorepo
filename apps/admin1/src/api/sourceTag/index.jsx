import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { batchSaveSourceTag, fetchSourceTag, fetchSourceTagPro } from "./api"
import { QUERY_KEYS } from "@/constants/queryKeys"
/**
 * 批量保存来源标签
 * post
 * batchSaveSourceTag
 */
export const useBatchSaveSourceTag = () => {
  const queryClient = useQueryClient()
  return useMutation(batchSaveSourceTag, {
    onSuccess: (res) => {
      res?.success && queryClient.invalidateQueries([QUERY_KEYS.SOURCE_TAG_LIST])
    }
  })
}

/**
 * 获取来源标签列表
 * post
 * fetchSourceTag
 */
export const useFetchSourceTag = () => {
  return useMutation(fetchSourceTag)
}

export const useFetchSourceTagList = (params) => {
  return useQuery([QUERY_KEYS.SOURCE_TAG_LIST, params], () => fetchSourceTagPro(params), {
    enabled: !!params.botNo
  })
}
