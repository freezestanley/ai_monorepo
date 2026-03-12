/*
 * @Author: System
 * @Date: 2025-01-15 00:00:00
 * @Descripttion: 数据飞轮相关API hooks
 * @LastEditors: System
 * @LastEditTime: 2025-01-15 00:00:00
 * @FilePath: /za-aigc-platform-admin-static/src/api/flywheel/index.jsx
 * Copyright (c) 2025 by ZA-智能中台, All Rights Reserved.
 */
import {
  useQuery,
  useQueries,
  useMutation,
  useQueryClient,
  useInfiniteQuery
} from "@tanstack/react-query"
import {
  fetchDashboardSummary,
  fetchTasks,
  fetchProblemCategories,
  fetchClusters,
  fetchClusterTrend,
  fetchRelatedOptimizeOrder,
  fetchOptimizationTask,
  fetchClusterMatchCase,
  generateOptimization,
  fetchOptimization,
  updateOptimization,
  queryChatRecord,
  studyConfigResult,
  // 场景与业务配置
  getScenerioInfo,
  getDataSourceSelect,
  getDataSource,
  getStage,
  getSubtasks,
  getCategory,
  getPrompt,
  saveAllSettings,
  //  业务全景概览
  featchStageAlysis,
  fetchDataAccumulationProgress,
  fetchStepChain
} from "./api"
import { QUERY_KEYS } from "@/constants/queryKeys"

/**
 * @description: 获取任务列表
 * @param {Object} params - 请求参数
 * @return {*}
 */
export const useTasksApi = (params = {}) => {
  const { param } = params
  return useQuery([QUERY_KEYS.FLYWHEEL_TASKS, params], () => fetchTasks(params), {
    enabled: !!param?.botNo
  })
}

/**
 * @description: 获取仪表盘摘要信息
 * @param {Object} params - 请求参数
 * @return {*}
 */
export const useDashboardSummaryApi = (params = {}) => {
  const { taskId, startTime, endTime } = params
  return useQuery(
    [QUERY_KEYS.FLYWHEEL_DASHBOARD_SUMMARY, params],
    () => fetchDashboardSummary(params),
    {
      enabled: !!taskId && !!startTime && !!endTime
    }
  )
}

/**
 * @description: 获取问题列表
 * @param {Object} params - 请求参数
 * @return {*}
 */
export const useDashboardProblemApi = (params = {}) => {
  const { taskId, startTime, endTime } = params
  return useQuery(
    [QUERY_KEYS.FLYWHEEL_DASHBOARD_PROBLEM_CATEGORIES, params],
    () => fetchProblemCategories(params),
    {
      enabled: !!taskId && !!startTime && !!endTime
    }
  )
}

/**
 * @description: 获取某问题的集群列表
 * @param {Object} params - 请求参数
 * @return {*}
 */
export const useDashboardClustersApi = (params = {}) => {
  const { taskId, startTime, endTime, problemCategoryId } = params
  return useQuery([QUERY_KEYS.FLYWHEEL_DASHBOARD_CLUSTERS, params], () => fetchClusters(params), {
    enabled: !!taskId && !!startTime && !!endTime && !!problemCategoryId
  })
}

/**
 * @description: 获取某集群的问题概览
 * @param {Object} params - 请求参数
 * @return {*}
 */
export const useClusterTrendApi = (params = {}) => {
  const { taskId, startTime, endTime, problemCategoryId, clusterId } = params
  return useQuery([QUERY_KEYS.FLYWHEEL_DASHBOARD_TREND, params], () => fetchClusterTrend(params), {
    enabled: !!taskId && !!startTime && !!endTime && !!problemCategoryId && !!clusterId
  })
}

/**
 * @description: 获取某集群的关联优化单
 * @param {Object} params - 请求参数
 * @return {*}
 */
export const useInfiniteOptimizeOrderApi = (params = {}) => {
  const { param, pageSize } = params
  const { taskId, startTime, endTime, problemCategoryId, clusterId } = param
  return useInfiniteQuery(
    [
      QUERY_KEYS.FLYWHEEL_DASHBOARD_OPTIMIZATION_ORDERS,
      startTime,
      endTime,
      taskId,
      problemCategoryId,
      clusterId
    ],
    ({ pageParam = 1 }) => fetchRelatedOptimizeOrder({ param, pageNum: pageParam, pageSize }),
    {
      getNextPageParam: (lastPage, pages) => {
        if (lastPage.value.length < pageSize) {
          return undefined // 没有更多数据了
        }
        return pages.length + 1 // 返回下一页的页码
      },
      enabled: !!taskId && !!startTime && !!endTime && !!problemCategoryId && !!clusterId
    }
  )
}

/**
 * @description: 批量获取多个问题的集群列表
 * @param {Array} categories - 问题分类数组
 * @param {Object} baseParams - 基础参数对象
 * @return {*}
 */
export const useBatchClustersApi = (categories = [], baseParams = {}) => {
  const { taskId, botNo, startTime, endTime } = baseParams

  return useQueries({
    queries: categories.map((category) => ({
      queryKey: [
        QUERY_KEYS.FLYWHEEL_DASHBOARD_CLUSTERS,
        category.value,
        taskId,
        botNo,
        startTime,
        endTime
      ],
      queryFn: async () => {
        const result = await fetchClusters({
          problemCategoryId: category.value,
          taskId,
          botNo,
          startTime,
          endTime
        })
        return result?.value
      },
      enabled: !!taskId && !!botNo && !!startTime && !!endTime
    }))
  })
}

/**
 * @description: 查询某集群的优化任务状态
 * @param {Object} params - 请求参数
 * @return {*}
 */
export const useClusterOptimizeTaskApi = (params = {}) => {
  return useMutation(fetchOptimizationTask)
}

/**
 * @description: 查询某集群的匹配案例
 * @param {Object} params - 请求参数
 * @return {*}
 */
export const useClusterMatchTaskApi = (params = {}) => {
  return useMutation(fetchClusterMatchCase)
}

/**
 * @description: 生成某集群的优化建议
 * @param {Object} params - 请求参数
 * @return {*}
 */
export const useGenerateSuggestionApi = () => {
  return useMutation(generateOptimization)
}

/**
 * @description: 查询某集群的优化建议
 * @param {Object} params - 请求参数
 * @return {*}
 */
export const useQuerySuggestionApi = () => {
  return useMutation(fetchOptimization)
}

/**
 * @description: 更新某集群的采纳状态
 * @param {Object} params - 请求参数
 * @return {*}
 */
export const useUpdateSuggestionApi = () => {
  return useMutation(updateOptimization)
}

/**
 * @description: 分页获取聊天记录
 * @param {Object} params - 请求参数
 * @return {*}
 */
export const useInfiniteQueryChatRecordApi = (params = {}) => {
  const { taskId, secondaryCategoryId, pageSize } = params
  return useInfiniteQuery(
    [QUERY_KEYS.FLYWHEEL_CHAT_RECORD, taskId, secondaryCategoryId],
    ({ pageParam = 1 }) =>
      queryChatRecord({
        taskId,
        secondaryCategoryId,
        pageNum: pageParam,
        pageSize
      }),
    {
      getNextPageParam: (lastPage, pages) => {
        if (lastPage?.value?.records?.length < pageSize) {
          return undefined // 没有更多数据了
        }
        return pages.length + 1 // 返回下一页的页码
      },
      enabled: !!taskId && !!secondaryCategoryId
    }
  )
}

//-------场景与任务配置-------

/**
 * @description: 获取场景名称+场景描述
 * @return {*}
 */
export const useScenarioInfoApi = (taskId) => {
  return useQuery([QUERY_KEYS.FLYWHEEL_SCENARIO_INFO, taskId], () => getScenerioInfo(taskId), {
    enabled: !!taskId
  })
}

/**
 * @description: 获取数据源枚举
 * @return {*}
 */
export const useDataSourceSelectApi = (params) => {
  const { taskId } = params
  return useQuery(
    [QUERY_KEYS.FLYWHEEL_DATASOURCE_SELECT, taskId],
    () => getDataSourceSelect({ taskId }),
    {
      enabled: !!taskId
    }
  )
}

/**
 * @description: 获取数据源值
 * @return {*}
 */
export const useDataSourceApi = (params) => {
  const { taskId } = params
  return useQuery([QUERY_KEYS.FLYWHEEL_DATASOURCE, taskId], () => getDataSource({ taskId }), {
    enabled: !!taskId
  })
}

/**
 * @description: 获取阶段
 * @return {*}
 */
export const useStageApi = (params) => {
  const { taskId } = params
  return useQuery([QUERY_KEYS.FLYWHEEL_STAGE, taskId], () => getStage({ taskId }), {
    enabled: !!taskId
  })
}

/**
 * @description: 获取子任务ID
 * @return {*}
 */
export const useSubtasksApi = (params) => {
  const { taskId: sourceTaskId } = params
  return useQuery(
    [QUERY_KEYS.FLYWHEEL_SUBTASKS, sourceTaskId],
    () => getSubtasks({ sourceTaskId }),
    {
      enabled: !!sourceTaskId
    }
  )
}

/**
 * @description: 获取分类
 * @return {*}
 */
export const useCategoryApi = (params) => {
  const { subTaskId: taskId } = params
  return useQuery([QUERY_KEYS.FLYWHEEL_CATEGORY, taskId], () => getCategory({ taskId }), {
    enabled: !!taskId
  })
}

/**
 * @description: 获取prompt
 * @return {*}
 */
export const usePromptApi = (params) => {
  const { subTaskId: taskId } = params
  return useQuery([QUERY_KEYS.FLYWHEEL_PROMPT, taskId], () => getPrompt({ taskId }), {
    enabled: !!taskId
  })
}

/**
 * @description: 保存所有配置
 * @return {*}
 */
export const useSaveAllSettingsApi = () => {
  return useMutation(saveAllSettings)
}

/**
 * @description: 查询某个taskId是否有配置数据源
 * @return {*}
 */
export const studyConfigResultApi = (params) => {
  const { taskId } = params
  return useQuery(
    [QUERY_KEYS.FLYWHEEL_CONFIG_RESULT, taskId],
    () => studyConfigResult({ taskId }),
    {
      enabled: !!taskId
    }
  )
}

// -------业务全景概览-------
/**
 * @description: 获取仪表盘摘要信息
 * @param {Object} params - 请求参数
 * @return {*}
 */
export const useStageAlysisApi = (params = {}) => {
  const { taskId, startTime, endTime } = params
  return useQuery(
    [QUERY_KEYS.FLYWHEEL_DASHBOARD_STAGEANALYSIS, params],
    () => featchStageAlysis(params),
    {
      enabled: !!taskId && !!startTime && !!endTime
    }
  )
}

/**
 * @description: 获取数据积累进度
 * @param {Object} params - 请求参数
 * @return {*}
 */
export const useDataAccumulationProgressApi = (params = {}, options = {}) => {
  const { taskId } = params
  return useQuery(
    [QUERY_KEYS.FLYWHEEL_DASHBOARD_DATAACCUMULATION, taskId],
    () => fetchDataAccumulationProgress(params),
    {
      enabled: !!taskId,
      ...options
    }
  )
}

/**
 * @description: 获取步骤链
 * @param {Object} params - 请求参数
 * @return {*}
 */
export const useStepChainApi = (params = {}, options = {}) => {
  const { taskId } = params

  return useQuery(
    [QUERY_KEYS.FLYWHEEL_DASHBOARD_STEPCHAIN, taskId],
    () => fetchStepChain({ taskId }),
    {
      enabled: !!taskId,
      ...options
    }
  )
}
