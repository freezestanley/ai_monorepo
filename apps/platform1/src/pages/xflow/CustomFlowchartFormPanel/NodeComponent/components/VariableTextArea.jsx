import React, { useState } from "react"
import { List, Popover, Input, Tooltip, Tabs } from "antd"
import { ZoomInOutlined } from "@ant-design/icons"
import LargeEditorModal from "./LargeEditorModal"
import "./variableTextArea.scss"
import useVariableSuggestions from "@/pages/xflow/hooks/useVariableSuggestions"
import Iconfont from "@/components/Icon"

const VariableTextArea = ({
  variables,
  value: propValue,
  onChange,
  onMouseBlur,
  disabled = false,
  disableSuggestion = false,
  style = {},
  miniInputStyle = {},
  miniInputProps = {},
  largeInputProps = {},
  placeholder,
  isModal = false,
  isLargeEdito = true
}) => {
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
    handleSelect,
    setShowSuggestion
  } = useVariableSuggestions(variables, onChange) // 使用自定义Hook
  const [isLargeEditorOpen, setLargeEditorOpen] = useState(false)
  const listItemRefs = React.useRef([])
  const [activeTab, setActiveTab] = useState("variables") // 'variables' | 'shortcuts'

  // 快捷指令数据
  const shortcutCommands = [
    {
      name: "插入数组",
      code: `<#list 知识搜索.result as item>
 $\{item_index}. $\{item.shardingContent}
</#list>`
    },
    {
      name: "搜索结果",
      code: `<#list 搜索.result as item>
$\{item_index}. $\{item. snippet}
</#list>`
    }
  ]

  const handleTabChange = (key) => {
    setActiveTab(key)
  }

  const handleShortcutSelect = (shortcut) => {
    const textarea = textAreaRef.current?.resizableTextArea?.textArea
    if (!textarea || !onChange) return

    const inputValue = textarea.value
    const currentCaretPosition = textarea.selectionEnd
    const lastDollarIndex = inputValue.lastIndexOf("$", currentCaretPosition - 1)

    let newValue, newCaretPosition

    if (lastDollarIndex !== -1 && lastDollarIndex < currentCaretPosition) {
      // 找到触发的 $ 符号，替换它
      newValue =
        inputValue.substring(0, lastDollarIndex) +
        shortcut.code +
        inputValue.substring(currentCaretPosition)
      newCaretPosition = lastDollarIndex + shortcut.code.length
    } else {
      // 没找到 $ 符号，直接追加
      newValue = inputValue + "\n" + shortcut.code
      newCaretPosition = newValue.length
    }

    // 设置新值和光标位置
    onChange({ target: { value: newValue } })

    // 关闭 Popover 并设置光标位置
    setShowSuggestion(false)
    setTimeout(() => {
      textarea.focus()
      textarea.selectionStart = newCaretPosition
      textarea.selectionEnd = newCaretPosition
    }, 0)
  }

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
    <div style={{ position: "relative", ...style }} className="variable-text-area">
      <Input.TextArea
        onKeyDown={handleKeyDown}
        autoSize={miniInputStyle.height ? false : { minRows: 9, maxRows: 100 }}
        value={propValue}
        onChange={handleInputChange}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onBlur={onMouseBlur}
        placeholder={placeholder}
        ref={textAreaRef}
        disabled={disabled}
        style={{
          width: "100%",
          height: miniInputStyle.height || "100px",
          ...style,
          ...miniInputStyle
        }}
        {...miniInputProps}
      />
      {!disableSuggestion && showSuggestion && (
        <Popover
          content={
            <div style={{ width: 250 }}>
              <Tabs
                activeKey={activeTab}
                onChange={handleTabChange}
                size="small"
                items={[
                  {
                    key: "variables",
                    label: "过程变量",
                    children: (
                      <List
                        style={{
                          height: 300,
                          overflowY: "scroll"
                        }}
                        dataSource={filteredVariables}
                        renderItem={(variable, index) => (
                          <List.Item
                            ref={(el) => (listItemRefs.current[index] = el)}
                            className="cursor-pointer !p-2"
                            onClick={() => handleSelect(variable)}
                            style={index === highlightedIndex ? { backgroundColor: "#f5f5f5" } : {}}
                          >
                            {`${variable.valueExpression} ${
                              variable.description ? `(${variable.description})` : ""
                            }`}
                          </List.Item>
                        )}
                      />
                    )
                  },
                  {
                    key: "shortcuts",
                    label: "快捷指令",
                    children: (
                      <List
                        style={{
                          height: 300,
                          overflowY: "scroll"
                        }}
                        dataSource={shortcutCommands}
                        renderItem={(shortcut) => (
                          <List.Item
                            className="cursor-pointer !p-2"
                            onClick={() => handleShortcutSelect(shortcut)}
                          >
                            {shortcut.name}
                          </List.Item>
                        )}
                      />
                    )
                  }
                ]}
              />
            </div>
          }
          open={showSuggestion}
          placement="bottomLeft"
          autoAdjustOverflow={true}
          getPopupContainer={() => document.body}
          overlayStyle={{
            position: "fixed",
            top: position.top,
            left: position.left,
            zIndex: 9999
          }}
          destroyTooltipOnHide={true}
        >
          <div style={{ position: "absolute", top: 0, left: 0, width: 1, height: 1 }} />
        </Popover>
      )}
      {isLargeEdito && (
        <Tooltip title="放大编辑框">
          <Iconfont
            type={"icon-a-expand"}
            onClick={() => setLargeEditorOpen(true)}
            className="large-icon"
          />
        </Tooltip>
      )}

      <LargeEditorModal
        isOpen={isLargeEditorOpen}
        onClose={() => setLargeEditorOpen(false)}
        initialValue={propValue}
        placeholder={placeholder}
        onSubmit={(newValue) => {
          onChange({ target: { value: newValue } })
        }}
        variables={variables}
        disableSuggestion={disableSuggestion}
        largeInputProps={largeInputProps}
      />
    </div>
  )
}

export default VariableTextArea
