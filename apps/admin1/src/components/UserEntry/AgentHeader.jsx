import React, { useEffect, useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import queryString from "query-string"
// import { useUserinfoStore } from "@/store"
import { reportEvent } from "@/utils/monitorEvent"
import { useAuthResources } from "@/store"
import { filterTabsByPermission, getHeaderConfig, resolveHeaderTabs } from "./headerTabsConfig"

const AgentHeader = React.memo(() => {
  const navigate = useNavigate()
  const location = useLocation()
  const resourceCodeList = useAuthResources((state) => state.resourceCodeList)
  // const userInfo = useUserinfoStore((store) => store.data)

  const headerContext = {
    pathname: location.pathname,
    search: location.search,
    queryParams: queryString.parse(location.search)
  }

  const headerConfig = getHeaderConfig(headerContext)
  const tabs = headerConfig
    ? filterTabsByPermission(resolveHeaderTabs(headerConfig, headerContext), resourceCodeList)
    : []

  const buildTabRoute = (item) => {
    if (item.preserveQuery === false) {
      return item.route
    }
    const currentQuery = location.search
    if (!currentQuery || item.route.includes("?")) {
      return item.route
    }
    return item.route + currentQuery
  }

  const handleTabClick = (item) => {
    reportEvent({
      eventName: "custom click",
      source: "agent header",
      action: "agent header tab click",
      pagePath: item.route,
      pageName: item.title
    })
    navigate(buildTabRoute(item))
  }

  const isActive = (item) => {
    if (item.isActive) {
      return item.isActive(headerContext)
    }
    const routePath = item.route.split("?")[0]
    return location.pathname === routePath || location.pathname.startsWith(routePath + "/")
  }

  const activeTab = useMemo(() => {
    if (!tabs.length) return null
    return tabs.find((item) => isActive(item)) || null
  }, [tabs, location.pathname, location.search])

  useEffect(() => {
    if (!tabs.length) return
    if (activeTab) return
    const targetRoute = buildTabRoute(tabs[0])
    const currentRoute = `${location.pathname}${location.search}`
    if (targetRoute !== currentRoute) {
      navigate(targetRoute, { replace: true })
    }
  }, [tabs, activeTab, location.pathname, location.search, navigate])

  if (!headerConfig || !tabs.length) {
    return null
  }

  return (
    <div
      className="w-[100%] fixed top-[0px] bg-white h-[60px]"
      style={{ borderBottom: "1px solid #f2f2f2" }}
    >
      <div className="flex justify-center items-center gap-6 flex-1 h-[60px] fixed top-0 z-[100] left-0 right-0 pl-[256px] max-w-[900px] mx-auto">
        {tabs.map((item) => (
          <div
            key={item.key}
            onClick={() => handleTabClick(item)}
            className={`flex items-center justify-center gap-2 px-[18px] h-[40px] leading-[40px] rounded-[8px] transition-all duration-300 font-semibold cursor-pointer text-[#525866] hover:bg-white hover:shadow-[0px_4px_12px_0px_rgba(24,27,37,0.08)] hover:text-[#7f56d9] ${
              isActive(item)
                ? "bg-white shadow-[0px_4px_12px_0px_rgba(24,27,37,0.08)] text-[#7f56d9]"
                : ""
            }`}
          >
            {item?.icon && <i className={`iconfont ${item?.icon}`}></i>}
            {item.title}
          </div>
        ))}
      </div>
    </div>
  )
})

export default AgentHeader
