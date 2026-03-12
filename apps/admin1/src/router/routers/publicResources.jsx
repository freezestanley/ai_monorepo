import { Suspense } from "react"
import MainLayout from "@/components/MainLayout"
import FallBack from "@/components/FallBack"
import ModelMarket from "@/pages-v2/publicResources/modelMarket"
import VoiceMarket from "@/pages-v2/publicResources/voiceMarket"
import Markets from "@/pages-v2/publicResources/markets"

// 公共资源
export const publicResourcesRouters = [
  {
    path: "/model-market",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout closeGlobalLoadingIndicator={true}>
          <ModelMarket />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/voice-market",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout closeGlobalLoadingIndicator={true}>
          <VoiceMarket />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/markets/:type",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout closeGlobalLoadingIndicator={true}>
          <Markets />
        </MainLayout>
      </Suspense>
    )
  }
]
