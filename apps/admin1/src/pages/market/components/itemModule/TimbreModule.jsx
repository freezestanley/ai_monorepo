/*
 * @Author: Dyton
 * @Date: 2024-12-19 10:00:00
 * @Descripttion: 声音市集组件
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-12-19 10:00:00
 * @FilePath: /za-aigc-platform-admin-static/src/pages/market/components/itemModule/TimbreModule.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import React, { useState, useEffect } from "react"
import { Col, Row, Button, Tooltip, Spin, message, Popconfirm, Tag, Table, Radio } from "antd"
import {
  CopyOutlined,
  StarOutlined,
  AppstoreOutlined,
  BarsOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined
} from "@ant-design/icons"
import QueueAnim from "rc-queue-anim"
import copy from "copy-to-clipboard"
import { useInView } from "react-intersection-observer"
import { useInfiniteTimbreMarketListApi } from "@/api/timbre"

import { updateTimbreSubscriptionStatus } from "@/api/timbre/api"

import { useMarket } from "../../"
import { getThemeConfig, marketCode } from "@/constants/market"
import { cancelBubble } from "@/utils"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"
import styles from "./index.module.scss"
import queryString from "query-string"
import { useLocation } from "react-router-dom"
import { SkeletonModule } from "./skeleton"
import TimbreDrawer from "@/pages/voice/components/TimbreDrawer"

// 声音图标
import timbreIcon from "@/assets/img/voiceTitle.png"
import defaultAvatar from "@/assets/img/empty.png"
import defaultTimbreGirl from "@/assets/img/defaultTimbreGirl.png"
import defaultTimbreBoy from "@/assets/img/defaultTimbreBoy.png"

import "./TimbreModule.scss"

export const TimbreModule = () => {
  const { marketSearch } = useMarket()
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search) ?? {}
  const { botNo } = queryParams
  const [pagination, setPagination] = useState({ current: 1, pageSize: 12 })
  const { color, hover, title, border } = getThemeConfig(marketCode.TIMBRE)

  // 详情抽屉状态
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [currentTimbreId, setCurrentTimbreId] = useState(null)

  // 试听功能状态
  const [currentAuditionAudio, setCurrentAuditionAudio] = useState(null)
  const [playingAuditionId, setPlayingAuditionId] = useState(null)

  // 展示模式状态：'card' 或 'list'
  const [viewMode, setViewMode] = useState("card")

  useEffect(() => {
    setPagination({ ...pagination, current: 1 })
  }, [marketSearch])

  // 使用无限滚动获取声音列表
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: listLoading,
    refetch // 新增
  } = useInfiniteTimbreMarketListApi({
    pageSize: pagination.pageSize,
    botNo,
    ...(marketSearch === "" ? {} : { timbreName: marketSearch })
  })

  // 当前是否滚动到底部
  const { ref, inView } = useInView({
    threshold: 0
  })

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage()
    }
  }, [inView, fetchNextPage, hasNextPage])

  // 合并所有页面的数据
  const list = data?.pages?.flatMap((page) => page.list) || []

  // 处理订阅
  const handleSubscribe = async (e, timbreId) => {
    cancelBubble(e)
    if (!botNo) {
      message.warning("当前未获取到空间，请重试")
      return
    }
    try {
      const res = await updateTimbreSubscriptionStatus({ botNo, timbreId, subscriptionStatus: "Y" })
      if (res?.status === 200 || res?.code === 200 || res?.code === "200") {
        message.success("订阅成功")
        refetch && refetch() // 强制刷新市集列表
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
    } catch (err) {
      let msg = "操作失败"
      if (typeof err?.message === "string") {
        msg = err.message
      } else if (typeof err?.message === "object" && err?.message?.message) {
        msg = err.message.message
      } else if (typeof err?.message === "object") {
        msg = JSON.stringify(err.message)
      }
      message.error(msg)
    }
  }

  // 处理取消订阅
  const handleCancelSubscribe = async (e, timbreId) => {
    cancelBubble(e)
    if (!botNo) {
      message.warning("当前未获取到空间，请重试")
      return
    }
    try {
      const res = await updateTimbreSubscriptionStatus({ botNo, timbreId, subscriptionStatus: "N" })
      if (res?.status === 200 || res?.code === 200 || res?.code === "200") {
        message.success("取消订阅成功")
        refetch && refetch() // 强制刷新市集列表
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
    } catch (err) {
      let msg = "操作失败"
      if (typeof err?.message === "string") {
        msg = err.message
      } else if (typeof err?.message === "object" && err?.message?.message) {
        msg = err.message.message
      } else if (typeof err?.message === "object") {
        msg = JSON.stringify(err.message)
      }
      message.error(msg)
    }
  }

  // 处理音色试听
  const handleTimbreAudition = (auditionUrl, timbreId) => {
    if (!auditionUrl) {
      message.warning("该音色暂无试听音频")
      return
    }

    // 如果当前正在播放这个音频，则暂停
    if (playingAuditionId === timbreId && currentAuditionAudio) {
      currentAuditionAudio.pause()
      currentAuditionAudio.currentTime = 0
      setCurrentAuditionAudio(null)
      setPlayingAuditionId(null)
      return
    }

    // 停止当前正在播放的音频
    if (currentAuditionAudio) {
      currentAuditionAudio.pause()
      currentAuditionAudio.currentTime = 0
    }

    // 创建新的音频实例
    const audio = new Audio(auditionUrl)
    setCurrentAuditionAudio(audio)
    setPlayingAuditionId(timbreId)

    // 定义播放结束的处理函数
    const handleAudioEnded = () => {
      setCurrentAuditionAudio(null)
      setPlayingAuditionId(null)
      audio.removeEventListener("ended", handleAudioEnded)
    }

    audio.addEventListener("ended", handleAudioEnded)
    audio.play().catch((error) => {
      console.error("播放试听音频失败:", error)
      message.error("试听播放失败")
      setCurrentAuditionAudio(null)
      setPlayingAuditionId(null)
      audio.removeEventListener("ended", handleAudioEnded)
    })
  }

  // 卡片点击事件
  const onCardClick = (item) => {
    setCurrentTimbreId(item.timbreId)
    setDrawerVisible(true)
  }

  // 定义Table列配置
  const columns = [
    {
      title: "声音信息",
      dataIndex: "timbreName",
      key: "timbreName",
      width: 300,
      render: (text, record) => (
        <div className="flex items-center">
          <div className="mr-3 flex items-center justify-center w-[48px] h-[48px] rounded-[8px] bg-gray-100">
            <img
              src={
                record.avatarUrl
                  ? record.avatarUrl
                  : record.gender === "female"
                    ? defaultTimbreGirl
                    : defaultTimbreBoy
              }
              className="w-[32px] h-[32px] rounded-[4px]"
            />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-[16px] text-[#181b25] mb-1">
              {record.timbreName ?? "暂无"}
            </div>
            <div className="text-[12px] text-[#626263] flex items-center">
              <Tooltip title={record.timbreCode}>
                <Tag
                  className="mr-2 cursor-pointer"
                  onClick={() => {
                    copy(record.timbreCode)
                    message.success("复制成功")
                  }}
                >
                  ID
                </Tag>
              </Tooltip>
              <Tooltip title={record.timbreModel}>
                <span className="truncate max-w-[120px]">{record.timbreModel}</span>
              </Tooltip>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "描述",
      dataIndex: "description",
      key: "description",
      ellipsis: {
        showTitle: false
      },
      render: (text) => (
        <Tooltip title={text || "这个人很懒，暂未填写描述～"}>
          <span>{text || "这个人很懒，暂未填写描述～"}</span>
        </Tooltip>
      )
    },
    {
      title: "来源",
      dataIndex: "botName",
      key: "botName",
      width: 100,
      render: (text) => (
        <span className="text-[12px] px-2 py-1 bg-[#f5f7fa] rounded-full">
          {text || "未知来源"}
        </span>
      )
    },
    {
      title: "性别",
      dataIndex: "gender",
      key: "gender",
      width: 80,
      render: (text) => (
        <span className="text-[12px] px-2 py-1 bg-[#f5f7fa] rounded-full">
          {text === "female" ? "女声" : "男声"}
        </span>
      )
    },
    {
      title: "评分",
      key: "rating",
      width: 100,
      render: () => (
        <div className="flex items-center">
          <StarOutlined className="text-[#D0D5DD] text-[15px] mr-1" />
          <span className="text-[14px]">0</span>
        </div>
      )
    },
    {
      title: "操作",
      key: "action",
      width: 150,
      render: (_, record) => {
        const hasSubscribed = record.subscriptionStatus === "Y"
        return (
          <div className="flex items-center gap-2">
            {record.auditionUrl && (
              <Button
                type="link"
                size="small"
                icon={
                  playingAuditionId === record.timbreId ? (
                    <PauseCircleOutlined />
                  ) : (
                    <PlayCircleOutlined />
                  )
                }
                onClick={(e) => {
                  cancelBubble(e)
                  handleTimbreAudition(record.auditionUrl, record.timbreId)
                }}
                className="text-[#7F56D9]"
              >
                试听
              </Button>
            )}
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onCardClick(record)}
            >
              查看
            </Button>
            {!hasSubscribed ? (
              <Button type="link" size="small" onClick={(e) => handleSubscribe(e, record.timbreId)}>
                <i className="iconfont icon-dingyue mr-1 text-[#D0D5DD]"></i>
                订阅
              </Button>
            ) : (
              <Popconfirm
                title=""
                description="【取消订阅】将无法使用对应声音。"
                okText="确认"
                onConfirm={(e) => handleCancelSubscribe(e, record.timbreId)}
                cancelText="取消"
              >
                <Button type="link" size="small">
                  <i className="iconfont icon-dingyue mr-1 text-[#F6B51E]"></i>
                  取消订阅
                </Button>
              </Popconfirm>
            )}
          </div>
        )
      }
    }
  ]

  return (
    <div className={styles["market-item-module"]} key={marketCode.TIMBRE}>
      {/* 视图切换按钮 */}
      <div className="flex justify-end mb-4">
        <Radio.Group
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value)}
          buttonStyle="solid"
          size="small"
        >
          <Radio.Button value="card">
            <AppstoreOutlined className="mr-1" />
            卡片视图
          </Radio.Button>
          <Radio.Button value="list">
            <BarsOutlined className="mr-1" />
            列表视图
          </Radio.Button>
        </Radio.Group>
      </div>

      <Spin spinning={listLoading}>
        {list?.length && !listLoading ? (
          viewMode === "card" ? (
            <div className={styles["list-container"]}>
              <Row gutter={15}>
                {list?.map((item, i) => {
                  const {
                    timbreId,
                    timbreCode,
                    timbreName,
                    timbreModel,
                    gender,
                    avatarUrl,
                    source,
                    botName,
                    subscriptionStatus,
                    enabled,
                    description
                  } = item || {}

                  const hasSubscribed = subscriptionStatus === "Y"
                  const isEnabled = enabled === "Y"

                  return (
                    <Col xs={24} sm={12} md={12} lg={8} xl={8} xxl={6} key={timbreId}>
                      <QueueAnim delay={50 * i} type="top" className="queue-simple">
                        <div
                          className={`${styles["card-item"]} ${styles["card-item-timbre"]} cursor-pointer`}
                          // style={{
                          //   marginBottom: "20px",
                          //   borderColor: border,
                          //   opacity: isEnabled ? 1 : 0.6
                          // }}
                          style={{ marginBottom: "20px" }}
                          onClick={() => onCardClick(item)}
                        >
                          <div className="flex justify-between items-start w-[100%]">
                            <div className="w-[100%]">
                              <div className={styles["title-wrapper"]}>
                                <div
                                  className={`${styles["card-icon"]} mr-[12px] flex items-center justify-center w-[48px] h-[48px] rounded-[8px] bg-gray-100`}
                                >
                                  <img
                                    src={
                                      avatarUrl
                                        ? avatarUrl
                                        : gender === "female"
                                          ? defaultTimbreGirl
                                          : defaultTimbreBoy
                                    }
                                    className={styles["text-base-img"]}
                                    style={{ width: "32px", height: "32px", borderRadius: "4px" }}
                                  />
                                </div>
                                <div className="flex flex-1 flex-col items-start overflow-hidden">
                                  <Tooltip title={timbreName}>
                                    <span className={styles["text-base"]}>
                                      {timbreName ?? "暂无"}
                                    </span>
                                  </Tooltip>
                                  {/* <CopyToClipboard
                                  text={timbreCode}
                                  onCopy={() => message.success("复制成功")}
                                >
                                  <Tooltip title="点击复制编号">
                                    <span
                                      className="text-[#626263] cursor-pointer leading-[18px] text-[12px] mt-[8px]"
                                      onClick={(e) => cancelBubble(e)}
                                    >
                                      {timbreCode}
                                    </span>
                                  </Tooltip>
                                </CopyToClipboard> */}
                                  <div
                                    className="text-[#626263] cursor-pointer leading-[18px] text-[12px] mt-[8px] flex items-center"
                                    onClick={(e) => cancelBubble(e)}
                                  >
                                    <div className="flex items-center">
                                      <Tooltip title={timbreCode}>
                                        <Tag
                                          onClick={() => {
                                            copy(timbreCode)
                                            message.success("复制成功")
                                          }}
                                        >
                                          ID
                                        </Tag>
                                      </Tooltip>
                                    </div>
                                    <Tooltip title={timbreModel}>
                                      <span className="w-[80%] truncate">{timbreModel}</span>
                                    </Tooltip>
                                  </div>
                                </div>
                              </div>
                              <div className={styles["skill-item-text"]}>
                                {/* <div className={styles["time-tag"]}>
                                <span className={styles["title"]}>模型</span>
                                <span className={styles["time"]}>{timbreModel}</span>
                              </div> */}
                                <div className={styles["time-tag"]}>
                                  <span className={styles["title"]}>来源</span>
                                  <span className={styles["time"]}>
                                    {botName ? botName : source === "CREATED" ? "自建" : source}
                                  </span>
                                </div>
                                <div className={styles["time-tag"]}>
                                  <span className={styles["time"]}>
                                    {gender === "female" ? "女声" : "男声"}
                                  </span>
                                </div>
                                <div>
                                  {item.auditionUrl && (
                                    <div
                                      className={styles["time-tag"]}
                                      onClick={(e) => {
                                        cancelBubble(e)
                                        handleTimbreAudition(item.auditionUrl, timbreId)
                                      }}
                                    >
                                      {playingAuditionId === timbreId ? (
                                        <PauseCircleOutlined className={styles["time"]} />
                                      ) : (
                                        <PlayCircleOutlined className={styles["time"]} />
                                      )}
                                      <span className={styles["time"]}>试听</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Tooltip title={description}>
                                <div className={styles["desc"]}>
                                  {description || "这个人很懒，暂未填写描述～"}
                                </div>
                              </Tooltip>
                            </div>
                          </div>
                          <div className={styles["remove-btn"]}>
                            <div className={styles["subscribe-count"]}>
                              <StarOutlined className="text-[#D0D5DD] text-[15px] mr-[5px] mt-[2px]" />
                              <span className={styles["count-text"]}>0</span>
                            </div>
                            {!hasSubscribed ? (
                              <Button
                                type="link"
                                className="p-0"
                                onClick={(e) => handleSubscribe(e, timbreId)}
                              >
                                <i className="iconfont icon-dingyue inline-block !mt-[1px] mr-[3px] !text-[#D0D5DD] group-hover:!text-[#F6B51E]"></i>
                                订阅
                              </Button>
                            ) : (
                              <Popconfirm
                                title=""
                                description={`【取消订阅】将无法使用对应声音。`}
                                okText="确认"
                                onConfirm={(e) => handleCancelSubscribe(e, timbreId)}
                                cancelText="取消"
                                onPopupClick={(e) => cancelBubble(e)}
                              >
                                <Button
                                  type="link"
                                  className="p-0"
                                  onClick={(e) => cancelBubble(e)}
                                >
                                  <i className="iconfont icon-dingyue align-middle -mt-[1px] mr-[3px] text-[#F6B51E]"></i>
                                  取消订阅
                                </Button>
                              </Popconfirm>
                            )}
                          </div>
                        </div>
                      </QueueAnim>
                    </Col>
                  )
                })}
              </Row>
              {isFetchingNextPage && <div>Loading more...</div>}
              <div ref={ref} style={{ height: 20 }} /> {/* 用于检测滚动到底部 */}
            </div>
          ) : (
            // 列表视图
            <div>
              <Table
                columns={columns}
                dataSource={list}
                rowKey="timbreId"
                pagination={false}
                scroll={{ x: 800 }}
                className="timbre-table"
              />
              {isFetchingNextPage && (
                <div className="text-center py-4">
                  <Spin size="small" />
                  <span className="ml-2">Loading more...</span>
                </div>
              )}
              <div ref={ref} style={{ height: 20 }} /> {/* 用于检测滚动到底部 */}
            </div>
          )
        ) : null}
        {!listLoading && !list?.length ? (
          <div className="my-[50px]">
            <CustomEmpty />
          </div>
        ) : null}
        {listLoading ? <SkeletonModule /> : null}
      </Spin>
      {/* TimbreDrawer 详情抽屉 */}
      <TimbreDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        timbreId={currentTimbreId}
        botNo={botNo}
        mode="marketView"
      />
    </div>
  )
}
