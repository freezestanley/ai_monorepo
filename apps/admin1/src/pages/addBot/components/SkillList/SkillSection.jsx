import { Fragment, useMemo } from "react"
import { Row } from "antd"
import { keys } from "lodash"
import SkillItem from "./SkillItem"
import SkillTable from "./SkillListItem"
import "../SkillList.scss"

const SkillSection = ({
  tabValue,
  skills,
  groupList,
  currentBotNo,
  viewMode = "grid",
  ...props
}) => {
  if (skills.length === 0) return null

  // 直接使用传入的已筛选工作流列表，按分组组织
  const { skillsOfGroup, skillsOfGroupKeys } = useMemo(() => {
    const grouped = skills.reduce((acc, current) => {
      const cValue = current.groupTagName || "未分组"
      if (!acc[cValue]) {
        acc[cValue] = []
      }
      acc[cValue].push(current)
      return acc
    }, {})

    const originalKeys = keys(grouped)
    const orderedKeys = groupList
      ?.map((item) => {
        if (originalKeys.includes(item.tagDesc)) {
          return item.tagDesc
        }
        return null
      })
      .filter(Boolean)

    if (originalKeys.includes("未分组")) {
      orderedKeys.push("未分组")
    }

    return { skillsOfGroup: grouped, skillsOfGroupKeys: orderedKeys }
  }, [skills, groupList])

  // 列表视图渲染 - 使用 Table 组件
  if (viewMode === "list") {
    // 收集所有符合权限条件的工作流到一个数组中
    const allFilteredSkills = []
    skillsOfGroupKeys.forEach((groupTagName) => {
      if (skillsOfGroup[groupTagName]?.length > 0) {
        skillsOfGroup[groupTagName].forEach((skill) => {
          if (
            (skill?.isCanEditByCurrentUser && !skill?.subscribeSettings) ||
            skill?.subscribeSettings
          ) {
            allFilteredSkills.push(skill)
          }
        })
      }
    })

    return (
      <div>
        <SkillTable skills={allFilteredSkills} {...props} currentBotNo={currentBotNo} />
      </div>
    )
  }

  // 卡片视图渲染（默认）
  return (
    <div>
      {skillsOfGroupKeys.map((groupTagName) => {
        return (
          <Fragment key={groupTagName}>
            <div className="mb-2">
              {skillsOfGroup[groupTagName]?.length > 0 && tabValue === "1" && (
                <div className="tooltip-bar">{groupTagName}</div>
              )}
            </div>

            <Row gutter={20}>
              {skillsOfGroup[groupTagName]?.map((skill, index) =>
                (skill?.isCanEditByCurrentUser && !skill?.subscribeSettings) ||
                skill?.subscribeSettings ? ( // 权限控制,排除订阅工作流
                  <SkillItem
                    key={`${skill.skillNo}-${index}`}
                    {...props}
                    currentBotNo={currentBotNo}
                    skill={skill}
                  />
                ) : (
                  ""
                )
              )}
            </Row>
          </Fragment>
        )
      })}
    </div>
  )
}

export default SkillSection
