import React, { useRef, useState } from "react"
import { Button, Popover, message, Spin, Modal } from "antd"
import { fetchImportReflect } from "@/api/voiceRecord/api"
import { getTokenAndServiceName } from "@/api/sso"

const MoreActionsButton = ({
  loading = false,
  disabled = false,
  isPublishDisabled = false,
  placement = "bottomRight",
  trigger = "hover",
  botNo,
  agentNo,
  onImportSuccess,
  onExportSuccess,
  customActions = [],
  className = "",
  // 新增：用于导入提醒的信息
  botName = "",
  agentName = ""
}) => {
  const inputRef = useRef(null)
  const [importLoading, setImportLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

  // 处理导入功能
  const handleImportClick = () => {
    inputRef.current?.click()
  }

  const handleImportChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!botNo) {
      message.error("缺少必要参数botNo，无法导入")
      return
    }

    // 显示导入确认弹窗
    Modal.confirm({
      title: "导入提醒",
      content: (
        <div>
          <div className="mb-2">
            <div className="mb-2 flex flex-nowrap items-start">
              <div className="whitespace-nowrap">当前空间：</div>
              <div className="text-[#7F56D9] ml-1 break-all">{botName || "暂无匹配"}</div>
            </div>
          </div>
          <div className="mb-2 flex flex-nowrap items-start">
            <div className="whitespace-nowrap">当前Agent：</div>
            <div className="text-[#7F56D9] ml-1 break-all">{agentName || "暂无匹配"}</div>
          </div>
          <div>确认导入文件将覆盖当前画布数据，请确认操作无误！</div>
        </div>
      ),
      okText: "确认导入",
      cancelText: "取消",
      onOk: async () => {
        setImportLoading(true)
        try {
          const formData = new FormData()
          formData.append("file", file)
          const res = await fetchImportReflect({ botNo: botNo, agentNo: agentNo, formData })

          if (res?.status == 200) {
            message.success("导入成功，画布已刷新")
            // 触发导入成功回调
            if (onImportSuccess) {
              onImportSuccess(res)
            }
          } else {
            // 优先显示data字段内容，无论res是对象还是字符串
            let errorMessage = res.message || res.data || "导入失败"
            message.error(errorMessage)
          }
        } catch (error) {
          console.error("导入失败:", error)
          message.error("导入失败，请稍后重试")
        } finally {
          setImportLoading(false)
        }
      },
      onCancel: () => {
        // 取消时也要清空input
        e.target.value = ""
      }
    })

    // 清空input，避免同文件无法重复上传
    e.target.value = ""
  }

  // 处理导出功能
  const handleExport = async () => {
    if (!botNo) {
      message.error("缺少必要参数botNo，无法导出")
      return
    }

    setExportLoading(true)
    try {
      // 获取token和服务名
      const { token, serviceName } = await getTokenAndServiceName()

      // 构建URL
      const url = `/voiceAgentWeb/fin/api/v1/intention-script-config/reflect/export?agentNo=${agentNo}&botNo=${botNo}`

      // 发送请求
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "X-Auth-Token": token,
          "X-Service-Name": serviceName
        }
      })

      if (!response.ok) {
        throw new Error("导出请求失败")
      }

      // 从响应头中获取文件名
      const contentDisposition = response.headers.get("content-disposition")
      let filename = "voice_template_export.xlsx" // 默认文件名

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "")
          // 解码文件名（如果是URL编码的）
          try {
            filename = decodeURIComponent(filename)
          } catch (e) {
            // 如果解码失败，使用原始文件名
          }
        }
      }

      // 获取blob数据
      const blob = await response.blob()

      // 创建下载链接
      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // 释放URL对象
      setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl)
      }, 100)

      message.success("导出成功")

      // 触发导出成功回调
      if (onExportSuccess) {
        onExportSuccess({ filename, blob })
      }
    } catch (error) {
      console.error("导出失败:", error)
      message.error("导出失败，请稍后重试")
    } finally {
      setExportLoading(false)
    }
  }

  // 渲染自定义操作项
  const renderCustomActions = () => {
    return customActions.map((action, index) => (
      <div
        key={index}
        className="flex flex-col items-center space-y-1 cursor-pointer"
        onClick={action.onClick}
      >
        <div className="flex items-center h-8 w-8 justify-center p-2 rounded-md bg-gray-100">
          {action.loading ? (
            <Spin size="small" />
          ) : (
            action.icon || <i className="iconfont icon-default text-gray-600 text-md" />
          )}
        </div>
        <span className="text-xs text-gray-600">
          {action.loading ? action.loadingText || action.label : action.label}
        </span>
      </div>
    ))
  }

  // 更多操作的内容
  const moreContent = disabled ? null : (
    <div className="flex items-center space-x-6 py-3 px-5">
      {/* 导入按钮 */}
      <div
        className={`flex flex-col items-center space-y-1 ${isPublishDisabled ? "cursor-not-allowed" : "cursor-pointer"}`}
        onClick={handleImportClick}
      >
        <div className="flex items-center h-8 w-8 justify-center p-2 rounded-md bg-gray-100">
          {importLoading ? (
            <Spin size="small" />
          ) : (
            <i className="iconfont icon-a-2 text-gray-600 text-md" />
          )}
        </div>
        <span className="text-xs text-gray-600">{importLoading ? "导入中..." : "导入"}</span>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: "none" }}
          disabled={isPublishDisabled}
          onChange={handleImportChange}
        />
      </div>

      {/* 导出按钮 */}
      <div className="flex flex-col items-center space-y-1 cursor-pointer" onClick={handleExport}>
        <div className="flex items-center h-8 w-8 justify-center p-2 rounded-md bg-gray-100">
          {exportLoading ? (
            <Spin size="small" />
          ) : (
            <i className="iconfont icon-a-10 text-gray-600 text-md" />
          )}
        </div>
        <span className="text-xs text-gray-600">{exportLoading ? "导出中..." : "导出"}</span>
      </div>

      {/* 自定义操作项 */}
      {renderCustomActions()}
    </div>
  )

  return (
    <Popover
      content={moreContent}
      trigger={trigger}
      placement={placement}
      overlayClassName="p-0"
      overlayInnerStyle={{
        padding: 0,
        borderRadius: "8px"
      }}
    >
      <Button
        type="primary"
        className={`flex items-center justify-center px-2 ${className}`}
        disabled={disabled || loading}
      >
        <div className="flex items-center space-x-0.5">
          <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
          <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
          <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
        </div>
      </Button>
    </Popover>
  )
}

export default MoreActionsButton
