import type { ReactNode } from "react"
import { Dropdown, Tooltip } from "antd"
import type { MenuProps } from "antd"
import { useNavigate, useLocation } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import { menuConfig } from "./menuConfig"
import { innerMenuConfig } from "./innerMenuConfig"
import "./SidebarMenu.scss"
import { useAuthResources, useMenuResourcesCodes } from "@/store"

interface SidebarMenuProps {
  isCollapsed: boolean
}

interface SidebarMenuItem {
  key: string
  label: string
  path: string
  icon: ReactNode
  resourceCode?: string | string[]
  children?: SidebarMenuItem[]
}

export default function SidebarMenu({ isCollapsed }: SidebarMenuProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const resourceCodeList = useAuthResources((state) => state.resourceCodeList)
  const { resourceMenuCodes } = useMenuResourcesCodes((state) => state)
  const urlParams = new URLSearchParams(location.search)
  const botNo = urlParams.get("botNo")
  const currentMenuConfig = botNo ? innerMenuConfig : menuConfig
  const shouldFilter = !!botNo
  const hasPermission = (item: SidebarMenuItem) => {
    if (!shouldFilter) return true
    if (!item.resourceCode) return true
    if (!resourceCodeList?.length && !resourceMenuCodes?.length) return false
    const codes = Array.isArray(item.resourceCode) ? item.resourceCode : [item.resourceCode]
    return codes.every(
      (code) => resourceCodeList?.includes(code) || resourceMenuCodes?.includes(code)
    )
  }

  const filterMenuItems = (items: SidebarMenuItem[] = []) => {
    const nextItems = []
    items.forEach((item) => {
      if (item.children?.length) {
        const nextChildren = filterMenuItems(item.children)
        if (!nextChildren.length) return
        if (!hasPermission(item)) return
        nextItems.push({ ...item, children: nextChildren })
        return
      }
      if (hasPermission(item)) {
        nextItems.push(item)
      }
    })
    return nextItems
  }

  const filteredMenuConfig = shouldFilter
    ? {
        groups: currentMenuConfig.groups
          .map((group) => {
            if (group.skipPermission) return group
            const items = filterMenuItems(group.items)
            if (!items.length) return null
            return { ...group, items }
          })
          .filter(Boolean)
      }
    : currentMenuConfig
  const activePathAliases: Record<string, string[]> = {
    "/agent": [
      "/agent/detail",
      "/agent/detailv2",
      "/skillList",
      "/plugins-management",
      "/test/set",
      "/test/set/",
      "/test/variable",
      "/test/variable/",
      "/test/set/data/list",
      "/flywheel/overview",
      "/flywheel/optimization"
    ],
    "/voice/script": ["/voice/timbre", "/voice/event"],
    "/call-logs": ["/daily-report", "/voice-record", "/optimize-order"]
  }
  const aliasOwnerPath = Object.entries(activePathAliases).find(([, aliases]) =>
    aliases.includes(location.pathname)
  )?.[0]

  const getBasePath = (path: string) => path.split("?")[0]

  const handleMenuClick = (path: string) => {
    const urlParams = new URLSearchParams(location.search)
    const botNo = urlParams.get("botNo")

    if (/^https?:\/\//.test(path)) {
      const targetUrl = new URL(path)
      if (botNo) {
        targetUrl.searchParams.set("botNo", botNo)
      }
      if (!targetUrl.searchParams.get("workbenchNo")) {
        targetUrl.searchParams.set("workbenchNo", "chat_with_ai")
      }
      window.open(targetUrl.toString(), "_blank")
      return
    }

    const baseParams = new URLSearchParams({
      iframeStyle: "false",
      hideSideBarAndHeader: "false",
      serviceName: "za-open-bot"
    })

    if (botNo) {
      baseParams.set("botNo", botNo)
    }

    if (path === "/qa") {
      baseParams.set("workbenchNo", "chat_with_ai")
      navigate(`/qa?${baseParams.toString()}`)
      return
    }

    if (path === "/chat") {
      baseParams.set("botNo", "20230911145536286")
      baseParams.set("isIframe", "false")
      navigate(`/agent?${baseParams.toString()}`)
    } else {
      const separator = path.includes("?") ? "&" : "?"
      navigate(`${path}${separator}${baseParams.toString()}`)
    }
  }

  const isPathActive = (path: string) => {
    const basePath = getBasePath(path)
    if (aliasOwnerPath && basePath !== aliasOwnerPath && location.pathname === basePath) {
      return false
    }
    const matchedPath =
      location.pathname === basePath ||
      (activePathAliases[basePath] || []).includes(location.pathname)

    if (!matchedPath) {
      return false
    }

    // 仅当菜单路径带有 tab 参数时，才要求 tab 精确匹配
    if (path.includes("?")) {
      const pathParams = new URLSearchParams(path.split("?")[1])
      const pathTab = pathParams.get("tab")
      if (pathTab) {
        const currentParams = new URLSearchParams(location.search)
        const currentTab = currentParams.get("tab")
        return pathTab === currentTab
      }
    }

    return true
  }

  const hasActiveChild = (items: SidebarMenuItem[] = []) => {
    return items.some(
      (item) => isPathActive(item.path) || (item.children && hasActiveChild(item.children))
    )
  }

  const buildMenuItems = (
    items: SidebarMenuItem[] = [],
    keyPrefix: string,
    keyToPath: Record<string, string>
  ): MenuProps["items"] => {
    const wrapMenuIcon = (icon: ReactNode) => (
      <span className="sidebar-menu-dropdown-icon">{icon}</span>
    )

    return items.map((item) => {
      const itemKey = `${keyPrefix}${item.key}`
      if (item.children?.length) {
        return {
          key: itemKey,
          label: item.label,
          icon: wrapMenuIcon(item.icon),
          children: buildMenuItems(item.children, `${itemKey}-`, keyToPath)
        }
      }
      keyToPath[itemKey] = item.path
      return {
        key: itemKey,
        label: item.label,
        icon: wrapMenuIcon(item.icon)
      }
    })
  }

  const getActiveMenuKey = (items: SidebarMenuItem[] = [], keyPrefix: string) => {
    for (const item of items) {
      const itemKey = `${keyPrefix}${item.key}`
      if (item.children?.length) {
        const childKey = getActiveMenuKey(item.children, `${itemKey}-`)
        if (childKey) return childKey
      } else if (isPathActive(item.path)) {
        return itemKey
      }
    }
    return null
  }

  const withTooltip = (node: ReactNode, title: string) => {
    if (!isCollapsed) return node
    return (
      <Tooltip title={title} placement="right">
        {node}
      </Tooltip>
    )
  }

  return (
    <div className="space-y-8 pb-2">
      {filteredMenuConfig.groups.map((group) => (
        <div key={group.title}>
          {!isCollapsed && (
            <div className="px-2 text-xs uppercase tracking-wider text-gray-400 mb-3">
              {group.title}
            </div>
          )}
          <div className="space-y-2">
            {group.items.map((item: any) => {
              const active = item.children?.length
                ? hasActiveChild(item.children) || isPathActive(item.path)
                : isPathActive(item.path)
              const menuKeyToPath: Record<string, string> = {}
              const dropdownItems = item.children?.length
                ? buildMenuItems(item.children, `${item.key}-`, menuKeyToPath)
                : []
              const activeMenuKey = item.children?.length
                ? getActiveMenuKey(item.children, `${item.key}-`)
                : null

              const buttonContent = (
                <>
                  <div
                    className={`w-5 h-5 flex items-center justify-center shrink-0 ${
                      active
                        ? "text-[#7958D2]"
                        : "text-slate-400 group-hover:text-[#7958D2] transition-colors"
                    }`}
                  >
                    {item.icon}
                  </div>
                  {!isCollapsed && (
                    <div className="flex w-full items-center justify-between">
                      <span className="flex-1 text-left font-[400] whitespace-nowrap overflow-hidden">
                        {item.label}
                      </span>
                      {item.children?.length ? (
                        <span className="inline-flex items-center justify-center text-slate-400 text-[12px] leading-none">
                          <ChevronRight size={14} />
                        </span>
                      ) : null}
                    </div>
                  )}
                </>
              )

              if (item.children?.length) {
                return withTooltip(
                  <Dropdown
                    key={item.key}
                    placement="right"
                    trigger={["hover"]}
                    overlayClassName="sidebar-menu-dropdown"
                    menu={{
                      items: dropdownItems,
                      selectedKeys: activeMenuKey ? [activeMenuKey] : [],
                      triggerSubMenuAction: "hover",
                      onClick: ({ key }) => {
                        const targetPath = menuKeyToPath[String(key)]
                        if (targetPath) {
                          handleMenuClick(targetPath)
                        }
                      }
                    }}
                  >
                    <button
                      title={item.label}
                      className={`w-full cursor-pointer flex items-center rounded-xl text-sm font-bold transition-all group ${
                        isCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"
                      } ${
                        active
                          ? "bg-[#7958D2]/10 text-[#7958D2] shadow-sm ring-1 ring-[#7958D2]/10"
                          : "text-slate-500 hover:bg-gray-50 hover:text-slate-900"
                      }`}
                    >
                      {buttonContent}
                    </button>
                  </Dropdown>,
                  item.label
                )
              }

              return withTooltip(
                <button
                  key={item.key}
                  onClick={() => handleMenuClick(item.path)}
                  title={item.label}
                  className={`w-full cursor-pointer flex items-center rounded-xl text-sm font-bold transition-all group ${
                    isCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"
                  } ${
                    active
                      ? "bg-[#7958D2]/10 text-[#7958D2] shadow-sm ring-1 ring-[#7958D2]/10"
                      : "text-slate-500 hover:bg-gray-50 hover:text-slate-900"
                  }`}
                >
                  {buttonContent}
                </button>,
                item.label
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
