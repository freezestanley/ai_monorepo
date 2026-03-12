/*
 * @Author: dyton
 * @Date: 2023-10-16 14:52:58
 * @Descripttion: 文件描述
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-05-22 11:00:39
 * @FilePath: /za-aigc-platform-admin-static/src/components/sidebarMenu/menuData.jsx
 * Copyright (c) 2023 by ZA-智能中台, All Rights Reserved.
 */
import Iconfont from "@/components/Icon"
/**
 * @description: Code与后管的配置1对1映射关系
 * @return {*}
 */
import { PieChartOutlined, SettingOutlined, ApiOutlined, SnippetsOutlined } from "@ant-design/icons"

export const menuData = [
  {
    key: "/addBotList",
    title: "空间管理",
    code: "botListMenu",
    icon: <Iconfont type={"icon-general-botguanli"} />
    // children: [{ key: "/addBotList", title: "空间列表", code: "botListMenu" }]
  },
  {
    key: "/permission-management",
    title: "权限管理",
    code: "authManageMenu",
    icon: <Iconfont type={"icon-general-quanxianguanli"} />,
    children: [
      {
        key: "/menu-auth-management",
        title: "菜单管理",
        code: "authResourceMenu"
      },
      {
        key: "/user-management",
        title: "用户管理",
        code: "authUserManageMenu"
      },
      {
        key: "/role-management",
        title: "角色管理",
        code: "authRoleManageMenu"
      },
      {
        title: "标签管理",
        key: "/group-management",
        code: "authPermissionGroupManageMenu"
      }
    ]
  },
  {
    key: "/template-management",
    title: "模板管理",
    icon: <SnippetsOutlined />,
    code: "templateManageMenu",
    children: [
      {
        key: "/skill-template-management",
        title: "工作流模板",
        code: "skillTemplateMenu"
      }
    ]
  },
  {
    key: "/model-management",
    title: "模型管理",
    icon: <ApiOutlined />,
    code: "modelManage"
  },
  {
    key: "/data-statistics",
    title: "数据统计",
    icon: <PieChartOutlined />,
    code: "dataStatistics",
    children: [
      {
        key: "user-feedback",
        title: "用户反馈",
        code: "userFeedback"
      },
      {
        key: "security-alarm",
        title: "安全告警",
        code: "securityAlarm"
      },
      {
        key: "daily-report",
        title: "日常报表",
        code: "dailyReport"
      },
      {
        key: "call-logs",
        title: "调用日志",
        code: "callLogs"
      }
    ]
  },

  {
    key: "/available-limit",
    title: "可用性治理",
    code: "availableLimit",
    icon: <Iconfont type={"icon-general-botguanli"} />
  },
  {
    key: "/ai-lab",
    title: "AI Lab",
    code: "aiLab",
    icon: <Iconfont type={"icon-general-botguanli"} />
  },
  {
    key: "/technical-radar",
    title: "技术雷达",
    code: "technicalRadar",
    icon: <Iconfont type={"icon-general-botguanli"} />
  },
  {
    key: "/news",
    title: "新消息管理",
    code: "news",
    icon: <Iconfont type={"icon-general-botguanli"} />,
    children: [
      {
        key: "news-catalog",
        title: "消息类型管理",
        code: "newscatalog"
      },
      {
        key: "news-list",
        title: "消息列表管理",
        code: "newslist"
      }
    ]
  }
  // {
  //   key: "/workbenchManageMemu",
  //   title: "工作台管理",
  //   icon: <SettingOutlined />,
  //   code: "workbenchManageMemu"
  // }
]

export default menuData
