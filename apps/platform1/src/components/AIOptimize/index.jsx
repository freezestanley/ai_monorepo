import React, { useState, useRef, useEffect } from "react"
import { useLocation } from "react-router-dom"
import queryString from "query-string"
import { Modal, Button, message, Tooltip, Popconfirm } from "antd"
import "./index.scss"
import { Sender } from "@ant-design/x"
import { fetchEventSource } from "@microsoft/fetch-event-source"
import { getTokenAndServiceName } from "@/api/sso"
import { botPrefix } from "@/constants"
import AILoading from "./AILoading"
import { CheckOutlined } from "@ant-design/icons"
import CopyToClipboard from "react-copy-to-clipboard"
import { isStudio } from "@/config.env"

const AIOptimize = ({
  onSubmit,
  buttonText = "优化",
  buttonProps = {},
  originalPrompt = "",
  intelligentAgentNo,
  intelligentAgentType,
  disabled
}) => {
  const [visible, setVisible] = useState(false)
  const [value, setValue] = useState("")
  const [loading, setLoading] = useState(false)
  const [streamContent, setStreamContent] = useState("")
  const [receivedData, setReceivedData] = useState(false)
  const scrollRef = useRef(null)
  const controllerRef = useRef(null)
  const hasReceivedDataRef = useRef(false)
  const contentLengthRef = useRef(0)
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)
  const { botNo, studioenv } = queryParams

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [streamContent])

  const handleOptimize = async () => {
    setLoading(true)
    setStreamContent("")
    setReceivedData(false)
    hasReceivedDataRef.current = false
    contentLengthRef.current = 0
    const controller = new AbortController()
    controllerRef.current = controller

    try {
      await fetchEventSource(
        `${botPrefix}/admin/prompt/${intelligentAgentType}/${intelligentAgentNo}/optimize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            "X-Usercenter-Session": getTokenAndServiceName().token,
            ...(isStudio() ? { botno: botNo || undefined, studioenv: studioenv || "prd" } : {})
          },
          body: JSON.stringify({
            originalPrompt,
            notes: value || ""
          }),
          signal: controller.signal,
          onmessage(event) {
            try {
              const data = JSON.parse(event.data)
              if (data.data) {
                hasReceivedDataRef.current = true
                setReceivedData(true)
                setStreamContent((prev) => {
                  const newContent = prev + data.data
                  contentLengthRef.current = newContent.length
                  return newContent
                })
              }
              if (onSubmit) {
                onSubmit(data)
              }
            } catch (error) {
              console.error("Failed to parse message:", error)
              setStreamContent("")
              message.error("优化失败，请重试")
            }
          },
          onclose() {
            setLoading(false)
            if (!hasReceivedDataRef.current && contentLengthRef.current === 0) {
              message.warning("未获取到优化内容，请重试")
            }
          },
          onerror(error) {
            console.error("Stream failed:", error)
            setLoading(false)
            controller.abort()
          }
        }
      )
    } catch (error) {
      console.error("Failed to optimize:", error)
      setLoading(false)
    }
  }

  const handleStopGenerate = () => {
    if (controllerRef.current) {
      controllerRef.current.abort()
      controllerRef.current = null
      setLoading(false)
    }
  }

  const handleClose = () => {
    setValue("")
    setStreamContent("")
    setVisible(false)
  }

  // const handleCopy = async () => {
  //   try {
  //     await navigator.clipboard.writeText(streamContent)
  //     message.success("复制成功")
  //   } catch (err) {
  //     message.error("复制失败")
  //   }
  // }

  const handleReplace = () => {
    if (onSubmit) {
      onSubmit({ type: "agent", content: streamContent })
    }
    handleClose()
  }

  return (
    <>
      <div
        className={`ai-optimize-button ${!originalPrompt || disabled ? "cursor-not-allowed opacity-50" : ""}`}
        onClick={() => !disabled && originalPrompt && setVisible(true)}
        {...buttonProps}
      >
        <i className="iconfont icon-zhinengyouhua align-middle font-[400] -mr-[3px]"></i>
        优化
      </div>
      <Modal
        className="ai-optimize-modal"
        title={
          <div className="ai-optimize-title w-[100px]">
            <span className="text-[16px] text-[#181B25] font-[600]">优化</span>
          </div>
        }
        open={visible}
        onCancel={(e) => {
          if (streamContent || loading) {
            e.stopPropagation()
          } else {
            handleClose()
          }
        }}
        closeIcon={
          streamContent || loading ? (
            <Popconfirm
              title="确认关闭"
              description="当前生成的优化内容还未被替换，是否关闭当前弹窗？"
              onConfirm={handleClose}
              okText="确认"
              cancelText="取消"
            >
              <span className="cursor-pointer ">×</span>
            </Popconfirm>
          ) : (
            <span className="cursor-pointer">×</span>
          )
        }
        okText="确定"
        cancelText="取消"
        footer={false}
        width={480}
        destroyOnClose
      >
        <div className="ai-optimize-content">
          {streamContent && (
            <>
              <div
                ref={scrollRef}
                className="my-4 bg-[#fff] rounded-lg max-h-[400px] overflow-y-auto"
              >
                <div className="text-[14px] text-[#000] whitespace-pre-wrap break-words">
                  {streamContent}
                </div>
              </div>
              {!loading && (
                <div className="flex justify-between items-center mb-4">
                  <span
                    onClick={handleReplace}
                    className="text-[#7F56D9] hover:opacity-80 cursor-pointer"
                  >
                    <CheckOutlined className="mr-2" />
                    替换
                  </span>
                  <div className="flex gap-2">
                    <CopyToClipboard
                      text={`${streamContent}`}
                      onCopy={() => message.success("复制成功")}
                    >
                      <Tooltip title="复制">
                        <i
                          // onClick={handleCopy}
                          className="iconfont icon-fuzhi text-[18px] cursor-pointer -mt-[3px] text-[#98A2B3] hover:text-[#7F56D9]"
                        ></i>
                      </Tooltip>
                    </CopyToClipboard>

                    <Tooltip title="重新生成">
                      <i
                        onClick={() => {
                          setStreamContent("")
                          handleOptimize()
                        }}
                        className="iconfont icon-refresh-ccw-04 text-[15px] cursor-pointer text-[#98A2B3] hover:text-[#7F56D9]"
                      ></i>
                    </Tooltip>
                  </div>
                </div>
              )}
            </>
          )}
          {loading ? (
            <AILoading />
          ) : (
            !streamContent && (
              <Button
                icon={
                  <i className="iconfont icon-zhinengyouhua align-middle font-[400] -mr-[3px]"></i>
                }
                className="text-[#7f56d9] mb-[8px]"
                onClick={handleOptimize}
              >
                自动优化
              </Button>
            )
          )}

          <Sender
            className="mt-[8px] sender-larger"
            placeholder="你希望如何编写或优化你的提示词？"
            loading={loading}
            value={value}
            onChange={(v) => {
              setValue(v)
            }}
            onSubmit={handleOptimize}
            onCancel={handleStopGenerate}
          />
          <div className="text-[#98A2B3] text-[12px] text-center mt-[8px]">
            内容由AI生成，无法确保真实准确，仅供参考。
          </div>
        </div>
      </Modal>
    </>
  )
}

export default AIOptimize
