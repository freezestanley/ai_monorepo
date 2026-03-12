import { useState } from "react"
import { Card } from "antd"
import { Line } from "@ant-design/plots"
import ChartPeriod from "./ChartPeriod"

function OptimizationTrend() {
  const [period, setPeriod] = useState("天")
  const data = [
    { date: "7/1", category: "优化单数", value: 787 },
    { date: "7/1", category: "已处理", value: 473 },
    { date: "7/1", category: "已完成", value: 300 },
    { date: "7/2", category: "优化单数", value: 467 },
    { date: "7/2", category: "已处理", value: 367 },
    { date: "7/2", category: "已完成", value: 175 },
    { date: "7/3", category: "优化单数", value: 932 },
    { date: "7/3", category: "已处理", value: 457 },
    { date: "7/3", category: "已完成", value: 278 }
  ]

  /** @type {import('@ant-design/plots').LineConfig} */
  const config = {
    data,
    xField: "date",
    yField: "value",
    seriesField: "category",
    legend: {
      layout: "horizontal",
      position: "top"
    },
    smooth: true,
    color: ["#8b5cf6", "#3b82f6", "#10b981"],
    yAxis: {
      label: {
        formatter: (v) => `${v}`
      }
    },
    tooltip: {
      showMarkers: false
    },
    point: {
      size: 4,
      shape: "circle",
      style: {
        fillOpacity: 1
      }
    }
  }

  return (
    <Card title="优化单处理进度" extra={<ChartPeriod value={period} onChange={setPeriod} />}>
      <Line {...config} />
    </Card>
  )
}

export default OptimizationTrend
