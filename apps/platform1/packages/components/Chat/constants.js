/*
 * @Author: AI Assistant
 * @Date: 2024-06-21
 * @Description: 聊天组件常量定义
 */
import { UserOutlined } from "@ant-design/icons"
import aiAvator from "@/assets/img/avatorAgentOs.png"

// 角色定义
export const roles = {
  ai: {
    placement: "start",
    avatar: {
      icon: <img src={aiAvator} />,
      style: { background: "#ddd" }
    }
  },
  local: {
    placement: "end",
    avatar: {
      icon: <UserOutlined />,
      style: { background: "#5D5FEF" }
    }
  }
}

// 文件类型图标映射
export const FILE_ICONS = {
  XLS: "/assets/img/xls.png",
  CVS: "/assets/img/txt.png"
}

// Bot默认配置
export const DEFAULT_BOT_CONFIG = {
  botNo: "20230920164113204",
  agentNo: "tzrgrhwfrhuxs",
  agentVersionNo: "tzrgrhwfrhuxs",
  selectedSkill: "AWS_claude_sonnet",
  sessionId: "1912774953300791296"
}

// CSS动画定义
export const PULSE_ANIMATION = `
  @keyframes pulse {
    0%, 100% {
      opacity: 0.2;
    }
    50% {
      opacity: 1;
    }
  }
`
