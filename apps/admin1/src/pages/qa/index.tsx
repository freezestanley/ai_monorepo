import { useMemo } from "react"
import { useLocation } from "react-router-dom"
import { getQaUrl } from "@/config.env"

function QaEntry() {
  const location = useLocation()

  const iframeSrc = useMemo(() => {
    const searchParams = new URLSearchParams(location.search)
    const botNo = searchParams.get("botNo") || ""
    const workbenchNo = searchParams.get("workbenchNo") || "chat_with_ai"
    const qaUrl = getQaUrl()
    const target = new URL(`${qaUrl}/chat`)

    if (botNo) {
      target.searchParams.set("botNo", botNo)
    }
    target.searchParams.set("workbenchNo", workbenchNo)
    target.searchParams.set("isIframe", "true")

    return target.toString()
  }, [location.search])

  return (
    <div className="h-[calc(100vh)] w-full bg-white overflow-hidden">
      <iframe title="qa-chat" src={iframeSrc} className="h-full w-full border-0" />
    </div>
  )
}

export default QaEntry
