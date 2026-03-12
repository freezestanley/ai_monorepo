import React, { useState, useEffect, useMemo } from "react"
import { useLocation } from "react-router-dom"
import VoiceFlow from "./components/VoiceFlow"
import { useGetFlowConfigDetails } from "@/api/voiceAgent"
import { Spin } from "antd"
import queryString from "query-string"
import { useSSO } from "@/components/SSOProvider"

const Canvas = ({
  // Props 参数（优先级高于 URL 参数）
  taskId: propTaskId,
  botNo: propBotNo,
  taskName: propTaskName,
  agentNo: propAgentNo,
  flowType: propFlowType,
  locked = undefined,
  isEmbedded = false,
  refreshFlowConfig: propRefreshFlowConfig,
  // 新增：VoiceFlow 方法透传回调
  onVoiceFlowMethodsReady,
  // 新增：VoiceFlow 保存方法 ref
  voiceFlowSaveRef,
  // 新增：状态变化回调
  onDraftStatusChange,
  onAutoLayoutTipChange,
  isOnlyRead = false
}) => {
  // 获取URL参数
  const location = useLocation()
  const urlParams = queryString.parse(location.search)
  const { userInfo = {} } = useSSO()

  // 参数优先级：props > URL，使用 useMemo 优化性能
  const params = useMemo(
    () => ({
      taskId: propTaskId || urlParams.id,
      flowType: propFlowType || urlParams.flowType,
      botNo: propBotNo || urlParams.botNo,
      taskName: propTaskName || urlParams.taskName,
      status: urlParams.status, // status 只从 URL 获取，因为嵌入模式不需要
      agentNo: propAgentNo || urlParams.agentNo
    }),
    [propTaskId, propBotNo, propTaskName, propAgentNo, urlParams]
  )

  const { taskId, botNo, taskName, status, agentNo, flowType } = params
  const [flowConfig, setFlowConfig] = useState(null)

  // 获取画布历史节点
  const {
    refetch: refreshFlowConfig,
    data: flowConfigData,
    isLoading
  } = useGetFlowConfigDetails({
    taskId,
    botNo,
    agentNo
  })

  const refreshFlowConfigHandle = () => {
    if (taskId && botNo) {
      refreshFlowConfig()
    }
    // 如果有外部传入的刷新回调，也调用它
    if (propRefreshFlowConfig) {
      propRefreshFlowConfig()
    }
  }

  // 通过 props 暴露刷新方法给父组件
  useEffect(() => {
    if (propRefreshFlowConfig && typeof propRefreshFlowConfig === "function") {
      // 将刷新方法传递给父组件
      propRefreshFlowConfig(refreshFlowConfigHandle)
    }
  }, [refreshFlowConfig, taskId, botNo])

  // 处理获取的数据
  useEffect(() => {
    if (flowConfigData?.data) {
      // 测试，处理nodeCodes下面数据 position 全是 null
      flowConfigData?.data?.nodeCodes?.forEach((node) => {
        if (node.position && Object.keys(node.position).length === 0) {
          node.position = { x: null, y: null }
        }
      })

      setFlowConfig(flowConfigData.data)
    }
  }, [flowConfigData])

  return (
    <Spin spinning={isLoading} tip="加载中..." size="large">
      <div
        style={{
          height: isEmbedded ? "calc(100vh - 130px)" : "100vh",
          width: "100%"
        }}
      >
        {locked?.locked && locked?.lockInfo?.username !== userInfo.username && (
          <div>
            <div
              style={{
                height: isEmbedded ? "calc(100vh - 68px)" : "100vh",
                width: "100%"
              }}
              className="bg-[rgba(255,255,255,0.5)] absolute top-0 left-0 w-full flex items-center justify-center z-10 rounded-md"
            >
              <div className="text-center">
                <i className="iconfont icon-lock text-gray-400 text-[50px]"></i>
                <div className="text-gray-600 text-[16px] mt-[20px] w-full align-middle">
                  画布被锁定，无法编辑
                </div>
              </div>
            </div>
          </div>
        )}
        <VoiceFlow
          flowConfig={flowConfig}
          taskId={taskId}
          botNo={botNo}
          flowTypePro={flowType}
          agentNo={agentNo}
          taskName={taskName}
          status={status}
          refreshFlowConfig={refreshFlowConfigHandle}
          isEmbedded={isEmbedded}
          onSaveMethodReady={voiceFlowSaveRef}
          onDraftStatusChange={onDraftStatusChange}
          onAutoLayoutTipChange={onAutoLayoutTipChange}
          isOnlyRead={isOnlyRead}
        />
      </div>
    </Spin>
  )
}

export default Canvas
