import React, { useEffect, useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { reportEvent } from "@/utils/monitorEvent"
import type { HeaderContext, HeaderTab } from "./headerTabsConfig"

interface AgentDetailSidebarProps {
  tabs: HeaderTab[]
  headerContext: HeaderContext
}

const AgentDetailSidebar = React.memo(({ tabs, headerContext }: AgentDetailSidebarProps) => {
  const navigate = useNavigate()
  const location = useLocation()

  const buildAgentListRoute = () => {
    const currentParams = new URLSearchParams(location.search)
    const keepKeys = ["botNo", "iframeStyle", "hideSideBarAndHeader", "serviceName"]
    const nextParams = new URLSearchParams()
    keepKeys.forEach((key) => {
      const value = currentParams.get(key)
      if (value !== null) {
        nextParams.set(key, value)
      }
    })
    const query = nextParams.toString()
    return query ? `/agent?${query}` : "/agent"
  }

  const buildTabRoute = (item: HeaderTab) => {
    if (item.preserveQuery === false) {
      return item.route
    }
    const currentQuery = location.search
    if (!currentQuery || item.route.includes("?")) {
      return item.route
    }
    return item.route + currentQuery
  }

  const isActive = (item: HeaderTab) => {
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

  if (!tabs.length) return null

  return (
    <aside
      className="w-[72px] flex flex-col py-5 items-center flex-shrink-0 bg-white"
      style={{ borderRight: "1px solid #F2F3F5" }}
    >
      <button
        onClick={() => navigate(buildAgentListRoute())}
        className="mb-2 h-8 w-8 rounded-lg text-[#8F959E] transition-all hover:bg-[#F9FAFB] hover:text-[#8B5CF6] flex items-center justify-center cursor-pointer"
        title="返回Agent列表"
      >
        <ArrowLeft size={16} />
      </button>
      <div className="flex flex-col items-center w-full">
        {tabs.map((item) => {
          const active = isActive(item)
          return (
            <button
              key={item.key}
              onClick={() => {
                reportEvent({
                  eventName: "custom click",
                  source: "agent sidebar",
                  action: "agent sidebar tab click",
                  pagePath: item.route,
                  pageName: item.title
                })
                navigate(buildTabRoute(item))
              }}
              className={`w-full flex flex-col items-center justify-center py-5 transition-all relative cursor-pointer ${
                active ? "text-[#8B5CF6] bg-[#F5F3FF]" : "text-[#8F959E] hover:bg-[#F9FAFB]"
              }`}
            >
              <div className="mb-1.5 text-[18px] leading-none">
                {item?.icon ? <i className={`iconfont ${item.icon}`}></i> : null}
              </div>
              <span className="text-[12px] font-bold leading-tight px-1 text-center">
                {item.title}
              </span>
            </button>
          )
        })}
      </div>
    </aside>
  )
})

export default AgentDetailSidebar
