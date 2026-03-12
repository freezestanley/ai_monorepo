import { Get, Post, Put, Delete, Patch, Upload } from "@/api/server"
import { botPrefix } from "@/constants"

const prefix = botPrefix

export const fetchFormControlType = () => {
  return Get(`${prefix}/dictionary/formControlType`).then((res) => res.data)
}

export const fetchLlmModelType = () => {
  return Get(`${prefix}/dictionary/llmModelType`).then((res) => res.data)
}

export const fetchLlmFilterModelType = (botNo) => {
  return Get(`${prefix}/admin/llmConfig/list?botNo=${botNo}`).then((res) => res.data)
}

export const fetchChannelType = (botNo) => {
  return Get(`${prefix}/admin/apiAcl/list?botNo=${botNo}`).then((res) => res.data)
}

export const fetchOutputType = (nodeType) => {
  return Get(`${prefix}/dictionary/outputType?nodeType=${nodeType}`).then((res) => res.data)
}

export const fetchSkillStatus = () => {
  return Get(`${prefix}/dictionary/skillStatus`).then((res) => res.data)
}

export const fetchSkillType = () => {
  return Get(`${prefix}/dictionary/skillType`).then((res) => res.data)
}

export const fetchVariableType = () => {
  return Get(`${prefix}/dictionary/variableType`).then((res) => res.data)
}

export const fetchTools = () => {
  return Get(`${prefix}/common/tools`).then((res) => res.data)
}

export const fetchPictureModelType = () => {
  return Get(`${prefix}/dictionary/pictureModelType`).then((res) => res.data)
}

export const fetchUploadFile = (formData) => {
  return Upload(`${prefix}/admin/file/upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  }).then((res) => res.data)
}

export const searchEngineType = () => {
  return Get(`${prefix}/dictionary/searchEngineType`).then((res) => res.data)
}

export const webSearchEngineType = () => {
  return Get(`${prefix}/dictionary/webSearchEngineType`).then((res) => res.data)
}

export const fetchAudioModelScene = () => {
  return Get(`${prefix}/dictionary/audioModelScene`).then((res) => res.data)
}

export const fetchOptimizationPriority = () => {
  return Get(`${prefix}/dictionary/optimizationPriority`).then((res) => {
    return res.data || []
  })
}

export const fetchOptimizationStatus = () => {
  return Get(`${prefix}/dictionary/optimizationStatus`).then((res) => {
    return res.data || []
  })
}

export const fetchDictionaryTypeFacade = (dictionaryTypeFacade) => {
  return Get(`${prefix}/dictionary/${dictionaryTypeFacade}`).then((res) => {
    return res.data || []
  })
}

export const searchUser = (username) => {
  return Get(`${prefix}/admin/uc/user`, { username }).then((res) => res.data)
}

export const fetchCodeModePermission = () => {
  return Get(`${prefix}/admin/white/prompt/codeMode`).then((res) => res.data)
}

// 获取推理程度选项
export const fetchLlmReasoningEffort = () => {
  return Get(`${prefix}/dictionary/llmReasoningEffort`).then((res) => res.data)
}

// 获取rerank模型
export const fetchRerankModel = () => {
  return Get(`${prefix}/dictionary/rerankModel`).then((res) => res.data)
}

// 获取agent模式
export const fetchAgentMode = () => {
  return Get(`${prefix}/dictionary/agentMode`).then((res) => res.data)
}

// 获取llmResponseFormat
export const fetchLlmResponseFormat = () => {
  return Get(`${prefix}/dictionary/llmResponseFormat`).then((res) => res.data)
}

// 获取Gemini宽高比例
export const fetchGeminiAspectRatio = () => {
  return Get(`${prefix}/dictionary/geminiAspectRatio`).then((res) => res.data)
}

// 获取Gemini图片分辨率
export const fetchGeminiImageSize = () => {
  return Get(`${prefix}/dictionary/geminiImageSize`).then((res) => res.data)
}
// 获取videoGenerateMode
export const fetchVideoGenerateMode = () => {
  return Get(`${prefix}/dictionary/videoGenerateMode`).then((res) => res.data)
}
