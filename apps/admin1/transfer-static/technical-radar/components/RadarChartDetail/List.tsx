import React, { useState, useRef, useEffect } from "react"
import { message, Spin } from "antd"
import { Blip } from "../../type"
import { queryTechnicalRadarPointList } from "../../../services/technicalRadar"
import { getRingAndQuadrantFromCoordinate } from "../../config"

interface ListProps {
  blip?: Blip | null
  onItemClick?: (blip: Blip) => void
}

const List: React.FC<ListProps> = ({ onItemClick, blip }) => {
  const [items, setItems] = useState<Blip[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10

  const containerRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef<HTMLDivElement>(null)

  // Reset list when quadrant (blip) changes
  useEffect(() => {
    setItems([])
    setPage(1)
    setTotal(0)
    if (blip) {
      fetchData(1, true)
    }
  }, [blip?.quadrant])

  const fetchData = async (currentPage: number, reset = false) => {
    if (!blip) return
    if (loading) return

    setLoading(true)
    try {
      const res = await queryTechnicalRadarPointList({
        quadrantKey: blip.quadrantKey,
        approveStatus: "pass",
        pageNum: currentPage,
        pageSize: pageSize
      })

      const rawItems = res.data || []
      const newItems = rawItems.map((item: any) => ({
        ...item,
        x: item.horizontalAxis ? Number(item.horizontalAxis) : undefined,
        y: item.verticalAxis ? Number(item.verticalAxis) : undefined,
        ...(item.horizontalAxis && item.verticalAxis
          ? getRingAndQuadrantFromCoordinate(Number(item.horizontalAxis), Number(item.verticalAxis))
          : { quadrant: blip.quadrant })
      }))

      setItems((prev) => (reset ? newItems : [...prev, ...newItems]))
      setTotal(res?.totalCount || 0)
    } catch (error) {
      console.error("Failed to fetch list:", error)
      message.error("获取列表失败")
    } finally {
      setLoading(false)
    }
  }

  const hasMore = items.length < total

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const nextPage = page + 1
          setPage(nextPage)
          fetchData(nextPage)
        }
      },
      { threshold: 0.1 }
    )

    if (loadingRef.current) {
      observer.observe(loadingRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loading, page, blip])

  // Helper to get ring info
  const getRingInfo = (r: string) => {
    switch (r) {
      case "adopt":
        return { color: "text-green-600 bg-green-50 border-green-200" }
      case "trial":
        return { color: "text-blue-600 bg-blue-50 border-blue-200" }
      case "assess":
        return { color: "text-orange-600 bg-orange-50 border-orange-200" }
      case "hold":
        return { color: "text-red-600 bg-red-50 border-red-200" }
      default:
        return { color: "text-gray-600 bg-gray-50 border-gray-200" }
    }
  }

  const renderItem = (item: any) => {
    const { color } = getRingInfo(item.ringKey)
    const description = item.introduction || "暂无描述"

    return (
      <div
        key={item.id}
        className="group relative flex flex-col gap-2 p-4 rounded-xl border border-solid border-gray-300 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer bg-white mb-3 last:mb-0"
        onClick={() => onItemClick?.(item)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#1677ff] text-white text-xs font-bold shrink-0">
              {item.id}
            </div>
            <h3 className="text-[15px] font-bold text-gray-900 leading-tight group-hover:text-[#1677ff] transition-colors">
              {item.name}
            </h3>
          </div>
          <span className={`px-2.5 py-0.5 text-[11px] font-medium rounded-full border ${color}`}>
            {item.ringKeyName}
          </span>
        </div>

        <div className="pl-9">
          <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2">{description}</p>
          <div className="pt-2 h-6 flex items-center">
            <span className="text-xs font-bold text-[#1677ff] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              查看更多 <span className="text-[10px]">›</span>
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="text-xs text-gray-500 mb-4 px-1">
        探索该象限中的所有技术亮点，点击卡片，可查看技术详情与建议。
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto min-h-0 pr-2 -mr-2 pb-4">
        <div className="flex flex-col">{items.map(renderItem)}</div>

        {(hasMore || loading) && (
          <div ref={loadingRef} className="py-4 flex items-center justify-center gap-2">
            <Spin size="small" />
          </div>
        )}

        {!hasMore && items.length > 0 && (
          <div className="py-6 text-center text-xs text-gray-400">已经到底啦 ~</div>
        )}
        {!loading && items.length === 0 && (
          <div className="py-6 text-center text-xs text-gray-400">暂无数据</div>
        )}
      </div>
    </div>
  )
}

export default List
