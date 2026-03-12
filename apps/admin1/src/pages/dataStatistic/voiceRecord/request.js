import dayjs from "dayjs"
import { fetchAudioPage, fetchAudioEnumStatus } from "@/api/voiceRecord/api"
import { exportAudioData } from "@/api/voiceAgent/api"

export const searchApi = async ({ current: pageNum, startTime, endTime, ...restParams }) => {
  const requestParams = {
    pageNum,
    startTime: startTime && dayjs(startTime).format("YYYY-MM-DD HH:mm:ss"),
    endTime: endTime && dayjs(endTime).format("YYYY-MM-DD HH:mm:ss"),
    ...restParams
  }
  const { list = [], total = 0 } = await fetchAudioPage(requestParams)
  return {
    data: list,
    total
  }
}

export const fetchEnumStatus = async (params = {}) => {
  const res = await fetchAudioEnumStatus(params)
  const payload = res?.data ?? res ?? {}
  const { connectStatus = [], endType = [] } = payload
  return {
    connectStatus,
    endType
  }
}

/**
 * 导出音频数据
 * @param {Object} data - 导出参数
 * @returns {Promise<boolean>}
 */
export const exportAudioRecords = (data = {}) => {
  return exportAudioData(data)
}
