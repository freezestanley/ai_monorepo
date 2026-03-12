import { useState, useEffect, useRef, useCallback } from "react"
import { Popover, Spin, Typography, Descriptions, message } from "antd"
import { fetchSplitLog } from "@/api/knowledge/api"

const { Text, Paragraph } = Typography

const ParseStatusPopover = ({ record, children }) => {
  const [loading, setLoading] = useState(false)
  const [logData, setLogData] = useState(null)

  const intervalRef = useRef(null)
  const requestRef = useRef(null)

  // 清理函数
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (requestRef.current) {
      // 如果有正在进行的请求，可以考虑取消（取决于API实现）
      requestRef.current = null
    }
    setLoading(false)
  }, [])

  // 获取分割日志数据
  const fetchLogData = useCallback(async () => {
    if (!record) return
    try {
      setLoading(true)

      const response = await fetchSplitLog(record)

      if (response?.success) {
        const data = response.data
        setLogData(data)

        // 检查是否需要停止递归：status为0或1时停止
        if (data?.status === 0 || data?.status === 1) {
          cleanup()
          return
        }
      } else {
        response.message && message.error(response.message)
      }
    } catch (err) {
      err.message && message.error(err.message)
      console.error("fetchSplitLog error:", err)
    } finally {
      setLoading(false)
    }
  }, [record, cleanup])

  // 开始递归调用
  const startPolling = useCallback(() => {
    // 立即执行一次
    fetchLogData()

    // 设置定时器递归调用（每3秒调用一次）
    intervalRef.current = setInterval(() => {
      fetchLogData()
    }, 3000)
  }, [fetchLogData])

  // 处理悬浮框显示变化
  const handleVisibleChange = (newVisible) => {
    if (newVisible) {
      // 开始轮询
      startPolling()
    } else {
      // 停止轮询
      cleanup()
      setLogData(null)
    }
  }

  // 组件卸载时清理
  useEffect(() => {
    return cleanup
  }, [cleanup])

  // 渲染悬浮框内容
  const renderContent = () => {
    if (loading && !logData) {
      return (
        <div style={{ width: 300, textAlign: "center", padding: "20px 0" }}>
          <Spin />
          <div style={{ marginTop: 8 }}>加载中...</div>
        </div>
      )
    }
    if (!logData) {
      return (
        <div style={{ width: 300, textAlign: "center", padding: "20px 0" }}>
          <Text type="secondary">暂无数据</Text>
        </div>
      )
    }
    return (
      <div style={{ width: 350, maxWidth: 400, maxHeight: 400, overflowY: "auto" }}>
        <div style={{ marginBottom: 12, display: "flex", alignItems: "center" }}>
          {loading && <Spin size="small" style={{ marginLeft: 8 }} />}
        </div>
        <Descriptions size="small" column={1} bordered>
          <Descriptions.Item label="开始于">
            <Text>{logData.gmtCreated || "--"}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="持续时间">
            <Text code>{logData.cost ? `${(logData.cost / 1000).toFixed(2)}s` : "--"}</Text>
          </Descriptions.Item>
        </Descriptions>
        {/* 日志信息 */}
        {!!(logData.processLog || logData.errorInfo) && (
          <div style={{ marginTop: 12 }}>
            <Text strong style={{ fontSize: 14 }}>
              进度：
            </Text>
            <Paragraph style={{ margin: 0, fontSize: 12, whiteSpace: "pre-wrap" }} ellipsis={false}>
              {!!logData.errorInfo && (
                <div style={{ color: "red", marginBottom: 8 }}>【错误信息】{logData.errorInfo}</div>
              )}
              {logData.processLog}
            </Paragraph>
          </div>
        )}
      </div>
    )
  }

  return (
    <Popover
      content={renderContent()}
      title={null}
      trigger={["hover"]}
      overlayClassName="parse-status-popover"
      placement="bottom"
      onOpenChange={(newVisible) => handleVisibleChange(newVisible)}
    >
      <div className="cursor-pointer">{children}</div>
    </Popover>
  )
}

export default ParseStatusPopover
