import { fetchEventSource } from "@microsoft/fetch-event-source"
import { getTokenAndServiceName } from "@/api/sso"
import { message as messageAnt } from "antd"
import { isStudio } from "@/config.env"

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
 * @param {Function} params.handleNeedApprove - 处理需要授权的回调函数
 * @param {boolean} params.isJsonMode - 是否为JSON模式
 * @param {boolean} params.skipUserMessage - 是否跳过添加用户消息（用于授权后重新发送）
 * @param {string} params.aiMessageId - 已创建的AI消息ID（配合skipUserMessage使用）
 * @param {boolean} params.enableStreamEffect - 是否启用流式输出动画效果，默认为false
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
  agentVars,
  enableStreamEffect = false
}) => {
  const maxLongText = 3000 // 超过 3000 自动关闭流式输出
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
          ...(isChat ? { stream: true } : {}),
          ...(sessionId ? { "X-Session-Id": sessionId } : ""),
          ...(isStudio() ? { botno: botNo || undefined, studioenv: studioenv || "prd" } : {})
        },
        body: JSON.stringify({
          sessionId: sessionId,
          skillNo: preSelectedSkillNo || undefined,
          contents: contents,
          metaAgentSessionVariables,
          agentVars
        }),
        signal: controller.signal,
        // 添加 keepalive 配置，保持连接活跃
        keepalive: true,
        // 配置重试机制
        openWhenHidden: true, // 允许在页面隐藏时保持连接
        retry: {
          maxRetries: 3, // 最大重试次数
          retryDelay: 1000, // 重试延迟时间（毫秒）
          onRetry: (err, retryCount) => {
            console.log(`重试连接 (${retryCount}/3):`, err)
            return true // 继续重试
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

            console.log("serverTime", responseTimeInSeconds)

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
              console.log("Received stream data:", actionData)

              if (actionData) {
                // 1. 处理 actionType !== 'RESPONSE' 的 serverActions
                // 原逻辑：if (actionData.actionType !== "RESPONSE")
                // 新增 AUDIO_SYSTEM 支持
                if (
                  // actionData &&
                  // actionData.actionType &&
                  // ["INVOKE_AGENT_TOOL", "AUDIO_SYSTEM"].includes(actionData.actionType)

                  actionData.actionType !== "RESPONSE"
                ) {
                  // Add this action to serverActions array in the message
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

            // Handle streaming data
            if (parsedData.data) {
              try {
                // Handle the specific format from the example
                // data:{"data":"{\"action\":\"RESPONSE\",\"data\":{\"executeResult\":\"你好！...\"}}","code":"200",...}
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
                          // 展示完整的错误信息，而不是只提取message部分
                          if (typeof errorMessage === "string") {
                            // 如果包含转义字符，去除转义符号
                            errorMessage = errorMessage.replace(/\\"/g, '"')

                            // 不再尝试提取json中的message字段，而是保留完整错误信息
                            // 只做最基本的格式化处理
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

                        // 显示错误提示
                        // messageAnt.error(errorMessage)
                        return
                      }

                      if (innerData.data.executeResult) {
                        // Get the new content to add
                        const newContent = innerData.data.executeResult

                        // 先检查当前消息内容
                        setMessages((prev) => {
                          const updatedMessages = [...prev]
                          const aiMessageIndex = updatedMessages.findIndex(
                            (msg) => msg.id === aiMessageIdToUse
                          )

                          if (aiMessageIndex !== -1) {
                            const currentMessage = updatedMessages[aiMessageIndex].message || ""
                            updatedMessages[aiMessageIndex].loading = false
                            updatedMessages[aiMessageIndex].serverTime = responseTimeInSeconds

                            // 如果新内容已包含在当前内容中，不做更新
                            if (currentMessage.includes(newContent)) {
                              return prev // 这里直接返回，跳过后续所有处理
                            }

                            // 检查是否是英文内容，如果是英文则直接显示完整内容，避免逐字符显示造成的重复问题
                            if (!currentMessage && /^[a-zA-Z0-9\s\p{P}]*$/u.test(newContent)) {
                              // 如果是纯英文内容，直接全部显示，避免字符重复问题
                              updatedMessages[aiMessageIndex].message = newContent
                              return updatedMessages
                            }
                          }

                          return updatedMessages
                        })

                        // 只对中文内容进行流式显示，避免乱序
                        setMessages((prev) => {
                          const updatedMessages = [...prev]
                          const aiMessageIndex = updatedMessages.findIndex(
                            (msg) => msg.id === aiMessageIdToUse
                          )

                          if (aiMessageIndex !== -1) {
                            const currentMessage = updatedMessages[aiMessageIndex].message || ""

                            // 如果当前无内容，根据enableStreamEffect决定显示方式
                            if (!currentMessage) {
                              if (enableStreamEffect) {
                                // 启用流式效果：根据内容长度决定流式输出参数
                                const isLongContent = newContent.length > maxLongText // 超过1万字的长内容
                                const initialChunkSize = isLongContent
                                  ? 10
                                  : Math.min(3, newContent.length)
                                const chunkSize = isLongContent ? 10 : 2 // 长内容每次处理10个字符，短内容2个字符
                                const delayTime = isLongContent ? 10 : 20 // 长内容10毫秒延迟，短内容20毫秒延迟

                                // 初始显示部分字符
                                updatedMessages[aiMessageIndex].message = newContent.substring(
                                  0,
                                  initialChunkSize
                                )

                                // 如果内容较短，直接显示全部
                                if (newContent.length <= initialChunkSize) {
                                  return updatedMessages
                                }

                                // 剩余部分流式显示
                                setTimeout(() => {
                                  let currentIndex = initialChunkSize

                                  const streamInterval = setInterval(() => {
                                    if (currentIndex >= newContent.length) {
                                      clearInterval(streamInterval)
                                      return
                                    }

                                    const endIndex = Math.min(
                                      currentIndex + chunkSize,
                                      newContent.length
                                    )
                                    const chunk = newContent.substring(currentIndex, endIndex)

                                    setMessages((prev) => {
                                      const updatedMessages = [...prev]
                                      const aiMessageIndex = updatedMessages.findIndex(
                                        (msg) => msg.id === aiMessageIdToUse
                                      )

                                      if (aiMessageIndex !== -1) {
                                        updatedMessages[aiMessageIndex].message += chunk
                                      }

                                      return updatedMessages
                                    })

                                    currentIndex = endIndex
                                    setTimeout(scrollToBottom, 0)
                                  }, delayTime) // 使用动态延迟时间
                                }, 0)
                              } else {
                                // 关闭流式效果：直接显示完整内容
                                updatedMessages[aiMessageIndex].message = newContent
                                setTimeout(scrollToBottom, 0)
                              }
                            }
                          }

                          return updatedMessages
                        })

                        return // Skip the rest of the processing
                      }
                    }

                    // Check for END action in the specific format
                    if (innerData.action === "END") {
                      controller.abort()

                      setLoading(false)
                      return
                    }
                  } catch (innerError) {
                    console.error("Failed to parse inner data:", innerError, parsedData.data)
                  }
                }

                // Continue with existing parsing logic for other formats
                const streamData =
                  typeof parsedData.data === "string"
                    ? JSON.parse(parsedData.data)
                    : parsedData.data

                // Update the AI message with the streamed content
                setMessages((prev) => {
                  const updatedMessages = [...prev]
                  const aiMessageIndex = updatedMessages.findIndex(
                    (msg) => msg.id === aiMessageIdToUse
                  )

                  if (aiMessageIndex !== -1) {
                    // Handle different types of streaming data based on the new format
                    if (streamData.action === "RESPONSE" && streamData.data) {
                      // Check if data.executeResult exists (new format)
                      if (streamData.data.executeResult) {
                        // 这部分逻辑已经在上面处理过了，跳过避免重复处理
                        return updatedMessages
                      }
                      // Fallback to old format
                      else if (streamData.data.content) {
                        // 处理content字段
                        const newContent = streamData.data.content
                        const currentMessage = updatedMessages[aiMessageIndex].message || ""

                        // 如果当前无内容，根据enableStreamEffect决定显示方式
                        if (!currentMessage) {
                          if (enableStreamEffect) {
                            // 启用流式效果：根据内容长度决定流式输出参数
                            const isLongContent = newContent.length > 10000 // 超过1万字的长内容
                            const initialChunkSize = isLongContent
                              ? 10
                              : Math.min(3, newContent.length)
                            const chunkSize = isLongContent ? 10 : 2 // 长内容每次处理10个字符，短内容2个字符
                            const delayTime = isLongContent ? 10 : 20 // 长内容10毫秒延迟，短内容20毫秒延迟

                            // 初始显示部分字符
                            updatedMessages[aiMessageIndex].message = newContent.substring(
                              0,
                              initialChunkSize
                            )

                            // 如果内容较短，直接显示全部
                            if (newContent.length <= initialChunkSize) {
                              return updatedMessages
                            }

                            // 剩余部分流式显示
                            setTimeout(() => {
                              let currentIndex = initialChunkSize

                              const streamInterval = setInterval(() => {
                                if (currentIndex >= newContent.length) {
                                  clearInterval(streamInterval)
                                  return
                                }

                                const endIndex = Math.min(
                                  currentIndex + chunkSize,
                                  newContent.length
                                )
                                const chunk = newContent.substring(currentIndex, endIndex)

                                setMessages((prev) => {
                                  const updatedMessages = [...prev]
                                  const aiMessageIndex = updatedMessages.findIndex(
                                    (msg) => msg.id === aiMessageIdToUse
                                  )

                                  if (aiMessageIndex !== -1) {
                                    updatedMessages[aiMessageIndex].message += chunk
                                  }

                                  return updatedMessages
                                })

                                currentIndex = endIndex
                                setTimeout(scrollToBottom, 0)
                              }, delayTime) // 使用动态延迟时间
                            }, 0)
                          } else {
                            // 关闭流式效果：直接显示完整内容
                            updatedMessages[aiMessageIndex].message = newContent
                            setTimeout(scrollToBottom, 0)
                          }
                        } else {
                          // 检查是否重复内容
                          if (!currentMessage.includes(newContent)) {
                            updatedMessages[aiMessageIndex].loading = false
                            updatedMessages[aiMessageIndex].serverTime = responseTimeInSeconds
                            updatedMessages[aiMessageIndex].message = currentMessage + newContent
                          }
                        }
                      }
                    }
                    // Remove duplicate condition and handle other cases
                    else if (streamData.data && typeof streamData.data === "string") {
                      // 处理纯字符串数据
                      const newContent = streamData.data
                      const currentMessage = updatedMessages[aiMessageIndex].message || ""

                      // 如果当前无内容，根据enableStreamEffect决定显示方式
                      if (!currentMessage) {
                        if (enableStreamEffect) {
                          // 启用流式效果：根据内容长度决定流式输出参数
                          const isLongContent = newContent.length > 10000 // 超过1万字的长内容
                          const initialChunkSize = isLongContent
                            ? 10
                            : Math.min(3, newContent.length)
                          const chunkSize = isLongContent ? 10 : 2 // 长内容每次处理10个字符，短内容2个字符
                          const delayTime = isLongContent ? 10 : 20 // 长内容10毫秒延迟，短内容20毫秒延迟

                          // 初始显示部分字符
                          updatedMessages[aiMessageIndex].message = newContent.substring(
                            0,
                            initialChunkSize
                          )

                          // 如果内容较短，直接显示全部
                          if (newContent.length <= initialChunkSize) {
                            return updatedMessages
                          }

                          // 剩余部分流式显示
                          setTimeout(() => {
                            let currentIndex = initialChunkSize

                            const streamInterval = setInterval(() => {
                              if (currentIndex >= newContent.length) {
                                clearInterval(streamInterval)
                                return
                              }

                              const endIndex = Math.min(currentIndex + chunkSize, newContent.length)
                              const chunk = newContent.substring(currentIndex, endIndex)

                              setMessages((prev) => {
                                const updatedMessages = [...prev]
                                const aiMessageIndex = updatedMessages.findIndex(
                                  (msg) => msg.id === aiMessageIdToUse
                                )

                                if (aiMessageIndex !== -1) {
                                  updatedMessages[aiMessageIndex].message += chunk
                                }

                                return updatedMessages
                              })

                              currentIndex = endIndex
                              setTimeout(scrollToBottom, 0)
                            }, delayTime) // 使用动态延迟时间
                          }, 0)
                        } else {
                          // 关闭流式效果：直接显示完整内容
                          updatedMessages[aiMessageIndex].message = newContent
                          setTimeout(scrollToBottom, 0)
                        }
                      } else {
                        // 检查是否重复内容
                        if (!currentMessage.includes(newContent)) {
                          updatedMessages[aiMessageIndex].loading = false
                          updatedMessages[aiMessageIndex].serverTime = responseTimeInSeconds
                          updatedMessages[aiMessageIndex].message = currentMessage + newContent
                        }
                      }
                    }
                  }

                  return updatedMessages
                })

                // Handle different types of streaming data based on the new format
                if (streamData.action === "RESPONSE" && streamData.data) {
                  // Check if data.executeResult exists (new format)
                  if (streamData.data.executeResult) {
                    // Get the new content to add
                    const newContent = streamData.data.executeResult

                    // First update to turn off loading state and add serverTime
                    setMessages((prev) => {
                      const updatedMessages = [...prev]
                      const aiMessageIndex = updatedMessages.findIndex(
                        (msg) => msg.id === aiMessageIdToUse
                      )

                      if (aiMessageIndex !== -1) {
                        updatedMessages[aiMessageIndex].loading = false
                        updatedMessages[aiMessageIndex].serverTime = responseTimeInSeconds
                      }

                      return updatedMessages
                    })

                    // Update the message one character at a time
                    let currentIndex = 0
                    const streamInterval = setInterval(() => {
                      if (currentIndex >= newContent.length) {
                        clearInterval(streamInterval)
                        return
                      }

                      setMessages((prev) => {
                        const updatedMessages = [...prev]
                        const aiMessageIndex = updatedMessages.findIndex(
                          (msg) => msg.id === aiMessageIdToUse
                        )

                        if (aiMessageIndex !== -1) {
                          const currentMessage = updatedMessages[aiMessageIndex].message || ""
                          updatedMessages[aiMessageIndex].message =
                            currentMessage + newContent.charAt(currentIndex)
                        }

                        return updatedMessages
                      })

                      currentIndex++
                      // 使用多个延时确保在不同渲染阶段都能滚动到底部
                      setTimeout(scrollToBottom, 0)
                      setTimeout(scrollToBottom, 50)
                    }, 20) // Adjust timing as needed
                  }
                  // Fallback to old format
                  else if (streamData.data.content) {
                    // Get the new content to add
                    const newContent = streamData.data.content

                    // First update to turn off loading state and add serverTime
                    setMessages((prev) => {
                      const updatedMessages = [...prev]
                      const aiMessageIndex = updatedMessages.findIndex(
                        (msg) => msg.id === aiMessageIdToUse
                      )

                      if (aiMessageIndex !== -1) {
                        updatedMessages[aiMessageIndex].loading = false
                        updatedMessages[aiMessageIndex].serverTime = responseTimeInSeconds
                      }

                      return updatedMessages
                    })

                    // Update the message one character at a time
                    let currentIndex = 0
                    const streamInterval = setInterval(() => {
                      if (currentIndex >= newContent.length) {
                        clearInterval(streamInterval)
                        return
                      }

                      setMessages((prev) => {
                        const updatedMessages = [...prev]
                        const aiMessageIndex = updatedMessages.findIndex(
                          (msg) => msg.id === aiMessageIdToUse
                        )

                        if (aiMessageIndex !== -1) {
                          const currentMessage = updatedMessages[aiMessageIndex].message || ""
                          updatedMessages[aiMessageIndex].message =
                            currentMessage + newContent.charAt(currentIndex)
                        }

                        return updatedMessages
                      })

                      currentIndex++
                      // 使用多个延时确保在不同渲染阶段都能滚动到底部
                      setTimeout(scrollToBottom, 0)
                      setTimeout(scrollToBottom, 50)
                    }, 20) // Adjust timing as needed
                  }
                }
                // Remove duplicate condition and handle other cases
                else if (streamData.data && typeof streamData.data === "string") {
                  // Get the new content to add
                  const newContent = streamData.data

                  // First update to turn off loading state and add serverTime
                  setMessages((prev) => {
                    const updatedMessages = [...prev]
                    const aiMessageIndex = updatedMessages.findIndex(
                      (msg) => msg.id === aiMessageIdToUse
                    )

                    if (aiMessageIndex !== -1) {
                      updatedMessages[aiMessageIndex].loading = false
                      updatedMessages[aiMessageIndex].serverTime = responseTimeInSeconds
                    }

                    return updatedMessages
                  })

                  // Update the message one character at a time
                  let currentIndex = 0
                  const streamInterval = setInterval(() => {
                    if (currentIndex >= newContent.length) {
                      clearInterval(streamInterval)
                      return
                    }

                    setMessages((prev) => {
                      const updatedMessages = [...prev]
                      const aiMessageIndex = updatedMessages.findIndex(
                        (msg) => msg.id === aiMessageIdToUse
                      )

                      if (aiMessageIndex !== -1) {
                        const currentMessage = updatedMessages[aiMessageIndex].message || ""
                        updatedMessages[aiMessageIndex].message =
                          currentMessage + newContent.charAt(currentIndex)
                      }

                      return updatedMessages
                    })

                    currentIndex++
                    // 使用多个延时确保在不同渲染阶段都能滚动到底部
                    setTimeout(scrollToBottom, 0)
                    setTimeout(scrollToBottom, 50)
                  }, 20) // Adjust timing as needed
                }

                // 检查是否是结束标志
                if (streamData.action === "END" || streamData.processStatus === "END") {
                  // 收到结束标志，主动关闭连接
                  controller.abort()

                  setLoading(false)
                }

                // Scroll to bottom with each update
                setTimeout(scrollToBottom, 0)
              } catch (error) {
                console.error("Failed to parse stream data:", error, parsedData.data)

                // Display error in the message if parsing fails
                setMessages((prev) => {
                  const updatedMessages = [...prev]
                  const aiMessageIndex = updatedMessages.findIndex(
                    (msg) => msg.id === aiMessageIdToUse
                  )

                  if (aiMessageIndex !== -1) {
                    // Turn off loading state
                    updatedMessages[aiMessageIndex].loading = false
                  }

                  return updatedMessages
                })

                // Try to extract any text content from the raw data
                try {
                  const rawData =
                    typeof parsedData.data === "string"
                      ? parsedData.data
                      : JSON.stringify(parsedData.data)

                  let contentToAdd = "[解析响应时出错]"

                  // 检查是否包含具有完整错误信息的格式："data":"{\"action\":\"RESPONSE\",\"data\":{\"success\":false,\"errorMsg\":\"...\"}}
                  if (
                    rawData.includes('"action":"RESPONSE"') &&
                    rawData.includes('"success":false')
                  ) {
                    try {
                      // 尝试解析出errorMsg部分
                      const innerData =
                        typeof parsedData.data === "string"
                          ? JSON.parse(parsedData.data)
                          : parsedData.data

                      if (
                        innerData.action === "RESPONSE" &&
                        innerData.data &&
                        innerData.data.errorMsg
                      ) {
                        let errorMsg = innerData.data.errorMsg

                        // 展示完整的错误信息，不只是提取message部分
                        if (typeof errorMsg === "string") {
                          // 如果包含转义字符，去除转义符号
                          const completeErrorMessage = errorMsg.replace(/\\"/g, '"')
                          contentToAdd = `[错误] 调用失败: ${completeErrorMessage}`
                        } else {
                          contentToAdd = `[错误] ${errorMsg}`
                        }
                      }
                    } catch (e) {
                      // 如果以上解析失败，再尝试正则表达式提取
                      const errorMsgMatch = rawData.match(/"errorMsg":"([^"]+)"/)
                      if (errorMsgMatch && errorMsgMatch[1]) {
                        const fullError = errorMsgMatch[1].replace(/\\"/g, '"')
                        contentToAdd = `[错误] ${fullError}`
                      }
                    }
                  }
                  // 检查是否包含HTML错误消息（如<span style="color: red">...错误信息...</span>）
                  else if (rawData.includes("<span") && rawData.includes("</span>")) {
                    // 提取span标签中的错误消息
                    const spanMatch = rawData.match(/<span[^>]*>(.*?)<\/span>/)
                    if (spanMatch && spanMatch[1]) {
                      contentToAdd = spanMatch[1]
                    }
                  } else if (rawData.includes("executeResult")) {
                    const match = rawData.match(/"executeResult":"([^"]+)"/)
                    if (match && match[1]) {
                      contentToAdd = match[1]
                    } else {
                      contentToAdd = "[解析响应时出错，但尝试显示内容]"
                    }
                  }

                  // Update the message one character at a time
                  let currentIndex = 0
                  const streamInterval = setInterval(() => {
                    if (currentIndex >= contentToAdd.length) {
                      clearInterval(streamInterval)
                      return
                    }

                    setMessages((prev) => {
                      const updatedMessages = [...prev]
                      const aiMessageIndex = updatedMessages.findIndex(
                        (msg) => msg.id === aiMessageIdToUse
                      )

                      if (aiMessageIndex !== -1) {
                        const currentMessage = updatedMessages[aiMessageIndex].message || ""
                        updatedMessages[aiMessageIndex].message =
                          currentMessage + contentToAdd.charAt(currentIndex)
                      }

                      return updatedMessages
                    })

                    currentIndex++
                    // 使用多个延时确保在不同渲染阶段都能滚动到底部
                    setTimeout(scrollToBottom, 0)
                    setTimeout(scrollToBottom, 50)
                  }, 20) // Adjust timing as needed
                } catch (e) {
                  // If all else fails, show a simple error message
                  const contentToAdd = "[解析响应时出错]"

                  // Update the message one character at a time
                  let currentIndex = 0
                  const streamInterval = setInterval(() => {
                    if (currentIndex >= contentToAdd.length) {
                      clearInterval(streamInterval)
                      return
                    }

                    setMessages((prev) => {
                      const updatedMessages = [...prev]
                      const aiMessageIndex = updatedMessages.findIndex(
                        (msg) => msg.id === aiMessageIdToUse
                      )

                      if (aiMessageIndex !== -1) {
                        const currentMessage = updatedMessages[aiMessageIndex].message || ""
                        updatedMessages[aiMessageIndex].message =
                          currentMessage + contentToAdd.charAt(currentIndex)
                      }

                      return updatedMessages
                    })

                    currentIndex++
                    // 使用多个延时确保在不同渲染阶段都能滚动到底部
                    setTimeout(scrollToBottom, 0)
                    setTimeout(scrollToBottom, 50)
                  }, 20) // Adjust timing as needed
                }
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
