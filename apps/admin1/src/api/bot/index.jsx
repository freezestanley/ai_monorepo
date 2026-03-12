import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  fetchChatModelList,
  updateBotStatus,
  saveBot,
  fetchBotInfo,
  fetchNamespaceList,
  fetchBotListByPage,
  fetchAppPlatformTypes,
  deleteBot,
  updateBot,
  updateBotBasicSettings,
  checkIsGeneralAdmin
} from "./api"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { message } from "antd"

// 聊天模型列表
export const useFetchChatModelList = (botNo) => {
  return useQuery([QUERY_KEYS.CHAT_MODEL_LIST, botNo], () => fetchChatModelList(botNo))
}

// BOT上下线
export const useUpdateBotStatus = () => {
  const queryClient = useQueryClient()
  return useMutation(updateBotStatus, {
    onSuccess: (d) => {
      queryClient.invalidateQueries([QUERY_KEYS.BOT_INFO])
      queryClient.invalidateQueries([QUERY_KEYS.BOT_LIST_BY_PAGE])
      if (d.success) {
        message.success(d.message)
      } else {
        message.error(d.message)
      }
    },
    onError: (e) => {
      // @ts-ignore
      message.error(e.message)
    }
  })
}

// 新增/编辑 BOT
// JSDOC添加返回值 success为boolean, message为string
export const useSaveBot = () => {
  const queryClient = useQueryClient()

  const mutateAsync = async (botDetails) => {
    const data = await saveBot(botDetails)
    queryClient.invalidateQueries([QUERY_KEYS.BOT_LIST_BY_PAGE])

    return data
  }

  return { mutateAsync }
}

export const useUpdateBot = () => {
  const queryClient = useQueryClient()

  const mutateAsync = async (botDetails) => {
    const data = await updateBot(botDetails.botNo, botDetails)
    queryClient.invalidateQueries([QUERY_KEYS.BOT_LIST_BY_PAGE])

    return data
  }

  return { mutateAsync }
}

export const useUpdateBotBasicSettings = () => {
  const mutateAsync = async (botDetails) => {
    const data = await updateBotBasicSettings(botDetails.botNo, botDetails)
    return data
  }

  return { mutateAsync }
}

/**
 * 删除bot
 */
export const useDeleteBot = () => {
  const queryClient = useQueryClient()

  return useMutation(deleteBot, {
    onSuccess: (d) => {
      queryClient.invalidateQueries([QUERY_KEYS.BOT_LIST_BY_PAGE])
      // @ts-ignore
      message.success(d?.message)
    },
    onError: (e) => {
      // @ts-ignore
      message.error(e.message)
    }
  })
}

// 查询BOT基础信息
export const useFetchBotInfo = (botNo) => {
  return useQuery([QUERY_KEYS.BOT_INFO, botNo], () => fetchBotInfo(botNo), {
    enabled: !!botNo
  })
}

// 查询空间列表
export const useFetchNamespaceList = () => {
  return useQuery([QUERY_KEYS.NAMESPACE_LIST], fetchNamespaceList)
}

// 分页查询 BOT
export const useFetchBotListByPage = (params) => {
  return useQuery([QUERY_KEYS.BOT_LIST_BY_PAGE, params], () => fetchBotListByPage(params), {
    keepPreviousData: true
  })
}

// 查询应用端列表
export const useFetchAppPlatformList = () => {
  return useQuery([QUERY_KEYS.APP_PLATFORM_LIST], fetchAppPlatformTypes)
}

// 检查是否为普通管理员
export const useCheckIsGeneralAdmin = (botNo) => {
  return useQuery([QUERY_KEYS.IS_GENERAL_ADMIN, botNo], () => checkIsGeneralAdmin(botNo), {
    enabled: !!botNo
  })
}
