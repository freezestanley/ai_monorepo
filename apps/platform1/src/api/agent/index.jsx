import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  updateAgent,
  updateAgentNew,
  deleteAgent,
  createAgent,
  saveAgentVersion,
  fetchAgentListByPage,
  releaseAgent,
  releaseAgentPro,
  fetchAgentVersionList,
  fetchAgentVersion,
  copyAgentVersionNo,
  fetchAgentListForReleased,
  deleteAgentVersion,
  enableAgentVersion,
  fetchAgentList,
  addAgent,
  fetchLatestDebugSession,
  fetchSessionMessages,
  deleteAgentByNo,
  copyAgent,
  fetchDebugSessions,
  fetchDebugExecuteProcess,
  changeAgentType,
  updateToolApprove,
  fetchMetaAgentModels,
  fetchAgentLockInfo,
  fetchAgentConstantList,
  fetchAgentSkillRelationList,
  fetchWorkerSkills,
  batchSaveABExperiment,
  fetchABExperimentPage
} from "./api"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { message } from "antd"

/**
 * 【增C】创建agent
 */
export const useCreateAgent = () => {
  return useMutation(createAgent)
}

/**
 * 【增C】新增agent
 */
export const useAddAgent = () => {
  const queryClient = useQueryClient()
  return useMutation(addAgent, {
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries([QUERY_KEYS.AGENT_LIST])
      } else {
        message.error(res.message || "创建失败")
      }
    },
    onError: (error) => {
      message.error(error.message || "创建失败")
    }
  })
}

/**
 * 【查R】拉取agent列表
 */
export const useFetchAgentListByPage = (params) => {
  return useQuery([QUERY_KEYS.AGENT_LIST_BY_PAGE, params], () => fetchAgentListByPage(params))
}
/**
 * 【查R】拉取agent列表(已发布)
 */
export const useFetchAgentListForReleased = (params) => {
  return useQuery([QUERY_KEYS.AGENT_LIST_FOR_RELEASED, params], () =>
    fetchAgentListForReleased(params)
  )
}

/**
 * 【查R】获取调试会话列表
 */
export const useFetchDebugSessions = () => {
  return useMutation(fetchDebugSessions)
}

/**
 * 【改U】更新agent
 */
export const useUpdateAgent = () => {
  const queryClient = useQueryClient()
  return useMutation(updateAgent, {
    onSuccess: (res) => {
      if (res.success) {
        message.success("Agent 更新成功")
        queryClient.invalidateQueries([QUERY_KEYS.AGENT_LIST])
      } else {
        message.error(res.message || "更新失败")
      }
    },
    onError: (error) => {
      message.error(error.message || "更新失败")
    }
  })
}

/**
 * 【改U】更新agent（新）
 */
export const useUpdateAgentNew = () => {
  const queryClient = useQueryClient()
  return useMutation(updateAgentNew, {
    onSuccess: (res) => {
      if (res.success) {
        message.success("Agent 更新成功")
        queryClient.invalidateQueries([QUERY_KEYS.AGENT_LIST])
      } else {
        message.error(res.message || "更新失败")
      }
    },
    onError: (error) => {
      message.error(error.message || "更新失败")
    }
  })
}

/**
 * 【删D】删除Agent
 */
export const useDeleteAgent = () => {
  const queryClient = useQueryClient()
  return useMutation(deleteAgent, {
    onSuccess: (d) => {
      queryClient.invalidateQueries([QUERY_KEYS.AGENT_LIST])
      message.success("删除成功")
    },
    onError: (e) => {
      message.error(e.message)
    }
  })
}

/**
 * 拉取agent版本
 * fetchAgentVersion
 */
export const useFetchAgentVersion = (params) => {
  return useQuery([QUERY_KEYS.LATEST_AGENT_DEFINITION, params], () => {
    return fetchAgentVersion(params)
  })
}
/**
 * 发布agent版本
 */
export const useSaveAgentVersion = () => {
  return useMutation(saveAgentVersion)
}
/**
 * 发布agent版本
 */
export const useReleaseAgent = () => {
  return useMutation(releaseAgent)
}

export const useReleaseAgentPro = () => {
  return useMutation(releaseAgentPro)
}

/**
 * 拉取agent版本列表
 */
export const useFetchAgentVersionList = (params) => {
  return useQuery([QUERY_KEYS.AGENT_VERSION_LIST, params], () => fetchAgentVersionList(params))
}

/**
 * 载入agent指定版本
 */
export const useCopyAgentVersionNo = () => {
  return useMutation(copyAgentVersionNo)
}

/**
 * 删除agent指定版本
 */
export const useDeleteAgentVersion = () => {
  return useMutation(deleteAgentVersion)
}

/**
 * 使用agent指定版本
 */
export const useEnableAgentVersion = () => {
  return useMutation(enableAgentVersion)
}

export const useFetchAgentList = (params) => {
  return useQuery([QUERY_KEYS.AGENT_LIST, params], () => fetchAgentList(params))
}

/**
 * 获取agent最新调试会话ID
 */
export const useFetchLatestDebugSession = (params, options = {}) => {
  return useQuery(
    [QUERY_KEYS.AGENT_LATEST_DEBUG_SESSION, params],
    () => fetchLatestDebugSession(params),
    {
      enabled: !!params.botNo && !!params.agentNo && !!params.agentVersionNo,
      ...options
    }
  )
}

/**
 * 【删D】删除Agent（新）
 */
export const useDeleteAgentByNo = () => {
  const queryClient = useQueryClient()
  return useMutation(deleteAgentByNo, {
    onSuccess: (d) => {
      if (d.success) {
        queryClient.invalidateQueries([QUERY_KEYS.AGENT_LIST])
        message.success("删除成功")
      } else {
        d.message && message.error(d.message)
      }
    },
    onError: (e) => {
      message.error(e.message)
    }
  })
}

/**
 * 【增C】复制Agent
 */
export const useCopyAgent = () => {
  const queryClient = useQueryClient()
  return useMutation(copyAgent, {
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries([QUERY_KEYS.AGENT_LIST])
      } else {
        message.error(res.message || "复制失败")
      }
    },
    onError: (error) => {
      message.error(error.message || "复制失败")
    }
  })
}

/**
 * 【查R】获取调试执行详情
 */
export const useFetchDebugExecuteProcess = (params) => {
  return useQuery(
    [QUERY_KEYS.DEBUG_EXECUTE_PROCESS, params],
    () => fetchDebugExecuteProcess(params),
    {
      enabled: !!params.botNo && !!params.requestId && !!params.requestTime
    }
  )
}

/**
 * 切换agent类型
 */
export const useChangeAgentType = () => {
  return useMutation(changeAgentType)
}

/**
 * 更新工具授权状态
 */
export const useUpdateToolApprove = () => {
  const queryClient = useQueryClient()
  return useMutation(updateToolApprove, {
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries([QUERY_KEYS.LATEST_AGENT_DEFINITION])
      } else {
        message.error(res.message || "更新授权状态失败")
      }
    },
    onError: (error) => {
      message.error(error.message || "更新授权状态失败")
    }
  })
}

/**
 * 模型列表
 */
export const useFetchMetaAgentModelList = (params) => {
  return useQuery([QUERY_KEYS.META_AGENT_MODEL_LIST, params], () => fetchMetaAgentModels(params), {
    enabled: !!params.botNo
  })
}

/**
 * 锁定信息
 */
export const useFetchAgentLockInfo = (params) => {
  return useQuery([QUERY_KEYS.AGENT_LOCK_INFO, params], () => fetchAgentLockInfo(params), {
    enabled: !!params.botNo && !!params.agentNo
  })
}

/**
 * 获取带分页的用户列表。
 * @param {Object} params - 查询参数。
 */
export const useFetchAgentSkillRelationList = (params) => {
  return useQuery([QUERY_KEYS.BOT_CONSTANTS_PAGE, params], () =>
    fetchAgentSkillRelationList(params)
  )
}

/**
 * 获取带分页的用户列表。
 * @param {Object} params - 查询参数。
 */
export const useFetchAgentConstantList = (params) => {
  return useQuery([QUERY_KEYS.BOT_CONSTANTS_PAGE, params], () => fetchAgentConstantList(params))
}

/**
 * 查询agent的工作流列表
 * @param {Object} params - 查询参数。
 */
export const useFetchWorkerSkills = (params) => {
  return useQuery([QUERY_KEYS.WORKER_SKILLS, params], () => fetchWorkerSkills(params), {
    enabled: !!params.botNo && !!params.agentNo
  })
}

/**
 * 批量保存AB实验
 */
export const useBatchSaveABExperiment = () => {
  const queryClient = useQueryClient()
  return useMutation(batchSaveABExperiment, {
    onSuccess: (res) => {
      if (res.success) {
        message.success("保存成功")
        queryClient.invalidateQueries([QUERY_KEYS.AB_EXPERIMENTS])
      } else {
        message.error(res.message || "保存失败")
      }
    },
    onError: (error) => {
      message.error(error.message || "保存失败")
    }
  })
}

/**
 * 分页查询AB实验
 * @param {Object} params - 查询参数。
 */
export const useFetchABExperimentPage = (params) => {
  return useQuery([QUERY_KEYS.AB_EXPERIMENTS, params], () => fetchABExperimentPage(params), {
    enabled: !!params.botNo
  })
}
