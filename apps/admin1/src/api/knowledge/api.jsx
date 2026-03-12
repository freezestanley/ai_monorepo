import { Get, Post, Put, Upload } from "@/api/server"
import { DEFAULTNAMESPACE, knowledgePrefix } from "@/constants"
import { downloadFileWithHeaders } from "../tools"

const prefix = knowledgePrefix

// FAQ-新增/编辑FAQ
export const saveFaq = ({ knowledgeBaseNo, catalogNo, ...params }) => {
  return Post(`${prefix}/admin/knowledge/${knowledgeBaseNo}/${catalogNo}/faq/save`, params)
    .then((res) => {
      return res
    })
    .catch((err) => {
      console.log("err =>>>", err)
    })
}

// post /admin/knowledge/{knowledgeBaseNo}/{catalogNo}/{faqNo}/associateStructures
export const saveAssociateStructures = ({ knowledgeBaseNo, catalogNo, faqNo, ...res }) => {
  return Post(
    `${prefix}/admin/knowledge/${knowledgeBaseNo}/${catalogNo}/${faqNo}/associateStructures`,
    {
      ...res,
      faqNo
    }
  ).then((res) => res)
}

// FAQ-批量生成相似问
export const generateSimilarityQuestion = ({ knowledgeBaseNo, catalogNo, ...res }) => {
  return Post(
    `${prefix}/admin/knowledge/${DEFAULTNAMESPACE}/${knowledgeBaseNo}/${catalogNo}/generateSimilarityQuestion`,
    res
  ).then((res) => res)
}

// 删除问答知识库FAQ
export const deleteKnowledgeBaseFAQ = ({ knowledgeBaseNo, catalogNo, faqNo }) => {
  return Post(`${prefix}/admin/knowledge/${knowledgeBaseNo}/${catalogNo}/faq/${faqNo}/delete`).then(
    (res) => res
  )
}

// /admin/knowledge/faq/batchDelete
export const batchDeleteFAQ = ({ faqs }) => {
  return Post(`${prefix}/admin/knowledge/faq/batchDelete`, {
    faqs
  }).then((res) => res)
}

export const updateCatalog = ({ knowledgeBaseNo, catalogNo, ...res }) => {
  return Post(`${prefix}/admin/knowledge/${knowledgeBaseNo}/${catalogNo}/update`, res).then(
    (res) => res
  )
}

export const deleteCatalog = ({ knowledgeBaseNo, catalogNo }) => {
  return Post(`${prefix}/admin/knowledge/${knowledgeBaseNo}/${catalogNo}/delete`).then((res) => res)
}

export const fetchUsers = (params) => {
  return Get(`${prefix}/api/knowledge/users`, params).then((res) => res.data)
}

export const deleteUser = (id) => {
  return Post(`${prefix}/api/knowledge/users`, { id }).then((res) => res.data)
}

export const createKnowledge = (data) => {
  return Post(`${prefix}/admin/knowledge/create`, data).then((res) => res)
}

export const createCatalog = ({ knowledgeBaseNo, ...res }) => {
  return Post(`${prefix}/admin/knowledge/${knowledgeBaseNo}/catalog/create`, res).then((res) => res)
}

//获取知识库目录列表
export const fetchKnowledgeList = (data) => {
  return Post(`${prefix}/admin/knowledge/list`, data).then((res) => res.data[0])
}

// 分页获取FAQ列表
export const fetchFaqListByPage = ({
  knowledgeBaseNo,
  catalogNo,
  pageNum,
  pageSize,
  question,
  ...params
}) => {
  return Post(
    `${prefix}/admin/knowledge/${DEFAULTNAMESPACE}/${knowledgeBaseNo}/${catalogNo}/faq/listByPage?pageNum=${pageNum}&pageSize=${pageSize}`,
    {
      question,
      ...params
    }
  ).then((res) => res.data)
}

// 根据faqNo获取faq列表
export const fetchFaqListByfaqNo = ({ knowledgeBaseNo, catalogNo, faqNo }) => {
  return Get(
    `${prefix}/admin/knowledge/${DEFAULTNAMESPACE}/${knowledgeBaseNo}/${catalogNo}/${faqNo}/list`
  ).then((res) => res.data)
}

export const fetchKnowledgeDictionaryList = (params) => {
  return Post(`${prefix}/admin/knowledge/dictionary/list`, params).then(
    (res) => res.data ?? res.value
  )
}

export const fetchKnowledgeListByNamespace = () => {
  return Get(`${prefix}/admin/knowledge/${DEFAULTNAMESPACE}/list`).then((res) => res.data)
}

// FAQ-批量上线/下线FAQ
// POST /admin/knowledge/catalog/faq/changeStatus
export const changeStatus = (res) => {
  return Post(`${prefix}/admin/knowledge/catalog/faq/changeStatus`, res).then((res) => res)
}

// FAQ-批量上传
export const mulUpload = (res) => {
  return `${prefix}/admin/knowledge/${DEFAULTNAMESPACE}/${res.knowledgeBaseNo}/${res.catalogNo}/faq/uploadNew`
}

// 知识图片上传
// /admin/knowledge/{namespace}/{knowledgeBaseNo}/{catalogNo}/{faqNo}/file/upload
export const fileUploadImg = (res) => {
  return `${prefix}/admin/knowledge/${DEFAULTNAMESPACE}/${res.knowledgeBaseNo}/${res.catalogNo}/file/upload`
}

// FAQ-批量下载
// GET /admin/knowledge/{knowledgeBaseNo}/{catalogNo}/faq/download
export const mulDownload = (res) => {
  return downloadFileWithHeaders(
    `${prefix}/admin/knowledge/${res.knowledgeBaseNo}/${res.catalogNo}/faq/download?ids=${res.ids}`,
    res.fileName || "knowledgeList.xlsx"
  )
}

// FAQ-下载全部分类
// GET /admin/knowledge/{knowledgeBaseNo}/faq/download
export const downloadAllCategories = ({ knowledgeBaseNo }) => {
  return Get(`${prefix}/admin/knowledge/${knowledgeBaseNo}/faq/download`).then((res) => res)
}

// FAQ-获取下载全部分类结果
// GET /admin/knowledge/{knowledgeBaseNo}/faq/download/result
export const getDownloadAllCategoriesResult = ({ knowledgeBaseNo }) => {
  return Get(`${prefix}/admin/knowledge/${knowledgeBaseNo}/faq/download/result`).then((res) => res)
}

// FAQ-批量导入失败原因下载
export const errorLogDownload = (res) => {
  return downloadFileWithHeaders(
    `${prefix}/admin/knowledge/${res.namespace}/${res.knowledgeBaseNo}/${res.catalogNo}/faq/errorMsgExport/${res.key}`,
    "knowledgeErrorLog.xlsx"
  )
}

// FAQ-上传模板下载
export const getUploadTemplate = () => {
  downloadFileWithHeaders(
    `${prefix}/admin/knowledge/catalog/faq/getUploadTemplate`,
    "template.xlsx"
  )
}

export const uploadDocumentKnowledgeUrl = (knowledgeBaseNo) =>
  `${prefix}/admin/knowledge/${knowledgeBaseNo}/file/upload`

export const analyzeDocumentUrl = (formData) =>
  Upload(`${prefix}/admin/document/analysis/analyze`, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  }).then((res) => res.data)

export const fetchRetrievalDocuments = ({ knowledgeBaseNo, ...params }) => {
  return Post(`${prefix}/admin/knowledge/${knowledgeBaseNo}/retrievalDocuments`, params).then(
    (res) => res
  )
}

// FAQ-获取批量上传结果
export const getUploadResult = (res) => {
  return Get(
    `${prefix}/admin/knowledge/${DEFAULTNAMESPACE}/${res.knowledgeBaseNo}/${res.catalogNo}/faq/upload/${res.key}/result`
  ).then((res) => res)
}

export const addDocument = (res) => {
  return Post(`${prefix}/admin/knowledge/${res.knowledgeBaseNo}/document/add`, res).then(
    (res) => res
  )
}

export const fetchDocumentListByPage = ({
  knowledgeBaseNo,
  catalogNo,
  pageNum,
  pageSize,
  search,
  status,
  source,
  sortFields
}) => {
  return Post(
    `${prefix}/admin/knowledge/${knowledgeBaseNo}/document/listByPage?pageNum=${pageNum}&pageSize=${pageSize}`,
    {
      status,
      source,
      sortFields,
      search,
      catalogNo
    }
  ).then((res) => res.data)
}

export const changeDocumentStatus = (res) => {
  return Post(
    `${prefix}/admin/knowledge/${res.knowledgeBaseNo}/${res.catalogNo}/${res.documentNo}/status/change`,
    res
  ).then((res) => res)
}

// GET /admin/knowledge/{knowledgeBaseNo}/{catalogNo}/{documentNo}/view
export const viewDocument = (res) => {
  return Get(
    `${prefix}/admin/knowledge/${res.knowledgeBaseNo}/${res.catalogNo}/${res.documentNo}/view`
  ).then((res) => res)
}

// GET /admin/knowledge/{knowledgeBaseNo}/{catalogNo}/retrievalSetting
export const fetchRetrievalSetting = ({ knowledgeBaseNo, catalogNo }) => {
  return Get(`${prefix}/admin/knowledge/${knowledgeBaseNo}/${catalogNo}/retrievalSetting`).then(
    (res) => res.data
  )
}

// GET /admin/knowledge/{knowledgeBaseNo}/{catalogNo}/{documentNo}/splitLog
export const fetchSplitLog = ({ knowledgeBaseNo, catalogNo, documentNo }) => {
  return Get(
    `${prefix}/admin/knowledge/${knowledgeBaseNo}/${catalogNo}/${documentNo}/splitLog`
  ).then((res) => res)
}

// POST /admin/knowledge/{knowledgeBaseNo}/{catalogNo}/{documentNo}/edit
export const editDocument = (res) => {
  const query = res.targetCatalogNo ? `?targetCatalogNo=${res.targetCatalogNo}` : ""
  return Post(
    `${prefix}/admin/knowledge/${res.knowledgeBaseNo}/${res.catalogNo}/${res.documentNo}/edit${query}`,
    res
  ).then((res) => res)
}

export const fetchCatalogList = (botNo) => {
  return Get(`/botWeb/bots/${botNo}/knowledgebase/catalog/v1`).then((res) => {
    const catalogsTreeList = res.data?.catalogsTreeList?.map((item) => {
      return {
        ...item,
        catalogName: item.catalogType,
        catalogNo: `parent,${item.children
          ?.map((child) => child.catalogNo)
          ?.sort()
          ?.join(",")}`
      }
    })
    return catalogsTreeList
  })
}

export const retryAddDocument = (res) => {
  return Post(`${prefix}/admin/knowledge/${res.knowledgeBaseNo}/${res.documentNo}/add/retry`).then(
    (res) => res
  )
}

// 更新知识库embedding算法
export const updateKnowledgeFaqEmbedding = ({ knowledgeBaseNo, ...params }) => {
  return Put(`${prefix}/admin/knowledge/${knowledgeBaseNo}/faq/changeEmbedding`, params).then(
    (res) => res
  )
}

// 数据列表查询接口
export const recordListByPage = (params) => {
  return Post(
    `${prefix}/admin/knowledge/structure/v1/${params.knowledgeBaseNo}/${params.catalogNo}/${params.structureNo}/record/listByPage`,
    params
  ).then((res) => res)
}
