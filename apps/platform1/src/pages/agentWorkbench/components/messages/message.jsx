import classNames from "classnames"
import { useRef, useState, useMemo } from "react"
import { Steps, message } from "antd"
import { CopyOutlined, SyncOutlined } from "@ant-design/icons"
import "github-markdown-css"
import "./index.scss"
import { FormatMessageMode, Role } from "./constants"
import Loading from "../loading"
import { formatMessage } from "@/components/MarkdownRenderer/formatMessage"

const BOT_COMMON_ICON =
  "https://alicdn.zaticdn.com/zaip/zaip-toolweb-file-service/upload/dry3fpL8dCRXKJTgKfhrRP-common-chat.png"

const Message = (props) => {
  const role = props.role
  const content = props.content
  const isError = props.isError
  const isLoading = props.isLoading
  const { additions, isLastMessage } = props
  const isUser = role === Role.user
  const isAssistant = role === Role.assistant || role === Role.ai

  const userMessageRef = useRef(null)

  const isSmallScreen = false

  const handleCopyClick = () => {
    const textarea = document.createElement("textarea")
    textarea.value = content
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand("copy")
    document.body.removeChild(textarea)
    message.success("拷贝成功！")
  }

  const renderContent = useMemo(() => {
    return (
      formatMessage(
        content,
        isAssistant ? FormatMessageMode.partial : FormatMessageMode.zero,
        isLoading && isLastMessage
      ) || ""
    )
  }, [content, isLoading, isLastMessage])

  const stepAndStatusItems = useMemo(() => {
    if (isLoading && renderContent === '<p><span class="typewriter-cursor"></span></p>') {
      return [
        {
          title: "思考中",
          subTitle: "CPU在狂烧……",
          status: "process",
          icon: <SyncOutlined spin />
        }
      ]
    }
    if (isLoading && renderContent) {
      return [
        {
          title: "生成中",
          subTitle: "打字机在玩命……",
          status: "process",
          icon: <SyncOutlined spin />
        }
      ]
    }
    return []
  }, [renderContent, isLoading])

  const showCopyIcon = true

  return (
    <div
      className={classNames("content-word-wrapper", {
        "user-word": isUser,
        "markdown-body": isAssistant,
        "gpt-word": isAssistant
      })}
    >
      {isAssistant && isLoading && isLastMessage && (
        <Steps direction="vertical" size="small" items={stepAndStatusItems} />
      )}

      <div className="content-word-center">
        {isAssistant && <img className="user-avatar" src={BOT_COMMON_ICON} />}
        <div
          className={classNames("content-word", {
            "copy-disable": !showCopyIcon
          })}
        >
          {!props.isWaiting ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                className={classNames("chat-words-wrapper", {
                  "message-chatgpt": isAssistant,
                  "text-gray-900": isUser,
                  "text-red-500": isError,
                  generating: true
                })}
                ref={userMessageRef}
                dangerouslySetInnerHTML={{
                  __html: renderContent
                }}
              />
            </div>
          ) : (
            <Loading />
          )}
        </div>
        {isUser && !isSmallScreen && (
          <img
            className="user-avatar"
            src="https://alicdn.zaticdn.com/zaip/zaip-toolweb-file-service/upload/gQfn1TAwncsLH3U45m1n36-icon.png"
          />
        )}
      </div>
    </div>
  )
}

export default Message
