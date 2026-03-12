import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  addSkillOrPluginOrKnowledgeBase,
  debugGeneratingSkill,
  fetchQueryTools,
  fetchSessionMessages,
  fetchSkillDefinition,
  generateCodeChat,
  saveGeneratingSkillDef
} from "./api"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { message } from "antd"

/**
 * 获取历史会话
 */
export const useFetchSessionMessages = (params) => {
  return useQuery(
    [QUERY_KEYS.AI_CREATE_SESSION_MESSAGES, params],
    () => fetchSessionMessages(params),
    {
      enabled: !!params.skillVersionNo
    }
  )
}

/**
 * 【增C】保存智能创建工作流
 */
export const useSaveGeneratingSkillDef = () => {
  const queryClient = useQueryClient()
  return useMutation(saveGeneratingSkillDef, {
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.AI_CREATE_SKILL_DEFINITION])
    }
  })
}

/**
 * 拉取工作流定义内容
 */
export const useFetchSkillDefinition = (params) => {
  const queryClient = useQueryClient()
  return useQuery([QUERY_KEYS.AI_CREATE_SKILL_DEFINITION], () => fetchSkillDefinition(params), {
    enabled: !!params.skillNo,
    onSuccess: (data) => {
      queryClient.invalidateQueries([QUERY_KEYS.AI_CREATE_SESSION_MESSAGES])
    }
  })
}

/**
 * 使用useMutation请求生成CHAT
 */
export const useGenerateCodeChat = (params) => {
  return useMutation(generateCodeChat, params)
}

/**
 * 添加工作流/工具/知识库
 */
export const useAddSkillOrPluginOrKnowledgeBase = (params) => {
  return useMutation(addSkillOrPluginOrKnowledgeBase, params)
}

/**
 * 拉取AI创建Tools
 */
export const useFetchAICreateTools = (params, { enabled = true }) => {
  return useQuery([QUERY_KEYS.TOOL_LIST, params], () => fetchQueryTools(params), {
    enabled: !!params.skillNo && !!params.versionNo && enabled
  })
}

/**
 * 调试AI创建流程
 */
export const useDebugAIGeneratingSkill = (params) => {
  return useMutation(debugGeneratingSkill, params)
}
