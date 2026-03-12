/*
 * @Author: Dyton
 * @Date: 2024-04-18 16:37:23
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-04-18 16:51:16
 * @FilePath: /za-aigc-platform-admin-static/src/pages/market/components/itemModule/skeleton.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import { Col, Row } from "antd"
import styles from "./skeleton.module.scss"
export const SkeletonModule = () => {
  const list = new Array(8).fill(1).map((v, i) => `${2 * i}`)
  return (
    <Row gutter={15}>
      {list.map((v) => (
        <Col span={6}>
          <div className={styles["item"]}></div>
        </Col>
      ))}
    </Row>
  )
}
