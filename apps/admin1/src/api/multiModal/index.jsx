import { useQuery, useMutation, useQueryClient, QueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { message } from "antd"
import { fetchMultiModalLlmModelType, fetchModalType } from "./api"

// fetchMultiModalLlmModelType
export const useFetchMultiModalLlmModelType = (params) => {
  return useQuery([QUERY_KEYS.MULTI_MODAL_LLM_MODEL_TYPE], () =>
    fetchMultiModalLlmModelType(params)
  )
}

// fetchModalType
export const useFetchModalType = (params) => {
  return useQuery([QUERY_KEYS.MODAL_TYPE], () => fetchModalType(params))
}
