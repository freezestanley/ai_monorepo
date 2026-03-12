import { useState } from "react"
import { useLocation } from "react-router-dom"
import queryString from "query-string"
import { fetchEventSource, EventStreamContentType } from "@microsoft/fetch-event-source"
import { getTokenAndServiceName } from "@/api/sso"
import { isStudio } from "@/config.env"

class RetriableError extends Error {}
class FatalError extends Error {}

function UseGenerateCode() {
  const [loading, setLoading] = useState(false)
  const [codeContent, setCodeContent] = useState("")

  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)
  const { botNo, studioenv } = queryParams

  const controller = new AbortController()
  const signal = controller.signal
  const startGenerateCode = (url, values) => {
    setLoading(true)
    fetchEventSource(url, {
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
          throw new RetriableError()
        }
      },
      onmessage: (event) => {
        console.log(event)
        setCodeContent((prevContent) => `${prevContent}${JSON.parse(event.data).data}`)
      },
      onclose: () => {
        setLoading(false)
      },
      onerror: (error) => {
        setLoading(false)
        console.error("EventSource failed:", error)
        // throw new Error("失败")
      }
    })
  }
  const stopGenerate = () => {
    controller.abort()
    setLoading(false)
  }
  return {
    startGenerateCode,
    stopGenerate,
    codeContent,
    loading,
    setCodeContent
  }
}

export default UseGenerateCode
