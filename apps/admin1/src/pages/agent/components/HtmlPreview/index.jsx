import React, { useEffect, useRef, useState, useCallback } from "react"
import { Button, Tooltip, Modal, Empty, Image, Segmented, message } from "antd"
import {
  FullscreenOutlined,
  FullscreenExitOutlined,
  DownloadOutlined,
  ZoomInOutlined,
  ZoomOutOutlined
} from "@ant-design/icons"
import LoadingPlaceholder from "@/components/LoadingPlaceholder"
import html2canvas from "html2canvas"
import "./htmlPreview.less"

// ==================== 常量 ====================
const CONSTANTS = {
  DEVICE_MODE: "desktop",
  OFFSCREEN_WIDTH: 1200,
  OFFSCREEN_HEIGHT: 800,
  LOAD_TIMEOUT: 500,
  IMAGE_LOAD_TIMEOUT: 100,
  DEFAULT_IMAGE_NAME: "image.jpg",
  PROXY_URLS: {
    WESERV: "https://images.weserv.nl/",
    ISOMORPHIC: "https://cors.isomorphic-git.org/"
  },
  SCROLLBAR_STYLES: `
    <style>
      ::-webkit-scrollbar { width: 1px; height: 1px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(200, 200, 200, 0.3); border-radius: 5px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(150, 150, 150, 0.5); }
      * { scrollbar-width: thin; scrollbar-color: rgba(200, 200, 200, 0.4) transparent; }
    </style>
  `
}

// ==================== 工具函数 ====================

/** 检查字符串是否为有效内容 */
const isValidContent = (content) => typeof content === "string" && content.trim().length > 0

/** 获取 URL 的代理候选列表 */
const getProxyCandidates = (url) => {
  try {
    const u = new URL(url)
    const raw = u.toString()
    const weserv = `${CONSTANTS.PROXY_URLS.WESERV}?url=${encodeURIComponent(
      "ssl:" + u.hostname + u.pathname + u.search
    )}`
    const isomorphic = `${CONSTANTS.PROXY_URLS.ISOMORPHIC}${raw}`
    return [raw, weserv, isomorphic]
  } catch {
    return [url]
  }
}

/** 将 Blob 转换为 DataURL */
const blobToDataURL = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })

/** 从 URL 获取 DataURL（带代理回退） */
const fetchAsDataURLWithFallback = async (url) => {
  let lastError
  for (const candidate of getProxyCandidates(url)) {
    try {
      const res = await fetch(candidate, {
        mode: "cors",
        credentials: "omit",
        cache: "force-cache"
      })
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status}`)
        continue
      }
      const blob = await res.blob()
      return await blobToDataURL(blob)
    } catch (e) {
      lastError = e
    }
  }
  throw lastError || new Error("所有代理均失败")
}

/** 解析相对 URL 为绝对 URL */
const resolveUrl = (raw, baseHref) => {
  try {
    return new URL(raw, baseHref).toString()
  } catch {
    return raw
  }
}

/** 获取 HTML 文档的基础 URL */
const getBaseHref = (doc) => doc.querySelector("base")?.href || window.location.href

/** 为 HTML 注入滚动条样式 */
const injectScrollbarStyles = (html) => {
  if (!isValidContent(html)) return ""
  return html.includes("</head>")
    ? html.replace("</head>", CONSTANTS.SCROLLBAR_STYLES + "</head>")
    : CONSTANTS.SCROLLBAR_STYLES + html
}

/** 将 HTML 中的所有图片转换为 DataURL */
const inlineImagesInHtml = async (html) => {
  if (!isValidContent(html)) return html
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, "text/html")
    const baseHref = getBaseHref(doc)
    const imgs = Array.from(doc.querySelectorAll("img"))

    await Promise.all(
      imgs.map(async (img) => {
        const src = img.getAttribute("src") || ""
        if (!src || src.startsWith("data:")) return
        try {
          const resolved = resolveUrl(src, baseHref)
          const dataUrl = await fetchAsDataURLWithFallback(resolved)
          img.setAttribute("src", dataUrl)
          img.removeAttribute("srcset")
          img.setAttribute("crossorigin", "anonymous")
          img.setAttribute("referrerpolicy", "no-referrer")
        } catch {
          // 单个图片失败不阻塞整体
        }
      })
    )
    return doc.documentElement?.outerHTML || html
  } catch {
    return html
  }
}

/** 等待 Promise 延迟 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** 下载文件 */
const downloadFile = (url, filename) => {
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// ==================== 子组件 ====================

/** 图片预览内容 */
const ImagePreviewContent = ({ image, isGenerating, onDownload }) => {
  if (isGenerating) {
    return <LoadingPlaceholder title="图片生成中..." />
  }
  if (!image) {
    return <Empty className="mt-5" description="暂无图片内容" />
  }
  return (
    <div className="image-preview-wrapper">
      <div className="image-preview-container">
        <Image
          src={image}
          alt="Preview"
          preview={{
            mask: "预览",
            toolbarRender: (_, { actions: { onZoomIn, onZoomOut } }) => (
              <div className="image-preview-toolbar">
                <Button
                  type="text"
                  size="small"
                  icon={<ZoomOutOutlined />}
                  onClick={onZoomOut}
                  title="缩小"
                />
                <Button
                  type="text"
                  size="small"
                  icon={<ZoomInOutlined />}
                  onClick={onZoomIn}
                  title="放大"
                />
                <Button
                  type="text"
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={onDownload}
                  title="下载"
                />
              </div>
            )
          }}
          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
        />
      </div>
    </div>
  )
}

/** HTML 预览内容 */
const HtmlPreviewContent = ({ htmlContent, iframeRef, onLoad }) => {
  if (!isValidContent(htmlContent)) {
    return <Empty description="暂无预览内容" />
  }
  return (
    <div className="html-preview-wrapper device-desktop">
      <iframe
        ref={iframeRef}
        className="html-preview-iframe"
        title="HTML Preview"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        srcDoc={htmlContent}
        onLoad={onLoad}
      />
    </div>
  )
}

/** 工具栏 */
const ToolBar = ({
  hasHtml,
  hasImage,
  currentView,
  onViewChange,
  isFullscreenMode,
  onFullscreenToggle
}) => {
  return (
    <div className="html-preview-toolbar">
      <div className="html-preview-toolbar-spacer" />
      <div
        className="html-preview-toolbar-icons flex justify-between items-center w-[100%]"
        style={{ gap: 8 }}
      >
        {(hasHtml || hasImage) && (
          <Segmented
            size="small"
            options={[
              { label: "HTML", value: "HTML", disabled: !hasHtml },
              { label: "图片", value: "IMAGE", disabled: !hasImage }
            ]}
            value={currentView}
            onChange={onViewChange}
          />
        )}
        {currentView === "HTML" ? (
          <Tooltip title={isFullscreenMode ? "退出全屏" : "全屏查看"}>
            <Button
              type="text"
              size="small"
              icon={isFullscreenMode ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={onFullscreenToggle}
              className="html-preview-icon-btn"
            />
          </Tooltip>
        ) : (
          <div className="w-[36px] h-[36px]" />
        )}
      </div>
    </div>
  )
}

/** 全屏模态框 */
const FullscreenModal = ({ isOpen, onClose, view, image, htmlContent, deviceMode }) => {
  return (
    <Modal
      title="预览 - 全屏模式"
      open={isOpen}
      onCancel={onClose}
      width="100vw"
      style={{ top: 0, padding: 0, margin: 0, maxWidth: "none" }}
      bodyStyle={{ height: "100vh", padding: 0, maxWidth: "100vw", maxHeight: "calc(100vh - 0px)" }}
      footer={null}
      className="html-preview-fullscreen-modal"
    >
      <div className="html-preview-fullscreen-content">
        {view === "IMAGE" ? (
          <div className="image-preview-wrapper">
            <div className="image-preview-container" style={{ background: "black" }}>
              {image ? (
                <Image
                  src={image}
                  alt="Preview"
                  preview={{ visible: false }}
                  style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                />
              ) : (
                <Empty description="暂无图片内容" />
              )}
            </div>
          </div>
        ) : (
          <div className={`html-preview-wrapper device-${deviceMode} fullscreen`}>
            <iframe
              className="html-preview-iframe"
              title="HTML Preview Fullscreen"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              srcDoc={htmlContent}
              style={{ overflow: "auto" }}
            />
          </div>
        )}
      </div>
    </Modal>
  )
}

// ==================== 主组件 ====================

/**
 * HTML/图片 预览组件
 * - 支持 HTML 渲染（iframe）
 * - 支持图片查看（点击图片进入预览大图）
 * - 支持在 HTML/图片 之间切换
 * - 支持全屏预览
 */
const HtmlPreview = ({
  htmlContent = "",
  imageUrl = "",
  isLoading = false,
  contentType = "html"
}) => {
  // 状态管理
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [generatedImage, setGeneratedImage] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [view, setView] = useState("HTML")

  // Refs
  const iframeRef = useRef(null)
  const lastAutoGenKeyRef = useRef("")

  // 内容有效性检查
  const hasHtml = isValidContent(htmlContent)
  const effectiveImage = imageUrl || generatedImage
  const hasImage = isValidContent(effectiveImage)

  // 显示内容（注入滚动条样式）
  const displayContent = injectScrollbarStyles(htmlContent)

  // 当前视图（如果只有一种内容，强制显示该内容）
  const currentView = hasHtml && hasImage ? view : hasImage ? "IMAGE" : "HTML"

  // 生成图片
  const generateImage = useCallback(async () => {
    if (!hasHtml) return
    try {
      setIsGenerating(true)
      const processedHtml = await inlineImagesInHtml(displayContent)

      // 创建离屏 iframe
      const offscreen = document.createElement("iframe")
      Object.assign(offscreen.style, {
        position: "fixed",
        left: "-10000px",
        top: "0",
        width: `${CONSTANTS.OFFSCREEN_WIDTH}px`,
        height: `${CONSTANTS.OFFSCREEN_HEIGHT}px`,
        visibility: "hidden"
      })
      offscreen.setAttribute("sandbox", "allow-same-origin allow-scripts")
      offscreen.srcdoc = processedHtml
      document.body.appendChild(offscreen)

      // 等待加载完成
      await new Promise((resolve) => {
        const done = () => resolve()
        offscreen.addEventListener("load", done, { once: true })
        setTimeout(done, CONSTANTS.LOAD_TIMEOUT)
      })

      const doc = offscreen.contentDocument
      if (!doc?.body) throw new Error("离屏 iframe 尚未就绪")

      // 等待图片加载
      const imgs = Array.from(doc.body.querySelectorAll("img"))
      await Promise.race([
        Promise.allSettled(
          imgs.map((img) =>
            img.complete && img.naturalWidth > 0
              ? Promise.resolve()
              : new Promise((res) => {
                  img.onload = () => res()
                  img.onerror = () => res()
                })
          )
        ),
        delay(CONSTANTS.IMAGE_LOAD_TIMEOUT)
      ])
      await delay(CONSTANTS.IMAGE_LOAD_TIMEOUT)

      // 计算尺寸
      const { body } = doc
      const width = Math.max(body.scrollWidth, body.offsetWidth, CONSTANTS.OFFSCREEN_WIDTH)
      const height = Math.max(body.scrollHeight, body.offsetHeight)

      // 生成图片
      const canvas = await html2canvas(body, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        scale: window.devicePixelRatio || 2,
        width,
        height,
        logging: false,
        imageTimeout: 0,
        foreignObjectRendering: true
      })

      setGeneratedImage(canvas.toDataURL("image/png"))
      offscreen.remove()
    } catch (e) {
      console.error("图片生成失败:", e)
      message.error("图片生成失败")
    } finally {
      setIsGenerating(false)
    }
  }, [hasHtml, displayContent])

  // HTML 就绪时自动生成图片
  useEffect(() => {
    if (!hasHtml || isGenerating) return
    const key = htmlContent
    if (lastAutoGenKeyRef.current === key) return
    ;(async () => {
      await generateImage()
      lastAutoGenKeyRef.current = key
    })()
  }, [htmlContent, hasHtml, isGenerating, generateImage])

  // HTML 变化时重置已生成图片
  useEffect(() => {
    setGeneratedImage("")
  }, [htmlContent])

  // 初始化视图
  useEffect(() => {
    if (contentType === "image" && hasImage) {
      setView("IMAGE")
    } else if (hasHtml) {
      setView("HTML")
    } else if (hasImage) {
      setView("IMAGE")
    }
  }, [contentType, hasHtml, hasImage])

  // 事件处理
  const handleDownloadImage = useCallback(() => {
    if (!effectiveImage) return
    const filename = effectiveImage.split("/").pop() || CONSTANTS.DEFAULT_IMAGE_NAME
    downloadFile(effectiveImage, filename)
  }, [effectiveImage])

  const handleViewChange = useCallback((val) => {
    setView(val)
  }, [])

  const handleFullscreenToggle = useCallback(() => {
    setIsFullscreen((prev) => !prev)
  }, [])

  return (
    <div className="html-preview-container">
      <ToolBar
        hasHtml={hasHtml}
        hasImage={hasImage}
        currentView={currentView}
        onViewChange={handleViewChange}
        isFullscreenMode={isFullscreen}
        onFullscreenToggle={handleFullscreenToggle}
      />
      {isLoading ? (
        <LoadingPlaceholder title="正在加载预览..." />
      ) : currentView === "IMAGE" ? (
        <ImagePreviewContent
          image={effectiveImage}
          isGenerating={isGenerating}
          onDownload={handleDownloadImage}
        />
      ) : (
        <HtmlPreviewContent htmlContent={displayContent} iframeRef={iframeRef} onLoad={() => {}} />
      )}
      <FullscreenModal
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        view={currentView}
        image={effectiveImage}
        htmlContent={displayContent}
        deviceMode={CONSTANTS.DEVICE_MODE}
      />
    </div>
  )
}

export default React.memo(HtmlPreview)
