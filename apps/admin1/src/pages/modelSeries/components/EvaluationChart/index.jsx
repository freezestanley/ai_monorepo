import React from "react"
import { Typography } from "antd"
import { Radar } from "@ant-design/plots"

import "./index.less"

const { Text } = Typography

const ModelEvaluationChart = ({
  evaluationMetrics = [],
  isCompare = false,
  allSeriesDetails = []
}) => {
  // 将小数转换为百分比并保留两位小数
  const processData = (metrics) => {
    return metrics.map((item) => ({
      ...item,
      score: parseFloat((item.score * 100).toFixed(2)),
      dimensionDesc: item.dimensionDesc || item.dimension
    }))
  }

  const data = processData(evaluationMetrics)

  // 如果没有数据，显示空状态
  if (!data || data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center ${isCompare ? "h-64" : "h-64"} bg-gray-50 rounded-lg`}
      >
        <Text type="secondary">暂无评测数据</Text>
      </div>
    )
  }

  // 计算所有指标的均值
  const averageScore = data.reduce((sum, item) => sum + item.score, 0) / data.length

  // 为了突出0-10%的差异，将均值作为基准，调整数据范围
  // 计算数据的最大值和最小值，用于确定合适的显示范围
  const maxScore = Math.max(...data.map((item) => item.score))
  const minScore = Math.min(...data.map((item) => item.score))

  // 如果在对比模式下，需要根据所有模型数据计算统一的显示范围
  let minDisplay, maxDisplay

  if (isCompare && allSeriesDetails && allSeriesDetails.length > 0) {
    // 收集所有模型的所有评测指标数据
    const allScores = []

    allSeriesDetails.forEach((series) => {
      if (series && series.mainModel) {
        const modelInfo = {
          ...series.mainModel.attribute,
          evaluationMetrics: series.mainModel.evaluationMetrics
        }

        if (modelInfo.evaluationMetrics && modelInfo.evaluationMetrics.length > 0) {
          const processedMetrics = modelInfo.evaluationMetrics.map((item) =>
            parseFloat((item.score * 100).toFixed(2))
          )
          allScores.push(...processedMetrics)
        }
      }
    })

    if (allScores.length > 0) {
      // 计算所有模型数据的均值、最大值和最小值
      const allAverage = allScores.reduce((sum, score) => sum + score, 0) / allScores.length
      const allMax = Math.max(...allScores)
      const allMin = Math.min(...allScores)

      // 使用所有模型数据的统计信息来设置显示范围
      const range = allMax - allMin
      const rangePadding = Math.max(3, range * 0.15) // 使用更小的缓冲，使内环下限更缩一些

      minDisplay = Math.max(0, allMin - rangePadding)
      maxDisplay = Math.min(100, allMax + rangePadding)

      // 确保显示范围至少为8，以保持图表的可读性
      if (maxDisplay - minDisplay < 8) {
        const halfRange = 8 / 2
        minDisplay = Math.max(0, allAverage - halfRange)
        maxDisplay = Math.min(100, allAverage + halfRange)
      }
    } else {
      // 如果没有其他模型数据，使用当前模型数据
      minDisplay = Math.max(0, minScore - 3)
      maxDisplay = Math.min(100, maxScore + 3)
    }
  } else {
    // 计算数据的标准差，用于判断数据分布的离散程度
    const variance =
      data.reduce((sum, item) => sum + Math.pow(item.score - averageScore, 2), 0) / data.length
    const stdDev = Math.sqrt(variance)

    // 根据数据分布情况动态调整显示范围
    // 如果数据分布较集中（标准差小），则使用更窄的范围来突出差异
    // 如果数据分布较分散，则使用更宽的范围确保可读性
    if (stdDev < 10) {
      // 数据分布集中，使用较小的范围来突出细微差异
      // 以均值为中心，使用标准差的倍数来确定范围
      const rangePadding = Math.max(5, stdDev * 1.5) // 使用更小的范围来突出差异
      minDisplay = Math.max(0, averageScore - rangePadding)
      maxDisplay = Math.min(100, averageScore + rangePadding)
    } else if (averageScore <= 50 && maxScore >= 85) {
      // 当均值较低但有高分项时，使用数据范围加缓冲的方式
      const range = maxScore - minScore
      const padding = Math.max(3, range * 0.15) // 使用更小的缓冲
      minDisplay = Math.max(0, minScore - padding)
      maxDisplay = Math.min(100, maxScore + padding)
    } else {
      // 正常情况下使用数据范围加缓冲
      const rangePadding = Math.max(3, (maxScore - minScore) * 0.25) // 使用更小的缓冲
      minDisplay = Math.max(0, minScore - rangePadding)
      maxDisplay = Math.min(100, maxScore + rangePadding)
    }

    // 确保显示范围至少为8，以保持图表的可读性
    const range = maxDisplay - minDisplay
    if (range < 8) {
      const halfRange = 8 / 2
      minDisplay = Math.max(0, averageScore - halfRange)
      maxDisplay = Math.min(100, averageScore + halfRange)
    }
  }

  // 最终确保范围在[0,100]内
  minDisplay = Math.max(0, minDisplay)
  maxDisplay = Math.min(100, maxDisplay)

  // 配置雷达图
  const config = {
    data,
    xField: "dimensionDesc",
    yField: "score",
    // 设置最大值和最小值，以均值为中心突出差异
    meta: {
      score: {
        min: minDisplay,
        max: maxDisplay
      }
    },
    // 设置颜色为项目主题色
    color: isCompare ? "#7F56D9" : "#7F56D9",
    // 设置点的样式
    point: {
      size: 2
    },
    // 设置线的样式
    line: {
      size: 1,
      style: {
        lineWidth: 2,
        stroke: "#7F56D9" // 使用项目主题色
      }
    },
    // 设置填充区域
    area: {
      style: {
        fill: "#7F56D9", // 使用项目主题色
        fillOpacity: 0.1
      }
    },
    // 设置提示框 - 优化悬浮展示样式
    tooltip: {
      formatter: (datum) => {
        return {
          name: datum.dimensionDesc,
          value: `${datum.score}%`
        }
      },
      // 优化悬浮框样式
      style: {
        fontSize: 12,
        color: "#333"
      },
      domStyles: {
        "g2-tooltip": {
          border: "1px solid #7F56D9",
          borderRadius: "4px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          backgroundColor: "#fff"
        },
        "g2-tooltip-title": {
          color: "#333",
          fontWeight: "bold",
          borderBottom: "1px solid #f0f0f0",
          paddingBottom: "4px"
        },
        "g2-tooltip-list": {
          margin: 0,
          padding: "4px 0"
        },
        "g2-tooltip-list-item": {
          padding: "2px 0",
          color: "#333"
        },
        "g2-tooltip-value": {
          color: "#7F56D9",
          fontWeight: "bold"
        }
      }
    },
    // 设置坐标轴
    xAxis: {
      tickLine: null,
      line: null
    },
    // 设置y轴
    yAxis: {
      label: false
    },
    // 设置图例
    legend: false // 根据反馈，移除图例
  }

  // 为详情页面创建指标数据展示
  if (!isCompare) {
    return (
      <div className="model-evaluation-radar-chart">
        <div className="flex">
          <div className="w-1/2 pr-2">
            <Radar {...config} height={180} />
          </div>
          <div className="dimension-content pl-2">
            <div className="metrics-list" style={{ maxHeight: "180px", overflow: "auto" }}>
              {data.map((item, index) => (
                <div key={index} className="metric-item">
                  <div className="metric-header">
                    <div className="metric-name">{item.dimensionDesc}</div>
                    <div className="metric-value">{item.score}%</div>
                  </div>
                  <div className="metric-bar">
                    <div className="metric-bar-fill" style={{ width: `${item.score}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 对比页面只显示图表
  return (
    <div className={`model-evaluation-radar-chart ${isCompare ? "compare-chart" : ""}`}>
      <div className="chart-container">
        <Radar {...config} height={isCompare ? 180 : 180} />
      </div>
    </div>
  )
}

export default ModelEvaluationChart
