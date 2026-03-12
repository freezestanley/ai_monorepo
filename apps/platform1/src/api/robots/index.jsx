import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  fetchRobotsList,
  updateRobotBaseSetting,
  updateRobotStatus,
  updateRobotUsingSetting
} from "./api"
import { QUERY_KEYS } from "@/constants/queryKeys"

export const useRobotsList = ({ botNo, searchText }) => {
  return useQuery([QUERY_KEYS.ROBOT_LIST, botNo, searchText], () =>
    fetchRobotsList({ botNo, searchText })
  )
}
export const useUpdateRobotStatus = () => {
  return useMutation(updateRobotStatus)
}
export const useUpdateRobotBaseSetting = () => {
  return useMutation(updateRobotBaseSetting)
}
export const useUpdateRobotUsingSetting = () => {
  return useMutation(updateRobotUsingSetting)
}
