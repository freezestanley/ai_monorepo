import { Layout } from "antd"
import SidebarHeader from "./SidebarHeader"
import SidebarMenu from "./SidebarMenu"
import ChooseBot from "./ChooseBot"
import UserInfo from "./UserInfo"

interface SidebarProps {
  isCollapsed: boolean
  hideSideBarAndHeader: boolean
}

const { Sider } = Layout

export default function Sidebar({ isCollapsed, hideSideBarAndHeader }: SidebarProps) {
  if (hideSideBarAndHeader) {
    return null
  }

  return (
    <Sider
      collapsible
      collapsed={isCollapsed}
      trigger={null}
      width={256}
      collapsedWidth={80}
      className="fixed left-0 top-0 z-10 h-screen overflow-visible border-r border-[#f1f1f1] bg-white"
      style={{ transition: "none", margin: 0, borderTop: "none" }}
    >
      <div className={`flex h-full flex-col bg-white ${isCollapsed ? "px-3 py-4" : "px-4 py-4"}`}>
        <div className={isCollapsed ? "mb-3" : "mb-4"}>
          <SidebarHeader isCollapsed={isCollapsed} />
        </div>
        <div className={isCollapsed ? "mb-6 px-0" : "mb-8 px-0"}>
          <ChooseBot />
        </div>
        <div className="sidebar-menu-wrapper min-h-0 flex-1">
          <SidebarMenu isCollapsed={isCollapsed} />
        </div>
        <UserInfo />
      </div>
    </Sider>
  )
}
