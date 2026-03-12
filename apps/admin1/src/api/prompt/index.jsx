import { useQuery, useMutation } from "@tanstack/react-query"
import { fetchPromptDetail, savePromptDetail } from "./api"

// Prompt-查询详情
export const useFetchPromptDetail = (params) => {
  return useQuery(["promptDetail", params], () => fetchPromptDetail(params))
}

// Prompt-修改详情
export const useSavePromptDetail = () => {
  return useMutation(savePromptDetail)
}
