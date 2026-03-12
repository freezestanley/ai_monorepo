/*
 * @Author: Dyton
 * @Date: 2023-10-16 14:52:58
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2023-10-23 19:06:55
 * @FilePath: /za-aigc-platform-admin-static/src/pages/xflow/config-cmd.jsx
 * Copyright (c) 2023 by ZA-智能中台, All Rights Reserved.
 */
import { createCmdConfig, DisposableCollection, uuidv4 } from "@antv/xflow"
import { MODELS } from "@antv/xflow"

export const useCmdConfig = createCmdConfig((config) => {
  config.setRegisterHookFn((hooks) => {
    const list = [
      hooks.moveNode.registerHook({
        name: "set node config",
        handler: async (args) => {
          console.log("moveNode", args)
        }
      }),

      hooks.addNode.registerHook({
        name: "set node config",
        handler: async (args) => {
          args.nodeConfig = {
            ...args.nodeConfig,
            id: args.nodeConfig.id || `node-${uuidv4()}`
          }
        }
      }),

      hooks.delNode.registerHook({
        name: "set edge config2",
        handler: async (args) => {
          console.log(args)
        }
      }),

      hooks.delEdge.registerHook({
        name: "set edge config3",
        handler: async (args) => {
          MODELS.GRAPH_META.useValue(args.modelService).then((meta) => {
            const { saveStatic } = meta
            saveStatic()
          })
          // alert("123")
        }
      }),

      hooks.addEdge.registerHook({
        name: "set edge config",
        handler: async (args) => {
          console.log(args)
          // args.edgeConfig = {
          //   ...args.edgeConfig,
          //   attrs: {
          //     line: {
          //       ...args.edgeConfig.attrs.line,
          //       strokeWidth: 2,
          //       strokeDasharray: [0, 0]
          //     }
          //   }
          // }
        }
      }),

      hooks.graphOptions.registerHook({
        name: "set graph config",
        handler: async (args) => {}
      })
    ]
    const toDispose = new DisposableCollection()
    toDispose.pushAll(list)
    return toDispose
  })
})
