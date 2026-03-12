/*
 * @Author: Dyton
 * @Date: 2024-04-25 17:53:57
 * @Descripttion:知识工程相关路由
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-04-25 20:40:57
 * @FilePath: /za-aigc-platform-admin-static/src/router/routers/knowledgeProject.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import { Suspense } from "react"
import MainLayout from "@/components/MainLayout"
import FallBack from "@/components/FallBack"
// 知识萃取
import {
  KnowledgeExtractor,
  InstanceExtractor,
  InstanceExtractorDetail,
  TaskExtractor,
  TaskExtractorAdd,
  InstanceBatchExtractorDetail
} from "@/pages/knowledgeProject"
import {
  KnowledgeExtraction,
  KnowledgeExtractionAdd
} from "@/pages/knowledgeProject/knowledgeExtraction"

// 知识管理
export { knowledgeManagementRouters } from "./knowledgeManagement"
// 数据管理
export { dataManagementRouters } from "./dataManagement"
//知识萃取
export const knowledgeExtractionRouters = [
  {
    path: "/knowledgeExtractor",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout closeGlobalLoadingIndicator={true}>
          <KnowledgeExtractor />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/instanceExtractor",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout closeGlobalLoadingIndicator={true}>
          <InstanceExtractor />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/instanceExtractorDetail",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout closeGlobalLoadingIndicator={true}>
          <InstanceExtractorDetail />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/taskExtractor",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout closeGlobalLoadingIndicator={true}>
          <TaskExtractor />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/addTaskExtractor",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout closeGlobalLoadingIndicator={true}>
          <TaskExtractorAdd />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/InstanceBatchExtractorDetail",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout>
          <InstanceBatchExtractorDetail />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/knowledgeExtraction",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout closeGlobalLoadingIndicator={true}>
          <KnowledgeExtraction />
        </MainLayout>
      </Suspense>
    )
  },
  {
    path: "/knowledgeExtractionAdd",
    element: (
      <Suspense fallback={<FallBack />}>
        <MainLayout closeGlobalLoadingIndicator={true}>
          <KnowledgeExtractionAdd />
        </MainLayout>
      </Suspense>
    )
  }
]
