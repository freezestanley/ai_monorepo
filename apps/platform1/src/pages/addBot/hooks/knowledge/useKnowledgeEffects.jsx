import { useCurrentKnowledgeAndCatalog } from "@/store"
import { useEffect } from "react"
export const useKnowledgeEffects = ({ api, state, catalogNo }) => {
  const { setTreeData } = state
  const { knowledgeListData } = api
  const { knowledgeAndCatalog, changeKnowledgeAndCatalog } = useCurrentKnowledgeAndCatalog()
  useEffect(() => {
    if (knowledgeListData?.knowledgeBaseNo) {
      setTreeData(knowledgeListData)
      if (knowledgeAndCatalog?.currentSelectedKnowledge?.catalogTypeCode) {
        const currentSelectedKnowledgeBase = knowledgeListData?.catalogsTreeList?.find(
          (item) => item.catalogTypeCode === currentSelectedKnowledgeBase.catalogTypeCode
        )
        changeKnowledgeAndCatalog({
          ...knowledgeAndCatalog,
          currentSelectedKnowledgeBase
        })
      } else {
        // 默认第一个知识库
        const currentSelectedKnowledgeBase = knowledgeListData?.catalogsTreeList?.[0] || {}
        const currentSelectedCatalog = catalogNo
          ? [catalogNo]
          : currentSelectedKnowledgeBase?.children?.length > 0
            ? [currentSelectedKnowledgeBase?.children[0].catalogNo]
            : []
        changeKnowledgeAndCatalog({
          currentSelectedKnowledgeBase,
          currentSelectedCatalog
        })
      }
    }
  }, [knowledgeListData, catalogNo])
}

export default useKnowledgeEffects
