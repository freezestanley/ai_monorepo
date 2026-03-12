/*
 * @Author: Dyton
 * @Date: 2024-03-15 18:12:04
 * @Descripttion:优化到问答 - 新增问答
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-03-27 19:11:08
 * @FilePath: /za-aigc-platform-admin-static/src/pages/knowledgeProject/knowledgeExtractor/components/card/components/AddNewQuestion.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */

import { Form, Input, Row, Col, Select } from "antd"
import styles from "../index.module.scss"
import GenerateSameQuestions from "../../generateSameQuestions"
import { useExtractorDetail } from "../../../InstanceExtractorDetailProvider"
import { useExtractorCard } from ".."
const { Option } = Select
const filterOption = (input, option) => {
  return (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
}

export const AddNewQuestion = () => {
  const {
    extractorInfo: { knowledgeClassOptions }
  } = useExtractorDetail()
  const { knowledgeDetail } = useExtractorCard()
  return (
    <div className={`${styles["card"]} ${styles["card-type-2"]}`}>
      <Row gutter={24}>
        <Col span={24}>
          <Form.Item
            name="faqCatalogNo"
            rules={[{ required: true, message: "请选择问答分类" }]}
            label={"问答分类"}
          >
            <Select
              placeholder="请选择问答分类"
              filterOption={filterOption}
              showSearch
              optionFilterProp="children"
              disabled={knowledgeDetail?.faqCatalogNo}
            >
              {knowledgeClassOptions.map((v) => (
                <Option key={v?.catalogNo} value={v?.catalogNo}>
                  {v?.catalogName}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={24}>
        <Col span={24}>
          <Form.Item required label={"新增问答"}>
            <div className={styles["sec-container"]}>
              <Row gutter={24}>
                <Col span={24}>
                  <Form.Item
                    name="question"
                    rules={[{ required: true, message: "请输入标准问题" }]}
                    label={"标准问题"}
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={24}>
                <Col span={24}>
                  <Form.Item
                    name="answer"
                    rules={[{ required: true, message: "请输入答案" }]}
                    label={"答案"}
                  >
                    <Input.TextArea autoSize />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </Form.Item>
        </Col>
      </Row>
      <GenerateSameQuestions />
    </div>
  )
}
export default AddNewQuestion
