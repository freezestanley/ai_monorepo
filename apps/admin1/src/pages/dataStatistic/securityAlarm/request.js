import { fetchSafeFeedbackList } from "@/api/userFeedback/api"
import dayjs from "dayjs"

export const searchApi = async (
  { current: pageNum, startTime, endTime, ...restParams },
  sorter
) => {
  const requestParams = {
    pageNum,
    startTime: startTime && dayjs(startTime).format("YYYY-MM-DD HH:mm:ss"),
    endTime: endTime && dayjs(endTime).format("YYYY-MM-DD HH:mm:ss"),
    ...restParams
  }

  if (sorter) {
    // @ts-ignore
    requestParams.sortField = sorter.field
    // @ts-ignore
    requestParams.order = sorter.order === "descend" ? "DESC" : "ASC"
  }
  const { list = [], totalCount = 0 } = await fetchSafeFeedbackList(requestParams)
  return {
    data: list,
    total: totalCount
  }
}
