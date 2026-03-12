import { useState, useCallback } from "react"
import { Worker, Viewer, SpecialZoomLevel } from "@react-pdf-viewer/core"
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout"
import "@react-pdf-viewer/core/lib/styles/index.css"
import "@react-pdf-viewer/default-layout/lib/styles/index.css"
import "@react-pdf-viewer/toolbar/lib/styles/index.css"
import "./index.scss"

const PDFViewer = ({
  fileUrl,
  height = "100vh",
  initialPage = 0,
  onPageChange,
  onZoomChange,
  className = ""
}) => {
  const [currentPage, setCurrentPage] = useState(initialPage + 1)
  const [totalPages, setTotalPages] = useState(0)
  const [zoomLevel, setZoomLevel] = useState(100)

  // 自定义工具栏
  const renderToolbar = useCallback(
    (Toolbar) => (
      <Toolbar>
        {(slots) => {
          const {
            CurrentPageInput,
            GoToNextPage,
            GoToPreviousPage,
            NumberOfPages,
            ZoomIn,
            ZoomOut,
            Zoom
          } = slots

          return (
            <div className="pdf-custom-toolbar">
              <div className="pdf-navigation">
                <GoToPreviousPage>
                  {(props) => (
                    <button
                      className="pdf-nav-button"
                      onClick={props.onClick}
                      disabled={props.isDisabled}
                      title="上一页"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                      </svg>
                    </button>
                  )}
                </GoToPreviousPage>

                <div className="pdf-page-info">
                  <CurrentPageInput />
                  <span className="pdf-page-separator"> / </span>
                  <NumberOfPages />
                </div>

                <GoToNextPage>
                  {(props) => (
                    <button
                      className="pdf-nav-button"
                      onClick={props.onClick}
                      disabled={props.isDisabled}
                      title="下一页"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                      </svg>
                    </button>
                  )}
                </GoToNextPage>
              </div>

              <div className="pdf-zoom-controls">
                <ZoomOut>
                  {(props) => (
                    <button
                      className="pdf-zoom-button"
                      onClick={props.onClick}
                      disabled={props.isDisabled}
                      title="缩小"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 13H5v-2h14v2z" />
                      </svg>
                    </button>
                  )}
                </ZoomOut>

                <Zoom>
                  {(props) => (
                    <span className="pdf-zoom-level">{Math.round(props.scale * 100)}%</span>
                  )}
                </Zoom>

                <ZoomIn>
                  {(props) => (
                    <button
                      className="pdf-zoom-button"
                      onClick={props.onClick}
                      disabled={props.isDisabled}
                      title="放大"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                      </svg>
                    </button>
                  )}
                </ZoomIn>
              </div>
            </div>
          )
        }}
      </Toolbar>
    ),
    []
  )

  // 创建默认布局插件
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: () => [], // 隐藏侧边栏
    renderToolbar
  })

  // 页面变化处理
  const handlePageChange = useCallback(
    (e) => {
      const newPage = e.currentPage + 1
      setCurrentPage(newPage)
      onPageChange?.(e.currentPage)
    },
    [onPageChange]
  )

  // 文档加载完成处理
  const handleDocumentLoad = useCallback((e) => {
    setTotalPages(e.doc.numPages)
  }, [])

  // 缩放变化处理
  const handleZoomChange = useCallback(
    (e) => {
      const newZoom = Math.round(e.scale * 100)
      setZoomLevel(newZoom)
      onZoomChange?.(newZoom)
    },
    [onZoomChange]
  )

  return (
    <div className={`pdf-viewer-container ${className}`}>
      <Worker workerUrl="/pdf.worker.min.js">
        <div
          className="pdf-viewer-wrapper"
          style={{ height: typeof height === "number" ? `${height}px` : height }}
        >
          <Viewer
            fileUrl={fileUrl}
            plugins={[defaultLayoutPluginInstance]}
            onPageChange={handlePageChange}
            onDocumentLoad={handleDocumentLoad}
            onZoom={handleZoomChange}
            defaultScale={SpecialZoomLevel.PageWidth}
          />
        </div>
      </Worker>
    </div>
  )
}

export default PDFViewer
