import { Suspense } from "react"
import MainLayout from "@/components/MainLayout"
import FallBack from "@/components/FallBack"
import TalkManagement from "@/pages/knowledgeProject/knowledgeManage/talkManagement"
import TemplateManage from "@/pages/knowledgeProject/knowledgeManage/templateManage"
import TemplateDetail from "@/pages/knowledgeProject/knowledgeManage/templateDetail"
import VersionRecord from "@/pages/knowledgeProject/knowledgeManage/versionRecord"
import VersionDetail from "@/pages/knowledgeProject/knowledgeManage/versionDetail"
import OperationLog from "@/pages/knowledgeProject/knowledgeManage/operationLog"
import VersionCompare from "@/pages/knowledgeProject/knowledgeManage/versionCompare"
import BasicSetup from "@/pages/knowledgeProject/knowledgeManage/basicSetup"
import ExtractionType from "@/pages/knowledgeProject/knowledgeManage/extractionType"

// 知识管理
export const knowledgeManagementRouters = [
  {
    path: "/talkManagement",
    title: "全部话术",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout closeGlobalLoadingIndicator={true}>
          <TalkManagement />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/templateManage",
    title: "模板管理",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout closeGlobalLoadingIndicator={true}>
          <TemplateManage />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/templateDetail",
    title: "模板详情",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout closeGlobalLoadingIndicator={true}>
          <TemplateDetail />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/versionRecord",
    title: "版本记录",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout closeGlobalLoadingIndicator={true}>
          <VersionRecord />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/versionDetail",
    title: "版本详情",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout closeGlobalLoadingIndicator={true}>
          <VersionDetail />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/operationLog",
    title: "操作日志",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout closeGlobalLoadingIndicator={true}>
          <OperationLog />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/versionCompare",
    title: "版本比对",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout closeGlobalLoadingIndicator={true}>
          <VersionCompare />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/basicSetup",
    title: "基础设置",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout closeGlobalLoadingIndicator={true}>
          <BasicSetup />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/extractionType",
    title: "萃取类型",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout closeGlobalLoadingIndicator={true}>
          <ExtractionType />
        </MainLayout>
      </Suspense>
    )
  }
]
