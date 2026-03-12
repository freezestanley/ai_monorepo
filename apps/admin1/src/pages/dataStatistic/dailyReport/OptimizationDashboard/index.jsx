import React, { useCallback } from "react"
import { Row, Col, Space } from "antd"
import {
  Overview,
  TrendChart,
  CompletionRateChart,
  TypeChart,
  BusinessTypeChart
} from "./components/Charts"
import OptimizationSearchForm from "./components/SearchForm"
import "./index.less"
import RangeTimePicker from "@/components/RangeTime"

function OptimizationDashboard({
  form,
  groupList,
  botList,
  startTime,
  endTime,
  botNo,
  iframeStyle,
  watch,
  onSearch
}) {
  return (
    <div className="pb-[20px]">
      <div className="mb-4 flex justify-end">
        <RangeTimePicker
          defaultValue={[startTime, endTime]}
          allowClear={false}
          rangeDays={30}
          onChange={useCallback(
            (dates) => {
              if (dates && dates[0] && dates[1]) {
                form.setValues({
                  startTime: dates[0],
                  endTime: dates[1]
                })
                onSearch(form.getValues())
              }
            },
            [form, onSearch]
          )}
        />
      </div>
      <Space direction="vertical" size="large" style={{ display: "flex", width: "100%" }}>
        <Overview botNo={botNo} startTime={startTime} endTime={endTime} />
        <TrendChart />
        <Row gutter={16}>
          <Col span={12}>
            <CompletionRateChart />
          </Col>
          <Col span={12}>
            <TypeChart />
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>
            <BusinessTypeChart />
          </Col>
        </Row>
      </Space>
    </div>
  )
}

export default OptimizationDashboard
