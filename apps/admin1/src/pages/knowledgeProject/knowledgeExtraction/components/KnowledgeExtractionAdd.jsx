// @ts-nocheck
import PageContainer from "@/components/PageContainer"
import { Button, Form, message, Spin } from "antd"
import { useEffect, useMemo, useState } from "react"
import queryString from "query-string"
import { useLocation } from "react-router-dom"
import { useSaveExtractTaskApi, useExtractTaskDetailApi } from "@/api/knowledgeExtraction"
import { useFetchListByType } from "@/api/knowledgeManage"
import { findKnowledgeLayerNodes } from "@/pages/knowledgeProject/utils"
import KnowledgeExtractionForm from "./KnowledgeExtractionForm"

const { useForm } = Form

export const KnowledgeExtractionAdd = () => {
  const [form] = useForm()
  const location = useLocation()
  const { search } = location
  const { botNo, batchCode } = queryString.parse(search) ?? {}
  const [saved, setSaved] = useState(false)

  // 是否禁用
  const disabled = useMemo(() => !!batchCode || saved, [batchCode, saved])

  // 业务场景
  const { data: listByParentAndType } = useFetchListByType({
    type: "BUSINESS_SCENE",
    botNo
  })

  // 回写任务详情
  const { data: taskDetail, isLoading: detailsLoading } = useExtractTaskDetailApi({
    botNo,
    batchCode
  })
  useEffect(() => {
    if (taskDetail) {
      form.setFieldsValue({
        ...taskDetail,
        _scene: findKnowledgeLayerNodes(listByParentAndType || [], taskDetail?.scene, {
          isToId: true
        })
      })
    }
  }, [form, listByParentAndType, taskDetail])

  // 保存提交
  const { mutate } = useSaveExtractTaskApi()
  const onSave = async () => {
    const values = await form.validateFields()
    const { _scene, ...otherValue } = values
    mutate(
      {
        botNo,
        ...otherValue,
        scene: _scene?.[_scene?.length - 1]
      },
      {
        onSuccess: (e) => {
          if (e?.success) {
            message.success(e.message)
            setSaved(true)
          } else {
            message.error(e.message)
          }
        }
      }
    )
  }

  return (
    <PageContainer
      navBackUrl={`/knowledgeExtraction?botNo=${botNo}`}
      headerTitle={disabled ? "查看知识萃取任务" : "新增知识萃取任务"}
      headerSuffix={
        !disabled ? (
          <Button type="primary" onClick={onSave}>
            保存
          </Button>
        ) : null
      }
    >
      <Spin spinning={batchCode ? detailsLoading : false}>
        <KnowledgeExtractionForm
          botNo={botNo}
          form={form}
          disabled={disabled}
          listByParentAndType={listByParentAndType}
        />
      </Spin>
    </PageContainer>
  )
}
export default KnowledgeExtractionAdd
