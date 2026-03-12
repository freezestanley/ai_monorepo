import { useCallback, useEffect, useMemo, useState } from "react"
import { fetchBotList, fetchBotExtendInfo } from "@/api/market/api"
import { useBotsInfo, useBotsExtendInfo } from "@/store/robot"

export const deptColors = {
  技术研发中心: "blue",
  开放平台部: "indigo",
  总经理室: "purple",
  数据科学应用中心: "wathet",
  车险事业部: "lime",
  直营事业部: "green",
  众安国际: "turquoise",
  数字生活事业部: "orange",
  金融事业部: "yellow",
  健康险事业部: "red",
  客户体验中心: "violet",
  人力资源部: "carmine"
}

export const fallbackDeptColors = [
  "azure",
  "teal",
  "sky",
  "navy",
  "cyan",
  "aqua",
  "mint",
  "emerald",
  "forest",
  "seagreen",
  "olive",
  "gold",
  "amber",
  "peach",
  "coral",
  "salmon",
  "rose",
  "magenta",
  "plum",
  "lavender"
]

const useBots = (options) => {
  const { isInit } = options || {}
  const { data: botsExtendInfo, setData: setBotsExtendInfo } = useBotsExtendInfo()
  const { data: botsInfo, setData: setBotsInfo } = useBotsInfo()
  const [isLoading, setIsLoading] = useState(false)

  const botsListInfo = useMemo(() => {
    let index = 0
    return {
      ...botsInfo,
      botList: botsInfo?.botList?.map((item) => {
        const botExtendInfo = botsExtendInfo[item.botNo]
        let deptColor = deptColors[item?.deptName]
        if (!deptColor) {
          deptColor = fallbackDeptColors[index % fallbackDeptColors.length]
          index += 1
        }
        return {
          ...item,
          deptColor,
          botExtendInfo
        }
      })
    }
  }, [botsInfo, botsExtendInfo])

  const fetchBotListInfo = useCallback(async () => {
    const res = await fetchBotList()
    if (res) {
      setBotsInfo({
        ...botsInfo,
        botList: res.data || [],
        userStatus: res.code
      })
    }
  }, [])

  const fetchBotExtraInfo = useCallback(async () => {
    const botsExtendInfo = {}
    const res = await fetchBotExtendInfo()

    if (Array.isArray(res)) {
      res.forEach((item) => {
        botsExtendInfo[item.botNo] = item
      })
      setBotsExtendInfo(botsExtendInfo)
    }
  }, [])

  const initFn = useCallback(async () => {
    setIsLoading(true)
    try {
      await Promise.all([fetchBotListInfo(), fetchBotExtraInfo()])
    } finally {
      setIsLoading(false)
    }
  }, [fetchBotListInfo, fetchBotExtraInfo])

  useEffect(() => {
    if (isInit) {
      initFn()
    }
  }, [isInit])

  return {
    fetchBotListInfo,
    botsExtendInfo,
    botsInfo,
    botsListInfo,
    setIsLoading,
    isLoading
  }
}

export default useBots
