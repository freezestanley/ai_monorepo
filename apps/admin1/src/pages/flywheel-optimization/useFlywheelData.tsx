// hooks/useFlywheelData.js
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { message } from "antd"
import { useLocation, useSearchParams } from "react-router-dom"
import dayjs from "dayjs"
import queryString from "query-string"
import {
  useTasksApi,
  useDashboardSummaryApi,
  useDashboardProblemApi,
  useDashboardClustersApi,
  useClusterTrendApi,
  useInfiniteOptimizeOrderApi,
  useBatchClustersApi, // 批量查询集群
  useClusterOptimizeTaskApi,
  useClusterMatchTaskApi,
  useGenerateSuggestionApi,
  useQuerySuggestionApi,
  useUpdateSuggestionApi,
  useInfiniteQueryChatRecordApi,
  useScenarioInfoApi,
  studyConfigResultApi
} from "@/api/flywheel"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { sortTaskListByRecent } from "@/utils/recentTaskHistory"

export const useFlywheelData = () => {
  const queryClient = useQueryClient()
  const [selectedTask, setSelectedTask] = useState("")
  const [formValues, setFormValues] = useState({
    startTime: dayjs().subtract(7, "days").startOf("day"),
    endTime: dayjs().endOf("day")
  })
  const [activeProblem, setActiveProblem] = useState("") // 问题ID
  const [selectedCluster, setSelectdCluster] = useState("") // 集群ID
  const [matchTask, setMatchTask] = useState(null) // 匹配案例
  const [querySuggestionData, setQuerySuggestionData] = useState() // 优化建议

  const [searchParams] = useSearchParams()
  const queryParams = Object.fromEntries(searchParams.entries())
  const {
    botNo: urlBotNo,
    taskId,
    name,
    clusterId: urlClusterId,
    startTime,
    endTime,
    taskType
  } = queryParams
  const isTaskType9 = taskType === "9" // 灵眸风险雷达特殊版本、此种类型为需要调整接口、ui

  // 获取任务列表
  const taskTypes = isTaskType9 ? ["9"] : ["1", "4", "6", "7"]
  const taskListParams = { param: { botNo: urlBotNo, taskTypes } }
  const { data: taskListData } = useTasksApi(taskListParams)
  const rawList: any[] =
    taskListData?.value?.map((i) => ({
      ...i,
      label: i.name,
      value: i.id
    })) || []
  const taskList = sortTaskListByRecent("optimization", rawList, urlBotNo as string)

  const currentTask = taskList.find((item) => item?.id === selectedTask)

  // 任务初始化
  useEffect(() => {
    if (taskList.length > 0 && !selectedTask) {
      if (taskId) {
        const task = taskList.find((item) => item?.thirdPartyId == taskId || item?.id == taskId)
        // console.log("task-----", task)
        if (task) {
          setSelectedTask(task.id)
        } else {
          setSelectedTask(taskList[0].value)
        }
      } else {
        setSelectedTask(taskList[0].value)
      }
    }
  }, [taskId, taskList, selectedTask, setSelectedTask])

  // 时间初始化
  useEffect(() => {
    // 时间范围设置
    if (startTime && endTime) {
      // 确保 startTime 和 endTime 是字符串而不是数组
      const startValue = Array.isArray(startTime) ? startTime[0] : startTime
      const endValue = Array.isArray(endTime) ? endTime[0] : endTime
      const values = {
        startTime: dayjs(startValue).startOf("day"),
        endTime: dayjs(endValue).endOf("day")
      }
      setFormValues(values)
    }
  }, [startTime, endTime, setFormValues])

  // 获取仪表盘数据
  const { data: dashboardSummary = {} } = useDashboardSummaryApi({
    taskId: selectedTask,
    botNo: urlBotNo,
    startTime: dayjs(formValues.startTime).format("YYYY-MM-DD HH:mm:ss"),
    endTime: dayjs(formValues.endTime).format("YYYY-MM-DD HH:mm:ss")
  })

  const metrics = dashboardSummary?.value || []

  // 获取问题列表
  const { data: problemCategoriesData } = useDashboardProblemApi({
    taskId: selectedTask,
    startTime: dayjs(formValues.startTime).format("YYYY-MM-DD HH:mm:ss"),
    endTime: dayjs(formValues.endTime).format("YYYY-MM-DD HH:mm:ss")
  })
  const problemCategories = useMemo(() => {
    const result =
      problemCategoriesData?.value?.map(({ id, name, ...rest }) => ({
        value: id,
        label: name,
        ...rest
      })) || []
    return result
  }, [problemCategoriesData])

  const problemCategoriesForTable: Array<any> = useMemo(() => {
    return problemCategories
      .slice(1)
      .filter((item) => item.orderCount > 0)
      .sort((a, b) => b.orderCount - a.orderCount)
  }, [problemCategories])

  // 为 problemCategoriesForTable 中的每个 category 并行查询集群数据
  const clusterQueriesRaw = useBatchClustersApi(problemCategoriesForTable, {
    taskId: selectedTask,
    botNo: urlBotNo,
    startTime: dayjs(formValues.startTime).format("YYYY-MM-DD HH:mm:ss"),
    endTime: dayjs(formValues.endTime).format("YYYY-MM-DD HH:mm:ss")
  })

  // 稳定 clusterQueries 的引用，避免每次都创建新数组
  const clusterQueries = useMemo(() => {
    // 只有当数据真正变化时才返回新引用
    return clusterQueriesRaw
  }, [
    // 使用序列化的方式比较数据是否真正变化
    JSON.stringify(
      clusterQueriesRaw.map((q) => ({
        data: q.data,
        isLoading: q.isLoading,
        isError: q.isError
      }))
    )
  ])
  // 转换为柱状图数据
  const columnData = useMemo(() => {
    let data = []
    clusterQueries?.forEach((item, index) => {
      item?.data?.forEach(({ id, name, optimizationOrderCount }) => {
        data.push({
          problem: problemCategoriesForTable[index]?.label,
          clusterId: id,
          clusterName: name,
          count: optimizationOrderCount
        })
      })
    })
    const result = data.filter((item) => item.count > 0) // 柱状图不展示为0的数据
    return result
  }, [clusterQueries, problemCategoriesForTable])

  // 问题分类初始化
  useEffect(() => {
    if (problemCategories.length > 0 && !activeProblem) {
      if (name) {
        const problem = problemCategories.find((item) => item.label === name || item.value === name)
        // console.log("problem-----", problem)
        if (problem) {
          setActiveProblem(problem.value)
        } else {
          setActiveProblem(problemCategories[0].value)
        }
      } else {
        setActiveProblem(problemCategories[0].value)
      }
    }
  }, [name, problemCategories, activeProblem, setActiveProblem])

  // 获取某问题的集群列表
  const { data: clustersData } = useDashboardClustersApi({
    problemCategoryId: activeProblem,
    taskId: selectedTask,
    botNo: urlBotNo,
    startTime: dayjs(formValues.startTime).format("YYYY-MM-DD HH:mm:ss"),
    endTime: dayjs(formValues.endTime).format("YYYY-MM-DD HH:mm:ss")
  })
  const clusters = useMemo(() => {
    const result = clustersData?.value || []
    return result
  }, [clustersData])
  const currentCluster = clusters.find((item) => item?.id === selectedCluster)

  //  集群初始化
  useEffect(() => {
    if (clusters.length > 0 && !selectedCluster) {
      if (urlClusterId) {
        const cluster = clusters.find((item) => item.id === urlClusterId)
        // console.log("cluster-----", cluster)
        if (cluster) {
          setSelectdCluster(cluster.id)
        } else {
          setSelectdCluster(clusters[0].id)
        }
      } else {
        setSelectdCluster(clusters[0].id)
      }
    }
  }, [clusters, selectedCluster])

  // 当selectedCluster变化时，清除之前的优化单数据
  useEffect(() => {
    if (selectedCluster) {
      setQuerySuggestionData(null)
      // 清除之前的优化单数据缓存
      queryClient.removeQueries({
        predicate: (query) => {
          return query.queryKey[0] === QUERY_KEYS.FLYWHEEL_DASHBOARD_OPTIMIZATION_ORDERS
        }
      })
    }
  }, [selectedCluster, queryClient])

  // 获取某集群的数据概览
  const { data: clusterTrendData } = useClusterTrendApi({
    problemCategoryId: activeProblem,
    clusterId: selectedCluster,
    taskId: selectedTask,
    botNo: urlBotNo,
    startTime: dayjs(formValues.startTime).format("YYYY-MM-DD HH:mm:ss"),
    endTime: dayjs(formValues.endTime).format("YYYY-MM-DD HH:mm:ss")
  })
  const clusterTrend =
    clusterTrendData?.value?.map(({ label, ...rest }) => ({
      date: label,
      ...rest
    })) || []

  //获取某集群的关联优化单
  const relatedOrderParams = useMemo(
    () => ({
      pageSize: 5,
      param: {
        problemCategoryId: activeProblem,
        clusterId: selectedCluster,
        taskId: selectedTask,
        botNo: urlBotNo,
        startTime: dayjs(formValues.startTime).format("YYYY-MM-DD HH:mm:ss"),
        endTime: dayjs(formValues.endTime).format("YYYY-MM-DD HH:mm:ss")
      }
    }),
    [
      activeProblem,
      selectedCluster,
      selectedTask,
      urlBotNo,
      formValues.startTime,
      formValues.endTime
    ]
  )

  const {
    data: relatedOptimizeOrderData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteOptimizeOrderApi(relatedOrderParams)

  const relatedOptimizeOrder = relatedOptimizeOrderData?.pages?.flatMap((page) => page?.value) || []

  /*  方法  */

  // 查询优化任务状态
  const { mutate: fetchClusterOptimizeTask, data: clusterOptimizeTaskData } =
    useClusterOptimizeTaskApi()
  const { taskStatus: curretnStatus } = clusterOptimizeTaskData?.value || {}

  const [debouncedStatus, setDebouncedStatus] = useState(curretnStatus)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedStatus(curretnStatus)
    }, 500) // 500ms 防抖延迟

    return () => {
      clearTimeout(handler)
    }
  }, [curretnStatus])

  // 轮询查询优化任务状态 - 改为手动控制
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // 启动轮询
  const startPolling = useCallback(() => {
    // 如果已经在轮询中，先清理
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    // 如果参数不全，不进行轮询
    if (!selectedCluster || !selectedTask || !currentCluster) {
      return
    }

    // 设置定时器进行轮询
    pollingIntervalRef.current = setInterval(() => {
      // 重新获取任务状态
      fetchClusterOptimizeTask(
        {
          taskId: selectedTask,
          primaryCategoryId: currentCluster?.problemCategoryId,
          secondaryCategoryId: selectedCluster
        },
        {
          onSuccess: (data) => {
            // 检查返回的数据状态，如果已完成或失败则清除定时器
            const { taskStatus } = data?.value || {}
            if (taskStatus && ["3", "4"].includes(taskStatus.toString())) {
              console.log("任务已完成或失败，停止轮询，状态:", taskStatus)
              stopPolling()
              refetchChatRecord()
            }
          },
          onError: (error) => {
            console.error("轮询出错:", error)
          }
        }
      )
    }, 1000) // 每1秒查询一次
  }, [currentCluster, selectedCluster, selectedTask, fetchClusterOptimizeTask])

  // 停止轮询
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }, [])

  // 检查是否正在轮询
  const isPolling = useMemo(() => {
    return pollingIntervalRef.current !== null
  }, [pollingIntervalRef.current])

  // 清理函数：组件卸载时清除定时器
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  // 查询当前集群的匹配优化案例
  const { mutate: queryClusterMatchTask, isLoading: isQueryMatchTaskLoading } =
    useClusterMatchTaskApi()
  const handleQueryClusterMatchTask = useCallback(() => {
    if (currentCluster?.id && currentCluster?.name && currentCluster?.description) {
      queryClusterMatchTask(
        {
          taskId: selectedTask,
          secondaryCategoryId: currentCluster.id,
          secondaryCategoryName: currentCluster.name,
          secondaryCategoryDetail: currentCluster.description
        },
        {
          onSuccess: (data) => {
            setMatchTask(data?.value || {})
            startPolling()
          },
          onError: () => {}
        }
      )
    }
  }, [currentCluster, queryClusterMatchTask])
  // console.log("matchTask-----", matchTask)

  // 生成优化建议
  const { mutate: generateSuggestion, isLoading: isGenerateSuggestionLoading } =
    useGenerateSuggestionApi()
  const handleGenerateSuggestion = useCallback(() => {
    if (selectedTask && currentCluster && selectedCluster) {
      generateSuggestion(
        {
          taskId: selectedTask,
          primaryCategoryId: currentCluster?.problemCategoryId,
          secondaryCategoryId: selectedCluster,
          caseIds: matchTask?.caseIds
        },
        {
          onSuccess: () => {
            message.success("操作成功")
            // 开始轮询查询优化任务状态
            startPolling()
          },
          onError: () => {}
        }
      )
    }
  }, [currentCluster, selectedTask, selectedCluster, matchTask, generateSuggestion])

  // 查询优化建议
  // const { mutate: querySuggestion, isLoading: querySuggestionLoading } = useQuerySuggestionApi()
  // const handleQuerySuggestion = useCallback(
  //   (overrideOptimizationTaskId?: string) => {
  //     if (currentCluster && selectedCluster) {
  //       querySuggestion(
  //         {
  //           primaryCategoryId: currentCluster?.problemCategoryId,
  //           secondaryCategoryId: selectedCluster,
  //           optimizationTaskId:
  //             overrideOptimizationTaskId || clusterOptimizeTaskData?.value?.optimizationTaskId,
  //           startTime: dayjs(formValues.startTime).format("YYYY-MM-DD HH:mm:ss"),
  //           endTime: dayjs(formValues.endTime).format("YYYY-MM-DD HH:mm:ss")
  //         },
  //         {
  //           onSuccess: (data) => {
  //             setQuerySuggestionData(data?.value)
  //           },
  //           onError: () => {}
  //         }
  //       )
  //     }
  //   },
  //   [currentCluster, selectedCluster, clusterOptimizeTaskData, formValues, querySuggestion]
  // )

  // 采纳
  const { mutate: updateSuggestion } = useUpdateSuggestionApi()
  const handleUpdateSuggestion = useCallback((id) => {
    updateSuggestion(
      {
        suggestionId: id,
        adoptionStatus: 1
      },
      {
        onSuccess: (data) => {},
        onError: () => {}
      }
    )
  }, [])

  // 分页查询聊天记录
  const chatRecordParams = useMemo(
    () => ({
      taskId: selectedTask,
      secondaryCategoryId: selectedCluster,
      pageSize: 20
    }),
    [selectedTask, selectedCluster]
  )

  const {
    data: chatRecordDataRaw,
    fetchNextPage: fetchNextPageChat,
    hasNextPage: hasNextPageChat,
    isFetchingNextPage: isFetchingNextPageChat,
    isFetching: isfetchingChat,
    refetch: refetchChatRecord
  } = useInfiniteQueryChatRecordApi(chatRecordParams)
  const chatRecordData = chatRecordDataRaw?.pages?.flatMap((page) => page?.value?.records) || []

  /*
   *  获取场景主任务id
   */
  const { data: scenarioData } = useScenarioInfoApi(selectedTask)
  const sourceTaskId = useMemo(() => {
    return scenarioData?.value?.sourceTaskId
  }, [scenarioData])

  /*
   *  查询当前taskId是否有配置数据源
   */
  const { data: configResultData } = studyConfigResultApi({ taskId: selectedTask })
  const hasConfig = useMemo(() => {
    return configResultData?.value?.[0]?.purposeCode === 2
  }, [configResultData])

  return {
    // 状态
    selectedTask,
    setSelectedTask,
    formValues,
    setFormValues,
    activeProblem,
    setActiveProblem,
    selectedCluster,
    setSelectdCluster,
    matchTask,

    // 数据
    taskList,
    metrics,
    problemCategories,
    columnData,
    clusters,
    clusterTrend,
    relatedOptimizeOrder,
    curretnStatus, // 当前集群的优化任务状态
    debouncedStatus, // 当前集群的优化任务状态(防抖)
    querySuggestionData, // 当前集群的优化建议数据
    chatRecordData,
    sourceTaskId,
    hasConfig,
    currentTask,
    urlBotNo,
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
  }
}
