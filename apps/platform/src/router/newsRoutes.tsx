import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const NewsList = lazy(() => import('@/pages/news/NewsList'))
const NewsView = lazy(() => import('@/pages/news/NewsView'))

export const newsRoutes: RouteObject[] = [
  { path: 'news', element: <NewsList /> },
  { path: 'news/:newsNo', element: <NewsView /> },
]
