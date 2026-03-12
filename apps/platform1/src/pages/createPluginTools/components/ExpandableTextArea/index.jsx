import React from "react"
import { Input, Modal, message } from "antd"

const ExpandableTextArea = ({
  title = "编辑器",
  value = "",
  type = "json",
  onChange = (value) => {},
  placeholder,
  disabled
}) => {
  const handleExpand = (e) => {
    e.preventDefault()
    let modalTextArea = null
    let initialValue = value

    Modal.info({
      title: `${title}【${type}格式】`,
      width: 800,
      content: (
        <Input.TextArea
          ref={(node) => {
            if (node) {
              modalTextArea = node
              const length = node.resizableTextArea.textArea.value.length
              node.resizableTextArea.textArea.setSelectionRange(length, length)
            }
          }}
          defaultValue={initialValue}
          autoSize={{ minRows: 20, maxRows: 30 }}
          onChange={(e) => onChange?.(e.target.value)}
        />
      ),
      okText: "确定",
      cancelText: "取消",
      closable: true,
      maskClosable: true,
      okCancel: true,
      onCancel: () => {
        if (onChange) {
          onChange(initialValue)
        }
        return Promise.resolve()
      },
      onOk: (close) => {
        try {
          const currentValue = modalTextArea?.resizableTextArea.textArea.value
          const lowerCaseType = type.toLowerCase()
          const isJson = lowerCaseType === "json"
          const isArray = lowerCaseType === "array"
          if (isJson || isArray) {
            if (currentValue?.trim().length === 0) {
              throw new Error("不能为空")
            }
            JSON.parse(currentValue)
          }
          if (isArray) {
            const parsed = JSON.parse(currentValue)
            if (!Array.isArray(parsed)) {
              throw new Error("不是有效的数组格式")
            }
          }

          close()
          return Promise.resolve()
        } catch (error) {
          message.error(`格式错误：请输入正确的${type}格式`)
          return Promise.reject()
        }
      },
      icon: null
    })
    setTimeout(() => {
      modalTextArea.focus()
    }, 200)
  }

  return (
    <Input
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      onClick={handleExpand}
      disabled={disabled}
    />
  )
}

export default ExpandableTextArea
