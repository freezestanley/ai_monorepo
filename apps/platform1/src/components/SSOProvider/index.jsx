/*
 * @Author: Dyton
 * @Date: 2024-04-09 13:37:36
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-05-06 16:02:25
 * @FilePath: /za-aigc-platform-admin-static/src/components/SSOProvider/index.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import {
  FetchUserInfoBySession,
  getTokenAndServiceName,
  getTokenAndServiceNameAsync
} from "@/api/sso"
import integrationSSOAdapter from "@/api/sso/integrationAdapter"
import queryString from "query-string"

/**
 * 检查是否为集成模式
 */
const isAdminIntegration = () => {
  try {
    const sp = queryString.parse(window.location.search) || {}
    return String(sp.za_admin_integration || "") === "1"
  } catch (e) {
    return false
  }
}
import React from "react"
import { createContext, useContext, useEffect, useState } from "react"

const SSOContext = createContext({ isInitialized: false, userInfo: {} })

export const useSSO = () => {
  return useContext(SSOContext)
}

// @ts-ignore
export const SSOProvider = React.memo(({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [userInfo, setUserInfo] = useState({})
  const [isTokenBridging, setIsTokenBridging] = useState(false)

  useEffect(() => {
    const initializeSSO = async () => {
      // 先检查同步token
      const syncTokenInfo = getTokenAndServiceName()
      const { ticket } = queryString.parse(window.location.search) || {}

      if (syncTokenInfo.token) {
        // 在集成模式下，直接使用client token，不进行额外验证
        // 因为API重定向已经确保请求发送到client的API服务器
        if (isAdminIntegration()) {
          setUserInfo({}) // 设置空用户信息，让API自己处理
          setIsInitialized(true)
          console.log("[SSOProvider] Initialized in integration mode with client token")
        } else {
          // 非集成模式，使用原有逻辑
          FetchUserInfoBySession(null, (userData) => {
            setUserInfo(userData)
            setIsInitialized(true)
          })
        }
      } else if (ticket && !isAdminIntegration()) {
        // 有 ticket 但没有 token：先用 ticket 置换 session，再获取用户信息
        FetchUserInfoBySession(null, (userData) => {
          setUserInfo(userData)
          setIsInitialized(true)
        })
      } else {
        // 没有token，设置为已初始化
        setIsInitialized(true)
      }
    }

    initializeSSO()
  }, [])

  // useEffect(() => {
  //   if (userInfo) {
  //     window.parent.postMessage(
  //       {
  //         message: "za-iframe-userinfo",
  //         userInfo
  //       },
  //       "*"
  //     )
  //   }
  // }, [userInfo])

  // 显示加载状态（可选）
  if (isTokenBridging) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "14px",
          color: "#666"
        }}
      >
        正在验证身份...
      </div>
    )
  }

  return isInitialized ? (
    <SSOContext.Provider value={{ isInitialized, userInfo }}>{children}</SSOContext.Provider>
  ) : null
})
