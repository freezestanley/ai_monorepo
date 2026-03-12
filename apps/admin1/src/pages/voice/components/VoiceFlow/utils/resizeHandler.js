/**
 * 可拖动调整宽度的工具函数
 * 支持性能优化，使用节流和RAF优化拖动时的性能
 */

import { throttle } from "lodash"

// 默认配置
const DEFAULT_CONFIG = {
  minWidth: 400,
  maxWidth: 900,
  initialWidth: 680,
  resizeHandleWidth: 10,
  storageKey: "drawer_width"
}

/**
 * 初始化可调整抽屉宽度的拖动句柄
 * @param {Object} options 配置选项
 * @returns {Object} 返回宽度控制和事件处理函数
 */
export const useResizableDrawer = (options = {}) => {
  const config = { ...DEFAULT_CONFIG, ...options }

  // 尝试从localStorage获取上次保存的宽度
  const getSavedWidth = () => {
    try {
      const savedWidth = parseInt(localStorage.getItem(config.storageKey), 10)
      if (savedWidth && !isNaN(savedWidth)) {
        return Math.min(Math.max(savedWidth, config.minWidth), config.maxWidth)
      }
    } catch (e) {
      console.warn("Failed to get saved drawer width", e)
    }
    return config.initialWidth
  }

  // 保存宽度到localStorage
  const saveWidth = throttle((width) => {
    try {
      localStorage.setItem(config.storageKey, width.toString())
    } catch (e) {
      console.warn("Failed to save drawer width", e)
    }
  }, 500)

  // 开始拖动时的状态
  let isDragging = false
  let startPageX = 0
  let startWidth = 0
  let currentWidth = getSavedWidth()
  let drawerElement = null
  let onWidthChangeCallback = null

  // 设置拖动控制句柄的样式
  const getResizeHandleStyle = () => ({
    position: "absolute",
    top: 0,
    left: 0,
    width: `${config.resizeHandleWidth}px`,
    height: "100%",
    cursor: "col-resize",
    zIndex: 100,
    // 轻微的背景色，使拖动区域可见
    background: "rgba(0, 0, 0, 0.03)"
  })

  // 注册回调函数
  const setOnWidthChange = (callback) => {
    onWidthChangeCallback = callback
  }

  // 使用requestAnimationFrame优化拖动性能
  const updateWidthWithRAF = (newWidth) => {
    if (!isDragging) return

    window.requestAnimationFrame(() => {
      if (!drawerElement) {
        console.error("No drawer element available for width update")
        return
      }

      const clampedWidth = Math.min(Math.max(newWidth, config.minWidth), config.maxWidth)

      console.log("Updating drawer width:", {
        newWidth,
        clampedWidth,
        element: drawerElement
      })

      try {
        // 直接设置宽度样式
        drawerElement.style.width = `${clampedWidth}px`

        // 记录新的宽度
        currentWidth = clampedWidth

        // 触发回调
        if (onWidthChangeCallback) {
          onWidthChangeCallback(clampedWidth)
        }
      } catch (err) {
        console.error("Error updating drawer width:", err)
      }
    })
  }

  // 节流版本的宽度更新函数，减少DOM操作频率
  const throttledUpdateWidth = throttle(updateWidthWithRAF, 16) // 约60fps

  // 处理鼠标移动
  const handleMouseMove = (e) => {
    if (!isDragging) return

    e.preventDefault()
    const deltaX = e.pageX - startPageX
    const newWidth = startWidth - deltaX // 从右向左拖动，所以减去deltaX

    console.log("Resize drag", {
      pageX: e.pageX,
      deltaX,
      newWidth,
      currentElement: drawerElement
    })

    throttledUpdateWidth(newWidth)

    // 非节流的保存操作，只在拖动结束时保存
    if (isDragging) {
      saveWidth(newWidth)
    }
  }

  // 处理鼠标按下
  const handleMouseDown = (e, element) => {
    // 保存抽屉元素引用
    drawerElement = element
    if (!drawerElement) {
      console.error("No drawer element found for resize")
      return
    }

    console.log("Resize started", {
      pageX: e.pageX,
      startWidth: drawerElement.offsetWidth,
      element: drawerElement
    })

    isDragging = true
    startPageX = e.pageX
    startWidth = drawerElement.offsetWidth

    // 添加全局事件监听
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    // 添加全局样式以指示拖动状态
    document.body.classList.add("drawer-resizing")

    // 防止文本选择
    e.preventDefault()
  }

  // 处理鼠标松开
  const handleMouseUp = () => {
    if (!isDragging) return
    isDragging = false

    // 移除全局事件监听
    document.removeEventListener("mousemove", handleMouseMove)
    document.removeEventListener("mouseup", handleMouseUp)

    // 移除全局样式
    document.body.classList.remove("drawer-resizing")

    // 确保最终宽度被保存
    saveWidth(currentWidth)
  }

  // 清理函数
  const cleanup = () => {
    document.removeEventListener("mousemove", handleMouseMove)
    document.removeEventListener("mouseup", handleMouseUp)
    document.body.classList.remove("drawer-resizing")
    isDragging = false
  }

  return {
    handleMouseDown,
    getResizeHandleStyle,
    currentWidth,
    setOnWidthChange,
    cleanup
  }
}

export default useResizableDrawer
