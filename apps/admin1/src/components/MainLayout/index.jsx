/*
 * @Author: Dyton
 * @Date: 2023-10-16 14:52:58
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-04-25 20:05:21
 * @FilePath: /za-aigc-platform-admin-static/src/components/MainLayout/index.jsx
 * Copyright (c) 2023 by ZA-智能中台, All Rights Reserved.
 */
// 1. 创建一个 MainLayout 组件
// @ts-ignore
import React from "react"
// @ts-ignore
import { useEffect, useLayoutEffect, useState, useCallback, Profiler } from "react"
import { useSelector } from "react-redux"
import { useLocation } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { ConfigProvider, Layout, theme } from "antd"
import ErrorBoundary from "@/pages/errorBoundary"
import { GlobalLoadingIndicator } from "@/components/globalLoadingIndicator"
import { usePreviousLocation } from "@/router/PreviousLocationProvider"
const { darkAlgorithm, defaultAlgorithm } = theme
const ROUTE_TRANSITION_HIDE_SCROLL_MS = 300

const MainLayout = React.memo(function MainLayout({
  // @ts-ignore
  children,
  // @ts-ignore
  closeGlobalLoadingIndicator = false
}) {
  // @ts-ignore
  const globalTheme = useSelector((state) => state.theme)
  const [antdTheme, setAntdTheme] = useState({
    algorithm: globalTheme.dark ? darkAlgorithm : defaultAlgorithm
  })
  useEffect(() => {
    let newTheme = {
      algorithm: globalTheme.dark ? darkAlgorithm : defaultAlgorithm
    }
    if (globalTheme.colorPrimary) {
      newTheme.token = { colorPrimary: globalTheme.colorPrimary }
    }
    setAntdTheme(newTheme)
  }, [globalTheme])

  const location = useLocation()
  const { setPrevLocation } = usePreviousLocation()
  const locationKey = `${location.pathname}${location.search}`

  useEffect(() => {
    setPrevLocation(location.pathname)
  }, [location.pathname, setPrevLocation])

  useLayoutEffect(() => {
    const root = document.documentElement
    const body = document.body
    const prevOverflowY = root.style.overflowY
    const prevBodyOverflowY = body.style.overflowY
    root.style.overflowY = "hidden"
    body.style.overflowY = "hidden"
    const timer = setTimeout(() => {
      root.style.overflowY = prevOverflowY
      body.style.overflowY = prevBodyOverflowY
    }, ROUTE_TRANSITION_HIDE_SCROLL_MS)
    return () => {
      clearTimeout(timer)
      root.style.overflowY = prevOverflowY
      body.style.overflowY = prevBodyOverflowY
    }
  }, [locationKey])

  return (
    <ConfigProvider theme={antdTheme}>
      {/* {!closeGlobalLoadingIndicator ? <GlobalLoadingIndicator /> : null} */}
      <ErrorBoundary>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={locationKey}
            className="motion-route"
            initial={{
              opacity: 0,
              scale: 0.985,
              filter: "blur(16px)"
            }}
            animate={{
              opacity: 1,
              scale: 1,
              filter: "blur(0px)"
            }}
            exit={{
              opacity: 0,
              scale: 1,
              filter: "blur(20px)"
            }}
            transition={{
              duration: 0.26,
              ease: [0.16, 1, 0.3, 1]
            }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </ErrorBoundary>
    </ConfigProvider>
  )
})

export default MainLayout
