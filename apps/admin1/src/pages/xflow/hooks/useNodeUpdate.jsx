// hooks/useNodeUpdate.js

import { XFlowNodeCommands } from "@antv/xflow"
import useSaveFlow from "./useSaveFlow"
import { useSkillFlow } from "./useSkillFlow"

export const useNodeUpdate = (commandService, appData) => {
  const { skillFlowData, handleSave, isLoading } = useSkillFlow()
  const { save } = useSaveFlow(handleSave, skillFlowData, appData)

  const updateNodeComp = (node, callback = (arg) => {}, noMessage = false) => {
    console.log(node, callback, noMessage)
    save({}, callback, noMessage)
    return commandService.executeCommand(XFlowNodeCommands.UPDATE_NODE.id, {
      nodeConfig: node
    })
  }

  return { updateNodeComp, skillFlowData, isLoading }
}
