/*
 * @Author: System
 * @Date: 2025-01-15 00:00:00
 * @Descripttion: 数据飞轮相关API
 * @LastEditors: System
 * @LastEditTime: 2025-01-15 00:00:00
 * @FilePath: /za-aigc-platform-admin-static/src/api/flywheel/api.jsx
 * Copyright (c) 2025 by ZA-智能中台, All Rights Reserved.
 */
import { Get, Post, Put, Delete } from "@/api/server"
import { infoInterceptors } from "../tools"
import { infoInterceptorsLow } from "./tools"
import { flywheelPrefix } from "@/constants"

const prefix = flywheelPrefix

/**
 * @description: 获取任务列表
 */
export const fetchTasks = (params = {}) => {
  return Post(`${prefix}/api/tasks`, params).then((res) => infoInterceptors(res))
}

/**
 * @description: 获取数据概览
 */
export const fetchDashboardSummary = (params = {}) => {
  return Post(`${prefix}/api/dashboard/summary`, params).then((res) => infoInterceptors(res))
}

/**
 * @description: 获取问题分类列表
 */
export const fetchProblemCategories = (params = {}) => {
  return Post(`${prefix}/api/dashboard/problem-categories`, params).then((res) =>
    infoInterceptors(res)
  )
}

/**
 * @description: 获取某问题的集群列表
 */
export const fetchClusters = (params = {}) => {
  const { problemCategoryId = "", ...rest } = params
  return Post(
    `${prefix}/api/dashboard/problem-categories/${problemCategoryId}/clusters`,
    rest
  ).then((res) => infoInterceptors(res))
}

/**
 * @description: 获取某集群的问题概览
 */
export const fetchClusterTrend = (params = {}) => {
  const { problemCategoryId = "", clusterId = "", ...rest } = params
  return Post(
    `${prefix}/api/dashboard/problem-categories/${problemCategoryId}/clusters/${clusterId}/trend`,
    rest
  ).then((res) => infoInterceptors(res))
}

/**
 * @description: 获取某集群的关联优化单
 */
export const fetchRelatedOptimizeOrder = (params = {}) => {
  return Post(`${prefix}/api/dashboard/optimization-orders`, params).then((res) =>
    infoInterceptors(res)
  )
}

/**
 * @description: 查询某个集群的优化任务状态
 */
export const fetchOptimizationTask = (params = {}) => {
  return Post(`${prefix}/api/optimization-suggestion/queryTask`, params).then((res) =>
    infoInterceptors(res)
  )
}

/**
 * @description: 查询某个集群的匹配案例
 */
export const fetchClusterMatchCase = (params = {}) => {
  return Post(`${prefix}/api/optimization-suggestion/matchCase`, params).then((res) =>
    infoInterceptors(res)
  )
}

/**
 * @description: 生成某个集群的优化建议
 */
export const generateOptimization = (params = {}) => {
  return Post(`${prefix}/api/optimization-suggestion/generate`, params).then((res) =>
    infoInterceptors(res)
  )
}

/**
 * @description:查询某个集群的优化建议
 */
export const fetchOptimization = (params = {}) => {
  return Post(`${prefix}/api/optimization-suggestion/querySuggestion`, params).then((res) =>
    infoInterceptors(res)
  )
}

/**
 * @description:更新某集群的建议的采纳状态
 */
export const updateOptimization = (params = {}) => {
  return Post(`${prefix}/api/optimization-suggestion/updateStatus`, params).then((res) =>
    infoInterceptors(res)
  )
}

/**
 * @description:分页查询聊天记录
 */
export const queryChatRecord = (params = {}) => {
  return Post(`${prefix}/api/optimization-suggestion/queryChatRecord`, params).then((res) =>
    infoInterceptors(res)
  )
}

//--------场景与任务配置--------
/**
 * @description:获取场景名称+场景描述
 */
export const getScenerioInfo = (taskId) => {
  return Get(`${prefix}/api/tasks/${taskId}`).then((res) => infoInterceptors(res))
}

/**
 * @description:获取数据源下拉枚举
 */
export const getDataSourceSelect = (params = {}) => {
  return Post(`${prefix}/api/tasks/config/data-sources/select`, params).then((res) =>
    infoInterceptors(res)
  )
}

/**
 * @description:获取数据源值
 */
export const getDataSource = (params = {}) => {
  return Post(`${prefix}/api/tasks/data-sources/query`, params).then((res) => infoInterceptors(res))
}

/**
 * @description:获取阶段
 */
export const getStage = (params = {}) => {
  return Post(`${prefix}/api/category/primary/query`, params).then((res) => infoInterceptors(res))
}

/**
 * @description:获取子任务taskId
 */
export const getSubtasks = (params = {}) => {
  return Post(`${prefix}/api/tasks/subtasks`, params).then((res) => infoInterceptors(res))
}

/**
 * @description:获取分类
 */
export const getCategory = (params = {}) => {
  return Post(`${prefix}/api/category/secondary-with-primary/query`, params).then((res) =>
    infoInterceptors(res)
  )
}

/**
 * @description:获取提示词
 */
export const getPrompt = (params = {}) => {
  return Post(`${prefix}/api/tasks/config/agent-sop/query`, params).then((res) =>
    infoInterceptors(res)
  )
}

/**
 * @description:保存全部配置
 */
export const saveAllSettings = (params = {}) => {
  return Post(`${prefix}/api/tasks/config/storage`, params).then((res) => infoInterceptorsLow(res))
}

/**
 * @description:查询某个taskId是否有配置数据源
 */
export const studyConfigResult = (params = {}) => {
  return Post(`${prefix}/api/tasks/data-sources/study-config-result`, params).then((res) =>
    infoInterceptors(res)
  )
}

// --------业务全景概览（部分），其他部分待重写迁移--------
/**
 * 业务阶段流失分析
 */
export const featchStageAlysis = (params = {}) => {
  return Post(`${prefix}/api/total-business/stage-analysis`, params).then((res) =>
    infoInterceptors(res)
  )
}

/**
 * 数据积累进度查询接口文档
 */
export const fetchDataAccumulationProgress = (params = {}) => {
  return Post(`${prefix}/api/tasks/data-accumulation/progress`, params).then((res) =>
    infoInterceptors(res)
  )
}

/**
 * 数据积累进度查询接口文档
 */
export const fetchStepChain = (params = {}) => {
  return Post(`${prefix}/api/tasks/step-chain/query`, params).then((res) => infoInterceptors(res))
}
