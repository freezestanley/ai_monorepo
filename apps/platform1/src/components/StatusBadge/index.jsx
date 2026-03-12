import React from "react"
import { Badge } from "antd"
import "./index.scss"

const StatusBadge = ({ status }) => {
  let className = "statusBadge-wrapper"
  switch (status) {
    case "拆分中":
    case "数据构建中":
      className += " chunking"
      break
    case "使用中":
    case "已上线":
      className += " inUse"
      break
    case "已下线":
    case "未上线":
    case "已停用":
    case "拆分完成":
      className += " disabled"
      break
    case "异常":
    case "拆分异常":
      className += " abnormal"
      break

    default:
      break
  }

  const getBadgeColor = (status) => {
    switch (status) {
      case "拆分中":
      case "数据构建中":
        return "blue"
      case "使用中":
      case "已上线":
        return "green"
      case "已下线":
      case "未上线":
      case "已停用":
      case "拆分完成":
        return "gray"
      case "异常":
      case "拆分异常":
        return "red"
      default:
        return "default"
    }
  }
  return (
    <div className={className}>
      <Badge color={getBadgeColor(status)} />
      <span className="ml-[8px]">{status}</span>
    </div>
  )
}

export default StatusBadge
