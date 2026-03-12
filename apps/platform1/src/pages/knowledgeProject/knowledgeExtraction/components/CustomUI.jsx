/*
 * @Author: Dyton
 * @Date: 2024-04-26 16:38:12
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-04-26 16:39:34
 * @FilePath: /za-aigc-platform-admin-static/src/pages/knowledgeProject/knowledgeExtraction/components/CustomUI.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
/**
 * @description: 状态
 * @return {*}5 待优化，6，已优化
 */
import styles from "./index.module.scss"
import { Badge, Tag } from "antd"

export const StatusBar = (props) => {
  const { type } = props
  const render = (status, text) => (
    <Tag bordered={false} className={styles["status-bar"]} color={status}>
      <Badge status={status} />
      {text}
    </Tag>
  )
  switch (type) {
    case "0":
      return render("warning", "处理中")
    case "1":
      return render("success", "已完成")
    case "2":
      return render("default", "待启动")
    case "3":
      return render("error", "无法启动")

    default:
      return null
  }
}

export const auditStatusEnum = {
  0: "待优化",
  1: "处理中",
  2: "已优化"
}
