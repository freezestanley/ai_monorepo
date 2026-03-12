import { useEffect, useRef } from "react"

export const useThrottledEffect = (callback, delay, deps) => {
  const lastRun = useRef(Date.now())
  const timeout = useRef(null)

  useEffect(() => {
    const handler = () => {
      const now = Date.now()
      const timeSinceLastRun = now - lastRun.current

      if (timeSinceLastRun >= delay) {
        callback()
        lastRun.current = now
      } else {
        if (timeout.current) {
          clearTimeout(timeout.current)
        }
        timeout.current = setTimeout(() => {
          callback()
          lastRun.current = Date.now()
        }, delay - timeSinceLastRun)
      }
    }

    handler()

    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current)
      }
    }
  }, deps)
}
