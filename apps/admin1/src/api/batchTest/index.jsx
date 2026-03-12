// index.jsx
import { message } from "antd"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  createTestSet,
  createAgentTestSet,
  debugTestSet,
  debugAgentTestSet,
  deleteTestSet,
  deleteAgentTestSet,
  fetchTestSetDetail,
  fetchAgentTestSetDetail,
  fetchTestSetOutputSchema,
  fetchTestSetPage,
  fetchAgentTestSetPage,
  fetchSkillVersionList,
  fetchAgentSkillVersionList,
  runTestSetAgain,
  runAgentTestSetAgain,
  cancelTestSet,
  cancelAgentTestSet,
  continueTestSet,
  continueAgentTestSet,
  fetchAdminRoles,
  fetchBotAuthRole,
  fetchTagList
} from "./api"
import { QUERY_KEYS } from "@/constants/queryKeys"

// 创建测试集
export const useCreateTestSet = () => {
  return useMutation(createTestSet)
}

// 创建Agent测试集
export const useCreateAgentTestSet = () => {
  return useMutation(createAgentTestSet)
}

export const useDebugTestSet = () => {
  return useMutation(debugTestSet)
}

export const useDebugAgentTestSet = () => {
  return useMutation(debugAgentTestSet)
}

// 删除测试集
export const useDeleteTestSet = () => {
  return useMutation(deleteTestSet)
}

// 删除Agent测试集
export const useDeleteAgentTestSet = () => {
  return useMutation(deleteAgentTestSet)
}

// 获取单个测试集测试结果
export const useFetchTestSetDetail = (params, options = {}) => {
  const res = useQuery([QUERY_KEYS.TEST_SET_DETAIL, params], () => fetchTestSetDetail(params), {
    enabled: !!params.id,
    onSuccess: (data) => {
      if (!data?.success) {
        data?.message && message.error(data?.message)
      }
    },
    ...options
  })
  return {
    data: res.data?.data || {},
    refetch: res.refetch,
    isLoading: res.isLoading,
    error: res.error
  }
}

// 获取单个Agent测试集测试结果
export const useFetchAgentTestSetDetail = (params, options = {}) => {
  const res = useQuery(
    [QUERY_KEYS.AGENT_TEST_SET_DETAIL, params],
    () => fetchAgentTestSetDetail(params),
    {
      enabled: !!params.id,
      onSuccess: (data) => {
        if (!data?.success) {
          data?.message && message.error(data?.message)
        }
      },
      ...options
    }
  )
  return {
    data: res.data?.data || {},
    refetch: res.refetch,
    isLoading: res.isLoading,
    error: res.error
  }
}

// 获取测试集
export const useFetchTestSetPage = (params, options = {}) => {
  return useQuery(
    [QUERY_KEYS.TEST_SET_PAGE, params.pageSize, params.pageNum],
    () => fetchTestSetPage(params),
    options
  )
}

// 获取测试集
export const useFetchAgentTestSetPage = (params, options = {}) => {
  return useQuery(
    [QUERY_KEYS.AGENT_TEST_SET_PAGE, params.pageSize, params.pageNum],
    () => fetchAgentTestSetPage(params),
    options
  )
}

// 获取测试集输出schema
export const useFetchTestSetSchema = (params) => {
  return useQuery(
    [QUERY_KEYS.TEST_SET_SCHEMA, params.skillVersionNo],
    () => fetchTestSetOutputSchema(params),
    {
      enabled: !!params.skillVersionNo
    }
  )
}

export const useFetchSkillVersionList = (params, options = {}) => {
  return useQuery([QUERY_KEYS.TEST_SKILL_VERSION_LIST], () => fetchSkillVersionList(params), {
    enabled: !!params.skillNo,
    ...options
  })
}

export const useFetchAgentSkillVersionList = (params, options = {}) => {
  return useQuery(
    [QUERY_KEYS.TEST_AGENT_SKILL_VERSION_LIST],
    () => fetchAgentSkillVersionList(params),
    {
      enabled: !!params.agentNo,
      ...options
    }
  )
}

export const useRunTestSetAgain = () => {
  return useMutation(runTestSetAgain)
}

export const useRunAgentTestSetAgain = () => {
  return useMutation(runAgentTestSetAgain)
}

// 取消测试集
export const useCancelTestSet = () => {
  return useMutation(cancelTestSet)
}

// 取消Agent测试集
export const useCancelAgentTestSet = () => {
  return useMutation(cancelAgentTestSet)
}

// 续跑测试集
export const useContinueTestSet = () => {
  return useMutation(continueTestSet)
}

// 续跑Agent测试集
export const useContinueAgentTestSet = () => {
  return useMutation(continueAgentTestSet)
}

// 角色-查询用户拥有的管理员角色列表
export const useFetchAdminRoles = () => {
  return useQuery([QUERY_KEYS.ADMIN_ROLES], () => fetchAdminRoles())
}

// 角色-根据空间编号查询角色列表
export const useFetchBotAuthRole = () => {
  // 使用mutation
  return useMutation(fetchBotAuthRole)
}

export const useFetchTagList = (params) => {
  return useQuery([QUERY_KEYS.TAG_LIST], () => fetchTagList(params))
}
