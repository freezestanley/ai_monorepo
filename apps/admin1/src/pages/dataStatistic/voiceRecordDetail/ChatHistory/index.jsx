import ClientAvatar from "../img/clientAvatar.svg"
import DeskAvatar from "../img/deskAvatar.svg?react"
import { MSG_ID_PREFIX } from "./utils/utils"
import classnames from "classnames"
import { memo, useCallback, useRef, useState } from "react"
import { Tag, Space, Button } from "antd"
import { formatDate } from "./utils/ui"
import AudioTraceDrawer from "./components/AudioTraceDrawer"
import "./index.less"

const ChatHistory = ({ list, callId, currentMsgId }) => {
  const bubbleRefs = useRef({})
  const containerRef = useRef(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [currentRequestId, setCurrentRequestId] = useState("")

  const handleLogClick = useCallback((requestId) => {
    setCurrentRequestId(requestId)
    setDrawerOpen(true)
  }, [])

  const handleDrawerClose = useCallback(() => {
    setDrawerOpen(false)
    setCurrentRequestId("")
  }, [])

  const renderAvatar = useCallback((item) => {
    return (
      <div className={"avatar"}>
        {item.side === 0 ? <DeskAvatar style={{ color: "#B692F6" }} /> : <img src={ClientAvatar} />}
      </div>
    )
  }, [])

  const renderBubble = useCallback(
    (item, index) => (
      <div className={classnames("w90", item.side === 1 && "alignR")}>
        <div className={"time"}>{formatDate(item.beginTime)}</div>
        <div
          className={classnames("bubble", {
            currentMsg: `${MSG_ID_PREFIX}_${index}` === currentMsgId
          })}
          dangerouslySetInnerHTML={{ __html: item.content }}
        />
        <div className={"action"} style={item.side === 1 ? { justifyContent: "flex-end" } : {}}>
          <Space size={4}>
            {item.side == 0 && (
              <div
                className="cursor-pointer text-[12px] text-gray-500 hover:text-[#7f56d9] align-middle"
                onClick={() => handleLogClick(item.requestId)}
              >
                <i className="iconfont icon-wendangzhishiku"></i>
                <span className="ml-[1px] -mt-1">日志</span>
              </div>
            )}
            {!!item.eventInfo && <Tag>事件：{item.eventInfo}</Tag>}
            {!!item.intentionName && <Tag>意图：{item.intentionName}</Tag>}
            {!!item.faqName && <Tag>FAQ：{item.faqName}</Tag>}
          </Space>
        </div>
      </div>
    ),
    [currentMsgId]
  )

  const renderItem = useCallback(
    (item, index) => {
      if (item.side === 0) {
        return (
          <div
            id={`${MSG_ID_PREFIX}_${index}`}
            key={index}
            ref={(ref) => ref && (bubbleRefs.current[index] = ref)}
          >
            <div className={"item"}>
              {renderAvatar(item)}
              {renderBubble(item, index)}
            </div>
          </div>
        )
      } else if (item.side === 1) {
        return (
          <div
            id={`${MSG_ID_PREFIX}_${index}`}
            key={index}
            ref={(ref) => ref && (bubbleRefs.current[index] = ref)}
          >
            <div className={classnames("item", "reverseItem")}>
              {renderBubble(item, index)}
              {renderAvatar(item)}
            </div>
          </div>
        )
      }
      return null
    },
    [renderBubble, renderAvatar]
  )

  return (
    <>
      <div className={"chatHistoryContainer"} ref={containerRef}>
        {list?.map((item, index) => {
          return (
            <div id={`msgRow-${index}`} data-rowid={index} className="msgRow" key={index}>
              {renderItem(item, index)}
            </div>
          )
        })}
      </div>
      <AudioTraceDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        callId={callId}
        requestId={currentRequestId}
      />
    </>
  )
}

export default memo(ChatHistory)
