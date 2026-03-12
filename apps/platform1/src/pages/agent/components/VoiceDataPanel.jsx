import React, { useState, useEffect, useMemo, useRef, memo, useCallback } from "react"
import {
  Typography,
  Spin,
  Tooltip,
  Segmented,
  Row,
  Col,
  Space,
  Button,
  message,
  Popconfirm,
  Modal
} from "antd"
import {
  InfoCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SyncOutlined
} from "@ant-design/icons"
import { Line, Column, Bar, DualAxes } from "@ant-design/plots"
import CustomEmpty from "@/components/Empty"
import RangeTimePicker from "@/components/RangeTime"
import FunnelEditModal from "./FunnelEditModal"
import {
  getBoardOverview,
  getBoardConfigInfo,
  getOnHookStageList,
  deleteBoardConfig
} from "@/api/voiceAgent/api"
import { useNavigate } from "react-router-dom"
import dayjs from "dayjs"
import "./VoiceDataPanel.scss"
import { postMessageForLX } from "@/utils"
import { MessageType } from "@/constants/postMessageType"

// 引入 ChartPeriod 组件，如果项目中没有，可以直接在这里实现
const ChartPeriod = ({ value, onChange, options = ["日", "周", "月"] }) => {
  return (
    <Segmented
      value={value}
      onChange={onChange}
      options={options}
      style={{ backgroundColor: "#F9FAFB", borderRadius: "6px" }}
    />
  )
}

// 格式化时长（秒转换为分钟格式）
const formatDurationToMinutes = (seconds) => {
  if (!seconds || seconds === 0) return "0分钟"
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (minutes === 0) {
    return `${remainingSeconds}秒`
  } else if (remainingSeconds === 0) {
    return `${minutes}分钟`
  } else {
    return `${minutes}分${remainingSeconds}秒`
  }
}

const VoiceDataPanel = ({ agentDetail, botNo, agentNo, taskId, isOnlyRead }) => {
  const [loading, setLoading] = useState(false)
  const [connectionPeriodType, setConnectionPeriodType] = useState("日")
  const [callPeriodType, setCallPeriodType] = useState("日")
  const [thirtySecPeriodType, setThirtySecPeriodType] = useState("日")
  const [tenSecPeriodType, setTenSecPeriodType] = useState("日")
  const [durationPeriodType, setDurationPeriodType] = useState("日")
  const [durationFunnelPeriodType, setDurationFunnelPeriodType] = useState("日")
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(6, "day").startOf("day"),
    dayjs().endOf("day")
  ])
  const dateRangeRef = useRef(dateRange) // 使用 ref 存储最新的 dateRange
  const [overviewData, setOverviewData] = useState(null)
  const [funnelEditModalVisible, setFunnelEditModalVisible] = useState(false)
  const lastRequestParamsRef = useRef(null)
  const [funnelConfig, setFunnelConfig] = useState({
    dashboardName: "通话转化率",
    analysisTarget: "",
    displayFields: [
      { name: "总拨打", description: "总拨打次数" },
      { name: "接通", description: "成功接通次数" },
      { name: "有效沟通", description: "有效沟通次数" },
      { name: "意向客户", description: "意向客户数量" },
      { name: "成交", description: "成交客户数量" }
    ]
  })
  const refreshTimerRef = useRef(null)

  // 获取数据总览
  const fetchOverviewData = async (isRefresh = false) => {
    if (!botNo || !agentDetail?.agentNo || !dateRange || dateRange.length !== 2) {
      return
    }

    // 检查是否与上次请求参数相同
    const currentParams = {
      botNo,
      taskId,
      startTime: dateRange[0].format("YYYY-MM-DD"),
      endTime: dateRange[1].format("YYYY-MM-DD"),
      metricCycle: "DAY"
    }

    // 如果参数与上次相同，则跳过请求
    if (
      !isRefresh &&
      lastRequestParamsRef.current &&
      JSON.stringify(lastRequestParamsRef.current) === JSON.stringify(currentParams)
    ) {
      console.log("跳过重复请求，参数相同")
      return
    }

    // 更新最后请求参数
    lastRequestParamsRef.current = currentParams

    try {
      setLoading(true)

      const response = await getBoardOverview(currentParams)

      if (response?.status === 200 && response?.data) {
        const data = response.data
        setOverviewData(data)
      }
    } catch (error) {
      console.error("获取数据总览失败:", error)
      message.error("获取数据总览失败")
    } finally {
      setLoading(false)
    }
  }

  // 根据周期类型转换为API参数
  const getPeriodTypeParam = (periodType) => {
    switch (periodType) {
      case "日":
        return "DAY"
      case "周":
        return "WEEK"
      case "月":
        return "MONTH"
      default:
        return "DAY"
    }
  }

  // 获取单个图表数据
  const fetchSingleChartData = useCallback(
    async (boardType, periodType) => {
      if (!botNo || !taskId || !dateRange || dateRange.length !== 2) {
        console.log("fetchSingleChartData 跳过执行，缺少必要参数:", {
          botNo,
          taskId,
          dateRange,
          boardType
        })
        return null
      }

      const metricCycle = getPeriodTypeParam(periodType)

      // 创建请求参数
      const params = {
        botNo,
        taskId,
        startTime: dateRange[0].format("YYYY-MM-DD"),
        endTime: dateRange[1].format("YYYY-MM-DD"),
        metricCycle,
        boardType
      }

      // 创建唯一键以检查重复请求
      const requestKey = `${boardType}_${metricCycle}_${params.startTime}_${params.endTime}`

      // 如果这个请求已经在进行中，则跳过
      if (lastRequestParamsRef.current && lastRequestParamsRef.current[requestKey]) {
        return null
      }

      // 标记这个请求正在进行中
      if (!lastRequestParamsRef.current) {
        lastRequestParamsRef.current = {}
      }
      lastRequestParamsRef.current[requestKey] = true

      try {
        const response = await getBoardConfigInfo(params)

        // 请求完成后，移除标记
        if (lastRequestParamsRef.current) {
          delete lastRequestParamsRef.current[requestKey]
        }

        if (response?.status === 200 && response?.data) {
          return response.data
        }
      } catch (error) {
        console.error(`获取看板配置信息失败 (boardType: ${boardType}):`, error)
        message.error(`获取看板配置信息失败: ${boardType}`)

        // 请求失败也要移除标记
        if (lastRequestParamsRef.current) {
          delete lastRequestParamsRef.current[requestKey]
        }
      }

      return null
    },
    [botNo, taskId, dateRange]
  )

  // 存储API返回的名单接通率数据
  const [numberCompleteRateApiData, setNumberCompleteRateApiData] = useState([])

  // 存储API返回的拨打接通率数据
  const [callRateApiData, setCallRateApiData] = useState([])

  // 名单接通率数据 - 使用API数据
  const connectionRateData = useMemo(() => {
    // 如果有API数据，使用API数据
    if (numberCompleteRateApiData && numberCompleteRateApiData.length > 0) {
      // 柱状图数据 - 表示数量
      const columnData = numberCompleteRateApiData.map((item) => ({
        name: item.name,
        type: "拨打数量",
        value: parseFloat(item.value || 0)
      }))

      // 折线图数据 - 表示接通率
      const lineData = numberCompleteRateApiData.map((item) => ({
        name: item.name,
        type: "接通率",
        value: parseFloat(item.rate || 0)
      }))

      return {
        columnData,
        lineData
      }
    }

    // 否则返回空数据
    return {
      columnData: [],
      lineData: []
    }
  }, [numberCompleteRateApiData])

  // 存储API返回的30s接通率数据
  const [thirtySecRateApiData, setThirtySecRateApiData] = useState([])

  // 存储API返回的10s挂断率数据
  const [tenSecRateApiData, setTenSecRateApiData] = useState([])

  // 存储API返回的平均通话时长数据
  const [avgDurationApiData, setAvgDurationApiData] = useState([])

  // 存储API返回的通话时长漏斗数据
  const [durationTotalApiData, setDurationTotalApiData] = useState([])

  // 存储API返回的通话转化率数据
  const [conversionFunnelApiData, setConversionFunnelApiData] = useState([])

  // 通话转化率数据 - 使用API数据
  const conversionFunnelData = useMemo(() => {
    // 如果有API数据，使用API数据
    if (conversionFunnelApiData && conversionFunnelApiData.length > 0) {
      return conversionFunnelApiData.map((item) => ({
        name: item.name,
        value: parseInt(item.value || 0),
        value2: parseInt(item.value2 || 0)
      }))
    }
    // 否则返回模拟数据
    return [] // generateMockConversionData()
  }, [conversionFunnelApiData])

  // 拨打接通率数据 - 使用API数据
  const callRateData = useMemo(() => {
    // 如果有API数据，使用API数据
    if (callRateApiData && callRateApiData.length > 0) {
      return callRateApiData.map((item) => ({
        name: item.name,
        value: parseFloat(item.value || 0),
        rate: parseFloat(item.rate || 0),
        type: "接通率"
      }))
    }
    // 否则返回空数组，不再使用测试数据
    return []
  }, [callRateApiData])

  // 30s接通率数据
  const thirtySecRateData = useMemo(() => {
    // 如果有API数据，使用API数据
    if (thirtySecRateApiData && thirtySecRateApiData.length > 0) {
      return thirtySecRateApiData.map((item) => ({
        name: item.name,
        value: parseFloat(item.rate || 0),
        type: "30s接通率"
      }))
    }
    // 否则返回空数组，不再使用测试数据
    return []
  }, [thirtySecRateApiData])

  // 10s挂断率数据
  const tenSecRateData = useMemo(() => {
    // 如果有API数据，使用API数据
    if (tenSecRateApiData && tenSecRateApiData.length > 0) {
      return tenSecRateApiData.map((item) => ({
        name: item.name,
        value: parseFloat(item.rate || 0),
        type: "10s挂断率"
      }))
    }
    // 否则返回空数组，不再使用测试数据
    return []
  }, [tenSecRateApiData])

  // 平均通话时长数据
  const avgDurationData = useMemo(() => {
    // 如果有API数据，使用API数据
    if (avgDurationApiData && avgDurationApiData.length > 0) {
      return avgDurationApiData.map((item) => {
        const seconds = parseInt(item.value || 0)
        return {
          name: item.name,
          value: seconds, // 直接使用秒数，不再转换为分钟
          type: "平均通话时长"
        }
      })
    }
    // 否则返回空数组，不再使用测试数据
    return []
  }, [avgDurationApiData])

  // 通话时长漏斗数据
  const durationFunnelData = useMemo(() => {
    // 如果有API数据，使用API数据
    if (durationTotalApiData && durationTotalApiData.length > 0) {
      return durationTotalApiData.map((item) => ({
        type: item.name,
        name: item.name,
        value: parseInt(item.value || 0),
        rate: item.rate
      }))
    }
    // 否则返回空数组，不再使用测试数据
    return []
  }, [durationTotalApiData])

  // 处理编辑按钮点击
  const handleEdit = useCallback(() => {
    setFunnelEditModalVisible(true)
  }, [])

  // 处理删除按钮点击
  const handleDelete = useCallback(async () => {
    if (!taskId || !botNo) {
      message.error("缺少必要参数")
      return
    }

    try {
      setLoading(true)

      const params = {
        taskId,
        botNo,
        analysisCode: "onHookBusinessStage"
      }

      const response = await deleteBoardConfig(params)

      if (response?.status === 200) {
        message.success(response.message || "删除成功")

        // 删除成功后刷新 ON_HOOK_STAGE 类型的接口数据
        const fetchData = async () => {
          try {
            const refreshParams = {
              botNo,
              taskId,
              startTime: dateRange[0].format("YYYY-MM-DD"),
              endTime: dateRange[1].format("YYYY-MM-DD"),
              metricCycle: "DAY",
              boardType: "ON_HOOK_STAGE"
            }

            const refreshResponse = await getBoardConfigInfo(refreshParams)
            if (
              refreshResponse?.status === 200 &&
              refreshResponse?.data &&
              Array.isArray(refreshResponse.data)
            ) {
              setConversionFunnelApiData(refreshResponse.data)
            } else {
              setConversionFunnelApiData([])
            }
          } catch (error) {
            console.error("刷新数据失败:", error)
            setConversionFunnelApiData([])
          }
        }

        await fetchData()
      } else {
        message.error(response?.message || "删除失败")
      }
    } catch (error) {
      console.error("删除配置失败:", error)
      message.error("删除失败，请重试")
    } finally {
      setLoading(false)
    }
  }, [taskId, botNo, dateRange])

  // 处理弹窗确认
  const handleFunnelEditOk = async (values) => {
    try {
      // 保存成功后，重新请求接口获取最新的漏斗数据
      // 使用 ON_HOOK_STAGE 作为 boardType 来获取最新的数据
      if (botNo && taskId && dateRange && dateRange.length === 2) {
        const fetchData = async () => {
          try {
            // 创建请求参数
            const params = {
              botNo,
              taskId,
              startTime: dateRange[0].format("YYYY-MM-DD"),
              endTime: dateRange[1].format("YYYY-MM-DD"),
              metricCycle: "DAY",
              boardType: "ON_HOOK_STAGE"
            }

            const response = await getBoardConfigInfo(params)

            if (response?.status === 200 && response?.data && Array.isArray(response.data)) {
              // 更新漏斗图数据
              setConversionFunnelApiData(response.data)
            } else {
              setConversionFunnelApiData([])
            }
          } catch (error) {
            console.error("获取最新通话转化率数据失败:", error)
            setConversionFunnelApiData([])
          }
        }

        await fetchData()
      }

      // 更新漏斗配置显示
      setFunnelConfig({
        dashboardName: values.dashboardName,
        analysisTarget: values.analysisTarget,
        displayFields: values.displayFields
      })

      console.log("保存漏斗配置成功:", values)
      setFunnelEditModalVisible(false)
    } catch (error) {
      console.error("保存失败:", error)
      throw error
    }
  }

  // 处理弹窗取消
  const handleFunnelEditCancel = () => {
    setFunnelEditModalVisible(false)
  }

  // 处理日期范围变化
  const handleDateRangeChange = (dates) => {
    setDateRange(dates)
  }

  // 指标卡片数据
  const metrics = (detail) => {
    return [
      {
        label: "名单总数",
        value: detail?.numberTotal?.toLocaleString(),
        tooltip: "需要拨打的用户名单总数"
      },
      {
        label: "拨打总数",
        value: overviewData?.dialTotal?.toLocaleString(),
        tooltip: "已拨打的通话总数"
      },
      {
        label: "接通总数",
        value: overviewData?.answerTotal?.toLocaleString(),
        tooltip: "用户已接通的通话总数"
      },
      {
        label: "通话总量",
        value: formatDurationToMinutes(overviewData?.totalDuration),
        tooltip: "通话时长总量"
      },
      {
        label: "平均通时",
        value: formatDurationToMinutes(overviewData?.averageDuration),
        tooltip: "平均通话时长（min） = 通话时长总量/接通总数"
      },
      {
        label: "30s 接通总数",
        value: overviewData?.duration30s,
        tooltip: "接通时长大于 30s 的通话总数"
      },
      {
        label: "10s 挂断总数",
        value: overviewData?.hangUpWithin10s,
        tooltip: "接通后 10s 内挂断的通话总数"
      }
    ]
  }

  // 柱状图配置
  const getColumnConfig = useCallback(
    (data, yField = "value") => ({
      data,
      xField: "name",
      yField,
      height: 300,
      padding: [20, 20, 40, 20],
      maxColumnWidth: 80,
      columnWidthRatio: 0.7,
      maxBarWidth: 60,
      label: false,
      color: "#8C71F6",
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
          formatter: (v) => {
            return `${v}%`
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
      },
      tooltip: {
        formatter: (datum) => {
          return {
            name: datum.type || "接通率",
            value: `${datum.value}%`
          }
        }
      }
    }),
    []
  )

  // 折线图配置
  const getLineConfig = useCallback(
    (data, title) => ({
      data,
      xField: "name",
      yField: "value",
      seriesField: "type",
      smooth: false,
      // 移除这里的高度设置，改为在组件中直接设置
      padding: [20, 20, 40, 20],
      color: "#8C71F6",
      autoFit: true, // 确保图表适应容器大小
      lineStyle: {
        lineWidth: 2
      },
      point: {
        size: 4,
        shape: "circle",
        style: {
          fill: "#8C71F6",
          stroke: "#fff",
          lineWidth: 2
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
          formatter: (v) => {
            return `${v}%`
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
      },
      tooltip: {
        formatter: (datum) => {
          return {
            name: title || datum.type,
            value: `${datum.value}%`
          }
        }
      }
    }),
    []
  )

  // 横向柱状图配置
  const barConfig = useMemo(
    () => ({
      data: durationFunnelData,
      xField: "value",
      yField: "type",
      seriesField: "type",
      legend: {
        position: "bottom",
        layout: "horizontal",
        flipPage: true,
        maxRow: 2,
        itemName: {
          style: {
            fill: "#6B7280"
          }
        }
      },
      height: 300,
      padding: [20, 20, 70, 60],
      color: ["#8C71F6", "#3FDEC9", "#4D7EE2", "#E34F6F", "#708AF5", "#36BA77"],
      label: {
        position: "right",
        formatter: (datum) => `${datum.value}次 (${datum.rate || 0}%)`,
        style: {
          fill: "#6B7280",
          fontSize: 12
        }
      },
      xAxis: {
        label: {
          style: {
            fill: "#6B7280",
            fontSize: 12
          }
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
      },
      yAxis: {
        label: {
          style: {
            fill: "#6B7280",
            fontSize: 12
          }
        }
      },
      tooltip: {
        formatter: (datum) => {
          return {
            name: datum.type || datum.name,
            value: `${datum.value}次`,
            占比: datum.rate ? `${datum.rate}%` : "0%"
          }
        }
      }
    }),
    [durationFunnelData]
  )

  // 更新 dateRangeRef 当 dateRange 变化时
  useEffect(() => {
    dateRangeRef.current = dateRange
  }, [dateRange])

  // 获取数据总览
  const handleFetchOverviewData = async (isRefresh) => {
    // 只有当所有必要参数都存在时才执行
    if (botNo && agentDetail?.agentNo && dateRange && dateRange.length === 2) {
      await fetchOverviewData(isRefresh)
    }
  }

  useEffect(() => {
    handleFetchOverviewData()
  }, [botNo, agentDetail?.agentNo, dateRange])

  // 获取名单接通率数据
  const handleFetchSingleChartConnectData = useCallback(async () => {
    if (botNo && taskId && dateRange && dateRange.length === 2) {
      try {
        const data = await fetchSingleChartData("NUMBER_COMPLETE_RATE", connectionPeriodType)
        if (data && Array.isArray(data)) {
          setNumberCompleteRateApiData(data)
        }
      } catch (error) {
        console.error("获取名单接通率数据失败:", error)
      }
    }
  }, [fetchSingleChartData, connectionPeriodType])

  useEffect(() => {
    handleFetchSingleChartConnectData()
  }, [handleFetchSingleChartConnectData])

  // 获取拨打接通率数据
  const handleFetchSingleChartCallData = useCallback(async () => {
    if (botNo && taskId && dateRange && dateRange.length === 2) {
      try {
        const data = await fetchSingleChartData("CALL_COMPLETE_RATE", callPeriodType)
        if (data && Array.isArray(data)) {
          setCallRateApiData(data)
        }
      } catch (error) {
        console.error("获取拨打接通率数据失败:", error)
      }
    }
  }, [fetchSingleChartData, callPeriodType])

  useEffect(() => {
    handleFetchSingleChartCallData()
  }, [handleFetchSingleChartCallData])

  // 获取30s接通率数据
  const handleFetchSingleChartThirtyData = useCallback(async () => {
    if (botNo && taskId && dateRange && dateRange.length === 2) {
      try {
        const data = await fetchSingleChartData("DURATION_30_RATE", thirtySecPeriodType)
        if (data && Array.isArray(data)) {
          setThirtySecRateApiData(data)
        }
      } catch (error) {
        console.error("获取30s接通率数据失败:", error)
      }
    }
  }, [fetchSingleChartData, thirtySecPeriodType])

  useEffect(() => {
    handleFetchSingleChartThirtyData()
  }, [handleFetchSingleChartThirtyData])

  // 获取10s挂断率数据
  const handleFetchSingleChartTenData = useCallback(async () => {
    if (botNo && taskId && dateRange && dateRange.length === 2) {
      try {
        const data = await fetchSingleChartData("HANG_UP_10s_RATE", tenSecPeriodType)
        if (data && Array.isArray(data)) {
          setTenSecRateApiData(data)
        }
      } catch (error) {
        console.error("获取10s挂断率数据失败:", error)
      }
    }
  }, [fetchSingleChartData, tenSecPeriodType])

  useEffect(() => {
    handleFetchSingleChartTenData()
  }, [handleFetchSingleChartTenData])

  // 获取平均通话时长数据
  const handleFetchSingleChartDurationData = useCallback(async () => {
    if (botNo && taskId && dateRange && dateRange.length === 2) {
      try {
        const data = await fetchSingleChartData("AVG_DURATION", durationPeriodType)
        if (data && Array.isArray(data)) {
          setAvgDurationApiData(data)
        }
      } catch (error) {
        console.error("获取平均通话时长数据失败:", error)
      }
    }
  }, [fetchSingleChartData, durationPeriodType])

  useEffect(() => {
    handleFetchSingleChartDurationData()
  }, [handleFetchSingleChartDurationData])

  // 获取通话时长漏斗数据
  const handleFetchSingleChartDurationFunnelData = useCallback(async () => {
    if (botNo && taskId && dateRange && dateRange.length === 2) {
      try {
        const data = await fetchSingleChartData("DURATION_TOTAL", durationFunnelPeriodType)
        if (data && Array.isArray(data)) {
          setDurationTotalApiData(data)
        }
      } catch (error) {
        console.error("获取通话时长漏斗数据失败:", error)
      }
    }
  }, [fetchSingleChartData, durationFunnelPeriodType])

  useEffect(() => {
    handleFetchSingleChartDurationFunnelData()
  }, [handleFetchSingleChartDurationFunnelData])

  // 获取通话转化率数据 - 使用 ON_HOOK_STAGE 作为 boardType
  const handleFetchSingleChartConversionData = useCallback(async () => {
    if (botNo && taskId && dateRange && dateRange.length === 2) {
      try {
        const data = await fetchSingleChartData("ON_HOOK_STAGE", "日")
        if (data && Array.isArray(data)) {
          setConversionFunnelApiData(data)
        } else {
          console.log("通话转化率数据为空或不是数组")
        }
      } catch (error) {
        console.error("获取通话转化率数据失败:", error)
      }
    }
  }, [fetchSingleChartData])

  useEffect(() => {
    handleFetchSingleChartConversionData()
  }, [handleFetchSingleChartConversionData])

  const refreshData = () => {
    return Promise.all([
      handleFetchOverviewData(true),
      handleFetchSingleChartConnectData(),
      handleFetchSingleChartCallData(),
      handleFetchSingleChartThirtyData(),
      handleFetchSingleChartTenData(),
      handleFetchSingleChartDurationData(),
      handleFetchSingleChartDurationFunnelData(),
      handleFetchSingleChartConversionData()
    ])
  }

  const autoRefreshData = useCallback(() => {
    clearTimeout(refreshTimerRef.current)
    refreshTimerRef.current = setTimeout(
      async () => {
        // 使用最新的 dateRange 来刷新数据
        await refreshData()
        // 递归调用，继续设置下一个5分钟定时器
        autoRefreshData()
      },
      5 * 60 * 1000
    )
  }, [refreshData]) // 添加 refreshData 作为依赖

  useEffect(() => {
    // 直接设置5分钟后执行第一次刷新
    autoRefreshData()
    return () => {
      clearTimeout(refreshTimerRef.current)
    }
  }, [autoRefreshData]) // 添加 autoRefreshData 作为依赖

  return (
    <Spin spinning={loading} tip="数据加载中...">
      <div className="space-y-6 p-5 bg-white rounded-[8px]">
        {/* 数据总览 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <h4 className="text-[14px] font-medium text-[#1F2937] m-0">数据总览</h4>
              <Tooltip title="过去时间段的数据总量统计">
                <InfoCircleOutlined className="ml-2 text-[14px] text-[#6B7280] cursor-help" />
              </Tooltip>
            </div>
            <Space>
              <RangeTimePicker
                onChange={handleDateRangeChange}
                placeholder={["开始日期", "结束日期"]}
                style={{ width: 280 }}
              />
              <Tooltip title="刷新当前页面数据">
                <Button
                  icon={<SyncOutlined />}
                  onClick={() => {
                    refreshData()
                    autoRefreshData()
                  }}
                  type="text"
                />
              </Tooltip>
            </Space>
          </div>

          {/* 指标卡片 */}
          <div className="grid grid-cols-4 gap-3">
            {metrics(overviewData).map((metric, index) => (
              <div
                key={index}
                className="bg-white rounded-md p-3"
                style={{ border: "1px solid #E5E7EB" }}
              >
                <div className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                  {metric.label}
                  <Tooltip title={metric.tooltip}>
                    <InfoCircleOutlined style={{ color: "#9CA3AF", fontSize: "14px" }} />
                  </Tooltip>
                </div>
                <div className="text-[28px] font-medium text-gray-900">
                  {metric.value}
                  {metric.trend !== undefined && (
                    <span
                      className={`text-sm ml-2 ${
                        metric.trend > 0
                          ? "text-green-500"
                          : metric.trend < 0
                            ? "text-red-500"
                            : "text-gray-500"
                      }`}
                    >
                      {metric.trend > 0 ? "↑" : metric.trend < 0 ? "↓" : ""}{" "}
                      {Math.abs(metric.trend)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 名单接通率 - 柱状图加折线图 */}
        <ConnectionRateChart
          connectionPeriodType={connectionPeriodType}
          setConnectionPeriodType={setConnectionPeriodType}
          connectionRateData={connectionRateData}
        />

        {/* 拨打接通率 - 也改为柱状图加折线图 */}
        <CallRateChart
          callPeriodType={callPeriodType}
          setCallPeriodType={setCallPeriodType}
          callRateData={callRateData}
        />

        {/* 30s接通率和10s挂断率 */}
        <Row gutter={16}>
          <Col span={12}>
            <ThirtySecRateChart
              thirtySecPeriodType={thirtySecPeriodType}
              setThirtySecPeriodType={setThirtySecPeriodType}
              thirtySecRateData={thirtySecRateData}
              getLineConfig={getLineConfig}
            />
          </Col>
          <Col span={12}>
            <TenSecRateChart
              tenSecPeriodType={tenSecPeriodType}
              setTenSecPeriodType={setTenSecPeriodType}
              tenSecRateData={tenSecRateData}
              getLineConfig={getLineConfig}
            />
          </Col>
        </Row>

        {/* 平均通话时长 */}
        <AvgDurationChart
          durationPeriodType={durationPeriodType}
          setDurationPeriodType={setDurationPeriodType}
          avgDurationData={avgDurationData}
          getColumnConfig={getColumnConfig}
        />

        {/* 通话时长漏斗 */}
        <DurationFunnelChart
          durationFunnelPeriodType={durationFunnelPeriodType}
          setDurationFunnelPeriodType={setDurationFunnelPeriodType}
          durationFunnelData={durationFunnelData}
          barConfig={barConfig}
        />

        {/* 通话转化率漏斗图 - 标准漏斗图样式  */}
        <ConversionFunnelChart
          conversionFunnelApiData={conversionFunnelApiData}
          conversionFunnelData={conversionFunnelData}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          taskId={taskId}
          botNo={botNo}
          agentNo={agentNo}
          isOnlyRead={isOnlyRead}
          dateRangeRef={dateRangeRef}
          setLoading={setLoading}
        />
      </div>

      {/* 漏斗编辑弹窗 */}
      <FunnelEditModal
        visible={funnelEditModalVisible}
        onCancel={handleFunnelEditCancel}
        onOk={handleFunnelEditOk}
        taskId={taskId}
        botNo={botNo}
      />
    </Spin>
  )
}

// 名单接通率图表组件
const ConnectionRateChart = memo(
  ({ connectionPeriodType, setConnectionPeriodType, connectionRateData }) => {
    return (
      <div className="bg-white rounded-xl p-3" style={{ border: "1px solid #E5E7EB" }}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Typography.Text style={{ fontSize: "14px", fontWeight: "500", color: "#1F2937" }}>
              名单接通率
            </Typography.Text>
            <Tooltip title="名单接通率=接通量/名单量">
              <InfoCircleOutlined className="ml-2 text-[14px] text-[#6B7280] cursor-help" />
            </Tooltip>
          </div>
          <ChartPeriod
            value={connectionPeriodType}
            onChange={(value) => {
              setConnectionPeriodType(value)
            }}
            options={["日", "周", "月"]}
          />
        </div>
        {connectionRateData.columnData?.length > 0 ? (
          <DualAxes
            data={[
              // 柱状图数据 - 表示拨打数量
              connectionRateData?.columnData?.map((item) => ({
                name: item.name,
                value: item.value,
                category: "名单量"
              })),
              // 折线图数据 - 表示接通率
              connectionRateData?.lineData?.map((item) => ({
                name: item.name,
                value: item.value ? parseFloat(item.value) : 0,
                category: "名单接通率"
              }))
            ]}
            xField="name"
            yField={["value", "value"]}
            height={300}
            padding={[20, 20, 40, 20]}
            geometryOptions={[
              {
                geometry: "column",
                color: "#8C71F6",
                columnWidthRatio: 0.7,
                maxColumnWidth: 80, // 调小柱状图宽度
                label: false,
                seriesField: "category"
              },
              {
                geometry: "line",
                color: "#3FDEC9",
                smooth: false,
                seriesField: "category",
                lineStyle: {
                  lineWidth: 2
                },
                point: {
                  size: 4,
                  shape: "circle",
                  style: {
                    fill: "#3FDEC9",
                    stroke: "#fff",
                    lineWidth: 2
                  }
                }
              }
            ]}
            xAxis={{
              label: {
                style: {
                  fill: "#6B7280",
                  fontSize: 12
                }
              }
            }}
            yAxis={[
              {
                grid: {
                  line: {
                    style: {
                      stroke: "#E4E7EC",
                      lineDash: [4, 4],
                      lineWidth: 0.8
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
              {
                title: {
                  text: "接通率(%)",
                  style: {
                    fontSize: 12,
                    fill: "#6B7280"
                  }
                },
                grid: {
                  line: {
                    style: {
                      stroke: "#E4E7EC",
                      lineDash: [4, 4],
                      lineWidth: 0.8
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
              }
            ]}
            legend={{
              position: "bottom",
              layout: "horizontal",
              itemName: {
                style: {
                  fill: "#6B7280"
                }
              }
            }}
            tooltip={{
              shared: true,
              showMarkers: false,
              formatter: (datum) => {
                if (datum.category === "名单量") {
                  return {
                    name: datum.category,
                    value: datum.value.toLocaleString()
                  }
                } else {
                  return {
                    name: datum.category,
                    value: `${datum.value}%`
                  }
                }
              },
              domStyles: {
                "g2-tooltip-title": {
                  fontWeight: 500
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
)

// 拨打接通率图表组件
const CallRateChart = memo(({ callPeriodType, setCallPeriodType, callRateData }) => {
  return (
    <div className="bg-white rounded-xl p-3" style={{ border: "1px solid #E5E7EB" }}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Typography.Text style={{ fontSize: "14px", fontWeight: "500", color: "#1F2937" }}>
            拨打接通率
          </Typography.Text>
          <Tooltip title="拨打接通率=接通量/拨打量">
            <InfoCircleOutlined className="ml-2 text-[14px] text-[#6B7280] cursor-help" />
          </Tooltip>
        </div>
        <ChartPeriod
          value={callPeriodType}
          onChange={(value) => {
            setCallPeriodType(value)
          }}
          options={["日", "周", "月"]}
        />
      </div>
      {callRateData.length > 0 ? (
        <DualAxes
          data={[
            // 柱状图数据 - 表示拨打数量
            callRateData.map((item) => ({
              name: item.name,
              value: item.value,
              category: "拨打量"
            })),
            // 折线图数据 - 表示接通率
            callRateData.map((item) => ({
              name: item.name,
              value: parseFloat(item.rate),
              category: "拨打接通率"
            }))
          ]}
          xField="name"
          yField={["value", "value"]}
          height={300}
          padding={[20, 20, 40, 20]}
          geometryOptions={[
            {
              geometry: "column",
              color: "#4D7EE2",
              columnWidthRatio: 0.5,
              maxColumnWidth: 80, // 调小柱状图宽度
              label: false,
              seriesField: "category"
            },
            {
              geometry: "line",
              color: "#E34F6F",
              smooth: false,
              seriesField: "category",
              lineStyle: {
                lineWidth: 2
              },
              point: {
                size: 4,
                shape: "circle",
                style: {
                  fill: "#E34F6F",
                  stroke: "#fff",
                  lineWidth: 2
                }
              }
            }
          ]}
          xAxis={{
            label: {
              style: {
                fill: "#6B7280",
                fontSize: 12
              }
            }
          }}
          yAxis={[
            {
              grid: {
                line: {
                  style: {
                    stroke: "#E4E7EC",
                    lineDash: [4, 4],
                    lineWidth: 0.8
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
            {
              title: {
                text: "拨打接通率(%)",
                style: {
                  fontSize: 12,
                  fill: "#6B7280"
                }
              },
              grid: {
                line: {
                  style: {
                    stroke: "#E4E7EC",
                    lineDash: [4, 4],
                    lineWidth: 0.8
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
            }
          ]}
          legend={{
            position: "bottom",
            layout: "horizontal",
            itemName: {
              style: {
                fill: "#6B7280"
              }
            }
          }}
          tooltip={{
            shared: true,
            showMarkers: false,
            formatter: (datum) => {
              if (datum.category === "拨打量") {
                return {
                  name: datum.category,
                  value: datum.value.toLocaleString()
                }
              } else {
                return {
                  name: datum.category,
                  value: `${datum.value}%`
                }
              }
            },
            domStyles: {
              "g2-tooltip-title": {
                fontWeight: 500
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
})

// 30s接通率图表组件
const ThirtySecRateChart = memo(
  ({ thirtySecPeriodType, setThirtySecPeriodType, thirtySecRateData, getLineConfig }) => {
    return (
      <div
        className="bg-white rounded-xl p-3"
        style={{ border: "1px solid #E5E7EB", height: "400px" }}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Typography.Text style={{ fontSize: "14px", fontWeight: "500", color: "#1F2937" }}>
              30s接通率
            </Typography.Text>
            <Tooltip title="接通时长大于 30s 通话率=接通时长大于 30s 通话量/接通量">
              <InfoCircleOutlined className="ml-2 text-[14px] text-[#6B7280] cursor-help" />
            </Tooltip>
          </div>
          <ChartPeriod
            value={thirtySecPeriodType}
            onChange={(value) => {
              setThirtySecPeriodType(value)
            }}
            options={["日", "周", "月"]}
          />
        </div>
        <div style={{ height: "320px" }}>
          {thirtySecRateData.length > 0 ? (
            <Line
              {...getLineConfig(thirtySecRateData, "30s接通率")}
              height={300}
              padding={[20, 20, 70, 40]}
              legend={{
                position: "bottom",
                layout: "horizontal",
                flipPage: true,
                maxRow: 2,
                itemName: {
                  style: {
                    fill: "#6B7280"
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
      </div>
    )
  }
)

// 10s挂断率图表组件
const TenSecRateChart = memo(
  ({ tenSecPeriodType, setTenSecPeriodType, tenSecRateData, getLineConfig }) => {
    return (
      <div
        className="bg-white rounded-xl p-3"
        style={{ border: "1px solid #E5E7EB", height: "400px" }}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Typography.Text style={{ fontSize: "14px", fontWeight: "500", color: "#1F2937" }}>
              10s挂断率
            </Typography.Text>
            <Tooltip title="接通后 10s 内挂断率=10s 内挂断通话量/接通量">
              <InfoCircleOutlined className="ml-2 text-[14px] text-[#6B7280] cursor-help" />
            </Tooltip>
          </div>
          <ChartPeriod
            value={tenSecPeriodType}
            onChange={(value) => {
              setTenSecPeriodType(value)
            }}
            options={["日", "周", "月"]}
          />
        </div>
        <div style={{ height: "320px" }}>
          {tenSecRateData.length > 0 ? (
            <Line
              {...getLineConfig(tenSecRateData, "10s挂断率")}
              height={300}
              padding={[20, 20, 70, 40]}
              legend={{
                position: "bottom",
                layout: "horizontal",
                flipPage: true,
                maxRow: 2,
                itemName: {
                  style: {
                    fill: "#6B7280"
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
      </div>
    )
  }
)

// 平均通话时长图表组件
const AvgDurationChart = memo(
  ({ durationPeriodType, setDurationPeriodType, avgDurationData, getColumnConfig }) => {
    return (
      <div className="bg-white rounded-xl p-3" style={{ border: "1px solid #E5E7EB" }}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Typography.Text style={{ fontSize: "14px", fontWeight: "500", color: "#1F2937" }}>
              平均通话时长
            </Typography.Text>
            <Tooltip title="平均通话时长=通话总时长/总接通量">
              <InfoCircleOutlined className="ml-2 text-[14px] text-[#6B7280] cursor-help" />
            </Tooltip>
          </div>
          <ChartPeriod
            value={durationPeriodType}
            onChange={(value) => {
              setDurationPeriodType(value)
            }}
            options={["日", "周", "月"]}
          />
        </div>
        {avgDurationData.length > 0 ? (
          <Column
            {...getColumnConfig(avgDurationData)}
            tooltip={{
              formatter: (datum) => {
                return {
                  name: "平均通话时长",
                  value: `${datum.value}s`
                }
              }
            }}
            padding={[20, 20, 30, 60]}
            legend={{
              position: "bottom",
              layout: "horizontal",
              itemName: {
                style: {
                  fill: "#6B7280"
                }
              }
            }}
            yAxis={{
              label: {
                style: {
                  fill: "#6B7280",
                  fontSize: 12
                },
                formatter: (v) => {
                  // 确保v是数字类型
                  const num = typeof v === "number" ? v : Number(v || 0)
                  return `${num}s`
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
)

// 通话时长漏斗图表组件
const DurationFunnelChart = memo(
  ({ durationFunnelPeriodType, setDurationFunnelPeriodType, durationFunnelData, barConfig }) => {
    return (
      <div className="bg-white rounded-xl p-3" style={{ border: "1px solid #E5E7EB" }}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Typography.Text style={{ fontSize: "14px", fontWeight: "500", color: "#1F2937" }}>
              通话时长漏斗
            </Typography.Text>
            <Tooltip title="通话时长分别大于 5s/10s/15s/30s/60s 等的占比及通话数量（例：5s 通话占比：5s 通话数量/通话总数量）">
              <InfoCircleOutlined className="ml-2 text-[14px] text-[#6B7280] cursor-help" />
            </Tooltip>
          </div>
          <ChartPeriod
            value={durationFunnelPeriodType}
            onChange={(value) => {
              setDurationFunnelPeriodType(value)
            }}
            options={["日", "周", "月"]}
          />
        </div>
        {durationFunnelData.length > 0 ? (
          <Bar {...barConfig} />
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
)

// 阶段分析图表组件
const ConversionFunnelChart = memo(
  ({
    conversionFunnelApiData,
    conversionFunnelData,
    handleEdit,
    handleDelete,
    taskId,
    botNo,
    agentNo,
    dateRangeRef,
    setLoading,
    isOnlyRead
  }) => {
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedData, setSelectedData] = useState(null)

    const handleCancel = () => {
      setModalOpen(false)
      navgateToVoiceRecord() // 跳转到语音记录
    }

    const handleOk = () => {
      setModalOpen(false)
      navigateToFlyWheel() // 跳转到数据飞轮
    }

    const navgateToVoiceRecord = async () => {
      // 确定 stageType: 1-蓝色(通过数据), 2-红色(过滤数据)
      const stageType = selectedData.type === "通过数据" ? 1 : 2
      const stage = selectedData.name

      // 显示 loading
      setLoading(true)

      try {
        const params = {
          taskId,
          botNo,
          stage,
          stageType
        }

        const response = await getOnHookStageList(params)

        if (response?.status === 200 && response?.data) {
          // 构造查询参数 - 修复 DataCloneError 问题
          postMessageForLX({
            type: MessageType.NAVIGATE_TO_VOICE_RECORD,
            payload: {
              robotCode: agentNo || undefined,
              startTime: dateRangeRef.current[0].format("YYYY-MM-DD 00:00:00"),
              endTime: dateRangeRef.current[1].format("YYYY-MM-DD 23:59:59"),
              stageList: response.data // 将数组转换为字符串
            }
          })
        }
      } catch (error) {
        console.error("获取挂机阶段列表失败:", error)
        message.error("跳转失败，请重试")
      } finally {
        setLoading(false)
      }
    }

    // 跳转到数据飞轮
    const navigateToFlyWheel = () => {
      const name = selectedData?.name
      setLoading(true)

      try {
        // 跳转
        postMessageForLX({
          type: MessageType.NAVIGATE_TO_FLYWHEEL,
          payload: {
            name,
            taskId,
            startTime: dateRangeRef.current[0].format("YYYY-MM-DD 00:00:00"),
            endTime: dateRangeRef.current[1].format("YYYY-MM-DD 23:59:59")
          }
        })
      } catch (error) {
        message.error("跳转失败，请重试")
      } finally {
        setLoading(false)
      }
    }

    return (
      <div className="bg-white rounded-xl p-3" style={{ border: "1px solid #E5E7EB" }}>
        <div className="flex justify-between items-center mb-4">
          {!!conversionFunnelApiData && !!conversionFunnelApiData.length && (
            <>
              <Typography.Text style={{ fontSize: "14px", fontWeight: "500", color: "#1F2937" }}>
                {conversionFunnelApiData?.[0]?.title || "业务阶段看板"}
              </Typography.Text>
              <div>
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={handleEdit}
                  style={{ color: "#6B7280" }}
                  disabled={isOnlyRead}
                >
                  编辑
                </Button>
                <Popconfirm
                  title="确认删除"
                  description="确定要删除这个业务阶段看板配置吗？"
                  onConfirm={handleDelete}
                  okText="确定"
                  cancelText="取消"
                  disabled={isOnlyRead}
                >
                  <Button type="text" icon={<DeleteOutlined />} style={{ color: "#6B7280" }}>
                    删除
                  </Button>
                </Popconfirm>
              </div>
            </>
          )}
        </div>

        {!conversionFunnelApiData || conversionFunnelApiData.length === 0 ? (
          <div
            style={{
              height: 300,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center"
            }}
          >
            <div style={{ marginBottom: "16px", color: "#6B7280" }}>
              当前暂未配置业务阶段看板，可点击下方按钮创建
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleEdit}
              disabled={isOnlyRead}
              style={{
                backgroundColor: "#8C71F6",
                borderColor: "#8C71F6"
              }}
            >
              业务阶段看板
            </Button>
          </div>
        ) : conversionFunnelData && conversionFunnelData.length > 0 ? (
          <div className="funnel-chart-container">
            <Bar
              data={conversionFunnelData.flatMap((item) => [
                { ...item, type: "通过数据", value: item.value || 0 },
                { ...item, type: "过滤数据", value: item.value2 || 0 }
              ])}
              xField="value"
              yField="name"
              seriesField="type"
              isStack={true}
              height={600}
              padding={[
                20,
                60,
                50,
                Math.max(
                  25,
                  25 +
                    12 *
                      ((conversionFunnelApiData.reduce((prev, current) => {
                        return (current.name?.length || 0) > (prev.name?.length || 0)
                          ? current
                          : prev
                      })?.name?.length || 0) -
                        1)
                )
              ]}
              color={["#5B8FF9", "#FF4D4F"]}
              maxBarWidth={30}
              label={{
                position: "right",
                offsetX: -25,
                formatter: (datum) => {
                  // 只在总和大于0时显示标签
                  const total = datum.value || 0
                  return total > 0 ? total.toLocaleString() : ""
                },
                style: {
                  fill: "#000000",
                  fontSize: 12,
                  fontWeight: 500,
                  textAlign: "center",
                  shadowBlur: 2,
                  shadowColor: "rgba(255, 255, 255, 0.8)"
                }
              }}
              xAxis={{
                label: {
                  style: {
                    fill: "#6B7280",
                    fontSize: 12
                  },
                  formatter: (v) => `${Number(v).toLocaleString()}`
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
              }}
              yAxis={{
                label: {
                  style: {
                    fill: "#6B7280",
                    fontSize: 12
                  }
                }
              }}
              tooltip={{
                customContent: (title, items) => {
                  if (!items || items.length === 0) return null

                  // 获取当前阶段的数据
                  const currentItem = conversionFunnelData.find((item) => item.name === title)
                  const passValue = currentItem?.value || 0
                  const filterValue = currentItem?.value2 || 0
                  const total = passValue + filterValue

                  // 计算流转比例：通过数据/(通过数据+过滤数据)
                  const conversionRate = total > 0 ? ((passValue / total) * 100).toFixed(2) : "0.00"

                  return `
                    <div style="padding: 8px 0px;">
                      <div style="font-weight: 500; color: #000; margin-bottom: 12px;">
                        ${title} 
                        <span style="font-size:12px; color: #969696; ">【点击跳转语音搜索记录】</span>
                      </div>
                      ${items
                        .map(
                          (item) => `
                        <div style="display: flex; align-items: center; margin-bottom: 8px;">
                          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${item.color}; margin-right: 8px;"></span>
                          <span style="font-weight: 400; color: rgb(31, 41, 55); margin-right: 12px;">${item.name}:</span>
                          <span style="font-weight: 400; color: #969696;">${item.value}</span>
                        </div>
                      `
                        )
                        .join("")}
                      <div style="display: flex; align-items: center; margin-top: 4px; padding-top: 8px; border-top: 1px solid #f0f0f0;">
                        <span style="font-weight: 400; color: rgb(31, 41, 55); margin-right: 12px;">流转比例:</span>
                        <span style="font-weight: 400; color: #969696;">${conversionRate}%</span>
                      </div>
                    </div>
                  `
                }
              }}
              legend={{
                position: "bottom",
                layout: "horizontal",
                visible: true,
                itemName: {
                  formatter: (item) => {
                    if (item === "通过数据") {
                      return "通过数据"
                    } else if (item === "过滤数据") {
                      return "过滤数据"
                    }
                    return item
                  },
                  style: {
                    fill: "#6B7280",
                    fontSize: 12
                  }
                }
              }}
              onReady={(plot) => {
                // 添加鼠标悬停效果
                plot.on("element:mouseenter", (evt) => {
                  const element = evt.target
                  element.attr("cursor", "pointer")
                })

                plot.on("element:mouseleave", (evt) => {
                  const element = evt.target
                  element.attr("cursor", "default")
                })

                // 点击事件
                plot.on("element:click", async (evt) => {
                  const data = evt.data?.data // 提取实际的数据
                  if (data) {
                    setSelectedData(data)
                  }
                  setModalOpen(true)
                })
              }}
            />
          </div>
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

        <Modal
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          footer={[
            <Button key="flywheel" type="primary" onClick={handleOk}>
              数据飞轮
            </Button>,
            <Button key="voice" type="primary" onClick={handleCancel}>
              语音记录
            </Button>
          ]}
        >
          <span className="text-[20px] font-bold">请选择跳转目标</span>
        </Modal>
      </div>
    )
  }
)

export default VoiceDataPanel
