import { useEffect } from "react"

/**
 * 抽屉管理Hook
 * 用于管理多个抽屉组件之间的互斥打开逻辑
 */
export const useDrawerManager = (
  previewDrawerVisible,
  propertyConfigDrawerVisible,
  setPreviewDrawerVisible,
  setPropertyConfigDrawerVisible
) => {
  // 关闭所有抽屉的统一方法
  const closeAllDrawers = () => {
    setPreviewDrawerVisible(false)
    setPropertyConfigDrawerVisible(false)
  }

  // 打开指定抽屉并关闭其他抽屉
  const openDrawer = (drawerName, refreshReleaseStatus, agentNo) => {
    // 先关闭所有抽屉
    closeAllDrawers()

    // 派发自定义事件，通知其他抽屉关闭（排除当前要打开的抽屉）
    const closeOtherDrawersEvent = new CustomEvent("closeOtherDrawers", {
      detail: { excludeDrawer: drawerName }
    })
    window.dispatchEvent(closeOtherDrawersEvent)

    // 打开指定抽屉
    switch (drawerName) {
      case "PreviewAndDebugDrawer":
        setPreviewDrawerVisible(true)
        break
      case "PropertyConfigDrawer":
        if (refreshReleaseStatus) {
          refreshReleaseStatus(agentNo, "isAttributes")
        }
        setPropertyConfigDrawerVisible(true)
        break
      default:
        break
    }
  }

  // 监听关闭抽屉事件的处理函数
  const handleCloseOtherDrawers = (event) => {
    // 如果当前抽屉是打开的，且不是被排除的抽屉，则关闭它
    if (previewDrawerVisible && event.detail?.excludeDrawer !== "PreviewAndDebugDrawer") {
      setPreviewDrawerVisible(false)
    }
    if (propertyConfigDrawerVisible && event.detail?.excludeDrawer !== "PropertyConfigDrawer") {
      setPropertyConfigDrawerVisible(false)
    }
  }

  // 监听关闭其他抽屉的事件
  useEffect(() => {
    window.addEventListener("closeOtherDrawers", handleCloseOtherDrawers)

    return () => {
      window.removeEventListener("closeOtherDrawers", handleCloseOtherDrawers)
    }
  }, [previewDrawerVisible, propertyConfigDrawerVisible])

  return {
    closeAllDrawers,
    openDrawer,
    handleCloseOtherDrawers
  }
}
