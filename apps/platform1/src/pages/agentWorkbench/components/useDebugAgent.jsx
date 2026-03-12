import { useState } from "react"
import { useLocation } from "react-router-dom"
import queryString from "query-string"
import { fetchEventSource, EventStreamContentType } from "@microsoft/fetch-event-source"
import { message } from "antd"
import { getTokenAndServiceName } from "@/api/sso"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { isStudio } from "@/config.env"

class RetriableError extends Error {}
class FatalError extends Error {}

const useDebugAgent = ({ agentNo, botNo, versionNo }) => {
  const [loading, setLoading] = useState(false)
  const [debugContent, setDebugContent] = useState("")
  const [otherData, setOtherData] = useState({})
  const queryClient = useQueryClient()
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)
  const { studioenv } = queryParams

  const controller = new AbortController()
  const signal = controller.signal
  const defaultUrl = `/botWeb/bots/${botNo}/agents/${agentNo}/${versionNo}/debug`

  const handleDebug = (values, url) => {
    console.log("eventData:values:\n", values)
    setLoading(true)
    setDebugContent("")
    fetchEventSource(url || defaultUrl, {
      method: "POST",
      signal,
      body: JSON.stringify(values),
      openWhenHidden: true,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Usercenter-Session": getTokenAndServiceName().token,
        ...(isStudio() ? { botno: botNo || undefined, studioenv: studioenv || "prd" } : {})
      },
      async onopen(response) {
        if (
          response.ok &&
          (response.headers.get("content-type") === EventStreamContentType ||
            response.headers.get("content-type") === "text/event-stream;charset=UTF-8")
        ) {
          console.log("everything's good")
          return // everything's good
        } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          // client-side errors are usually non-retriable:
          throw new FatalError()
        } else {
          setLoading(false)
          throw new RetriableError()
        }
      },
      onmessage: (event) => {
        const eventData = JSON.parse(event.data)
        console.log("eventData:response:\n", eventData)
        setDebugContent((prevContent) => `${prevContent}${eventData.data}`)
        setOtherData({
          code: eventData.code,
          requestId: eventData.requestId,
          sessionId: eventData.sessionId,
          success: eventData.success
        })
      },
      onclose: () => {
        queryClient.invalidateQueries([QUERY_KEYS.LATEST_AGENT_DEFINITION])
        // message.success("调试结束")
        setLoading(false)
      },
      onerror: (error) => {
        console.error("EventSource failed:", error)
        setLoading(false)
        throw new Error("失败")
      }
    })
  }

  return { debugContent, handleDebug, setDebugContent, loading, otherData }
}

export default useDebugAgent
