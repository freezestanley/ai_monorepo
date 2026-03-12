import FallBack from "@/components/FallBack"
import AddRot from "@/pages/addBot"
import { Suspense, lazy, Component } from "react"
// 引入Entry框架页面
const AddBotList = lazy(() => import("@/pages/addBotList"))

// 全局路由
export const BotRoutes = [
  {
    path: "addBotList",
    title: "空间管理",
    element: (
      <Suspense fallback={<FallBack />}>
        <AddBotList />
      </Suspense>
    )
  },
  {
    path: "addBot",
    title: "新增Bot",
    element: (
      <div>
        <Suspense fallback={<FallBack />}>
          <AddRot />
        </Suspense>
      </div>
    )
  },
  {
    path: "addBot/:botNo",
    title: "编辑空间",
    element: (
      <Suspense fallback={<FallBack />}>
        <AddRot />
      </Suspense>
    )
  }
]
