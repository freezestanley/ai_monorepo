import { useState } from "react"

export const useActionBar = () => {
  const [actionBarPosition, setActionBarPosition] = useState({
    top: 0,
    left: 0
  })
  const [showActionBar, setShowActionBar] = useState(false)
  const [showAIMenu, setShowAIMenu] = useState(false)

  // 保持工具栏位置
  const actionBarStyle = {
    position: "absolute",
    left: `${actionBarPosition.left - 2}px`,
    top: `${actionBarPosition.top + 60}px`,
    zIndex: 1000
  }

  return {
    showAIMenu,
    setShowAIMenu,
    actionBarStyle,
    actionBarPosition,
    showActionBar,
    setActionBarPosition,
    setShowActionBar
  }
}
