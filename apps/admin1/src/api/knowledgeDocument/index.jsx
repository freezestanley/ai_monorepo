import { useQuery, useMutation } from "@tanstack/react-query"
import {
  fetchUploadResult,
  uploadDocument,
  generateFaq,
  fetchGenerateResultListByPage,
  deleteGenerateResult,
  addFaq,
  cancelGenerateFaq,
  confirmAddFaq,
  fetchUploadResultByCatalog,
  deleteKnowledgeBaseDocument,
  batchDeleteDocument,
  fetchPageSharing,
  deleteDocumentSharding,
  editDocumentSharding,
  createDocumentSharding,
  fetchEmbeddingType,
  fetchKnowledgeBaseConfig,
  createKnowledgeBaseConfig
} from "./api"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { useQueryClient } from "@tanstack/react-query"
import { message } from "antd"

// FAQ-文档-查询上传结果
export const useFetchUploadResult = (params) => {
  return useQuery([QUERY_KEYS.UPLOAD_RESULT, params], () => fetchUploadResult(params))
}

// FAQ-文档-上传文档
// export const useUploadDocument = () => {
//   return useMutation(uploadDocument)
// }

// FAQ-文档-生成FAQ
export const useGenerateFaq = () => {
  return useMutation(generateFaq)
}

// FAQ-文档-文档生成结果分页查询
export const useFetchGenerateResultListByPage = (params) => {
  return useQuery([QUERY_KEYS.GENERATE_RESULT_LIST, params], () =>
    fetchGenerateResultListByPage(params)
  )
}

// FAQ-文档-删除生成结果
export const useDeleteGenerateResult = () => {
  return useMutation(deleteGenerateResult)
}

// FAQ-文档-再加一题
export const useAddFaq = () => {
  return useMutation(addFaq)
}

// FAQ-文档-生成FAQ终止 mutataion
export const useCancelGenerateFaq = (params) => {
  return useMutation(cancelGenerateFaq)
}

// FAQ-文档-确认添加
export const useConfirmAddFaq = () => {
  return useMutation(confirmAddFaq)
}

// mutation
export const useFetchUploadResultByCatalog = () => {
  return useMutation(fetchUploadResultByCatalog)
}

// 删除知识库
export const useDeleteKnowledgeBaseDocument = () => {
  const queryClient = useQueryClient()
  return useMutation(deleteKnowledgeBaseDocument, {
    onSuccess: (res) => {
      queryClient.invalidateQueries([QUERY_KEYS.DOCUMENT_LIST_BY_PAGE])
    }
  })
}

// /admin/knowledge/document/batchDelete
export const useBatchDeleteDocument = () => {
  const queryClient = useQueryClient()
  return useMutation(batchDeleteDocument, {
    onSuccess: (res) => {
      queryClient.invalidateQueries([QUERY_KEYS.DOCUMENT_LIST_BY_PAGE])
    }
  })
}

// 分页查询文档分块内容
export const useFetchPageSharing = (params, options = {}) => {
  return useQuery([QUERY_KEYS.PAGE_SHARING, params], () => fetchPageSharing(params), {
    enabled: !!(params?.knowledgeBaseNo && params?.catalogNo && params?.documentNo),
    ...options
  })
}

// 删除分块内容
export const useDeleteDocumentSharding = () => {
  const queryClient = useQueryClient()
  return useMutation(deleteDocumentSharding, {
    onSuccess: (d) => {
      queryClient.invalidateQueries([QUERY_KEYS.PAGE_SHARING])
      message.success("删除成功")
    },
    onError: (e) => {
      message.error(e.message)
    }
  })
}

// 更新分块内容
export const useEditDocumentSharding = () => {
  const queryClient = useQueryClient()
  return useMutation(editDocumentSharding, {
    onSuccess: (d) => {
      queryClient.invalidateQueries([QUERY_KEYS.PAGE_SHARING])
      message.success("修改成功")
    },
    onError: (e) => {
      message.error(e.message)
    }
  })
}

// 创建分块内容
export const useCreateDocumentSharding = () => {
  const queryClient = useQueryClient()
  return useMutation(createDocumentSharding, {
    onSuccess: (d) => {
      queryClient.invalidateQueries([QUERY_KEYS.PAGE_SHARING])
      message.success("创建成功")
    },
    onError: (e) => {
      message.error(e.message)
    }
  })
}

// 获取embeddingType
export const useFetchEmbeddingType = () => {
  return useQuery([QUERY_KEYS.EMBEDDING_TYPE], fetchEmbeddingType)
}

// 获取知识库配置
export const useFetchKnowledgeBaseConfig = (params) => {
  return useQuery(
    [QUERY_KEYS.KNOWLEDGE_BASE_CONFIG, params],
    () => fetchKnowledgeBaseConfig(params),
    {
      enabled: !!params
    }
  )
}

// 创建知识库配置
export const useCreateKnowledgeBaseConfig = () => {
  return useMutation(createKnowledgeBaseConfig, {
    onSuccess: (d) => {
      if (d?.success) {
        message.success("更新成功")
      } else {
        d.message && message.error(d.message)
      }
    },
    onError: (e) => {
      message.error(e.message)
    }
  })
}
