/*
 * @Author: dyton
 * @Date: 2023-10-18 15:41:32
 * @Descripttion: 文件描述
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-05-23 10:22:59
 * @FilePath: /za-aigc-platform-admin-static/src/constants/modelManage.jsx
 * Copyright (c) 2023 by ZA-智能中台, All Rights Reserved.
 */

import { Tag } from "antd"

/**
 * @description: 菜单管理类型
 * @return {*}
 */
export const EXECUTEMODE = {
  LOCAL: "LOCAL", //原生
  SCRIPT: "SCRIPT" //脚本
}

export const translateExecuteMode = (text) => {
  switch (text) {
    case EXECUTEMODE.LOCAL:
      return <Tag color="green">原生</Tag>
    case EXECUTEMODE.SCRIPT:
      return <Tag color="magenta">脚本</Tag>
    default:
      return "—"
  }
}
