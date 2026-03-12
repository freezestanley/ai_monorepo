/*
 * @Author: Dyton
 * @Date: 2023-11-08 15:55:35
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-04-25 20:03:31
 * @FilePath: /za-aigc-platform-admin-static/src/main.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import ReactDOM from "react-dom/client"
import { RouterProvider } from "react-router-dom"
import { globalRouters } from "@/router"
import { ConfigProvider, message } from "antd"
import { store } from "@/store/store"
import { Provider } from "react-redux"
import DifyModal from "@/pages/addBot/components//Agent/DifyModal"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // 这将为所有查询在失败后重试2次
      refetchOnWindowFocus: false
    }
  }
})

message.config({
  duration: 2
})

// 引入Ant Design中文语言包
import zhCN from "antd/locale/zh_CN"
// 全局样式
import "@/common/styles/frame.styl"
import "./mock"
import "./main.less"
import "@antv/xflow/dist/index.css"
import "react-quill/dist/quill.snow.css"
import "quill-emoji/dist/quill-emoji.css" // 导入emoji样式

import { Suspense, useState, useEffect } from "react"
import { PreviousLocationProvider } from "./router/PreviousLocationProvider"
import { SSOProvider } from "./components/SSOProvider"
import { MemoryStorageProvider } from "./components/MemoryProvider"
// 知识工程Provider
import { ExtractorProvider } from "./pages/knowledgeProject/knowledgeExtractor"
import NiceModal from "@ebay/nice-modal-react"

import { Global } from "@emotion/react"
import GlobalAntdStyles from "./antd-styles"
import { Token } from "./antd-styles/Token"
import CustomEmpty from "./antd-styles/components/CustomEmpty"

const Root = () => {
  const [difyModalVisible, setDifyModalVisible] = useState(false)

  useEffect(() => {
    if (window.self === window.top) {
      document.querySelector("#root").style.overflow = "hidden"
    }
  }, [])

  useEffect(() => {
    const difyModalAlready = localStorage.getItem("difyModalAlready")
    if (difyModalAlready) {
      return
    } else {
      localStorage.setItem("difyModalAlready", "true")
      setDifyModalVisible(true)
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
      <Provider store={store}>
        <SSOProvider>
          <ConfigProvider
            theme={{
              token: Token.provider
            }}
            renderEmpty={() => <CustomEmpty description={undefined} />}
            locale={zhCN}
          >
            <PreviousLocationProvider>
              <MemoryStorageProvider>
                <ExtractorProvider>
                  <Suspense fallback={null}>
                    <NiceModal.Provider>
                      {/* <DifyModal
                        visible={difyModalVisible}
                        onClickTryDify={() => {
                          setDifyModalVisible(false)
                        }}
                        onClose={() => {
                          setDifyModalVisible(false)
                        }}
                      /> */}
                      <Global styles={GlobalAntdStyles} />
                      <RouterProvider router={globalRouters} />
                    </NiceModal.Provider>
                  </Suspense>
                </ExtractorProvider>
              </MemoryStorageProvider>
            </PreviousLocationProvider>
          </ConfigProvider>
        </SSOProvider>
      </Provider>
    </QueryClientProvider>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root></Root>)
