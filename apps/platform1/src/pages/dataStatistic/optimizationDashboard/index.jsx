import React, { useState, useMemo } from "react"
import { Card, Row, Col, Space, Tooltip } from "antd"
import { Line, Pie, Bar } from "@ant-design/plots"
import { SearchForm } from "form-render"
import RangeTimePicker from "@/components/RangeTime"
import getSchema from "../dailyReport/schema"
import "./index.less"
import { QuestionCircleOutlined } from "@ant-design/icons"
import {
  useFetchOptimizationOverview,
  useFetchOptimizationOrderMetrics,
  useFetchOptimizationOrderPieChartMetrics,
  useFetchOptimizationOrderProcessorMetrics
} from "@/api/optimize"
import dayjs from "dayjs"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"
import { getChartColors, getOptimizationStatusColor } from "../callLogs/utils"

const commonColors = getChartColors()

function ChartPeriod({ options = ["DAY", "WEEK", "MONTH"], value, onChange }) {
  const periodMap = {
    DAY: "天",
    WEEK: "周",
    MONTH: "月"
  }

  return (
    <div className="chart-period">
      {options.map((option) => (
        <span
          key={option}
          className={value === option ? "active" : ""}
          onClick={() => onChange?.(option)}
        >
          {periodMap[option]}
        </span>
      ))}
    </div>
  )
}

function OptimizationOverview({ botNo, startTime, endTime }) {
  const formattedStartTime = startTime ? dayjs(startTime).format("YYYY-MM-DD") : undefined
  const formattedEndTime = endTime ? dayjs(endTime).format("YYYY-MM-DD") : undefined

  const { data } = useFetchOptimizationOverview({
    botNo,
    startTime: formattedStartTime,
    endTime: formattedEndTime
  })

  // 处理百分比的展示，避免 NaN
  const formatPercentage = (value) => {
    if (!value && value !== 0) return "0.00%"
    return `${(value * 100).toFixed(2)}%`
  }

  return (
    <div>
      <div className="flex items-center mb-4">
        <h4 className="text-[14px] font-medium text-[#1F2937] m-0">数据总览</h4>
        <Tooltip
          title={
            <div>
              创建优化单总数：对应时间范围内创建的优化单总数
              <br />
              已审核优化单数：对应时间范围内创建的优化单中待受理及未通过状态单数
              <br />
              已解决优化单数：对应时间范围内创建的优化单中已优化及搁置状态单数
              <br />
              审核完成率：[已审核优化单数]/[创建优化单总数]
              <br />
              审核平均时效：[已审核优化单]审核时效总和/[已审核优化单数]
              <br />
              解决完成率：[已解决优化单数]/[创建优化单总数]
              <br />
              解决平均时效：[已解决优化单]解决时效总和/[已解决优化单数]
            </div>
          }
        >
          <QuestionCircleOutlined className="ml-2 text-[14px] text-[#6B7280] cursor-help" />
        </Tooltip>
      </div>
      <div className="grid grid-cols-4 gap-6">
        {/* 创建优化总数 */}
        <div
          className="flex flex-col justify-center p-6"
          style={{
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "#E5E7EB",
            borderRadius: "12px"
          }}
        >
          <div className="text-[14px] text-[#6B7280]">创建优化单总数</div>
          <div className="text-[32px] font-medium text-[#1F2937] mt-2">
            {data?.newCreatedTotal || 0}
          </div>
        </div>

        {/* 已处理优化数据 */}
        <div
          className="flex flex-col justify-center p-6"
          style={{
            border: "1px solid #E5E7EB",
            borderRadius: "12px"
          }}
        >
          <div>
            <div className="text-[14px] text-[#6B7280]">已审核优化单数</div>
            <div className="text-[32px] font-medium text-[#1F2937] mt-2">
              {data?.hasExaminedTotal || 0}
            </div>
          </div>
          <div className="my-4 h-[1px] bg-[#E5E7EB]"></div>
          <div>
            <div className="text-[14px] text-[#6B7280]">已解决优化单数</div>
            <div className="text-[32px] font-medium text-[#1F2937] mt-2">
              {data?.hasProcessedTotal || 0}
            </div>
          </div>
        </div>

        {/* 审核完成率 */}
        <div
          className="flex flex-col justify-center p-6"
          style={{
            border: "1px solid #E5E7EB",
            borderRadius: "12px"
          }}
        >
          <div className="text-[14px] text-[#6B7280]">审核完成率</div>
          <div className="text-[32px] font-medium text-[#1F2937] mt-2">
            {formatPercentage(data?.hasExaminedPercentage)}
          </div>
          <div className="my-4 h-[1px] bg-[#E5E7EB]"></div>
          <div>
            <div className="text-[14px] text-[#6B7280]">审核平均耗时</div>
            <div className="text-[32px] font-medium text-[#1F2937] mt-2">
              {data?.avgExaminedCost || "-"}
            </div>
          </div>
        </div>

        {/* 解决完成率 */}
        <div
          className="flex flex-col justify-center p-6"
          style={{
            border: "1px solid #E5E7EB",
            borderRadius: "12px"
          }}
        >
          <div className="text-[14px] text-[#6B7280]">解决完成率</div>
          <div className="text-[32px] font-medium text-[#1F2937] mt-2">
            {formatPercentage(data?.hasProcessedPercentage)}
          </div>
          <div className="my-4 h-[1px] bg-[#E5E7EB]"></div>
          <div>
            <div className="text-[14px] text-[#6B7280]">解决平均耗时</div>
            <div className="text-[32px] font-medium text-[#1F2937] mt-2">
              {data?.avgProcessedCost || "-"}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function OptimizationTrend({ botNo, startTime, endTime }) {
  const [period, setPeriod] = useState("DAY")
  const { data: metricsData } = useFetchOptimizationOrderMetrics({
    botNo,
    startTime: dayjs(startTime).format("YYYY-MM-DD"),
    endTime: dayjs(endTime).format("YYYY-MM-DD"),
    metricCycle: period,
    metrics: ["NEW_CREATED_TOTAL", "HAS_PROCESSED_TOTAL", "NOT_PROCESSED_TOTAL"]
  })

  const transformedData = useMemo(() => {
    if (!metricsData) return []
    return metricsData.map((item) => ({
      date: item.name,
      value: item.value,
      category:
        item.type === "NEW_CREATED_TOTAL"
          ? "创建优化单数"
          : item.type === "HAS_PROCESSED_TOTAL"
            ? "已解决单数"
            : "未解决单数"
    }))
  }, [metricsData])

  /** @type {import('@ant-design/plots').LineConfig} */
  const config = {
    data: transformedData,
    xField: "date",
    yField: "value",
    seriesField: "category",
    appendPadding: [20, 20, 40, 20],
    legend: {
      position: "bottom",
      layout: "horizontal",
      marker: (text, index, item) => {
        return {
          symbol: "square",
          style: {
            r: 4,
            lineWidth: 0,
            fill: commonColors[index]
          }
        }
      },
      itemName: {
        style: {
          fill: "#6B7280",
          fontSize: 12,
          fontWeight: 400
        }
      },
      offsetY: 0
    },
    smooth: false,
    lineStyle: {
      lineWidth: 1.5
    },
    color: commonColors,
    yAxis: {
      grid: {
        line: {
          style: {
            stroke: "#E5E7EB",
            lineWidth: 1,
            lineDash: [4, 4]
          }
        }
      },
      label: {
        style: {
          fill: "#6B7280",
          fontSize: 12
        }
      }
    },
    xAxis: {
      line: {
        style: {
          stroke: "#E5E7EB",
          lineWidth: 1
        }
      },
      label: {
        style: {
          fill: "#6B7280",
          fontSize: 12
        }
      },
      tickLine: null
    },
    tooltip: {
      showMarkers: true,
      marker: {
        lineWidth: 2
      }
    },
    point: {
      size: 4,
      shape: "circle",
      style: {
        stroke: "#fff",
        lineWidth: 2
      }
    }
  }

  return (
    <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #E5E7EB" }}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[14px] font-medium text-[#1F2937] m-0">优化单处理进度</h4>
        <ChartPeriod options={["DAY", "WEEK", "MONTH"]} value={period} onChange={setPeriod} />
      </div>
      <Line {...config} height={300} />
    </div>
  )
}

function AuditRateChart({ botNo, startTime, endTime }) {
  const [period, setPeriod] = useState("DAY")
  const { data: metricsData } = useFetchOptimizationOrderMetrics({
    botNo,
    startTime: dayjs(startTime).format("YYYY-MM-DD"),
    endTime: dayjs(endTime).format("YYYY-MM-DD"),
    metricCycle: period,
    metrics: ["HAS_EXAMINED_PERCENTAGE"]
  })

  const transformedData = useMemo(() => {
    if (!metricsData) return []
    return metricsData.map((item) => ({
      month: item.name,
      type: "完成率",
      rate: item.value * 100
    }))
  }, [metricsData])

  /** @type {import('@ant-design/plots').LineConfig} */
  const config = {
    data: transformedData,
    xField: "month",
    yField: "rate",
    seriesField: "type",
    smooth: false,
    appendPadding: [20, 20, 40, 20],
    color: "#22D3BB",
    lineStyle: {
      lineWidth: 1.5
    },
    point: {
      size: 4,
      shape: "circle",
      style: {
        fill: "#22D3BB",
        stroke: "#fff",
        lineWidth: 2
      }
    },
    yAxis: {
      grid: {
        line: {
          style: {
            stroke: "#E5E7EB",
            lineWidth: 1,
            lineDash: [4, 4]
          }
        }
      },
      label: {
        style: {
          fill: "#6B7280",
          fontSize: 12
        },
        formatter: (v) => `${v}%`
      }
    },
    xAxis: {
      line: {
        style: {
          stroke: "#E5E7EB",
          lineWidth: 1
        }
      },
      label: {
        style: {
          fill: "#6B7280",
          fontSize: 12
        }
      },
      tickLine: null
    },
    tooltip: {
      showMarkers: true,
      marker: {
        lineWidth: 2
      },
      formatter: (datum) => {
        return { name: "完成率", value: datum.rate.toFixed(2) + "%" }
      }
    },
    legend: {
      position: "bottom",
      layout: "horizontal",
      marker: null,
      itemName: null,
      offsetY: 0
    },
    label: null
  }

  return (
    <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #E5E7EB" }}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[14px] font-medium text-[#1F2937] m-0">审核完成率</h4>
        <ChartPeriod options={["DAY", "WEEK", "MONTH"]} value={period} onChange={setPeriod} />
      </div>
      <Line {...config} height={300} />
    </div>
  )
}

function SolutionRateChart({ botNo, startTime, endTime }) {
  const [period, setPeriod] = useState("DAY")
  const { data: metricsData } = useFetchOptimizationOrderMetrics({
    botNo,
    startTime: dayjs(startTime).format("YYYY-MM-DD"),
    endTime: dayjs(endTime).format("YYYY-MM-DD"),
    metricCycle: period,
    metrics: ["HAS_PROCESSED_PERCENTAGE"]
  })

  const transformedData = useMemo(() => {
    if (!metricsData) return []
    return metricsData.map((item) => ({
      month: item.name,
      type: "完成率",
      rate: item.value * 100
    }))
  }, [metricsData])

  /** @type {import('@ant-design/plots').LineConfig} */
  const config = {
    data: transformedData,
    xField: "month",
    yField: "rate",
    seriesField: "type",
    smooth: false,
    appendPadding: [20, 20, 40, 20],
    color: "#22D3BB",
    lineStyle: {
      lineWidth: 1.5
    },
    point: {
      size: 4,
      shape: "circle",
      style: {
        fill: "#22D3BB",
        stroke: "#fff",
        lineWidth: 2
      }
    },
    yAxis: {
      grid: {
        line: {
          style: {
            stroke: "#E5E7EB",
            lineWidth: 1,
            lineDash: [4, 4]
          }
        }
      },
      label: {
        style: {
          fill: "#6B7280",
          fontSize: 12
        },
        formatter: (v) => `${v}%`
      }
    },
    xAxis: {
      line: {
        style: {
          stroke: "#E5E7EB",
          lineWidth: 1
        }
      },
      label: {
        style: {
          fill: "#6B7280",
          fontSize: 12
        }
      },
      tickLine: null
    },
    tooltip: {
      showMarkers: true,
      marker: {
        lineWidth: 2
      },
      formatter: (datum) => {
        return { name: "完成率", value: datum.rate.toFixed(2) + "%" }
      }
    },
    legend: {
      position: "bottom",
      layout: "horizontal",
      marker: null,
      itemName: null,
      offsetY: 0
    },
    label: null
  }

  return (
    <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #E5E7EB" }}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[14px] font-medium text-[#1F2937] m-0">解决完成率</h4>
        <ChartPeriod options={["DAY", "WEEK", "MONTH"]} value={period} onChange={setPeriod} />
      </div>
      <Line {...config} height={300} />
    </div>
  )
}

function OptimizationTypeChart({ botNo, startTime, endTime }) {
  const { data: metricsData } = useFetchOptimizationOrderPieChartMetrics({
    botNo,
    startTime: dayjs(startTime).format("YYYY-MM-DD"),
    endTime: dayjs(endTime).format("YYYY-MM-DD"),
    metricCycle: "DAY",
    metrics: ["STATUS_PIE_CHART"]
  })

  const [transformedData, color] = useMemo(() => {
    if (!metricsData?.[0]?.items) return [[], []]
    const c = []
    const d = metricsData[0].items.map((item) => {
      c.push(getOptimizationStatusColor(item.name))
      return {
        type: item.extraInfo,
        value: Math.round(item.value * metricsData[0].totalItemValue)
      }
    })
    return [d, c]
  }, [metricsData])
  console.log("transformedData:", transformedData)
  /** @type {import('@ant-design/plots').PieConfig} */
  const pieChartConfig = {
    data: transformedData,
    angleField: "value",
    colorField: "type",
    radius: 0.8,
    innerRadius: 0.6,
    color,
    label: {
      type: "inner",
      offset: "-50%",
      content: "{percentage}",
      style: {
        fill: "#fff",
        fontSize: 12,
        textAlign: "center"
      }
    },
    tooltip: {
      formatter: (datum) => {
        const percentage = (
          (datum.value / transformedData.reduce((sum, d) => sum + d.value, 0)) *
          100
        ).toFixed(1)
        return {
          name: datum.type,
          value: `${percentage}% (${datum.value})`
        }
      }
    },
    statistic: {
      title: {
        content: "总计",
        style: {
          fontSize: "12px",
          color: "#475467",
          fontWeight: 300
        },
        offsetY: 20
      },
      content: {
        style: {
          fontSize: "24px",
          color: "#1F2937",
          fontWeight: "500"
        },
        content: metricsData?.[0]?.totalItemValue || 0,
        offsetY: -20
      }
    },
    legend: {
      layout: "vertical",
      position: "right",
      itemName: {
        formatter: (text, item) => {
          const value = transformedData.find((d) => d.type === text)?.value || 0
          return `${text} ${value}`
        },
        style: {
          fill: "#6B7280",
          fontSize: 12,
          fontWeight: 400
        }
      },
      marker: {
        symbol: "square",
        style: {
          r: 4,
          lineWidth: 2
        }
      },
      offsetX: 20,
      padding: [0, 24, 0, 0]
    }
  }

  return (
    <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #E5E7EB" }}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[14px] font-medium text-[#1F2937] m-0">优化单状态占比</h4>
      </div>
      {transformedData.length > 0 ? (
        <Pie {...pieChartConfig} height={300} />
      ) : (
        <div
          style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <CustomEmpty description="暂无数据" />
        </div>
      )}
    </div>
  )
}

function BusinessTypeChart({ botNo, startTime, endTime }) {
  const { data: metricsData } = useFetchOptimizationOrderPieChartMetrics({
    botNo,
    startTime: dayjs(startTime).format("YYYY-MM-DD"),
    endTime: dayjs(endTime).format("YYYY-MM-DD"),
    metricCycle: "DAY",
    metrics: ["BIZ_SOURCE_PIE_CHART"]
  })

  const transformedData = useMemo(() => {
    if (!metricsData?.[0]?.items) return []
    return metricsData[0].items.map((item) => ({
      type: item.extraInfo,
      value: Math.round(item.value * metricsData[0].totalItemValue)
    }))
  }, [metricsData])

  /** @type {import('@ant-design/plots').PieConfig} */
  const pieChartConfig = {
    data: transformedData,
    angleField: "value",
    colorField: "type",
    radius: 0.8,
    innerRadius: 0.6,
    color: commonColors,
    label: {
      type: "inner",
      offset: "-50%",
      content: "{percentage}",
      style: {
        fill: "#fff",
        fontSize: 12,
        textAlign: "center"
      }
    },
    tooltip: {
      formatter: (datum) => {
        const percentage = (
          (datum.value / transformedData.reduce((sum, d) => sum + d.value, 0)) *
          100
        ).toFixed(1)
        return {
          name: datum.type,
          value: `${percentage}% (${datum.value})`
        }
      }
    },
    statistic: {
      title: {
        content: "总计",
        style: {
          fontSize: "12px",
          color: "#475467",
          fontWeight: 300
        },
        offsetY: 20
      },
      content: {
        style: {
          fontSize: "24px",
          color: "#1F2937",
          fontWeight: "500"
        },
        content: metricsData?.[0]?.totalItemValue || 0,
        offsetY: -20
      }
    },
    legend: {
      layout: "vertical",
      position: "right",
      itemName: {
        formatter: (text, item) => {
          const value = transformedData.find((d) => d.type === text)?.value || 0
          return `${text} ${value}`
        },
        style: {
          fill: "#6B7280",
          fontSize: 12,
          fontWeight: 400
        }
      },
      marker: {
        symbol: "square",
        style: {
          r: 4,
          lineWidth: 2
        }
      },
      offsetX: 20,
      padding: [0, 24, 0, 0]
    }
  }

  return (
    <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #E5E7EB" }}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[14px] font-medium text-[#1F2937] m-0">业务类型占比</h4>
      </div>
      {transformedData.length > 0 ? (
        <Pie {...pieChartConfig} height={300} />
      ) : (
        <div
          style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <CustomEmpty description="暂无数据" />
        </div>
      )}
    </div>
  )
}

function ErrorTypeChart({ botNo, startTime, endTime }) {
  const { data: metricsData } = useFetchOptimizationOrderPieChartMetrics({
    botNo,
    startTime: dayjs(startTime).format("YYYY-MM-DD"),
    endTime: dayjs(endTime).format("YYYY-MM-DD"),
    metricCycle: "DAY",
    metrics: ["REASON_PIE_CHART"]
  })

  const transformedData = useMemo(() => {
    if (!metricsData?.[0]?.items) return []
    return metricsData[0].items.map((item) => ({
      type: item.extraInfo,
      value: Math.round(item.value * metricsData[0].totalItemValue)
    }))
  }, [metricsData])

  /** @type {import('@ant-design/plots').PieConfig} */
  const pieChartConfig = {
    data: transformedData,
    angleField: "value",
    colorField: "type",
    radius: 0.8,
    innerRadius: 0.6,
    color: commonColors,
    label: {
      type: "inner",
      offset: "-50%",
      content: "{percentage}",
      style: {
        fill: "#fff",
        fontSize: 12,
        textAlign: "center"
      }
    },
    tooltip: {
      formatter: (datum) => {
        const percentage = (
          (datum.value / transformedData.reduce((sum, d) => sum + d.value, 0)) *
          100
        ).toFixed(1)
        return {
          name: datum.type,
          value: `${percentage}% (${datum.value})`
        }
      }
    },
    statistic: {
      title: {
        content: "总计",
        style: {
          fontSize: "12px",
          color: "#475467",
          fontWeight: 300
        },
        offsetY: 20
      },
      content: {
        style: {
          fontSize: "24px",
          color: "#1F2937",
          fontWeight: "500"
        },
        content: metricsData?.[0]?.totalItemValue || 0,
        offsetY: -20
      }
    },
    legend: {
      layout: "vertical",
      position: "right",
      itemName: {
        formatter: (text, item) => {
          const value = transformedData.find((d) => d.type === text)?.value || 0
          return `${text} ${value}`
        },
        style: {
          fill: "#6B7280",
          fontSize: 12,
          fontWeight: 400
        }
      },
      marker: {
        symbol: "square",
        style: {
          r: 4,
          lineWidth: 2
        }
      },
      offsetX: 20,
      padding: [0, 24, 0, 0]
    }
  }

  return (
    <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #E5E7EB" }}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[14px] font-medium text-[#1F2937] m-0">错误类型占比</h4>
      </div>
      {transformedData.length > 0 ? (
        <Pie {...pieChartConfig} height={300} />
      ) : (
        <div
          style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <CustomEmpty description="暂无数据" />
        </div>
      )}
    </div>
  )
}

function OptimizationProgress({ botNo, startTime, endTime }) {
  const { data: metricsData } = useFetchOptimizationOrderProcessorMetrics({
    botNo,
    startTime: dayjs(startTime).format("YYYY-MM-DD"),
    endTime: dayjs(endTime).format("YYYY-MM-DD")
  })

  const [transformedData, color] = useMemo(() => {
    if (!metricsData) return [[], []]
    const d = metricsData.flatMap((item) =>
      item.statusGroup.map((status) => ({
        title: item.name,
        type: status.statusDisplay,
        value: status.total
      }))
    )
    const c = getOptimizationStatusColor()
    return [d, c]
  }, [metricsData])

  /** @type {import('@ant-design/plots').BarConfig} */
  const config = {
    data: transformedData,
    isStack: true,
    xField: "value",
    yField: "title",
    seriesField: "type",
    appendPadding: [0, 0, 40, 0],
    label: {
      position: "middle",
      style: {
        fill: "#fff",
        fontSize: 12
      }
    },
    legend: {
      layout: "horizontal",
      position: "bottom",
      marker: {
        symbol: "square",
        style: {
          r: 4,
          lineWidth: 2
        }
      },
      itemName: {
        style: {
          fill: "#6B7280",
          fontSize: 12,
          fontWeight: 400
        }
      },
      offsetY: 0
    },
    color,
    tooltip: {
      formatter: (datum) => {
        const total = transformedData
          .filter((d) => d.title === datum.title)
          .reduce((sum, d) => sum + d.value, 0)
        const percentage = ((datum.value / total) * 100).toFixed(1)
        return {
          name: datum.type,
          value: `${datum.value} (${percentage}%)`
        }
      }
    },
    yAxis: {
      label: {
        style: {
          fill: "#6B7280",
          fontSize: 12
        }
      },
      line: null,
      tickLine: null
    },
    xAxis: {
      grid: {
        line: {
          style: {
            stroke: "#E5E7EB",
            lineWidth: 1,
            lineDash: [4, 4]
          }
        }
      },
      label: {
        style: {
          fill: "#6B7280",
          fontSize: 12
        }
      }
    }
  }

  return (
    <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #E5E7EB" }}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[14px] font-medium text-[#1F2937] m-0">受理人优化进度</h4>
      </div>
      {transformedData.length > 0 ? (
        <Bar {...config} height={400} />
      ) : (
        <div
          style={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <CustomEmpty description="暂无数据" />
        </div>
      )}
    </div>
  )
}

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
      <Space direction="vertical" size="large" style={{ display: "flex", width: "100%" }}>
        <OptimizationOverview botNo={botNo} startTime={startTime} endTime={endTime} />
        <OptimizationTrend botNo={botNo} startTime={startTime} endTime={endTime} />
        <Row gutter={16}>
          <Col span={12}>
            <AuditRateChart botNo={botNo} startTime={startTime} endTime={endTime} />
          </Col>
          <Col span={12}>
            <SolutionRateChart botNo={botNo} startTime={startTime} endTime={endTime} />
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <OptimizationTypeChart botNo={botNo} startTime={startTime} endTime={endTime} />
          </Col>
          <Col span={12}>
            <BusinessTypeChart botNo={botNo} startTime={startTime} endTime={endTime} />
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>
            <ErrorTypeChart botNo={botNo} startTime={startTime} endTime={endTime} />
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>
            <OptimizationProgress botNo={botNo} startTime={startTime} endTime={endTime} />
          </Col>
        </Row>
      </Space>
    </div>
  )
}

export default OptimizationDashboard
