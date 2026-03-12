import { useState, useRef, useEffect } from "react"
import getCaretCoordinates from "textarea-caret"

const useVariableSuggestions = (variables, onChange) => {
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [filteredVariables, setFilteredVariables] = useState(variables)
  const textAreaRef = useRef(null)
  const [isComposing, setIsComposing] = useState(false)
  const [caretPosition, setCaretPosition] = useState(0)
  const [currentCaretPos, setCurrentCaretPos] = useState(0)

  const calculatePopoverPosition = (rect, coordinates) => {
    const popoverHeight = 300 // Popover 的预估高度
    const popoverWidth = 200 // Popover 的预估宽度
    const margin = 8 // 边距

    // 计算基础位置
    let top = rect.top + coordinates.top + window.scrollY
    let left = rect.left + coordinates.left + window.scrollX

    // 检查是否超出视口底部
    if (top + popoverHeight > window.innerHeight + window.scrollY) {
      // 如果超出底部，显示在光标上方
      top = rect.top + coordinates.top + window.scrollY - popoverHeight - margin
    } else {
      // 否则显示在光标下方
      top = top + coordinates.height + margin
    }

    // 检查是否超出视口右侧
    if (left + popoverWidth > window.innerWidth + window.scrollX) {
      left = window.innerWidth + window.scrollX - popoverWidth - margin
    }

    // 检查是否超出视口左侧
    if (left < window.scrollX) {
      left = window.scrollX + margin
    }

    // 检查是否超出视口顶部
    if (top < window.scrollY) {
      top = rect.top + coordinates.top + window.scrollY + coordinates.height + margin
    }

    return { top, left }
  }

  // 更新 Popover 位置
  const updatePopoverPosition = () => {
    if (showSuggestion && textAreaRef.current && textAreaRef.current.resizableTextArea) {
      const rect = textAreaRef.current.resizableTextArea.textArea.getBoundingClientRect()
      const coordinates = getCaretCoordinates(
        textAreaRef.current.resizableTextArea.textArea,
        currentCaretPos
      )
      const newPosition = calculatePopoverPosition(rect, coordinates)
      setPosition(newPosition)
    }
  }

  // 监听滚动事件
  useEffect(() => {
    if (showSuggestion) {
      const handleScroll = () => {
        updatePopoverPosition()
      }

      const handleResize = () => {
        updatePopoverPosition()
      }

      window.addEventListener("scroll", handleScroll, true)
      window.addEventListener("resize", handleResize)

      return () => {
        window.removeEventListener("scroll", handleScroll, true)
        window.removeEventListener("resize", handleResize)
      }
    }
  }, [showSuggestion, currentCaretPos])

  const handleVariableSuggestion = (inputValue, currentCaretPosition) => {
    setCurrentCaretPos(currentCaretPosition)

    if (inputValue[currentCaretPosition - 1] === "$") {
      const rect = textAreaRef.current.resizableTextArea.textArea.getBoundingClientRect()
      const coordinates = getCaretCoordinates(
        textAreaRef.current.resizableTextArea.textArea,
        currentCaretPosition
      )

      const position = calculatePopoverPosition(rect, coordinates)
      setPosition(position)
      setShowSuggestion(true)
      setFilteredVariables(variables)
      setHighlightedIndex(0)
    } else if (showSuggestion) {
      const prefix = inputValue.slice(
        inputValue.lastIndexOf("$", currentCaretPosition - 1),
        currentCaretPosition
      )

      if (!prefix.includes("$")) {
        setShowSuggestion(false)
      } else {
        const regex = new RegExp(`^${prefix.slice(1)}`, "i")
        const newFilteredVariables = variables.filter((variable) =>
          regex.test(variable.valueExpression)
        )

        setFilteredVariables(newFilteredVariables)
        setHighlightedIndex(0)

        if (newFilteredVariables.length === 0) {
          setShowSuggestion(false)
        }
      }
    } else {
      setHighlightedIndex(-1)
      setShowSuggestion(false)
    }
  }

  const handleInputChange = (event) => {
    const inputValue = event.target.value

    if (!isComposing) {
      const currentCaretPosition = textAreaRef.current.resizableTextArea.textArea.selectionEnd //当前光标位置
      handleVariableSuggestion(inputValue, currentCaretPosition)
    }

    if (onChange) {
      onChange(event)
    }
  }

  // 处理光标位置变化
  const handleSelectionChange = () => {
    if (showSuggestion && textAreaRef.current && textAreaRef.current.resizableTextArea) {
      const currentCaretPosition = textAreaRef.current.resizableTextArea.textArea.selectionEnd
      const inputValue = textAreaRef.current.resizableTextArea.textArea.value

      // 检查光标是否还在变量建议的有效范围内
      const lastDollarIndex = inputValue.lastIndexOf("$", currentCaretPosition - 1)
      if (lastDollarIndex === -1 || currentCaretPosition - lastDollarIndex > 50) {
        // 如果光标移动到了变量建议范围之外，隐藏建议
        setShowSuggestion(false)
      } else {
        // 更新光标位置并重新计算 Popover 位置
        setCurrentCaretPos(currentCaretPosition)
        updatePopoverPosition()
      }
    }
  }

  // 监听光标位置变化
  useEffect(() => {
    if (textAreaRef.current && textAreaRef.current.resizableTextArea) {
      const textArea = textAreaRef.current.resizableTextArea.textArea
      textArea.addEventListener("selectionchange", handleSelectionChange)
      textArea.addEventListener("click", handleSelectionChange)
      textArea.addEventListener("keyup", handleSelectionChange)

      return () => {
        textArea.removeEventListener("selectionchange", handleSelectionChange)
        textArea.removeEventListener("click", handleSelectionChange)
        textArea.removeEventListener("keyup", handleSelectionChange)
      }
    }
  }, [showSuggestion])

  const handleCompositionStart = () => {
    setIsComposing(true)
  }

  const handleCompositionEnd = (event) => {
    setIsComposing(false)
    const inputValue = event.target.value
    const currentCaretPosition = textAreaRef.current.resizableTextArea.textArea.selectionEnd
    handleVariableSuggestion(inputValue, currentCaretPosition)
    if (onChange) {
      onChange(event)
    }
  }

  const handleSelect = (variable) => {
    const inputValue = textAreaRef.current.resizableTextArea.textArea.value
    const currentCaretPosition = textAreaRef.current.resizableTextArea.textArea.selectionEnd
    const lastDollarIndex = inputValue.lastIndexOf("$", currentCaretPosition - 1)

    if (lastDollarIndex === -1 || lastDollarIndex >= currentCaretPosition) {
      return
    }

    const replacement = "${" + variable.valueExpression + "}"

    const newValue =
      inputValue.substring(0, lastDollarIndex) +
      replacement +
      inputValue.substring(currentCaretPosition)

    const newCaretPosition = lastDollarIndex + replacement.length
    setCaretPosition(newCaretPosition)
    setTimeout(() => {
      if (
        textAreaRef.current &&
        textAreaRef.current.resizableTextArea &&
        textAreaRef.current.resizableTextArea.textArea
      ) {
        textAreaRef.current.resizableTextArea.textArea.focus()
        textAreaRef.current.resizableTextArea.textArea.selectionStart = newCaretPosition
        textAreaRef.current.resizableTextArea.textArea.selectionEnd = newCaretPosition
      }
    }, 0)

    setShowSuggestion(false)
    setHighlightedIndex(-1)

    if (onChange) {
      onChange({ target: { value: newValue } }) // 这里模拟了一个event
    }
  }

  const handleKeyDown = (event) => {
    if (!showSuggestion) return

    switch (event.keyCode) {
      case 27: // Esc key
        setShowSuggestion(false)
        event.preventDefault()
        event.stopPropagation()
        break
      case 38: // Up arrow key
        event.preventDefault()
        if (highlightedIndex <= 0) {
          setHighlightedIndex(filteredVariables.length - 1)
        } else {
          setHighlightedIndex(highlightedIndex - 1)
        }
        break
      case 40: // Down arrow key
        event.preventDefault()
        if (highlightedIndex >= filteredVariables.length - 1) {
          setHighlightedIndex(0)
        } else {
          setHighlightedIndex(highlightedIndex + 1)
        }
        break
      case 13: // Enter key
        event.preventDefault()
        if (
          showSuggestion &&
          highlightedIndex >= 0 &&
          highlightedIndex < filteredVariables.length
        ) {
          handleSelect(filteredVariables[highlightedIndex])
        }
        break
      default:
        break
    }
  }

  return {
    textAreaRef,
    showSuggestion,
    setShowSuggestion,
    position,
    filteredVariables,
    highlightedIndex,
    handleInputChange,
    handleCompositionStart,
    handleCompositionEnd,
    handleKeyDown,
    handleSelect
  }
}

export default useVariableSuggestions
