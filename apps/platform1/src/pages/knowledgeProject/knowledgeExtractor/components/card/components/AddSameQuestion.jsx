/*
 * @Author: Dyton
 * @Date: 2024-03-15 16:03:32
 * @Descripttion:优化到问答 - 优化相似问
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-03-29 17:25:48
 * @FilePath: /za-aigc-platform-admin-static/src/pages/knowledgeProject/knowledgeExtractor/components/card/components/AddSameQuestion.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import { Form, Input, Row, Col, Table, Button, Popover } from "antd"
import styles from "../index.module.scss"
import { useExtractorDetail } from "../../../InstanceExtractorDetailProvider"
import { useExtractorCard } from ".."
import { useAddSimilarityApi, useOperateCancelApi } from "@/api/knowledgeExtractor"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"

const SameQuestions = ({ list = [] }) => {
  return (
    <div className={styles["same-questions-list"]}>
      {[...list].map((v, i) => {
        return (
          <div key={`${i}${v}`} className={styles["line"]}>
            {v}
          </div>
        )
      })}
    </div>
  )
}
export const AddSameQuestion = () => {
  const { sameQuestionsBySolution, knowledgeDetail } = useExtractorCard()
  const queryClient = useQueryClient()
  const update = () => {
    queryClient.invalidateQueries([QUERY_KEYS.EXTRACTOR_DETAIL])
  }
  const { mutate } = useAddSimilarityApi(update)
  const {
    extractorInfo: { instanceId }
  } = useExtractorDetail()
  const handleAddQuestions = (record) => {
    const { faqNo, knowledgeBaseNo } = record
    const subData = {
      instanceId,
      faqNo, //faq编号
      dataId: knowledgeDetail?.dataId,
      catalogNo: knowledgeDetail?.faqCatalogNo, //目录编号
      knowledgeBaseNo, //知识库编号
      similarityQuestion: knowledgeDetail?.question //知识库编号
    }
    mutate(subData)
  }
  const { mutate: mutateCancel } = useOperateCancelApi(update)
  const handlerCancel = (record) => {
    const { knowledgeBaseNo } = record
    mutateCancel({
      knowledgeBaseNo, //
      dataId: knowledgeDetail?.dataId,
      instanceId //
    })
  }

  const columns = [
    {
      title: "匹配问题",
      dataIndex: "matchQuestion",
      key: "matchQuestion"
    },
    {
      title: "向量相似度",
      dataIndex: "score",
      key: "score",
      width: 150
    },
    {
      title: "对应标准问题",
      dataIndex: "faqQuestion",
      key: "faqQuestion"
    },
    {
      title: "相似问题数",
      dataIndex: "similarityQuestionCount",
      key: "similarityQuestionCount",
      width: 110,
      render: (txt, record) => {
        const list = record?.faqSimilarityQuestions ?? []
        return list?.length ? (
          <Popover placement="left" content={<SameQuestions list={list} />}>
            <Button type="link">{txt}</Button>
          </Popover>
        ) : (
          <Button disabled type="link">
            {txt}
          </Button>
        )
      }
    },
    {
      title: "",
      dataIndex: "key",
      key: "key",
      width: 80,
      render: (txt, record) => {
        const faqNo = knowledgeDetail?.faqNo
        const sameDone = faqNo && record?.faqNo == faqNo

        const status = knowledgeDetail?.status

        return (
          <Button
            type="link"
            disabled={status != "1" && !sameDone}
            onClick={() => {
              sameDone ? handlerCancel(record) : handleAddQuestions(record)
            }}
          >
            {sameDone ? "取消相似问" : "添加到相似问"}
          </Button>
        )
      }
    }
  ]
  return (
    <div className={`${styles["card"]} ${styles["card-type-1"]}`}>
      <Row gutter={24}>
        <Col span={24}>
          <Form.Item name="extractQuestion" label={"提取问题"}>
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={24}>
        <Col span={24}>
          <Form.Item label={"匹配到问答"} className={styles["match-item"]}>
            <Table
              bordered
              key={"faqNo"}
              columns={columns}
              dataSource={[...sameQuestionsBySolution]}
              pagination={false}
            />
          </Form.Item>
        </Col>
      </Row>
    </div>
  )
}
export default AddSameQuestion
