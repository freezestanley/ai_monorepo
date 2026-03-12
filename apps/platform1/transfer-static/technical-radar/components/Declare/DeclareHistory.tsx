import React, { useState, useEffect, useRef, useCallback } from "react"
import { Empty, Spin } from "antd"
import { queryTechnicalDeclarationHistory } from "../../../services/technicalRadar"
import styles from "./index.module.scss"

interface HistoryItem {
  id: string
  name: string
  approveStatus: string
  approveStatusName: string
  technologyNo: number
  status: "approving" | "reject" | "pass"
}

const DeclareHistory: React.FC = () => {
  const [list, setList] = useState<HistoryItem[]>([])
  // 初始加载状态为true，防止空状态闪现
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const isLoadingRef = useRef(false)
  const loadingRef = useRef<HTMLDivElement>(null)
  const pageSize = 5 // 恢复为5，避免过度请求

  // 加载数据
  const loadData = useCallback(async (pageNum: number) => {
    // 防止重复请求
    if (isLoadingRef.current) return
    setLoading(true)
    isLoadingRef.current = true
    try {
      const param = { pageNum, pageSize }
      const res = await queryTechnicalDeclarationHistory(param)

      // 兼容处理响应结构：可能是数组或对象
      const rawData = res.data
      let newData: HistoryItem[] = []
      let total = res.totalCount || 0

      if (Array.isArray(rawData)) {
        newData = rawData
      } else if (rawData && Array.isArray(rawData.list)) {
        newData = rawData.list
        total = rawData.totalCount || res.totalCount || 0
      }

      // 更新列表数据
      setList((prev) => {
        if (pageNum === 1) {
          return newData
        }
        return [...prev, ...newData]
      })

      // 判断是否还有更多数据
      // 1. 如果当前页数据少于pageSize，说明已经是最后一页
      if (newData.length < pageSize) {
        setHasMore(false)
      }
      // 2. 如果总数有效，且当前加载总数已达到总数
      else if (total > 0) {
        // 注意：这里我们无法直接获取最新的list长度，只能通过计算推断
        // 但由于setList是异步的，我们使用prev callback方式更安全，但在判断逻辑中
        // 我们假设pageNum递增是连续的。
        // 更准确的是：如果是第一页，总数就是newData.length
        // 如果不是第一页，我们假设之前的 list 已经加载了 (pageNum - 1) * pageSize ? 不一定
        // 所以这里其实有点风险。
        // 但由于我们有 newData.length < pageSize 的兜底，通常足够了。
        // 另外，如果 total 存在，我们可以用 setList 里的 prev.length + newData.length
        // 但这里拿不到 prev。
        // 我们可以简单判断：如果 currentTotal >= total

        // 修正：在外部无法准确拿到最新的 list 状态用于比较 total，除非用 useEffect 监听 list 变化
        // 或者依赖 newData.length < pageSize 作为主要判断。
        // 这里暂时保留简单判断，如果 newData 满了，但 total 到了，可能需要下次空请求来确认。
        // 或者我们相信 pageSize 填满意味着还有更多（除非刚好填满且是最后一页）

        // 更好的逻辑：
        // 如果后端返回了 total，我们可以根据 pageNum * pageSize >= total 来判断吗？
        if (pageNum * pageSize >= total) {
          setHasMore(false)
        }
      }
    } catch (error) {
      console.error("加载申报记录失败", error)
      setHasMore(false)
    } finally {
      setLoading(false)
      isLoadingRef.current = false
    }
  }, []) // 移除依赖，使其稳定

  // 初始加载
  useEffect(() => {
    loadData(1)
  }, [loadData])

  // 无限滚动监听
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // 如果可见、还有更多数据、且不在加载中
        if (entries[0].isIntersecting && hasMore && !isLoadingRef.current) {
          const nextPage = page + 1
          setPage(nextPage)
          loadData(nextPage)
        }
      },
      { threshold: 0.1 }
    )

    if (loadingRef.current) {
      observer.observe(loadingRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, page, loadData, loading])

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "approving":
        return { className: styles.statusPending }
      case "reject":
        return { className: styles.statusRejected }
      case "pass":
        return { className: styles.statusApproved }
      default:
        return { className: "" }
    }
  }

  // 列表渲染
  const renderList = () => {
    return list.map((item) => {
      const statusConfig = getStatusConfig(item.approveStatus)
      return (
        <div key={item.technologyNo} className={styles.historyItem}>
          <span className={styles.itemName}>{item.name}</span>
          <span className={`${styles.itemStatus} ${statusConfig.className}`}>
            {item.approveStatusName}
          </span>
        </div>
      )
    })
  }

  const renderEmpty = () => <Empty />

  return (
    <div className={styles.historyContainer}>
      <div className={styles.historyTitle}>申报记录</div>
      <div className={styles.historyList} ref={containerRef}>
        {list?.length > 0 ? renderList() : !loading && renderEmpty()}

        {(hasMore || loading) && (
          <div
            ref={loadingRef}
            className={styles.loadingWrapper}
            style={{ minHeight: "20px", display: "flex", justifyContent: "center" }}
          >
            {loading && <Spin size="small" />}
          </div>
        )}
        {!hasMore && list.length > 0 && <div className={styles.noMoreText}>没有更多记录了</div>}
      </div>
    </div>
  )
}

export default DeclareHistory
