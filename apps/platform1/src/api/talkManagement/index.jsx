import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  dialogueUsableSwitch,
  dialogueUsableQuery,
  dialogueUsableImport,
  dialogueUsableEdit,
  dialogueUsableCreate,
  listByDialogueId,
  fetchBatchSwitch,
  dialogueUsableDelete,
  fetchQueryTemplateCount,
  fetchEditBindWithDialogueAndTemplate,
  fetchListLogByPage
} from "./api"
import { QUERY_KEYS } from "@/constants/queryKeys"
export const useFetchDialogueUsableSwitch = () => {
  return useMutation(dialogueUsableSwitch)
}
export const useFetchDialogueUsableQuery = () => {
  return useMutation(dialogueUsableQuery)
}
export const useFetchDialogueUsableImport = () => {
  return useMutation(dialogueUsableImport)
}
export const useFetchDialogueUsableEdit = () => {
  return useMutation(dialogueUsableEdit)
}
export const useFetchDialogueUsableCreate = () => {
  return useMutation(dialogueUsableCreate)
}

export const useFetcListByDialogueId = (id) => {
  return useQuery([QUERY_KEYS.LIST_BY_DIALOGUE_ID, id], () => listByDialogueId(id), {
    enabled: !!id.templateId
  })
}

// 话术知识批量启用/禁用
export const useFetchBatchSwitchApi = () => {
  return useMutation(fetchBatchSwitch)
}

// 话术知识删除/批量删除
export const useFetchDialogueUsableDeleteApi = () => {
  return useMutation(dialogueUsableDelete)
}

// 查询话术关联模板
export const useFetchQueryTemplateCount = () => {
  return useMutation(fetchQueryTemplateCount)
}

// 编辑话术和模版绑定关系
export const useFetchEditBindWithDialogueAndTemplate = () => {
  return useMutation(fetchEditBindWithDialogueAndTemplate)
}

// 话术知识操作日志查询
export const useFetchListLogByPage = (params) => {
  return useQuery([QUERY_KEYS.LIST_LOG_BY_PAGE, params], () => fetchListLogByPage(params))
}
