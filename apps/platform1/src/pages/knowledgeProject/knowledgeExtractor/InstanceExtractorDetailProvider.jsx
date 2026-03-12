/*
 * @Author: Dyton
 * @Date: 2024-03-14 17:33:04
 * @Descripttion:知识萃取-批次实例详情
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-03-27 19:10:34
 * @FilePath: /za-aigc-platform-admin-static/src/pages/knowledgeProject/knowledgeExtractor/InstanceExtractorDetailProvider.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */

import { useLocation } from "react-router-dom"
import queryString from "query-string"
import { createContext, useContext, useState } from "react"
export const ExtractorDetailStateContext = createContext({
  extractorInfo: {
    instanceId: "",
    taskName: "",
    knowledgeBaseNo: "",
    botNo: "",
    batchCode: "",
    knowledgeClassOptions: []
  },
  setExtractorInfo: (e) => {}
})
export const ExtractorDetailProvider = (props) => {
  const { children, knowledgeClassOptions = [], instanceId } = props
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search) ?? {}
  const { taskName, knowledgeBaseNo, botNo, batchCode } = queryParams
  const [extractorInfo, setExtractorInfo] = useState({
    instanceId,
    taskName,
    knowledgeBaseNo,
    botNo,
    batchCode,
    knowledgeClassOptions
  })
  const values = {
    extractorInfo: {
      ...extractorInfo,
      knowledgeClassOptions
    },
    setExtractorInfo
  }
  return (
    <ExtractorDetailStateContext.Provider value={{ ...values }}>
      {children}
    </ExtractorDetailStateContext.Provider>
  )
}

export const useExtractorDetail = () => useContext(ExtractorDetailStateContext)
