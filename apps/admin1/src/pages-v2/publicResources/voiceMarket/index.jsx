import { useState, useEffect, useMemo } from "react"
import { Button, Tag, Typography, Space, Tooltip, message, Popconfirm } from "antd"
import { Star, Eye, Volume2, Volume, Volume1 } from "lucide-react"
import dayjs from "dayjs"
import PageContent from "@/components-v2/PageContent"
import ListTableChange from "@/components-v2/ListTableChange"
import { getColumnSearchProps } from "@/components-v2/Table"
import { fetchPublicTimbreList, updateTimbreSubscriptionStatus } from "@/api/timbre/api"
import { fetchCancelSubscribe } from "@/api/market/api"
import TimbreDrawer from "@/pages/voice/components/TimbreDrawer"
import defaultTimbreGirl from "@/assets/img/defaultTimbreGirl.png"
import defaultTimbreBoy from "@/assets/img/defaultTimbreBoy.png"
import { cancelBubble, postMessageForLX } from "@/utils"
import { MessageType } from "@/constants/postMessageType"
import { marketCode } from "@/constants/market"
import useCardChangeData from "@/hooks/useCardChangeData"
import styles from "./index.module.scss"

const VoiceMarket = () => {
  const [loading, setLoading] = useState(false)
  const [hasNextPage, setHasNextPage] = useState(true)
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false)
  const [listData, setListData] = useState([])
  const [currentTimbre, setCurrentTimbre] = useState(null)
  const [currentBotNo, setCurrentBotNo] = useState(null)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [isChooseBotVisible, setIsChooseBotVisible] = useState(false)
  const [currentAuditionAudio, setCurrentAuditionAudio] = useState(null)
  const [isPlayingAudition, setIsPlayingAudition] = useState(false)
  const [currentPlayingTimbreId, setCurrentPlayingTimbreId] = useState(null)
  const [speakerLevel, setSpeakerLevel] = useState(0)

  const { queryParams, setQueryParams, viewMode, setViewMode } = useCardChangeData({
    nameKey: "timbreName"
  })

  const fetchList = async (pageNum = 1, reset = false) => {
    if (loading || isFetchingNextPage) return
    if (pageNum === 1) setLoading(true)
    else setIsFetchingNextPage(true)
    try {
      const res = await fetchPublicTimbreList({
        pageSize: queryParams.pageSize,
        pageNum,
        ...queryParams.queryParams
      })
      if (reset) {
        setListData(res)
      } else {
        setListData((prev) => [...prev, ...res])
      }
      setQueryParams((prev) => ({ ...prev, current: pageNum }))
      setHasNextPage(res.length === queryParams.pageSize)
    } catch (e) {
      message.error("获取公共声音失败")
    } finally {
      setLoading(false)
      setIsFetchingNextPage(false)
    }
  }

  useEffect(() => {
    fetchList(1, true)
    // eslint-disable-next-line
  }, [queryParams.queryParams])

  const onCardClick = (item) => {
    setCurrentTimbre(item)
    setCurrentBotNo(item.botNo)
    setDrawerVisible(true)
  }

  const handleCancelSubscribe = async (e, timbreId) => {
    cancelBubble(e)
    try {
      // 需要获取 botNo，假设 item 里有 botNo 字段
      const item = list.find((item) => item.timbreId === timbreId)
      if (!item || !item.botNo) {
        message.warning("未获取到空间，请重试")
        return
      }
      await fetchCancelSubscribe({ botNo: item.botNo, bizType: "PUBLIC_TIMBRE", bizNo: timbreId })
      message.success("取消订阅成功")
      fetchList(1, true)
    } catch {
      message.error("取消订阅失败")
    }
  }

  const showRobotSelectionModal = (e, item) => {
    cancelBubble(e)
    setCurrentTimbre(item)
    setIsChooseBotVisible(true)
  }

  const onChooseBotSumbmit = async (currentBot) => {
    try {
      // 订阅接口，传入 botNo 和 timbreId
      const res = await updateTimbreSubscriptionStatus({
        botNo: currentBot.botNo,
        timbreId: currentTimbre.timbreId,
        subscriptionStatus: "Y"
      })
      if (res?.status === 200 || res?.code === 200 || res?.code === "200") {
        message.success("订阅成功，正在为您跳转工作台～")
        // 发送消息给 iframe
        postMessageForLX({
          type: MessageType.SUBSCRIBE_SUCCESS,
          botNo: currentBot.botNo,
          tab: marketCode.TIMBRE
        })
        setIsChooseBotVisible(false)
        setCurrentTimbre(null)
        fetchList(1, true)
        // 可根据业务需要跳转页面，如 window.location.reload() 或 navigate()
      } else {
        let msg = "操作失败"
        if (typeof res?.message === "string") {
          msg = res.message
        } else if (typeof res?.message === "object" && res?.message?.message) {
          msg = res.message.message
        } else if (typeof res?.message === "object") {
          msg = JSON.stringify(res.message)
        }
        message.error(msg)
      }
    } catch {
      message.error("订阅失败")
    }
  }

  const list = useMemo(() => {
    return listData.map((item) => ({
      ...item,
      bizNo: item.timbreCode,
      id: item.timbreId,
      name: item.timbreName,
      iconUrl: item.avatarUrl
        ? item.avatarUrl
        : item.gender === "female"
          ? defaultTimbreGirl
          : defaultTimbreBoy,
      inputTypes: [
        `来源：${item.botName ? item.botName : item.source === "CREATED" ? "自建" : item.source}`,
        item.gender === "female" ? "女声" : "男声"
      ],
      supplierData: {
        color: "orange",
        text: item.timbreModel
      },
      isPinned: item.subscriptionStatus === "Y"
    }))
  }, [listData])

  // 处理音色试听
  const handleTimbreAudition = (resource) => {
    if (!resource?.auditionUrl) {
      message.warning("该音色暂无试听音频")
      return
    }

    // 如果当前正在播放：同一条目则停止并返回；不同条目则切到新音频
    if (isPlayingAudition && currentAuditionAudio) {
      currentAuditionAudio.pause()
      currentAuditionAudio.currentTime = 0
      setCurrentAuditionAudio(null)
      setIsPlayingAudition(false)
      if (currentPlayingTimbreId === resource.timbreId) {
        setCurrentPlayingTimbreId(null)
        return
      }
    }

    // 停止之前可能存在的音频
    if (currentAuditionAudio) {
      currentAuditionAudio.pause()
      currentAuditionAudio.currentTime = 0
    }

    // 创建新的音频实例
    const audio = new Audio(resource.auditionUrl)
    setCurrentAuditionAudio(audio)
    setIsPlayingAudition(true)
    setCurrentPlayingTimbreId(resource.timbreId)

    // 定义播放结束的处理函数
    const handleAuditionEnded = () => {
      setCurrentAuditionAudio(null)
      setIsPlayingAudition(false)
      audio.removeEventListener("ended", handleAuditionEnded)
    }

    audio.addEventListener("ended", handleAuditionEnded)
    audio.play().catch((error) => {
      console.error("播放试听音频失败:", error)
      message.error("试听播放失败")
      setCurrentAuditionAudio(null)
      setIsPlayingAudition(false)
      audio.removeEventListener("ended", handleAuditionEnded)
    })
  }

  useEffect(() => {
    let timer = null
    if (isPlayingAudition) {
      timer = setInterval(() => {
        setSpeakerLevel((pre) => {
          return pre === 2 ? 0 : pre + 1
        })
      }, 300)
    }
    return () => {
      clearInterval(timer)
    }
  }, [isPlayingAudition])

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm()
    // 更新查询参数
    const newParams = {}
    // 处理业务分类筛选参数名映射
    if (dataIndex === "name") {
      newParams.timbreName = selectedKeys[0]
    }
    setQueryParams((preState) => ({
      ...preState,
      queryParams: { ...preState.queryParams, ...newParams },
      current: 1
    }))
  }

  const handleReset = (clearFilters, confirm, dataIndex) => {
    clearFilters()
    // 重置特定字段的查询参数
    confirm({ closeDropdown: false })
    setQueryParams((preState) => {
      const newParams = preState.queryParams
      // 处理业务分类和标签筛选参数名映射
      if (dataIndex === "name") {
        delete newParams.timbreName
      } else {
        delete newParams[dataIndex]
      }
      return { ...preState, current: 1, queryParams: { ...newParams } }
    })
  }

  const columns = useMemo(() => {
    return [
      {
        title: "声音名称",
        dataIndex: "name",
        key: "name",
        width: 200,
        render: (text, record) => (
          <div className="flex items-center gap-2">
            <img src={record.iconUrl} className="w-[32px] h-[32px] rounded-full" />
            <Typography.Paragraph
              ellipsis={{ rows: 1, tooltip: text }}
              className="!m-0 text-[14px] font-bold text-gray-900 leading-snug line-clamp-2 break-all"
            >
              {text}
            </Typography.Paragraph>
          </div>
        ),
        ...getColumnSearchProps({
          dataIndex: "name",
          placeholder: "声音名称",
          color: "orange",
          defaultFilteredValue: queryParams.queryParams.timbreName
            ? [queryParams.queryParams.timbreName]
            : undefined,
          handleSearch,
          handleReset
        })
      },
      {
        title: "模型",
        dataIndex: "timbreModel",
        key: "timbreModel",
        width: 160,
        render: (text) => (
          <Tag color={"orange"} style={{ margin: 0 }} bordered={false}>
            {text}
          </Tag>
        )
      },
      {
        title: "声音描述",
        dataIndex: "description",
        key: "description",
        width: 400,
        render: (text) => (
          <Typography.Paragraph
            ellipsis={{ rows: 2, tooltip: text }}
            className="text-gray-600 !mb-3 font-medium"
          >
            {text || "-"}
          </Typography.Paragraph>
        )
      },
      {
        title: "来源空间",
        dataIndex: "source",
        key: "source",
        width: 160,
        render: (text, record) =>
          record.botName ? record.botName : text === "CREATED" ? "自建" : text
      },
      {
        title: "性别",
        dataIndex: "gender",
        key: "gender",
        width: 120,
        render: (text) => (text === "female" ? "女声" : "男声")
      },
      {
        title: "更新时间",
        dataIndex: "gmtModified",
        key: "gmtModified",
        width: 120,
        render: (text) => (text ? dayjs(text).format("YYYY-MM-DD") : "-")
      },
      {
        title: "操作",
        dataIndex: "action",
        key: "action",
        fixed: "right",
        width: 120,
        render: (_, record) => (
          <Space size={8}>
            <Tooltip title={"查看"}>
              <Button
                type="link"
                className="!text-gray-400 hover:!text-orange-600 transition-colors !p-0 !border-0"
                icon={<Eye className="mt-1" size={18} strokeWidth={2.2} />}
                onClick={() => onCardClick(record)}
              />
            </Tooltip>
            <Tooltip title={"试听"}>
              <Button
                type="link"
                onClick={() => {
                  handleTimbreAudition(record)
                }}
                className="!text-gray-400 hover:!text-orange-600 transition-colors !p-0 !border-0"
              >
                {currentPlayingTimbreId === record.timbreId && isPlayingAudition ? (
                  speakerLevel === 2 ? (
                    <Volume2 size={16} strokeWidth={2.2} />
                  ) : speakerLevel === 1 ? (
                    <Volume1 size={16} strokeWidth={2.2} />
                  ) : (
                    <Volume size={16} strokeWidth={2.2} />
                  )
                ) : (
                  <Volume2 size={16} strokeWidth={2.2} />
                )}
              </Button>
            </Tooltip>
            <Tooltip title={record.isPinned ? "取消订阅" : "订阅"}>
              <Button
                type="link"
                className="!text-gray-400 hover:!text-orange-600 transition-colors !p-0 !border-0"
                icon={<Star className="mt-1" size={16} strokeWidth={2.2} />}
                onClick={(e) => showRobotSelectionModal(e, record)}
              />
            </Tooltip>
          </Space>
        )
      }
    ]
  }, [queryParams, speakerLevel, isPlayingAudition, currentPlayingTimbreId])

  return (
    <PageContent
      title="声音社区"
      HeaderLeftComp={
        <Button
          type="link"
          className="!font-[600] !text-orange-400 hover:!text-orange-600 !opacity-100 !p-0 !border-0 transition-colors"
          onClick={() =>
            window.open(
              "https://doc.weixin.qq.com/doc/w3_AaAAiwaoANoCNmcfhtsD8SBi0vw97?scode=AE4AywdQAA4BO4150fAeAAKwbkAGk",
              "_blank"
            )
          }
        >
          创建复刻音色
        </Button>
      }
      searchProps={
        viewMode === "card"
          ? {
              placeholder: "搜索音色名称...",
              defaultValue: queryParams.queryParams.timbreName,
              onChange: (e) =>
                setQueryParams((preState) => ({
                  ...preState,
                  current: 1,
                  queryParams: { ...preState.queryParams, timbreName: e.target.value }
                }))
            }
          : undefined
      }
      segmentedProps={{
        className: styles.segmented,
        value: viewMode,
        onChange: (v) => setViewMode(v)
      }}
    >
      <div className="pt-5">
        <ListTableChange
          viewMode={viewMode}
          list={list}
          loading={loading}
          onClick={onCardClick}
          isFetchingNextPage={isFetchingNextPage}
          isChooseBotVisible={isChooseBotVisible}
          setIsChooseBotVisible={setIsChooseBotVisible}
          onChooseBotSumbmit={onChooseBotSumbmit}
          resourceCardProps={{
            className: "hover:border-orange-200",
            FooterLeftText: "查看声音",
            tagColor: "orange",
            FooterRight: (resource) => (
              <Space size={15}>
                {resource?.auditionUrl && (
                  <a
                    onClick={(e) => {
                      cancelBubble(e)
                      handleTimbreAudition(resource)
                    }}
                    className="text-[var(--primary-color)] hover:text-[var(--primary-color)] ml-2 flex items-center gap-1"
                  >
                    {currentPlayingTimbreId === resource.timbreId && isPlayingAudition ? (
                      speakerLevel === 2 ? (
                        <Volume2 size={16} strokeWidth={2.2} />
                      ) : speakerLevel === 1 ? (
                        <Volume1 size={16} strokeWidth={2.2} />
                      ) : (
                        <Volume size={16} strokeWidth={2.2} />
                      )
                    ) : (
                      <Volume2 size={16} strokeWidth={2.2} />
                    )}
                    试听
                  </a>
                )}
                <Tooltip title={resource.isPinned ? "取消订阅" : "订阅"}>
                  {resource.isPinned ? (
                    <Popconfirm
                      title=""
                      description={`【取消订阅】将无法调用对应声音。`}
                      okText="确认"
                      onConfirm={(e) => handleCancelSubscribe(e, resource.timbreId)}
                      cancelText="取消"
                      onPopupClick={(e) => cancelBubble(e)}
                    >
                      <div
                        className={`w-8 h-8 rounded-[var(--radius-s)] flex items-center justify-center transition-all ${resource.isPinned ? "bg-[#fff7e6] text-yellow-400 shadow-inner" : "bg-gray-50 text-gray-200 hover:text-gray-400"}`}
                      >
                        <Star
                          size={16}
                          strokeWidth={2.2}
                          fill={resource.isPinned ? "currentColor" : "none"}
                        />
                      </div>
                    </Popconfirm>
                  ) : (
                    <div
                      className={`w-8 h-8 rounded-[var(--radius-s)] flex items-center justify-center transition-all ${resource.isPinned ? "bg-[#fff7e6] text-yellow-400 shadow-inner" : "bg-gray-50 text-gray-200 hover:text-gray-400"}`}
                      onClick={(e) => showRobotSelectionModal(e, resource)}
                    >
                      <Star
                        size={16}
                        strokeWidth={2.2}
                        fill={resource.isPinned ? "currentColor" : "none"}
                      />
                    </div>
                  )}
                </Tooltip>
              </Space>
            )
          }}
          tableProps={{ columns }}
          fetchNextPage={() =>
            hasNextPage && !loading && !isFetchingNextPage && fetchList(queryParams.current + 1)
          }
        />
      </div>
      <TimbreDrawer
        visible={drawerVisible}
        botNo={currentBotNo}
        onClose={() => setDrawerVisible(false)}
        timbreId={currentTimbre?.timbreId}
        mode="marketView"
      />
    </PageContent>
  )
}

export default VoiceMarket
