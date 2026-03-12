import { useEffect, useState, useRef, useCallback } from "react"
import dayjs from "dayjs"
import {
  Drawer,
  Tooltip,
  Select,
  Popconfirm,
  Radio,
  TimePicker,
  Checkbox,
  InputNumber,
  Switch,
  message,
  Modal,
  Form
} from "antd"
import { QuestionCircleOutlined, BulbOutlined } from "@ant-design/icons"
import {
  Layers,
  Plus,
  ChevronRight,
  Cpu,
  X,
  User,
  AlertTriangle,
  Lock,
  ArrowLeft,
  ArrowRight,
  LayoutList,
  Database,
  Send,
  ChartColumn,
  Lightbulb
} from "lucide-react"
import "../index.less"
import {
  useScenarioConfigStore,
  useScenarioConfig,
  useScenarioName,
  useScenarioDescription,
  useScenarioExecModel,
  useScenarioTime,
  useSubTaskConfig,
  useStageRecognitionConfig,
  useTaskReviewConfig,
  useDataSources,
  useScenarioStages,
  useTaskConfig
} from "../store"
import AgentCard from "./AgentCard"
import AgentEditModal from "./AgentEditModal"
import { useSettingDrawerData } from "./useSettingDrawerData"
import { log } from "mermaid/dist/logger"

interface Iprops {
  drawerOpen: boolean
  setDrawerOpen: (open: boolean) => void
  taskId: string
  currentTask: any
  refetchSubtasks?: () => void
  isTaskType9: boolean
}

const SettingDrawer = ({
  drawerOpen,
  setDrawerOpen,
  taskId,
  currentTask, // 当前完整task数据
  refetchSubtasks,
  isTaskType9
}: Iprops) => {
  const thirdPartyId = currentTask?.thirdPartyId
  const selectedTask = currentTask?.id

  // 获取数据
  const { handleSaveAll, lossSubtaskId, generalSubtaskId, currentOption, lxStages } =
    useSettingDrawerData(taskId, thirdPartyId)

  const isLeftLocked = selectedTask === generalSubtaskId
  const isRightLocked = selectedTask === lossSubtaskId

  const [activeTaskTab, setActiveTaskTab] = useState<"loss" | "general">("loss")
  const [editingAgent, setEditingAgent] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form] = Form.useForm() // Form 实例

  // 初始选择哪个tab
  useEffect(() => {
    if (isLeftLocked) setActiveTaskTab("general")
    if (isRightLocked) setActiveTaskTab("loss")
  }, [isLeftLocked, isRightLocked])

  // 状态管理
  const config = useScenarioConfig() // 完整数据
  // console.log("config-----", config)
  const scenarioName = useScenarioName()
  const scenarioDescription = useScenarioDescription()
  const scenarioExecModel = useScenarioExecModel()
  const scenarioTime = useScenarioTime()
  const scenarioSubTaskConfig = useSubTaskConfig()
  const scenarioStageRecognitionConfig = useStageRecognitionConfig()
  const scenarioTaskReviewConfig = useTaskReviewConfig()
  const dataSources = useDataSources() // 数据源配置相关
  const stages = useScenarioStages() // 业务流水线阶段定义
  const { stageRecognition, customSkillId } = scenarioStageRecognitionConfig || {}
  const { reviewEnable, cumulativeValue, reviewCycleValue } = scenarioTaskReviewConfig || {}
  const { aiData, humanData, knowledgeBase } = dataSources || {}

  // 初始化 Form 值（从 store 同步）
  useEffect(() => {
    if (scenarioSubTaskConfig) {
      form.setFieldsValue({
        enabledTasks: [
          scenarioSubTaskConfig[0]?.execEnabled === 1 ? "loss" : null,
          scenarioSubTaskConfig[1]?.execEnabled === 1 ? "general" : null
        ].filter(Boolean)
      })
    }
  }, [scenarioSubTaskConfig, form])

  // 分析维度看板
  const { stageConfigs: lossStages, agentConfigs: lossAgents } = useTaskConfig("loss") || {}
  const { stageConfigs: generalStages, agentConfigs: genaralAgents } =
    useTaskConfig("general") || {}
  const stageConfigs = activeTaskTab === "loss" ? lossStages : generalStages
  const agentConfigs = activeTaskTab === "loss" ? lossAgents : genaralAgents

  const stagesScrollRef = useRef(null)

  // 获取状态管理的更新方法
  const {
    updateName,
    updateDescription,
    updateExecMode,
    updateTime,
    updateStageRecognitionConfig,
    updateSubTaskConfig,
    updateReviewSwitch,
    updateCumulativeValue,
    updateReviewCycleValue,
    updateDataSource,
    updateWholeStages,
    updateWholeStageConfigs,
    addStage,
    deleteStage,
    updateStage,
    moveStage,
    addCategory,
    updateCategory,
    deleteCategory,
    updatePrompt,
    resetConfig
  } = useScenarioConfigStore()

  //  监听 stages 变化，自动滚动到最右侧
  useEffect(() => {
    if (stagesScrollRef.current && stages?.length > 0) {
      // 使用 setTimeout 确保 DOM 更新完成后再滚动
      setTimeout(() => {
        stagesScrollRef.current?.scrollTo({
          left: stagesScrollRef.current.scrollWidth,
          behavior: "smooth"
        })
      }, 100)
    }
  }, [stages?.length])

  // 处理场景名称保存
  const handleNameBlur = (e) => {
    const newName = e.target.value.trim()
    if (newName && newName !== scenarioName) {
      updateName(newName)
    }
  }

  // 处理场景描述保存
  const handleDescriptionBlur = (e) => {
    const newDesc = e.target.value.trim()
    if (newDesc !== scenarioDescription) {
      updateDescription(newDesc)
    }
  }

  // 处理阶段定义更新
  const handleStageNameBlur = (primaryId, name) => {
    updateStage(primaryId, { name })
  }
  const handleStageDesBlur = (primaryId, description) => {
    updateStage(primaryId, { description })
  }

  // 处理分类更新
  const handleCategoryNameBlur = (taskType, primaryId, secondeId, name) => {
    updateCategory(taskType, primaryId, secondeId, { name })
  }
  const handleCategoryDesBlur = (taskType, primaryId, secondeId, description) => {
    updateCategory(taskType, primaryId, secondeId, { description })
  }

  // 关闭drawer回调
  const handleClose = () => {
    setDrawerOpen(false)
    resetConfig()
  }

  // 切换radio至关联自定义工作流时覆盖灵犀阶段到自定义工作流阶段
  const coverStages = useCallback(() => {
    const stageConfigs = lxStages.map((stage, index) => ({
      primaryId: stage.primaryId,
      name: stage.name,
      step: stage.step,
      categories: [
        {
          primaryId: stage.primaryId, // 一级分类ID
          secondeId: Number(`${Date.now()}${index}`), // 二级分类ID
          name: "其他", // 分类名称
          createTime: dayjs().format("YYYY-MM-DD HH:mm:ss"), // 创建时间
          description: "未明确或者未知的流失原因"
        }
      ]
    }))
    updateWholeStageConfigs("loss", stageConfigs)
    updateWholeStageConfigs("general", stageConfigs)

    if (lxStages.length > 0) {
      updateWholeStages(lxStages) // 更新至状态管理
    }
  }, [lxStages])

  const churnAnalysisTooltip = (
    <div className="max-w-xs text-slate-700 p-2 space-y-2">
      <div className="flex items-center gap-1">
        <ChartColumn className="text-purple-400 w-4 h-4"></ChartColumn>
        <div className="text-purple-400 text-[16px] font-bold mb-1">AI 如何工作?</div>
      </div>
      <div className="text-black ! text-sm">
        模型会深入理解用户挂机前的最后几轮对话，自动归纳出
        <div className="inline" style={{ color: "#000000", fontWeight: "bold" }}>
          "嫌贵"、"不需要"、"已购买"
        </div>
        等具体的拒绝原因。
      </div>

      <div className="flex items-start bg-gray-50 rounded p-2 gap-2 border border-gray-200/20">
        <div className="text-xs space-x-2">
          <div className="font-medium inline">💡 价值：帮您优化话术逻辑，提升留存率。</div>
        </div>
      </div>
    </div>
  )

  const commonIssueTooltip = (
    <div className="max-w-xs text-slate-700 p-2 space-y-2">
      <div className="flex items-center gap-1">
        <ChartColumn className="text-purple-400 w-4 h-4"></ChartColumn>
        <div className="text-purple-400 text-[16px] font-bold mb-1">AI 如何工作?</div>
      </div>
      <div className="text-black ! text-sm">
        对全量会话中的用户提问进行
        <div className="inline" style={{ color: "#000000", fontWeight: "bold" }}>
          无监督聚类，
        </div>
        发现用户最关注的高频问题（Top N）。
      </div>

      <div className="flex items-start bg-gray-50 rounded p-2 gap-2 border border-gray-200/20">
        <div className="text-xs space-x-2">
          <div className="font-medium inline">💡 价值：适用于新业务上线初期，快速摸排用户痛点</div>
        </div>
      </div>
    </div>
  )

  const aiSmartTooltip = (
    <div className="max-w-xs text-slate-700 p-2 space-y-2">
      <div className="flex items-center gap-1">
        <div className="text-purple-400 text-[16px] font-bold mb-1">AI 智能判断</div>
      </div>
      <div className="text-black ! text-sm">
        AI 根据对话上下文语义，自动推断用户处于哪个业务阶段。
      </div>
    </div>
  )

  const customSkillTooltip = (
    <div className="max-w-xs text-slate-700 p-2 space-y-2">
      <div className="flex items-center gap-1">
        <div className="text-purple-400 text-[16px] font-bold mb-1">关联自定义工作流</div>
      </div>
      <div className="text-black ! text-sm">
        优先使用配置的意图工作流结果。若未触发则回退至 AI 判断。
      </div>
    </div>
  )

  return (
    <Drawer
      rootClassName={"settingDrawer"}
      maskClosable={false}
      open={drawerOpen}
      push={false}
      mask={false}
      onClose={handleClose}
      destroyOnClose
    >
      <div className="h-full w-full p-4">
        <div className="fixed top-0 z-10 text-gray-300 inset-x-0 bg-white border-b border-t-0 border-l-0 border-r-0 border-gray-200 p-2">
          <ArrowLeft onClick={handleClose} className="w-6 h-6 cursor-pointer " />
        </div>
        <div className={`w-full pb-24 pt-4`}>
          {/* 全局设置 */}
          <section className="space-y-4 mt-8">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-800">场景基础配置</h3>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
              {/* Row 1: Basics (Name) & Data Sources */}
              <div className="grid grid-cols-2 gap-8 py-4 pb-0 border-b border-t-0 border-l-0 border-r-0 border-gray-200">
                {/* Description - Large Area */}
                <div className="flex flex-col flex-1 min-h-0 space-y-4 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[18px] font-bold uppercase">业务背景</span>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      场景名称
                    </label>
                    <input
                      type="text"
                      defaultValue={scenarioName}
                      key={scenarioName}
                      onBlur={handleNameBlur}
                      className="pl-2 w-full text-md h-10 font-bold text-gray-800 rounded-lg border border-gray-100 focus:border-purple-500 focus:outline-none bg-gray-50 transition-colors shadow-inner"
                    />
                  </div>
                  <div className="flex flex-col  h-[200px]">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      场景业务背景
                    </label>
                    <textarea
                      defaultValue={scenarioDescription}
                      key={scenarioDescription}
                      onBlur={handleDescriptionBlur}
                      className="flex-1 w-full text-sm text-gray-600 border border-gray-200 rounded-xl p-2 focus:border-purple-500 focus:outline-none bg-gray-50 resize-none leading-relaxed shadow-inner"
                      placeholder="请详细描述该场景的业务目标、适用人群以及关键成功要素..."
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 mb-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                      关联数据源
                    </label>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(222px,1fr))] gap-3">
                      <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg p-3 hover:border-purple-200 transition-colors max-w-[222px]">
                        <div className="bg-blue-100 p-1.5 rounded text-blue-600">
                          <Database className="w-3 h-3" />
                        </div>
                        <div className="flex-1">
                          <div className="text-[12px] text-gray-400 font-bold uppercase mb-1">
                            AI 会话源
                          </div>
                          <div className="my-select">
                            <Select
                              // allowClear
                              options={aiData?.options}
                              value={aiData?.value}
                              onChange={(e) => {
                                updateDataSource("aiData", e)
                              }}
                            ></Select>
                          </div>
                        </div>
                      </div>
                      {!isTaskType9 && (
                        <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg p-3 hover:border-purple-200 transition-colors">
                          <div className="bg-purple-100 p-1.5 rounded text-purple-600">
                            <User className="w-3 h-3" />
                          </div>
                          <div className="flex-1">
                            <div className="text-[12px] text-gray-400 font-bold uppercase mb-1">
                              人工标杆源
                            </div>
                            <div className="my-select">
                              <Select
                                allowClear
                                onClear={() => {
                                  updateDataSource("humanData", undefined)
                                }}
                                options={humanData?.options}
                                value={humanData?.value}
                                onChange={(e) => {
                                  updateDataSource("humanData", e)
                                }}
                              ></Select>
                            </div>
                          </div>
                        </div>
                      )}
                      {!isTaskType9 && (
                        <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg p-3 hover:border-purple-200 transition-colors">
                          <div className="bg-green-100 p-1.5 rounded text-green-600">
                            <Layers className="w-3 h-3" />
                          </div>
                          <div className="flex-1">
                            <div className="text-[12px] text-gray-400 font-bold uppercase mb-1">
                              关联知识库
                            </div>
                            <div className="my-select">
                              <Select
                                allowClear
                                onClear={() => {
                                  updateDataSource("knowledgeBase", undefined)
                                }}
                                options={knowledgeBase?.options}
                                value={knowledgeBase?.value}
                                onChange={(e) => {
                                  updateDataSource("knowledgeBase", e)
                                }}
                              ></Select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="px-8 bg-[#fdfdfe]  border-l border-t-0 border-b-0 border-r-0 border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[18px] font-bold uppercase">任务配置</span>
                  </div>
                  {/* 数据处理策略 */}
                  <div className="flex flex-col pb-4 border-b border-t-0 border-l-0 border-r-0 border-gray-200">
                    <div className="text-[16px] font-semibold text-gray-800 mb-3">数据处理策略</div>
                    <Radio.Group
                      value={scenarioExecModel}
                      onChange={(e) => {
                        updateExecMode(e.target.value)
                      }}
                      className="w-full space-y-2"
                    >
                      {/* 准实时模式 */}
                      <Radio value={2} className="w-full">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-semibold">准实时模式</span>
                          <Tooltip
                            title={
                              <div className="inline text-black">
                                定期（每5分钟）主动拉取数据，在每个会话结束后立即开始AI聚类与打标分析。
                              </div>
                            }
                            color={"#fff"}
                          >
                            <QuestionCircleOutlined className="text-gray-400 cursor-pointer" />
                          </Tooltip>
                          <span className="text-[12px] px-2 rounded-[10px] text-green-500 bg-[#ecfdf5] border border-[#d8fbe9] ">
                            5min/批次
                          </span>
                        </div>
                      </Radio>

                      {/* 离线批量 */}
                      <div className="flex items-center space-x-1">
                        <Radio value={1}>
                          <div className="flex items-center gap-3">
                            <span className="text-[14px] font-semibold">离线批量</span>
                            <Tooltip
                              title={
                                <div className="inline text-black">
                                  "每日凌晨低峰期统一对前日数据进行批量分析。"
                                </div>
                              }
                              color={"#fff"}
                            >
                              <QuestionCircleOutlined className="text-gray-400 cursor-pointer" />
                            </Tooltip>
                          </div>
                        </Radio>
                        <div className="text-[14px] text-gray-400 space-x-1">
                          <span>T+1日</span>
                          <div className="inline">
                            <TimePicker
                              needConfirm={false}
                              key={scenarioTime} // 添加 key，当 scenarioTime 变化时强制重新挂载
                              format="HH:mm"
                              size="small"
                              defaultValue={dayjs(scenarioTime ? scenarioTime : "02:00", "HH:mm")}
                              onChange={(time) => {
                                if (time) {
                                  const formattedTime = time.format("HH:mm")
                                  updateTime(formattedTime)
                                } else {
                                  updateTime("")
                                }
                              }}
                              disabledTime={() => ({
                                // 禁用小时：只允许 1-5 点
                                disabledHours: () => {
                                  return [
                                    0, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
                                    22, 23
                                  ]
                                },
                                disabledMinutes: (selectedHour) => {
                                  if (selectedHour === 5) {
                                    // 5点时，禁用 1-59 分钟，只允许 00 分
                                    return Array.from({ length: 59 }, (_, i) => i + 1)
                                  }
                                  return []
                                }
                              })}
                              hideDisabledOptions
                              showNow={false}
                            />
                          </div>
                          <span>执行</span>
                        </div>
                      </div>
                    </Radio.Group>
                  </div>
                  {/* 启用分析任务 */}
                  {!isTaskType9 && (
                    <div className="flex flex-col pt-4 border-b border-t-0 border-l-0 border-r-0 border-gray-200">
                      <div className="flex items-center mb-3 space-x-1">
                        <span className="text-[16px] font-semibold text-gray-800 ">
                          启用分析任务
                        </span>
                        <Tooltip
                          title={
                            <div className="inline text-black">
                              数据飞轮仅对启用后的任务内容进行分析
                            </div>
                          }
                          color={"#fff"}
                        >
                          <QuestionCircleOutlined className="text-gray-400 cursor-pointer" />
                        </Tooltip>
                      </div>

                      <Form form={form} layout="vertical">
                        <Form.Item
                          name="enabledTasks"
                          rules={[
                            {
                              validator: (_, value) => {
                                if (!value || value.length === 0) {
                                  return Promise.reject("至少需要启用一个分析任务")
                                }
                                return Promise.resolve()
                              }
                            }
                          ]}
                        >
                          <Checkbox.Group className="space-x-2">
                            <Checkbox
                              disabled={!lossSubtaskId}
                              value="loss"
                              onChange={(e) => {
                                const newEnabled = e.target.checked ? 1 : 2
                                // 同步到 store
                                updateSubTaskConfig(lossSubtaskId, newEnabled)
                                // 触发表单校验
                                form.validateFields(["enabledTasks"])
                              }}
                            >
                              <div className="flex items-center gap-1">
                                <span>流失原因分析</span>
                                <Tooltip title={churnAnalysisTooltip} color={"#fff"}>
                                  <QuestionCircleOutlined className="text-gray-400 cursor-pointer text-xs hover:text-gray-600" />
                                </Tooltip>
                              </div>
                            </Checkbox>
                            <Checkbox
                              disabled={!generalSubtaskId}
                              value="general"
                              onChange={(e) => {
                                const newEnabled = e.target.checked ? 1 : 2
                                // 同步到 store
                                updateSubTaskConfig(generalSubtaskId, newEnabled)
                                // 触发表单校验
                                form.validateFields(["enabledTasks"])
                              }}
                            >
                              <div className="flex items-center gap-1">
                                <span>通用问题分析</span>
                                <Tooltip title={commonIssueTooltip} color={"#fff"}>
                                  <QuestionCircleOutlined className="text-gray-400 cursor-pointer text-xs hover:text-gray-600" />
                                </Tooltip>
                              </div>
                            </Checkbox>
                          </Checkbox.Group>
                        </Form.Item>
                      </Form>
                    </div>
                  )}
                  {/* 阶段挂机节点识别方式 */}
                  {!isTaskType9 && (
                    <div className="flex flex-col py-4 border-b border-t-0 border-l-0 border-r-0 border-gray-200">
                      <div className="text-[16px] font-semibold text-gray-800 mb-3">
                        阶段(挂机节点)识别方式
                      </div>
                      <Radio.Group
                        value={stageRecognition}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === 1) {
                            setIsModalOpen(true) // 触发强提醒
                          } else {
                            updateStageRecognitionConfig({
                              stageRecognition: 2,
                              customSkillId: currentOption?.[0]?.value
                            })
                            coverStages()
                          }
                        }}
                        className="w-full space-y-2"
                      >
                        {/* AI智能判断 */}
                        <Radio value={1} className="w-full">
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] font-semibold">AI智能判断</span>
                            <Tooltip title={aiSmartTooltip} color={"#fff"}>
                              <QuestionCircleOutlined className="text-gray-400 cursor-pointer text-xs hover:text-gray-600" />
                            </Tooltip>
                            <span className="text-[12px] px-2 rounded-[10px] text-gray-400 bg-[rgb(241 245 249)] border border-gray-100 ">
                              默认托管
                            </span>
                          </div>
                        </Radio>

                        {/* 关联自定义工作流 */}
                        <div>
                          <Radio value={2} disabled={!currentOption?.[0]?.label}>
                            <div className="flex items-center gap-3">
                              <span className="text-[14px] font-semibold">关联自定义工作流</span>
                              <Tooltip title={customSkillTooltip} color={"#fff"}>
                                <QuestionCircleOutlined className="text-gray-400 cursor-pointer text-xs hover:text-gray-600" />
                              </Tooltip>
                            </div>
                          </Radio>
                          <div className="inline">
                            {/* <Select
                            className="w-[200px]"
                            options={currentOption}
                            value={currentOption?.[0]?.value}
                            // onChange={(value) => {}}
                          /> */}
                            <span className="text-[14px] text-[#7c3aed] font-bold">
                              {currentOption?.[0]?.label}
                            </span>
                          </div>
                        </div>
                      </Radio.Group>
                    </div>
                  )}
                  {/* 自动复盘开关 */}
                  <div className="flex flex-col py-4 ">
                    <div className="mb-3 space-x-1">
                      <span className="text-[16px] font-semibold text-gray-800">自动复盘开关</span>
                      <Tooltip
                        title={
                          <div className="inline text-black">
                            打开自动复盘后，当累积的“其他”类型案例数量满足以下任一阈值时，AI将触发一次全局性的聚类分析复盘，从而保证能够及时适配业务变化。
                          </div>
                        }
                        color={"#fff"}
                      >
                        <QuestionCircleOutlined className="text-gray-400 cursor-pointer" />
                      </Tooltip>
                    </div>
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={reviewEnable}
                        onChange={(checked) => {
                          updateReviewSwitch(checked)
                        }}
                      />
                      <InputNumber
                        value={cumulativeValue}
                        className="w-[180px] text-[#7c3aed] font-bold"
                        addonBefore={
                          <div className="flex items-center justify-center">{"积累量 >"}</div>
                        }
                        suffix={<div className="text-gray-400">{"条"}</div>}
                        min={50}
                        max={1000}
                        onChange={(value) => {
                          updateCumulativeValue(value)
                        }}
                      />
                      <span className="text-[14px] font-semibold text-gray-300">OR</span>
                      <InputNumber
                        value={reviewCycleValue}
                        className="w-[150px] text-[#7c3aed] font-bold"
                        addonBefore={
                          <div className="flex items-center justify-center ">周期 {">"}</div>
                        }
                        suffix={<div className="text-gray-400">{"天"}</div>}
                        min={1}
                        max={90}
                        onChange={(value) => {
                          updateReviewCycleValue(value)
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* <Divider /> */}

              <div className="flex justify-between items-center mb-">
                <div className="flex flex-col">
                  <label className=" text-[14px] font-bold  uppercase tracking-wider flex items-center gap-2">
                    业务阶段定义
                  </label>
                  <p className="text-[12px] text-gray-400 mt-1">
                    定义业务流转的标准阶段，此处修改将同步更新下方所有分析看板结构。
                  </p>
                </div>
                {isLeftLocked || isRightLocked ? (
                  <Popconfirm
                    title={`此操作会影响${isLeftLocked ? "流失原因分析任务" : "通用问题分析任务"}`}
                    description="是否继续？"
                    onConfirm={addStage}
                    onCancel={() => {}}
                    okText="确认"
                    cancelText="取消"
                  >
                    <button className="text-xs text-white bg-gray-900 px-3 py-1.5 rounded-lg font-bold hover:bg-black flex items-center gap-1 shadow-sm transition-transform hover:scale-105">
                      <Plus className="w-3 h-3" />
                      添加新阶段
                    </button>
                  </Popconfirm>
                ) : (
                  <button
                    onClick={addStage}
                    className="text-xs text-white bg-gray-900 px-3 py-1.5 rounded-lg font-bold hover:bg-black flex items-center gap-1 shadow-sm transition-transform hover:scale-105"
                  >
                    <Plus className="w-3 h-3" />
                    添加新阶段
                  </button>
                )}
              </div>

              <div
                ref={stagesScrollRef}
                className="flex items-start overflow-x-auto pb-4 custom-scrollbar gap-4"
              >
                {stages?.map((stage, index) => (
                  <div key={stage.primaryId} className="flex space-x-4">
                    <div className="flex-shrink-0 w-[280px] group relative">
                      {/* Stage Card */}
                      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-purple-300 transition-all">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                            序号: {index + 1}
                          </span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => moveStage(stage.primaryId, "left")}
                              disabled={index === 0}
                              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-purple-600 disabled:opacity-20"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => moveStage(stage.primaryId, "right")}
                              disabled={index === stages?.length - 1}
                              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-purple-600 disabled:opacity-20"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => deleteStage(stage.primaryId)}
                              className="p-1 rounded hover:bg-rose-50 text-gray-300 hover:text-rose-500 ml-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="space-y-3">
                          <div>
                            <label className="text-[12px] text-gray-400 font-bold block mb-1">
                              阶段名称
                            </label>
                            <input
                              defaultValue={stage.name}
                              key={stage.name}
                              onBlur={(e) => handleStageNameBlur(stage.primaryId, e.target.value)}
                              placeholder="请输入阶段名称"
                              className="w-full text-sm font-bold text-gray-800 border-b border-t-0 border-l-0 border-r-0 border-gray-100 focus:border-purple-500 focus:outline-none pb-1 bg-transparent"
                            />
                          </div>
                          <div>
                            <label className="text-[12px] text-gray-400 font-bold block mb-1">
                              标准
                            </label>
                            <textarea
                              defaultValue={stage.description}
                              key={stage.description}
                              onBlur={(e) => handleStageDesBlur(stage.primaryId, e.target.value)}
                              rows={3}
                              className="w-full text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg p-2 focus:border-purple-500 focus:outline-none resize-none leading-relaxed"
                              placeholder="定义该阶段的起始与结束标准..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Connector */}
                    {index < config.stages.length - 1 && (
                      <div className="flex-shrink-0 pt-[70px] text-gray-300">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Add Placeholder */}
                <div className="flex-shrink-0 pt-[75px] text-gray-200">
                  <div className="w-4 h-0.5 bg-gray-200"></div>
                </div>
                {isLeftLocked || isRightLocked ? (
                  <Popconfirm
                    title={`此操作会影响${isLeftLocked ? "流失原因分析任务" : "通用问题分析任务"}`}
                    description="是否继续？"
                    onConfirm={addStage}
                    onCancel={() => {}}
                    okText="确认"
                    cancelText="取消"
                  >
                    <button className="flex-shrink-0 w-12 h-12 mt-[52px] rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-purple-500 hover:text-purple-500 transition-all bg-gray-50">
                      <Plus className="w-5 h-5" />
                    </button>
                  </Popconfirm>
                ) : (
                  <button
                    onClick={addStage}
                    className="flex-shrink-0 w-12 h-12 mt-[52px] rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-purple-500 hover:text-purple-500 transition-all bg-gray-50"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </section>
          {/* 任务配置 */}
          <section className="space-y-2 mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-800">业务配置</h3>
              </div>
              {(isLeftLocked || isRightLocked) && !isTaskType9 && (
                <div className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-200 flex items-center gap-2">
                  <Lock className="w-3 h-3" />
                  当前视图已锁定，仅可配置选定任务
                </div>
              )}
            </div>

            {/* Full Width Tab Navigation */}
            {!isTaskType9 && (
              <div className="grid grid-cols-2 bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
                <button
                  onClick={() => !isLeftLocked && setActiveTaskTab("loss")}
                  className={`py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    activeTaskTab === "loss"
                      ? "bg-rose-50 text-rose-600 ring-1 ring-rose-100"
                      : isLeftLocked
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  流失原因分析任务
                </button>
                <button
                  onClick={() => !isRightLocked && setActiveTaskTab("general")}
                  className={`py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    activeTaskTab === "general"
                      ? "bg-blue-50 text-blue-600 ring-1 ring-blue-100"
                      : isRightLocked
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Cpu className="w-4 h-4" />
                  通用问题分析任务
                </button>
              </div>
            )}

            {/* 2.1 stages */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <LayoutList className="w-4 h-4 text-gray-600" />
                  分类定义 ({activeTaskTab === "loss" ? "流失分类" : "通用分类"})
                </h3>
                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                  定义系统在每个阶段应该识别哪些具体内容
                </span>
              </div>

              <div className="p-6 overflow-x-auto bg-gray-50/50">
                <div className="flex gap-6 min-w-max">
                  {stages?.map((stage) => {
                    // 顺序按照stages里的顺序
                    const stageConfig = stageConfigs?.find((sc) => sc.primaryId === stage.primaryId)
                    const { primaryId, categories } = stageConfig || {}
                    return (
                      <div
                        key={primaryId}
                        className="w-[300px] flex-shrink-0 flex flex-col bg-gray-100/50 rounded-xl border border-gray-200"
                      >
                        {/* Column Header */}
                        <div className="p-3 border-b border-t-0 border-l-0 border-r-0 border-gray-200 bg-white rounded-t-xl flex justify-between items-center">
                          <span
                            key={stage.name}
                            className="text-xs font-bold text-gray-800 truncate"
                          >
                            {stage.name}
                          </span>
                          <span className="text-[10px] bg-gray-100 border border-gray-200 px-1.5 rounded text-gray-500 font-mono">
                            {categories?.length}
                          </span>
                        </div>

                        {/* Column Body */}
                        <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar max-h-[450px] min-h-[150px]">
                          {categories?.map(({ secondeId, name, description }) => (
                            <div
                              key={secondeId}
                              className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:border-purple-300 hover:shadow-md transition-all  group relative"
                            >
                              <div className="flex justify-between items-start mb-2">
                                {/* <div className="text-sm font-bold text-gray-800">{name}</div> */}
                                <input
                                  defaultValue={name}
                                  key={name}
                                  onBlur={(e) => {
                                    handleCategoryNameBlur(
                                      activeTaskTab,
                                      primaryId,
                                      secondeId,
                                      e.target.value
                                    )
                                  }}
                                  placeholder="请输入分类名称"
                                  className="w-full text-sm font-bold text-gray-800 border-b border-t-0 border-l-0 border-r-0 border-gray-100 focus:border-purple-500 focus:outline-none pb-1 bg-transparent"
                                />
                                <button
                                  onClick={() =>
                                    deleteCategory(activeTaskTab, primaryId, secondeId)
                                  }
                                  className="text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Description Input */}
                              <div className="mb-2">
                                <textarea
                                  defaultValue={description}
                                  key={description}
                                  onBlur={(e) => {
                                    handleCategoryDesBlur(
                                      activeTaskTab,
                                      primaryId,
                                      secondeId,
                                      e.target.value
                                    )
                                  }}
                                  rows={2}
                                  className="w-full text-[12px] text-gray-500 bg-gray-50 border border-transparent focus:bg-white focus:border-purple-200 rounded p-1.5 resize-none focus:outline-none leading-tight"
                                  placeholder="定义该分类的判别标准..."
                                />
                              </div>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              if (activeTaskTab && primaryId) {
                                addCategory(activeTaskTab, primaryId)
                              } else {
                                console.log(
                                  "activeTaskTab || primaryId is missing,activeTaskTab:",
                                  activeTaskTab,
                                  "primaryId:",
                                  primaryId
                                )
                              }
                            }}
                            className="w-full py-2.5 border border-dashed border-gray-300 rounded-lg text-xs text-gray-400 font-bold hover:bg-white hover:border-purple-400 hover:text-purple-500 transition-colors flex items-center justify-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            添加分类
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* 2.2 agent  */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-600" />
                  Agent 配置 ({activeTaskTab === "loss" ? "流失原因分析" : "通用问题分析"})
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white">
                <AgentCard
                  title={agentConfigs?.[0]?.name}
                  description={agentConfigs?.[0]?.description}
                  prompt={agentConfigs?.[0]?.content}
                  color={activeTaskTab === "loss" ? "rose" : "blue"}
                  lastEdited="2025-11-12"
                  onExpand={() =>
                    setEditingAgent({
                      type: "clustering",
                      title: "聚类分析 Agent",
                      sceneCode: agentConfigs?.[0]?.sceneCode,
                      prompt: agentConfigs?.[0]?.content
                    })
                  }
                  // onHistory={() => setViewingHistory({ id: "clustering", title: "聚类分析 Agent" })}
                />
                {activeTaskTab === "loss" && (
                  <AgentCard
                    title={agentConfigs?.[1]?.name}
                    description={agentConfigs?.[1]?.description}
                    prompt={agentConfigs?.[1]?.content}
                    color={activeTaskTab === "loss" ? "rose" : "blue"}
                    lastEdited="2025-11-12"
                    onExpand={() =>
                      setEditingAgent({
                        type: "tagging",
                        title: "会话打标 Agent",
                        sceneCode: agentConfigs?.[1]?.sceneCode,
                        prompt: agentConfigs?.[1]?.content
                      })
                    }
                    // onHistory={() => setViewingHistory({ id: "tagging", title: "会话打标 Agent" })}
                  />
                )}
              </div>
            </div>
          </section>
        </div>

        {/* FIXED ACTION BAR */}
        <div
          className={`fixed bottom-0 inset-x-0 bg-white border-t border-b-0 border-l-0 border-r-0 border-gray-200 p-4 shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.05)] flex justify-between items-center rounded-lg`}
        >
          <div className="mx-auto w-full flex justify-between items-center px-6">
            <div className="text-xs text-gray-400 flex items-center gap-2">
              {/* {isSaving ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" /> 正在保存...
                </>
              ) : (
                <>
                  <CheckCircle className="w-3 h-3 text-green-500" /> 所有更改已暂存
                </>
              )} */}
            </div>
            <div className="flex gap-4">
              {/* <button
                // onClick={() => handleAction("draft")}
                className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                暂存草稿
              </button> */}
              <button
                onClick={async () => {
                  try {
                    // 校验表单
                    await form.validateFields()
                    // 校验通过后保存
                    await handleSaveAll()
                    setDrawerOpen(false)
                    resetConfig()
                    refetchSubtasks()
                  } catch (error) {
                    // 校验失败，滚动到错误位置
                    const element = document.querySelector(".ant-drawer-body")
                    if (element) {
                      element.scrollTo({ top: 0, behavior: "smooth" })
                    }
                  }
                }}
                className="px-8 py-2.5 bg-gray-900 text-white font-bold rounded-lg shadow-lg hover:bg-black hover:scale-105 transition-all flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                发布配置
              </button>
            </div>
          </div>
        </div>
        {/* --- MODALS  --- */}
        {editingAgent && (
          <AgentEditModal
            title={editingAgent?.title}
            prompt={editingAgent?.prompt}
            onClose={() => setEditingAgent(null)}
            onSave={(value) => {
              updatePrompt(activeTaskTab, editingAgent?.sceneCode, value)
              // 关闭modal
              setEditingAgent(null)
            }}
            onOpenHistory={() => {}}
          />
        )}
        {/* {viewingHistory && (
          <AgentHistoryModal title={viewingHistory.title} onClose={() => setViewingHistory(null)} />
        )} */}
      </div>
      <Modal
        title="冷启动重置"
        closable={false}
        open={isModalOpen}
        onOk={() => {
          setIsModalOpen(false)
          updateStageRecognitionConfig({ stageRecognition: 1, customSkillId: "" })
        }}
        onCancel={() => setIsModalOpen(false)}
      >
        {`当挂机节点配置从“关联自定义工作流”切换回“AI智能判断”时，视为模型需重新学习，需重新累积 ${cumulativeValue}
        条数据才产出结果`}
      </Modal>
    </Drawer>
  )
}

export default SettingDrawer
