import React, { useState, useEffect, useCallback, useMemo } from "react"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"
import { Segmented, Space, Select, Tag, Button } from "antd"
import { SettingOutlined } from "@ant-design/icons"
import { Line } from "@ant-design/plots"
import RangeTimePicker from "@/components/RangeTime"
import { useSSO } from "@/components/SSOProvider"
import { postMessageForLX } from "@/utils"
import CountUp from "react-countup"
import "./index.less"
import { summaryMap, whiteList } from "./const.js"
import { lineConfig } from "./config.jsx"
import { useFlywheelData } from "./useFlywheelData"
import { useInView } from "react-intersection-observer"
import OptimizationCard from "./components/OptimizationCard"
import OptimizeSuggestion from "./components/OptimizeSuggestion"
import ProblemCluster from "./components/ProblemCluster"
import SettingDrawer from "../flywheel-overview/components/SettingDrawer"
import { useSearchParams } from "react-router-dom"
import { recordTaskUsage } from "@/utils/recentTaskHistory"

function FlywheelOptimization() {
  const [activeTab2, setActiveTab2] = useState("overall")
  const [viewMode, setViewMode] = useState("listView")
  const [drawerOpen, setDrawerOpen] = useState(false)

  const [searchParams] = useSearchParams()
  const styleMode = searchParams.get("style")
  // console.log("🚀 ~ FlywheelOptimization ~ styleMode:", styleMode)

  const {
    // 状态
    selectedTask,
    setSelectedTask,
    formValues,
    setFormValues,
    activeProblem,
    setActiveProblem,
    selectedCluster,
    setSelectdCluster,
    matchTask, // 匹配优化案例

    // 数据
    taskList, // 任务
    metrics,
    problemCategories, //问题
    columnData,
    clusters,
    clusterTrend,
    relatedOptimizeOrder,
    debouncedStatus, //当前集群的优化任务状态 1:待处理 2:进行中 3:已完成 4：失败/初始
    querySuggestionData, // 当前集群的优化建议数据
    chatRecordData,
    sourceTaskId,
    hasConfig,
    currentTask,
    urlBotNo, // botNo
    isTaskType9,

    // 方法
    handleQueryClusterMatchTask, // 查询当前集群的匹配优化案例
    isQueryMatchTaskLoading, // 查询当前集群的匹配优化案例的加载状态
    handleGenerateSuggestion, // 生成优化建议
    isGenerateSuggestionLoading, // 生成优化建议的加载状态
    startPolling, // 启动轮询
    stopPolling, // 停止轮询
    isPolling, // 轮询状态
    handleUpdateSuggestion,

    //无限滚动相关
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,

    fetchNextPageChat,
    hasNextPageChat,
    isFetchingNextPageChat,
    isfetchingChat,
    refetchChatRecord // 重新获取record
  } = useFlywheelData()

  const { userInfo = {} } = useSSO()
  const { username } = userInfo
  const isDevMember = whiteList.includes(username)
  const hasrecord = chatRecordData && chatRecordData?.length > 0
  const [showThirdTab, setShowThirdTab] = useState(false)
  const [drawerKey, setDrawerKey] = useState(0)

  useEffect(() => {
    if (isDevMember && hasrecord) {
      setShowThirdTab(true)
    } else {
      setShowThirdTab(false)
    }
  }, [isDevMember, hasrecord, selectedCluster])

  // 切换集群时，如果在第三个tab，则回第一个。关闭当前轮询
  useEffect(() => {
    stopPolling()
    if (activeTab2 === "optimizeSuggestion") {
      setActiveTab2("overall")
    }
  }, [selectedCluster])

  const analysisoptions = showThirdTab
    ? [
        { label: "问题概览", value: "overall" },
        { label: "关联通话", value: "relatedOptimizations" },
        { label: "优化建议", value: "optimizeSuggestion" }
      ]
    : [
        { label: "问题概览", value: "overall" },
        { label: "关联通话", value: "relatedOptimizations" }
      ]

  //当前是否滚动到底部
  const { ref, inView } = useInView({
    threshold: 0
  })
  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage()
    }
  }, [inView, fetchNextPage, hasNextPage])

  const handleClickCheck = (optimizationId) => {
    sessionStorage.setItem("optimizationId", optimizationId)
    const message = {
      type: "navigateToOptimizeOrder"
    }
    postMessageForLX(message)
  }

  const handleSelectChange = (value) => {
    setSelectedTask(value)
    setActiveProblem("")
    setSelectdCluster("")
    // 记录任务使用历史
    recordTaskUsage("optimization", value, urlBotNo as string)
  }

  const handleClickGenerate = () => {
    setShowThirdTab(true)
    setActiveTab2("optimizeSuggestion")
  }

  // 数据
  const renderMetrics = () => {
    return (
      // <div className="grid grid-cols-2 gap-8 px-4 py-2">
      <div className="flex items-center gap-8 px-4 py-2">
        {metrics?.map(({ label, value, labelDesc }) => (
          <div key={label} className="flex-1 bg-white border border-gray-300 rounded-xl px-8 py-2">
            <div className="text-base font-medium mb-2 items-center gap-1">{summaryMap[label]}</div>
            <div className="text-[22px] font-medium text-gray-900">
              <CountUp end={value} duration={1} />
            </div>
            <div className="text-xs text-gray-400 mt-2 flex items-center ">环比：{labelDesc}</div>
          </div>
        ))}
      </div>
    )
  }

  const handleDateRangeChange = useCallback(
    (dates) => {
      if (!dates?.[0] || !dates?.[1]) return
      const values = {
        startTime: dates[0],
        endTime: dates[1]
      }
      setFormValues(values)
      setActiveProblem("")
      setSelectdCluster("")
    },
    [setFormValues]
  )

  const handleChange = useCallback((value) => {
    setActiveProblem(value)
    setSelectdCluster("")
  }, [])

  const handleViewChange = useCallback((value) => {
    setViewMode(value)
  }, [])

  // 问题集群
  const renderCluster = () => {
    return (
      <ProblemCluster
        clusters={clusters}
        problemCategories={problemCategories}
        handleChange={handleChange}
        activeProblem={activeProblem}
        viewMode={viewMode}
        handleViewChange={handleViewChange}
        selectedCluster={selectedCluster}
        setSelectdCluster={setSelectdCluster}
        columnData={columnData}
      />
    )
  }

  // 集群分析
  const renderClusterAnalysis = () => {
    const cluster = clusters.find((item) => item?.id === selectedCluster)
    const taskType = taskList?.find((item) => item?.id === selectedTask)?.taskType
    const showGenerateBtn: boolean = useMemo(() => {
      if (taskType === 4) {
        return !hasrecord
      } else {
        return !hasrecord && hasConfig
      }
    }, [hasrecord, taskType, hasConfig])

    const { description, remark } = cluster || {}
    //集群概览
    const renderOverall = () => (
      <div className="overflow-y-auto">
        <div className="text-[15px] font-medium mb-[25px] mx-2">{description}</div>
        <div className="mt-[40px] ">
          {remark && (
            <div>
              <div className="text-[15px] font-semibold mx-2">AI根因分析</div>
              <div className="p-2 my-2">
                <Tag
                  className="text-wrap p-3"
                  color="gold"
                  style={{ fontSize: "14px", borderRadius: "8px" }}
                >
                  {remark}
                </Tag>
              </div>
            </div>
          )}
        </div>
        <div className="mt-[40px] h-[32vh]">
          <div className="text-[15px] font-semibold mx-2">问题趋势</div>
          {clusterTrend.length === 0 ? (
            <div className="h-full justify-center items-center flex">
              <CustomEmpty description={"暂无数据"} />
            </div>
          ) : (
            <Line data={clusterTrend} {...lineConfig} />
          )}
        </div>
      </div>
    )
    // 关联优化单
    const renderRelatedOptimization = () => (
      <div className="overflow-y-auto pr-3 h-full">
        {relatedOptimizeOrder.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <CustomEmpty description={"暂无数据"} />
          </div>
        ) : (
          <div className="space-y-4 mt-1">
            {relatedOptimizeOrder.map((optimizationData, index) => (
              <OptimizationCard
                key={optimizationData?.externalId}
                optimizationData={optimizationData}
                index={index}
                handleClickCheck={handleClickCheck}
                isTaskType9={isTaskType9}
              />
            ))}
            {isFetchingNextPage && <div>Loading more...</div>}
            <div ref={ref} style={{ height: 40 }} /> {/* 用于检测滚动到底部 */}
          </div>
        )}
      </div>
    )
    // 优化建议
    const renderOptimizeSuggestions = () => {
      return (
        <div className="overflow-y-auto h-full">
          {/* Todo:共享useFlywheelData实例，不通过props传递 */}
          <OptimizeSuggestion
            chatRecordData={chatRecordData}
            isQueryMatchTaskLoading={isQueryMatchTaskLoading} // 正在获取匹配案例loading
            matchTask={matchTask} // 匹配案例数据
            isGenerateSuggestionLoading={isGenerateSuggestionLoading} //正在生成建议loading
            debouncedStatus={debouncedStatus} // 任务状态
            clusters={clusters}
            selectedCluster={selectedCluster}
            handleGenerateSuggestion={handleGenerateSuggestion} // 生成建议
            handleQueryClusterMatchTask={handleQueryClusterMatchTask} // 查询匹配案例
            handleUpdateSuggestion={handleUpdateSuggestion} // 更新优化建议采纳状态
            isfetchingChat={isfetchingChat}
            refetchChatRecord={refetchChatRecord} // 重新获取record
            startPolling={startPolling}
          />
        </div>
      )
    }
    return (
      <div
        className={`border border-gray-300 rounded-xl p-4 h-[100%] flex flex-col transition-all duration-300 ease-in-out ${viewMode === "listView" ? "w-[70%]" : "w-[65%]"}`}
      >
        <div className="text-xl font-medium ">问题分析</div>
        <div className="my-4 overflow-hidden flex justify-between pr-3">
          <Segmented
            options={analysisoptions}
            value={activeTab2}
            onChange={handleTabChange}
            className="custom-segmented"
          />
          {showGenerateBtn && (
            <Button type="primary" onClick={handleClickGenerate}>
              生成优化建议
            </Button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {activeTab2 === "overall" && renderOverall()}
          {activeTab2 === "relatedOptimizations" && renderRelatedOptimization()}
          {activeTab2 === "optimizeSuggestion" && renderOptimizeSuggestions()}
        </div>
      </div>
    )
  }

  const handleTabChange = (value) => {
    setActiveTab2(value)
  }

  return (
    <div className="overflow-auto h-full flex flex-col">
      <div className="p-4 flex-shrink-0 flex justify-between items-center">
        <Space>
          <Select
            placeholder="请选择"
            options={taskList}
            style={{ width: "300px" }}
            onChange={handleSelectChange}
            value={selectedTask}
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          ></Select>
          <RangeTimePicker
            value={[formValues.startTime, formValues.endTime]}
            defaultValue={[formValues.startTime, formValues.endTime]}
            style={{ width: "352px" }}
            onChange={handleDateRangeChange}
          />
        </Space>
        <div
          className="h-[34px] p-2 cursor-pointer space-x-1 border border-gray-200 rounded-md"
          onClick={() => {
            setDrawerKey((prev) => prev + 1)
            setDrawerOpen(true)
          }}
        >
          <SettingOutlined />
          <span>场景与任务配置</span>
        </div>
      </div>
      <div className="flex-shrink-0">{renderMetrics()}</div>

      {styleMode !== "new" && (
        <div className="flex max-h-[860px] items-start justify-between p-4 pb-0 w-[100%] space-x-4">
          {renderCluster()}
          {renderClusterAnalysis()}
        </div>
      )}

      <SettingDrawer
        key={drawerKey}
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
        taskId={isTaskType9 ? selectedTask : sourceTaskId}
        currentTask={currentTask}
        isTaskType9={isTaskType9}
      />
    </div>
  )
}

export default FlywheelOptimization
