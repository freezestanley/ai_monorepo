import React from "react"
import { Drawer } from "antd"
import { Blip } from "../../type"
import { ArrowLeftOutlined, CloseOutlined } from "@ant-design/icons"
import Detail from "./Detail"
import List from "./List"

export type DrawerMode = "detail" | "list"

interface RadarChartDetailProps {
  open: boolean
  onClose: () => void
  blip: Blip | null
  mode?: DrawerMode
  onModeChange?: (mode: DrawerMode) => void
  onBlipSelect?: (blip: Blip) => void
}

const RadarChartDetail: React.FC<RadarChartDetailProps> = ({
  open,
  onClose,
  blip,
  mode = "detail",
  onModeChange,
  onBlipSelect
}) => {
  const renderDetailTitle = () => {
    if (mode === "list") {
      return (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-base font-bold text-slate-900 leading-tight">雷达列表</span>
              <span className="text-xs text-gray-400 font-normal leading-tight">
                全部技术点展示
              </span>
            </div>
          </div>
          <div
            className="flex items-center justify-center w-8 h-8 cursor-pointer text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
            onClick={onClose}
          >
            <CloseOutlined className="text-lg" />
          </div>
        </div>
      )
    }

    // Detail Title
    if (!blip) return null
    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-4">
          <div
            className="flex items-center justify-center w-8 h-8 cursor-pointer text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
            onClick={() => onModeChange?.("list")}
          >
            <ArrowLeftOutlined className="text-lg" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-slate-900 leading-tight ">{blip.name}</span>
            <span className="text-xs text-gray-400 font-normal leading-tight">
              {blip.quadrantKeyName}
            </span>
          </div>
        </div>
        <div
          className="flex items-center justify-center w-8 h-8 cursor-pointer text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
          onClick={onClose}
        >
          <CloseOutlined className="text-lg" />
        </div>
      </div>
    )
  }

  const renderContent = () => {
    if (mode === "list" && blip) {
      return <List onItemClick={onBlipSelect} blip={blip} />
    }
    if (mode === "detail" && blip) {
      return <Detail blip={blip} />
    }
    return null
  }

  return (
    <Drawer
      title={renderDetailTitle()}
      placement="right"
      onClose={onClose}
      open={open}
      width={400}
      closable={false}
      getContainer={false}
      style={{ position: "absolute" }}
      mask={false}
      styles={{ wrapper: { boxShadow: "-2px 0 8px rgba(0, 0, 0, 0.05)" } }}
    >
      {renderContent()}
    </Drawer>
  )
}

export default RadarChartDetail
