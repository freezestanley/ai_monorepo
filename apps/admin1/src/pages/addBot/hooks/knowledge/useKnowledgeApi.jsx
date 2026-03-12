import {
  useChangeStatus,
  useCreateCatalog,
  useDeleteCatalog,
  useFetchFaqListByfaqNo,
  useFetchKnowledgeList,
  useGenerateSimilarityQuestion,
  useSaveFaq,
  useUpdateCatalog
} from "@/api/knowledge"
import { useFetchUploadResultByCatalog } from "@/api/knowledgeDocument"
import { DEFAULTNAMESPACE } from "@/constants"

export const useKnowledgeApi = ({ selectedKnowledgeBase, catalogName, state }) => {
  const { data: knowledgeListData, isLoading: treeDataLoading } = useFetchKnowledgeList({
    namespace: DEFAULTNAMESPACE,
    knowledgeBaseNo: selectedKnowledgeBase,
    catalogName
  })

  const { mutate: createCataLog } = useCreateCatalog()
  const { mutate: updateCataLog } = useUpdateCatalog()
  const { mutate: deleteCataLog } = useDeleteCatalog()
  const { mutate: fetchFaqByfaqNo } = useFetchFaqListByfaqNo()
  const { mutate: changeStatus } = useChangeStatus()
  const { mutate: fetchUploadResultByCatalog } = useFetchUploadResultByCatalog()
  const { mutate: saveFaq } = useSaveFaq()
  const { mutateAsync: generateSimilarityQuestion } = useGenerateSimilarityQuestion()

  return {
    // knowledgeListData: knowledgeListDataWithDepth,
    knowledgeListData,
    // faqListData,
    treeDataLoading,
    // faqListLoading,
    createCataLog,
    updateCataLog,
    deleteCataLog,
    fetchFaqByfaqNo,
    saveFaq,
    changeStatus,
    generateSimilarityQuestion,
    fetchUploadResultByCatalog
  }
}

export default useKnowledgeApi
