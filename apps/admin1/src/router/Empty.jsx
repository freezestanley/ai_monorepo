/*
 * @Author: Dyton
 * @Date: 2023-10-20 14:59:08
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2023-10-20 15:20:11
 * @FilePath: /za-aigc-platform-admin-static/src/router/Empty.jsx
 * Copyright (c) 2023 by ZA-智能中台, All Rights Reserved.
 */
import "./Empty.scss"
import imgSrc from "../assets/img/auth.png"
export default () => {
  return (
    <div className="empty-main">
      <img src={imgSrc} alt="" />
      <span>暂无权限，请联系管理员</span>
    </div>
  )
}
