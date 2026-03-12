/*
 * @Author: Dyton
 * @Date: 2024-03-14 17:46:24
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-03-26 17:30:09
 * @FilePath: /za-aigc-platform-admin-static/src/pages/knowledgeProject/knowledgeExtractor/components/container.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import "../styles/components.scss"
import { LeftOutlined } from "@ant-design/icons"
import { Tag, Badge, Descriptions } from "antd"
import { useNavigate } from "react-router-dom"

export const Header = (props) => {
  const { title, children, backUrl, extraChild, descriptions } = props || {}
  const navigate = useNavigate()

  const onBack = () => {
    if (!backUrl) return
    if (window.top === window.self) {
      navigate(`${backUrl}`)
    } else {
      navigate(-1)
    }
  }
  return (
    <div className={"extractor-header"}>
      <h2 className="title">
        <div>
          {backUrl && <LeftOutlined onClick={onBack} />}
          {title}
          {descriptions && <span className="extractor-title-descriptions">{descriptions}</span>}
        </div>
        <div>{extraChild}</div>
      </h2>
      <div>{children}</div>
    </div>
  )
}

export const Container = (props) => {
  const { children } = props || {}
  return (
    <div className="extractor-container">
      <div>{children}</div>
    </div>
  )
}

/**
 * @description: 状态
 * @return {*}5 待优化，6，已优化
 */

export const StatusBar = (props) => {
  const { type } = props
  const render = (status, text) => (
    <Tag bordered={false} className="extractor-status-bar" color={status}>
      <Badge status={status} />
      {text}
    </Tag>
  )
  switch (type) {
    case "0":
      return render("magenta", "落库")
    case "4":
      return render("processing", "开始萃取")
    case "5":
      return render("warning", "待优化")
    case "6":
      return render("success", "已优化")
    case "7":
      return render("error", "萃取失败")
    default:
      return null
  }
}

export const SplitTitle = ({ title }) => {
  return (
    <div className="split-title">
      <span>{title}</span>
    </div>
  )
}
