import React from "react"
import { Modal, Input, List, Popover } from "antd"
import CodeMirror from "@uiw/react-codemirror"
import { javascript } from "@codemirror/lang-javascript"
import { python } from "@codemirror/lang-python"
import { indentationMarkers } from "@replit/codemirror-indentation-markers"
import useVariableSuggestions from "@/pages/xflow/hooks/useVariableSuggestions"
import getCaretCoordinates from "textarea-caret"
import "./index.scss"

const extensionsMap = {
  python: [
    python(),
    indentationMarkers({
      hideFirstIndent: false,
      markerType: "fullScope",
      thickness: 1,
      colors: {
        light: "#E8E8E8",
        dark: "#404040",
        activeLight: "#C0C0C0",
        activeDark: "#606060"
      }
    })
  ],
  javascript: [
    javascript({ jsx: true, typescript: true }),
    indentationMarkers({
      hideFirstIndent: false,
      markerType: "fullScope",
      thickness: 1,
      colors: {
        light: "#E8E8E8",
        dark: "#404040",
        activeLight: "#C0C0C0",
        activeDark: "#606060"
      }
    })
  ]
}

function LargeEditorModal({
  isOpen,
  mode = "textarea", // textarea/code
  scriptType = "python",
  disabled = false,
  onClose,
  initialValue,
  onSubmit,
  handleMouseBlur,
  disableSuggestion,
  variables,
  largeInputProps
}) {
  const [editorContent, setEditorContent] = React.useState(initialValue)

  // 使用我们的自定义Hook
  const {
    textAreaRef,
    showSuggestion,
    position,
    filteredVariables,
    highlightedIndex,
    handleInputChange,
    handleCompositionStart,
    handleCompositionEnd,
    handleKeyDown,
    handleSelect
  } = useVariableSuggestions(variables, (e) => setEditorContent(e.target.value))

  const listItemRefs = React.useRef([])

  React.useEffect(() => {
    setEditorContent(initialValue)
  }, [initialValue])

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
    <Modal
      title="内容编辑"
      open={isOpen}
      maskClosable={false}
      onCancel={onClose}
      onOk={() => {
        onSubmit(editorContent)
        onClose()
      }}
      width="80%"
    >
      {mode === "textarea" ? (
        <Input.TextArea
          className="font-family-Monaco " //overflow-y-auto-80vh
          value={editorContent}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleMouseBlur}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          ref={textAreaRef}
          autoSize={{ minRows: 30, maxRows: 100 }}
          {...largeInputProps}
        />
      ) : (
        <CodeMirror
          className="code-mirror"
          value={editorContent}
          minHeight="80vh"
          editable={!disabled}
          extensions={extensionsMap[scriptType]}
          onChange={(value, viewUpdate) => {
            setEditorContent(value)
          }}
        />
      )}

      {!disableSuggestion && showSuggestion && (
        <Popover
          content={
            <List
              style={{ minHeight: 300, overflowY: "scroll" }}
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
          visible={showSuggestion}
          placement="bottom"
          autoAdjustOverflow={false}
          getPopupContainer={() => document.body}
          overlayStyle={{
            position: "absolute",
            top: position.top, // position.top + 360,
            left: position.left - 70
          }}
        >
          <div />
        </Popover>
      )}
    </Modal>
  )
}

export default LargeEditorModal
