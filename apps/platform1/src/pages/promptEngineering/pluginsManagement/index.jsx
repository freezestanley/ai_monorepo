import React, { useState, createContext, useContext } from "react"
import { Header } from "@/components/PageHeader"
import { MyTableModule } from "./components/MyTableModule"
import { SubtableModule } from "./components/SubtableModule"
import { SearchForm } from "./components/searchForm"
import { EditModal } from "./components/EditModal"
import queryString from "query-string"
import { useLocation, useNavigate } from "react-router-dom"
import styles from "./index.module.scss"
import { Tabs } from "antd"
import { useInitPublishData } from "@/hooks/useStudioPublishData"

import "./components/MyTableModule/index.scss"
import { useEffect } from "react"

export const PlginsManageContext = createContext({
  botNo: "",
  searchKey: "",
  visible: false,
  visibleCreate: false,
  currentRecord: null,
  setVisible: (e) => {},
  setVisibleCreate: (e) => {},
  setSearchKey: (e) => {},
  setIsEditing: (e) => {},
  setCurrentRecord: (e) => {}
})
export const usePlginsManage = () => useContext(PlginsManageContext)
export const PlginsManageProvider = (props) => {
  const [searchKey, setSearchKey] = useState("")
  const [visible, setVisible] = useState(false)
  const [visibleCreate, setVisibleCreate] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)

  // 获取链接上参数
  const navigate = useNavigate()
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search) ?? {}
  const { botNo } = queryParams

  const values = {
    botNo,
    searchKey,
    visible,
    visibleCreate,
    currentRecord,
    setVisible,
    setVisibleCreate,
    setSearchKey,
    setIsEditing,
    setCurrentRecord
  }
  return (
    <PlginsManageContext.Provider value={values}>{props.children}</PlginsManageContext.Provider>
  )
}

export const ModuleComponents = () => {
  const [activeKey, setActiveKey] = useState("1")
  // 监听滚动

  const [pageScrollTop, setPageScrollTop] = useState(0)
  const scrollChange = () => {
    // 监听滚动条距离顶部距离
    setPageScrollTop(document.documentElement.scrollTop || 0)
  }

  useEffect(() => {
    // 滚动条滚动时触发
    window.addEventListener("scroll", scrollChange, true)
    scrollChange()
    return () => {
      window.removeEventListener("scroll", scrollChange, false)
    }
  }, [])

  const searchParams = queryString.parse(window.location.search) || {}
  const hashParams = queryString.parse(window.location.hash.split("?")[1] || "") || {}
  const { token: isIframe } = searchParams.token ? searchParams : hashParams

  // 获取版本发布配置数据
  useInitPublishData()

  return (
    <div className={styles["plugins-management-page"]}>
      {/* <Header title={"工具管理"} /> */}
      {/* className="promptEngineering" */}
      <div className="px-[20px] py-[20px]">
        {/* className={styles["plugins-management-module"]} */}
        <div>
          <Tabs
            defaultActiveKey="1"
            className={` ${!isIframe ? "tab-skill-no-iframe" : "tab-skill"} ${pageScrollTop > 10 && isIframe ? "tab-skill-shadow" : ""}`}
            items={[
              {
                key: "1",
                label: "我的工具",
                children: (
                  <>
                    <SearchForm />
                    <div
                      style={{ height: "calc(100vh - 120px)" }}
                      className="mt-[20px] overflow-y-auto px-[5px] pt-2"
                    >
                      <MyTableModule />
                    </div>
                  </>
                )
              },
              {
                key: "2",
                label: "我的订阅",
                children: (
                  <div
                    style={{ height: "calc(100vh - 70px)" }}
                    className="overflow-y-auto px-[5px] pt-2"
                  >
                    <SubtableModule />
                  </div>
                )
              }
            ]}
            onChange={(value) => {
              setActiveKey(value)
            }}
          />
          {/* <div className={`${activeKey === "1" ? "pt-[123px]" : "pt-[69px]"}`}>
            {activeKey == 1 ? <MyTableModule /> : <SubtableModule />}
          </div> */}

          <EditModal />
        </div>
      </div>
    </div>
  )
}

const PluginsManagePage = () => (
  <PlginsManageProvider>
    <ModuleComponents />
  </PlginsManageProvider>
)

export default PluginsManagePage
