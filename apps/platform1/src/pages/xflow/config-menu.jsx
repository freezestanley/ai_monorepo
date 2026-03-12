import { createCtxMenuConfig, MenuItemType } from "@antv/xflow"
import { IconStore, XFlowNodeCommands, XFlowEdgeCommands } from "@antv/xflow"
import { DeleteOutlined, EditOutlined, StopOutlined } from "@ant-design/icons"

export const CustomCommands = {
  CLEAR_GRAPH: {
    id: "xflow:clear-graph",
    label: "清除",
    category: "节点操作"
  },
  EXPORT_GRAPH: {
    id: "xflow:export-graph",
    label: "导出",
    category: "节点操作"
  },
  SHOW_RENAME_MODAL: {
    id: "xflow:rename-node-modal",
    label: "打开重命名弹窗",
    category: "节点操作"
  }
}

export const NsRenameNodeCmd = {
  command: CustomCommands.SHOW_RENAME_MODAL,
  hookKey: "renameNode"
}

IconStore.set("DeleteOutlined", DeleteOutlined)
IconStore.set("EditOutlined", EditOutlined)
IconStore.set("StopOutlined", StopOutlined)

export const NsMenuItemConfig = {
  DELETE_EDGE: {
    id: XFlowEdgeCommands.DEL_EDGE.id,
    label: "删除边",
    iconName: "DeleteOutlined",
    onClick: async ({ target, commandService }) => {
      commandService.executeCommand(XFlowEdgeCommands.DEL_EDGE.id, {
        edgeConfig: target.data
      })
    }
  },

  DELETE_NODE: {
    id: XFlowNodeCommands.DEL_NODE.id,
    label: "删除节点",
    iconName: "DeleteOutlined",
    onClick: async ({ target, commandService }) => {
      commandService.executeCommand(XFlowNodeCommands.DEL_NODE.id, {
        nodeConfig: { id: target.data.id }
      })
    }
  },

  EMPTY_MENU: {
    id: "EMPTY_MENU_ITEM",
    label: "暂无可用",
    isEnabled: false,
    iconName: "DeleteOutlined"
  },

  SEPARATOR: {
    id: "separator",
    type: MenuItemType.Separator
  }
}

export const useMenuConfig = createCtxMenuConfig((config) => {
  config.setMenuModelService(async (target, model, modelService, toDispose) => {
    const { type, cell } = target
    // console.log(type)
    switch (type) {
      case "node":
        model.setValue({
          id: "root",
          type: MenuItemType.Root,
          submenu: [NsMenuItemConfig.DELETE_NODE]
        })
        break
      case "edge":
        model.setValue({
          id: "root",
          type: MenuItemType.Root,
          submenu: [NsMenuItemConfig.DELETE_EDGE]
        })
        break
      case "blank":
        model.setValue({
          id: "root",
          type: MenuItemType.Root,
          submenu: [NsMenuItemConfig.EMPTY_MENU]
        })
        break
      default:
        model.setValue({
          id: "root",
          type: MenuItemType.Root,
          submenu: [NsMenuItemConfig.EMPTY_MENU]
        })
        break
    }
  })
})
