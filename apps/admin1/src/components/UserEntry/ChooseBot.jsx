import { useEffect, useMemo, useState } from "react"
import { ChevronsUpDown } from "lucide-react"
import { Tag } from "antd"
import { useLocation } from "react-router-dom"
import useBots from "@/hooks/useBots"
import { useBotsInfo } from "@/store/robot"
import { useCollapsed } from "@/store"
import ChooseBotModal from "./ChooseBotModal"

const deptTagColorMap = {
  blue: "#336df4",
  indigo: "#5b65f5",
  purple: "#8c55ec",
  wathet: "#25b0e7",
  lime: "#91ad00",
  green: "#35bd4b",
  turquoise: "#1fa18f",
  orange: "#db7018",
  yellow: "#ffc60a",
  red: "#f54a45",
  violet: "#bf3dbf",
  carmine: "#df58a5",
  azure: "#3fa7ff",
  teal: "#1abc9c",
  sky: "#74b9ff",
  navy: "#34495e",
  cyan: "#00bcd4",
  aqua: "#00ffff",
  mint: "#2ecc71",
  emerald: "#009f6b",
  forest: "#228b22",
  seagreen: "#2e8b57",
  olive: "#808000",
  gold: "#d4af37",
  amber: "#ffbf00",
  peach: "#ff9f80",
  coral: "#ff7f50",
  salmon: "#fa8072",
  rose: "#ff5c8a",
  magenta: "#ff00ff",
  plum: "#8e4585",
  lavender: "#b57edc"
}

const ChooseBot = () => {
  const { botsListInfo } = useBots({ isInit: true })
  const { data: botsInfo, setData: setBotsInfo } = useBotsInfo()
  const isCollapsed = useCollapsed((state) => state.collapsed)
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const currentBot = botsListInfo?.currentBot

  const displayName = currentBot?.botName || "全部"
  const displayDeptName = currentBot?.deptName
  const displayDeptColor = deptTagColorMap[currentBot?.deptColor] || "#8c55ec"
  const displayChar = useMemo(() => {
    const text = (displayName || "").trim()
    if (!text) return "全"
    return text.slice(0, 1).toUpperCase()
  }, [displayName])

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const botNo = searchParams.get("botNo")
    const isHome = location.pathname === "/home" || location.pathname === "/"

    if (isHome && !botNo) {
      if (!botsInfo?.currentBot?.botNo) return
      setBotsInfo({ ...botsInfo, currentBot: { botName: "" }, showBots: true })
      return
    }

    if (!botNo) return
    if (botsInfo?.currentBot?.botNo === botNo) return
    const targetBot = botsListInfo?.botList?.find((item) => item.botNo === botNo)
    if (!targetBot) return
    setBotsInfo({ ...botsInfo, currentBot: targetBot, showBots: false })
  }, [botsInfo, botsListInfo?.botList, location.pathname, location.search, setBotsInfo])

  return (
    <>
      {isCollapsed ? (
        <div className="w-full flex justify-center">
          <div
            className={
              "h-10 w-10 cursor-pointer rounded-full border border-solid border-gray-100 " +
              "bg-gray-50 text-sm font-black text-slate-700 flex items-center justify-center " +
              "transition-all hover:border-[var(--primary-color)] " +
              "hover:bg-[var(--primary-color)] hover:text-white"
            }
            onClick={() => setOpen(true)}
          >
            {displayChar}
          </div>
        </div>
      ) : (
        <div
          className={
            "w-full cursor-pointer border border-solid rounded-[20px] border-gray-100 " +
            "hover:border-[var(--primary-color)] flex items-center p-[20px] group"
          }
          onClick={() => setOpen(true)}
        >
          <div className="flex-1 min-w-0 pr-2">
            {!!displayDeptName && (
              <Tag
                style={{
                  color: displayDeptColor,
                  borderColor: displayDeptColor,
                  marginBottom: 8,
                  fontSize: 12,
                  lineHeight: "18px",
                  borderRadius: 6
                }}
              >
                {displayDeptName}
              </Tag>
            )}
            <div className="font-black text-slate-800 text-base leading-tight">{displayName}</div>
          </div>
          <ChevronsUpDown
            size={16}
            className="text-gray-300 group-hover:text-[var(--primary-color)] shrink-0 ml-2"
          />
        </div>
      )}
      <ChooseBotModal botsListInfo={botsListInfo} open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export default ChooseBot
