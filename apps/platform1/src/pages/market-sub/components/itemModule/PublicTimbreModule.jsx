import React, { useState, useEffect } from "react"
import {
  Col,
  Row,
  Button,
  Tooltip,
  Spin,
  message,
  Popconfirm,
  Modal,
  Select,
  ConfigProvider
} from "antd"
import QueueAnim from "rc-queue-anim"
import { useInView } from "react-intersection-observer"
import { fetchPublicTimbreList } from "@/api/timbre/api"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"
import styles from "./index.module.scss"
import { SkeletonModule } from "./skeleton"
import TimbreDrawer from "@/pages/voice/components/TimbreDrawer"
import SelectRobotModal from "@/components/SelectRobotModal"
import defaultTimbreGirl from "@/assets/img/defaultTimbreGirl.png"
import defaultTimbreBoy from "@/assets/img/defaultTimbreBoy.png"
import { StarOutlined } from "@ant-design/icons"
import { getThemeConfig, marketCode } from "@/constants/market"
import { fetchSubscribe, fetchCancelSubscribe, fetchBotList } from "@/api/market/api"
import { cancelBubble } from "@/utils"
import { useFetchBotListByPage } from "@/api/bot"
import { updateTimbreSubscriptionStatus } from "@/api/timbre/api"
import { postMessageForLX } from "@/utils"
import { MessageType } from "@/constants/postMessageType"
import { useMarket } from "@/pages/market-sub"

import "./PublicTimbreModule.scss"

const PublicTimbreModule = () => {
  const [pagination, setPagination] = useState({ current: 1, pageSize: 12 })
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasNextPage, setHasNextPage] = useState(true)
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [isRobotModalVisible, setIsRobotModalVisible] = useState(false)
  const [selectedRobotId, setSelectedRobotId] = useState(null)
  const [currentTimbreId, setCurrentTimbreId] = useState(null)
  const [currentBotNo, setCurrentBotNo] = useState(null)
  const { title } = getThemeConfig(marketCode.TIMBRE)
  const [loadingBiz, setLoadingBiz] = useState()
  const [cancelSubscribeLoading, setCancelSubscribeLoading] = useState(false)
  const [selectedBotNo, setSelectedBotNo] = useState(null)
  const { marketSearch } = useMarket()

  // 无限滚动
  const { ref, inView } = useInView({ threshold: 0 })

  // 直接用 hook 获取空间列表
  const { data: robotListData, isLoading: robotListLoading } = useFetchBotListByPage({
    pageNum: 1,
    pageSize: 10000
  })

  useEffect(() => {
    setPagination({ ...pagination, current: 1 })
    fetchList(1, true)
  }, [marketSearch])

  useEffect(() => {
    if (inView && hasNextPage && !loading && !isFetchingNextPage) {
      fetchList(pagination.current + 1)
    }
  }, [inView])

  const fetchList = async (pageNum = 1, reset = false) => {
    if (loading || isFetchingNextPage) return
    if (pageNum === 1) setLoading(true)
    else setIsFetchingNextPage(true)
    try {
      const res = await fetchPublicTimbreList({
        pageSize: pagination.pageSize,
        pageNum,
        ...(marketSearch ? { timbreName: marketSearch } : {})
      })
      if (reset) {
        setList(res)
      } else {
        setList((prev) => [...prev, ...res])
      }
      setPagination((prev) => ({ ...prev, current: pageNum }))
      setHasNextPage(res.length === pagination.pageSize)
    } catch (e) {
      message.error("获取公共声音失败")
    } finally {
      setLoading(false)
      setIsFetchingNextPage(false)
    }
  }

  // 订阅弹窗相关
  const showRobotSelectionModal = (e, timbreId) => {
    cancelBubble(e)
    setCurrentTimbreId(timbreId)

    setIsRobotModalVisible(true)
  }

  const handleRobotSelectionConfirm = async () => {
    if (!selectedRobotId) {
      message.warning("请选择一个空间")
      return
    }
    setLoadingBiz(currentTimbreId)
    try {
      // 订阅接口，传入 botNo 和 timbreId
      const res = await updateTimbreSubscriptionStatus({
        botNo: selectedRobotId,
        timbreId: currentTimbreId,
        subscriptionStatus: "Y"
      })
      if (res?.status === 200 || res?.code === 200 || res?.code === "200") {
        // 订阅成功后，发送消息并跳转
        // postMessageForLX({
        //   type: "SUBSCRIBE_SUCCESS",
        //   botNo: selectedRobotId
        // })

        message.success("订阅成功，正在为您跳转工作台～")

        // 发送消息给 iframe
        postMessageForLX({
          type: MessageType.SUBSCRIBE_SUCCESS,
          botNo: selectedRobotId
        })

        setIsRobotModalVisible(false)
        setSelectedRobotId(null)
        setCurrentTimbreId(null)
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
    } finally {
      setLoadingBiz(undefined)
    }
  }

  const handleCancelSubscribe = async (e, timbreId) => {
    cancelBubble(e)
    setLoadingBiz(timbreId)
    setCancelSubscribeLoading(true)
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
    } finally {
      setLoadingBiz(undefined)
      setCancelSubscribeLoading(false)
    }
  }

  // 卡片点击，弹出详情抽屉
  const onCardClick = (item) => {
    setCurrentTimbreId(item.timbreId)
    setCurrentBotNo(item.botNo)
    setDrawerVisible(true)
  }

  return (
    <div className={styles["market-item-module"]}>
      <Spin spinning={loading}>
        {list?.length && !loading ? (
          <div className={styles["list-container"]}>
            <Row gutter={15}>
              {list?.map((item, i) => {
                const {
                  timbreId,
                  timbreCode,
                  timbreName,
                  subscriptionMode,
                  timbreModel,
                  subscriptionStatus,
                  enabled,
                  gender,
                  avatarUrl,
                  source,
                  botName,
                  description
                } = item || {}

                const hasSubscribed = subscriptionStatus === "Y"
                const isEnabled = enabled === "Y"

                return (
                  <Col xs={24} sm={12} md={12} lg={8} xl={8} xxl={6} key={timbreId}>
                    <QueueAnim delay={50 * i} type="top" className="queue-simple">
                      <div
                        className={`${styles["card-item"]} ${styles["card-item-timbre"]} cursor-pointer`}
                        style={{ marginBottom: "20px" }}
                        onClick={() => onCardClick(item)}
                      >
                        <div className="flex justify-between items-start w-[100%]">
                          <div className="w-[100%]">
                            <div className={styles["title-wrapper"]}>
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
                              {/* 头像和名称、模型上下排列，完全一致 */}
                              <Tooltip title={timbreName}>
                                <span className={styles["text-base"]}>{timbreName ?? "暂无"}</span>
                              </Tooltip>
                            </div>

                            <Tooltip title={description}>
                              <div className={styles["desc"]}>
                                {description || "这个人很懒，暂未填写描述～"}
                              </div>
                            </Tooltip>

                            <div className={styles["skill-item-text"]}>
                              <div className={styles["time-tag"]}>
                                <span className={styles["title"]}>来源</span>
                                <span className={styles["time"]}>
                                  {/* {source === "CREATED" ? "自建" : source} */}
                                  {botName ? botName : source === "CREATED" ? "自建" : source}
                                </span>
                              </div>
                              <div className={styles["time-tag"]}>
                                <span className={styles["time"]}>
                                  {gender === "female" ? "女声" : "男声"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className={styles["remove-btn"]} style={{ paddingTop: "5px" }}>
                          <div className={styles["subscribe-count"]}>
                            <StarOutlined className="text-[#D0D5DD] text-[15px] mr-[5px] mt-[2px]" />
                            <span className={styles["count-text"]}>{subscriptionMode}</span>
                          </div>
                          {/* <Button
                            type="link"
                            className="p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSubscribe(item)
                            }}
                          >
                            <i className="iconfont icon-dingyue inline-block !mt-[1px] mr-[3px] !text-[#13c2c2] group-hover:!text-[#36cfc9]"></i>
                            订阅
                          </Button> */}
                          {!hasSubscribed ? (
                            <Button
                              type="link"
                              className="p-0 group"
                              loading={loadingBiz === timbreId}
                              onClick={(e) => showRobotSelectionModal(e, timbreId)}
                            >
                              <i className="iconfont icon-dingyue inline-block !mt-[1px] mr-[3px] !text-[#D0D5DD] group-hover:!text-[#F6B51E]"></i>
                              订阅
                            </Button>
                          ) : (
                            <Popconfirm
                              title=""
                              description={`【取消订阅】将无法调用对应${title}。`}
                              okText="确认"
                              onConfirm={(e) => handleCancelSubscribe(e, timbreId)}
                              cancelText="取消"
                              okButtonProps={{
                                loading: loadingBiz === timbreId && cancelSubscribeLoading
                              }}
                              onPopupClick={(e) => cancelBubble(e)}
                            >
                              <Button type="link" className="p-0" onClick={(e) => cancelBubble(e)}>
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
            <div ref={ref} style={{ height: 20 }} />
          </div>
        ) : null}
        {!loading && !list?.length ? (
          <div className="my-[50px]">
            <CustomEmpty />
          </div>
        ) : null}
        {loading ? <SkeletonModule /> : null}
      </Spin>
      {/* 详情抽屉 */}
      <TimbreDrawer
        visible={drawerVisible}
        botNo={currentBotNo}
        onClose={() => setDrawerVisible(false)}
        timbreId={currentTimbreId}
        mode="marketView"
      />
      {/* 订阅弹窗 */}
      <Modal
        title="选择空间"
        open={isRobotModalVisible}
        onOk={handleRobotSelectionConfirm}
        onCancel={() => {
          setIsRobotModalVisible(false)
          setSelectedRobotId(null)
          setCurrentTimbreId(null)
        }}
        okText="确认"
        cancelText="取消"
      >
        <div className="p-2">
          {robotListLoading ? (
            <div className="flex justify-center items-center h-[200px]">
              <Spin tip="空间加载中..." />
            </div>
          ) : robotListData?.botList?.length > 0 ? (
            <>
              <div className="mb-4">
                <span className="text-[#ff4d4f] mr-1">*</span>
                请选择空间：
              </div>
              <Select
                style={{ width: "100%" }}
                placeholder="请选择空间"
                value={
                  selectedRobotId
                    ? {
                        value: selectedRobotId,
                        label: (robotListData?.botList || []).find(
                          (r) => r.botNo === selectedRobotId
                        )?.botName,
                        icon: (robotListData?.botList || []).find(
                          (r) => r.botNo === selectedRobotId
                        )?.botIcon
                      }
                    : undefined
                }
                labelInValue
                onChange={(option) => setSelectedRobotId(option.value)}
                showSearch
                required
                status={isRobotModalVisible && !selectedRobotId ? "error" : undefined}
                filterOption={(input, option) =>
                  (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
                options={(robotListData?.botList || []).map((robot) => ({
                  value: robot.botNo,
                  label: robot.botName,
                  icon: robot.botIcon
                }))}
                optionRender={(option) => (
                  <div className="flex items-center">
                    {option.data.icon && (
                      <img
                        src={option.data.icon}
                        alt={option.data.label}
                        className="w-6 h-6 mr-2 rounded-full"
                      />
                    )}
                    <span>{option.data.label}</span>
                  </div>
                )}
                // 选中项也渲染头像+名称
                dropdownStyle={{ minWidth: 220 }}
              >
                {/* 选中项自定义渲染 */}
              </Select>
              {selectedRobotId && (
                <div className="flex items-center mt-2 text-[#666] text-[14px]">
                  {(robotListData?.botList || []).find((r) => r.botNo === selectedRobotId)
                    ?.botIcon && (
                    <img
                      src={
                        (robotListData?.botList || []).find((r) => r.botNo === selectedRobotId)
                          ?.botIcon
                      }
                      alt={
                        (robotListData?.botList || []).find((r) => r.botNo === selectedRobotId)
                          ?.botName
                      }
                      className="w-6 h-6 mr-2 rounded-full"
                    />
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="my-[50px]">
              <CustomEmpty description={"暂无空间!请联系管理员～"} />
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default PublicTimbreModule
