/*
 * @Author: Dyton
 * @Date: 2024-04-16 18:56:57
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-04-24 16:52:28
 * @FilePath: /za-aigc-platform-admin-static/src/pages/market/components/itemModule/index.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import styles from "./index.module.scss"
import {
  Button,
  Col,
  Row,
  Card,
  Divider,
  ConfigProvider,
  Tooltip,
  Pagination,
  Popconfirm,
  Spin,
  message,
  Modal,
  Select
} from "antd"
import { StarOutlined, LinkOutlined } from "@ant-design/icons"
import QueueAnim from "rc-queue-anim"
import { getIcon, getThemeConfig, marketCode } from "@/constants/market"
import { useEffect, useState } from "react"
import queryString from "query-string"
import { useLocation, useNavigate } from "react-router-dom"
import { useCancelSubscribeApi, useSubscribableResourcesApi, useSubscribeApi } from "@/api/market"
import { useFetchBotListByPage } from "@/api/bot"
import { useMarket } from "../.."
import { EmptyPro } from "@/components/Empty"
import { SkeletonModule } from "./skeleton"
import { cancelBubble, postMessageForLX } from "@/utils"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { useQueryClient } from "@tanstack/react-query"
import { MessageType } from "@/constants/postMessageType"
import { useInView } from "react-intersection-observer"

// @ts-ignore
import type1 from "../../../../assets/img/type1.png"
// @ts-ignore
import type2 from "../../../../assets/img/type2.png"
// @ts-ignore
import type3 from "../../../../assets/img/type3.png"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"
import aiLabIconUrl from "@/assets/img/aiLabIcon.png"

const SKILLICONTYPE = {
  1: type3, //"icon-liaotianjineng",
  2: type2, //"icon-biaodanjineng",s
  3: type1, //type3, //"icon-APIjineng",
  4: type3 //"icon-APIjineng"
}

export { default as PublicTimbreModule } from "./PublicTimbreModule"

export const ItemModule = (props) => {
  const { type = "APP", data: currentData, isLoading: currentLoading, isPublic } = props || {}

  const navigate = useNavigate()
  const location = useLocation()
  const { search } = location
  const { parentOrigin } = queryString.parse(search) ?? {}
  const [pagination, setPagination] = useState({ current: 1, pageSize: 12 })
  const [isRobotModalVisible, setIsRobotModalVisible] = useState(false)
  const [selectedRobotId, setSelectedRobotId] = useState(null)
  const [currentBizNo, setCurrentBizNo] = useState(null)
  const [robotList, setRobotList] = useState([])
  const { marketSearch } = useMarket()
  const { color, hover, title, border } = getThemeConfig(type)
  const [loadingBiz, setLoadingBiz] = useState()
  const theme = {
    components: {
      Button: {
        colorPrimary: color,
        defaultBorderColor: color,
        defaultColor: color,
        colorPrimaryHover: hover,
        colorPrimaryActive: hover
      }
    }
  }
  useEffect(() => {
    setPagination({ ...pagination, current: 1 })
  }, [marketSearch])

  /**
   * @description: 页面无限滚动
   * @param {*} bizNo
   * @return {*}
   */
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: listLoading
  } = useSubscribableResourcesApi({
    pageSize: pagination.pageSize,
    bizType: type,
    ...(marketSearch === "" ? {} : { query: marketSearch })
  })
  //当前是否滚动到底部
  const { ref, inView } = useInView({
    threshold: 0
  })
  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage()
    }
  }, [inView, fetchNextPage, hasNextPage])
  // 合并所有页面的数据

  const list = isPublic ? currentData : data?.pages?.flatMap((page) => page?.list || []) || []

  const refreshAPPRobotList = () => {
    if (type === marketCode.ROBOT) {
      postMessageForLX({
        type: MessageType.REFRESH_APP_ROBOT_LIST
      })
    }
  }
  const queryClient = useQueryClient()
  const updateHome = () => {
    queryClient.invalidateQueries([QUERY_KEYS.MARKET_HOME])
    refreshAPPRobotList()
  }

  const { mutate: mutateSubscribe, isLoading: subscribeLoading } = useSubscribeApi(updateHome)
  const { mutate: mutateCancelSubscribe, isLoading: cancelSubscribeLoading } =
    useCancelSubscribeApi(updateHome)
  const { data: robotListData, isLoading: robotListLoading } = useFetchBotListByPage({
    pageNum: 1,
    pageSize: 10000
  })

  /**
   * @description: 取消订阅
   * @param {*} bizNo
   * @return {*}
   */
  const handleCancelSubscribe = (e, bizNo) => {
    cancelBubble(e)
    setLoadingBiz(bizNo)
    mutateCancelSubscribe({ bizType: type, bizNo })
  }
  /**
   * @description: 打开选择空间弹窗
   * @param {*} e
   * @param {*} bizNo
   */
  const showRobotSelectionModal = (e, bizNo) => {
    cancelBubble(e)
    setCurrentBizNo(bizNo)
    setIsRobotModalVisible(true)
    // 使用API获取的空间列表
    setRobotList(robotListData?.botList || [])
  }

  /**
   * @description: 确认选择空间并订阅
   */
  const handleRobotSelectionConfirm = () => {
    if (!selectedRobotId) {
      message.warning("请选择一个空间")
      return
    }

    if (type === marketCode.ROBOT) {
      // 获取当前选中的item信息
      const currentItem = list.find((item) => item.bizNo === currentBizNo)
      if (currentItem) {
        postMessageForLX({
          type: MessageType.TO_APP_ROBOT_DETAIL_PAGE,
          payload: {
            jumpUrl: currentItem.jumpUrl,
            workbenchNo: currentItem.resourceCode,
            botNo: selectedRobotId
          }
        })
      }
    } else {
      // 订阅逻辑
      setLoadingBiz(currentBizNo)
      mutateSubscribe({
        bizType: type,
        bizNo: currentBizNo,
        botNo: selectedRobotId
      })

      // 获取当前选中的空间信息
      const selectedRobot = robotList.find((robot) => robot.botNo === selectedRobotId)
      // 发送消息给 iframe
      postMessageForLX({
        type: MessageType.SUBSCRIBE_SUCCESS,
        botNo: selectedRobot.botNo
      })
      message.success("订阅成功，正在为您跳转工作台～")
    }

    setIsRobotModalVisible(false)
    setSelectedRobotId(null)
    setCurrentBizNo(null)
  }

  const onCardClick = (item) => {
    // 区分插件和工作流，跳转到不同的详情页
    const { bizNo, belongToBotNo, canRead = true, hasSubscribed, jumpUrl, resourceCode } = item
    const isIframe = self !== top
    if (type === marketCode.SKILL) {
      // 跳转到工作流详情页
      navigate(
        `/editSkill?skillNo=${bizNo}&isIframe=${isIframe}&botNo=${belongToBotNo}&mode=showDetail&skillCanRead=${canRead}&hasSubscribed=${hasSubscribed}&marketSub=${true}&workbenchNo=${resourceCode}&parentOrigin=${parentOrigin}`
      )
    } else if (type === marketCode.PLUG_IN) {
      // 跳转到插件详情页
      navigate(`/plugins-detail?botNo=${belongToBotNo}&pluginNo=${bizNo}&marketSub=${true}`)
    } else if (type === marketCode.ROBOT) {
      // 存储当前选中的item信息用于后续跳转
      setCurrentBizNo(bizNo)
      setIsRobotModalVisible(true)
      // 使用API获取的空间列表
      setRobotList(robotListData?.botList || [])
    }
  }

  useEffect(() => {
    if (robotListData?.botList) {
      console.log("robotListData:", robotListData)
      setRobotList(robotListData.botList)
    }
  }, [robotListData])

  return (
    <div className={styles["market-item-module"]} key={type}>
      <ConfigProvider theme={theme}>
        {/* <Divider className={styles["divider"]}>{title}</Divider> */}
        {/* <div className="text-[16px] font-[500] text-[#181B25] mt-[10px] mb-[10px]">{title}</div> */}
        <Spin spinning={isPublic ? currentLoading : listLoading}>
          {list?.length && !(isPublic ? currentLoading : listLoading) ? (
            <div className={styles["list-container"]}>
              <Row gutter={15}>
                {list?.map((v, i) => {
                  const {
                    name,
                    bizNo,
                    description,
                    belongToBotName,
                    subscribeCount,
                    hasSubscribed,
                    skillType,
                    iconUrl,
                    websiteUrl,
                    deploymentUrl
                  } = v || {}
                  return (
                    <Col xs={24} sm={12} md={12} lg={8} xl={8} xxl={6} key={bizNo}>
                      <QueueAnim delay={50 * i} type="top" className="queue-simple">
                        <div
                          className={`${styles["card-item"]} ${!isPublic && "cursor-pointer"}`}
                          style={{ marginBottom: "20px", ...(isPublic ? { height: "175px" } : {}) }}
                          onClick={() => !isPublic && onCardClick(v)}
                        >
                          <div className="flex justify-between items-start w-[100%]">
                            <div>
                              <div className={styles["title-wrapper"]}>
                                <Tooltip title={name}>
                                  {/* <img
                                    src={getIcon(type, skillType)}
                                    className={styles["text-base-img"]}
                                  /> */}
                                  <img
                                    src={
                                      isPublic
                                        ? iconUrl || aiLabIconUrl
                                        : SKILLICONTYPE[!skillType ? 1 : skillType]
                                    }
                                    className={styles["text-base-img"]}
                                  />
                                  <span className={styles["text-base"]}>
                                    {name ?? "暂无"}
                                    {skillType}
                                  </span>
                                </Tooltip>
                              </div>
                              <Tooltip title={description}>
                                <div className={styles["desc"]}>
                                  {description || "这个人很懒，暂未填写描述～"}
                                </div>
                              </Tooltip>
                              {!isPublic && (
                                <div className={styles["skill-item-text"]}>
                                  <div className={styles["time-tag"]}>
                                    <span className={styles["title"]}>来源</span>
                                    <span className={styles["time"]}>{belongToBotName}</span>
                                  </div>
                                  {subscribeCount > 0 && (
                                    <div className={styles["time-tag"]}>
                                      <span className={styles["title"]}>订阅量</span>
                                      <span className={styles["time"]}>{subscribeCount}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className={styles["remove-btn"]}>
                            {isPublic ? (
                              <>
                                {!!websiteUrl && (
                                  <Button
                                    type="link"
                                    className="p-0"
                                    onClick={(e) => {
                                      cancelBubble(e)
                                      window.open(websiteUrl, "_blank")
                                    }}
                                  >
                                    <LinkOutlined className="align-middle" />
                                    官网
                                  </Button>
                                )}
                                {!!deploymentUrl && (
                                  <Button
                                    type="link"
                                    className="p-0"
                                    onClick={(e) => {
                                      cancelBubble(e)
                                      window.open(deploymentUrl, "_blank")
                                    }}
                                  >
                                    <LinkOutlined className="align-middle" />
                                    使用
                                  </Button>
                                )}
                              </>
                            ) : (
                              <>
                                <div className={styles["subscribe-count"]}>
                                  <StarOutlined className="text-[#D0D5DD] text-[15px] mr-[5px] mt-[2px]" />
                                  <span className={styles["count-text"]}>{subscribeCount}</span>
                                </div>
                                {!hasSubscribed ? (
                                  <Button
                                    type="link"
                                    className="p-0 group"
                                    onClick={(e) => showRobotSelectionModal(e, bizNo)}
                                  >
                                    <i className="iconfont icon-dingyue inline-block !mt-[1px] mr-[3px] !text-[#D0D5DD] group-hover:!text-[#F6B51E]"></i>
                                    订阅
                                  </Button>
                                ) : (
                                  <Popconfirm
                                    title=""
                                    description={`【取消订阅】将无法调用对应${title}。`}
                                    okText="确认"
                                    onConfirm={(e) => handleCancelSubscribe(e, bizNo)}
                                    cancelText="取消"
                                    okButtonProps={{
                                      loading: loadingBiz === bizNo && cancelSubscribeLoading
                                    }}
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
                              </>
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
          ) : null}
          {!(isPublic ? currentLoading : listLoading) && !list?.length ? (
            <div className="my-[50px]">
              <CustomEmpty />{" "}
            </div>
          ) : null}
          {isPublic ? currentLoading : listLoading ? <SkeletonModule /> : null}
        </Spin>
        <Modal
          title="选择空间"
          open={isRobotModalVisible}
          onOk={handleRobotSelectionConfirm}
          onCancel={() => {
            setIsRobotModalVisible(false)
            setSelectedRobotId(null)
            setCurrentBizNo(null)
          }}
          okText="确认"
          cancelText="取消"
        >
          <div className="p-2">
            {robotListLoading ? (
              <div className="flex justify-center items-center h-[200px]">
                <Spin tip="空间加载中..." />
              </div>
            ) : robotList.length > 0 ? (
              <>
                <div className="mb-4">
                  <span className="text-[#ff4d4f] mr-1">*</span>
                  请选择空间：
                </div>
                <Select
                  style={{ width: "100%" }}
                  placeholder="请选择空间"
                  value={selectedRobotId}
                  onChange={(value) => setSelectedRobotId(value)}
                  showSearch
                  required
                  status={isRobotModalVisible && !selectedRobotId ? "error" : undefined}
                  filterOption={(input, option) =>
                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                  options={robotList.map((robot) => ({
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
                />
              </>
            ) : (
              <div className="my-[50px]">
                <CustomEmpty description={"暂无空间!请联系管理员～"} />{" "}
              </div>
            )}
          </div>
        </Modal>
      </ConfigProvider>
    </div>
  )
}
