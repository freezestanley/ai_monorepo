/*
 * @Author: dyton
 * @Date: 2023-10-17 19:38:00
 * @Descripttion: 文件描述
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2023-10-23 14:09:41
 * @FilePath: /za-aigc-platform-admin-static/src/components/sidebarMenu/index.jsx
 * Copyright (c) 2023 by ZA-智能中台, All Rights Reserved.
 */
import { Menu, Layout } from "antd"
import { Link, useLocation, matchRoutes } from "react-router-dom"
import { useTitle, useCollapsed, useMenuResourcesCodes } from "@/store"
import menuDataStatic from "./menuData"
import "./index.scss"
import { allRoutes } from "@/router"
import { flattenRoutes } from "@/api/tools"
import { useEffect, useState } from "react"

function SidebarMenu() {
  const { pathname } = useLocation()
  const changeTitle = useTitle((state) => state.changeTitle)
  const collapsed = useCollapsed((state) => state.collapsed)
  // 菜单权限Code集合 [code]
  const { resourceMenuCodes } = useMenuResourcesCodes((state) => state)
  const [menuData] = useState(menuDataStatic)
  const match = matchRoutes(flattenRoutes(allRoutes), pathname)
  const route = match[match.length - 1].route
  // @ts-ignore
  const title = route.title || ""

  useEffect(() => {
    if (title) {
      changeTitle(title)
    }
  }, [title, changeTitle])

  const defaultOpenKeys = menuData.reduce((result, item) => {
    const getAdminPath = (path) => {
      if (path.startsWith("/")) {
        return `/admin${path}`
      }
      return `/admin/${path}`
    }

    if (
      item.children &&
      item.children.some((child) => pathname.startsWith(getAdminPath(child.key)))
    ) {
      result.push(getAdminPath(item.key))
    }
    return result
  }, [])

  const renderMenuItem = (item) => {
    const getAdminPath = (path) => {
      if (path.startsWith("/")) {
        return `/admin${path}`
      }
      return `/admin/${path}`
    }

    if (item.children) {
      return resourceMenuCodes?.includes(item?.code) ? (
        <Menu.SubMenu key={getAdminPath(item.key)} icon={item.icon} title={item.title}>
          {item.children.map(renderMenuItem)}
        </Menu.SubMenu>
      ) : null
    }
    return resourceMenuCodes?.includes(item?.code) ? (
      <Menu.Item key={getAdminPath(item.key)} icon={item.icon}>
        <Link to={getAdminPath(item.key)}>{item.title}</Link>
      </Menu.Item>
    ) : null
  }

  return (
    <Layout.Sider collapsible collapsed={collapsed} className="bg-white" trigger={null}>
      <Menu
        mode="inline"
        className="menu-container"
        selectedKeys={[pathname]}
        defaultOpenKeys={defaultOpenKeys}
        style={{ borderRight: 0, width: "100%", height: "100%" }}
      >
        {menuData.map(renderMenuItem)}
      </Menu>
    </Layout.Sider>
  )
}

export default SidebarMenu
