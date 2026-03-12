/** @jsxImportSource @emotion/react */
import { useForm, SearchForm } from "form-render"
import RangeTimePicker from "@/components/RangeTime"
import NumberPanel from "@/pages/dataStatistic/dailyReport/ChartsComponents/NumberPanel"
import CallTrend from "./ChartsComponents/CallTrend"
import ProportionCircular from "./ChartsComponents/ProportionCircular"
import CommonColumn from "./ChartsComponents/CommonColumn"
import getSchema from "./schema"
import { useFetchAuthPermissionGroupList } from "@/api/permission"
import {
  fetchBotListByTagNo,
  fetchCallLogsOverview,
  fetchCallTrendOverview,
  fetchMetricCyclesList,
  fetchSkillOverview,
  fetchPieChartOfPerSkillUsage
} from "@/api/dailyReport/api"
import dayjs from "dayjs"
import { useCallback, useEffect, useState, useMemo } from "react"
import { Card, Col, Divider, Empty, Row, Segmented, Space, Typography, Tooltip, Button } from "antd"
import { useLocation } from "react-router-dom"
import queryString from "query-string"
import OptimizationDashboard from "../optimizationDashboard"
import { QuestionCircleOutlined, SyncOutlined } from "@ant-design/icons"
import IframeDashboard from "./components/IframeDashboard"
const { Title } = Typography
import "./index.less"

const today = dayjs().startOf("day")
const past7Days = dayjs().subtract(7, "days").endOf("day")

function CallDashboard({
  form,
  groupList,
  botList,
  startTime,
  endTime,
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
  const onSegmentChange = useCallback(
    async (metricCycleItemValue) => {
      const values = {
        startTime: dayjs(startTime).format("YYYY-MM-DD"),
        endTime: dayjs(endTime).format("YYYY-MM-DD"),
        metricCycle: metricCycleItemValue
      }
      if (botNo && iframeStyle == "true") {
        values.botNo = botNo
      }
      // 趋势大盘
      const data = await fetchCallTrendOverview(values)
      setTrendPlotsData({
        data1: data.callUserItems || [],
        data2: data.skillCallsItems || []
      })
    },
    [startTime, endTime, botNo, iframeStyle, setTrendPlotsData]
  )

  const ExtraSegmented = useMemo(() => {
    return (
      <Segmented
        size="small"
        options={segmentedOptions}
        value={segmentValue}
        onChange={onSegmentChange}
      />
    )
  }, [segmentedOptions, segmentValue, onSegmentChange])

  const showTop10Bots = useMemo(() => !botNo, [botNo])
  const showEmptyCardStyle = useMemo(
    () => ({
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }),
    []
  )

  const trendChart = useMemo(
    () => (
      <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #E5E7EB" }}>
        <div className="flex justify-between items-center mb-4">
          <Typography.Text style={{ fontSize: "14px", fontWeight: "500", color: "#1F2937" }}>
            调用趋势
          </Typography.Text>
          {ExtraSegmented}
        </div>
        <CallTrend data1={trendPlotsData.data1} data2={trendPlotsData.data2} />
      </div>
    ),
    [trendPlotsData, ExtraSegmented]
  )

  const pieCharts = useMemo(
    () => (
      <Row gutter={16}>
        <Col span={12}>
          <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #E5E7EB" }}>
            <Typography.Text
              className="block mb-4"
              style={{ fontSize: "14px", fontWeight: "500", color: "#1F2937" }}
            >
              调用次数-按工作流
            </Typography.Text>
            <ProportionCircular
              data={pieData1}
              colors={["#8370EE", "#36BA77", "#E9A21F", "#77B830"]}
            />
          </div>
        </Col>
        <Col span={12}>
          <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #E5E7EB" }}>
            <Typography.Text
              className="block mb-4"
              style={{ fontSize: "14px", fontWeight: "500", color: "#1F2937" }}
            >
              调用次数-按分类
            </Typography.Text>
            <ProportionCircular
              data={pieData2}
              colors={["#8370EE", "#36BA77", "#E9A21F", "#77B830"]}
            />
          </div>
        </Col>
      </Row>
    ),
    [pieData1, pieData2]
  )

  const topCharts = useMemo(
    () => (
      <Row gutter={16}>
        <Col span={12}>
          <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #E5E7EB" }}>
            <Typography.Text
              className="block mb-4"
              style={{ fontSize: "14px", fontWeight: "500", color: "#1F2937" }}
            >
              调用次数-TOP10空间
            </Typography.Text>
            <div>
              <CommonColumn data={topRobots} extraConfig={{ color: "#8370EE" }} />
            </div>
          </div>
        </Col>
        <Col span={12}>
          <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #E5E7EB" }}>
            <Typography.Text
              className="block mb-4"
              style={{ fontSize: "14px", fontWeight: "500", color: "#1F2937" }}
            >
              调用次数-TOP10工作流
            </Typography.Text>
            <CommonColumn data={topSkills} extraConfig={{ color: "#36BA77" }} />
          </div>
        </Col>
      </Row>
    ),
    [topRobots, topSkills, showTop10Bots, showEmptyCardStyle]
  )

  const userChart = useMemo(
    () => (
      <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #E5E7EB" }}>
        <Typography.Text
          className="block mb-4"
          style={{ fontSize: "14px", fontWeight: "500", color: "#1F2937" }}
        >
          调用次数-请求人TOP20
        </Typography.Text>
        <CommonColumn data={topUsers} extraConfig={{ color: "#E9A21F" }} />
      </div>
    ),
    [topUsers]
  )

  const overviewChart = useMemo(
    () => (
      <div>
        <div className="flex items-center gap-1">
          <Typography.Text
            className="block"
            style={{ fontSize: "14px", fontWeight: "500", color: "#1F2937" }}
          >
            数据总览
          </Typography.Text>
        </div>
        <div className="mt-4">
          <NumberPanel numberList={numberList} />
        </div>
      </div>
    ),
    [numberList]
  )

  return (
    <Space direction="vertical" size="large" style={{ display: "flex" }}>
      {overviewChart}
      {trendChart}
      {pieCharts}
      {topCharts}
      {userChart}
    </Space>
  )
}

function DailyReport() {
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)
  const { botNo, iframeStyle, studioenv } = queryParams
  const [activeTab, setActiveTab] = useState("call")
  const [isInitialized, setIsInitialized] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const { data: groupList = [] } = useFetchAuthPermissionGroupList()
  const [botList, setBotList] = useState([])
  const form = useForm()
  const [numberList, setNumberList] = useState([])
  const [segmentedOptions, setSegmentedOptions] = useState([])
  const [segmentValue, setSegmentValue] = useState("")
  const [trendPlotsData, setTrendPlotsData] = useState({ data1: [], data2: [] })
  const [pieData1, setPieData1] = useState([])
  const [pieData2, setPieData2] = useState([])
  const [topRobots, setTopRobots] = useState([])
  const [topSkills, setTopSkills] = useState([])
  const [topUsers, setTopUsers] = useState([])
  const [formValues, setFormValues] = useState({
    startTime: past7Days,
    endTime: today
  })

  const searchParams = queryString.parse(window.location.search) || {}
  const hashParams = queryString.parse(window.location.hash.split("?")[1] || "") || {}
  const { token: isIframe } = searchParams.token ? searchParams : hashParams

  const stableDispatch = useMemo(
    () => ({
      setFormValues,
      setNumberList,
      setSegmentedOptions,
      setSegmentValue,
      setTrendPlotsData,
      setPieData1,
      setPieData2,
      setTopRobots,
      setTopSkills,
      setTopUsers,
      form
    }),
    []
  )

  // 初始化表单值和数据加载
  useEffect(() => {
    if (!isInitialized) {
      const initialValues = {
        startTime: past7Days,
        endTime: today
      }

      form.setValues(initialValues)
      setFormValues(initialValues)
      onSearch(initialValues)
      setIsInitialized(true)
    }
  }, [isInitialized])

  // 当 botNo 或 iframeStyle 改变时重新加载数据
  useEffect(() => {
    if (isInitialized && (botNo || iframeStyle)) {
      onSearch(formValues)
    }
  }, [botNo, iframeStyle])

  useEffect(() => {
    fetchBotListByTagNo({}).then((botList) => {
      setBotList(botList)
    })
  }, [])

  const searchData = useCallback(
    (searchValues) => {
      if (botNo && iframeStyle == "true") {
        searchValues.botNo = botNo
      }

      if (isIframe) {
        return
      }

      Promise.all([
        // 调用次数和人数数字面板
        fetchCallLogsOverview(searchValues).then((result) => {
          stableDispatch.setNumberList([
            {
              title: "调用次数",
              value: result.totalSkillCalls
            },
            {
              title: "调用人数",
              value: result.totalCallUsers
            }
          ])
        }),

        // 趋势大盘
        fetchMetricCyclesList(searchValues).then(async (res) => {
          if (Array.isArray(res)) {
            stableDispatch.setSegmentedOptions(res)
            const firstAvailableItem = res.find((item) => item.disabled === false && item.value)
            if (firstAvailableItem) {
              stableDispatch.setSegmentValue(firstAvailableItem.value)
              // 趋势大盘
              const data = await fetchCallTrendOverview({
                ...searchValues,
                metricCycle: firstAvailableItem.value
              })
              stableDispatch.setTrendPlotsData({
                data1: data.callUserItems || [],
                data2: data.skillCallsItems || []
              })
            }
          }
        }),

        // 饼状图1
        fetchPieChartOfPerSkillUsage({ ...searchValues }).then((result) => {
          stableDispatch.setPieData1(result.items || [])
        }),

        // 饼状图2
        fetchSkillOverview({ ...searchValues, proportionCode: "skillTypeCallPieChart" }).then(
          (result) => {
            stableDispatch.setPieData2(result.items || [])
          }
        ),

        // TOP10空间柱状图
        fetchSkillOverview({ ...searchValues, size: 10, proportionCode: "countRobotCalls" }).then(
          (result) => {
            stableDispatch.setTopRobots(result || [])
          }
        ),

        // Top10工作流柱状图
        fetchSkillOverview({ ...searchValues, size: 10, proportionCode: "countSkillCalls" }).then(
          (result) => {
            stableDispatch.setTopSkills(result || [])
          }
        ),

        // 请求人Top20柱状图
        fetchSkillOverview({ ...searchValues, size: 20, proportionCode: "countCallUsers" }).then(
          (result) => {
            stableDispatch.setTopUsers(result || [])
          }
        )
      ]).catch((error) => {
        console.error("数据加载失败:", error)
      })
    },
    [botNo, iframeStyle, stableDispatch, isIframe]
  )

  const onSearch = useCallback(
    (values) => {
      const searchValues = {
        ...values,
        startTime: dayjs(values.startTime || past7Days).format("YYYY-MM-DD"),
        endTime: dayjs(values.endTime || today).format("YYYY-MM-DD")
      }
      searchData(searchValues)
    },
    [searchData]
  )

  const handleDateRangeChange = useCallback(
    (dates) => {
      console.log("dates", dates)
      if (!dates?.[0] || !dates?.[1]) return

      const values = {
        startTime: dates[0],
        endTime: dates[1]
      }
      stableDispatch.setFormValues(values)
      stableDispatch.form.setValues(values)
      onSearch(values)
    },
    [stableDispatch, onSearch]
  )

  const handleRefresh = useCallback(() => {
    const values = {
      startTime: formValues.startTime,
      endTime: formValues.endTime,
      ...(botNo && iframeStyle === "true" ? { botNo } : {})
    }

    // 更新父组件表单值
    stableDispatch.setFormValues(values)
    stableDispatch.form.setValues(values)

    // 格式化日期并触发搜索刷新
    const searchValues = {
      ...values,
      startTime: dayjs(values.startTime).format("YYYY-MM-DD"),
      endTime: dayjs(values.endTime).format("YYYY-MM-DD")
    }
    onSearch(searchValues)

    // 强制子组件重新渲染并刷新内部接口
    setRefreshKey((prev) => prev + 1)
  }, [formValues, onSearch, botNo, iframeStyle, stableDispatch])

  const watch = useMemo(
    () => ({
      tagNo: async (value) => {
        form.setValueByPath("botNo", "")
        const botList = await fetchBotListByTagNo({ tagNo: value })
        setBotList(botList)
      }
    }),
    []
  )

  return (
    <div className="bg-[#EFF1F4] max-h-[100vh] overflow-auto report-forms">
      <div className="p-5 bg-white rounded-md h-auto">
        {isIframe && (
          <div className="mb-4 flex justify-between items-center">
            <Segmented
              options={[
                { label: "调用看板", value: "call" },
                { label: "优化看板", value: "optimization" }
              ]}
              value={activeTab}
              onChange={setActiveTab}
            />
            <Space>
              <RangeTimePicker
                defaultValue={[formValues.startTime, formValues.endTime]}
                allowClear={false}
                onChange={handleDateRangeChange}
              />
              <Tooltip title="刷新当前页面数据">
                <Button icon={<SyncOutlined />} onClick={handleRefresh} type="text" />
              </Tooltip>
            </Space>
          </div>
        )}

        {activeTab === "call" ? (
          <div className="pb-[20px]" style={{ marginTop: "30px" }}>
            {!isIframe ? (
              <CallDashboard
                key={refreshKey}
                form={form}
                groupList={groupList}
                botList={botList}
                startTime={formValues.startTime}
                endTime={formValues.endTime}
                botNo={botNo}
                iframeStyle={iframeStyle}
                watch={watch}
                onSearch={onSearch}
                numberList={numberList}
                segmentedOptions={segmentedOptions}
                segmentValue={segmentValue}
                trendPlotsData={trendPlotsData}
                pieData1={pieData1}
                pieData2={pieData2}
                topRobots={topRobots}
                topSkills={topSkills}
                topUsers={topUsers}
                setTrendPlotsData={setTrendPlotsData}
              />
            ) : (
              <IframeDashboard
                key={refreshKey}
                botNo={botNo}
                studioenv={studioenv}
                startTime={formValues.startTime}
                endTime={formValues.endTime}
              />
            )}
          </div>
        ) : (
          <div style={{ marginTop: "30px" }}>
            <OptimizationDashboard
              key={refreshKey}
              form={form}
              groupList={groupList}
              botList={botList}
              startTime={formValues.startTime}
              endTime={formValues.endTime}
              botNo={botNo}
              iframeStyle={iframeStyle}
              watch={watch}
              onSearch={onSearch}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default DailyReport
