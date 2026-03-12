import { Outlet } from "react-router-dom"
import Header from "@/components/header"
import SidebarMenu from "@/components/sidebarMenu"
import { useSelector } from "react-redux"
import { ConfigProvider, Layout, Spin, theme } from "antd"
import { useCollapsed } from "@/store"
import ErrorBoundary from "@/pages/errorBoundary"
import "./entry.styl"
import { useNavigate, useLocation } from "react-router-dom"
import { GlobalLoadingIndicator } from "@/components/globalLoadingIndicator"
import { useEffect, useState } from "react"
import LogoIcon from "@/components/logoIcon"
import { usePreviousLocation } from "@/router/PreviousLocationProvider"
import { useSSO } from "@/components/SSOProvider"
import { getUserAuthResources } from "@/api/permission/api"
import { useAuthResources, useMenuResourcesCodes } from "@/store"
import Empty from "@/router/Empty"
import queryString from "query-string"
import { isInsideIframe } from "@/utils"
const { darkAlgorithm, defaultAlgorithm } = theme
const { Sider, Content } = Layout
import "./entry.scss"
import { useParams } from "react-router-dom"

// 不想使用全局loading的页面
const disableGlobalLoadingIndicator = ["/flywheel/optimization"]

function Entry() {
  // @ts-ignore
  const globalTheme = useSelector((state) => state.theme)
  const isCollapsed = useCollapsed((state) => state.collapsed)
  const location = useLocation()
  const navigate = useNavigate()
  const { isInitialized } = useSSO()

  const { search } = location
  const queryParams = queryString.parse(search)

  const [antdTheme, setAntdTheme] = useState({
    algorithm: globalTheme.dark ? darkAlgorithm : defaultAlgorithm
  })

  const searchParams = queryString.parse(window.location.search) || {}
  const hashParams = queryString.parse(window.location.hash.split("?")[1] || "") || {}
  const { iframeStyle } = hashParams
  const { token } = searchParams.token ? searchParams : hashParams
  const isIframe = token || iframeStyle

  useEffect(() => {
    let newTheme = {
      algorithm: globalTheme.dark ? darkAlgorithm : defaultAlgorithm
    }
    if (globalTheme.colorPrimary) {
      newTheme.token = { colorPrimary: globalTheme.colorPrimary }
    }
    setAntdTheme(newTheme)
  }, [globalTheme])

  useEffect(() => {
    if (navigator.appVersion.indexOf("Win") != -1) {
      document.documentElement.classList.add("windows")
    }
  }, [])

  const { setPrevLocation } = usePreviousLocation()

  useEffect(() => {
    setPrevLocation(location.pathname)
  }, [location.pathname, setPrevLocation])

  const changeResourceCodeList = useAuthResources((state) => state.changeResourceCodeList)
  // 菜单权限Code集合 [code]
  const { setResourceMenuCodes, resourceMenuCodes } = useMenuResourcesCodes((state) => state)
  const [loading, setLoading] = useState(true)

  const { botNo: botNoFormQuery } = queryParams
  const { botNo: botNoFromParams } = useParams()
  const botNo = botNoFromParams || botNoFormQuery
  const getAuthResources = async () => {
    const res = await getUserAuthResources({ botNo: botNo })
    if (res?.menuCode) {
      changeResourceCodeList(res?.menuCode)
    }
    if (res?.menuTree) {
      setResourceMenuCodes(res?.menuTree)
    }
    setLoading(false)
  }
  useEffect(() => {
    console.log("isInitialized", isInitialized)
    if (isInitialized) getAuthResources()
  }, [isInitialized])

  const hideSideBarAndHeader =
    queryParams.hideSideBarAndHeader === "true" ||
    queryParams.iframeStyle === "true" ||
    isInsideIframe()

  return (
    <Spin spinning={loading}>
      <ConfigProvider theme={antdTheme}>
        <Layout className="M-entry">
          {!isInitialized || !resourceMenuCodes?.length ? (
            <Empty />
          ) : (
            <Layout>
              {!hideSideBarAndHeader && (
                <Sider width={isCollapsed ? "80px" : "200px"}>
                  {isCollapsed ? (
                    <div className="logo" onClick={() => navigate("/admin/addBotList")}>
                      <LogoIcon />
                    </div>
                  ) : (
                    <div className="logo" onClick={() => navigate("/admin/addBotList")}>
                      <LogoIcon />
                      <span className="ml-2">灵犀管理平台</span>
                    </div>
                  )}
                  <SidebarMenu />
                </Sider>
              )}

              <Layout>
                {!hideSideBarAndHeader && (
                  <div className={`${!isIframe ? "no-iframe-header" : ""}`}>
                    <Header />
                  </div>
                )}
                <ErrorBoundary>
                  {/* {!disableGlobalLoadingIndicator.includes(location.pathname) && (
                    <GlobalLoadingIndicator />
                  )} */}
                  <Content className="h-full">
                    {/* m-2 */}
                    <div
                      className={`entry-page h-full-match 0 ${!isIframe ? "pb-5 entry-page-no-iframe " : ""}`}
                    >
                      <Outlet />
                    </div>
                  </Content>
                </ErrorBoundary>
              </Layout>
            </Layout>
          )}
        </Layout>
      </ConfigProvider>
    </Spin>
  )
}

export default Entry
