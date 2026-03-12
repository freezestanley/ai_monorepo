import { useEffect, useRef, useState } from "react"
import usePlaceholderLogic from "./usePlaceholderLogic"

export function useSelectionActions(
  quillRef,
  { setActionBarPosition, setShowActionBar, setShowAIMenu, showAIMenu }
) {
  const [selectionRange, setSelectionRange] = useState(null)
  const [insertPosition, setInsertPosition] = useState(null)

  const {
    showPlaceholder,
    setShowPlaceholder,
    placeholderPosition,
    placeholderPositionStyle,
    showPlaceholderRef,
    checkCursorAtStartOfLine
  } = usePlaceholderLogic(quillRef)

  // 当用户选中文本或改变选中范围时调用。
  const handleSelectionChange = (range) => {
    checkCursorAtStartOfLine()

    if (range && range.length > 0) {
      const editor = quillRef.current.getEditor()

      // 获取所选文本的内容
      const selectedText = editor.getText(range.index, range.length)

      // 统计所选文本的行数
      const lines = selectedText.split("\n").length

      // 获取所选文本的最后一行的bounds
      const lastLineIndex = range.index + range.length - (lines === 1 ? 0 : 1)
      const boundsLastLine = editor.getBounds(lastLineIndex)

      // 获取所选文本的起始位置的bounds
      const boundsStart = editor.getBounds(range.index)
      // 设置动作条的位置并显示
      const adjustedTop = boundsLastLine.top + boundsLastLine.height
      setActionBarPosition({ top: adjustedTop, left: boundsStart.left })
      setShowActionBar(true)
      setShowAIMenu(true)
      // 保存当前选中的范围
      setSelectionRange(range)
      // 为选中的文本设置背景颜色
      editor.formatText(range.index, range.length, "background", "#b3d7fe")
    } else if (!showRewriteOptions) {
      console.log(showRewriteOptions)
      // 如果没有文本被选中，并且重写选项没有显示，则清除背景颜色并隐藏动作条。
      clearSelectionBackground()
      setShowActionBar(false)
      setSelectionRange(null)
    }
  }

  // 清除选中文本的背景颜色。
  const clearSelectionBackground = () => {
    if (selectionRange) {
      const editor = quillRef.current.getEditor()
      editor.formatText(selectionRange.index, selectionRange.length, "background", false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      checkCursorAtStartOfLine()
    }
    // 检查是否按下的是空格键
    if (e.key === " " && showPlaceholderRef.current) {
      e.preventDefault() // 阻止空格键的默认行为

      const quill = quillRef.current.getEditor()
      const currentRange = quill.getSelection()

      console.log(currentRange)

      if (currentRange) {
        setInsertPosition(currentRange.index)
        const bounds = quill.getBounds(currentRange.index)
        const adjustedTop = bounds.top + bounds.height
        setActionBarPosition({ top: adjustedTop - 34, left: bounds.left })
      }

      setShowActionBar(true)
    }
  }

  useEffect(() => {
    // 为编辑器添加键盘事件监听
    const quillContainer = quillRef.current.getEditor().container
    quillContainer.addEventListener("keydown", handleKeyPress)

    return () => {
      // cleanup listener
      quillContainer.removeEventListener("keydown", handleKeyPress)
    }
  }, [])

  return {
    placeholderPositionStyle,
    selectionRange,
    setSelectionRange,
    handleSelectionChange,
    clearSelectionBackground,
    showPlaceholder,
    placeholderPosition,
    insertPosition,
    setInsertPosition,
    setShowPlaceholder
  }
}

export default useSelectionActions
