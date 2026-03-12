import { useState } from "react"
import { Card } from "antd"
import { Pie } from "@ant-design/plots"
import ChartPeriod from "./ChartPeriod"

function BusinessTypeChart() {
  const [period, setPeriod] = useState("月")
  const data = [
    { type: "未完成", value: 70, color: "#8b5cf6" },
    { type: "基础", value: 50, color: "#3b82f6" },
    { type: "内容生成", value: 40, color: "#10b981" },
    { type: "其他", value: 20, color: "#f59e0b" }
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
        content: "AI层级",
        style: {
          fontSize: "16px"
        }
      },
      content: {
        content: "251",
        style: {
          fontSize: "24px"
        }
      }
    },
    color: ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b"],
    legend: {
      layout: "horizontal",
      position: "bottom"
    }
  }

  return (
    <Card
      title="业务类型占比"
      extra={<ChartPeriod options={["周", "月", "年"]} value={period} onChange={setPeriod} />}
    >
      <Pie {...config} />
    </Card>
  )
}

export default BusinessTypeChart
