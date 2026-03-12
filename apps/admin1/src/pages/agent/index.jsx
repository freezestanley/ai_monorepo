import { useLocation } from "react-router-dom"
import Agent from "../addBot/components/Agent"
import queryString from "query-string"

function AgentView() {
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)
  const { botNo, parentOrigin, workbenchNo, token } = queryParams

  return (
    <div>
      <Agent
        currentBotNo={botNo}
        iframeStyle={true}
        workbenchNo={workbenchNo}
        parentOrigin={parentOrigin}
        token={token}
      />
    </div>
  )
}

export default AgentView
