import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import queryString from "query-string"
import { useGetPublishConfig } from "@/api/versionRelease"
import { usePublishConfigStore, useStudioenvStore } from "@/store/version"
import { isStudio } from "@/config.env"

export const useInitPublishData = () => {
  const location = useLocation()
  const { botNo, studioenv } = queryString.parse(location.search)
  const setPublishConfigStore = usePublishConfigStore((state) => state.setData)
  const setStudioenvStore = useStudioenvStore((state) => state.setData)
  const { data: publishConfigData } = useGetPublishConfig(
    {
      targetType: "BOT",
      targetId: botNo
    },
    {
      enabled: !!(botNo && isStudio())
    }
  )
  useEffect(() => {
    if (!isStudio()) return
    setPublishConfigStore(publishConfigData?.data)
  }, [publishConfigData])

  useEffect(() => {
    if (!isStudio()) return
    setStudioenvStore(studioenv)
  }, [studioenv])
}

export const useStudioPublishData = () => {
  const studioenv = useStudioenvStore((state) => state.data)
  const publishConfigData = usePublishConfigStore((state) => state.data)
  const isOpenVersion = publishConfigData?.publishMode === "STANDARD"
  // 版本发布开启，且不是开发环境
  const isPublishDisabled = isOpenVersion && studioenv !== "dev"
  return {
    isPublishDisabled,
    isOpenVersion,
    studioenv
  }
}
