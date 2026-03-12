import { fetchEventSource } from "@microsoft/fetch-event-source"
import { getTokenAndServiceName } from "@/api/sso"
import { message as messageAnt } from "antd"
import { isStudio } from "@/config.env"

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

  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current)
    timeoutRef.current = null
  }

  if (!skipUserMessage) {
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

  const contents = []
  if (message) {
    if (mode === "single_agent_skill_mode" && isJsonMode) {
      try {
        const jsonMessage = typeof message === "string" ? message : JSON.stringify(message)
        contents.push({ contentType: "TEXT", content: { text: jsonMessage } })
      } catch (error) {
        console.error("JSON formatting error:", error)
        contents.push({ contentType: "TEXT", content: { text: message } })
      }
    } else {
      contents.push({ contentType: "TEXT", content: { text: message } })
    }
  }

  files.forEach((file) => {
    if (file.type.startsWith("image/")) {
      contents.push({ contentType: "IMAGE", content: { imageUrl: { url: file.url } } })
    } else {
      contents.push({
        contentType: "FILE",
        content: {
          fileUrl: { url: file.url, fileName: file.name, suffix: file.name.split(".").pop() }
        }
      })
    }
  })

  const controller = new AbortController()
  controllerRef.current = controller

  const aiMessageIdToUse = aiMessageId || (Date.now() + 1).toString()

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

  let testNum = 0

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
          Accept: "text/event-stream",
          ...(isChat ? {} : { stream: true }),
          ...(sessionId ? { "X-Session-Id": sessionId } : {}),
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
          if (timeoutRef.current) clearTimeout(timeoutRef.current)
          timeoutRef.current = setTimeout(() => {
            console.log("Response timeout, closing connection")
            controller.abort()
            setLoading(false)
          }, 300000)

          console.log("text-stream=>>", testNum++, new Date().getTime())

          try {
            const parsedData = JSON.parse(event.data)

            if (parsedData.sessionId) setSessionId(parsedData.sessionId)

            if (parsedData.data?.includes('"action":"NEED_APPROVE"')) {
              try {
                const innerData = JSON.parse(parsedData.data)
                if (
                  innerData.action === "NEED_APPROVE" &&
                  innerData.data?.waitForApproveTools?.length > 0
                ) {
                  controller.abort()
                  setLoading(false)
                  const lastMessage = { message, files, aiMessageId: aiMessageIdToUse }
                  if (handleNeedApprove)
                    handleNeedApprove(innerData.data.waitForApproveTools, lastMessage, sessionId)
                  return
                }
              } catch (e) {
                console.error("Error parsing NEED_APPROVE data:", e)
              }
            }

            if (processActionData) {
              const actionData = processActionData(parsedData)
              if (actionData && actionData.actionType !== "RESPONSE") {
                setMessages((prev) => {
                  const aiMessageIndex = prev.findIndex((msg) => msg.id === aiMessageIdToUse)
                  if (aiMessageIndex === -1) return prev

                  const updatedMessages = [...prev]
                  const targetMessage = { ...updatedMessages[aiMessageIndex] }
                  const newServerActions = [...(targetMessage.serverActions || [])]
                  const existingActionIndex = newServerActions.findIndex(
                    (act) => act.uniqueId === actionData.uniqueId
                  )

                  if (existingActionIndex !== -1) {
                    const existingAction = newServerActions[existingActionIndex]
                    // Smart merge: only update with defined values from new data
                    const mergedAction = { ...existingAction }
                    for (const key in actionData) {
                      if (actionData[key] !== undefined) {
                        mergedAction[key] = actionData[key]
                      }
                    }
                    newServerActions[existingActionIndex] = mergedAction
                  } else {
                    newServerActions.push(actionData)
                  }

                  updatedMessages[aiMessageIndex] = {
                    ...targetMessage,
                    serverActions: newServerActions
                  }
                  return updatedMessages
                })
              }
            }

            if (parsedData.data) {
              try {
                if (parsedData.data.includes('"action":"RESPONSE"')) {
                  try {
                    const innerData = JSON.parse(parsedData.data)
                    if (innerData.action === "RESPONSE" && innerData.data) {
                      if (innerData.data.errorMsg) {
                        setMessages((prev) =>
                          prev.map((msg) =>
                            msg.id === aiMessageIdToUse
                              ? {
                                  ...msg,
                                  loading: false,
                                  message: `[错误] ${innerData.data.errorMsg}`
                                }
                              : msg
                          )
                        )
                        return
                      }
                      if (innerData.data.executeResult) {
                        setMessages((prev) =>
                          prev.map((msg) =>
                            msg.id === aiMessageIdToUse
                              ? {
                                  ...msg,
                                  message: msg.message + innerData.data.executeResult,
                                  loading: false
                                }
                              : msg
                          )
                        )
                        setTimeout(scrollToBottom, 0)
                        return
                      }
                    }
                    if (innerData.action === "END") {
                      controller.abort()
                      setLoading(false)
                      return
                    }
                  } catch (innerError) {
                    console.error("Failed to parse inner data:", innerError, parsedData.data)
                  }
                }

                const streamData =
                  typeof parsedData.data === "string"
                    ? JSON.parse(parsedData.data)
                    : parsedData.data
                if (streamData.action === "RESPONSE" && streamData.data) {
                  const contentToAdd =
                    streamData.data.executeResult ||
                    streamData.data.content ||
                    (typeof streamData.data === "string" ? streamData.data : "")
                  if (contentToAdd) {
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === aiMessageIdToUse
                          ? { ...msg, message: msg.message + contentToAdd, loading: false }
                          : msg
                      )
                    )
                    setTimeout(scrollToBottom, 0)
                  }
                }

                if (streamData.action === "END" || streamData.processStatus === "END") {
                  controller.abort()
                  setLoading(false)
                }
              } catch (error) {
                console.error("Failed to parse stream data:", error, parsedData.data)
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessageIdToUse
                      ? { ...msg, loading: false, message: "[解析响应时出错]" }
                      : msg
                  )
                )
              }
            }
          } catch (error) {
            console.error("Failed to parse message:", error, event.data)
          }
        },
        onclose() {
          if (timeoutRef.current) clearTimeout(timeoutRef.current)
          setMessages((prev) =>
            prev.map((msg) => (msg.id === aiMessageIdToUse ? { ...msg, loading: false } : msg))
          )
          setLoading(false)
          setTimeout(scrollToBottom, 0)
        },
        onerror(error) {
          if (timeoutRef.current) clearTimeout(timeoutRef.current)
          setMessages((prev) =>
            prev.map((msg) => (msg.id === aiMessageIdToUse ? { ...msg, loading: false } : msg))
          )
          console.error("Stream failed:", error)
          setLoading(false)
          controller.abort()
          messageAnt.error("对话请求失败，请重试")
        }
      }
    )
  } catch (error) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    console.error("Failed to send message:", error)
    setLoading(false)
  }
}

export const handleStopGenerate = ({ controllerRef, timeoutRef, setLoading, setMessages }) => {
  if (controllerRef.current) {
    controllerRef.current.abort()
    controllerRef.current = null
    setLoading(false)
  }
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current)
    timeoutRef.current = null
  }
  setMessages((prev) =>
    prev.map((msg) => (msg.status === "ai" && msg.loading ? { ...msg, loading: false } : msg))
  )
}
