import { Layout } from 'antd'
import { Outlet } from 'react-router-dom'

const MainLayout = () => (
  <Layout style={{ minHeight: '100vh' }}>
    <Layout.Content style={{ padding: 24 }}>
      <Outlet />
    </Layout.Content>
  </Layout>
)

export default MainLayout
