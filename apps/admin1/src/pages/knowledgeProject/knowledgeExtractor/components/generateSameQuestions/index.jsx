/*
 * @Author: Dyton
 * @Date: 2024-03-26 10:17:07
 * @Descripttion:一键生成相似问
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-03-29 16:36:42
 * @FilePath: /za-aigc-platform-admin-static/src/pages/knowledgeProject/knowledgeExtractor/components/generateSameQuestions/index.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import { Form, Button, Row, Col, Select, Tooltip, Modal, message } from "antd"
import Iconfont from "@/components/Icon"
import styles from "./index.module.scss"
import { useState } from "react"
import { DEFAULTNAMESPACE } from "@/constants"
import { useGenerateSimilarityQuestion } from "@/api/knowledge"
import { useExtractorDetail } from "../../InstanceExtractorDetailProvider"
import { useExtractorCard } from "../card"

const { Option } = Select
export const GenerateSameQuestions = ({
  name = "similarityQuestion",
  // 语种
  language = "CN"
}) => {
  const [visible, setVisible] = useState(false)
  const {
    extractorInfo: { knowledgeBaseNo }
  } = useExtractorDetail()
  const { formInstance, knowledgeDetail } = useExtractorCard()
  // 目录编号
  const catalogNo = knowledgeDetail?.faqCatalogNo
  const examStatus = knowledgeDetail?.examStatus
  const generateDisabled = examStatus === "3"
  const similarityQuestion = knowledgeDetail?.similarityQuestion ?? []
  const [similarQuestions, setSimilarQuestions] = useState([...similarityQuestion])
  const [userQuestions, setUserQuestions] = useState([])
  const [magicQuestions, setMagicQuestions] = useState([])
  const { mutateAsync: generateSimilarityQuestion } = useGenerateSimilarityQuestion()
  const [loading, setLoading] = useState(false)
  const handleEnterDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      // 这里也要去重
      const newQuestions = Array.from(new Set([...similarQuestions, e.target.value]))
      handleSimilarQuestionsChange(newQuestions)
    }
  }
  const handleSimilarQuestionsChange = (newQuestions) => {
    // 需要把值给到Form表单中
    formInstance.setFieldsValue({ [`${name}`]: newQuestions })
    setSimilarQuestions(newQuestions)
  }
  const handleSaveQuestions = () => {
    //赋值
    formInstance.setFieldsValue({ [`${name}`]: userQuestions })
    setSimilarQuestions(userQuestions)
    setVisible(false)
  }
  // 一键生成相似问题
  const handleGenerateSimilarQuestions = async (data, event) => {
    setLoading(true)
    const d = formInstance.getFieldsValue()
    await generateSimilarityQuestion(
      {
        faqQuestion: d[`question`],
        faqAnswer: d[`answer`],
        namespace: DEFAULTNAMESPACE,
        knowledgeBaseNo,
        catalogNo,
        language
      },
      {
        onSuccess: (e) => {
          if (e?.success) {
            setMagicQuestions(e?.data ?? [])
            message.success(e?.message)
          } else {
            message.error(e?.message)
          }
        }
      }
    )
    setLoading(false)
  }
  const handleAddQuestions = () => {
    const newQuestions = Array.from(new Set([...userQuestions, ...magicQuestions]))

    setUserQuestions(newQuestions)
    setMagicQuestions([])
  }
  return (
    <div className={styles["same-generate"]}>
      <Row gutter={24}>
        <Col span={24}>
          <Form.Item name={name} required={false} label={"相似问题"}>
            <div className={styles["same-questons"]}>
              <Select
                mode="tags"
                placeholder="请选择或输入相似问题"
                onChange={handleSimilarQuestionsChange}
                value={similarQuestions}
                onKeyDown={handleEnterDown}
                allowClear={true}
              >
                {similarQuestions.map((question) => (
                  <Option key={question}>{question}</Option>
                ))}
              </Select>
              <Tooltip title="生成相似问题">
                <Button
                  disabled={generateDisabled}
                  type="primary"
                  icon={<Iconfont type={"icon-moshubang"} />}
                  onClick={() => {
                    setVisible(true)
                    setUserQuestions(similarQuestions)
                  }}
                >
                  一键生成
                </Button>
              </Tooltip>
            </div>
          </Form.Item>
        </Col>
      </Row>
      <Modal
        title="生成相似问题"
        open={visible}
        onOk={handleSaveQuestions}
        onCancel={() => setVisible(false)}
        width={720}
        destroyOnClose={true}
      >
        <Button type="primary" onClick={handleGenerateSimilarQuestions} loading={loading}>
          一键生成
        </Button>
        <Row>
          <Col span={9}>
            <Select
              mode="tags"
              allowClear={true}
              style={{ width: "100%", marginTop: 16 }}
              placeholder="生成的相似问题"
              onDeselect={(question) => {
                setMagicQuestions((prevQuestions) => prevQuestions.filter((q) => q !== question))
              }}
              value={magicQuestions}
            >
              {magicQuestions.map((question) => (
                <Option key={question}>{question}</Option>
              ))}
            </Select>
          </Col>
          <Col span={6} className="text-center">
            <Button
              type="primary"
              icon={<Iconfont type={"icon-youjiantou"} className={"text-white"} />}
              onClick={handleAddQuestions}
              style={{ marginTop: 16 }}
            >
              添加
            </Button>
          </Col>
          <Col span={9}>
            <Select
              mode="tags"
              allowClear={true}
              style={{ width: "100%", marginTop: 16 }}
              placeholder="用户的相似问题"
              value={userQuestions}
              onChange={setUserQuestions}
            >
              {userQuestions.map((question) => (
                <Option key={question}>{question}</Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Modal>
    </div>
  )
}

export default GenerateSameQuestions
