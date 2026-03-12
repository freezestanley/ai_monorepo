import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import { debounce } from "lodash"
import Messages from "./messages"
import { Role } from "./messages/constants"
import TextareaForm from "./textarea-from"
import useDebugAgent from "./useDebugAgent"

function AgentDebugComponent({ botNo, agentNo, versionNo }, ref) {
  const { debugContent, handleDebug, loading, otherData } = useDebugAgent({
    botNo,
    agentNo,
    versionNo
  })
  const [messages, setMessages] = useState([])
  const otherDataRef = useRef({})
  const agentDataRef = useRef({})
  const loadingRef = useRef(null)
  const textareaRef = useRef(null)

  const onMessageScroll = debounce(() => {
    if (loadingRef?.current) {
      loadingRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, 500)

  useEffect(() => {
    if (!loading && textareaRef.current && messages.length > 0) {
      textareaRef.current.focus()
    }
  }, [loading, messages])

  useEffect(() => {
    if (botNo && agentNo && versionNo) {
      agentDataRef.current = {
        botNo,
        agentNo,
        versionNo,
        url: `/botWeb/bots/${botNo}/agents/${agentNo}/${versionNo}/debug`
      }
    }
  }, [botNo, agentNo, versionNo])

  const sendMessage = (message) => {
    const userMessage = {
      role: Role.user,
      content: message
    }
    if (otherDataRef?.current?.sessionId) {
      userMessage.sessionId = otherDataRef?.current.sessionId
    }
    handleDebug(userMessage, agentDataRef.current?.url)
    setMessages((prev) => [
      ...prev,
      {
        sessionMessages: [userMessage]
      }
    ])
  }

  useEffect(() => {
    if (debugContent) {
      setMessages((prevMessages) => {
        const prev = [...prevMessages]
        const lastMessage = prev[prev.length - 1]
        const newMessage = {
          role: Role.assistant,
          content: debugContent
        }
        lastMessage.sessionMessages.splice(1, 1, newMessage)
        prev.splice(prev.length - 1, 1, lastMessage)
        setTimeout(() => {
          onMessageScroll()
        }, 32)
        return prev
      })
    }
  }, [debugContent])

  useEffect(() => {
    if (otherData?.sessionId) {
      otherDataRef.current = otherData
    }
  }, [otherData])

  useImperativeHandle(ref, () => ({
    resetSession: () => {
      otherDataRef.current = null
      setMessages([])
    }
  }))

  return (
    <div
      style={{
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "rgb(243, 245, 249)"
      }}
    >
      <Messages messages={messages} isLoading={loading} loadingRef={loadingRef} />
      <TextareaForm sendMessage={sendMessage} isLoading={loading} textareaRef={textareaRef} />
    </div>
  )
}

export default forwardRef(AgentDebugComponent)
