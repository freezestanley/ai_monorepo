// hooks/useAIMenuOperations.js
import { useState } from "react"

/**
 * useAIMenuOperations Hook
 * 用于处理与AI菜单相关的操作，如改写、续写和取消。
 *
 * @param {Object} quillRef - 编辑器的引用。
 * @param {Object} actions - 从父组件传递的一系列操作。
 * @returns {Object} - 返回一系列处理函数。
 */
export function useAIMenuOperations(
  quillRef,
  {
    clearSelectionBackground,
    setInsertPosition,
    setShowActionBar,
    insertPosition,
    setShowPlaceholder,
    selectionRange,
    setSelectionRange
  }
) {
  const [AIContent, setAIcontent] = useState("")

  // 使用新文本替换当前选中的文本。
  const replaceSelectedText = (replacementText) => {
    const quill = quillRef.current.getEditor()
    if (selectionRange) {
      quill.deleteText(selectionRange.index, selectionRange.length)
      quill.insertText(selectionRange.index, replacementText)
      // 替换文本后隐藏动作条。
      setShowActionBar(false)
      const { index } = selectionRange
      // 设置光标在改写文本后面
      quill.setSelection(index)
    }
  }

  // 续写
  const insertContinuedText = (content) => {
    const quill = quillRef.current.getEditor()
    const { index, length } = selectionRange
    clearSelectionBackground()
    quill.insertText(index + length, content)
    // 为了使光标放在插入文本后面
    quill.setSelection(index + length + content.length)
  }

  /**
   * clearStauts
   * 清除文本的背景颜色、隐藏动作条和隐藏占位符。
   */
  const clearStauts = () => {
    clearSelectionBackground()
    setShowActionBar(false)
    setShowPlaceholder(false)
  }

  /**
   * handleCancelRewrite
   * 取消改写操作，清除背景颜色，并将光标设置到文本的最后。
   *
   * @param {number} textLength - 当前文本的长度。
   */
  const handleCancelRewrite = (textLength) => {
    clearSelectionBackground()
    setShowActionBar(false)
    const quill = quillRef.current.getEditor()

    if (selectionRange) {
      // 当前有文本被选中的情况
      quill.setSelection(selectionRange.index + selectionRange.length, 0) // 聚焦在选中文本的最后面
      // setSelectionRange(null)
    } else {
      // 空格触发的情况
      quill.setSelection(insertPosition, 0) // 聚焦在当前行的末尾
    }
  }

  /**
   * handleApplyRewrite
   * 应用改写操作，替换选中的文本或在指定位置插入文本。
   */
  const handleApplyRewrite = (v) => {
    const quill = quillRef.current.getEditor()
    if (insertPosition !== null) {
      quill.insertText(insertPosition, v)
      setInsertPosition(null)
      quill.setSelection(insertPosition + v.length)
    } else {
      replaceSelectedText(v)
      // 这里也得重新定位光标
      quill.setSelection(selectionRange.index + v.length)
    }
    clearStauts()
  }

  /**
   * handleApplyContinueWriting
   * 应用续写操作，在选中的文本后或指定位置插入文本。
   */
  const handleApplyContinueWriting = (v) => {
    const quill = quillRef.current.getEditor()
    if (insertPosition !== null) {
      quill.insertText(insertPosition, v)
      setInsertPosition(null)
      quill.setSelection(insertPosition + v.length)
    } else {
      insertContinuedText(v)
    }
    clearStauts()
  }

  // 这个函数用来删除选中的文本
  const handleDelete = () => {
    const quill = quillRef.current.getEditor()
    if (!selectionRange) {
      setShowActionBar(false)
      quill.setSelection(insertPosition, 0) // 聚焦在当前行的末尾
      return
    }
    const { index, length } = selectionRange
    quill.deleteText(index, length)
    setShowActionBar(false)
    // 删除成功需要重新定位光标
    quill.setSelection(index)
  }

  const handleItemSelect = (item) => {
    console.log(item)
    const content =
      item.label + (item.selectedSubItem !== null ? item.submenu[item.selectedSubItem] : "")
    // 接口生成Content
    setAIcontent(content)
  }

  const handleUseAIContent = (v, action) => {
    console.log(v, action)
    if (action === "改写") {
      handleApplyRewrite(v)
    } else {
      handleApplyContinueWriting(v)
    }
  }

  return {
    handleCancelRewrite,
    handleApplyRewrite,
    handleApplyContinueWriting,
    handleDelete,
    AIContent,
    setAIcontent,
    handleItemSelect,
    handleUseAIContent
  }
}

export default useAIMenuOperations
