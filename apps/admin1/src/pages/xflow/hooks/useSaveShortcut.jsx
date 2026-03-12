import { isCanvasFocused, isSidebarFocused } from "@/api/tools"
import { useEffect } from "react"

const useSaveShortcut = (onFinish, isLoading, ignoreOther = false) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "s" && (isSidebarFocused() || ignoreOther) && (e.ctrlKey || e.metaKey)) {
        e.preventDefault() // 阻止浏览器默认行为
        if (isLoading) return
        e.stopPropagation()
        onFinish()
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [onFinish, isLoading])
}

export default useSaveShortcut

export const useCanvasShortcut = (onFinish, isLoading) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "s" && isCanvasFocused() && (e.ctrlKey || e.metaKey)) {
        e.preventDefault() // 阻止浏览器默认行为
        if (isLoading) return
        e.stopPropagation()
        onFinish()
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [onFinish, isLoading])
}
