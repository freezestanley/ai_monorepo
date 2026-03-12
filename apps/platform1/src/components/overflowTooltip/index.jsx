import React from "react"
import { Tooltip } from "antd"
const OverflowText = ({ text, width = 200, singleLine = true, overflowCount = 15, style = {} }) => {
  if (!text) return null

  // 辅助函数：提取React元素中的文本内容
  const extractTextFromElement = (element) => {
    if (typeof element === "string") {
      return element
    }

    if (React.isValidElement(element) && element.props.children) {
      return extractTextFromElement(element.props.children)
    }

    return ""
  }

  const displayText = React.isValidElement(text) ? extractTextFromElement(text) : text

  const overflowStyle = singleLine
    ? "overflow-ellipsis overflow-hidden whitespace-nowrap"
    : "overflow-auto"

  const handleCopy = (e) => {
    e.preventDefault()
    const textarea = document.createElement("textarea")
    textarea.textContent = displayText // 使用实际的文本
    textarea.style.position = "fixed"
    document.body.appendChild(textarea)
    textarea.select()
    try {
      return document.execCommand("copy")
    } catch (ex) {
      console.warn("Copy to clipboard failed.", ex)
      return false
    } finally {
      document.body.removeChild(textarea)
    }
  }

  return (
    <Tooltip
      title={displayText} // 使用实际的文本
      style={{ color: "#fff!important" }}
      className="overflowTooltip-wrapper"
    >
      <div
        className={`${overflowStyle}`}
        style={{
          textOverflow: "ellipsis",
          wordBreak: "break-all",
          maxWidth: `${width}px`,
          ...style
        }}
        onCopy={handleCopy}
      >
        {displayText.length > overflowCount
          ? `${displayText.substring(0, overflowCount)}...`
          : displayText}
      </div>
    </Tooltip>
  )
}

export default OverflowText
