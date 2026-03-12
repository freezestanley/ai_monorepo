import { useQuery } from "@tanstack/react-query"
import { fetchAudioInfo, fetchAudioInfo2 } from "./api"
import { QUERY_KEYS } from "@/constants/queryKeys"

/**
 * 通话详情获取
 */
export const useFetchAudioInfo = (params) => {
  return useQuery([QUERY_KEYS.VOICE_RECORD_AUDIO_INFO, params], () => fetchAudioInfo(params))
}

/**
 * 通话详情获取(使用sessionId)
 */
export const useFetchAudioInfoBySessionId = (params) => {
  return useQuery([QUERY_KEYS.VOICE_RECORD_AUDIO_INFO_BY_SESSIONID, params], () =>
    fetchAudioInfo2(params)
  )
}
