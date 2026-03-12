/**
 * 变更检测工具
 * 用于检测组件中所有关键状态的变更
 */

import { useRef } from "react"

/**
 * 深度比较两个值是否相等
 * 支持对象、数组、基本类型的比较
 */
export const deepEqual = (a, b) => {
  if (a === b) return true

  if (typeof a !== typeof b) return false

  if (a === null || b === null) return a === b

  if (typeof a === "object") {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false
      return a.every((item, index) => deepEqual(item, b[index]))
    } else if (!Array.isArray(a) && !Array.isArray(b)) {
      const keysA = Object.keys(a)
      const keysB = Object.keys(b)

      if (keysA.length !== keysB.length) return false

      return keysA.every((key) => {
        if (!keysB.includes(key)) return false
        return deepEqual(a[key], b[key])
      })
    }
    return false
  }

  return false
}

/**
 * 检测组件状态的变更
 * @param {Object} currentState - 当前状态对象
 * @param {Object} originalState - 原始状态对象
 * @param {Array} stateKeys - 需要检测的状态键名数组
 * @returns {boolean} 是否有变更
 */
export const detectStateChanges = (currentState, originalState, stateKeys) => {
  if (!currentState || !originalState) return false

  return stateKeys.some((key) => {
    const currentValue = currentState[key]
    const originalValue = originalState[key]

    // 如果两个值都是 undefined，认为没有变化
    if (currentValue === undefined && originalValue === undefined) return false

    // 如果只有一个值是 undefined，认为有变化
    if (currentValue === undefined || originalValue === undefined) return true

    return !deepEqual(currentValue, originalValue)
  })
}

/**
 * 创建变更检测 Hook
 * @param {Object} agentDetail - Agent 详情数据
 * @param {Object} currentStates - 当前所有状态
 * @param {Array} stateKeys - 需要检测的状态键名
 * @returns {Function} 返回检测函数
 */
export const useChangeDetection = (agentDetail, currentStates, stateKeys) => {
  const getOriginalState = () => {
    if (!agentDetail) return {}

    return {
      markdownContent: agentDetail.prompt || "",
      selectedTools: agentDetail.pluginNos || [],
      selectedSkills: agentDetail.skillNos || [],
      knowledgeBases: agentDetail.knowledgeBases || [],
      conversationFlows: agentDetail.conversationFlows || [],
      selectedModel: agentDetail.model || "default",
      workSkillNos: agentDetail.workSkillNos || [],
      agentVars: agentDetail.vars || [],
      voiceConfig: {
        engine: "azure",
        voice: "xiaoxiao",
        language: "zh-CN",
        speed: 1.0,
        pitch: 1.0,
        volume: 80,
        enableASR: true,
        enableInterrupt: false,
        silenceTimeout: 3,
        customPrompts: ""
      }, // 默认语音配置
      mode: agentDetail.type || "single_agent_llm_mode",
      isNeedExecuteDefaultAgent: agentDetail.isNeedExecuteDefaultAgent ?? true,
      knowledgeBasesVoiceFaq: [], // 语音FAQ知识库
      variableConfigs: null, // 变量配置
      agentPromptConfig: null, // Agent提示配置
      voiceTaskId: null, // 语音任务ID
      flowInfo: null, // 流程信息
      voiceFlowType: null, // 语音流程类型
      stepInfos: [], // 步骤信息
      agentVersionNo: agentDetail.versionNo // 版本号
    }
  }

  const hasChanges = () => {
    const originalState = getOriginalState()
    return detectStateChanges(currentStates, originalState, stateKeys)
  }

  return hasChanges
}

/**
 * 获取 detail.jsx 组件中所有需要检测的状态键名
 */
export const getDetailComponentStateKeys = () => [
  "markdownContent",
  "selectedTools",
  "selectedSkills",
  "knowledgeBases",
  "conversationFlows",
  "selectedModel",
  "workSkillNos",
  "agentVars",
  "voiceConfig",
  "mode",
  "isNeedExecuteDefaultAgent",
  "knowledgeBasesVoiceFaq",
  "variableConfigs",
  "agentPromptConfig",
  "voiceTaskId",
  "flowInfo",
  "voiceFlowType",
  "stepInfos"
  // "agentVersionNo"
]
