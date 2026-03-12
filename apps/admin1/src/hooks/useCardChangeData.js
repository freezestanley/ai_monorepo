import { useState, useEffect } from "react"

const useCardChangeData = (options) => {
  const { nameKey = "query" } = options || {}
  const [queryParams, setQueryParams] = useState({
    current: 1,
    pageSize: 12,
    queryParams: {}
  })
  const [viewMode, setViewMode] = useState("card")

  useEffect(() => {
    if (viewMode === "card") {
      setQueryParams((preState) => {
        if (
          preState.current === 1 &&
          Object.keys(preState.queryParams).length <= 1 &&
          Object.keys(preState.queryParams)[0] === nameKey
        ) {
          return preState
        }
        return {
          ...preState,
          queryParams: {
            [nameKey]: preState.queryParams[nameKey]
          },
          current: 1
        }
      })
    }
  }, [viewMode, nameKey])

  return {
    setQueryParams,
    queryParams,
    setViewMode,
    viewMode
  }
}

export default useCardChangeData
