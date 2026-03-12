import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  forwardRef,
  useImperativeHandle
} from "react"
import {
  Select,
  InputNumber,
  TimePicker,
  Slider,
  Form,
  Switch,
  Input,
  Button,
  message,
  Spin,
  Row,
  Col,
  Table,
  Tag,
  Tooltip,
  Radio,
  Popover,
  Popconfirm
} from "antd"
import {
  PlusOutlined,
  SoundOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ExclamationCircleOutlined
} from "@ant-design/icons"
import {
  getTimbreList,
  getVoiceAgentDetails,
  synthesisVoice,
  createTemplateSkill
} from "@/api/voiceAgent/api"
import { useCreateOrUpdateVoiceAgent } from "@/api/voiceAgent"
import { useFetchAvailableSkills } from "@/api/skill"
import { useLocation, useNavigate } from "react-router-dom"
import queryString from "query-string"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"
import moment from "moment"
import { fetchPersonalTimbreListV2 } from "@/api/timbre/api"
import ScriptSelector from "@/components/ScriptSelector"
import { useGetScriptListByPage } from "@/api/voiceAgent"
import RecordingItem from "@/pages/voice/components/RecordingItem"
import ModelTypeFormComponent from "@/pages/xflow/CustomFlowchartFormPanel/NodeComponent/ModelTypeFormComponent"
import { useFetchLlmFilterModelType, useFetchLlmReasoningEffort } from "@/api/common"
import { marks } from "@/constants"
import { InfoIcon } from "@/components/FormIcon"
import VariableEditorModal from "./VariableEditorModal"
import { ToolItem } from "./ToolsTable"
import { MessageType } from "@/constants/postMessageType"
import copy from "copy-to-clipboard"
import { functionDownVoice } from "@/utils"
import DataFlywheelTab from "./VoiceCanvasModeTabs/DataFlywheelTab"

function generateRandomNumber() {
  // 生成1到9999999之间的随机整数
  return Math.floor(Math.random() * 9999999) + 1
}

const { Option } = Select

const VoiceSettingsPanel = forwardRef(
  (
    {
      voiceConfig,
      onConfigChange,
      onSave,
      botNo,
      agentDetail,
      refreshKey,
      content,
      stepInfos,
      agentVars,
      setAgentVars,
      isOnlyRead
    },
    ref
  ) => {
    const [form] = Form.useForm()
    const location = useLocation()
    const navigate = useNavigate()
    const channelConfigRef = useRef(null)

    // 声音设置相关状态
    const [voiceCollapsedState, setVoiceCollapsedState] = useState({
      voiceScript: true,
      welcome: true,
      general: true,
      flywheel: true,
      channels: true,
      tts: true,
      skills: true,
      details: true,
      model: true,
      memory: true,
      variables: true
    })

    // 音色选项状态
    const [timbreOptions, setTimbreOptions] = useState([])
    const [timbreLoading, setTimbreLoading] = useState(false)
    const [currentAuditionAudio, setCurrentAuditionAudio] = useState(null)
    const [playingAuditionUrl, setPlayingAuditionUrl] = useState(null)
    const [playingAuditionCode, setPlayingAuditionCode] = useState(null)
    const selectRef = useRef(null)
    const auditionEndedHandlerRef = useRef(null)

    // 工作流搜索状态
    const [filterText, setFilterText] = useState("")

    // 语音详情加载状态
    const [voiceDetailsLoading, setVoiceDetailsLoading] = useState(false)

    // 保存相关状态
    const [saving, setSaving] = useState(false)
    const [sectionChanges, setSectionChanges] = useState({
      welcome: false,
      general: false,
      flywheel: false,
      tts: false,
      skills: false,
      details: false,
      model: false
    })
    const [saveTimeouts, setSaveTimeouts] = useState({
      welcome: null,
      general: null,
      tts: null,
      skills: null,
      details: null,
      model: null
    })
    const [taskId, setTaskId] = useState(null)

    // 试听功能状态
    const [synthesizing, setSynthesizing] = useState(false)
    const [audioUrl, setAudioUrl] = useState("")
    const [isPlaying, setIsPlaying] = useState(false)
    const [audioDuration, setAudioDuration] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const [progress, setProgress] = useState(0)
    const audioRef = useRef(null)

    // 分流比例错误提示
    const [rateError, setRateError] = useState("")

    // 创建工作流loading状态
    const [createEventSkillLoading, setCreateEventSkillLoading] = useState(false)
    const [createTagSkillLoading, setCreateTagSkillLoading] = useState(false)
    const [createCushionSkillLoading, setCreateCushionSkillLoading] = useState(false)
    const [createPreSkillLoading, setCreatePreSkillLoading] = useState(false)
    const [createPostposeSkillLoading, setCreatePostposeSkillLoading] = useState(false)

    // 话术列表相关状态
    const [scriptList, setScriptList] = useState([])
    const [selectedWelcomeScript, setSelectedWelcomeScript] = useState(null)

    // 录音相关状态
    const [playingAudio, setPlayingAudio] = useState(null)
    const [audioProgress, setAudioProgress] = useState({})
    const [recordingAudioDuration, setRecordingAudioDuration] = useState({})
    const recordingAudioRefs = useRef({})

    // 开场白音频合成相关状态
    const [welcomeAudioUrl, setWelcomeAudioUrl] = useState("")
    const [welcomeIsPlaying, setWelcomeIsPlaying] = useState(false)
    const [welcomeAudioDuration, setWelcomeAudioDuration] = useState(0)
    const [welcomeCurrentTime, setWelcomeCurrentTime] = useState(0)
    const [welcomeProgress, setWelcomeProgress] = useState(0)
    const welcomeAudioRef = useRef(null)
    const [welcomeSynthesizing, setWelcomeSynthesizing] = useState(false)

    // 变量相关状态
    const [variables, setVariables] = useState([])
    const [variableEditorVisible, setVariableEditorVisible] = useState(false)
    const [isMemoryCollapsed, setIsMemoryCollapsed] = useState(true)
    const [memoryPopoverVisible, setMemoryPopoverVisible] = useState(false)
    const [editingVariable, setEditingVariable] = useState(null)

    // 名单属性添加方式相关状态
    const [propertyAddPopoverVisible, setPropertyAddPopoverVisible] = useState(false)

    // 使用传入的agentVars或内部的variables状态
    const currentVariables = agentVars || variables
    const setCurrentVariables = setAgentVars || setVariables

    // 当agentVars变化时，同步更新内部variables状态
    useEffect(() => {
      if (agentVars && Array.isArray(agentVars)) {
        setVariables(agentVars)
      }
    }, [agentVars])

    // 分流比例变动时校验总和
    const handleRateChange = (value, fieldIdx) => {
      const ccConfigs = Array.isArray(form.getFieldValue("ccConfigs"))
        ? form.getFieldValue("ccConfigs")
        : []
      ccConfigs[fieldIdx].rate = value
      const total = ccConfigs.reduce((sum, item) => sum + (Number(item.rate) || 0), 0)
      if (total > 100) {
        setRateError("通道分流比例之和不能超过100%")
      } else {
        setRateError("")
      }
      form.setFieldsValue({ ccConfigs })
    }

    // 新增通道时自动分配分流比例
    const handleAddChannel = () => {
      const ccConfigs = Array.isArray(form.getFieldValue("ccConfigs"))
        ? form.getFieldValue("ccConfigs")
        : []
      const count = ccConfigs.length + 1
      const base = Math.floor(100 / count)
      const rates = Array(count).fill(base)
      rates[count - 1] = 100 - base * (count - 1)
      // 新增时自动分配所有通道分流比例
      const newConfigs = ccConfigs.map((item, idx) => ({ ...item, rate: rates[idx] }))
      newConfigs.push({
        ccPlatform: undefined,
        bizField: "",
        bizTypes: [],
        rate: rates[count - 1],
        extraInfo: "",
        isSkipWebcall: 0
      })
      form.setFieldsValue({ ccConfigs: newConfigs })
      setSectionChanges((prev) => ({ ...prev, channels: true }))
      setTimeout(() => {
        if (channelConfigRef.current) {
          // 滚动到通道设置区域的底部
          const lastChannelConfig = channelConfigRef.current.lastElementChild
          if (lastChannelConfig) {
            lastChannelConfig.scrollIntoView({
              behavior: "smooth",
              block: "nearest"
            })
          }
        }
      }, 100)
    }

    // 删除通道时自动分配分流比例
    const handleRemoveChannel = (fieldName) => {
      const ccConfigs = Array.isArray(form.getFieldValue("ccConfigs"))
        ? form.getFieldValue("ccConfigs")
        : []
      // 先移除指定通道
      const newConfigs = ccConfigs.filter((_, idx) => idx !== fieldName)
      // 重新分配分流比例
      const count = newConfigs.length
      if (count > 0) {
        const base = Math.floor(100 / count)
        const rates = Array(count).fill(base)
        rates[count - 1] = 100 - base * (count - 1)
        for (let i = 0; i < count; i++) {
          newConfigs[i].rate = rates[i]
        }
      }
      form.setFieldsValue({ ccConfigs: newConfigs })
      setSectionChanges((prev) => ({ ...prev, channels: true }))
    }

    // 从URL获取botNo参数
    const searchParams = queryString.parse(location.search) || {}
    const hashParams = queryString.parse(window.location.hash.split("?")[1] || "") || {}
    const currentBotNo = botNo || searchParams.botNo || hashParams.botNo || "20250416001"

    // API函数
    const createOrUpdateVoiceAgent = useCreateOrUpdateVoiceAgent()

    // 模型相关API调用
    const { data: modelOptions = [] } = useFetchLlmFilterModelType(currentBotNo)
    const { data: reasoningEffortOptions = [] } = useFetchLlmReasoningEffort()

    // 语音详情状态
    const [voiceDetail, setVoiceDetail] = useState(null)

    // 获取工作流列表
    const { data: availableSkills = {}, refetch: refetchSkills } = useFetchAvailableSkills({
      botNo: currentBotNo,
      pageSize: 1000,
      pageNum: 1
    })

    // 监听表单字段变化
    const agentPreSkillNo = Form.useWatch("agentPreSkillNo", form)
    const agentPostposeSkillNo = Form.useWatch("agentPostposeSkillNo", form)
    const reflectAigcSkillNo = Form.useWatch("reflectAigcSkillNo", form)
    const reflectAigcEventSkillNo = Form.useWatch("reflectAigcEventSkillNo", form)
    const intentTagCallSkillNo = Form.useWatch("intentTagCallSkillNo", form)

    // 获取话术列表
    const { data: scriptData, isLoading: scriptLoading } = useGetScriptListByPage(
      {
        pageSize: 10000,
        pageNum: 1,
        botNo: currentBotNo,
        taskId
      },
      {
        enabled: !!currentBotNo && !!taskId // 当有botNo和taskId时自动查询
      }
    )

    // 工作流搜索处理
    const handleSearch = (value) => {
      setFilterText(value)
    }

    // 处理工作流选项
    const skills = useMemo(() => {
      const selfSkills =
        availableSkills.selfSkills?.map((skill) => {
          return {
            ...skill,
            label: skill.skillName,
            value: skill.skillNo
          }
        }) || []
      const subscribedSkills =
        availableSkills.subscribedSkills?.map((skill) => {
          return {
            ...skill,
            label: skill.skillName,
            value: skill.skillNo
          }
        }) || []
      return [
        {
          label: "来自本空间",
          options: selfSkills.filter((o) => o.label.includes(filterText))
        },
        {
          label: "来自其他空间",
          options: subscribedSkills.filter((o) => o.label.includes(filterText))
        }
      ]
    }, [availableSkills, filterText])

    // 创建事件处理工作流
    const handleCreateEventSkill = async () => {
      try {
        if (!agentDetail?.agentNo) {
          message.warning("缺少agentNo，无法创建工作流")
          return
        }

        setCreateEventSkillLoading(true)
        const res = await createTemplateSkill({
          botNo: currentBotNo,
          agentNo: agentDetail.agentNo,
          templateNo: "eventHandler"
        })

        if (res && res.status === 200) {
          message.success("事件处理工作流创建成功")
          if (res.data) {
            // 自动选择到Select中
            form.setFieldsValue({ reflectAigcEventSkillNo: res.data })
          }
          // 重新获取工作流列表
          refetchSkills()
        } else {
          message.error(res?.message || "创建工作流失败")
        }
      } catch (error) {
        console.error("创建事件处理工作流失败:", error)
        message.error("创建工作流失败")
      } finally {
        setCreateEventSkillLoading(false)
      }
    }

    // 创建通话打标工作流
    const handleCreateTagSkill = async () => {
      try {
        if (!agentDetail?.agentNo) {
          message.warning("缺少agentNo，无法创建工作流")
          return
        }

        setCreateTagSkillLoading(true)
        const res = await createTemplateSkill({
          botNo: currentBotNo,
          agentNo: agentDetail.agentNo,
          templateNo: "intentTagHandler"
        })

        if (res && res.status === 200) {
          message.success("通话打标工作流创建成功")
          if (res.data) {
            // 自动选择到Select中
            form.setFieldsValue({ intentTagCallSkillNo: res.data })
          }
          // 重新获取工作流列表
          refetchSkills()
        } else {
          message.error(res?.message || "创建工作流失败")
        }
      } catch (error) {
        console.error("创建通话打标工作流失败:", error)
        message.error("创建工作流失败")
      } finally {
        setCreateTagSkillLoading(false)
      }
    }

    // 创建垫词工作流
    const handleCreateCushionSkill = async () => {
      try {
        if (!agentDetail?.agentNo) {
          message.warning("缺少agentNo，无法创建工作流")
          return
        }

        setCreateCushionSkillLoading(true)
        const res = await createTemplateSkill({
          botNo: currentBotNo,
          agentNo: agentDetail.agentNo,
          templateNo: "cushionWordsHandler"
        })

        if (res && res.status === 200) {
          message.success("垫词工作流创建成功")
          if (res.data) {
            // 自动选择到Select中
            form.setFieldsValue({ reflectAigcSkillNo: res.data })
          }
          // 重新获取工作流列表
          refetchSkills()
        } else {
          message.error(res?.message || "创建工作流失败")
        }
      } catch (error) {
        console.error("创建垫词工作流失败:", error)
        message.error("创建工作流失败")
      } finally {
        setCreateCushionSkillLoading(false)
      }
    }

    // 创建预处理工作流
    const handleCreatePreSkill = async () => {
      try {
        if (!agentDetail?.agentNo) {
          message.warning("缺少agentNo，无法创建工作流")
          return
        }

        setCreatePreSkillLoading(true)
        const res = await createTemplateSkill({
          botNo: currentBotNo,
          agentNo: agentDetail.agentNo,
          templateNo: "preAgentHandler"
        })

        if (res && res.status === 200) {
          message.success("预处理工作流创建成功")
          if (res.data) {
            // 自动选择到Select中
            form.setFieldsValue({ agentPreSkillNo: res.data })
          }
          // 重新获取工作流列表
          refetchSkills()
        } else {
          message.error(res?.message || "创建工作流失败")
        }
      } catch (error) {
        console.error("创建预处理工作流失败:", error)
        message.error("创建工作流失败")
      } finally {
        setCreatePreSkillLoading(false)
      }
    }

    // 创建后置处理工作流
    const handleCreatePostposeSkill = async () => {
      try {
        if (!agentDetail?.agentNo) {
          message.warning("缺少agentNo，无法创建工作流")
          return
        }

        setCreatePostposeSkillLoading(true)
        const res = await createTemplateSkill({
          botNo: currentBotNo,
          agentNo: agentDetail.agentNo,
          templateNo: "postposeAgentHandler"
        })

        if (res && res.status === 200) {
          message.success("后置处理工作流创建成功")
          if (res.data) {
            // 自动选择到Select中
            form.setFieldsValue({ agentPostposeSkillNo: res.data })
          }
          // 重新获取工作流列表
          refetchSkills()
        } else {
          message.error(res?.message || "创建工作流失败")
        }
      } catch (error) {
        message.error("创建工作流失败")
      } finally {
        setCreatePostposeSkillLoading(false)
      }
    }

    // 获取语音模板详情（支持agentNo参数）
    const fetchVoiceAgentDetails = useCallback(async () => {
      if (!agentDetail?.agentNo) {
        return
      }

      try {
        setVoiceDetailsLoading(true)
        const res = await getVoiceAgentDetails({
          agentNo: agentDetail.agentNo,
          botNo: currentBotNo
        })

        if (res && res.status === 200 && res.data) {
          const detail = res.data

          // 处理时间格式
          if (detail.allowCallTimeStart) {
            detail.allowCallTimeStart = moment(detail.allowCallTimeStart, "HH:mm")
          }
          if (detail.allowCallTimeEnd) {
            detail.allowCallTimeEnd = moment(detail.allowCallTimeEnd, "HH:mm")
          }

          // 处理开关值 - 将字符串转换为布尔值
          if (detail.taskProcessRateFlag !== undefined) {
            detail.taskProcessRateFlag = detail.taskProcessRateFlag === "1"
          }

          // 处理音色字段映射
          if (detail.voiceId) {
            detail.timbreCode = detail.voiceId

            // 根据timbreCode查找对应的timbreName和timbreModel
            const selectedTimbre = timbreOptions.find(
              (option) => option.value === Number(detail.voiceId)
            )
            if (selectedTimbre) {
              // 从label中解析出timbreName和timbreModel
              const labelParts = selectedTimbre.label.split(" - ")
              if (labelParts.length >= 2) {
                detail.timbreName = labelParts[0]
                detail.timbreModel = labelParts[1]
              }
            }
          }

          // 处理其他可能的字段映射
          if (detail.variableConfigs && typeof detail.variableConfigs === "string") {
            try {
              detail.variableConfigs = JSON.parse(detail.variableConfigs)
            } catch (e) {
              detail.variableConfigs = []
            }
          }

          // 处理 agentPromptConfig 字段的数据回显
          if (detail.agentPromptConfig) {
            const promptConfig = detail.agentPromptConfig

            // 处理模型相关字段
            if (promptConfig.model) {
              detail.modelType = promptConfig.model
            }
            if (promptConfig.reasoningEffort) {
              detail.reasoningEffort = promptConfig.reasoningEffort
            }

            // 处理记忆模块字段
            if (promptConfig.maxRounds !== undefined) {
              detail.maxRounds = promptConfig.maxRounds
            }
            if (promptConfig.autoSummary !== undefined) {
              detail.autoSummary = promptConfig.autoSummary === 1
            }
            if (promptConfig.autoSummaryRounds !== undefined) {
              detail.autoSummaryRounds = promptConfig.autoSummaryRounds
            }

            // 处理 modelExtra 字段
            if (promptConfig.modelExtra) {
              const modelExtra = promptConfig.modelExtra
              if (modelExtra.temperature !== undefined) {
                detail.temperature = modelExtra.temperature
              }
              // 处理高级设置字段
              if (modelExtra.topK !== undefined) {
                detail.topK = modelExtra.topK
                detail.topKEnable = true
              }
              if (modelExtra.topP !== undefined) {
                detail.topP = modelExtra.topP
                detail.topPEnable = true
              }
              if (modelExtra.maxToken !== undefined) {
                detail.maxToken = modelExtra.maxToken
                detail.maxTokenEnable = true
              }
              if (modelExtra.seed !== undefined) {
                detail.seed = modelExtra.seed
                detail.seedEnable = true
              }

              // 判断是否需要开启高级设置开关
              const hasAdvancedSettings =
                modelExtra.maxToken !== undefined ||
                modelExtra.seed !== undefined ||
                modelExtra.topK !== undefined ||
                modelExtra.topP !== undefined
              if (hasAdvancedSettings) {
                detail.advancedSettingEnable = true
              }
            }

            // 处理变量数据
            if (promptConfig.vars && Array.isArray(promptConfig.vars)) {
              const formattedVars = promptConfig.vars.map((variable, index) => ({
                varNo: `var_${Date.now()}_${index}`,
                varName: variable.variableName || variable.varName || "",
                description: variable.description || "",
                enabled: variable.enabled !== undefined ? variable.enabled : true,
                defaultValue: variable.defaultValue || "",
                autoExtraction: variable.autoExtraction || 0
              }))
              setCurrentVariables(formattedVars)
            } else {
              setCurrentVariables([])
            }
          } else {
            // 兼容旧版本数据结构
            if (detail.vars && Array.isArray(detail.vars)) {
              setCurrentVariables(detail.vars)
            } else {
              setCurrentVariables([])
            }

            // 处理旧版本的 modelExtra 字段
            if (detail.modelExtra) {
              const modelExtra = detail.modelExtra
              // 判断是否需要开启高级设置开关
              const hasAdvancedSettings =
                modelExtra.maxToken !== undefined ||
                modelExtra.seed !== undefined ||
                modelExtra.topK !== undefined ||
                modelExtra.topP !== undefined
              if (hasAdvancedSettings) {
                detail.advancedSettingEnable = true
              }
            }
          }

          // 确保数组字段的默认值
          if (!Array.isArray(detail.variableConfigs)) {
            detail.variableConfigs = []
          }
          if (!Array.isArray(detail.ccConfigs)) {
            detail.ccConfigs = []
          }

          // 处理音量和音频速率的默认值
          if (detail.volume === null || detail.volume === undefined) {
            detail.volume = 50 // 默认音量50%
          }
          if (detail.speed === null || detail.speed === undefined) {
            detail.speed = 1.05 // 默认音频速率1.05x
          }

          // 处理robotStrategy和crossCallScriptTag的默认值
          if (detail.robotStrategy === null || detail.robotStrategy === undefined) {
            detail.robotStrategy = "merge" // 默认选中合并用户问题
          }
          if (detail.crossCallScriptTag === null || detail.crossCallScriptTag === undefined) {
            detail.crossCallScriptTag = "0" // 默认关闭跨通话轮询话术
          }

          // 保存taskId用于后续保存操作
          if (detail.taskId) {
            setTaskId(detail.taskId)
          }

          console.log("VoiceSettingsPanel: 处理后的语音详情数据", detail)

          // 保存语音详情数据用于话术语音模块
          setVoiceDetail(detail)

          // 处理welcomeScriptDetails数据，确保scriptVoices数组正确回显
          let processedWelcomeScriptDetails = detail.welcomeScriptDetails
          if (processedWelcomeScriptDetails) {
            // 确保scriptVoices数组存在且格式正确
            if (!Array.isArray(processedWelcomeScriptDetails.scriptVoices)) {
              processedWelcomeScriptDetails.scriptVoices = []
            }

            // 如果scriptVoices数组为空但有其他录音相关数据，尝试构建默认项
            if (
              processedWelcomeScriptDetails.scriptVoices.length === 0 &&
              processedWelcomeScriptDetails.variable === 0
            ) {
              processedWelcomeScriptDetails.scriptVoices = [{}]
            }
          }

          const formData = {
            ...detail,
            redisExpireTime: detail?.redisExpireTime || 86400,
            welcomeScriptDetails: processedWelcomeScriptDetails
          }

          form.setFieldsValue(formData)

          // 同时通知父组件更新voiceConfig
          if (onConfigChange) {
            onConfigChange(detail)
          }
        }
      } catch (error) {
        message.error("获取语音模板详情失败")
      } finally {
        setVoiceDetailsLoading(false)
      }
    }, [agentDetail?.agentNo, currentBotNo, form, onConfigChange])

    // 当agentDetail变化时调用接口
    useEffect(() => {
      if (agentDetail?.agentNo && currentBotNo) {
        fetchVoiceAgentDetails()
      }
    }, [agentDetail?.agentNo, currentBotNo, fetchVoiceAgentDetails, refreshKey])

    // 获取音色列表
    const fetchTimbreList = useCallback(async () => {
      try {
        setTimbreLoading(true)
        const res = await fetchPersonalTimbreListV2({
          botNo: currentBotNo
        })

        if (Array.isArray(res)) {
          const options = res.map((item) => ({
            value: item.timbreCode && Number(item.timbreCode),
            label: item.timbreName + " - " + item.timbreModel,
            auditionUrl: item.auditionUrl
          }))
          setTimbreOptions(options)
        }
      } catch (error) {
        // 静默处理错误
      } finally {
        setTimbreLoading(false)
      }
    }, [currentBotNo])

    useEffect(() => {
      fetchTimbreList()
    }, [currentBotNo, fetchTimbreList])

    // 处理音色试听
    const handleTimbreAudition = (auditionUrl, timbreCode) => {
      if (!auditionUrl) {
        message.warning("该音色暂无试听音频")
        return
      }

      // 如果当前正在播放这个音频，则暂停
      const isSameAudition =
        playingAuditionCode === timbreCode && playingAuditionUrl === auditionUrl
      if (isSameAudition && currentAuditionAudio) {
        currentAuditionAudio.pause()
        currentAuditionAudio.currentTime = 0
        if (auditionEndedHandlerRef.current) {
          currentAuditionAudio.removeEventListener("ended", auditionEndedHandlerRef.current)
          auditionEndedHandlerRef.current = null
        }
        setCurrentAuditionAudio(null)
        setPlayingAuditionUrl(null)
        setPlayingAuditionCode(null)
        return
      }

      // 停止当前正在播放的音频
      if (currentAuditionAudio) {
        currentAuditionAudio.pause()
        currentAuditionAudio.currentTime = 0
        if (auditionEndedHandlerRef.current) {
          currentAuditionAudio.removeEventListener("ended", auditionEndedHandlerRef.current)
          auditionEndedHandlerRef.current = null
        }
      }

      // 创建新的音频实例
      const audio = new Audio(auditionUrl)
      setCurrentAuditionAudio(audio)
      setPlayingAuditionUrl(auditionUrl)
      setPlayingAuditionCode(timbreCode)

      // 定义播放结束的处理函数
      const handleAuditionEnded = () => {
        setCurrentAuditionAudio(null)
        setPlayingAuditionUrl(null)
        setPlayingAuditionCode(null)
        audio.removeEventListener("ended", handleAuditionEnded)
        auditionEndedHandlerRef.current = null
      }

      auditionEndedHandlerRef.current = handleAuditionEnded
      audio.addEventListener("ended", handleAuditionEnded)
      audio.play().catch((error) => {
        console.error("播放试听音频失败:", error)
        message.error("试听播放失败")
        setCurrentAuditionAudio(null)
        setPlayingAuditionUrl(null)
        setPlayingAuditionCode(null)
        audio.removeEventListener("ended", handleAuditionEnded)
        auditionEndedHandlerRef.current = null
      })
    }

    // 处理话术列表数据
    useEffect(() => {
      if (
        scriptData?.data?.list &&
        Array.isArray(scriptData?.data?.list) &&
        scriptData?.data?.list.length > 0
      ) {
        // 从新的接口结构中获取scripts数组，包含variable字段
        const formattedScripts = scriptData?.data?.list.map((script) => ({
          scriptId: script.id,
          name: script.name || `话术${script.id}`,
          content: script.content || "",
          variable: script.variable || 0 // 添加variable字段
        }))
        setScriptList(formattedScripts)
      }
    }, [scriptData])

    // 处理开场白话术选择
    const handleWelcomeScriptChange = useCallback(
      (scriptId) => {
        const selectedScript = scriptList.find((s) => s.scriptId === scriptId)
        setSelectedWelcomeScript(selectedScript)
        // 更新表单中的welcomeScriptDetails，包含完整的话术信息
        if (selectedScript) {
          const welcomeScriptDetails = {
            name: selectedScript.name, // 话术名称
            scriptId: selectedScript.scriptId, // 话术ID
            content: selectedScript.content, // 话术内容
            variable: selectedScript.variable || 0, // 是否包含变量，默认为0
            audioFormat: selectedScript.audioFormat || "wav", // 录音格式，默认wav
            sampleRate: selectedScript.sampleRate || 8000, // 音频采样率，默认8000
            volume: selectedScript.volume || 55, // 音量，默认55
            speed: selectedScript.speed || 1.11 // 音频速率，默认1.11
          }

          form.setFieldsValue({
            welcomeScriptDetails
          })
        } else {
          form.setFieldsValue({
            welcomeScriptDetails: {
              name: undefined,
              scriptId: undefined,
              content: undefined,
              variable: 0,
              audioFormat: "wav",
              sampleRate: 8000,
              volume: 55,
              speed: 1.11
            }
          })
        }

        // 触发表单变化事件
        const currentValues = form.getFieldsValue()
        onConfigChange?.(currentValues)
      },
      [scriptList, form, onConfigChange]
    )

    // 存储当前话术详情数据
    const [currentScriptDetail, setCurrentScriptDetail] = useState(null)

    // 匹配音色对应的ossUrl和voiceName
    const matchTimbreVoice = useCallback((scriptDetail, timbreCode) => {
      if (
        !scriptDetail ||
        !scriptDetail.scriptVoices ||
        !Array.isArray(scriptDetail.scriptVoices) ||
        !timbreCode
      ) {
        return null
      }

      // 确保类型一致性比较，支持number和string类型
      const matchedVoice = scriptDetail.scriptVoices.find(
        (voice) => String(voice.timbreCode) === String(timbreCode)
      )

      console.log("matchedVoice", matchedVoice)

      return matchedVoice
    }, [])

    // 更新welcomeScriptDetails中的音频信息
    const updateWelcomeScriptAudio = useCallback(
      (matchedVoice) => {
        if (matchedVoice && matchedVoice.ossUrl) {
          const currentWelcomeScriptDetails = form.getFieldValue("welcomeScriptDetails") || {}
          const currentScriptVoices = currentWelcomeScriptDetails.scriptVoices || []

          // 更新scriptVoices数组中每个项目的voiceName和ossUrl
          const updatedScriptVoices = currentScriptVoices.map((voice) => ({
            ...voice,
            voiceName: matchedVoice.voiceName,
            ossUrl: matchedVoice.ossUrl
          }))

          const updatedWelcomeScriptDetails = {
            ...currentWelcomeScriptDetails,
            ossUrl: matchedVoice.ossUrl,
            voiceName: matchedVoice.voiceName,
            scriptVoices: updatedScriptVoices
          }

          form.setFieldsValue({
            welcomeScriptDetails: updatedWelcomeScriptDetails
          })

          // 触发表单变化事件
          const currentValues = form.getFieldsValue()
          onConfigChange?.(currentValues)
        }
      },
      [form, onConfigChange]
    )

    // 处理话术详情变化，匹配当前音色对应的ossUrl
    const handleScriptDetailChange = useCallback(
      (scriptDetail) => {
        // 保存话术详情数据
        setCurrentScriptDetail(scriptDetail)

        if (scriptDetail && scriptDetail.scriptVoices && Array.isArray(scriptDetail.scriptVoices)) {
          const currentTimbreCode = form.getFieldValue("timbreCode")
          const matchedVoice = matchTimbreVoice(scriptDetail, currentTimbreCode)
          updateWelcomeScriptAudio(matchedVoice)
        }
      },
      [form, matchTimbreVoice, updateWelcomeScriptAudio]
    )

    // 处理音色变化，重新匹配对应的音频文件
    const handleTimbreChange = useCallback(
      (newTimbreCode) => {
        console.log("newTimbreCode", newTimbreCode)
        if (currentScriptDetail) {
          const matchedVoice = matchTimbreVoice(currentScriptDetail, newTimbreCode)
          updateWelcomeScriptAudio(matchedVoice)
        }
      },
      [currentScriptDetail, matchTimbreVoice, updateWelcomeScriptAudio]
    )

    // 处理表单字段变化
    const handleFormChange = (changedFields, allFields) => {
      const currentValues = form.getFieldsValue()
      onConfigChange?.(currentValues)

      // 检测变化的字段属于哪个区域
      if (changedFields && changedFields.length > 0) {
        const changedFieldNames = changedFields.map((field) => field.name[0])

        // 开场白字段
        const welcomeFields = ["welcomeScriptDetails"]

        // 通用设置字段
        const generalFields = [
          "taskName",
          "redisExpireTime",
          "numberWebCall",
          "taskProcessRateFlag",
          "taskProcessRateSleepTime",
          "allowCallTimeStart",
          "allowCallTimeEnd",
          "robotStrategy",
          "crossCallScriptTag",
          "ccConfigs"
        ]

        // 声音设置字段
        const ttsFields = ["audioFormat", "sampleRate", "speed", "volume"]

        // 工作流字段
        const skillsFields = [
          "reflectAigcSkillNo",
          "reflectAigcEventSkillNo",
          "intentTagCallSkillNo",
          "reflectErrOverNum"
        ]

        // 通话详情字段
        const detailsFields = ["variableConfigs"]

        // 模型字段
        const modelFields = ["modelType", "reasoningEffort"]

        // 数据飞轮字段（顶层字段名为 flywheelInfo）
        const flywheelFields = ["flywheelInfo"]

        // 标记相应区域有变化
        const newSectionChanges = { ...sectionChanges }

        changedFieldNames.forEach((fieldName) => {
          if (welcomeFields.includes(fieldName)) {
            newSectionChanges.welcome = true
          }
          if (generalFields.includes(fieldName)) {
            newSectionChanges.general = true
          }
          if (ttsFields.includes(fieldName)) {
            newSectionChanges.tts = true
          }
          if (skillsFields.includes(fieldName)) {
            newSectionChanges.skills = true
          }
          if (detailsFields.includes(fieldName)) {
            newSectionChanges.details = true
          }
          if (modelFields.includes(fieldName)) {
            newSectionChanges.model = true
          }
        })

        setSectionChanges(newSectionChanges)
      }
    }

    // 处理开场白语音合成
    const handleWelcomeSynthesis = useCallback(
      async (synthesisText) => {
        try {
          const values = form.getFieldsValue()
          const { timbreCode, welcomeScriptDetails } = values
          const { audioFormat, sampleRate, speed, volume } = welcomeScriptDetails || {}

          // 验证必填参数
          if (!timbreCode) {
            message.warning("请先选择音色")
            return
          }

          if (audioFormat === "pcm") {
            message.warning("pcm 录音格式暂时不支持试听")
            return
          }

          // if (!synthesisText) {
          //   message.warning("请输入要合成的文本")
          //   return
          // }

          // if (!audioFormat) {
          //   message.warning("请先选择录音格式")
          //   return
          // }

          // if (!sampleRate) {
          //   message.warning("请先选择音频采样率")
          //   return
          // }

          // if (speed === null || speed === undefined) {
          //   message.warning("请先设置音频速率")
          //   return
          // }

          // if (volume === null || volume === undefined) {
          //   message.warning("请先设置音量")
          //   return
          // }

          setWelcomeSynthesizing(true)
          setWelcomeAudioUrl("") // 重置之前的音频

          const params = {
            botNo: currentBotNo,
            content: synthesisText,
            timbreCode: timbreCode,
            audioFormat: audioFormat,
            sampleRate: sampleRate,
            speed: speed,
            volume: volume
          }

          const res = await synthesisVoice(params)

          if (res && res.status === 200) {
            if (res.data) {
              message.success("语音合成成功")
              setWelcomeAudioUrl(res.data)
              setWelcomeProgress(0)
              setWelcomeCurrentTime(0)
              setWelcomeIsPlaying(false) // 重置播放状态
            } else {
              message.error("语音合成失败，未能获取到有效的音频文件。")
            }
          } else {
            message.error(res?.message || "语音合成失败")
          }
        } catch (error) {
          console.error("语音合成失败:", error)
          message.error("语音合成失败")
        } finally {
          setWelcomeSynthesizing(false)
        }
      },
      [form, currentBotNo]
    )

    // 播放或暂停开场白音频
    const toggleWelcomePlay = useCallback(() => {
      if (welcomeAudioRef.current) {
        if (welcomeIsPlaying) {
          welcomeAudioRef.current.pause()
        } else {
          welcomeAudioRef.current.play()
        }
        setWelcomeIsPlaying(!welcomeIsPlaying)
      }
    }, [welcomeIsPlaying])

    // 处理开场白进度条点击事件
    const handleWelcomeProgressClick = useCallback(
      (e) => {
        if (welcomeAudioRef.current && welcomeAudioDuration) {
          const progressBar = e.currentTarget
          const rect = progressBar.getBoundingClientRect()
          const offsetX = e.clientX - rect.left
          const newProgress = (offsetX / progressBar.offsetWidth) * 100
          const newTime = (newProgress / 100) * welcomeAudioDuration

          welcomeAudioRef.current.currentTime = newTime
          setWelcomeProgress(newProgress)
          setWelcomeCurrentTime(newTime)
        }
      },
      [welcomeAudioDuration]
    )

    // 跳转函数
    const reTodoUrlHandel = (skillNo) => {
      window.parent.postMessage(
        {
          type: MessageType.NAVIGATE_TO_PROMPT,
          payload: {
            skillNo: skillNo,
            _blank: true,
            isTools: true
          }
        },
        "*"
      )
    }

    // 变量相关操作函数
    const handleDeleteVar = (varNo) => {
      const newVars = currentVariables.filter((v) => v.varNo !== varNo)
      setCurrentVariables(newVars)
      // 如果传入了agentVars，也需要更新它
      if (agentVars && setAgentVars) {
        setAgentVars(newVars)
      }
    }

    const handleConfirmVars = (vars) => {
      setCurrentVariables([...vars])
      // 如果传入了agentVars，也需要更新它
      if (agentVars && setAgentVars) {
        setAgentVars([...vars])
      }
      setMemoryPopoverVisible(false)
    }

    // 分段保存函数
    const handleSectionSave = async (section) => {
      if (!taskId) {
        message.error("缺少taskId，无法保存")
        return
      }

      if (!agentDetail?.agentNo) {
        message.error("缺少agentNo，无法保存")
        return
      }

      if (!sectionChanges[section]) {
        return // 该区域没有变化，不需要保存
      }

      try {
        setSaving(true)
        // 先校验表单
        await form.validateFields()
        const formValues = form.getFieldsValue()

        // 构建保存参数
        const params = {
          taskId: taskId,
          botNo: currentBotNo,
          agentNo: agentDetail?.agentNo,
          ...formValues,
          // 处理时间格式
          allowCallTimeStart:
            formValues.allowCallTimeStart?.format?.("HH:mm") || formValues.allowCallTimeStart,
          allowCallTimeEnd:
            formValues.allowCallTimeEnd?.format?.("HH:mm") || formValues.allowCallTimeEnd,
          // 处理开关值
          taskProcessRateFlag: formValues.taskProcessRateFlag ? "1" : "0"
        }

        const res = await createOrUpdateVoiceAgent(params)

        if (res.status === 200) {
          console.log(`${section} 区域自动保存成功`)
          // 清除该区域的变化标记
          setSectionChanges((prev) => ({
            ...prev,
            [section]: false
          }))
        } else {
          // 优先显示 data 字段的错误信息，其次是 message
          const errorMsg = res.data || res.message || "保存失败"
          message.error(errorMsg)
        }
      } catch (error) {
        // 校验不通过时不弹窗，表单会自动红字提示
        if (error && error.errorFields) return
        console.error(`${section} 区域保存失败:`, error)
        message.error("保存失败，请重试")
      } finally {
        setSaving(false)
      }
    }

    // 暴露方法给父组件
    useImperativeHandle(
      ref,
      () => ({
        // 获取当前表单数据
        getFormData: () => {
          return form.getFieldsValue()
        },
        // 保存语音设置
        saveVoiceSettings: async () => {
          if (!taskId) {
            throw new Error("缺少taskId，无法保存")
          }

          if (!agentDetail?.agentNo) {
            throw new Error("缺少agentNo，无法保存")
          }

          try {
            // 先校验表单
            await form.validateFields()
            const formValues = form.getFieldsValue()

            console.log("formValues==>2222", variables, stepInfos)
            // 校验stepInfos数组 对象，stepName，stepCode，content 都不能为空，如果为空，展示提示第几项 某个字段没有不能为空
            if (stepInfos && stepInfos?.length && Array.isArray(stepInfos)) {
              for (let i = 0; i < stepInfos.length; i++) {
                const step = stepInfos[i]
                const stepIndex = i + 1

                // 检查stepName是否为空
                if (
                  !step.stepName ||
                  typeof step.stepName !== "string" ||
                  step.stepName.trim() === ""
                ) {
                  message.error(`第${stepIndex}项的步骤名称不能为空`)
                  return
                }

                // 检查stepCode是否为空
                if (
                  !step.stepCode ||
                  typeof step.stepCode !== "string" ||
                  step.stepCode.trim() === ""
                ) {
                  message.error(`第${stepIndex}项的步骤代码不能为空`)
                  return
                }

                // 检查content是否为空
                if (
                  !step.content ||
                  typeof step.content !== "string" ||
                  step.content.trim() === ""
                ) {
                  message.error(`第${stepIndex}项的内容不能为空`)
                  return
                }
              }
            }

            // 处理 welcomeScriptDetails，确保包含完整信息和 scriptVoices
            let completeWelcomeScriptDetails = formValues.welcomeScriptDetails
            if (completeWelcomeScriptDetails) {
              // 如果只有 scriptId，需要补充完整信息
              if (completeWelcomeScriptDetails.scriptId && !completeWelcomeScriptDetails.name) {
                const selectedScript = scriptList.find(
                  (s) => s.scriptId === completeWelcomeScriptDetails.scriptId
                )
                if (selectedScript) {
                  completeWelcomeScriptDetails = {
                    ...completeWelcomeScriptDetails,
                    name: selectedScript.name,
                    scriptId: selectedScript.scriptId,
                    content: selectedScript.content,
                    variable: selectedScript.variable || 0
                  }
                }
              }

              // 确保 scriptVoices 字段存在
              if (!completeWelcomeScriptDetails.scriptVoices) {
                completeWelcomeScriptDetails.scriptVoices = []
              }
            }

            // 构建保存参数
            const params = {
              taskId: taskId,
              botNo: currentBotNo,
              agentNo: agentDetail?.agentNo,
              ...formValues,
              welcomeScriptDetails: completeWelcomeScriptDetails,
              // 处理时间格式
              allowCallTimeStart:
                formValues.allowCallTimeStart?.format?.("HH:mm") || formValues.allowCallTimeStart,
              allowCallTimeEnd:
                formValues.allowCallTimeEnd?.format?.("HH:mm") || formValues.allowCallTimeEnd,
              // 处理开关值
              taskProcessRateFlag: formValues.taskProcessRateFlag ? "1" : "0",
              agentPromptConfig: {
                agentNo: agentDetail?.agentNo,
                botNo: currentBotNo,
                taskId: taskId,
                prompt: content,
                stepInfos: stepInfos, // 步骤配置列表
                model: formValues.modelType, // 模型类型
                reasoningEffort: formValues.reasoningEffort, // 推理程度
                // 记忆模块字段
                maxRounds: formValues.maxRounds || 50,
                autoSummary: formValues.autoSummary ? 1 : 0,
                autoSummaryRounds: formValues.autoSummaryRounds || 20,
                // 变量数据
                vars: currentVariables.map((variable) => ({
                  variableName: variable.varName,
                  description: variable.description,
                  enabled: variable.enabled,
                  defaultValue: variable.defaultValue,
                  autoExtraction: variable.autoExtraction || 0
                })),
                modelExtra: {
                  temperature: formValues.temperature || 0.7,
                  // 高级设置字段
                  ...(formValues.topKEnable &&
                    formValues.topK !== undefined && { topK: formValues.topK }),
                  ...(formValues.topPEnable &&
                    formValues.topP !== undefined && { topP: formValues.topP }),
                  ...(formValues.maxTokenEnable &&
                    formValues.maxToken !== undefined && { maxToken: formValues.maxToken }),
                  ...(formValues.seedEnable &&
                    formValues.seed !== undefined && { seed: formValues.seed })
                }
              }
            }

            const res = await createOrUpdateVoiceAgent(params)

            if (res.status === 200) {
              message.success("保存成功！")
              // 清除所有变化标记
              setSectionChanges({
                general: false,
                tts: false,
                skills: false,
                details: false
              })
              return res
            } else {
              throw new Error(res.data || res.message || "语音设置保存失败")
            }
          } catch (error) {
            // 如果是表单验证错误，提供更友好的错误信息
            if (error.errorFields && error.errorFields.length > 0) {
              const errorMessages = error.errorFields
                .map((field) => {
                  const fieldName = field.name.join(".")
                  const errorMsg = field.errors.join(", ")
                  return `${fieldName}: ${errorMsg}`
                })
                .join("; ")
              throw new Error(`语音设置表单验证失败：${errorMessages}`)
            }

            throw error
          }
        }
      }),
      [
        taskId,
        agentDetail?.agentNo,
        currentBotNo,
        form,
        createOrUpdateVoiceAgent,
        stepInfos,
        content,
        variables
      ]
    )

    // 区域鼠标离开时的防抖保存
    const handleSectionMouseLeave = (section) => {
      // TODO 取消自动保存
      return false
      // if (sectionChanges[section] && !saving) {
      //   // 清除之前的定时器
      //   if (saveTimeouts[section]) {
      //     clearTimeout(saveTimeouts[section])
      //   }

      //   // 设置新的定时器，延迟500ms执行保存
      //   const timeout = setTimeout(async () => {
      //     await handleSectionSave(section)
      //   }, 500)

      //   setSaveTimeouts((prev) => ({
      //     ...prev,
      //     [section]: timeout
      //   }))
      // }
    }

    // 切换区域折叠状态
    const toggleSection = (section) => {
      setVoiceCollapsedState({
        ...voiceCollapsedState,
        [section]: !voiceCollapsedState[section]
      })
    }

    // 区域鼠标进入处理
    const handleSectionMouseEnter = (section) => {
      // 可以在这里添加鼠标进入时的逻辑
    }

    // 组件卸载时清理所有定时器
    useEffect(() => {
      return () => {
        Object.values(saveTimeouts).forEach((timeout) => {
          if (timeout) {
            clearTimeout(timeout)
          }
        })
      }
    }, [saveTimeouts])

    // 监听音频进度
    useEffect(() => {
      const handleTimeUpdate = () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime)
          const progressValue = (audioRef.current.currentTime / audioDuration) * 100
          setProgress(progressValue)
        }
      }

      const handleLoadedMetadata = () => {
        if (audioRef.current) {
          setAudioDuration(audioRef.current.duration)
        }
      }

      const audioElement = audioRef.current
      if (audioElement) {
        audioElement.addEventListener("timeupdate", handleTimeUpdate)
        audioElement.addEventListener("loadedmetadata", handleLoadedMetadata)
        // 清理时移除事件监听
        return () => {
          audioElement.removeEventListener("timeupdate", handleTimeUpdate)
          audioElement.removeEventListener("loadedmetadata", handleLoadedMetadata)
        }
      }
    }, [audioRef.current, audioDuration])

    // 监听开场白音频进度
    useEffect(() => {
      const handleTimeUpdate = () => {
        if (welcomeAudioRef.current) {
          setWelcomeCurrentTime(welcomeAudioRef.current.currentTime)
          const progressValue = (welcomeAudioRef.current.currentTime / welcomeAudioDuration) * 100
          setWelcomeProgress(progressValue)
        }
      }

      const handleLoadedMetadata = () => {
        if (welcomeAudioRef.current) {
          setWelcomeAudioDuration(welcomeAudioRef.current.duration)
        }
      }

      const handleAudioEnded = () => {
        setWelcomeIsPlaying(false)
        setWelcomeProgress(100)
      }

      const audioElement = welcomeAudioRef.current
      if (audioElement) {
        audioElement.addEventListener("timeupdate", handleTimeUpdate)
        audioElement.addEventListener("loadedmetadata", handleLoadedMetadata)
        audioElement.addEventListener("ended", handleAudioEnded)
        // 清理时移除事件监听
        return () => {
          audioElement.removeEventListener("timeupdate", handleTimeUpdate)
          audioElement.removeEventListener("loadedmetadata", handleLoadedMetadata)
          audioElement.removeEventListener("ended", handleAudioEnded)
        }
      }
    }, [welcomeAudioRef.current, welcomeAudioDuration])

    // 处理语音合成
    const handleSynthesis = async () => {
      try {
        const values = form.getFieldsValue()
        const { synthesisText, timbreCode, audioFormat, sampleRate, speed, volume } = values

        // 验证必填参数
        if (!agentDetail?.agentNo) {
          message.warning("缺少agentNo，无法进行语音合成")
          return
        }

        if (!timbreCode) {
          message.warning("请先在声音设置中选择音色")
          return
        }

        if (!synthesisText) {
          message.warning("请输入要合成的文本")
          return
        }

        // if (!audioFormat) {
        //   message.warning("请先在声音设置中选择录音格式")
        //   return
        // }

        // if (!sampleRate) {
        //   message.warning("请先在声音设置中选择音频采样率")
        //   return
        // }

        // if (speed === null || speed === undefined) {
        //   message.warning("请先在声音设置中设置音频速率")
        //   return
        // }

        // if (volume === null || volume === undefined) {
        //   message.warning("请先在声音设置中设置音量")
        //   return
        // }

        setSynthesizing(true)
        setAudioUrl("") // 重置之前的音频

        const params = {
          botNo: currentBotNo,
          content: synthesisText,
          timbreCode: timbreCode,
          agentNo: agentDetail.agentNo,
          audioFormat: audioFormat,
          sampleRate: sampleRate,
          speed: speed,
          volume: volume
        }

        const res = await synthesisVoice(params)

        if (res && res.status === 200) {
          if (res.data) {
            message.success("语音合成成功")
            setAudioUrl(res.data)
            setProgress(0)
            setCurrentTime(0)
            setIsPlaying(false) // 重置播放状态
          } else {
            message.error("语音合成失败，未能获取到有效的音频文件。")
          }
        } else {
          message.error(res?.message || "语音合成失败")
        }
      } catch (error) {
        console.error("语音合成失败:", error)
        message.error("语音合成失败")
      } finally {
        setSynthesizing(false)
      }
    }

    // 播放或暂停音频
    const togglePlay = () => {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause()
        } else {
          audioRef.current.play()
        }
        setIsPlaying(!isPlaying)
      }
    }

    // 音频播放结束时的处理函数
    const handleAudioEnded = () => {
      setIsPlaying(false)
      setProgress(100)
    }

    // 格式化时间为 mm:ss 格式
    const formatTime = (time) => {
      if (isNaN(time) || time === 0) return "00:00"
      const minutes = Math.floor(time / 60)
      const seconds = Math.floor(time % 60)
      return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }

    // 处理进度条点击事件
    const handleProgressClick = (e) => {
      if (audioRef.current && audioDuration) {
        const progressBar = e.currentTarget
        const rect = progressBar.getBoundingClientRect()
        const offsetX = e.clientX - rect.left
        const newProgress = (offsetX / progressBar.offsetWidth) * 100
        const newTime = (newProgress / 100) * audioDuration

        audioRef.current.currentTime = newTime
        setProgress(newProgress)
        setCurrentTime(newTime)
      }
    }

    // 根据 voiceDetail 动态生成话术语音数据
    const voiceScriptData = voiceDetail?.scriptInfo
      ? [
          {
            key: "1",
            updateTime: voiceDetail.scriptInfo.dataTime || "--",
            nodeCount: voiceDetail.scriptInfo.count || 0,
            operation: voiceDetail.scriptInfo.count === 0 ? "编辑" : "查看"
          }
        ]
      : []

    // 话术语音表格列配置
    const voiceScriptColumns = [
      {
        title: "更新时间",
        dataIndex: "updateTime",
        key: "updateTime"
      },
      {
        title: "话术数量",
        dataIndex: "nodeCount",
        key: "nodeCount"
      },
      {
        title: "操作",
        dataIndex: "operation",
        key: "operation",
        width: 100,
        render: (text, record) => (
          <Button type="link" size="small" onClick={handleScriptNavigation}>
            {text}
          </Button>
        )
      }
    ]

    // 处理话术跳转
    const handleScriptNavigation = () => {
      if (taskId) {
        navigate(`/voice/scriptManage?id=${taskId}&botNo=${currentBotNo}`)
      } else {
        message.error("缺少必要参数，无法跳转")
      }
    }

    const [channelConfigError, setChannelConfigError] = useState(false)

    const ccConfigsEmpty = (form.getFieldValue("ccConfigs") || []).length === 0
    const variableConfigsEmpty = (form.getFieldValue("variableConfigs") || []).length === 0

    // 计算话术语音是否为空
    const voiceScriptEmpty = !voiceDetail?.scriptInfo || !voiceDetail.scriptInfo.count
    // 计算音色是否为空
    const timbreCodeEmpty = !form.getFieldValue("timbreCode")
    // 计算工作流是否全部为空
    const skillsEmpty = !form.getFieldValue("agentPreSkillNo")
    const isEditing = voiceDetail?.flywheelInfo?.status == 1

    return (
      <div>
        <div className="text-[14px] text-[#181B25] font-[500] mb-[20px]">语音设置</div>

        <Spin spinning={voiceDetailsLoading} tip="正在加载声音设置...">
          <Form
            disabled={isOnlyRead}
            form={form}
            layout="vertical"
            initialValues={{
              audioFormat: "wav",
              sampleRate: 8000,
              speed: 1.05,
              volume: 50,
              redisExpireTime: 86400,
              taskProcessRateFlag: false,
              variableConfigs: [],
              ccConfigs: [],
              robotStrategy: "merge",
              crossCallScriptTag: "0",
              welcomeScriptDetails: {
                name: undefined,
                scriptId: undefined,
                content: undefined,
                variable: 0,
                // 有变量时的音频设置
                audioFormat: "wav",
                sampleRate: 8000,
                speed: 1.05,
                volume: 50,
                synthesisText: "",
                // 无变量时的录音设置
                scriptVoices: []
              },
              flywheelInfo: {
                status: 2
              }
            }}
            onFieldsChange={handleFormChange}
          >
            {/* 话术语音 */}
            {/* <div className="mb-4">
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center gap-[4px] cursor-pointer group w-full"
                  onClick={() =>
                    setVoiceCollapsedState({
                      ...voiceCollapsedState,
                      voiceScript: !voiceCollapsedState.voiceScript
                    })
                  }
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-[6px]">
                      <i
                        className={`text-[16px] text-[#475467] iconfont icon-Up transition-transform duration-300 group-hover:text-[#7f56d9] ${
                          voiceCollapsedState.voiceScript ? "rotate-90" : "rotate-180"
                        }`}
                      ></i>
                      <span className="text-[14px] text-[#475467] font-[500] group-hover:text-[#7f56d9]">
                        话术语音
                      </span>
                      {voiceScriptEmpty && (
                        <Tag color="red" bordered={false} className="ml-2">
                          空
                        </Tag>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div
                className={`transition-all duration-300 origin-top ${
                  voiceCollapsedState.voiceScript
                    ? "transform scale-y-0 h-0 opacity-0"
                    : "transform scale-y-100 opacity-100"
                }`}
              >
                <div className="mt-3">
                  <Table
                    columns={voiceScriptColumns}
                    dataSource={voiceScriptData}
                    pagination={false}
                    size="small"
                    className="mb-4"
                  />
                </div>
              </div>
            </div> */}

            {/* 开场白 */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center gap-[4px] cursor-pointer group w-full"
                  onClick={() =>
                    setVoiceCollapsedState({
                      ...voiceCollapsedState,
                      welcome: !voiceCollapsedState.welcome
                    })
                  }
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-[6px]">
                      <i
                        className={`text-[16px] text-[#475467] iconfont icon-Up transition-transform duration-300 group-hover:text-[#7f56d9] ${
                          voiceCollapsedState.welcome ? "rotate-90" : "rotate-180"
                        }`}
                      ></i>
                      <span className="text-[14px] text-[#475467] font-[500] group-hover:text-[#7f56d9]">
                        开场白
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className={`transition-all duration-300 origin-top ${
                  voiceCollapsedState.welcome
                    ? "transform scale-y-0 h-0 opacity-0"
                    : "transform scale-y-100 opacity-100 px-2 bg-gray-50 rounded-md mt-1"
                }`}
                onMouseLeave={() => handleSectionMouseLeave("welcome")}
              >
                <div className="mt-3 space-y-2 py-2">
                  {/* 依赖timbreCode字段来实时更新UI */}
                  <Form.Item dependencies={["timbreCode"]}>
                    {({ getFieldValue }) => {
                      const timbreCode = getFieldValue("timbreCode")

                      return (
                        <>
                          {/* 音色未选择时的提示 */}
                          {!timbreCode && (
                            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
                              <div className="flex items-center">
                                <i className="iconfont icon-warning text-red-500 mr-2"></i>
                                <span className="text-red-600 text-sm">
                                  请先去【声音设置】里面选择音色
                                </span>
                              </div>
                            </div>
                          )}

                          <Form.Item
                            name={["welcomeScriptDetails", "scriptId"]}
                            label="话术名称"
                            className="mb-2"
                          >
                            <ScriptSelector
                              placeholder={!timbreCode ? "请先选择音色" : "请选择话术"}
                              botNo={currentBotNo}
                              taskId={taskId}
                              timbreCode={timbreCode}
                              onChange={handleWelcomeScriptChange}
                              onScriptDetailChange={handleScriptDetailChange}
                              disabled={isOnlyRead || !timbreCode}
                            />
                          </Form.Item>
                        </>
                      )
                    }}
                  </Form.Item>

                  {/* 话术内容展示 */}
                  <Form.Item
                    dependencies={[
                      ["welcomeScriptDetails", "scriptId"],
                      ["welcomeScriptDetails", "content"]
                    ]}
                  >
                    {({ getFieldValue }) => {
                      const selectedScriptId = getFieldValue(["welcomeScriptDetails", "scriptId"])
                      const scriptContent = getFieldValue(["welcomeScriptDetails", "content"])

                      if (!selectedScriptId) {
                        return (
                          <div className="text-gray-400 text-sm bg-gray-50 p-3 rounded">
                            请先选择话术名称
                          </div>
                        )
                      }

                      if (!scriptContent) {
                        return (
                          <div className="text-gray-400 text-sm bg-gray-50 p-3 rounded">
                            暂无话术内容
                          </div>
                        )
                      }

                      return (
                        <div className="bg-gray-50 rounded">
                          <Tooltip title={scriptContent} placement="topLeft">
                            <div
                              className="text-sm text-gray-700 truncate cursor-help"
                              style={{ maxWidth: "100%" }}
                            >
                              {scriptContent}
                            </div>
                          </Tooltip>
                        </div>
                      )
                    }}
                  </Form.Item>

                  {/* 是否有变量选择器 */}
                  {/* <Form.Item
                    name={["welcomeScriptDetails", "variable"]}
                    label="是否有变量"
                    rules={[{ required: true, message: "请选择是否有变量" }]}
                    className={`${styles.customRadioGroup}`}
                  >
                    <Radio.Group disabled>
                      <Radio value={1}>有</Radio>
                      <Radio value={0}>无</Radio>
                    </Radio.Group>
                  </Form.Item> */}

                  {/* 根据 variable 字段动态显示不同内容 */}
                  <Form.Item
                    dependencies={[
                      ["welcomeScriptDetails", "variable"],
                      ["welcomeScriptDetails", "scriptId"]
                    ]}
                  >
                    {({ getFieldValue }) => {
                      const hasVariable = getFieldValue(["welcomeScriptDetails", "variable"])
                      const currentScriptId = getFieldValue(["welcomeScriptDetails", "scriptId"])

                      if (!currentScriptId) {
                        return null
                      }

                      if (hasVariable === 1) {
                        // TODO 暂时只显示试听 文本和按钮
                        return (
                          <div>
                            <Row gutter={16}>
                              <Col span={24}>
                                <Form.Item
                                  name={["welcomeScriptDetails", "synthesisText"]}
                                  label="试听"
                                >
                                  <Input.TextArea
                                    placeholder="请输入要合成试听的文本"
                                    rows={3}
                                    className="flex-1 mr-2"
                                  />
                                </Form.Item>
                                <div className="text-left">
                                  <Button
                                    icon={<i className="iconfont icon-zhinengyouhua"></i>}
                                    onClick={() => {
                                      const synthesisText = form.getFieldValue([
                                        "welcomeScriptDetails",
                                        "synthesisText"
                                      ])
                                      handleWelcomeSynthesis(synthesisText)
                                    }}
                                    loading={welcomeSynthesizing}
                                    style={{
                                      background:
                                        "linear-gradient(83.59deg, #E9E8FF 6.73%, #EEC7FF 131.73%)",
                                      color: "#7F56D9"
                                    }}
                                  >
                                    合成试听
                                  </Button>
                                </div>
                              </Col>
                            </Row>

                            {/* 音频播放器 */}
                            {welcomeAudioUrl && (
                              <div className="mt-3 bg-gray-100 p-3 rounded-md">
                                <div className="flex items-center mb-2">
                                  <div className="mr-2 flex items-center justify-center w-9 h-9 bg-orange-500 p-1 text-white rounded-md">
                                    <span className="text-xs font-bold">MP3</span>
                                  </div>
                                  <div className="flex-1 text-sm font-medium text-gray-700 truncate">
                                    已生成语音文件
                                  </div>
                                  {welcomeIsPlaying ? (
                                    <PauseCircleOutlined
                                      className="text-2xl text-[#7F56D9] cursor-pointer"
                                      onClick={toggleWelcomePlay}
                                    />
                                  ) : (
                                    <PlayCircleOutlined
                                      className="text-2xl text-[#7F56D9] cursor-pointer"
                                      onClick={toggleWelcomePlay}
                                    />
                                  )}
                                </div>

                                <div className="flex items-center">
                                  <div className="text-xs text-gray-500 mr-2">
                                    {formatTime(welcomeCurrentTime)}
                                  </div>
                                  <div
                                    className="flex-1 bg-gray-200 h-1 rounded cursor-pointer relative overflow-hidden"
                                    onClick={handleWelcomeProgressClick}
                                  >
                                    <div
                                      className="absolute h-full bg-[#7F56D9] rounded-lg"
                                      style={{ width: `${welcomeProgress}%` }}
                                    ></div>
                                  </div>
                                  <div className="text-xs text-gray-500 ml-2">
                                    {formatTime(welcomeAudioDuration)}
                                  </div>
                                </div>

                                {/* 隐藏的音频元素 */}
                                <audio
                                  ref={welcomeAudioRef}
                                  src={welcomeAudioUrl}
                                  style={{ display: "none" }}
                                />
                              </div>
                            )}
                          </div>
                        )
                        // 有变量时显示声音设置
                        // eslint-disable-next-line no-unreachable
                        return (
                          <div className="mt-4">
                            {/* 音色 */}
                            <Row gutter={24}>
                              <Col span={24}>
                                <Form.Item label="音色">
                                  <Tooltip
                                    title={(() => {
                                      const timbreName = form.getFieldValue("timbreName")
                                      const timbreModel =
                                        form.getFieldValue("timbreModel") ||
                                        form.getFieldValue("timbreCode")
                                      if (timbreName && timbreModel) {
                                        return `${timbreName} - ${timbreModel}`
                                      }
                                      return timbreName || "默认音色"
                                    })()}
                                  >
                                    <div className="px-3 h-[36px] pt-[6px] bg-gray-50 border border-gray-200 rounded-[8px] text-gray-600 truncate cursor-default">
                                      {(() => {
                                        const timbreName = form.getFieldValue("timbreName")
                                        const timbreModel =
                                          form.getFieldValue("timbreModel") ||
                                          form.getFieldValue("timbreCode")
                                        if (timbreName && timbreModel) {
                                          return `${timbreName} - ${timbreModel}`
                                        }
                                        return timbreName || "默认音色"
                                      })()}
                                    </div>
                                  </Tooltip>
                                </Form.Item>
                              </Col>
                            </Row>

                            {/* 录音格式 */}
                            <Row gutter={24}>
                              <Col span={24}>
                                <Form.Item
                                  name={["welcomeScriptDetails", "audioFormat"]}
                                  label="录音格式"
                                  rules={[{ required: true, message: "请选择录音格式" }]}
                                >
                                  <Select placeholder="请选择" allowClear>
                                    <Option value="mp3">mp3</Option>
                                    <Option value="wav">wav</Option>
                                    <Option value="pcm">pcm</Option>
                                  </Select>
                                </Form.Item>
                              </Col>
                            </Row>

                            {/* 音频采样率 */}
                            <Row gutter={24}>
                              <Col span={24}>
                                <Form.Item
                                  name={["welcomeScriptDetails", "sampleRate"]}
                                  label="音频采样率"
                                  rules={[{ required: true, message: "请选择音频采样率" }]}
                                >
                                  <Select placeholder="请选择" allowClear>
                                    <Option value={8000}>8000 Hz</Option>
                                    <Option value={16000}>16000 Hz</Option>
                                    <Option value={32000}>32000 Hz</Option>
                                  </Select>
                                </Form.Item>
                              </Col>
                            </Row>

                            {/* 音频速率 */}
                            <Row gutter={24}>
                              <Col span={24}>
                                <Form.Item label="音频速率" required>
                                  <div className="flex items-center">
                                    <Form.Item
                                      name={["welcomeScriptDetails", "speed"]}
                                      noStyle
                                      rules={[{ required: true, message: "请设置音频速率" }]}
                                    >
                                      <Slider
                                        min={0.6}
                                        max={2.5}
                                        step={0.01}
                                        className="flex-1 mr-4"
                                      />
                                    </Form.Item>
                                    <Form.Item
                                      name={["welcomeScriptDetails", "speed"]}
                                      noStyle
                                      rules={[{ required: true, message: "请设置音频速率" }]}
                                    >
                                      <InputNumber
                                        min={0.6}
                                        max={2.5}
                                        step={0.01}
                                        precision={2}
                                        style={{ width: "80px" }}
                                        allowClear
                                      />
                                    </Form.Item>
                                  </div>
                                </Form.Item>
                              </Col>
                            </Row>

                            {/* 音量 */}
                            <Row gutter={24}>
                              <Col span={24}>
                                <Form.Item label="音量" required>
                                  <div className="flex items-center">
                                    <Form.Item
                                      name={["welcomeScriptDetails", "volume"]}
                                      noStyle
                                      rules={[{ required: true, message: "请设置音量" }]}
                                    >
                                      <Slider min={0} max={100} step={1} className="flex-1 mr-4" />
                                    </Form.Item>
                                    <Form.Item
                                      name={["welcomeScriptDetails", "volume"]}
                                      noStyle
                                      rules={[{ required: true, message: "请设置音量" }]}
                                    >
                                      <InputNumber
                                        min={0}
                                        max={100}
                                        step={1}
                                        precision={0}
                                        style={{ width: "70px" }}
                                        allowClear
                                      />
                                    </Form.Item>
                                  </div>
                                </Form.Item>
                              </Col>
                            </Row>

                            {/* 试听功能 */}
                            <div>
                              <Row gutter={16}>
                                <Col span={24}>
                                  <Form.Item
                                    name={["welcomeScriptDetails", "synthesisText"]}
                                    label="试听"
                                  >
                                    <Input.TextArea
                                      placeholder="请输入要合成试听的文本"
                                      rows={3}
                                      className="flex-1 mr-2"
                                    />
                                  </Form.Item>
                                  <div className="text-left">
                                    <Button
                                      icon={<i className="iconfont icon-zhinengyouhua"></i>}
                                      onClick={() => {
                                        const synthesisText = form.getFieldValue([
                                          "welcomeScriptDetails",
                                          "synthesisText"
                                        ])
                                        handleWelcomeSynthesis(synthesisText)
                                      }}
                                      loading={welcomeSynthesizing}
                                      style={{
                                        background:
                                          "linear-gradient(83.59deg, #E9E8FF 6.73%, #EEC7FF 131.73%)",
                                        color: "#7F56D9"
                                      }}
                                    >
                                      合成试听
                                    </Button>
                                  </div>
                                </Col>
                              </Row>

                              {/* 音频播放器 */}
                              {welcomeAudioUrl && (
                                <div className="mt-3 bg-gray-100 p-3 rounded-md">
                                  <div className="flex items-center mb-2">
                                    <div className="mr-2 flex items-center justify-center w-9 h-9 bg-orange-500 p-1 text-white rounded-md">
                                      <span className="text-xs font-bold">MP3</span>
                                    </div>
                                    <div className="flex-1 text-sm font-medium text-gray-700 truncate">
                                      已生成语音文件
                                    </div>
                                    {welcomeIsPlaying ? (
                                      <PauseCircleOutlined
                                        className="text-2xl text-[#7F56D9] cursor-pointer"
                                        onClick={toggleWelcomePlay}
                                      />
                                    ) : (
                                      <PlayCircleOutlined
                                        className="text-2xl text-[#7F56D9] cursor-pointer"
                                        onClick={toggleWelcomePlay}
                                      />
                                    )}
                                  </div>

                                  <div className="flex items-center">
                                    <div className="text-xs text-gray-500 mr-2">
                                      {formatTime(welcomeCurrentTime)}
                                    </div>
                                    <div
                                      className="flex-1 bg-gray-200 h-1 rounded cursor-pointer relative overflow-hidden"
                                      onClick={handleWelcomeProgressClick}
                                    >
                                      <div
                                        className="absolute h-full bg-[#7F56D9] rounded-lg"
                                        style={{ width: `${welcomeProgress}%` }}
                                      ></div>
                                    </div>
                                    <div className="text-xs text-gray-500 ml-2">
                                      {formatTime(welcomeAudioDuration)}
                                    </div>
                                  </div>

                                  {/* 隐藏的音频元素 */}
                                  <audio
                                    ref={welcomeAudioRef}
                                    src={welcomeAudioUrl}
                                    style={{ display: "none" }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      } else if (hasVariable === 0) {
                        // 无变量时显示录音上传功能
                        return (
                          <div className="w-full mt-4">
                            <Form.List name={["welcomeScriptDetails", "scriptVoices"]}>
                              {(fields, { add, remove }) => {
                                // 如果没有录音项，自动添加一个
                                if (fields.length === 0) {
                                  add()
                                }

                                return (
                                  <div>
                                    {fields.map((field, index) => (
                                      <div className="border p-2 pr-4 border-gray-100 rounded-md mb-2">
                                        <RecordingItem
                                          key={field.key}
                                          form={form}
                                          fieldName={[
                                            "welcomeScriptDetails",
                                            "scriptVoices",
                                            field.name
                                          ]}
                                          restField={field}
                                          timbreOptions={[]}
                                          timbreLoading={false}
                                          playingAudio={playingAudio}
                                          setPlayingAudio={setPlayingAudio}
                                          audioProgress={audioProgress}
                                          setAudioProgress={setAudioProgress}
                                          audioDuration={recordingAudioDuration}
                                          setAudioDuration={setRecordingAudioDuration}
                                          audioRefs={recordingAudioRefs}
                                          uploadMode="api"
                                          botNo={currentBotNo}
                                          scriptId={currentScriptId}
                                          defaultTimbreCode={form.getFieldValue("timbreCode")}
                                          defaultTimbreName={form.getFieldValue("timbreName")}
                                          defaultTimbreModel={form.getFieldValue("timbreModel")}
                                          disableTimbreSelect={true}
                                          onRemove={() => remove(field.name)}
                                          showRemove={fields.length > 1}
                                        />
                                      </div>
                                    ))}
                                    {/* <div className="flex justify-start">
                                      <Button
                                        type="link"
                                        onClick={() => add()}
                                        icon={<PlusOutlined />}
                                        className="mt-2"
                                      >
                                        添加录音
                                      </Button>
                                    </div> */}
                                  </div>
                                )
                              }}
                            </Form.List>
                          </div>
                        )
                      }
                      return null
                    }}
                  </Form.Item>
                </div>
              </div>
            </div>

            {/* 工作流 */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center gap-[4px] cursor-pointer group w-full"
                  onClick={() =>
                    setVoiceCollapsedState({
                      ...voiceCollapsedState,
                      skills: !voiceCollapsedState.skills
                    })
                  }
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-[6px]">
                      <i
                        className={`text-[16px] text-[#475467] iconfont icon-Up transition-transform duration-300 group-hover:text-[#7f56d9] ${
                          voiceCollapsedState.skills ? "rotate-90" : "rotate-180"
                        }`}
                      ></i>
                      <span className="text-[14px] text-[#475467] font-[500] group-hover:text-[#7f56d9]">
                        工作流设置
                      </span>
                      {skillsEmpty && (
                        <Tag color="red" bordered={false} className="ml-2">
                          空
                        </Tag>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div
                className={`transition-all duration-300 origin-top ${
                  voiceCollapsedState.skills
                    ? "transform scale-y-0 h-0 opacity-0"
                    : "transform scale-y-100 opacity-100 px-2 bg-gray-50 rounded-md mt-1"
                }`}
                onMouseLeave={() => handleSectionMouseLeave("skills")}
              >
                <div className="mt-3 space-y-4 py-2">
                  <Form.Item
                    name="agentPreSkillNo"
                    label={
                      <div className="flex items-center justify-between w-[100%]">
                        <span className="flex items-center">
                          预处理工作流
                          <Popconfirm
                            title="确认创建"
                            description="是否智能创建新工作流并应用？"
                            onConfirm={handleCreatePreSkill}
                            okText="确认"
                            cancelText="取消"
                          >
                            <Button
                              size="small"
                              type="link"
                              className="ml-2"
                              loading={createPreSkillLoading}
                            >
                              智能创建
                            </Button>
                          </Popconfirm>
                        </span>

                        {agentPreSkillNo && (
                          <Tooltip title="点击跳转工作流详情">
                            <i
                              className="iconfont icon-View ml-2 text-gray-400 cursor-pointer hover:text-[#7F56D9] absolute -right-[12px]"
                              onClick={() => {
                                reTodoUrlHandel(agentPreSkillNo)
                              }}
                            ></i>
                          </Tooltip>
                        )}
                      </div>
                    }
                    tooltip="Agentic预处理用户信息和业务知识"
                    className="mb-2 relative"
                  >
                    <Select
                      placeholder="请选择预处理工作流"
                      allowClear
                      showSearch
                      onSearch={handleSearch}
                      filterOption={false}
                      options={skills}
                      notFoundContent={<CustomEmpty />}
                    />
                  </Form.Item>
                  <Form.Item
                    name="agentPostposeSkillNo"
                    label={
                      <div className="flex items-center justify-between w-[100%]">
                        <span className="flex items-center">
                          后置处理工作流
                          <Popconfirm
                            title="确认创建"
                            description="是否智能创建新工作流并应用？"
                            onConfirm={handleCreatePostposeSkill}
                            okText="确认"
                            cancelText="取消"
                          >
                            <Button
                              size="small"
                              type="link"
                              className="ml-2"
                              loading={createPostposeSkillLoading}
                            >
                              智能创建
                            </Button>
                          </Popconfirm>
                        </span>

                        {agentPostposeSkillNo && (
                          <Tooltip title="点击跳转工作流详情">
                            <i
                              className="iconfont icon-View ml-2 text-gray-400 cursor-pointer hover:text-[#7F56D9] absolute -right-[12px]"
                              onClick={() => {
                                reTodoUrlHandel(agentPostposeSkillNo)
                              }}
                            ></i>
                          </Tooltip>
                        )}
                      </div>
                    }
                    tooltip="Agentic后置处理是否挂机"
                    className="mb-2 relative"
                  >
                    <Select
                      showSearch
                      placeholder="请选择工作流"
                      onSearch={handleSearch}
                      filterOption={false}
                      options={skills}
                      allowClear
                    />
                  </Form.Item>
                  <Form.Item
                    name="reflectAigcSkillNo"
                    label={
                      <div className="flex items-center justify-between w-[100%]">
                        <span className="flex items-center">垫词工作流关联</span>
                        <Popconfirm
                          title="确认创建"
                          description="是否智能创建新工作流并应用？"
                          onConfirm={handleCreateCushionSkill}
                          okText="确认"
                          cancelText="取消"
                        >
                          <Button
                            size="small"
                            type="link"
                            className="ml-2"
                            loading={createCushionSkillLoading}
                          >
                            智能创建
                          </Button>
                        </Popconfirm>

                        {!!reflectAigcSkillNo && (
                          <Tooltip title="点击跳转工作流详情">
                            <i
                              className="iconfont icon-View ml-2 text-gray-400 cursor-pointer hover:text-[#7F56D9] absolute -right-[12px]"
                              onClick={() => {
                                reTodoUrlHandel(reflectAigcSkillNo)
                              }}
                            ></i>
                          </Tooltip>
                        )}
                      </div>
                    }
                    className="mb-2 relative "
                  >
                    <Select
                      showSearch
                      placeholder="请选择工作流"
                      onSearch={handleSearch}
                      filterOption={false}
                      options={skills}
                      allowClear
                    />
                  </Form.Item>
                  <Form.Item
                    name="reflectAigcEventSkillNo"
                    label={
                      <div className="flex items-center justify-between w-[100%]">
                        <span className="flex items-center">事件处理工作流</span>
                        <Popconfirm
                          title="确认创建"
                          description="是否智能创建新工作流并应用？"
                          onConfirm={handleCreateEventSkill}
                          okText="确认"
                          cancelText="取消"
                        >
                          <Button
                            size="small"
                            type="link"
                            className="ml-2"
                            loading={createEventSkillLoading}
                          >
                            智能创建
                          </Button>
                        </Popconfirm>

                        {reflectAigcEventSkillNo && (
                          <Tooltip title="点击跳转工作流详情">
                            <i
                              className="iconfont icon-View ml-2 text-gray-400 cursor-pointer hover:text-[#7F56D9] absolute -right-[12px]"
                              onClick={() => {
                                reTodoUrlHandel(reflectAigcEventSkillNo)
                              }}
                            ></i>
                          </Tooltip>
                        )}
                      </div>
                    }
                    className="mb-2 relative"
                  >
                    <Select
                      showSearch
                      placeholder="请选择工作流"
                      onSearch={handleSearch}
                      filterOption={false}
                      options={skills}
                      allowClear
                    />
                  </Form.Item>
                  <Form.Item
                    name="intentTagCallSkillNo"
                    label={
                      <div className="flex items-center justify-between w-[100%]">
                        <span className="flex items-center">通话打标工作流</span>
                        <Popconfirm
                          title="确认创建"
                          description="是否智能创建新工作流并应用？"
                          onConfirm={handleCreateTagSkill}
                          okText="确认"
                          cancelText="取消"
                        >
                          <Button
                            size="small"
                            type="link"
                            className="ml-2"
                            loading={createTagSkillLoading}
                          >
                            智能创建
                          </Button>
                        </Popconfirm>

                        {intentTagCallSkillNo && (
                          <Tooltip title="点击跳转工作流详情">
                            <i
                              className="iconfont icon-View ml-2 text-gray-400 cursor-pointer hover:text-[#7F56D9] absolute -right-[12px]"
                              onClick={() => {
                                reTodoUrlHandel(intentTagCallSkillNo)
                              }}
                            ></i>
                          </Tooltip>
                        )}
                      </div>
                    }
                    className="mb-2 relative "
                  >
                    <Select
                      showSearch
                      placeholder="请选择工作流"
                      onSearch={handleSearch}
                      filterOption={false}
                      options={skills}
                      allowClear
                    />
                  </Form.Item>
                  <Form.Item
                    name="reflectErrOverNum"
                    label="报错兜底次数"
                    tooltip="调用灵犀工作流超时或者报错，外呼兜底工作流处理次数，超过这个次数就会直接挂机"
                    className="mb-2"
                  >
                    <InputNumber
                      placeholder="请输入"
                      className="w-full"
                      addonAfter="次"
                      allowClear
                    />
                  </Form.Item>
                </div>
              </div>
            </div>

            {/* 模型区域 */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center gap-[4px] cursor-pointer group w-full"
                  onClick={() =>
                    setVoiceCollapsedState({
                      ...voiceCollapsedState,
                      model: !voiceCollapsedState.model
                    })
                  }
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-[6px]">
                      <i
                        className={`text-[16px] text-[#475467] iconfont icon-Up transition-transform duration-300 group-hover:text-[#7f56d9] ${
                          voiceCollapsedState.model ? "rotate-90" : "rotate-180"
                        }`}
                      ></i>
                      <span className="text-[14px] text-[#475467] font-[500] group-hover:text-[#7f56d9]">
                        模型设置
                      </span>
                      {form.getFieldValue("modelType") ? null : (
                        <Tag color="red" bordered={false}>
                          模型空
                        </Tag>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div
                className={`transition-all duration-300 origin-top ${
                  voiceCollapsedState.model
                    ? "transform scale-y-0 h-0 opacity-0"
                    : "transform scale-y-100 opacity-100 px-2 bg-gray-50 rounded-md mt-1"
                }`}
              >
                <div className="mt-3 py-2">
                  <ModelTypeFormComponent
                    modelOptions={modelOptions}
                    noRequired={true}
                    reasoningEffortOptions={reasoningEffortOptions}
                    targetData={form.getFieldsValue()}
                  />
                  <Form.Item layout="horizontal" name="temperature" label="温度">
                    <Row gutter={[0, 0]}>
                      <Col span={17}>
                        <Form.Item noStyle name="temperature" initialValue={0.7}>
                          <Slider max={2} step={0.01} marks={marks} defaultValue={0.7} />
                        </Form.Item>
                      </Col>

                      <Col span={5}>
                        <Form.Item className="mr-0 pr-0" name="temperature" initialValue={0.7}>
                          <InputNumber
                            style={{ marginLeft: "20px", width: "100%" }}
                            min={0}
                            max={2}
                            step={0.01}
                            precision={2}
                            defaultValue={0.7}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Form.Item>

                  {/* 高级设置 */}
                  <Form.Item
                    layout="horizontal"
                    name="advancedSettingEnable"
                    label="高级设置"
                    valuePropName="checked"
                    initialValue={false}
                    className="-mt-2 mb-1"
                  >
                    <Switch size="small" />
                  </Form.Item>

                  <Form.Item
                    noStyle
                    shouldUpdate={(prev, curr) =>
                      prev.advancedSettingEnable !== curr.advancedSettingEnable
                    }
                  >
                    {({ getFieldValue }) => {
                      const advancedSettingEnable = getFieldValue("advancedSettingEnable")

                      if (!advancedSettingEnable) return null

                      return (
                        <div className="bg-gray-100 p-2 rounded-md w-full mb-4">
                          {/* Top K 设置 */}
                          <Row gutter={10} align="middle">
                            <Col span={24} className="-mb-4">
                              <Form.Item
                                name="topKEnable"
                                valuePropName="checked"
                                initialValue={false}
                                style={{ margin: 0 }}
                              >
                                <Switch size="small" />
                              </Form.Item>
                            </Col>
                            <Col span={8} className="text-left">
                              <span className="text-[12px]">
                                Top K
                                <Tooltip title="生成时，采样候选集的大小。例如，取值为 50 时，仅将单词生成中得分最高的 50 个 token 组成随机采样的候选集。取值越大，生成的随机性越高；取值越小，生成的确定性越高">
                                  <InfoIcon className="ml-1" />
                                </Tooltip>
                              </span>
                            </Col>
                            <Col span={10}>
                              <Form.Item
                                noStyle
                                shouldUpdate={(prev, curr) => prev.topKEnable !== curr.topKEnable}
                              >
                                {({ getFieldValue, getFieldError }) => {
                                  const topKEnable = getFieldValue("topKEnable")
                                  const fieldError = getFieldError("topK")
                                  const hasError = topKEnable && fieldError?.length > 0

                                  return (
                                    <div style={{ display: "flex", alignItems: "center" }}>
                                      <Form.Item
                                        name="topK"
                                        initialValue={0}
                                        style={{ margin: 0, flex: 1 }}
                                        help={false}
                                        hasFeedback={false}
                                        rules={[
                                          {
                                            required: topKEnable,
                                            message: "请设置Top K值"
                                          }
                                        ]}
                                      >
                                        <Slider
                                          max={99}
                                          min={0}
                                          step={1}
                                          disabled={isOnlyRead || !topKEnable}
                                          marks={{
                                            0: "0",
                                            50: "50",
                                            99: "99"
                                          }}
                                        />
                                      </Form.Item>
                                      {hasError && (
                                        <Tooltip title={fieldError[0]} placement="top">
                                          <ExclamationCircleOutlined
                                            style={{
                                              color: "#ff4d4f",
                                              marginLeft: "8px",
                                              cursor: "pointer"
                                            }}
                                          />
                                        </Tooltip>
                                      )}
                                    </div>
                                  )
                                }}
                              </Form.Item>
                            </Col>
                            <Col span={6}>
                              <Form.Item
                                noStyle
                                shouldUpdate={(prev, curr) => prev.topKEnable !== curr.topKEnable}
                              >
                                {({ getFieldValue, getFieldError }) => {
                                  const topKEnable = getFieldValue("topKEnable")
                                  const fieldError = getFieldError("topK")
                                  const hasError = topKEnable && fieldError?.length > 0

                                  return (
                                    <div style={{ display: "flex", alignItems: "center" }}>
                                      <Form.Item
                                        name="topK"
                                        initialValue={0}
                                        style={{ margin: 0, flex: 1 }}
                                        help={false}
                                        hasFeedback={false}
                                        rules={[
                                          {
                                            required: topKEnable,
                                            message: "请设置Top K值"
                                          }
                                        ]}
                                      >
                                        <InputNumber
                                          min={0}
                                          max={99}
                                          step={1}
                                          precision={0}
                                          disabled={isOnlyRead || !topKEnable}
                                          style={{ width: "100%" }}
                                        />
                                      </Form.Item>
                                      {hasError && (
                                        <Tooltip title={fieldError[0]} placement="top">
                                          <ExclamationCircleOutlined
                                            style={{
                                              color: "#ff4d4f",
                                              marginLeft: "8px",
                                              cursor: "pointer"
                                            }}
                                          />
                                        </Tooltip>
                                      )}
                                    </div>
                                  )
                                }}
                              </Form.Item>
                            </Col>
                          </Row>

                          <div className="w-full h-[1px] bg-gray-200 my-1"> </div>

                          {/* Top P 设置 */}
                          <Row gutter={10} align="middle" style={{ marginBottom: "10px" }}>
                            <Col span={24} className="-mb-4">
                              <Form.Item
                                name="topPEnable"
                                valuePropName="checked"
                                initialValue={false}
                                style={{ margin: 0 }}
                              >
                                <Switch size="small" />
                              </Form.Item>
                            </Col>
                            <Col span={8} className="text-left">
                              <span className="text-[12px]">
                                Top P
                                <Tooltip title="生成过程中核采样方法概率阈值，例如，取值为0.8时，仅保留概率加起来大于等于0.8的最可能token的最小集合作为候选集。取值越大，生成的随机性越高；取值越低，生成的确定性越高">
                                  <InfoIcon className="ml-1" />
                                </Tooltip>
                              </span>
                            </Col>
                            <Col span={10}>
                              <Form.Item
                                noStyle
                                shouldUpdate={(prev, curr) => prev.topPEnable !== curr.topPEnable}
                              >
                                {({ getFieldValue, getFieldError }) => {
                                  const topPEnable = getFieldValue("topPEnable")
                                  const fieldError = getFieldError("topP")
                                  const hasError = topPEnable && fieldError?.length > 0

                                  return (
                                    <div style={{ display: "flex", alignItems: "center" }}>
                                      <Form.Item
                                        name="topP"
                                        initialValue={0.7}
                                        style={{ margin: 0, flex: 1 }}
                                        help={false}
                                        hasFeedback={false}
                                        rules={[
                                          {
                                            required: topPEnable,
                                            message: "请设置Top P值"
                                          }
                                        ]}
                                      >
                                        <Slider
                                          max={0.9}
                                          min={0.01}
                                          step={0.01}
                                          disabled={isOnlyRead || !topPEnable}
                                          marks={{
                                            0.01: "0.01",
                                            0.7: "0.7",
                                            0.9: "0.9"
                                          }}
                                        />
                                      </Form.Item>
                                      {hasError && (
                                        <Tooltip title={fieldError[0]} placement="top">
                                          <ExclamationCircleOutlined
                                            style={{
                                              color: "#ff4d4f",
                                              marginLeft: "8px",
                                              cursor: "pointer"
                                            }}
                                          />
                                        </Tooltip>
                                      )}
                                    </div>
                                  )
                                }}
                              </Form.Item>
                            </Col>
                            <Col span={6}>
                              <Form.Item
                                noStyle
                                shouldUpdate={(prev, curr) => prev.topPEnable !== curr.topPEnable}
                              >
                                {({ getFieldValue, getFieldError }) => {
                                  const topPEnable = getFieldValue("topPEnable")
                                  const fieldError = getFieldError("topP")
                                  const hasError = topPEnable && fieldError?.length > 0

                                  return (
                                    <div style={{ display: "flex", alignItems: "center" }}>
                                      <Form.Item
                                        name="topP"
                                        initialValue={0.7}
                                        style={{ margin: 0, flex: 1 }}
                                        help={false}
                                        hasFeedback={false}
                                        rules={[
                                          {
                                            required: topPEnable,
                                            message: "请设置Top P值"
                                          }
                                        ]}
                                      >
                                        <InputNumber
                                          min={0.01}
                                          max={0.9}
                                          step={0.01}
                                          precision={2}
                                          disabled={isOnlyRead || !topPEnable}
                                          style={{ width: "100%" }}
                                        />
                                      </Form.Item>
                                      {hasError && (
                                        <Tooltip title={fieldError[0]} placement="top">
                                          <ExclamationCircleOutlined
                                            style={{
                                              color: "#ff4d4f",
                                              marginLeft: "8px",
                                              cursor: "pointer"
                                            }}
                                          />
                                        </Tooltip>
                                      )}
                                    </div>
                                  )
                                }}
                              </Form.Item>
                            </Col>
                          </Row>

                          <div className="w-full h-[1px] bg-gray-200 my-1"> </div>

                          {/* Max Token 设置 */}
                          <Row gutter={10} align="middle" style={{ marginBottom: "10px" }}>
                            <Col span={24} className="-mb-2">
                              <Form.Item
                                name="maxTokenEnable"
                                valuePropName="checked"
                                initialValue={false}
                                style={{ margin: 0 }}
                              >
                                <Switch size="small" />
                              </Form.Item>
                            </Col>
                            <Col span={8} className="text-left">
                              <span className="text-[12px]">
                                Max Token
                                <Tooltip title="用于指定模型在生成内容时token的最大数量，它定义了生成的上限，但不保证每次都会生成到这个数量">
                                  <InfoIcon className="ml-1" />
                                </Tooltip>
                              </span>
                            </Col>
                            <Col span={16}>
                              <Form.Item
                                noStyle
                                shouldUpdate={(prev, curr) =>
                                  prev.maxTokenEnable !== curr.maxTokenEnable
                                }
                              >
                                {({ getFieldValue, getFieldError }) => {
                                  const maxTokenEnable = getFieldValue("maxTokenEnable")
                                  const fieldError = getFieldError("maxToken")
                                  const hasError = maxTokenEnable && fieldError?.length > 0

                                  return (
                                    <div style={{ display: "flex", alignItems: "center" }}>
                                      <Form.Item
                                        name="maxToken"
                                        initialValue={undefined}
                                        style={{ margin: 0, flex: 1 }}
                                        help={false}
                                        hasFeedback={false}
                                        rules={[
                                          {
                                            required: maxTokenEnable,
                                            message: "请设置Max Token值"
                                          },
                                          {
                                            validator: (_, value) => {
                                              if (maxTokenEnable && (!value || value <= 0)) {
                                                return Promise.reject(
                                                  new Error("Max Token值必须大于0")
                                                )
                                              }
                                              return Promise.resolve()
                                            }
                                          }
                                        ]}
                                      >
                                        <InputNumber
                                          min={1}
                                          step={1}
                                          disabled={isOnlyRead || !maxTokenEnable}
                                          style={{ width: "100%" }}
                                          placeholder="请输入最大标记数"
                                        />
                                      </Form.Item>
                                      {hasError && (
                                        <Tooltip title={fieldError[0]} placement="top">
                                          <ExclamationCircleOutlined
                                            style={{
                                              color: "#ff4d4f",
                                              marginLeft: "8px",
                                              cursor: "pointer"
                                            }}
                                          />
                                        </Tooltip>
                                      )}
                                    </div>
                                  )
                                }}
                              </Form.Item>
                            </Col>
                          </Row>

                          <div className="w-full h-[1px] bg-gray-200 my-1"> </div>

                          {/* Seed 设置 */}
                          <Row gutter={10} align="middle" style={{ marginBottom: "10px" }}>
                            <Col span={24} className="-mb-2">
                              <Form.Item noStyle shouldUpdate={() => false}>
                                {({ setFieldsValue }) => (
                                  <Form.Item
                                    name="seedEnable"
                                    valuePropName="checked"
                                    initialValue={false}
                                    style={{ margin: 0 }}
                                  >
                                    <Switch
                                      size="small"
                                      onChange={(checked) =>
                                        setFieldsValue({
                                          seed: checked ? generateRandomNumber() : undefined
                                        })
                                      }
                                    />
                                  </Form.Item>
                                )}
                              </Form.Item>
                            </Col>

                            <Col span={8} className="text-left ">
                              <span className="text-[12px] ">
                                Seed
                                <Tooltip title="生成时使用的随机数种子，用于控制模型生成内容的随机性。在使用seed时，模型将尽可能生成相同或相似的结果，但目前不保证每次生成的结果完全相同">
                                  <InfoIcon className="ml-1" />
                                </Tooltip>
                              </span>
                            </Col>
                            <Col span={16}>
                              <Form.Item
                                noStyle
                                shouldUpdate={(prev, curr) => prev.seedEnable !== curr.seedEnable}
                              >
                                {({ getFieldValue, getFieldError }) => {
                                  const seedEnable = getFieldValue("seedEnable")
                                  const fieldError = getFieldError("seed")
                                  const hasError = seedEnable && fieldError?.length > 0

                                  return (
                                    <div style={{ display: "flex", alignItems: "center" }}>
                                      <div style={{ flex: 1 }}>
                                        <Form.Item
                                          name="seed"
                                          rules={[
                                            { required: !!seedEnable, message: "请输入Seed值" }
                                          ]}
                                          style={{ marginBottom: 0 }}
                                        >
                                          <InputNumber
                                            disabled={isOnlyRead || !seedEnable}
                                            placeholder="请输入Seed值"
                                            style={{ width: "100%" }}
                                            precision={0}
                                            min={1}
                                            max={9999999}
                                            step={1}
                                          />
                                        </Form.Item>
                                      </div>
                                      {hasError && (
                                        <Tooltip title={fieldError[0]} placement="top">
                                          <ExclamationCircleOutlined
                                            style={{
                                              color: "#ff4d4f",
                                              marginLeft: "8px",
                                              cursor: "pointer"
                                            }}
                                          />
                                        </Tooltip>
                                      )}
                                    </div>
                                  )
                                }}
                              </Form.Item>
                            </Col>
                          </Row>
                        </div>
                      )
                    }}
                  </Form.Item>
                </div>
              </div>
            </div>

            {/* 变量区域 */}
            <div className="mb-5">
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center gap-[4px] cursor-pointer group w-full"
                  onClick={() =>
                    setVoiceCollapsedState((prev) => ({ ...prev, variables: !prev.variables }))
                  }
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-[6px]">
                      <i
                        className={`text-[16px] text-[#475467] iconfont icon-Up transition-transform duration-300 group-hover:text-[#7f56d9] ${
                          voiceCollapsedState.variables ? "rotate-90" : "rotate-180"
                        }`}
                      ></i>
                      <span className="text-[14px] text-[#475467] font-[500] group-hover:text-[#7f56d9]">
                        变量设置
                      </span>
                      {
                        <Tag color="red" bordered={false}>
                          + {currentVariables.length}
                        </Tag>
                      }
                    </div>
                  </div>
                </div>
                <Button
                  type="text"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingVariable(null)
                    setMemoryPopoverVisible(true)
                  }}
                />
              </div>
              <div
                className={`transition-all duration-300 origin-top ${
                  voiceCollapsedState.variables
                    ? "transform scale-y-0 h-0 opacity-0"
                    : "transform scale-y-100 opacity-100 "
                }`}
              >
                <div className="flex flex-wrap gap-2">
                  {currentVariables.length > 0 ? (
                    currentVariables.map((variable) => (
                      <ToolItem
                        key={variable.varNo}
                        item={{
                          name: variable.varName,
                          enabled: variable.enabled,
                          description: variable.description || "暂无变量",
                          id: variable.varNo
                        }}
                        idKey="id"
                        avatarBgColor="#555bfb"
                        onDelete={() => handleDeleteVar(variable.varNo)}
                        onEdit={() => {
                          setEditingVariable(variable)
                          setMemoryPopoverVisible(true)
                        }}
                        isVar={true}
                      />
                    ))
                  ) : (
                    <div className="w-full">
                      <CustomEmpty description="请添加变量，用于保存变量信息" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 记忆模块 */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center gap-[4px] cursor-pointer group w-full"
                  onClick={() =>
                    setVoiceCollapsedState({
                      ...voiceCollapsedState,
                      memory: !voiceCollapsedState.memory
                    })
                  }
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-[6px]">
                      <i
                        className={`text-[16px] text-[#475467] iconfont icon-Up transition-transform duration-300 group-hover:text-[#7f56d9] ${
                          voiceCollapsedState.memory ? "rotate-90" : "rotate-180"
                        }`}
                      ></i>
                      <span className="text-[14px] text-[#475467] font-[500] group-hover:text-[#7f56d9]">
                        记忆设置
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className={`transition-all duration-300 origin-top ${
                  voiceCollapsedState.memory
                    ? "transform scale-y-0 h-0 opacity-0"
                    : "transform scale-y-100 opacity-100 px-2 bg-gray-50 rounded-md mt-1"
                }`}
              >
                <div className="mt-3 py-2">
                  {/* 最大轮次 */}
                  <Form.Item
                    // layout="horizontal"
                    name="maxRounds"
                    label={
                      <span>
                        最大轮次
                        <Tooltip title="最大轮次定义了系统记忆上下文的对话会和数上线，当实际对话轮次超过该阈值时，若未开启自动总结，系统将自动丢弃最早的历史记录；若开启自动总结，系统在最大轮次基础上，将历史对话根据自动总结轮次进行总计">
                          <InfoIcon className="ml-1" />
                        </Tooltip>
                      </span>
                    }
                    initialValue={50}
                  >
                    <Row gutter={[0, 0]}>
                      <Col span={17}>
                        <Form.Item noStyle name="maxRounds" initialValue={50}>
                          <Slider
                            max={100}
                            min={1}
                            step={1}
                            marks={{
                              1: "1",
                              50: "50",
                              100: "100"
                            }}
                            defaultValue={50}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item className="mr-0 pr-0" name="maxRounds" initialValue={50}>
                          <InputNumber
                            style={{ marginLeft: "20px", width: "100%" }}
                            min={1}
                            max={100}
                            step={1}
                            precision={0}
                            defaultValue={50}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Form.Item>

                  {/* 自动总结开关 */}
                  <Form.Item
                    layout="horizontal"
                    name="autoSummary"
                    label={
                      <span>
                        自动总结
                        <Tooltip title="开启后，系统会根据自动总结轮次主动分析上下文语义，进行总结">
                          <InfoIcon className="ml-1" />
                        </Tooltip>
                      </span>
                    }
                    valuePropName="checked"
                    initialValue={false}
                    className="-mt-5"
                  >
                    <Switch size="small" />
                  </Form.Item>

                  {/* 自动总结轮次 */}
                  <Form.Item
                    noStyle
                    shouldUpdate={(prev, curr) => prev.autoSummary !== curr.autoSummary}
                  >
                    {({ getFieldValue }) => {
                      const autoSummary = getFieldValue("autoSummary")

                      if (!autoSummary) return null

                      return (
                        <Form.Item
                          // layout="horizontal"
                          name="autoSummaryRounds"
                          label={
                            <span>
                              自动总结轮次
                              <Tooltip title="设定出发自动总结的对话回合阈值（如每 20 轮对话生成一次总结）">
                                <InfoIcon className="ml-1" />
                              </Tooltip>
                            </span>
                          }
                          initialValue={20}
                          className="-mt-2"
                        >
                          <Row gutter={[0, 0]}>
                            <Col span={17}>
                              <Form.Item noStyle name="autoSummaryRounds" initialValue={20}>
                                <Slider
                                  max={100}
                                  min={1}
                                  step={1}
                                  marks={{
                                    1: "1",
                                    20: "20",
                                    100: "100"
                                  }}
                                  defaultValue={20}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={5}>
                              <Form.Item
                                className="mr-0 pr-0"
                                name="autoSummaryRounds"
                                initialValue={20}
                              >
                                <InputNumber
                                  style={{ marginLeft: "20px", width: "100%" }}
                                  min={1}
                                  max={100}
                                  step={1}
                                  precision={0}
                                  defaultValue={20}
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                        </Form.Item>
                      )
                    }}
                  </Form.Item>
                </div>
              </div>
            </div>

            {/* TTS设置 */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center gap-[4px] cursor-pointer group w-full"
                  onClick={() =>
                    setVoiceCollapsedState({
                      ...voiceCollapsedState,
                      tts: !voiceCollapsedState.tts
                    })
                  }
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-[6px]">
                      <i
                        className={`text-[16px] text-[#475467] iconfont icon-Up transition-transform duration-300 group-hover:text-[#7f56d9] ${
                          voiceCollapsedState.tts ? "rotate-90" : "rotate-180"
                        }`}
                      ></i>
                      <span className="text-[14px] text-[#475467] font-[500] group-hover:text-[#7f56d9]">
                        声音设置
                      </span>
                      {timbreCodeEmpty && (
                        <Tag color="red" bordered={false} className="ml-2">
                          音色空
                        </Tag>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div
                className={`transition-all duration-300 origin-top ${
                  voiceCollapsedState.tts
                    ? "transform scale-y-0 h-0 opacity-0"
                    : "transform scale-y-100 opacity-100 px-2 bg-gray-50 rounded-md mt-1"
                }`}
                onMouseLeave={() => handleSectionMouseLeave("tts")}
              >
                <div className="mt-3 space-y-2 py-2">
                  <Form.Item name="timbreCode" label="音色" className="!mb-4">
                    <Select
                      ref={selectRef}
                      placeholder="请选择音色"
                      loading={timbreLoading}
                      showSearch
                      optionFilterProp="label"
                      options={timbreOptions}
                      allowClear
                      dropdownRender={(menu) => (
                        <>
                          {timbreOptions.map((option) => (
                            <div
                              key={option.value}
                              className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer group"
                              onClick={() => {
                                form.setFieldsValue({ timbreCode: option.value })
                                // 根据选中的timbreCode查找对应的timbreName和timbreModel
                                const labelParts = option.label.split(" - ")
                                if (labelParts.length >= 2) {
                                  form.setFieldsValue({
                                    timbreName: labelParts[0],
                                    timbreModel: labelParts[1]
                                  })
                                }
                                // 处理音色变化，重新匹配对应的音频文件
                                handleTimbreChange(option.value)
                                // 手动关闭下拉框
                                selectRef.current?.blur()
                              }}
                            >
                              <span className="truncate flex-1 pr-2">{option.label}</span>
                              {option.auditionUrl && (
                                <a
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleTimbreAudition(option.auditionUrl, option.value)
                                  }}
                                  className="text-[#7F56D9] hover:text-[#7F56D9]"
                                  style={{ minWidth: "auto", padding: "2px 4px" }}
                                >
                                  {playingAuditionCode === option.value ? (
                                    <PauseCircleOutlined />
                                  ) : (
                                    <PlayCircleOutlined />
                                  )}
                                </a>
                              )}
                            </div>
                          ))}
                        </>
                      )}
                    />
                  </Form.Item>

                  {/* 隐藏字段用于存储音色名称和模型 */}
                  <Form.Item name="timbreName" style={{ display: "none" }}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="timbreModel" style={{ display: "none" }}>
                    <Input />
                  </Form.Item>

                  <Form.Item name="audioFormat" label="录音格式" className="!mb-4">
                    <Select placeholder="请选择" allowClear>
                      <Option value="mp3">mp3</Option>
                      <Option value="wav">wav</Option>
                      <Option value="pcm">pcm</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item name="sampleRate" label="音频采样率" className="!mb-4">
                    <Select placeholder="请选择" allowClear>
                      <Option value={8000}>8000 Hz</Option>
                      <Option value={16000}>16000 Hz</Option>
                      <Option value={32000}>32000 Hz</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item label="音频速率" className="mb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <Form.Item name="speed" noStyle>
                          <Slider
                            min={0.6}
                            max={2.5}
                            step={0.01}
                            tooltip={{ formatter: (value) => `${value}` }}
                          />
                        </Form.Item>
                      </div>
                      <Form.Item name="speed" noStyle>
                        <InputNumber
                          min={0.6}
                          max={2.5}
                          step={0.01}
                          precision={2}
                          className="w-20"
                        />
                      </Form.Item>
                    </div>
                  </Form.Item>
                  <Form.Item label="音量" className="mb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <Form.Item name="volume" noStyle>
                          <Slider
                            min={0}
                            max={100}
                            tooltip={{ formatter: (value) => `${value}%` }}
                          />
                        </Form.Item>
                      </div>
                      <Form.Item name="volume" noStyle>
                        <InputNumber
                          min={0}
                          max={100}
                          precision={0}
                          className="w-20"
                          formatter={(value) => `${value}%`}
                          parser={(value) => value?.replace("%", "")}
                        />
                      </Form.Item>
                    </div>
                  </Form.Item>

                  {/* 试听功能 */}
                  <div className="mt-4">
                    <Row gutter={16}>
                      <Col span={24}>
                        <Form.Item name="synthesisText" label="试听">
                          <Input.TextArea
                            placeholder="请输入要合成试听的文本"
                            rows={3}
                            className="flex-1 mr-2"
                          />
                        </Form.Item>
                        <div className="text-left">
                          <Button
                            type="primary"
                            icon={<i className="iconfont icon-zhinengyouhua"></i>}
                            onClick={handleSynthesis}
                            loading={synthesizing}
                            style={{
                              background:
                                "linear-gradient(83.59deg, #E9E8FF 6.73%, #EEC7FF 131.73%)",
                              color: "#7F56D9"
                            }}
                          >
                            合成试听
                          </Button>
                        </div>
                      </Col>
                    </Row>

                    {/* 音频播放器 */}
                    {audioUrl && (
                      <div className="mt-3 p-3  rounded-md bg-gray-100">
                        <div className="flex items-center mb-2 pr-4">
                          <div className="mr-2 flex items-center justify-center w-9 h-9 bg-orange-500 p-1 text-white rounded-md">
                            <span className="text-xs font-bold">MP3</span>
                          </div>
                          <div className="flex-1 text-sm font-medium text-gray-700 truncate">
                            已生成语音文件
                          </div>
                          {audioUrl && (
                            <i
                              className="iconfont icon-xiazai text-[#7F56D9] cursor-pointer text-xl mr-3 -mt-[1px]"
                              onClick={() => {
                                // 尝试强制下载，但需要后端OSS支持Content-Disposition头
                                functionDownVoice(audioUrl)
                              }}
                            ></i>
                          )}
                          {isPlaying ? (
                            <PauseCircleOutlined
                              className="text-xl text-[#7F56D9] cursor-pointer"
                              onClick={togglePlay}
                            />
                          ) : (
                            <PlayCircleOutlined
                              className="text-xl text-[#7F56D9] cursor-pointer"
                              onClick={togglePlay}
                            />
                          )}
                        </div>

                        <div className="flex items-center">
                          <div className="text-xs text-gray-500 mr-2">
                            {formatTime(currentTime)}
                          </div>
                          <div
                            className="flex-1 bg-gray-200 h-1 rounded cursor-pointer relative overflow-hidden"
                            onClick={handleProgressClick}
                          >
                            <div
                              className="absolute h-full bg-[#7F56D9] rounded-lg"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 ml-2">
                            {formatTime(audioDuration)}
                          </div>
                        </div>

                        <audio
                          ref={audioRef}
                          src={audioUrl}
                          onEnded={handleAudioEnded}
                          preload="metadata"
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 呼叫线路配置 */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center gap-[4px] cursor-pointer group w-full"
                  onClick={() =>
                    setVoiceCollapsedState({
                      ...voiceCollapsedState,
                      channels: !voiceCollapsedState.channels
                    })
                  }
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-[6px]">
                      <i
                        className={`text-[16px] text-[#475467] iconfont icon-Up transition-transform duration-300 group-hover:text-[#7f56d9] ${
                          voiceCollapsedState.channels ? "rotate-90" : "rotate-180"
                        }`}
                      ></i>
                      <span className="text-[14px] text-[#475467] font-[500] group-hover:text-[#7f56d9]">
                        呼叫线路配置
                      </span>
                      {ccConfigsEmpty && (
                        <Tag color="red" bordered={false}>
                          空
                        </Tag>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div
                className={`transition-all duration-300 origin-top ${
                  voiceCollapsedState.channels
                    ? "transform scale-y-0 h-0 opacity-0"
                    : "transform scale-y-100 opacity-100 px-2 bg-gray-50 rounded-md mt-1"
                }`}
                onMouseLeave={() => handleSectionMouseLeave("channels")}
              >
                <div className="mt-3 py-2" ref={channelConfigRef}>
                  <Form.List name="ccConfigs">
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map((field, index) => (
                          <div
                            key={field.key}
                            className="mb-4 p-4 border border-solid border-gray-200 rounded-md relative"
                          >
                            <h4 className="text-sm font-medium mb-3">通道配置{index + 1}</h4>
                            <Button
                              type="link"
                              danger
                              onClick={() => handleRemoveChannel(field.name)}
                              className="absolute right-2 top-2 text-xs"
                              icon={<PlusOutlined className="text-gray-500" rotate={45} />}
                            />
                            <div className="space-y-3">
                              <Form.Item
                                {...field}
                                name={[field.name, "ccPlatform"]}
                                label="呼叫线路平台"
                                className="mb-0"
                                rules={[{ required: true, message: "请选择呼叫线路平台" }]}
                              >
                                <Select placeholder="请选择呼叫线路平台">
                                  <Option value="cti">天润</Option>
                                  <Option value="dt">灯塔</Option>
                                  <Option value="zc">智齿</Option>
                                  <Option value="xc">XC</Option>
                                  <Option value="pbx">PBX</Option>
                                  <Option value="xcPbx">XC-PBX</Option>
                                  <Option value="lb">灵伴</Option>
                                </Select>
                              </Form.Item>
                              <Form.Item
                                {...field}
                                name={[field.name, "bizField"]}
                                label="通道 ID"
                                className="mb-0"
                              >
                                <Input placeholder="请输入通道 ID" maxLength={100} allowClear />
                              </Form.Item>
                              <Form.Item
                                {...field}
                                name={[field.name, "bizTypes"]}
                                label="BizTypes"
                                rules={[
                                  {
                                    validator: (_, value) => {
                                      if (!value || value.length === 0) {
                                        return Promise.resolve()
                                      }
                                      // 计算所有选项的总长度
                                      const totalLength = value.reduce(
                                        (sum, item) => sum + (item?.length || 0),
                                        0
                                      )
                                      if (totalLength > 1000) {
                                        return Promise.reject(
                                          "所有BizTypes选项的总长度不能超过1000字"
                                        )
                                      }
                                      return Promise.resolve()
                                    }
                                  }
                                ]}
                                className="mb-0"
                              >
                                <Select
                                  mode="tags"
                                  placeholder="请输入BizTypes"
                                  allowClear
                                  maxLength={1000}
                                  tokenSeparators={[","]}
                                />
                              </Form.Item>
                              <Form.Item
                                {...field}
                                name={[field.name, "rate"]}
                                label="分流比例"
                                tooltip="多通道各自占比"
                                className="mb-3"
                                initialValue={100}
                                rules={[
                                  {
                                    required: true,
                                    validator: (_, value) => {
                                      const ccConfigs = Array.isArray(
                                        form.getFieldValue("ccConfigs")
                                      )
                                        ? form.getFieldValue("ccConfigs")
                                        : []
                                      const total = ccConfigs.reduce(
                                        (sum, item) => sum + (Number(item.rate) || 0),
                                        0
                                      )
                                      if (total > 100) {
                                        return Promise.reject("通道分流比例之和不能超过100%")
                                      }
                                      return Promise.resolve()
                                    }
                                  }
                                ]}
                              >
                                <Form.Item {...field} name={[field.name, "rate"]} noStyle>
                                  <InputNumber
                                    min={0}
                                    max={100}
                                    precision={0}
                                    className="w-20"
                                    formatter={(value) => `${value}%`}
                                    parser={(value) => value?.replace("%", "")}
                                    onChange={(value) => handleRateChange(value, field.name)}
                                  />
                                </Form.Item>
                              </Form.Item>
                              <Form.Item
                                {...field}
                                name={[field.name, "extraInfo"]}
                                label="拓展参数"
                                tooltip="JSON 格式，用来扩展额外配置"
                                className="mb-0 mt-2"
                              >
                                <Input.TextArea
                                  placeholder="请输入拓展配置参数"
                                  rows={3}
                                  allowClear
                                />
                              </Form.Item>
                              <Form.Item
                                {...field}
                                name={[field.name, "isSkipWebcall"]}
                                label="外部发起外呼"
                                className="mb-0"
                                getValueFromEvent={(checked) => (checked ? 1 : 0)}
                                getValueProps={(value) => ({ checked: value === 1 })}
                                initialValue={0}
                                layout="horizontal"
                              >
                                <Switch size="small" checkedChildren="开" unCheckedChildren="关" />
                              </Form.Item>
                            </div>
                          </div>
                        ))}
                        {fields.length === 0 && (
                          <CustomEmpty description="暂无通道配置，请点击下方按钮添加" />
                        )}
                        {/* 分流比例总和错误提示 */}
                        {rateError && (
                          <div className="text-red-500 text-xs mb-2 mt-1">{rateError}</div>
                        )}
                        <Form.Item className="mt-4">
                          <Button
                            type="link"
                            onClick={handleAddChannel}
                            icon={<PlusOutlined />}
                            className="!text-purple-600 !p-0"
                          >
                            创建呼叫线路配置
                          </Button>
                        </Form.Item>
                      </>
                    )}
                  </Form.List>
                </div>
              </div>
            </div>

            {/* 名单属性 */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center gap-[4px] cursor-pointer group w-full"
                  onClick={() =>
                    setVoiceCollapsedState({
                      ...voiceCollapsedState,
                      details: !voiceCollapsedState.details
                    })
                  }
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-[6px]">
                      <i
                        className={`text-[16px] text-[#475467] iconfont icon-Up transition-transform duration-300 group-hover:text-[#7f56d9] ${
                          voiceCollapsedState.details ? "rotate-90" : "rotate-180"
                        }`}
                      ></i>
                      <span className="text-[14px] text-[#475467] font-[500] group-hover:text-[#7f56d9]">
                        名单属性
                      </span>
                      {variableConfigsEmpty && (
                        <Tag color="red" bordered={false}>
                          空
                        </Tag>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div
                className={`transition-all duration-300 origin-top ${
                  voiceCollapsedState.details
                    ? "transform scale-y-0 h-0 opacity-0"
                    : "transform scale-y-100 opacity-100 px-2 bg-gray-50 rounded-md mt-1"
                }`}
                onMouseLeave={() => handleSectionMouseLeave("details")}
              >
                <div className="mt-3 py-2">
                  <div className="text-xs text-gray-500 p-2 bg-white rounded border border-gray-200 mb-2">
                    相同名单属性生效优先级：工作流名单属性 &gt; 脚本名单属性 &gt; 原始名单属性
                  </div>
                  <Form.List name="variableConfigs">
                    {(fields, { add, remove }) => (
                      <>
                        {[...fields]
                          .sort((a, b) => {
                            const ta = form.getFieldValue(["variableConfigs", a.name, "type"])
                            const tb = form.getFieldValue(["variableConfigs", b.name, "type"])
                            if (ta === 2 && tb !== 2) return -1
                            if (ta !== 2 && tb === 2) return 1
                            return a.name - b.name
                          })
                          .map((field, index) => {
                            const fieldType = form.getFieldValue([
                              "variableConfigs",
                              field.name,
                              "type"
                            ])
                            const isSkillType = fieldType === 2

                            return (
                              <div
                                key={field.key}
                                className={`mb-4 p-3 border border-solid rounded-md relative ${
                                  isSkillType ? "border-purple-200 bg-purple-50" : "border-gray-200"
                                }`}
                              >
                                <h4 className="text-sm font-medium mb-3">
                                  {isSkillType ? "工作流名单属性" : "脚本名单属性"}
                                  {/* {isSkillType ? "" : index + 1} */}
                                </h4>
                                <Button
                                  type="link"
                                  danger
                                  onClick={() => remove(field.name)}
                                  className="absolute right-2 top-2 text-xs"
                                  icon={<PlusOutlined className="text-gray-500" rotate={45} />}
                                />
                                <div className="space-y-2">
                                  {isSkillType ? (
                                    <>
                                      <Form.Item
                                        {...field}
                                        name={[field.name, "skillNo"]}
                                        label={
                                          <div className="flex items-center justify-between w-[100%] mr-1">
                                            <span className="flex items-center">
                                              名单工作流获取属性
                                            </span>
                                            {!!form.getFieldValue([
                                              "variableConfigs",
                                              field.name,
                                              "skillNo"
                                            ]) && (
                                              <Tooltip title="点击跳转工作流详情">
                                                <i
                                                  className="iconfont icon-View ml-2 text-gray-400 cursor-pointer hover:text-[#7F56D9]"
                                                  onClick={() => {
                                                    reTodoUrlHandel(
                                                      form.getFieldValue([
                                                        "variableConfigs",
                                                        field.name,
                                                        "skillNo"
                                                      ])
                                                    )
                                                  }}
                                                ></i>
                                              </Tooltip>
                                            )}
                                          </div>
                                        }
                                        className="mb-2"
                                        tooltip="该工作流必须返回单层字典，属性将会作为实际外呼参数的一部分"
                                        rules={[{ required: true, message: "请选择工作流" }]}
                                      >
                                        <Select
                                          placeholder="请选择工作流"
                                          optionLabelProp="label"
                                          showSearch
                                          filterOption={false}
                                          onSearch={handleSearch}
                                        >
                                          {skills.map((group) => (
                                            <Select.OptGroup key={group.label} label={group.label}>
                                              {group.options.map((skill) => (
                                                <Select.Option
                                                  key={skill.value}
                                                  value={skill.value}
                                                  label={skill.label}
                                                >
                                                  {skill.label}
                                                </Select.Option>
                                              ))}
                                            </Select.OptGroup>
                                          ))}
                                        </Select>
                                      </Form.Item>
                                    </>
                                  ) : (
                                    <>
                                      <Form.Item
                                        {...field}
                                        name={[field.name, "name"]}
                                        label="字段中文名称"
                                        className="mb-2"
                                      >
                                        <Input placeholder="请输入字段中文名称" allowClear />
                                      </Form.Item>
                                      <Form.Item
                                        {...field}
                                        name={[field.name, "fieldName"]}
                                        label="字段Key"
                                        className="mb-2"
                                      >
                                        <Input placeholder="请输入字段Key" allowClear />
                                      </Form.Item>
                                      <Form.Item
                                        {...field}
                                        name={[field.name, "expression"]}
                                        label="字段取值表达式"
                                        tooltip="通过 EL表达式构建字段的值"
                                        className="mb-2"
                                      >
                                        <Input.TextArea
                                          placeholder="请输入字段取值表达式"
                                          rows={3}
                                          allowClear
                                        />
                                      </Form.Item>
                                      <Form.Item
                                        {...field}
                                        name={[field.name, "isShow"]}
                                        label="在通话记录中展示"
                                        className="mb-2"
                                        getValueFromEvent={(checked) => (checked ? 1 : 0)}
                                        getValueProps={(value) => ({ checked: value === 1 })}
                                      >
                                        <Switch
                                          size="small"
                                          checkedChildren="开"
                                          unCheckedChildren="关"
                                        />
                                      </Form.Item>
                                    </>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        {fields.length === 0 && (
                          <CustomEmpty description="暂无自定义字段，请点击下方按钮添加" />
                        )}
                        <Form.Item className="mt-4">
                          {(() => {
                            // 检查是否已经存在按工作流添加的属性 (type=2)
                            const hasSkillProperty = fields.some((field) => {
                              const fieldType = form.getFieldValue([
                                "variableConfigs",
                                field.name,
                                "type"
                              ])
                              return fieldType === 2
                            })

                            return (
                              <Popover
                                content={
                                  <div className="flex flex-col justify-start w-[100px]">
                                    <a
                                      type="link"
                                      className="mb-2"
                                      disabled={hasSkillProperty}
                                      title={hasSkillProperty ? "只能添加一个按工作流属性" : ""}
                                      onClick={() => {
                                        if (!hasSkillProperty) {
                                          setPropertyAddPopoverVisible(false)
                                          const cur = form.getFieldValue("variableConfigs") || []
                                          form.setFieldValue("variableConfigs", [
                                            ...cur,
                                            {
                                              name: "",
                                              fieldName: "",
                                              expression: "",
                                              isShow: 0,
                                              type: 2,
                                              skillNo: undefined
                                            }
                                          ])
                                        } else {
                                          message.error("只能添加一个按工作流属性")
                                        }
                                      }}
                                    >
                                      按工作流添加
                                    </a>
                                    <a
                                      type="link"
                                      onClick={() => {
                                        setPropertyAddPopoverVisible(false)
                                        add({
                                          name: "",
                                          fieldName: "",
                                          expression: "",
                                          isShow: 0,
                                          type: 1
                                        })
                                      }}
                                    >
                                      按脚本添加
                                    </a>
                                  </div>
                                }
                                title="添加方式"
                                trigger="hover"
                                style={{ width: "120px" }}
                                open={propertyAddPopoverVisible}
                                onOpenChange={setPropertyAddPopoverVisible}
                                styles={{
                                  body: {
                                    width: "150px"
                                  }
                                }}
                              >
                                <Button
                                  type="link"
                                  icon={<PlusOutlined />}
                                  className="!text-purple-600 !p-0"
                                >
                                  名单属性
                                </Button>
                              </Popover>
                            )
                          })()}
                        </Form.Item>
                      </>
                    )}
                  </Form.List>
                </div>
              </div>
            </div>

            {/* 高级设置 */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center gap-[4px] cursor-pointer group w-full"
                  onClick={() =>
                    setVoiceCollapsedState({
                      ...voiceCollapsedState,
                      general: !voiceCollapsedState.general
                    })
                  }
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-[6px]">
                      <i
                        className={`text-[16px] text-[#475467] iconfont icon-Up transition-transform duration-300 group-hover:text-[#7f56d9] ${
                          voiceCollapsedState.general ? "rotate-90" : "rotate-180"
                        }`}
                      ></i>
                      <span className="text-[14px] text-[#475467] font-[500] group-hover:text-[#7f56d9]">
                        高级设置
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className={`transition-all duration-300 origin-top ${
                  voiceCollapsedState.general
                    ? "transform scale-y-0 h-0 opacity-0"
                    : "transform scale-y-100 opacity-100 px-2 bg-gray-50 rounded-md mt-1"
                }`}
                onMouseLeave={() => handleSectionMouseLeave("general")}
              >
                <div className="mt-3 space-y-2 py-2">
                  {/* <Form.Item name="taskName" label="语音模版名称" className="mb-2">
                    <Input placeholder="请输入语音模版名称" allowClear />
                  </Form.Item> */}
                  <Col span={24} className="mb-3">
                    IVR模板ID：
                    <span>{taskId}</span>
                    <i
                      className="iconfont icon-fuzhi hover:text-[#7F56D9] text-gray-400 cursor-pointer ml-1 mt-1"
                      onClick={() => {
                        copy(taskId)
                        message.success("复制成功")
                      }}
                    ></i>
                  </Col>
                  <Form.Item
                    name="robotStrategy"
                    label="连续说话处理方式"
                    tooltip="当 AI 回复的时候用户正好说话，是否合并上一轮问题一起处理"
                    className="mb-2"
                    initialValue="merge"
                  >
                    <Select placeholder="请选择处理方式">
                      <Option value="merge">合并用户问题</Option>
                      <Option value="default">默认</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item
                    name="crossCallScriptTag"
                    label="跨通话轮询话术"
                    tooltip="话术是否跨通话轮询，增加重复触达用户话术体验，节点递进话术多，重复触发大的情况再推荐开启"
                    getValueFromEvent={(checked) => (checked ? 1 : 0)}
                    getValueProps={(value) => ({ checked: value === 1 })}
                    className="mb-2"
                    layout="horizontal"
                  >
                    <Switch size="small" checkedChildren="开" unCheckedChildren="关" />
                  </Form.Item>
                  <Form.Item name="redisExpireTime" label="录音缓存时间" className="mb-2">
                    <InputNumber
                      placeholder="请输入录音缓存时间"
                      className="w-full"
                      addonAfter="秒"
                      allowClear
                    />
                  </Form.Item>
                  <Form.Item name="numberWebCall" label="手机防疲劳" className="mb-2">
                    <InputNumber
                      placeholder="拨打最大数量"
                      className="w-full"
                      addonAfter="通"
                      allowClear
                    />
                  </Form.Item>

                  {/* 开启拨打限流 */}
                  <Form.Item
                    name="taskProcessRateFlag"
                    label="开启拨打限流"
                    valuePropName="checked"
                    tooltip="用于控制权录音或者全 tts 任务拨打速率"
                    className="mb-2"
                    layout="horizontal"
                  >
                    <Switch size="small" checkedChildren="开" unCheckedChildren="关" />
                  </Form.Item>

                  {/* 拨打限流开启后显示的字段 */}
                  <Form.Item noStyle dependencies={["taskProcessRateFlag"]}>
                    {({ getFieldValue }) =>
                      getFieldValue("taskProcessRateFlag") ? (
                        <Form.Item
                          name="taskProcessRateSleepTime"
                          label="拨打间隔时长"
                          tooltip="当启用拨打速率控制时，拨打睡眠时长"
                          className="mb-2"
                        >
                          <InputNumber
                            placeholder="请输入间隔时长"
                            className="w-full"
                            addonAfter="毫秒"
                            allowClear
                          />
                        </Form.Item>
                      ) : null
                    }
                  </Form.Item>
                  <div className="grid grid-cols-2 gap-2">
                    <Form.Item name="allowCallTimeStart" label="开始时间" className="mb-2">
                      <TimePicker
                        format="HH:mm"
                        placeholder="开始时间"
                        className="w-full"
                        allowClear
                      />
                    </Form.Item>
                    <Form.Item name="allowCallTimeEnd" label="结束时间" className="mb-2">
                      <TimePicker
                        format="HH:mm"
                        placeholder="结束时间"
                        className="w-full"
                        allowClear
                      />
                    </Form.Item>
                  </div>
                </div>
              </div>
            </div>

            {/* 数据飞轮 */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center gap-[4px] cursor-pointer group w-full"
                  onClick={() =>
                    setVoiceCollapsedState({
                      ...voiceCollapsedState,
                      flywheel: !voiceCollapsedState.flywheel
                    })
                  }
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-[6px]">
                      <i
                        className={`text-[16px] text-[#475467] iconfont icon-Up transition-transform duration-300 group-hover:text-[#7f56d9] ${
                          voiceCollapsedState.flywheel ? "rotate-90" : "rotate-180"
                        }`}
                      ></i>
                      <span className="text-[14px] text-[#475467] font-[500] group-hover:text-[#7f56d9]">
                        数据飞轮
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className={`transition-all duration-300 origin-top ${
                  voiceCollapsedState.flywheel
                    ? "transform scale-y-0 h-0 opacity-0"
                    : "transform scale-y-100 opacity-100 px-2 bg-gray-50 rounded-md mt-1 pb-4"
                }`}
                onMouseLeave={() => handleSectionMouseLeave("flywheel")}
              >
                <div className="mt-3 space-y-2 py-2">
                  <DataFlywheelTab
                    form={form}
                    disabled={isOnlyRead}
                    isEditing={isEditing}
                    onFormChange={handleFormChange}
                    loading={voiceDetailsLoading}
                    botNo={currentBotNo}
                    taskId={taskId}
                  />
                </div>
              </div>
            </div>
          </Form>
        </Spin>

        {/* <div className="h-[1px] bg-[#E4E7EC]"></div> */}

        {/* 变量编辑弹窗 */}
        <VariableEditorModal
          visible={memoryPopoverVisible}
          onClose={() => {
            setMemoryPopoverVisible(false)
            setEditingVariable(null)
          }}
          initialVars={currentVariables}
          onConfirm={handleConfirmVars}
          showAutoExtraction={true}
          editingVar={editingVariable}
        />
      </div>
    )
  }
)

VoiceSettingsPanel.displayName = "VoiceSettingsPanel"

export default VoiceSettingsPanel
