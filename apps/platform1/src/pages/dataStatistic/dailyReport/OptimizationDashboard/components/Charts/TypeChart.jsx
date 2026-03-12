import { useState } from "react"
import { Card } from "antd"
import { Pie } from "@ant-design/plots"
import ChartPeriod from "./ChartPeriod"

function OptimizationTypeChart() {
  const [period, setPeriod] = useState("月")
  const data = [
    { type: "已优化", value: 279, color: "#f59e0b" },
    { type: "待审核", value: 50, color: "#10b981" },
    { type: "待受理", value: 30, color: "#3b82f6" },
    { type: "优化中", value: 20, color: "#8b5cf6" }
  ]

  /** @type {import('@ant-design/plots').PieConfig} */
  const config = {
    data,
    angleField: "value",
    colorField: "type",
    radius: 0.8,
    innerRadius: 0.6,
    label: {
      type: "inner",
      offset: "-50%",
      content: "{value}",
      style: {
        textAlign: "center",
        fontSize: 14
      }
    },
    statistic: {
      title: {
        content: "已优化",
        style: {
          fontSize: "16px"
        }
      },
      content: {
        content: "279",
        style: {
          fontSize: "24px"
        }
      }
    },
    color: ["#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"],
    legend: {
      layout: "horizontal",
      position: "bottom"
    }
  }

  return (
    <Card
      title="优化单状态占比"
      extra={<ChartPeriod options={["周", "月", "年"]} value={period} onChange={setPeriod} />}
    >
      <Pie {...config} />
    </Card>
  )
}

export default OptimizationTypeChart
