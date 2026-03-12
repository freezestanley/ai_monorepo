/*
 * @Author: Dyton
 * @Date: 2024-04-22 14:06:50
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-04-22 14:08:23
 * @FilePath: /za-aigc-platform-admin-static/src/components/PageHeader/index.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import { useNavigate, useLocation } from "react-router-dom"
import { LeftOutlined } from "@ant-design/icons"
import queryString from "query-string"
import styles from "./index.module.scss"
export const Header = (props) => {
  const { title, children, backUrl, extraChild, descriptions } = props || {}
  const navigate = useNavigate()
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)

  const onBack = () => {
    if (!backUrl) return
    if (window.top === window.self) {
      navigate(`${backUrl}`)
    } else {
      if (queryParams.isTools) {
        navigate(`${backUrl}`)
      } else {
        navigate(-1)
      }
    }
  }
  return (
    <div className={styles["page-header"]}>
      <h2 className={styles["title"]}>
        <div>
          {backUrl && <LeftOutlined onClick={onBack} />}
          {title}
          {descriptions && (
            <span className={styles["page-title-descriptions"]}>{descriptions}</span>
          )}
        </div>
        <div>{extraChild}</div>
      </h2>
      <div>{children}</div>
    </div>
  )
}
