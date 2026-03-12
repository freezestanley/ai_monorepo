import React, { useState, useEffect, useMemo } from "react"
import { Typography, Tabs, Segmented, Table, Tooltip, Spin, Button, message } from "antd"
import { Line, Pie } from "@ant-design/plots"
import { InfoCircleOutlined } from "@ant-design/icons"
import CommonColumn from "../../ChartsComponents/CommonColumn"
import ModelBillingChart from "../../ChartsComponents/ModelBillingChart"
// import CustomEmpty from "@/components/CustomEmpty"
import {
  fetchBotUsageOverview,
  fetchModelTotalUsageTrend,
  fetchSkillCallsTrend,
  fetchPerModelUsageTrend,
  fetchModelUsageDetails,
  fetchModelUsagePieChart,
  fetchPieChartOfPerSkillUsage,
  queryModelBilling
} from "@/api/dailyReport/api.jsx"
import dayjs from "dayjs"
import { getTokenAndServiceName } from "@/api/sso"
import { botPrefix } from "@/constants"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"
import { DownloadOutlined } from "@ant-design/icons"
import { isStudio } from "@/config.env"
import ChartPeriod from "../../OptimizationDashboard/components/Charts/ChartPeriod"
import { adjustQueryDateRange } from "@/utils/dateRangeAdjuster"

function IframeDashboard({ botNo, startTime, endTime, studioenv }) {
  // botNo = "jKxpZBsIPnr"
  const [loading, setLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [trendLoading, setTrendLoading] = useState(false)
  const [tableLoading, setTableLoading] = useState(false)
  const [top10Loading, setTop10Loading] = useState(false)
  const [periodType, setPeriodType] = useState("日")
  const [top10PeriodType, setTop10PeriodType] = useState("日")
  const [dateRange, setDateRange] = useState({
    startTime: dayjs(startTime).format("YYYY-MM-DD"),
    endTime: dayjs(endTime).format("YYYY-MM-DD")
  })
  const [overviewData, setOverviewData] = useState({
    activeSkill: { count: 0, trendValue: 0 },
    skillCall: { count: 0, trendValue: 0 },
    modelUsage: { count: 0, trendValue: 0 },
    activeUser: { count: 0, trendValue: 0 }
  })
  const [skillCallsTrendData, setSkillCallsTrendData] = useState([])
  const [modelUsageTrendData, setModelUsageTrendData] = useState([])
  const [perModelUsageData, setPerModelUsageData] = useState([])
  const [modelUsageDetails, setModelUsageDetails] = useState({
    data: [],
    total: 0
  })
  const [modelUsageTableParams, setModelUsageTableParams] = useState({
    pageSize: 10,
    pageNum: 1,
    sort: [
      {
        field: "metricDate",
        asc: false
      }
    ]
  })
  const [pieChartData, setPieChartData] = useState([])
  const [totalTokenValue, setTotalTokenValue] = useState(0)
  const [skillPieData, setSkillPieData] = useState([])
  const [totalSkillValue, setTotalSkillValue] = useState(0)
  const [modelBillingData, setModelBillingData] = useState({})
  const [totalModelBilling, setTotalModelBilling] = useState(0)
  const [adjustedStartTime, setAdjustedStartTime] = useState(null)
  const [adjustedEndTime, setAdjustedEndTime] = useState(null)

  const columns = [
    {
      title: "序号",
      dataIndex: "id",
      key: "id",
      width: 60,
      render: (_, __, index) =>
        (modelUsageTableParams.pageNum - 1) * modelUsageTableParams.pageSize + index + 1
    },
    {
      title: "日期",
      dataIndex: "metricDate",
      key: "metricDate",
      width: 120,
      render: (text) => dayjs(text).format("YYYY-MM-DD")
    },
    {
      title: "模型",
      dataIndex: "modelName",
      key: "modelName",
      width: 180,
      filters: modelUsageDetails.data
        .map((item) => ({ text: item.modelName, value: item.modelName }))
        .filter((item, index, self) => index === self.findIndex((t) => t.value === item.value)),
      onFilter: (value, record) => record.modelName === value,
      filterSearch: true
    },
    {
      title: "总调用量",
      dataIndex: "totalToken",
      key: "totalToken",
      sorter: true,
      width: 120
    },
    {
      title: "上行Token",
      dataIndex: "promptToken",
      key: "promptToken",
      sorter: true,
      width: 120
    },
    {
      title: "下行Token",
      dataIndex: "completionToken",
      key: "completionToken",
      sorter: true,
      width: 120
    }
  ]

  const periodTypeMap = {
    日: "day",
    周: "week",
    月: "month"
  }

  // 监听日期范围和botNo变化，更新数据
  useEffect(() => {
    if (!botNo) return

    const formattedDateRange = {
      startTime: dayjs(startTime).format("YYYY-MM-DD"),
      endTime: dayjs(endTime).format("YYYY-MM-DD")
    }
    setDateRange(formattedDateRange)

    // 获取概览数据
    const fetchData = async () => {
      try {
        setLoading(true)
        const [
          overviewResponse,
          modelUsageResponse,
          pieChartResponse,
          skillPieResponse,
          modelBillingResponse
        ] = await Promise.all([
          // 获取概览数据
          fetchBotUsageOverview({
            botNo,
            startTime: formattedDateRange.startTime,
            endTime: formattedDateRange.endTime
          }),
          // 获取模型调用Token量明细
          fetchModelUsageDetails({
            botNo,
            startTime: formattedDateRange.startTime,
            endTime: formattedDateRange.endTime,
            ...modelUsageTableParams
          }),
          // 获取模型调用总Token占比
          fetchModelUsagePieChart({
            botNo,
            startTime: formattedDateRange.startTime,
            endTime: formattedDateRange.endTime
          }),
          // 获取工作流调用次数占比
          fetchPieChartOfPerSkillUsage({
            botNo,
            startTime: formattedDateRange.startTime,
            endTime: formattedDateRange.endTime
          }),
          // 获取模型计费数据
          // 在内部处理时间调整
          (async () => {
            console.log("bot", botNo)
            // 如果没有 botNo，则不调用计费接口
            if (!botNo) {
              return {
                modelBillingData: {},
                totalModelBilling: 0
              }
            }

            const { adjustedStartTime, adjustedEndTime, isValid, errorMsg } = adjustQueryDateRange(
              dayjs(formattedDateRange.startTime),
              dayjs(formattedDateRange.endTime)
            )

            // 如果时间范围无效，返回错误
            if (!isValid) {
              return {
                modelBillingData: {
                  success: false,
                  msg: errorMsg
                },
                totalModelBilling: 0
              }
            }

            // 调用接口查询模型计费数据
            const response = await queryModelBilling(
              {
                startTime: adjustedStartTime.startOf("day").valueOf(),
                endTime: adjustedEndTime.endOf("day").valueOf(),
                unit: "day"
              },
              botNo
            )

            if (response?.success === false) {
              return {
                modelBillingData: {
                  success: false,
                  msg: response.msg || response.errorMsg || "查询失败"
                },
                totalModelBilling: 0
              }
            }
            // 正常响应
            if (response?.success && response?.data) {
              return {
                modelBillingData: response.data || {},
                totalModelBilling: response.data?.totalAmount || 0
              }
            }

            return {
              modelBillingData: response?.data || {},
              totalModelBilling: response?.data?.totalAmount || 0
            }
          })()
        ])

        if (overviewResponse) {
          setOverviewData(overviewResponse)
        }

        console.log("modelUsageResponse", modelUsageResponse)
        if (modelUsageResponse) {
          setModelUsageDetails({
            data: modelUsageResponse.list || [],
            total: modelUsageResponse.totalCount || 0
          })
        }
        if (pieChartResponse) {
          const { totalItemValue, items } = pieChartResponse
          setTotalTokenValue(totalItemValue)
          // 计算占比并格式化数据
          const formattedData = items.map((item) => {
            const percentage =
              totalItemValue > 0 ? ((item.value / totalItemValue) * 100).toFixed(2) : "0.00"
            return {
              type: item?.extraInfo?.modelName || item?.name,
              value: item.value,
              percentage
            }
          })
          setPieChartData(formattedData)
        }
        if (skillPieResponse) {
          const { totalItemValue, items } = skillPieResponse
          setTotalSkillValue(totalItemValue)
          // 计算占比并格式化数据
          const formattedData = items
            .map((item) => {
              const percentage =
                totalItemValue > 0 ? ((item.value / totalItemValue) * 100).toFixed(2) : 0
              return {
                type:
                  item.name === "unknown"
                    ? "未知工作流"
                    : item.extraInfo.skillName || item.extraInfo.name || "未知工作流",
                skillNo: item.extraInfo.skillNo,
                value: item.value,
                percentage
              }
            })
            .filter(
              (item, index, self) =>
                // 使用 skillNo 去重
                index === self.findIndex((t) => t.skillNo === item.skillNo)
            )
            .map((item) => {
              // 重新计算重复工作流的总值和百分比
              const totalValue = items.reduce(
                (sum, original) =>
                  original.extraInfo.skillNo === item.skillNo ? sum + original.value : sum,
                0
              )
              const percentage =
                totalItemValue > 0 ? ((totalValue / totalItemValue) * 100).toFixed(2) : 0
              return {
                ...item,
                value: totalValue,
                percentage
              }
            })
          setSkillPieData(formattedData)
        }
        if (modelBillingResponse) {
          setModelBillingData(modelBillingResponse?.modelBillingData || {})
          setTotalModelBilling(modelBillingResponse?.totalModelBilling || 0)
        }

        // 设置调整后的时间范围
        const {
          adjustedStartTime: localAdjustedStartTime,
          adjustedEndTime: localAdjustedEndTime,
          isValid,
          errorMsg
        } = adjustQueryDateRange(
          dayjs(formattedDateRange.startTime),
          dayjs(formattedDateRange.endTime)
        )

        if (isValid) {
          setAdjustedStartTime(localAdjustedStartTime.startOf("day").valueOf())
          setAdjustedEndTime(localAdjustedEndTime.endOf("day").valueOf())
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [botNo, startTime, endTime])

  // 监听周期类型变化，只获取趋势数据
  useEffect(() => {
    if (!botNo) return

    const fetchTrendData = async () => {
      try {
        setTrendLoading(true)
        const [skillCallsResponse, modelUsageResponse] = await Promise.all([
          // 获取工作流调用趋势
          fetchSkillCallsTrend({
            botNo,
            startTime: dateRange.startTime,
            endTime: dateRange.endTime,
            metricCycle: periodTypeMap[periodType].toUpperCase()
          }),
          // 获取模型使用趋势
          fetchModelTotalUsageTrend({
            botNo,
            startTime: dateRange.startTime,
            endTime: dateRange.endTime,
            metricCycle: periodTypeMap[periodType].toUpperCase()
          })
        ])

        if (skillCallsResponse) {
          setSkillCallsTrendData(skillCallsResponse)
        }
        if (modelUsageResponse) {
          setModelUsageTrendData(modelUsageResponse)
        }
      } catch (error) {
        console.error("Failed to fetch trend data:", error)
      } finally {
        setTrendLoading(false)
      }
    }

    fetchTrendData()
  }, [periodType, botNo, dateRange])

  // 监听表格参数变化，只获取表格数据
  useEffect(() => {
    if (!botNo) return

    const fetchTableData = async () => {
      try {
        setTableLoading(true)
        const response = await fetchModelUsageDetails({
          botNo,
          startTime: dateRange.startTime,
          endTime: dateRange.endTime,
          ...modelUsageTableParams
        })

        if (response) {
          setModelUsageDetails({
            data: response.list || [],
            total: response.totalCount || 0
          })
        }
      } catch (error) {
        console.error("Failed to fetch model usage details:", error)
      } finally {
        setTableLoading(false)
      }
    }

    fetchTableData()
  }, [modelUsageTableParams, botNo, dateRange])

  // 新增一个独立的 effect 来处理 Top10 图表的数据
  useEffect(() => {
    if (!botNo) return

    const fetchTop10Data = async () => {
      try {
        setTop10Loading(true)
        const response = await fetchPerModelUsageTrend({
          botNo,
          startTime: dateRange.startTime,
          endTime: dateRange.endTime,
          metricCycle: periodTypeMap[top10PeriodType].toUpperCase()
        })

        if (response) {
          setPerModelUsageData(response)
        }
      } catch (error) {
        console.error("Failed to fetch top 10 data:", error)
      } finally {
        setTop10Loading(false)
      }
    }

    fetchTop10Data()
  }, [top10PeriodType, botNo, dateRange])

  // 更新表格参数处理函数
  const handleTableChange = (pagination, filters, sorter) => {
    setModelUsageTableParams({
      ...modelUsageTableParams,
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
      sort: sorter.field
        ? [
            {
              field: sorter.field,
              asc: sorter.order === "ascend"
            }
          ]
        : [
            {
              field: "metricDate",
              asc: false
            }
          ]
    })
  }

  const metrics = [
    {
      label: "工作流调用次数",
      value: overviewData?.skillCall?.count,
      tooltip: "工作流调用的总次数"
    },
    {
      label: "模型Token调用总量",
      value: overviewData?.modelUsage?.count,
      tooltip: "所有模型的Token调用总量"
    },
    {
      label: "活跃用户数",
      value: overviewData?.activeUser?.count,
      tooltip: "活跃用户数量"
    },
    {
      label: "活跃工作流数",
      value: overviewData?.activeSkill?.count,
      tooltip: "活跃工作流数量"
    },
    {
      label: "模型计费总额(元)",
      value: totalModelBilling,
      tooltip: "模型调用的总计费金额"
    }
  ]

  const items = [
    {
      key: "calls",
      label: "工作流调用次数趋势",
      children: (
        <div className="flex flex-col gap-4">
          <div className="flex justify-start">
            <ChartPeriod value={periodType} onChange={setPeriodType} options={["日", "周", "月"]} />
          </div>
          {skillCallsTrendData?.length > 0 ? (
            <CommonColumn
              data={skillCallsTrendData}
              xField="name"
              yField="value"
              extraConfig={{
                height: 300,
                padding: [20, 20, 40, 40],
                maxColumnWidth: 60,
                columnWidthRatio: 0.7,
                maxBarWidth: 60,
                label: false,
                xAxis: {
                  label: {
                    style: {
                      fill: "#6B7280",
                      fontSize: 12
                    }
                  }
                },
                yAxis: {
                  label: {
                    style: {
                      fill: "#6B7280",
                      fontSize: 12
                    },
                    offset: 0.5
                  },
                  grid: {
                    line: {
                      style: {
                        stroke: "#E4E7EC",
                        lineDash: [4, 4],
                        lineWidth: 0.8
                      }
                    }
                  }
                }
              }}
            />
          ) : (
            <div
              style={{
                height: 300,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <CustomEmpty description="暂无数据" />
            </div>
          )}
        </div>
      )
    },
    {
      key: "tokens",
      label: "模型Token调用量趋势",
      children: (
        <div className="flex flex-col gap-4">
          <div className="flex justify-start">
            <ChartPeriod value={periodType} onChange={setPeriodType} options={["日", "周", "月"]} />
          </div>
          {modelUsageTrendData?.length > 0 ? (
            <CommonColumn
              data={modelUsageTrendData}
              xField="name"
              yField="value"
              extraConfig={{
                height: 300,
                padding: [20, 20, 40, 40],
                maxColumnWidth: 60,
                columnWidthRatio: 0.7,
                maxBarWidth: 60,
                label: false,
                xAxis: {
                  label: {
                    style: {
                      fill: "#6B7280",
                      fontSize: 12
                    }
                  }
                },
                yAxis: {
                  label: {
                    style: {
                      fill: "#6B7280",
                      fontSize: 12
                    },
                    offset: 0.5
                  },
                  grid: {
                    line: {
                      style: {
                        stroke: "#E4E7EC",
                        lineDash: [4, 4],
                        lineWidth: 0.8
                      }
                    }
                  }
                }
              }}
            />
          ) : (
            <div
              style={{
                height: 300,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <CustomEmpty description="暂无数据" />
            </div>
          )}
        </div>
      )
    }
  ]

  const lineConfig = {
    data: perModelUsageData
      .map((item) => {
        const modelName = item.type.replace("_PROMPT", "").replace("_COMPLETION", "")
        const isPrompt = item.type.includes("_PROMPT")
        return {
          ...item,
          modelName, // 添加纯模型名称用于排序
          type: `${modelName}${isPrompt ? " (上行)" : " (下行)"}`,
          sortKey: `${modelName}_${isPrompt ? "1" : "2"}` // 添加排序键，确保上行在前，下行在后
        }
      })
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey)),
    xField: "name",
    yField: "value",
    seriesField: "type",
    smooth: false,
    height: 300,
    padding: [20, 20, 60, 40],
    color: ({ type }) => {
      // 根据模型名称（去掉上行下行标识）决定颜色
      const modelName = type.split(" (")[0]
      const colors = ["#8C71F6", "#3FDEC9", "#E9A21F", "#E34F6F"]
      const hash = modelName.split("").reduce((acc, char) => char.charCodeAt(0) + acc, 0)
      return colors[hash % colors.length]
    },
    lineStyle: ({ type }) => {
      return {
        lineDash: type.includes("上行") ? [0, 0] : [4, 4], // 上行实线，下行虚线
        lineWidth: 2
      }
    },
    legend: {
      position: "bottom",
      offsetY: 8,
      legendMarkerStyle: {
        width: 12,
        height: 12,
        borderRadius: 0
      },
      marker: (text, index, item) => {
        // 根据模型名称（去掉上行下行标识）决定颜色
        const modelName = text.split(" (")[0]
        const isPrompt = text.includes("上行")
        const colors = ["#8C71F6", "#3FDEC9", "#E9A21F", "#E34F6F"]
        const hash = modelName.split("").reduce((acc, char) => char.charCodeAt(0) + acc, 0)
        const color = colors[hash % colors.length]
        return {
          symbol: "square",
          style: {
            r: 4,
            fill: isPrompt ? color : "#fff",
            stroke: color,
            lineWidth: 1.5,
            lineDash: isPrompt ? null : [1, 1] // 图例使用更小更紧密的虚线
          }
        }
      }
    },
    tooltip: {
      formatter: (datum) => {
        const isPrompt = datum.type.includes("上行")
        return {
          name: datum.type,
          value: `${datum?.value?.toLocaleString()} tokens${isPrompt ? " ↑" : " ↓"}`
        }
      }
    },
    xAxis: {
      label: {
        style: {
          fill: "#6B7280",
          fontSize: 12
        }
      }
    },
    yAxis: {
      label: {
        style: {
          fill: "#6B7280",
          fontSize: 12
        },
        offset: 0.5
      },
      grid: {
        line: {
          style: {
            stroke: "#E4E7EC",
            lineDash: [4, 4],
            lineWidth: 0.8
          }
        }
      }
    }
  }

  // 将饼图配置移到 useMemo 中
  const pieConfig = useMemo(
    () => ({
      data: pieChartData,
      angleField: "value",
      colorField: "type",
      radius: 0.8,
      innerRadius: 0.5,
      color: [
        "#8C71F6",
        "#3FDEC9",
        "#4D7EE2",
        "#E34F6F",
        "#708AF5",
        "#36BA77",
        "#E9A21F",
        "#E058B1"
      ],
      label: {
        type: "inner",
        content: "{percentage}",
        style: {
          fontSize: 12,
          textAlign: "center",
          fill: "#fff"
        },
        offset: "-50%"
      },
      tooltip: {
        formatter: (datum) => {
          const data = pieChartData.find((d) => d.type === datum.type)
          return {
            name: datum.type,
            value: `${datum?.value?.toLocaleString()} (${data?.percentage || "0.00"}%)`
          }
        }
      },
      legend: {
        layout: "vertical",
        position: "right",
        maxWidth: 400,
        maxHeight: 400,
        itemWidth: 300,
        itemSpacing: 8,
        marker: (text, index, item) => {
          const colors = [
            "#8C71F6",
            "#3FDEC9",
            "#4D7EE2",
            "#E34F6F",
            "#708AF5",
            "#36BA77",
            "#E9A21F",
            "#E058B1"
          ]
          return {
            symbol: "square",
            style: {
              r: 4,
              lineWidth: 0,
              fill: colors[index % colors.length]
            }
          }
        },
        legendMarkerStyle: {
          width: 12,
          height: 12,
          borderRadius: 0
        },
        pageNavigator: {
          marker: {
            style: {
              fill: "#8C71F6"
            }
          }
        },
        itemValue: {
          formatter: (text, item) => {
            const data = pieChartData.find((d) => d.type === item.name)
            return data ? `${data?.value?.toLocaleString()} (${data.percentage}%)` : "0 (0.00%)"
          },
          style: {
            opacity: 0.65,
            fontSize: 12
          }
        }
      },
      statistic: {
        title: {
          style: {
            fontSize: "14px",
            lineHeight: "14px",
            color: "#6B7280"
          },
          content: "总计"
        },
        content: {
          style: {
            fontSize: "24px",
            lineHeight: "24px",
            color: "#1F2937",
            fontWeight: 500
          },
          content: totalTokenValue?.toLocaleString()
        }
      }
    }),
    [pieChartData, totalTokenValue]
  )

  const skillPieConfig = useMemo(
    () => ({
      data: skillPieData,
      angleField: "value",
      colorField: "type",
      radius: 0.8,
      innerRadius: 0.5,
      color: [
        "#8C71F6",
        "#3FDEC9",
        "#4D7EE2",
        "#E34F6F",
        "#708AF5",
        "#36BA77",
        "#E9A21F",
        "#E058B1"
      ],
      label: {
        type: "inner",
        content: "{percentage}",
        style: {
          fontSize: 12,
          textAlign: "center",
          fill: "#fff"
        },
        offset: "-50%"
      },
      tooltip: {
        formatter: (datum) => {
          const percentage = ((datum.value / totalSkillValue) * 100).toFixed(2)
          return {
            name: datum.type,
            value: `${datum?.value?.toLocaleString()} (${percentage}%)`
          }
        }
      },
      legend: {
        layout: "vertical",
        position: "right",
        maxWidth: 400,
        maxHeight: 400,
        itemWidth: 300,
        itemSpacing: 8,
        marker: (text, index, item) => {
          const colors = [
            "#8C71F6",
            "#3FDEC9",
            "#4D7EE2",
            "#E34F6F",
            "#708AF5",
            "#36BA77",
            "#E9A21F",
            "#E058B1"
          ]
          return {
            symbol: "square",
            style: {
              r: 4,
              lineWidth: 0,
              fill: colors[index % colors.length]
            }
          }
        },
        legendMarkerStyle: {
          width: 12,
          height: 12,
          borderRadius: 0
        },
        pageNavigator: {
          marker: {
            style: {
              fill: "#8C71F6"
            }
          }
        },
        itemValue: {
          formatter: (text, item) => {
            const data = skillPieData.find((d) => d.type === item.name)
            return data ? `${data?.value?.toLocaleString()} (${data.percentage}%)` : "0 (0%)"
          },
          style: {
            opacity: 0.65,
            fontSize: 12
          }
        }
      },
      statistic: {
        title: {
          style: {
            fontSize: "14px",
            lineHeight: "14px",
            color: "#6B7280"
          },
          content: "总计"
        },
        content: {
          style: {
            fontSize: "24px",
            lineHeight: "24px",
            color: "#1F2937",
            fontWeight: 500
          },
          content: totalSkillValue?.toLocaleString()
        }
      }
    }),
    [skillPieData, totalSkillValue]
  )

  // 处理导出
  const handleExport = async () => {
    try {
      setExportLoading(true)
      const response = await fetch(`${botPrefix}/admin/report/v2/bot-usage/export-model-usage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // @ts-ignore
          "X-Usercenter-Session": getTokenAndServiceName().token,
          ...(isStudio()
            ? {
                botno: botNo || undefined,
                studioenv: studioenv || "prd"
              }
            : {})
        },
        body: JSON.stringify({
          botNo,
          startTime: dateRange.startTime,
          endTime: dateRange.endTime
        })
      })

      if (!response.ok) {
        throw new Error("导出失败")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `模型调用Token量明细_${dateRange.startTime}_${dateRange.endTime}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export failed:", error)
      message.error("导出失败")
    } finally {
      setExportLoading(false)
    }
  }

  return (
    <Spin spinning={loading} tip="数据加载中...">
      <div className="space-y-6">
        <div className="flex items-center mb-4">
          <h4 className="text-[14px] font-medium text-[#1F2937] m-0">数据总览</h4>
          <Tooltip title="过去7天内的数据统计">
            <InfoCircleOutlined className="ml-2 text-[14px] text-[#6B7280] cursor-help" />
          </Tooltip>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-5 gap-4">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6"
              style={{ border: "1px solid #E5E7EB" }}
            >
              <div className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                {metric.label}
                <Tooltip title={metric.tooltip}>
                  <InfoCircleOutlined style={{ color: "#9CA3AF", fontSize: "14px" }} />
                </Tooltip>
              </div>
              <div className="text-[28px] font-medium text-gray-900">
                {metric?.value?.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Model Billing Chart */}
        <ModelBillingChart
          data={modelBillingData}
          adjustedStartTime={adjustedStartTime}
          adjustedEndTime={adjustedEndTime}
          botNo={botNo}
        />

        {/* Daily Usage Trend */}
        <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #E5E7EB" }}>
          <Spin spinning={trendLoading}>
            <Tabs
              items={items}
              onChange={(key) => console.log(key)}
              tabBarStyle={{
                marginBottom: 24
              }}
            />
          </Spin>
        </div>

        {/* Token Usage Analysis */}
        <div className="grid grid-cols-2 gap-4">
          {/* Line Chart */}
          <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #E5E7EB" }}>
            <Spin spinning={top10Loading}>
              <Typography.Text
                className="block mb-4"
                style={{ fontSize: "14px", fontWeight: "500", color: "#1F2937" }}
              >
                <div className="flex justify-between items-center">
                  <span>模型调用上下行趋势</span>
                  <ChartPeriod
                    value={top10PeriodType}
                    onChange={setTop10PeriodType}
                    options={["日", "周", "月"]}
                  />
                </div>
              </Typography.Text>
              {/* @ts-ignore */}
              {perModelUsageData?.length > 0 ? (
                // @ts-ignore
                <Line {...lineConfig} height={300} />
              ) : (
                <div
                  style={{
                    height: 300,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <CustomEmpty description="暂无数据" />
                </div>
              )}
            </Spin>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #E5E7EB" }}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Typography.Text style={{ fontSize: "14px", fontWeight: "500", color: "#1F2937" }}>
                  模型调用Token量明细
                </Typography.Text>
                <Typography.Text style={{ fontSize: "12px", color: "#6B7280" }}>
                  （当前计费明细统计日期：{dateRange.startTime}）
                </Typography.Text>
              </div>
              <Button
                icon={<DownloadOutlined />}
                type="link"
                size="small"
                onClick={handleExport}
                loading={exportLoading}
              >
                导出
              </Button>
            </div>
            <Table
              loading={tableLoading}
              columns={columns}
              dataSource={modelUsageDetails.data}
              className="table-style-v2 table-style-v2-no-border"
              bordered={false}
              rowClassName={(record, index) => {
                if (index % 2 === 0) {
                  return "table-style-v2-even-row"
                } else {
                  return "table-style-v2-odd-row"
                }
              }}
              pagination={{
                current: modelUsageTableParams.pageNum,
                pageSize: modelUsageTableParams.pageSize,
                total: modelUsageDetails.total,
                showSizeChanger: true,
                showQuickJumper: true
              }}
              onChange={handleTableChange}
              size="small"
              scroll={{ y: 200, x: 600 }}
            />
          </div>
        </div>

        {/* Token Distribution */}
        <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #E5E7EB" }}>
          <Typography.Text
            className="block mb-4"
            style={{ fontSize: "14px", fontWeight: "500", color: "#1F2937" }}
          >
            模型调用总Token占比
          </Typography.Text>
          <div style={{ height: 400 }}>
            {/* @ts-ignore */}
            {totalTokenValue > 0 ? (
              // @ts-ignore
              <Pie {...pieConfig} />
            ) : (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <CustomEmpty description="暂无数据" />
              </div>
            )}
          </div>
        </div>

        {/* Skill Usage Distribution */}
        <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #E5E7EB" }}>
          <Typography.Text
            className="block mb-4"
            style={{ fontSize: "14px", fontWeight: "500", color: "#1F2937" }}
          >
            工作流调用次数占比
          </Typography.Text>
          <div style={{ height: 400 }}>
            {/* @ts-ignore */}
            {totalSkillValue > 0 ? (
              // @ts-ignore
              <Pie {...skillPieConfig} />
            ) : (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <CustomEmpty description="暂无数据" />
              </div>
            )}
          </div>
        </div>
      </div>
    </Spin>
  )
}

export default IframeDashboard
