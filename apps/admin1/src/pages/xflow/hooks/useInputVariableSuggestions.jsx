import { useState, useRef, useEffect } from "react"

const useInputVariableSuggestions = (variables, onChange) => {
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [filteredVariables, setFilteredVariables] = useState(variables)
  const inputRef = useRef(null)
  const [isComposing, setIsComposing] = useState(false)
  const [caretPosition, setCaretPosition] = useState(0)

  const handleVariableSuggestion = (inputValue, currentCaretPosition) => {
    if (inputValue[currentCaretPosition - 1] === "$") {
      setPosition({
        top: 0,
        left: 0
      })
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

    if (!isComposing && inputRef.current) {
      const currentCaretPosition = inputRef.current.input.selectionEnd
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
    const currentCaretPosition = inputRef.current.input.selectionEnd
    handleVariableSuggestion(inputValue, currentCaretPosition)
    if (onChange) {
      onChange(event)
    }
  }

  const handleSelect = (variable) => {
    const inputValue = inputRef.current.input.value
    const currentCaretPosition = inputRef.current.input.selectionEnd
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
      if (inputRef.current && inputRef.current.input) {
        inputRef.current.input.focus()
        inputRef.current.input.selectionStart = newCaretPosition
        inputRef.current.input.selectionEnd = newCaretPosition
      }
    }, 0)

    setShowSuggestion(false)
    setHighlightedIndex(-1)

    if (onChange) {
      onChange({ target: { value: newValue } })
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
    inputRef,
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

export default useInputVariableSuggestions
