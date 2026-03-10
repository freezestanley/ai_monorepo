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
