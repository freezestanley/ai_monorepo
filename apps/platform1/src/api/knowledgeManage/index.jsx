import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  fetchKnowledgeTemplateList,
  fetchListByParentAndType,
  fetchListByType,
  fetchAddKnowledgeTemplate,
  fetchEditKnowledgeTemplate,
  fetchQueryRelationDetail,
  fetchQueryDialogueUsable,
  fetchEditRelationDetail,
  fetchAddKnowledgeConfig,
  fetchKnowledgeConfigListAllByType,
  fetchExecuteKnowledgeTemplateApply,
  fetchKnowledgeTemplateApplyList,
  fetchKnowledgeTemplateApplyShowDiffer
} from "./api"
import { QUERY_KEYS } from "@/constants/queryKeys"

// 知识管理-查询知识模板列表
export const useFetchKnowledgeTemplateListApi = (params) => {
  return useQuery([QUERY_KEYS.KNOWLEDGE_TEMPLATE_LIST, params], () => {
    return fetchKnowledgeTemplateList({ ...params })
  })
}

// 知识管理-业务场景/意图层级
export const useFetchListByParentAndType = (params) => {
  // if(typeof params?.parentId==='string')return
  return useQuery(
    [QUERY_KEYS.LIST_BY_PARENT_AND_TYPE, params],
    () => fetchListByParentAndType(params),
    {
      enabled: !!(params.parentId && typeof params.parentId === "string" && params.botNo)
    }
  )
}

// 知识管理-业务场景/意图层级
export const useFetchListByType = (params) => {
  return useQuery([QUERY_KEYS.LIST_BY_TYPE, params], () => fetchListByType(params), {
    enabled: !!params.botNo
  })
}

// 知识管理-新增知识模板
export const useAddKnowledgeTemplateApi = () => {
  const queryClient = useQueryClient()
  return useMutation(fetchAddKnowledgeTemplate, {
    onSuccess: (res) => {
      res?.success && queryClient.invalidateQueries([QUERY_KEYS.KNOWLEDGE_TEMPLATE_LIST])
    }
  })
}

// 知识管理-编辑知识模板
export const useFetchEditKnowledgeTemplateApi = () => {
  const queryClient = useQueryClient()
  return useMutation(fetchEditKnowledgeTemplate, {
    onSuccess: (res) => {
      res?.success && queryClient.invalidateQueries([QUERY_KEYS.KNOWLEDGE_TEMPLATE_LIST])
    }
  })
}

// 知识管理-查询知识模板详情
export const useFetchQueryRelationDetailApi = (params) => {
  return useQuery([QUERY_KEYS.RELATION_DETAIL, params], () => fetchQueryRelationDetail(params), {
    enabled: !!(params.templateId && params.botNo)
  })
}

// 知识管理-查询可用意图
export const useFetchQueryDialogueUsableApi = (params) => {
  return useQuery([QUERY_KEYS.DIALOGUE_USABLE, params], () => fetchQueryDialogueUsable(params))
}

// 知识管理-修改知识模板关联详情
export const useFetchEditRelationDetailApi = () => {
  const queryClient = useQueryClient()
  return useMutation(fetchEditRelationDetail, {
    onSuccess: (res) => {
      res?.success && queryClient.invalidateQueries([QUERY_KEYS.RELATION_DETAIL])
    }
  })
}

// 知识管理-新增知识基础配置
export const useFetchAddKnowledgeConfigApi = () => {
  const queryClient = useQueryClient()
  return useMutation(fetchAddKnowledgeConfig, {
    onSuccess: (res) => {
      res?.success && queryClient.invalidateQueries([QUERY_KEYS.RELATION_DETAIL])
    }
  })
}

// 知识管理-查询基础设置
export const useFetchKnowledgeConfigListAllByTypeApi = (params) => {
  return useQuery(
    [QUERY_KEYS.KNOWLEDGE_CONFIG_LIST_BY_TYPE, params],
    () => fetchKnowledgeConfigListAllByType(params),
    { enabled: !!params.botNo }
  )
}

// 知识管理-申请同步
export const useFetchExecuteKnowledgeTemplateApplyApi = () => {
  const queryClient = useQueryClient()
  return useMutation(fetchExecuteKnowledgeTemplateApply, {
    onSuccess: (res) => {
      res?.success && queryClient.invalidateQueries([QUERY_KEYS.RELATION_DETAIL])
    }
  })
}

// 知识管理-申请记录查询
export const useFetchKnowledgeTemplateApplyListApi = (params) => {
  return useQuery(
    [QUERY_KEYS.KNOWLEDGE_TEMPLATE_APPLY_LIST, params],
    () => fetchKnowledgeTemplateApplyList(params),
    {
      enabled: !!params.templateId
    }
  )
}

// 知识管理-申请记录查询
export const useFetchKnowledgeTemplateApplyShowDifferApi = (params) => {
  return useQuery(
    [QUERY_KEYS.KNOWLEDGE_TEMPLATE_APPLY_SHOW_DIFFER, params],
    () => fetchKnowledgeTemplateApplyShowDiffer(params),
    {
      enabled: !!params.templateId
    }
  )
}
