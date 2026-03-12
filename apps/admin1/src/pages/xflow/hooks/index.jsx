import {
  useFetchFormControlType,
  useFetchLlmModelType,
  useFetchOutputType,
  useFetchSkillStatus,
  useFetchSkillType,
  useFetchTools,
  useFetchVariableType
} from "@/api/common"

export const useCustomFormControlType = () => {
  return useFetchFormControlType()
}

export const useCustomLlmModelType = () => {
  return useFetchLlmModelType()
}

export const useCustomOutputType = () => {
  return useFetchOutputType()
}

export const useCustomSkillStatus = () => {
  return useFetchSkillStatus()
}

export const useCustomSkillType = () => {
  return useFetchSkillType()
}

export const useCustomVariableType = () => {
  return useFetchVariableType()
}

export const useCustomTools = () => {
  return useFetchTools()
}

import { useState, useEffect } from "react"
import { useIsFetching, useIsMutating } from "@tanstack/react-query"

export const useGlobalLoading = () => {
  const isFetching = useIsFetching()
  const isMutating = useIsMutating()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let timeoutId
    if (isFetching > 0 || isMutating > 0) {
      timeoutId = setTimeout(() => setIsLoading(true), 0)
    } else {
      clearTimeout(timeoutId)
      setIsLoading(false)
    }
    return () => clearTimeout(timeoutId)
  }, [isFetching, isMutating])

  return isLoading
}
