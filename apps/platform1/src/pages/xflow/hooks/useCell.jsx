import { useSkillFlowData } from "@/store"

export const useCell = (id) => {
  const skillFlowData = useSkillFlowData((state) => state.skillFlowData)
  const skillComponentDefinitionsArr = skillFlowData?.skillComponentDefinitions
  const flowNodeDefinitionsArr = skillFlowData?.flowDefinition?.flowNodeDefinitions

  const componentNo = skillComponentDefinitionsArr?.find((v) => v.nodeId === id)?.componentNo

  const nodeNo = flowNodeDefinitionsArr?.find((v) => v.nodeId === id)?.nodeNo

  return {
    componentNo,
    nodeNo
  }
}
