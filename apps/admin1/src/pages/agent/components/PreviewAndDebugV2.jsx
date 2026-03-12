import React, { useState, useRef, useEffect, useMemo } from "react"
import {
  Button,
  Typography,
  Space,
  Spin,
  Flex,
  Tooltip,
  Drawer,
  Select,
  message as messageAnt,
  Tag,
  Upload,
  Popover,
  Modal,
  Form,
  Input,
  Switch,
  Splitter
} from "antd"
import { Prompts, Sender, Bubble, useXAgent, useXChat } from "@ant-design/x"
import {
  PlusCircleOutlined,
  ArrowUpOutlined,
  UserOutlined,
  PauseCircleOutlined,
  ClearOutlined,
  CheckCircleFilled,
  UploadOutlined,
  PictureOutlined,
  FileOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  CloseOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  DownOutlined,
  RightOutlined
} from "@ant-design/icons"
import CopyToClipboard from "react-copy-to-clipboard"
import { fetchUploadFile } from "@/api/common/api"
import { botPrefix } from "@/constants"
import CodeMirror from "@uiw/react-codemirror"
import { json } from "@codemirror/lang-json"
import { indentationMarkers } from "@replit/codemirror-indentation-markers"
// import {
//   handleSendMessage as sendMessage,
//   handleStopGenerate as stopGenerate
// } from "../utils/chatUtils"
import {
  handleSendMessage as sendMessage,
  handleStopGenerate as stopGenerate
} from "../utils/chatUtils_real_stream_v2"
import { useFetchLatestDebugSession } from "@/api/agent"
import { fetchSessionMessages } from "@/api/agent/api"
import DebugDrawer from "./DebugDrawer"
import aiAvator from "@/assets/img/aiAvator.png"
import MDEditor from "@uiw/react-md-editor"
import "./styles.scss"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"
import { getTokenAndServiceName } from "@/api/sso"
import { fieldTypeOptions } from "@/pages/createPluginTools/constants"
import { modeEnum } from "../detail"
import VoiceSessionInfoPopover from "./VoiceSessionInfoPopover"
import DebugInfoPanel from "./DebugInfoPanel"

const { Text } = Typography

// 简单计算消息的token数量（包括空格和标点符号）
const calculateTokens = (message) => {
  if (!message) return 0
  // 简单估算：每个字符算一个token
  return message.length
}

// 格式化JSON字符串
const formatJsonString = (jsonString) => {
  try {
    const parsed = JSON.parse(jsonString)
    return JSON.stringify(parsed, null, 2)
  } catch (e) {
    // 如果不是有效的JSON，返回原始字符串
    return jsonString
  }
}

// 检查字符串是否是有效的JSON
const isValidJson = (str) => {
  try {
    JSON.parse(str)
    return true
  } catch (e) {
    return false
  }
}

// 检查消息是否包含错误指示器
const containsErrorIndicators = (message) => {
  return (
    typeof message === "string" &&
    (message.startsWith("[错误]") ||
      message.includes("statusCode=>500") ||
      message.includes("[ERROR_CODE]") ||
      message.includes("system_50050"))
  )
}

const roles = {
  ai: {
    placement: "start",
    avatar: {
      icon: <img src={aiAvator} />,
      style: { background: "#ddd" }
    }
  },
  local: {
    placement: "end",
    avatar: {
      icon: <UserOutlined />,
      style: { background: "#1DAF61" }
    }
  }
}

const PreviewAndDebug = ({
  className,
  isEmbedded = false,
  onDebugSuccess,
  botNo,
  studioenv,
  agentNo,
  agentName,
  agentVersionNo,
  selectedSkill,
  mode = "intelligent",
  refreshReleaseStatus,
  agentMode, // Agent模式：1 => 文本agent，2 => 语音agent
  variableConfigs,
  isChat,
  isV2 = true,
  onDebugPanelToggle,
  debugPanelVisible: parentDebugPanelVisible = false
}) => {
  const [loading, setLoading] = useState(false)
  const [content, setContent] = React.useState("")
  const bubbleContainerRef = React.useRef(null)
  const hasRefreshedRef = React.useRef(false)
  const [debugDrawerVisible, setDebugDrawerVisible] = useState(false)
  const [isDebugSuccessful, setIsDebugSuccessful] = useState(false)
  const [messages, setMessages] = useState([])
  const [sessionId, setSessionId] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [fileUploading, setFileUploading] = useState(false)
  const controllerRef = useRef(null)
  const timeoutRef = useRef(null)
  const [serverTime, setServerTime] = useState(null)
  const [clearPopoverVisible, setClearPopoverVisible] = useState(false)
  const [fetchingMessages, setFetchingMessages] = useState(false)
  const prevModeRef = useRef(mode)
  const [previewImage, setPreviewImage] = useState(null)
  const [previewVisible, setPreviewVisible] = useState(false)
  // 添加授权相关状态
  const [waitForApproveTools, setWaitForApproveTools] = useState([])
  const [showApproveButtons, setShowApproveButtons] = useState(false)
  const [lastMessage, setLastMessage] = useState(null)
  const [approveLoading, setApproveLoading] = useState(false)
  const [metaAgentPopoverVisible, setMetaAgentPopoverVisible] = useState(false)
  const [metaAgentSessionVariables, setMetaAgentSessionVariables] = useState([])
  const [voiceSessionInfo, setVoiceSessionInfo] = useState(null)
  const [enableStreamEffect, setEnableStreamEffect] = useState(false) // 流式效果开关状态
  const [debugPanelVisible, setDebugPanelVisible] = useState(parentDebugPanelVisible) // 调试面板显示状态
  // 每条消息的“思考过程”折叠状态：key 为消息 id，value 为是否折叠
  const [reasoningCollapsedMap, setReasoningCollapsedMap] = useState({})

  // Splitter 拖动时禁用过渡，提高跟手性
  const [isResizing, setIsResizing] = useState(false)

  const [preSelectedSkillNo, setPreSelectedSkillNo] = useState(undefined)

  // 是否存在工具调用（INVOKE_AGENT_TOOL），用于决定是否展示右侧 Debug 面板
  const hasToolInvoke = useMemo(() => {
    return (messages || []).some(
      (m) =>
        m.status === "ai" &&
        Array.isArray(m.serverActions) &&
        m.serverActions.some((a) => a.actionType === "INVOKE_AGENT_TOOL")
    )
  }, [messages])

  const [metaForm] = Form.useForm()

  // 是否具备可打开调试面板的条件：必须存在至少一条“工具调用”动作（INVOKE_AGENT_TOOL）
  const canOpenDebug = hasToolInvoke

  // 自动打开调试：当首次出现可展示的调试数据且当前未打开时，自动打开一次
  const prevCanOpenRef = useRef(false)
  useEffect(() => {
    if (!debugPanelVisible && !prevCanOpenRef.current && canOpenDebug) {
      setDebugPanelVisible(true)
      onDebugPanelToggle?.(true)
    }
    prevCanOpenRef.current = canOpenDebug
  }, [canOpenDebug, debugPanelVisible])

  // 同步父组件传入的 debugPanelVisible 状态，但仅当存在工具调用时允许为 true
  useEffect(() => {
    if (isV2) {
      setDebugPanelVisible(parentDebugPanelVisible && hasToolInvoke)
    }
  }, [parentDebugPanelVisible, isV2, hasToolInvoke])

  // 安全兜底：若当前为 true 但没有任何工具调用，则自动关闭
  useEffect(() => {
    if (debugPanelVisible && !hasToolInvoke) {
      setDebugPanelVisible(false)
      onDebugPanelToggle?.(false)
    }
  }, [debugPanelVisible, hasToolInvoke])

  useEffect(() => {
    if (!metaAgentPopoverVisible) {
      metaForm.resetFields()
    } else {
      metaForm.setFieldsValue({
        metaAgentSessionVariables
      })
    }
  }, [metaAgentPopoverVisible, metaAgentSessionVariables, metaForm])

  // a-aigc-platform.test.za.biz/bots/jKxpZBsIPnr/agents/txuoftskvabrs/txuqpptjxqsqi/debug'
  // mock query
  // botNo = "jKxpZBsIPnr"
  // agentNo = "txuoftskvabrs"
  // agentVersionNo = "txuqpptjxqsqi"

  useEffect(() => {
    if (
      !loading && // 确保全局loading状态也为false
      refreshReleaseStatus &&
      typeof refreshReleaseStatus === "function" &&
      hasRefreshedRef.current // Only trigger if not already refreshed
    ) {
      refreshReleaseStatus(agentNo)
    }
  }, [loading])

  // 判断是否需要JSON格式化输入
  const isJsonInputMode = () => {
    // 检查selectedSkill中的type或skillType
    if (selectedSkill) {
      const skillType = selectedSkill.type || selectedSkill.skillType
      return skillType && skillType !== "1" && skillType !== 1
    }
    return false
  }

  // 监听模式变化，当从Agentic切换到工作流模式时清空消息和会话ID
  useEffect(() => {
    if (prevModeRef.current === "single_agent_llm_mode" && mode === "single_agent_skill_mode") {
      // 从Agentic切换到工作流模式，清空消息和会话ID
      setMessages([])
      setSessionId("")
      messageAnt.info("已切换到工作流模式，开始新的对话")
    }
    prevModeRef.current = mode
  }, [mode])

  // 监听 selectedSkill 变化，清除对话框内容
  useEffect(() => {
    if (selectedSkill && selectedSkill.length > 0) {
      // 读取本地 skillNo
      const localSkillNo = localStorage.getItem("agent_debug_skillNo")
      // 检查本地 skillNo 是否在当前 selectedSkill 列表中
      const exist = selectedSkill.find((item) => item.skillNo === localSkillNo)
      if (exist) {
        setPreSelectedSkillNo(localSkillNo)
      } else {
        setPreSelectedSkillNo(selectedSkill[0].skillNo)
        localStorage.setItem("agent_debug_skillNo", selectedSkill[0].skillNo)
      }
      setContent("")
      setMessages([])
      setSessionId("")
      setUploadedFiles([])
    }
  }, [selectedSkill])

  // 使用 hook 获取最新调试会话ID
  const { data: sessionData, isLoading: isSessionLoading } = useFetchLatestDebugSession({
    botNo,
    agentNo,
    agentVersionNo
  })

  // 获取聊天历史记录
  const fetchChatHistory = async (sessionId) => {
    if (!sessionId) return

    try {
      setFetchingMessages(true)
      const response = await fetchSessionMessages(sessionId, botNo)

      if (response && response.data && response.data.data && Array.isArray(response.data.data)) {
        // 从每个会话中提取消息并按时间顺序合并
        const allMessages = response.data.data
          .flatMap((item) => item.sessionMessages || [])
          .sort((a, b) => new Date(a.messageTime) - new Date(b.messageTime))

        // 转换消息格式以适应当前组件
        const formattedMessages = allMessages.map((msg, index) => {
          // 检查消息内容是否包含错误指示器
          const isErrorMessage = msg.role === "ai" && containsErrorIndicators(msg.content)

          // 使用原始消息内容
          const processedContent = msg.content || ""

          // 处理附件
          let attachments = []
          if (msg.attachments) {
            try {
              // 尝试解析附件JSON字符串
              const parsedAttachments = JSON.parse(msg.attachments)

              // 处理不同类型的附件
              attachments = parsedAttachments
                .map((attachment, i) => {
                  if (attachment.contentType === "IMAGE" && attachment.content?.imageUrl?.url) {
                    // 处理图片附件
                    return {
                      uid: `${index}-img-${i}`,
                      name: `图片 ${i + 1}`,
                      status: "done",
                      url: attachment.content.imageUrl.url,
                      type: "image/png" // 默认图片类型
                    }
                  } else if (
                    attachment.contentType === "FILE" &&
                    attachment.content?.fileUrl?.url
                  ) {
                    // 处理文件附件
                    return {
                      uid: `${index}-file-${i}`,
                      name: attachment.content.fileName || `文件 ${i + 1}`,
                      status: "done",
                      url: attachment.content.fileUrl.url,
                      type: "application/octet-stream" // 默认文件类型
                    }
                  }
                  return null
                })
                .filter(Boolean) // 过滤掉无效的附件
            } catch (error) {
              console.error("Error parsing attachments:", error)
            }
          }

          return {
            id: `history-${index}`,
            message: processedContent,
            status: msg.role === "user" ? "local" : "ai",
            files: attachments.length > 0 ? attachments : msg.files || [],
            loading: false,
            serverTime: msg.serverTime || null,
            serverActions: msg.serverActions || []
          }
        })

        setMessages(formattedMessages)
      } else {
        console.warn("No messages found in response or invalid response structure:", response)
        if (response && response.message) {
          messageAnt.warning(`获取聊天记录: ${response.message}`)
        }
      }
    } catch (error) {
      console.error("Error fetching chat history:", error)
      messageAnt.error("获取聊天历史失败")
    } finally {
      setFetchingMessages(false)
    }
  }

  // 当会话数据加载完成时设置会话ID并获取聊天历史
  useEffect(() => {
    if (sessionData) {
      const newSessionId = sessionData
      setSessionId(newSessionId)

      // 如果有会话ID，获取聊天历史
      fetchChatHistory(newSessionId)
    }
  }, [sessionData])

  const scrollToBottom = () => {
    if (bubbleContainerRef.current) {
      bubbleContainerRef.current.scrollTop = bubbleContainerRef.current.scrollHeight
    }
  }

  useEffect(() => {
    // 使用多个延时确保在不同渲染阶段都能滚动到底部
    setTimeout(scrollToBottom, 0)
    setTimeout(scrollToBottom, 100)
    setTimeout(scrollToBottom, 300)
  }, [messages]) // 当消息列表变化时滚动到底部

  // 添加 MutationObserver 监听 DOM 变化
  useEffect(() => {
    if (!bubbleContainerRef.current) return

    const observer = new MutationObserver(() => {
      scrollToBottom()
    })

    observer.observe(bubbleContainerRef.current, {
      childList: true,
      subtree: true,
      characterData: true
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  // Handle processing of action data from streaming responses
  const processActionData = (outerEvent) => {
    try {
      if (!outerEvent || !outerEvent.data) return null

      // 解析内部的 data（字符串或对象）
      const inner =
        typeof outerEvent.data === "string" ? JSON.parse(outerEvent.data) : outerEvent.data

      if (!inner.action) {
        return null
      }

      const action = inner.action
      const actionData = inner.data
      const serverTime = outerEvent.serverTime // 关键：从最外层取 serverTime

      // 处理 REASONING action
      if (action === "REASONING") {
        const result = {
          actionType: action,
          data: actionData,
          uniqueId: `reasoning_${Date.now()}`
        }
        return result
      }

      // 处理 INVOKE_AGENT_TOOL action
      if (action !== "INVOKE_AGENT_TOOL") {
        return null
      }

      if (!actionData) return null

      // 返回更完整的数据，包括整个 actionData 对象
      const result = {
        ...actionData,
        actionType: action
      }

      // 根据 processStatus 设置对应的时间戳
      if (actionData.processStatus === "START" && typeof serverTime === "number") {
        result.startTime = serverTime
      } else if (actionData.processStatus === "END" && typeof serverTime === "number") {
        result.endTime = serverTime
      }

      return result
    } catch (error) {
      console.error("Error processing action data:", error)
      return null
    }
  }

  // 处理语音会话信息提交
  const handleVoiceSessionInfoSubmit = async (sessionInfo) => {
    try {
      // 保存会话信息到状态中，用于后续对话接口调用
      setVoiceSessionInfo(sessionInfo.originalValues)

      // 保存 agentVars 格式的数据
      setMetaAgentSessionVariables(sessionInfo.agentVars)

      // 这里可以调用API保存会话信息到后端
      // await saveVoiceSessionInfo(sessionInfo)

      return Promise.resolve()
    } catch (error) {
      console.error("保存语音会话信息失败:", error)
      return Promise.reject(error)
    }
  }

  // 处理需要授权的情况
  const handleNeedApprove = (tools, lastMsg, sessionId) => {
    // 确保工具列表有值
    if (tools && tools.length > 0) {
      console.log("需要授权工具:", tools)
      // 设置需要授权的工具
      setWaitForApproveTools(tools)
      // 保存上下文消息，用于授权后重新发送
      setLastMessage(lastMsg)

      // 立即更新AI消息内容，显示授权中状态
      if (lastMsg && lastMsg.aiMessageId) {
        setMessages((prev) => {
          const updatedMessages = [...prev]
          const aiMessageIndex = updatedMessages.findIndex((msg) => msg.id === lastMsg.aiMessageId)
          if (aiMessageIndex !== -1) {
            updatedMessages[aiMessageIndex].message = "用户正在确认授权中..."
            updatedMessages[aiMessageIndex].loading = false // 确保不显示加载状态
            updatedMessages[aiMessageIndex].waitingForApproval = true // 添加等待授权标记
          }
          return updatedMessages
        })
      }

      // 显示授权按钮组
      setShowApproveButtons(true)
    } else {
      console.warn("No tools to approve")
    }
  }

  // 处理授权确认
  const handleApproveConfirm = async () => {
    if (!sessionId || !waitForApproveTools.length) {
      console.warn("No session ID or tools to approve")
      return
    }

    try {
      setApproveLoading(true)
      console.log("确认授权工具:", waitForApproveTools)

      // 构造授权数据
      const approveData = waitForApproveTools.map((tool) => ({
        toolNo: tool.toolNo,
        toolType: tool.toolType,
        approveType: "ONCE_APPROVE"
      }))

      // 调用授权接口
      const response = await fetch(`${botPrefix}/session/session/${sessionId}/approve-for-chat`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Usercenter-Session": getTokenAndServiceName().token
        },
        body: JSON.stringify(approveData)
      }).then((res) => res.json())

      if (response && response.success) {
        messageAnt.success("授权成功")

        // 隐藏授权按钮组
        setShowApproveButtons(false)

        // 重新发送上一条消息
        if (lastMessage) {
          const { message, files, aiMessageId } = lastMessage

          // 更新当前授权中消息的状态
          setMessages((prev) => {
            const updatedMessages = [...prev]
            const aiMessageIndex = updatedMessages.findIndex((msg) => msg.id === aiMessageId)
            if (aiMessageIndex !== -1) {
              updatedMessages[aiMessageIndex].message = "授权成功，正在继续对话..."
              updatedMessages[aiMessageIndex].waitingForApproval = false // 移除等待授权标记
            }
            return updatedMessages
          })

          // 移除之前的AI回复消息，然后直接请求流式接口，不添加用户消息
          setTimeout(() => {
            setMessages((prev) => {
              return prev.filter((msg) => msg.id !== aiMessageId)
            })

            // 直接调用sendMessage函数，但传入skipUserMessage=true参数
            sendMessageAfterApprove(message, files)
          }, 500) // 给用户一点时间看到授权成功的消息
        }

        // 清理授权相关的状态
        setWaitForApproveTools([])
        setLastMessage(null)
      } else {
        messageAnt.error("授权失败，请重试")
      }
    } catch (error) {
      console.error("Error approving tools:", error)
      messageAnt.error("授权过程中出错，请重试")
    } finally {
      setApproveLoading(false)
    }
  }

  // 授权成功后直接调用流式接口，不显示用户消息
  const sendMessageAfterApprove = async (message, files = []) => {
    // 跳过添加用户消息到气泡框的步骤
    setLoading(true)

    // Create a new AbortController for this request
    const controller = new AbortController()
    controllerRef.current = controller

    // Create AI message placeholder
    const aiMessageId = Date.now().toString()
    setMessages((prev) => [
      ...prev,
      {
        id: aiMessageId,
        message: "",
        status: "ai",
        loading: true,
        serverActions: []
      }
    ])

    // 调用原始的sendMessage函数，但传入skipUserMessage=true参数
    await sendMessage({
      isChat,
      message,
      files,
      botNo,
      studioenv,
      agentNo,
      agentVersionNo,
      sessionId,
      botPrefix,
      mode,
      setMessages,
      setLoading,
      setContent,
      setSessionId,
      scrollToBottom,
      controllerRef,
      timeoutRef,
      setServerTime,
      processActionData,
      handleNeedApprove,
      skipUserMessage: true, // 新增标记，表示跳过添加用户消息
      aiMessageId, // 传递创建的AI消息ID
      // 添加流式效果开关参数
      enableStreamEffect,
      // metaAgentSessionVariables: mode === "meta_agent_mode" ? metaAgentSessionVariables : undefined,
      // agentVars: agentMode == 2 ? metaAgentSessionVariables : undefined
      ...(agentMode == 2 || agentMode == 7
        ? { agentVars: metaAgentSessionVariables || undefined }
        : {
            metaAgentSessionVariables:
              mode === "meta_agent_mode" ? metaAgentSessionVariables : undefined
          })
    })

    hasRefreshedRef.current = true
  }

  // 取消授权
  const handleApproveCancel = () => {
    console.log("取消授权")
    // 隐藏授权按钮组
    setShowApproveButtons(false)

    // 清理授权相关状态
    setWaitForApproveTools([])

    // 如果有lastMessage信息，需要更新对应消息的状态为非加载状态
    if (lastMessage && lastMessage.aiMessageId) {
      setMessages((prev) => {
        const updatedMessages = [...prev]
        const aiMessageIndex = updatedMessages.findIndex(
          (msg) => msg.id === lastMessage.aiMessageId
        )
        if (aiMessageIndex !== -1) {
          updatedMessages[aiMessageIndex].loading = false
          updatedMessages[aiMessageIndex].message = "当前授权已经取消，请继续对话"
          updatedMessages[aiMessageIndex].waitingForApproval = false // 移除等待授权标记
        }
        return updatedMessages
      })
    }

    setLastMessage(null)
  }

  // 修改 handleSendMessage 函数以支持授权
  const handleSendMessage = async (message, files = []) => {
    // 如果是在已有会话中发送消息，使用现有的sessionId
    // 如果没有sessionId（例如清空对话后），会在sendMessage函数中创建新的会话

    // 处理工作流模式下的消息格式
    let processedMessage = message

    // 工作流模式下不使用文件
    const processedFiles = mode === "single_agent_skill_mode" ? [] : files

    if (mode === "single_agent_skill_mode") {
      // 检查是否需要JSON格式化
      if (isJsonInputMode()) {
        try {
          // 尝试解析JSON，如果是有效的JSON字符串，则格式化后使用
          const parsedJson = JSON.parse(message)
          processedMessage = JSON.stringify(parsedJson)
        } catch (e) {
          // 如果不是有效的JSON，则包装成JSON格式
          processedMessage = JSON.stringify({ msg: message })
        }
      }
    }

    await sendMessage({
      isChat,
      message: processedMessage,
      files: processedFiles,
      botNo,
      studioenv,
      preSelectedSkillNo,
      agentNo,
      agentVersionNo,
      sessionId,
      botPrefix,
      mode,
      setMessages,
      setLoading,
      setContent,
      setSessionId,
      scrollToBottom,
      controllerRef,
      timeoutRef,
      setServerTime,
      // Pass function to process action data
      processActionData,
      // 添加处理授权的回调
      handleNeedApprove,
      // 传递额外参数，用于工作流模式下的消息格式化
      isJsonMode: mode === "single_agent_skill_mode" && isJsonInputMode(),
      // 添加流式效果开关参数
      enableStreamEffect,
      ...(agentMode == 2 || agentMode == 7
        ? { agentVars: metaAgentSessionVariables || undefined }
        : {
            metaAgentSessionVariables:
              mode === "meta_agent_mode" ? metaAgentSessionVariables : undefined
          })
    })

    hasRefreshedRef.current = true // Mark as refreshed
  }

  const handleStopGenerate = () => {
    stopGenerate({
      controllerRef,
      timeoutRef,
      setLoading,
      setMessages
    })
  }

  const handleClear = () => {
    setClearPopoverVisible(true)
    setMetaAgentSessionVariables([])
    // 语音模式下也清空语音会话信息
    if (agentMode == 2) {
      setVoiceSessionInfo({})
    }
  }

  const confirmClear = () => {
    setContent("")
    setLoading(false)
    setMessages([])
    setSessionId("")
    setUploadedFiles([])
    setIsDebugSuccessful(false)
    // 清空语音会话信息
    setVoiceSessionInfo({})
    // 清空对话时关闭调试面板
    setDebugPanelVisible(false)
    onDebugPanelToggle?.(false)
    messageAnt.success(`对话已清空`)
    setClearPopoverVisible(false)
  }

  const cancelClear = () => {
    setClearPopoverVisible(false)
  }

  const clearConfirmContent = (
    <div className="p-2">
      <p className="mb-2">确认清除所有聊天记录并重置会话！</p>
      <div className="flex justify-end gap-2">
        <Button size="small" onClick={cancelClear}>
          取消
        </Button>
        <Button size="small" type="primary" onClick={confirmClear}>
          确认
        </Button>
      </div>
    </div>
  )

  // 模拟调试成功

  // 处理文件上传
  const handleFileUpload = async (file) => {
    try {
      setFileUploading(true)
      const formData = new FormData()
      formData.append("file", file)

      const data = await fetchUploadFile(formData)
      const { temporarySignatureUrl } = data || {}

      if (temporarySignatureUrl) {
        const newFile = {
          uid: Date.now(),
          name: file.name,
          status: "done",
          url: temporarySignatureUrl,
          type: file.type
        }

        setUploadedFiles((prev) => [...prev, newFile])
        return newFile
      }

      return null
    } catch (error) {
      console.error("Error uploading file:", error)
      messageAnt.error("文件上传失败")
      return null
    } finally {
      setFileUploading(false)
    }
  }

  // 处理文件选择
  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // 验证文件大小
    const isLt10M = file.size / 1024 / 1024 < 10
    if (!isLt10M) {
      messageAnt.error("文件大小不能超过10MB!")
      return
    }

    await handleFileUpload(file)

    // 重置 input 值，允许选择相同文件
    e.target.value = null
  }

  // 文件上传按钮引用
  const fileInputRef = useRef(null)

  // 自定义上传按钮
  const uploadButton = (
    <div className="flex items-center gap-2">
      <Tooltip
        placement="top"
        title={
          mode === "single_agent_skill_mode" ? "工作流模式不支持上传文件" : "支持图片、文档等上传"
        }
      >
        {fileUploading ? (
          <Spin size="small" />
        ) : !loading ? (
          <i
            className={`iconfont icon-zengjia text-[23px] font-[300] mr-1 ${
              mode === "single_agent_skill_mode"
                ? "text-[#D0D5DD] cursor-not-allowed"
                : "text-[#98A2B3] hover:text-[#7F56D9] cursor-pointer"
            }`}
            onClick={() => {
              if (mode !== "single_agent_skill_mode" && fileInputRef.current) {
                fileInputRef.current.click()
              }
            }}
          />
        ) : (
          <i className="iconfont icon-zengjia text-[23px] font-[300] opacity-0"></i>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          style={{ display: "none" }}
          accept="*/*"
          disabled={fileUploading || mode === "single_agent_skill_mode"}
        />
      </Tooltip>
    </div>
  )

  // 组件卸载时清除所有计时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (controllerRef.current) {
        controllerRef.current.abort()
      }
    }
  }, [])

  // 图片预览处理函数
  const handleImagePreview = (imageUrl) => {
    setPreviewImage(imageUrl)
    setPreviewVisible(true)
  }

  // 关闭图片预览
  const handlePreviewClose = () => {
    setPreviewVisible(false)
  }

  // metaAgent 会话信息渲染函数
  const renderConversationInfo = () => (
    <div
      className="flex items-center gap-2"
      style={{
        position: "absolute",
        right: loading ? 150 : 58,
        top: 13
      }}
    >
      <Popover
        title="会话信息"
        trigger="click"
        rootClassName="metaAgentPopover"
        open={metaAgentPopoverVisible}
        onOpenChange={setMetaAgentPopoverVisible}
        getPopupContainer={(triggerNode) => triggerNode.parentNode}
        content={
          <Form
            form={metaForm}
            onFinish={(values) => {
              setMetaAgentSessionVariables(values.metaAgentSessionVariables)
              setMetaAgentPopoverVisible(false)
            }}
          >
            <Form.List name="metaAgentSessionVariables">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }, index) => (
                    <Space
                      key={key}
                      style={{
                        display: "flex",
                        marginBottom: fields.length === index + 1 ? 24 : 8,
                        alignItems: "flex-start"
                      }}
                    >
                      <div>
                        <Space style={{ display: "flex", marginBottom: 8 }} align="baseline">
                          <Form.Item
                            {...restField}
                            name={[name, "variableName"]}
                            rules={[{ required: true, message: "请输入字段名" }]}
                          >
                            <Input placeholder="字段名（必填）" />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            className="w-[95px]"
                            name={[name, "variableType"]}
                            rules={[{ required: true, message: "请选择类型" }]}
                            initialValue={"string"}
                          >
                            <Select placeholder="类型（必填）" options={fieldTypeOptions} />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, "description"]}
                            rules={[{ required: true, message: "请输入字段描述" }]}
                          >
                            <Input placeholder="字段描述（必填）" />
                          </Form.Item>
                        </Space>
                        <Form.Item
                          {...restField}
                          name={[name, "defaultValue"]}
                          rules={[{ required: true, message: "请输入值" }]}
                        >
                          <Input placeholder="请输入值（必填）" />
                        </Form.Item>
                      </div>
                      <CloseOutlined className="mt-[11px]" onClick={() => remove(name)} />
                    </Space>
                  ))}
                  <Button
                    type="link"
                    className="!p-[8px] !border-0"
                    onClick={() => add()}
                    icon={<PlusOutlined />}
                  >
                    添加参数
                  </Button>
                </>
              )}
            </Form.List>
            <Form.Item>
              <Space className="flex justify-end" size={16}>
                <Button onClick={() => setMetaAgentPopoverVisible(false)}>取消</Button>
                <Button type="primary" htmlType="submit">
                  保存
                </Button>
              </Space>
            </Form.Item>
          </Form>
        }
      >
        {!loading && (
          <Tooltip placement="top" title={"会话信息"}>
            <i
              className={`iconfont icon-huihuarenqunshezhi text-[21px] text-[#98A2B3] px-[3px] rounded-[6px] -mt-1 hover:bg-[#E1E4EA] hover:text-[#7F56D9] cursor-pointer`}
            />
          </Tooltip>
        )}
      </Popover>
    </div>
  )

  return (
    <div
      className={`preview-debug-container relative justify-between bg-white rounded-[8px] flex ${isV2 && debugPanelVisible && canOpenDebug ? "flex-row" : "flex-col"} h-full ${className}`}
    >
      {/* 主聊天区域 */}
      <div
        style={isV2 ? { borderRight: "1px solid #E4E7EC" } : ""}
        className={`flex flex-col h-full ${isV2 && debugPanelVisible && canOpenDebug ? "w-[100%]" : "w-full"} transition-all duration-300 ease-in-out`}
      >
        <div
          className="flex items-center justify-between"
          style={{ borderBottom: "1px solid #E4E7EC" }}
        >
          <div
            className={`flex items-center justify-between w-[100%] px-[20px] ${mode === "single_agent_skill_mode" && agentMode == 7 ? "py-[13px]" : "py-[15px]"}`}
          >
            <div className={`${isEmbedded ? "ml-5" : ""} flex items-center`}>
              <span className="text-[16px] text-[#181B25] font-[500]">
                {mode === "meta_agent_mode" ? "调试" : "预览与调试"}
              </span>
              {isSessionLoading && <Spin size="small" className="ml-2" />}
              {fetchingMessages && <Spin size="small" className="ml-2" />}
            </div>
            <div className="w-[60%] flex items-center justify-end">
              {mode === "single_agent_skill_mode" && agentMode == 7 && (
                <div>
                  <Select
                    className="w-[160px] mr-3"
                    value={preSelectedSkillNo}
                    onChange={(val) => {
                      setPreSelectedSkillNo(val)
                      localStorage.setItem("agent_debug_skillNo", val)
                    }}
                    options={selectedSkill?.map((skill) => ({
                      value: skill.skillNo,
                      label: skill.skillName
                    }))}
                    placeholder="请选择调试工作流"
                  />
                </div>
              )}

              {isV2 ? (
                <>
                  <span
                    className={`text-[14px] ${!debugPanelVisible && !canOpenDebug ? "text-[#C0C6D3] cursor-not-allowed" : "cursor-pointer text-[#722ED1] hover:opacity-80"}`}
                    onClick={() => {
                      // 只能主动关闭；打开需要已有可展示的调试数据
                      if (debugPanelVisible) {
                        setDebugPanelVisible(false)
                        onDebugPanelToggle?.(false)
                        return
                      }
                      if (canOpenDebug) {
                        setDebugPanelVisible(true)
                        onDebugPanelToggle?.(true)
                      } else {
                        messageAnt.info("暂无可显示的调试数据，触发工具调用后可打开")
                      }
                    }}
                  >
                    <i className="iconfont icon-fabuqingdan  text-[16px] mr-[5px] align-middle -mt-[2px] inline-block"></i>
                    {debugPanelVisible ? "关闭预览和调试" : "打开预览和调试"}
                  </span>
                  <div className="w-[1px] h-[15px] bg-gray-400 mx-3"></div>
                </>
              ) : (
                ""
              )}
              <span
                type="link"
                className="text-[#722ED1] text-[14px] cursor-pointer font-[400] hover:opacity-80 !p-0"
                onClick={() => {
                  if (refreshReleaseStatus && typeof refreshReleaseStatus === "function") {
                    refreshReleaseStatus(agentNo)
                  }
                  setDebugDrawerVisible(true)
                }}
              >
                <i className="iconfont icon-piliangceshi mr-[5px] text-[18px] align-middle -mt-[2px] inline-block"></i>
                {mode === "meta_agent_mode" ? "执行过程" : "日志"}
              </span>
            </div>
          </div>
        </div>
        <div className="h-[1px] bg-[#E4E7EC]"></div>

        <div
          className={`flex ${isV2 && debugPanelVisible && canOpenDebug ? "flex-row" : "flex-col"} h-full transition-all duration-300 ease-in-out`}
        >
          <Splitter
            onResizeStart={() => setIsResizing(true)}
            onResize={() => setIsResizing(true)}
            onResizeEnd={() => setIsResizing(false)}
          >
            <Splitter.Panel
              defaultSize="50%"
              min="30%"
              max="70%"
              style={isResizing ? { transition: "none" } : undefined}
            >
              {/* 主内容区域 */}
              <div
                className={`flex flex-col h-[calc(100vh-115px)] ${isV2 && debugPanelVisible && canOpenDebug ? "w-full" : "w-full"} transition-all duration-300 ease-in-out`}
                style={
                  isV2 && debugPanelVisible && canOpenDebug
                    ? { borderRight: "1px solid #E4E7EC" }
                    : {}
                }
              >
                {messages.length === 0 ? (
                  <div className="flex-1 overflow-auto px-[32px] py-[20px] flex items-center justify-center">
                    {fetchingMessages || isSessionLoading ? (
                      <Spin tip="加载聊天记录中..." />
                    ) : (
                      <div className="bg-white rounded-lg w-[100%]">
                        <div className="text-center mb-[12px]">
                          <Text className="text-[20px] font-[600] text-[#475467]">
                            {agentName}
                            {(!preSelectedSkillNo ||
                              preSelectedSkillNo === undefined ||
                              !preSelectedSkillNo?.length) &&
                            agentMode == 7 &&
                            !isSessionLoading &&
                            mode === "single_agent_skill_mode" ? (
                              <div className="text-[14px] text-center mt-2 text-red-600 bg-red-50  py-[5px] font-[400] rounded-md  ml-[10px]">
                                请先选择工作流后调试
                              </div>
                            ) : (
                              ""
                            )}
                            {/* {mode === "single_agent_llm_mode" ? "私域客服助理" : "工作流模式"} */}
                          </Text>
                        </div>

                        <div className="p-[20px] flex flex-col items-center self-stretch gap-[2px] bg-[#F5F7FA] rounded-[8px]">
                          <CustomEmpty description={`请开起新的【${agentName}】调试对话...`} />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className={`flex-1 overflow-auto px-[20px] py-[10px] relative pt-0 ${isV2 ? "pr-[0px]" : " pr-[10px]"}`}
                  >
                    {fetchingMessages ? (
                      <div className="flex items-center justify-center h-full">
                        <Spin tip="加载聊天记录中..." />
                      </div>
                    ) : (
                      <div
                        className="bubble-container overflow-y-auto pr-[20px] pt-[10px] 
              "
                        ref={bubbleContainerRef}
                        style={{ height: "100%", scrollBehavior: "smooth" }}
                      >
                        <Bubble.List
                          roles={roles}
                          items={messages.map(
                            ({
                              id,
                              message,
                              status,
                              files,
                              loading,
                              serverTime,
                              serverActions,
                              cost,
                              waitingForApproval
                            }) => ({
                              key: id,
                              role: status === "local" ? "local" : "ai",
                              loading: loading,
                              header:
                                status === "ai" ? (
                                  serverActions &&
                                  serverActions.length > 0 &&
                                  serverActions.some(
                                    (action) => action.actionType === "REASONING"
                                  ) ? (
                                    <div className="mb-1 p-2 rounded-md bg-gray-100">
                                      <div
                                        className="flex items-center justify-between mb-1 cursor-pointer select-none"
                                        onClick={() =>
                                          setReasoningCollapsedMap((prev) => ({
                                            ...prev,
                                            [id]: !prev[id]
                                          }))
                                        }
                                      >
                                        <span className="text-[13px] font-semibold text-[#7f56d9]">
                                          思考过程
                                        </span>
                                        {reasoningCollapsedMap?.[id] ? (
                                          <RightOutlined className="text-[#7f56d9] text-[12px]" />
                                        ) : (
                                          <DownOutlined className="text-[#7f56d9] text-[12px]" />
                                        )}
                                      </div>
                                      {!reasoningCollapsedMap?.[id] && (
                                        <div className="text-[12px] text-[#4a5568] leading-relaxed whitespace-pre-wrap">
                                          {(() => {
                                            // 将所有 REASONING 数据合并成一个字符串
                                            const reasoningTexts = serverActions
                                              .filter((action) => action.actionType === "REASONING")
                                              .map((action) => {
                                                try {
                                                  const reasoningData =
                                                    typeof action.data === "string"
                                                      ? JSON.parse(action.data)
                                                      : action.data
                                                  return (
                                                    reasoningData?.executeResult ||
                                                    reasoningData?.content ||
                                                    ""
                                                  )
                                                } catch (e) {
                                                  console.error("Error parsing REASONING data:", e)
                                                  return String(action.data)
                                                }
                                              })
                                              .filter(Boolean)

                                            // 将 </thinkDone> 标签替换为空行（两个换行符）
                                            const fullText = reasoningTexts.join("")
                                            // 替换所有 </thinkDone> 为 \n\n，然后去除末尾多余的换行
                                            return fullText
                                              .replace(/<\/thinkDone>/g, "\n\n")
                                              .trimEnd()
                                          })()}
                                        </div>
                                      )}
                                    </div>
                                  ) : null
                                ) : (
                                  <span className="text-[#98A2B3] text-[12px] font-[400]">我</span>
                                ),
                              content: (
                                <div>
                                  {/* Display uploaded files if any */}
                                  {files &&
                                    files.length > 0 &&
                                    mode !== "single_agent_skill_mode" && (
                                      <div className="flex flex-wrap gap-2 mb-2">
                                        {files.map((file) => (
                                          <div
                                            key={file.uid}
                                            className="file-preview bg-gray-100 p-1 rounded flex items-center gap-1"
                                          >
                                            {file.type.startsWith("image/") ? (
                                              <img
                                                src={file.url}
                                                alt={file.name}
                                                className="w-[30px] h-[30px] object-cover rounded-md cursor-pointer hover:opacity-80"
                                                onClick={() => handleImagePreview(file.url)}
                                              />
                                            ) : (
                                              <div className="flex items-center">
                                                <FileOutlined className="text-[#666] mr-1" />
                                                <a
                                                  href={file.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-[#1677ff] hover:text-[#4096ff] text-xs"
                                                >
                                                  下载
                                                </a>
                                              </div>
                                            )}
                                            <span className="text-xs truncate max-w-[100px]">
                                              {file.name}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                  {/* 根据消息内容和模式判断是否需要格式化JSON */}
                                  {mode === "single_agent_skill_mode" &&
                                  isJsonInputMode() &&
                                  isValidJson(message) ? (
                                    <div className="json-formatted">
                                      <CodeMirror
                                        value={formatJsonString(message)}
                                        height="auto"
                                        readOnly={true}
                                        lineNumbers={false}
                                        foldGutter={false}
                                        extensions={[
                                          json(),
                                          indentationMarkers({
                                            hideFirstIndent: false,
                                            markerType: "fullScope",
                                            thickness: 1,
                                            colors: {
                                              light: "#E8E8E8",
                                              dark: "#404040",
                                              activeLight: "#C0C0C0",
                                              activeDark: "#606060"
                                            }
                                          })
                                        ]}
                                        theme="light"
                                        style={{
                                          borderRadius: "8px",
                                          fontSize: "14px",
                                          overflow: "hidden",
                                          backgroundColor:
                                            status === "local" ? "#f0f9ff" : "#f9fafb"
                                        }}
                                      />
                                    </div>
                                  ) : message && containsErrorIndicators(message) ? (
                                    <div className="error-messagerounded-md text-red-800 whitespace-pre-wrap break-words">
                                      <div className="flex items-center gap-2 mb-2 font-semibold">
                                        <ExclamationCircleOutlined className="-mt-[2px] -mr-[8px]" />{" "}
                                        调用失败
                                      </div>
                                      <div className="overflow-auto max-h-[600px] text-sm">
                                        {
                                          message.startsWith("[错误]") ? (
                                            <MDEditor.Markdown
                                              source={message}
                                              height="auto"
                                              visibleDragbar={false}
                                              enableScroll={false}
                                              className="ai-code-md-edit"
                                              style={{
                                                backgroundColor: "transparent",
                                                border: "none",
                                                padding: "0",
                                                color: "#181B25"
                                              }}
                                            ></MDEditor.Markdown>
                                          ) : (
                                            // message.replace("[错误]", "").trim()
                                            message
                                          ) //
                                        }
                                      </div>
                                    </div>
                                  ) : status !== "local" ? (
                                    <div data-color-mode="light">
                                      <div className="wmde-markdown-var"> </div>
                                      <MDEditor.Markdown
                                        // value={message}
                                        source={message || "AI 暂时没有回答！"}
                                        // preview="edit"
                                        // hideToolbar={true}
                                        height="auto"
                                        visibleDragbar={false}
                                        enableScroll={false}
                                        className="ai-code-md-edit"
                                        readOnly={true}
                                        style={{
                                          backgroundColor: "transparent",
                                          border: "none",
                                          padding: "0",
                                          color: "#181B25"
                                        }}
                                        previewOptions={{
                                          style: {
                                            backgroundColor: "transparent",
                                            padding: "0"
                                          }
                                        }}
                                        textareaProps={{
                                          style: {
                                            backgroundColor: "transparent",
                                            fontSize: "14px",
                                            color: "#181B25",
                                            padding: "0"
                                          }
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <div>{message}</div>
                                  )}

                                  {/* 在AI气泡下方添加授权按钮，但仅当消息等待授权时才显示 */}
                                  {status === "ai" && waitingForApproval && showApproveButtons && (
                                    <div className="mt-4 bg-[#f8f9fe] p-3 rounded-lg border border-[#f3f3f3] shadow-sm">
                                      <div className="flex flex-col gap-2">
                                        <div className="text-[14px] text-gray-700 font-medium">
                                          需要授权以下工具才能继续：
                                        </div>
                                        <div className="ml-2">
                                          {waitForApproveTools.map((tool, idx) => (
                                            <div
                                              key={idx}
                                              className="flex items-center gap-1 text-[13px] text-gray-600 mb-1"
                                            >
                                              <InfoCircleOutlined className="text-[#7f56d9]" />
                                              <span>
                                                {tool.toolName || tool.name || "未知工具"}
                                              </span>
                                              <Tag
                                                color={
                                                  tool.toolType === "PLUGIN_TOOL"
                                                    ? "cyan"
                                                    : "purple"
                                                }
                                                className="ml-1 text-xs"
                                              >
                                                {tool.toolType === "PLUGIN_TOOL"
                                                  ? "工具"
                                                  : "工作流"}
                                              </Tag>
                                            </div>
                                          ))}
                                        </div>
                                        <div className="flex justify-end gap-2 mt-1">
                                          <Button size="small" onClick={handleApproveCancel}>
                                            取消
                                          </Button>
                                          <Button
                                            size="small"
                                            type="primary"
                                            onClick={handleApproveConfirm}
                                            loading={approveLoading}
                                          >
                                            确认授权
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ),
                              footer: status !== "local" && !message?.includes("[错误]") && (
                                <div className="flex w-[100%] items-center justify-between gap-2 mt-2 text-[#98A2B3]">
                                  <div>
                                    {/* {loading ? (
                            <div className="flex items-center gap-[4px] text-[#7F56D9] cursor-pointer hover:opacity-80">
                              <div className="animate-pulse">
                                <LoadingOutlined className="text-[14px]" />
                              </div>
                              <span className="text-[12px] animate-pulse">全力生成中...</span>
                            </div>
                          ) : (
                            ""
                          )} */}
                                  </div>
                                  {/* {(serverTime || message) &&
                        !(mode === "single_agent_skill_mode" && isJsonInputMode()) ? (
                          <div className="flex items-center gap-2 text-[12px]">
                            {serverTime && <span>{loading ? "..." : `${serverTime}s`}</span>}
                            {serverTime && message && (
                              <div className="w-[1px] h-[8px] bg-[#D0D5DD]">{}</div>
                            )}
                            {message && serverTime && (
                              <span>{calculateTokens(message)} Tokens</span>
                            )}
                          </div>
                        ) : (
                          <div></div>
                        )} */}
                                  <div>
                                    <CopyToClipboard
                                      text={message}
                                      onCopy={() => messageAnt.success("复制成功")}
                                    >
                                      <Tooltip title="复制">
                                        <i className="iconfont icon-fuzhi text-[16px] cursor-pointer hover:text-[#7F56D9]" />
                                      </Tooltip>
                                    </CopyToClipboard>
                                  </div>
                                </div>
                              )
                            })
                          )}
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-0 p-[20px] pt-0">
                  {/* <div className="p-2 pl-0">
          <span className="text-[12px] text-gray-500">
            流式效果
            <Tooltip title="开启后，若具备流式输出条件，调试时按流式效果输出">
              <QuestionCircleOutlined className="ml-1" />
            </Tooltip>
            ：
          </span>
          <Switch size="small" checked={enableStreamEffect} onChange={setEnableStreamEffect} />
        </div> */}
                  <Flex vertical gap="middle">
                    {/* 上传文件列表 - 移到输入区域上方 */}
                    {uploadedFiles.length > 0 && mode !== "single_agent_skill_mode" && (
                      <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-md">
                        {uploadedFiles.map((file) => (
                          <div
                            key={file.uid}
                            className="bg-white border border-gray-200 rounded-md px-2 py-1 flex items-center gap-1 text-xs"
                          >
                            {file.type.startsWith("image/") ? (
                              <img
                                src={file.url}
                                alt={file.name}
                                className="w-[20px] h-[20px] object-cover rounded-md"
                              />
                            ) : (
                              <FileOutlined className="text-gray-500" />
                            )}
                            <span className="truncate max-w-[80px]">{file.name}</span>
                            <i
                              className="iconfont icon-shanchu1 text-[12px] text-red-500 cursor-pointer opacity-70 hover:opacity-100 ml-1"
                              onClick={() =>
                                setUploadedFiles((prev) => prev.filter((f) => f.uid !== file.uid))
                              }
                            />
                          </div>
                        ))}
                        {fileUploading && (
                          <div className="bg-white border border-gray-200 rounded-md px-2 py-1 flex items-center gap-1 text-xs">
                            <Spin size="small" />
                            <span className="ml-1">上传中...</span>
                          </div>
                        )}
                      </div>
                    )}
                    {fileUploading &&
                      !uploadedFiles.length &&
                      mode !== "single_agent_skill_mode" && (
                        <div className="flex items-center gap-2 mb-2">
                          <Spin size="small" />
                          <span className="text-xs text-gray-500">文件上传中...</span>
                        </div>
                      )}

                    <div className="flex items-center gap-[8px] w-[100%] align-middle">
                      {!(mode === "single_agent_skill_mode" && isJsonInputMode()) && (
                        <Tooltip
                          title={messages.length > 0 ? "清空对话" : "无对话可清空"}
                          placement="top"
                        >
                          {messages.length > 0 ? (
                            <Popover
                              content={clearConfirmContent}
                              title="确认清空对话"
                              trigger="click"
                              open={clearPopoverVisible}
                              onOpenChange={setClearPopoverVisible}
                            >
                              <div
                                className="flex -mt-[20px] items-center cursor-pointer text-[#98A2B3] hover:text-[#7F56D9] w-[52px] h-[52px] justify-center rounded-[12px] !hover:border-[#7F56D9]"
                                style={{ border: "1px solid #E4E7EC" }}
                                onClick={handleClear}
                              >
                                <ClearOutlined className="text-[20px]" />
                              </div>
                            </Popover>
                          ) : (
                            <div
                              className="flex -mt-[20px] items-center text-[#D0D5DD] cursor-not-allowed w-[52px] h-[52px] justify-center rounded-[12px]"
                              style={{ border: "1px solid #E4E7EC" }}
                            >
                              <ClearOutlined className="text-[20px]" />
                            </div>
                          )}
                        </Tooltip>
                      )}
                      <div className="flex-1 w-[100%]">
                        {mode === "single_agent_skill_mode" && isJsonInputMode() ? (
                          // JSON格式化输入 - 使用CodeMirror替换JSONValidator
                          <div className="flex flex-col">
                            <div className="flex justify-between mb-2 items-center">
                              <Tooltip title={messages.length > 0 ? "清空对话" : "无对话可清空"}>
                                {messages.length > 0 ? (
                                  <Popover
                                    content={clearConfirmContent}
                                    title="确认清空对话"
                                    trigger="click"
                                    open={clearPopoverVisible}
                                    onOpenChange={setClearPopoverVisible}
                                  >
                                    <div
                                      className="flex items-center cursor-pointer text-[#98A2B3] hover:text-[#7F56D9] w-[36px] h-[36px] justify-center rounded-[12px] !hover:border-[#7F56D9]"
                                      style={{ border: "1px solid #E4E7EC" }}
                                      onClick={handleClear}
                                    >
                                      <ClearOutlined className="text-[16px]" />
                                    </div>
                                  </Popover>
                                ) : (
                                  <div
                                    className="flex items-center text-[#D0D5DD] cursor-not-allowed w-[36px] h-[36px] justify-center rounded-[12px]"
                                    style={{ border: "1px solid #E4E7EC" }}
                                  >
                                    <ClearOutlined className="text-[16px]" />
                                  </div>
                                )}
                              </Tooltip>
                              {loading ? (
                                <div
                                  className="flex items-center gap-[4px] text-[#7F56D9] cursor-pointer hover:opacity-80"
                                  onClick={handleStopGenerate}
                                >
                                  <div className="animate-pulse">
                                    <PauseCircleOutlined className="text-[14px]" />
                                  </div>
                                  <span className="text-[12px] animate-pulse">停止响应</span>
                                </div>
                              ) : (
                                <Tooltip title="发送消息" placement="top">
                                  <Button
                                    size="small"
                                    type="primary"
                                    disabled={
                                      !content ||
                                      (mode === "single_agent_skill_mode" && !selectedSkill)
                                    }
                                    icon={<ArrowUpOutlined />}
                                    onClick={() => {
                                      handleSendMessage(content, [])
                                    }}
                                  ></Button>
                                </Tooltip>
                              )}
                            </div>
                            <CodeMirror
                              value={content}
                              height="180px"
                              lineNumbers={false}
                              foldGutter={false}
                              extensions={[
                                json(),
                                indentationMarkers({
                                  hideFirstIndent: false,
                                  markerType: "fullScope",
                                  thickness: 1,
                                  colors: {
                                    light: "#E8E8E8",
                                    dark: "#404040",
                                    activeLight: "#C0C0C0",
                                    activeDark: "#606060"
                                  }
                                })
                              ]}
                              onChange={(value) => {
                                setContent(value)
                              }}
                              theme="light"
                              style={{
                                borderRadius: "8px",
                                border: "1px solid #d9d9d9",
                                fontSize: "14px",
                                overflow: "hidden"
                              }}
                              readOnly={mode === "single_agent_skill_mode" && !selectedSkill}
                            />
                          </div>
                        ) : (
                          <div style={{ position: "relative" }}>
                            {/* 语音模式会话信息设置 */}

                            {/* 普通文本输入 */}
                            <Sender
                              value={content}
                              // submitType="shiftEnter"
                              placeholder={
                                mode === "single_agent_skill_mode" && !selectedSkill
                                  ? "请先选择工作流..."
                                  : mode !== "single_agent_skill_mode"
                                    ? showApproveButtons
                                      ? "请先完成授权..."
                                      : "继续对话..."
                                    : showApproveButtons
                                      ? "请先完成授权..."
                                      : "请输入工作流指令..."
                              }
                              className="flex-1"
                              disabled={
                                loading
                                // ||
                                // (mode === "single_agent_skill_mode" &&
                                //   (!preSelectedSkillNo ||
                                //     preSelectedSkillNo === undefined ||
                                //     !preSelectedSkillNo?.length))

                                // ||
                                // !preSelectedSkillNo || preSelectedSkillNo === undefined
                                // ||
                                // !preSelectedSkillNo?.length
                              }
                              actions={(_, info) => {
                                const { SendButton, LoadingButton, ClearButton } = info.components
                                return (
                                  <Space size="small">
                                    {agentMode == 2 && <div className="w-[20px]"></div>}

                                    {/* {mode !== "single_agent_skill_mode" && uploadButton} */}

                                    {(mode === "meta_agent_mode" || agentMode == 7) && (
                                      <div
                                        className="flex items-center gap-2"
                                        style={{ visibility: "hidden" }}
                                      >
                                        <i
                                          className={`iconfont icon-huihuarenqunshezhi text-[16px] font-[300] p-[3px] rounded-[6px] text-[#181B25] hover:bg-[#E1E4EA] hover:text-[#7F56D9] cursor-pointer`}
                                        />
                                      </div>
                                    )}

                                    {!loading && (
                                      <div className="w-[1px] h-[15px] mx-[3px] bg-gray-300 "></div>
                                    )}

                                    {loading ? (
                                      <div
                                        className="flex items-center gap-[4px] text-[#7F56D9] cursor-pointer hover:opacity-80"
                                        onClick={handleStopGenerate}
                                      >
                                        <div className="animate-pulse">
                                          <PauseCircleOutlined className="text-[14px]" />
                                        </div>
                                        <span className="text-[12px] animate-pulse">停止响应</span>
                                      </div>
                                    ) : (
                                      <SendButton
                                        type="primary"
                                        icon={<ArrowUpOutlined className="text-[20px]" />}
                                        disabled={
                                          (mode === "single_agent_skill_mode" && !selectedSkill) ||
                                          showApproveButtons
                                        }
                                      />
                                    )}
                                  </Space>
                                )
                              }}
                              onChange={(v) => {
                                setContent(v)
                              }}
                              onSubmit={(nextContent) => {
                                if (
                                  !(mode === "single_agent_skill_mode" && !selectedSkill) &&
                                  !showApproveButtons
                                ) {
                                  handleSendMessage(nextContent, uploadedFiles)
                                  setUploadedFiles([]) // Clear uploaded files after sending
                                } else if (showApproveButtons) {
                                  messageAnt.warning("请先完成授权")
                                }
                              }}
                              onCancel={() => {
                                handleStopGenerate()
                              }}
                            />
                            {agentMode == 2 && !loading && (
                              <div className="absolute right-[95px] top-1/2 transform -translate-y-1/2 z-10">
                                <VoiceSessionInfoPopover
                                  variableConfigs={variableConfigs}
                                  onSessionInfoSubmit={handleVoiceSessionInfoSubmit}
                                  agentNo={agentNo}
                                  botNo={botNo}
                                />
                              </div>
                            )}
                            {renderConversationInfo()}
                          </div>
                        )}
                        <div className="text-[10px] text-gray-400 mt-1 text-center">
                          内容由AI生成，无法确保准确性
                          {mode === "single_agent_skill_mode" ? "" : "；Shift + Enter 支持换行输入"}
                        </div>
                        {/* todo */}
                      </div>
                    </div>
                  </Flex>
                </div>
              </div>
            </Splitter.Panel>

            {/* 调试内容区域  */}
            {isV2 && canOpenDebug && debugPanelVisible && hasToolInvoke && (
              <Splitter.Panel
                defaultSize="50%"
                min="30%"
                max="70%"
                style={isResizing ? { transition: "none" } : undefined}
              >
                <DebugInfoPanel messages={messages} isLoading={loading} />
              </Splitter.Panel>
            )}
          </Splitter>
        </div>
      </div>

      {/* Debug drawer */}
      <DebugDrawer
        visible={debugDrawerVisible}
        onClose={() => setDebugDrawerVisible(false)}
        botNo={botNo}
        sessionId={sessionId}
        mode={mode}
        isEmbedded={isEmbedded || false} // 判断是否是语音画布和剧本模式
      />

      {/* 图片预览Modal */}
      <Modal
        open={previewVisible}
        footer={null}
        onCancel={handlePreviewClose}
        width="auto"
        centered
        closable
        className="image-preview-modal"
      >
        {previewImage && <img src={previewImage} alt="预览" style={{ maxWidth: "100%" }} />}
      </Modal>
    </div>
  )
}

export default PreviewAndDebug
