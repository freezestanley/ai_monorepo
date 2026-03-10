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
