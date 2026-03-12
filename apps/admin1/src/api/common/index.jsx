import { useQuery } from "@tanstack/react-query"
import {
  fetchFormControlType,
  fetchLlmModelType,
  fetchOutputType,
  fetchSkillStatus,
  fetchSkillType,
  fetchVariableType,
  fetchTools,
  fetchPictureModelType,
  searchEngineType,
  webSearchEngineType,
  fetchAudioModelScene,
  fetchChannelType,
  fetchOptimizationPriority,
  fetchOptimizationStatus,
  fetchLlmFilterModelType,
  searchUser,
  fetchCodeModePermission,
  fetchLlmReasoningEffort,
  fetchDictionaryTypeFacade,
  fetchRerankModel,
  fetchAgentMode,
  fetchLlmResponseFormat,
  fetchGeminiAspectRatio,
  fetchGeminiImageSize,
  fetchVideoGenerateMode
} from "./api"
import { QUERY_KEYS } from "@/constants/queryKeys"

// 表单组件类型列表
export const useFetchFormControlType = () => {
  return useQuery([QUERY_KEYS.FORM_CONTROL_TYPE], fetchFormControlType)
}

// 模型列表
export const useFetchLlmModelType = () => {
  return useQuery([QUERY_KEYS.CHAT_MODEL_LIST], fetchLlmModelType)
}

export const useFetchLlmFilterModelType = (botNo) => {
  return useQuery([QUERY_KEYS.CHAT_MODEL_LIST, botNo], () => fetchLlmFilterModelType(botNo))
}

// 访问渠道
export const useFetchChannelType = (botNo) => {
  return useQuery([QUERY_KEYS.CHAT_MODEL_LIST, botNo], () => fetchChannelType(botNo))
}

// 组件输出解析类型
export const useFetchOutputType = (params) => {
  return useQuery([QUERY_KEYS.OUTPUT_TYPE, params], () => fetchOutputType(params))
}

// 工作流状态
export const useFetchSkillStatus = () => {
  return useQuery([QUERY_KEYS.SKILL_STATUS], fetchSkillStatus)
}

// 工作流类型
export const useFetchSkillType = () => {
  return useQuery([QUERY_KEYS.SKILL_TYPE], fetchSkillType)
}

// 组件变量字段类型
export const useFetchVariableType = () => {
  return useQuery([QUERY_KEYS.VARIABLE_TYPE], fetchVariableType)
}

export const useFetchTools = () => {
  return useQuery([QUERY_KEYS.TOOL_TYPE], fetchTools)
}

export const useFetchPictureModelType = () => {
  return useQuery([QUERY_KEYS.PICTURE_MODEL_TYPE], fetchPictureModelType)
}

export const useSearchEngineType = () => {
  return useQuery([QUERY_KEYS.SEARCH_ENGINE_TYPE], searchEngineType)
}

export const useWebSearchEngineType = () => {
  return useQuery([QUERY_KEYS.WEB_SEARCH_ENGINE_TYPE], webSearchEngineType)
}

export const useFetchAudioModelScene = () => {
  return useQuery([QUERY_KEYS.AUDIO_MODEL_SCENE], fetchAudioModelScene)
}

// 修改优先级hook
export const useFetchOptimizationPriority = () => {
  return useQuery(["optimizationPriority"], () => fetchOptimizationPriority())
}

// 修改状态hook
export const useFetchOptimizationStatus = () => {
  return useQuery(["optimizationStatus"], fetchOptimizationStatus)
}

export const useSearchUser = (username) => {
  return useQuery(["userSearch", username], () => searchUser(username), {
    enabled: !!username,
    select: (data) =>
      data.map((user) => ({
        value: user.username,
        label: user.username
      }))
  })
}

// 代码模式权限
export const useFetchCodeModePermission = () => {
  return useQuery(["codeModePermission"], fetchCodeModePermission)
}

// 获取推理程度选项
export const useFetchLlmReasoningEffort = () => {
  return useQuery({
    queryKey: ["llmReasoningEffort"],
    queryFn: () => fetchLlmReasoningEffort()
  })
}
// ocr模型选择
export const useFetchDictionaryTypeFacade = (dictionaryTypeFacade) => {
  return useQuery(
    ["dictionaryTypeFacade", dictionaryTypeFacade],
    () => fetchDictionaryTypeFacade(dictionaryTypeFacade),
    {
      enabled: !!dictionaryTypeFacade
    }
  )
}

// 获取rerank模型
export const useFetchRerankModel = () => {
  return useQuery(["rerankModel"], fetchRerankModel)
}

// 获取agent模式
export const useFetchAgentMode = () => {
  return useQuery(["agentMode"], fetchAgentMode)
}

// 获取llmResponseFormat
export const useFetchLlmResponseFormat = () => {
  return useQuery(["llmResponseFormat"], fetchLlmResponseFormat)
}

// 获取Gemini宽高比例
export const useFetchGeminiAspectRatio = () => {
  return useQuery(["geminiAspectRatio"], fetchGeminiAspectRatio)
}

// 获取Gemini图片分辨率
export const useFetchGeminiImageSize = () => {
  return useQuery(["geminiImageSize"], fetchGeminiImageSize)
}
// 获取视频生成模式
export const useFetchVideoGenerateMode = () => {
  return useQuery(["videoGenerateMode"], fetchVideoGenerateMode)
}
