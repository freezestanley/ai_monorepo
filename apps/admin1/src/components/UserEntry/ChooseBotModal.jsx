import { useCallback, useEffect, useMemo, useState } from "react"
import { Search, Check } from "lucide-react"
import { Input, Modal, Typography, Tag } from "antd"
import classNames from "classnames"
import { useNavigate } from "react-router-dom"
import { isIntl } from "@/api/sso"
import { reportEvent } from "@/utils/monitorEvent"
import { useBotsInfo } from "@/store/robot"
import { useSSO } from "@/components/SSOProvider"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"
import styles from "./chooseBot.module.scss"

const buildTargetPath = (bot) => {
  let path = "/agent"
  let name = "Agent"
  let code = "chat_with_ai"
  const menus = [
    ...(bot?.botExtendInfo?.menus?.filter(
      (item) => !["robot", "basicSettingsQPM", "userList"].includes(item.code)
    ) || []),
    ...(bot?.botExtendInfo?.menus?.filter((item) =>
      ["robot", "basicSettingsQPM", "userList"].includes(item.code)
    ) || [])
  ]

  if (menus.length > 0) {
    code = menus[0].code
    if (!isIntl()) {
      const newMenus = [...menus].sort((a, b) => a.order - b.order)
      const firstMenu = newMenus[0]
      path = firstMenu.path
      code = firstMenu.code
      name = firstMenu.name
    }
  }

  return { path, name, code }
}

const buildQueryParams = (botNo, workbenchNo) => {
  const baseParams = new URLSearchParams({
    iframeStyle: "false",
    hideSideBarAndHeader: "false",
    serviceName: "za-open-bot"
  })
  if (botNo) {
    baseParams.set("botNo", botNo)
  }
  if (workbenchNo) {
    baseParams.set("workbenchNo", workbenchNo)
  }
  return baseParams.toString()
}

const ChooseBotModal = ({ botsListInfo, open, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeName, setActiveName] = useState("")
  const [visibleCount, setVisibleCount] = useState(60)
  const [isListReady, setIsListReady] = useState(false)
  const { data: botsInfo, setData: setBotsInfo } = useBotsInfo()
  const navigate = useNavigate()
  const { userInfo } = useSSO()

  const botList = useMemo(() => {
    return botsListInfo?.botList?.filter(
      (item) =>
        item.botName?.toLowerCase()?.includes(searchTerm?.toLowerCase()) &&
        (!activeName ? true : activeName === item.deptName)
    )
  }, [botsListInfo, searchTerm, activeName])

  const depsNames = useMemo(() => {
    const list = new Set()
    botsListInfo?.botList?.forEach((item) => {
      item.deptName && list.add(item.deptName)
    })
    return [
      { label: "全部", value: "" },
      ...[...list].map((item) => ({ label: item, value: item }))
    ]
  }, [botsListInfo, searchTerm])

  const onSelect = useCallback(
    (item) => {
      setBotsInfo({ ...botsInfo, currentBot: item, showBots: false })
    },
    [botsInfo, setBotsInfo]
  )

  const toTarget = useCallback(
    (bot) => {
      const { path, name, code } = buildTargetPath(bot)
      reportEvent({
        eventName: "custom click",
        source: "bot choose home",
        action: "bot click",
        botNo: bot.botNo,
        pagePath: path,
        pageName: name,
        userInfo
      })
      const query = buildQueryParams(bot.botNo, code)
      const separator = path.includes("?") ? "&" : "?"
      navigate(`${path}${separator}${query}`)
      onSelect(bot)
      onClose()
    },
    [navigate, onSelect, onClose, userInfo]
  )

  useEffect(() => {
    if (!open) {
      setSearchTerm("")
      setActiveName("")
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    setIsListReady(false)
    const frame = requestAnimationFrame(() => {
      setIsListReady(true)
    })
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!open) return
    setVisibleCount(60)
  }, [open, searchTerm, activeName, botList?.length])

  const visibleBots = useMemo(() => {
    if (!isListReady) return []
    return botList?.slice(0, visibleCount) || []
  }, [botList, visibleCount, isListReady])

  const handleScroll = (event) => {
    if (!botList?.length) return
    const target = event.currentTarget
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 200) {
      setVisibleCount((prev) => Math.min(prev + 60, botList.length))
    }
  }

  return (
    <Modal
      title="切换空间"
      open={open}
      onCancel={() => onClose()}
      footer={false}
      className={classNames("max-w-4xl", styles.chooseBotModal)}
      width={"100%"}
    >
      <div className="px-4 py-4 bg-gray-50/50 border-0 border-b border-solid border-gray-100 space-y-5 shrink-0">
        <Input
          placeholder="输入搜索空间名称"
          className="w-full !px-4 !py-3.5 rounded-2xl !text-sm !font-bold text-slate-700 ring-purple-50"
          prefix={<Search className="text-gray-400 mr-[5px]" size={20} />}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex !flex-wrap gap-2">
          {depsNames.map((item) => (
            <div
              key={item.value}
              onClick={() => setActiveName(item.value)}
              className={`px-4 cursor-pointer py-1.5 rounded-xl text-xs font-black transition-all ${
                activeName === item.value
                  ? "bg-[var(--primary-color)] text-white shadow-lg shadow-purple-500/20"
                  : "bg-white text-slate-500 border border-solid border-gray-100 hover:border-[var(--primary-color)] hover:bg-gray-50"
              }`}
            >
              {item.label}
            </div>
          ))}
        </div>
      </div>
      {botList?.length ? (
        <div
          className="mt-6 max-h-[45vh] overflow-y-auto overflow-x-hidden scrollbar-hide px-2 pt-1"
          onScroll={handleScroll}
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visibleBots.map((item) => {
              const isSelected = botsListInfo?.currentBot?.botNo === item.botNo
              return (
                <div
                  key={item.botNo}
                  onClick={() => {
                    toTarget(item)
                  }}
                  className={`group cursor-pointer rounded-[24px] border border-solid p-5 transition-all hover:shadow-xl ${
                    isSelected
                      ? "border-[var(--primary-color)] bg-[var(--primary-color)]/5 ring-1 ring-[var(--primary-color)]"
                      : "border-gray-100 bg-white hover:border-[var(--primary-color)] hover:bg-[var(--primary-color)]/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      className="h-12 w-12 rounded-[100%] shadow-md transition-transform group-hover:scale-110"
                      src={item.botIcon}
                      alt=""
                    />
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="mb-1.5 flex items-center justify-between">
                        <Typography.Paragraph
                          className={`!m-0 truncate text-sm font-black leading-tight ${
                            isSelected ? "text-[var(--primary-color)]" : "text-slate-800"
                          }`}
                          ellipsis={{ rows: 1, tooltip: item.botName }}
                        >
                          {item.botName}
                        </Typography.Paragraph>
                        {isSelected && (
                          <Check size={16} className="ml-2 shrink-0 text-[var(--primary-color)]" />
                        )}
                      </div>
                      {!!item?.deptName && <Tag className={item?.deptColor}>{item?.deptName}</Tag>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {!isListReady && <div className="py-8 text-center text-sm text-slate-400">加载中...</div>}
          {isListReady && visibleBots.length === 0 && (
            <div className="py-8 text-center text-sm text-slate-400">暂无数据</div>
          )}
        </div>
      ) : (
        <div className="m-8">
          <CustomEmpty description={"未找到相关业务空间"} />
        </div>
      )}
    </Modal>
  )
}

export default ChooseBotModal
