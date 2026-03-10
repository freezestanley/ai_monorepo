import { Layout, Menu } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'
import { Outlet } from 'react-router-dom'
import { useMainLayout } from './hooks/useMainLayout'

const { Header, Sider, Content } = Layout

const MainLayout = () => {
  const { collapsed, setCollapsed, selectedKey, handleMenuClick } = useMainLayout()

  const menuItems = [
    { key: 'news', icon: <FileTextOutlined />, label: '新闻列表' },
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
          <h2 style={{ margin: 0 }}>信息平台</h2>
        </Header>
        <Content style={{ margin: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
