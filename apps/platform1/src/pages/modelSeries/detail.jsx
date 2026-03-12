import {
  AppstoreOutlined,
  ArrowLeftOutlined,
  SwapOutlined,
  BarChartOutlined
} from "@ant-design/icons"
import { Button, Descriptions, List, message, Spin, Tag, Typography } from "antd"
import dayjs from "dayjs"
import React, { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import "./detail.less"
import { queryDetail } from "@/api/modelSeries"
import Iconfont from "@/components/Icon"
import { supplierMap, capabilityMap, ioTypeMap, getIOTagColor } from "./constants"
import { getCurrencyLabel, getOrderOfMagnitude, PRICE_MODE_MAP } from "@/common/priceEnums"
import { color } from "@uiw/react-codemirror/cjs/getDefaultExtensions.js"
import ModelEvaluationChart from "./components/EvaluationChart"

const { Title, Text } = Typography

const ModelSeriesDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [seriesDetail, setSeriesDetail] = useState(null)
  const [currentModel, setCurrentModel] = useState(null)
  const [isViewingMainModel, setIsViewingMainModel] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (id) {
      loadSeriesDetail(parseInt(id))
    }
  }, [id])

  const loadSeriesDetail = async (seriesId) => {
    setLoading(true)
    try {
      // 调用API获取模型系列详情
      const res = await queryDetail(seriesId)
      if (res.success && res.data) {
        setSeriesDetail(res.data)
      } else {
        message.error("模型系列不存在")
      }
    } catch (error) {
      console.error("加载模型系列详情失败:", error)
      message.error("加载模型系列详情失败")
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    // 检查是否有来源页面信息
    const fromSub = sessionStorage.getItem("fromMarketSub")
    const fromModelMarket = sessionStorage.getItem("fromModelMarket")
    if (fromSub === "true") {
      // 清除标记
      sessionStorage.removeItem("fromMarketSub")
      navigate("/market-sub")
    } else if (fromModelMarket === "true") {
      sessionStorage.removeItem("fromModelMarket")
      navigate("/model-Market")
    } else {
      navigate("/market")
    }
  }

  // 跳转到模型对比页面
  const handleCompareClick = () => {
    navigate("/model-series/compare")
  }

  // 获取模型配置信息，支持info和attribute两种格式
  const getModelInfo = (model) => {
    // 优先使用attribute字段（新格式）
    if (model.attribute && typeof model.attribute === "object") {
      // 将evaluationMetrics与attribute合并
      return {
        ...model.attribute,
        evaluationMetrics: model.evaluationMetrics
      }
    }
    // 其次使用info字段（旧格式）
    if (model.info && typeof model.info === "object") {
      // 将evaluationMetrics与info合并
      return {
        ...model.info,
        evaluationMetrics: model.evaluationMetrics
      }
    }
    // 如果没有attribute或info，直接返回evaluationMetrics
    if (model.evaluationMetrics) {
      return {
        evaluationMetrics: model.evaluationMetrics
      }
    }
    return null
  }

  // 价格模式映射
  const PRICE_MODE_MAP = {
    general: "通用模式",
    support_thinking: "支持思考模式"
  }

  const renderCapabilities = (capability) => {
    const inputTypes = Object.entries(capability.input)
      .filter(([_, enabled]) => enabled)
      .map(([type, _]) => ({
        type: ioTypeMap[type],
        color: getIOTagColor(type, "input")
      }))

    const outputTypes = Object.entries(capability.output)
      .filter(([_, enabled]) => enabled)
      .map(([type, _]) => ({
        type: ioTypeMap[type],
        color: getIOTagColor(type, "output")
      }))

    const features = Object.entries(capabilityMap)
      .filter(([key, _]) => capability[key])
      .map(([_, label]) => label)

    return (
      <div className="capabilities-section">
        <div className="capabilities-container">
          <div className="io-section">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="输入类型" span={1}>
                <div className="feature-tags">
                  {inputTypes.map(({ type, color }) => (
                    <Tag key={type} color={color}>
                      {type}
                    </Tag>
                  ))}
                  {inputTypes.length === 0 && <Text type="secondary">无</Text>}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="输出类型" span={1}>
                <div className="feature-tags">
                  {outputTypes.map(({ type, color }) => (
                    <Tag key={type} color={color}>
                      {type}
                    </Tag>
                  ))}
                  {outputTypes.length === 0 && <Text type="secondary">无</Text>}
                </div>
              </Descriptions.Item>
            </Descriptions>
          </div>

          <div className="special-features-section">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="特殊能力">
                <div className="feature-tags">
                  {features.map((feature) => (
                    <Tag key={feature} color="#483fffc7">
                      {feature}
                    </Tag>
                  ))}
                  {features.length === 0 && <Text type="secondary">无</Text>}
                </div>
              </Descriptions.Item>
            </Descriptions>
          </div>
        </div>
      </div>
    )
  }

  // 格式化数值为量级显示（统一按照K计算）
  const formatWithMagnitude = (value) => {
    if (typeof value !== "number") return value

    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`
    }
    return value.toString()
  }

  // 格式化范围显示，支持数组格式的闭区间范围配置
  const formatRange = (range) => {
    if (Array.isArray(range)) {
      if (range.length === 2) {
        return `${formatWithMagnitude(range[0])} - ${formatWithMagnitude(range[1])}`
      } else if (range.length === 1) {
        return `≥ ${formatWithMagnitude(range[0])}`
      }
    } else if (typeof range === "string") {
      return range
    } else if (typeof range === "number") {
      return formatWithMagnitude(range)
    }
    return range
  }

  const renderPriceInfo = (price) => {
    // 处理新的多时间点价格配置格式
    let latestPriceConfig = null
    let currency = "CNY"
    let unit = "token"
    let priceType = "normal"
    let orderOfMagnitude = "thousand"
    let latestDate = ""

    if (price && typeof price === "object") {
      // 查找最新的价格配置（按时间倒序排序）
      const priceEntries = Object.entries(price)
        .filter(([key]) => /^\d{4}-\d{2}-\d{2}/.test(key)) // 只处理日期格式的键
        .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime()) // 从近到远排序

      if (priceEntries.length > 0) {
        ;[latestDate, latestPriceConfig] = priceEntries[0]
        currency = latestPriceConfig.currency || "CNY"
        unit = latestPriceConfig.unit || "token"
        priceType = latestPriceConfig.type || "normal"
        orderOfMagnitude = latestPriceConfig.order_of_magnitude || "thousand"

        // 格式化价格显示，根据数量级调整显示
        const formatPrice = (priceValue) => {
          // 只返回价格数值，不包含单位
          return priceValue.toString()
        }

        console.log("价格：", priceType, latestPriceConfig)

        // 显示生效日期
        return (
          <div className="price-section">
            <div className="price-header">
              <Text strong>
                {priceType === "normal" ? "统一收费" : "分段收费"} ({getCurrencyLabel(currency)})
              </Text>
              {latestPriceConfig.currency && latestPriceConfig.order_of_magnitude && (
                <div>
                  <Tag color="volcano">
                    {`${getCurrencyLabel(latestPriceConfig.currency)}/${getOrderOfMagnitude(latestPriceConfig.order_of_magnitude)}`}
                  </Tag>
                </div>
              )}
              {latestPriceConfig.mode && (
                <Tag color="geekblue">
                  {PRICE_MODE_MAP[latestPriceConfig.mode] || latestPriceConfig.mode}
                </Tag>
              )}
              <Text type="secondary">版本发布时间: {latestDate}</Text>
            </div>

            {priceType === "segmented" && latestPriceConfig.prices ? (
              <List
                size="small"
                dataSource={latestPriceConfig.prices}
                renderItem={(item, index) => (
                  <List.Item>
                    <div className="price-item">
                      <div className="price-item-header">
                        <Text strong>阶段 {index + 1}</Text>
                        {item.mode && (
                          <Tag color="geekblue" style={{ marginLeft: "12px", fontSize: "12px" }}>
                            {PRICE_MODE_MAP[item.mode] || item.mode}
                          </Tag>
                        )}
                      </div>
                      <div className="price-details">
                        {item.input_token_range && (
                          <div className="input-range-info">
                            <Text type="secondary" style={{ fontSize: "12px" }}>
                              输入范围:{" "}
                            </Text>
                            <Text>{formatRange(item.input_token_range)}</Text>
                          </div>
                        )}

                        {/* 输入计价区域 */}
                        <div style={{ marginBottom: "12px" }}>
                          <div className="m-b-8 col-343434 f-w-500">
                            <span className={`img iconfont prompt-input col-4C84FF m-r-8`}></span>
                            输入计价
                          </div>
                          <Descriptions column={2} size="small">
                            {item.input_price !== undefined && (
                              <Descriptions.Item label="输入价格">
                                <Text strong>{formatPrice(item.input_price)}</Text>
                                <Text
                                  type="secondary"
                                  style={{ fontSize: "12px", marginLeft: "4px" }}
                                ></Text>
                              </Descriptions.Item>
                            )}
                            {item.cache_creation_input_price !== undefined && (
                              <Descriptions.Item label="缓存存储">
                                <Text strong>{formatPrice(item.cache_creation_input_price)}</Text>
                                <Text
                                  type="secondary"
                                  style={{ fontSize: "12px", marginLeft: "4px" }}
                                ></Text>
                              </Descriptions.Item>
                            )}
                            {item.cache_read_input_price !== undefined && (
                              <Descriptions.Item label="缓存命中">
                                <Text strong>{formatPrice(item.cache_read_input_price)}</Text>
                                <Text
                                  type="secondary"
                                  style={{ fontSize: "12px", marginLeft: "4px" }}
                                ></Text>
                              </Descriptions.Item>
                            )}
                          </Descriptions>
                        </div>

                        {/* 输出计价区域 */}
                        <div>
                          <div className="m-b-8 col-343434 f-w-500">
                            <span className={`img iconfont prompt-input col-980ce9ff m-r-8`}></span>
                            输出计价
                          </div>
                          <Descriptions column={2} size="small">
                            {/* 通用模式的输出价格 */}
                            {item.mode === "general" && item.output_price !== undefined && (
                              <Descriptions.Item label="通用输出价格">
                                <Text strong>{formatPrice(item.output_price)}</Text>
                                <Text
                                  type="secondary"
                                  style={{ fontSize: "12px", marginLeft: "4px" }}
                                ></Text>
                              </Descriptions.Item>
                            )}

                            {/* 支持思考模式的输出价格 */}
                            {item.mode === "support_thinking" &&
                              item.non_thinking_mode_output_price !== undefined && (
                                <Descriptions.Item label="非思考模式输出价格">
                                  <Text strong>
                                    {formatPrice(item.non_thinking_mode_output_price)}
                                  </Text>
                                  <Text
                                    type="secondary"
                                    style={{ fontSize: "12px", marginLeft: "4px" }}
                                  ></Text>
                                </Descriptions.Item>
                              )}
                            {item.mode === "support_thinking" &&
                              item.thinking_mode_output_price !== undefined && (
                                <Descriptions.Item label="思考模式输出价格">
                                  <Text strong>{formatPrice(item.thinking_mode_output_price)}</Text>
                                  <Text
                                    type="secondary"
                                    style={{ fontSize: "12px", marginLeft: "4px" }}
                                  ></Text>
                                </Descriptions.Item>
                              )}
                          </Descriptions>
                        </div>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            ) : priceType === "normal" ? (
              <div>
                {/* 输入计价区域 */}
                <div className="m-b-5 col-343434 f-w-500">
                  <span className={`img iconfont prompt-input col-4C84FF m-r-8`}></span>
                  输入计价
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <Descriptions column={2} size="small">
                    <Descriptions.Item label="输入价格">
                      <Text strong>
                        {formatPrice(
                          latestPriceConfig.price?.input_price || latestPriceConfig.input_price
                        )}
                      </Text>
                      <Text type="secondary" style={{ fontSize: "12px", marginLeft: "4px" }}></Text>
                    </Descriptions.Item>
                    {(latestPriceConfig.price?.cache_creation_input_price !== undefined ||
                      latestPriceConfig.cache_creation_input_price !== undefined) && (
                      <Descriptions.Item label="缓存存储">
                        <Text strong>
                          {formatPrice(
                            latestPriceConfig.price?.cache_creation_input_price ||
                              latestPriceConfig.cache_creation_input_price
                          )}
                        </Text>
                        <Text
                          type="secondary"
                          style={{ fontSize: "12px", marginLeft: "4px" }}
                        ></Text>
                      </Descriptions.Item>
                    )}
                    {(latestPriceConfig.price?.cache_read_input_price !== undefined ||
                      latestPriceConfig.cache_read_input_price !== undefined) && (
                      <Descriptions.Item label="缓存命中">
                        <Text strong>
                          {formatPrice(
                            latestPriceConfig.price?.cache_read_input_price ||
                              latestPriceConfig.cache_read_input_price
                          )}
                        </Text>
                        <Text
                          type="secondary"
                          style={{ fontSize: "12px", marginLeft: "4px" }}
                        ></Text>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </div>

                <div className="m-b-5 col-343434 f-w-500">
                  <span className={`img iconfont prompt-input col-980ce9ff m-r-8`}></span>
                  输出计价
                </div>
                <div>
                  <Descriptions column={2} size="small">
                    {/* 通用模式的输出价格 */}
                    {latestPriceConfig.mode === "general" &&
                      (latestPriceConfig.price?.output_price !== undefined ||
                        latestPriceConfig.output_price !== undefined) && (
                        <Descriptions.Item label="通用输出价格">
                          <Text strong>
                            {formatPrice(
                              latestPriceConfig.price?.output_price ||
                                latestPriceConfig.output_price
                            )}
                          </Text>
                          <Text
                            type="secondary"
                            style={{ fontSize: "12px", marginLeft: "4px" }}
                          ></Text>
                        </Descriptions.Item>
                      )}

                    {/* 支持思考模式的输出价格 */}
                    {latestPriceConfig.mode === "support_thinking" &&
                      (latestPriceConfig.price?.non_thinking_mode_output_price !== undefined ||
                        latestPriceConfig.non_thinking_mode_output_price !== undefined) && (
                        <Descriptions.Item label="非思考模式输出价格">
                          <Text strong>
                            {formatPrice(
                              latestPriceConfig.price?.non_thinking_mode_output_price ||
                                latestPriceConfig.non_thinking_mode_output_price
                            )}
                          </Text>
                          <Text
                            type="secondary"
                            style={{ fontSize: "12px", marginLeft: "4px" }}
                          ></Text>
                        </Descriptions.Item>
                      )}
                    {latestPriceConfig.mode === "support_thinking" &&
                      (latestPriceConfig.price?.thinking_mode_output_price !== undefined ||
                        latestPriceConfig.thinking_mode_output_price !== undefined) && (
                        <Descriptions.Item label="思考模式输出价格">
                          <Text strong>
                            {formatPrice(
                              latestPriceConfig.price?.thinking_mode_output_price ||
                                latestPriceConfig.thinking_mode_output_price
                            )}
                          </Text>
                          <Text
                            type="secondary"
                            style={{ fontSize: "12px", marginLeft: "4px" }}
                          ></Text>
                        </Descriptions.Item>
                      )}
                  </Descriptions>
                </div>
              </div>
            ) : (
              <Text type="secondary">价格信息不可用</Text>
            )}
          </div>
        )
      }
    }
  }

  const renderRestrictions = (restriction) => {
    return (
      <Descriptions column={2} size="small">
        <Descriptions.Item label="上下文窗口">
          {restriction.context_window?.toLocaleString()} tokens
        </Descriptions.Item>
        <Descriptions.Item label="最大输入">
          {restriction.max_input_tokens?.toLocaleString()} tokens
        </Descriptions.Item>
        <Descriptions.Item label="最大输出">
          {restriction.max_output_tokens?.toLocaleString()} tokens
        </Descriptions.Item>
      </Descriptions>
    )
  }

  // 渲染模型信息
  const renderModelInfo = (model, title = "模型信息") => {
    const parsedInfo = getModelInfo(model)
    return (
      <div className="model-info">
        <div className="model-info-header">
          <div className="header-title">{title}</div>
        </div>
        <div className="model-info-content">
          {parsedInfo ? (
            <>
              <div className="info-section">
                <Title level={5}>基本信息</Title>
                <Descriptions column={2} size="small" bordered>
                  <Descriptions.Item label="模型名称">
                    <Text strong>{model.name}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="模型类型">
                    <Tag color="blue">{model.type}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="映射ID">{model.mapping || "无"}</Descriptions.Item>
                  <Descriptions.Item label="知识截止时间" span={2}>
                    {parsedInfo.knowledge_cutoff}
                  </Descriptions.Item>
                  <Descriptions.Item label="模型描述" span={2}>
                    {parsedInfo.description}
                  </Descriptions.Item>
                </Descriptions>
              </div>

              <div className="info-section">
                <Title level={5}>能力配置</Title>
                {renderCapabilities(parsedInfo.capability)}
              </div>

              {/* 能力雷达区域 */}
              {parsedInfo.evaluationMetrics && parsedInfo.evaluationMetrics.length > 0 && (
                <div className="info-section">
                  <Title level={5}>能力雷达</Title>
                  <ModelEvaluationChart
                    evaluationMetrics={parsedInfo.evaluationMetrics}
                    isCompare={false}
                  />
                </div>
              )}

              <div className="info-section">
                <Title level={5}>价格信息</Title>
                {renderPriceInfo(parsedInfo.price)}
              </div>

              <div className="info-section">
                <Title level={5}>使用限制</Title>
                {renderRestrictions(parsedInfo.restriction)}
              </div>
            </>
          ) : (
            <Text type="secondary">配置信息解析失败</Text>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="model-series-detail loading">
        <Spin size="large" />
      </div>
    )
  }

  if (!seriesDetail) {
    return (
      <div className="model-series-detail error">
        <Text type="secondary">模型系列不存在</Text>
      </div>
    )
  }

  return (
    <div className="model-series-detail">
      <div className="detail-header">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          className="back-button"
        />
        <div className="header-info">
          <div className="series-title">
            <div className="series-title-content">
              <Iconfont
                type="icon-box"
                style={{ marginRight: "10px", color: "#6977ff", fontSize: "28px" }}
              />
              <span className="title-text">{seriesDetail.name}</span>
              <Tag className="series-meta" color="orange">
                {supplierMap[seriesDetail.supplier]?.label || seriesDetail.supplier}
              </Tag>
            </div>
            <div className="series-title-operation">
              <Button type="link" onClick={handleCompareClick} className="ml-4">
                模型对比
              </Button>
            </div>
          </div>
          {seriesDetail.description && (
            <div className="series-description">{seriesDetail.description}</div>
          )}
          <div className="series-update-time">
            更新时间: {dayjs(seriesDetail.gmtModified).format("YYYY-MM-DD HH:mm:ss")}
          </div>
        </div>
      </div>

      <div className="detail-content">
        {seriesDetail.mainModel && renderModelInfo(seriesDetail.mainModel, "")}
      </div>
    </div>
  )
}

export default ModelSeriesDetail
