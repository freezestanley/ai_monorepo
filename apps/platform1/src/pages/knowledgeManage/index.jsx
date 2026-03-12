import { useLocation } from "react-router-dom"
import "./index.scss"
import queryString from "query-string"
import KnowledgeBaseWrapper from "../addBot/components/KnowledgeBaseWrapper"
import { useFetchBotInfo } from "@/api/bot"

function KnowledgeManage() {
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)
  const { knowledgeData, knowledgeBaseNo, catalogNo, botNo } = queryParams
  const shouldFetchBotInfo = !knowledgeData && !knowledgeBaseNo && !!botNo
  const { data: botDetails = {} } = useFetchBotInfo(shouldFetchBotInfo ? botNo : undefined)
  const selectedKnowledgeBase = knowledgeData || knowledgeBaseNo || botDetails?.knowledgeBaseNo

  return (
    <div>
      <KnowledgeBaseWrapper selectedKnowledgeBase={selectedKnowledgeBase} catalogNo={catalogNo} />
    </div>
  )
}

export default KnowledgeManage
