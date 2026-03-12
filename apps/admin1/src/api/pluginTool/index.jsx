import { useQuery, useMutation, useQueryClient, QueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"
import {
  fetchToolList,
  fetchToolInfo,
  fetchPluginInfo,
  saveTool,
  saveInputVariables,
  saveOutputVariables,
  debugTool,
  fetchAvailablePluginTools,
  fetchMcpToolList
} from "./api"
/**
 * 拉取插件工具信息
 * @param {*} params
 * @returns
 */
export const useFetchToolInfo = (params) => {
  return useQuery([QUERY_KEYS.PLUGIN_TOOL_INFO, params], () => fetchToolInfo(params), {
    enabled: !!params.pluginNo && !!params.toolNo
  })
}

/**
 * 获取插件信息
 * fetchPluginInfo
 */
export const useFetchPluginInfo = (params) => {
  return useQuery([QUERY_KEYS.PLUGIN_INFO], () => fetchPluginInfo(params), {
    enabled: !!params.pluginNo
  })
}

/**
 * 拉取插件工具列表
 * @param {*} params
 * @returns
 */
export const useFetchToolList = (params) => {
  return useQuery([QUERY_KEYS.PLUGIN_TOOL_LIST, params], () => fetchToolList(params))
}

/**
 * 保存插件工具信息
 */
export const useSaveTool = () => {
  return useMutation(saveTool)
}

/**
 * 保存输入变量
 */
export const useSaveInputVariables = () => {
  const queryClient = useQueryClient()
  return useMutation(saveInputVariables, {
    onSuccess: (d) => {
      queryClient.invalidateQueries([QUERY_KEYS.PLUGIN_TOOL_INFO])
    },
    onError: (e) => {}
  })
}

/**
 * 保存输出变量
 */
export const useSaveOutputVariables = () => {
  const queryClient = useQueryClient()
  return useMutation(saveOutputVariables, {
    onSuccess: (d) => {
      queryClient.invalidateQueries([QUERY_KEYS.PLUGIN_TOOL_INFO])
    },
    onError: (e) => {}
  })
}

/**
 * 调试工具
 */
export const useDebugTool = () => {
  const queryClient = useQueryClient()
  return useMutation(debugTool, {
    onSuccess: (d) => {
      queryClient.invalidateQueries([QUERY_KEYS.PLUGIN_TOOL_INFO])
    },
    onError: (e) => {}
  })
}

/**
 * 获取可用插件工具
 */
export const useFetchAvailablePluginTools = (params) => {
  return useQuery(
    [QUERY_KEYS.AVAILABLE_PLUGIN_TOOLS, params],
    () => fetchAvailablePluginTools(params),
    {
      enabled: !!params.botNo
    }
  )
}

/**
 * 获取可用的MCP工具列表
 */
export const useFetchMcpToolList = (params) => {
  return useQuery([QUERY_KEYS.MCP_TOOL_LIST, params], () => fetchMcpToolList(params))
}
