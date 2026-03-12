/*
 * @Author: dyton
 * @Date: 2023-10-16 14:52:58
 * @Descripttion: 文件描述
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-04-24 14:27:24
 * @FilePath: /za-aigc-platform-admin-static/src/components/Icon/index.jsx
 * Copyright (c) 2023 by ZA-智能中台, All Rights Reserved.
 */
import { createFromIconfontCN } from "@ant-design/icons"
import { forwardRef } from "react"

const IconFontComp = createFromIconfontCN({
  scriptUrl: "//at.alicdn.com/t/c/font_4178446_qgjw7h02dw.js"
})

const Iconfont = ({ type, style = null, className = "", ...res }) => {
  return <IconFontComp type={type} className={className || ""} style={style || null} {...res} />
}

// 创建一个图标组件并注册到 IconStore
export const createIcon = (name) => {
  const IconComponent = forwardRef((props, ref) => {
    return <Iconfont className="custom-bar-icon" type={name} ref={ref} {...props} />
  })
  IconComponent.displayName = name
  return IconComponent
}

export default Iconfont
