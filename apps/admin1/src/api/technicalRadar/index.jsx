import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  fetchTechnicalRadarListApi,
  fetchTechnicalRadarDetailApi,
  fetchTechnicalRadarApproveApi
} from "./api"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { message } from "antd"

/** 技术雷达-列表 */
export const useFetchTechnicalRadarListApi = (params) => {
  return useQuery([QUERY_KEYS.TECHNICAL_RADAR_LIST, params], () =>
    fetchTechnicalRadarListApi(params)
  )
}

/** 技术雷达-详情 */
export const useFetchTechnicalRadarDetailApi = (technologyNo) => {
  return useQuery(
    [QUERY_KEYS.TECHNICAL_RADAR_DETAIL, technologyNo],
    () => fetchTechnicalRadarDetailApi(technologyNo),
    {
      enabled: !!technologyNo
    }
  )
}

/** 技术雷达-审批 */
export const useFetchTechnicalRadarApproveApi = () => {
  const queryClient = useQueryClient()
  return useMutation(fetchTechnicalRadarApproveApi, {
    onSuccess: (res) => {
      queryClient.invalidateQueries([QUERY_KEYS.TECHNICAL_RADAR_APPROVW])
      if (res.success) {
        message.success(res.message)
      } else {
        message.error(res.message)
      }
    },
    onError: (e) => {
      message.error(e.message)
    }
  })
}
