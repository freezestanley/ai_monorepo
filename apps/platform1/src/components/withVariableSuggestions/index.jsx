// withVariableSuggestions.js
import React, { useState } from "react"
import { Popover, List } from "antd"
import getCaretCoordinates from "textarea-caret"

export function withVariableSuggestions(WrappedComponent) {
  return function EnhancedComponent(props) {
    const [showSuggestion, setShowSuggestion] = useState(false)
    const [highlightedIndex, setHighlightedIndex] = useState(-1)
    const [filteredVariables, setFilteredVariables] = useState([])
    const [position, setPosition] = useState({ top: 0, left: 0 })

    const handleVariableSuggestion = (inputValue, currentCaretPosition, textAreaRef) => {
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

    const handleSelect = (variable, textAreaRef) => {
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

    const renderSuggestionPopover = () => {
      return (
        <Popover
          content={
            <List
              dataSource={filteredVariables}
              renderItem={(variable, index) => (
                <List.Item
                  onClick={() => handleSelect(variable, props.textAreaRef)}
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
      )
    }

    return (
      <WrappedComponent
        {...props}
        showSuggestion={showSuggestion}
        setShowSuggestion={setShowSuggestion}
        highlightedIndex={highlightedIndex}
        setHighlightedIndex={setHighlightedIndex}
        filteredVariables={filteredVariables}
        setFilteredVariables={setFilteredVariables}
        handleVariableSuggestion={handleVariableSuggestion}
        renderSuggestionPopover={renderSuggestionPopover}
      />
    )
  }
}
