import { useEffect, useMemo } from "react"
import { Outlet } from "react-router-dom"
import { ConfigProvider, Layout, Spin } from "antd"
import queryString from "query-string"
import ErrorBoundary from "@/pages/errorBoundary"
// import { GlobalLoadingIndicator } from "@/components/globalLoadingIndicator"
import Empty from "@/router/Empty"
import { useUserEntryLogic } from "./useUserEntryLogic"
import Sidebar from "./Sidebar"
import AgentHeader from "./AgentHeader"
import AgentDetailSidebar from "./AgentDetailSidebar"
import { useAuthResources } from "@/store"
import { filterTabsByPermission, getHeaderConfig, resolveHeaderTabs } from "./headerTabsConfig"

const { Content } = Layout

// 不想使用全局loading的页面
const disableGlobalLoadingIndicator = ["/flywheel/optimization"]

function UserEntry() {
  const {
    antdTheme,
    isIframe,
    resourceMenuCodes,
    loading,
    hideSideBarAndHeader,
    isCollapsed,
    location
  } = useUserEntryLogic()
  const resourceCodeList = useAuthResources((state) => state.resourceCodeList)

  const headerMeta = useMemo(() => {
    const headerContext = {
      pathname: location.pathname,
      search: location.search,
      queryParams: queryString.parse(location.search)
    }

    const headerConfig = getHeaderConfig(headerContext)
    if (!headerConfig) {
      return {
        headerConfig: null,
        headerTabs: [],
        headerContext
      }
    }

    const tabs = filterTabsByPermission(
      resolveHeaderTabs(headerConfig, headerContext),
      resourceCodeList
    )
    return {
      headerConfig,
      headerTabs: tabs,
      headerContext
    }
  }, [location.pathname, location.search, resourceCodeList])

  const shouldShowAgentHeader = headerMeta.headerTabs.length > 0
  const shouldUseAgentDetailSidebar =
    !hideSideBarAndHeader &&
    headerMeta.headerConfig?.key === "agent-detail-header" &&
    headerMeta.headerTabs.length > 0

  useEffect(() => {
    const width =
      hideSideBarAndHeader || shouldUseAgentDetailSidebar ? "0px" : isCollapsed ? "80px" : "256px"
    document.documentElement.style.setProperty("--sidebar-width", width)
    return () => {
      document.documentElement.style.removeProperty("--sidebar-width")
    }
  }, [hideSideBarAndHeader, isCollapsed, shouldUseAgentDetailSidebar])

  return (
    <Spin spinning={loading}>
      <ConfigProvider theme={antdTheme}>
        <Layout
          className="M-user-entry"
          style={{
            ["--sidebar-width" as any]: hideSideBarAndHeader
              ? "0px"
              : shouldUseAgentDetailSidebar
                ? "0px"
                : isCollapsed
                  ? "80px"
                  : "256px"
          }}
        >
          {!resourceMenuCodes?.length ? (
            <Empty />
          ) : (
            <Layout>
              {!shouldUseAgentDetailSidebar && (
                <Sidebar isCollapsed={isCollapsed} hideSideBarAndHeader={hideSideBarAndHeader} />
              )}

              <Layout
                style={{
                  marginLeft:
                    !hideSideBarAndHeader && !shouldUseAgentDetailSidebar
                      ? isCollapsed
                        ? 80
                        : 256
                      : 0
                }}
              >
                <ErrorBoundary>
                  {/* {!disableGlobalLoadingIndicator.includes(location.pathname) && (
                    <GlobalLoadingIndicator />
                  )} */}
                  <Content className="h-full">
                    {!shouldUseAgentDetailSidebar && shouldShowAgentHeader && <AgentHeader />}
                    {/* style={{
                        height:  shouldShowAgentHeader ? "calc(100vh - 60px)" : "100vh"
                      }} */}
                    {shouldUseAgentDetailSidebar ? (
                      <div
                        className={`h-full flex ${
                          location.search.includes("botNo=") ? "bg-white" : "bg-gray-50"
                        }`}
                      >
                        <AgentDetailSidebar
                          tabs={headerMeta.headerTabs}
                          headerContext={headerMeta.headerContext}
                        />
                        <div className="min-w-0 flex-1 overflow-y-auto">
                          <Outlet />
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`overflow-y-auto ${
                          shouldShowAgentHeader ? "mt-[60px]" : ""
                        } ${location.search.includes("botNo=") ? "bg-white" : "bg-gray-50"}`}
                      >
                        <Outlet />
                      </div>
                    )}
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

export default UserEntry
