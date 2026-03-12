import React from "react"
import { Popover, Tooltip } from "antd"
import { SCRIPT_GROUP_COLORS, getColorConfig, DEFAULT_COLOR } from "@/constants/scriptGroupColors"

/**
 * 颜色分组徽章组件
 * @param {number} index - 序号
 * @param {string} groupFlag - 颜色值
 * @param {function} onChange - 颜色改变回调
 */
const ColorGroupBadge = ({ index, groupFlag, onChange }) => {
  const colorConfig = getColorConfig(groupFlag || DEFAULT_COLOR)

  // 处理颜色选择
  const handleColorSelect = (color) => {
    onChange?.(color.value)
  }

  // 颜色选择器内容 - 改为上下两行布局，每行4个方形颜色块
  const colorPickerContent = (
    <div className="p-2">
      <div className="grid grid-cols-4 gap-2">
        {SCRIPT_GROUP_COLORS.map((color) => (
          <Tooltip key={color.value} title={color.label}>
            <div
              className="w-8 h-8 rounded cursor-pointer transition-all hover:scale-110 flex items-center justify-center"
              style={{
                backgroundColor: color.primary,
                border:
                  groupFlag === color.value || (!groupFlag && color.value === DEFAULT_COLOR)
                    ? "2px solid #282828"
                    : "2px solid #d9d9d9",
                boxShadow:
                  groupFlag === color.value || (!groupFlag && color.value === DEFAULT_COLOR)
                    ? "0 2px 8px rgba(24, 144, 255, 0.4)"
                    : "0 1px 3px rgba(0,0,0,0.1)"
              }}
              onClick={(e) => {
                e.stopPropagation()
                handleColorSelect(color)
              }}
            />
          </Tooltip>
        ))}
      </div>
    </div>
  )

  return (
    <Popover content={colorPickerContent} title="选择分组颜色" trigger="hover" placement="top">
      <h4
        className="text-sm font-medium mb-3 flex items-center justify-center w-[20px] h-[20px] rounded-full cursor-pointer transition-all hover:scale-110"
        style={{
          color: colorConfig.primary,
          backgroundColor: colorConfig.light,
          border: `2px solid ${colorConfig.primary}`
        }}
      >
        {index + 1}
      </h4>
    </Popover>
  )
}

export default ColorGroupBadge
