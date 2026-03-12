import React, { useState, useCallback, useEffect, useMemo } from "react"
import { message, Select } from "antd"
import { TeamOutlined, createFromIconfontCN, SettingOutlined } from "@ant-design/icons"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"
import { Bar, Line, Scatter } from "@ant-design/plots"
import RangeTimePicker from "@/components/RangeTime"
import { useOverviewData } from "./useOverviewData"
import "./index.less"
import { barConfig, lineConfig, scatterConfig } from "./config"
import CountUp from "react-countup"
import linkIcon from "@/assets/img/linkTo.png"
import BusinessStageLoss from "./components/BusinessStageLoss"
import { postMessageForLX } from "@/utils"
import { MessageType } from "@/constants/postMessageType"
import { recordTaskUsage } from "@/utils/recentTaskHistory"
import LeakingTable from "./components/LeakingTable"
import DataAccumulation from "./components/DataAccumulation"
import SettingDrawer from "./components/SettingDrawer"

const IconFont = createFromIconfontCN({
  scriptUrl: "//at.alicdn.com/t/c/font_4178446_qgjw7h02dw.js"
})

const analysisOptions = [
  { label: "AI会话分析", icon: <IconFont type="icon-robot" />, value: "aiConversationsion" },
  { label: "人工会话分析", icon: <TeamOutlined />, value: "humanConversation" }
]

function FlywheelOverview() {
  const [drawerKey, setDrawerKey] = useState(0)

  const {
    // 状态
    selectedTask,
    setSelectedTask,
    formValues,
    setFormValues,
    selectedCardId,
    setSelectedCardId,
    chartViewMode,
    setChartViewMode,
    modalOpen,
    setModalOpen,

    totalbussiness,
    Stageanalysis,
    Problemdistribution,
    Problemclusters,

    // 数据
    taskList,
    currentTask,
    Lossratetrend,
    dataAccumulationProgress,
    steps,
    lossEnabled, // 业务阶段流失分析-下半部分是否可点击
    generalEnabled, // 业务阶段流失分析-上半部分是否可点击
    urlBotNo,
    isTaskType9,

    // 方法
    refetchDataAccumulationProgress,
    refetchSubtasks,
    handleCloseModal // 手动关闭 Modal 并停止轮询
  } = useOverviewData()
  const currentStage = Stageanalysis.find((s) => s.stageId === selectedCardId)
  const { entryTaskId, loseTaskId } = currentStage || {}
  const [drawerOpen, setDrawerOpen] = useState(false)
  // const a = useTotalbusine({ startTime: formValues?.startTime, endTime: formValues?.endTime, taskId: '' })
  const handleChange = (value) => {
    setSelectedTask(value)
    // 记录任务使用历史
    recordTaskUsage("overview", value, urlBotNo as string)
  }
  const handleDateRangeChange = useCallback(
    (dates) => {
      if (!dates?.[0] || !dates?.[1]) return
      const values = {
        startTime: dates[0],
        endTime: dates[1]
      }
      setFormValues(values)
    },
    [setFormValues]
  )

  // 跳转到数据飞轮-优化建议中心
  const navigateToFlyWheel = useCallback(
    (clusterId) => {
      const selectedTaskId = chartViewMode === "problem" ? entryTaskId : loseTaskId
      try {
        // 跳转
        postMessageForLX({
          type: MessageType.NAVIGATE_TO_FLYWHEEL,
          data: {
            taskId: selectedTaskId,
            name: currentStage?.stageId, // 问题ID(stageID)
            clusterId,
            startTime: formValues.startTime.format("YYYY-MM-DD 00:00:00"),
            endTime: formValues.endTime.format("YYYY-MM-DD 23:59:59")
          }
        })
      } catch (error) {
        message.error("跳转失败，请重试")
      } finally {
      }
    },
    [chartViewMode, entryTaskId, loseTaskId]
  )

  // 打开场景与任务配置
  const openSettingDrawer = () => {
    setDrawerKey((prev) => prev + 1) // 强制重新渲染drawer
    setDrawerOpen(true)
  }

  // 数据
  const renderMetrics = () => {
    return (
      <div className="flex items-center gap-4">
        {totalbussiness.map(({ key, label, value }) => (
          <div key={key} className="flex-1 bg-white border border-gray-200 rounded-xl px-8 py-2">
            <div className="text-base font-medium mb-2 items-center gap-1">{label}</div>
            <div className="text-[24px] font-semibold">
              <CountUp end={value} duration={1} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // 业务阶段流失分析
  const renderStageLoss = () => {
    return (
      <div className="flex flex-row items-center gap-2 mb-2 overflow-x-auto h-[400px] w-full">
        <BusinessStageLoss
          selectedCardId={selectedCardId}
          setSelectedCardId={setSelectedCardId}
          chartViewMode={chartViewMode}
          setChartViewMode={setChartViewMode}
          Stageanalysis={Stageanalysis}
          lossEnabled={lossEnabled}
          generalEnabled={generalEnabled}
          isTaskType9={isTaskType9}
        />
      </div>
    )
  }
  const scatterChart = useMemo(() => {
    return <Scatter data={Problemclusters} {...scatterConfig} />
  }, [Problemclusters])

  return (
    <div className={`flex flex-col space-y-2 h-full  bg-[#f9fafb]  overflow-y-auto`}>
      {/* header */}
      <div className="mx-4 mt-4 px-4 py-2 space-y-2 border border-gray-200 rounded-xl bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-[20px] font-bold">业务全局概览</div>
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Select
              placeholder="请选择"
              options={taskList}
              style={{ width: "180px" }}
              onChange={handleChange}
              value={selectedTask}
              defaultValue={selectedTask}
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
            <div
              className="h-[34px] p-2 cursor-pointer space-x-1 border border-gray-200 rounded-md"
              onClick={openSettingDrawer}
            >
              <SettingOutlined />
              <span>场景与任务配置</span>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0">{renderMetrics()}</div>
      </div>
      {/* 业务阶段流失分析 */}
      {!isTaskType9 && (
        <div className="flex flex-col justify-center mx-4 mb-4 p-4 pb-0 border border-gray-200 rounded-xl bg-white">
          <div className="text-[20px] font-bold">业务阶段流失分析</div>
          <div>
            {/* 业务阶段流失分析 */}
            <div className="flex ">{renderStageLoss()}</div>
            {/* 底部图表 */}
            <div className="flex items-start justify-between mx-4 space-x-6 min-h-[400px] max-h-[500px]">
              {/* 左侧-阶段问题分布 */}
              <div className="flex flex-col rounded-xl w-[50%] p-4 bg-white self-stretch">
                <div className="flex items-center space-x-2">
                  <span
                    className={`w-1 h-4 rounded-full ${chartViewMode === "problem" ? "bg-violet-600" : "bg-rose-500"}`}
                  ></span>
                  <span className="text-[16px] font-bold ">
                    {chartViewMode === "problem" ? "阶段问题分布" : "流失率趋势"}
                  </span>
                </div>
                {currentStage && (
                  <p className="text-s text-gray-400 pl-3">
                    正在查看:
                    <span
                      className={`font-medium ${chartViewMode === "problem" ? "text-violet-600" : "text-rose-600"}`}
                    >
                      {currentStage?.stageName}
                    </span>
                  </p>
                )}
                <div className="flex w-full justify-center items-start my-4 flex-1 min-h-0">
                  {chartViewMode === "problem" &&
                    (Problemdistribution.length > 0 ? (
                      <div
                        className="w-full mt-4 h-full"
                        // style={{
                        //   // 根据数据条数动态计算高度，每条数据50px，最小300px，最多900px
                        //   height: `${Math.min(Math.max(Problemdistribution.length * 40, 300), 900)}px`
                        // }}
                      >
                        <Bar data={Problemdistribution} {...barConfig} />
                      </div>
                    ) : (
                      <div className="h-[100%] flex items-center justify-center">
                        <CustomEmpty description={"暂无数据"} />
                      </div>
                    ))}
                  {chartViewMode === "churn" && Lossratetrend.length > 0 && (
                    <div className="w-full h-full ">
                      <Line data={Lossratetrend} {...lineConfig} />
                    </div>
                  )}
                </div>
              </div>

              {/* 分隔线 */}
              <div className="self-stretch w-px bg-gray-200"></div>

              {/* 右侧-阶段问题集群 */}
              <div className="flex flex-col w-[50%] p-4 pr-0 bg-white  self-stretch">
                <div className="text-[18px] space-x-2">
                  <span className="text-s font-bold ">
                    {chartViewMode === "problem" ? "阶段问题集群" : "流失原因集群"}
                  </span>
                  {currentStage && (
                    <span className="text-[10px] text-gray-400 bg-white px-2 py-0.5 rounded border border-gray-100">
                      {currentStage?.stageName}
                    </span>
                  )}
                </div>
                <div className="mt-4 mx-2 space-y-2 overflow-y-auto flex-1 min-h-0">
                  {chartViewMode === "problem" &&
                    Problemclusters.length > 0 &&
                    Problemclusters.map(
                      ({ clusterName, clusterId, description, problemSessionCount, ratio }) => {
                        return (
                          <div
                            key={clusterId}
                            className="border border-gray-200 rounded-xl text-[14px] p-4 mr-4 space-y-2 hover:bg-[rgba(245,247,250,1)] group"
                          >
                            <div className="flex justify-between items-center font-medium">
                              <div>{clusterName}</div>
                              <div
                                className="flex items-center gap-1 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                onClick={() => navigateToFlyWheel(clusterId)}
                              >
                                <img
                                  src={linkIcon}
                                  alt="linkIcon"
                                  className="w-[16px] h-[16px]"
                                ></img>
                                <div>去优化</div>
                              </div>
                            </div>

                            <div className="text-[rgba(71,84,103,1)]">{description}</div>
                            <div className="flex text-[12px] space-x-2">
                              <div className="flex bg-[#F5F7FA] px-2 items-center h-[22px] space-x-2 border border-gray-200 rounded">
                                <div>{`问题会话数${problemSessionCount}`}</div>
                                <div>{"(" + ratio + "%)"}</div>
                              </div>
                              <div className="flex px-2 bg-[#F5F7FA] items-center h-[22px] space-x-2 border border-gray-200 rounded">
                                {currentStage?.stageName}
                              </div>
                            </div>
                          </div>
                        )
                      }
                    )}
                  {chartViewMode === "problem" && Problemclusters.length === 0 && (
                    <div className="h-[100%] flex items-center justify-center">
                      <CustomEmpty description={"暂无数据"} />
                    </div>
                  )}
                  {chartViewMode === "churn" &&
                    Problemclusters.length > 0 &&
                    Problemclusters.map(
                      ({ clusterName, clusterId, description, typicalSession, ratio }) => {
                        return (
                          <div
                            key={clusterId}
                            className="flex flex-col border border-gray-200 rounded-xl p-4 mr-4 bg-[#fef8f8] space-y-1 group"
                          >
                            <div className="flex justify-between">
                              <span className="text-[15px] text-[#a73636] font-semibold">
                                {clusterName}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-[15px] text-[#de2f30] font-semibold">
                                  {ratio}%
                                </span>
                                <div
                                  className="flex items-center gap-1 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                  onClick={() => navigateToFlyWheel(clusterId)}
                                >
                                  <img
                                    src={linkIcon}
                                    alt="linkIcon"
                                    className="w-[16px] h-[16px]"
                                  ></img>
                                  <div>去优化</div>
                                </div>
                              </div>
                            </div>
                            <div className="text-[14px] text-slate-500 font-semibold">
                              {description}
                            </div>
                            <div className="text-[12px] text-slate-500 ">
                              {typicalSession.map((ele, idx, arr) => {
                                return <div key={idx}>{ele}</div>
                              })}
                            </div>
                          </div>
                        )
                      }
                    )}
                  {chartViewMode === "churn" && Problemclusters.length === 0 && (
                    <div className="h-[100%] flex items-center justify-center">
                      <CustomEmpty description={"暂无数据"} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 业务阶段流失分析（风险雷达样式） */}
      {isTaskType9 && (
        <div className="flex flex-col h-[88vh] max-h-[1100px] mx-4 p-4 border border-gray-200 rounded-xl bg-white space-y-4">
          <div className="flex flex-row w-full justify-between items-center space-x-4 ">
            {Stageanalysis.map((stage, index) => {
              const isSelected = stage?.stageId === selectedCardId
              return (
                <div
                  key={stage?.stageId}
                  className={`flex flex-col flex-1 transition-all duration-300 p-4 justify-between border border-gray-200 rounded-xl group group/to cursor-pointer  space-y-2 ${isSelected ? "bg-[#17202f]" : "hover:bg-blue-50"}`}
                  onClick={() => setSelectedCardId(stage?.stageId)}
                >
                  <div
                    className={`
                        text-sm font-medium truncate mb-1 transition-colors duration-300
                        ${isSelected ? "text-white font-bold" : "text-gray-800 "}
                      `}
                  >
                    {stage?.stageName}
                  </div>
                  <div
                    className={`
                        text-3xl font-bold transition-all duration-300
                        ${isSelected ? "text-white scale-105 origin-left" : "text-gray-900 "}
                      `}
                  >
                    {stage?.entryCount}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex h-full w-full flex-1 min-h-0 items-start justify-between space-x-4">
            <div className="flex flex-col h-full border w-[60%] min-h-[500px] border-gray-300 rounded-xl p-4 overflow-x-hidden transition-all duration-300 ease-in-out">
              {scatterChart}
            </div>
            <div className="flex flex-col border w-[40%] h-full border-gray-300 rounded-xl p-4 overflow-x-hidden transition-all duration-300 ease-in-out">
              <LeakingTable
                formValues={formValues}
                Problemclusters={Problemclusters}
                currentStage={currentStage}
                selectedTask={selectedTask}
              />
            </div>
          </div>
        </div>
      )}
      {
        <DataAccumulation
          open={modalOpen}
          onCancel={handleCloseModal}
          openSettingDrawer={openSettingDrawer}
          dataAccumulationProgress={dataAccumulationProgress}
          steps={steps}
          refetchDataAccumulationProgress={refetchDataAccumulationProgress}
        />
      }
      <SettingDrawer
        key={drawerKey}
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
        taskId={selectedTask}
        currentTask={currentTask}
        refetchSubtasks={refetchSubtasks}
        isTaskType9={isTaskType9}
      />
    </div>
  )
}

export default FlywheelOverview
