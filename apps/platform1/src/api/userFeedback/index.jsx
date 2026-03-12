import { useQuery } from "@tanstack/react-query"
import { fetchFeedbackSource, fetchFeedbackTag } from "./api"
import { QUERY_KEYS } from "@/constants/queryKeys"

/**
 * 反馈标签
 */
export const useFetchFeedbackTag = () => {
  return useQuery([QUERY_KEYS.DATA_FEED_TAG], () => fetchFeedbackTag())
}

/**
 * 反馈来源
 */
export const useFetchFeedbackSource = () => {
  return useQuery([QUERY_KEYS.DATA_FEED_SOURCE], () => fetchFeedbackSource())
}
