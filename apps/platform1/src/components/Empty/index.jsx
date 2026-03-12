/*
 * @Author: Dyton
 * @Date: 2024-04-19 11:27:10
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-04-19 11:27:41
 * @FilePath: /za-aigc-platform-admin-static/src/components/Empty/index.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */

import { Empty } from "antd"
import TextAnimation from "@/components/TextAnimation"
import styles from "./index.module.scss"
export const EmptyPro = (type) => {
  return (
    <Empty
      key={type}
      className={styles["empty"]}
      description={<TextAnimation text={" 空空如也~"} />}
    ></Empty>
  )
}
export default EmptyPro
