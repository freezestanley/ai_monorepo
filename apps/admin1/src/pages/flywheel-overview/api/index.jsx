import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { totalbusine, problemdistribution, problemclusters, lossratetrend } from "./api"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { message } from "antd"

export default {
  totalbusine,
  problemdistribution,
  problemclusters,
  lossratetrend
}

// 格式化时间为 yyyy-MM-dd HH:mm:ss 格式
const formatDateTime = (date) => {
  if (!date) return ""

  const d = new Date(date)
  if (isNaN(d.getTime())) return ""

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const hours = String(d.getHours()).padStart(2, "0")
  const minutes = String(d.getMinutes()).padStart(2, "0")
  const seconds = String(d.getSeconds()).padStart(2, "0")

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}
// 格式化时间范围对象
const formatTimeRange = (formValues) => {
  return {
    startTime: formatDateTime(formValues?.startTime),
    endTime: formatDateTime(formValues?.endTime)
  }
}

/**
 * @description: 获取业务全局概览
 */
export const useTotalbussiness = (params = {}) => {
  const { selectedTask, formValues } = params
  const fd = formatTimeRange(formValues)

  return useQuery(
    [QUERY_KEYS.FLYWHEEL_DASHBOARD_TOTALBUSINE, selectedTask, fd.startTime, fd.endTime],
    () =>
      totalbusine({
        startTime: fd.startTime,
        endTime: fd.endTime,
        taskId: selectedTask
      }),
    {
      enabled: !!selectedTask,
      select: (data) => data?.value || {}
    }
  )
}

/**
 * @description: 获取阶段问题分布
 */
export const useProblemdistribution = (params = {}) => {
  const { chartViewMode, entryTaskId, loseTaskId, formValues, selectedCardId } = params
  const selectedTaskId = chartViewMode === "problem" ? entryTaskId : loseTaskId
  const fd = formatTimeRange(formValues)

  return useQuery(
    [
      QUERY_KEYS.FLYWHEEL_PROBLEM_DISTRIBUTION,
      selectedTaskId,
      selectedCardId,
      fd.startTime,
      fd.endTime
    ],
    () =>
      problemdistribution({
        startTime: fd.startTime,
        endTime: fd.endTime,
        taskId: selectedTaskId,
        stageId: selectedCardId
      }),
    {
      enabled: !!selectedTaskId && !!selectedCardId,
      select: (data) => data?.value?.items || []
    }
  )
}

/**
 * @description: 获取阶段问题集群/流失原因集群
 */
export const useProblemclusters = (params = {}) => {
  const { chartViewMode, entryTaskId, loseTaskId, startTime, endTime, selectedCardId } = params
  const selectedTaskId = chartViewMode === "problem" ? entryTaskId : loseTaskId

  return useQuery(
    [QUERY_KEYS.FLYWHEEL_PROBLEM_CLUSTERS, selectedTaskId, selectedCardId, startTime, endTime],
    () =>
      problemclusters({
        startTime,
        endTime,
        taskId: selectedTaskId,
        stageId: selectedCardId
      }),
    {
      enabled: !!selectedTaskId && !!selectedCardId
    }
  )
}

/**
 * @description: 获取流失率趋势
 */
export const useLossratetrend = (params = {}) => {
  const { chartViewMode, entryTaskId, loseTaskId, formValues, selectedCardId } = params
  const selectedTaskId = chartViewMode === "problem" ? entryTaskId : loseTaskId
  const fd = formatTimeRange(formValues)

  return useQuery(
    [QUERY_KEYS.FLYWHEEL_LOSS_RATE_TREND, selectedTaskId, selectedCardId, fd.startTime, fd.endTime],
    () =>
      lossratetrend({
        startTime: fd.startTime,
        endTime: fd.endTime,
        taskId: selectedTaskId,
        stageId: selectedCardId
      }),
    {
      enabled: !!selectedTaskId && !!selectedCardId,
      select: (data) => data?.value?.items || []
    }
  )
}
