import { useState, useEffect } from "react"
import { Button, Space, Avatar, Modal, message, Tooltip } from "antd"
import { LoadingOutlined } from "@ant-design/icons"
import { useNavigate } from "react-router-dom"
import { useReleaseAgentPro } from "@/api/agent"
import { unlockAgent, lockAgent, exportAgentApiDoc, loadAgentVersion } from "@/api/agent/api"
import { useFetchAgentMode } from "@/api/common"
// import MateAgentTranset from "./MateAgentTranset"
import moment from "moment"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { useSSO } from "@/components/SSOProvider"
import ApiDocPreviewModal from "./ApiDocPreviewModal"
import HistoryVersionDrawer from "./HistoryVersionDrawer"
// 导入语音相关 API
import { getVoiceAgentDetails, createOrUpdateVoiceAgent } from "@/api/voiceAgent/api"
import { reportEvent } from "@/utils/monitorEvent"
import MoreActionsButton from "@/components/MoreActionsButton"
import "./DetailHeader.scss"
import { useFetchBotInfo } from "@/api/bot"

const DetailHeader = ({
  botNo,
  isCanEditByCurrentUser,
  agentDetail,
  agentMode,
  lockData,
  studioenv,
  selectedSkills,
  selectedSkill,
  selectedTools,
  knowledgeBases,
  workSkillNo,
  hasUnsavedChanges,
  markdownContent,
  mode,
  selectedModel,
  handleSave,
  setIsDebugSuccessful,
  isSaving,
  setIsSaving,
  releaseNewStatus,
  isOnlyRead,
  originalAgentNo,
  fetchLatestVersion,
  voiceRef, // 语音组件的 ref
  activeTab = "arrangement",

  // 新增：嵌入模式相关参数
  isEmbedded = false,
  // VoiceFlow Header 功能透传参数
  voiceFlowTaskId,
  voiceFlowTaskName,
  voiceFlowIsDraft = false,
  voiceFlowShowAutoLayoutTip = false,
  onVoiceFlowSave,
  onVoiceFlowImport,
  onVoiceFlowExport,
  onVoiceFlowSaveComplete,
  onVoiceFlowBack,
  onVoiceFlowPropertyConfigClick,
  setCurrentFlowConfig,
  voiceFlowSaveLoading = false,
  flowType, // 新增：语音流程类型
  // PreviewAndDebugDrawer 相关参数
  previewDrawerVisible,
  setPreviewDrawerVisible,
  // PropertyConfigDrawer 相关参数
  propertyConfigDrawerVisible,
  setPropertyConfigDrawerVisible,
  flowInfo = null,
  isPublishDisabled,
  isOpenVersion,
  agentVersionNo,
  isV2 = false
}) => {
  const navigate = useNavigate()
  const [messageApi, contextHolder] = message.useMessage()

  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [isReleaseModalVisible, setIsReleaseModalVisible] = useState(false)
  const [isApiDocModalVisible, setIsApiDocModalVisible] = useState(false)
  const [apiDocHtml, setApiDocHtml] = useState("")
  const [apiDocLoading, setApiDocLoading] = useState(false)
  const [voiceSaving, setVoiceSaving] = useState(false)
  const [historyDrawerVisible, setHistoryDrawerVisible] = useState(false)
  const [selectedSkillNo, setSelectedSkillNo] = useState(undefined)

  const { data: botDetails = {}, isLoading: isLoadingBotDetails, refetch } = useFetchBotInfo(botNo)

  const { data: agentModeList } = useFetchAgentMode()

  // 组件销毁时清理 localStorage
  useEffect(() => {
    return () => {
      localStorage.setItem("aigc_voice_agent_report", false)
    }
  }, [])

  useEffect(() => {
    if (Array.isArray(selectedSkill) && selectedSkill.length > 0) {
      const isCurrentSkillStillPresent = selectedSkill.some(
        (skill) => skill.skillNo === selectedSkillNo
      )
      if (!isCurrentSkillStillPresent) {
        setSelectedSkillNo(selectedSkill[0].skillNo)
      }
    } else {
      setSelectedSkillNo(undefined)
    }
  }, [selectedSkill, selectedSkillNo])

  // console.log("agentDetail555====>", agentDetail, releaseNewStatus)

  const queryClient = useQueryClient()
  const { mutate: releaseAgent, isLoading: isReleasing } = useReleaseAgentPro()
  const { userInfo = {} } = useSSO()

  // 自动保存  --- 暂时删除自动保存
  //   useEffect(() => {
  //     let saveTimeout
  //     const autoSave = async () => {
  //       if (!agentDetail) return
  //       setIsAutoSaving(true)
  //       try {
  //         await handleSave(
  //           false,
  //           {
  //             workSkillNo,
  //             skillNos: selectedSkills,
  //             pluginNos: selectedTools,
  //             knowledgeBases: knowledgeBases
  //           },
  //           markdownContent,
  //           mode,
  //           selectedModel
  //         )
  //       } finally {
  //         setIsAutoSaving(false)
  //       }
  //     }

  //     // 每60秒自动保存一次
  //     saveTimeout = setInterval(autoSave, 60000)

  //     return () => {
  //       if (saveTimeout) {
  //         clearInterval(saveTimeout)
  //       }
  //     }
  //   }, [agentDetail, handleSave, markdownContent, mode, selectedModel, workSkillNo, knowledgeBases])

  // 处理发布
  const handleRelease = () => {
    reportEvent({
      eventName: "custom click",
      source: "agentDetail",
      action: "agent release",
      botNo,
      userInfo
    })
    // 如果有未保存的更改，先保存
    if (hasUnsavedChanges) {
      handleSave(
        true,
        { workSkillNo, knowledgeBases: knowledgeBases },
        markdownContent,
        mode,
        selectedModel
      )
    }

    // 显示发布弹窗
    setIsReleaseModalVisible(true)
  }

  // 确认发布
  const confirmRelease = () => {
    releaseAgent(
      {
        agentNo: agentDetail?.agentNo,
        versionNo: agentVersionNo || agentDetail?.versionNo,
        isCurrent: true,
        versionName: (agentDetail?.name || "Agent") + moment().format("YYYYMMDDHHmmss"),
        description: ""
      },
      {
        onSuccess: (response) => {
          if (response.success) {
            message.success("发布成功")
            queryClient.invalidateQueries([QUERY_KEYS.AGENT_VERSION_LIST])
            setIsReleaseModalVisible(false)
            // 重置调试状态
            setIsDebugSuccessful(false)
            // 重新调用 版本记录接口 latest
            fetchLatestVersion()
          } else {
            message.error(response.message || "发布失败")
          }
        },
        onError: (error) => {
          message.error(error.message || "发布失败")
        }
      }
    )
  }

  // 取消发布
  const cancelRelease = () => {
    setIsReleaseModalVisible(false)
  }

  const fetchApiDoc = async (skillNo) => {
    if (!agentDetail?.agentNo) return
    setApiDocLoading(true)
    try {
      const html = await exportAgentApiDoc({
        agentNo: agentDetail.agentNo,
        previewMode: true,
        skillNo: skillNo,
        studioenv,
        botNo
      })
      setApiDocHtml(html)
      if (!isApiDocModalVisible) {
        setIsApiDocModalVisible(true)
      }
    } catch (e) {
      message.error("获取API文档失败")
    } finally {
      setApiDocLoading(false)
    }
  }

  // 预览API文档
  const handlePreviewApiDoc = async () => {
    await fetchApiDoc(selectedSkillNo)
  }

  const handleSkillChange = async (newSkillNo) => {
    setSelectedSkillNo(newSkillNo)
    await fetchApiDoc(newSkillNo)
  }

  // 锁的点击事件
  const onAgentLock = async () => {
    if (lockData?.locked) {
      const result = await unlockAgent({
        botNo,
        agentNo: agentDetail?.agentNo
      })
      if (result.success) {
        message.success("解锁成功！")
      } else {
        message.error(result.message || "解锁失败，请稍后重试")
      }
    } else {
      const result = await lockAgent({
        botNo,
        agentNo: agentDetail?.agentNo
      })
      if (result.success) {
        message.success("锁定成功！")
      } else {
        message.error(result.message || "锁定失败，请稍后重试")
      }
    }
    queryClient.invalidateQueries([QUERY_KEYS.AGENT_LOCK_INFO])
  }

  // 语音设置保存
  const handleVoiceSave = async () => {
    if (!voiceRef?.current) {
      console.log("语音组件 ref 不存在，跳过语音保存")
      return
    }

    try {
      setVoiceSaving(true)
      console.log("开始保存语音设置...")

      // 调用语音组件的保存方法，获取表单中的最新数据并保存
      await voiceRef.current.saveVoiceSettings()
      console.log("语音设置保存成功")
      // messageApi.open({
      //   type: "success",
      //   content: "语音设置保存成功"
      // })
    } catch (error) {
      console.error("语音设置保存失败:", error)
      // 抛出异常，让上层调用者知道保存失败
      throw error
    } finally {
      setVoiceSaving(false)
    }
  }

  // VoiceFlow 返回处理
  const handleVoiceFlowBack = () => {
    if (onVoiceFlowBack) {
      onVoiceFlowBack()
    } else {
      // 默认行为：如果有草稿未保存，弹出确认框
      if (voiceFlowIsDraft && !isPublishDisabled) {
        Modal.confirm({
          title: "提示",
          content: (
            <div>
              <div className="mb-2">
                <div className="mb-2 flex flex-nowrap items-start">
                  <div className="whitespace-nowrap">当前空间：</div>
                  <div className="text-[#7F56D9] ml-1 break-all">
                    {botDetails?.botName || "暂无匹配"}
                  </div>
                </div>
              </div>
              <div className="mb-2 flex flex-nowrap items-start">
                <div className="whitespace-nowrap">当前Agent：</div>
                <div className="text-[#7F56D9] ml-1 break-all">
                  {voiceFlowTaskName || "暂无匹配"}
                </div>
              </div>
              <div>当前画布还有草稿未保存，是否保存？</div>
            </div>
          ),
          okText: "保存",
          cancelText: "不保存",
          onOk: async () => {
            await handleSaveWithVoice(true)
            if (onVoiceFlowSaveComplete) {
              onVoiceFlowSaveComplete()
            }
            navigate(-1)
          },
          onCancel: () => {
            navigate(-1)
          }
        })
      } else {
        navigate(-1)
      }
    }
  }

  // VoiceFlow 属性配置处理
  const handleVoiceFlowPropertyConfig = () => {
    if (onVoiceFlowPropertyConfigClick) {
      onVoiceFlowPropertyConfigClick()
    }
  }

  // 处理保存（包含语音保存）
  const handleSaveWithVoice = async (back = false) => {
    setIsSaving(true)
    reportEvent({
      eventName: "custom click",
      source: "agentDetail",
      action: "agent save",
      botNo,
      userInfo
    })
    try {
      // 如果是嵌入模式且是语音画布/剧本模式，使用 VoiceFlow 的保存方法
      if (isEmbedded && (mode === "voice_canvas_mode" || mode === "voice_script_mode")) {
        if (!back) {
          Modal.confirm({
            title: "保存提醒",
            content: (
              <div>
                <div className="mb-2">
                  <div className="mb-2 flex flex-nowrap items-start">
                    <div className="whitespace-nowrap">当前空间：</div>
                    <div className="text-[#7F56D9] ml-1 break-all">
                      {botDetails?.botName || "暂无匹配"}
                    </div>
                  </div>
                </div>
                <div className="mb-2 flex flex-nowrap items-start">
                  <div className="whitespace-nowrap">当前Agent：</div>
                  <div className="text-[#7F56D9] ml-1 break-all">
                    {voiceFlowTaskName || "暂无匹配"}
                  </div>
                </div>
                <div>请确认画布节点数据无误！</div>
              </div>
            ),
            okText: "确认",
            cancelText: "取消",
            onOk: async () => {
              console.log("嵌入模式：使用 VoiceFlow 保存方法")
              if (onVoiceFlowSave) {
                await onVoiceFlowSave()

                // 调用保存完成回调
                if (onVoiceFlowSaveComplete) {
                  onVoiceFlowSaveComplete()
                }
              }
            }
          })
        } else {
          if (onVoiceFlowSave) {
            await onVoiceFlowSave()

            // 调用保存完成回调
            if (onVoiceFlowSaveComplete) {
              onVoiceFlowSaveComplete()
            }
          }
        }

        return
      }

      // 如果是语音类型的 Agent，先保存语音设置
      if (agentMode == 2) {
        console.log("检测到语音类型 Agent，开始保存语音设置...")
        try {
          await handleVoiceSave()
        } catch (error) {
          // 打印错误信息，便于调试
          console.log("err", error)
          // 语音保存失败，不继续保存 Agent 数据

          // 使用 Modal.error 代替 message.error 来显示错误信息
          messageApi.open({
            type: "error",
            content: error?.message || "语音设置保存失败，请检查必填字段后重试"
          })

          console.error("语音设置保存失败，停止后续保存:", error)
          return
        }
      }

      // 保存普通的 Agent 数据
      await handleSave(
        true,
        { workSkillNos: workSkillNo, knowledgeBases: knowledgeBases },
        markdownContent,
        mode,
        selectedModel
      )
    } catch (error) {
      console.error("保存失败:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleBatchTest = () => {
    navigate(
      `/batch-testing?type=agent&agentNo=${agentDetail?.agentNo}&botNo=${agentDetail?.botNo}&versionNo=${agentDetail?.versionNo}&name=${encodeURIComponent(agentDetail?.agentName || "")}&studioenv=${studioenv || ""}`
    )
  }

  return (
    <>
      {contextHolder}
      <div
        className="absolute flex justify-between items-center px-[20px] py-[12px] h-[60px] bg-white mb-[8px]"
        style={{
          left: 0,
          right: 0,
          width: "100%"
        }}
      >
        <div className="flex items-center min-w-[450px]">
          <div className="text-[16px] text-[#181B25] font-[600] flex items-center">
            {/* <ArrowLeftOutlined
              onClick={() => {
                if (aigc_voice_agent_report === "true") {
                  // 原有的返回逻辑
                  navigate(-1)
                } else {
                  // 如果是嵌入模式且是语音画布/剧本模式，使用 VoiceFlow 的返回逻辑
                  if (
                    isEmbedded &&
                    (mode === "voice_canvas_mode" || mode === "voice_script_mode")
                  ) {
                    handleVoiceFlowBack()
                  } else {
                    // 原有的返回逻辑
                    navigate(-1)
                  }
                }
              }}
              className="mr-[8px] text-[14px] cursor-pointer hover:text-[#7f56d9]"
            /> */}
            <Avatar size={30} className="mr-[8px]" src={agentDetail?.icon} />
            <Tooltip title={agentDetail?.agentName}>
              <div className="max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap">
                {agentDetail?.agentName || "暂未获得名称"}
              </div>
            </Tooltip>

            {/* 嵌入模式下的流程类型显示 */}
            {isEmbedded && flowType && (
              <div className="px-1 ml-1 text-[11px] font-[400] mt-1 text-gary-400">
                {flowType == 1 ? "语音-画布模式" : flowType === 2 ? "语音-剧本模式" : "未知模式"}
              </div>
            )}
            {!!flowInfo?.count && flowInfo?.count > 0 && isEmbedded && (
              <div className="px-1 ml-0 text-[11px] font-[400] mt-1 text-[#7F56D9] border border-1 border-[#7F56D9] rounded-[4px]">
                {flowInfo?.count}
              </div>
            )}
            {agentMode && !isEmbedded && (
              <div className="ml-1 px-2 py-1 text-xs font-medium bg-gray-50 text-gray-600 rounded-md border border-gray-200">
                {agentModeList?.find((v) => v.code == agentMode)?.name?.replace("Agent", "") ||
                  "--"}
              </div>
            )}

            {(agentMode == 1 || agentMode == 7) &&
              agentDetail?.type === "single_agent_skill_mode" && (
                <div className="flex items-center">
                  {originalAgentNo && (
                    <div className="ml-2 px-2 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-md border border-blue-200">
                      深拷贝
                    </div>
                  )}

                  <div
                    className={`ml-2 px-2 py-1 text-xs font-medium rounded-md border ${
                      releaseNewStatus === "draft"
                        ? "bg-orange-50 text-orange-600 border-orange-200"
                        : releaseNewStatus === "to_be_released"
                          ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                          : "bg-green-50 text-green-600 border-green-200"
                    }`}
                  >
                    {releaseNewStatus === "draft"
                      ? "草稿"
                      : releaseNewStatus === "to_be_released"
                        ? "待发布"
                        : "已发布"}
                  </div>
                </div>
              )}
            {isAutoSaving && (
              <span className="text-[10px] text-blue-500 font-[400] ml-[8px]">
                <LoadingOutlined className="mr-[4px]" />
                自动保存中...
              </span>
            )}
            {hasUnsavedChanges && !isAutoSaving && agentMode != 2 && (
              <span className="text-[10px] text-[#B42318] font-[400] ml-[8px]">有未保存的更改</span>
            )}
            {/* 嵌入模式下的草稿状态显示 */}
            {isEmbedded && voiceFlowIsDraft && (
              <div className="ml-1 px-1 text-[11px] mt-1 font-[400] bg-orange-50 text-orange-600 rounded-[4px] border border-orange-200">
                草稿
              </div>
            )}
            {/* 嵌入模式下的保存状态显示 */}
            {isEmbedded && voiceFlowSaveLoading && (
              <span className="text-[10px] text-blue-500 font-[400] ml-[8px]">
                <LoadingOutlined className="mr-[4px]" />
                保存中...
              </span>
            )}
            {/* 嵌入模式下的自动布局提示 */}
            {isEmbedded && voiceFlowShowAutoLayoutTip && (
              <span className="text-[10px] text-green-500 font-[400] ml-[8px]">已自动布局</span>
            )}
          </div>
        </div>
        {!isOnlyRead && activeTab === "arrangement" ? (
          <Space size="small" className="w-[450px] justify-end">
            <Tooltip placement="bottom" title={"批量测试"}>
              <div
                className="inline-block  mr-2 cursor-pointer transition-all duration-300 px-[10px] py-[0px] align-middle text-center bg-[#F5F7FA] leading-[36px] rounded-[8px] hover:text-[#7F56D9]"
                onClick={handleBatchTest}
              >
                <i className="iconfont icon-piliangceshi text-lg "></i>
              </div>
            </Tooltip>
            {/* 历史记录版本 */}
            {(agentMode == 1 || agentMode == 7) && ( // && agentDetail?.type === "single_agent_skill_mode"
              <Tooltip placement="bottom" title="点击查看历史记录">
                <div
                  className="inline-block  mr-2 cursor-pointer transition-all duration-300 px-[10px] py-[0px] align-middle text-center bg-[#F5F7FA] leading-[36px] rounded-[8px] hover:text-[#7F56D9]"
                  onClick={() => setHistoryDrawerVisible(true)}
                >
                  <i className="iconfont icon-lishihuihua hover:text-[#7F56D9]"></i>
                </div>
              </Tooltip>
            )}
            {[1, 2, 7].includes(Number(agentMode)) && isCanEditByCurrentUser && (
              <Tooltip
                placement="bottom"
                title={
                  isPublishDisabled
                    ? ""
                    : lockData?.locked
                      ? lockData?.lockInfo?.username === userInfo.username
                        ? "当前Agent已为您锁定，锁定期间他人不可保存、调试和发布等操作，使用结束记得解锁哦~"
                        : `【${lockData?.lockInfo?.userRealName}】已锁定当前Agent，如需解锁请联系锁定人${lockData?.lockInfo?.userRealName}/${lockData?.lockInfo?.username}解锁`
                      : `锁定Agent后其他人则不能保存、调试和发布等操作`
                }
              >
                {lockData?.locked ? (
                  <div
                    onClick={onAgentLock}
                    className={`inline-block  mr-2 ${isPublishDisabled ? "cursor-not-allowed" : "cursor-pointer"} transition-all duration-300 px-[10px] py-[0px] align-middle text-center bg-[#FFF1EB] leading-[36px] rounded-[8px]`}
                  >
                    <i className="iconfont icon-lock text-[#D05E25]"></i>
                  </div>
                ) : (
                  <div
                    onClick={onAgentLock}
                    className={`inline-block  mr-2 ${isPublishDisabled ? "cursor-not-allowed" : "cursor-pointer"} transition-all duration-300 px-[10px] py-[0px] align-middle text-center bg-[#F5F7FA] leading-[36px] rounded-[8px] hover:text-[#7F56D9]`}
                  >
                    <i className="iconfont icon-unlock hover:text-[#7F56D9]"></i>
                  </div>
                )}
              </Tooltip>
            )}

            {/* API文档预览与下载 */}
            <Tooltip placement="bottom" title="点击预览 Agent API 文档 ">
              <div
                onClick={handlePreviewApiDoc}
                className="inline-block  mr-2 cursor-pointer transition-all duration-300 px-[10px] py-[0px] align-middle text-center bg-[#F5F7FA] leading-[36px] rounded-[8px] hover:text-[#7F56D9]"
              >
                <i className="iconfont icon-API hover:text-[#7F56D9]"></i>
              </div>
            </Tooltip>

            {isCanEditByCurrentUser && isEmbedded && (
              <Button
                onClick={() => {
                  setPropertyConfigDrawerVisible(true)
                }}
                disabled={lockData?.locked && lockData?.lockInfo?.username !== userInfo.username}
              >
                属性配置
              </Button>
            )}

            {isCanEditByCurrentUser && ( //mode !== "meta_agent_mode" &&
              <Button
                loading={isSaving || voiceSaving}
                onClick={() => {
                  handleSaveWithVoice(false)
                }}
                type={hasUnsavedChanges ? "primary" : "default"}
                disabled={
                  isPublishDisabled ||
                  (lockData?.locked && lockData?.lockInfo?.username !== userInfo.username)
                }
              >
                保存
                {agentMode == 2 && voiceSaving && "语音设置中..."}
              </Button>
            )}
            {isEmbedded && (
              <Button
                color="primary"
                variant="outlined"
                onClick={() => {
                  setPreviewDrawerVisible(true)
                }}
              >
                预览与调试
              </Button>
            )}
            {isCanEditByCurrentUser && !isEmbedded ? (
              <Button
                type="primary"
                onClick={handleRelease}
                disabled={
                  isOpenVersion ||
                  (agentMode != 2 &&
                    mode !== "meta_agent_mode" &&
                    releaseNewStatus !== "to_be_released") ||
                  (lockData?.locked && lockData?.lockInfo?.username !== userInfo.username)
                }
                loading={isReleasing}
              >
                发布
              </Button>
            ) : (
              <Button.Group>
                <Button
                  type="primary"
                  onClick={handleRelease}
                  disabled={
                    isOpenVersion ||
                    (agentMode != 2 &&
                      mode !== "meta_agent_mode" &&
                      releaseNewStatus !== "to_be_released") ||
                    (lockData?.locked && lockData?.lockInfo?.username !== userInfo.username)
                  }
                  loading={isReleasing}
                >
                  发布
                </Button>

                {/* 更多操作按钮 */}
                <MoreActionsButton
                  botNo={botNo}
                  agentNo={agentDetail?.agentNo}
                  loading={isSaving || voiceSaving}
                  isPublishDisabled={isPublishDisabled}
                  disabled={lockData?.locked && lockData?.lockInfo?.username !== userInfo.username}
                  botName={botDetails?.botName}
                  agentName={voiceFlowTaskName || agentDetail?.agentName}
                  onImportSuccess={(res) => {
                    // 刷新页面数据
                    queryClient.invalidateQueries([QUERY_KEYS.AGENT_DETAIL])
                    // 如果是嵌入模式且有 setCurrentFlowConfig 方法，通知 VoiceFlow 刷新画布
                    if (isEmbedded && setCurrentFlowConfig) {
                      setCurrentFlowConfig("success")
                    }
                  }}
                  onExportSuccess={({ filename, blob }) => {
                    // 导出成功后的处理逻辑
                    console.log("导出成功:", filename)
                  }}
                />
              </Button.Group>
            )}
          </Space>
        ) : (
          <div className="w-[450px]"></div>
        )}
      </div>

      <ApiDocPreviewModal
        open={isApiDocModalVisible}
        loading={apiDocLoading}
        html={apiDocHtml}
        skillNos={selectedSkill}
        selectedSkillNo={selectedSkillNo}
        onSkillChange={handleSkillChange}
        onClose={() => setIsApiDocModalVisible(false)}
        onDownload={() =>
          exportAgentApiDoc({
            studioenv,
            botNo,
            agentNo: agentDetail?.agentNo,
            skillNo: selectedSkillNo
          })
        }
      />
      {/* Release Modal */}
      <Modal
        title="发布确认"
        open={isReleaseModalVisible}
        onOk={confirmRelease}
        onCancel={cancelRelease}
        okText="确认发布"
        cancelText="取消"
        width={400}
        confirmLoading={isReleasing}
      >
        <p className="my-4">确定发布当前版本吗？</p>
      </Modal>
      <HistoryVersionDrawer
        studioenv={studioenv}
        botNo={botNo}
        open={historyDrawerVisible}
        onClose={() => setHistoryDrawerVisible(false)}
        agentNo={agentDetail?.agentNo}
        versionNo={agentDetail?.versionNo}
        insetCurrentVersion={async (versionNo) => {
          const res = await loadAgentVersion({ agentNo: agentDetail?.agentNo, versionNo })
          console.log("res====>", res)
          if (res.success) {
            message.success("载入成功")
            fetchLatestVersion()
          } else {
            message.error(res.message || "载入失败")
          }

          // fetchLatestVersion("insetCurrentVersion", versionNo)
          setHistoryDrawerVisible(false)
        }}
      />
    </>
  )
}

export default DetailHeader
