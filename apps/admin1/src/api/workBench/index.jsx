import { useQuery, useMutation } from "@tanstack/react-query"
import { fetchAllWorkbenches, bindBotToWorkbench, fetchBots, fetchTTSAudioFormat } from "./api"
import { QUERY_KEYS } from "@/constants/queryKeys"

// 获取全部的工作台
export const useFetchAllWorkbenches = (params) => {
  return useQuery([QUERY_KEYS.WORKBENCH_FETCH_ALL], () => fetchAllWorkbenches(params))
}

// 工作台绑定新的空间
export const useBindBotToWorkbench = () => {
  return useMutation([QUERY_KEYS.WORKBENCH_BIND_BOT], bindBotToWorkbench)
}

// 查询空间
export const useFetchBots = () => {
  return useQuery([QUERY_KEYS.WORKBENCH_FETCH_BOTS], fetchBots)
}

export const useFetchTTSAudioFormat = () => {
  return useQuery([QUERY_KEYS.WORKBENCH_FETCH_BOTS], fetchTTSAudioFormat)
}
