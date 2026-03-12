import { fetchEventSource } from "@microsoft/fetch-event-source"
import { getTokenAndServiceName } from "@/api/sso"
import { message as messageAnt } from "antd"
import { isStudio } from "@/config.env"

/**
 * 处理发送消息并接收真流式响应
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
 * @param {Function} params.handleNeedApprove - 处理需要授权的回调函数
 * @param {boolean} params.isJsonMode - 是否为JSON模式
 * @param {boolean} params.skipUserMessage - 是否跳过添加用户消息（用于授权后重新发送）
 * @param {string} params.aiMessageId - 已创建的AI消息ID（配合skipUserMessage使用）
 * @returns {Promise<void>}
 */
export const handleSendMessage = async ({
  isChat,
  message,
  files = [],
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
  processActionData,
  handleNeedApprove,
  isJsonMode = false,
  skipUserMessage = false,
  aiMessageId = null,
  metaAgentSessionVariables,
  agentVars
}) => {
  if (!message && files.length === 0) return

  // 清除之前的超时计时器
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current)
    timeoutRef.current = null
  }

  // 如果不是跳过添加用户消息的情况，则添加用户消息
  if (!skipUserMessage) {
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

    setContent("")
  }

  setLoading(true)

  // Prepare contents array for API request
  const contents = []

  // Add text content if exists
  if (message) {
    // 根据模式和isJsonMode决定如何构建contents
    if (mode === "single_agent_skill_mode" && isJsonMode) {
      // 工作流模式下的JSON格式化处理
      try {
        const jsonMessage = typeof message === "string" ? message : JSON.stringify(message)
        contents.push({
          contentType: "TEXT",
          content: {
            text: jsonMessage
          }
        })
      } catch (error) {
        console.error("JSON formatting error:", error)
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

  // Create AI message placeholder if not already provided
  const aiMessageIdToUse = aiMessageId || (Date.now() + 1).toString()

  // 如果不是跳过用户消息的情况，或者没有提供aiMessageId，则创建新的AI消息
  if (!skipUserMessage || !aiMessageId) {
    setMessages((prev) => [
      ...prev,
      {
        id: aiMessageIdToUse,
        message: "",
        status: "ai",
        loading: true,
        serverActions: []
      }
    ])
  }

  try {
    await fetchEventSource(
      isChat
        ? `${botPrefix}/bots/${botNo}/agents/${agentNo}/chat`
        : `${botPrefix}/bots/${botNo}/agents/${agentNo}/${agentVersionNo}/debug`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "x-service-name": "za-open-bot",
          "X-Usercenter-Session": getTokenAndServiceName().token,
          Accept: "text/event-stream", // 明确接受事件流
          ...(isChat
            ? { stream: true }
            : {
                stream: true
              }),
          ...(sessionId
            ? {
                "X-Session-Id": sessionId
              }
            : {}),
          ...(isStudio()
            ? {
                botno: botNo || undefined,
                studioenv: studioenv || "prd"
              }
            : {})
        },
        body: JSON.stringify({
          sessionId: sessionId,
          skillNo: preSelectedSkillNo || undefined,
          contents: contents,
          metaAgentSessionVariables,
          agentVars
        }),
        signal: controller.signal,
        keepalive: true,
        openWhenHidden: true,
        retry: {
          maxRetries: 3,
          retryDelay: 1000,
          onRetry: (err, retryCount) => {
            console.log(`重试连接 (${retryCount}/3):`, err)
            return true
          }
        },
        onmessage(event) {
          // 收到消息时重置超时计时器
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
          }

          // 设置新的超时计时器，如果300秒内没有新消息，则关闭连接
          timeoutRef.current = setTimeout(() => {
            console.log("Response timeout, closing connection")
            controller.abort()
            setLoading(false)
          }, 300000)

          try {
            const parsedData = JSON.parse(event.data)

            // Update sessionId if it's returned
            if (parsedData.sessionId) {
              setSessionId(parsedData.sessionId)
            }

            // 检查是否需要授权
            if (
              parsedData.data &&
              typeof parsedData.data === "string" &&
              parsedData.data.includes('"action":"NEED_APPROVE"')
            ) {
              try {
                const innerData = JSON.parse(parsedData.data)
                if (innerData.action === "NEED_APPROVE" && innerData.data) {
                  console.log("Need approve:", innerData.data)

                  // 提取需要授权的工具列表
                  const { waitForApproveTools } = innerData.data

                  if (
                    waitForApproveTools &&
                    Array.isArray(waitForApproveTools) &&
                    waitForApproveTools.length > 0
                  ) {
                    // 收到NEED_APPROVE时终止流连接，需要重新请求
                    controller.abort()
                    setLoading(false)

                    // 记录上一次消息内容，用于授权后重新发送
                    const lastMessage = {
                      message,
                      files,
                      aiMessageId: aiMessageIdToUse
                    }

                    // 调用授权处理回调
                    if (handleNeedApprove && typeof handleNeedApprove === "function") {
                      handleNeedApprove(waitForApproveTools, lastMessage, sessionId)
                    }

                    // 终止后续处理
                    return
                  }
                }
              } catch (e) {
                console.error("Error parsing NEED_APPROVE data:", e)
              }
            }

            // 记录服务器时间戳，用于计算响应时间
            const serverTime = processActionData(parsedData)?.cost || 0

            // 尝试从内部数据中提取cost
            let responseCost = 0
            try {
              if (
                parsedData.data &&
                typeof parsedData.data === "string" &&
                parsedData.data.includes('"action":"RESPONSE"')
              ) {
                const innerData = JSON.parse(parsedData.data)
                if (innerData.data && innerData.data.cost) {
                  responseCost = innerData.data.cost
                }
              }
            } catch (e) {
              console.error("Error extracting cost from inner data:", e)
            }

            // 计算响应时间（秒），并保留一位小数
            const responseTimeInSeconds = responseCost > 0 ? (responseCost / 1000).toFixed(2) : 0

            // 更新组件状态中的服务器时间，仅当新值更大时才更新
            if (responseTimeInSeconds > 0) {
              setServerTime((prevTime) => {
                const prevTimeNum = parseFloat(prevTime || 0)
                return responseTimeInSeconds > prevTimeNum ? responseTimeInSeconds : prevTime
              })
            }

            // Process action data for headers if processActionData function is provided
            if (processActionData && typeof processActionData === "function") {
              const actionData = processActionData(parsedData)

              if (actionData) {
                // 处理非 RESPONSE 类型的 serverActions
                if (actionData.actionType !== "RESPONSE") {
                  setMessages((prev) => {
                    const updatedMessages = [...prev]
                    const aiMessageIndex = updatedMessages.findIndex(
                      (msg) => msg.id === aiMessageIdToUse
                    )

                    if (aiMessageIndex !== -1) {
                      // Check if action with this uniqueId already exists
                      const existingActionIndex = updatedMessages[
                        aiMessageIndex
                      ].serverActions?.findIndex((act) => act.uniqueId === actionData.uniqueId)

                      if (existingActionIndex !== -1) {
                        // Update existing action with new data
                        updatedMessages[aiMessageIndex].serverActions[existingActionIndex] = {
                          ...updatedMessages[aiMessageIndex].serverActions[existingActionIndex],
                          ...actionData
                        }
                      } else {
                        // Add new action to the list
                        if (!updatedMessages[aiMessageIndex].serverActions) {
                          updatedMessages[aiMessageIndex].serverActions = []
                        }
                        updatedMessages[aiMessageIndex].serverActions.push(actionData)
                      }
                    }

                    return updatedMessages
                  })
                }
              }
            }

            // 处理流式数据 - 真流式处理逻辑
            if (parsedData.data) {
              try {
                // 处理 RESPONSE 格式的数据
                if (
                  typeof parsedData.data === "string" &&
                  parsedData.data.includes('"action":"RESPONSE"')
                ) {
                  try {
                    const innerData = JSON.parse(parsedData.data)
                    if (innerData.action === "RESPONSE" && innerData.data) {
                      // 检查是否有错误信息
                      if (innerData.data.errorMsg) {
                        // 提取错误信息
                        let errorMessage = innerData.data.errorMsg
                        try {
                          if (typeof errorMessage === "string") {
                            errorMessage = errorMessage.replace(/\\"/g, '"')
                            if (
                              errorMessage.includes("ERROR_CODE") ||
                              errorMessage.includes("Exception") ||
                              errorMessage.includes("statusCode")
                            ) {
                              errorMessage = `错误详情: ${errorMessage}`
                            }
                          }
                        } catch (e) {
                          console.error("Error processing error message:", e)
                        }

                        // 更新消息状态为错误
                        setMessages((prev) => {
                          const updatedMessages = [...prev]
                          const aiMessageIndex = updatedMessages.findIndex(
                            (msg) => msg.id === aiMessageIdToUse
                          )

                          if (aiMessageIndex !== -1) {
                            updatedMessages[aiMessageIndex].loading = false
                            updatedMessages[aiMessageIndex].serverTime = responseTimeInSeconds
                            updatedMessages[aiMessageIndex].message = `[错误] ${errorMessage}`

                            // 更新serverActions中的错误状态
                            if (updatedMessages[aiMessageIndex].serverActions) {
                              updatedMessages[aiMessageIndex].serverActions = updatedMessages[
                                aiMessageIndex
                              ].serverActions.map((action) => ({
                                ...action,
                                processStatus: "ERROR",
                                errorMsg: errorMessage
                              }))
                            }
                          }

                          return updatedMessages
                        })
                        return
                      }

                      // 处理正常响应内容 - 真流式处理
                      if (innerData.data.executeResult) {
                        const newContent = innerData.data.executeResult

                        // 直接更新消息内容，不需要模拟流式
                        setMessages((prev) => {
                          const updatedMessages = [...prev]
                          const aiMessageIndex = updatedMessages.findIndex(
                            (msg) => msg.id === aiMessageIdToUse
                          )

                          if (aiMessageIndex !== -1) {
                            const currentMessage = updatedMessages[aiMessageIndex].message || ""

                            // 真流式：直接追加新内容，不需要字符逐个显示
                            if (!currentMessage.includes(newContent)) {
                              updatedMessages[aiMessageIndex].message = currentMessage + newContent
                              updatedMessages[aiMessageIndex].loading = false
                              updatedMessages[aiMessageIndex].serverTime = responseTimeInSeconds
                            }
                          }

                          return updatedMessages
                        })

                        // 立即滚动到底部
                        setTimeout(scrollToBottom, 0)
                        return
                      }
                    }

                    // 检查结束标志
                    if (innerData.action === "END") {
                      controller.abort()
                      setLoading(false)
                      return
                    }
                  } catch (innerError) {
                    console.error("Failed to parse inner data:", innerError, parsedData.data)
                  }
                }

                // 处理其他格式的流式数据
                const streamData =
                  typeof parsedData.data === "string"
                    ? JSON.parse(parsedData.data)
                    : parsedData.data

                // 真流式处理：直接更新消息内容
                if (streamData.action === "RESPONSE" && streamData.data) {
                  let contentToAdd = ""

                  if (streamData.data.executeResult) {
                    contentToAdd = streamData.data.executeResult
                  } else if (streamData.data.content) {
                    contentToAdd = streamData.data.content
                  } else if (typeof streamData.data === "string") {
                    contentToAdd = streamData.data
                  }

                  if (contentToAdd) {
                    setMessages((prev) => {
                      const updatedMessages = [...prev]
                      const aiMessageIndex = updatedMessages.findIndex(
                        (msg) => msg.id === aiMessageIdToUse
                      )

                      if (aiMessageIndex !== -1) {
                        const currentMessage = updatedMessages[aiMessageIndex].message || ""

                        // 真流式：直接追加内容
                        if (!currentMessage.includes(contentToAdd)) {
                          updatedMessages[aiMessageIndex].message = currentMessage + contentToAdd
                          updatedMessages[aiMessageIndex].loading = false
                          updatedMessages[aiMessageIndex].serverTime = responseTimeInSeconds
                        }
                      }

                      return updatedMessages
                    })

                    // 立即滚动到底部
                    setTimeout(scrollToBottom, 0)
                  }
                }

                // 检查结束标志
                if (streamData.action === "END" || streamData.processStatus === "END") {
                  controller.abort()
                  setLoading(false)
                }
              } catch (error) {
                console.error("Failed to parse stream data:", error, parsedData.data)

                // 错误处理 - 直接显示完整错误信息
                setMessages((prev) => {
                  const updatedMessages = [...prev]
                  const aiMessageIndex = updatedMessages.findIndex(
                    (msg) => msg.id === aiMessageIdToUse
                  )

                  if (aiMessageIndex !== -1) {
                    updatedMessages[aiMessageIndex].loading = false
                    updatedMessages[aiMessageIndex].message = "[解析响应时出错]"
                  }

                  return updatedMessages
                })
              }
            }
          } catch (error) {
            console.error("Failed to parse message:", error, event.data)
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
            const aiMessageIndex = updatedMessages.findIndex((msg) => msg.id === aiMessageIdToUse)

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
            const aiMessageIndex = updatedMessages.findIndex((msg) => msg.id === aiMessageIdToUse)

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
      }
    )
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

  setMessages((prev) => {
    const updatedMessages = [...prev]
    // 最后发送消息判断
    const aiMessageIndex = updatedMessages.findIndex((msg) => msg.status === "ai" && msg.loading)

    if (aiMessageIndex !== -1) {
      updatedMessages[aiMessageIndex].loading = false
    }

    return updatedMessages
  })
}
