import Message from "./message"
import "./index.scss"
import { Role } from "./constants"
import { useEffect, useRef } from "react"

const Messages = ({ style = {}, messages = [], isLoading = false, loadingRef }) => {
  const messagesLength = messages.length

  useEffect(() => {
    if (loadingRef?.current) {
      loadingRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  return (
    <div className="message-wrapper" style={style}>
      {messages.map((message, i) => {
        const talkData = {
          requestId: message.requestId,
          isLike: message.isLike,
          skillNo: message.skillNo,
          botNo: message.assistantNo,
          variables: message.variables || {}
        }
        return message?.sessionMessages?.map((messageItem, j) => {
          const isLastMessage = messagesLength === i + 1
          const isJustWaiting = isLastMessage && isLoading && message?.sessionMessages?.length === 1
          return (
            <>
              {isJustWaiting ? (
                <>
                  <Message
                    key={`${i}_${j}_0`}
                    talkData={talkData}
                    {...messageItem}
                    position={[i, j]}
                    isLoading={isLoading}
                    isLastMessage={isLastMessage}
                    isJustWaiting={isJustWaiting}
                  />
                  <Message
                    key={`${i}_${1}_0`}
                    talkData={talkData}
                    {...messageItem}
                    content={" "}
                    role={Role.assistant}
                    position={[i, 1]}
                    isLoading={isLoading}
                    isLastMessage={isLastMessage}
                    isJustWaiting={isJustWaiting}
                  />
                </>
              ) : (
                <Message
                  key={`${i}_${j}`}
                  talkData={talkData}
                  {...messageItem}
                  position={[i, j]}
                  isLoading={isLoading}
                  isLastMessage={isLastMessage}
                  isJustWaiting={isJustWaiting}
                />
              )}
            </>
          )
        })
      })}
      {isLoading && <div style={{ height: 50 }} />}
      {/* {isLoading && <ChatStopGenerate />} */}
      <div ref={loadingRef} />
    </div>
  )
}

export default Messages
