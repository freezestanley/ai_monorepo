import { useState, useEffect, useMemo, useCallback } from "react"
import {
  useTasksApi,
  useStageAlysisApi,
  useDataAccumulationProgressApi,
  useStepChainApi,
  useSubtasksApi,
  useDashboardProblemApi,
  useDashboardClustersApi
} from "@/api/flywheel"
import { useLocation, useParams } from "react-router-dom"
import dayjs from "dayjs"
import { barData, cardListData, lineData, labelListData } from "./const"
import {
  useTotalbussiness,
  useProblemdistribution,
  useProblemclusters,
  useLossratetrend
} from "./api"
import { useSearchParams } from "react-router-dom"
import { sortTaskListByRecent } from "@/utils/recentTaskHistory"

// 业务全局概览数据类型
interface TotalBusinessData {
  key: string
  label: string
  value: number
}

export const useOverviewData = () => {
  const [formValues, setFormValues] = useState({
    startTime: dayjs().subtract(7, "days").startOf("day"),
    endTime: dayjs().endOf("day")
  })

  const [selectedTask, setSelectedTask] = useState("")
  const [selectedCardId, setSelectedCardId] = useState("") // stageId
  const [totalbussiness, setTotalbussiness] = useState<TotalBusinessData[]>([])
  const [Stageanalysis, setStageanalysis] = useState([])
  const [Problemdistribution, setProblemdistribution] = useState([])
  const [chartViewMode, setChartViewMode] = useState("problem")
  const [Problemclusters, setProblemclusters] = useState([])
  const [Lossratetrend, setLossratetrend] = useState([])
  const [modalOpen, setModalOpen] = useState(false) // 数据积累modal框开启/关闭
  const [isPolling, setIsPolling] = useState(false) // 控制是否启用轮询

  const [searchParams] = useSearchParams()
  const queryParams = Object.fromEntries(searchParams.entries())
  const { taskId, botNo, taskType } = queryParams
  const urlBotNo = botNo

  const currentStage = Stageanalysis.find((item) => item?.stageId === selectedCardId)
  const { entryTaskId, loseTaskId } = currentStage || {}
  const isTaskType9 = taskType === "9" // 此种类型为需要调整接口、ui

  // 获取任务列表
  const taskTypes = isTaskType9 ? ["9"] : ["2"]
  const taskListParams = { param: { botNo: urlBotNo, taskTypes } }
  const { data: taskListData } = useTasksApi(taskListParams)
  const rawList: any[] =
    taskListData?.value?.map((i: any) => ({
      ...i,
      label: i.name,
      value: i.id
    })) || []
  const taskList = sortTaskListByRecent("overview", rawList, urlBotNo as string)

  const currentTask = taskList.find((item) => item?.id === selectedTask)

  // 任务初始化
  useEffect(() => {
    if (taskList.length > 0 && !selectedTask) {
      if (taskId) {
        const task = taskList.find((item) => item?.thirdPartyId == taskId)
        if (task) {
          setSelectedTask(task.id) // 外部携带url参数跳转进来的
        } else {
          setSelectedTask(taskList[0].value) // 普通场景
        }
      } else {
        setSelectedTask(taskList[0].value)
      }
    }
  }, [taskId, taskList, selectedTask, setSelectedTask])

  // 全局概览
  const { data: totalbussinessData = {} } = useTotalbussiness({
    selectedTask,
    formValues
  })

  useEffect(() => {
    const metrics = [
      { key: "totalSessions", label: "总会话数", value: totalbussinessData?.totalSessions || 0 },
      { key: "validSessions", label: "有效会话数", value: totalbussinessData?.validSessions || 0 }
    ]
    setTotalbussiness(metrics)
  }, [totalbussinessData])

  // 阶段问题分布
  const { data: problemdistributionData = [] } = useProblemdistribution({
    chartViewMode,
    entryTaskId,
    loseTaskId,
    formValues,
    selectedCardId
  })
  useEffect(() => {
    // 展示前15条
    const processedData = problemdistributionData.slice(0, 15)
    setProblemdistribution(processedData)
  }, [JSON.stringify(problemdistributionData)])

  /*
   *  阶段问题集群/流失原因集群
   */
  const { data: problemclustersData = [] } = isTaskType9
    ? useDashboardClustersApi({
        taskId: selectedTask,
        problemCategoryId: selectedCardId,
        startTime: dayjs(formValues.startTime).format("YYYY-MM-DD HH:mm:ss"),
        endTime: dayjs(formValues.endTime).format("YYYY-MM-DD HH:mm:ss")
      })
    : useProblemclusters({
        chartViewMode,
        entryTaskId,
        loseTaskId,
        selectedCardId,
        startTime: dayjs(formValues.startTime).format("YYYY-MM-DD HH:mm:ss"),
        endTime: dayjs(formValues.endTime).format("YYYY-MM-DD HH:mm:ss")
      })
  // 更新到状态
  useEffect(() => {
    const result = problemclustersData?.value || []
    const amt = result.reduce((total, cluster) => total + cluster.optimizationOrderCount, 0)
    const finalResult = isTaskType9
      ? result.map(
          ({
            id,
            name,
            seatCount,
            optimizationOrderCount,
            trend,
            description,
            problemCategoryId
          }) => {
            const ratio = amt === 0 ? 0.0 : ((optimizationOrderCount / amt) * 100).toFixed(1)
            return {
              problemCategoryId,
              clusterId: id,
              clusterName: name,
              seatCount, // 人数(x轴)
              problemSessionCount: optimizationOrderCount, // 问题数（y轴）
              ratio,
              Trend: trend === "up" ? Number(ratio) : Number(-ratio),
              description
            }
          }
        )
      : result
    setProblemclusters(finalResult)
  }, [JSON.stringify(problemclustersData), isTaskType9])
  // console.log("Problemclusters", Problemclusters)

  // 流失率趋势
  const { data: lossratetrendData = [] } = useLossratetrend({
    chartViewMode,
    entryTaskId,
    loseTaskId,
    formValues,
    selectedCardId
  })
  useEffect(() => {
    setLossratetrend(lossratetrendData)
  }, [JSON.stringify(lossratetrendData)])

  /*
   *  业务阶段流失分析
   */
  const { data: stageAnalysisData = {} } = isTaskType9
    ? useDashboardProblemApi({
        taskId: selectedTask,
        startTime: dayjs(formValues.startTime).format("YYYY-MM-DD HH:mm:ss"),
        endTime: dayjs(formValues.endTime).format("YYYY-MM-DD HH:mm:ss")
      })
    : useStageAlysisApi({
        taskId: selectedTask,
        startTime: dayjs(formValues.startTime).format("YYYY-MM-DD HH:mm:ss"),
        endTime: dayjs(formValues.endTime).format("YYYY-MM-DD HH:mm:ss")
      })
  const rawData = stageAnalysisData?.value || []

  const stageAnalysis = isTaskType9
    ? rawData
        .map(({ id, name, orderCount }) => ({
          stageId: id,
          stageName: name,
          entryCount: orderCount,
          loseCount: 0,
          lossRate: 0.0
        }))
        .slice(1)
    : rawData

  // 更新状态
  useEffect(() => {
    if (stageAnalysis.length > 0) {
      const newStageId = stageAnalysis[0]?.stageId
      // 只在值真正变化时才更新
      if (newStageId !== selectedCardId) {
        setSelectedCardId(newStageId)
      }
    } else if (selectedCardId !== null) {
      setSelectedCardId(null)
    }
    setStageanalysis(stageAnalysis)
  }, [stageAnalysis.length, stageAnalysis[0]?.stageId, isTaskType9])

  /*
   *  数据积累数据
   */
  const { data: dataAccumulationProgressData = {}, refetch: refetchDataAccumulationProgress } =
    useDataAccumulationProgressApi(
      {
        taskId: selectedTask
      },
      {
        refetchInterval: (data) => {
          const completed = data?.value?.completed
          // 数据积累未完成，isPolling 为 true 时每5分钟轮询一次
          if (!completed && isPolling) {
            return 5 * 60 * 1000
          } else {
            return false
          }
        }
      }
    )
  const dataAccumulationProgress = useMemo(() => {
    return dataAccumulationProgressData?.value || {}
  }, [dataAccumulationProgressData?.value])
  const { completed: accumulateCompleted } = dataAccumulationProgress

  /*
   *  获取步骤链数据
   */
  const { data: stepChainData } = useStepChainApi(
    { taskId: selectedTask },
    {
      refetchInterval: (data) => {
        const completed = data?.value?.completed
        // 数据积累完成，执行步骤未完成且 isPolling 为 true 时每5秒轮询一次
        if (accumulateCompleted && completed === false && isPolling) {
          return 5000
        } else {
          return false
        }
      }
    }
  )
  const steps = useMemo(() => {
    return stepChainData?.value?.stepsRecords || []
  }, [stepChainData?.value?.stepsRecords])
  const stepChainCompleted = stepChainData?.value?.completed // 步骤链是否完成

  useEffect(() => {
    if (stepChainCompleted === false) {
      setModalOpen(true)
      setIsPolling(true) // 步骤链未完成时，打开模态框，开启轮询
    } else {
      setModalOpen(false)
      setIsPolling(false) // 步骤链完成时，关闭模态框，停止轮询
    }
  }, [stepChainCompleted, selectedTask])

  // 手动关闭 Modal 时停止轮询
  const handleCloseModal = useCallback(() => {
    setModalOpen(false)
    setIsPolling(false)
  }, [])

  /*
   *  获取子任务信息
   */
  const { data: subtasksData, refetch: refetchSubtasks } = useSubtasksApi({ taskId: selectedTask })

  const { lossEnabled, generalEnabled } = useMemo(() => {
    const subtasks = subtasksData?.value || []
    const generalEnabled =
      subtasks.find((item) => item.taskType === 6)?.execEnabled === 1 || isTaskType9
    const lossEnabled = subtasks.find((item) => item.taskType === 7)?.execEnabled === 1
    return { lossEnabled, generalEnabled }
  }, [subtasksData, isTaskType9])

  return {
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

    // 数据
    taskList,
    totalbussiness,
    Stageanalysis,
    Problemdistribution,
    Problemclusters,
    Lossratetrend,
    currentTask,
    barData,
    cardListData,
    lineData,
    labelListData,
    dataAccumulationProgress,
    steps,
    lossEnabled, // 业务阶段流失分析-下半部分是否可点击
    generalEnabled, // 业务阶段流失分析-上半部分是否可点击
    urlBotNo,
    isTaskType9,

    // 方法
    refetchDataAccumulationProgress,
    refetchSubtasks, // 重新获取子任务信息
    handleCloseModal // 手动关闭 Modal 并停止轮询
  }
}
