import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { message, Spin } from "antd"
import { useVirtualizer } from "@tanstack/react-virtual"
import Icon from "./Icon"
import SpaceCardV2 from "./SpaceCardV2"
import { useSpacesQuery, useSpacesExtendInfoQuery, useSpaceTopUpMutation } from "./hooks"

// 模拟部门数据
const DEPARTMENTS = [
  {
    id: "d1",
    name: "健康险",
    color: "border-blue-300 bg-blue-50 text-blue-700"
  },
  {
    id: "d2",
    name: "数据智能",
    color: "border-green-300 bg-green-50 text-green-700"
  },
  {
    id: "d3",
    name: "产品研发",
    color: "border-amber-300 bg-amber-50 text-amber-700"
  },
  {
    id: "d4",
    name: "基础架构",
    color: "border-purple-300 bg-purple-50 text-purple-700"
  }
]

const AVATAR_COLORS = [
  "bg-indigo-500",
  "bg-green-500",
  "bg-amber-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-sky-500"
]

function getColumnsByWidth(w) {
  if (w >= 1024) return 3
  if (w >= 768) return 2
  return 1
}

function HomeEntry() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)

  // 使用自定义 hooks
  const { data: spaces = [], isLoading: isLoadingSpaces } = useSpacesQuery()
  const { data: extendInfo = {}, isLoading: isLoadingExtendInfo } = useSpacesExtendInfoQuery()

  const [messageApi, contextHolder] = message.useMessage()
  const topUpMutation = useSpaceTopUpMutation()

  const handleCardClick = (spaceId) => {
    navigate(
      `/agent?botNo=${spaceId}&iframeStyle=false&hideSideBarAndHeader=false&serviceName=za-open-bot`
    )
  }
  // aigc-admin-test.zhonganonline.com/#/agent?botNo=b2025072316169717&iframeStyle=true&hideSideBarAndHeader=true&serviceName=za-open-bot&token=vQE35Lxn%252FzlqC1tYFHkncRgVvPjaEP9UFd6ORJDUx3DoiZGFsKe2L3uCh2Hw9BewkT9G8RHkWJm5NO5mwnG%252Fkw%253D%253D&workbenchNo=promptEngineering&parentOrigin=https%3A%2F%2Faigc-test.zhonganonline.com

  const mergedSpaces = useMemo(() => {
    if (!spaces) return []
    return spaces.map((space, index) => {
      const info = extendInfo[space.botNo] || { callInfo: {} }
      const callGrowthRate = info.callInfo?.callGrowthRate || Math.floor(Math.random() * 40) - 10 // 模拟增长率
      return {
        id: space.botNo,
        name: space.botName || space.name || `Bot ${index + 1}`,
        avatarUrl: space.botIcon || space.iconUrl || space.icon,
        dept: DEPARTMENTS[index % DEPARTMENTS.length],
        avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
        recentCalls: info.callInfo?.callCount || Math.floor(Math.random() * 1000),
        callsTrend: `${callGrowthRate > 0 ? "+" : ""}${callGrowthRate}%`,
        isPinned: space.topUp === 1
      }
    })
  }, [spaces, extendInfo])

  const filteredSpaces = useMemo(() => {
    const term = deferredSearchTerm.trim().toLowerCase()
    if (!term) return mergedSpaces
    return mergedSpaces.filter((s) => s.name.toLowerCase().includes(term))
  }, [mergedSpaces, deferredSearchTerm])

  // 响应式列数
  const [columns, setColumns] = useState(() =>
    typeof window !== "undefined" ? getColumnsByWidth(window.innerWidth) : 3
  )

  useEffect(() => {
    const update = () => setColumns(getColumnsByWidth(window.innerWidth))
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  const rows = Math.ceil(filteredSpaces.length / columns)

  // 全屏滚动容器
  const scrollParentRef = useRef(null)

  // SpaceCardV2 高度 240px；grid gap-8 (32px)
  // 240(卡片) + 32(gap) ≈ 272
  const ESTIMATED_ROW_HEIGHT = 280

  const rowVirtualizer = useVirtualizer({
    count: rows,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 12
  })

  useEffect(() => {
    rowVirtualizer.measure()
  }, [rowVirtualizer, rows, columns, filteredSpaces.length])

  const handleTopUpClick = async (e, botNo, isPinned) => {
    // 注意：时间冒泡/事件冒泡处理（不触发卡片 onClick）
    e.stopPropagation()

    if (topUpMutation.isPending) return

    const newStatus = isPinned ? 0 : 1
    try {
      await topUpMutation.mutateAsync({ botNo, topUp: newStatus })
      messageApi.success(newStatus === 1 ? "已置顶" : "已取消置顶")
    } catch (err) {
      console.error("topUp failed", err)
      messageApi.error("操作失败，请稍后重试")
    }
  }

  if (isLoadingSpaces || isLoadingExtendInfo) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div ref={scrollParentRef} className="h-screen overflow-auto bg-slate-50 p-10">
      {contextHolder}

      <div className="mx-auto max-w-[1400px]">
        <div className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <h1 className="!m-0 text-3xl font-black tracking-tight text-slate-900">我的空间</h1>

          <div className="flex justify-end">
            <motion.div
              initial={false}
              animate={{
                width: isSearchExpanded || searchTerm ? 320 : 48,
                transition: { type: "spring", stiffness: 300, damping: 30 }
              }}
              className="group relative flex h-12 items-center overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-colors hover:border-indigo-500/30"
            >
              <button
                onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                className="flex cursor-pointer h-12 w-12 shrink-0 items-center justify-center text-slate-400 transition-colors hover:text-indigo-500"
                title="搜索空间"
              >
                <Icon icon="mdi:search" />
              </button>

              {(isSearchExpanded || searchTerm) && (
                <motion.input
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  autoFocus
                  type="text"
                  placeholder="搜索空间名称..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-full px-2 flex-1 border-none bg-transparent pr-10 text-sm font-bold text-slate-700 placeholder:text-slate-300 outline-none"
                />
              )}

              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm("")
                    setIsSearchExpanded(false)
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 transition-colors hover:text-slate-500"
                >
                  <Icon icon="mdi:close" />
                </button>
              )}
            </motion.div>
          </div>
        </div>

        <div className="relative" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const startIndex = virtualRow.index * columns
            const rowItems = filteredSpaces.slice(startIndex, startIndex + columns)

            return (
              <div
                key={virtualRow.key}
                className="absolute left-0 top-0 w-full"
                style={{ transform: `translateY(${virtualRow.start}px)` }}
              >
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {rowItems.map((space, indexInRow) => {
                    const index = startIndex + indexInRow
                    return (
                      <SpaceCardV2
                        key={space.id}
                        id={space.id}
                        name={space.name}
                        avatarUrl={space.avatarUrl}
                        dept={space.dept}
                        avatarColor={space.avatarColor}
                        recentCalls={space.recentCalls}
                        callsTrend={space.callsTrend}
                        isPinned={space.isPinned}
                        onClick={() => handleCardClick(space.id)}
                        index={index}
                        // 把置顶逻辑交给 SpaceCardV2 内部按钮触发
                        onTopUpClick={(e) => handleTopUpClick(e, space.id, space.isPinned)}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {filteredSpaces.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[40px] border border-dashed border-gray-200 bg-white py-32 text-center"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-50">
              <Icon icon="mdi:search" className="h-10 w-10 text-gray-300" />
            </div>
            <p className="text-lg font-black tracking-tight text-slate-800">
              未找到{deferredSearchTerm ? `"${deferredSearchTerm}"的` : ""}空间
            </p>
            <button
              onClick={() => setSearchTerm("")}
              className="mt-4 cursor-pointer rounded-sm px-2 py-1 text-sm font-black text-indigo-600 hover:underline"
            >
              重置搜索
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default HomeEntry
