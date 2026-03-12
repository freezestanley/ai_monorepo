import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { message } from "antd"
import { useSearchParams } from "react-router-dom"
import dayjs from "dayjs"
import queryString from "query-string"
import {
  useScenarioInfoApi,
  useDataSourceSelectApi,
  useDataSourceApi,
  useStageApi,
  useSubtasksApi,
  useCategoryApi,
  usePromptApi,
  useSaveAllSettingsApi
} from "@/api/flywheel"
import { useFetchSkillListByPage } from "@/api/skill"
import { getFunnelConfigDetail } from "@/api/voiceAgent/api"
import { useScenarioConfigStore, useStageRecognitionConfig } from "../store"

export const useSettingDrawerData = (taskId, thirdPartyId) => {
  // console.log("useSettingDrawerData", "taskId", taskId, "thirdPartyId", thirdPartyId)
  const [lossSubtaskId, setLossSubtaskId] = useState()
  const [generalSubtaskId, setGeneralSubtaskId] = useState()
  const [currentOption, setCurrentOption] = useState([])
  const [lxStages, setLxStages] = useState([]) // 灵犀里配置的阶段

  const [searchParams] = useSearchParams()
  const botNo = searchParams.get("botNo")
  const taskType = searchParams.get("taskType")
  const isTaskType9 = taskType === "9"

  const {
    currentConfig,
    // 场景信息
    updateName,
    updateDescription,
    updateExecMode,
    updateTime,
    updateStageRecognitionConfig,
    updateTaskReviewConfig,
    updateWholeSubTaskConfig,
    // 数据源
    updateDataSource,
    updateDataSourceOptions,
    // 阶段
    updateWholeStages,
    // 分类
    updateWholeStageConfigs,
    // prompt
    updataClusteringAgentConfigs
  } = useScenarioConfigStore()
  const stageRecognitionConfig = useStageRecognitionConfig()
  const { customSkillId } = stageRecognitionConfig || {}

  /*
   *  获取场景名称、场景描述等(taskSave)
   */
  const { data: scenarioData } = useScenarioInfoApi(taskId)
  useEffect(() => {
    const { name, businessBackground, execMode, time, stageRecognitionConfig, taskReviewConfig } =
      scenarioData?.value || {}
    const { stageRecognition = 1, customSkillId } = stageRecognitionConfig || {}
    const {
      reviewEnable = true,
      cumulativeValue = 500,
      reviewCycleValue = 30
    } = taskReviewConfig || {}
    // 只有当值存在时才更新，避免 undefined 覆盖 初始值
    if (name !== undefined) updateName(name)
    if (businessBackground !== undefined) updateDescription(businessBackground)
    if (execMode !== undefined) updateExecMode(execMode)
    if (!!time) updateTime(time)
    if (stageRecognitionConfig !== undefined) {
      updateStageRecognitionConfig({ stageRecognition, customSkillId })
    }
    if (taskReviewConfig !== undefined) {
      updateTaskReviewConfig({ reviewEnable, cumulativeValue, reviewCycleValue })
    }
  }, [
    scenarioData,
    updateName,
    updateDescription,
    updateExecMode,
    updateTime,
    updateStageRecognitionConfig,
    updateTaskReviewConfig
  ])

  /*
   *  获取下拉框数据源列表
   */
  const { data: dataSourceSelectData } = useDataSourceSelectApi({ taskId })
  // 数据处理与缓存
  const { aiSelectData, humanSelectData, knowledgeSelectData } = useMemo(() => {
    const allSelectData = (dataSourceSelectData?.value || []).map((item) => ({
      value: item.dataSourceId,
      label: item.dataSourceName,
      purposeCode: item.purposeCode
    }))

    const aiSelectData = allSelectData.filter((item) => ![2, 3].includes(item.purposeCode))
    const humanSelectData = allSelectData.filter((item) => item.purposeCode === 2)
    const knowledgeSelectData = allSelectData.filter((item) => item.purposeCode === 3)
    return { aiSelectData, humanSelectData, knowledgeSelectData }
  }, [dataSourceSelectData])
  // 同步至状态管理
  useEffect(() => {
    if (aiSelectData) updateDataSourceOptions("aiData", aiSelectData)
    if (humanSelectData) updateDataSourceOptions("humanData", humanSelectData)
    if (knowledgeSelectData) updateDataSourceOptions("knowledgeBase", knowledgeSelectData)
  }, [aiSelectData, humanSelectData, knowledgeSelectData, updateDataSourceOptions])

  /*
   *  获取下拉框回显数据
   */
  const { data: dataSourceData } = useDataSourceApi({ taskId })
  // console.log("dataSourceData---", dataSourceData)
  // 数据处理与缓存
  const { aiSelectValue, humanSelectValue, knowledgeSelectValue } = useMemo(() => {
    const allValues = dataSourceData?.value || []
    const aiSelectValue = allValues.find((item) => ![2, 3].includes(item.purposeCode))?.dataSourceId
    const humanSelectValue = allValues.find((item) => item.purposeCode === 2)?.dataSourceId
    const knowledgeSelectValue = allValues.find((item) => item.purposeCode === 3)?.dataSourceId

    return { aiSelectValue, humanSelectValue, knowledgeSelectValue }
  }, [dataSourceData])
  // 同步至状态管理
  useEffect(() => {
    updateDataSource("aiData", aiSelectValue)
    updateDataSource("humanData", humanSelectValue)
    updateDataSource("knowledgeBase", knowledgeSelectValue)
  }, [dataSourceData, aiSelectValue, humanSelectValue, knowledgeSelectValue, updateDataSource])

  /*
   *  获取阶段
   */
  const { data: stageData } = useStageApi({ taskId })
  // console.log("stageData---", stageData)
  // 同步至状态管理
  useEffect(() => {
    const stages = stageData?.value
    if (stages && stages.length > 0) {
      updateWholeStages(stages)
      // 处理阶段的分类数据
      const stageConfigs = stages.map((stage, index) => ({
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
    }
  }, [stageData, updateWholeStages])

  /*
   *  获取子任务信息
   */
  const { data: subtasksData } = useSubtasksApi({ taskId })
  // console.log("subtasksData---", subtasksData)
  // 同步至状态管理
  useEffect(() => {
    if (isTaskType9) {
      // 风险雷达特殊逻辑，taskId就作为子任务id,且只有一个任务
      setLossSubtaskId(taskId)
    } else {
      const subtasks = subtasksData?.value || []
      const leftTaskId = subtasks.find((item) => item.taskType === 7)?.id
      const leftEnabled = subtasks.find((item) => item.taskType === 7)?.execEnabled // 1 开；2 关
      const rightTaskId = subtasks.find((item) => item.taskType === 6)?.id
      const rightEnabled = subtasks.find((item) => item.taskType === 6)?.execEnabled
      if (leftTaskId) setLossSubtaskId(leftTaskId)
      if (rightTaskId) setGeneralSubtaskId(rightTaskId)
      if (leftTaskId && rightTaskId) {
        updateWholeSubTaskConfig([
          { taskId: leftTaskId, execEnabled: leftEnabled || 1 }, // 默认勾上
          { taskId: rightTaskId, execEnabled: rightEnabled || 1 } // 默认勾上
        ])
      }
    }
  }, [
    isTaskType9,
    taskId,
    subtasksData,
    setLossSubtaskId,
    setGeneralSubtaskId,
    updateWholeSubTaskConfig
  ])

  /*
   *  获取左侧tab的分类
   */
  const { data: leftCategoryData } = useCategoryApi({ subTaskId: lossSubtaskId })
  const leftCategories = useMemo(() => {
    const { primaryCategory, secondeCategory } = leftCategoryData?.value || {}
    // 将对应primaryId的二级分类数据聚合到一级分类下
    const processedPrimary =
      primaryCategory?.map((item, index) => {
        const primaryId = item?.primaryId
        const categories = secondeCategory.filter((item) => item.primaryId === primaryId)

        // 是否已有“其他”二级分类，没有的话则添加
        const hasOther = categories.some((item) => item.name === "其他")
        if (!hasOther) {
          categories.push({
            name: "其他",
            description: "未明确或者未知的流失原因",
            primaryId: item?.primaryId,
            secondeId: Number(`${Date.now()}${index}`),
            createTime: dayjs().format("YYYY-MM-DD HH:mm:ss")
          })
        }

        return {
          ...item,
          categories
        }
      }) || []
    // console.log("processedPrimary-left", processedPrimary)
    return processedPrimary
  }, [leftCategoryData])
  // 同步至状态管理
  useEffect(() => {
    if (leftCategories.length > 0) updateWholeStageConfigs("loss", leftCategories)
  }, [leftCategories, updateWholeStageConfigs])

  /*
   *  获取右侧tab的分类
   */
  const { data: rightCategoryData } = useCategoryApi({ subTaskId: generalSubtaskId })
  const rightCategories = useMemo(() => {
    const { primaryCategory, secondeCategory } = rightCategoryData?.value || {}
    // 将对应primaryId的二级分类数据聚合到一级分类下
    const processedPrimary =
      primaryCategory?.map((item, index) => {
        const primaryId = item?.primaryId
        const categories = secondeCategory.filter((item) => item.primaryId === primaryId)

        // 是否已有“其他”二级分类，没有的话则添加
        const hasOther = categories.some((item) => item.name === "其他")

        if (!hasOther) {
          categories.push({
            name: "其他",
            description: "未明确或者未知的流失原因",
            primaryId: item?.primaryId,
            secondeId: Number(`${Date.now()}${index}`),
            createTime: dayjs().format("YYYY-MM-DD HH:mm:ss")
          })
        }
        return {
          ...item,
          categories
        }
      }) || []

    // console.log("processedPrimary-right", processedPrimary)
    return processedPrimary
  }, [rightCategoryData])
  // 同步至状态管理
  useEffect(() => {
    if (rightCategories.length > 0) updateWholeStageConfigs("general", rightCategories)
  }, [rightCategories, updateWholeStageConfigs])

  /*
   *  获取左侧tab的prompt
   */
  const { data: leftPromptData } = usePromptApi({ subTaskId: lossSubtaskId })
  // console.log("leftPromptData---", leftPromptData)
  // 计算与缓存
  const lossAgentConfigs = useMemo(() => {
    const promptList = leftPromptData?.value || []
    return promptList
  }, [leftPromptData])
  // 同步至状态管理
  useEffect(() => {
    updataClusteringAgentConfigs("loss", lossAgentConfigs)
  }, [lossAgentConfigs, updataClusteringAgentConfigs])

  /*
   *  获取右侧tab的prompt
   */
  const { data: rightPromptData } = usePromptApi({ subTaskId: generalSubtaskId })
  // console.log("rightPromptData", rightPromptData)
  // 计算与缓存
  const generalAgentConfigs = useMemo(() => {
    const promptList = rightPromptData?.value || []
    return promptList
  }, [rightPromptData])
  // 同步至状态管理
  useEffect(() => {
    updataClusteringAgentConfigs("general", generalAgentConfigs)
  }, [generalAgentConfigs, updataClusteringAgentConfigs])

  /*
   *  保存配置
   */
  const { mutateAsync: saveAllSettings } = useSaveAllSettingsApi()
  const handleSaveAll = useCallback(async () => {
    const currentConfig = useScenarioConfigStore.getState().currentConfig
    const {
      name,
      description,
      execMode,
      time,
      subTaskConfig,
      stageRecognitionConfig,
      taskReviewConfig,
      aiData,
      humanData,
      knowledgeBase,
      stages,
      tasks
    } = currentConfig || {}
    const { loss, general } = tasks
    const { stageRecognition = 1, customSkillId = "" } = stageRecognitionConfig

    // 防止execMode为2时time为空
    const finalTime = execMode === 1 && !time ? "02:00" : time

    const taskSave = {
      taskId,
      taskName: name,
      businessBackground: description,
      execMode,
      cron: "0 0/5 * * * ?",
      time: finalTime,
      stageRecognitionConfig: { stageRecognition, customSkillId },
      taskReviewConfig
    }

    const aiDataPurposeType = aiData?.options?.find(
      (option) => option.value === aiData?.value
    )?.purposeCode

    const dataSourceSave = {
      taskId,
      dataSourceConfigs: [
        { dataSourceId: aiData?.value, purposeType: aiDataPurposeType },
        { dataSourceId: humanData?.value, purposeType: 2 },
        { dataSourceId: knowledgeBase?.value, purposeType: 3 }
      ].filter((item) => item.dataSourceId) // 没有dataSourceId的为没选数据源，不传
    }

    const primaryCategorySave = {
      taskId,
      primaryCategories: stages
    }

    const allLossCategories = loss?.stageConfigs?.flatMap((stage) => stage.categories) || []
    const allGeneralCategories = general?.stageConfigs?.flatMap((stage) => stage.categories) || []
    const secondaryCategorySave = [
      ...(lossSubtaskId ? [{ taskId: lossSubtaskId, secondaryCategories: allLossCategories }] : []),
      ...(generalSubtaskId
        ? [{ taskId: generalSubtaskId, secondaryCategories: allGeneralCategories }]
        : [])
    ]

    const agentSopSave = [
      ...(lossSubtaskId ? [{ taskId: lossSubtaskId, agentSopConfigs: loss.agentConfigs }] : []),
      ...(generalSubtaskId
        ? [{ taskId: generalSubtaskId, agentSopConfigs: general.agentConfigs }]
        : [])
    ]

    const savingData = {
      taskSave,
      subTaskConfig,
      dataSourceSave,
      agentSopSave,
      primaryCategorySave,
      secondaryCategorySave
    }
    // console.log("savingData", savingData)

    try {
      const res = await saveAllSettings(savingData)
      const { success, errorMsg } = res
      if (success) {
        message.success("发布配置成功")
      } else {
        message.error(errorMsg)
        throw new Error(errorMsg)
      }
    } catch (error) {
      // 往外抛出错误
      throw error
    }
  }, [taskId, lossSubtaskId, generalSubtaskId, saveAllSettings])

  // 获取工作流列表
  const { data: skillData, isLoading: skillLoading } = useFetchSkillListByPage({
    botNo: botNo,
    pageSize: 1000,
    pageNum: 1
  })
  // 数据处理
  const skillOptions = useMemo(() => {
    if (skillData?.skillList) {
      return skillData.skillList.map((skill) => ({
        value: skill.skillNo,
        label: skill.skillName
      }))
    }
    return []
  }, [skillData])

  useEffect(() => {
    // 接口获取到customSkillId,直接使用
    if (customSkillId) {
      const currentOption = skillOptions.filter((option) => option.value === customSkillId)
      if (currentOption) setCurrentOption(currentOption)
    } else {
      // 接口没有获取到customSkillId，则执行获取阶段配置详情里的skillNo
      if (thirdPartyId && botNo) {
        // 获取阶段配置详情
        getFunnelConfigDetail({
          taskId: thirdPartyId,
          analysisCode: "onHookBusinessStage",
          botNo: botNo
        }).then((response) => {
          if (response?.data) {
            const data = response.data || {}
            const { skillNo, extraInfos = [] } = data
            const currentOption = skillOptions.filter((option) => option.value === skillNo)
            if (currentOption) setCurrentOption(currentOption)

            // 阶段配置
            const stages = extraInfos?.map((info, index) => {
              const timestamp = Date.now()
              return {
                primaryId: Number(`${timestamp}${index}`), // 时间戳拼接索引
                name: info.stage,
                description: info.stageDesc,
                step: info.seq,
                isAdd: true
              }
            })
            setLxStages(stages)
          }
        })
      }
    }
  }, [customSkillId, thirdPartyId, botNo])

  return {
    handleSaveAll,
    lossSubtaskId,
    generalSubtaskId,
    skillOptions,
    currentOption,
    lxStages
  }
}
