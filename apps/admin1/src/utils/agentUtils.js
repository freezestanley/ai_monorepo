/**
 * Agent 相关的工具函数
 */

/**
 * 转换 Agent 类型：将前端的语音Agentic转换为后端需要的类型
 * @param {string} type - 前端的 agent 类型
 * @returns {string} - 后端需要的 agent 类型
 */
export const convertAgentTypeForSave = (type) => {
  // voice_intelligent_mode 需要转换为 single_agent_llm_mode
  if (type === "voice_intelligent_mode") {
    return "single_agent_llm_mode"
  }
  return type
}

/**
 * 转换 Agent 类型：将后端的类型转换为前端显示的类型
 * @param {string} type - 后端的 agent 类型
 * @param {number|string} agentMode - agent 模式 (2 表示语音模式)
 * @param {number|string} flowType - 语音流程类型 (1=画布, 2=剧本, 3=智能)
 * @returns {string} - 前端显示的 agent 类型
 */
export const convertAgentTypeForDisplay = (type, agentMode, flowType) => {
  // 如果是语音模式 (agentMode == 2)，根据 flowType 返回对应的语音模式
  if (agentMode == 2) {
    if (flowType == 1) {
      return "voice_canvas_mode"
    } else if (flowType == 2) {
      return "voice_script_mode"
    } else if (flowType == 3) {
      return "voice_intelligent_mode"
    } else {
      return "voice_intelligent_mode" // 默认Agentic
    }
  }

  // 非语音模式直接返回原类型
  return type
}
