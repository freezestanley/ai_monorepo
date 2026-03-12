import { useLocation } from "react-router-dom"
import Skill from "../addBot/components/SkillList"
import "./index.scss"
import queryString from "query-string"

function SkillList() {
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)
  const { botNo, parentOrigin, workbenchNo } = queryParams

  return (
    <div>
      <Skill
        currentBotNo={botNo}
        parentOrigin={parentOrigin}
        workbenchNo={workbenchNo}
        iframeStyle={true}
      />
    </div>
  )
}

export default SkillList
