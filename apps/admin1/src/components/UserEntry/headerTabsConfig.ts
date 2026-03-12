import queryString from "query-string"

export interface HeaderContext {
  pathname: string
  search: string
  queryParams: Record<string, string | string[] | null>
}

export interface HeaderTab {
  key: string
  title: string
  route: string
  preserveQuery?: boolean
  permissionCodes?: string[]
  icon?: any
  isActive?: (context: HeaderContext) => boolean
}

export interface HeaderConfig {
  key: string
  match: (context: HeaderContext) => boolean
  tabs: HeaderTab[] | ((context: HeaderContext) => HeaderTab[])
  priority?: number
}

const HEADER_CONFIG_REGISTRY: HeaderConfig[] = []

export const registerHeaderConfig = (config: HeaderConfig) => {
  HEADER_CONFIG_REGISTRY.push(config)
}

export const createRouteMatcher = (routes: string[]) => {
  return (context: HeaderContext) => routes.some((route) => context.pathname === route) //|| context.pathname.startsWith(route + "/")
}

const DEFAULT_HEADER_CONFIGS: HeaderConfig[] = [
  {
    key: "agent-detail-header",
    match: createRouteMatcher([
      "/agent/detail",
      "/agent/detailv2",
      "/skillList",
      "/editSkill",
      "/test/set",
      "/test/set/",
      "/test/variable",
      "/test/variable/",
      "/test/set/data/list",
      "/flywheel/overview",
      "/flywheel/optimization"
    ]),
    tabs: (context) => {
      const getQueryValue = (ctx: HeaderContext, key: string) => {
        const value = ctx.queryParams[key]
        if (Array.isArray(value)) return value[0]
        if (value === null) return undefined
        return value
      }

      const isAgentDetailRoute = ["/agent/detail", "/agent/detailv2"].includes(context.pathname)
      const isVoiceAgentDetail =
        isAgentDetailRoute && String(getQueryValue(context, "agentMode") || "") === "2"

      const buildAgentDetailRoute = (agentTab: "arrangement" | "data") =>
        queryString.stringifyUrl({
          url: context.pathname,
          query: {
            ...context.queryParams,
            agentTab
          }
        })

      const tabs: HeaderTab[] = [
        {
          key: "agent",
          title: "Agent",
          route: isVoiceAgentDetail ? buildAgentDetailRoute("arrangement") : "/agent/detail",
          icon: "icon-piliangceshi",
          permissionCodes: ["promptEngineering"],
          isActive: (activeContext) => {
            if (isVoiceAgentDetail) {
              const activeTab = getQueryValue(activeContext, "agentTab")
              return (
                ["/agent/detail", "/agent/detailv2"].includes(activeContext.pathname) &&
                activeTab !== "data"
              )
            }
            return ["/agent/detail", "/agent/detailv2"].includes(activeContext.pathname)
          }
        },
        {
          key: "workflow",
          title: "工作流",
          route: "/skillList",
          icon: "icon-jinengkapian-jineng",
          permissionCodes: ["skillManageList"],
          isActive: (activeContext) => ["/skillList", "/editSkill"].includes(activeContext.pathname)
        },
        {
          key: "test-set",
          title: "测试集",
          route: "/test/set/",
          icon: "icon-jinengkapian-ceshiji",
          permissionCodes: ["testSetManagement"],
          isActive: (activeContext) =>
            ["/test/set", "/test/set/", "/test/variable", "/test/variable/", "/test/set/data/list"].includes(
              activeContext.pathname
            )
        },
        {
          key: "flywheel",
          title: "数据飞轮",
          route: "/flywheel/overview",
          icon: "icon-cebian-lingxijishi",
          permissionCodes: ["dataFlywheel"],
          isActive: (activeContext) =>
            ["/flywheel/overview", "/flywheel/optimization"].includes(activeContext.pathname)
        }
      ]

      // 数据菜单：只在语音类型 Agent 详情页展示
      if (isVoiceAgentDetail) {
        tabs.splice(3, 0, {
          key: "data",
          title: "数据",
          route: buildAgentDetailRoute("data"),
          icon: "icon-cebian-shujuguanli",
          permissionCodes: [],
          isActive: (activeContext) => {
            const activeTab = getQueryValue(activeContext, "agentTab")
            return (
              ["/agent/detail", "/agent/detailv2"].includes(activeContext.pathname) &&
              activeTab === "data"
            )
          }
        })
      }

      return tabs
    }
  },
  {
    key: "knowledge-manage-header",
    match: createRouteMatcher(["/knowledgeManage"]),
    tabs: (context) => {
      const getQueryValue = (key: string) => {
        const value = context.queryParams[key]
        if (Array.isArray(value)) return value[0]
        if (value === null) return undefined
        return value
      }
      const buildRoute = (knowledgeType: string) =>
        queryString.stringifyUrl({
          url: "/knowledgeManage",
          query: {
            ...context.queryParams,
            knowledgeType
          }
        })
      const activeType = getQueryValue("knowledgeType") || "document"

      return [
        {
          key: "knowledge-document",
          title: "文档知识库",
          route: buildRoute("document"),
          icon: "icon-wendangzhishiku1",
          permissionCodes: ["appKnowledgeList"],
          isActive: () => activeType === "document"
        },
        {
          key: "knowledge-image-text",
          title: "问答知识库",
          route: buildRoute("imageText"),
          icon: "icon-wendazhishiku1",
          permissionCodes: ["appKnowledgeList"],
          isActive: () => activeType === "imageText"
        },
        {
          key: "knowledge-structure",
          title: "结构化知识库",
          route: buildRoute("structure"),
          icon: "icon-jiegouhuazhishiku1",
          permissionCodes: ["appKnowledgeList"],
          isActive: () => activeType === "structure"
        }
      ]
    }
  },
  {
    key: "voice-manage-header",
    match: createRouteMatcher(["/voice/script", "/voice/timbre", "/voice/event"]),
    tabs: [
      {
        key: "voice-script",
        title: "话术管理",
        route: "/voice/script",
        icon: "icon-huashuguanli",
        permissionCodes: ["voiceScript"]
      },
      {
        key: "voice-timbre",
        title: "音色管理",
        route: "/voice/timbre",
        icon: "icon-yinseguanli",
        permissionCodes: ["voiceTimbre"]
      },
      {
        key: "voice-event",
        title: "事件管理",
        route: "/voice/event",
        icon: "icon-shijianguanli",
        permissionCodes: ["voiceEvent"]
      }
    ]
  },
  {
    key: "data-manage-header",
    match: createRouteMatcher(["/daily-report", "/call-logs", "/voice-record", "/optimize-order"]),
    tabs: [
      {
        key: "daily-report",
        title: "日常报表",
        route: "/daily-report",
        icon: "icon-richangbaobiao",
        permissionCodes: ["appDailyReport"]
      },
      {
        key: "call-logs",
        title: "调用日志",
        route: "/call-logs",
        icon: "icon-tiaoyongrizhi",
        permissionCodes: ["appCallLogs"]
      },
      {
        key: "voice-record",
        title: "语音记录",
        route: "/voice-record",
        icon: "icon-yuyinjilu",
        permissionCodes: ["voiceRecord"]
      },
      {
        key: "optimize-order",
        title: "优化单",
        route: "/optimize-order",
        icon: "icon-youhuadan",
        permissionCodes: ["optimizationOrderManage"]
      }
    ]
  },
  {
    key: "flywheel-header",
    match: createRouteMatcher(["/flywheel/overview", "/flywheel/optimization"]),
    tabs: [
      {
        key: "flywheel-overview",
        title: "业务全景概览",
        route: "/flywheel/overview",
        icon: "icon-cebian-lingxijishi",
        permissionCodes: ["overview"]
      },
      {
        key: "flywheel-optimization",
        title: "优化建议中心",
        route: "/flywheel/optimization",
        icon: "icon-cebian-lingxijishi",
        permissionCodes: ["optimization"]
      }
    ]
  }
]

export const getHeaderConfigs = () => {
  const configs = [...DEFAULT_HEADER_CONFIGS, ...HEADER_CONFIG_REGISTRY]
  return configs.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
}

export const getHeaderConfig = (context: HeaderContext) => {
  return getHeaderConfigs().find((config) => config.match(context))
}

export const resolveHeaderTabs = (config: HeaderConfig, context: HeaderContext) => {
  return typeof config.tabs === "function" ? config.tabs(context) : config.tabs
}

export const filterTabsByPermission = (tabs: HeaderTab[], resourceCodeList: string[] = []) => {
  return tabs.filter((tab) => {
    if (!tab.permissionCodes || tab.permissionCodes.length === 0) return true
    if (!resourceCodeList.length) return false
    return tab.permissionCodes.every((code) => resourceCodeList.includes(code))
  })
}
