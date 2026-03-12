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
import { Button, Col, Row, ConfigProvider, Tooltip, Popconfirm, Spin, message } from "antd"
import CopyToClipboard from "react-copy-to-clipboard"
import { StarOutlined, LinkOutlined } from "@ant-design/icons"
import QueueAnim from "rc-queue-anim"
import { getThemeConfig, marketCode } from "@/constants/market"
import { useEffect, useState } from "react"
import queryString from "query-string"
import { useLocation, useNavigate } from "react-router-dom"
import { useCancelSubscribeApi, useSubscribeApi, useInfiniteMarketHomeListApi } from "@/api/market"
import { useMarket } from "../.."
import { SkeletonModule } from "./skeleton"
import { cancelBubble, postMessageForLX } from "@/utils"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { useQueryClient } from "@tanstack/react-query"
import { MessageType } from "@/constants/postMessageType"
import { useInView } from "react-intersection-observer"

import toolImg from "../../../../assets/img/tool.png"
import agentAvaterImg from "@/assets/img/agentAvater-new.png?url"
import agentAvaterOLdImg from "@/assets/img/agentAvater.png"
import skillAvater from "@/assets/img/skillAvater.png"
import application from "@/assets/img/application.png"
import aiLabIconUrl from "@/assets/img/aiLabIcon.png"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"
import { useStudioPublishData } from "@/hooks/useStudioPublishData"

const SKILLICONTYPE = {
  AGENT: agentAvaterImg,
  SKILL: skillAvater,
  PLUG_IN: toolImg,
  ROBOT: application
}

export const ItemModule = (props) => {
  const { type = "APP", data: currentData, isLoading: currentLoading, isPublic } = props || {}
  const navigate = useNavigate()
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search) ?? {}
  const [pagination, setPagination] = useState({ current: 1, pageSize: 12 })
  const { marketSearch } = useMarket()
  const { botNo, parentOrigin } = queryParams
  const { color, hover, title } = getThemeConfig(type)
  const [loadingBiz, setLoadingBiz] = useState()

  const { studioenv, isPublishDisabled } = useStudioPublishData()

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
  } = useInfiniteMarketHomeListApi({
    pageSize: pagination.pageSize,
    botNo,
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

  /**
   * @description: 取消订阅
   * @param {*} bizNo
   * @return {*}
   */
  const handleCancelSubscribe = (e, bizNo) => {
    cancelBubble(e)
    if (!botNo) {
      message.warning("当前未获取到空间，请重试")
      return
    }
    setLoadingBiz(bizNo)
    mutateCancelSubscribe({ botNo, bizType: type, bizNo })
  }
  /**
   * @description: 订阅
   * @param {*} bizNo
   * @return {*}
   */
  const handleSubscribe = (e, bizNo) => {
    cancelBubble(e)
    if (!botNo) {
      message.warning("当前未获取到空间，请重试")
      return
    }
    setLoadingBiz(bizNo)
    mutateSubscribe({ botNo, bizType: type, bizNo })
  }

  const onCardClick = (item) => {
    // 区分插件和工作流，跳转到不同的详情页
    const {
      bizNo,
      belongToBotNo,
      agentMode,
      canRead = true,
      hasSubscribed,
      jumpUrl,
      resourceCode
    } = item
    console.log("item:", item)
    const isIframe = self !== top
    if (type === marketCode.SKILL) {
      // 跳转到工作流详情页
      navigate(
        `/editSkill?skillNo=${bizNo}&botNoiframe=${botNo}&isIframe=${isIframe}&botNo=${belongToBotNo}&mode=showDetail&skillCanRead=${canRead}&hasSubscribed=${hasSubscribed}&workbenchNo=${resourceCode}&parentOrigin=${parentOrigin}&studioenv=${studioenv || ""}`
      )
    } else if (type === marketCode.PLUG_IN) {
      // 跳转到插件详情页
      navigate(`/plugins-detail?botNo=${botNo}&pluginNo=${bizNo}&studioenv=${studioenv || ""}`)
    } else if (type === marketCode.ROBOT) {
      postMessageForLX({
        type: MessageType.TO_APP_ROBOT_DETAIL_PAGE,
        payload: {
          jumpUrl,
          workbenchNo: resourceCode || ""
        }
      })
    } else if (type === marketCode.AGENT) {
      navigate(
        `/agent/${agentMode === 7 ? "detailv2" : "detail"}?agentNo=${bizNo}&mode=showDetail&agentCanRead=${canRead}&isIframe=${isIframe}&botNo=${botNo}&agentMode=${agentMode || 1}&studioenv=${studioenv || ""}`
      )
    }
  }

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
                    iconUrl,
                    bizType,
                    websiteUrl,
                    deploymentUrl
                  } = v || {}
                  return (
                    <Col xs={24} sm={12} md={12} lg={8} xl={8} xxl={6} key={bizNo}>
                      <QueueAnim delay={50 * i} type="top" className="queue-simple">
                        <div
                          className={`${styles["card-item"]} ${styles[`card-item-${bizType}`]} ${!isPublic && "cursor-pointer"}`}
                          style={{ marginBottom: "20px", ...(isPublic ? { height: "175px" } : {}) }}
                          onClick={() => !isPublic && onCardClick(v)}
                        >
                          <div className="flex justify-between items-start w-[100%]">
                            <div className="w-[100%]">
                              <div className={styles["title-wrapper"]}>
                                {/* <img
                                    src={getIcon(type, skillType)}
                                    className={styles["text-base-img"]}
                                  /> */}
                                <div
                                  className={`${styles["card-icon"]} mr-[12px] flex items-center justify-center w-[48px] h-[48px] rounded-[8px] overflow-hidden`}
                                >
                                  <img
                                    style={
                                      iconUrl?.includes("/agentAvater") &&
                                      !iconUrl?.includes("/agentAvater-new")
                                        ? { width: "30px" }
                                        : {}
                                    }
                                    src={
                                      isPublic
                                        ? iconUrl || aiLabIconUrl
                                        : ["AGENT"].includes(bizType) && iconUrl
                                          ? iconUrl.includes("/agentAvater") &&
                                            !iconUrl.includes("/agentAvater-new")
                                            ? agentAvaterOLdImg
                                            : iconUrl
                                          : SKILLICONTYPE[bizType] || SKILLICONTYPE["SKILL"]
                                    }
                                    className={styles["text-base-img"]}
                                  />
                                </div>
                                <div className="flex flex-1 flex-col items-start overflow-hidden">
                                  <Tooltip title={name}>
                                    <span className={styles["text-base"]}>{name ?? "暂无"}</span>
                                  </Tooltip>
                                  <CopyToClipboard
                                    text={bizNo}
                                    onCopy={() => message.success("复制成功")}
                                  >
                                    <Tooltip title="点击复制编号">
                                      <span
                                        className="text-[#626263] cursor-pointer leading-[18px] text-[12px] mt-[8px]"
                                        onClick={(e) => cancelBubble(e)}
                                      >
                                        {bizNo}
                                      </span>
                                    </Tooltip>
                                  </CopyToClipboard>
                                </div>
                              </div>
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
                              <Tooltip title={description}>
                                <div className={styles["desc"]}>
                                  {description || "这个人很懒，暂未填写描述～"}
                                </div>
                              </Tooltip>
                            </div>
                          </div>
                          <div
                            className={styles["remove-btn"]}
                            style={
                              isPublic &&
                              ((websiteUrl && !deploymentUrl) || (!websiteUrl && deploymentUrl))
                                ? { justifyContent: "center" }
                                : {}
                            }
                          >
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
                                    className="p-0"
                                    onClick={(e) => handleSubscribe(e, bizNo)}
                                    disabled={isPublishDisabled}
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
                                      disabled={isPublishDisabled}
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
      </ConfigProvider>
    </div>
  )
}
