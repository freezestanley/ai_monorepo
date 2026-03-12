import { Button, Modal, Tooltip, Popover, message, Spin } from "antd"
import { ImportOutlined, ExportOutlined } from "@ant-design/icons"
import { fetchExportReflect, fetchImportReflect } from "@/api/voiceRecord/api"
import { getFlowConfigDetails } from "@/api/voiceAgent/api"
import { downloadFileWithHeaders } from "@/api/tools"
import { getTokenAndServiceName } from "@/api/sso"
import React, { useRef, useState } from "react"

const Header = ({
  taskName = "语音模板",
  taskId,
  botNo,
  agentNo,
  status,
  flowType,
  onBack,
  onImport,
  onExport,
  onSave,
  loading = false,
  isDraft = false,
  showAutoLayoutTip = false, // 是否显示自动布局提示
  onSaveComplete, // 保存完成回调
  setCurrentFlowConfig, // 画布数据刷新方法
  onPropertyConfigClick, // 属性配置按钮点击回调
  isOnlyRead = false
}) => {
  // 根据isDraft显示对应的标签
  const getStatusTag = () => {
    // 优先显示草稿状态
    if (isDraft) return "草稿"

    // 如果不是草稿，显示"已保存"
    return "已保存"
  }

  // 获取状态标签的样式
  const getStatusTagStyle = () => {
    // 草稿状态使用橙色系
    if (isDraft) return { background: "#FEF0C7", color: "#B54708" }

    // 已保存状态使用绿色系
    return { background: "#D1FADF", color: "#027A48" }
  }

  // 处理返回按钮点击事件
  const handleBackClick = () => {
    // 如果有未保存的草稿，弹出确认框
    if (isDraft) {
      Modal.confirm({
        title: "提示",
        content: "当前画布还有草稿未保存，是否保存？",
        okText: "保存",
        cancelText: "不保存",
        onOk: async () => {
          // 调用保存方法
          await onSave()
          // 触发保存完成回调
          if (onSaveComplete) {
            onSaveComplete()
          }
          // 保存后返回
          if (onBack) {
            onBack()
          } else {
            window.history.back()
          }
        },
        onCancel: () => {
          // 不保存，直接返回
          window.history.back()
        }
      })
    } else {
      // 如果没有未保存的草稿，直接返回
      if (onBack) {
        onBack()
      } else {
        window.history.back()
      }
    }
  }

  const tag = getStatusTag()
  const tagStyle = getStatusTagStyle()

  // 处理保存按钮点击
  const handleSaveClick = async () => {
    await onSave()
    // 触发保存完成回调，用于隐藏提示
    if (onSaveComplete) {
      onSaveComplete()
    }
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
    } catch (error) {
      console.error("导出失败:", error)
      message.error("导出失败，请稍后重试")
    } finally {
      setExportLoading(false)
    }
  }

  // 处理导入功能（自定义input）
  const inputRef = useRef(null)
  const [importLoading, setImportLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

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
    setImportLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetchImportReflect({ botNo: botNo, agentNo: agentNo, formData })
      if (res?.status == 200) {
        // 导入成功后直接刷新画布详情
        setCurrentFlowConfig("success")
        message.success("导入成功，画布已刷新")
      } else {
        // 优先显示data字段内容，无论res是对象还是字符串
        let errorMessage = res.message || res.data || "导入失败"
        message.error(errorMessage)
      }
    } catch (error) {
      console.error("导入失败:", error)
      message.error("导入失败，请稍后重试")
    } finally {
      // 清空input，避免同文件无法重复上传
      e.target.value = ""
      setImportLoading(false)
    }
  }

  // 更多操作的内容
  const moreContent = (
    <div className="flex items-center space-x-6 py-3 px-5">
      {/* 自定义导入按钮 */}
      <div
        className={`flex flex-col items-center space-y-1 ${isOnlyRead ? "cursor-not-allowed" : "cursor-pointer"}`}
        onClick={handleImportClick}
      >
        <div className="flex items-center h-8 w-8 justify-center p-2 rounded-md bg-gray-100">
          <i className="iconfont icon-a-2 text-gray-600 text-md" />
        </div>
        <span className="text-xs text-gray-600">导入</span>
        <input
          ref={inputRef}
          disabled={isOnlyRead}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: "none" }}
          onChange={handleImportChange}
        />
      </div>
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
    </div>
  )

  return (
    <div
      className="flex items-center justify-between h-[60px] px-5 relative z-10"
      style={{ borderBottom: "1px solid #E4E7EC", background: "#fff" }}
    >
      <div className="flex items-center space-x-2">
        <button
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition cursor-pointer"
          onClick={handleBackClick}
        >
          <svg
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {tag && (
          <span className="px-2 py-0.5 text-xs rounded" style={tagStyle}>
            {tag}
          </span>
        )}
        <span className="text-base font-medium ml-2">{taskName || "语音模板"}</span>
        {flowType === 2 ? (
          <span className="text-[12px] text-gray-400 font-medium ml-2 align-bottom mt-1">
            剧本模式
          </span>
        ) : (
          <span className="text-[12px] text-gray-400 font-medium ml-2 align-bottom mt-1">
            画布模式
          </span>
        )}
      </div>
      <div className="flex items-center space-x-3">
        {/* <Button onClick={onImport} disabled={loading}>
            导入
          </Button>
          <Button onClick={onExport} disabled={loading}>
            导出
          </Button> */}
        {/* 保存按钮组 */}
        {/* <Button onClick={onPropertyConfigClick}>属性配置</Button>
        <Button>保存</Button>
        <Button color="primary" variant="outlined">
          预览与调试
        </Button> */}
        <Button.Group disabled={importLoading}>
          <Tooltip
            title={
              showAutoLayoutTip ? "当前为存量数据，系统已为您自动布局，请自行调整位置后保存" : ""
            }
            open={showAutoLayoutTip}
            placement="left"
            color="#722ED1"
            overlayInnerStyle={{
              backgroundColor: "#722ED1",
              color: "white",
              fontSize: "12px",
              padding: "8px 12px",
              borderRadius: "6px",
              width: "auto"
            }}
          >
            <Button
              type="primary"
              disabled={isOnlyRead}
              onClick={handleSaveClick}
              loading={loading}
            >
              {importLoading ? "导入中..." : "保存"}
            </Button>
          </Tooltip>

          {/* 更多操作按钮 */}
          <Popover
            content={moreContent}
            trigger="hover"
            placement="bottomRight"
            overlayClassName="p-0"
            overlayInnerStyle={{
              padding: 0,
              borderRadius: "8px"
            }}
          >
            <Button
              type="primary"
              className="flex items-center justify-center px-2"
              disabled={loading}
            >
              <div className="flex items-center space-x-0.5">
                <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
                <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
                <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
              </div>
            </Button>
          </Popover>
        </Button.Group>
      </div>
    </div>
  )
}

export default Header
