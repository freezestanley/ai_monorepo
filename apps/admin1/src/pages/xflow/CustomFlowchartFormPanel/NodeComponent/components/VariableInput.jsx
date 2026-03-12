import React from "react"
import { Input, List, Popover } from "antd"
import useInputVariableSuggestions from "@/pages/xflow/hooks/useInputVariableSuggestions"

const VariableInput = ({
  variables,
  value: propValue,
  onChange,
  onBlur,
  disabled = false,
  placeholder = "请输入表达式",
  className = "",
  style = {}
}) => {
  const {
    inputRef,
    showSuggestion,
    position,
    filteredVariables,
    highlightedIndex,
    handleInputChange,
    handleCompositionStart,
    handleCompositionEnd,
    handleKeyDown,
    handleSelect
  } = useInputVariableSuggestions(variables, onChange)

  const listItemRefs = React.useRef([])

  const scrollToHighlightedItem = () => {
    const ref = listItemRefs.current[highlightedIndex]
    if (ref) {
      ref.scrollIntoView({
        block: "nearest"
      })
    }
  }

  React.useEffect(() => {
    scrollToHighlightedItem()
  }, [highlightedIndex])

  return (
    <div style={{ position: "relative", ...style }}>
      <Input
        ref={inputRef}
        value={propValue}
        placeholder={placeholder}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onBlur={onBlur}
        disabled={disabled}
        className={`font-family-Monaco w-full ${className}`}
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
                  ref={(el) => (listItemRefs.current[index] = el)}
                  className="cursor-pointer"
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
          open={showSuggestion}
          placement="bottom"
          getPopupContainer={(triggerNode) => triggerNode.parentNode}
          overlayStyle={{
            width: "100%"
          }}
        >
          <div />
        </Popover>
      )}
    </div>
  )
}

export default VariableInput
