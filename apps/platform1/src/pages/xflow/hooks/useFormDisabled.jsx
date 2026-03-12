import { useRef, useState } from "react"
import { useLocation } from "react-router-dom"
import queryString from "query-string"
import { useStudioPublishData } from "@/hooks/useStudioPublishData"
// 流程画布节点 对应表单的禁用状态
function useFormDisabled() {
  const queryParams = queryString.parse(useLocation().search)

  // 版本发布开启，且不是开发环境
  const { isPublishDisabled } = useStudioPublishData()
  // 根据hash参数判断，如果从 订阅工作流 进入，则禁用表单&相关编辑保存按钮
  const isQueryDisabled = queryParams.mode === "showDetail"

  const isDisabled = isQueryDisabled || isPublishDisabled

  return [isDisabled, isQueryDisabled, isPublishDisabled]
}

export default useFormDisabled
