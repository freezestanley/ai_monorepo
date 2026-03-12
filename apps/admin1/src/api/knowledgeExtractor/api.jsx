/*
 * @Author: Dyton
 * @Date: 2024-03-16 15:40:30
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-04-19 11:34:32
 * @FilePath: /za-aigc-platform-admin-static/src/api/knowledgeExtractor/api.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import { Get, Post } from "@/api/server"
import { DEFAULTNAMESPACE, botPrefix, knowledgePrefix, knowledgeExtractorPrefix } from "@/constants"
import { infoInterceptors } from "../tools"

// 萃取批次列表查询
export const fetchExtractorList = (params) => {
  return Post(`${knowledgeExtractorPrefix}/admin/extractionBatch/listByPage`, {
    ...params
  }).then((res) => infoInterceptors(res)?.data)
}

// 萃取实例 列表查询
export const fetchExtractionInstanceList = (params) => {
  return Post(`${knowledgeExtractorPrefix}/admin/extractionInstance/listByPage`, {
    ...params
  }).then((res) => infoInterceptors(res)?.data)
}

// 萃取实例 详情
export const fetchExtractionInstanceDetail = (instanceId) => {
  return Get(`${knowledgeExtractorPrefix}/admin/extractionInstance/${instanceId}/details`).then(
    (res) => infoInterceptors(res)?.data
  )
}

// 萃取批次列表-筛选-任务查询
export const fetchTaskOptions = (params) => {
  return Post(`${knowledgeExtractorPrefix}/admin/task/list`, {
    ...params
  }).then((res) => {
    return (res?.data ?? []).map((v) => ({
      value: v?.taskName,
      text: v?.taskName
    }))
  })
}

/**
 * @description: 萃取工作流列表
 * @return {*}
 */
export const fetchExtraSkills = (botNo) => {
  return Get(`${botPrefix}/openapi/bot/skill/list?botNo=${botNo}`).then((res) =>
    infoInterceptors(res)
  )
}
/**
 * @description: 目标问答知识库
 * @return {*}
 */
export const fetchKnowledgeClass = (params) => {
  return Post(`${knowledgePrefix}/admin/knowledge/list`, {
    ...params,
    namespace: DEFAULTNAMESPACE
  }).then((res) => {
    const catalogsTreeList = res.data?.[0]?.catalogsTreeList?.[0]?.children ?? []
    return catalogsTreeList
  })
}

// 任务保存
export const fetchSaveTask = (params) => {
  return Post(`${knowledgeExtractorPrefix}/admin/task/save`, {
    ...params
  }).then((res) => res)
}
// 任务停用/删除
export const fetchDisabledTask = (taskCode) => {
  return Get(`${knowledgeExtractorPrefix}/admin/task/${taskCode}/disable`).then((res) =>
    infoInterceptors(res)
  )
}
// 任务列表
export const fetchTaskList = (params) => {
  return Post(`${knowledgeExtractorPrefix}/admin/task/listByPage`, {
    ...params
  }).then((res) => infoInterceptors(res)?.data)
}
// 任务详情
export const fetchTaskDetails = (taskCode) => {
  return Get(`${knowledgeExtractorPrefix}/admin/task/${taskCode}/details`).then(
    (res) => infoInterceptors(res)?.data
  )
}
// 任务上传
export const fetchUploadTask = ({ taskCode }) => {
  return `${knowledgeExtractorPrefix}/admin/extractionBatch/batchImport-special?taskCode=${taskCode}`
}

// 萃取实例列表查询 用于上一页下一页
export const fetchAllInstance = (batchCode) => {
  return Post(`${knowledgeExtractorPrefix}/admin/extractionInstance/${batchCode}/list`, {}).then(
    (res) => infoInterceptors(res)?.data
  )
}

// FAQ-根据问题，查询FAQ
export const fetchFaqByQuestionForSolution = (knowledgeBaseNo, { ...params }) => {
  return Post(
    `${knowledgePrefix}/admin/knowledge/${knowledgeBaseNo}/searchFaqByQuestionForSolution`,
    { ...params }
  ).then((res) => infoInterceptors(res)?.data)
}

// 新增相似问
export const fetchAddSimilarityQuestion = ({
  instanceId, //实例编号
  knowledgeBaseNo, //知识库编号
  catalogNo, //目录编号
  faqNo, //faq编号
  similarityQuestion, //相似问 array[string]
  dataId
}) => {
  return Post(
    `${knowledgeExtractorPrefix}/admin/extractionInstance/${instanceId}/${knowledgeBaseNo}/${catalogNo}/${faqNo}/addSimilarityQuestion`,
    {
      similarityQuestion,
      dataId
    }
  ).then((res) => res)
}

// 新增结构化数据
export const fetchAdoptionStructureData = ({
  instanceId, //实例编号
  knowledgeBaseNo, //知识库编号
  catalogNo, //目录编号
  structureNo, //结构化数据编号
  structureId, //结构化数据id
  data //结构化数据,key是字段名，value是值
}) => {
  return Post(
    `${knowledgeExtractorPrefix}/admin/extractionInstance/${instanceId}/${knowledgeBaseNo}/${catalogNo}/${structureNo}/addStructureData`,
    {
      structureId,
      data
    }
  ).then((res) => res)
}

//新增问答
export const fetchAdoptionFaq = ({
  faqId,
  question, //问题
  answer, //答案
  similarityQuestion, //相似问 array[string]
  instanceId, //实例编号
  knowledgeBaseNo, //知识库编号
  catalogNo, //目录编号
  structureNo, //结构化数据编号
  data //结构化数据,key是字段名，value是值
}) => {
  return Post(
    `${knowledgeExtractorPrefix}/admin/extractionInstance/${instanceId}/${knowledgeBaseNo}/${catalogNo}/addFaq`,
    {
      ...{
        faqId,
        question,
        answer,
        similarityQuestion,
        structureNo,
        data
      }
    }
  ).then((res) => res)
}

//问答知识搁置
export const fetchShelveFaq = ({
  faqId,
  instanceId //实例编号
}) => {
  return Post(
    `${knowledgeExtractorPrefix}/admin/extractionInstance/${instanceId}/${faqId}/faq/shelve`,
    {}
  ).then((res) => res)
}

//结构化数据搁置
export const fetchShelvesSructure = ({
  structureId, //结构化数据id
  instanceId //实例编号
}) => {
  return Post(
    `${knowledgeExtractorPrefix}/admin/extractionInstance/${instanceId}/${structureId}/structure/shelve`,
    {}
  ).then((res) => res)
}

//取消搁置，取消采纳，取消相似问
export const fetchOperateCancel = ({
  knowledgeBaseNo, //
  dataId, //
  instanceId //
}) => {
  return Get(
    `${knowledgeExtractorPrefix}/admin/extractionInstance/${instanceId}/${knowledgeBaseNo}/${dataId}/operateCancel`
  ).then((res) => res)
}
