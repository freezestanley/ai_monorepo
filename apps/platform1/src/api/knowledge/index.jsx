import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  createKnowledge,
  createCatalog,
  fetchKnowledgeList,
  fetchFaqListByPage,
  fetchKnowledgeListByNamespace,
  updateCatalog,
  deleteCatalog,
  generateSimilarityQuestion,
  saveFaq,
  changeStatus,
  fetchFaqListByfaqNo,
  getUploadResult,
  addDocument,
  changeDocumentStatus,
  editDocument,
  fetchDocumentListByPage,
  viewDocument,
  fetchCatalogList,
  retryAddDocument,
  deleteKnowledgeBaseFAQ,
  updateKnowledgeFaqEmbedding,
  recordListByPage,
  saveAssociateStructures,
  batchDeleteFAQ,
  fetchKnowledgeDictionaryList,
  downloadAllCategories,
  getDownloadAllCategoriesResult,
  fetchRetrievalDocuments,
  fetchRetrievalSetting
} from "./api"
import { QUERY_KEYS } from "@/constants/queryKeys"

// 新增编辑FAQ
export const useSaveFaq = () => {
  return useMutation(saveFaq)
}

// 保存关联结构
export const useSaveAssociateStructures = () => {
  const queryClient = useQueryClient()

  return useMutation(saveAssociateStructures, {
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries([QUERY_KEYS.FAQ_LIST_BY_PAGE])
      }, 1000)
    }
  })
}

// 生成相似问题
export const useGenerateSimilarityQuestion = () => {
  return useMutation(generateSimilarityQuestion)
}

// 创建知识库
export const useCreateKnowledge = () => {
  const queryClient = useQueryClient()
  return useMutation(createKnowledge, {
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.KNOWLEDGE_LIST_MENU])
      queryClient.invalidateQueries([QUERY_KEYS.KNOWLEDGE_LIST])
    }
  })
}

// 创建知识目录
export const useCreateCatalog = () => {
  const queryClient = useQueryClient()
  return useMutation(createCatalog, {
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.KNOWLEDGE_LIST])
    }
  })
}

// 更新知识目录
export const useUpdateCatalog = () => {
  const queryClient = useQueryClient()
  return useMutation(updateCatalog, {
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.KNOWLEDGE_LIST])
    }
  })
}

// 删除知识目录
export const useDeleteCatalog = () => {
  const queryClient = useQueryClient()
  return useMutation(deleteCatalog, {
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.KNOWLEDGE_LIST])
    }
  })
}

// 获取知识库目录列表
export const useFetchKnowledgeList = (params) => {
  return useQuery([QUERY_KEYS.KNOWLEDGE_LIST, params], () => fetchKnowledgeList(params))
}

// 获取知识库枚举
export const useFetchKnowledgeListByNamespace = () => {
  return useQuery([QUERY_KEYS.KNOWLEDGE_LIST_MENU], () => fetchKnowledgeListByNamespace())
}

// 获取切片方法字典
export const useFetchKnowledgeDictionaryList = (params) => {
  return useQuery([QUERY_KEYS.KNOWLEDGE_DICTIONARY, params], () =>
    fetchKnowledgeDictionaryList(params)
  )
}

// 分页获取FAQ列表
export const useFetchFaqListByPage = ({
  namespace,
  knowledgeBaseNo,
  catalogNo,
  pageNum,
  pageSize,
  question,
  ...params
}) => {
  return useQuery(
    [
      QUERY_KEYS.FAQ_LIST_BY_PAGE,
      namespace,
      knowledgeBaseNo,
      catalogNo,
      pageNum,
      pageSize,
      question,
      params
    ],
    () =>
      fetchFaqListByPage({
        namespace,
        knowledgeBaseNo,
        catalogNo,
        pageNum,
        pageSize,
        question,
        ...params
      }),
    {
      enabled: !!namespace && !!knowledgeBaseNo && !!catalogNo
    }
  )
}

// 根据faqNo获取faq列表, 这应该是一个mutation, 因为是编辑时候触发的
export const useFetchFaqListByfaqNo = () => {
  return useMutation(fetchFaqListByfaqNo, {
    onSuccess: () => {}
  })
}

// 批量上下线
export const useChangeStatus = () => {
  const queryClient = useQueryClient()
  return useMutation(changeStatus, {
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.FAQ_LIST_BY_PAGE])
    }
  })
}

// 获取上传结果
export const useGetUploadTemplate = () => {
  return useMutation(getUploadResult)
}

// 添加文档
export const useAddDocument = () => {
  return useMutation(addDocument)
}

// 分页获取文档列表
export const useFetchDocumentListByPage = ({
  knowledgeBaseNo,
  catalogNo,
  pageNum,
  pageSize,
  search,
  status,
  source,
  sortFields,
  ...params
}) => {
  return useQuery(
    [
      QUERY_KEYS.DOCUMENT_LIST_BY_PAGE,
      knowledgeBaseNo,
      catalogNo,
      pageNum,
      pageSize,
      search,
      status,
      source,
      sortFields
    ],
    () =>
      fetchDocumentListByPage({
        knowledgeBaseNo,
        catalogNo,
        pageNum,
        pageSize,
        search,
        status,
        source,
        sortFields
      })
  )
}

// 改变文档状态
export const useChangeDocumentStatus = () => {
  const queryClient = useQueryClient()
  return useMutation(changeDocumentStatus, {
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.DOCUMENT_LIST_BY_PAGE])
    }
  })
}

// 查看文档
export const useViewDocument = () => {
  return useMutation(viewDocument)
}

// 编辑文档
export const useEditDocument = () => {
  const queryClient = useQueryClient()
  return useMutation(editDocument, {
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.DOCUMENT_LIST_BY_PAGE])
    }
  })
}

// 删除知识库faq
export const useDeleteKnowledgeBaseFAQ = () => {
  const queryClient = useQueryClient()
  return useMutation(deleteKnowledgeBaseFAQ, {
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.FAQ_LIST_BY_PAGE])
    }
  })
}

// 批量删除faq
export const useBatchDeleteFAQ = () => {
  const queryClient = useQueryClient()
  return useMutation(batchDeleteFAQ, {
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.FAQ_LIST_BY_PAGE])
    }
  })
}

// 获取知识库目录列表
export const useFetchCatalogList = (params) => {
  return useQuery([QUERY_KEYS.CATALOG_LIST, params], () => fetchCatalogList(params))
}

// retry
export const useRetryAddDocument = () => {
  return useMutation(retryAddDocument)
}

// 更新知识库embedding算法
export const useUpdateKnowledgeFaqEmbedding = () => {
  return useMutation(updateKnowledgeFaqEmbedding)
}

// 数据集合列表
export const useRecordListByPage = (params) => {
  return useQuery([QUERY_KEYS.FETCHSTRUCTUREDATASETLIST, params], () => recordListByPage(params))
  // return useMutation(recordListByPage)
}

// 下载全部分类
export const useDownloadAllCategories = () => {
  return useMutation(downloadAllCategories)
}

// 获取下载全部分类结果
export const useGetDownloadAllCategoriesResult = () => {
  return useMutation(getDownloadAllCategoriesResult)
}

export const useFetchRetrievalDocuments = () => {
  return useMutation(fetchRetrievalDocuments)
}

export const useFetchRetrievalSetting = (params) => {
  return useQuery([QUERY_KEYS.FETCHRETRIEVALSETTING, params], () => fetchRetrievalSetting(params), {
    enabled: !!params.knowledgeBaseNo && !!params.catalogNo
  })
}
