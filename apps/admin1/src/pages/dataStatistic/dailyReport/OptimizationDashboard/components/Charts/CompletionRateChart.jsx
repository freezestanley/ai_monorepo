import { useState } from "react"
import { Card } from "antd"
import { Line } from "@ant-design/plots"
import ChartPeriod from "./ChartPeriod"

function CompletionRateChart() {
  const [period, setPeriod] = useState("月")
  const data = [
    { month: "1月", rate: 76.85 },
    { month: "2月", rate: 62.8 },
    { month: "3月", rate: 84.58 },
    { month: "4月", rate: 75.45 },
    { month: "5月", rate: 89.2 },
    { month: "6月", rate: 85.35 },
    { month: "7月", rate: 79.45 },
    { month: "8月", rate: 70.25 },
    { month: "9月", rate: 88.45 },
    { month: "10月", rate: 92.35 },
    { month: "11月", rate: 95.45 },
    { month: "12月", rate: 98.35 }
  ]

  /** @type {import('@ant-design/plots').LineConfig} */
  const config = {
    data,
    xField: "month",
    yField: "rate",
    smooth: true,
    color: "#8b5cf6",
    point: {
      size: 4,
      shape: "circle",
      style: {
        fill: "#8b5cf6",
        stroke: "#fff",
        lineWidth: 2
      }
    },
    yAxis: {
      label: {
        formatter: (v) => `${v}%`
      }
    },
    tooltip: {
      showMarkers: false,
      formatter: (datum) => {
        return { name: "完成率", value: datum.rate + "%" }
      }
    }
  }

  return (
    <Card
      title="审核完成率"
      extra={<ChartPeriod options={["周", "月", "年"]} value={period} onChange={setPeriod} />}
    >
      <Line {...config} />
    </Card>
  )
}

export default CompletionRateChart
