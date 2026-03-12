/*
 * @Author: Dyton
 * @Date: 2024-03-15 18:38:23
 * @Descripttion: 新增数据
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-04-01 14:43:03
 * @FilePath: /za-aigc-platform-admin-static/src/pages/knowledgeProject/knowledgeExtractor/components/card/components/AddNewData.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import { Form, Input, Row, Col, Empty } from "antd"
import styles from "../index.module.scss"
import { useExtractorCard } from ".."

export const AddNewData = () => {
  const { taskInfo, knowledgeDetail } = useExtractorCard()
  const getKeyValues = () => {
    const structureStrategies = taskInfo?.structureStrategies ?? []
    let structureData = knowledgeDetail?.data ?? {}
    try {
      if (!Object.keys(structureData).length) {
        structureStrategies.forEach((v) => (structureData[v?.name] = ""))
      }
    } catch (e) {}
    let result = []
    try {
      Object.keys(structureData).forEach((name) => {
        const o = {}
        const match = structureStrategies.find((v) => v.name === name)
        if (match) {
          o["label"] = match?.description
          o["name"] = match?.name
          o["value"] = structureData?.[name]
          result.push(o)
        }
      })
    } catch (e) {}
    return result
  }
  return (
    <div className={`${styles["card"]} ${styles["card-type-4"]}`}>
      <Row gutter={24}>
        <Col span={24}>
          <Form.Item required label={"新增数据"}>
            <div className={styles["sec-container"]}>
              {!getKeyValues()?.length ? (
                <Empty className={styles["empty"]} description="暂未匹配到数据集"></Empty>
              ) : (
                getKeyValues().map((v) => {
                  const { name, label } = v
                  return (
                    <Row gutter={24}>
                      <Col span={24}>
                        <Form.Item name={name} label={label}>
                          <Input.TextArea autoSize />
                        </Form.Item>
                      </Col>
                    </Row>
                  )
                })
              )}
            </div>
          </Form.Item>
        </Col>
      </Row>
    </div>
  )
}
export default AddNewData
