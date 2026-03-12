import { fetchUserFeedbackList } from "@/api/userFeedback/api"
import dayjs from "dayjs"

export const searchApi = async (
  { current: pageNum, feedbackStartTime, feedbackEndTime, ...restParams },
  sorter
) => {
  const requestParams = {
    pageNum,
    startTime: feedbackStartTime && dayjs(feedbackStartTime).format("YYYY-MM-DD HH:mm:ss"),
    endTime: feedbackEndTime && dayjs(feedbackEndTime).format("YYYY-MM-DD HH:mm:ss"),
    ...restParams
  }

  if (sorter) {
    // @ts-ignore
    requestParams.sortField = sorter.field
    // @ts-ignore
    requestParams.order = sorter.order === "descend" ? "DESC" : "ASC"
  }
  const { list, totalCount } = await fetchUserFeedbackList(requestParams)
  return {
    data: list || [],
    total: totalCount || 0
  }
}
