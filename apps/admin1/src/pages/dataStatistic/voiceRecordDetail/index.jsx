import { useFetchAudioInfo, useFetchAudioInfoBySessionId } from "@/api/voiceRecord"
import { useMemo, useCallback, useRef, useEffect, useState } from "react"
import BaseInfo from "./BaseInfo"
import ChatHistory from "./ChatHistory"
import { MSG_ID_PREFIX } from "./ChatHistory/utils/utils"
import Player from "./Player"
import "./index.less"
import { Button, message } from "antd"
import TestDataEditModal from "@/pages/testSetManagement/TestDataEditModal"
import { convertChatToTestData } from "./utils/convertChatToTestData"
import { useLocation } from "react-router-dom"
import queryString from "query-string"

const ConsultRecord = ({ id, sessionId, isContainer, goBack }) => {
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)
  const { botNo } = queryParams
  const { data: audioData } = useFetchAudioInfo({ webcallId: id })
  // 飞轮项目使用sessionId获取录音记录
  const { data: flywheelData } = useFetchAudioInfoBySessionId({ sessionId })
  const data = sessionId ? flywheelData : audioData

  const [currentMsgId, setCurrentMsgId] = useState(null)
  const [testDataModalVisible, setTestDataModalVisible] = useState(false)
  const [testDataRecord, setTestDataRecord] = useState(null)
  const isScrollRef = useRef(false)
  const scrollRef = useRef(null)
  const timerRef = useRef()
  const lastMsgId = useRef(null)

  const audioUrl = useMemo(() => {
    return data?.ossLink || ""
  }, [data?.ossLink])

  const chatList = useMemo(() => {
    return data?.records || []
  }, [data?.records])

  const connectOffsetMs = useMemo(() => {
    const target = chatList.find(
      (item) =>
        item?.side === 1 &&
        item?.isIgnore === true &&
        Number.isFinite(Number(item?.actualAudioOffset))
    )
    const targetOffset = Number(target?.actualAudioOffset)
    if (!Number.isFinite(targetOffset)) return null
    return targetOffset
  }, [chatList])

  const handleScrollIntoView = useCallback((msgId) => {
    if (typeof msgId !== "number" || msgId <= -1) return
    const selector = `${MSG_ID_PREFIX}_${msgId}`
    const dom = document.querySelector(`#${selector}`)
    if (dom && !isScrollRef.current) {
      dom.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      })
    }
  }, [])

  /**文本滚动 */
  const handleTimeUpdate = useCallback(
    ({ time, status }) => {
      if (!status) {
        setCurrentMsgId(null)
        return
      }
      const msgId = chatList.findIndex((item) => {
        const currentTime = time * 1000
        return currentTime >= item.beginTimeOffset
      })
      setCurrentMsgId(msgId)
      if (lastMsgId.current !== msgId && msgId !== -1) {
        lastMsgId.current = msgId
        handleScrollIntoView(msgId)
      }
    },
    [chatList, handleScrollIntoView]
  )

  const onScroll = useCallback(() => {
    clearTimeout(timerRef.current)
    isScrollRef.current = true
    timerRef.current = setTimeout(() => {
      isScrollRef.current = false
      handleScrollIntoView(lastMsgId.current)
    }, 5000)
  }, [handleScrollIntoView])

  // 处理添加到测试集
  const handleAddToTestSet = useCallback(() => {
    try {
      if (!chatList || chatList.length === 0) {
        message.warning("没有聊天记录，无法添加到测试集")
        return
      }

      // 转换聊天记录为测试数据格式
      const requests = convertChatToTestData(chatList)

      if (requests.length === 0) {
        message.warning("无法从聊天记录中提取有效的请求和响应")
        return
      }

      // 创建测试数据记录（总结断言和原响应留空）
      const testRecord = {
        requests,
        summaryAssertExceptResult: "",
        output: ""
      }

      setTestDataRecord(testRecord)
      setTestDataModalVisible(true)
    } catch (error) {
      console.error("添加到测试集失败:", error)
      message.error("添加到测试集失败，请稍后重试")
    }
  }, [chatList])

  // 处理测试数据弹窗关闭
  const handleTestDataModalCancel = useCallback(() => {
    setTestDataModalVisible(false)
    setTestDataRecord(null)
  }, [])

  // 处试数据保存成功
  const handleTestDataSuccess = useCallback(() => {
    message.success("测试数据添加成功")
    handleTestDataModalCancel()
  }, [handleTestDataModalCancel])

  useEffect(() => {
    const scrollElement = scrollRef.current
    scrollElement?.addEventListener("scroll", onScroll)
    return () => {
      scrollElement?.removeEventListener("scroll", onScroll)
      lastMsgId.current = null
      isScrollRef.current = false
      clearTimeout(timerRef.current)
    }
  }, [id, onScroll])

  return (
    <>
      <div className={"consultContainer"} style={{ height: "100vh", padding: 0 }}>
        <div className={"consultRrecord"} style={{ margin: 0 }}>
          <div className={"consultPlayer"}>
            <Player
              url={audioUrl}
              callId={data?.callId}
              goBack={goBack}
              isContainer={isContainer}
              connectOffsetMs={connectOffsetMs}
              onTimeUpdate={handleTimeUpdate}
            />
            <div className={"consultMessage"}>
              <div className={"scrollWrapper"} ref={scrollRef}>
                <ChatHistory list={chatList} callId={data?.callId} currentMsgId={currentMsgId} />
              </div>
            </div>
          </div>
          <div className={"consultInfo"}>
            <div
              className={"flex justify-between p-3 items-center"}
              style={{ borderBottom: "1px solid #eff1f4" }}
            >
              <span className="text-base font-medium">基本信息</span>
              <Button onClick={handleAddToTestSet}>添加到测试集</Button>
            </div>
            <div className={"scrollWrapper"}>
              <BaseInfo baseInfoLists={data?.baseInfo || []} />
            </div>
          </div>
        </div>
      </div>

      {/* 测试数据编辑弹窗 */}
      <TestDataEditModal
        visible={testDataModalVisible}
        onCancel={handleTestDataModalCancel}
        onSuccess={handleTestDataSuccess}
        currentRecord={testDataRecord}
        botNo={botNo}
        setNo={data?.setNo}
        isVoice={true}
      />
    </>
  )
}

export default ConsultRecord
