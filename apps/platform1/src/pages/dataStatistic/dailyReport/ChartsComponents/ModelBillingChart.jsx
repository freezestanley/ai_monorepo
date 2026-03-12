import React, { useState, useMemo, useCallback } from "react"
import { Dropdown, Checkbox, Typography, Button, Tooltip } from "antd"
import { DownOutlined, FilterOutlined, QuestionCircleOutlined } from "@ant-design/icons"
import dayjs from "dayjs"
import ModelBillingDashboard from "./ModelBillingDashboard"
import ModelCostBarChart from "./ModelCostBarChart"

const { Text } = Typography

const ModelBillingChart = ({ data, adjustedStartTime, adjustedEndTime, botNo }) => {
  const [selectedModels, setSelectedModels] = useState([])

  // 提取所有模型名称
  const allModels = useMemo(() => {
    if (!data?.timeRangeDetails) return []

    const models = new Set()
    data.timeRangeDetails.forEach((day) => {
      day.modelDetails.forEach((model) => {
        models.add(model.model)
      })
    })

    return Array.from(models)
  }, [data])

  // 当模型列表变化时，更新选中的模型
  useMemo(() => {
    if (allModels.length > 0) {
      setSelectedModels(allModels)
    }
  }, [allModels])

  // 处理复选框变化
  const handleCheckboxChange = useCallback((model, checked) => {
    if (checked) {
      setSelectedModels((prev) => [...prev, model])
    } else {
      setSelectedModels((prev) => prev.filter((m) => m !== model))
    }
  }, [])

  // 全选/取消全选
  const handleSelectAll = useCallback(
    (checked) => {
      if (checked) {
        setSelectedModels([...allModels])
      } else {
        setSelectedModels([])
      }
    },
    [allModels]
  )

  // 检查是否全选
  const isAllSelected = selectedModels.length === allModels.length && allModels.length > 0
  // 检查是否部分选中
  const isIndeterminate = selectedModels.length > 0 && selectedModels.length < allModels.length

  // 下拉菜单内容
  const dropdownContent = useMemo(
    () => (
      <div
        className="bg-white rounded-lg p-3"
        style={{
          minWidth: 220,
          maxHeight: 400,
          overflowY: "auto",
          boxShadow:
            "0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)"
        }}
      >
        <div className="pb-2 mb-2" style={{ borderBottom: "1px solid #f0f0f0" }}>
          <div className="flex justify-between items-center">
            <Checkbox
              checked={isAllSelected}
              onChange={(e) => handleSelectAll(e.target.checked)}
              indeterminate={isIndeterminate}
              style={{ fontWeight: 500 }}
            >
              全选
            </Checkbox>
            <span style={{ fontSize: "12px", color: "#8c8c8c" }}>控制模型数据加载</span>
          </div>
        </div>
        <div>
          {allModels.map((model) => (
            <div
              key={model}
              className="py-1.5 px-1 rounded hover:bg-gray-50 transition-colors"
              style={{ cursor: "pointer" }}
            >
              <Checkbox
                checked={selectedModels.includes(model)}
                onChange={(e) => handleCheckboxChange(model, e.target.checked)}
              >
                <span style={{ fontSize: "14px" }}>{model}</span>
              </Checkbox>
            </div>
          ))}
        </div>
      </div>
    ),
    [
      allModels,
      selectedModels,
      isAllSelected,
      isIndeterminate,
      handleSelectAll,
      handleCheckboxChange
    ]
  )

  // 过滤数据以只显示选定的模型
  const filteredData = useMemo(() => {
    if (!data?.timeRangeDetails) return data

    // 创建一个新的数据对象副本
    const newData = {
      ...data,
      timeRangeDetails: data.timeRangeDetails.map((day) => ({
        ...day,
        modelDetails: day.modelDetails.filter((model) => selectedModels.includes(model.model))
      }))
    }

    return newData
  }, [data, selectedModels])

  // 生成补全后的完整数据，用于传递给ModelBillingDashboard
  const completedData = useMemo(() => {
    if (!data?.timeRangeDetails) return data

    const timeRangeDetails = data.timeRangeDetails
    if (timeRangeDetails.length === 0) return data

    const startDate = dayjs(adjustedStartTime)
    const endDate = dayjs(adjustedEndTime)

    // 如果时间参数无效，使用原始数据中的日期范围
    if (!startDate.isValid() || !endDate.isValid()) {
      console.log("时间参数无效，使用原始数据")
      return data
    }

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
      dateToDataMap[day.timeRange] = day
    })

    // 生成补全后的数据
    const completedTimeRangeDetails = allDates.map((date) => {
      const dayData = dateToDataMap[date]
      if (dayData) {
        // 如果有原始数据，直接使用
        return dayData
      } else {
        // 如果没有原始数据，创建一个空的日期数据
        return {
          timeRange: date,
          modelDetails: [] // 空的模型详情
        }
      }
    })

    return {
      ...data,
      timeRangeDetails: completedTimeRangeDetails
    }
  }, [data, adjustedStartTime, adjustedEndTime])

  // 过滤补全后的数据以只显示选定的模型
  const completedFilteredData = useMemo(() => {
    if (!completedData?.timeRangeDetails) return completedData

    const newData = {
      ...completedData,
      timeRangeDetails: completedData.timeRangeDetails.map((day) => ({
        ...day,
        modelDetails: day.modelDetails.filter((model) => selectedModels.includes(model.model))
      }))
    }

    return newData
  }, [completedData, selectedModels])

  return (
    <div className="bg-white rounded-xl p-6 mb-6" style={{ border: "1px solid #E5E7EB" }}>
      {/* 标题 */}
      <div className="mb-2 flex items-center gap-2">
        <Text style={{ fontSize: "14px", fontWeight: "500", color: "#1F2937" }}>
          模型调用计费看板
        </Text>
        <Text style={{ fontSize: "12px", color: "#6B7280" }}>
          （注意：计费看板最多可统计并展示7天查询数据）
        </Text>
      </div>

      {/* 筛选器 */}
      <div className="mb-2">
        <Dropdown
          menu={{ items: [] }}
          dropdownRender={() => dropdownContent}
          trigger={["hover"]}
          placement="bottomLeft"
        >
          <Button className="flex items-center px-3 py-1">
            <FilterOutlined className="mr-1 text-xs" />
            模型筛选
            <DownOutlined className="ml-1 text-xs" />
          </Button>
        </Dropdown>
      </div>

      {/* 单位说明和图例说明 */}
      <div className="mb-4 flex justify-between">
        <Text style={{ fontSize: "12px", color: "#6B7280" }}>单位：元</Text>
        <Text style={{ fontSize: "12px", color: "#6B7280" }}>
          注：图例勾选，仅控制对应模型数据在图表中的显示/隐藏
        </Text>
      </div>

      {/* 模型费用分布柱状图 */}
      <div className="mb-6">
        <ModelCostBarChart
          data={filteredData}
          adjustedStartTime={adjustedStartTime}
          adjustedEndTime={adjustedEndTime}
        />
      </div>

      {/* 模型计费明细表格 */}
      <ModelBillingDashboard
        data={completedFilteredData}
        adjustedStartTime={adjustedStartTime}
        adjustedEndTime={adjustedEndTime}
        botNo={botNo}
      />
    </div>
  )
}

export default ModelBillingChart
