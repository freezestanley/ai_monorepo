/*
 * @Author: Dyton
 * @Date: 2024-03-23 14:51:05
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-03-29 16:18:22
 * @FilePath: /za-aigc-platform-admin-static/src/pages/knowledgeProject/knowledgeExtractor/components/card/components/AddTypes.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import { Form, Row, Col, Radio } from "antd"
import styles from "../index.module.scss"
export const AddTypes = ({ onChangeType = (e) => {} }) => {
  return (
    <div className={`${styles["card-optimal-type"]}`}>
      <Row gutter={24}>
        <Col span={24}>
          <Form.Item
            // rules={[{ required: true, message: "请选择分类" }]}
            name="optimalResult"
          >
            <Radio.Group onChange={onChangeType}>
              <Radio value={"1"}>优化到相似问</Radio>
              <Radio value={"2"}>新增问答</Radio>
            </Radio.Group>
          </Form.Item>
        </Col>
      </Row>
    </div>
  )
}
export default AddTypes
