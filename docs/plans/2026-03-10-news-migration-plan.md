# News 模块迁移实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 za-aigc-platform-admin-static 的 infocenter（News）模块迁移到 ai_monorepo，包含基础设施搭建和业务功能迁移。

**Architecture:** monorepo 双 app 架构。admin app 承载新闻管理（发布/编辑/分类），platform app 承载新闻展示（列表/详情）。共享组件（TextEditor/ImageUpload）提取到 packages/ui。所有组件遵循 react-component-standards 分层规范。

**Tech Stack:** React 18 + TypeScript + Ant Design 5 + React Router 6 (hash) + Axios + React Query + MockJS + Tailwind CSS + SCSS + Vite 4 + Turborepo

**Team:** Lead(Claude) + dev-admin(Codex) + dev-platform(Codex) + QA(Claude)

---

## Task 1: 安装基础依赖（dev-admin）

**Files:**
- Modify: `apps/admin/package.json`
- Modify: `apps/platform/package.json`
- Modify: `packages/ui/package.json`

**Step 1: 安装 admin app 依赖**

```bash
cd /Users/za-stanlexu/Documents/work/za-aigc-platform-admin-static-rebuild/ai_monorepo
pnpm --filter @apps/admin add antd@^5.23.1 @ant-design/icons@^5.5.1 react-router-dom@^6.11.2 axios@^1.4.0 @tanstack/react-query@^4.29.25 dayjs@^1.11.10 lodash@^4.17.21 mockjs@^1.1.0 @wangeditor/editor@^5.1.23 @wangeditor/editor-for-react@^1.0.6
pnpm --filter @apps/admin add -D sass@^1.62.1 @types/mockjs @types/lodash
```

**Step 2: 安装 platform app 依赖**

```bash
pnpm --filter @apps/platform add antd@^5.23.1 @ant-design/icons@^5.5.1 react-router-dom@^6.11.2 axios@^1.4.0 @tanstack/react-query@^4.29.25 dayjs@^1.11.10 lodash@^4.17.21 mockjs@^1.1.0
pnpm --filter @apps/platform add -D sass@^1.62.1 @types/mockjs @types/lodash
```

**Step 3: 更新 packages/ui 依赖**

```bash
pnpm --filter @packages/ui add antd@^5.23.1 @ant-design/icons@^5.5.1
pnpm --filter @packages/ui add -D sass@^1.62.1
```

**Step 4: 验证安装**

Run: `pnpm install && pnpm build`
Expected: 构建成功无错误

**Step 5: Commit**

```bash
git add apps/admin/package.json apps/platform/package.json packages/ui/package.json pnpm-lock.yaml
git commit -m "chore: install base dependencies for news module migration"
```

---

## Task 2: Vite 配置更新（dev-admin）

**Files:**
- Modify: `apps/admin/vite.config.ts`
- Modify: `apps/platform/vite.config.ts`

**Step 1: 更新 admin vite.config.ts**

在 `apps/admin/vite.config.ts` 中添加路径别名和 SCSS 支持：

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '',
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: './dist',
  },
})
```

**Step 2: 更新 platform vite.config.ts**

同样的配置，端口 3001：

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '',
      },
    },
  },
  server: {
    port: 3001,
    open: true,
  },
  build: {
    outDir: './dist',
  },
})
```

**Step 3: 更新两个 app 的 tsconfig.json**

在 `compilerOptions` 中添加：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Step 4: 验证**

Run: `pnpm --filter @apps/admin dev`
Expected: 开发服务器启动正常

**Step 5: Commit**

```bash
git add apps/admin/vite.config.ts apps/platform/vite.config.ts apps/admin/tsconfig.json apps/platform/tsconfig.json
git commit -m "chore: add path aliases and SCSS support to vite configs"
```

---

## Task 3: 常量与 API 基础层（dev-admin）

**Files:**
- Create: `apps/admin/src/constants/index.ts`
- Create: `apps/admin/src/api/server.ts`
- Create: `apps/platform/src/constants/index.ts`
- Create: `apps/platform/src/api/server.ts`

**Step 1: 创建 admin constants**

`apps/admin/src/constants/index.ts`:

```typescript
export const NEWS_PREFIX = '/news'
export const BOT_PREFIX = '/botWeb'

export const NEWS_STATUS = {
  WAIT: 'wait',
  PUBLISH: 'publish',
  DOWN: 'down',
} as const

export type NewsStatus = typeof NEWS_STATUS[keyof typeof NEWS_STATUS]
```

**Step 2: 创建 admin API 基础层**

`apps/admin/src/api/server.ts`:

```typescript
import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { message } from 'antd'

const instance = axios.create({
  timeout: 30000,
})

// 请求拦截器
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (!config.headers) {
      config.headers = {} as any
    }
    // SSO headers 占位 - 后续按需接入
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    if (response?.config?.responseType === 'blob') {
      return response
    }
    if (response.status !== 200) {
      message.warning(response.data?.message || response.data?.msg)
    }
    return response.data
  },
  (error) => {
    if (axios.isCancel(error)) {
      console.log('Request cancelled', error.message)
    } else if (error.response) {
      switch (error.response.status) {
        case 401:
          message.warning('请重新登录')
          break
        case 403:
          window.location.hash = '#/404'
          message.warning('当前页面暂无权限！')
          break
        case 404:
          break
        default:
          message.error('服务器错误')
          break
      }
    }
    return Promise.reject(error)
  }
)

export const Get = (url: string, params: Record<string, any> = {}, config: AxiosRequestConfig = {}) => {
  return instance({ url, method: 'get', params, ...config })
}

export const Post = (url: string, data?: any, config: AxiosRequestConfig = {}) => {
  return instance.post(url, data, config)
}

export const Put = (url: string, data?: any, config: AxiosRequestConfig = {}) => {
  return instance.put(url, data, config)
}

export const Del = (url: string, params: Record<string, any> = {}) => {
  return instance.delete(url, { params })
}

export const Upload = (url: string, data: any, config: AxiosRequestConfig = {}) => {
  return instance.post(url, data, config)
}

export default instance
```

**Step 3: 复制到 platform（相同结构）**

platform 的 `constants/index.ts` 和 `api/server.ts` 内容与 admin 一致。

**Step 4: 验证**

Run: `pnpm --filter @apps/admin build`
Expected: 编译通过

**Step 5: Commit**

```bash
git add apps/admin/src/constants/ apps/admin/src/api/server.ts apps/platform/src/constants/ apps/platform/src/api/server.ts
git commit -m "feat: add constants and API base layer for both apps"
```

---

## Task 4: News API 定义（dev-admin）

**Files:**
- Create: `apps/admin/src/api/news.ts`
- Create: `apps/platform/src/api/news.ts`

**Step 1: 创建 admin News API**

`apps/admin/src/api/news.ts`:

```typescript
import { Get, Post, Put, Del, Upload } from './server'
import { NEWS_PREFIX } from '@/constants'

const prefix = NEWS_PREFIX

/** 新闻列表管理 API */
export const NewsDetailAPI = {
  getList: (params?: Record<string, any>) => {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          queryParams.append(key, String(params[key]))
        }
      })
    }
    const queryString = queryParams.toString()
    const url = `${prefix}/admin/newsCenter/page${queryString ? `?${queryString}` : ''}`
    return Get(url)
  },
}

/** 新闻分类 API */
export const NewsTypeAPI = {
  getList: (params?: Record<string, any>) => {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          queryParams.append(key, String(params[key]))
        }
      })
    }
    const queryString = queryParams.toString()
    const url = `${prefix}/admin/newsCategory/page${queryString ? `?${queryString}` : ''}`
    return Get(url)
  },
  create: (data: Record<string, any>) => Post(`${prefix}/admin/newsCategory/create`, data),
  update: (categoryNo: string, data: Record<string, any>) =>
    Put(`${prefix}/admin/newsCategory/update`, { ...data, categoryNo }),
  delete: (categoryNo: string) => Del(`${prefix}/admin/newsCategory/${categoryNo}`),
}

/** 新闻编辑 API */
export const NewsEditAPI = {
  detail: (newsNo: string) => Get(`${prefix}/admin/newsCenter/detail`, { newsNo }),
  publish: (params: { newsNo: string; publishStateEdit: string }) =>
    Post(`${prefix}/admin/newsCenter/publish/${params.newsNo}/${params.publishStateEdit}`, params),
  getListCategory: (params?: Record<string, any>) =>
    Get(`${prefix}/admin/newsCategory/page`, params),
  create: (params: Record<string, any>) => Post(`${prefix}/admin/newsCenter/create`, params),
  update: (data: Record<string, any>) => Put(`${prefix}/admin/newsCenter/update`, data),
  delete: (newsNo: string) => Post(`${prefix}/admin/newsCenter/${newsNo}`),
}

/** 新闻通用 API */
export const NewsAPI = {
  delete: (newsNo: string) => Del(`${prefix}/admin/newsCenter/${newsNo}`),
  batchDelete: (ids: string[]) => Post(`${prefix}/admin/newsCenter/batchDelete`, { ids }),
}

/** 文件上传 API */
export const FileAPI = {
  uploadImage: async (file: FormData) => {
    return Upload(`${prefix}/admin/file/upload`, file, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
```

**Step 2: 创建 platform News API**

`apps/platform/src/api/news.ts`:

```typescript
import { Get } from './server'
import { NEWS_PREFIX } from '@/constants'

const prefix = NEWS_PREFIX

/** 新闻列表 API（只读） */
export const NewsListAPI = {
  getList: (params?: Record<string, any>) => {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          queryParams.append(key, String(params[key]))
        }
      })
    }
    const queryString = queryParams.toString()
    const url = `${prefix}/admin/newsCenter/page${queryString ? `?${queryString}` : ''}`
    return Get(url)
  },
  getDetail: (newsNo: string) => Get(`${prefix}/admin/newsCenter/detail`, { newsNo }),
}
```

**Step 3: Commit**

```bash
git add apps/admin/src/api/news.ts apps/platform/src/api/news.ts
git commit -m "feat: add News API definitions for admin and platform"
```

---

## Task 5: Mock 系统搭建（dev-platform）

**Files:**
- Create: `apps/admin/src/mock/setup.ts`
- Create: `apps/admin/src/mock/news.ts`
- Create: `apps/admin/src/mock/newsType.ts`
- Create: `apps/platform/src/mock/setup.ts`
- Create: `apps/platform/src/mock/news.ts`

**Step 1: 创建 admin mock 新闻数据**

`apps/admin/src/mock/news.ts`:

从原项目 `src/pages/infocenter/mock/info.js` 迁移数据，添加 TypeScript 类型。保持数据结构完全一致。

```typescript
export const mockInfoList = {
  data: {
    pageSize: 10,
    pageNum: 1,
    current: 1,
    totalCount: 8,
    data: [
      {
        id: 1,
        newsNo: 'NEWS001',
        title: '系统维护通知',
        categoryNo: 'SYS001',
        categoryName: '系统公告',
        summary: '系统将于本周末进行例行维护，维护期间可能会影响部分功能的使用',
        content: '<p>尊敬的用户：</p><p>为了提供更好的服务体验，我们将于2024年10月28日22:00-29日06:00进行系统维护。</p>',
        cover: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=System',
        publishState: 'publish',
        publishTime: '2024-10-25 10:00:00',
        gmtCreated: '2024-10-25 09:30:00',
        gmtModified: '2024-10-25 14:20:00',
        creator: '系统管理员',
      },
      {
        id: 2,
        newsNo: 'NEWS002',
        title: '新功能发布：智能数据分析',
        categoryNo: 'ACT002',
        categoryName: '活动通知',
        summary: '全新的智能数据分析功能正式上线',
        content: '<h2>智能数据分析功能介绍</h2><p>我们很高兴地宣布，全新的智能数据分析功能已经正式上线！</p>',
        cover: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Feature',
        publishState: 'publish',
        publishTime: '2024-10-24 15:30:00',
        gmtCreated: '2024-10-24 14:00:00',
        gmtModified: '2024-10-24 16:45:00',
        creator: '产品经理',
      },
      {
        id: 3,
        newsNo: 'NEWS003',
        title: 'React 18 新特性深度解析',
        categoryNo: 'SYS005',
        categoryName: '版本更新',
        summary: '详细解析 React 18 的新特性',
        content: '<h1>React 18 新特性深度解析</h1><p>React 18 引入了并发渲染特性。</p>',
        cover: null,
        publishState: 'wait',
        publishTime: null,
        gmtCreated: '2024-10-22 16:30:00',
        gmtModified: '2024-10-23 10:20:00',
        creator: '技术总监',
      },
    ],
  },
  code: '200',
  success: true,
  message: '查询成功',
}

export const mockInfoDetail = {
  data: {
    id: 1,
    newsNo: 'NEWS001',
    title: '系统维护通知',
    categoryNo: 'SYS001',
    categoryName: '系统公告',
    summary: '系统将于本周末进行例行维护',
    content: '<p>尊敬的用户：</p><p>系统将进行维护。</p>',
    cover: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=System',
    publishState: 'publish',
    publishTime: '2024-10-25 10:00:00',
    gmtCreated: '2024-10-25 09:30:00',
    gmtModified: '2024-10-25 14:20:00',
    creator: '系统管理员',
  },
  code: '200',
  success: true,
  message: '查询成功',
}

export const mockCreateInfo = { data: { newsNo: 'NEWS_NEW_001' }, code: '200', success: true, message: '创建成功' }
export const mockUpdateInfo = { data: null, code: '200', success: true, message: '更新成功' }
export const mockDeleteInfo = { data: null, code: '200', success: true, message: '删除成功' }
export const mockPublishInfo = { data: null, code: '200', success: true, message: '操作成功' }
```

**Step 2: 创建 admin mock 分类数据**

`apps/admin/src/mock/newsType.ts`:

从原项目 `src/pages/infocenter/mock/infoType.js` 迁移，保持数据结构一致。

```typescript
export const mockNewsTypeList = {
  code: '200',
  success: true,
  message: '查询成功',
  data: {
    pageSize: '10',
    pageNum: '1',
    totalCount: '10',
    data: [
      { categoryNo: 'SYS001', name: '系统公告', description: '系统维护、升级等通知', categorySort: '1', enabledStatus: '1', gmtCreated: '2024-01-15 10:30:00', gmtModified: '2024-03-20 14:25:00', creator: 'admin', id: '1' },
      { categoryNo: 'ACT002', name: '活动通知', description: '平台活动、促销等消息', categorySort: '2', enabledStatus: '1', gmtCreated: '2024-02-10 09:15:00', gmtModified: '2024-04-05 11:40:00', creator: 'market_user', id: '2' },
      { categoryNo: 'ORD003', name: '订单消息', description: '订单状态更新通知', categorySort: '3', enabledStatus: '1', gmtCreated: '2024-01-20 13:45:00', gmtModified: '2024-05-12 16:30:00', creator: 'system', id: '3' },
      { categoryNo: 'SEC004', name: '安全提醒', description: '账号安全相关通知', categorySort: '4', enabledStatus: '0', gmtCreated: '2024-03-05 08:20:00', gmtModified: '2024-06-18 10:15:00', creator: 'security_admin', id: '4' },
      { categoryNo: 'SYS005', name: '版本更新', description: '系统功能更新说明', categorySort: '5', enabledStatus: '1', gmtCreated: '2024-02-28 14:00:00', gmtModified: '2024-07-22 09:45:00', creator: 'dev_team', id: '5' },
    ],
  },
}

export const mockCreateNewsType = { data: { id: '11', name: '测试类别' }, code: '200', success: true, message: '创建成功' }
export const mockUpdateNewsType = { data: null, code: '200', success: true, message: '更新成功' }
export const mockDeleteNewsType = { data: null, code: '200', success: true, message: '删除成功' }
```

**Step 3: 创建 admin mock setup**

`apps/admin/src/mock/setup.ts`:

```typescript
import Mock from 'mockjs'
import { mockInfoList, mockInfoDetail, mockCreateInfo, mockUpdateInfo, mockDeleteInfo, mockPublishInfo } from './news'
import { mockNewsTypeList, mockCreateNewsType, mockUpdateNewsType, mockDeleteNewsType } from './newsType'

const NEWS_PREFIX = '/news'

// 新闻列表
Mock.mock(new RegExp(`${NEWS_PREFIX}/admin/newsCenter/page`), 'get', () => mockInfoList)

// 新闻详情
Mock.mock(new RegExp(`${NEWS_PREFIX}/admin/newsCenter/detail`), 'get', () => mockInfoDetail)

// 新闻创建
Mock.mock(new RegExp(`${NEWS_PREFIX}/admin/newsCenter/create`), 'post', () => mockCreateInfo)

// 新闻更新
Mock.mock(new RegExp(`${NEWS_PREFIX}/admin/newsCenter/update`), 'put', () => mockUpdateInfo)

// 新闻删除
Mock.mock(new RegExp(`${NEWS_PREFIX}/admin/newsCenter/NEWS`), 'post', () => mockDeleteInfo)

// 新闻发布状态
Mock.mock(new RegExp(`${NEWS_PREFIX}/admin/newsCenter/publish`), 'post', () => mockPublishInfo)

// 分类列表
Mock.mock(new RegExp(`${NEWS_PREFIX}/admin/newsCategory/page`), 'get', () => mockNewsTypeList)

// 分类创建
Mock.mock(new RegExp(`${NEWS_PREFIX}/admin/newsCategory/create`), 'post', () => mockCreateNewsType)

// 分类更新
Mock.mock(new RegExp(`${NEWS_PREFIX}/admin/newsCategory/update`), 'put', () => mockUpdateNewsType)

// 分类删除
Mock.mock(new RegExp(`${NEWS_PREFIX}/admin/newsCategory/`), 'delete', () => mockDeleteNewsType)

// 文件上传
Mock.mock(new RegExp(`${NEWS_PREFIX}/admin/file/upload`), 'post', () => ({
  data: { url: 'https://via.placeholder.com/800x450', objectKey: 'mock-image-key' },
  code: '200',
  success: true,
  message: '上传成功',
}))

console.log('[Mock] News module mock enabled')
```

**Step 4: 创建 platform mock（只需列表和详情）**

`apps/platform/src/mock/setup.ts` — 只注册 GET 接口。
`apps/platform/src/mock/news.ts` — 复用 admin 的 mockInfoList 和 mockInfoDetail 数据。

**Step 5: Commit**

```bash
git add apps/admin/src/mock/ apps/platform/src/mock/
git commit -m "feat: add MockJS data and setup for news module"
```

---

## Task 6: antd 主题 + 全局样式 + Provider（dev-admin）

**Files:**
- Create: `apps/admin/src/styles/antd-theme.ts`
- Create: `apps/admin/src/styles/index.scss`
- Modify: `apps/admin/src/main.tsx`
- Modify: `apps/admin/src/App.tsx`
- 同样处理 platform

**Step 1: 创建 antd 主题配置**

`apps/admin/src/styles/antd-theme.ts`:

```typescript
import type { ThemeConfig } from 'antd'

export const adminTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1677ff',
    borderRadius: 6,
    fontSize: 14,
  },
}
```

**Step 2: 创建全局样式**

`apps/admin/src/styles/index.scss`:

```scss
// 全局基础样式
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}

#root {
  min-height: 100vh;
}
```

**Step 3: 重写 admin main.tsx**

`apps/admin/src/main.tsx`:

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { adminTheme } from '@/styles/antd-theme'
import { router } from '@/router'
import '@/styles/index.scss'
import '@/mock/setup'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={zhCN} theme={adminTheme}>
        <RouterProvider router={router} />
      </ConfigProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
```

**Step 4: 同样处理 platform**

platform 创建相同结构的 `styles/antd-theme.ts`、`styles/index.scss`、`main.tsx`（端口和主题可微调）。

**Step 5: Commit**

```bash
git add apps/admin/src/styles/ apps/admin/src/main.tsx apps/platform/src/styles/ apps/platform/src/main.tsx
git commit -m "feat: add antd theme, global styles, and Provider setup"
```

---

## Task 7: 路由配置（dev-admin）

**Files:**
- Create: `apps/admin/src/router/index.tsx`
- Create: `apps/admin/src/router/newsRoutes.tsx`
- Create: `apps/platform/src/router/index.tsx`
- Create: `apps/platform/src/router/newsRoutes.tsx`

**Step 1: 创建 admin 路由**

`apps/admin/src/router/newsRoutes.tsx`:

```typescript
import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const NewsDetail = lazy(() => import('@/pages/news/NewsDetail'))
const NewsEdit = lazy(() => import('@/pages/news/NewsEdit'))
const NewsType = lazy(() => import('@/pages/news/NewsType'))

export const newsRoutes: RouteObject[] = [
  { path: 'news-list', element: <NewsDetail /> },
  { path: 'news-catalog', element: <NewsType /> },
  { path: 'infocenter/createnews', element: <NewsEdit /> },
  { path: 'infocenter/edit/:newsNo', element: <NewsEdit /> },
]
```

`apps/admin/src/router/index.tsx`:

```typescript
import { createHashRouter, Navigate } from 'react-router-dom'
import { Suspense } from 'react'
import { Spin } from 'antd'
import { newsRoutes } from './newsRoutes'

// MainLayout 将在 Task 8 创建，暂用占位
const MainLayout = lazy(() => import('@/layouts/MainLayout'))
import { lazy } from 'react'

const FallbackSpinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spin size="large" tip="加载中..." />
  </div>
)

export const router = createHashRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<FallbackSpinner />}>
        <MainLayout />
      </Suspense>
    ),
    children: [
      { index: true, element: <Navigate to="/news-list" replace /> },
      ...newsRoutes.map((route) => ({
        ...route,
        element: <Suspense fallback={<FallbackSpinner />}>{route.element}</Suspense>,
      })),
    ],
  },
])
```

**Step 2: 创建 platform 路由**

`apps/platform/src/router/newsRoutes.tsx`:

```typescript
import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const NewsList = lazy(() => import('@/pages/news/NewsList'))
const NewsView = lazy(() => import('@/pages/news/NewsView'))

export const newsRoutes: RouteObject[] = [
  { path: 'news', element: <NewsList /> },
  { path: 'news/:newsNo', element: <NewsView /> },
]
```

platform `router/index.tsx` 同样结构。

**Step 3: Commit**

```bash
git add apps/admin/src/router/ apps/platform/src/router/
git commit -m "feat: add hash router with news routes for both apps"
```

---

## Task 8: MainLayout 布局组件（dev-platform）

**Files:**
- Create: `apps/admin/src/layouts/MainLayout/index.tsx`
- Create: `apps/admin/src/layouts/MainLayout/hooks/useMainLayout.ts`
- Create: `apps/admin/src/layouts/MainLayout/types.ts`
- 同样创建 platform 版本

**Step 1: 创建 admin MainLayout types**

`apps/admin/src/layouts/MainLayout/types.ts`:

```typescript
export interface MenuItem {
  key: string
  label: string
  icon?: React.ReactNode
  children?: MenuItem[]
}

export interface MainLayoutProps {
  className?: string
}
```

**Step 2: 创建 admin MainLayout hook**

`apps/admin/src/layouts/MainLayout/hooks/useMainLayout.ts`:

```typescript
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export const useMainLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const selectedKey = location.pathname.split('/')[1] || 'news-list'

  const handleMenuClick = (key: string) => {
    navigate(`/${key}`)
  }

  return { collapsed, setCollapsed, selectedKey, handleMenuClick }
}
```

**Step 3: 创建 admin MainLayout UI**

`apps/admin/src/layouts/MainLayout/index.tsx`:

```tsx
import { Layout, Menu } from 'antd'
import { FileTextOutlined, AppstoreOutlined } from '@ant-design/icons'
import { Outlet } from 'react-router-dom'
import { useMainLayout } from './hooks/useMainLayout'

const { Header, Sider, Content } = Layout

const MainLayout = () => {
  const { collapsed, setCollapsed, selectedKey, handleMenuClick } = useMainLayout()

  const menuItems = [
    { key: 'news-list', icon: <FileTextOutlined />, label: '新闻管理' },
    { key: 'news-catalog', icon: <AppstoreOutlined />, label: '分类管理' },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ height: 32, margin: 16, background: 'rgba(255,255,255,0.2)', borderRadius: 6 }} />
        <Menu
          theme="dark"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => handleMenuClick(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>消息管理后台</h2>
        </Header>
        <Content style={{ margin: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
```

**Step 4: 创建 platform MainLayout（类似但面向用户端风格）**

platform 版本调整菜单项为 `news`（新闻列表）。

**Step 5: Commit**

```bash
git add apps/admin/src/layouts/ apps/platform/src/layouts/
git commit -m "feat: add MainLayout with sidebar navigation for both apps"
```

---

## Task 9: 共享 ImageUpload 组件（dev-platform）

**Files:**
- Create: `packages/ui/ImageUpload/index.tsx`
- Create: `packages/ui/ImageUpload/types.ts`
- Modify: `packages/ui/index.tsx`

**Step 1: 创建 types**

`packages/ui/ImageUpload/types.ts`:

```typescript
export interface ImageUploadProps {
  maxCount?: number
  listType?: 'text' | 'picture' | 'picture-card' | 'picture-circle'
  onChange?: (data: any) => void
  onFinish?: (data: any) => void
  value?: string
  disabled?: boolean
}
```

**Step 2: 创建组件**

`packages/ui/ImageUpload/index.tsx`:

从原项目 `src/pages/infocenter/components/ImageUpload.jsx` 迁移，添加 TypeScript 类型，保持功能一致。组件只做 UI 展示（antd Upload 封装），上传逻辑通过 `onChange`/`onFinish` 回调给父级。

```tsx
import { Upload, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ImageUploadProps } from './types'

const ImageUpload = ({ maxCount = 1, listType = 'picture-card', onChange, onFinish, value, disabled }: ImageUploadProps) => {
  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/')
    if (!isImage) {
      message.error('只能上传图片文件!')
      return false
    }
    const isLt5M = file.size / 1024 / 1024 < 5
    if (!isLt5M) {
      message.error('图片大小不能超过 5MB!')
      return false
    }
    return true
  }

  const handleChange = (info: any) => {
    onChange?.(info)
    if (info.file.status === 'done') {
      const url = info.file.response?.data?.url || info.file.response?.data?.temporarySignatureUrl
      onFinish?.(url)
    }
  }

  return (
    <Upload
      listType={listType}
      maxCount={maxCount}
      beforeUpload={beforeUpload}
      onChange={handleChange}
      disabled={disabled}
    >
      {maxCount === 1 && value ? null : (
        <div>
          <PlusOutlined />
          <div style={{ marginTop: 8 }}>上传图片</div>
        </div>
      )}
    </Upload>
  )
}

export default ImageUpload
```

**Step 3: 更新 packages/ui/index.tsx 导出**

在 `packages/ui/index.tsx` 添加：

```typescript
export { default as ImageUpload } from './ImageUpload'
export type { ImageUploadProps } from './ImageUpload/types'
```

**Step 4: Commit**

```bash
git add packages/ui/ImageUpload/ packages/ui/index.tsx
git commit -m "feat: add shared ImageUpload component to packages/ui"
```

---

## Task 10: 共享 TextEditor 组件（dev-platform）

**Files:**
- Create: `packages/ui/TextEditor/index.tsx`
- Create: `packages/ui/TextEditor/types.ts`
- Modify: `packages/ui/index.tsx`
- Modify: `packages/ui/package.json`（添加 wangeditor 依赖）

**Step 1: 添加 wangeditor 依赖**

```bash
pnpm --filter @packages/ui add @wangeditor/editor@^5.1.23 @wangeditor/editor-for-react@^1.0.6
```

**Step 2: 创建 types**

`packages/ui/TextEditor/types.ts`:

```typescript
export interface TextEditorProps {
  value?: string
  onChange?: (html: string) => void
  placeholder?: string
  disabled?: boolean
  height?: number
}
```

**Step 3: 创建组件**

`packages/ui/TextEditor/index.tsx`:

从原项目 `src/pages/infocenter/components/TextEditor/index.tsx` 迁移，保持 WangEditor 封装一致。

```tsx
import { useState, useEffect } from 'react'
import { Editor, Toolbar } from '@wangeditor/editor-for-react'
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'
import '@wangeditor/editor/dist/css/style.css'
import type { TextEditorProps } from './types'

const TextEditor = ({ value, onChange, placeholder = '请输入内容...', disabled = false, height = 400 }: TextEditorProps) => {
  const [editor, setEditor] = useState<IDomEditor | null>(null)

  const toolbarConfig: Partial<IToolbarConfig> = {}

  const editorConfig: Partial<IEditorConfig> = {
    placeholder,
    readOnly: disabled,
  }

  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy()
      }
    }
  }, [editor])

  return (
    <div style={{ border: '1px solid #d9d9d9', borderRadius: 6 }}>
      <Toolbar
        editor={editor}
        defaultConfig={toolbarConfig}
        mode="default"
        style={{ borderBottom: '1px solid #d9d9d9' }}
      />
      <Editor
        defaultConfig={editorConfig}
        value={value}
        onCreated={setEditor}
        onChange={(editorInstance) => onChange?.(editorInstance.getHtml())}
        mode="default"
        style={{ height, overflowY: 'hidden' }}
      />
    </div>
  )
}

export default TextEditor
```

**Step 4: 更新 packages/ui/index.tsx 导出**

```typescript
export { default as TextEditor } from './TextEditor'
export type { TextEditorProps } from './TextEditor/types'
```

**Step 5: Commit**

```bash
git add packages/ui/TextEditor/ packages/ui/index.tsx packages/ui/package.json pnpm-lock.yaml
git commit -m "feat: add shared TextEditor (WangEditor) component to packages/ui"
```

---

## Task 11: Admin NewsDetail 页面（dev-admin）

**Files:**
- Create: `apps/admin/src/pages/news/NewsDetail/index.tsx`
- Create: `apps/admin/src/pages/news/NewsDetail/hooks/useNewsDetail.ts`
- Create: `apps/admin/src/pages/news/NewsDetail/types.ts`
- Create: `apps/admin/src/pages/news/index.ts`

**Step 1: 创建 types**

`apps/admin/src/pages/news/NewsDetail/types.ts`:

```typescript
import type { NewsStatus } from '@/constants'

export interface NewsItem {
  id: number
  newsNo: string
  title: string
  categoryNo: string
  categoryName: string
  summary: string
  content: string
  cover: string | null
  publishState: NewsStatus
  publishTime: string | null
  gmtCreated: string
  gmtModified: string
  creator: string
}

export interface FetchDataParams {
  pageNum?: number
  page?: number
  pageSize?: number
  title?: string
}
```

**Step 2: 创建 hook**

`apps/admin/src/pages/news/NewsDetail/hooks/useNewsDetail.ts`:

从原项目 `useInfoDetail.ts` 迁移。保持相同的业务逻辑：列表查询、搜索、分页、CRUD、发布状态切换。将 `InfoDetailAPI`/`InfoEditAPI`/`InfoAPI` 替换为新的 `NewsDetailAPI`/`NewsEditAPI`/`NewsAPI` 导入。路由路径保持一致（`/infocenter/detail/`、`/infocenter/edit/`、`/infocenter/createnews/`、`/news-list`）。

关键映射：
- `InfoDetailAPI.getList` → `NewsDetailAPI.getList`
- `InfoEditAPI.publish` → `NewsEditAPI.publish`
- `InfoAPI.delete` → `NewsAPI.delete`
- `InfoAPI.batchDelete` → `NewsAPI.batchDelete`
- 路由导航路径保持不变

**Step 3: 创建 UI 组件**

`apps/admin/src/pages/news/NewsDetail/index.tsx`:

从原项目 `InfoDetail/index.jsx` 迁移。保持完全相同的 UI 结构：Card 容器 + 搜索框 + 新增按钮 + Table + 分页。添加 TypeScript props 类型。

关键 UI 元素保持不变：
- 页面标题 "消息中心"
- Search 组件 placeholder "搜索标题..."
- "新增新闻" 按钮
- Table 列配置（编号/标题/类别/封面图/摘要/状态/发布时间/创建人/创建时间/更新时间/操作）
- 操作列（Switch 发布/编辑/删除）
- 空状态和骨架屏

样式文件创建 `apps/admin/src/pages/news/NewsDetail/styles.scss`，从原项目 `InfoDetail/styles.scss` 迁移。

**Step 4: barrel export**

`apps/admin/src/pages/news/index.ts`:

```typescript
export { default as NewsDetail } from './NewsDetail'
```

**Step 5: 验证**

Run: `pnpm --filter @apps/admin dev`
Expected: 访问 `http://localhost:3000/#/news-list` 显示新闻列表页

**Step 6: Commit**

```bash
git add apps/admin/src/pages/news/
git commit -m "feat: add NewsDetail (news list management) page for admin"
```

---

## Task 12: Admin NewsEdit 页面（dev-admin）

**Files:**
- Create: `apps/admin/src/pages/news/NewsEdit/index.tsx`
- Create: `apps/admin/src/pages/news/NewsEdit/hooks/useNewsEdit.ts`
- Create: `apps/admin/src/pages/news/NewsEdit/types.ts`

**Step 1: 创建 types**

`apps/admin/src/pages/news/NewsEdit/types.ts`:

```typescript
export interface NewsEditData {
  newsNo?: string
  title: string
  summary: string
  cover: string
  content: string
  categoryNo: string
  publishStateEdit: string
}
```

**Step 2: 创建 hook**

从原项目 `useInfoEdit.ts` 迁移。保持相同逻辑：表单管理、分类列表获取、详情加载、创建/更新提交、图片处理。将 `InfoEditAPI` 替换为 `NewsEditAPI`。

**Step 3: 创建 UI**

从原项目 `InfoEdit/index.jsx` 迁移。保持相同 UI：Breadcrumb 导航 + 双栏布局（左 16 栏基础信息和正文，右 8 栏封面图片和操作按钮）。使用 `@packages/ui` 的 `TextEditor` 和 `ImageUpload`。

**Step 4: 验证**

Expected: 访问 `/#/infocenter/createnews` 显示新闻创建表单

**Step 5: Commit**

```bash
git add apps/admin/src/pages/news/NewsEdit/
git commit -m "feat: add NewsEdit (create/edit news) page for admin"
```

---

## Task 13: Admin NewsType 页面（dev-admin）

**Files:**
- Create: `apps/admin/src/pages/news/NewsType/index.tsx`
- Create: `apps/admin/src/pages/news/NewsType/hooks/useNewsTypeTable.ts`
- Create: `apps/admin/src/pages/news/NewsType/types.ts`

从原项目 `InfoType/index.jsx` 和 `InfoType/useInfoTypeTable.js` 迁移。保持分类管理的 Table + Modal 模式不变。将 `InfoTypeAPI` 替换为 `NewsTypeAPI`。

**Commit:**

```bash
git add apps/admin/src/pages/news/NewsType/
git commit -m "feat: add NewsType (category management) page for admin"
```

---

## Task 14: Platform NewsList 页面（dev-platform）

**Files:**
- Create: `apps/platform/src/pages/news/NewsList/index.tsx`
- Create: `apps/platform/src/pages/news/NewsList/hooks/useNewsList.ts`
- Create: `apps/platform/src/pages/news/NewsList/types.ts`
- Create: `apps/platform/src/pages/news/index.ts`

新建面向用户端的新闻列表页。使用卡片式布局展示新闻列表，支持分页、搜索。点击卡片跳转到详情页 `/#/news/:newsNo`。调用 `NewsListAPI.getList`。

**Commit:**

```bash
git add apps/platform/src/pages/news/
git commit -m "feat: add NewsList page for platform"
```

---

## Task 15: Platform NewsView 页面（dev-platform）

**Files:**
- Create: `apps/platform/src/pages/news/NewsView/index.tsx`
- Create: `apps/platform/src/pages/news/NewsView/hooks/useNewsView.ts`
- Create: `apps/platform/src/pages/news/NewsView/types.ts`

从原项目 `InfoView/index.jsx` 迁移。保持新闻详情展示一致：标题、摘要、封面图、正文内容、附件、元信息。状态显示（待发布/已发布/已下线）。调用 `NewsListAPI.getDetail`。

**Commit:**

```bash
git add apps/platform/src/pages/news/NewsView/
git commit -m "feat: add NewsView (news detail) page for platform"
```

---

## Task 16: 验证全流程（dev-admin + dev-platform）

**Step 1: admin app 全流程验证**

```bash
pnpm --filter @apps/admin dev
```

验证清单：
- [ ] `/#/news-list` — 新闻列表正常显示 mock 数据
- [ ] 搜索功能工作
- [ ] 分页功能工作
- [ ] "新增新闻" 跳转到创建页
- [ ] `/#/infocenter/createnews` — 表单正常渲染
- [ ] 分类选择下拉正常
- [ ] 富文本编辑器正常
- [ ] 图片上传组件正常
- [ ] 保存消息功能正常
- [ ] `/#/news-catalog` — 分类管理正常
- [ ] 发布/下线 Switch 切换正常
- [ ] 编辑跳转正常
- [ ] 删除确认弹窗正常

**Step 2: platform app 全流程验证**

```bash
pnpm --filter @apps/platform dev
```

验证清单：
- [ ] `/#/news` — 新闻列表正常显示
- [ ] 点击新闻跳转详情页
- [ ] `/#/news/NEWS001` — 详情页正常渲染

**Step 3: 构建验证**

```bash
pnpm build
```

Expected: admin 和 platform 都构建成功

**Step 4: Commit**

```bash
git add -A
git commit -m "fix: resolve integration issues from full flow verification"
```

---

## Task 17: QA UI/UE 对比测试

**由 QA (Claude) 负责，通过浏览器对比**

**Step 1: 启动原项目作为基准**

```bash
cd /Users/za-stanlexu/Documents/work/za-aigc-platform-admin-static-rebuild/za-aigc-platform-admin-static
pnpm dev
```

**Step 2: 启动 admin app**

```bash
cd /Users/za-stanlexu/Documents/work/za-aigc-platform-admin-static-rebuild/ai_monorepo
pnpm --filter @apps/admin dev
```

**Step 3: 逐页面对比**

| 页面 | 原项目路由 | 新项目路由 | 对比项 |
|------|-----------|-----------|--------|
| 新闻列表 | `/#/news-list` | `/#/news-list` | 表格布局、列配置、操作按钮 |
| 新闻创建 | `/#/infocenter/createnews` | `/#/infocenter/createnews` | 表单布局、编辑器、上传组件 |
| 分类管理 | `/#/news-catalog` | `/#/news-catalog` | 表格、Modal 弹窗 |

**Step 4: 输出测试报告**

记录差异点，反馈给开发修复。

**Step 5: 更新 task.md**

将所有已完成任务标记为 ✅。

---

## 任务依赖关系

```
Task 1 (依赖安装)
  ├── Task 2 (Vite 配置) ─┐
  ├── Task 3 (常量+API层) ─┤
  │                        ├── Task 6 (主题+Provider) ── Task 7 (路由)
  ├── Task 4 (News API) ───┤
  └── Task 5 (Mock) ───────┘
                                │
                    ┌───────────┴──────────┐
                    │                      │
              Task 8 (MainLayout)    Task 9 (ImageUpload)
                    │                Task 10 (TextEditor)
                    │                      │
              ┌─────┴───────┐       ┌──────┘
              │             │       │
         Task 11        Task 14   Task 12
       (NewsDetail)   (NewsList) (NewsEdit)
              │             │       │
         Task 13        Task 15     │
       (NewsType)     (NewsView)    │
              │             │       │
              └──────┬──────┘───────┘
                     │
                Task 16 (全流程验证)
                     │
                Task 17 (QA 测试)
```

**并行机会：**
- Task 2 + 3 + 4 + 5 可并行
- Task 8 (dev-platform) 与 Task 6 + 7 (dev-admin) 可并行
- Task 9 + 10 (dev-platform) 与 Task 11 (dev-admin) 可并行
- Task 12 + 13 (dev-admin) 与 Task 14 + 15 (dev-platform) 可并行
