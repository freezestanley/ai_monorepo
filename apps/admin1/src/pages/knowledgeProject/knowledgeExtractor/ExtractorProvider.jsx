/*
 * @Author: Dyton
 * @Date: 2024-03-04 19:13:22
 * @Descripttion: 知识萃取全局global
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-04-25 18:06:43
 * @FilePath: /za-aigc-platform-admin-static/src/pages/knowledgeProject/knowledgeExtractor/ExtractorProvider.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import { createContext, useContext, useEffect, useState } from "react"

export const ExtractorStateContext = createContext({
  infoExtractor: {
    // 空间编号
    botNo: "",
    // 知识库编号
    knowledgeBaseNo: ""
  },
  setInfoExtractor: (e) => {},
  paginationInfo: {},
  getSessionPagination: (key) => ({ current: 1, pageSize: 10 }),
  setSessionPagination: (key, value) => {}
})

export const ExtractorProvider = (props) => {
  const { children } = props
  const getSessionPagination = (key) => {
    try {
      const session = window[`${key}-pagination`]
      if (session.current) return session
      else return { current: 1, pageSize: 10 }
    } catch (error) {
      return { current: 1, pageSize: 10 }
    }
  }
  // 不走缓存，存内存里，避免切换空间页面缓存还没有更新
  const setSessionPagination = (key, page) => {
    try {
      window[`${key}-pagination`] = { ...page }
    } catch (error) {
      window[`${key}-pagination`] = { current: 1, pageSize: 10 }
    }
  }
  const [infoExtractor, setInfoExtractor] = useState({
    // 空间编号
    botNo: "",
    // 知识库编号
    knowledgeBaseNo: ""
  })
  const values = {
    infoExtractor,
    setInfoExtractor,
    getSessionPagination,
    setSessionPagination
  }

  return (
    <ExtractorStateContext.Provider value={{ ...values }}>
      {children}
    </ExtractorStateContext.Provider>
  )
}

export const useExtractor = () => useContext(ExtractorStateContext)
