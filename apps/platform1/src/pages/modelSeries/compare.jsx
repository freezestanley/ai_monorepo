import React, { useState, useEffect } from "react"
import {
  Button,
  Card,
  Select,
  Spin,
  message,
  Divider,
  Row,
  Col,
  Tag,
  Descriptions,
  List,
  Typography,
  Space,
  Dropdown
} from "antd"
import { ArrowLeftOutlined, SwapOutlined, AppstoreOutlined, EyeOutlined } from "@ant-design/icons"
import { useNavigate } from "react-router-dom"
import { retrieve, queryDetail } from "@/api/modelSeries"
import Iconfont from "@/components/Icon"
import { supplierMap, capabilityMap, ioTypeMap, getIOTagColor } from "./constants"
import { getCurrencyLabel, getOrderOfMagnitude, PRICE_MODE_MAP } from "@/common/priceEnums"
import ModelEvaluationChart from "./components/EvaluationChart"
import "./compare.less"

const { Title, Text } = Typography
const { Option } = Select

const ModelSeriesCompare = () => {
  const navigate = useNavigate()
  const [allSeries, setAllSeries] = useState([])
  const [selectedSeries, setSelectedSeries] = useState([null, null, null])
  const [seriesDetails, setSeriesDetails] = useState([null, null, null])
  const [loading, setLoading] = useState(false)
  const [seriesLoading, setSeriesLoading] = useState([false, false, false])
  const [selectedSegments, setSelectedSegments] = useState({}) // 使用对象来管理每个价格卡片的选中阶段
  const [searchTerms, setSearchTerms] = useState({}) // 存储每个下拉框的搜索词

  useEffect(() => {
    loadAllSeries()
  }, [])

  const loadAllSeries = async () => {
    setLoading(true)
    try {
      const res = await retrieve()
      if (res.success && res.data) {
        setAllSeries(res.data)

        // 默认选中前三个模型系列
        const firstThreeSeries = res.data.slice(0, 3)
        const newSelected = firstThreeSeries.map((series) => series.id)

        // 确保数组长度为3，不足的用null填充
        while (newSelected.length < 3) {
          newSelected.push(null)
        }

        setSelectedSeries(newSelected)

        // 直接使用全量获取的数据，不需要额外调用详情接口
        const newDetails = firstThreeSeries.map((series) => ({
          ...series,
          // 为了保持数据结构一致性，将 mainModelAttribute 映射到 mainModel
          mainModel: series.mainModelAttribute
            ? {
                attribute: series.mainModelAttribute
              }
            : null
        }))

        // 确保数组长度为3
        while (newDetails.length < 3) {
          newDetails.push(null)
        }

        setSeriesDetails(newDetails)
      } else {
        message.error("获取模型系列列表失败")
      }
    } catch (error) {
      console.error("加载模型系列列表失败:", error)
      message.error("加载模型系列列表失败")
    } finally {
      setLoading(false)
    }
  }

  const loadSeriesDetail = async (index, seriesId) => {
    const newLoading = [...seriesLoading]
    newLoading[index] = true
    setSeriesLoading(newLoading)

    try {
      const res = await queryDetail(seriesId)
      if (res.success && res.data) {
        const newDetails = [...seriesDetails]
        newDetails[index] = res.data
        setSeriesDetails(newDetails)
      } else {
        message.error("获取模型系列详情失败")
      }
    } catch (error) {
      console.error("加载模型系列详情失败:", error)
      message.error("加载模型系列详情失败")
    } finally {
      const newLoading = [...seriesLoading]
      newLoading[index] = false
      setSeriesLoading(newLoading)
    }
  }

  const handleSeriesSelect = (index, seriesId) => {
    const newSelected = [...selectedSeries]
    newSelected[index] = seriesId
    setSelectedSeries(newSelected)

    if (seriesId) {
      loadSeriesDetail(index, seriesId)
    } else {
      const newDetails = [...seriesDetails]
      newDetails[index] = null
      setSeriesDetails(newDetails)
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

  // 跳转到模型详情页
  const handleCardClick = (seriesId) => {
    if (seriesId) {
      navigate(`/model-series/${seriesId}`)
    }
  }

  // 获取模型配置信息
  const getModelInfo = (model) => {
    if (model.attribute && typeof model.attribute === "object") {
      // 将evaluationMetrics与attribute合并
      return {
        ...model.attribute,
        evaluationMetrics: model.evaluationMetrics
      }
    }
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

  // 渲染模型卡片头部（参考ModelSeriesModule样式）
  const renderSeriesCardHeader = (series, index) => {
    if (!series) {
      return (
        <div className="flex items-center justify-center h-32 bg-white rounded-[12px] p-4 w-full">
          <Text type="secondary">暂无模型</Text>
        </div>
      )
    }

    if (seriesLoading[index]) {
      return (
        <div className="flex items-center justify-center h-32 bg-white rounded-[12px] p-4 w-full">
          <Spin size="small" />
        </div>
      )
    }

    return (
      <div className="flex items-center justify-center flex-col w-full h-32 p-4 bg-white rounded-[12px]">
        <div className="flex items-center mb-3 w-full">
          <div className="mr-3 flex items-center justify-center w-[48px] h-[48px] rounded-[8px] bg-gradient-to-br from-blue-50 to-purple-50">
            <Iconfont type="icon-box" style={{ color: "#6977ff", fontSize: "24px" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <span className="text-[16px] font-semibold text-[#181b25] truncate">
                {series.name}
              </span>
              <Tag className="ml-2 text-[12px] px-2 py-1 bg-[#f5f7fa] rounded-full" color="orange">
                {supplierMap[series.supplier]?.label || series.supplier}
              </Tag>
            </div>
          </div>
          <Dropdown
            menu={{
              items: [
                {
                  key: "search",
                  label: (
                    <div className="search-menu-item">
                      <input
                        type="text"
                        placeholder="搜索对比模型"
                        className="w-full border-none outline-none bg-transparent"
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const newSearchTerms = { ...searchTerms }
                          newSearchTerms[index] = e.target.value
                          setSearchTerms(newSearchTerms)
                        }}
                        value={searchTerms[index] || ""}
                      />
                    </div>
                  ),
                  className: "search-menu-item",
                  style: {
                    cursor: "default"
                  }
                },
                ...allSeries
                  .filter((item) => {
                    // 如果没有搜索词，显示所有项
                    if (!searchTerms[index]) return true
                    // 根据搜索词过滤
                    return item.name.toLowerCase().includes(searchTerms[index].toLowerCase())
                  })
                  .map((item) => {
                    // 检查该模型是否已经在其他位置显示
                    const isAlreadySelected = selectedSeries.some(
                      (selectedId, selectedIndex) =>
                        selectedIndex !== index && selectedId === item.id
                    )
                    // 检查是否是当前选中的模型
                    const isCurrentSelected = selectedSeries[index] === item.id

                    return {
                      key: item.id,
                      label: (
                        <div className="flex items-center justify-between">
                          <span
                            className={
                              isAlreadySelected || isCurrentSelected ? "text-gray-400" : ""
                            }
                          >
                            {item.name}
                          </span>
                          {isAlreadySelected && (
                            <span className="text-[12px] text-gray-400 ml-20">✓</span>
                          )}
                          {isCurrentSelected && (
                            <span className="text-[12px] text-blue-500 ml-20">当前</span>
                          )}
                        </div>
                      ),
                      disabled: isAlreadySelected,
                      onClick: () => !isAlreadySelected && handleSeriesSelect(index, item.id),
                      className: "model-dropdown-item"
                    }
                  })
              ],
              style: {
                maxHeight: "400px",
                overflow: "auto",
                width: "300px"
              }
            }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button type="text" icon={<SwapOutlined />} />
          </Dropdown>
        </div>
        <div className="w-full mt-2">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              handleCardClick(series.id)
            }}
            className="text-blue-500 p-0 h-auto"
          >
            查看详情
          </Button>
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

  // 格式化范围显示，支持数组格式的闭区间范围配置，并添加量级显示
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

  // 格式化价格显示
  const formatPrice = (priceValue) => {
    return priceValue?.toString() || "-"
  }

  // 获取输入输出类型图标
  const getIOTypeIcon = (type) => {
    const iconMap = {
      text: "icon-wenben",
      image: "icon-tupian",
      video: "icon-shipin",
      audio: "icon-yinpin"
    }
    return iconMap[type] || ""
  }

  // 渲染能力对比 - 使用图标展示，支持高亮，不支持置灰
  const renderCapabilitiesCompare = (capability) => {
    if (!capability) return null

    // 渲染类型图标组
    const renderTypeIcons = (types, title, defaultColor = "#1890ff") => (
      <div className="flex items-center space-y-2 justify-between">
        <div className="text-sm text-gray-600">{title}</div>
        <div className="flex items-center gap-2">
          {Object.entries(types || {}).map(([type, enabled]) => (
            <div key={`${title}-${type}`} className="flex flex-col items-center">
              <Iconfont
                type={getIOTypeIcon(type)}
                style={{
                  color: enabled ? defaultColor : "#bfbfbf",
                  fontSize: "18px"
                }}
              />
            </div>
          ))}
        </div>
      </div>
    )

    return (
      <div className="space-y-2">
        {/* 输入类型 */}
        {renderTypeIcons(capability.input, "输入类型", "#1890ff")}

        {/* 输出类型 */}
        {renderTypeIcons(capability.output, "输出类型", "#52c41a")}

        {/* 特殊能力 - 直接显示标签和状态 */}
        <div className="space-y-2">
          {Object.entries(capabilityMap).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <div>{label}</div>
              <div>
                <Iconfont
                  type={capability[key] ? "icon-dui" : "icon-cuo"}
                  className={`text-[18px] ${capability[key] ? "text-[#005cdf]" : "text-[#b3b3b3]"}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 设置默认选中阶段
  useEffect(() => {
    if (seriesDetails.length > 0) {
      const newSelectedSegments = { ...selectedSegments }
      seriesDetails.forEach((series, index) => {
        if (series && series.mainModel) {
          const modelInfo = getModelInfo(series.mainModel)
          if (modelInfo?.price) {
            let latestPriceConfig = null
            if (typeof modelInfo.price === "object") {
              const priceEntries = Object.entries(modelInfo.price)
                .filter(([key]) => /^\d{4}-\d{2}-\d{2}/.test(key))
                .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())

              if (priceEntries.length > 0) {
                ;[, latestPriceConfig] = priceEntries[0]
              }
            }

            if (latestPriceConfig && latestPriceConfig.prices) {
              newSelectedSegments[index] = latestPriceConfig.prices.length - 1
            }
          }
        }
      })
      setSelectedSegments(newSelectedSegments)
    }
  }, [seriesDetails])

  // 渲染价格对比
  const renderPriceCompare = (priceInfo, index) => {
    if (!priceInfo) return null

    let latestPriceConfig = null
    let latestDate = ""

    if (typeof priceInfo === "object") {
      const priceEntries = Object.entries(priceInfo)
        .filter(([key]) => /^\d{4}-\d{2}-\d{2}/.test(key))
        .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())

      if (priceEntries.length > 0) {
        ;[latestDate, latestPriceConfig] = priceEntries[0]
      }
    }

    if (!latestPriceConfig) return null

    const currency = latestPriceConfig.currency || "CNY"
    const priceType = latestPriceConfig.type || "normal"
    const selectedSegment =
      selectedSegments[index] !== undefined
        ? selectedSegments[index]
        : latestPriceConfig.prices
          ? latestPriceConfig.prices.length - 1
          : 0

    const renderPriceItem = (label, value) => {
      if (value === undefined || value === null) return null
      return (
        <div key={label} className="flex items-center justify-between py-1">
          <span className="text-gray-600">{label}</span>
          <span className="font-semibold text-gray-900">{formatPrice(value)}</span>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">计价方式</span>
          <div className="flex items-center gap-2">
            <Tag color="volcano" size="small">
              {priceType === "normal" ? "统一收费" : "分段收费"}
            </Tag>
            <Tag color="blue" size="small">
              {`${getCurrencyLabel(currency)}/${getOrderOfMagnitude(latestPriceConfig.order_of_magnitude || "thousand")}`}
            </Tag>
            {priceType === "normal" && latestPriceConfig.mode && (
              <Tag color="geekblue" size="small">
                {PRICE_MODE_MAP[latestPriceConfig.mode] || latestPriceConfig.mode}
              </Tag>
            )}
            {priceType === "segmented" && latestPriceConfig.prices?.[selectedSegment]?.mode && (
              <Tag color="geekblue" size="small">
                {PRICE_MODE_MAP[latestPriceConfig.prices[selectedSegment].mode] ||
                  latestPriceConfig.prices[selectedSegment].mode}
              </Tag>
            )}
          </div>
        </div>

        {priceType === "segmented" && latestPriceConfig.prices ? (
          <div className="space-y-3">
            <Select
              value={selectedSegment}
              size="small"
              style={{ width: "100%" }}
              onChange={(value) => setSelectedSegments({ ...selectedSegments, [index]: value })}
              options={latestPriceConfig.prices.map((_, index) => ({
                value: index,
                label: `阶段 ${index + 1}`
              }))}
            />

            {latestPriceConfig.prices[selectedSegment] && (
              <div className="space-y-2">
                {latestPriceConfig.prices[selectedSegment].input_token_range && (
                  <div className="flex items-center justify-between py-1">
                    <span className="text-gray-600">输入范围</span>
                    <span className="text-gray-900">
                      {formatRange(latestPriceConfig.prices[selectedSegment].input_token_range)}
                    </span>
                  </div>
                )}
                {renderPriceItem("输入价格", latestPriceConfig.prices[selectedSegment].input_price)}
                {renderPriceItem(
                  "缓存存储",
                  latestPriceConfig.prices[selectedSegment].cache_creation_input_price
                )}
                {renderPriceItem(
                  "缓存命中",
                  latestPriceConfig.prices[selectedSegment].cache_read_input_price
                )}
                {renderPriceItem(
                  "输出价格",
                  latestPriceConfig.prices[selectedSegment].output_price
                )}
                {renderPriceItem(
                  "非思考模式输出",
                  latestPriceConfig.prices[selectedSegment].non_thinking_mode_output_price
                )}
                {renderPriceItem(
                  "思考模式输出",
                  latestPriceConfig.prices[selectedSegment].thinking_mode_output_price
                )}
              </div>
            )}
          </div>
        ) : priceType === "normal" ? (
          <div className="space-y-2">
            {renderPriceItem(
              "输入价格",
              latestPriceConfig.input_price || latestPriceConfig.price?.input_price
            )}
            {renderPriceItem(
              "缓存存储",
              latestPriceConfig.cache_creation_input_price ||
                latestPriceConfig.price?.cache_creation_input_price
            )}
            {renderPriceItem(
              "缓存命中",
              latestPriceConfig.cache_read_input_price ||
                latestPriceConfig.price?.cache_read_input_price
            )}
            {renderPriceItem(
              "输出价格",
              latestPriceConfig.output_price || latestPriceConfig.price?.output_price
            )}
            {renderPriceItem(
              "非思考模式输出",
              latestPriceConfig.non_thinking_mode_output_price ||
                latestPriceConfig.price?.non_thinking_mode_output_price
            )}
            {renderPriceItem(
              "思考模式输出",
              latestPriceConfig.thinking_mode_output_price ||
                latestPriceConfig.price?.thinking_mode_output_price
            )}
          </div>
        ) : (
          <div className="text-gray-400">价格信息不可用</div>
        )}
      </div>
    )
  }

  // 渲染限制对比 - 使用flex-around布局，标题+值左右结构
  const renderRestrictionsCompare = (restriction) => {
    if (!restriction) return null

    const renderRestrictionItem = (label, value, unit = "tokens") => {
      return (
        <div key={label} className="flex items-center justify-between py-2">
          <span className="text-gray-600">{label}</span>
          <span className="font-semibold text-gray-900">
            {value ? `${value.toLocaleString()} ${unit}` : "-"}
          </span>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {renderRestrictionItem("上下文窗口", restriction.context_window)}
        {renderRestrictionItem("最大输入", restriction.max_input_tokens)}
        {renderRestrictionItem("最大输出", restriction.max_output_tokens)}
      </div>
    )
  }

  // 渲染横向对比布局
  const renderHorizontalCompare = () => {
    return (
      <div className="compare-content" style={{ height: "100%", overflowY: "auto" }}>
        {/* 评测数据对比区域 - 横向三列 */}
        <div className="compare-section">
          <div className="section-header">
            <div className="section-title">能力雷达</div>
          </div>
          <Row gutter={16} className="section-content">
            {[0, 1, 2].map((index) => (
              <Col
                key={index}
                span={8}
                style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <div
                  className="evaluation-compare-item"
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  {seriesLoading[index] ? (
                    <div className="loading">
                      <Spin size="small" />
                    </div>
                  ) : (
                    <div className="w-100">
                      {seriesDetails[index]?.mainModel ? (
                        (() => {
                          const modelInfo = getModelInfo(seriesDetails[index].mainModel)
                          return modelInfo?.evaluationMetrics &&
                            modelInfo.evaluationMetrics.length > 0 ? (
                            <ModelEvaluationChart
                              evaluationMetrics={modelInfo.evaluationMetrics}
                              isCompare={true}
                              allSeriesDetails={seriesDetails} // 传递所有模型数据用于计算统一的显示范围
                            />
                          ) : (
                            <div className="w-100 flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                              <Text type="secondary">暂无评测数据</Text>
                            </div>
                          )
                        })()
                      ) : (
                        <div className="w-100 flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                          <Text type="secondary">暂无模型数据</Text>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Col>
            ))}
          </Row>
        </div>

        {/* 能力对比区域 - 横向三列 */}
        <div className="compare-section">
          <div className="section-header">
            <div className="section-title">模型能力</div>
          </div>
          <Row gutter={16} className="section-content">
            {[0, 1, 2].map((index) => (
              <Col key={index} span={8}>
                <div className="compare-data-item bg-white rounded-lg p-4">
                  {seriesLoading[index] ? (
                    <div className="loading">
                      <Spin size="small" />
                    </div>
                  ) : (
                    renderCapabilitiesCompare(
                      seriesDetails[index]?.mainModel
                        ? getModelInfo(seriesDetails[index].mainModel)?.capability
                        : null
                    )
                  )}
                </div>
              </Col>
            ))}
          </Row>
        </div>

        {/* 价格对比区域 - 横向三列 */}
        <div className="compare-section">
          <div className="section-header">
            <div className="section-title">模型价格</div>
          </div>
          <Row gutter={16} className="section-content">
            {[0, 1, 2].map((index) => (
              <Col key={index} span={8}>
                <div className="compare-data-item bg-white rounded-lg p-4">
                  {seriesLoading[index] ? (
                    <div className="loading">
                      <Spin size="small" />
                    </div>
                  ) : (
                    renderPriceCompare(
                      seriesDetails[index]?.mainModel
                        ? getModelInfo(seriesDetails[index].mainModel)?.price
                        : null,
                      index
                    )
                  )}
                </div>
              </Col>
            ))}
          </Row>
        </div>

        {/* 限制对比区域 - 横向三列 */}
        <div className="compare-section">
          <div className="section-header">
            <div className="section-title">使用限制</div>
          </div>
          <Row gutter={16} className="section-content">
            {[0, 1, 2].map((index) => (
              <Col key={index} span={8}>
                <div className="compare-data-item bg-white rounded-lg p-4">
                  {seriesLoading[index] ? (
                    <div className="loading">
                      <Spin size="small" />
                    </div>
                  ) : (
                    renderRestrictionsCompare(
                      seriesDetails[index]?.mainModel
                        ? getModelInfo(seriesDetails[index].mainModel)?.restriction
                        : null
                    )
                  )}
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </div>
    )
  }

  return (
    <div className="model-series-detail compare-page">
      <div className="compare-detail-header">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          className="back-button"
        />
        <div className="header-info">
          <div className="series-title">
            <span className="title-text">模型对比</span>
          </div>
        </div>
      </div>

      {/* 模型卡片头部 - 固定在顶部 */}
      <div className="compare-header-section">
        <Row gutter={16}>
          {[0, 1, 2].map((index) => (
            <Col key={index} span={8}>
              <div className="compare-card-item">
                {renderSeriesCardHeader(
                  seriesDetails[index] || selectedSeries[index]
                    ? allSeries.find((s) => s.id === selectedSeries[index])
                    : null,
                  index
                )}
              </div>
            </Col>
          ))}
        </Row>
      </div>

      <div style={{ flex: 1, overflow: "hidden" }}>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" />
          </div>
        ) : (
          renderHorizontalCompare()
        )}
      </div>
    </div>
  )
}

export default ModelSeriesCompare
