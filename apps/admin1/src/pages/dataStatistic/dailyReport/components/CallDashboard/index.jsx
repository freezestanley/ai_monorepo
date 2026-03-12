import { useCallback, useMemo, useState, useEffect, useRef } from "react"
import { debounce } from "lodash"
import {
  fetchDashboardKPI,
  fetchDashboardBar,
  fetchDashboardLine,
  exportDashboardView
} from "@/api/dashboard"
import { fetchBotList } from "@/api/bot/api"
import { queryModelBilling } from "@/api/dailyReport/api"
import {
  Col,
  Row,
  Space,
  Typography,
  Segmented,
  Tooltip,
  Button,
  message,
  Select,
  Spin
} from "antd"
import { DownloadOutlined } from "@ant-design/icons"
import { Column, Line } from "@ant-design/plots"
import CallTrend from "../../ChartsComponents/CallTrend"
import ProportionCircular from "../../ChartsComponents/ProportionCircular"
import CommonColumn from "../../ChartsComponents/CommonColumn"
import ModelBillingChart from "../../ChartsComponents/ModelBillingChart"
import { tooltipContent } from "./mockData"
import MiniTrendChart from "./MiniTrendChart"
import ModelCallsTables from "./ModelCallsTables"
import RangeTimePicker from "@/components/RangeTime"
import { adjustQueryDateRange } from "@/utils/dateRangeAdjuster"
import dayjs from "dayjs"

const { Text } = Typography

function CallDashboard({
  form,
  groupList,
  botList,
  startTime: propsStartTime,
  endTime: propsEndTime,
  botNo,
  iframeStyle,
  watch,
  onSearch,
  numberList,
  segmentedOptions,
  segmentValue,
  trendPlotsData,
  pieData1,
  pieData2,
  topRobots,
  topSkills,
  topUsers,
  setTrendPlotsData
}) {
  // 使用组件内部独立的时间状态，默认值是最近7天
  const [startTime, setStartTime] = useState(dayjs().subtract(6, "day").startOf("day"))
  const [endTime, setEndTime] = useState(dayjs().endOf("day"))

  // 空间筛选状态
  const [selectedBotNos, setSelectedBotNos] = useState([])
  const [botListData, setBotListData] = useState([])
  const [botListLoading, setBotListLoading] = useState(false)

  // 活跃空间柱状图的状态
  const [activeBotsChartType, setActiveBotsChartType] = useState("daily")

  // 活跃空间数柱状图数据
  const [activeBotsBarData, setActiveBotsBarData] = useState([])

  // 大模型调用次数柱状图数据
  const [modelCallsBarData, setModelCallsBarData] = useState([])

  // 活跃工作流图表的状态
  const [activeSkillsChartType, setActiveSkillsChartType] = useState("daily")

  // 工作流调用次数图表的状态
  const [skillCallsChartType, setSkillCallsChartType] = useState("daily")

  // 活跃Agent数图表的状态
  const [activeAgentsChartType, setActiveAgentsChartType] = useState("daily")

  // Agent调用次数图表的状态
  const [agentCallsChartType, setAgentCallsChartType] = useState("daily")

  // 知识库数据量图表的状态
  const [documentKBChartType, setDocumentKBChartType] = useState("daily")
  const [qaKBChartType, setQaKBChartType] = useState("daily")
  const [structuredKBChartType, setStructuredKBChartType] = useState("daily")

  // 大模型调用次数图表的状态
  const [modelCallsChartType, setModelCallsChartType] = useState("daily")

  // 模型计费数据状态
  const [modelBillingData, setModelBillingData] = useState([])
  const [totalModelBilling, setTotalModelBilling] = useState(0)
  const [adjustedStartTime, setAdjustedStartTime] = useState(null)
  const [adjustedEndTime, setAdjustedEndTime] = useState(null)

  // KPI数据状态
  const [kpiData, setKpiData] = useState({
    activeBotsUsers: {
      activeBots: 0,
      activeUsers: 0
    },
    activeAgentsSkills: {
      activeAgents: 0,
      activeSklls: 0,
      skillCalls: 0
    },
    activeAgentsCalls: {
      activeAgents: 0,
      agentCalls: 0
    },
    calledModels: {
      calledModels: 0,
      modelCalls: 0
    },
    knowledgeBases: 0
  })

  // 折线图数据状态
  const [activeSkillsData, setActiveSkillsData] = useState([])
  const [skillCallsData, setSkillCallsData] = useState([])
  const [activeAgentsData, setActiveAgentsData] = useState([])
  const [agentCallsData, setAgentCallsData] = useState([])
  const [documentKBData, setDocumentKBData] = useState([])
  const [qaKBData, setQaKBData] = useState([])
  const [structuredKBData, setStructuredKBData] = useState([])

  // metricCycle 映射（组件内部用 daily/weekly/monthly）
  const metricCycleMap = useMemo(
    () => ({
      daily: "DAY",
      weekly: "WEEK",
      monthly: "MONTH"
    }),
    []
  )

  // 防抖引用和loading状态管理
  const debouncedFetchDataRef = useRef()
  const [isFetching, setIsFetching] = useState(false)
  const [kpiLoading, setKpiLoading] = useState(false)

  // 优化后的防抖函数 - 简化逻辑，避免依赖 isFetching 状态
  const debouncedFetchData = useCallback(
    debounce(async () => {
      if (startTime && endTime) {
        setIsFetching(true)
        try {
          // 使用 Promise.all 并行请求所有数据
          await Promise.all([
            fetchKpiData(startTime, endTime),
            fetchActiveBotsBarData({
              start: startTime,
              end: endTime,
              metricCycle: metricCycleMap[activeBotsChartType] || "DAY"
            }),
            fetchModelCallsBarData({
              start: startTime,
              end: endTime,
              metricCycle: metricCycleMap[modelCallsChartType] || "DAY"
            }),
            fetchLineData({
              start: startTime,
              end: endTime,
              metricCycle: metricCycleMap[activeSkillsChartType] || "DAY",
              queryType: "active_skill_count",
              setter: setActiveSkillsData,
              yField: "activeSkills"
            }),
            fetchLineData({
              start: startTime,
              end: endTime,
              metricCycle: metricCycleMap[skillCallsChartType] || "DAY",
              queryType: "skill_call_count",
              setter: setSkillCallsData,
              yField: "skillCalls"
            }),
            fetchLineData({
              start: startTime,
              end: endTime,
              metricCycle: metricCycleMap[activeAgentsChartType] || "DAY",
              queryType: "active_agent_count",
              setter: setActiveAgentsData,
              yField: "activeAgents"
            }),
            fetchLineData({
              start: startTime,
              end: endTime,
              metricCycle: metricCycleMap[agentCallsChartType] || "DAY",
              queryType: "agent_call_count",
              setter: setAgentCallsData,
              yField: "agentCalls"
            }),
            fetchLineData({
              start: startTime,
              end: endTime,
              metricCycle: metricCycleMap[documentKBChartType] || "DAY",
              queryType: "doc_knowledge_count",
              setter: setDocumentKBData,
              yField: "documentKB"
            }),
            fetchLineData({
              start: startTime,
              end: endTime,
              metricCycle: metricCycleMap[qaKBChartType] || "DAY",
              queryType: "qa_knowledge_count",
              setter: setQaKBData,
              yField: "qaKB"
            }),
            fetchLineData({
              start: startTime,
              end: endTime,
              metricCycle: metricCycleMap[structuredKBChartType] || "DAY",
              queryType: "structured_knowledge_count",
              setter: setStructuredKBData,
              yField: "structuredKB"
            })
          ])
        } catch (error) {
          console.error("数据刷新失败:", error)
        } finally {
          setIsFetching(false)
        }
      }
    }, 300), // 优化防抖延迟为300ms
    [
      startTime,
      endTime,
      activeBotsChartType,
      modelCallsChartType,
      activeSkillsChartType,
      skillCallsChartType,
      activeAgentsChartType,
      agentCallsChartType,
      documentKBChartType,
      qaKBChartType,
      structuredKBChartType,
      selectedBotNos // 添加 selectedBotNos 依赖
    ]
  )

  // 初始化防抖函数
  useEffect(() => {
    debouncedFetchDataRef.current = debouncedFetchData

    return () => {
      debouncedFetchDataRef.current?.cancel()
    }
  }, [debouncedFetchData])

  // 获取空间列表
  useEffect(() => {
    const loadBotList = async () => {
      setBotListLoading(true)
      try {
        const bots = await fetchBotList()
        setBotListData(bots || [])
      } catch (error) {
        console.error("获取空间列表失败:", error)
        setBotListData([])
      } finally {
        setBotListLoading(false)
      }
    }

    loadBotList()
  }, [])

  // 处理空间筛选变化
  const handleBotFilterChange = useCallback(
    (selectedValues) => {
      setSelectedBotNos(selectedValues)
      // 使用防抖函数，确保使用最新的 selectedBotNos 值
      if (startTime && endTime) {
        // 取消之前的防抖调用
        debouncedFetchDataRef.current?.cancel()
        // 使用 setTimeout 确保状态更新后再执行数据获取
        setTimeout(() => {
          debouncedFetchDataRef.current?.()
        }, 0)
      }
    },
    [startTime, endTime]
  )

  // 获取活跃空间数柱状图数据
  const fetchActiveBotsBarData = useCallback(
    async ({ start, end, metricCycle }) => {
      try {
        const params = {
          metricCycle,
          queryType: "active_robot_count",
          startTime: dayjs(start).format("YYYY-MM-DD"),
          endTime: dayjs(end).format("YYYY-MM-DD")
        }

        // 如果选择了空间，添加 botNoList 参数
        if (selectedBotNos.length > 0) {
          params.botNoList = selectedBotNos
        }

        const res = await fetchDashboardBar(params)

        const payload = res?.data ?? res
        // 后端字段可能是 xAxis 或 xaxis
        const xAxis = payload?.xAxis || payload?.xaxis || []
        const series = payload?.series || []

        // 转成 antd plots Column 需要的扁平数据：[{ date, name, count }]
        const chartData = []
        series.forEach((s) => {
          const arr = Array.isArray(s.data) ? s.data : []
          xAxis.forEach((x, idx) => {
            chartData.push({
              date: x,
              name: s.name,
              count: Number(arr[idx] ?? 0)
            })
          })
        })

        setActiveBotsBarData(chartData)
      } catch (error) {
        console.error("获取活跃空间数柱状图失败:", error)
        setActiveBotsBarData([])
      }
    },
    [selectedBotNos]
  )

  // 获取大模型调用次数柱状图数据
  const fetchModelCallsBarData = useCallback(
    async ({ start, end, metricCycle }) => {
      try {
        const params = {
          metricCycle,
          queryType: "big_model_call_count",
          startTime: dayjs(start).format("YYYY-MM-DD"),
          endTime: dayjs(end).format("YYYY-MM-DD")
        }

        // 如果选择了空间，添加 botNoList 参数
        if (selectedBotNos.length > 0) {
          params.botNoList = selectedBotNos
        }

        const res = await fetchDashboardBar(params)

        const payload = res?.data ?? res
        const xAxis = payload?.xAxis || payload?.xaxis || []
        const series = payload?.series || []

        const chartData = []
        series.forEach((s) => {
          const arr = Array.isArray(s.data) ? s.data : []
          xAxis.forEach((x, idx) => {
            chartData.push({
              date: x,
              name: s.name,
              count: Number(arr[idx] ?? 0)
            })
          })
        })

        setModelCallsBarData(chartData)
      } catch (error) {
        console.error("获取大模型调用次数柱状图失败:", error)
        setModelCallsBarData([])
      }
    },
    [selectedBotNos]
  )

  // 获取KPI数据
  const fetchKpiData = useCallback(
    async (start, end) => {
      try {
        const params = {
          startTime: dayjs(start).format("YYYY-MM-DD"),
          endTime: dayjs(end).format("YYYY-MM-DD")
        }

        // 如果选择了空间，添加 botNoList 参数
        if (selectedBotNos.length > 0) {
          params.botNoList = selectedBotNos
        }

        setKpiLoading(true)
        const res = await fetchDashboardKPI(params)

        // 兼容后端返回：res 可能是数组 / { data: [...] } / { data: { data: [...] } }
        const list =
          (Array.isArray(res) && res) ||
          (Array.isArray(res?.data) && res.data) ||
          (Array.isArray(res?.data?.data) && res.data.data) ||
          []

        if (Array.isArray(list) && list.length) {
          const data = list.reduce(
            (acc, item) => {
              const value = item.value ? parseInt(item.value, 10) : 0

              switch (item.key) {
                case "active_robot_count":
                  acc.activeBotsUsers.activeBots = value
                  break
                case "active_users_count":
                  acc.activeBotsUsers.activeUsers = value
                  break
                case "active_skill_count":
                  acc.activeAgentsSkills.activeSklls = value
                  break
                case "active_agent_count":
                  acc.activeAgentsSkills.activeAgents = value
                  acc.activeAgentsCalls.activeAgents = value
                  break
                case "skill_call_count":
                  acc.activeAgentsSkills.skillCalls = value
                  break
                case "agent_call_count":
                  acc.activeAgentsCalls.agentCalls = value
                  break
                case "model_call_count":
                  acc.calledModels.calledModels = value
                  break
                case "model_token_all_count":
                  acc.calledModels.modelCalls = value
                  break
                case "knowledge_data_count":
                  acc.knowledgeBases = value
                  break
              }
              return acc
            },
            {
              activeBotsUsers: { activeBots: 0, activeUsers: 0 },
              activeAgentsSkills: { activeAgents: 0, activeSklls: 0, skillCalls: 0 },
              activeAgentsCalls: { activeAgents: 0, agentCalls: 0 },
              calledModels: { calledModels: 0, modelCalls: 0 },
              knowledgeBases: 0
            }
          )

          setKpiData(data)
        }

        setKpiLoading(false)
      } catch (error) {
        setKpiLoading(false)
        console.error("获取KPI数据失败:", error)
      }
    },
    [selectedBotNos]
  )

  // 获取折线图数据
  const fetchLineData = useCallback(
    async ({ start, end, metricCycle, queryType, setter, yField }) => {
      try {
        const params = {
          metricCycle,
          queryType,
          startTime: dayjs(start).format("YYYY-MM-DD"),
          endTime: dayjs(end).format("YYYY-MM-DD")
        }

        // 如果选择了空间，添加 botNoList 参数
        if (selectedBotNos.length > 0) {
          params.botNoList = selectedBotNos
        }

        const res = await fetchDashboardLine(params)

        const payload = res?.data ?? res
        const xAxis = payload?.xAxis || payload?.xaxis || []
        const series = payload?.series || []

        // 折线图使用扁平数据：[{ date, value }]
        // 这里默认取第一条 series（如果后端会返回多条，可再扩展成 multi-series）
        const first = series?.[0]
        const arr = Array.isArray(first?.data) ? first.data : []

        const chartData = xAxis.map((x, idx) => ({
          date: x,
          [yField]: Number(arr[idx] ?? 0)
        }))

        setter(chartData)
      } catch (error) {
        console.error(`获取折线图失败(${queryType}):`, error)
        setter([])
      }
    },
    [selectedBotNos]
  )

  // 获取模型计费数据
  const fetchModelBillingData = useCallback(
    async (start, end) => {
      if (!botNo) {
        setModelBillingData({})
        setTotalModelBilling(0)
        return
      }

      try {
        const { adjustedStartTime, adjustedEndTime, isValid, errorMsg } = adjustQueryDateRange(
          start,
          end
        )

        if (!isValid) {
          setModelBillingData({
            success: false,
            msg: errorMsg
          })
          setTotalModelBilling(0)
          return
        }

        setAdjustedStartTime(adjustedStartTime.startOf("day").valueOf())
        setAdjustedEndTime(adjustedEndTime.endOf("day").valueOf())

        const response = await queryModelBilling(
          {
            startTime: adjustedStartTime.startOf("day").valueOf(),
            endTime: adjustedEndTime.endOf("day").valueOf(),
            unit: "day"
          },
          botNo
        )

        if (response?.success === false) {
          setModelBillingData({
            success: false,
            msg: response.msg || response.errorMsg || "查询失败"
          })
          setTotalModelBilling(0)
        } else {
          setModelBillingData(response?.data || {})
          setTotalModelBilling(response?.data?.totalAmount || 0)
        }
      } catch (error) {
        console.error("获取模型计费数据失败:", error)
        setModelBillingData({
          success: false,
          msg: error.message || "查询失败"
        })
        setTotalModelBilling(0)
      }
    },
    [botNo]
  )

  // 页面初始化/父级时间变化时触发一次（仅依赖 startTime/endTime）
  useEffect(() => {
    if (startTime && endTime) {
      // 只在时间范围变化时刷新：KPI + 所有图表（使用当前的图表类型）
      fetchKpiData(startTime, endTime)

      fetchActiveBotsBarData({
        start: startTime,
        end: endTime,
        metricCycle: metricCycleMap[activeBotsChartType] || "DAY"
      })

      fetchModelCallsBarData({
        start: startTime,
        end: endTime,
        metricCycle: metricCycleMap[modelCallsChartType] || "DAY"
      })

      // 折线图：首次/时间变化时拉取
      fetchLineData({
        start: startTime,
        end: endTime,
        metricCycle: metricCycleMap[activeSkillsChartType] || "DAY",
        queryType: "active_skill_count",
        setter: setActiveSkillsData,
        yField: "activeSkills"
      })
      fetchLineData({
        start: startTime,
        end: endTime,
        metricCycle: metricCycleMap[skillCallsChartType] || "DAY",
        queryType: "skill_call_count",
        setter: setSkillCallsData,
        yField: "skillCalls"
      })
      fetchLineData({
        start: startTime,
        end: endTime,
        metricCycle: metricCycleMap[activeAgentsChartType] || "DAY",
        queryType: "active_agent_count",
        setter: setActiveAgentsData,
        yField: "activeAgents"
      })
      fetchLineData({
        start: startTime,
        end: endTime,
        metricCycle: metricCycleMap[agentCallsChartType] || "DAY",
        queryType: "agent_call_count",
        setter: setAgentCallsData,
        yField: "agentCalls"
      })
      fetchLineData({
        start: startTime,
        end: endTime,
        metricCycle: metricCycleMap[documentKBChartType] || "DAY",
        queryType: "doc_knowledge_count",
        setter: setDocumentKBData,
        yField: "documentKB"
      })
      fetchLineData({
        start: startTime,
        end: endTime,
        metricCycle: metricCycleMap[qaKBChartType] || "DAY",
        queryType: "qa_knowledge_count",
        setter: setQaKBData,
        yField: "qaKB"
      })
      fetchLineData({
        start: startTime,
        end: endTime,
        metricCycle: metricCycleMap[structuredKBChartType] || "DAY",
        queryType: "structured_knowledge_count",
        setter: setStructuredKBData,
        yField: "structuredKB"
      })

      // 获取模型计费数据
      fetchModelBillingData(startTime, endTime)
    }
  }, [startTime, endTime])

  // 加载状态
  const [loading, setLoading] = useState(false)

  // 处理时间筛选的回调函数 - 只更新内部时间状态，useEffect 会自动触发所有接口请求
  const handleTimeRangeChange = useCallback((timeRange) => {
    console.log("时间范围变化:", timeRange)
    if (timeRange && timeRange.length === 2) {
      setStartTime(timeRange[0])
      setEndTime(timeRange[1])
    }
  }, [])

  const overviewChart = useMemo(
    () => (
      <div className="bg-white">
        {/* 数据总览标题和时间筛选器 - 左右布局 */}
        <div className="flex justify-between items-center mb-3">
          <Text style={{ fontSize: "16px", fontWeight: "500", color: "#1F2937" }}>数据总览</Text>
          <div className="flex items-center gap-3">
            {/* 空间筛选器 - 优化版 */}
            <div className="flex items-center gap-2">
              {botListLoading ? (
                <Spin size="small" />
              ) : (
                <Select
                  mode="multiple"
                  style={{ width: 300 }}
                  placeholder="请选择空间"
                  // value={selectedBotNos}
                  onChange={handleBotFilterChange}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                  optionFilterProp="label"
                  allowClear
                  maxTagCount="responsive"
                  maxTagTextLength={10}
                  // loading={isFetching}
                  options={botListData.map((bot) => ({
                    value: bot.botNo,
                    label: bot.botName,
                    title: bot.botName
                  }))}
                />
              )}
            </div>
            <RangeTimePicker
              onChange={handleTimeRangeChange}
              defaultValue={startTime && endTime ? [startTime, endTime] : undefined}
            />
          </div>
        </div>

        <Spin size="small" spinning={kpiLoading}>
          <Row gutter={15} justify="space-between">
            {/* 活跃空间/活跃用户数 */}
            <Col flex="1">
              <div className="border border-gray-200 rounded-lg p-4 text-left relative overflow-hidden">
                <div className="flex items-center justify-start mb-3">
                  <Text className="text-gray-500 text-xs mr-1">活跃空间</Text>
                  <Tooltip title={"时间范围内，存在调用/调试操作的空间"}>
                    <span className="text-gray-400 cursor-help">?</span>
                  </Tooltip>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-4">
                  {kpiData.activeBotsUsers.activeBots}
                </div>
                <div className="flex items-center justify-start">
                  <Text className="text-gray-500 text-xs mr-1">活跃用户数</Text>
                  <Tooltip title={"时间范围内，反问空间用户 UV"}>
                    <span className="text-gray-400 cursor-help">?</span>
                  </Tooltip>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {kpiData.activeBotsUsers.activeUsers}
                </div>
                <MiniTrendChart index={0} />
              </div>
            </Col>

            {/* 活跃 Agent 数/工作流调用次数 */}
            <Col flex="1">
              <div className="border border-gray-200 rounded-lg p-4 text-left relative overflow-hidden">
                <div className="flex items-center justify-start mb-3">
                  <Text className="text-gray-500 text-xs mr-1">活跃工作流数</Text>
                  <Tooltip title={"时间范围内，存在调用/调试操作的工作流"}>
                    <span className="text-gray-400 cursor-help">?</span>
                  </Tooltip>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-4">
                  {kpiData.activeAgentsSkills.activeSklls}
                </div>
                <div className="flex items-center justify-start">
                  <Text className="text-gray-500 text-xs mr-1">工作流调用次数</Text>
                  <Tooltip title={"工作流被调用的总次数"}>
                    <span className="text-gray-400 cursor-help">?</span>
                  </Tooltip>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {kpiData.activeAgentsSkills.skillCalls}
                </div>
                <MiniTrendChart index={1} />
              </div>
            </Col>

            {/* 活跃 Agent 数/Agent 调用次数 */}
            <Col flex="1">
              <div className="border border-gray-200 rounded-lg p-4 text-left relative overflow-hidden">
                <div className="flex items-center justify-start mb-3">
                  <Text className="text-gray-500 text-xs mr-1">活跃 Agent 数</Text>
                  <Tooltip title={"时间范围内，存在调用/调试操作的 Agent"}>
                    <span className="text-gray-400 cursor-help">?</span>
                  </Tooltip>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-4">
                  {kpiData.activeAgentsCalls.activeAgents}
                </div>
                <div className="flex items-center justify-start">
                  <Text className="text-gray-500 text-xs mr-1">Agent 调用次数</Text>
                  <Tooltip title={"活跃 Agent 被调用的总次数"}>
                    <span className="text-gray-400 cursor-help">?</span>
                  </Tooltip>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {kpiData.activeAgentsCalls.agentCalls}
                </div>
                <MiniTrendChart index={2} />
              </div>
            </Col>

            {/* 被调用模型数/模型调用量 */}
            <Col flex="1">
              <div className="border border-gray-200 rounded-lg p-4 text-left relative overflow-hidden">
                <div className="flex items-center justify-start mb-3">
                  <Text className="text-gray-500 text-xs mr-1">被调用模型数</Text>
                  <Tooltip title={"时间范围内，被调用的大模型数量"}>
                    <span className="text-gray-400 cursor-help">?</span>
                  </Tooltip>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-4">
                  {kpiData.calledModels.calledModels}
                </div>
                <div className="flex items-center justify-start">
                  <Text className="text-gray-500 text-xs mr-1">模型调用量</Text>
                  <Tooltip title={"时间范围内，大模型上行+下行 Token 调用总数量"}>
                    <span className="text-gray-400 cursor-help">?</span>
                  </Tooltip>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {kpiData.calledModels.modelCalls}
                </div>
                <MiniTrendChart index={3} />
              </div>
            </Col>

            {/* 知识库数量 */}
            <Col flex="1">
              <div className="border border-gray-200 rounded-lg p-4 text-left relative overflow-hidden">
                <div className="flex items-center justify-start mb-3">
                  <Text className="text-gray-500 text-xs mr-1">知识库数量</Text>
                  <Tooltip title={tooltipContent.knowledgeBases}>
                    <span className="text-gray-400 cursor-help">?</span>
                  </Tooltip>
                </div>
                <div className="text-3xl font-bold text-gray-900">{kpiData.knowledgeBases}</div>
                <MiniTrendChart index={4} />
              </div>
            </Col>
          </Row>
        </Spin>
      </div>
    ),
    [handleTimeRangeChange, kpiData, startTime, endTime]
  )

  // 导出功能处理函数
  const handleExport = useCallback(async (viewType, queryParams, title) => {
    message.loading("导出中...")
    try {
      const success = await exportDashboardView({ viewType, queryParams, title })
      if (success) {
        message.destroy()
        message.success("导出成功")
      } else {
        message.destroy()
        message.error("导出失败")
      }
    } catch (error) {
      message.destroy()
      console.error("导出错误:", error)
      message.error("导出失败")
    }
  }, [])

  // 活跃空间柱状图
  const activeBotsChart = useMemo(() => {
    const data = activeBotsBarData

    const config = {
      data,
      xField: "date",
      yField: "count",
      color: "#8370EE",
      columnStyle: {
        radius: [4, 4, 0, 0],
        maxWidth: 80
      },
      label: {
        position: "top",
        offset: 8,
        style: {
          fill: "#1F2937",
          fontSize: 12,
          fontWeight: 500,
          textAlign: "center"
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
        grid: {
          line: {
            style: {
              stroke: "#E5E7EB",
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
      tooltip: {
        showMarkers: false,
        formatter: (datum) => {
          return { name: "活跃空间数", value: datum.count }
        }
      },
      height: 220
    }

    return (
      <div className="bg-white rounded-xl p-4 mt-6" style={{ border: "1px solid #E5E7EB" }}>
        <div className="flex justify-between items-center mb-6">
          <Text style={{ fontSize: "14px", fontWeight: "500", color: "#1F2937" }}>
            活跃空间数
          </Text>

          <div className="flex items-center gap-2">
            <Button
              type="link"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() =>
                handleExport(
                  "bar",
                  {
                    metricCycle: metricCycleMap[activeBotsChartType] || "DAY",
                    queryType: "active_robot_count",
                    startTime: dayjs(startTime || dayjs().subtract(6, "day").startOf("day")).format(
                      "YYYY-MM-DD"
                    ),
                    endTime: dayjs(endTime || dayjs().endOf("day")).format("YYYY-MM-DD")
                  },
                  "活跃空间数"
                )
              }
            />
            <Segmented
              size="small"
              options={[
                { label: "日", value: "daily" },
                { label: "周", value: "weekly" },
                { label: "月", value: "monthly" }
              ]}
              value={activeBotsChartType}
              onChange={(val) => {
                setActiveBotsChartType(val)
                // 切换 日/周/月 时，重新请求柱状图数据
                const cycle = metricCycleMap[val] || "DAY"
                fetchActiveBotsBarData({
                  start: startTime || dayjs().subtract(6, "day").startOf("day"),
                  end: endTime || dayjs().endOf("day"),
                  metricCycle: cycle
                })
              }}
            />
          </div>
        </div>

        <Column {...config} />
      </div>
    )
  }, [
    activeBotsChartType,
    activeBotsBarData,
    fetchActiveBotsBarData,
    metricCycleMap,
    startTime,
    endTime,
    handleExport
  ])

  // 活跃工作流折线图
  const activeSkillsChart = useMemo(() => {
    const config = {
      data: activeSkillsData,
      xField: "date",
      yField: "activeSkills",
      colorField: "type",
      color: "#FF4D4F",
      // color: () => "#FF4D4F",
      lineStyle: {
        lineWidth: 1.2,
        stroke: "#FF4D4F"
      },
      area: {
        style: {
          fill: "rgba(255,77,79,0.2)"
        }
      },
      point: {
        size: 4,
        shape: "circle",
        style: {
          fill: "#FF4D4F",
          stroke: "#FF4D4F",
          lineWidth: 1.2
        }
      },
      label: {
        style: {
          fill: "#1F2937",
          fontSize: 12,
          fontWeight: 500
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
        grid: {
          line: {
            style: {
              stroke: "#E5E7EB",
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
      tooltip: {
        showMarkers: true,
        formatter: (datum) => {
          return { name: "活跃工作流数", value: datum.activeSkills }
        }
      },
      height: 200,
      smooth: true
    }

    return (
      <div className="bg-white rounded-xl p-4 mt-6" style={{ border: "1px solid #E5E7EB" }}>
        <div className="flex justify-between items-center mb-6">
          <Text style={{ fontSize: "14px", fontWeight: "500", color: "#1F2937" }}>活跃工作流数</Text>

          <div className="flex items-center gap-2">
            <Button
              type="link"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() =>
                handleExport(
                  "line",
                  {
                    metricCycle: metricCycleMap[activeSkillsChartType] || "DAY",
                    queryType: "active_skill_count",
                    startTime: dayjs(startTime || dayjs().subtract(6, "day").startOf("day")).format(
                      "YYYY-MM-DD"
                    ),
                    endTime: dayjs(endTime || dayjs().endOf("day")).format("YYYY-MM-DD")
                  },
                  "活跃工作流数"
                )
              }
            />
            <Segmented
              size="small"
              options={[
                { label: "日", value: "daily" },
                { label: "周", value: "weekly" },
                { label: "月", value: "monthly" }
              ]}
              value={activeSkillsChartType}
              onChange={(val) => {
                setActiveSkillsChartType(val)
                const cycle = metricCycleMap[val] || "DAY"
                fetchLineData({
                  start: startTime || dayjs().subtract(6, "day").startOf("day"),
                  end: endTime || dayjs().endOf("day"),
                  metricCycle: cycle,
                  queryType: "active_skill_count",
                  setter: setActiveSkillsData,
                  yField: "activeSkills"
                })
              }}
            />
          </div>
        </div>

        <Line {...config} />
      </div>
    )
  }, [activeSkillsChartType, activeSkillsData, fetchLineData, metricCycleMap, startTime, endTime])

  // 工作流调用次数折线图
  const skillCallsChart = useMemo(() => {
    const config = {
      data: skillCallsData,
      xField: "date",
      yField: "skillCalls",
      color: "#FF4D4F",
      lineStyle: {
        lineWidth: 1.2,
        stroke: "#FF4D4F"
      },
      area: {
        style: {
          fill: "rgba(255,77,79,0.2)"
        }
      },
      point: {
        size: 4,
        shape: "circle",
        style: {
          fill: "#FF4D4F",
          stroke: "#FF4D4F",
          lineWidth: 1.2
        }
      },
      label: {
        style: {
          fill: "#1F2937",
          fontSize: 12,
          fontWeight: 500
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
        grid: {
          line: {
            style: {
              stroke: "#E5E7EB",
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
      tooltip: {
        showMarkers: true,
        formatter: (datum) => {
          return { name: "工作流调用次数", value: datum.skillCalls }
        }
      },
      height: 200,
      smooth: true
    }

    return (
      <div className="bg-white rounded-xl p-4 mt-6" style={{ border: "1px solid #E5E7EB" }}>
        <div className="flex justify-between items-center mb-6">
          <Text style={{ fontSize: "14px", fontWeight: "500", color: "#1F2937" }}>
            工作流调用次数
          </Text>

          <div className="flex items-center gap-2">
            <Button
              type="link"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() =>
                handleExport(
                  "line",
                  {
                    metricCycle: metricCycleMap[skillCallsChartType] || "DAY",
                    queryType: "skill_call_count",
                    startTime: dayjs(startTime || dayjs().subtract(6, "day").startOf("day")).format(
                      "YYYY-MM-DD"
                    ),
                    endTime: dayjs(endTime || dayjs().endOf("day")).format("YYYY-MM-DD")
                  },
                  "工作流调用次数"
                )
              }
            />
            <Segmented
              size="small"
              options={[
                { label: "日", value: "daily" },
                { label: "周", value: "weekly" },
                { label: "月", value: "monthly" }
              ]}
              value={skillCallsChartType}
              onChange={(val) => {
                setSkillCallsChartType(val)
                const cycle = metricCycleMap[val] || "DAY"
                fetchLineData({
                  start: startTime || dayjs().subtract(6, "day").startOf("day"),
                  end: endTime || dayjs().endOf("day"),
                  metricCycle: cycle,
                  queryType: "skill_call_count",
                  setter: setSkillCallsData,
                  yField: "skillCalls"
                })
              }}
            />
          </div>
        </div>

        <Line {...config} />
      </div>
    )
  }, [skillCallsChartType, skillCallsData, fetchLineData, metricCycleMap, startTime, endTime])

  // 活跃Agent数折线图
  const activeAgentsChart = useMemo(() => {
    const config = {
      data: activeAgentsData,
      xField: "date",
      yField: "activeAgents",
      colorField: "type",
      // color: () => "#FFC53D",
      color: "#FFC53D",
      lineStyle: {
        lineWidth: 1.2,
        stroke: "#FFC53D"
      },
      area: {
        style: {
          fill: "rgba(255,197,61,0.2)"
        }
      },
      point: {
        size: 4,
        shape: "circle",
        style: {
          fill: "#FFC53D",
          stroke: "#FFC53D",
          lineWidth: 1.2
        }
      },
      label: {
        style: {
          fill: "#1F2937",
          fontSize: 12,
          fontWeight: 500
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
        grid: {
          line: {
            style: {
              stroke: "#E5E7EB",
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
      tooltip: {
        showMarkers: true,
        formatter: (datum) => {
          return { name: "活跃Agent数", value: datum.activeAgents }
        }
      },
      height: 200,
      smooth: true
    }

    return (
      <div className="bg-white rounded-xl p-4 mt-6" style={{ border: "1px solid #E5E7EB" }}>
        <div className="flex justify-between items-center mb-6">
          <Text style={{ fontSize: "14px", fontWeight: "500", color: "#1F2937" }}>活跃Agent数</Text>

          <div className="flex items-center gap-2">
            <Button
              type="link"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() =>
                handleExport(
                  "line",
                  {
                    metricCycle: metricCycleMap[activeAgentsChartType] || "DAY",
                    queryType: "active_agent_count",
                    startTime: dayjs(startTime || dayjs().subtract(6, "day").startOf("day")).format(
                      "YYYY-MM-DD"
                    ),
                    endTime: dayjs(endTime || dayjs().endOf("day")).format("YYYY-MM-DD")
                  },
                  "活跃Agent数"
                )
              }
            />
            <Segmented
              size="small"
              options={[
                { label: "日", value: "daily" },
                { label: "周", value: "weekly" },
                { label: "月", value: "monthly" }
              ]}
              value={activeAgentsChartType}
              onChange={(val) => {
                setActiveAgentsChartType(val)
                const cycle = metricCycleMap[val] || "DAY"
                fetchLineData({
                  start: startTime || dayjs().subtract(6, "day").startOf("day"),
                  end: endTime || dayjs().endOf("day"),
                  metricCycle: cycle,
                  queryType: "active_agent_count",
                  setter: setActiveAgentsData,
                  yField: "activeAgents"
                })
              }}
            />
          </div>
        </div>

        <Line {...config} />
      </div>
    )
  }, [activeAgentsChartType, activeAgentsData, fetchLineData, metricCycleMap, startTime, endTime])

  // Agent调用次数折线图
  const agentCallsChart = useMemo(() => {
    const config = {
      data: agentCallsData,
      xField: "date",
      yField: "agentCalls",
      color: "#FFC53D",
      lineStyle: {
        lineWidth: 1.2,
        stroke: "#FFC53D"
      },
      area: {
        style: {
          fill: "rgba(255,197,61,0.2)"
        }
      },
      point: {
        size: 4,
        shape: "circle",
        style: {
          fill: "#FFC53D",
          stroke: "#FFC53D",
          lineWidth: 1.2
        }
      },
      label: {
        style: {
          fill: "#1F2937",
          fontSize: 12,
          fontWeight: 500
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
        grid: {
          line: {
            style: {
              stroke: "#E5E7EB",
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

      tooltip: {
        showMarkers: true,
        formatter: (datum) => {
          return { name: "Agent调用次数", value: datum.agentCalls }
        }
      },
      height: 200,
      smooth: true
    }

    return (
      <div className="bg-white rounded-xl p-4 mt-6" style={{ border: "1px solid #E5E7EB" }}>
        <div className="flex justify-between items-center mb-6">
          <Text style={{ fontSize: "14px", fontWeight: "500", color: "#1F2937" }}>
            Agent调用次数
          </Text>

          <div className="flex items-center gap-2">
            <Button
              type="link"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() =>
                handleExport(
                  "line",
                  {
                    metricCycle: metricCycleMap[agentCallsChartType] || "DAY",
                    queryType: "agent_call_count",
                    startTime: dayjs(startTime || dayjs().subtract(6, "day").startOf("day")).format(
                      "YYYY-MM-DD"
                    ),
                    endTime: dayjs(endTime || dayjs().endOf("day")).format("YYYY-MM-DD")
                  },
                  "Agent调用次数"
                )
              }
            />
            <Segmented
              size="small"
              options={[
                { label: "日", value: "daily" },
                { label: "周", value: "weekly" },
                { label: "月", value: "monthly" }
              ]}
              value={agentCallsChartType}
              onChange={(val) => {
                setAgentCallsChartType(val)
                const cycle = metricCycleMap[val] || "DAY"
                fetchLineData({
                  start: startTime || dayjs().subtract(6, "day").startOf("day"),
                  end: endTime || dayjs().endOf("day"),
                  metricCycle: cycle,
                  queryType: "agent_call_count",
                  setter: setAgentCallsData,
                  yField: "agentCalls"
                })
              }}
            />
          </div>
        </div>

        <Line {...config} />
      </div>
    )
  }, [agentCallsChartType, agentCallsData, fetchLineData, metricCycleMap, startTime, endTime])

  // 文档知识库数据量折线图
  const documentKBChart = useMemo(() => {
    const config = {
      data: documentKBData,
      xField: "date",
      yField: "documentKB",
      color: "#52C41A",
      lineStyle: {
        lineWidth: 1.2,
        stroke: "#52C41A"
      },
      area: {
        style: {
          fill: "rgba(82,196,26,0.2)"
        }
      },
      point: {
        size: 4,
        shape: "circle",
        style: {
          fill: "#52C41A",
          stroke: "#52C41A",
          lineWidth: 1.2
        }
      },
      label: {
        style: {
          fill: "#1F2937",
          fontSize: 12,
          fontWeight: 500
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
        grid: {
          line: {
            style: {
              stroke: "#E5E7EB",
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
      tooltip: {
        showMarkers: true,
        formatter: (datum) => {
          return { name: "文档知识库数据量", value: datum.documentKB }
        }
      },
      height: 200,
      smooth: true
    }

    return (
      <div className="bg-white rounded-xl p-4" style={{ border: "1px solid #E5E7EB" }}>
        <div className="flex justify-between items-center mb-6">
          <Text style={{ fontSize: "14px", fontWeight: "500", color: "#1F2937" }}>
            文档知识库数据量
          </Text>

          <div className="flex items-center gap-2">
            <Button
              type="link"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() =>
                handleExport(
                  "line",
                  {
                    metricCycle: metricCycleMap[documentKBChartType] || "DAY",
                    queryType: "doc_knowledge_count",
                    startTime: dayjs(startTime || dayjs().subtract(6, "day").startOf("day")).format(
                      "YYYY-MM-DD"
                    ),
                    endTime: dayjs(endTime || dayjs().endOf("day")).format("YYYY-MM-DD")
                  },
                  "文档知识库数据量"
                )
              }
            />
            <Segmented
              size="small"
              options={[
                { label: "日", value: "daily" },
                { label: "周", value: "weekly" },
                { label: "月", value: "monthly" }
              ]}
              value={documentKBChartType}
              onChange={(val) => {
                setDocumentKBChartType(val)
                const cycle = metricCycleMap[val] || "DAY"
                fetchLineData({
                  start: startTime || dayjs().subtract(6, "day").startOf("day"),
                  end: endTime || dayjs().endOf("day"),
                  metricCycle: cycle,
                  queryType: "doc_knowledge_count",
                  setter: setDocumentKBData,
                  yField: "documentKB"
                })
              }}
            />
          </div>
        </div>

        <Line {...config} />
      </div>
    )
  }, [documentKBChartType, documentKBData, fetchLineData, metricCycleMap, startTime, endTime])

  // 问答知识库数据量折线图
  const qaKBChart = useMemo(() => {
    const config = {
      data: qaKBData,
      xField: "date",
      yField: "qaKB",
      color: "#73D13D",
      lineStyle: {
        lineWidth: 1.2,
        stroke: "#73D13D"
      },
      area: {
        style: {
          fill: "rgba(82,196,26,0.2)"
        }
      },
      point: {
        size: 4,
        shape: "circle",
        style: {
          fill: "#73D13D",
          stroke: "#73D13D",
          lineWidth: 1.2
        }
      },
      label: {
        style: {
          fill: "#1F2937",
          fontSize: 12,
          fontWeight: 500
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
        grid: {
          line: {
            style: {
              stroke: "#E5E7EB",
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
      tooltip: {
        showMarkers: true,
        formatter: (datum) => {
          return { name: "问答知识库数据量", value: datum.qaKB }
        }
      },
      height: 200,
      smooth: true
    }

    return (
      <div className="bg-white rounded-xl p-4" style={{ border: "1px solid #E5E7EB" }}>
        <div className="flex justify-between items-center mb-6">
          <Text style={{ fontSize: "14px", fontWeight: "500", color: "#1F2937" }}>
            问答知识库数据量
          </Text>

          <div className="flex items-center gap-2">
            <Button
              type="link"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() =>
                handleExport(
                  "line",
                  {
                    metricCycle: metricCycleMap[qaKBChartType] || "DAY",
                    queryType: "qa_knowledge_count",
                    startTime: dayjs(startTime || dayjs().subtract(6, "day").startOf("day")).format(
                      "YYYY-MM-DD"
                    ),
                    endTime: dayjs(endTime || dayjs().endOf("day")).format("YYYY-MM-DD")
                  },
                  "问答知识库数据量"
                )
              }
            />
            <Segmented
              size="small"
              options={[
                { label: "日", value: "daily" },
                { label: "周", value: "weekly" },
                { label: "月", value: "monthly" }
              ]}
              value={qaKBChartType}
              onChange={(val) => {
                setQaKBChartType(val)
                const cycle = metricCycleMap[val] || "DAY"
                fetchLineData({
                  start: startTime || dayjs().subtract(6, "day").startOf("day"),
                  end: endTime || dayjs().endOf("day"),
                  metricCycle: cycle,
                  queryType: "qa_knowledge_count",
                  setter: setQaKBData,
                  yField: "qaKB"
                })
              }}
            />
          </div>
        </div>

        <Line {...config} />
      </div>
    )
  }, [qaKBChartType, qaKBData, fetchLineData, metricCycleMap, startTime, endTime])

  // 结构化知识库数据量折线图
  const structuredKBChart = useMemo(() => {
    const config = {
      data: structuredKBData,
      xField: "date",
      yField: "structuredKB",
      color: "#95DE64",
      lineStyle: {
        lineWidth: 1.2,
        stroke: "#95DE64"
      },
      area: {
        style: {
          fill: "rgba(82,196,26,0.2)"
        }
      },
      point: {
        size: 4,
        shape: "circle",
        style: {
          fill: "#95DE64",
          stroke: "#95DE64",
          lineWidth: 1.2
        }
      },
      label: {
        style: {
          fill: "#1F2937",
          fontSize: 12,
          fontWeight: 500
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
        grid: {
          line: {
            style: {
              stroke: "#E5E7EB",
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
      tooltip: {
        showMarkers: true,
        formatter: (datum) => {
          return { name: "结构化知识库数据量", value: datum.structuredKB }
        }
      },
      height: 200,
      smooth: true
    }

    return (
      <div className="bg-white rounded-xl p-4" style={{ border: "1px solid #E5E7EB" }}>
        <div className="flex justify-between items-center mb-6">
          <Text style={{ fontSize: "14px", fontWeight: "500", color: "#1F2937" }}>
            结构化知识库数据量
          </Text>

          <div className="flex items-center gap-2">
            <Button
              type="link"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() =>
                handleExport(
                  "line",
                  {
                    metricCycle: metricCycleMap[structuredKBChartType] || "DAY",
                    queryType: "structured_knowledge_count",
                    startTime: dayjs(startTime || dayjs().subtract(6, "day").startOf("day")).format(
                      "YYYY-MM-DD"
                    ),
                    endTime: dayjs(endTime || dayjs().endOf("day")).format("YYYY-MM-DD")
                  },
                  "结构化知识库数据量"
                )
              }
            />
            <Segmented
              size="small"
              options={[
                { label: "日", value: "daily" },
                { label: "周", value: "weekly" },
                { label: "月", value: "monthly" }
              ]}
              value={structuredKBChartType}
              onChange={(val) => {
                setStructuredKBChartType(val)
                const cycle = metricCycleMap[val] || "DAY"
                fetchLineData({
                  start: startTime || dayjs().subtract(6, "day").startOf("day"),
                  end: endTime || dayjs().endOf("day"),
                  metricCycle: cycle,
                  queryType: "structured_knowledge_count",
                  setter: setStructuredKBData,
                  yField: "structuredKB"
                })
              }}
            />
          </div>
        </div>

        <Line {...config} />
      </div>
    )
  }, [structuredKBChartType, structuredKBData, fetchLineData, metricCycleMap, startTime, endTime])

  // 大模型调用次数柱状图
  const modelCallsChart = useMemo(() => {
    const data = modelCallsBarData

    const config = {
      data,
      xField: "date",
      yField: "count",
      seriesField: "name",
      color: "#1890FF",
      columnStyle: {
        radius: [4, 4, 0, 0],
        maxWidth: 80
      },
      label: {
        position: "top",
        offset: 8,
        style: {
          fill: "#1F2937",
          fontSize: 12,
          fontWeight: 500,
          textAlign: "center"
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
        grid: {
          line: {
            style: {
              stroke: "#E5E7EB",
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
      tooltip: {
        showMarkers: false,
        formatter: (datum) => {
          return { name: datum.name || "大模型调用次数", value: datum.count }
        }
      },
      height: 220
    }

    return (
      <div className="bg-white rounded-xl p-4 mt-6" style={{ border: "1px solid #E5E7EB" }}>
        <div className="flex justify-between items-center mb-6">
          <Text style={{ fontSize: "14px", fontWeight: "500", color: "#1F2937" }}>
            大模型调用次数
          </Text>

          <div className="flex items-center gap-2">
            <Button
              type="link"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() =>
                handleExport(
                  "bar",
                  {
                    metricCycle: metricCycleMap[modelCallsChartType] || "DAY",
                    queryType: "big_model_call_count",
                    startTime: dayjs(startTime || dayjs().subtract(6, "day").startOf("day")).format(
                      "YYYY-MM-DD"
                    ),
                    endTime: dayjs(endTime || dayjs().endOf("day")).format("YYYY-MM-DD")
                  },
                  "大模型调用次数"
                )
              }
            />
            <Segmented
              size="small"
              options={[
                { label: "日", value: "daily" },
                { label: "周", value: "weekly" },
                { label: "月", value: "monthly" }
              ]}
              value={modelCallsChartType}
              onChange={(val) => {
                setModelCallsChartType(val)
                // 切换 日/周/月 时，只重新请求大模型调用次数柱状图数据
                const cycle = metricCycleMap[val] || "DAY"
                fetchModelCallsBarData({
                  start: startTime || dayjs().subtract(6, "day").startOf("day"),
                  end: endTime || dayjs().endOf("day"),
                  metricCycle: cycle
                })
              }}
            />
          </div>
        </div>

        <Column {...config} />
      </div>
    )
  }, [
    modelCallsChartType,
    modelCallsBarData,
    fetchModelCallsBarData,
    metricCycleMap,
    startTime,
    endTime,
    handleExport
  ])

  // 知识库数据量图表行
  const knowledgeBaseCharts = useMemo(
    () => (
      <Row gutter={16} className="mt-6">
        <Col span={8}>{documentKBChart}</Col>
        <Col span={8}>{qaKBChart}</Col>
        <Col span={8}>{structuredKBChart}</Col>
      </Row>
    ),
    [documentKBChart, qaKBChart, structuredKBChart]
  )

  // 模型计费图表
  const modelBillingChart = useMemo(
    () => (
      <div className="mt-6">
        <ModelBillingChart
          key={`${adjustedStartTime}-${adjustedEndTime}-${JSON.stringify(modelBillingData)}`}
          data={modelBillingData}
          adjustedStartTime={adjustedStartTime}
          adjustedEndTime={adjustedEndTime}
          botNo={botNo}
        />
      </div>
    ),
    [modelBillingData, adjustedStartTime, adjustedEndTime, botNo]
  )

  return (
    <div className="bg-white -mt-[40px]">
      {overviewChart}
      {activeBotsChart}
      <Row gutter={16}>
        <Col span={12}>{activeSkillsChart}</Col>
        <Col span={12}>{skillCallsChart}</Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>{activeAgentsChart}</Col>
        <Col span={12}>{agentCallsChart}</Col>
      </Row>
      {knowledgeBaseCharts}
      {modelCallsChart}
      <ModelCallsTables startTime={startTime} endTime={endTime} botNoList={selectedBotNos} />
      {/* {trendChart}
      {pieCharts}
      {topCharts}
      {userChart} */}
      {modelBillingChart}
    </div>
  )
}

export default CallDashboard
