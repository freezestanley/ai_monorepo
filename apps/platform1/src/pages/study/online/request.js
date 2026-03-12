import { Delete, Get, Post, Put } from "@/api/server"
import { botPrefix } from "@/constants"
import { mockStudyTaskList, mockTaskDetail } from "./mock"

// 使用mock数据
export const getStudyTaskList = (params) => {
  return Post(`${botPrefix}/admin/${params.botNo}/optimizationTask/listByPage`, params)
}

export const saveStudyTask = (botNo, params) => {
  return Post(`${botPrefix}/admin/${botNo}/optimizationTask/save`, params)
}

export const deleteStudyTask = (botNo, taskNo) => {
  return Delete(`${botPrefix}/admin/${botNo}/optimizationTask/delete/${taskNo}`)
}

export const updateStudyTaskStatus = (botNo, taskNo, status) => {
  return Put(`${botPrefix}/admin/${botNo}/optimizationTask/changeStatus/${taskNo}/${status}`)
}

export const getStudyTaskDetail = (botNo, taskNo) => {
  return Get(`${botPrefix}/admin/${botNo}/optimizationTask/details/${taskNo}`)
}
