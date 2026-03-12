import React, { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { message, Spin, Form, notification, Skeleton } from "antd"
import { useSearchParams } from "react-router-dom"
import {
  getAgentLatestVersion,
  getAgentInUseVersion,
  saveAgentVersion,
  getAgentReleaseVersionByVersionNo
} from "@/api/agent/api"
import { convertAgentTypeForSave } from "@/utils/agentUtils"
import { useFetchMetaAgentModelList, useFetchAgentLockInfo } from "@/api/agent"
import { useDrawerManager } from "./hooks/useDrawerManager"
import "./detail.scss"
import PreviewAndDebug from "./components/PreviewAndDebugV2"
import PreviewAndDebugDrawer from "./components/PreviewAndDebugDrawer"
import PropertyConfigDrawer from "./components/PropertyConfigDrawer"
import SkillsAndKnowledgeV2 from "./components/SkillsAndKnowledgeV2"
import ConversationFlow from "./components/ConversationFlow"

import MateAgentContent from "./components/MateAgentContent"
// import MateAgentTrainingDrawer from "./components/MateAgentTrainingDrawer"
import VoiceCanvasMode from "./components/VoiceCanvasMode"
import VoiceModeSelectionModal from "./components/VoiceModeSelectionModal"
import { useVoiceModeSelection } from "./hooks/useVoiceModeSelection"
import VoiceDataPanel from "./components/VoiceDataPanel"
import Canvas from "../voice/canvas"

import DetailHeader from "./components/DetailHeader"
import DetailEditor from "./components/DetailEditor"
import VoiceDetailEditor from "./components/VoiceDetailEditor"
import DetailAgentMode from "./components/DetailAgentMode"
import DetailSkill from "./components/DetailSkill"
import CoreSwitch from "./components/CoreSwitch"
import { useFetchLlmFilterModelType } from "@/api/common"
import { useInitPublishData, useStudioPublishData } from "@/hooks/useStudioPublishData"

export const modeEnum = {
  dynamic_agent_core_mode: "Agentic", //single_agent_llm_mode: "Agentic",
  single_agent_skill_mode: "工作流模式",
  meta_agent_mode: "MetaAgent模式",
  // 语音类型专用模式
  voice_intelligent_mode: "Agentic",
  voice_canvas_mode: "画布模式",
  voice_script_mode: "剧本模式"
}

const AgentDetail = () => {
  const [searchParams] = useSearchParams()
  const agentNo = searchParams.get("agentNo")
  const queryBotNo = searchParams.get("botNo")
  const agentMode = searchParams.get("agentMode") // 2 => 语音 agent 模式，默认工作流模式
  const isShowDetail = searchParams.get("mode") === "showDetail"
  const isAgentCanRead = searchParams.get("agentCanRead") === "true"
  const originalAgentNo = searchParams.get("originalAgentNo")
  const isCanEditByCurrentUser = searchParams.get("isCanEditByCurrentUser")
  const studioenv = searchParams.get("studioenv")
  const [agentDetail, setAgentDetail] = useState(null)

  const botNo = useMemo(() => {
    return isShowDetail && agentDetail?.botNo ? agentDetail.botNo : queryBotNo
  }, [agentDetail?.botNo, isShowDetail, queryBotNo])

  const [loading, setLoading] = useState(false)
  // 添加组件数据加载状态
  const [componentsDataLoaded, setComponentsDataLoaded] = useState(false)
  // const [mode, setMode] = useState(agentMode == 2 ? "voice_canvas_mode" : "dynamic_agent_core_mode")
  const [mode, setMode] = useState(
    agentMode == 4
      ? "meta_agent_mode"
      : agentMode == 2
        ? "voice_intelligent_mode"
        : "dynamic_agent_core_mode"
  )
  const [markdownContent, setMarkdownContent] = useState("")
  const [selectedTools, setSelectedTools] = useState([])
  const [selectedSkills, setSelectedSkills] = useState([])
  const [knowledgeBases, setKnowledgeBases] = useState([])
  const [sops, setSops] = useState([])
  const [conversationFlows, setConversationFlows] = useState([])
  const [lastSavedTime, setLastSavedTime] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedModel, setSelectedModel] = useState("default")
  const [workSkillNos, setWorkSkillNos] = useState([])
  const { data: modelList = [] } = useFetchLlmFilterModelType(botNo)
  const [agentVars, setAgentVars] = useState([])
  const [voiceConfig, setVoiceConfig] = useState({
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
  })
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isDebugSuccessful, setIsDebugSuccessful] = useState(false)
  const [releaseForm] = Form.useForm()
  const [voiceForm] = Form.useForm()
  const [selectedSkill, setSelectedSkill] = useState(null)
  const [releaseNewStatus, setReleaseNewStatus] = useState(null)
  const [isNeedExecuteDefaultAgent, setIsNeedExecuteDefaultAgent] = useState(true)
  const [voiceRefreshKey, setVoiceRefreshKey] = useState(0)
  const voiceAgentTab = searchParams.get("agentTab")
  const voiceReportFlag = localStorage.getItem("aigc_voice_agent_report") === "true"
  const activeVoiceTab = useMemo(() => {
    if (agentMode != 2) return "arrangement"
    if (voiceAgentTab === "data") return "data"
    if (voiceAgentTab === "arrangement") return "arrangement"
    return voiceReportFlag ? "data" : "arrangement"
  }, [agentMode, voiceAgentTab, voiceReportFlag])

  const [knowledgeBasesVoiceFaq, setKnowledgeBasesVoiceFaq] = useState([])

  // 记录语音-通话详情数据
  const [variableConfigs, setvariableConfigs] = useState(null)
  const [agentPromptConfig, setAgentPromptConfig] = useState(null)
  const [voiceTaskId, setVoiceTaskId] = useState(null)
  const [flowInfo, setFlowInfo] = useState(null)
  const [voiceFlowType, setVoiceFlowType] = useState(null) // 新增：语音流程类型

  const [stepInfos, setStepInfos] = useState([])

  // 核心切换状态
  const [currentCore, setCurrentCore] = useState("claude")
  const [runtimeCore, setRuntimeCore] = useState("claude_compatibility_core")
  const coreUiToBackend = {
    claude: "claude_compatibility_core",
    coze: "coze_compatibility_core"
  }
  const coreBackendToUi = {
    claude_compatibility_core: "claude",
    coze_compatibility_core: "coze"
  }

  const [agentVersionNo, setAgentVersionNo] = useState(undefined)

  // 创建语音组件的 ref
  const voiceSettingsPanelRef = useRef(null) // 用于 voice_intelligent_mode
  const voiceCanvasModeRef = useRef(null) // 用于 voice_canvas_mode 和 voice_script_mode
  const canvasRefreshRef = useRef(null) // 用于存储 Canvas 的刷新方法

  // VoiceFlow 相关状态管理
  const voiceFlowSaveHandlerRef = useRef(null)
  const [voiceFlowSaveLoading, setVoiceFlowSaveLoading] = useState(false)
  const [voiceFlowIsDraft, setVoiceFlowIsDraft] = useState(false)
  const [voiceFlowShowAutoLayoutTip, setVoiceFlowShowAutoLayoutTip] = useState(false)
  const [previewDrawerVisible, setPreviewDrawerVisible] = useState(false)
  const [propertyConfigDrawerVisible, setPropertyConfigDrawerVisible] = useState(false)
  const [debugPanelVisible, setDebugPanelVisible] = useState(false) // 调试面板显示状态

  // 获取版本发布配置数据
  useInitPublishData()
  const { isPublishDisabled, isOpenVersion } = useStudioPublishData()

  // 使用抽屉管理Hook
  const { closeAllDrawers, openDrawer } = useDrawerManager(
    previewDrawerVisible,
    propertyConfigDrawerVisible,
    setPreviewDrawerVisible,
    setPropertyConfigDrawerVisible
  )

  // 打开预览调试抽屉时关闭其他抽屉
  const handleOpenPreviewDrawer = () => {
    openDrawer("PreviewAndDebugDrawer")
  }

  // 打开属性配置抽屉时关闭其他抽屉
  const handleOpenPropertyConfigDrawer = () => {
    openDrawer("PropertyConfigDrawer", refreshReleaseStatus, agentNo)
  }

  useEffect(() => {
    if (activeVoiceTab === "data") {
      closeAllDrawers()
    }
  }, [activeVoiceTab, closeAllDrawers])

  // VoiceFlow 草稿状态变化回调
  const handleVoiceFlowDraftStatusChange = useCallback((isDraft) => {
    setVoiceFlowIsDraft(isDraft)
    console.log("VoiceFlow 草稿状态变化:", isDraft)
  }, [])

  // VoiceFlow 自动布局提示状态变化回调
  const handleVoiceFlowAutoLayoutTipChange = useCallback((showTip) => {
    setVoiceFlowShowAutoLayoutTip(showTip)
    console.log("VoiceFlow 自动布局提示状态变化:", showTip)
  }, [])

  // VoiceFlow 保存方法回调，用于接收 VoiceFlow 组件暴露的保存方法
  const handleVoiceFlowSaveMethodReady = useCallback(
    (saveMethod) => {
      if (isPublishDisabled) return
      voiceFlowSaveHandlerRef.current = saveMethod
      console.log("VoiceFlow 保存方法已准备就绪")
    },
    [isPublishDisabled]
  )

  // VoiceFlow 保存方法
  const handleVoiceFlowSave = useCallback(async () => {
    if (voiceFlowSaveHandlerRef.current) {
      setVoiceFlowSaveLoading(true)

      try {
        await voiceFlowSaveHandlerRef.current()
        console.log("VoiceFlow 保存成功")
      } catch (error) {
        console.error("VoiceFlow 保存失败:", error)
        throw error
      } finally {
        setVoiceFlowSaveLoading(false)
      }
    } else {
      console.warn("VoiceFlow 保存方法尚未准备就绪")
    }
  }, [])

  // 使用语音模式选择Hook
  const {
    showVoiceModeModal,
    isVoiceModeSelecting,
    isVoiceModeSelected,
    checkAndHandleVoiceModeSelection,
    createHandleVoiceModeSelection
  } = useVoiceModeSelection()

  const { data: metaAgentModelList, isLoading: isMetaAgentModelListLoading } =
    useFetchMetaAgentModelList({
      botNo
    })

  const { data: lockData } = useFetchAgentLockInfo({
    botNo,
    agentNo
  })

  // 获取最新版本
  const fetchLatestVersion = async (type = "", versionNo = "") => {
    if (!agentNo) return
    setLoading(true)
    try {
      // type === "insetCurrentVersion" // 载入历史版本
      const apiFetch =
        type === "insetCurrentVersion" // 载入历史版本
          ? getAgentReleaseVersionByVersionNo
          : isShowDetail
            ? getAgentInUseVersion
            : getAgentLatestVersion
      let response = null
      if (type === "insetCurrentVersion") {
        // 载入历史版本
        response = await apiFetch({ agentNo, versionNo })
      } else {
        response = await apiFetch(agentNo, metaAgentModelList?.[0])
      }
      if (response.success) {
        setAgentDetail(response.data)
        setAgentVersionNo(response?.data.versionNo)
        setMarkdownContent(response.data.prompt || "")
        setSelectedTools(response.data.pluginNos || [])
        setSelectedSkills(response.data.skillNos || [])
        setKnowledgeBases(response.data.knowledgeBases || [])
        setSops(response.data.sops || [])
        // 初始化 runtimeCore 与 UI 核心
        if (response.data.runtimeCore) {
          setRuntimeCore(response.data.runtimeCore)
          setCurrentCore(coreBackendToUi[response.data.runtimeCore] || "claude")
        }
        setWorkSkillNos(response.data.workSkillNos || [])
        setAgentVars(response.data.vars || [])
        setIsNeedExecuteDefaultAgent(response.data.isNeedExecuteDefaultAgent)

        // 设置模型
        if (response.data.model) {
          setSelectedModel(response.data.model)
        }

        // 设置对话流
        if (response.data.conversationFlows) {
          setConversationFlows(response.data.conversationFlows)
        }
        // 设置模式
        if (response.data.type) {
          // 如果是语音 agent 模式(agentMode=2)，则需要根据语音详情的flowType设置模式
          if (agentMode == 2) {
            // 需要调用语音详情接口获取flowType来确定具体的语音模式
            try {
              const { getVoiceAgentDetails } = await import("@/api/voiceAgent/api")
              const voiceDetailRes = await getVoiceAgentDetails({
                agentNo: response.data.agentNo,
                botNo: botNo
              })

              if (voiceDetailRes && voiceDetailRes.status === 200 && voiceDetailRes.data) {
                const flowType = voiceDetailRes.data.flowType
                setvariableConfigs(voiceDetailRes.data.variableConfigs)
                setVoiceTaskId(voiceDetailRes.data.taskId)
                setFlowInfo(voiceDetailRes.data.flowInfo || null)
                setAgentPromptConfig(voiceDetailRes.data.agentPromptConfig)
                setVoiceFlowType(flowType) // 存储 flowType

                // 使用Hook处理语音模式选择逻辑
                const selectedMode = checkAndHandleVoiceModeSelection(flowType)
                setMode(selectedMode)

                // 如果 是语音画布和剧本模式时候，如果 详情没有返回 timbreCode 自动打开属性配置抽屉
                if (
                  !voiceDetailRes.data.timbreCode &&
                  voiceDetailRes?.data?.flowType != 3 &&
                  mode === "voice_intelligent_mode" &&
                  voiceDetailRes?.data?.flowType != 0
                ) {
                  handleOpenPropertyConfigDrawer()
                }
              } else {
                // 如果获取语音详情失败，默认使用Agentic
                const selectedMode = checkAndHandleVoiceModeSelection(3) // 默认Agentic
                setMode(selectedMode)
              }
            } catch (error) {
              console.error("获取语音详情失败:", error)
              // 如果获取语音详情失败，默认使用Agentic
              setMode("voice_intelligent_mode")
            }
          } else if (agentMode == 4) {
            setMode("meta_agent_mode")
          } else {
            setMode("dynamic_agent_core_mode")
            // setMode(response.data.type)
          }
        }

        // 更新语音设置刷新key，触发VoiceSettingsPanel重新获取详情
        if (agentMode == 2) {
          setVoiceRefreshKey((prev) => prev + 1)
        }
      } else {
        response.message && message.error(response.message)
      }
    } catch (error) {
      console.error("Failed to fetch agent:", error)
      message.error("获取Agent失败")
    } finally {
      setLoading(false)
      // 设置组件数据已加载完成
      setComponentsDataLoaded(true)
    }
  }

  // 创建语音模式选择处理函数
  const handleVoiceModeSelection = createHandleVoiceModeSelection(
    agentDetail,
    setMode,
    fetchLatestVersion
  )

  // 处理工具授权变更
  const handleToolApproveChange = useCallback(() => {
    fetchLatestVersion()
  }, [agentNo, JSON.stringify(metaAgentModelList)])

  // 刷新releaseStatus状态
  const refreshReleaseStatus = async (agentNo, isAttributes = null) => {
    if (!agentNo) return
    try {
      const apiFetch = isShowDetail ? getAgentInUseVersion : getAgentLatestVersion
      const response = await apiFetch(agentNo, metaAgentModelList?.[0])
      if (response.success) {
        // 只更新发布状态，不影响其他状态
        setReleaseNewStatus(response.data.releaseStatus)
        setAgentVersionNo(response?.data.versionNo)

        // 如果是语音画布打开属性配置按钮，重新设置新的 knowledgeBases
        isAttributes &&
          setAgentDetail((p) => ({
            ...p,
            knowledgeBases: response.data.knowledgeBases
          }))
      } else {
        response.message && message.error(response.message)
      }
    } catch (error) {
      console.error("Failed to refresh release status:", error)
    }
  }

  useEffect(() => {
    !isMetaAgentModelListLoading && fetchLatestVersion()
  }, [agentNo, isMetaAgentModelListLoading])

  // 检测未保存的更改
  useEffect(() => {
    if (agentDetail) {
      // 简单检查是否有未保存的更改
      const originalPrompt = agentDetail.prompt || ""
      const hasChanges = originalPrompt !== markdownContent
      setHasUnsavedChanges(hasChanges)
    }
  }, [agentDetail, markdownContent])

  // 保存函数
  const handleSave = useCallback(
    async (
      isMsg = false,
      {
        pluginNos,
        skillNos,
        knowledgeBases: newKnowledgeBases,
        workSkillNos = [],
        isNeedExecuteAgent,
        sops: newSops
      } = {},
      content,
      type,
      model,
      isVoice = false
    ) => {
      // TODO 取消自动保存，变成提示用户记得保存
      if (!isMsg) {
        return false
      }
      // 如果是语音Agentic，禁止保存原 agent 保存接口
      if (agentMode == 2 && mode === "voice_intelligent_mode") return false
      if (!agentDetail) return
      if (!isMsg && lockData?.locked) isMsg = true
      try {
        // 处理type转换：voice_intelligent_mode 需要转换为 dynamic_agent_core_mode
        const currentType = type || mode
        let convertedType = convertAgentTypeForSave(currentType)
        // 如果是语音 agent 模式(agentMode=2)，则需要转换为 dynamic_agent_core_mode
        if (agentMode == 2) {
          convertedType = "dynamic_agent_core_mode"
        }

        const payload = {
          agentNo: agentDetail.agentNo,
          versionNo: agentDetail.versionNo,
          prompt: content,
          pluginNos: pluginNos || selectedTools,
          skillNos: skillNos || selectedSkills,
          knowledgeBases: newKnowledgeBases || knowledgeBases,
          vars: agentVars.map(({ varNo, isNew, ...rest }) => rest) || [],
          type: convertedType,
          model: model || selectedModel,
          runtimeCore: runtimeCore,
          agentMode: "7", //agentMode || undefined,
          voiceTemplateNo: agentMode == 2 ? workSkillNos[0] || undefined : undefined,
          isNeedExecuteDefaultAgent:
            mode === "meta_agent_mode"
              ? (isNeedExecuteAgent ?? isNeedExecuteDefaultAgent)
              : undefined,
          sops: newSops || sops
        }

        // Only include workSkillNo in workflow mode
        if (type === "single_agent_skill_mode") {
          payload.workSkillNos = workSkillNos && workSkillNos.length ? workSkillNos : []
          payload.conversationFlows = conversationFlows
        }

        const response = await saveAgentVersion(payload)
        if (response.success) {
          isMsg && !isVoice && message.success("保存成功")
          typeof isNeedExecuteAgent === "boolean" &&
            setIsNeedExecuteDefaultAgent(isNeedExecuteAgent)
          setLastSavedTime(new Date())
          setHasUnsavedChanges(false)
        } else {
          isMsg && !isVoice && message.error(response.message || "保存失败")
        }
      } catch (error) {
        console.error("Failed to save agent:", error)
        isMsg && !isVoice && message.error("保存失败")
      } finally {
        setIsSaving(false)
      }
    },
    [
      lockData,
      agentDetail,
      selectedTools,
      selectedSkills,
      knowledgeBases,
      agentVars,
      mode,
      selectedModel,
      agentMode,
      conversationFlows,
      isNeedExecuteDefaultAgent,
      runtimeCore,
      sops
    ]
  )

  // 处理工具和工作流的更新
  const handleSkillsAndToolsUpdate = useCallback(
    ({ pluginNos, skillNos, knowledgeBases: newKnowledgeBases, sops: newSops }) => {
      // 检查是否有实际变化
      const hasToolsChanged = JSON.stringify(pluginNos) !== JSON.stringify(selectedTools)
      const hasSkillsChanged = JSON.stringify(skillNos) !== JSON.stringify(selectedSkills)
      const hasKnowledgeChanged =
        JSON.stringify(newKnowledgeBases) !== JSON.stringify(knowledgeBases)
      const hasSopsChanged = JSON.stringify(newSops || []) !== JSON.stringify(sops || [])

      if (hasToolsChanged || hasSkillsChanged || hasKnowledgeChanged || hasSopsChanged) {
        setSelectedTools(pluginNos)
        setSelectedSkills(skillNos)
        setKnowledgeBases(newKnowledgeBases)
        if (hasSopsChanged) setSops(newSops || [])
        handleSave(
          false,
          { workSkillNos, skillNos, pluginNos, knowledgeBases: newKnowledgeBases, sops: newSops },
          markdownContent,
          mode,
          selectedModel
        )
      }
    },
    [
      selectedTools,
      selectedSkills,
      knowledgeBases,
      sops,
      handleSave,
      markdownContent,
      mode,
      selectedModel,
      workSkillNos
    ]
  )

  useEffect(() => {
    setReleaseNewStatus(agentDetail?.releaseStatus)
  }, [agentDetail?.releaseStatus])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    )
  }

  return !componentsDataLoaded ? (
    <div className="flex items-center justify-center min-h-screen p-10">
      <Skeleton className="w-[50%]"></Skeleton>
    </div>
  ) : (
    <div className="min-h-screen bg-[#EFF1F4]">
      {/* Header */}
      <div className="aigc-shell-container fixed top-0 left-0 w-full bg-[#EFF1F4] z-10">
        <DetailHeader
          botNo={botNo}
          isCanEditByCurrentUser={isCanEditByCurrentUser === "true" ? true : false}
          agentMode={agentMode}
          lockData={lockData} //
          agentDetail={agentDetail}
          selectedSkills={selectedSkills}
          selectedTools={selectedTools}
          knowledgeBases={
            knowledgeBasesVoiceFaq && knowledgeBasesVoiceFaq?.length
              ? knowledgeBasesVoiceFaq || []
              : knowledgeBases
          }
          workSkillNo={workSkillNos}
          hasUnsavedChanges={hasUnsavedChanges}
          markdownContent={markdownContent}
          selectedSkill={selectedSkill}
          mode={mode}
          selectedModel={selectedModel}
          handleSave={async (...args) => {
            await handleSave(...args)
            if (agentMode == 1) {
              // 保存后调用 调用 状态接口
              refreshReleaseStatus(agentNo)
            }
          }}
          setIsDebugSuccessful={setIsDebugSuccessful}
          isSaving={isSaving}
          setIsSaving={setIsSaving}
          releaseNewStatus={releaseNewStatus}
          isOnlyRead={isShowDetail}
          originalAgentNo={originalAgentNo !== "undefined" ? originalAgentNo : undefined}
          fetchLatestVersion={(type = "", versionNo = "") => {
            if (type === "insetCurrentVersion") {
              // 载入历史版本 == getAgentReleaseVersionByVersionNo
              fetchLatestVersion(type, versionNo)
            } else {
              fetchLatestVersion()
            }
          }}
          voiceRef={
            mode === "voice_intelligent_mode"
              ? voiceSettingsPanelRef
              : mode === "voice_canvas_mode" || mode === "voice_script_mode"
                ? voiceCanvasModeRef
                : null
          }
          activeTab={activeVoiceTab}
          // 新增：嵌入模式相关参数
          isEmbedded={mode === "voice_canvas_mode" || mode === "voice_script_mode"}
          voiceFlowTaskId={voiceTaskId}
          voiceFlowTaskName={agentDetail?.agentName}
          voiceFlowIsDraft={voiceFlowIsDraft}
          voiceFlowShowAutoLayoutTip={voiceFlowShowAutoLayoutTip}
          onVoiceFlowSave={handleVoiceFlowSave}
          onVoiceFlowImport={null}
          onVoiceFlowExport={null}
          voiceFlowSaveLoading={voiceFlowSaveLoading}
          flowType={voiceFlowType}
          setCurrentFlowConfig={(status) => {
            // 当导入成功时，刷新 Canvas 画布
            if (status === "success" && canvasRefreshRef.current) {
              canvasRefreshRef.current()
            }
          }}
          // PreviewAndDebugDrawer 相关参数
          previewDrawerVisible={previewDrawerVisible}
          setPreviewDrawerVisible={handleOpenPreviewDrawer}
          // PropertyConfigDrawer 相关参数
          propertyConfigDrawerVisible={propertyConfigDrawerVisible}
          setPropertyConfigDrawerVisible={handleOpenPropertyConfigDrawer}
          flowInfo={flowInfo || null} // 头部节点数量
          isPublishDisabled={isPublishDisabled}
          isOpenVersion={isOpenVersion}
          isV2={true}
        />
      </div>
      <div className="pt-[65px] px-[5px]">
        {/* 语音数据面板 */}
        {activeVoiceTab === "data" ? (
          <VoiceDataPanel
            botNo={botNo}
            agentDetail={agentDetail}
            agentNo={agentNo}
            taskId={voiceTaskId}
            isOnlyRead={isPublishDisabled}
          />
        ) : mode === "voice_canvas_mode" || mode === "voice_script_mode" ? (
          //
          // 当语音是画布模式和剧本模式，直接显示画布组件
          <Canvas
            taskId={voiceTaskId}
            botNo={botNo}
            taskName={agentDetail?.agentName}
            agentNo={agentNo}
            isEmbedded={true}
            flowType={voiceFlowType}
            locked={lockData} // 锁定传入
            voiceFlowSaveRef={handleVoiceFlowSaveMethodReady}
            onDraftStatusChange={handleVoiceFlowDraftStatusChange}
            onAutoLayoutTipChange={handleVoiceFlowAutoLayoutTipChange}
            isOnlyRead={isPublishDisabled}
            refreshFlowConfig={(refreshMethod) => {
              // 存储刷新方法到 ref 中
              canvasRefreshRef.current = refreshMethod
              console.log("Canvas 刷新方法已准备就绪")
            }}
          />
        ) : (
          <>
            {/* Sub Header */}
            <div className="flex items-center justify-between h-[calc(100vh-68px)] overflow-hidden">
              <div className="flex gap-[8px] w-full h-full relative">
                <div
                  className={`bg-white rounded-[8px] transition-all  duration-300 ease-in-out ${
                    debugPanelVisible
                      ? "w-[34%]"
                      : mode === "dynamic_agent_core_mode" || mode === "voice_intelligent_mode"
                        ? "w-[50%]"
                        : "w-[50%]"
                  }`}
                >
                  <div className="flex items-center justify-between px-[20px] py-[11.3px]">
                    <div className="flex items-center">
                      <span className="text-[#181B25] text-[16px] font-[500]">
                        {agentMode == 2 && activeVoiceTab === "data" ? "数据" : "编排"}
                      </span>
                    </div>

                    {/* agent 核心切换 */}
                    <CoreSwitch
                      initialCore={currentCore}
                      onCoreChange={(newCore) => {
                        setCurrentCore(newCore)
                        setRuntimeCore(coreUiToBackend[newCore] || "claude_compatibility_core")
                        console.log("核心已切换至:", newCore, "=>", coreUiToBackend[newCore])
                        // 这里可以添加切换核心后的其他逻辑，比如重新加载数据等
                      }}
                      disabled={isPublishDisabled || isShowDetail}
                    />
                    {/* {mode !== "voice_intelligent_mode" && (
                      <div className="flex items-center space-x-2">
                        {!["single_agent_skill_mode", "meta_agent_mode"].includes(mode) && (
                          <DetailSkill
                            modelList={modelList}
                            selectedModel={selectedModel}
                            agentDetail={agentDetail}
                            onDropClick={({ key }, filteredModelList) => {
                              const selectedModel = filteredModelList?.find(
                                (model) => model.code === key
                              )
                              if (selectedModel?.supportToolCall) {
                                setSelectedModel(key)
                                if (agentDetail) {
                                  handleSave(
                                    false,
                                    { workSkillNos, knowledgeBases: knowledgeBases },
                                    markdownContent,
                                    mode,
                                    key
                                  )
                                }
                              }
                            }}
                            setSelectedModel={setSelectedModel}
                            isOnlyRead={isPublishDisabled || isShowDetail}
                          />
                        )}
                      </div>
                    )} */}
                  </div>
                  <div className="h-[1px] bg-[#E4E7EC]"></div>

                  <div className="max-h-[calc(100vh-130px)] overflow-y-auto">
                    {isShowDetail && !isAgentCanRead ? (
                      <div className="text-[#777] text-[18px] w-[100%] flex items-center justify-center h-[calc(100vh-68px)]">
                        Agent详情未开放
                      </div>
                    ) : (
                      <div className="flex w-[100%]">
                        {/* Left Content - 角色与逻辑回复 */}
                        {[
                          "dynamic_agent_core_mode",
                          "meta_agent_mode",
                          "voice_intelligent_mode"
                        ].includes(mode) &&
                          (mode === "voice_intelligent_mode" ? (
                            <VoiceDetailEditor
                              agentPromptConfig={agentPromptConfig}
                              onOptimizeSubmit={({ type, content }) => {
                                if (type === "agent") {
                                  setMarkdownContent(content)
                                  handleSave(
                                    false,
                                    { workSkillNos, knowledgeBases: knowledgeBases },
                                    content,
                                    mode,
                                    selectedModel
                                  )
                                }
                              }}
                              onStepInfosChange={(newStepInfos) => {
                                setStepInfos(newStepInfos)
                              }}
                              markdownContent={markdownContent}
                              setMarkdownContent={setMarkdownContent}
                              agentNo={agentNo}
                              disabled={isPublishDisabled || isShowDetail}
                              form={voiceForm}
                              globalData={agentVars}
                              multiModalTypeList={modelList}
                            />
                          ) : (
                            <div className="w-[100%]">
                              <div className="max-h-[calc(50vh - 200px)] px-[15px] pl-[5px]">
                                <DetailEditor
                                  onOptimizeSubmit={({ type, content }) => {
                                    if (type === "agent") {
                                      setMarkdownContent(content)
                                      handleSave(
                                        false,
                                        { workSkillNos, knowledgeBases: knowledgeBases },
                                        content,
                                        mode,
                                        selectedModel
                                      )
                                    }
                                  }}
                                  onEditorBlur={(e) => {
                                    handleSave(
                                      false,
                                      { workSkillNos, knowledgeBases: knowledgeBases },
                                      e.target.value,
                                      mode,
                                      selectedModel
                                    )
                                  }}
                                  markdownContent={markdownContent}
                                  setMarkdownContent={setMarkdownContent}
                                  agentNo={agentNo}
                                  disabled={isPublishDisabled || isShowDetail}
                                  isV2={true}
                                />
                              </div>
                              <div className="h-[1px] bg-[#E4E7EC]"></div>
                              {/* Middle Content - 优化区域 */}
                              {/* min-w-[300px] py-[20px] */}
                              {/* max-h-[calc(50vh)] overflow-y-auto */}
                              <div
                                className={`flex-1 mt-[40px] ${mode === "dynamic_agent_core_mode" || mode === "voice_intelligent_mode" || mode === "voice_canvas_mode" || mode === "voice_script_mode" ? "w-[100%] pr-[15px] pl-[20px]" : "px-[20px]"}`}
                              >
                                {mode === "dynamic_agent_core_mode" && (
                                  <>
                                    {!componentsDataLoaded ? (
                                      <div className="p-4">
                                        <Skeleton active paragraph={{ rows: 10 }} />
                                      </div>
                                    ) : (
                                      <SkillsAndKnowledgeV2
                                        key={`skills-knowledge-${agentDetail?.agentNo || "default"}`}
                                        botNo={botNo}
                                        agentDetail={agentDetail}
                                        selectedTools={selectedTools}
                                        setSelectedTools={setSelectedTools}
                                        selectedSkills={selectedSkills}
                                        setSelectedSkills={setSelectedSkills}
                                        knowledgeBases={knowledgeBases}
                                        setKnowledgeBases={setKnowledgeBases}
                                        onSave={handleSkillsAndToolsUpdate}
                                        onToolApproveChange={handleToolApproveChange}
                                        prompt={markdownContent}
                                        type={mode}
                                        model={selectedModel}
                                        agentMode={agentMode}
                                        voiceTemplateNo={workSkillNos[0]}
                                        agentVars={agentVars}
                                        setAgentVars={setAgentVars}
                                        isOnlyRead={isPublishDisabled || isShowDetail}
                                      />
                                    )}
                                  </>
                                )}
                                {mode === "single_agent_skill_mode" && (
                                  <div className="flex-1 flex flex-col gap-[20px]">
                                    <ConversationFlow
                                      onAddFlow={async (skills, workSkillNos) => {
                                        if (!workSkillNos) return
                                        setSelectedSkill(skills)
                                        setWorkSkillNos(workSkillNos)
                                        await handleSave(
                                          false,
                                          { workSkillNos, knowledgeBases: knowledgeBases },
                                          markdownContent,
                                          mode,
                                          selectedModel
                                        )
                                        if (agentMode == 1) {
                                          // 保存后调用 调用 状态接口
                                          refreshReleaseStatus(agentNo)
                                        }
                                      }}
                                      initSelectedSkill={(skills) => {
                                        setSelectedSkill(skills)
                                      }}
                                      botNo={botNo}
                                      agentDetail={{ ...agentDetail, workSkillNos }}
                                      agentMode={agentMode}
                                      originalAgentNo={
                                        originalAgentNo !== "undefined"
                                          ? originalAgentNo
                                          : undefined
                                      }
                                      isOnlyRead={isPublishDisabled || isShowDetail}
                                      isNeedExecuteDefaultAgent={isNeedExecuteDefaultAgent}
                                      studioenv={studioenv}
                                    />
                                  </div>
                                )}

                                {mode === "meta_agent_mode" && (
                                  <div className="flex-1 flex flex-col gap-[20px]">
                                    <MateAgentContent
                                      knowledgeBases={knowledgeBases}
                                      selectedSkills={selectedSkills}
                                      setSelectedSkills={setSelectedSkills}
                                      selectedTools={selectedTools}
                                      setSelectedTools={setSelectedTools}
                                      onSave={handleSkillsAndToolsUpdate}
                                      metaAgentModelList={metaAgentModelList}
                                      loading={loading}
                                      agentDetail={agentDetail}
                                      isNeedExecuteDefaultAgent={isNeedExecuteDefaultAgent}
                                      handleSave={(bool) =>
                                        handleSave(
                                          true,
                                          {
                                            workSkillNo: workSkillNos[0],
                                            knowledgeBases: knowledgeBases,
                                            isNeedExecuteAgent: bool
                                          },
                                          markdownContent,
                                          mode,
                                          selectedModel
                                        )
                                      }
                                      isOnlyRead={isPublishDisabled || isShowDetail}
                                    />
                                  </div>
                                )}

                                {/* 语音Agentic */}
                                {mode === "voice_intelligent_mode" &&
                                  activeVoiceTab === "arrangement" && (
                                    <>
                                      {!componentsDataLoaded ? (
                                        <div className="p-4">
                                          <Skeleton active paragraph={{ rows: 10 }} />
                                        </div>
                                      ) : (
                                        <></>
                                        // <SkillsAndKnowledge
                                        //   ref={voiceSettingsPanelRef}
                                        //   key={`skills-knowledge-voice-${agentDetail?.agentNo || "default"}-${voiceRefreshKey}`}
                                        //   botNo={botNo}
                                        //   agentDetail={agentDetail}
                                        //   selectedTools={selectedTools}
                                        //   setSelectedTools={setSelectedTools}
                                        //   selectedSkills={selectedSkills}
                                        //   setSelectedSkills={setSelectedSkills}
                                        //   knowledgeBases={knowledgeBases}
                                        //   setKnowledgeBases={setKnowledgeBases}
                                        //   onSave={handleSkillsAndToolsUpdate}
                                        //   onToolApproveChange={handleToolApproveChange}
                                        //   prompt={markdownContent}
                                        //   type={mode}
                                        //   model={selectedModel}
                                        //   agentMode={agentMode}
                                        //   voiceTemplateNo={workSkillNos[0]}
                                        //   agentVars={agentVars}
                                        //   setAgentVars={setAgentVars}
                                        //   voiceConfig={voiceConfig}
                                        //   onVoiceConfigChange={setVoiceConfig}
                                        //   onVoiceConfigSave={(config) => {
                                        //     console.log("保存语音配置:", config)
                                        //   }}
                                        //   isOnlyRead={isPublishDisabled || isShowDetail}
                                        //   voiceRefreshKey={voiceRefreshKey}
                                        //   stepInfos={stepInfos}
                                        // />
                                      )}
                                    </>
                                  )}

                                {/* 语音画布模式 */}
                                {mode === "voice_canvas_mode" && (
                                  <VoiceCanvasMode
                                    ref={voiceCanvasModeRef}
                                    botNo={botNo}
                                    agentDetail={agentDetail}
                                    isOnlyRead={isPublishDisabled}
                                    reSaveFaq={(knowledgeBasesVoice) => {
                                      setKnowledgeBasesVoiceFaq(knowledgeBasesVoice)
                                      handleSave(
                                        false,
                                        { workSkillNos, knowledgeBases: knowledgeBasesVoice },
                                        markdownContent,
                                        mode,
                                        selectedModel
                                      )
                                    }}
                                  />
                                )}

                                {/* 语音剧本模式 */}
                                {mode === "voice_script_mode" && (
                                  <VoiceCanvasMode
                                    ref={voiceCanvasModeRef}
                                    botNo={botNo}
                                    agentDetail={agentDetail}
                                    isOnlyRead={isPublishDisabled}
                                    reSaveFaq={(knowledgeBasesVoice) => {
                                      setKnowledgeBasesVoiceFaq(knowledgeBasesVoice)
                                      handleSave(
                                        false,
                                        { workSkillNos, knowledgeBases: knowledgeBasesVoice },
                                        markdownContent,
                                        mode,
                                        selectedModel
                                      )
                                    }}
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                <PreviewAndDebug
                  isChat={isShowDetail}
                  className={`transition-all duration-300 ease-in-out ${
                    debugPanelVisible
                      ? "w-[66%]"
                      : mode === "dynamic_agent_core_mode" ||
                          mode === "voice_intelligent_mode" ||
                          mode === "voice_canvas_mode" ||
                          mode === "voice_script_mode"
                        ? "w-[50%]"
                        : "w-[50%]"
                  }`}
                  onDebugSuccess={() => setIsDebugSuccessful(true)}
                  botNo={botNo}
                  studioenv={studioenv}
                  agentName={agentDetail?.agentName}
                  selectedSkill={selectedSkill}
                  agentNo={agentNo}
                  agentVersionNo={agentVersionNo || agentDetail?.versionNo}
                  mode={mode}
                  refreshReleaseStatus={refreshReleaseStatus}
                  agentMode={agentMode}
                  variableConfigs={variableConfigs}
                  isV2={true}
                  onDebugPanelToggle={setDebugPanelVisible}
                  debugPanelVisible={debugPanelVisible}
                />
              </div>
            </div>

            {/* 语音模式选择弹窗 */}
            <VoiceModeSelectionModal
              visible={showVoiceModeModal}
              onConfirm={handleVoiceModeSelection}
              loading={isVoiceModeSelecting}
            />
          </>
        )}
      </div>
      {/* 语音模式弹出调试层 */}
      <PreviewAndDebugDrawer
        visible={previewDrawerVisible}
        onClose={() => setPreviewDrawerVisible(false)}
        isChat={isShowDetail}
        botNo={botNo}
        agentName={agentDetail?.agentName}
        selectedSkill={selectedSkill}
        agentNo={agentNo}
        agentVersionNo={agentVersionNo || agentDetail?.versionNo}
        mode={mode}
        refreshReleaseStatus={refreshReleaseStatus}
        agentMode={agentMode}
        variableConfigs={variableConfigs}
      />
      {/* 属性配置抽屉 */}
      <PropertyConfigDrawer
        visible={propertyConfigDrawerVisible}
        onClose={() => setPropertyConfigDrawerVisible(false)}
        botNo={botNo}
        voiceTaskId={voiceTaskId}
        agentDetail={agentDetail}
        disabled={isPublishDisabled}
        reSaveFaq={(knowledgeBasesVoice) => {
          setKnowledgeBasesVoiceFaq(knowledgeBasesVoice)
          handleSave(
            true,
            { workSkillNos, knowledgeBases: knowledgeBasesVoice },
            markdownContent,
            mode,
            selectedModel,
            true // 不要提示 message.success
          )
        }}
        voiceCanvasModeRef={voiceCanvasModeRef}
      />
    </div>
  )
}

export default AgentDetail
