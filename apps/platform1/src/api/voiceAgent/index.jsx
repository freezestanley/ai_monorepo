import { useQuery } from "@tanstack/react-query"
import {
  getVoiceAgentList,
  createOrUpdateVoiceAgent,
  getVoiceAgentDetail,
  getVoiceAgentDetails,
  updateVoiceAgentStatus,
  copyVoiceAgent,
  deleteVoiceAgent,
  getFlowConfigDetails,
  saveFlowConfig,
  createOrUpdateNodeConfig,
  getScriptList,
  getEventList,
  createOrUpdateEvent,
  deleteEvent,
  getScriptListByPage,
  updateFlowType,
  getNodeConfigDetails,
  getTagConfigList,
  createOrUpdateTagConfig
  // getScriptListV2
} from "./api"
import { QUERY_KEYS } from "@/constants/queryKeys"

/**
 * 获取语音 agent 列表
 */
export const useGetVoiceAgentList = (params) => {
  return useQuery([QUERY_KEYS.VOICE_AGENT_LIST, params], () => getVoiceAgentList(params), {
    keepPreviousData: true,
    enabled: !!params
  })
}

/**
 * 创建或更新语音模板
 */
export const useCreateOrUpdateVoiceAgent = () => {
  return createOrUpdateVoiceAgent
}

/**
 * 获取语音模板详情
 */
export const useGetVoiceAgentDetail = () => {
  return getVoiceAgentDetail
}

/**
 * 获取语音模板详情（支持agentNo参数）
 */
export const useGetVoiceAgentDetails = () => {
  return getVoiceAgentDetails
}

/**
 * 更新语音模板状态
 */
export const useUpdateVoiceAgentStatus = () => {
  return updateVoiceAgentStatus
}

/**
 * 复制语音模板
 */
export const useCopyVoiceAgent = () => {
  return copyVoiceAgent
}

/**
 * 删除语音模板
 */
export const useDeleteVoiceAgent = () => {
  return deleteVoiceAgent
}

/**
 * 获取画布历史节点
 */
export const useGetFlowConfigDetails = (params) => {
  return useQuery(
    [QUERY_KEYS.VOICE_AGENT_FLOW_CONFIG, params],
    () => getFlowConfigDetails(params),
    {
      enabled: !!params?.taskId && !!params?.botNo
    }
  )
}

/**
 * 保存画布配置
 */
export const useSaveFlowConfig = () => {
  return saveFlowConfig
}

/**
 * 创建或更新节点配置
 */
export const useCreateOrUpdateNodeConfig = () => {
  return createOrUpdateNodeConfig
}

/**
 * 获取话术列表
 */
export const useGetScriptList = (params, options = {}) => {
  return useQuery(
    [QUERY_KEYS.VOICE_AGENT_SCRIPT_LIST, params],
    () =>
      getScriptList({
        ...params
      }),
    {
      enabled: !!params?.botNo && !!params?.taskId,
      ...options
    }
  )
}

/**
 * 获取事件列表
 */
export const useGetEventList = (params, options = {}) => {
  return useQuery(
    [QUERY_KEYS.VOICE_AGENT_EVENT_LIST, params],
    () =>
      getEventList({
        ...params,
        pageSize: 10000,
        pageNum: 1,
        orderColumn: "gmt_created",
        orderType: "asc"
      }),
    {
      enabled: !!params?.botNo,
      ...options
    }
  )
}

/**
 * 创建或更新事件
 */
export const useCreateOrUpdateEvent = () => {
  return createOrUpdateEvent
}

/**
 * 删除事件
 */
export const useDeleteEvent = () => {
  return deleteEvent
}

/**
 * 获取话术列表（分页）
 */
export const useGetScriptListByPage = (params, options = {}) => {
  return useQuery([QUERY_KEYS.SCRIPT_LIST_BY_PAGE, params], () => getScriptListByPage(params), {
    keepPreviousData: true,
    enabled: !!params?.botNo,
    ...options
  })
}

/**
 * 更新语音模板类型
 */
export const useUpdateFlowType = () => {
  return updateFlowType
}

/**
 * 获取节点详情
 */
export const useGetNodeConfigDetails = (params, options = {}) => {
  return useQuery(
    [QUERY_KEYS.VOICE_AGENT_NODE_DETAILS, params],
    () => getNodeConfigDetails(params),
    {
      enabled: !!params?.nodeId && !!params?.botNo && !!params?.taskId,
      ...options
    }
  )
}

/**
 * 获取标签配置列表（业务类型/标签）
 */
export const useGetTagConfigList = (params, options = {}) => {
  return useQuery(
    [QUERY_KEYS.VOICE_AGENT_TAG_CONFIG_LIST, params],
    () => getTagConfigList(params),
    {
      enabled: !!params?.botNo && params?.type !== undefined,
      ...options
    }
  )
}

/**
 * 创建或更新标签配置（业务类型/标签）
 */
export const useCreateOrUpdateTagConfig = () => {
  return createOrUpdateTagConfig
}

/**
 * v2 => 话术列表
//  */
// export const useGetScriptListV2 = (params, options = {}) => {
//   return useQuery([QUERY_KEYS.VOICE_AGENT_SCRIPT_LIST_V2, params], () => getScriptListV2(params), {
//     enabled: !!params?.botNo && !!params?.taskId,
//     ...options
//   })
// }

export * from "./api"
