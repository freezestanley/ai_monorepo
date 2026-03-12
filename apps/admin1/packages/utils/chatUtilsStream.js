import { fetchEventSource } from "@microsoft/fetch-event-source"
import { Get, Post, Put, Delete } from "@/api/server"
import { getTokenAndServiceName } from "@/api/sso"
import { message as messageAnt } from "antd"

/**
 * 处理发送消息并接收流式响应
 * @param {Object} params - 参数对象
 * @param {string} params.message - 用户输入的消息
 * @param {Array} params.files - 上传的文件列表
 * @param {Object} params.refer - 引用数据，包含events数组
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
 * @param {Function} params.processFileFromMessage - 处理文件数据的函数
 * @param {Function} params.handleNeedApprove - 处理需要授权的回调函数
 * @param {Function} params.onMessageUpdate - 消息更新回调，用于处理文件顺序等
 * @param {boolean} params.isJsonMode - 是否为JSON模式
 * @param {boolean} params.skipUserMessage - 是否跳过添加用户消息（用于授权后重新发送）
 * @param {string} params.aiMessageId - 已创建的AI消息ID（配合skipUserMessage使用）
 * @returns {Promise<void>}
 */
export const handleSendMessage = async ({
  message,
  files = [],
  refer,
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
  onMessageUpdate,
  isJsonMode = false,
  skipUserMessage = false,
  aiMessageId = null
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
  }

  setLoading(true)
  if (!skipUserMessage) {
    setContent("")
  }

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
    // console.log(`${botPrefix}/bots/${botNo}/agents/${agentNo}/chat`)
    // /20230911200326410/agents/tyefusqwyikay/chat'
    await fetchEventSource(`${botPrefix}/bots/${botNo}/agents/${agentNo}/chat`, {
      method: "POST",
      headers: {
        stream: true,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "x-service-name": "za-open-bot",
        "X-Usercenter-Session": getTokenAndServiceName().token,
        ...(sessionId ? { "X-Session-Id": sessionId } : "")
      },
      body: JSON.stringify({
        contents: contents,
        refer: refer
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
        // 不再重置或设置超时计时器
        // 注释掉以下代码，保持连接不自动关闭
        /*
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        // 设置新的超时计时器，如果30秒内没有新消息，则关闭连接
        timeoutRef.current = setTimeout(() => {
          // console.log("Response timeout, closing connection")
          controller.abort()
          setLoading(false)
        }, 30000)
        */

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
              console.error("Error processing NEED_APPROVE data:", e)
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

          // 检查是否有文件数据
          let fileData = null
          if (processFileFromMessage && typeof processFileFromMessage === "function") {
            fileData = processFileFromMessage(parsedData)
          }

          // 检查是否返回了文件数据
          if (fileData && Array.isArray(fileData) && fileData.length > 0) {
            // 提取响应的action类型
            let actionType = ""
            try {
              if (
                parsedData.data &&
                typeof parsedData.data === "string" &&
                parsedData.data.includes('"action"')
              ) {
                const innerData = JSON.parse(parsedData.data)
                actionType = innerData.action || ""
              }
            } catch (e) {
              console.error("Error extracting action type in chatUtils:", e)
            }

            // 记录此次消息的位置
            const messagePosition = Date.now()

            // 确保每个文件对象都有isCurrentMessage标记设为true
            const filesWithCurrentFlag = fileData.map((file, index) => {
              // 记录原始文件数据，用于区分不同文件
              const rawFileData = JSON.stringify(file)

              return {
                ...file,
                isCurrentMessage: true, // 强制设置为当前消息
                receivedTimestamp: Date.now() + index, // 添加接收时间戳，用于确定顺序，每个文件的时间戳略有不同
                fromToolInvocation: false, // 默认值
                // 确保每个文件的UID在列表中是唯一的
                uid:
                  file.uid ||
                  `file-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`,
                // 添加额外信息，确保不同文件能被区分
                responseActionType: actionType, // 记录响应类型
                messagePosition: messagePosition + index, // 记录消息位置
                rawData: rawFileData, // 保存原始数据
                originalPosition: index // 记录原始位置
              }
            })

            // 如果当前解析的是INVOKE_AGENT_TOOL类型的消息，记录它的位置，并将文件添加到当前AI消息中
            let isToolInvocation = false
            try {
              if (parsedData.data && typeof parsedData.data === "string") {
                const innerData = JSON.parse(parsedData.data)
                if (innerData.action === "INVOKE_AGENT_TOOL") {
                  isToolInvocation = true
                  // 如果是工具调用，将所有文件标记为来自工具调用
                  filesWithCurrentFlag.forEach((file) => {
                    file.fromToolInvocation = true
                    file.responseActionType = "INVOKE_AGENT_TOOL"
                  })
                } else if (innerData.action === "RESPONSE") {
                  // 如果是响应消息，标记为响应
                  filesWithCurrentFlag.forEach((file) => {
                    file.responseActionType = "RESPONSE"
                  })
                }
              }
            } catch (e) {
              console.error("Error checking message type:", e)
            }

            console.log(
              "处理的文件数据:",
              filesWithCurrentFlag.map((f) => ({
                name: f.name,
                type: f.responseActionType,
                position: f.messagePosition
              }))
            )

            // 先将文件数据添加到消息中
            setMessages((prev) => {
              const messages = [...prev]
              const aiMessageIndex = messages.findIndex((msg) => msg.id === aiMessageIdToUse)
              if (aiMessageIndex !== -1) {
                // 获取已有文件
                const existingFiles = messages[aiMessageIndex].files || []

                // 对新文件进行去重处理，防止重复添加相同文件
                const newFilesWithoutDuplicates = filesWithCurrentFlag.filter((newFile) => {
                  // 检查这个文件是否已经存在
                  return !existingFiles.some((existingFile) => {
                    // 通过比较文件名和类型判断是否为相同文件
                    if (
                      existingFile.name === newFile.name &&
                      existingFile.responseActionType === newFile.responseActionType
                    ) {
                      console.log(`跳过添加重复文件: ${newFile.name}`)
                      return true // 文件已存在，返回true表示需要过滤掉
                    }
                    return false // 文件不存在，保留
                  })
                })

                // 只有当有新的、不重复的文件时才更新消息
                if (newFilesWithoutDuplicates.length > 0) {
                  console.log(`添加 ${newFilesWithoutDuplicates.length} 个新文件`)

                  // 无论什么类型的文件，都立即添加到消息中以确保它们显示在最后一段文本之前
                  messages[aiMessageIndex].files = [...existingFiles, ...newFilesWithoutDuplicates]

                  // 如果是工具调用，标记为工具调用文件
                  if (isToolInvocation) {
                    messages[aiMessageIndex].toolFiles = true
                  }
                } else {
                  console.log("没有新的不重复文件需要添加")
                }
              }
              return messages
            })

            // 如果提供了onMessageUpdate回调，调用它来处理文件顺序
            if (onMessageUpdate && typeof onMessageUpdate === "function") {
              // 获取当前消息内容
              setMessages((prev) => {
                let currentMessage = ""
                const messages = [...prev]
                const aiMessageIndex = messages.findIndex((msg) => msg.id === aiMessageIdToUse)
                if (aiMessageIndex !== -1) {
                  currentMessage = messages[aiMessageIndex].message
                }

                // 调用回调传递最新消息和文件数据
                if (aiMessageIndex !== -1) {
                  // 使用setTimeout确保状态更新完成后再调用回调
                  setTimeout(() => {
                    // 传递isToolInvocation标记，让回调知道这是工具调用
                    onMessageUpdate(
                      currentMessage,
                      aiMessageIdToUse,
                      filesWithCurrentFlag,
                      isToolInvocation
                    )
                  }, 0)
                }

                return messages
              })
            }
          }

          // Process action data for headers if processActionData function is provided
          if (processActionData && typeof processActionData === "function") {
            const actionData = processActionData(parsedData)
            console.log("Received stream data:", actionData)

            if (actionData) {
              // Only process non-RESPONSE actions for headers
              if (actionData.actionType !== "RESPONSE") {
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
                      // Get the new content to add - 确保是字符串类型
                      const newContent =
                        typeof innerData.data.executeResult === "string"
                          ? innerData.data.executeResult
                          : innerData.data.executeResult.result || "[数据格式错误]"

                      // 纯流式处理RESPONSE消息，直接追加内容片段
                      setMessages((prev) => {
                        const updatedMessages = [...prev]
                        const aiMessageIndex = updatedMessages.findIndex(
                          (msg) => msg.id === aiMessageIdToUse
                        )

                        if (aiMessageIndex !== -1) {
                          updatedMessages[aiMessageIndex].loading = false
                          updatedMessages[aiMessageIndex].serverTime = responseTimeInSeconds

                          // 确保newContent是字符串
                          if (typeof newContent !== "string") {
                            console.error("newContent is not a string:", newContent)
                            return prev
                          }

                          // 纯流式：直接追加新内容到现有内容后面
                          const currentMessage = updatedMessages[aiMessageIndex].message || ""
                          updatedMessages[aiMessageIndex].message = currentMessage + newContent
                        }

                        return updatedMessages
                      })

                      // 滚动到底部
                      setTimeout(scrollToBottom, 0)

                      // 立即返回，避免后续重复处理
                      return
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

              // 处理 INVOKE_AGENT_TOOL 类型的消息
              if (
                typeof parsedData.data === "string" &&
                parsedData.data.includes('"action":"INVOKE_AGENT_TOOL"')
              ) {
                try {
                  const innerData = JSON.parse(parsedData.data)
                  if (innerData.action === "INVOKE_AGENT_TOOL" && innerData.data) {
                    // 对于 INVOKE_AGENT_TOOL 类型的消息，如果包含 executeResult，进行流式显示
                    let newContent = null

                    // 处理不同的数据结构
                    if (innerData.data.executeResult) {
                      if (typeof innerData.data.executeResult === "string") {
                        newContent = innerData.data.executeResult
                      } else if (
                        innerData.data.executeResult.result &&
                        typeof innerData.data.executeResult.result === "string"
                      ) {
                        newContent = innerData.data.executeResult.result
                      }
                    }

                    if (newContent && typeof newContent === "string") {
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

                          // 再次确保newContent是字符串（双重保护）
                          if (typeof newContent !== "string") {
                            console.error(
                              "INVOKE_AGENT_TOOL newContent is not a string:",
                              newContent
                            )
                            return prev
                          }

                          // 如果新内容已包含在当前内容中，不做更新
                          if (currentMessage.includes(newContent)) {
                            return prev
                          }

                          // 如果当前无内容，进行流式显示
                          if (!currentMessage) {
                            // 检查是否是英文内容，如果是则直接显示完整内容
                            if (/^[a-zA-Z0-9\s\p{P}]*$/u.test(newContent)) {
                              updatedMessages[aiMessageIndex].message = newContent
                              return updatedMessages
                            }

                            // 中文内容进行流式显示
                            const initialChunkSize = Math.min(5, newContent.length)
                            updatedMessages[aiMessageIndex].message = newContent.substring(
                              0,
                              initialChunkSize
                            )

                            if (newContent.length > initialChunkSize) {
                              setTimeout(() => {
                                let currentIndex = initialChunkSize
                                const chunkSize = 3

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
                                }, 15)
                              }, 0)
                            }
                          } else {
                            // 已有内容，直接追加
                            if (
                              !newContent.startsWith(currentMessage) &&
                              !currentMessage.startsWith(newContent)
                            ) {
                              updatedMessages[aiMessageIndex].message =
                                currentMessage + "\n\n" + newContent
                            } else if (
                              newContent.startsWith(currentMessage) &&
                              newContent !== currentMessage
                            ) {
                              updatedMessages[aiMessageIndex].message = newContent
                            }
                          }
                        }

                        return updatedMessages
                      })

                      // 立即返回，避免后续处理
                      return
                    }
                  }
                } catch (innerError) {
                  console.error(
                    "Failed to parse INVOKE_AGENT_TOOL data:",
                    innerError,
                    parsedData.data
                  )
                }
              }

              // 如果不是特定格式的消息，按原有逻辑处理
              const streamData =
                typeof parsedData.data === "string" ? JSON.parse(parsedData.data) : parsedData.data

              // 检查是否是结束标志
              if (streamData.action === "END" || streamData.processStatus === "END") {
                controller.abort()
                setLoading(false)
                setTimeout(scrollToBottom, 0)
                return
              }

              // 处理其他类型的流式数据（如普通的文本流）
              if (streamData.data && typeof streamData.data === "string") {
                const newContent = streamData.data

                setMessages((prev) => {
                  const updatedMessages = [...prev]
                  const aiMessageIndex = updatedMessages.findIndex(
                    (msg) => msg.id === aiMessageIdToUse
                  )

                  if (aiMessageIndex !== -1) {
                    updatedMessages[aiMessageIndex].loading = false
                    updatedMessages[aiMessageIndex].serverTime = responseTimeInSeconds

                    const currentMessage = updatedMessages[aiMessageIndex].message || ""

                    // 检查是否是英文内容，如果是则直接显示完整内容
                    if (/^[a-zA-Z0-9\s\p{P}]*$/u.test(newContent)) {
                      updatedMessages[aiMessageIndex].message = currentMessage + newContent
                      return updatedMessages
                    }

                    // 中文内容进行字符级流式显示
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
                          const currentChar = newContent.charAt(currentIndex)
                          updatedMessages[aiMessageIndex].message += currentChar
                        }

                        return updatedMessages
                      })

                      currentIndex++
                      setTimeout(scrollToBottom, 0)
                    }, 10)
                  }

                  return updatedMessages
                })
              }
            } catch (error) {
              console.error("Failed to parse stream data:", error, parsedData.data)

              // 处理解析错误
              setMessages((prev) => {
                const updatedMessages = [...prev]
                const aiMessageIndex = updatedMessages.findIndex(
                  (msg) => msg.id === aiMessageIdToUse
                )

                if (aiMessageIndex !== -1) {
                  updatedMessages[aiMessageIndex].loading = false

                  // 尝试提取错误信息
                  try {
                    const rawData =
                      typeof parsedData.data === "string"
                        ? parsedData.data
                        : JSON.stringify(parsedData.data)
                    let contentToAdd = "[解析响应时出错]"

                    if (
                      rawData.includes('"action":"RESPONSE"') &&
                      rawData.includes('"success":false')
                    ) {
                      const errorMsgMatch = rawData.match(/"errorMsg":"([^"]+)"/)
                      if (errorMsgMatch && errorMsgMatch[1]) {
                        contentToAdd = `[错误] ${errorMsgMatch[1].replace(/\\"/g, '"')}`
                      }
                    } else if (rawData.includes("executeResult")) {
                      const match = rawData.match(/"executeResult":"([^"]+)"/)
                      if (match && match[1]) {
                        contentToAdd = match[1]
                      }
                    }

                    const currentMessage = updatedMessages[aiMessageIndex].message || ""
                    updatedMessages[aiMessageIndex].message = currentMessage + contentToAdd
                  } catch (e) {
                    const currentMessage = updatedMessages[aiMessageIndex].message || ""
                    updatedMessages[aiMessageIndex].message = currentMessage + "[解析响应时出错]"
                  }
                }

                return updatedMessages
              })

              setTimeout(scrollToBottom, 0)
            }
          }
        } catch (error) {
          console.error("Failed to parse message:", error, event.data)
        }
      },
      onclose() {
        // 连接关闭时清除超时计时器（保留这部分逻辑以防万一）
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
        console.log("event =>> ", error)
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
    })
  } catch (error) {
    console.log("error =>> ", error)
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
