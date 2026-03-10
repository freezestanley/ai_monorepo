import { createHashRouter, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { Spin } from 'antd'
import { newsRoutes } from './newsRoutes'

const MainLayout = lazy(() => import('@/layouts/MainLayout'))

const FallbackSpinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spin size="large" />
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
      { index: true, element: <Navigate to="/news" replace /> },
      ...newsRoutes.map((route) => ({
        ...route,
        element: <Suspense fallback={<FallbackSpinner />}>{route.element}</Suspense>,
      })),
    ],
  },
])
