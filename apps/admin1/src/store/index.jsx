import { DEBUG_HISTORY_DATA_CONFIG } from "@/constants"
import { create } from "zustand"
import { persist } from "zustand/middleware"

export const useTitle = create(
  persist(
    (set) => ({
      title: "空间管理平台",
      changeTitle: (v) => set(() => ({ title: v }))
    }),
    {
      name: "title-storage"
    }
  )
)

// useCollapsed不需要持久化
// export const useCollapsed = create(
//   (set) => ({
//     collapsed: false,
//     changeCollapsed: (v) => set(() => ({ collapsed: v }))
//   })
// )

export const useCollapsed = create(
  persist(
    (set) => ({
      collapsed: false,
      changeCollapsed: (v) => set(() => ({ collapsed: v }))
    }),
    {
      name: "collapsed-storage"
    }
  )
)

// 需要一个currentSkill, 用来存储当前的工作流,持久存储
// export const useCurrentSkill = create(
//   persist(
//     (set) => ({
//       currentSkill: {},
//       changeCurrentSkill: (v) => set(() => ({ currentSkill: v }))
//     }),
//     {
//       name: "currentSkill-storage"
//     }
//   )
// )

// export const useCurrentSkill = create((set) => ({
//   currentSkill: {},
//   changeCurrentSkill: (v) => set(() => ({ currentSkill: v }))
// }))

/**
 * 当前工作流锁状态
 */
export const useCurrentSkillLockInfo = create(
  persist(
    (set) => ({
      currentSkillLockInfo: {},
      setCurrentSkillInfo: (v) => set(() => ({ currentSkillLockInfo: v }))
    }),
    {
      name: "currentSkillLockInfo-storage"
    }
  )
)

// 需要一个skillFlowData, 用来存储当前的工作流流程图数据,不持久存储
export const useSkillFlowData = create((set) => ({
  skillFlowData: {},
  changeSkillFlowData: (v) => set(() => ({ skillFlowData: v }))
}))

/**
 * 存储当前Agent数据，不持久存储
 */
export const useAgentData = create((set) => ({
  agentData: {},
  changeAgentData: (v) => set(() => ({ agentData: v }))
}))

// 需要一个是否Admin的标识, 用来标识用户身份,不持久存储
export const useIsAdmin = create((set) => ({
  isAdmin: false,
  changeIsAdmin: (v) => set(() => ({ isAdmin: v }))
}))

// 需要一个handleSave, 用来存储当前的工作流流程图数据,持久存储
export const useHandleSave = create(
  persist(
    (set) => ({
      handleSave: {},
      changeHandleSave: (v) => set(() => ({ handleSave: v }))
    }),
    {
      name: "handleSave-storage"
    }
  )
)

// 用户菜单按钮资源列表,去掉持久化
export const useAuthResources = create((set) => ({
  resourceCodeList: [],
  changeResourceCodeList: (v) => set(() => ({ resourceCodeList: v }))
}))
/**
 * @description:用户菜单权限列表
 * @return {*}
 */
export const useMenuResourcesCodes = create(
  persist(
    (set) => ({
      resourceMenuCodes: [],
      setResourceMenuCodes: (v) => {
        let result = []
        const loop = (list = []) => {
          if (!list?.length) return
          list.forEach((v) => {
            if (v?.type === "MENU" && v?.code !== "webPage") result.push(v?.code)
            loop(v.child)
          })
        }
        loop(v)
        set(() => ({ resourceMenuCodes: result }))
      }
    }),
    {
      name: "auth-menu-code"
    }
  )
)

export const useHistoryDebugData = create(
  persist(
    (set, get) => ({
      debugData: {},
      setDebugData: (v) =>
        set(() => {
          const { debugData } = get()
          return { debugData: { ...debugData, ...v } }
        })
    }),
    {
      name: DEBUG_HISTORY_DATA_CONFIG.STORE_KEY
    }
  )
)

// 空间列表，botNo 不传查全量
export const useBotList = create((set) => ({
  botList: [],
  changeBotList: (v) => set(() => ({ botList: v }))
}))

/**
 * @description:当前知识库和目录
 */
export const useCurrentKnowledgeAndCatalog = create((set) => ({
  knowledgeAndCatalog: {},
  changeKnowledgeAndCatalog: (v) => set(() => ({ knowledgeAndCatalog: v }))
}))

export const useComponentAndDebugPanel = create((set, get) => ({
  componentAndDebugPanel: {
    open: false,
    width: 600,
    showDebuggerPanel: false
  },
  changeComponentAndDebugPanel: (v) =>
    set(() => {
      const { componentAndDebugPanel } = get()
      return { componentAndDebugPanel: { ...componentAndDebugPanel, ...v } }
    })
}))

export default {
  useTitle,
  useCollapsed,
  useHistoryDebugData
}
