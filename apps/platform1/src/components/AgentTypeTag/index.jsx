import React, { useEffect } from "react"

const AgentTypeTag = ({ agentMode }) => {
  // 根据agentMode获取对应的Tag配置
  const getAgentTypeTag = (agentMode) => {
    switch (agentMode) {
      case 1:
        return {
          text: "标准",
          color: "blue",
          bgColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)"
        }
      case 2:
        return {
          text: "语音",
          color: "green",
          bgColor: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
          boxShadow: "0 4px 15px rgba(17, 153, 142, 0.4)"
        }
      case 3:
        return {
          text: "材料分类",
          color: "orange",
          bgColor: "linear-gradient(135deg, #ff8a00 0%, #e52e71 100%)",
          boxShadow: "0 4px 15px rgba(255, 138, 0, 0.4)"
        }
      case 4:
        return {
          text: "保险文字客服",
          color: "purple",
          bgColor: "linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%)",
          boxShadow: "0 4px 15px rgba(142, 45, 226, 0.4)"
        }
      case 5:
        return {
          text: "材料智能采集",
          color: "yellow",
          bgColor: "linear-gradient(135deg, #ffeb3b 0%, #ffc107 100%)",
          boxShadow: "0 4px 15px rgba(255, 235, 59, 0.4)"
        }
      case 6:
        return {
          text: "数据",
          color: "red",
          bgColor: "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)",
          boxShadow: "0 4px 15px rgba(255, 107, 107, 0.4)"
        }
      default:
        return {
          text: "标准",
          color: "blue",
          bgColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)"
        }
    }
  }

  const agentTypeTag = getAgentTypeTag(agentMode)

  // 添加CSS动画样式
  const shineKeyframes = `
    @keyframes shine {
      0% { transform: translateX(-100%) rotate(45deg); }
      100% { transform: translateX(200%) rotate(45deg); }
    }
  `

  // 插入动画样式到页面
  useEffect(() => {
    const styleId = "agent-tag-animations"
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style")
      style.id = styleId
      style.textContent = shineKeyframes
      document.head.appendChild(style)
    }

    return () => {
      const existingStyle = document.getElementById(styleId)
      if (existingStyle) {
        existingStyle.remove()
      }
    }
  }, [])

  return (
    <div
      className="absolute -top-0.5 -right-0.5 px-2 py-1 rounded-bl-lg rounded-tr-lg transform hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg"
      style={{
        background: agentTypeTag.bgColor,
        boxShadow: agentTypeTag.boxShadow,
        border: "none"
      }}
    >
      <div className="flex items-center gap-0.5">
        {/* 添加小图标 */}
        <span className="text-white text-[10px]">
          {agentTypeTag.color === "blue" ? "⚡" : agentTypeTag.color === "green" ? "🎤" : "📋"}
        </span>
        <span
          className="text-[11px] font-semibold text-white drop-shadow-sm"
          style={{
            textShadow: "0 1px 2px rgba(0,0,0,0.3)"
          }}
        >
          {agentTypeTag.text}
        </span>
      </div>

      {/* 添加闪光效果 */}
      <div
        className="absolute inset-0 rounded-bl-lg rounded-tr-lg opacity-30"
        style={{
          background:
            "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%)",
          animation: "shine 3s infinite"
        }}
      />
    </div>
  )
}

export default AgentTypeTag
