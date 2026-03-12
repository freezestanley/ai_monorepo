import { useRef, useEffect, useCallback } from "react"
import { debounce } from "lodash"
import { SAVE_GRAPH_DATA } from "../config-toolbar"
import { useFetchGlobalVariable } from "@/api/skill"
import { useLocation } from "react-router-dom"
import queryString from "query-string"

const useSaveFlow = (handleSave, skillFlowData, appData) => {
  const location = useLocation()
  const { skillNo: skillNoParam } = queryString.parse(location.search)
  const skillNo = Array.isArray(skillNoParam) ? skillNoParam[0] : skillNoParam

  const debouncedSave = useRef(
    debounce((data, callback, noMessage) => {
      console.log(data, callback)
      appData.current.executeCommand(SAVE_GRAPH_DATA, {
        saveGraphDataService: (meta, graphData) => {
          handleSave(
            {
              ...graphData,
              ...data
            },
            callback,
            noMessage
          )
          localStorage.setItem(`graphData_${skillNo}`, JSON.stringify(graphData))
          return null
        }
      })
    })
  )

  useEffect(() => {
    debouncedSave.current = debounce((data, callback, noMessage) => {
      console.log(data, callback)
      appData.current.executeCommand(SAVE_GRAPH_DATA, {
        saveGraphDataService: (meta, graphData) => {
          handleSave(
            {
              ...graphData,
              ...data
            },
            callback,
            noMessage
          )
          localStorage.setItem(`graphData_${skillNo}`, JSON.stringify(graphData))
          return null
        }
      })
    })
  }, [skillFlowData, handleSave, appData, skillNo])

  const save = useCallback(
    (data, callback, noMessage) => {
      return new Promise((resolve) => {
        debouncedSave.current(data, callback, noMessage)
        resolve()
      })
    },
    [debouncedSave]
  )

  return {
    appData,
    save
  }
}

export default useSaveFlow
