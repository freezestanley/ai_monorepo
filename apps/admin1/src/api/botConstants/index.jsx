import { QUERY_KEYS } from "@/constants/queryKeys"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  createBotConstant,
  deleteBotConstant,
  fetchBotConstantsPage,
  updateBotConstant
} from "./api"

/**
 * 获取带分页的用户列表。
 * @param {Object} params - 查询参数。
 */
export const useFetchBotConstantsPage = (params) => {
  return useQuery([QUERY_KEYS.BOT_CONSTANTS_PAGE, params], () => fetchBotConstantsPage(params))
}

/**
 * 创建空间常量
 * @returns
 */
export const useCreateBotConstant = () => {
  return useMutation(createBotConstant)
}

/**
 * 删除空间常量
 * @returns
 */
export const useDeleteBotConstant = () => {
  return useMutation(deleteBotConstant)
}

/**
 * 更新空间常量
 * @returns
 */
export const useUpdateBotConstant = () => {
  return useMutation(updateBotConstant)
}
