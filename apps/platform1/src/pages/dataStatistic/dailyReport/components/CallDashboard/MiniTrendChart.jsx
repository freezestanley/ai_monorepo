import React, { useMemo } from "react"
import { Line } from "@ant-design/plots"

// 不同数据块的颜色配置
const chartColors = [
  "rgba(131, 112, 238, 0.8)", // 紫色
  "rgba(54, 186, 119, 0.8)", // 绿色
  "rgba(233, 162, 31, 0.8)", // 橙色
  "rgba(119, 184, 48, 0.8)", // 浅绿色
  "rgba(66, 153, 225, 0.8)" // 蓝色
]

// 生成随机但向上的折线数据
const generateRandomTrendData = () => {
  const data = []
  let currentValue = Math.random() * 30 + 20 // 起始值 20-50

  for (let i = 0; i < 7; i++) {
    // 确保趋势总体向上，但有小幅波动
    const change = Math.random() * 15 - 5 // -5 到 +10 的变化
    currentValue = Math.max(10, currentValue + change)
    data.push({
      date: `Day ${i + 1}`,
      value: Math.round(currentValue)
    })
  }

  return data
}

const MiniTrendChart = ({ index = 0 }) => {
  const trendData = useMemo(() => generateRandomTrendData(), [])
  const color = chartColors[index % chartColors.length]
  const areaFillColor = color.replace("0.8", "0.2") // 区域填充颜色

  // 配置 Line 图表
  const config = useMemo(
    () => ({
      data: trendData,
      xField: "date",
      yField: "value",
      color: color,
      lineStyle: {
        lineWidth: 2,
        stroke: color
      },
      area: {
        style: {
          fill: areaFillColor // 区域填充
        }
      },
      point: {
        size: 0, // 隐藏点
        shape: "circle"
      },
      xAxis: {
        label: null, // 隐藏x轴标签
        line: null, // 隐藏x轴线
        tickLine: null // 隐藏x轴刻度线
      },
      yAxis: {
        label: null, // 隐藏y轴标签
        line: null, // 隐藏y轴线
        tickLine: null, // 隐藏y轴刻度线
        grid: null // 隐藏网格线
      },
      tooltip: false, // 隐藏提示框
      smooth: true, // 平滑曲线
      height: 80,
      width: 180,
      padding: 0,
      autoFit: false,
      animation: false // 禁用动画以获得更好的性能
    }),
    [trendData, color, areaFillColor]
  )

  return (
    <div className="absolute z-0 -bottom-2 -right-4 opacity-90" style={{ width: 100, height: 60 }}>
      <Line {...config} />
    </div>
  )
}

export default MiniTrendChart
