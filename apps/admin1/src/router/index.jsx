import { Suspense } from "react"
import { createBrowserRouter, Navigate } from "react-router-dom"
import withLoadable from "@/utils/withLoadable"
// 引入Entry框架页面
import { globalConfig } from "@/globalConfig"
import { BotRoutes } from "./robotRoutes"
import MainLayout from "@/components/MainLayout"
import FallBack from "@/components/FallBack"
// const Login = lazy(() => import("@/pages/login"))
import {
  knowledgeExtractionRouters,
  dataManagementRouters,
  knowledgeManagementRouters
} from "./routers/knowledgeProject"
import { versionManagementRouters } from "./routers/versionManagement"
import { publicResourcesRouters } from "./routers/publicResources"
import OnlineStudy from "@/pages/study/online"
import { isStudio } from "@/config.env"

// lazy
// import MarkdownPreview from "@/pages/tools/markdownPreview"
const Entry = withLoadable(() => import("@/pages/entry"))
const UserEntry = withLoadable(() => import("@/components/UserEntry"))
const UserManageMent = withLoadable(() => import("@/pages/permission/UserManageMent"))
const MenuAuthManagement = withLoadable(() => import("@/pages/permission/MenuAuthManagement"))
const GroupManageMent = withLoadable(() => import("@/pages/permission/GroupManageMent"))
const RoleManageMent = withLoadable(() => import("@/pages/permission/RoleManageMent"))
const SkillTemplateManageMent = withLoadable(
  () => import("@/pages/permission/SkillTemplateManageMent")
)
const UserFeedback = withLoadable(() => import("@/pages/dataStatistic/userFeedback"))
const SecurityAlarm = withLoadable(() => import("@/pages/dataStatistic/securityAlarm"))
const DailyReport = withLoadable(() => import("@/pages/dataStatistic/dailyReport"))
const CallLogs = withLoadable(() => import("@/pages/dataStatistic/callLogs"))
const VoiceRecord = withLoadable(() => import("@/pages/dataStatistic/voiceRecord"))
const OptimizeOrder = withLoadable(() => import("@/pages/dataStatistic/optimizeOrder"))
const AvailableLimit = withLoadable(() => import("@/pages/availableLimit"))
const AiLabManage = withLoadable(() => import("@/pages/aiLabManage"))
const TechnicalRadar = withLoadable(() => import("@/pages/technicalRadar"))
const Workbench = withLoadable(() => import("@/pages/workbench"))
const BotConstants = withLoadable(() => import("@/pages/botConstants"))
const PluginsManagement = withLoadable(() => import("@/pages/promptEngineering/pluginsManagement"))
const PluginsDetail = withLoadable(() => import("@/pages/promptEngineering/pluginsDetail"))
const PluginToolList = withLoadable(() => import("@/pages/pluginToolList"))
const ModelManage = withLoadable(() => import("@/pages/modelManage"))
const Market = withLoadable(() =>
  import("@/pages/market").then((module) => ({ default: module.Market }))
)
const MarketSub = withLoadable(() =>
  import("@/pages/market-sub").then((module) => ({ default: module.MarketSub }))
)
const CreatePluginTools = withLoadable(() => import("@/pages/createPluginTools"))
const ToolsList = withLoadable(() => import("@/pages/tools"))
const FileUpload = withLoadable(() => import("@/pages/tools/file/upload"))
const Page404 = withLoadable(() => import("@/pages/404"))
// const OnlineStudy = withLoadable(() => import("@/pages/study/online"))
const InfoType = withLoadable(() =>
  import("@/pages/infocenter").then((module) => ({ default: module.InfoType }))
)
const InfoDetail = withLoadable(() =>
  import("@/pages/infocenter").then((module) => ({ default: module.InfoDetail }))
)
const InfoView = withLoadable(() =>
  import("@/pages/infocenter").then((module) => ({ default: module.InfoView }))
)
const InfoEdit = withLoadable(() =>
  import("@/pages/infocenter").then((module) => ({ default: module.InfoEdit }))
)
const MarkdownPreview = withLoadable(() => import("@/pages/tools/markdownPreview"))
// import KnowledgeSourceTag from "@/pages/knowledgeSourceTag"
const KnowledgeSourceTag = withLoadable(() => import("@/pages/knowledgeSourceTag"))
// import TestSetManagement from "@/pages/testSetManagement"
const TestSetManagement = withLoadable(() => import("@/pages/testSetManagement"))
// import TestSetVariable from "@/pages/testSetManagement/variable"
const TestSetVariable = withLoadable(() => import("@/pages/testSetManagement/variable"))
// import TestSetDataList from "@/pages/testSetManagement/dataList"
const TestSetDataList = withLoadable(() => import("@/pages/testSetManagement/dataList"))
// import BasicSettings from "@/pages/basicSettings"
const BasicSettings = withLoadable(() => import("@/pages/basicSettings"))
// import Robots from "@/pages/robots"
const Robots = withLoadable(() => import("@/pages/robots"))
// import DiagramPreview from "@/pages/tools/diagramPreview"
const DiagramPreview = withLoadable(() => import("@/pages/tools/diagramPreview"))
const SkillEdit = withLoadable(() => import("@/pages/skillEdit"))

const SkillList = withLoadable(() => import("@/pages/skillList"))
const AgentView = withLoadable(() => import("@/pages/agent"))
const AgentDetail = withLoadable(() => import("@/pages/agent/detail"))
const AgentDetailV2 = withLoadable(() => import("@/pages/agent/detailv2"))

const KnowledgeManage = withLoadable(() => import("@/pages/knowledgeManage"))
const ViewStructureKnowledgeDetail = withLoadable(
  () => import("@/pages/addBot/components/ViewStructureKnowledgeDetail")
)
const AgentWorkbench = withLoadable(() => import("@/pages/agentWorkbench"))
const Debug = withLoadable(() => import("@/pages/debug"))
const Voice = withLoadable(() => import("@/pages/voice"))
const Canvas = withLoadable(() => import("@/pages/voice/canvas"))
const Script = withLoadable(() => import("@/pages/voice/script"))
const Timbre = withLoadable(() => import("@/pages/voice/timbre"))
const Event = withLoadable(() => import("@/pages/voice/event"))
const ChatProvider = withLoadable(() => import("../../packages/components/Chat/Provider"))
const ScriptManage = withLoadable(() => import("@/pages/voice/scriptManage"))
const FlywheelOptimization = withLoadable(() => import("@/pages/flywheel-optimization"))
const FlywheelOverview = withLoadable(() => import("@/pages/flywheel-overview"))
const BatchTesting = withLoadable(() => import("@/pages/batchTesting"))
// const NewsCenter = withLoadable(() => import("@/pages/infocenter"))

// 模型广场管理
const ModelSeriesDetail = withLoadable(() => import("@/pages/modelSeries/detail.jsx"))
const ModelSeriesCompare = withLoadable(() => import("@/pages/modelSeries/compare.jsx"))

const HomeEntry = withLoadable(() => import("@/pages/homeEntry/index.tsx"))
const QaEntry = withLoadable(() => import("@/pages/qa"))

// static-web 迁移
const TransferUserList = withLoadable(
  () => import("../../transfer-static/user-admin/user-list/index")
)

const TransferUserRole = withLoadable(
  () => import("../../transfer-static/user-admin/role-admin/index")
)
const TransferUserDetail = withLoadable(
  () => import("../../transfer-static/user-admin/role-admin/role-detail")
)

const TechnicalRadarStatic = withLoadable(
  () => import("../../transfer-static/technical-radar/index")
)

const childrenAdminRoutes = [
  ...BotRoutes,
  {
    path: "debug",
    title: "调试",
    element: (
      <Suspense fallback={<FallBack />}>
        <Debug />
      </Suspense>
    )
  },
  {
    path: "permission-management",
    title: "权限管理",
    element: (
      <Suspense fallback={<FallBack />}>
        <div />
      </Suspense>
    )
  },
  {
    path: "menu-auth-management",
    title: "菜单管理",
    element: (
      <Suspense fallback={<FallBack />}>
        <MenuAuthManagement />
      </Suspense>
    )
  },
  {
    path: "user-management",
    title: "用户管理",
    element: (
      <Suspense fallback={<FallBack />}>
        <UserManageMent />
      </Suspense>
    )
  },
  {
    path: "role-management",
    title: "角色管理",
    element: (
      <Suspense fallback={<FallBack />}>
        <RoleManageMent />
      </Suspense>
    )
  },
  {
    path: "group-management",
    title: "标签管理",
    element: (
      <Suspense fallback={<FallBack />}>
        <GroupManageMent />
      </Suspense>
    )
  },
  {
    path: "template-management",
    title: "模板管理",
    element: (
      <Suspense fallback={<FallBack />}>
        <div />
      </Suspense>
    )
  },
  {
    path: "model-management",
    title: "模型管理",
    element: (
      <Suspense fallback={<FallBack />}>
        <ModelManage />
      </Suspense>
    )
  },
  {
    path: "skill-template-management",
    title: "技能模板",
    element: (
      <Suspense fallback={<FallBack />}>
        <SkillTemplateManageMent />
      </Suspense>
    )
  },
  {
    path: "data-statistics",
    title: "数据统计",
    element: (
      <Suspense fallback={<FallBack />}>
        <div />
      </Suspense>
    )
  },
  {
    path: "workbenchManageMemu",
    title: "工作台管理",
    element: (
      <Suspense fallback={<FallBack />}>
        <Workbench />
      </Suspense>
    )
  },
  {
    path: "user-feedback",
    title: "用户反馈",
    element: (
      <Suspense fallback={<FallBack />}>
        <UserFeedback />
      </Suspense>
    )
  },
  {
    path: "security-alarm",
    title: "安全告警",
    element: (
      <Suspense fallback={<FallBack />}>
        <SecurityAlarm />
      </Suspense>
    )
  },

  {
    path: "call-logs",
    title: "调用日志",
    element: (
      <Suspense fallback={<FallBack />}>
        <CallLogs />
      </Suspense>
    )
  },

  {
    path: "botConstants",
    title: "编辑机器人",
    element: (
      <Suspense fallback={<FallBack />}>
        <BotConstants />
      </Suspense>
    )
  },
  {
    path: "available-limit",
    title: "可用性治理",
    element: (
      <Suspense fallback={<FallBack />}>
        <AvailableLimit />
      </Suspense>
    )
  },
  {
    path: "ai-lab",
    title: "AI Lab",
    element: (
      <Suspense fallback={<FallBack />}>
        <AiLabManage />
      </Suspense>
    )
  },
  {
    path: "technical-radar",
    title: "技术雷达",
    element: (
      <Suspense fallback={<FallBack />}>
        <TechnicalRadar />
      </Suspense>
    )
  },
  {
    path: "news-catalog",
    element: (
      <Suspense fallback={<FallBack />}>
        <InfoType />
      </Suspense>
    )
  },
  {
    path: "news-list",
    element: (
      <Suspense fallback={<FallBack />}>
        <InfoDetail />
      </Suspense>
    )
  },
  {
    path: "infocenter/detail/:botNo",
    element: (
      <Suspense fallback={<FallBack />}>
        <InfoView />
      </Suspense>
    )
  },
  {
    path: "infocenter/createnews",
    element: (
      <Suspense fallback={<FallBack />}>
        <InfoEdit />
      </Suspense>
    )
  },
  {
    path: "infocenter/edit/:botNo",
    element: (
      <Suspense fallback={<FallBack />}>
        <InfoEdit />
      </Suspense>
    )
  },

  {
    path: "model-series/:id",
    title: "模型系列详情",
    element: (
      <Suspense fallback={<FallBack />}>
        <ModelSeriesDetail />
      </Suspense>
    )
  },
  {
    path: "model-series/compare",
    title: "模型系列对比",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout closeGlobalLoadingIndicator={true}>
          <ModelSeriesCompare />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "daily-report",
    title: "日常报表",
    element: (
      <Suspense fallback={<FallBack />}>
        <DailyReport />
      </Suspense>
    )
  }
]

const baseRoutes = [
  {
    path: "/home",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout>
          <HomeEntry />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/qa",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout>
          <QaEntry />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/batch-testing",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout>
          <BatchTesting />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/editSkill",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout>
          <SkillEdit />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/skillList",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout>
          <SkillList />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/agent",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout closeGlobalLoadingIndicator={true}>
          <AgentView />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/agent/detail",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout closeGlobalLoadingIndicator={true}>
          <AgentDetail />
        </MainLayout>
      </Suspense>
    )
  },
  // agent2.0
  {
    path: "/agent/detailv2",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout closeGlobalLoadingIndicator={true}>
          <AgentDetailV2 />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/app/bot/constants",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout>
          <BotConstants />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/viewStructureKnowledgeDetail",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout>
          <ViewStructureKnowledgeDetail />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/agent/workbench",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout>
          <AgentWorkbench />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/market",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout closeGlobalLoadingIndicator={true}>
          <Market />
        </MainLayout>
      </Suspense>
    )
  },

  {
    path: "/market-sub",
    element: (
      <Suspense fallback={<FallBack />}>
        <MarketSub />
      </Suspense>
    )
  },
  {
    path: "/plugins-management",
    title: "工具管理",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout closeGlobalLoadingIndicator={true}>
          <PluginsManagement />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/plugins-detail",
    title: "工具详情",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout closeGlobalLoadingIndicator={true}>
          <PluginsDetail />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/plugin/:pluginNo",
    title: "工具列表",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout>
          <PluginToolList />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/plugin/tools",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout>
          <CreatePluginTools />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/knowledge/source/tag",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout>
          <KnowledgeSourceTag />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/test/set/",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout>
          <TestSetManagement />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/test/variable/",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout>
          <TestSetVariable />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/basic/settings",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout>
          <BasicSettings />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/robots",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout>
          <Robots />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/test/set/data/list",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout>
          <TestSetDataList />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/study/online",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout>
          <OnlineStudy />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/voice",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout>
          <Voice />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/voice/script",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout>
          <Script />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/voice/timbre",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout>
          <Timbre />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/voice/event",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout>
          <Event />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/voice/canvas",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout>
          <Canvas />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/voice/scriptManage",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout>
          <ScriptManage />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "daily-report",
    title: "日常报表",
    element: (
      <Suspense fallback={<FallBack />}>
        <DailyReport />
      </Suspense>
    )
  },
  {
    path: "knowledgeManage",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout>
          <KnowledgeManage />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "call-logs",
    title: "调用日志",
    element: (
      <Suspense fallback={<FallBack />}>
        <CallLogs />
      </Suspense>
    )
  },
  {
    path: "voice-record",
    title: "语音记录",
    element: (
      <Suspense fallback={<FallBack />}>
        <VoiceRecord />
      </Suspense>
    )
  },
  {
    path: "optimize-order",
    title: "优化单",
    element: (
      <Suspense fallback={<FallBack />}>
        <OptimizeOrder />
      </Suspense>
    )
  },
  {
    path: "technical-radar",
    title: "技术雷达",
    element: (
      <Suspense fallback={<FallBack />}>
        <TechnicalRadar />
      </Suspense>
    )
  },

  {
    path: "/technical-radar-static",
    title: "技术雷达",
    element: (
      <Suspense fallback={<FallBack />}>
        <TechnicalRadarStatic />
      </Suspense>
    )
  },
  {
    path: "ai-lab",
    title: "AI Lab",
    element: (
      <Suspense fallback={<FallBack />}>
        <AiLabManage />
      </Suspense>
    )
  },
  // 数据飞轮
  {
    path: "flywheel/overview",
    element: (
      <Suspense fallback={<FallBack />}>
        <FlywheelOverview />
      </Suspense>
    )
  },
  {
    path: "flywheel/optimization",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout closeGlobalLoadingIndicator={true}>
          <FlywheelOptimization />
        </MainLayout>
      </Suspense>
    )
  },

  {
    path: "/transfer/user",
    title: "用户列表",
    element: <TransferUserList />
  },
  {
    path: "/transfer/user/detail",
    title: "用户详情",
    element: <TransferUserDetail />
  },
  {
    path: "/transfer/role",
    title: "角色管理",
    element: <TransferUserRole />
  },
  {
    path: "/markdown-preview",
    element: <MarkdownPreview />
  },
  {
    path: "/diagram-preview",
    element: <DiagramPreview />
  },
  {
    path: "/tools",
    element: <ToolsList />
  },
  {
    path: "/tools/upload",
    element: <FileUpload />
  },
  {
    path: "/404",
    element: <Page404 />
  }
]

export const allRoutes = [
  // 用户端路由 - 访问 / 时使用
  {
    path: "/",
    element: <UserEntry />,
    children: [
      ...baseRoutes,
      // 公共资源
      ...publicResourcesRouters,

      // 版本管理
      ...(isStudio() ? versionManagementRouters : []),
      ...[
        {
          path: "",
          element: <Navigate to="/home" />
        },
        {
          path: "*",
          element: <Navigate to="/home" />
        }
      ]
    ]
  },
  // 管理后台路由 - 访问 /admin/* 时使用
  {
    path: "/admin",
    element: <Entry />,
    children: [
      ...childrenAdminRoutes,
      {
        path: "",
        element: <Navigate to="/admin/addBotList" />
      },
      {
        path: "*",
        element: <Navigate to="/admin/addBotList" />
      }
    ]
  },

  // 对外暴露 iframe 部分
  {
    path: "/chat",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout>
          <ChatProvider />
        </MainLayout>
      </Suspense>
    )
  },

  // 知识萃取
  ...knowledgeExtractionRouters,
  // 数据管理
  ...dataManagementRouters,
  // 知识管理
  ...knowledgeManagementRouters
]

// 全局路由
export const globalRouters = createBrowserRouter(allRoutes) //createHashRouter(allRoutes)

// 路由守卫
export function PrivateRoute(props) {
  // 判断localStorage是否有登录用户信息，如果没有则跳转登录页
  return window.localStorage.getItem(globalConfig.SESSION_LOGIN_INFO) ? (
    props.children
  ) : (
    <Navigate to="/admin/addBotList" />
  )
}
