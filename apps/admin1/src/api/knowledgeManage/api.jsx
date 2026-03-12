import { Post } from "@/api/server"
import { knowledgeExtractorPrefix as prefix } from "@/constants"
import { infoInterceptors } from "../tools"

// 知识管理-查询知识模板列表
export const fetchKnowledgeTemplateList = (params) => {
  return Post(`${prefix}/knowledgeTemplate/list`, params).then((res) => infoInterceptors(res)?.data)
}

// 知识管理-业务场景/意图层级
export const fetchListByParentAndType = (params) => {
  return Post(`${prefix}/knowledgeConfig/${params.botNo}/listByParentAndType`, params).then(
    (res) => res.data
  )
}

// 知识管理-根据type查询基础设置
export const fetchListByType = (params) => {
  return Post(`${prefix}/knowledgeConfig/${params.botNo}/listByType`, params).then(
    (res) => res.data
  )
}

// 知识管理-新增知识模板
export const fetchAddKnowledgeTemplate = (params) => {
  return Post(`${prefix}/knowledgeTemplate/add`, params).then((res) => infoInterceptors(res))
}

// 知识管理-编辑知识模板
export const fetchEditKnowledgeTemplate = (params) => {
  return Post(`${prefix}/knowledgeTemplate/edit/${params.templateId}`, params).then((res) =>
    infoInterceptors(res)
  )
}

// 知识管理-查询知识模板详情
export const fetchQueryRelationDetail = (params) => {
  return Post(
    `${prefix}/knowledgeTemplate/${params.botNo}/queryRelationDetail/${params.templateId}`,
    params
  ).then((res) => infoInterceptors(res)?.data)
}

// 知识管理-查询可用意图
export const fetchQueryDialogueUsable = (params) => {
  return Post(`${prefix}/finance/intention/usable/dialogueUsable/query`, params).then(
    (res) => infoInterceptors(res)?.data
  )
}

// 知识管理-修改知识模板关联详情
export const fetchEditRelationDetail = (params) => {
  return Post(`${prefix}/knowledgeTemplate/editRelationDetail/${params?.templateId}`, params).then(
    (res) => infoInterceptors(res)
  )
}

// 知识管理-新增知识基础配置
export const fetchAddKnowledgeConfig = (params) => {
  return Post(`${prefix}/knowledgeConfig/${params.botNo}/add`, params.data).then((res) =>
    infoInterceptors(res)
  )
}

// 知识管理-查询基础设置
export const fetchKnowledgeConfigListAllByType = (params) => {
  return Post(`${prefix}/knowledgeConfig/${params.botNo}/listAllByType`, params).then(
    (res) => infoInterceptors(res)?.data
  )
}

// 知识管理-申请同步
export const fetchExecuteKnowledgeTemplateApply = (params) => {
  return Post(`${prefix}/knowledgeTemplateApply/execute`, params).then((res) =>
    infoInterceptors(res)
  )
}

// 知识管理-申请记录查询
export const fetchKnowledgeTemplateApplyList = (params) => {
  return Post(`${prefix}/knowledgeTemplateApply/list`, params).then(
    (res) => infoInterceptors(res)?.data
  )
}

// 知识管理-差异展示
export const fetchKnowledgeTemplateApplyShowDiffer = (params) => {
  return Post(`${prefix}/knowledgeTemplateApply/showDiffer`, params).then(
    (res) => infoInterceptors(res)?.data
  )
}

// 知识管理-获取差异文件链接
export const fetchKnowledgeTemplateApplyGetUrl = (params) => {
  return Post(`${prefix}/knowledgeTemplateApply/getUrl/${params.applicationNo}`).then(
    (res) => infoInterceptors(res)?.data
  )
}
