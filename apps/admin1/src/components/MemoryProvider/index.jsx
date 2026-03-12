/*
 * @Author: Dyton
 * @Date: 2024-03-04 19:13:22
 * @Descripttion: 知识萃取全局global
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-04-25 20:02:41
 * @FilePath: /za-aigc-platform-admin-static/src/components/MemoryProvider/index.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import { createContext, useContext, useState } from "react"

export const MemoryStorageStateContext = createContext({
  getMemoryPagination: (key) => ({ current: 1, pageSize: 10 }),
  setMemoryPagination: (key, value) => {}
})

export const MemoryStorageProvider = (props) => {
  const { children } = props
  const defaultKey = "memory" + window.location.hash
  const getMemoryPagination = (key = defaultKey) => {
    try {
      const session = window[`${key}-pagination`]
      if (session.current) return session
      else return { current: 1, pageSize: 10 }
    } catch (error) {
      return { current: 1, pageSize: 10 }
    }
  }
  // 不走缓存，存内存里，避免切换空间页面缓存还没有更新
  const setMemoryPagination = (key = defaultKey, page) => {
    try {
      window[`${key}-pagination`] = { ...page }
    } catch (error) {
      window[`${key}-pagination`] = { current: 1, pageSize: 10 }
    }
  }

  const values = {
    getMemoryPagination,
    setMemoryPagination
  }

  return (
    <MemoryStorageStateContext.Provider value={{ ...values }}>
      {children}
    </MemoryStorageStateContext.Provider>
  )
}

export const useMemoryStorage = () => useContext(MemoryStorageStateContext)
