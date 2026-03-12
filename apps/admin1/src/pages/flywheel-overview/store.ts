import { create } from "zustand"
import { persist } from "zustand/middleware"
import { produce } from "immer"
import dayjs from "dayjs"
// ==================== 类型定义 ====================

export type TaskType = "general" | "loss" | ""

export interface SelectOption {
  value: string
  label: string
  purposeCode: number
}

export interface Stage {
  primaryId: number
  name: string
  description: string
  step: number
  isAdd?: boolean
}

export interface Category {
  primaryId: number
  secondeId: number
  name: string
  createTime: string
  description: string
}

export interface StageConfig {
  primaryId: number
  name: string
  step: number
  categories: Category[]
}

export interface AgentConfig {
  taskId?: number
  name?: string
  sceneCode: string
  description: string
  content: string
}

export interface TaskConfig {
  stageConfigs: StageConfig[]
  agentConfigs: AgentConfig[]
}

export interface DataSourceConfig {
  value: string // 当前选中的值
  options: SelectOption[] // 可选列表
}

export interface ScenarioConfig {
  name: string
  description: string
  execMode: number // 数据处理策略
  cron: string // 数据处理策略-准实时模式的时间
  time: string // 数据处理策略-离线批量执行时间
  subTaskConfig: {
    //启用分析任务
    taskId: string
    execEnabled: number
  }[]
  stageRecognitionConfig: { stageRecognition: number; customSkillId: string } // 阶段(挂机节点)识别方式
  taskReviewConfig: { reviewEnable: boolean; cumulativeValue: number; reviewCycleValue: number } // 自动复盘触发条件

  aiData: DataSourceConfig
  humanData: DataSourceConfig
  knowledgeBase: DataSourceConfig

  stages: Stage[]
  tasks: {
    general: TaskConfig
    loss: TaskConfig
  }
}

// ==================== Store 定义 ====================

interface ScenarioConfigState {
  currentConfig: ScenarioConfig | null
  // 完整状态
  setConfig: (config: ScenarioConfig) => void
  resetConfig: () => void // 重置为初始值
  // 场景名称\场景描述
  updateName: (name: string) => void
  updateDescription: (description: string) => void
  // 数据处理策略
  updateExecMode: (execMode: number) => void
  updateTime: (time: string) => void
  // 启用分析任务
  updateWholeSubTaskConfig: (subTaskConfig: { taskId: string; execEnabled: number }[]) => void
  updateSubTaskConfig: (taskId: string, execEnabled: number) => void
  // 阶段识别配置
  updateStageRecognitionConfig: (stageRecognitionConfig: {
    stageRecognition: number
    customSkillId: string
  }) => void
  // 自动复盘触发条件
  updateTaskReviewConfig: (taskReviewConfig: {
    reviewEnable: boolean
    cumulativeValue: number
    reviewCycleValue: number
  }) => void
  updateReviewSwitch: (reviewEnable: boolean) => void
  updateCumulativeValue: (cumulativeValue: number) => void
  updateReviewCycleValue: (reviewCycleValue: number) => void
  // 更新数据源select
  updateDataSource: (type: string, value: string) => void
  updateDataSourceOptions: (type: string, options: SelectOption[]) => void
  // 阶段定义
  updateWholeStages: (stages: Stage[]) => void
  addStage: () => void
  updateStage: (primaryId: number, updates: Partial<Stage>) => void
  deleteStage: (primaryId: number) => void
  moveStage: (primaryId: number, direction: "left" | "right") => void
  // 分析维度看板
  updateWholeStageConfigs: (taskType: TaskType, stageConfigs: StageConfig[]) => void
  addCategory: (taskType: TaskType, primaryId: number) => void
  updateCategory: (
    taskType: TaskType,
    primaryId: number,
    secondeId: string,
    updates: Partial<Category>
  ) => void
  deleteCategory: (taskType: TaskType, primaryId: number, secondeId: number) => void
  // Agent 提示词配置
  updataClusteringAgentConfigs: (taskType: TaskType, agentConfigs: AgentConfig) => void // 初始化loss或general全部prompt
  updatePrompt: (taskType: TaskType, sceneCode: string, prompt: string) => void //更新prompt
}

// ==================== Store 实现 ====================

export const useScenarioConfigStore = create<ScenarioConfigState>()(
  persist(
    (set) => ({
      currentConfig: {
        name: "",
        description: "",
        execMode: 2,
        cron: "0 0/5 * * * ?", // 固定值，5min/次
        time: "02:00",
        subTaskConfig: [],
        stageRecognitionConfig: { stageRecognition: 0, customSkillId: "" },
        taskReviewConfig: { reviewEnable: true, cumulativeValue: 500, reviewCycleValue: 30 },

        aiData: { value: "", options: [] },
        humanData: { value: "", options: [] },
        knowledgeBase: { value: "", options: [] },
        stages: [],
        tasks: {
          general: { stageConfigs: [], agentConfigs: [] },
          loss: { stageConfigs: [], agentConfigs: [] }
        }
      },

      setConfig: (config) => {
        set({ currentConfig: config })
      },

      resetConfig: () => {
        set({
          currentConfig: {
            name: "",
            description: "",
            execMode: 2,
            cron: "0 0/5 * * * ?",
            time: "02:00",
            subTaskConfig: [],
            stageRecognitionConfig: { stageRecognition: 0, customSkillId: "" },
            taskReviewConfig: { reviewEnable: true, cumulativeValue: 500, reviewCycleValue: 30 },
            aiData: { value: "", options: [] },
            humanData: { value: "", options: [] },
            knowledgeBase: { value: "", options: [] },
            stages: [],
            tasks: {
              general: { stageConfigs: [], agentConfigs: [] },
              loss: { stageConfigs: [], agentConfigs: [] }
            }
          }
        })
      },

      updateName: (name) => {
        set((state) => {
          if (!state.currentConfig) return state
          return {
            currentConfig: {
              ...state.currentConfig,
              name
            }
          }
        })
      },

      updateDescription: (description) => {
        set((state) => {
          if (!state.currentConfig) return state
          return {
            currentConfig: {
              ...state.currentConfig,
              description
            }
          }
        })
      },

      // 更新数据处理策略
      updateExecMode: (execMode) => {
        set((state) => {
          if (!state.currentConfig) return state
          return {
            currentConfig: {
              ...state.currentConfig,
              execMode
            }
          }
        })
      },

      updateTime: (time) => {
        set((state) => {
          if (!state.currentConfig) return state
          return {
            currentConfig: {
              ...state.currentConfig,
              time
            }
          }
        })
      },

      // 更新整个启用分析任务配置
      updateWholeSubTaskConfig: (subTaskConfig) => {
        set((state) => {
          if (!state.currentConfig) return state
          return {
            currentConfig: {
              ...state.currentConfig,
              subTaskConfig
            }
          }
        })
      },

      // 更新单个子任务的启用状态
      updateSubTaskConfig: (taskId, execEnabled) => {
        set(
          produce((state) => {
            if (!state.currentConfig || !taskId) return

            const taskConfig = state.currentConfig.subTaskConfig?.find(
              (config) => config.taskId === taskId
            )

            if (taskConfig) {
              taskConfig.execEnabled = execEnabled
            }
          })
        )
      },

      // 更新阶段识别方式、配置
      updateStageRecognitionConfig: (stageRecognitionConfig) => {
        set((state) => {
          if (!state.currentConfig) return state
          return {
            currentConfig: {
              ...state.currentConfig,
              stageRecognitionConfig: stageRecognitionConfig
            }
          }
        })
      },

      updateTaskReviewConfig: (taskReviewConfig) => {
        set((state) => {
          if (!state.currentConfig) return state
          return {
            currentConfig: {
              ...state.currentConfig,
              taskReviewConfig
            }
          }
        })
      },

      // 更新自动复盘触发条件-开关
      updateReviewSwitch: (reviewEnable) => {
        set((state) => {
          if (!state.currentConfig) return state
          return {
            currentConfig: {
              ...state.currentConfig,
              taskReviewConfig: {
                ...state.currentConfig.taskReviewConfig,
                reviewEnable
              }
            }
          }
        })
      },

      // 更新自动复盘触发条件-积累量
      updateCumulativeValue: (cumulativeValue) => {
        set((state) => {
          if (!state.currentConfig) return state
          return {
            currentConfig: {
              ...state.currentConfig,
              taskReviewConfig: {
                ...state.currentConfig.taskReviewConfig,
                cumulativeValue
              }
            }
          }
        })
      },

      // 更新自动复盘触发条件-周期
      updateReviewCycleValue: (reviewCycleValue) => {
        set((state) => {
          if (!state.currentConfig) return state
          return {
            currentConfig: {
              ...state.currentConfig,
              taskReviewConfig: {
                ...state.currentConfig.taskReviewConfig,
                reviewCycleValue
              }
            }
          }
        })
      },

      updateDataSource: (type: "aiData" | "humanData" | "knowledgeBase", value: string) => {
        set((state) => {
          if (!state.currentConfig) return state
          return {
            currentConfig: {
              ...state.currentConfig,
              [type]: {
                ...state.currentConfig[type],
                value
              }
            }
          }
        })
      },

      updateDataSourceOptions: (
        type: "aiData" | "humanData" | "knowledgeBase",
        options: SelectOption[]
      ) => {
        set((state) => {
          if (!state.currentConfig) return state
          return {
            currentConfig: {
              ...state.currentConfig,
              [type]: {
                ...state.currentConfig[type],
                options
              }
            }
          }
        })
      },

      // 更新整个stages
      updateWholeStages: (stages) => {
        set((state) => {
          if (!state.currentConfig) return state
          return {
            currentConfig: {
              ...state.currentConfig,
              stages
            }
          }
        })
      },

      // 添加阶段
      addStage: () => {
        set(
          produce((state) => {
            if (!state.currentConfig) return state
            const stages = state.currentConfig.stages
            const newPrimaryId = Date.now() // 生成一次，共用同一个 ID
            const newStage: Stage = {
              primaryId: newPrimaryId,
              name: "",
              description: "",
              step: state.currentConfig.stages.length + 1,
              isAdd: true
            }
            stages.push(newStage)
            // 处理二级分类
            const lossStageConfigs = state.currentConfig.tasks.loss.stageConfigs
            const generalStageConfigs = state.currentConfig.tasks.general.stageConfigs
            const newStageConfig = {
              primaryId: newPrimaryId, // 使用同一个 ID
              name: "",
              step: state.currentConfig.stages.length + 1,
              categories: []
            }
            lossStageConfigs?.push(newStageConfig)
            generalStageConfigs?.push(newStageConfig)
          })
        )
      },

      updateStage: (primaryId, updates) => {
        set(
          produce((state) => {
            if (state.currentConfig) {
              const stage = state.currentConfig.stages.find((s) => s.primaryId === primaryId)
              if (stage) {
                Object.assign(stage, updates)
              }
            }
          })
        )
      },
      // 删除阶段
      deleteStage: (primaryId) => {
        set(
          produce((state) => {
            if (!state.currentConfig) return

            state.currentConfig.stages = state.currentConfig.stages.filter(
              (stage) => stage.primaryId !== primaryId
            )
            // 删除后重新排序
            state.currentConfig.stages.forEach((stage, index) => {
              stage.step = index + 1
            })

            // 同步删除两个任务类型的 stageConfigs
            state.currentConfig.tasks.general.stageConfigs =
              state.currentConfig.tasks.general.stageConfigs.filter(
                (sc) => sc.primaryId !== primaryId
              )

            state.currentConfig.tasks.loss.stageConfigs =
              state.currentConfig.tasks.loss.stageConfigs.filter((sc) => sc.primaryId !== primaryId)
          })
        )
      },

      // 移动+重排序
      moveStage: (primaryId, direction) => {
        set((state) => {
          if (!state.currentConfig) return

          const stages = [...state.currentConfig.stages]
          const index = stages.findIndex((s) => s.primaryId === primaryId)

          if (index === -1) return

          const targetIndex = direction === "left" ? index - 1 : index + 1

          if (targetIndex < 0 || targetIndex >= stages.length) {
            return
          }
          // 交换位置
          ;[stages[index], stages[targetIndex]] = [stages[targetIndex], stages[index]]
          // 重排序
          const reorderedStages = stages.map((s, i) => ({ ...s, step: i + 1 }))

          return {
            currentConfig: {
              ...state.currentConfig,
              stages: reorderedStages
            }
          }
        })
      },

      // 更新整个stageConfigs
      updateWholeStageConfigs: (taskType: TaskType, stageConfigs: StageConfig[]) => {
        set(
          produce((state) => {
            if (!state.currentConfig) return
            state.currentConfig.tasks[taskType].stageConfigs = stageConfigs
          })
        )
      },

      // 添加分类
      addCategory: (taskType, primaryId) => {
        set(
          produce((state) => {
            if (!state.currentConfig) return

            const stageConfig = state.currentConfig.tasks[taskType].stageConfigs.find(
              (sc) => sc.primaryId === primaryId
            )

            if (stageConfig) {
              const newCategory = {
                primaryId, // 一级分类ID
                secondeId: Date.now(), // 二级分类ID
                name: "", // 分类名称
                createTime: dayjs().format("YYYY-MM-DD HH:mm:ss"), // 创建时间
                description: ""
              }
              stageConfig.categories.push(newCategory)
            }
          })
        )
      },
      // 修改分类名称或描述
      updateCategory: (taskType, primaryId, secondeId, updates) => {
        set(
          produce((state) => {
            if (!state.currentConfig) return

            const stageConfig = state.currentConfig.tasks[taskType].stageConfigs.find(
              (sc) => sc.primaryId === primaryId
            )
            if (stageConfig) {
              const category = stageConfig.categories.find((c) => c.secondeId === secondeId)
              if (category) {
                Object.assign(category, updates)
              }
            }
          })
        )
      },
      // 删除分类
      deleteCategory: (taskType, primaryId, secondeId) => {
        set(
          produce((state) => {
            if (!state.currentConfig) return

            const stageConfig = state.currentConfig.tasks[taskType].stageConfigs.find(
              (sc) => sc.primaryId === primaryId
            )
            if (stageConfig) {
              stageConfig.categories = stageConfig.categories.filter(
                (c) => c.secondeId !== secondeId
              )
            }
          })
        )
      },
      // 初始化某子任务的全部提示词
      updataClusteringAgentConfigs: (taskType, agentConfigs) => {
        set(
          produce((state) => {
            if (state.currentConfig) {
              state.currentConfig.tasks[taskType].agentConfigs = agentConfigs
            }
          })
        )
      },

      // 更新提示词内容
      updatePrompt: (taskType, sceneCode, prompt) => {
        set(
          produce((state) => {
            if (state.currentConfig) {
              const target = state.currentConfig.tasks[taskType].agentConfigs.find(
                (item) => item.sceneCode === sceneCode
              )
              if (target) {
                Object.assign(target, {
                  content: prompt
                })
              }
            }
          })
        )
      }
    }),
    {
      name: "scenario-config-storage"
    }
  )
)

// ====================  Hooks ====================

export const useScenarioConfig = () => {
  return useScenarioConfigStore((state) => state.currentConfig)
}

export const useScenarioName = () => {
  return useScenarioConfigStore((state) => state.currentConfig?.name)
}

export const useScenarioDescription = () => {
  return useScenarioConfigStore((state) => state.currentConfig?.description)
}

export const useScenarioExecModel = () => {
  return useScenarioConfigStore((state) => state.currentConfig?.execMode)
}

export const useScenarioTime = () => {
  return useScenarioConfigStore((state) => state.currentConfig?.time)
}

export const useSubTaskConfig = () => {
  return useScenarioConfigStore((state) => state.currentConfig?.subTaskConfig)
}

export const useStageRecognitionConfig = () => {
  return useScenarioConfigStore((state) => state.currentConfig?.stageRecognitionConfig)
}

export const useTaskReviewConfig = () => {
  return useScenarioConfigStore((state) => state.currentConfig?.taskReviewConfig)
}

export const useScenarioStages = () => {
  return useScenarioConfigStore((state) => state.currentConfig?.stages || [])
}

export const useTaskConfig = (taskType: TaskType) => {
  return useScenarioConfigStore((state) => state.currentConfig?.tasks[taskType])
}

export const useDataSources = () => {
  return useScenarioConfigStore((state) => ({
    aiData: state.currentConfig?.aiData,
    humanData: state.currentConfig?.humanData,
    knowledgeBase: state.currentConfig?.knowledgeBase
  }))
}
