import { useRef, useState } from "react"
import { fetchEventSource, EventStreamContentType } from "@microsoft/fetch-event-source"
import { useLocation } from "react-router-dom"
import queryString from "query-string"
import { useSkillFlowData } from "@/store"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { message } from "antd"
import { getTokenAndServiceName } from "@/api/sso"
import { isStudio } from "@/config.env"

class RetriableError extends Error {}
class FatalError extends Error {}

export const useDebugHandler = (nodeId) => {
  // loading
  const [loading, setLoading] = useState(false)
  const [debugContent, setDebugContent] = useState("")
  const { botNo, skillNo, versionNo, skillComponentDefinitions } = useSkillFlowData(
    (state) => state.skillFlowData
  )
  const queryClient = useQueryClient()
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)
  const { studioenv } = queryParams

  const skillComponentDefinitionsRef = useRef(skillComponentDefinitions)
  skillComponentDefinitionsRef.current = skillComponentDefinitions

  const versionNoRef = useRef(versionNo)
  versionNoRef.current = versionNo

  const controller = new AbortController()
  const signal = controller.signal

  const handleDebug = (values) => {
    const componentNo = skillComponentDefinitionsRef.current.find(
      (item) => nodeId === item.nodeId
    )?.componentNo

    let url
    if (nodeId) {
      url = `/botWeb/bots/${botNo}/${skillNo}/${versionNoRef.current}/${componentNo}/debug`
    } else {
      url = `/botWeb/bots/${botNo}/${skillNo}/${versionNoRef.current}/debug`
      // url = `/botWeb/bots/zhongan-jiating-caixian/jiacai-kepu/jiacai-kepu/debug`
    }
    setLoading(true)

    fetchEventSource(url, {
      method: "POST",
      signal,
      body: JSON.stringify(values),
      openWhenHidden: true,
      // body: JSON.stringify({ $msg: "你好" }),
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Usercenter-Session": getTokenAndServiceName().token,
        ...(isStudio() ? { botno: botNo || undefined, studioenv: studioenv || "prd" } : {})
      },
      async onopen(response) {
        console.log(
          "response===>",
          response,
          response.headers.get("content-type"),
          EventStreamContentType
        )
        if (
          response.ok &&
          (response.headers.get("content-type") === EventStreamContentType ||
            response.headers.get("content-type") === "text/event-stream;charset=UTF-8")
        ) {
          console.log("everything's good")
          return // everything's good
        } else if (response.status >= 400 && response.status < 505 && response.status !== 429) {
          // client-side errors are usually non-retriable:
          throw new FatalError()
        } else {
          throw new RetriableError()
        }
      },
      onmessage: (event) => {
        console.log(event)
        setDebugContent((prevContent) => `${prevContent}\n\n${JSON.parse(event.data).data}`)
      },
      onclose: () => {
        if (!nodeId) {
          queryClient.invalidateQueries([QUERY_KEYS.LATEST_DEFINITION])
        }
        queryClient.invalidateQueries([QUERY_KEYS.SKILL_VERSION_LIST])
        message.success("调试结束")
        setLoading(false)
      },
      onerror: (error) => {
        console.error("EventSource failed:", error)
        throw new Error("失败")
      }
    })
  }

  return { debugContent, handleDebug, setDebugContent, loading }
}
