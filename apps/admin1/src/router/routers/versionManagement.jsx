import { Suspense } from "react"
import MainLayout from "@/components/MainLayout"
import FallBack from "@/components/FallBack"
import VersionRelease from "@/pages/versionManage/versionRelease"
import VersionReleaseDetail from "@/pages/versionManage/versionReleaseDetail"

// 版本管理
export const versionManagementRouters = [
  {
    path: "/versionRelease",
    title: "版本发布",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout closeGlobalLoadingIndicator={true}>
          <VersionRelease />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/versionRelease/detail/:publishOrderId",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout>
          <VersionReleaseDetail />
        </MainLayout>
      </Suspense>
    )
  }
]
