import { startTransition } from "react"
import {
  createToolbarConfig,
  uuidv4,
  XFlowGroupCommands,
  XFlowNodeCommands,
  XFlowGraphCommands,
  IconStore,
  MODELS
} from "@antv/xflow"
import {
  UngroupOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  GroupOutlined,
  GatewayOutlined,
  UndoOutlined,
  RedoOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignBottomOutlined,
  CopyOutlined,
  SnippetsOutlined
} from "@ant-design/icons"

import { createIcon } from "@/components/Icon"

const GROUP_NODE_RENDER_ID = "GROUP_NODE_RENDER_ID"

export const BACK_NODE = XFlowNodeCommands.BACK_NODE.id
export const FRONT_NODE = XFlowNodeCommands.FRONT_NODE.id
export const SAVE_GRAPH_DATA = XFlowGraphCommands.SAVE_GRAPH_DATA.id
export const REDO_CMD = `${XFlowGraphCommands.REDO_CMD.id}`
export const UNDO_CMD = `${XFlowGraphCommands.UNDO_CMD.id}`
export const MULTI_SELECT = `${XFlowGraphCommands.GRAPH_TOGGLE_MULTI_SELECT.id}`
export const ADD_GROUP = `${XFlowGroupCommands.ADD_GROUP.id}`
export const DEL_GROUP = `${XFlowGroupCommands.DEL_GROUP.id}`
export const COPY = `${XFlowGraphCommands.GRAPH_COPY.id}`
export const PASTE = `${XFlowGraphCommands.GRAPH_PASTE.id}`

export const getDependencies = async (modelService) => {
  return [
    await MODELS.SELECTED_NODES.getModel(modelService),
    await MODELS.GRAPH_ENABLE_MULTI_SELECT.getModel(modelService)
  ]
}

/** toolbar依赖的状态 */
export const getToolbarState = async (modelService) => {
  // isMultiSelectionActive
  const { isEnable: isMultiSelectionActive } =
    await MODELS.GRAPH_ENABLE_MULTI_SELECT.useValue(modelService)
  // isGroupSelected
  const isGroupSelected = await MODELS.IS_GROUP_SELECTED.useValue(modelService)
  // isNormalNodesSelected: node不能是GroupNode
  const isNormalNodesSelected = await MODELS.IS_NORMAL_NODES_SELECTED.useValue(modelService)
  // undo redo
  const isUndoable = await MODELS.COMMAND_UNDOABLE.useValue(modelService)
  const isRedoable = await MODELS.COMMAND_REDOABLE.useValue(modelService)

  return {
    isUndoable,
    isRedoable,
    isNodeSelected: isNormalNodesSelected,
    isGroupSelected,
    isMultiSelectionActive
  }
}

export const getToolbarItems = async (state) => {
  const toolbarGroup = []
  // const history = getGraphHistory()

  // // /** 撤销 */
  // toolbarGroup.push({
  //   tooltip: "撤销",
  //   iconName: "UndoOutlined",
  //   id: UNDO_CMD,
  //   isEnabled: history.canUndo(),
  //   onClick: async () => {
  //     history.undo()
  //   }
  // })

  // /** 重做 */
  // toolbarGroup.push({
  //   tooltip: "重做",
  //   iconName: "RedoOutlined",
  //   id: REDO_CMD,
  //   isEnabled: history.canRedo(),
  //   onClick: async () => {
  //     history.redo()
  //   }
  // })

  // toolbarGroup.push({
  //   tooltip: "后退",
  //   iconName: "ArrowLeftOutlined",
  //   id: "BACK",
  //   onClick: async ({ commandService, modelService }) => {
  //     // 路由后退
  //     startTransition(() => {
  //       window.history.back()
  //     })
  //   }
  // })

  /** FRONT_NODE */
  toolbarGroup.push({
    tooltip: "置前",
    iconName: "VerticalAlignTopOutlined",
    id: FRONT_NODE,
    isEnabled: state.isNodeSelected,
    onClick: async ({ commandService, modelService }) => {
      const node = await MODELS.SELECTED_NODE.useValue(modelService)
      commandService.executeCommand(FRONT_NODE, {
        nodeId: node?.id
      })
    }
  })

  /** BACK_NODE */
  toolbarGroup.push({
    tooltip: "置后",
    iconName: "VerticalAlignBottomOutlined",
    id: BACK_NODE,
    isEnabled: state.isNodeSelected,
    onClick: async ({ commandService, modelService }) => {
      const node = await MODELS.SELECTED_NODE.useValue(modelService)
      commandService.executeCommand(BACK_NODE, {
        nodeId: node?.id
      })
    }
  })

  /** 开启框选 */
  toolbarGroup.push({
    tooltip: "开启框选",
    iconName: "GatewayOutlined",
    id: MULTI_SELECT,
    active: state.isMultiSelectionActive,
    onClick: async ({ commandService }) => {
      commandService.executeCommand(MULTI_SELECT, {})
    }
  })

  /** 新建群组 */
  toolbarGroup.push({
    tooltip: "新建群组",
    iconName: "GroupOutlined",
    id: ADD_GROUP,
    isEnabled: state.isNodeSelected,
    onClick: async ({ commandService, modelService }) => {
      const cells = await MODELS.SELECTED_CELLS.useValue(modelService)
      const groupChildren = cells.map((cell) => cell.id)
      commandService.executeCommand(ADD_GROUP, {
        nodeConfig: {
          id: uuidv4(),
          renderKey: GROUP_NODE_RENDER_ID,
          groupChildren,
          groupCollapsedSize: { width: 200, height: 40 },
          label: "新建群组"
        }
      })
    }
  })

  /** 解散群组 */
  toolbarGroup.push({
    tooltip: "解散群组",
    iconName: "UngroupOutlined",
    id: DEL_GROUP,
    isEnabled: state.isGroupSelected,
    onClick: async ({ commandService, modelService }) => {
      const cell = await MODELS.SELECTED_NODE.useValue(modelService)
      const nodeConfig = cell.getData()
      commandService.executeCommand(XFlowGroupCommands.DEL_GROUP.id, {
        nodeConfig: nodeConfig
      })
    }
  })

  // /** 保存数据 */
  // toolbarGroup.push({
  //   tooltip: "保存",
  //   iconName: "SaveOutlined",
  //   id: SAVE_GRAPH_DATA,
  //   onClick: async ({ commandService }) => {
  //     commandService.executeCommand(SAVE_GRAPH_DATA, {
  //       saveGraphDataService: (meta, graphData) => {
  //         console.log(graphData)
  //         localStorage.setItem("graphData", JSON.stringify(graphData))
  //         return null
  //       }
  //     })
  //   }
  // })
  return [
    {
      name: "graphData",
      items: toolbarGroup
    }
  ]
}

// 创建一个新的图标组件
const NewIcon1 = createIcon("icon-a-2") // 前置
const NewIcon2 = createIcon("icon-a-10") // 置后
const NewIcon3 = createIcon("icon-a-6") // 选框
const NewIcon4 = createIcon("icon-a-3") // 新建群组
const NewIcon5 = createIcon("icon-a-8") // 解散群组
/** 注册icon 类型 */
const registerIcon = () => {
  IconStore.set("SaveOutlined", SaveOutlined)
  IconStore.set("ArrowLeftOutlined", ArrowLeftOutlined)
  IconStore.set("UndoOutlined", UndoOutlined)
  IconStore.set("RedoOutlined", RedoOutlined)

  IconStore.set("VerticalAlignTopOutlined", NewIcon1) //IconfontTemplate("icon-cebian-shujuguanli")  VerticalAlignTopOutlined
  IconStore.set("VerticalAlignBottomOutlined", NewIcon2) //VerticalAlignBottomOutlined
  IconStore.set("GatewayOutlined", NewIcon3) //GatewayOutlined
  IconStore.set("GroupOutlined", NewIcon4) // GroupOutlined
  IconStore.set("UngroupOutlined", NewIcon5) //UngroupOutlined
  IconStore.set("CopyOutlined", CopyOutlined)
  IconStore.set("SnippetsOutlined", SnippetsOutlined)
}

export const useToolbarConfig = createToolbarConfig((toolbarConfig) => {
  registerIcon()
  /** 生产 toolbar item */
  toolbarConfig.setToolbarModelService(async (toolbarModel, modelService, toDispose) => {
    const updateToolbarModel = async () => {
      const state = await getToolbarState(modelService)
      const toolbarItems = await getToolbarItems(state)

      toolbarModel.setValue((toolbar) => {
        toolbar.mainGroups = toolbarItems
      })
    }
    const models = await getDependencies(modelService)
    const subscriptions = models.map((model) => {
      return model.watch(async () => {
        updateToolbarModel()
      })
    })
    toDispose.pushAll(subscriptions)
  })
})
