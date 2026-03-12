import { useState } from "react"
import { message } from "antd"
import { updateFlowType } from "@/api/voiceAgent/api"

/**
 * 语音模式选择Hook
 * @returns {Object} 返回状态和方法
 */
export const useVoiceModeSelection = () => {
  const [showVoiceModeModal, setShowVoiceModeModal] = useState(false)
  const [isVoiceModeSelecting, setIsVoiceModeSelecting] = useState(false)
  const [isVoiceModeSelected, setIsVoiceModeSelected] = useState(false)

  /**
   * 检查并处理语音模式选择
   * @param {number|string} flowType - 流程类型
   */
  const checkAndHandleVoiceModeSelection = (flowType) => {
    if (flowType == 0 || flowType === "0") {
      // flowType为0表示未选择模式，显示模式选择弹窗
      setShowVoiceModeModal(true)
      setIsVoiceModeSelected(false)
      return "voice_intelligent_mode" // 临时返回Agentic
    } else {
      // 已选择模式，标记为已选择
      setIsVoiceModeSelected(true)

      // 根据flowType返回对应的模式
      if (flowType == 1 || flowType === "1") {
        return "voice_canvas_mode" // 画布模式
      } else if (flowType == 2 || flowType === "2") {
        return "voice_script_mode" // 剧本模式
      } else if (flowType == 3 || flowType === "3") {
        return "voice_intelligent_mode" // Agentic
      } else {
        return "voice_intelligent_mode" // 默认Agentic
      }
    }
  }

  /**
   * 创建处理语音模式选择确认的函数
   * @param {Object} agentDetail - Agent详情数据
   * @param {Function} setMode - 设置模式的函数
   * @param {Function} fetchLatestVersion - 重新获取最新版本的函数
   * @returns {Function} 处理函数
   */
  const createHandleVoiceModeSelection = (agentDetail, setMode, fetchLatestVersion) => {
    return async (selectedMode) => {
      setIsVoiceModeSelecting(true)

      try {
        // 根据选择的模式映射flowType
        let flowType = 3 // 默认Agentic
        if (selectedMode === "voice_canvas_mode") {
          flowType = 1 // 画布模式
        } else if (selectedMode === "voice_script_mode") {
          flowType = 2 // 剧本模式
        } else if (selectedMode === "voice_intelligent_mode") {
          flowType = 3 // Agentic
        }

        // 调用updateFlowType接口更新模式
        await updateFlowType({
          botNo: agentDetail?.botNo,
          agentNo: agentDetail?.agentNo,
          agentVersionNo: agentDetail?.versionNo,
          flowType
        })

        // 更新UI状态
        setMode(selectedMode)
        setIsVoiceModeSelected(true)
        setShowVoiceModeModal(false)

        message.success("语音模式选择成功")

        // 重新获取最新版本
        fetchLatestVersion()
      } catch (error) {
        console.error("更新语音模式失败:", error)
        message.error("更新语音模式失败，请重试")
      } finally {
        setIsVoiceModeSelecting(false)
      }
    }
  }

  return {
    // 状态
    showVoiceModeModal,
    isVoiceModeSelecting,
    isVoiceModeSelected,

    // 方法
    checkAndHandleVoiceModeSelection,
    createHandleVoiceModeSelection
  }
}
