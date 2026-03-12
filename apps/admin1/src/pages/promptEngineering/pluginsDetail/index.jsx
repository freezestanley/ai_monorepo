/*
 * @Author: Dyton
 * @Date: 2024-04-18 18:19:24
 * @Descripttion:插件详情
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-04-22 14:09:19
 * @FilePath: /za-aigc-platform-admin-static/src/pages/promptEngineering/pluginsDetail/index.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import { useState, useEffect } from "react"
import { Header } from "@/components/PageHeader"
import styles from "./index.module.scss"
import { useLocation, useNavigate } from "react-router-dom"
import { Divider, Button, Typography, Flex, Table, Popconfirm, Spin, message, Tooltip } from "antd"
import queryString from "query-string"
import CountUp from "react-countup"
import { columns } from "./config"
import { usePluginDetailApi } from "@/api/pluginManage"
import { useCancelSubscribeApi, useSubscribeApi } from "@/api/market"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { marketCode } from "@/constants/market"
import { EmptyPro } from "@/components/Empty"
import pluginIcon from "@/assets/img/tool.png"
import SelectRobotModal from "@/components/SelectRobotModal"
import { fetchBotList } from "@/api/bot/api"
import { postMessageForLX } from "@/utils"
import { MessageType } from "@/constants/postMessageType"
import { useStudioPublishData } from "@/hooks/useStudioPublishData"

const { Title, Text } = Typography

const defaultActiveTool = {
  description: "",
  toolNo: "",
  parameters: []
}
const defaultPluginInfo = {
  description: "",
  name: "",
  pluginNo: "",
  publishTime: "",
  status: 1,
  subscriber: false,
  subscriberCount: 0
}

export const PluginsDetail = () => {
  const [activeTool, setActiveTool] = useState(defaultActiveTool)
  const [pluginInfo, setPluginInfo] = useState(defaultPluginInfo)
  const [pluginTools, setPluginTools] = useState([])
  const [robotModalVisible, setRobotModalVisible] = useState(false)
  const [robotList, setRobotList] = useState([])
  const [robotListLoading, setRobotListLoading] = useState(false)
  const [selectedPluginNo, setSelectedPluginNo] = useState(null)
  const navigate = useNavigate()

  // 获取详情
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)
  const { botNo, id, pluginNo, marketSub } = queryParams
  const queryClient = useQueryClient()
  const update = () => queryClient.invalidateQueries([QUERY_KEYS.PLUGIN_DETAIL])
  const { data: details, isLoading: loading } = usePluginDetailApi({
    botNo,
    pluginNo
  })
  const { mutate: mutateSubscribe } = useSubscribeApi(update)
  const { mutate: mutateCancelSubscribe } = useCancelSubscribeApi(update)
  const { studioenv, isPublishDisabled } = useStudioPublishData()

  // 获取空间列表
  const getRobotList = async () => {
    try {
      setRobotListLoading(true)
      const data = await fetchBotList()
      if (data && data.length) {
        setRobotList(data)
      }
    } catch (error) {
      console.error("Error fetching robot list:", error)
      message.error("获取空间列表失败")
    } finally {
      setRobotListLoading(false)
    }
  }

  /**
   * @description: 取消订阅
   * @param {*} bizNo
   * @return {*}
   */
  const handleCancelSubscribe = (bizNo) =>
    mutateCancelSubscribe({ botNo, bizType: marketCode.PLUG_IN, bizNo })

  /**
   * @description: 订阅
   * @param {*} bizNo
   * @return {*}
   */
  const handleSubscribe = (bizNo) => {
    if (marketSub === "true") {
      setSelectedPluginNo(bizNo)
      setRobotModalVisible(true)
      getRobotList()
    } else {
      if (details && details.owner) {
        message.warning("该工具属于当前空间, 无法订阅")
      } else {
        mutateSubscribe({ botNo, bizType: marketCode.PLUG_IN, bizNo })
      }
    }
  }

  // 处理空间选择
  const handleRobotSelect = (selectedBotNo) => {
    if (selectedPluginNo) {
      mutateSubscribe(
        {
          botNo: selectedBotNo,
          bizType: marketCode.PLUG_IN,
          bizNo: selectedPluginNo
        },
        {
          onSuccess: () => {
            // 获取当前选中的空间信息
            const selectedRobot = robotList.find((robot) => robot.botNo === selectedBotNo)
            // 发送消息给 iframe
            postMessageForLX({
              type: MessageType.SUBSCRIBE_SUCCESS,
              botNo: selectedRobot.botNo
            })
            message.success("订阅成功，正在为您跳转工作台～")
            // navigate(`/plugins-management?botNo=${selectedBotNo}`)
            setRobotModalVisible(false)
            setSelectedPluginNo(null)
          }
        }
      )
    }
  }

  useEffect(() => {
    const info = details?.pluginInfo ?? {}
    const tools = details?.pluginTools ?? []
    const active = tools?.[0]?.toolNo
    const toolDetail = tools?.find((v) => v?.toolNo === active) ?? {}
    setPluginInfo(info)
    setPluginTools(tools)
    setActiveTool(toolDetail)
  }, [details])

  return (
    <section className={styles["plugin-detail-section"]}>
      <Spin spinning={loading}>
        <div className={styles["plugin-detail"]}>
          {/* backUrl={`/plugins-management?botNo=${botNo}`} */}
          <Header
            title={"工具详情"}
            backUrl={`/plugins-management?botNo=${botNo}&studioenv=${studioenv || ""}`}
          ></Header>
          <div className={styles["plugin-container"]}>
            <div className={styles["header"]}>
              <div className={styles["header-info"]}>
                <img src={pluginIcon} alt="" className={styles["detail-icon"]} />
                <div className={styles["center"]}>
                  <Title className={styles["title"]} level={3}>
                    {pluginInfo?.name}
                  </Title>
                  <div className={styles["header-line"]}>
                    {pluginInfo?.ownerInfo?.avatar_url && (
                      <img src={pluginInfo?.ownerInfo?.avatar_url} alt="" />
                    )}

                    {pluginInfo?.ownerInfo?.name ? (
                      <>
                        <Text>{pluginInfo?.ownerInfo?.name}</Text>
                        <Divider type="vertical" />
                      </>
                    ) : (
                      ""
                    )}

                    <span className={styles["time"]}>
                      {pluginInfo?.publishTime && "发布于"} {pluginInfo?.publishTime}
                    </span>
                  </div>
                  {pluginInfo?.pluginNo ? (
                    pluginInfo?.subscriber ? (
                      <Popconfirm
                        title="温馨提醒"
                        description="【取消订阅】将无法调用对应工作流。"
                        okText="确认"
                        onConfirm={() => handleCancelSubscribe(pluginInfo?.pluginNo)}
                        cancelText="取消"
                      >
                        <Button disabled={isPublishDisabled}>已订阅</Button>
                      </Popconfirm>
                    ) : (
                      <Button
                        size="small"
                        type="primary"
                        disabled={isPublishDisabled}
                        onClick={() => handleSubscribe(pluginInfo?.pluginNo)}
                      >
                        订阅
                      </Button>
                    )
                  ) : null}
                </div>
              </div>
              <div className={styles["statistic-info"]}>
                <div className={styles["item"]}>
                  <CountUp end={pluginTools?.length} separator="," />
                  <span>工具</span>
                </div>
                <Divider type="vertical" />
                <div className={styles["item"]}>
                  <CountUp end={pluginInfo?.subscriberCount} separator="," />
                  <span>订阅数</span>
                </div>
              </div>
            </div>
            <div className={styles["kit-container"]}>{pluginInfo?.description}</div>
            <Divider className={styles["header-divider"]} />
            <div className={styles["title-container"]}>工具</div>
            {pluginTools?.length ? (
              <div className={styles["plugin-tool-selector"]}>
                <div className={styles["selector"]}>
                  <Flex align="flex-start" gap="small" vertical>
                    {pluginTools.map((v) => {
                      const { toolNo, name } = v
                      return (
                        <Tooltip placement="topLeft" title={name}>
                          <Button
                            type="text"
                            key={toolNo}
                            onClick={() => setActiveTool(v)}
                            block
                            className={`${activeTool.toolNo === toolNo ? styles["active"] : ""}`}
                          >
                            <span className={styles["ellipsis"]}>{name}</span>
                          </Button>
                        </Tooltip>
                      )
                    })}
                  </Flex>
                </div>
                <div className={styles["selector-detaile"]}>
                  <Divider type="vertical" />
                  <div className={styles["detail"]}>
                    <div className={styles["kit-container"]}>{activeTool?.description}</div>
                    <div className={styles["table-title"]}>输入参数</div>
                    <Table
                      dataSource={activeTool.parameters}
                      pagination={false}
                      columns={columns}
                      rowKey={(r, i) => i}
                      // rowKey={'toolNo'}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <EmptyPro />
            )}
          </div>
          <SelectRobotModal
            open={robotModalVisible}
            onOk={handleRobotSelect}
            onCancel={() => {
              setRobotModalVisible(false)
              setSelectedPluginNo(null)
            }}
            robotList={robotList}
            robotListLoading={robotListLoading}
          />
        </div>
      </Spin>
    </section>
  )
}
export default PluginsDetail
