// @ts-nocheck
/*
 * @Author: Dyton
 * @Date: 2024-04-25 16:25:53
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-04-25 20:47:32
 * @FilePath: /za-aigc-platform-admin-static/src/components/PageContainer/index.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import styles from "./index.module.scss"
import { LeftOutlined } from "@ant-design/icons"
import { Divider } from "antd"
import { useNavigate } from "react-router-dom"
/**
 * @description: 通用页面Container
 * @param {*} showHeader            @types boolean           页面header展示
 * @param {*} headerTitle           @types string            页面标题
 * @param {*} headerDescription     @types string            页面描述
 * @param {*} headerSuffix          @types React.ReactNode   页面右上角的自定义内容
 * @param {*} headerCustomeSearch   @types React.ReactNode   页面自定义搜索
 * @param {*} navBackUrl            @types string            返回按钮的跳转地址
 * @param {*} children              @types React.ReactNode   页面内容
 * @param {*} className             @types string            自定义className
 * @example
 * <PageContainer
 *   headerTitle="页面标题"
 *   headerDescription="页面描述"
 *   headerSuffix={<Button>操作按钮</Button>}
 *   headerCustomeSearch={<Input placeholder="自定义搜索" />}
 *   navBackUrl="/">
 *      页面内容
 *  </PageContainer>
 */

export const PageContainer = ({
  showHeader = true,
  headerTitle = "",
  headerDescription = null,
  headerSuffix = null,
  headerCustomeSearch = null,
  navBackUrl = null,
  className = "",
  children
}) => {
  const navigate = useNavigate()
  const onBack = () => {
    if (!navBackUrl) return
    if (window.top === window.self) {
      navigate(`${navBackUrl}`)
    } else {
      navigate(-1)
    }
  }
  return (
    <div className={`${styles["page-container"]} ${className}`}>
      {showHeader && (
        <div className={styles["header"]}>
          <h2 className={styles["title"]}>
            <div>
              {navBackUrl && <LeftOutlined onClick={onBack} />}
              {headerTitle}
              {headerDescription && (
                <span className={styles["descriptions"]}>{headerDescription}</span>
              )}
            </div>
            {headerSuffix && <div>{headerSuffix}</div>}
          </h2>
          {headerCustomeSearch && <div>{headerCustomeSearch}</div>}
        </div>
      )}
      <div className={styles["container"]}>
        <div>{children}</div>
      </div>
    </div>
  )
}

export default PageContainer
