import React, { useState, useEffect, useRef } from "react"
import { Drawer, Spin, message } from "antd"
import { getAudioTraceInfo } from "@/api/voiceAgent/api"

const AudioTraceDrawer = ({ open, onClose, callId, requestId }) => {
  const [loading, setLoading] = useState(false)
  const [htmlContent, setHtmlContent] = useState("")
  const iframeRef = useRef(null)

  useEffect(() => {
    if (open && requestId) {
      fetchAudioTraceInfo()
    }
  }, [open, requestId])

  useEffect(() => {
    if (iframeRef.current && htmlContent) {
      const iframe = iframeRef.current
      const doc = iframe.contentDocument || iframe.contentWindow.document

      // 写入完整的HTML内容
      doc.open()
      doc.write(htmlContent)
      doc.close()
    }
  }, [htmlContent])

  const fetchAudioTraceInfo = async () => {
    try {
      setLoading(true)
      const response = await getAudioTraceInfo({
        callId,
        requestId
      })

      if (response.status === 200) {
        setHtmlContent(response.data || "")
      } else {
        message.error(response.message || "获取追踪信息失败")
      }
    } catch (error) {
      message.error(error.message || "获取追踪信息失败")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setHtmlContent("")
    onClose()
  }

  return (
    <Drawer
      title="会话日志"
      placement="right"
      width={900}
      open={open}
      onClose={handleClose}
      destroyOnClose
      styles={{
        body: {
          padding: 0
        }
      }}
    >
      <div className="h-full overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Spin size="large" />
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            title="Audio Trace Content"
            sandbox="allow-scripts allow-same-origin"
          />
        )}
      </div>
    </Drawer>
  )
}

export default AudioTraceDrawer
