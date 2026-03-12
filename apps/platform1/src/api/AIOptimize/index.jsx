import { useMutation } from "@tanstack/react-query"
import { optimizePrompt } from "./api"

/**
 * 提示词优化 hook
 */
export const useOptimize = () => {
  return useMutation(optimizePrompt)
}
