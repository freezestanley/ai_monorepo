import { PlusOutlined } from "@ant-design/icons"
import { Button } from "antd"
import Iconfont from "../Icon"

export function DeleteIcon({ onClick, disabled = false, ...props }) {
  const disabledClass = disabled ? "cursor-not-allowed text-[#98A2B3]" : "cursor-pointer"
  return (
    <i
      onClick={!disabled && onClick}
      className={`iconfont icon-tuodong-shanchu text-[#181B25] ${disabledClass} hover:text-[#7F56D9]`}
      {...props}
    />
  )
}
export function DragIcon({ onClick = () => {}, disabled = false, ...props }) {
  const disabledClass = disabled ? "cursor-not-allowed text-[#98A2B3]" : "cursor-pointer"
  return (
    <Iconfont
      type="icon-tuodong1"
      onClick={!disabled && onClick}
      className={`text-[#181B25] ${disabledClass} hover:text-[#7F56D9]`}
      {...props}
    />
  )
}

export function AddIcon({ onClick = () => {}, ...props }) {
  return (
    <Button type="link" icon={<PlusOutlined />} onClick={onClick} {...props}>
      {props.text}
    </Button>
  )
}

export function InfoIcon({ ...props }) {
  return (
    <Iconfont
      type="icon-Info"
      className="font-16 color-[#98A2B3]"
      style={{ cursor: "default" }}
      {...props}
    />
  )
}
