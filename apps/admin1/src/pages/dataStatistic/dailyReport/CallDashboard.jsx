import React from "react"
import { Space } from "antd"
import CallTrend from "./ChartsComponents/CallTrend"
import ProportionCircular from "./ChartsComponents/ProportionCircular"
import CommonColumn from "./ChartsComponents/CommonColumn"
import NumberPanel from "./ChartsComponents/NumberPanel"

const CallDashboard = ({ startTime, endTime }) => {
  return (
    <Space direction="vertical" size="large" style={{ display: "flex" }}>
      <NumberPanel />
      <CallTrend />
      <div style={{ display: "flex", gap: 16 }}>
        <ProportionCircular />
        <ProportionCircular />
      </div>
      <div style={{ display: "flex", gap: 16 }}>
        <CommonColumn />
        <CommonColumn />
      </div>
    </Space>
  )
}

export default CallDashboard
