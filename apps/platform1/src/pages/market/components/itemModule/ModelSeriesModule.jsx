import React, { useState, useEffect } from "react"
import { Col, Row, Button, Tooltip, Spin, message, Tag, Table, Radio } from "antd"
import { StarOutlined, AppstoreOutlined, BarsOutlined, EyeOutlined } from "@ant-design/icons"
import QueueAnim from "rc-queue-anim"
import copy from "copy-to-clipboard"
import { useInView } from "react-intersection-observer"
import { useNavigate } from "react-router-dom"
import { useInfiniteModelSeriesMarketListApi } from "@/api/modelSeries"
import { useMarket } from "../../"
import { cancelBubble } from "@/utils"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"
import styles from "./index.module.scss"
import modelSeriesStyles from "./ModelSeriesModule.module.scss"
import { SkeletonModule } from "./skeleton"
import { supplierMap } from "@/pages/modelSeries/constants"
import dayjs from "dayjs"

// 模型图标
import modelIcon from "@/assets/img/agentAvater-new.png?url"

export const ModelSeriesModule = () => {
  const { marketSearch } = useMarket()
  const navigate = useNavigate()
  const [pagination, setPagination] = useState({ current: 1, pageSize: 12 })

  // 展示模式状态：'card' 或 'list'
  const [viewMode, setViewMode] = useState("card")

  useEffect(() => {
    setPagination({ ...pagination, current: 1 })
  }, [marketSearch])

  // 使用无限滚动获取模型系列列表
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: listLoading
  } = useInfiniteModelSeriesMarketListApi({
    pageSize: pagination.pageSize,
    ...(marketSearch === "" ? { param: {} } : { param: { name: marketSearch } })
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

  // 卡片点击事件 - 跳转到详情页
  const onCardClick = (item) => {
    // 清除来源标记（表示来自主市场页面）
    sessionStorage.removeItem("fromMarketSub")
    navigate(`/model-series/${item.id}`)
  }

  // 定义Table列配置
  const columns = [
    {
      title: "模型系列信息",
      dataIndex: "name",
      key: "name",
      width: 300,
      render: (text, record) => (
        <div className="flex items-center">
          <div className="mr-3 flex items-center justify-center w-[48px] h-[48px] rounded-[8px] bg-gradient-to-br from-blue-50 to-purple-50">
            <img src={modelIcon} className="w-[32px] h-[32px] rounded-[4px]" alt="model" />
          </div>
          <div className="font-semibold text-[16px] text-[#181b25] mb-1">
            {record.name ?? "暂无"}
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
        <Tooltip title={text || "暂无描述"}>
          <span>{text || "暂无描述"}</span>
        </Tooltip>
      )
    },
    {
      title: "供应商",
      dataIndex: "supplier",
      key: "supplier",
      width: 120,
      render: (text) => (
        <Tag className="text-[12px] px-2 py-1 bg-[#f5f7fa] rounded-full" color="orange">
          {supplierMap[text]?.label || text}
        </Tag>
      )
    },
    {
      title: "输入类型支持",
      dataIndex: "mainModelAttribute",
      key: "inputTypes",
      width: 180,
      render: (mainModelAttribute) => {
        const inputCapabilities = mainModelAttribute?.capability?.input || {}
        const inputTypes = Object.entries(inputCapabilities)
          .filter(([_, value]) => value === true)
          .map(([key]) => {
            const typeMap = {
              text: "文本",
              image: "图片",
              video: "视频",
              audio: "音频"
            }
            return typeMap[key] || key
          })

        return (
          <div className="flex flex-wrap gap-1">
            {inputTypes.length > 0 ? (
              <>
                {inputTypes.slice(0, 2).map((type, index) => (
                  <Tag key={index} color="blue">
                    {type}
                  </Tag>
                ))}
                {inputTypes.length > 2 && (
                  <Tooltip
                    title={
                      <div className="flex flex-wrap gap-1">
                        {inputTypes.slice(2).map((type, index) => (
                          <div key={index}>{type}</div>
                        ))}
                      </div>
                    }
                  >
                    <Tag color="blue">+{inputTypes.length - 2}</Tag>
                  </Tooltip>
                )}
              </>
            ) : (
              <span className="text-[12px] text-[#999]">暂无</span>
            )}
          </div>
        )
      }
    },
    {
      title: "更新时间",
      dataIndex: "gmtModified",
      key: "gmtModified",
      width: 150,
      render: (text) => (text ? dayjs(text).format("YYYY-MM-DD HH:mm") : "-")
    },
    {
      title: "操作",
      key: "action",
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={(e) => {
            cancelBubble(e)
            onCardClick(record)
          }}
        >
          查看
        </Button>
      )
    }
  ]

  return (
    <div className={styles["market-item-module"]} key="MODEL_SERIES">
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
                  const { id, name, supplier, description, gmtModified, mainModelAttribute } =
                    item || {}

                  // 获取模型输入支持类型
                  const inputCapabilities = mainModelAttribute?.capability?.input || {}
                  const inputTypes = Object.entries(inputCapabilities)
                    .filter(([_, value]) => value === true)
                    .map(([key]) => {
                      const typeMap = {
                        text: "文本",
                        image: "图片",
                        video: "视频",
                        audio: "音频"
                      }
                      return typeMap[key] || key
                    })

                  return (
                    <Col xs={24} sm={12} md={12} lg={8} xl={8} xxl={6} key={id}>
                      <QueueAnim delay={50 * i} type="top" className="queue-simple">
                        <div
                          className={`${styles["card-item"]} ${styles["card-item-AGENT"]} ${modelSeriesStyles["model-series-card"]} cursor-pointer`}
                          style={{ marginBottom: "20px" }}
                          onClick={() => onCardClick(item)}
                        >
                          <div className="flex flex-col w-[100%]">
                            {/* 1. 模型名称 */}
                            <div
                              className={`${styles["title-wrapper"]} items-center`}
                              style={{ marginBottom: "12px" }}
                            >
                              <div
                                className={`${styles["card-icon"]} mr-[12px] flex items-center justify-center w-[48px] h-[48px] rounded-[8px]`}
                              >
                                <img
                                  src={modelIcon}
                                  className={styles["text-base-img"]}
                                  style={{ width: "32px", height: "32px", borderRadius: "4px" }}
                                  alt="model"
                                />
                              </div>
                              <div className="flex flex-1 flex-col items-start overflow-hidden">
                                <Tooltip title={name}>
                                  <span className={styles["text-base"]}>{name ?? "暂无"}</span>
                                </Tooltip>
                              </div>
                            </div>

                            {/* 2. 供应商、模型输入支持类型 */}
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                              <Tag color="orange" style={{ margin: 0 }}>
                                {supplierMap[supplier]?.label || supplier}
                              </Tag>
                              {inputTypes.slice(0, 3).map((type, index) => (
                                <Tag key={index} color="blue" style={{ margin: 0 }}>
                                  {type}
                                </Tag>
                              ))}
                              {inputTypes.length > 3 && (
                                <Tooltip
                                  title={
                                    <div className="flex flex-wrap gap-1">
                                      {inputTypes.slice(3).map((type, index) => (
                                        <Tag key={index} color="blue">
                                          {type}
                                        </Tag>
                                      ))}
                                    </div>
                                  }
                                >
                                  <Tag color="blue" style={{ margin: 0 }}>
                                    +{inputTypes.length - 3}
                                  </Tag>
                                </Tooltip>
                              )}
                            </div>

                            {/* 3. 描述 */}
                            <Tooltip title={description}>
                              <div className={styles["desc"]} style={{ marginBottom: "12px" }}>
                                {description || "暂无描述"}
                              </div>
                            </Tooltip>

                            {/* 4. 更新时间 */}
                            <div className="mb-3">
                              <span className="text-[12px] text-[#626263]">
                                更新时间：
                                {gmtModified ? dayjs(gmtModified).format("YYYY-MM-DD") : "-"}
                              </span>
                            </div>

                            {/* 操作 */}
                            <div className={styles["remove-btn"]}>
                              {/* <div className={styles["subscribe-count"]}></div> */}
                              <Button
                                type="link"
                                className="p-0"
                                icon={<EyeOutlined />}
                                onClick={(e) => {
                                  cancelBubble(e)
                                  onCardClick(item)
                                }}
                              >
                                查看详情
                              </Button>
                            </div>
                          </div>
                        </div>
                      </QueueAnim>
                    </Col>
                  )
                })}
              </Row>
              {isFetchingNextPage && (
                <div className="text-center py-4">
                  <Spin size="small" />
                  <span className="ml-2">加载更多...</span>
                </div>
              )}
              <div ref={ref} style={{ height: 20 }} /> {/* 用于检测滚动到底部 */}
            </div>
          ) : (
            // 列表视图
            <div>
              <Table
                columns={columns}
                dataSource={list}
                rowKey="id"
                pagination={false}
                scroll={{ x: 800 }}
                className="model-series-table"
              />
              {isFetchingNextPage && (
                <div className="text-center py-4">
                  <Spin size="small" />
                  <span className="ml-2">加载更多...</span>
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
    </div>
  )
}
