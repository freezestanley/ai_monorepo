/*
 * @Author: Dyton
 * @Date: 2024-03-14 17:33:04
 * @Descripttion:知识萃取-批次实例详情
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-04-01 14:58:06
 * @FilePath: /za-aigc-platform-admin-static/src/pages/knowledgeProject/knowledgeExtractor/InstanceExtractorDetail.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */

import { useLocation } from "react-router-dom"
import { Header } from "./components"
import { ExtractorCard, ExtractorChat } from "./components"
import { Button, Spin, message, Empty } from "antd"
import queryString from "query-string"
import {
  useAllExtractionInstanceApi,
  useExtractionInstanceDetailApi,
  useKnowledgeClassApi
} from "@/api/knowledgeExtractor"
import { ExtractorDetailProvider } from "./InstanceExtractorDetailProvider"
import { useState } from "react"
import "./styles/index.scss"
export const InstanceExtractorDetail = () => {
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search) ?? {}
  const [newinstanceId, setNewinstanceId] = useState()
  const { knowledgeBaseNo, batchCode } = queryParams
  const activeinstanceId = newinstanceId ?? queryParams?.instanceId
  const backUrl = `/instanceExtractor${search}`
  const { data: details, isLoading: detailsLoading } =
    useExtractionInstanceDetailApi(activeinstanceId)
  // 目标问答知识库
  const { data: knowledgeClassOptions = [] } = useKnowledgeClassApi({
    knowledgeBaseNo
  })
  const { taskName } = details?.task || { taskName: queryParams.taskName }
  const { data: allInstance = [], isLoading: allInstanceLoading } =
    useAllExtractionInstanceApi(batchCode)
  const showStep = () => {
    try {
      const index = allInstance.findIndex((v) => v.instanceId === activeinstanceId)
      const next = index !== allInstance.length - 1
      const pre = index !== 0
      return { next, pre }
    } catch (e) {
      return { next: true, pre: true }
    }
  }

  const onNextOrPre = (next) => {
    try {
      const index = allInstance.findIndex((v) => v.instanceId === activeinstanceId)
      const instanceId = next
        ? allInstance[index + 1].instanceId
        : allInstance[index - 1].instanceId
      if (instanceId) setNewinstanceId(instanceId)
    } catch (e) {
      console.log(e)
      message.warning("切换异常")
    }
  }

  return (
    <Spin spinning={detailsLoading}>
      <ExtractorDetailProvider
        instanceId={activeinstanceId}
        knowledgeClassOptions={knowledgeClassOptions}
      >
        <Header
          title="知识萃取实例"
          descriptions={`${taskName ? `萃取任务：${taskName}` : "萃取任务"}`}
          backUrl={backUrl}
          extraChild={
            <Spin spinning={allInstanceLoading}>
              <div className="extractor-detail-step">
                <Button size="small" disabled={!showStep()?.pre} onClick={() => onNextOrPre(false)}>
                  上一条
                </Button>
                <Button size="small" disabled={!showStep()?.next} onClick={() => onNextOrPre(true)}>
                  下一条
                </Button>
              </div>
            </Spin>
          }
        ></Header>
        <div className={"extractor-detail-container"}>
          <div>
            <ExtractorChat
              instanceCode={details?.instanceCode}
              instanceData={details?.instanceData || []}
            />
          </div>
          <div className="extractor-card-container">
            <div className={"extractor-title"}>知识萃取</div>
            {details?.suggestionData?.length ? (
              (details?.suggestionData || []).map((v) => {
                return (
                  <ExtractorCard key={v?.dataId} taskInfo={details?.task} knowledgeDetail={v} />
                )
              })
            ) : (
              <div className="extractor-empty">
                <Empty description="暂未解析出相关知识" />
              </div>
            )}
          </div>
        </div>
      </ExtractorDetailProvider>
    </Spin>
  )
}
