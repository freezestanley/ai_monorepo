import React, { useMemo, useState, useEffect } from "react"
import { Column } from "@ant-design/plots"
import { Empty, Typography } from "antd"
import dayjs from "dayjs"

const { Text } = Typography

const ModelCostBarChart = ({ data, adjustedStartTime, adjustedEndTime }) => {
  // 处理数据以适应堆叠柱状图
  const originalChartData = useMemo(() => {
    if (!data?.timeRangeDetails) return []

    // 获取所有模型名称
    const allModels = new Set()
    data.timeRangeDetails.forEach((day) => {
      day.modelDetails.forEach((model) => {
        allModels.add(model.model)
      })
    })

    // 获取时间范围内的所有日期
    const timeRangeDetails = data.timeRangeDetails
    if (timeRangeDetails.length === 0) return []

    // 使用传入的时间范围参数，而不是返回数据中的最小和最大日期
    const startDate = dayjs(adjustedStartTime)
    const endDate = dayjs(adjustedEndTime)

    // 生成完整的日期范围
    const allDates = []
    let currentDate = startDate
    while (currentDate.isSame(endDate, "day") || currentDate.isBefore(endDate, "day")) {
      allDates.push(currentDate.format("YYYY-MM-DD"))
      currentDate = currentDate.add(1, "day")
    }

    // 创建日期到数据的映射
    const dateToDataMap = {}
    timeRangeDetails.forEach((day) => {
      dateToDataMap[day.timeRange] = day.modelDetails
    })

    const result = []

    // 遍历完整日期范围
    allDates.forEach((date) => {
      const dayData = dateToDataMap[date] || [] // 如果某天没有数据，则为空数组

      // 计算当天的总费用
      const dayTotal = dayData.reduce((sum, model) => sum + (model.totalAmount || 0), 0)

      // 如果当天有数据，添加每个模型的数据
      if (dayData.length > 0) {
        dayData.forEach((modelDetail) => {
          // 获取该模型的总金额
          const totalAmount = modelDetail.totalAmount || 0

          result.push({
            date: date,
            model: modelDetail.model,
            amount: totalAmount,
            dayTotal: dayTotal // 添加当天总计
          })
        })
      } else {
        // 如果当天没有数据，为每个模型添加0金额的记录
        allModels.forEach((model) => {
          result.push({
            date: date,
            model: model,
            amount: 0,
            dayTotal: 0 // 当天总计为0
          })
        })
      }
    })

    return result
  }, [data, adjustedStartTime, adjustedEndTime])

  // 初始化所有模型为选中状态
  const [selectedModels, setSelectedModels] = useState([])

  // 使用 useEffect 来初始化或更新选中的模型
  useEffect(() => {
    if (originalChartData.length > 0) {
      const uniqueModels = [...new Set(originalChartData.map((item) => item.model))]
      setSelectedModels(uniqueModels)
    }
  }, [originalChartData])

  // 获取所有唯一的模型名称
  const models = useMemo(() => {
    if (!originalChartData.length) return []
    const uniqueModels = [...new Set(originalChartData.map((item) => item.model))]
    return uniqueModels
  }, [originalChartData])

  // 定义颜色方案 - 为不同模型分配不同颜色
  const colorPalette = [
    "#5B8FF9", // 蓝色
    "#5AD8A6", // 绿色
    "#5D7092", // 深蓝灰
    "#F6BD16", // 黄色
    "#E8684A", // 橙红色
    "#6DC8EC", // 浅蓝色
    "#9270CA", // 紫色
    "#FF9D4D", // 橙色
    "#269A99", // 青色
    "#FF99C3", // 粉色
    "#1890FF", // 亮蓝色
    "#52C41A", // 亮绿色
    "#FAAD14", // 金色
    "#F5222D", // 红色
    "#722ED1", // 深紫色
    "#13C2C2", // 青绿色
    "#EB2F96", // 洋红色
    "#FA8C16", // 橙色
    "#A0D911", // 黄绿色
    "#2F54EB" // 青蓝色
  ]

  // 根据选中的模型过滤数据
  const filteredChartData = useMemo(() => {
    if (selectedModels.length === 0) return []
    return originalChartData.filter((item) => selectedModels.includes(item.model))
  }, [originalChartData, selectedModels])

  // 重新计算每天的总计费用
  const updatedChartData = useMemo(() => {
    if (!filteredChartData.length) return []

    // 按日期分组
    const dateGroups = filteredChartData.reduce((acc, item) => {
      if (!acc[item.date]) {
        acc[item.date] = []
      }
      acc[item.date].push(item)
      return acc
    }, {})

    // 重新计算每天的总计
    return filteredChartData.map((item) => {
      const dayTotal = dateGroups[item.date]?.reduce((sum, i) => sum + (i.amount || 0), 0) || 0
      return {
        ...item,
        dayTotal: dayTotal
      }
    })
  }, [filteredChartData])

  // 配置堆叠柱状图
  const config = {
    data: updatedChartData,
    xField: "date",
    yField: "amount",
    seriesField: "model",
    isStack: true,
    label: false,
    columnWidthRatio: 0.4,
    maxColumnWidth: 40,
    color: colorPalette,
    xAxis: {
      label: {
        autoHide: true,
        autoRotate: true,
        autoEllipsis: false,
        layout: [
          {
            type: "text-rotation",
            cfg: {
              rotate: -Math.PI / 6, // 将标签向左旋转 30 度
              translate: [-10, 10] // 应用偏移来调整标签的位置
            }
          },
          {
            type: "text-spacing",
            cfg: {
              dy: -10,
              minSpacing: 4
            }
          }
        ]
      }
    },
    yAxis: {
      label: {
        formatter: (v) => {
          const num = parseFloat(v)
          if (num >= 10000) {
            return `${(num / 10000).toFixed(1)}万`
          }
          return num.toLocaleString("zh-CN", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
          })
        }
      }
    },
    tooltip: {
      customContent: (title, items) => {
        if (!items || items.length === 0) return null

        // 重新计算当天的总费用，基于当前选中的模型
        const dayTotal = items.reduce((sum, item) => sum + (item.data?.amount || 0), 0)

        return `
          <div style="padding: 8px 12px;">
            <div style="margin-bottom: 8px; font-weight: 500; color: #262626;">${title}</div>
            ${items
              .map((item) => {
                // 从 item.data 中获取原始数值
                const amount = item.data?.amount || 0
                return `
                <div style="display: flex; align-items: center; margin-bottom: 4px;">
                  <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${item.color}; margin-right: 8px;"></span>
                  <span style="flex: 1; color: #595959;">${item.name}:</span>
                  <span style="font-weight: 500; color: #262626; margin-left: 16px;">${amount.toFixed(2)}</span>
                </div>
              `
              })
              .join("")}
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #f0f0f0;">
              <div style="display: flex; align-items: center;">
                <span style="flex: 1; color: #595959; font-weight: 500;">当天总计:</span>
                <span style="font-weight: 600; color: #1890ff; margin-left: 16px;">${dayTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        `
      }
    },
    legend: {
      position: "top"
    },
    state: {
      active: {
        style: {
          lineWidth: 0,
          fillOpacity: 0.85
        }
      }
    },
    interactions: [
      {
        type: "legend-filter",
        cfg: {
          // 当图例被点击时，更新选中的模型
          onFilter: (filteredValues) => {
            setSelectedModels(filteredValues)
          }
        }
      }
    ]
  }

  // 检查是否有错误信息
  const errorMessage = useMemo(() => {
    if (!data) return "未查询到数据，检查查询条件是否符合"
    if (data.success === false) {
      return data.msg || data.errorMsg || "未查询到数据，检查查询条件是否符合"
    }
    return null
  }, [data])

  // 如果有错误信息或没有数据，显示空状态
  if (errorMessage || !originalChartData.length) {
    return (
      <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #E5E7EB" }}>
        <div
          style={{
            height: "300px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Empty description={errorMessage || "暂无模型费用数据"} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <Column {...config} />
    </div>
  )
}

export default ModelCostBarChart
