import { useState, useEffect } from "react"
import { Spin } from "antd"
import { useIsFetching, useIsMutating } from "@tanstack/react-query"

export const GlobalLoadingIndicator = () => {
  const isFetching = useIsFetching()
  const isMutating = useIsMutating()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let timeoutId
    if (isFetching > 0 || isMutating > 0) {
      timeoutId = setTimeout(() => setIsLoading(true), 350)
    } else {
      clearTimeout(timeoutId)
      setIsLoading(false)
    }
    return () => clearTimeout(timeoutId)
  }, [isFetching, isMutating])

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "rgba(0, 0, 0, 0.1)",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999
        }}
      >
        <Spin size="large" />
      </div>
    )
  }

  return null
}
