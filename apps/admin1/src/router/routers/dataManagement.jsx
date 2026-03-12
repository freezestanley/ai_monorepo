import { Suspense } from "react"
import MainLayout from "@/components/MainLayout"
import FallBack from "@/components/FallBack"
import DataField from "@/pages/knowledgeProject/dataManagement/dataField"
import DataOrigin from "@/pages/knowledgeProject/dataManagement/dataOrigin"
import DataSelection from "@/pages/knowledgeProject/dataManagement/dataSelection"

// 数据管理
export const dataManagementRouters = [
  {
    path: "/dataOrigin",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout closeGlobalLoadingIndicator={true}>
          <DataOrigin />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/dataField",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout closeGlobalLoadingIndicator={true}>
          <DataField />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/dataSelection",
    title: "数据圈选",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout closeGlobalLoadingIndicator={true}>
          <DataSelection />
        </MainLayout>
      </Suspense>
    )
  }
]
