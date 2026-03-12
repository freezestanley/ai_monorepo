/*
 * @Author: Dyton
 * @Date: 2024-03-16 15:40:30
 * @Descripttion:知识萃取 2.0
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-04-26 17:20:01
 * @FilePath: /za-aigc-platform-admin-static/src/api/knowledgeExtraction/api.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import { Get, Post } from "@/api/server"
import { DEFAULTNAMESPACE, botPrefix, knowledgePrefix, knowledgeExtractorPrefix } from "@/constants"
import { message } from "antd"
import { downloadFileWithHeaders } from "../tools"

/**
 * @description: 数据异常提醒拦截器
 * @param {*} res
 * @return {*}
 */
const interceptors = (res) => {
  if (res?.code != "200") res?.message && message.warning(res?.message)
  return res
}

// 知识萃取 - 首页列表
export const fetchExtractorList = (params) => {
  return Post(`${knowledgeExtractorPrefix}/admin/${params.botNo}/extractTask/listByPage`, {
    ...params
  }).then((res) => interceptors(res)?.data)
}

// 知识萃取 - 任务类型列表
export const fetchTaskTypeList = (params) => {
  return Post(`${knowledgeExtractorPrefix}/admin/${params.botNo}/extractTask/taskTypeList`, {
    ...params
  }).then((res) => interceptors(res)?.data)
}

// 知识萃取 - 新增任务
export const fetchAddTaskType = (params) => {
  return Post(`${knowledgeExtractorPrefix}/admin/taskType/add`, {
    ...params
  }).then((res) => interceptors(res))
}

// 知识萃取 - 删除任务
export const fetchDeleteTaskType = (params) => {
  return Get(`${knowledgeExtractorPrefix}/admin/taskType/delete/${params.taskType}`).then((res) =>
    interceptors(res)
  )
}

// 知识萃取 - 修改任务类型描述
export const fetchUpdateTaskTypeDesc = (params) => {
  return Get(
    `${knowledgeExtractorPrefix}/admin/taskType/updateDesc/${params.taskType}/${params.desc}`
  ).then((res) => interceptors(res))
}

// 知识萃取 - 查询可使用的工作流列表
export const fetchTaskTypeListSkill = (params) => {
  return Get(`${knowledgeExtractorPrefix}/admin/taskType/${params.botNo}/listSkill`).then(
    (res) => interceptors(res)?.data
  )
}

// 知识萃取 - 任务类型名称校验
export const fetchCheckTaskTypeDesc = (params) => {
  return Get(`${knowledgeExtractorPrefix}/admin/taskType/checkDesc/${params.desc}`).then((res) =>
    interceptors(res)
  )
}

// 知识萃取 - 萃取任务详情
export const fetchExtractTaskDetail = (params) => {
  return Get(
    `${knowledgeExtractorPrefix}/admin/${params.botNo}/extractTask/detail/${params.batchCode}`,
    {
      ...params
    }
  ).then((res) => interceptors(res)?.data)
}

// 知识萃取 - 萃取任务设置
export const fetchSaveExtractTask = (params) => {
  return Post(`${knowledgeExtractorPrefix}/admin/${params.botNo}/extractTask/save`, {
    ...params
  }).then((res) => res)
}

// 知识萃取 - 批次号校验
export const fetchBatchNoValid = (params) => {
  return Post(
    `${knowledgeExtractorPrefix}/admin/${params.botNo}/${params.taskType}/${params.batchNo}/batchNoValid`,
    {
      ...params
    }
  ).then((res) => res)
}

// 知识萃取 - 任务名称校验
export const fetchTaskNameValid = (params) => {
  return Post(
    `${knowledgeExtractorPrefix}/admin/${params.botNo}/${params.taskName}/taskNameValid`,
    {
      ...params
    }
  ).then((res) => res)
}

// 知识萃取 - 任务跳转参数
export const jumpExtractTaskParams = (params) => {
  return Get(
    `${knowledgeExtractorPrefix}/admin/${params.botNo}/extractTask/jumpParams/${params.batchCode}`,
    {
      ...params
    }
  ).then((res) => interceptors(res))
}

// 知识萃取-打标任务详情下载
export const fetchMarkResultExport = (batchNo, batchCode) => {
  return downloadFileWithHeaders(
    `${knowledgeExtractorPrefix}/openapi/markResult/export/${batchNo}`,
    `${batchCode}.xlsx`
  )
}
