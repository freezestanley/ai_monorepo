import React, { useState, useRef, useEffect } from "react"
import { List, Popover, Input, Button, Tooltip } from "antd"
import getCaretCoordinates from "textarea-caret"
import LargeEditorModal from "./LargeEditorModal"
import { ZoomInOutlined } from "@ant-design/icons"
import "./variableTextArea.scss"

const VariableTextArea = ({ variables, value: propValue, onChange }) => {
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [filteredVariables, setFilteredVariables] = useState(variables)
  const textAreaRef = useRef(null)
  const [caretPosition, setCaretPosition] = useState(0)
  const [isComposing, setIsComposing] = useState(false)
  const [isLargeEditorOpen, setLargeEditorOpen] = useState(false)

  const handleVariableSuggestion = (inputValue, currentCaretPosition) => {
    if (inputValue[currentCaretPosition - 1] === "$") {
      const rect = textAreaRef.current.resizableTextArea.textArea.getBoundingClientRect()
      const coordinates = getCaretCoordinates(
        textAreaRef.current.resizableTextArea.textArea,
        currentCaretPosition
      )
      console.log(coordinates)

      setPosition({
        top: rect.top + coordinates.top + window.scrollY - 330,
        left: rect.left + coordinates.left + window.scrollX - 20
      })
      setShowSuggestion(true)
      setFilteredVariables(variables)
      setHighlightedIndex(0)
    } else if (showSuggestion) {
      // 截取当前光标位置以及最近的$
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
          // 如果当前高亮的是第一个项目，则高亮最后一个项目
          setHighlightedIndex(filteredVariables.length - 1)
        } else {
          setHighlightedIndex(highlightedIndex - 1)
        }
        break
      case 40: // Down arrow key
        event.preventDefault()
        if (highlightedIndex >= filteredVariables.length - 1) {
          // 如果当前高亮的是最后一个项目，则高亮第一个项目
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

  const listItemRefs = useRef([])

  const scrollToHighlightedItem = () => {
    const ref = listItemRefs.current[highlightedIndex]
    if (ref) {
      ref.scrollIntoView({
        block: "nearest"
      })
    }
  }

  useEffect(() => {
    scrollToHighlightedItem()
  }, [highlightedIndex])

  return (
    <div style={{ position: "relative" }} className="variable-text-area">
      <Input.TextArea
        onKeyDown={handleKeyDown}
        autoSize={{ minRows: 10, maxRows: 100 }}
        value={propValue}
        onChange={handleInputChange}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        ref={textAreaRef}
        style={{ width: "100%", height: "100px" }}
      />
      {showSuggestion && (
        <Popover
          content={
            <List
              style={{
                height: 300,
                overflowY: "scroll"
              }}
              dataSource={filteredVariables}
              renderItem={(variable, index) => (
                <List.Item
                  className="cursor-pointer"
                  ref={(el) => (listItemRefs.current[index] = el)}
                  onClick={() => handleSelect(variable)}
                  style={index === highlightedIndex ? { backgroundColor: "#f5f5f5" } : {}}
                >
                  {`${variable.valueExpression} ${
                    variable.description ? `(${variable.description})` : ""
                  }`}
                </List.Item>
              )}
            />
          }
          visible={showSuggestion}
          placement="bottomLeft"
          getPopupContainer={() => document.body}
          overlayStyle={{
            position: "absolute",
            top: position.top,
            left: position.left
          }}
        >
          <div />
        </Popover>
      )}
      <Tooltip title="放大编辑框">
        <ZoomInOutlined onClick={() => setLargeEditorOpen(true)} className="large-icon" />
      </Tooltip>

      <LargeEditorModal
        isOpen={isLargeEditorOpen}
        onClose={() => setLargeEditorOpen(false)}
        initialValue={propValue}
        onSubmit={(newValue) => {
          onChange({ target: { value: newValue } })
        }}
      />
    </div>
  )
}

export default VariableTextArea
