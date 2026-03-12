import { useQuery, useMutation } from "@tanstack/react-query"
import { useBotList } from "@/api/market"
import { message } from "antd"

const normalizeSpaces = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.list)) return payload.list
  if (Array.isArray(payload?.data?.list)) return payload.data.list
  return []
}

// 获取空间列表的 hook - 直接使用现有的 useBotList
export const useSpacesQuery = () => {
  const result = useBotList()
  return {
    ...result,
    data: normalizeSpaces(result?.data)
  }
}

// 获取空间扩展信息的 hook (模拟数据)
export const useSpacesExtendInfoQuery = () => {
  return useQuery({
    queryKey: ["spacesExtendInfo"],
    queryFn: async () => {
      // 模拟扩展信息数据
      return {}
    },
    staleTime: 5 * 60 * 500
  })
}

// 置顶空间的 hook (模拟)
export const useSpaceTopUpMutation = () => {
  return useMutation({
    mutationFn: async ({ botNo, topUp }) => {
      // 模拟置顶操作
      await new Promise((resolve) => setTimeout(resolve, 500))
      return { success: true }
    },
    onSuccess: () => {
      message.success("操作成功")
    },
    onError: () => {
      message.error("操作失败")
    }
  })
}
