import React, { useState, useEffect } from "react"
import { Dropdown, message } from "antd"
import { DownOutlined } from "@ant-design/icons"
import ClaudeIcon from "@/assets/img/claude-color.svg"
import CozeIcon from "@/assets/img/coze.png"

/**
 * 核心切换组件
 * 支持在 Claude 和 Coze 之间切换
 */
const CoreSwitch = ({ initialCore = "claude", onCoreChange, disabled = false }) => {
  // dynamic_agent_core_mode
  const [currentCore, setCurrentCore] = useState(initialCore)

  // 同步父组件传入的初始核心变更（如异步回显时）
  useEffect(() => {
    setCurrentCore(initialCore)
  }, [initialCore])

  // 核心配置
  const cores = {
    claude: {
      name: "Claude",
      icon: ClaudeIcon,
      color: "#D97757"
    },
    coze: {
      name: "Coze",
      icon: CozeIcon,
      color: "#6366F1"
    }
  }

  // 切换核心
  const handleMenuClick = ({ key }) => {
    if (disabled) {
      message.warning("当前状态下无法切换核心")
      return
    }

    if (key === currentCore) {
      return // 如果点击的是当前核心，不做任何操作
    }

    setCurrentCore(key)

    // 调用回调函数
    if (onCoreChange) {
      onCoreChange(key)
    }

    message.success(`已切换至 ${cores[key].name} 核心`)
  }

  const activeCore = cores[currentCore]

  // 下拉菜单配置
  const menuItems = Object.entries(cores).map(([key, core]) => ({
    key,
    label: (
      <div className="flex items-center gap-2 py-1">
        <div
          className={`w-[24px] h-[24px] flex items-center justify-center rounded-full ${core.name === "Claude" ? "bg-[#f6f6f6]" : "bg-[#6366F1]"}`}
        >
          <img src={core.icon} alt={core.name} className="w-4 h-4" />
        </div>
        <span style={{ color: core.color }}>{core.name}</span>
      </div>
    ),
    disabled: key === currentCore // 当前选中的核心禁用
  }))

  return (
    <>
      <div className="flex items-center justify-between bg-white">
        {/* 左侧：当前核心 Logo 和名称 */}
        <div className="flex items-center gap-1">
          <div
            className={`w-[30px] h-[30px] text-center leading-[40px] rounded-full ${activeCore.name === "Claude" ? "bg-[#f4f4f4]" : " bg-[#6366F1]"} '`}
          >
            <img src={activeCore.icon} alt={activeCore.name} className="w-5 h-5" />
          </div>

          <span className="text-[14px] font-[400]" style={{ color: activeCore.color }}>
            {activeCore.name}
          </span>
        </div>

        {/* 右侧：切换下拉菜单 */}
        <Dropdown
          menu={{ items: menuItems, onClick: handleMenuClick }}
          disabled={disabled}
          trigger={["click"]}
        >
          <a
            onClick={(e) => e.preventDefault()}
            className="ml-2 mt-[1px] text-[12px] text-gray-600 hover:text-[#7f56d9] cursor-pointer select-none"
          >
            切换核心 <DownOutlined className="text-[12px] text-gray-300" />
          </a>
        </Dropdown>
      </div>
    </>
  )
}

export default CoreSwitch
