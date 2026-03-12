import React, { useState, useRef, useEffect } from "react"
import { useLocation } from "react-router-dom"
import queryString from "query-string"
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
  Popconfirm,
  Modal,
  Progress
} from "antd"
import { Prompts, Sender, Attachments, Bubble, useXAgent, useXChat } from "@ant-design/x"
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
  CloudUploadOutlined,
  PaperClipOutlined
} from "@ant-design/icons"
import CopyToClipboard from "react-copy-to-clipboard"
import { fetchUploadFile } from "@/api/common/api"
import { botPrefix } from "@/constants"
import { getTokenAndServiceName } from "@/api/sso"
// import {
//   handleSendMessage as sendMessage,
//   handleStopGenerate as stopGenerate
// } from "../../utils/chatUtils"
import {
  handleSendMessage as sendMessage,
  handleStopGenerate as stopGenerate
} from "../../utils/chatUtilsStream"
import { fetchSessionAgentOsMessages, appendAgentMemory } from "@/api/agent/api"
import aiAvator from "@/assets/img/avatorAgentOs.png"
import MDEditor from "@uiw/react-md-editor"
import "../../styles/chat.scss"
import CustomEmpty from "./antd-styles/components/CustomEmpty"
import CodeMirror from "@uiw/react-codemirror"
import { json } from "@codemirror/lang-json"
import { indentationMarkers } from "@replit/codemirror-indentation-markers"
import {
  handleFileClick,
  listenParentIframeMessage,
  updateFilesStatus,
  calculateFileProgress
} from "../../utils/ChatListen"
import { Put } from "@/api/server"

import XLS from "@/assets/img/xls.png"
import CVS from "@/assets/img/txt.png"

// 添加全局样式标签
const styleTag = document.createElement("style")
styleTag.textContent = `
@keyframes pulse {
  0%, 100% {
    opacity: 0.2;
  }
  50% {
    opacity: 1;
  }
}
`
document.head.appendChild(styleTag)

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
      style: { background: "#5D5FEF" }
    }
  }
}

// New component to handle action headers
const ActionHeader = ({ serverActions, loading, messageId, currentAiMessageId, headerLoading }) => {
  const [actionItems, setActionItems] = useState([])
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    // Process message to extract action details if it exists
    if (serverActions && Array.isArray(serverActions)) {
      setActionItems(serverActions)
    }
  }, [serverActions])

  if (!actionItems || actionItems.length === 0) {
    return null
  }

  // Count how many items are in different statuses
  const completedCount = actionItems.filter((item) => item.processStatus === "END").length
  const failedCount = actionItems.filter(
    (item) => item.processStatus === "ERROR" || item.errorMsg
  ).length
  const inProgressCount = actionItems.filter((item) => item.processStatus === "START").length

  return (
    <div className="flex flex-col gap-1 mb-2">
      <div className="flex items-center justify-between">
        <div
          className="flex-1 flex items-center justify-between cursor-pointer text-xs text-gray-500 hover:text-gray-700 mb-1"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center gap-1">
            <span>
              调用过程{" "}
              <span
                className={
                  failedCount > 0
                    ? "text-red-500"
                    : inProgressCount > 0
                      ? "text-blue-500"
                      : completedCount === actionItems.length
                        ? "text-green-500"
                        : "text-yellow-500"
                }
              >
                ({completedCount}/{actionItems.length}){failedCount > 0 && ` ${failedCount} 失败`}
                {inProgressCount > 0 && ` ${inProgressCount} 进行中`}
              </span>
            </span>
            <i
              className={`iconfont ${isCollapsed ? "icon-xiala" : "icon-shangla"} text-[12px]`}
            ></i>

            {/* {loading && (
              <div className="flex items-center gap-1">
                <div className="inline-flex items-center">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: "3px",
                        height: "3px",
                        display: "inline-block",
                        verticalAlign: "middle",
                        marginTop: "-3px",
                        borderRadius: "50%",
                        margin: "0 2px",
                        backgroundColor: "#5D5FEF",
                        animation: "pulse 1s infinite ease-in-out",
                        animationDelay: `${i * 0.2}s`
                      }}
                    />
                  ))}
                </div>
                <span className="text-[12px] text-gray-500">AI思考中...</span>
              </div>
            )} */}
          </div>
        </div>
      </div>

      {!isCollapsed && (
        <div className="flex flex-col gap-1 border-l-2 border-gray-200 bg-gray-100 p-1 px-2 rounded-md">
          {actionItems.map((action, index) => {
            const {
              uniqueId,
              processStatus,
              actionType,
              name,
              knowledgeType,
              agentType,
              cost,
              errorMsg
            } = action

            // Determine the action type display text
            let actionTypeText = ""
            if (actionType === "RECALL_KNOWLEDGE") {
              if (knowledgeType === "FAQ") {
                actionTypeText = "问答知识库"
              } else if (knowledgeType === "DOCUMENT") {
                actionTypeText = "文档知识库"
              } else if (knowledgeType === "STRUCTURED") {
                actionTypeText = "结构化知识库"
              } else {
                actionTypeText = "知识库"
              }
            } else if (actionType === "INVOKE_AGENT_TOOL") {
              actionTypeText = agentType === "SKILL" ? "插件工作流" : "插件工具"
            } else if (actionType === "RESPONSE") {
              actionTypeText = "响应生成"
            }

            // For INVOKE_AGENT_TOOL, append the tool name
            const displayText =
              actionType === "INVOKE_AGENT_TOOL"
                ? `${processStatus === "START" ? "正在执行" : processStatus === "ERROR" ? "执行失败" : "已完成执行"}${actionTypeText} - ${name || "未知"}`
                : `${actionTypeText}${processStatus === "START" ? "正在处理中" : processStatus === "ERROR" ? "处理失败" : "处理结束"}`

            return (
              <div key={`${uniqueId || index}`} className="flex flex-col gap-1 text-xs py-1">
                <div className="flex items-center gap-2">
                  {processStatus === "START" ? (
                    <LoadingOutlined style={{ color: "#1890ff", fontSize: "14px" }} />
                  ) : processStatus === "ERROR" || errorMsg ? (
                    <CloseCircleOutlined style={{ color: "#f5222d", fontSize: "14px" }} />
                  ) : (
                    <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "14px" }} />
                  )}
                  <span
                    className={`${
                      processStatus === "END"
                        ? errorMsg
                          ? "text-red-500"
                          : "text-gray-600"
                        : processStatus === "ERROR"
                          ? "text-red-500"
                          : "text-blue-500"
                    } flex-1`}
                  >
                    {displayText}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const Chat = ({ className, mode = "intelligent", refreshReleaseStatus }) => {
  // 将 messageAnt 添加到全局，以便其他模块使用
  useEffect(() => {
    // 添加 pulse 动画的样式
    const style = document.createElement("style")
    style.innerHTML = `
      @keyframes pulse {
        0%, 100% {
          opacity: 0.2;
        }
        50% {
          opacity: 1;
        }
      }
    `
    document.head.appendChild(style)

    window.messageAnt = messageAnt
    return () => {
      delete window.messageAnt
      document.head.removeChild(style)
    }
  }, [])

  // 从URL查询参数获取值，如果没有则使用默认值
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)

  const botNo = queryParams.botNo || "b2024052917005894"
  const agentNo = queryParams.agentNo || "tzelchjvkbzie"
  const agentVersionNo = queryParams.agentVersionNo || "tzelchjvkbzie"
  const selectedSkill = queryParams.selectedSkill || "AWS_claude_sonnet"
  const sessionIdData = queryParams.sessionId || "1986739937722109952" //"1916708562617372672"
  // 将字符串转换为布尔值
  const readOnly = queryParams.readOnly === "true" || false

  const [loading, setLoading] = useState(false)
  const [content, setContent] = React.useState("")
  const bubbleContainerRef = React.useRef(null)
  const hasRefreshedRef = React.useRef(false)
  const [isDebugSuccessful, setIsDebugSuccessful] = useState(false)
  const [messages, setMessages] = useState([])
  const [sessionId, setSessionId] = useState(sessionIdData) //1907010196752961536
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
  const [isDragging, setIsDragging] = useState(false)
  const dropZoneRef = useRef(null)
  const fileInputRef = useRef(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progressPercent, setProgressPercent] = useState(0)
  const [approveModalVisible, setApproveModalVisible] = useState(false)
  const [waitForApproveTools, setWaitForApproveTools] = useState([])
  const [lastMessage, setLastMessage] = useState(null)
  const [approveLoading, setApproveLoading] = useState(false)
  // 新增文件状态存储
  const [fileStatusMap, setFileStatusMap] = useState({})
  // 添加一个新的状态，用于跟踪是否有文件正在处理
  const [hasProcessingFiles, setHasProcessingFiles] = useState(false)
  // 添加状态标记是否接收到过FILE_STATUS_UPDATE消息
  const [receivedFileStatusUpdate, setReceivedFileStatusUpdate] = useState(false)
  const [referencedFiles, setReferencedFiles] = useState([])
  const [showApproveButtons, setShowApproveButtons] = useState(false)
  const [currentAiMessageId, setCurrentAiMessageId] = useState(null)

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

  // 监听模式变化，当从Agentic切换到工作流模式时清空消息和会话ID
  useEffect(() => {
    if (prevModeRef.current === "single_agent_llm_mode" && mode === "single_agent_skill_mode") {
      // 从Agentic切换到工作流模式，清空消息和会话ID
      setMessages([])
      messageAnt.info("已切换到工作流模式，开始新的对话")
    }
    prevModeRef.current = mode
  }, [mode])

  // 监听 selectedSkill 变化，清除对话框内容
  useEffect(() => {
    if (selectedSkill) {
      // 清除对话框内容
      setContent("")
      // 清除消息历史和会话ID
      setMessages([])
      // 清除上传的文件
      setUploadedFiles([])
    }
  }, [selectedSkill])

  // 获取历史聊天记录
  useEffect(() => {
    fetchChatHistory()
  }, [sessionId])

  // 添加一个标记，用于控制是否需要自动滚动
  const shouldScrollRef = useRef(true)

  const scrollToBottom = () => {
    if (bubbleContainerRef.current) {
      bubbleContainerRef.current.scrollTop = bubbleContainerRef.current.scrollHeight
    }
  }

  useEffect(() => {
    // 仅当应该滚动时才执行滚动操作
    if (shouldScrollRef.current) {
      // 使用多个延时确保在不同渲染阶段都能滚动到底部
      setTimeout(scrollToBottom, 0)
      setTimeout(scrollToBottom, 100)
      setTimeout(scrollToBottom, 300)
    }
  }, [messages]) // 当消息列表变化时滚动到底部

  // 添加 MutationObserver 监听 DOM 变化
  useEffect(() => {
    if (!bubbleContainerRef.current) return

    const observer = new MutationObserver(() => {
      // 仅当应该滚动时才执行滚动操作
      if (shouldScrollRef.current) {
        scrollToBottom()
      }
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
  const processActionData = (data) => {
    try {
      if (!data || !data.data) return null

      const parsedData = typeof data.data === "string" ? JSON.parse(data.data) : data.data

      if (
        !parsedData.action ||
        (parsedData.action !== "RECALL_KNOWLEDGE" && parsedData.action !== "INVOKE_AGENT_TOOL")
      ) {
        return null
      }

      const { action, data: actionData } = parsedData

      if (!actionData) return null

      const { uniqueId, processStatus, knowledgeType, agentType, agentToolName, cost } = actionData

      return {
        uniqueId,
        processStatus,
        actionType: action,
        knowledgeType,
        agentType,
        name: agentToolName,
        cost: cost || null
      }
    } catch (error) {
      console.error("Error processing action data:", error)
      return null
    }
  }

  // 处理文件上传
  const handleFileUpload = async (file) => {
    try {
      setFileUploading(true)
      // 显示上传中的提示
      const loadingMessage = messageAnt.loading("文件上传中...", 0)

      const formData = new FormData()
      formData.append("file", file)

      const data = await fetchUploadFile(formData)
      const { temporarySignatureUrl } = data || {}

      if (temporarySignatureUrl) {
        const newFile = {
          uid: Date.now().toString(),
          name: file.name,
          status: "done",
          url: temporarySignatureUrl,
          type: file.type,
          isCurrentMessage: true,
          actionType: "click",
          success: true
        }

        // 替换而不是追加文件，并清空引用的文件
        setUploadedFiles([newFile])
        setReferencedFiles([])

        // 关闭loading提示
        loadingMessage()
        messageAnt.success("文件上传成功")
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

  // 处理消息中获取到的文件数据
  const processFileFromMessage = (data) => {
    // 跟踪已处理的文件，避免重复处理
    if (!processFileFromMessage.processedFiles) {
      processFileFromMessage.processedFiles = new Set()
    }

    // 用于追踪最后一个RESPONSE消息的ID和时间
    if (!processFileFromMessage.lastResponseInfo) {
      processFileFromMessage.lastResponseInfo = {
        messageId: null,
        timestamp: 0
      }
    }

    // 新增：创建消息队列来追踪消息顺序
    if (!processFileFromMessage.messageQueue) {
      processFileFromMessage.messageQueue = []
    }

    // 新增：记录上一个处理的消息类型
    if (!processFileFromMessage.lastMessageType) {
      processFileFromMessage.lastMessageType = ""
    }

    try {
      if (!data || !data.data) return null

      // 提取消息类型和ID信息
      let messageType = ""
      let responseId = ""

      try {
        if (data.data && typeof data.data === "string" && data.data.includes('"action"')) {
          const innerData = JSON.parse(data.data)
          messageType = innerData.action || ""

          // 如果是RESPONSE类型，记录此消息信息
          if (messageType === "RESPONSE") {
            const currentTime = Date.now()
            processFileFromMessage.lastResponseInfo = {
              messageId: data.requestId || data.sessionId,
              timestamp: currentTime
            }

            console.log(
              `记录最新RESPONSE消息: ID=${processFileFromMessage.lastResponseInfo.messageId}, 时间=${currentTime}`
            )
          }

          // 记录当前处理的消息类型
          processFileFromMessage.lastMessageType = messageType
        }
      } catch (e) {
        console.error("Error extracting action type:", e)
      }

      // 解析数据，考虑嵌套的JSON字符串情况
      let parsedData = data.data
      if (typeof parsedData === "string") {
        try {
          parsedData = JSON.parse(parsedData)
        } catch (e) {
          console.error("Failed to parse data string", e)
          return null
        }
      }

      // 判断是否有data属性，并且data属性可能是字符串形式的JSON
      if (parsedData.data && typeof parsedData.data === "string") {
        try {
          parsedData.data = JSON.parse(parsedData.data)
        } catch (e) {
          console.error("Failed to parse nested data string", e)
          return null
        }
      }

      // 打印数据结构，便于调试
      // console.log("处理文件数据:", JSON.stringify(parsedData, null, 2))

      // 提取action类型，用于确定文件位置
      let actionType = ""
      try {
        if (parsedData.data && typeof parsedData.data === "object" && parsedData.data.action) {
          actionType = parsedData.data.action
        } else if (typeof parsedData.data === "string" && parsedData.data.includes('"action"')) {
          const innerData = JSON.parse(parsedData.data)
          actionType = innerData.action || ""
        }
      } catch (e) {
        console.error("Error extracting action type:", e)
      }

      // 新增：记录消息顺序位置和序列ID
      const currentTime = Date.now()
      const messagePosition = currentTime
      const sequenceId = currentTime

      // 新增：将此消息添加到队列
      const messageEntry = {
        type: actionType,
        timestamp: currentTime,
        sequenceId: sequenceId,
        prevMessageType: processFileFromMessage.lastMessageType
      }
      processFileFromMessage.messageQueue.push(messageEntry)

      // 保持队列在合理大小，避免内存泄漏
      if (processFileFromMessage.messageQueue.length > 50) {
        processFileFromMessage.messageQueue = processFileFromMessage.messageQueue.slice(-50)
      }

      // 从数据中提取消息ID，用于追踪相关性
      const messageId = parsedData.requestId || parsedData.sessionId || data.sessionId

      // 检查是否包含executeResult.result.$agent_input_events
      if (
        parsedData.data &&
        parsedData.data.executeResult &&
        parsedData.data.executeResult.result &&
        parsedData.data.executeResult.result.$agent_input_events &&
        Array.isArray(parsedData.data.executeResult.result.$agent_input_events)
      ) {
        // 添加时间戳确保每个文件UID不同，即使服务端返回相同的uniqueId
        const timestamp = Date.now()

        // 提取文件并过滤已处理过的文件
        const newFiles = parsedData.data.executeResult.result.$agent_input_events
          .map((event, index) => {
            // 创建文件签名以检测重复
            const fileSignature = `${event.info.displayName || "文件"}-${event.info.uniqueId || ""}-${actionType}`

            // 检查是否已处理过此文件
            if (processFileFromMessage.processedFiles.has(fileSignature)) {
              console.log(`跳过已处理的文件: ${fileSignature}`)
              return null // 标记为需要过滤
            }

            // 标记为已处理
            processFileFromMessage.processedFiles.add(fileSignature)

            return {
              uid: `${event.info.uniqueId || timestamp}-${index}-${timestamp}`, // 确保uid唯一
              name: event.info.displayName || "文件",
              status: "done",
              type:
                event.info.defaultIconType === "FILE" ? "application/octet-stream" : "image/png",
              actionType: event.actionType || "click",
              isCurrentMessage: true,
              success: event.actionType === "click",
              loading: event.actionType === "loading",
              originalIndex: index, // 添加原始顺序索引
              metaData: event.info, // 保存原始元数据
              messageId: messageId, // 保存消息ID用于关联
              timestamp: timestamp, // 添加时间戳
              responseActionType: actionType, // 记录响应类型
              messagePosition: messagePosition + index, // 记录消息位置
              rawData: JSON.stringify(event), // 保存原始数据用于区分不同文件
              fileSignature: fileSignature, // 添加文件签名用于去重
              sequenceId: sequenceId + index, // 新增：添加序列ID
              prevMessageType: processFileFromMessage.lastMessageType, // 新增：记录前一条消息类型
              belongsToMessageSequence: messageEntry.sequenceId // 新增：关联到消息序列
            }
          })
          .filter((file) => file !== null) // 过滤掉已处理的文件

        return newFiles
      }

      // 检查是否包含较简单的events结构（部分响应使用此结构）
      if (parsedData.data && parsedData.data.events && Array.isArray(parsedData.data.events)) {
        // 添加时间戳确保每个文件UID不同
        const timestamp = Date.now()

        // 提取文件并过滤已处理过的文件
        const newFiles = parsedData.data.events
          .map((event, index) => {
            // 创建文件签名以检测重复
            const fileSignature = `${event.info.displayName || "文件"}-${event.info.uniqueId || ""}-${actionType}`

            // 检查是否已处理过此文件
            if (processFileFromMessage.processedFiles.has(fileSignature)) {
              console.log(`跳过已处理的文件: ${fileSignature}`)
              return null // 标记为需要过滤
            }

            // 标记为已处理
            processFileFromMessage.processedFiles.add(fileSignature)

            return {
              uid: `${event.info.uniqueId || timestamp}-${index}-${timestamp}`, // 确保uid唯一
              name: event.info.displayName || "文件",
              status: "done",
              type:
                event.info.defaultIconType === "FILE" ? "application/octet-stream" : "image/png",
              actionType: event.actionType || "click",
              isCurrentMessage: true,
              success: event.actionType === "click",
              loading: event.actionType === "loading",
              originalIndex: index, // 添加原始顺序索引
              metaData: event.info, // 保存原始元数据
              messageId: messageId, // 保存消息ID用于关联
              timestamp: timestamp, // 添加时间戳
              responseActionType: actionType, // 记录响应类型
              messagePosition: messagePosition + index, // 记录消息位置
              rawData: JSON.stringify(event), // 保存原始数据用于区分不同文件
              fileSignature: fileSignature, // 添加文件签名用于去重
              sequenceId: sequenceId + index, // 新增：添加序列ID
              prevMessageType: processFileFromMessage.lastMessageType, // 新增：记录前一条消息类型
              belongsToMessageSequence: messageEntry.sequenceId // 新增：关联到消息序列
            }
          })
          .filter((file) => file !== null) // 过滤掉已处理的文件

        return newFiles
      }

      // 检查根level的events结构
      if (parsedData.events && Array.isArray(parsedData.events)) {
        // 添加时间戳确保每个文件UID不同
        const timestamp = Date.now()

        // 提取文件并过滤已处理过的文件
        const newFiles = parsedData.events
          .map((event, index) => {
            // 创建文件签名以检测重复
            const fileSignature = `${event.info.displayName || "文件"}-${event.info.uniqueId || ""}-${actionType}`

            // 检查是否已处理过此文件
            if (processFileFromMessage.processedFiles.has(fileSignature)) {
              console.log(`跳过已处理的文件: ${fileSignature}`)
              return null // 标记为需要过滤
            }

            // 标记为已处理
            processFileFromMessage.processedFiles.add(fileSignature)

            return {
              uid: `${event.info.uniqueId || timestamp}-${index}-${timestamp}`, // 确保uid唯一
              name: event.info.displayName || "文件",
              status: "done",
              type:
                event.info.defaultIconType === "FILE" ? "application/octet-stream" : "image/png",
              actionType: event.actionType || "click",
              isCurrentMessage: true,
              success: event.actionType === "click",
              loading: event.actionType === "loading",
              originalIndex: index, // 添加原始顺序索引
              metaData: event.info, // 保存原始元数据
              messageId: messageId, // 保存消息ID用于关联
              timestamp: timestamp, // 添加时间戳
              responseActionType: actionType, // 记录响应类型
              messagePosition: messagePosition + index, // 记录消息位置
              rawData: JSON.stringify(event), // 保存原始数据用于区分不同文件
              fileSignature: fileSignature, // 添加文件签名用于去重
              sequenceId: sequenceId + index, // 新增：添加序列ID
              prevMessageType: processFileFromMessage.lastMessageType, // 新增：记录前一条消息类型
              belongsToMessageSequence: messageEntry.sequenceId // 新增：关联到消息序列
            }
          })
          .filter((file) => file !== null) // 过滤掉已处理的文件

        return newFiles
      }

      // 还可以添加更多数据结构检查，确保所有格式的文件都能被正确处理

      return null
    } catch (error) {
      console.error("Error processing file data:", error)
      return null
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
    setCurrentAiMessageId(aiMessageId)

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
      message,
      files,
      botNo,
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
      processFileFromMessage,
      handleNeedApprove,
      skipUserMessage: true, // 新增标记，表示跳过添加用户消息
      aiMessageId // 传递创建的AI消息ID
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
        }
        return updatedMessages
      })
    }

    setLastMessage(null)
  }

  // 需要手动滚动到底部的操作（例如发送消息）
  const manualScrollToBottom = () => {
    shouldScrollRef.current = true
    scrollToBottom()
  }

  // 修改 handleSendMessage，使用 manualScrollToBottom
  const handleSendMessage = async (message, files = []) => {
    // 合并上传的文件和引用的文件
    const allFiles = [...files, ...referencedFiles]

    // 构造 refer 字段，只用引用文件的信息
    const refer =
      referencedFiles.length > 0
        ? {
            events: referencedFiles.map((file) => ({
              actionType: "click",
              info: {
                uniqueId: file.uid,
                displayName: file.name,
                defaultIconType: "FILE"
              }
            }))
          }
        : undefined

    // 如果有上传的文件，添加一些额外的标记到AI消息
    if (allFiles.length > 0) {
      // 检查是否有需要处理的文件（actionType为loading的文件）
      const hasLoadingFiles = allFiles.some((file) => file.actionType === "loading")

      // 只有当有需要处理的文件时，才设置 isGenerating 为 true
      if (hasLoadingFiles) {
        setIsGenerating(true)
      }

      // 在发送消息前，先记录当前的文件状态到 fileStatusMap
      const newFileStatusMap = { ...fileStatusMap }
      allFiles.forEach((file) => {
        // 根据文件的actionType设置初始状态
        // 如果是loading类型的文件，设置为处理中状态
        if (file.actionType === "loading") {
          newFileStatusMap[file.uid] = {
            success: false,
            runNum: 0,
            totalNum: 100,
            progress: 0
          }
        } else {
          // click类型文件默认为成功状态
          newFileStatusMap[file.uid] = {
            success: true,
            runNum: 100,
            totalNum: 100,
            progress: 100
          }
        }
      })
      setFileStatusMap(newFileStatusMap)
    }

    console.log("发送消息，带上refer字段：", refer)

    // 确保发送消息时滚动到底部
    shouldScrollRef.current = true

    // 设置新消息的ID以便跟踪
    const newAiMessageId = (Date.now() + 1).toString()
    setCurrentAiMessageId(newAiMessageId)

    await sendMessage({
      message,
      files: allFiles,
      refer, // 传递 refer 字段
      botNo,
      agentNo,
      agentVersionNo,
      sessionId,
      botPrefix,
      mode,
      setMessages,
      setLoading,
      setContent,
      setSessionId,
      scrollToBottom: manualScrollToBottom, // 使用手动滚动函数
      controllerRef,
      timeoutRef,
      setServerTime,
      processActionData,
      processFileFromMessage,
      handleNeedApprove,
      // 添加消息处理回调，确保文件处理逻辑统一
      onMessageUpdate: (currentMessage, aiMessageId, files, isToolInvocation) => {
        if (files && files.length > 0) {
          console.log(`onMessageUpdate 被调用，处理 ${files.length} 个文件`)

          // 文件应该放在最后一段RESPONSE文本之前
          // 检查这些文件是否与最后一个RESPONSE相关
          const isLastResponseFile = files.some(
            (file) =>
              file.responseActionType === "RESPONSE" &&
              processFileFromMessage.lastResponseInfo &&
              Date.now() - processFileFromMessage.lastResponseInfo.timestamp < 5000
          )

          // 如果是最后一段RESPONSE相关的文件，强制立即显示，不等待文本渲染
          // 这确保所有文件都显示在最后一段文本之前
          updateMessagesWithFiles(
            (prevMessages) => prevMessages,
            aiMessageId,
            files,
            isToolInvocation
          )
        }
      }
    })

    // 帮助函数：更新消息中的文件
    const updateMessagesWithFiles = (getPrevMessages, aiMessageId, files, isToolInvocation) => {
      // 更新消息中的文件显示顺序
      setMessages((prevMessages) => {
        const messages =
          typeof getPrevMessages === "function" ? getPrevMessages(prevMessages) : prevMessages

        return messages.map((msg) => {
          if (msg.id === aiMessageId) {
            // 获取当前完整消息内容
            const fullMessage = msg.message || ""

            // 获取已有的文件
            const existingFiles = msg.files || []

            // 对新文件进行去重处理
            const filteredFiles = files.filter((newFile) => {
              // 检查是否已存在相同文件
              return !existingFiles.some((existingFile) => {
                // 通过比较文件名和类型判断是否为相同文件
                if (
                  existingFile.name === newFile.name &&
                  existingFile.responseActionType === newFile.responseActionType
                ) {
                  console.log(`updateMessagesWithFiles: 跳过重复文件 ${newFile.name}`)
                  return true // 文件已存在，需要过滤
                }
                return false // 文件不存在，保留
              })
            })

            // 如果没有新的不重复文件，直接返回原消息
            if (filteredFiles.length === 0) {
              console.log("updateMessagesWithFiles: 没有新的不重复文件，跳过更新")
              return msg
            }

            // 确保文件按originalIndex排序
            const sortedFiles = [...filteredFiles].sort((a, b) =>
              a.originalIndex !== undefined && b.originalIndex !== undefined
                ? a.originalIndex - b.originalIndex
                : 0
            )

            // 如果是工具调用消息，我们希望文件显示在这个位置，而不是在最终回复中
            if (isToolInvocation) {
              // 修复：不替换现有文件，而是合并现有文件和新文件
              // 标记这个消息含有工具文件
              return {
                ...msg,
                files: [...existingFiles, ...sortedFiles],
                toolFiles: true
              }
            }
            // 如果消息已经有工具文件标记，则保留原有文件并添加新文件
            else if (msg.toolFiles) {
              return {
                ...msg,
                files: [...existingFiles, ...sortedFiles]
              }
            }
            // 对于一般响应消息，按照常规逻辑分布文件
            else if (fullMessage.length > 0) {
              // 修复：不替换现有文件，而是合并现有文件和新文件
              return {
                ...msg,
                files: [...existingFiles, ...sortedFiles]
              }
            } else {
              // 修复：不替换现有文件，而是合并现有文件和新文件
              return {
                ...msg,
                files: [...existingFiles, ...sortedFiles]
              }
            }
          }
          return msg
        })
      })
    }

    // 只清空上传的文件，保留引用的文件
    setUploadedFiles([])
    hasRefreshedRef.current = true
  }

  const handleStopGenerate = () => {
    stopGenerate({
      controllerRef,
      timeoutRef,
      setLoading,
      setMessages
    })
    setCurrentAiMessageId(null)
  }

  const handleClear = () => {
    setClearPopoverVisible(true)
  }

  const confirmClear = () => {
    setContent("")
    setLoading(false)
    setMessages([])
    setUploadedFiles([])
    setIsDebugSuccessful(false)
    // 重置文件处理跟踪状态
    if (processFileFromMessage.processedFiles) {
      processFileFromMessage.processedFiles.clear()
      console.log("已重置文件处理状态")
    }
    messageAnt.success(`${mode === "single_agent_llm_mode" ? "Agentic" : "工作流模式"}对话已清空`)
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
        <Button size="small" type="primary" danger onClick={confirmClear}>
          确认
        </Button>
      </div>
    </div>
  )

  // 模拟调试成功

  // 处理文件选择，添加处理中状态检查和只读检查
  const handleFileSelect = async (e) => {
    // 如果是只读模式，禁止上传
    if (readOnly) {
      messageAnt.warning("当前为只读模式，禁止上传文件")
      e.target.value = null
      return
    }

    // 如果有文件正在处理，禁止上传
    if (hasProcessingFiles) {
      messageAnt.warning("文件正在处理中，请稍候再上传")
      e.target.value = null
      return
    }

    const file = e.target.files[0]
    if (!file) return

    // 验证文件类型
    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv"
    ]
    if (!validTypes.includes(file.type)) {
      messageAnt.error("只支持 Excel 和 CSV 文件!")
      return
    }

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

  // 处理拖拽事件，添加处理中状态检查和只读检查
  const handleDragEnter = (e) => {
    // 如果是只读模式，禁止拖拽上传
    if (readOnly) {
      e.preventDefault()
      e.stopPropagation()
      return
    }

    // 如果有文件正在处理，禁止拖拽上传
    if (hasProcessingFiles) {
      e.preventDefault()
      e.stopPropagation()
      return
    }

    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const rect = dropZoneRef.current.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY

    if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  // 修改 handleDrop，添加处理中状态检查
  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    // 如果有文件正在处理，禁止拖拽上传
    if (hasProcessingFiles) {
      messageAnt.warning("文件正在处理中，请稍候再上传")
      return
    }

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 1) {
      messageAnt.warning("只支持单个文件上传")
      return
    }

    const file = files[0]
    // 验证文件类型
    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv"
    ]
    if (!validTypes.includes(file.type)) {
      messageAnt.error("只支持 Excel 和 CSV 文件!")
      return
    }

    // 验证文件大小
    const isLt10M = file.size / 1024 / 1024 < 10
    if (!isLt10M) {
      messageAnt.error("文件大小不能超过10MB!")
      return
    }

    await handleFileUpload(file)
  }

  // 添加全局拖拽事件监听
  useEffect(() => {
    const handleGlobalDragOver = (e) => {
      e.preventDefault()
      e.stopPropagation()
    }

    const handleGlobalDrop = (e) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
    }

    document.addEventListener("dragover", handleGlobalDragOver)
    document.addEventListener("drop", handleGlobalDrop)

    return () => {
      document.removeEventListener("dragover", handleGlobalDragOver)
      document.removeEventListener("drop", handleGlobalDrop)
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

  // 抽离 Sender 的 header 属性
  const senderHeader =
    uploadedFiles.length > 0 || referencedFiles.length > 0 ? (
      <div
        className="flex flex-wrap gap-2 p-4 bg-white rounded-md mb-1"
        style={{ paddingBottom: 5 }}
      >
        {[...uploadedFiles, ...referencedFiles].map((file) => (
          <div
            key={file.uid}
            className="bg-[#EFF1F4] rounded-md px-2 flex items-left text-[14px] items-center relative"
            style={{ height: 56 }}
          >
            {file.type === "application/vnd.ms-excel" ||
            file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ? (
              <img src={XLS} alt="Excel" className="w-[32px] h-[32px]" />
            ) : file.type === "text/csv" ? (
              <img src={CVS} alt="CSV" className="w-[32px] h-[32px]" />
            ) : (
              // <FileOutlined className="text-gray-500" />
              <img src={XLS} alt="Excel" className="w-[32px] h-[32px]" />
            )}
            <span className="truncate max-w-[200px]" style={{ marginLeft: 5 }}>
              {file.name}
            </span>

            <i
              className="iconfont icon-tuodong-shanchu bg-black rounded-full text-[12px] text-white cursor-pointer opacity-100 hover:opacity-80 absolute"
              onClick={() => {
                if (file.isCurrentMessage) {
                  setUploadedFiles([])
                } else {
                  setReferencedFiles((prev) => prev.filter((f) => f.uid !== file.uid))
                }
              }}
              style={{
                width: 18,
                height: 18,
                top: "-6px",
                right: "-6px",
                background: "#000",
                textAlign: "center",
                lineHeight: "19px"
              }}
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
    ) : null

  // 抽离 Sender 的 actions 属性
  const senderActions = (_, info) => {
    const { SendButton } = info.components
    return (
      <Space size="small">
        <Tooltip
          placement="top"
          title={
            hasProcessingFiles
              ? "文件处理中，请稍候"
              : readOnly
                ? "只读模式，禁止上传"
                : "支持excel文件上传"
          }
        >
          <PaperClipOutlined
            className={`text-[22px] cursor-pointer ${hasProcessingFiles || readOnly || loading ? "text-gray-400" : "hover:text-[#5D5FEF]"}`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (
                fileInputRef.current &&
                !isGenerating &&
                !hasProcessingFiles &&
                !readOnly &&
                !loading
              ) {
                fileInputRef.current.click()
              } else if (hasProcessingFiles) {
                messageAnt.warning("文件正在处理中，请稍候再上传")
              } else if (readOnly) {
                messageAnt.warning("当前为只读模式，禁止上传文件")
              }
            }}
            style={{
              pointerEvents:
                isGenerating || hasProcessingFiles || readOnly || loading ? "none" : "auto",
              cursor:
                isGenerating || hasProcessingFiles || readOnly || loading
                  ? "not-allowed"
                  : "pointer"
            }}
          />
        </Tooltip>
        <div className="w-[1px] h-[15px] bg-[#D0D5DD]" style={{ margin: "0 6px" }}></div>
        {loading ? (
          <div className="flex items-center gap-[4px] text-[#5D5FEF] hover:opacity-80">
            <div className="inline-flex place-items-center">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    margin: "0 2px",
                    backgroundColor: "#5D5FEF",
                    display: "inline-block",
                    verticalAlign: "middle",
                    marginTop: "-2px",
                    animation: "pulse 1s infinite ease-in-out",
                    animationDelay: `${i * 0.2}s`
                  }}
                />
              ))}
            </div>
            {/* <span onClick={handleStopGenerate} className="text-[12px] cursor-pointer text-gray-600">停止响应</span> */}
          </div>
        ) : (
          <SendButton
            type="primary"
            icon={<ArrowUpOutlined className="text-[25px]" />}
            disabled={!selectedSkill || hasProcessingFiles || readOnly}
          />
        )}
      </Space>
    )
  }

  // 修改 handlePasteFile，添加处理中状态检查和只读检查
  const handlePasteFile = (_, files) => {
    // 如果是只读模式，禁止粘贴上传
    if (readOnly) {
      messageAnt.warning("当前为只读模式，禁止上传文件")
      return
    }

    // 检查是否真的有文件正在处理中（status为1的文件）
    // const realProcessingFiles = Object.values(fileStatusMap).filter((status) => {
    //   const statusNum =
    //     typeof status.status === "string" ? parseInt(status.status, 10) : Number(status.status || 1)
    //   return statusNum === 1
    // })

    // 只有真的有文件在处理中时才阻止上传
    // if (realProcessingFiles.length > 0) {
    //   messageAnt.warning("文件正在处理中，请稍候再上传")
    //   return
    // }

    if (files.length > 1) {
      messageAnt.warning("只支持单个文件上传")
      return
    }
    const file = files[0]
    // 验证文件类型
    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv"
    ]
    if (!validTypes.includes(file.type)) {
      messageAnt.error("只支持 Excel 和 CSV 文件!")
      return
    }

    // 验证文件大小
    const isLt10M = file.size / 1024 / 1024 < 10
    if (!isLt10M) {
      messageAnt.error("文件大小不能超过10MB!")
      return
    }

    handleFileUpload(file)
  }

  // 监听消息变化，检测新文件
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.files && lastMessage.files.length > 0 && !isGenerating) {
        // 检查是否有需要处理的文件（actionType为loading的文件）
        const hasLoadingFiles = lastMessage.files.some((file) => file.actionType === "loading")
        // 只有当有需要处理的文件时，才设置isGenerating为true
        if (hasLoadingFiles) {
          setIsGenerating(true)
        }
      }
    }
  }, [messages])

  // 添加生成进度的效果
  useEffect(() => {
    if (isGenerating) {
      setProgressPercent(0)
      const timer = setInterval(() => {
        setProgressPercent((prev) => {
          if (prev >= 100) {
            clearInterval(timer)
            setIsGenerating(false)
            return 100
          }
          return prev + 0.5 // 减小增量，使进度更平滑
        })
      }, 15) // 15ms 间隔，3秒完成 (100/0.5 * 15ms = 3000ms)
      return () => clearInterval(timer)
    }
  }, [isGenerating])

  // 文件处理中覆盖层组件
  const FileProcessingOverlay = React.memo(() => {
    // 如果没有收到FILE_STATUS_UPDATE消息或没有处理中的文件，不显示覆盖层
    if (!receivedFileStatusUpdate || !hasProcessingFiles) return null

    // 获取所有处理中的文件信息
    const processingFiles = []

    // 从fileStatusMap中获取所有处理中的文件
    Object.entries(fileStatusMap).forEach(([fileId, status]) => {
      // 将status转换为数字，确保处理一致性
      const statusNum =
        typeof status.status === "string" ? parseInt(status.status, 10) : Number(status.status || 1)

      // 如果状态是1(处理中)，则显示
      if (statusNum === 1) {
        // 尝试找到文件信息
        let fileInfo = null

        // 在所有消息中查找
        for (const msg of messages) {
          if (msg.files && msg.files.length > 0) {
            const foundFile = msg.files.find((f) => {
              // 获取uid的第一部分（id）
              const fileUid = String(f.uid).split("-")[0]
              return fileUid === String(fileId)
            })
            if (foundFile) {
              fileInfo = foundFile
              break
            }
          }
        }

        // 如果没找到，检查上传的文件
        if (!fileInfo) {
          const foundFile = uploadedFiles.find((f) => {
            const fileUid = String(f.uid).split("-")[0]
            return fileUid === String(fileId)
          })
          if (foundFile) fileInfo = foundFile
        }

        // 添加到处理中的文件列表
        processingFiles.push({
          uid: fileId,
          name: fileInfo ? fileInfo.name : `文件 ${fileId}`,
          status: statusNum,
          runNum: status.runNum,
          totalNum: status.totalNum,
          progress: status.totalNum ? Math.floor((status.runNum / status.totalNum) * 100) : 0
        })
      }
    })

    // 如果没有找到处理中的文件，不显示覆盖层
    if (processingFiles.length === 0) return null

    return (
      <div className="loading-view-sender absolute inset-0 w-[100%] h-[100%] top-0 flex items-center justify-center rounded-md overflow-hidden">
        <div className="file-processing-overlay p-4 text-center">
          <div className="flex flex-col items-center gap-3">
            {processingFiles.length > 0 &&
              (() => {
                // Get the first file instead of the last one
                const file = processingFiles[0]
                const progress = file.progress || 10
                return (
                  <div
                    key={file.uid || "first-file"}
                    className="file-preview p-3 bg-white rounded-lg flex items-center gap-2 shadow-sm border border-gray-100 w-full max-w-xs mx-auto mb-2"
                  >
                    <img className="w-[40px]" src={XLS} alt="" />
                    <div className="flex-1 text-left w-[200px]">
                      <div className="text-[14px] text-[#0E121B] font-[500] truncate">
                        {file.name || "文件处理中"}
                      </div>
                      <div className="flex justify-start items-center">
                        <Progress
                          percent={progress}
                          showInfo={false}
                          size="small"
                          strokeColor={{
                            "0%": "#5D5FEF",
                            "100%": "#7879F1"
                          }}
                          className="w-[80%]"
                        />
                        {file.runNum !== undefined && file.totalNum !== undefined && (
                          <div className="text-[12px] text-gray-500 ml-1">
                            {file.runNum}/{file.totalNum}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })()}
            <p className="text-[#525866] text-[12px] -mt-1">请稍候，系统正在处理您的文件...</p>
          </div>
        </div>
      </div>
    )
  })

  // 监听hasProcessingFiles变化，删除调试信息
  useEffect(() => {
    // 不再输出状态变化的日志
  }, [hasProcessingFiles])

  // 监听父 iframe 消息
  useEffect(() => {
    // 在组件挂载时，向父窗口发送初始化消息
    window.parent.postMessage(
      {
        type: "INIT_AGENT_IFRAME",
        data: {
          ready: true,
          botNo,
          agentNo,
          agentVersionNo,
          selectedSkill
        }
      },
      "*"
    )

    // 设置消息监听
    const cleanup = listenParentIframeMessage((data) => {
      console.log("收到iframe消息:", data)

      // 在处理iframe消息前禁用自动滚动
      shouldScrollRef.current = false

      // 处理文件状态更新
      if (data.type === "fileStatus") {
        // 标记已收到FILE_STATUS_UPDATE消息
        setReceivedFileStatusUpdate(true)

        // 检查是否有正在处理的文件（状态为1的文件）
        const hasProcessing = data.files.some((file) => {
          const statusNum =
            typeof file.status === "string" ? parseInt(file.status, 10) : Number(file.status || 1)
          return statusNum === 1
        })

        // 检查是否所有文件都已处理完成（状态为2）
        const allCompleted = data.files.every((file) => {
          const statusNum =
            typeof file.status === "string" ? parseInt(file.status, 10) : Number(file.status || 1)
          return statusNum === 2
        })

        // 立即设置处理状态
        setHasProcessingFiles(hasProcessing)

        // 如果所有文件都已处理完成，立即将isGenerating设置为false
        if (allCompleted || !hasProcessing) {
          setIsGenerating(false)
        }

        setFileStatusMap((prevState) => {
          const newState = { ...prevState }

          // 更新每个文件的状态
          data.files.forEach((file) => {
            // 将 file.id 转为字符串
            const fileId = String(file.id)

            // 将status转换为数字，确保处理一致性
            const statusNum =
              typeof file.status === "string" ? parseInt(file.status, 10) : Number(file.status || 1)

            // 使用更灵活的匹配方式，遍历检查所有已知文件ID
            let matchFound = false

            // 首先检查精确匹配
            if (newState[fileId]) {
              // 如果状态为2(已完成)，确保文件被标记为已完成
              if (statusNum === 2) {
                newState[fileId] = {
                  status: 2,
                  runNum: Number(file.totalNum) || 100,
                  totalNum: Number(file.totalNum) || 100,
                  progress: 100
                }
              } else {
                newState[fileId] = {
                  status: statusNum,
                  runNum: Number(file.runNum) || 0,
                  totalNum: Number(file.totalNum) || 100,
                  progress: file.totalNum ? Math.floor((file.runNum / file.totalNum) * 100) : 0
                }
              }
              matchFound = true
            }

            // 如果没找到精确匹配，尝试查找包含关系
            if (!matchFound) {
              Object.keys(newState).forEach((existingId) => {
                if (existingId.includes(fileId) || fileId.includes(existingId)) {
                  // 如果状态为2(已完成)，确保文件被标记为已完成
                  if (statusNum === 2) {
                    newState[existingId] = {
                      status: 2,
                      runNum: Number(file.totalNum) || 100,
                      totalNum: Number(file.totalNum) || 100,
                      progress: 100
                    }
                  } else {
                    newState[existingId] = {
                      status: statusNum,
                      runNum: Number(file.runNum) || 0,
                      totalNum: Number(file.totalNum) || 100,
                      progress: file.totalNum ? Math.floor((file.runNum / file.totalNum) * 100) : 0
                    }
                  }
                  matchFound = true
                }
              })
            }

            // 如果仍然没有找到匹配，则添加新条目
            if (!matchFound) {
              // 如果状态为2(已完成)，确保文件被标记为已完成
              if (statusNum === 2) {
                newState[fileId] = {
                  status: 2,
                  runNum: Number(file.totalNum) || 100,
                  totalNum: Number(file.totalNum) || 100,
                  progress: 100
                }
              } else {
                newState[fileId] = {
                  status: statusNum,
                  runNum: Number(file.runNum) || 0,
                  totalNum: Number(file.totalNum) || 100,
                  progress: file.totalNum ? Math.floor((file.runNum / file.totalNum) * 100) : 0
                }
              }
            }
          })

          return newState
        })

        // 更新消息中的文件状态
        updateMessagesWithFileStatus(data.files)
      }

      // 处理初始化数据
      else if (data.type === "initData") {
        console.log("收到初始化数据:", data.data)
        // 可以在这里处理初始化数据
      }
      // 处理 SEND_AGENT_CLIENT_CE 消息
      else if (data.type === "save") {
        // 构造事件数据
        const eventData = {
          actionType: "click",
          info: {
            uniqueId: data.id,
            displayName: data.fileName,
            defaultIconType: "FILE"
          }
        }

        // 构造请求数据
        const requestData = {
          role: "user",
          content: `用户更新【${data.fileName}】数据`,
          events: [eventData]
        }

        // 调用接口
        appendAgentMemory(sessionId, requestData)
          .then((response) => {
            if (response.success) {
              messageAnt.success("保存成功")
            } else {
              messageAnt.error("保存失败")
            }
          })
          .catch((error) => {
            console.error("保存失败:", error)
            messageAnt.error("保存失败")
          })
      } else if (data.type === "reference") {
        // 如果是只读模式，拒绝引用并提示用户
        if (readOnly) {
          messageAnt.warning("当前为只读模式，禁止引用文件")
          return
        }

        // 替换引用的文件（而不是追加到列表）
        setReferencedFiles([
          {
            uid: data.id,
            name: data.fileName,
            status: "done",
            type: data.fileName.endsWith(".xlsx")
              ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              : data.fileName.endsWith(".csv")
                ? "text/csv"
                : "application/octet-stream",
            actionType: "click",
            isCurrentMessage: false,
            refer: {
              events: [
                {
                  actionType: "click",
                  info: {
                    uniqueId: data.id,
                    displayName: data.fileName,
                    defaultIconType: "FILE"
                  }
                }
              ]
            }
          }
        ])
        // 清空上传的文件，确保只有一个文件存在
        setUploadedFiles([])
        messageAnt.success("引用成功")
      }

      // 在消息处理完成后，延迟一点时间再恢复自动滚动
      // 这样可以确保在setState的更新渲染完成后不会触发不必要的滚动
      setTimeout(() => {
        shouldScrollRef.current = true
      }, 500)
    })

    // 组件卸载时清理
    return () => {
      cleanup()

      // 告知父窗口组件已卸载
      window.parent.postMessage(
        {
          type: "UNMOUNT_AGENT_IFRAME",
          data: {
            botNo,
            agentNo
          }
        },
        "*"
      )
    }
  }, [botNo, agentNo, agentVersionNo, selectedSkill])

  // 更新消息中文件的状态
  const updateMessagesWithFileStatus = (statusFiles) => {
    if (!statusFiles || !statusFiles.length) return

    setMessages((prevMessages) => {
      return prevMessages.map((message) => {
        // 只更新AI消息中的文件
        if (message.status === "ai" && message.files && message.files.length > 0) {
          const updatedFiles = message.files.map((file) => {
            // 查找匹配的状态文件，将id转为字符串进行比较
            // 增加更灵活的匹配方式，考虑id可能是数字或字符串，也可能包含前缀
            const statusFile = statusFiles.find((sf) => {
              const fileUid = String(file.uid)
              const sfId = String(sf.id)
              // 直接匹配
              if (fileUid === sfId) return true
              // 检查一个是否包含另一个
              if (fileUid.includes(sfId) || sfId.includes(fileUid)) return true
              return false
            })

            if (statusFile) {
              // 将status转换为数字，确保处理一致性
              const statusNum =
                typeof statusFile.status === "string"
                  ? parseInt(statusFile.status, 10)
                  : Number(statusFile.status || 1)

              // 计算新的进度
              const newProgress = statusFile.totalNum
                ? Math.floor((statusFile.runNum / statusFile.totalNum) * 100)
                : 0

              // 根据状态设置actionType
              let newActionType = "loading"
              if (statusNum === 2) {
                newActionType = "click"
              } else if (statusNum === 3) {
                newActionType = "error"
              }

              return {
                ...file,
                status: statusNum,
                runNum: statusFile.runNum || 0,
                totalNum: statusFile.totalNum || 100,
                progress: newProgress,
                actionType: newActionType,
                // 增加success属性，确保状态为2时，文件被标记为成功
                success: statusNum === 2
              }
            }
            return file
          })

          return {
            ...message,
            files: updatedFiles
          }
        }

        return message
      })
    })
  }

  // 添加新函数：构建消息和文件的交替显示
  const buildAlternatingDisplay = (message, files) => {
    if (!files || files.length === 0) {
      return { messageParts: [message], eventIndexes: [] }
    }

    // 分析最近的消息流模式
    const messageEntries = processFileFromMessage.messageQueue || []
    const flowAnalysis = analyzeMessageFlow(messageEntries)

    console.log("消息流分析:", flowAnalysis)

    // 基于流模式调整排序策略
    const hasAlternatingPattern =
      flowAnalysis.hasResponseThenInvoke || flowAnalysis.hasInvokeThenResponse

    // 按各种因素排序文件
    const sortedFiles = [...files].sort((a, b) => {
      // 1. 首先基于响应类型排序
      if (a.responseActionType && b.responseActionType) {
        // 如果存在交替模式，则确保INVOKE_AGENT_TOOL靠前
        if (hasAlternatingPattern) {
          if (
            a.responseActionType === "INVOKE_AGENT_TOOL" &&
            b.responseActionType !== "INVOKE_AGENT_TOOL"
          )
            return -1
          if (
            a.responseActionType !== "INVOKE_AGENT_TOOL" &&
            b.responseActionType === "INVOKE_AGENT_TOOL"
          )
            return 1
        }
      }

      // 2. 然后基于序列ID排序
      if (a.sequenceId && b.sequenceId) {
        return a.sequenceId - b.sequenceId
      }

      // 3. 基于消息位置排序
      if (a.messagePosition && b.messagePosition) {
        return a.messagePosition - b.messagePosition
      }

      // 4. 最后按时间戳排序
      if (a.timestamp && b.timestamp) {
        return a.timestamp - b.timestamp
      }

      return 0
    })

    const parts = []
    const eventIndexes = []

    // 处理只有文件没有消息的情况
    if (!message || message.trim() === "") {
      sortedFiles.forEach((file, idx) => {
        eventIndexes.push({
          index: idx,
          data: { info: { uniqueId: file.uid } },
          fileOrder: idx
        })
        parts.push(null)
      })
      return { messageParts: parts, eventIndexes }
    }

    // 将消息拆分为段落
    const paragraphs = message.split("\n\n").filter((p) => p.trim())

    // 基于消息模式选择交替显示策略
    if (hasAlternatingPattern) {
      // 处理交替模式 - 更智能地安排文件和文本
      const mergedItems = []

      // 创建混合序列，包含文件和文本
      // 1. 添加段落，为每段分配一个序列位置
      paragraphs.forEach((para, idx) => {
        mergedItems.push({
          type: "text",
          content: para,
          sequenceId: idx * 100, // 使用更大间隔允许文件穿插
          isToolFile: false
        })
      })

      // 2. 添加文件，根据类型和前一个消息类型进行策略性插入
      sortedFiles.forEach((file, idx) => {
        const isToolFile = file.responseActionType === "INVOKE_AGENT_TOOL"

        // 根据不同模式分配不同位置
        let position = 0

        if (isToolFile) {
          // INVOKE_AGENT_TOOL文件应显示在前面段落之后
          if (paragraphs.length > 0) {
            // 找到适合位置：第一段后面是个好位置
            position = mergedItems[0].sequenceId + 10
          }
        } else {
          // RESPONSE类型文件通常应显示在结尾
          position =
            mergedItems.length > 0 ? mergedItems[mergedItems.length - 1].sequenceId + 10 : 1000 // 如果没有其他项，放在较后位置
        }

        mergedItems.push({
          type: "file",
          content: file,
          sequenceId: position,
          isToolFile: isToolFile
        })
      })

      // 3. 按序列ID排序
      mergedItems.sort((a, b) => a.sequenceId - b.sequenceId)

      // 4. 再次优化：确保文件在合适位置
      for (let i = 1; i < mergedItems.length; i++) {
        const prevItem = mergedItems[i - 1]
        const currItem = mergedItems[i]

        // 如果工具文件（INVOKE_AGENT_TOOL）被放在文本后，尝试移动到前面
        if (currItem.type === "file" && currItem.isToolFile && prevItem.type === "text" && i > 1) {
          // 尝试移动到前一个文本之前
          ;[mergedItems[i - 1], mergedItems[i]] = [mergedItems[i], mergedItems[i - 1]]
        }
      }

      // 5. 构建最终消息部分
      mergedItems.forEach((item) => {
        if (item.type === "text") {
          parts.push(item.content)
        } else {
          eventIndexes.push({
            index: parts.length,
            data: { info: { uniqueId: item.content.uid } },
            fileOrder: sortedFiles.findIndex((f) => f.uid === item.content.uid)
          })
          parts.push(null) // 文件占位符
        }
      })
    } else if (paragraphs.length >= sortedFiles.length) {
      // 段落足够多的情况：简单地按顺序穿插文件和段落
      paragraphs.forEach((para, idx) => {
        parts.push(para)

        // 如果还有文件，在段落后添加
        if (idx < sortedFiles.length) {
          eventIndexes.push({
            index: parts.length,
            data: { info: { uniqueId: sortedFiles[idx].uid } },
            fileOrder: idx
          })
          parts.push(null) // 文件占位符
        }
      })
    } else {
      // 段落不够多：合理分配
      // 首先添加第一段
      if (paragraphs.length > 0) {
        parts.push(paragraphs[0])
      }

      // 穿插文件
      sortedFiles.forEach((file, idx) => {
        // 确定此文件应该放在哪里
        const isToolFile = file.responseActionType === "INVOKE_AGENT_TOOL"

        // 工具文件应放在前面，响应文件放在后面
        if (isToolFile || idx === 0) {
          // 如果是第一个文件或工具文件，放在第一段后
          eventIndexes.push({
            index: parts.length,
            data: { info: { uniqueId: file.uid } },
            fileOrder: idx
          })
          parts.push(null) // 文件占位符

          // 如果还有段落，在第一个文件后添加更多段落
          if (idx === 0 && paragraphs.length > 1) {
            // 添加第二段
            parts.push(paragraphs[1])
          }
        } else {
          // 其他文件放在后面
          eventIndexes.push({
            index: parts.length,
            data: { info: { uniqueId: file.uid } },
            fileOrder: idx
          })
          parts.push(null) // 文件占位符

          // 在每个后续文件后添加剩余段落
          const paraIdx = idx + 1
          if (paraIdx < paragraphs.length) {
            parts.push(paragraphs[paraIdx])
          }
        }
      })

      // 确保添加所有段落
      const addedParas = Math.min(sortedFiles.length + 1, paragraphs.length)
      if (addedParas < paragraphs.length) {
        // 添加剩余段落
        parts.push(paragraphs.slice(addedParas).join("\n\n"))
      }
    }

    return { messageParts: parts, eventIndexes }
  }

  // 添加辅助函数：分析消息类型交替情况
  const analyzeMessageFlow = (messages) => {
    if (!analyzeMessageFlow.messageHistory) {
      analyzeMessageFlow.messageHistory = []
    }

    // 记录此消息
    if (messages && Array.isArray(messages)) {
      analyzeMessageFlow.messageHistory = [...analyzeMessageFlow.messageHistory, ...messages].slice(
        -100
      ) // 保留最近100条消息
    }

    // 如果没有足够的历史记录则跳过分析
    if (analyzeMessageFlow.messageHistory.length < 2) {
      return {
        hasResponseThenInvoke: false,
        hasInvokeThenResponse: false,
        messagePatterns: []
      }
    }

    // 分析消息模式
    const messageTypes = analyzeMessageFlow.messageHistory.map(
      (m) => m.type || m.responseActionType || "unknown"
    )
    const patterns = []

    // 检查模式
    for (let i = 1; i < messageTypes.length; i++) {
      patterns.push(`${messageTypes[i - 1]}->${messageTypes[i]}`)
    }

    // 检查特定模式
    const hasResponseThenInvoke = patterns.some((p) => p === "RESPONSE->INVOKE_AGENT_TOOL")
    const hasInvokeThenResponse = patterns.some((p) => p === "INVOKE_AGENT_TOOL->RESPONSE")

    return {
      hasResponseThenInvoke,
      hasInvokeThenResponse,
      messagePatterns: patterns.slice(-5) // 只返回最近5个模式
    }
  }

  // 更新parseMessageWithEvents函数，使用消息流分析结果
  const parseMessageWithEvents = (message, files) => {
    if (!message || !files || files.length === 0)
      return { messageParts: [message], eventIndexes: [] }

    // 重要：检查是否有不同的文件类型
    const uniqueFileNames = new Set(files.map((file) => file.name))

    // 更精确地判断是否有多种文件类型
    // 不仅考虑文件名，还考虑响应类型和来源
    const hasMultipleFileTypes =
      uniqueFileNames.size > 1 ||
      (files.some((file) => file.responseActionType === "INVOKE_AGENT_TOOL") &&
        files.some((file) => file.responseActionType === "RESPONSE"))

    // 检查文件是否来自工具调用，如果是，直接放在当前位置，不需要智能分布
    const hasToolFiles = files.some((file) => file.fromToolInvocation)

    // 检查是否有INVOKE_AGENT_TOOL和RESPONSE交替的情况
    const hasToolInvocation = files.some((file) => file.responseActionType === "INVOKE_AGENT_TOOL")
    const hasResponse = files.some((file) => file.responseActionType === "RESPONSE")
    const hasSequentialMessages = hasToolInvocation && hasResponse

    // 查找所有<@event>标签
    const eventRegex = /<@event>(.*?)<\/@event>/g
    let match = eventRegex.exec(message)

    // 如果消息中不包含<@event>标签但有文件，则使用新的交替显示逻辑
    if (!match && files.length > 0) {
      // 对于交替的INVOKE_AGENT_TOOL和RESPONSE消息，或者有多种文件类型的情况
      // 使用新的交替显示构建函数处理
      if (hasSequentialMessages || hasMultipleFileTypes) {
        return buildAlternatingDisplay(message, files)
      }

      // 对于单一类型文件，尝试使用新方法
      if (
        hasToolFiles ||
        files.some(
          (file) =>
            file.name.includes("数据集") ||
            file.name.includes("分析") ||
            file.responseActionType === "INVOKE_AGENT_TOOL"
        )
      ) {
        return buildAlternatingDisplay(message, files)
      }

      // 如果没有特殊要求，也使用新的交替显示方法
      return buildAlternatingDisplay(message, files)
    }

    // 以下是原有的处理逻辑，用于处理包含<@event>标签的消息
    const parts = []
    const eventIndexes = []
    let lastIndex = 0

    // 重置正则表达式执行位置
    eventRegex.lastIndex = 0

    // 解析消息内容，分割成文本和事件部分
    while ((match = eventRegex.exec(message)) !== null) {
      // 添加标签前的文本
      if (match.index > lastIndex) {
        parts.push(message.substring(lastIndex, match.index))
      }

      // 解析事件数据
      try {
        const eventData = JSON.parse(match[1])
        // 记录事件位置和数据
        eventIndexes.push({
          index: parts.length,
          data: eventData
        })
        // 添加占位符
        parts.push(null)
      } catch (error) {
        console.error("Error parsing event data:", error)
        // 添加原始标签文本（出错时）
        parts.push(match[0])
      }

      lastIndex = match.index + match[0].length
    }

    // 添加最后一部分文本
    if (lastIndex < message.length) {
      parts.push(message.substring(lastIndex))
    }

    return { messageParts: parts, eventIndexes }
  }

  // 修改fetchChatHistory函数，修复语法错误
  const fetchChatHistory = async () => {
    if (!sessionId) return

    try {
      setFetchingMessages(true)
      const response = await fetchSessionAgentOsMessages(sessionId)

      if (response && response.data && Array.isArray(response.data)) {
        // 新的数据格式处理
        let formattedMessages = []
        let lastProcessedFile = null

        // 遍历会话数据
        for (const session of response.data) {
          if (session.sessionMessages && Array.isArray(session.sessionMessages)) {
            // 处理每个会话中的消息
            for (let i = 0; i < session.sessionMessages.length; i++) {
              const msg = session.sessionMessages[i]

              // 检查是否是TOOL消息，并且是否包含文件信息
              let files = []

              // 处理AI消息中的events字段
              if (msg.role === "AI" && msg.events) {
                try {
                  const eventsData =
                    typeof msg.events === "string" ? JSON.parse(msg.events) : msg.events

                  // 检查events是否包含文件数据
                  if (Array.isArray(eventsData)) {
                    files = eventsData
                      .filter((event) => event.actionType && event.info)
                      .map((event, index) => {
                        const file = {
                          uid: event.info.uniqueId || Date.now().toString(),
                          name: event.info.displayName || "文件",
                          status: "done",
                          type:
                            event.info.defaultIconType === "FILE"
                              ? "application/octet-stream"
                              : "image/png",
                          actionType: event.actionType || "click",
                          isCurrentMessage: false,
                          success: event.actionType === "click",
                          originalIndex: index // 添加原始顺序信息
                        }

                        // 如果是已处理的文件（actionType为click），保存为最后一个处理文件
                        if (event.actionType === "click") {
                          lastProcessedFile = file
                        }

                        return file
                      })
                  }
                } catch (error) {
                  console.error("Error parsing events data:", error)
                }
              }

              if (msg.role === "TOOL" && msg.content) {
                try {
                  const toolContent = JSON.parse(msg.content)

                  // 检查是否包含文件数据
                  if (toolContent.result && typeof toolContent.result === "object") {
                    // 遍历所有调用结果
                    Object.entries(toolContent.result).forEach(([toolName, toolResult]) => {
                      // 检查每个工具结果
                      Object.values(toolResult).forEach((item) => {
                        // 查找包含 $agent_input_events 的项
                        if (
                          item &&
                          item.$agent_input_events &&
                          Array.isArray(item.$agent_input_events)
                        ) {
                          // 转换文件数据 - 历史记录不标记为当前消息
                          files = item.$agent_input_events.map((event, index) => ({
                            uid: event.info.uniqueId || Date.now().toString(),
                            name: event.info.displayName || "文件",
                            status: "done",
                            type:
                              event.info.defaultIconType === "FILE"
                                ? "application/octet-stream"
                                : "image/png",
                            actionType: event.actionType || "click",
                            isCurrentMessage: false, // 历史记录标记为非当前消息
                            // 如果actionType是click，则直接标记为成功
                            success: event.actionType === "click",
                            originalIndex: index // 添加原始顺序信息
                          }))
                        }
                      })
                    })
                  }
                } catch (error) {
                  console.error("Error parsing tool content:", error)
                }

                // 如果下一条消息是AI，将文件信息添加到AI消息
                if (
                  i + 1 < session.sessionMessages.length &&
                  session.sessionMessages[i + 1].role === "AI" &&
                  files.length > 0
                ) {
                  // 保存文件信息到下一条AI消息
                  session.sessionMessages[i + 1]._files = files
                  // 跳过当前TOOL消息
                  continue
                }
              }

              // 处理USER角色的消息中的attachments
              if (msg.role === "USER" && msg.attachments) {
                try {
                  const attachments = JSON.parse(msg.attachments)
                  if (Array.isArray(attachments)) {
                    files = attachments
                      .filter(
                        (attachment) =>
                          attachment.contentType === "FILE" && attachment.content?.fileUrl
                      )
                      .map((attachment, index) => ({
                        uid: Date.now().toString(),
                        name: attachment.content.fileUrl.fileName || "文件",
                        status: "done",
                        type:
                          attachment.content.fileUrl.suffix === "xlsx"
                            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                            : attachment.content.fileUrl.suffix === "csv"
                              ? "text/csv"
                              : "application/octet-stream",
                        actionType: "click",
                        isCurrentMessage: false,
                        url: attachment.content.fileUrl.url,
                        success: true, // 用户上传的文件默认为成功状态
                        originalIndex: index // 添加原始顺序信息
                      }))
                  }
                } catch (error) {
                  console.error("Error parsing attachments:", error)
                }
              }

              // 如果是非TOOL消息，或者是没有找到后续AI消息的TOOL消息
              if (
                msg.role !== "TOOL" ||
                files.length === 0 ||
                !session.sessionMessages[i + 1] ||
                session.sessionMessages[i + 1].role !== "AI"
              ) {
                const isUser = msg.role === "USER"
                const isOuter = msg.renderType === "outer"

                // 跳过空的AI消息
                if (msg.role === "AI" && !msg.content && (!msg.events || msg.events.length === 0)) {
                  continue
                }

                formattedMessages.push({
                  id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  message: msg.content || "",
                  status: isUser ? "local" : "ai",
                  files: msg._files || files, // 使用之前保存的文件或当前解析的文件
                  loading: false,
                  serverTime: null,
                  serverActions: [],
                  // 保存原始events数据
                  events: msg.events,
                  // 添加renderType信息
                  renderType: msg.renderType
                })
              }
            }
          }
        }

        // 如果有最后一个处理好的文件，发送给父iframe
        if (lastProcessedFile) {
          window.parent.postMessage(
            {
              type: "SEND_AGENT_IFRAME",
              data: {
                id: lastProcessedFile.uid,
                fileName: lastProcessedFile.name
              }
            },
            "*"
          )
        }

        // 按时间排序 (如果有messageTime的话)
        formattedMessages.sort((a, b) => {
          const aTime = a.messageTime ? new Date(a.messageTime) : 0
          const bTime = b.messageTime ? new Date(b.messageTime) : 0
          return aTime - bTime
        })

        console.log("formattedMessages =>>", formattedMessages)
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

  // 在消息处理完成后，清除当前AI消息ID
  useEffect(() => {
    if (!loading) {
      setCurrentAiMessageId(null)
    }
  }, [loading])

  return (
    <div
      className={`justify-between bg-white m-auto rounded-[8px] flex flex-col h-full package-chat`}
    >
      {messages.length === 0 ? (
        <div className="flex-1 overflow-auto px-[32px] flex items-start justify-start">
          {fetchingMessages ? (
            <div className="w-[100%] mt-[200px] text-center m-auto">
              <Spin tip="加载聊天记录中..." />
            </div>
          ) : (
            <div className="bg-white rounded-lg w-[100%] m-auto" style={{ maxWidth: "1200px" }}>
              <div className="text-left mb-[12px] mt-[60px]">
                <div className="title">众有灵犀 你的智能伙伴</div>
                <div className="text-[#525866] text-[20px] font-[600] mt-[12px]">
                  您好！我是灵眸洞察Agent，一个专为数据分析设计的智能助手
                </div>
                <div
                  className="sub-title px-[8px] rounded-[8px] bg-[#F5F7FA] text-[12px] text-[#525866] font-[400] mt-[12px]"
                  style={{ minHeight: "40px", lineHeight: "23px" }}
                >
                  请告诉我您想要进行什么类型的分析，我会和您一起探索数据背后的奥秘，洞察新的奇迹！
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-auto pl-[20px] relative py-[10px]">
          {fetchingMessages ? (
            <div className="flex items-center justify-center h-full">
              <Spin tip="加载聊天记录中..." />
            </div>
          ) : (
            <div
              className="bubble-container overflow-y-auto px-[30px] pb-[30px] pr-[20px]"
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
                    loading: headerLoading,
                    serverTime,
                    serverActions,
                    cost,
                    renderType
                  }) => ({
                    key: id,
                    role: status === "local" ? "local" : "ai",
                    loading: headerLoading,
                    header:
                      status === "ai" ? (
                        <div>
                          <ActionHeader
                            serverActions={serverActions}
                            loading={loading}
                            messageId={id}
                            currentAiMessageId={currentAiMessageId}
                            headerLoading={headerLoading}
                          />
                          {headerLoading &&
                            (!serverActions || serverActions.length === 0) &&
                            loading && (
                              <div className="flex items-center gap-1 mt-1 mb-2">
                                <div className="inline-flex items-center">
                                  {[0, 1, 2].map((i) => (
                                    <div
                                      key={i}
                                      style={{
                                        width: "4px",
                                        height: "4px",
                                        display: "inline-block",
                                        verticalAlign: "middle",
                                        marginTop: "-4px",
                                        borderRadius: "50%",
                                        margin: "0 2px",
                                        backgroundColor: "#5D5FEF",
                                        animation: "pulse 1s infinite ease-in-out",
                                        animationDelay: `${i * 0.2}s`
                                      }}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs text-gray-500">AI思考中...</span>
                              </div>
                            )}
                        </div>
                      ) : (
                        <span className="text-[#98A2B3] text-[12px] font-[400]">我</span>
                      ),
                    content: (
                      <div>
                        {/* Display uploaded files if any */}

                        {/* 根据消息内容和模式判断是否需要格式化JSON */}
                        {mode === "single_agent_skill_mode" && isValidJson(message) ? (
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
                                backgroundColor: status === "local" ? "#f0f9ff" : "#f9fafb"
                              }}
                            />
                          </div>
                        ) : message && containsErrorIndicators(message) ? (
                          <div className="error-messagerounded-md text-red-800 whitespace-pre-wrap break-words">
                            <div className="flex items-center gap-2 mb-2 font-semibold">
                              <ExclamationCircleOutlined className="-mt-[2px] -mr-[8px]" /> 调用失败
                            </div>
                            <div className="overflow-auto max-h-[400px] text-sm">
                              {message.startsWith("[错误]")
                                ? message.replace("[错误]", "").trim()
                                : message}
                            </div>
                          </div>
                        ) : status === "local" && renderType === "outer" ? (
                          <div
                            className="outer-message bg-[#F5F7FA] p-3 rounded-md !text-[#FAAD14] text-sm"
                            style={{ color: "#FAAD14" }}
                          >
                            <div className="flex items-center gap-2">
                              <InfoCircleOutlined className="!text-[#FAAD14]" />
                              <span style={{ color: "#FAAD14" }} className="!text-[#FAAD14]">
                                {message}
                              </span>
                            </div>
                          </div>
                        ) : status !== "local" ? (
                          <>
                            {/* 消息内容和文件按顺序交织显示 */}
                            <div className="message-content-interleaved">
                              {/* 解析消息，处理<@event>标签 */}
                              {files && files.length > 0 ? (
                                (() => {
                                  // 解析消息内容，提取<@event>标签
                                  const { messageParts, eventIndexes } = parseMessageWithEvents(
                                    message,
                                    files
                                  )

                                  return (
                                    <>
                                      {messageParts.map((part, index) => {
                                        // 查找是否是事件位置
                                        const eventIndexItems = eventIndexes
                                          .filter((e) => e.index === index)
                                          .sort((a, b) => (a.fileOrder || 0) - (b.fileOrder || 0))

                                        // 渲染事件位置的文件
                                        if (eventIndexItems && eventIndexItems.length > 0) {
                                          return (
                                            <React.Fragment key={`events-${index}`}>
                                              {eventIndexItems.map((eventIndex, fileIdx) => {
                                                const eventData = eventIndex.data
                                                const file = files.find(
                                                  (f) =>
                                                    String(f.uid) ===
                                                    String(eventData.info.uniqueId)
                                                )

                                                if (file) {
                                                  // 获取文件状态
                                                  const fileStatus =
                                                    fileStatusMap[String(file.uid)] || file
                                                  const isLoading = file.actionType === "loading"
                                                  const isError =
                                                    file.actionType === "error" ||
                                                    (fileStatus.status &&
                                                      (fileStatus.status === 3 ||
                                                        fileStatus.status === "3"))
                                                  const canClick =
                                                    file.actionType === "click" ||
                                                    (fileStatus.status &&
                                                      (fileStatus.status === 2 ||
                                                        fileStatus.status === "2"))

                                                  return (
                                                    <div
                                                      className="file-preview-view mt-1 mr-2 inline-block"
                                                      key={`event-${index}-${fileIdx}`}
                                                    >
                                                      <div
                                                        className={`file-preview p-1 rounded flex items-center gap-1 ${isError ? "border border-red-300 bg-red-50" : ""}`}
                                                        onClick={() =>
                                                          canClick && handleFileClick(file)
                                                        }
                                                        style={{
                                                          cursor: canClick ? "pointer" : "default",
                                                          display: "inline-flex",
                                                          maxWidth: "fit-content"
                                                        }}
                                                      >
                                                        <span
                                                          className={`text-[14px] ${isError ? "text-red-500" : "text-[#0E121B]"} font-[500] truncate max-w-[200px]`}
                                                        >
                                                          {file.name}
                                                        </span>
                                                        <div
                                                          className="flex items-center"
                                                          style={{
                                                            cursor: canClick ? "pointer" : "default"
                                                          }}
                                                        >
                                                          {isLoading ? (
                                                            <span className="loading-dots">
                                                              <span className="dot"></span>
                                                              <span className="dot"></span>
                                                              <span className="dot"></span>
                                                            </span>
                                                          ) : isError ? (
                                                            <CloseCircleOutlined className="text-red-500 ml-1" />
                                                          ) : (
                                                            <CheckCircleOutlined className="icon-right ml-1" />
                                                          )}
                                                        </div>
                                                      </div>

                                                      {/* 显示进度条，仅在有actionType为loading的文件时显示 */}
                                                      {isLoading && (
                                                        <Progress
                                                          className="absolute -top-[11px]"
                                                          percent={
                                                            fileStatus.progress ||
                                                            calculateFileProgress(
                                                              fileStatus.runNum || 0,
                                                              fileStatus.totalNum || 100,
                                                              false
                                                            )
                                                          }
                                                          showInfo={false}
                                                          style={{ bottom: "-11px" }}
                                                          strokeColor="linear-gradient(90deg, #B8CBB8 0%, #B8CBB8 0%, #B465DA 0%, #CF6CC9 33%, #EE609C 66%, #EE609C 100%)"
                                                        />
                                                      )}
                                                      {/* 错误状态显示红色进度条 */}
                                                      {isError && (
                                                        <Progress
                                                          className="absolute -top-[11px]"
                                                          percent={100}
                                                          showInfo={false}
                                                          style={{ bottom: "-11px" }}
                                                          strokeColor="#ff4d4f"
                                                        />
                                                      )}
                                                    </div>
                                                  )
                                                }
                                                return null
                                              })}
                                            </React.Fragment>
                                          )
                                        }

                                        // 显示普通文本部分
                                        return part ? (
                                          <div key={`text-${index}`}>
                                            <MDEditor
                                              value={part}
                                              preview="edit"
                                              hideToolbar={true}
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
                                        ) : null
                                      })}
                                    </>
                                  )
                                })()
                              ) : (
                                // 如果没有文件，只显示消息内容
                                <MDEditor
                                  value={message}
                                  preview="edit"
                                  hideToolbar={true}
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
                              )}
                            </div>
                          </>
                        ) : (
                          <MDEditor
                            value={message}
                            preview="edit"
                            hideToolbar={true}
                            height="auto"
                            minHeight={20}
                            visibleDragbar={false}
                            enableScroll={false}
                            className="user-message-md-edit"
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
                        )}

                        {/* 在用户消息中也显示上传的文件 */}
                        {status === "local" && files && files.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2 !cursor-default">
                            {files.map((file) => {
                              // 用户消息中的文件默认是click类型且已经处理完成
                              return (
                                <div
                                  className="file-preview-view-local inline-block !cursor-default"
                                  key={file.uid}
                                >
                                  <div
                                    className="p-1 rounded flex items-center gap-1 !cursor-default"
                                    style={{ maxWidth: "fit-content" }}
                                  >
                                    {file.type === "application/vnd.ms-excel" ||
                                    file.type ===
                                      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ? (
                                      <img src={XLS} alt="Excel" className="w-[32px] h-[32px]" />
                                    ) : (
                                      <img src={XLS} alt="CSV" className="w-[32px] h-[32px]" />
                                    )}

                                    <span className="text-[14px] text-[#0E121B] font-[500] truncate max-w-[200px]">
                                      {file.name}
                                    </span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    ),
                    footer: status !== "local" && !message?.includes("[错误]") && !loading && (
                      <div className="flex w-[100%] items-center justify-between gap-2 mt-2 text-[#98A2B3]">
                        {(serverTime || message) &&
                        !(mode === "single_agent_skill_mode" && isValidJson(message)) ? (
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
                        )}
                        {/* <div>
                          <CopyToClipboard
                            text={message}
                            onCopy={() => messageAnt.success("复制成功")}
                          >
                            <Tooltip title="复制">
                              <i className="iconfont icon-fuzhi text-[16px] cursor-pointer hover:text-[#5D5FEF]" />
                            </Tooltip>
                          </CopyToClipboard>
                        </div> */}
                      </div>
                    )
                  })
                )}
              />
            </div>
          )}
        </div>
      )}

      <div className="reander-view mt-0 p-[20px] pt-0">
        <Flex vertical gap="small">
          {/* 添加授权按钮组 */}
          <div
            className="approve-buttons-container"
            style={{
              display: showApproveButtons ? "block" : "none",
              marginBottom: "5px"
            }}
          >
            <div className="flex justify-between items-center gap-2">
              <div className="text-gray-600 text-[14px] font-[600]">
                当前对话需要授权工具才能继续：
              </div>
              <div className="flex justify-between gap-2">
                <Button onClick={handleApproveCancel}>取消</Button>
                <Button type="primary" onClick={handleApproveConfirm} loading={approveLoading}>
                  确认授权
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-[8px] w-[100%] align-middle">
            <div className="flex-1 w-[100%] relative">
              {isDragging && !hasProcessingFiles && !readOnly && (
                <div
                  className="absolute inset-0 border-2 border-dashed border-[#5D5FEF] rounded-lg flex items-center justify-center z-100"
                  style={{
                    top: "-10px",
                    left: "-10px",
                    right: "-10px",
                    bottom: "-10px",
                    pointerEvents: "none",
                    background:
                      "linear-gradient(135deg, rgba(93, 95, 239, 0.1) 0%, rgba(93, 95, 239, 0.05) 50%, rgba(93, 95, 239, 0.1) 100%)",
                    backdropFilter: "blur(4px)",
                    animation: "gradient 3s ease infinite"
                  }}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <div className="text-center">
                    <CloudUploadOutlined className="text-[32px] text-[#5D5FEF]" />
                    <p className="mt-2 text-[#5D5FEF] text-[16px]">释放文件以上传</p>
                  </div>
                </div>
              )}
              <div
                ref={dropZoneRef}
                className="relative"
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                style={{
                  minHeight: "90px",
                  position: "relative",
                  pointerEvents: isGenerating || hasProcessingFiles || readOnly ? "none" : "auto"
                }}
              >
                <div>
                  <div className="mb-[0px]">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      style={{ display: "none" }}
                      accept="application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                      disabled={fileUploading || isGenerating || hasProcessingFiles || readOnly}
                    />
                  </div>
                  <div className="relative">
                    <Sender
                      value={content}
                      placeholder={
                        readOnly
                          ? "当前为只读模式"
                          : isGenerating || loading
                            ? "内容生成中，请稍候..."
                            : showApproveButtons
                              ? "请先完成授权"
                              : "请输入你的问题..."
                      }
                      className="flex-1"
                      disabled={
                        !selectedSkill ||
                        isGenerating ||
                        hasProcessingFiles ||
                        readOnly ||
                        showApproveButtons ||
                        loading
                      }
                      autoSize={{ minRows: 3, maxRows: 6 }}
                      header={senderHeader}
                      actions={senderActions}
                      onPasteFile={handlePasteFile}
                      onChange={setContent}
                      key={`sender-${hasProcessingFiles ? "processing" : "ready"}-${loading ? "loading" : "idle"}`}
                      onSubmit={(nextContent) => {
                        if (
                          selectedSkill &&
                          !isGenerating &&
                          !hasProcessingFiles &&
                          !readOnly &&
                          !showApproveButtons &&
                          !loading
                        ) {
                          handleSendMessage(nextContent, uploadedFiles)
                          setUploadedFiles([])
                        } else if (loading) {
                          messageAnt.warning("内容生成中，请稍候再发送消息")
                        } else if (hasProcessingFiles) {
                          messageAnt.warning("文件正在处理中，请稍候再发送消息")
                        } else if (readOnly) {
                          messageAnt.warning("当前为只读模式，禁止发送消息")
                        } else if (showApproveButtons) {
                          messageAnt.warning("请先完成授权")
                        }
                      }}
                      onCancel={handleStopGenerate}
                    />

                    {/* 使用新的FileProcessingOverlay组件替代原来的行内覆盖层 */}
                    {hasProcessingFiles && <FileProcessingOverlay />}
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-1 text-center">
                {hasProcessingFiles ? (
                  <span className="text-orange-500">文件处理中，请稍候...</span>
                ) : (
                  "内容由AI生成，无法确保准确性；Shift + Enter 支持换行输入"
                )}
              </div>
            </div>
          </div>
        </Flex>
      </div>

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

export default Chat
