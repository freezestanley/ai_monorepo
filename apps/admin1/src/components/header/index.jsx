import { useCallback, useState } from "react"
import { Button, Card, Dropdown, Menu } from "antd"
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons"
import { ThemeOutlined } from "@/components/extraIcons"
import { HomeOutlined, UserOutlined } from "@ant-design/icons"
import { useLocation, useNavigate } from "react-router-dom"
// 引入Redux
import { useSelector, useDispatch } from "react-redux"
// 从主题换肤store分库引入setDark方法
import ThemeModal from "@/components/themeModal"
import { globalConfig } from "@/globalConfig"
import { useTitle, useCollapsed } from "@/store"
import "./header.styl"
import { SSOLogOut } from "@/api/sso"
import Iconfont from "../Icon"

function Header(props) {
  // 创建路由定位钩子
  const location = useLocation()
  // 创建路由钩子
  const navigate = useNavigate()
  const titleValue = useTitle((state) => state.title)
  const changeCollapsed = useCollapsed((state) => state.changeCollapsed)
  const collapsed = useCollapsed((state) => state.collapsed)

  const toggleSidebar = () => {
    changeCollapsed(!collapsed)
  }

  // 定义导航栏
  const menuItems = [
    {
      // 导航显示的名称
      label: "Home",
      // 导航唯一标识，为便于当前态的显示，与当前路由保持一致
      key: "/home",
      // 导航的前置图标
      icon: <HomeOutlined />,
      // 点击跳转行为
      onClick: () => {
        navigate("/home")
      }
    },
    {
      label: "Account",
      key: "/account",
      icon: <UserOutlined />,
      onClick: () => {
        navigate("/account")
      }
    }
  ]

  const onMenuClick = useCallback(() => {
    // removeTicket()
    // navigateToLogin(SSO_TYPE.LOGOUT)
    SSOLogOut()
  }, [])
  const items = [
    {
      key: "1",
      label: <a onClick={onMenuClick}>退出登录</a>
    }
  ]
  // 获取redux派发钩子
  const dispatch = useDispatch()

  // 获取store中的主题配置
  const theme = useSelector((state) => state.theme)

  // 接收来自父组件的数据
  const { info } = props

  // 如果info存在，则执行info()
  info && info()

  // 是否显示主题色选择对话框
  const [showThemeModal, setShowThemeModal] = useState(false)
  const USER_ICON =
    "https://alicdn.zaticdn.com/zaip/zaip-toolweb-file-service/upload/xqVgiYZ32Gby7LfnPn3kyo-user.png"

  return (
    <Card className="M-header">
      <div className="header-wrapper">
        <div className="menu-con">
          {/* 根据collapsed展示不同的antd图标 */}
          {!collapsed ? (
            <MenuFoldOutlined onClick={toggleSidebar} className="text-lg p-3" />
          ) : (
            <MenuUnfoldOutlined onClick={toggleSidebar} className="text-lg p-3" />
          )}
          <span
            className="ml-2"
            style={{
              color: "#1D2129",
              fontWeight: 500
            }}
          >
            {titleValue}
          </span>
        </div>
        <div className="opt-con">
          {
            // 当globalConfig配置了主题色，并且数量大于0时，才显示主题色换肤按钮
            globalConfig.customColorPrimarys && globalConfig.customColorPrimarys.length > 0 && (
              <Button
                icon={<ThemeOutlined />}
                shape="circle"
                onClick={() => {
                  setShowThemeModal(true)
                }}
              ></Button>
            )
          }
        </div>
        <Dropdown menu={{ items }}>
          <a
            className="flex items-center justify-center mr-2"
            style={{ cursor: "pointer" }}
            onClick={(e) => e.preventDefault()}
          >
            <Iconfont
              type="icon-yonghu"
              className="mr-1"
              style={{
                fontSize: "22px",
                color: "#666"
              }}
            />
          </a>
        </Dropdown>
      </div>

      {
        // 显示主题色换肤对话框
        showThemeModal && (
          <ThemeModal
            onClose={() => {
              setShowThemeModal(false)
            }}
          />
        )
      }
    </Card>
  )
}

export default Header
