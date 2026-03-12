/*
 * @Author: Dyton
 * @Date: 2024-03-15 20:41:32
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-03-27 11:42:43
 * @FilePath: /za-aigc-platform-admin-static/src/pages/knowledgeProject/knowledgeExtractor/components/chat/index.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import styles from "./index.module.scss"

const msgContent = (msgType, msg) => {
  switch (msgType) {
    case "text":
      return msg
    default:
      return "该素材不支持系统内查看"
  }
}

/**
 * @description: 会话
 * @params {*} type
 * @params {*} msg
 * @params {*} time
 * @params {*} name
 * @params {*} msgType ：text
 * @return {*}
 */
const Content = ({ type, time, name, msg, msgType }) => {
  const className = type === "left" ? `${styles["left-chat"]}` : `${styles["right-chat"]}`
  return (
    <div className={className}>
      <div className={styles["header"]}>
        <span>{time}</span>
        <span>{name}</span>
      </div>
      <div className={styles["content"]}>{msgContent(msgType, msg)}</div>
    </div>
  )
}

export const ExtractorChat = ({ instanceData = [], instanceCode }) => {
  // 数据兼容
  const getTransData = () => {
    try {
      return JSON.parse(`[${JSON.stringify(instanceData).replace(/\[|\]/g, "")}]`)
    } catch (e) {
      return [...instanceData]
    }
  }
  return (
    <div className={styles["extractor-chat"]}>
      <div className={styles["extractor-title"]}>
        <span>会话详情</span>
        <span>{instanceCode}</span>
      </div>
      <div className={styles["chat"]}>
        {[...getTransData()].map((v) => {
          const { role, time } = v || {}
          const type = role === "user" ? "left" : "right"
          return <Content type={type} {...v} key={time} />
        })}
      </div>
    </div>
  )
}
