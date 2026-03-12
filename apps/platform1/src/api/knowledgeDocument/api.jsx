import { Get, Post, Put, Delete, Patch } from "@/api/server"
import { DEFAULTNAMESPACE, knowledgePrefix } from "@/constants"

const prefix = knowledgePrefix

export const fetchUploadResult = (params) => {
  return Get(
    `${prefix}/admin/knowledge/${params.knowledgeBaseNo}/${params.catalogNo}/document/upload/result`,
    params
  ).then((res) => res.data)
}

export const uploadDocument = (params) => {
  return `${prefix}/admin/knowledge/${params.knowledgeBaseNo}/${params.catalogNo}/document/upload`
}

export const generateFaq = (params) => {
  return Post(
    `${prefix}/admin/knowledge/${params.knowledgeBaseNo}/${params.catalogNo}/document/faq/generate`,
    params
  ).then((res) => res)
}

export const fetchGenerateResultListByPage = (params) => {
  return Get(
    `${prefix}/admin/knowledge/${params.knowledgeBaseNo}/${params.catalogNo}/${params.documentNo}/faq/generate/listByPage`,
    params
  ).then((res) => res.data)
}

export const deleteGenerateResult = (params) => {
  return Post(
    `${prefix}/admin/knowledge/${params.knowledgeBaseNo}/${params.catalogNo}/${params.documentNo}/faq/delete`,
    params
  ).then((res) => res)
}

export const addFaq = (params) => {
  return Post(
    `${prefix}/admin/knowledge/${params.knowledgeBaseNo}/${params.catalogNo}/${params.documentNo}/faq/generate/add`,
    params
  ).then((res) => res)
}

export const cancelGenerateFaq = (params) => {
  return Get(
    `${prefix}/admin/knowledge/${params.knowledgeBaseNo}/${params.catalogNo}/${params.documentNo}/document/upload/cancel`,
    params
  ).then((res) => res)
}

export const confirmAddFaq = (params) => {
  return Post(
    `${prefix}/admin/knowledge/${params.knowledgeBaseNo}/${params.catalogNo}/${params.documentNo}/faq/generate/confirm`,
    params
  ).then((res) => res)
}

export const fetchUploadResultByCatalog = (params) => {
  return Get(
    `${prefix}/admin/knowledge/${DEFAULTNAMESPACE}/${params.knowledgeBaseNo}/${params.catalogNo}/faq/upload/result`,
    params
  ).then((res) => res)
}

// 删除知识库文档
export const deleteKnowledgeBaseDocument = ({ knowledgeBaseNo, catalogNo, documentNo }) => {
  return Post(
    `${prefix}/admin/knowledge/${knowledgeBaseNo}/${catalogNo}/${documentNo}/delete`
  ).then((res) => res)
}

// /admin/knowledge/document/batchDelete
export const batchDeleteDocument = (params) => {
  return Post(`${prefix}/admin/knowledge/document/batchDelete`, params).then((res) => res)
}

// 分页查询文档分块内容
export const fetchPageSharing = ({ knowledgeBaseNo, catalogNo, documentNo, ...params }) => {
  return Get(
    `${prefix}/admin/knowledge/${knowledgeBaseNo}/${catalogNo}/${documentNo}/pageDocumentSharding`,
    params
  ).then((res) => res.data)
}

// 删除分块内容
export const deleteDocumentSharding = ({
  knowledgeBaseNo,
  catalogNo,
  documentNo,
  shardingNo,
  ...params
}) => {
  return Delete(
    `${prefix}/admin/knowledge/${knowledgeBaseNo}/${catalogNo}/${documentNo}/${shardingNo}/delSharding`,
    params
  ).then((res) => res)
}

// 更新分块内容
export const editDocumentSharding = ({
  knowledgeBaseNo,
  catalogNo,
  documentNo,
  shardingNo,
  ...params
}) => {
  return Post(
    `${prefix}/admin/knowledge/${knowledgeBaseNo}/${catalogNo}/${documentNo}/${shardingNo}/editSharding`,
    params
  ).then((res) => res)
}

// 创建分块内容
export const createDocumentSharding = ({ knowledgeBaseNo, catalogNo, documentNo, ...params }) => {
  return Post(
    `${prefix}/admin/knowledge/${knowledgeBaseNo}/${catalogNo}/${documentNo}/createSharding`,
    params
  ).then((res) => res)
}

// 获取embeddingType
export const fetchEmbeddingType = () => {
  return Get(`${prefix}/admin/knowledge/embeddingType`).then((res) => res.data)
}

// 获取知识库配置
export const fetchKnowledgeBaseConfig = (knowledgeBaseNo) => {
  return Get(`${prefix}/admin/knowledge/${knowledgeBaseNo}/config/info`).then((res) => res.data)
}

// 创建知识库配置
export const createKnowledgeBaseConfig = ({ knowledgeBaseNo, ...params }) => {
  return Post(`${prefix}/admin/knowledge/${knowledgeBaseNo}/config/create`, params).then(
    (res) => res
  )
}
