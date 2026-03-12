/*
 * @Author: Dyton
 * @Date: 2024-03-21 11:54:47
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-04-02 11:40:57
 * @FilePath: /za-aigc-platform-admin-static/src/pages/knowledgeProject/knowledgeExtractor/components/card/index.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import styles from "./index.module.scss"
import { Button, Form } from "antd"
import { AddTypes, AddNewData, AddNewQuestion, AddSameQuestion } from "./components"
import { createContext, useContext, useEffect, useState } from "react"
import { useExtractorDetail } from "../../InstanceExtractorDetailProvider"
import {
  useSameQuestionsForSolutionApi,
  useAdoptionFaqApi,
  useAdoptionDataApi,
  useAddSimilarityApi,
  useShelveFaqApi,
  useShelvesSructureApi,
  useOperateCancelApi
} from "@/api/knowledgeExtractor"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"
export const ExtractorCardStateContext = createContext({
  formInstance: undefined,
  knowledgeDetail: {},
  taskInfo: {},
  sameQuestionsBySolution: []
})
export const ExtractorCardProvider = (props) => {
  const { children, formInstance, knowledgeDetail, taskInfo, sameQuestionsBySolution } = props
  const values = {
    formInstance,
    taskInfo,
    knowledgeDetail,
    sameQuestionsBySolution
  }
  return (
    <ExtractorCardStateContext.Provider value={{ ...values }}>
      {children}
    </ExtractorCardStateContext.Provider>
  )
}

export const useExtractorCard = () => useContext(ExtractorCardStateContext)

/**
 * @description: 知识萃取 分类
 * @params {*} taskDetail 知识详情
 * @params {*} taskInfo 任务详情
 * @optimizeType {1} 优化到-问答知识
 * @optimizeType {2} 优化到-结构化知识
 * @optimizeType {3} 优化到-问答+结构化知识
 * 1.已搁置 examStatus=3
 * 2.已采纳 examStatus=2
 * 3.未搁置（初始状态） examStatus=1
 * 4.未采纳（初始状态）examStatus=1
 * 5.优化到相似问 examStatus=2 && optimalResult = 1
 * 6.新增问答 examStatus=2 && optimalResult = 2
 * @return {*}
 */
export const ExtractorCard = ({ taskInfo, knowledgeDetail }) => {
  const queryClient = useQueryClient()
  const {
    optimizeType,
    examStatus,
    optimalResult,
    question,
    answer,
    faqCatalogNo,
    instanceId,
    faqNo,
    dataId,
    structureNo,
    data
  } = knowledgeDetail ?? {}
  const {
    extractorInfo: { knowledgeBaseNo }
  } = useExtractorDetail()
  const [form] = Form.useForm()
  const [addType, setAddType] = useState("")
  const onChangeType = (e) => {
    const optimalResult = e.target.value
    setAddType(optimalResult)
    form.setFieldValue({ optimalResult })
  }
  // 相似问
  const { data: sameQuestionsBySolution = [] } = useSameQuestionsForSolutionApi(
    knowledgeBaseNo,
    {
      limit: 10,
      matchScore: 1.7,
      language: "CN",
      searchQuestion: question,
      catalogNo: faqCatalogNo
    },
    optimizeType
  )

  const initForm = () => {
    // 优化到相似问
    const t1 = examStatus === "2" && optimalResult === "1"
    // 新增问答
    const t3 = examStatus === "2" && optimalResult === "2"
    const type = t1 ? "1" : t3 ? "2" : ""
    setAddType(type)
    const structureStrategies = taskInfo?.structureStrategies ?? []
    let structObj = {}
    try {
      Object.keys(data).forEach((name) => {
        const match = structureStrategies.find((v) => v.name === name)
        if (match) {
          structObj[name] = data?.[name]
        }
      })
    } catch (e) {
      console.log(e)
    }
    form.setFieldsValue({
      optimalResult: type,
      ...knowledgeDetail,
      extractQuestion: knowledgeDetail?.question,
      ...structObj
    })
  }

  useEffect(() => {
    initForm()
  }, [knowledgeDetail])

  /**
   * @description: 数据集对应的data
   * @return {*}
   */
  const getStructFormData = () => {
    try {
      let obj = {}
      Object.keys(data).forEach((name) => {
        obj[name] = form.getFieldValue(name)
      })
      return obj
    } catch (e) {
      console.log(e)
      return null
    }
  }

  const updateDetail = () => queryClient.invalidateQueries([QUERY_KEYS.EXTRACTOR_DETAIL])

  // 搁置-新增问答方式
  const { mutate: shelveFaqMutate } = useShelveFaqApi(updateDetail)
  // 搁置-结构化数据类型
  const { mutate: shelvesSructureMutate } = useShelvesSructureApi(updateDetail)
  // 采纳-相似问/列表添加相似问 方式
  const { mutate: addSimilarityMutate } = useAddSimilarityApi(updateDetail)
  // 采纳-新增问答方式
  const { mutate: adoptionFaqMutate } = useAdoptionFaqApi(updateDetail)
  // 采纳-结构化数据
  const { mutate: adoptionDataMutate } = useAdoptionDataApi(updateDetail)
  // 取消操作
  const { mutate: mutateCancel } = useOperateCancelApi(updateDetail)

  /**
   * @description: 采纳-新增问答
   * @return {*}
   */
  const handlerAdoptionFaq = () => {
    const { question, answer } = form.getFieldsValue()
    const subData = {
      faqId: dataId,
      question, //问题
      answer, //答案
      similarityQuestion: form.getFieldValue("similarityQuestion"), //相似问 array[string]
      instanceId, //实例编号
      knowledgeBaseNo, //知识库编号
      structureNo, //目录编号
      catalogNo: faqCatalogNo, //结构化数据编号
      data: getStructFormData() //结构化数据,key是字段名，value是值
    }

    adoptionFaqMutate(subData)
  }
  /**
   * @description: 采纳-结构化数据
   * @return {*}
   */
  const handlerAdoptionSructureData = () => {
    const subData = {
      instanceId, //实例编号
      knowledgeBaseNo, //知识库编号
      catalogNo: faqCatalogNo, //目录编号
      structureNo, //结构化数据编号
      structureId: dataId, //结构化数据id
      data: getStructFormData() //结构化数据,key是字段名，value是值
    }
    adoptionDataMutate(subData)
  }

  /**
   * @description: 采纳-新增相似问
   * @return {*}
   */
  const handlerAddSimilarity = () => {
    const subData = {
      instanceId,
      faqNo, //faq编号
      dataId,
      catalogNo: faqCatalogNo, //目录编号
      knowledgeBaseNo, //知识库编号
      similarityQuestion: question //
    }
    addSimilarityMutate(subData)
  }

  /**
   * @description: 搁置-结构化数据搁置
   * @return {*}
   */
  const handlerShelvesSructure = async () => {
    await form.validateFields()
    shelvesSructureMutate({
      instanceId,
      structureId: dataId //结构化数据id
    })
  }
  /**
   * @description: 搁置-问答知识搁置
   * @return {*}
   */
  const handlerShelveFaq = () => {
    shelveFaqMutate({
      instanceId,
      faqId: dataId
    })
  }

  /**
   * @description: 取消操作
   * @return {*}
   */
  const handlerCancel = () => {
    mutateCancel({
      knowledgeBaseNo, //
      dataId,
      instanceId //
    })
  }

  /**
   * @description: 采纳
   * @return {*}
   * @optimizeType {1} 优化到-问答知识
   * @optimizeType {2} 优化到-结构化知识
   * @optimizeType {3} 优化到-问答+结构化知识
   */
  const handlerAdopt = async () => {
    await form.validateFields()
    switch (optimizeType) {
      case "1":
      case "3":
        addType == "1" ? handlerAddSimilarity() : handlerAdoptionFaq()
        break
      case "2":
        handlerAdoptionSructureData()
        break
      default:
        break
    }
  }

  /**
   * @description: 搁置
   * @return {*}
   */
  const handlerShelve = async () => {
    await form.validateFields()
    switch (optimizeType) {
      case "1":
      case "3":
        handlerShelveFaq()
        break
      case "2":
        handlerShelvesSructure()
        break
      default:
        break
    }
  }

  const getFaqType = () => {
    switch (optimizeType) {
      case "1":
        return "优化到-问答知识"
      case "2":
        return "优化到-结构化知识"
      case "3":
        return "优化到-问答+结构化知识"
      default:
        return "暂无对应分析类型"
    }
  }

  return (
    <ExtractorCardProvider
      formInstance={form}
      knowledgeDetail={knowledgeDetail}
      taskInfo={taskInfo}
      sameQuestionsBySolution={sameQuestionsBySolution}
    >
      <div className={styles["extractor-card"]}>
        <div className={styles["extractor-container"]}>
          <div className={styles["header"]}>
            <div>{getFaqType()}</div>
            <div>
              <Button onClick={examStatus === "3" ? handlerCancel : handlerShelve}>
                {examStatus === "3" ? "取消搁置" : "搁置"}
              </Button>
              <Button
                type="primary"
                onClick={examStatus === "2" ? handlerCancel : handlerAdopt}
                disabled={examStatus === "3" || addType === "1"}
              >
                {examStatus === "2" ? "已采纳" : "采纳"}
              </Button>
            </div>
          </div>

          <Form form={form} className={styles["form"]} disabled={examStatus === "3"}>
            {optimizeType !== "2" && <AddTypes onChangeType={onChangeType} />}
            {optimizeType !== "2" && (
              <>
                {addType === "1" && <AddSameQuestion />}
                {addType === "2" && <AddNewQuestion />}
              </>
            )}
            {/* 优化到-问答+结构化知识 优化到-结构化知识*/}
            {addType !== "1" && (optimizeType === "3" || optimizeType === "2") && <AddNewData />}
          </Form>
        </div>
      </div>
    </ExtractorCardProvider>
  )
}
