import { useFetchLatestDefinition, useFetchSkillInfo } from "@/api/skill"
import { useSkillFlowData } from "@/store"
import queryString from "query-string"
import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"

export const useChangeSkillFlowData = () => {
  const changeSkillFlowData = useSkillFlowData((state) => state.changeSkillFlowData) //改变画布数据函数

  const location = useLocation()
  const { search } = location
  const { skillNo, botNo } = queryString.parse(search)
  const { data: currentSkillProcessData } = useFetchLatestDefinition(skillNo, botNo) // 获取画布相关数据
  const { data: currentSkillInfo } = useFetchSkillInfo(skillNo)

  useEffect(() => {
    changeSkillFlowData(currentSkillProcessData)
  }, [currentSkillProcessData])

  return {
    currentSkillProcessData,
    changeSkillFlowData,
    currentSkillInfo
  }
}
