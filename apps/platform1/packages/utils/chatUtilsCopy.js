import { fetchEventSource } from "@microsoft/fetch-event-source"
import { getTokenAndServiceName } from "@/api/sso"
import { message as messageAnt } from "antd"

/**
 * 处理发送消息并接收流式响应
 * @param {Object} params - 参数对象
 * @param {string} params.message - 用户输入的消息
 * @param {Array} params.files - 上传的文件列表
 * @param {string} params.botNo - 空间编号
 * @param {string} params.agentNo - 代理编号
 * @param {string} params.agentVersionNo - 代理版本编号
 * @param {string} params.sessionId - 会话ID
 * @param {string} params.botPrefix - API前缀
 * @param {string} params.mode - 模式
 * @param {Function} params.setMessages - 设置消息列表的函数
 * @param {Function} params.setLoading - 设置加载状态的函数
 * @param {Function} params.setContent - 设置输入内容的函数
 * @param {Function} params.setSessionId - 设置会话ID的函数
 * @param {Function} params.scrollToBottom - 滚动到底部的函数
 * @param {Object} params.controllerRef - AbortController引用
 * @param {Object} params.timeoutRef - 超时计时器引用
 * @param {Function} params.setServerTime - 设置服务器时间的函数
 * @param {Function} params.processActionData - 处理动作数据的函数
 * @param {boolean} params.isJsonMode - 是否为JSON模式
 * @returns {Promise<void>}
 */
export const handleSendMessage = async ({
  message,
  files = [],
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
  isJsonMode = false
}) => {
  if (!message && files.length === 0) return

  // 清除之前的超时计时器
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current)
    timeoutRef.current = null
  }

  // Add user message to chat
  const userMessageId = Date.now().toString()
  setMessages((prev) => [
    ...prev,
    {
      id: userMessageId,
      message: message,
      status: "local",
      files: files
    }
  ])

  setLoading(true)
  setContent("")

  // Prepare contents array for API request
  const contents = []

  // Add text content if exists
  if (message) {
    // 根据模式和isJsonMode决定如何构建contents
    if (mode === "single_agent_skill_mode" && isJsonMode) {
      // 工作流模式下的JSON格式化处理
      try {
        // 确保message是有效的JSON字符串
        const jsonMessage = typeof message === "string" ? message : JSON.stringify(message)

        contents.push({
          contentType: "TEXT",
          content: {
            text: jsonMessage
          }
        })
      } catch (error) {
        console.error("JSON formatting error:", error)
        // 如果出错，使用原始消息
        contents.push({
          contentType: "TEXT",
          content: {
            text: message
          }
        })
      }
    } else {
      // 普通文本模式
      contents.push({
        contentType: "TEXT",
        content: {
          text: message
        }
      })
    }
  }

  // Add file contents if any
  files.forEach((file) => {
    if (file.type.startsWith("image/")) {
      contents.push({
        contentType: "IMAGE",
        content: {
          imageUrl: {
            url: file.url
          }
        }
      })
    } else {
      contents.push({
        contentType: "FILE",
        content: {
          fileUrl: {
            url: file.url,
            fileName: file.name,
            suffix: file.name.split(".").pop()
          }
        }
      })
    }
  })

  // Create a new AbortController for this request
  const controller = new AbortController()
  controllerRef.current = controller

  // Create AI message placeholder
  const aiMessageId = (Date.now() + 1).toString()
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

  try {
    await fetchEventSource(`${botPrefix}/bots/${botNo}/agents/${agentNo}/${agentVersionNo}/debug`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Usercenter-Session": getTokenAndServiceName().token
      },
      body: JSON.stringify({
        sessionId: sessionId,
        contents: contents
      }),
      signal: controller.signal,
      onmessage(event) {
        try {
          const parsedData = JSON.parse(event.data)
          if (parsedData.data && typeof parsedData.data === "string") {
            const innerData = JSON.parse(parsedData.data)

            // 处理不同类型的响应
            switch (innerData.action) {
              case "RESPONSE":
                if (innerData.data && innerData.data.executeResult) {
                  const newContent = innerData.data.executeResult
                  const responseTimeInSeconds = (innerData.data.cost || 0) / 1000

                  setMessages((prev) => {
                    const updatedMessages = [...prev]
                    const aiMessageIndex = updatedMessages.findIndex(
                      (msg) => msg.id === aiMessageId
                    )

                    if (aiMessageIndex !== -1) {
                      updatedMessages[aiMessageIndex].loading = false
                      updatedMessages[aiMessageIndex].serverTime = responseTimeInSeconds
                      updatedMessages[aiMessageIndex].message = newContent

                      // 在每次流式响应中添加文件
                      const timestamp = Date.now()
                      const randomNum = Math.floor(Math.random() * 1000)
                      const newFile = {
                        uid: `${timestamp}-${randomNum}`,
                        name: `分析报告_${timestamp}_${randomNum}.xlsx`,
                        status: "processing",
                        percent: 0,
                        url: "https://example.com/mock-excel-file.xlsx",
                        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      }

                      // 如果files数组不存在，则创建它
                      if (!updatedMessages[aiMessageIndex].files) {
                        updatedMessages[aiMessageIndex].files = []
                      }

                      // 添加新文件到数组
                      updatedMessages[aiMessageIndex].files.push(newFile)

                      // 模拟文件上传进度
                      let currentPercent = 0
                      const progressInterval = setInterval(() => {
                        currentPercent += Math.random() * 30 // 随机增加30%以内的进度
                        if (currentPercent >= 100) {
                          currentPercent = 100
                          clearInterval(progressInterval)
                        }
                        setMessages((prev) => {
                          const updatedMessages = [...prev]
                          const aiMessageIndex = updatedMessages.findIndex(
                            (msg) => msg.id === aiMessageId
                          )
                          if (aiMessageIndex !== -1) {
                            const fileIndex = updatedMessages[aiMessageIndex].files.findIndex(
                              (f) => f.uid === newFile.uid
                            )
                            if (fileIndex !== -1) {
                              updatedMessages[aiMessageIndex].files[fileIndex].percent =
                                currentPercent
                              if (currentPercent === 100) {
                                updatedMessages[aiMessageIndex].files[fileIndex].status = "done"
                              }
                            }
                          }
                          return updatedMessages
                        })
                      }, 500) // 每500ms更新一次进度
                    }

                    return updatedMessages
                  })
                }
                break

              case "RECALL_KNOWLEDGE":
                if (innerData.data) {
                  setMessages((prev) => {
                    const updatedMessages = [...prev]
                    const aiMessageIndex = updatedMessages.findIndex(
                      (msg) => msg.id === aiMessageId
                    )

                    if (aiMessageIndex !== -1) {
                      // 更新知识库召回状态
                      const existingActions = updatedMessages[aiMessageIndex].serverActions || []
                      const existingActionIndex = existingActions.findIndex(
                        (action) =>
                          action.type === "RECALL_KNOWLEDGE" &&
                          action.knowledgeType === innerData.data.knowledgeType &&
                          action.uniqueId === innerData.data.uniqueId
                      )

                      if (existingActionIndex !== -1) {
                        // 更新已存在的动作
                        existingActions[existingActionIndex] = {
                          ...existingActions[existingActionIndex],
                          status: innerData.data.processStatus,
                          executeResult: innerData.data.executeResult,
                          cost: innerData.data.cost
                        }
                      } else {
                        // 添加新的动作
                        existingActions.push({
                          type: "RECALL_KNOWLEDGE",
                          status: innerData.data.processStatus,
                          knowledgeType: innerData.data.knowledgeType,
                          args: innerData.data.args,
                          uniqueId: innerData.data.uniqueId,
                          executeResult: innerData.data.executeResult,
                          cost: innerData.data.cost
                        })
                      }

                      updatedMessages[aiMessageIndex].serverActions = existingActions

                      // 如果是END状态，更新总耗时
                      if (innerData.data.processStatus === "END") {
                        const totalCost = existingActions.reduce(
                          (sum, action) => sum + (action.cost || 0),
                          0
                        )
                        updatedMessages[aiMessageIndex].serverTime = totalCost / 1000
                      }
                    }

                    return updatedMessages
                  })
                }
                break

              // 可以继续添加其他类型的响应处理
            }
          }

          // Check for END action
          if (parsedData.action === "END" || parsedData.processStatus === "END") {
            controller.abort()
            setLoading(false)
          }
        } catch (error) {
          console.error("Failed to parse message:", error)
        }
      },
      onclose() {
        // 连接关闭时清除超时计时器
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }

        // Turn off loading state
        setMessages((prev) => {
          const updatedMessages = [...prev]
          const aiMessageIndex = updatedMessages.findIndex((msg) => msg.id === aiMessageId)

          if (aiMessageIndex !== -1) {
            updatedMessages[aiMessageIndex].loading = false
          }

          return updatedMessages
        })

        setLoading(false)
        setTimeout(scrollToBottom, 0)
      },
      onerror(error) {
        // 发生错误时清除超时计时器
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }

        // Turn off loading state
        setMessages((prev) => {
          const updatedMessages = [...prev]
          const aiMessageIndex = updatedMessages.findIndex((msg) => msg.id === aiMessageId)

          if (aiMessageIndex !== -1) {
            updatedMessages[aiMessageIndex].loading = false
          }

          return updatedMessages
        })

        console.error("Stream failed:", error)
        setLoading(false)
        controller.abort()

        // Add error message
        messageAnt.error("对话请求失败，请重试")
      }
    })
  } catch (error) {
    // 发生异常时清除超时计时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    console.error("Failed to send message:", error)
    setLoading(false)
  }
}

/**
 * 停止生成响应
 * @param {Object} params - 参数对象
 * @param {Object} params.controllerRef - AbortController引用
 * @param {Object} params.timeoutRef - 超时计时器引用
 * @param {Function} params.setLoading - 设置加载状态的函数
 * @param {Function} params.setMessages - 设置消息列表的函数
 */
export const handleStopGenerate = ({ controllerRef, timeoutRef, setLoading, setMessages }) => {
  if (controllerRef.current) {
    controllerRef.current.abort()
    controllerRef.current = null
    setLoading(false)
  }

  // 清除超时计时器
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current)
    timeoutRef.current = null
  }

  // Turn off loading state for the last AI message
  setMessages((prev) => {
    const updatedMessages = [...prev]
    // Find the last AI message
    const aiMessageIndex = updatedMessages.findIndex((msg) => msg.status === "ai" && msg.loading)

    if (aiMessageIndex !== -1) {
      updatedMessages[aiMessageIndex].loading = false
    }

    return updatedMessages
  })
}
