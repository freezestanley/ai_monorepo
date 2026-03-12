/*
 * @Author: Dyton
 * @Date: 2024-03-16 15:40:30
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-04-19 11:35:43
 * @FilePath: /za-aigc-platform-admin-static/src/api/knowledgeExtractor/index.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  fetchExtractorList,
  fetchTaskOptions,
  fetchExtraSkills,
  fetchSaveTask,
  fetchTaskList,
  fetchTaskDetails,
  fetchDisabledTask,
  fetchExtractionInstanceList,
  fetchExtractionInstanceDetail,
  fetchKnowledgeClass,
  fetchAdoptionFaq,
  fetchAdoptionStructureData,
  fetchAddSimilarityQuestion,
  fetchShelveFaq,
  fetchShelvesSructure,
  fetchFaqByQuestionForSolution,
  fetchOperateCancel,
  fetchAllInstance
} from "./api"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { message } from "antd"
import { mutationCallback } from "../tools"

// 知识萃取-首页列表
export const useExtractorListApi = ({ ...params }) => {
  return useQuery([QUERY_KEYS.EXTRACTOR_LIST, params], () => {
    return fetchExtractorList({ ...params })
  })
}

// 知识萃取-筛选-任务查询
export const useTaskOptionsApi = ({ ...params }) => {
  return useQuery([QUERY_KEYS.EXTRACTOR_OPTIONS], () => fetchTaskOptions({ ...params }))
}
/**
 * @description: 知识萃取-萃取工作流列表
 * @param {*} botNo
 * @return {*}
 */
export const useExtraSkillsApi = (botNo) => {
  return useQuery([QUERY_KEYS.SKILL_TOTAL, botNo], () => fetchExtraSkills(botNo), {
    enabled: !!botNo
  })
}

/**
 * @description: 萃取任务列表
 * @return {*}
 */
export const useTaskListApi = ({ ...params }) => {
  return useQuery([QUERY_KEYS.TASK_LIST, params], () => fetchTaskList({ ...params }))
}

/**
 * @description: 创建萃取任务
 * @return {*}
 */
export const useSaveTaskApi = () => {
  const queryClient = useQueryClient()
  return useMutation(fetchSaveTask, {
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.TASK_LIST])
    }
  })
}
/**
 * @description: 任务停用/删除
 * @return {*}
 */
export const useDisabledTaskApi = () => {
  const queryClient = useQueryClient()
  return useMutation(fetchDisabledTask, {
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.TASK_LIST])
    }
  })
}
/**
 * @description: 萃取任务详情
 * @param {*} taskCode
 * @return {*}
 */
export const useTaskDetailsApi = (taskCode) => {
  return useQuery([QUERY_KEYS.TASK_DETAIL, taskCode], () => fetchTaskDetails(taskCode), {
    enabled: !!taskCode
  })
}
/**
 * @description: 目标问答知识库
 * @return {*}
 */
export const useKnowledgeClassApi = (params) => {
  return useQuery([QUERY_KEYS.KNOWLEDGECLASS], () => fetchKnowledgeClass(params), {
    enabled: !!params?.knowledgeBaseNo
  })
}

/**
 * @description: 萃取实例列表
 * @param {array} params
 * @return {*}
 */
export const useExtractionInstanceListApi = ({ ...params }) => {
  return useQuery([QUERY_KEYS.EXTRACTOR_LIST, params], () => {
    return fetchExtractionInstanceList({ ...params })
  })
}
/**
 * @description: 萃取实例详情
 * @return {*}
 */
export const useExtractionInstanceDetailApi = (instanceId) => {
  return useQuery([QUERY_KEYS.EXTRACTOR_DETAIL, instanceId], () => {
    return fetchExtractionInstanceDetail(instanceId)
  })
}

/**
 * @description: 萃取实例列表
 * @return {*}
 */
export const useAllExtractionInstanceApi = (instanceId) => {
  return useQuery([QUERY_KEYS.ALL_INSTANCE, instanceId], () => {
    return fetchAllInstance(instanceId)
  })
}

/**
 * @description: FAQ-根据问题，查询FAQ
 * @return {*}
 */
export const useSameQuestionsForSolutionApi = (knowledgeBaseNo, { ...parmas }, optimizeType) => {
  return useQuery(
    [QUERY_KEYS.SAME_QUESTIONS_FOR_SOLUTIONS, knowledgeBaseNo, { ...parmas }],
    () => {
      return fetchFaqByQuestionForSolution(knowledgeBaseNo, { ...parmas })
    },
    {
      enabled: optimizeType !== "2"
    }
  )
}

/**
 * @description: 采纳-新增问答
 * @return {*}
 */
export const useAdoptionFaqApi = (cb) => useMutation(fetchAdoptionFaq, { ...mutationCallback(cb) })
/**
 * @description:采纳- 新增结构化数据
 * @return {*}
 */
export const useAdoptionDataApi = (cb) =>
  useMutation(fetchAdoptionStructureData, { ...mutationCallback(cb) })
/**
 * @description: 新增相似问
 * @return {*}
 */
export const useAddSimilarityApi = (cb) =>
  useMutation(fetchAddSimilarityQuestion, { ...mutationCallback(cb) })

/**
 * @description: 问答知识搁置
 * @return {*}
 */
export const useShelveFaqApi = (cb) => useMutation(fetchShelveFaq, { ...mutationCallback(cb) })
/**
 * @description: 结构化数据搁置
 * @return {*}
 */
export const useShelvesSructureApi = (cb) =>
  useMutation(fetchShelvesSructure, { ...mutationCallback(cb) })

/**
 * @description: 取消相似问，取消采纳，取消搁置
 * @return {*}
 */
export const useOperateCancelApi = (cb) =>
  useMutation(fetchOperateCancel, { ...mutationCallback(cb) })
