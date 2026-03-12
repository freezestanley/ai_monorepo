import { useEffect, useRef } from "react"

export const useDebounceEffect = (callback, delay, deps) => {
  const timeoutRef = useRef(null)

  useEffect(() => {
    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // 设置新的定时器
    timeoutRef.current = setTimeout(() => {
      callback()
    }, delay)

    // 清理函数
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, deps)
}
