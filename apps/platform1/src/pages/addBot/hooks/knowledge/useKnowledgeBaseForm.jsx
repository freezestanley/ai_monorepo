import { DEFAULTNAMESPACE } from "@/constants"
import useKnowledgeApi from "./useKnowledgeApi"
import useKnowledgeEffects from "./useKnowledgeEffects"
import useKnowledgeHandlers from "./useKnowledgeHandlers"
import useKnowledgeState from "./useKnowledgeState"

export const useKnowledgeBaseForm = ({
  selectedKnowledgeBase,
  catalogName = undefined,
  catalogNo,
  botNo = ""
}) => {
  const state = useKnowledgeState()
  const api = useKnowledgeApi({
    selectedSpace: DEFAULTNAMESPACE,
    selectedKnowledgeBase,
    catalogName,
    state,
    botNo
  })
  const handlers = useKnowledgeHandlers({
    api,
    state,
    selectedSpace: DEFAULTNAMESPACE,
    selectedKnowledgeBase
  })

  useKnowledgeEffects({ api, state, catalogNo })

  return { ...state, ...api, ...handlers }
}

export default useKnowledgeBaseForm
