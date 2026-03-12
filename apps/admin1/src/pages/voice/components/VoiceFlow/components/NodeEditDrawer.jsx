import React, { useEffect, useState, useRef, memo, useCallback } from "react"
import {
  Drawer,
  Form,
  Input,
  Button,
  Space,
  Typography,
  Radio,
  Select,
  Tag,
  Divider,
  Switch,
  Modal,
  Row,
  Col,
  Tooltip,
  message,
  InputNumber,
  Spin,
  Slider
} from "antd"
import {
  PlusOutlined,
  CloseOutlined,
  UpOutlined,
  DownOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined
} from "@ant-design/icons"
import { useNavigate } from "react-router-dom"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { DragIcon } from "@/components/FormIcon"
import {
  useCreateOrUpdateNodeConfig,
  useGetScriptList,
  useGetScriptListByPage,
  useGetEventList,
  useGetNodeConfigDetails
} from "@/api/voiceAgent"
import {
  getScriptList,
  getEventList,
  getIntentionList,
  saveIntentionConfig,
  synthesisVoice
} from "@/api/voiceAgent/api"
// import { fetchPersonalTimbreListV2 } from "@/api/timbre/api" // 不再需要音色API
import useResizableDrawer from "../utils/resizeHandler"
import RecordingItem from "../../RecordingItem"
import ScriptSelector from "@/components/ScriptSelector"
import {
  CollapsedScriptItem,
  ExpandedScriptItem,
  RuleInputWithSwitch
} from "./NodeEditDrawerComponents"

const { Text, Title } = Typography
const { Option } = Select
const { TextArea } = Input
import "../styles/NodeEditDrawer.scss"
import styles from "../../../script.module.scss"

const NodeEditDrawer = memo(
  ({
    open,
    onClose,
    node,
    isAddingTag,
    onUpdate,
    botNo,
    taskId,
    flowType,
    allNodes,
    isOnlyRead
  }) => {
    // 监听来自 detail.jsx 的关闭其他抽屉事件
    useEffect(() => {
      const handleCloseOtherDrawers = (event) => {
        // 如果当前抽屉是打开的，且不是被排除的抽屉，则关闭它
        if (open && event.detail?.excludeDrawer !== "NodeEditDrawer") {
          onClose()
        }
      }

      window.addEventListener("closeOtherDrawers", handleCloseOtherDrawers)

      return () => {
        window.removeEventListener("closeOtherDrawers", handleCloseOtherDrawers)
      }
    }, [open, onClose])

    // 当 NodeEditDrawer 打开时，通知其他抽屉关闭
    useEffect(() => {
      if (open) {
        // 派发自定义事件，通知其他抽屉关闭（排除 NodeEditDrawer 自身）
        const closeOtherDrawersEvent = new CustomEvent("closeOtherDrawers", {
          detail: { excludeDrawer: "NodeEditDrawer" }
        })
        window.dispatchEvent(closeOtherDrawersEvent)
      }
    }, [open])
    const [form] = Form.useForm()
    const navigate = useNavigate()
    const [customerIntents, setCustomerIntents] = useState([])
    const [intentionOptions, setIntentionOptions] = useState([]) // 意图选项列表
    const [searchTimeout, setSearchTimeout] = useState(null) // 搜索防抖
    const [searchValue, setSearchValue] = useState("") // 搜索值
    const [intentionCodeValue, setIntentionCodeValue] = useState("") // 意图编码值
    const [isMountedNode, setIsMountedNode] = useState(false)
    const [isPrologueNode, setIsPrologueNode] = useState(false) // 是否是开场白节点
    const [scriptsCollapsed, setScriptsCollapsed] = useState(true) // 播报话术列表折叠状态
    const drawerRef = useRef(null)
    // 用于跟踪数据是否已加载
    const dataLoaded = useRef(false)
    const [pendingScripts, setPendingScripts] = useState([])

    // 抽屉宽度控制 - 从localStorage读取保存的宽度，如果没有则使用默认值
    const initialWidth = (() => {
      try {
        const savedWidth = localStorage.getItem("voice_flow_drawer_width")
        if (savedWidth) {
          const parsedWidth = parseInt(savedWidth, 10)
          if (!isNaN(parsedWidth) && parsedWidth >= 400 && parsedWidth <= 900) {
            return parsedWidth
          }
        }
      } catch (e) {
        console.warn("Failed to get saved drawer width", e)
      }
      return 680 // 默认宽度
    })()

    const [drawerWidth, setDrawerWidth] = useState(initialWidth)
    const resizeHandleRef = useRef(null)

    // 拖动状态和处理函数
    const [isDragging, setIsDragging] = useState(false)
    const dragInfo = useRef({
      startX: 0,
      startWidth: initialWidth,
      isDragging: false,
      currentWidth: initialWidth
    })

    // 话术列表和事件列表数据
    const [scriptList, setScriptList] = useState([])
    const [eventList, setEventList] = useState([])
    // 自定义加载状态
    const [isLoadingScripts, setIsLoadingScripts] = useState(false)
    const [isLoadingEvents, setIsLoadingEvents] = useState(false)

    // 试听功能状态 - 改为数组形式，每个话术项独立
    const [synthesizingStates, setSynthesizingStates] = useState({})
    const [audioUrls, setAudioUrls] = useState({})
    const [playingStates, setPlayingStates] = useState({})
    const [audioDurations, setAudioDurations] = useState({})
    const [currentTimes, setCurrentTimes] = useState({})
    const [currentPlayingIndex, setCurrentPlayingIndex] = useState(null) // 当前播放的话术项索引
    const [progress, setProgress] = useState(0)
    const audioRef = useRef(null)

    // 录音播放相关状态
    const [playingAudio, setPlayingAudio] = useState(null)
    const [audioProgress, setAudioProgress] = useState({})
    const [recordingAudioDuration, setRecordingAudioDuration] = useState({})
    const recordingAudioRefs = useRef({})

    // 创建或更新节点配置API
    const createOrUpdateNodeConfig = useCreateOrUpdateNodeConfig()

    // 拖拽排序处理函数
    const handleDragEnd = useCallback(
      (result) => {
        if (!result.destination) {
          return
        }

        const sourceIndex = result.source.index
        const destinationIndex = result.destination.index

        if (sourceIndex === destinationIndex) {
          return
        }

        const currentScripts = form.getFieldValue("scripts") || []
        const newScripts = Array.from(currentScripts)
        const [reorderedItem] = newScripts.splice(sourceIndex, 1)
        newScripts.splice(destinationIndex, 0, reorderedItem)

        // 不修改 priorityLevel，只改变显示顺序
        form.setFieldValue("scripts", newScripts)
      },
      [form]
    )

    // 获取话术列表
    const { data: scriptData, isLoading: scriptLoading } = useGetScriptListByPage(
      {
        pageSize: 10000,
        pageNum: 1,
        botNo,
        taskId
      },
      {
        enabled: open && !!botNo && !!taskId // 当抽屉打开且有botNo和taskId时自动查询
      }
    )

    // 获取事件列表
    const { data: eventData, isLoading: eventLoading } = useGetEventList(
      {
        botNo
      },
      {
        enabled: open && !!botNo // 当抽屉打开且有botNo时自动查询
      }
    )

    // 获取节点详情
    const { data: nodeDetailsData, isLoading: nodeDetailsLoading } = useGetNodeConfigDetails(
      {
        nodeId: node?.nodeId || node?.data?.nodeId,
        botNo,
        taskId
      },
      {
        enabled: open && !!node?.id && !!botNo && !!taskId // 当抽屉打开且有必要参数时自动查询
      }
    )

    // 处理语音合成
    const handleSynthesis = useCallback(
      async (fieldName, scriptIndex) => {
        try {
          const values = form.getFieldsValue()
          const scriptValues = values.scripts?.[scriptIndex] || {}
          console.log("scriptValues", scriptValues)
          const { synthesisText, timbreCode, audioFormat, sampleRate, speed, volume } = scriptValues

          // 验证必填参数
          // if (!timbreCode) {
          //   message.warning("请先选择音色")
          //   return
          // }

          if (!synthesisText) {
            message.warning("请输入要合成的文本")
            return
          }

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

          // 设置当前话术项的合成状态
          setSynthesizingStates((prev) => ({ ...prev, [scriptIndex]: true }))
          setAudioUrls((prev) => ({ ...prev, [scriptIndex]: "" })) // 重置之前的音频

          const params = {
            botNo,
            content: synthesisText,
            timbreCode: nodeDetailsData?.data?.timbreCode || timbreCode,
            audioFormat: audioFormat,
            sampleRate: sampleRate,
            speed: speed,
            volume: volume
          }

          const res = await synthesisVoice(params)

          if (res && res.status === 200) {
            if (res.data) {
              message.success("语音合成成功")
              setAudioUrls((prev) => ({ ...prev, [scriptIndex]: res.data }))
              setProgress(0)
              setCurrentTimes((prev) => ({ ...prev, [scriptIndex]: 0 }))
              setPlayingStates((prev) => ({ ...prev, [scriptIndex]: false })) // 重置播放状态
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
          setSynthesizingStates((prev) => ({ ...prev, [scriptIndex]: false }))
        }
      },
      [form, botNo]
    )

    // 播放或暂停音频
    const togglePlay = useCallback(
      (scriptIndex) => {
        if (audioRef.current) {
          const isCurrentlyPlaying = playingStates[scriptIndex] || false
          if (isCurrentlyPlaying) {
            audioRef.current.pause()
            setCurrentPlayingIndex(null)
          } else {
            // 设置音频源并播放
            const audioUrl = audioUrls[scriptIndex]
            if (audioUrl) {
              audioRef.current.src = audioUrl
              audioRef.current.play()
              setCurrentPlayingIndex(scriptIndex)
            }
          }
          setPlayingStates((prev) => ({ ...prev, [scriptIndex]: !isCurrentlyPlaying }))
        }
      },
      [playingStates, audioUrls]
    )

    // 格式化时间为 mm:ss 格式
    const formatTime = useCallback((time) => {
      if (isNaN(time) || time === 0) return "00:00"
      const minutes = Math.floor(time / 60)
      const seconds = Math.floor(time % 60)
      return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }, [])

    // 处理进度条点击事件
    const handleProgressClick = useCallback(
      (e, scriptIndex) => {
        const duration = audioDurations[scriptIndex]
        if (audioRef.current && duration) {
          const progressBar = e.currentTarget
          const rect = progressBar.getBoundingClientRect()
          const offsetX = e.clientX - rect.left
          const newProgress = (offsetX / progressBar.offsetWidth) * 100
          const newTime = (newProgress / 100) * duration

          audioRef.current.currentTime = newTime
          setProgress(newProgress)
          setCurrentTimes((prev) => ({ ...prev, [scriptIndex]: newTime }))
        }
      },
      [audioDurations]
    )

    // 监听音频进度
    useEffect(() => {
      const handleTimeUpdate = () => {
        if (audioRef.current && currentPlayingIndex !== null) {
          const currentTime = audioRef.current.currentTime
          setCurrentTimes((prev) => ({ ...prev, [currentPlayingIndex]: currentTime }))
          const duration = audioDurations[currentPlayingIndex]
          if (duration) {
            const progressValue = (currentTime / duration) * 100
            setProgress(progressValue)
          }
        }
      }

      const handleLoadedMetadata = () => {
        if (audioRef.current && currentPlayingIndex !== null) {
          const duration = audioRef.current.duration
          setAudioDurations((prev) => ({ ...prev, [currentPlayingIndex]: duration }))
        }
      }

      const handleAudioEnded = () => {
        if (currentPlayingIndex !== null) {
          setPlayingStates((prev) => ({ ...prev, [currentPlayingIndex]: false }))
          setProgress(100)
        }
      }

      const audioElement = audioRef.current
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
    }, [audioRef.current, audioDurations, currentPlayingIndex])

    // 加载意图列表数据
    const loadIntentionList = useCallback(async () => {
      try {
        const res = await getIntentionList({
          taskId,
          type: 1,
          botNo
        })

        if (res.status === "200" && res.data) {
          // 添加去重逻辑，确保intentionCode不重复
          const uniqueIntentions = {}
          res.data.forEach((item) => {
            // 如果intentionCode已存在，只有当前项的intentionId更大时才替换
            if (
              !uniqueIntentions[item.intentionCode] ||
              item.intentionId > uniqueIntentions[item.intentionCode].intentionId
            ) {
              uniqueIntentions[item.intentionCode] = item
            }
          })

          // 转换为数组格式
          const options = Object.values(uniqueIntentions).map((item) => ({
            value: item.intentionCode,
            label: item.intentionName,
            intentionCode: item.intentionCode,
            intentionName: item.intentionName
          }))

          setIntentionOptions(options)
        } else if (res.status === 200 && res.data) {
          // 处理数字状态码的情况
          // 添加去重逻辑，确保intentionCode不重复
          const uniqueIntentions = {}
          res.data.forEach((item) => {
            // 如果intentionCode已存在，只有当前项的intentionId更大时才替换
            if (
              !uniqueIntentions[item.intentionCode] ||
              item.intentionId > uniqueIntentions[item.intentionCode].intentionId
            ) {
              uniqueIntentions[item.intentionCode] = item
            }
          })

          // 转换为数组格式
          const options = Object.values(uniqueIntentions).map((item) => ({
            value: item.intentionCode,
            label: item.intentionName,
            intentionCode: item.intentionCode,
            intentionName: item.intentionName
          }))

          setIntentionOptions(options)
        } else {
          // 如果没有数据，设置一些默认选项防止一直加载
          setIntentionOptions([
            {
              value: "default_intention",
              label: "其他意图",
              intentionCode: "default_intention",
              intentionName: "其他意图"
            }
          ])
        }
      } catch (error) {
        console.error("加载意图列表失败:", error)
        // 出错时也添加默认选项
        setIntentionOptions([
          {
            value: "default_intention",
            label: "其他意图",
            intentionCode: "default_intention",
            intentionName: "其他意图"
          }
        ])
      }
    }, [taskId, botNo])

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
      setIsLoadingScripts(scriptLoading)
    }, [scriptData, scriptLoading])

    // 处理事件列表数据
    useEffect(() => {
      if (eventData?.data?.list && eventData.data.list.length > 0) {
        setEventList(eventData.data.list)
      }
      setIsLoadingEvents(eventLoading)
    }, [eventData, eventLoading])

    // 额外的方式确保抽屉打开时加载数据
    useEffect(() => {
      // 只有当抽屉打开且数据还未加载时才请求数据
      if (open && botNo && !dataLoaded.current) {
        dataLoaded.current = true // 标记数据已开始加载

        // 加载意图列表
        loadIntentionList()
        // 音色列表不再需要加载
      }

      // 当抽屉关闭时重置数据加载标记，以便下次打开时可以重新加载数据
      if (!open) {
        dataLoaded.current = false
      }
    }, [open, botNo, taskId, loadIntentionList])

    // 处理节点详情数据
    useEffect(() => {
      if (nodeDetailsData?.data && open && node) {
        const details = nodeDetailsData.data

        // 重置展开状态为收起
        setScriptsCollapsed(true)

        // 处理scripts数据
        let initialScripts = []
        if (details.scripts && details.scripts.length > 0) {
          initialScripts = details.scripts.map((script, index) => ({
            scriptId: script.scriptId,
            // 直接使用script.variable的原始值，不受外层isOver字段影响
            variable: script.variable || 0,
            name: script.name || null, // 话术名称
            content: script.content || "", // 话术内容
            scriptType: script.scriptType || 1, // 话术类型
            scriptTags: script.scriptTags || [], // 话术标签
            rule: script.rule || "",
            // 确保ruleStatus字段被正确设置
            ruleStatus: script.ruleStatus || 0, // 添加ruleStatus字段，默认为0
            priorityLevel: script.priorityLevel || index + 1,
            // 音频相关参数（当有变量时）
            audioFormat: script.audioFormat || "wav",
            sampleRate: script.sampleRate || 8000,
            volume: script.volume || 50,
            speed: script.speed || 1.05,
            timbreCode: script.timbreCode || details.timbreCode || null, // 优先使用script的timbreCode，否则使用详情的timbreCode
            // 录音相关参数（当无变量时）
            scriptVoices: script.scriptVoices || [],
            // 折叠状态字段，默认为false
            collapsed: script.collapsed || true,
            scriptRuleId: script.scriptRuleId || new Date().getTime(),
            // 颜色分组字段
            groupFlag: script.groupFlag || undefined
          }))
        }

        // 设置scripts字段
        form.setFieldsValue({
          scripts: initialScripts
        })
        setPendingScripts([])

        // 获取是否是挂机节点
        const mountedValue = details.ctiOrder === "toQueue" || details.ctiOrder === "toOver"

        setIsMountedNode(mountedValue)

        // 获取是否是开场白节点（仅工作流模式下有效）
        const prologueValue = flowType === 1 ? node?.isPrologue || false : false
        setIsPrologueNode(prologueValue)

        // 处理客户意图数据
        if (details.intentions && details.intentions.length > 0) {
          console.log("intent=>>>>>>", details.intentions)
          const intents = details.intentions.map((intent, index) => ({
            id: intent.intentionId || index + 1,
            name: intent.intentionCode || "",
            label: intent.intentionName | "",
            value: intent.intentionName || "",
            intentionName: intent.intentionName || "",
            intentionCode: intent.intentionCode || "",
            required: false
          }))
          setCustomerIntents(intents)
        } else {
          setCustomerIntents([])
        }
        // console.log("node11111", node, details)
        // 填充表单
        const formValues = {
          nodeName: node?.type === "stateMachineRoot" ? "开场白" : details.nodeName || "",
          // 状态机模式下的子节点ID编辑
          nodeId:
            flowType === 2 && node?.type === "stateMachineChild"
              ? node?.id || node?.nodeId || undefined
              : node?.id || details?.nodeCode || undefined,
          // 状态机根节点固定为非挂机节点，但仍然设置字段供表单使用
          isMounted:
            flowType === 2 && node?.type === "stateMachineRoot" ? false : details.isOver === 1,
          // 设置新的 ctiOrder 字段，根据 isOver 状态映射
          ctiOrder: details.ctiOrder,
          isOver: details.ctiOrder === "toOver" ? 1 : 0,
          isPrologueNode: flowType === 1 ? node?.isPrologue || false : false,
          eventRelations: Array.isArray(details.events)
            ? details.events.map((event) => String(event.id))
            : [],
          customerIntentsList: details.intentions?.map((intent) => intent.intentionCode) || [],
          // 打断逻辑字段，仅在flowType为1或2时包含，默认值为0（不开启）
          ...(flowType === 1 || flowType === 2 ? { nonInterrupt: details.nonInterrupt || 0 } : {}),
          // FAQ播报节点递进话术
          emptySoundType: details.emptySoundType || 0,
          // FAQ话术支持触发节点关联事件，仅在剧本模式时包含
          ...(flowType === 2 ? { faqEvent: details.faqEvent || 0 } : {}),
          stepNo: details.stepNo || "one",
          // 话术轮询
          scriptPoll: details.scriptPoll || 0,
          // 添加音色相关字段
          timbreCode: details.timbreCode || null,
          timbreName: details.timbreName || "",
          timbreModel: details.timbreModel || details.timbreCode || ""
        }

        // 添加客户意图到表单值
        if (details.intentions) {
          details.intentions.forEach((intent) => {
            formValues[intent.intentionCode] = intent.intentionName
          })
        }

        form.setFieldsValue(formValues)
      }
    }, [nodeDetailsData, open, node, form, flowType])

    // 原有的从node数据获取信息的useEffect（作为fallback）
    useEffect(() => {
      if (open && node && !nodeDetailsData?.data) {
        // 重置展开状态为收起
        setScriptsCollapsed(false)

        // 获取节点中存储的scripts数组
        let initialScripts = []
        if (node?.data?.scripts?.length > 0) {
          // 确保每个script都包含新增的字段
          initialScripts = node.data.scripts.map((script, index) => ({
            scriptId: script.scriptId,
            variable: script.variable || 0, // 是否包含变量
            name: script.name || null, // 话术名称
            content: script.content || "", // 话术内容
            scriptType: script.scriptType || 1, // 话术类型
            scriptTags: script.scriptTags || [], // 话术标签
            rule: script.rule || "",
            priorityLevel: script.priorityLevel || index + 1,
            // 音频相关参数（当有变量时）
            audioFormat: script.audioFormat || "wav",
            sampleRate: script.sampleRate || 8000,
            volume: script.volume || 50,
            speed: script.speed || 1.05,
            timbreCode: script.timbreCode || null,
            // 录音相关参数（当无变量时）
            scriptVoices: script.scriptVoices || [],
            // 折叠状态字段，默认为false
            collapsed: script.collapsed || false,
            scriptRuleId: script?.script || new Date().getTime()
          }))
        } else if (node?.data?.scriptIds) {
          initialScripts = node.data.scriptIds.map((scriptId, index) => ({
            scriptId,
            variable: 0, // 默认无变量
            name: null,
            content: "",
            scriptType: 1,
            scriptTags: [],
            rule: "",
            priorityLevel: index + 1,
            audioFormat: "wav",
            sampleRate: 8000,
            volume: 50,
            speed: 1.05,
            timbreCode: null,
            scriptVoices: [],
            // 折叠状态字段，默认为false
            collapsed: false,
            scriptRuleId: new Date().getTime()
          }))
        } else if (node?.data?.selectedScriptIds) {
          initialScripts = node.data.selectedScriptIds.map((scriptId, index) => ({
            scriptId,
            variable: 0, // 默认无变量
            name: null,
            content: "",
            scriptType: 1,
            scriptTags: [],
            rule: "",
            priorityLevel: index + 1,
            audioFormat: "wav",
            sampleRate: 8000,
            volume: 50,
            speed: 1.05,
            timbreCode: null,
            scriptVoices: [],
            // 折叠状态字段，默认为false
            collapsed: false,
            scriptRuleId: new Date().getTime()
          }))
        }
        // 每次节点切换都强制设置 scripts 字段，无论 initialScripts 是否为空数组
        form.setFieldsValue({
          scripts: initialScripts
        })
        setPendingScripts([])

        // 获取是否是挂机节点
        const mountedValue = node?.data?.ctiOrder === "toQueue" || node?.data?.ctiOrder === "toOver"
        // node?.data?.isMounted ||
        // node?.data?.ctiOrder === "toQueue" ||
        // node?.data?.ctiOrder === "toOver" ||
        // false
        setIsMountedNode(mountedValue)

        // 获取是否是开场白节点（仅工作流模式下有效）
        const prologueValue = flowType === 1 ? node?.isPrologue || false : false
        setIsPrologueNode(prologueValue)

        // 从customerIntents数据初始化客户意图
        if (node?.data?.customerIntents && node.data.customerIntents.length > 0) {
          const intents = node.data.customerIntents.map((intent, index) => ({
            id: intent.id || index + 1,
            name: intent.name || "",
            label: intent.label || "",
            value: intent.intentionName || "",
            intentionName: intent.intentionName || "",
            intentionCode: intent.intentionCode || "",
            required: intent.required
          }))
          setCustomerIntents(intents)
        } else {
          // 如果节点没有保存意图数组，设置为空数组
          setCustomerIntents([])
        }

        // 填充表单
        const formValues = {
          nodeName: node?.type === "stateMachineRoot" ? "开场白" : node?.data?.nodeName || "",
          // 状态机模式下的子节点ID编辑
          nodeId:
            flowType === 2 && node?.type === "stateMachineChild"
              ? node?.id || node?.nodeId || undefined
              : node?.nodeId || node?.nodeCode || undefined,
          // 状态机根节点固定为非挂机节点，但仍然设置字段供表单使用
          isMounted:
            flowType === 2 && node?.type === "stateMachineRoot"
              ? false
              : node?.data?.isMounted || false,
          isPrologueNode: flowType === 1 ? node?.isPrologue || false : false, // 从节点根级别读取
          eventRelations: Array.isArray(node?.data?.eventRelations)
            ? node.data.eventRelations.map(String) // 确保是字符串数组
            : node?.data?.eventRelations
              ? [String(node.data.eventRelations)] // 兼容旧的单选格式
              : [], // 默认空数组
          customerIntentsList:
            node?.data?.customerIntents?.map((intent) => intent.intentionCode) || [], // 使用intentionCode作为值
          // 打断逻辑字段，仅在flowType为1或2时包含，默认值为0（不开启）
          ...(flowType === 1 || flowType === 2
            ? { nonInterrupt: node?.data?.nonInterrupt || 0 }
            : {}),
          // FAQ播报节点递进话术
          emptySoundType: node?.data?.emptySoundType || 0,
          // FAQ话术支持触发节点关联事件，仅在剧本模式时包含
          ...(flowType === 2 ? { faqEvent: node?.data?.faqEvent || 0 } : {}),
          stepNo: node?.data?.stepNo || "one",
          // 话术轮询
          scriptPoll: node?.data?.scriptPoll || 0
        }

        // 添加客户意图到表单值
        if (node?.data?.customerIntents) {
          node.data.customerIntents.forEach((intent) => {
            formValues[intent.name] = intent.intentionName
          })
        }

        form.setFieldsValue(formValues)
      }
    }, [open, node, form, nodeDetailsData, flowType])

    useEffect(() => {
      if (open && scriptList.length > 0 && pendingScripts.length > 0) {
        form.setFieldsValue({
          scripts: pendingScripts
        })
        setPendingScripts([])
      }
    }, [open, scriptList, pendingScripts, form])

    // 检查并设置 scripts 字段的默认值
    useEffect(() => {
      if (!open) return

      // 延迟执行以确保表单已完全初始化
      const timer = setTimeout(() => {
        const currentScripts = form.getFieldValue("scripts")

        // 检查是否有详情数据中的scripts
        const hasDetailScripts =
          nodeDetailsData?.data?.scripts && nodeDetailsData.data.scripts.length > 0
        // 检查是否有node数据中的scripts
        const hasNodeScripts = node?.data?.scripts && node.data.scripts.length > 0

        // 只有当scripts为空且接口返回的详情数据中也没有scripts时，才设置默认值
        if (
          (!currentScripts || currentScripts.length === 0) &&
          !hasDetailScripts &&
          !hasNodeScripts
        ) {
          console.log("创建默认空话术项")
          form.setFieldValue("scripts", [
            {
              scriptId: undefined,
              variable: 0, // 默认无变量
              name: null,
              content: "",
              scriptType: 1,
              scriptTags: [],
              rule: "",
              priorityLevel: 1,
              // 音频相关参数默认值
              audioFormat: "wav",
              sampleRate: 8000,
              volume: 50,
              speed: 1.05,
              timbreCode: null,
              // 录音相关参数
              scriptVoices: [],
              scriptRuleId: new Date().getTime()
            }
          ])
        }
      }, 300) // 增加延迟时间，确保接口数据已加载

      return () => clearTimeout(timer)
    }, [open, form, nodeDetailsData, node])

    // 使用防抖函数减少验证频率
    const debouncedValidate = useCallback(
      (fieldName) => {
        setTimeout(() => {
          form.validateFields([fieldName])
        }, 500)
      },
      [form]
    )

    // 处理意图搜索 - 现在仅用于记录搜索值，不再触发API请求
    const handleIntentionSearch = useCallback(
      (value) => {
        setSearchValue(value)

        // 如果搜索值为空，清空搜索框
        if (value === "") {
          const inputEl = document.querySelector(
            'div[class*="ant-select"][class*="customerIntentsList"] .ant-select-selection-search-input'
          )
          if (inputEl) {
            inputEl.value = ""
          }
        }

        // 检查是否是精确匹配已有意图
        if (
          value &&
          intentionOptions.some((option) => option.label?.toLowerCase() === value?.toLowerCase())
        ) {
          console.log(`搜索值"${value}"精确匹配已存在的意图`)
        }
      },
      [intentionOptions]
    )

    // 添加自定义意图
    const addCustomIntention = useCallback(
      async (intentionName, intentionCode) => {
        try {
          const res = await saveIntentionConfig({
            botNo,
            taskId,
            intentionName,
            intentionCode
          })

          // 检查响应格式，确定数据位置
          if (res.status === "200" || res.status === 200) {
            // 数据可能在res.data或直接在res中
            const intentionData = res.data || res

            // 刷新意图列表
            await loadIntentionList()

            // 根据返回的数据格式返回新增的意图信息
            if (intentionData.intentionCode) {
              // 返回格式符合预期
              return {
                value: intentionData.intentionCode,
                label: intentionData.intentionName,
                intentionCode: intentionData.intentionCode
              }
            } else {
              console.error("意图数据格式不符合预期:", intentionData)
              return null
            }
          }
          return null
        } catch (error) {
          console.error("新增意图失败:", error)
          message.error("新增意图失败，请稍后重试")
          return null
        }
      },
      [botNo, taskId, loadIntentionList]
    )

    // 获取当前选中的意图值 (intentionCode数组)
    const getSelectedIntentionValues = useCallback(() => {
      return customerIntents.map((intent) => intent.intentionCode || "").filter((code) => code)
    }, [customerIntents])

    // 创建新意图的处理函数
    const handleCreateNewIntention = useCallback(async () => {
      if (!searchValue.trim()) {
        message.warning("请输入意图名称")
        return
      }

      if (!intentionCodeValue.trim()) {
        message.warning("请输入意图编码")
        return
      }

      // 检查是否已存在完全相同的意图名称
      const exactMatchOption = intentionOptions.find(
        (option) => option.label.toLowerCase() === searchValue.trim().toLowerCase()
      )

      if (exactMatchOption) {
        message.warning(`意图"${searchValue.trim()}"已存在，请选择列表中的已有意图`)
        return
      }

      // 检查是否已存在完全相同的意图编码
      const exactMatchCodeOption = intentionOptions.find(
        (option) => option.intentionCode.toLowerCase() === intentionCodeValue.trim().toLowerCase()
      )

      if (exactMatchCodeOption) {
        message.warning(`意图编码"${intentionCodeValue.trim()}"已存在，请使用不同的编码`)
        return
      }

      try {
        // 传递intentionName和intentionCode给API
        const newIntention = await addCustomIntention(searchValue.trim(), intentionCodeValue.trim())

        if (newIntention) {
          // 重新获取最新的意图选项列表
          const freshOptions = await getIntentionList({
            taskId,
            type: 1,
            botNo
          })

          let newOptionList = []
          if (freshOptions.status === "200" || freshOptions.status === 200) {
            // 添加去重逻辑，确保intentionCode不重复
            const uniqueIntentions = {}
            freshOptions.data.forEach((item) => {
              if (
                !uniqueIntentions[item.intentionCode] ||
                item.intentionId > uniqueIntentions[item.intentionCode].intentionId
              ) {
                uniqueIntentions[item.intentionCode] = item
              }
            })

            // 转换为数组格式
            newOptionList = Object.values(uniqueIntentions).map((item) => ({
              value: item.intentionCode,
              label: item.intentionName,
              intentionCode: item.intentionCode,
              intentionName: item.intentionName
            }))

            // 更新意图选项列表
            setIntentionOptions(newOptionList)
          }

          // 获取当前已选中的值
          const currentValues = getSelectedIntentionValues()

          // 直接更新customerIntents，添加新意图
          const newId =
            customerIntents.length > 0 ? Math.max(...customerIntents.map((i) => i.id), 0) + 1 : 1

          const newIntent = {
            id: newId,
            name: `customerIntent${newId}`,
            label: `客户回答意图${newId}`,
            value: newIntention.label,
            intentionName: newIntention.label,
            intentionCode: newIntention.value,
            required: true
          }

          setCustomerIntents((prev) => [...prev, newIntent])

          // 设置表单值
          form.setFieldValue(newIntent.name, newIntent.value)

          // 更新Select的值
          const updatedSelectValues = [...currentValues, newIntention.value]
          form.setFieldValue("customerIntentsList", updatedSelectValues)

          // 清空输入框
          setSearchValue("")
          setIntentionCodeValue("")

          // 验证表单
          setTimeout(() => {
            form.validateFields(["customerIntentsList"])
          }, 0)

          message.success(`意图"${newIntention.label}"创建成功`)

          // 关闭下拉框
          const selectElement = document.querySelector(
            '[class*="customerIntentsList"] .ant-select-selector'
          )
          if (selectElement) {
            selectElement.blur()
          }
        }
      } catch (error) {
        console.error("创建意图失败:", error)
        message.error("创建意图失败，请稍后重试")
      }
    }, [
      searchValue,
      intentionCodeValue,
      intentionOptions,
      addCustomIntention,
      customerIntents,
      form,
      getSelectedIntentionValues,
      botNo,
      taskId
    ])

    // 处理意图选择变化
    const handleIntentionChange = useCallback(
      (values, options) => {
        // 将选中的意图转换为customerIntents格式
        const selectedIntents = Array.isArray(options) ? options : [options]

        // 清空旧的意图列表
        const oldIntents = [...customerIntents]
        const newIntentNames = selectedIntents.map((opt) => opt?.label || "")

        // 过滤掉已移除的意图
        const remainingIntents = oldIntents.filter((intent) =>
          values.includes(intent.intentionCode)
        )

        // 添加新选择的意图 - 只处理界面上新选中的
        const existingCodes = remainingIntents.map((intent) => intent.intentionCode)
        const newCodes = values.filter((code) => !existingCodes.includes(code))

        const intentsToAdd = []

        // 为每个新选中的code找到对应的选项
        newCodes.forEach((code) => {
          // 从intentionOptions中找到对应选项
          const matchOption = intentionOptions.find((opt) => opt.value === code)
          if (matchOption) {
            // 生成一个新的ID
            const newId =
              customerIntents.length > 0 ? Math.max(...customerIntents.map((i) => i.id), 0) + 1 : 1

            intentsToAdd.push({
              id: newId,
              name: `customerIntent${newId}`,
              label: `客户回答意图${newId}`,
              value: matchOption.intentionName,
              intentionName: matchOption.intentionName,
              intentionCode: matchOption.intentionCode,
              required: true
            })
          }
        })

        // 更新意图列表
        const updatedIntents = [...remainingIntents, ...intentsToAdd]
        setCustomerIntents(updatedIntents)

        // 设置表单值
        updatedIntents.forEach((intent) => {
          form.setFieldValue(intent.name, intent.intentionName)
        })

        // 验证表单
        setTimeout(() => {
          form.validateFields(["customerIntentsList"])
        }, 0)
      },
      [customerIntents, form, intentionOptions]
    )

    // 清理搜索定时器
    useEffect(() => {
      return () => {
        if (searchTimeout) {
          clearTimeout(searchTimeout)
        }
      }
    }, [searchTimeout])

    // 优化onFinish，减少不必要的计算和对象创建
    const onFinish = useCallback(
      async (values) => {
        // 这里处理表单提交

        // 统一进行表单验证并显示全局提示
        if (!values.nodeName?.trim()) {
          message.error("请输入节点名称")
          return
        }

        // 检查脚本数据和节点详情是否已加载完成
        if (scriptLoading || isLoadingScripts || nodeDetailsLoading) {
          message.warning("数据正在加载中，请稍候再试")
          return
        }

        // 验证scripts字段
        if (!values.scripts || values.scripts.length === 0) {
          message.error("请添加至少一个播报话术")
          return
        }

        // 校验脚本优先级，兼容老数据
        const scriptsToCheck =
          values.scripts && values.scripts.length > 0
            ? values.scripts
            : (values.scriptIds || []).map((scriptId, idx) => ({
                scriptId,
                rule: "",
                priorityLevel: idx + 1
              }))
        for (let i = 0; i < scriptsToCheck.length; i++) {
          const script = scriptsToCheck[i]
          if (!script.priorityLevel || script.priorityLevel < 1) {
            message.error(`第${i + 1}个话术的优先级必须是大于0的正整数`)
            return
          }
        }

        // 表单会自动验证customerIntentsList字段，无需手动检查

        try {
          // 收集所有客户意图的值
          const updatedIntents = customerIntents.map((intent) => ({
            ...intent,
            value: values[intent.name] || intent.intentionName || ""
          }))

          // 检查是否有客户意图 - 仅在非挂机节点、非开场白节点且非状态机模式时检查
          if (
            values.ctiOrder !== "toQueue" &&
            values.ctiOrder !== "toOver" &&
            !values.isPrologueNode &&
            flowType !== 2 &&
            updatedIntents.length === 0
          ) {
            message.error("请添加至少一个客户回答意图")
            return
          }

          // 过滤出有效的客户意图（有值的意图）
          const validIntents = updatedIntents
            .filter((intent) => intent.intentionCode) // 确保有intentionCode
            .map((intent) => ({
              intentionName: intent.intentionName || intent.value || intent.label, // 优先使用intentionName，然后尝试value和label
              intentionCode: intent.intentionCode
            }))

          // 确保有有效的意图 - 仅在非挂机节点、非开场白节点且非状态机模式时检查
          if (
            values.ctiOrder !== "toQueue" &&
            values.ctiOrder !== "toOver" &&
            !values.isPrologueNode &&
            flowType !== 2 &&
            validIntents.length === 0
          ) {
            message.error("请确保至少一个客户回答意图有效")
            return
          }

          // 构建API参数
          // 确定正确的nodeCode：如果是状态机子节点且用户修改了ID，使用新ID；否则使用原ID
          const nodeCode =
            // flowType === 2 &&
            // node?.type === "stateMachineChild" &&
            values.nodeId && values.nodeId.trim() !== node.id ? values.nodeId.trim() : node?.id

          // 处理scripts数据，获取完整的script信息
          const validScripts = values.scripts
            .map((scriptItem) => {
              const script = scriptList.find((s) => s.scriptId === scriptItem.scriptId)
              return script
                ? {
                    ...script,
                    rule: scriptItem.rule || "",
                    priorityLevel: scriptItem.priorityLevel || 1
                  }
                : null
            })
            .filter((script) => script) // 过滤掉找不到的script

          // 实时计算isOver值，基于用户的节点类型选择
          // 优先使用新的 ctiOrder 字段，如果不存在则使用旧的 isMounted 字段保持向后兼容
          const ctiOrderValue = values.ctiOrder
          let calculatedIsOver = 0

          if (ctiOrderValue !== undefined) {
            // 使用新的 ctiOrder 字段
            calculatedIsOver = ctiOrderValue === "toOver" ? 1 : 0
          } else {
            // 保持向后兼容，使用旧的 isMounted 字段
            calculatedIsOver =
              flowType === 2 && node?.type === "stateMachineRoot" ? 0 : values.isMounted ? 1 : 0
          }

          // 获取当前脚本列表用于提交
          const currentScripts = form.getFieldValue("scripts") || []

          const params = {
            botNo,
            taskId,
            nodeName: values.nodeName?.trim(),
            nodeCode, // 使用计算出的nodeCode
            scriptContent: validScripts.map((script) => script.content).join("\n\n"),
            // 使用实时计算的isOver值
            isOver: calculatedIsOver, // 是否挂机节点 0 否 1 是
            isPrologue: values.isPrologueNode,
            ctiOrder: values.ctiOrder || "",
            // 打断逻辑字段，仅在flowType为1或2时包含
            ...(flowType === 1 || flowType === 2 ? { nonInterrupt: values.nonInterrupt || 0 } : {}),
            scripts: currentScripts.map((script) => {
              // 从scriptList中查找对应的话术内容
              const selectedScript = scriptList.find((s) => s.scriptId === script.scriptId)
              const scriptContent = selectedScript?.content || ""

              const scriptData = {
                scriptId: script.scriptId,
                variable: script.variable || 0, // 是否包含变量 0 否 1是
                name: selectedScript?.name || script.name || null, // 话术名称
                content: scriptContent, // 从scriptList中获取话术内容
                scriptType: script.scriptType || 1, // 话术类型
                scriptTags: script.scriptTags || [], // 话术标签
                rule: script.rule || "",
                ruleStatus: script.ruleStatus || 0, // 添加ruleStatus字段，用于保存话术规则状态
                priorityLevel: script.priorityLevel || 1,
                // 颜色分组字段
                groupFlag: script.groupFlag || undefined
              }

              // 当选择"有变量"时，添加音频相关参数
              if (script.variable === 1) {
                scriptData.timbreCode = values.timbreCode || null // 使用详情接口返回的音色编码
                scriptData.audioFormat = script.audioFormat || "wav" // 音频格式
                scriptData.sampleRate = script.sampleRate || 8000 // 采样率
                scriptData.volume = script.volume || 50 // 音量
                scriptData.speed = script.speed || 1.05 // 播放速度
              } else if (script.variable === 0) {
                // 当选择"无变量"时，添加录音列表和音色编码
                scriptData.scriptVoices = script.scriptVoices || [] // 录音列表
                scriptData.timbreCode = values.timbreCode || null // 使用详情接口返回的音色编码
              }

              return scriptData
            }),
            // FAQ播报节点递进话术
            emptySoundType: values.emptySoundType || 0,
            // FAQ话术支持触发节点关联事件，仅在剧本模式时包含
            ...(flowType === 2 ? { faqEvent: values.faqEvent || 0 } : {}),
            // 话术预生成步骤数
            stepNo: values.stepNo || "one",
            // 话术轮询
            scriptPoll: values.scriptPoll || 0
          }

          // 只有在非挂机节点时，才添加意图（状态机根节点不处理意图）
          const isMountedForCheck =
            flowType === 2 && node?.type === "stateMachineRoot"
              ? false
              : values?.ctiOrder === "toQueue" || values?.ctiOrder === "toOver"

          if (!isMountedForCheck) {
            params.intentions = validIntents // 客户意图数组
          }

          // 只有在选择了事件且非挂机节点时，才添加事件
          if (
            values.eventRelations &&
            Array.isArray(values.eventRelations) &&
            values.eventRelations.length > 0 &&
            !values.isMounted
          ) {
            params.events = values.eventRelations.map((eventId) => ({
              id: parseInt(eventId),
              triggerAction: "init" // 所有的都是init
            }))
          }

          // 如果是编辑现有节点，需要传递nodeId
          if (node?.data?.nodeId && node.data.nodeId !== true) {
            params.nodeId = node.data.nodeId
          } else {
            console.log("新建节点，不传递nodeId")
          }

          // 调用接口保存节点
          const res = await createOrUpdateNodeConfig(params)

          if (res.status === 200) {
            message.success("节点保存成功！")

            // 记录返回的nodeId
            const returnedNodeId = res.data

            // 使用缓存避免重复计算，复用前面计算的validScripts
            const combinedScriptContent = validScripts.map((script) => script.content).join("\n\n")

            // 从客户意图创建标签（tags），状态机根节点或挂机节点为空数组
            const isMountedForTags =
              flowType === 2 && node?.type === "stateMachineRoot" ? false : values.isMounted
            const customerIntentTags = isMountedForTags
              ? []
              : validIntents.map((intent) => ({
                  // id: `tag_${Date.now()}_${Math.random()}`,
                  id: intent.intentionCode,
                  label: intent.intentionName,
                  value: intent.intentionCode
                }))

            // 检查是否从普通节点变为挂机节点（状态机根节点不适用）
            const previousMounted =
              flowType === 2 && node?.type === "stateMachineRoot"
                ? false
                : node.data?.isMounted || false
            const currentMounted =
              flowType === 2 && node?.type === "stateMachineRoot" ? false : values.isMounted
            const becameHangupNode = !previousMounted && currentMounted

            // 更新节点数据
            if (node) {
              const updatedData = {
                ...node.data,
                // 节点名称/标题 - 状态机根节点固定为"开场白"
                nodeName:
                  node.type === "stateMachineRoot" ? "开场白" : values.nodeName?.trim() || "",
                // 同时更新title字段，确保状态机子节点显示正确的名称
                title: node.type === "stateMachineRoot" ? "开场白" : values.nodeName?.trim() || "",
                // 节点内容
                content: combinedScriptContent,
                // 客户回答意图 - 转换为标签，如果是挂机节点则为空数组
                tags: customerIntentTags,

                // 保存新的scripts数据结构
                scripts: values.scripts,
                // 只保存scripts数据结构，不再需要兼容旧格式
                scriptIds: validScripts.map((script) => script.scriptId),
                // 状态机根节点固定为非挂机节点
                isMounted:
                  flowType === 2 && node?.type === "stateMachineRoot" ? false : values.isMounted,
                ctiOrder: values.ctiOrder,
                eventRelations: Array.isArray(values.eventRelations)
                  ? values.eventRelations
                  : values.eventRelations
                    ? [values.eventRelations]
                    : [],
                // 状态机根节点或挂机节点，清空客户意图
                customerIntents: currentMounted ? [] : updatedIntents,

                // 保存节点ID - 如果是新建节点，使用返回的nodeId；否则保留原有的nodeId
                nodeId: returnedNodeId || node.data?.nodeId,

                // 添加标记表示节点已经保存，不应该保持选中状态
                shouldClearSelection: true,

                // 标记是否需要删除相关边
                shouldRemoveEdges: becameHangupNode,

                // isPrologue字段现在在节点根级别，不在data中
                isPrologue: values.isPrologueNode,

                // 通知父组件取消其他节点的开场白状态
                clearOtherPrologues: values.isPrologueNode,

                // 保存打断逻辑字段，仅在flowType为1或2时包含
                ...(flowType === 1 || flowType === 2
                  ? { nonInterrupt: values.nonInterrupt || 0 }
                  : {}),

                // FAQ播报节点递进话术
                emptySoundType: values.emptySoundType || 0,
                // FAQ话术支持触发节点关联事件，仅在剧本模式时包含
                ...(flowType === 2 ? { faqEvent: values.faqEvent || 0 } : {}),
                // 话术预生成步骤数
                stepNo: values.stepNo || "one",
                // 话术轮询
                scriptPoll: values.scriptPoll || 0
              }

              // 如果父组件传递了onUpdate回调，则调用它
              if (onUpdate) {
                // 检查是否是状态机模式下的子节点ID更新
                let targetNodeId = node.id
                if (
                  // flowType === 2 &&
                  // node?.type === "stateMachineChild" &&
                  values.nodeId &&
                  values.nodeId.trim() !== node.id
                ) {
                  const newNodeId = values.nodeId.trim()
                  // 添加节点ID更新标记
                  updatedData.newNodeId = newNodeId
                  updatedData.oldNodeId = node.id
                  // 目标节点ID是新的ID
                  targetNodeId = newNodeId
                }

                onUpdate(targetNodeId, updatedData)

                // 添加一个微小延迟以确保节点选中状态被清除
                setTimeout(() => {
                  onClose()
                }, 0)
                return
              }
            }

            // 如果没有onUpdate或没有节点数据，直接关闭抽屉
            onClose()
          } else {
            message.error(
              `${res.message} ${res?.data ? "【" + res.data + "】" : ""}` || "节点保存失败"
            )
          }
        } catch (error) {
          console.error("保存节点配置出错:", error)
          message.error("保存节点配置失败，请稍后重试")
        }
      },
      [
        node,
        customerIntents,
        onUpdate,
        onClose,
        botNo,
        taskId,
        createOrUpdateNodeConfig,
        flowType,
        scriptList,
        scriptLoading,
        isLoadingScripts,
        nodeDetailsLoading
      ]
    )

    // 优化表单提交处理
    const handleFormSubmit = useCallback(() => {
      form.submit()
    }, [form])

    // 处理鼠标按下事件
    const handleMouseDown = useCallback((e) => {
      // 防止文本选择和默认行为
      e.preventDefault()

      const drawerElement = document.querySelector(
        ".node-edit-drawer-offset .ant-drawer-content-wrapper"
      )
      if (!drawerElement) return

      // 获取当前宽度
      const computedStyle = window.getComputedStyle(drawerElement)
      const currentWidth = parseInt(computedStyle.width, 10)

      // 设置拖动状态
      dragInfo.current = {
        startX: e.clientX,
        startWidth: currentWidth,
        isDragging: true,
        currentWidth: currentWidth
      }

      // 立即应用激活样式，不等待状态更新
      document.body.classList.add("drawer-resizing")
      resizeHandleRef.current?.classList.add("active")

      // 延迟更新React状态，避免立即渲染
      setTimeout(() => setIsDragging(true), 0)
    }, [])

    // 处理鼠标移动
    const handleMouseMove = useCallback((e) => {
      // 直接检查全局状态而不是ref，可能更可靠
      if (!dragInfo.current.isDragging) return

      // 使用requestAnimationFrame使拖动更平滑，但避免复杂的节流逻辑
      // 简化处理逻辑，减少判断条件
      e.preventDefault()

      // 直接计算宽度并应用，让拖动更即时
      const deltaX = e.clientX - dragInfo.current.startX
      const newWidth = dragInfo.current.startWidth - deltaX

      // 限制宽度范围
      const clampedWidth = Math.min(Math.max(newWidth, 400), 900)

      // 直接更新DOM元素，不使用requestAnimationFrame嵌套
      const drawerElement = document.querySelector(
        ".node-edit-drawer-offset .ant-drawer-content-wrapper"
      )
      if (drawerElement) {
        drawerElement.style.width = `${clampedWidth}px`
        dragInfo.current.currentWidth = clampedWidth
      }
    }, [])

    // 处理鼠标松开
    const handleMouseUp = useCallback(() => {
      if (!dragInfo.current.isDragging) return

      // 重置拖动状态
      dragInfo.current.isDragging = false

      // 立即移除全局样式，不等待状态更新
      document.body.classList.remove("drawer-resizing")
      resizeHandleRef.current?.classList.remove("active")

      // 使用setTimeout延迟更新宽度，以确保过渡效果恢复
      setTimeout(() => {
        // 更新React状态以确保组件与DOM同步
        setDrawerWidth(dragInfo.current.currentWidth || drawerWidth)

        // 延迟更新拖动状态，避免UI闪烁
        setIsDragging(false)
      }, 10)

      // 保存当前宽度到localStorage
      try {
        localStorage.setItem(
          "voice_flow_drawer_width",
          (dragInfo.current.currentWidth || drawerWidth).toString()
        )
      } catch (e) {
        console.warn("Failed to save drawer width", e)
      }
    }, [drawerWidth])

    // 添加和移除事件监听器
    useEffect(() => {
      let isListening = false

      const setupListeners = () => {
        if (open && !isListening) {
          // 使用passive: false以允许preventDefault
          document.addEventListener("mousemove", handleMouseMove, { passive: false })
          document.addEventListener("mouseup", handleMouseUp)
          isListening = true
        }
      }

      const cleanupListeners = () => {
        if (isListening) {
          document.removeEventListener("mousemove", handleMouseMove)
          document.removeEventListener("mouseup", handleMouseUp)
          document.body.classList.remove("drawer-resizing")
          isListening = false
        }
      }

      // 初始设置
      setupListeners()

      // 状态变化时重设
      if (!open) {
        cleanupListeners()
      }

      // 清理函数
      return cleanupListeners
    }, [open, handleMouseMove, handleMouseUp])

    // 抽屉关闭时清空数据
    useEffect(() => {
      if (!open) {
        // 清空搜索值
        setSearchValue("")
        setIntentionCodeValue("")

        // 重置数据加载标记，以便下次打开时可以重新加载数据
        dataLoaded.current = false
      }
    }, [open])

    // 监听 isMounted 字段变化，自动同步 UI 展示（不再受脚本变量影响）
    const watchedScripts = Form.useWatch("scripts", form)
    const watchedIsMounted = Form.useWatch("isMounted", form)
    const watchedCtiOrder = Form.useWatch("ctiOrder", form)

    useEffect(() => {
      if (!open) return

      // 仅根据用户手动的“是否挂机节点”开关同步 UI 状态
      const newIsOver =
        flowType === 2 && node?.type === "stateMachineRoot"
          ? 0
          : watchedIsMounted || watchedCtiOrder
            ? 1
            : 0

      // console.log("mountedValue=>>", watchedCtiOrder, newIsOver)

      // 更新 isMountedNode 状态以反映当前的 isOver 状态
      setIsMountedNode(newIsOver === 1)

      // // 调试日志：输出实时计算过程
      // console.log("实时isOver计算:", {
      //   watchedIsMounted,
      //   newIsOver,
      //   scriptsCount: Array.isArray(watchedScripts) ? watchedScripts.length : 0
      // })
    }, [watchedIsMounted, flowType, node?.type, open, watchedScripts])

    // 跳转到话术列表页面
    const handleNavigateToScriptList = useCallback(() => {
      navigate(`/voice/scriptManage?id=${taskId}&botNo=${botNo}`)
    }, [navigate, taskId, botNo])

    // 处理抽屉关闭
    const handleDrawerClose = useCallback(() => {
      // 清空搜索值
      setSearchValue("")
      setIntentionCodeValue("")

      // 调用传入的onClose函数
      onClose()
    }, [onClose])

    return (
      <Drawer
        title="节点编辑"
        placement="right"
        width={drawerWidth}
        onClose={handleDrawerClose}
        open={open}
        bodyStyle={{ padding: 24 }}
        maskClosable={false}
        mask={false}
        rootClassName="node-edit-drawer-offset"
        ref={drawerRef}
        footer={
          <div className="text-right">
            <Space>
              <Button onClick={onClose}>取消</Button>
              <Button type="primary" disabled={isOnlyRead} onClick={handleFormSubmit}>
                保存
              </Button>
            </Space>
          </div>
        }
      >
        {/* 添加拖动调整宽度的控制条 */}
        <div
          ref={resizeHandleRef}
          className={`drawer-resize-handle ${isDragging ? "active" : ""}`}
          onMouseDown={handleMouseDown}
          title="拖动调整宽度"
        />

        <Spin
          spinning={nodeDetailsLoading || scriptLoading || eventLoading}
          tip="正在加载节点详情..."
          size="large"
        >
          <Form form={form} disabled={isOnlyRead} layout="vertical" onFinish={onFinish}>
            <div>
              <div className="mb-5 text-base font-[500] text-[#181B25]">节点基本信息</div>
              {/* 开场白开关，仅在工作流模式下显示 */}
              {flowType === 1 && (
                <>
                  <Form.Item
                    label="是否是开场白"
                    name="isPrologueNode"
                    valuePropName="checked"
                    tooltip="设置为开场白节点，会在画布保存时优先排序"
                    layout="horizontal"
                  >
                    <Switch
                      size="small"
                      checkedChildren="开"
                      unCheckedChildren="关"
                      disabled={isOnlyRead || isMountedNode} // 当挂机节点开启时禁用
                      onChange={(checked) => {
                        // 更新开场白节点状态
                        setIsPrologueNode(checked)

                        // 如果开启开场白，自动关闭挂机节点
                        if (checked && isMountedNode) {
                          setIsMountedNode(false)
                          form.setFieldValue("isMounted", false)
                        }

                        // 通知父组件取消其他节点的开场白状态
                        if (checked && onUpdate && node) {
                          onUpdate(node.id, {
                            ...node.data,
                            clearOtherPrologues: true // 标记需要清除其他开场白节点
                          })
                        }
                      }}
                    />
                  </Form.Item>

                  <div className="text-xs text-red-500 bg-red-50 p-2 rounded-md -mt-4 mb-3">
                    只有一个开场白节点，打开当前其他开场白的节点就将会关闭
                  </div>
                </>
              )}
              <Form.Item
                label="节点名称"
                name="nodeName"
                rules={[{ required: true, whitespace: true, message: "请输入节点名称" }]}
              >
                <Input
                  placeholder={node?.type === "stateMachineRoot" ? "开场白" : "请输入节点名称"}
                  allowClear={node?.type !== "stateMachineRoot"}
                  disabled={isOnlyRead || node?.type === "stateMachineRoot"}
                />
              </Form.Item>

              {/* <Divider /> */}
              {node?.id !== "Start" && (
                <Form.Item
                  label="节点ID"
                  name="nodeId"
                  rules={[
                    { required: true, whitespace: true, message: "请输入节点ID" },
                    {
                      validator: async (_, value) => {
                        if (!value) return Promise.resolve()

                        // 检查是否与其他节点ID重复
                        const trimmedValue = value.trim()

                        // 检查是否与根节点ID冲突
                        if (trimmedValue === "Start") {
                          return Promise.reject(new Error("节点ID不能与根节点ID重复"))
                        }

                        // 检查是否与其他节点ID重复（排除当前节点）
                        if (allNodes && Array.isArray(allNodes)) {
                          const duplicateNode = allNodes.find(
                            (n) => n.id === trimmedValue && n.id !== node?.id
                          )
                          if (duplicateNode) {
                            return Promise.reject(
                              new Error(`节点ID "${trimmedValue}" 已被其他节点使用`)
                            )
                          }
                        }

                        return Promise.resolve()
                      }
                    }
                  ]}
                  tooltip="节点的唯一标识符，不能与其他节点ID重复"
                >
                  <Input placeholder="请输入节点ID" allowClear />
                </Form.Item>
              )}

              {/* 状态机模式下的子节点ID编辑 */}
              {/* {flowType === 2 && node?.type === "stateMachineChild" && (
                <Form.Item
                  label="节点ID"
                  name="nodeId"
                  rules={[
                    { required: true, whitespace: true, message: "请输入节点ID" },
                    {
                      validator: async (_, value) => {
                        if (!value) return Promise.resolve()

                        // 检查是否与其他节点ID重复
                        const trimmedValue = value.trim()

                        // 检查是否与根节点ID冲突
                        if (trimmedValue === "Start") {
                          return Promise.reject(new Error("节点ID不能与根节点ID重复"))
                        }

                        // 检查是否与其他节点ID重复（排除当前节点）
                        if (allNodes && Array.isArray(allNodes)) {
                          const duplicateNode = allNodes.find(
                            (n) => n.id === trimmedValue && n.id !== node?.id
                          )
                          if (duplicateNode) {
                            return Promise.reject(
                              new Error(`节点ID "${trimmedValue}" 已被其他节点使用`)
                            )
                          }
                        }

                        return Promise.resolve()
                      }
                    }
                  ]}
                  tooltip="节点的唯一标识符，不能与其他节点ID重复"
                >
                  <Input placeholder="请输入节点ID" allowClear />
                </Form.Item>
              )} */}

              <Form.Item
                label="话术轮询"
                name="scriptPoll"
                valuePropName="checked"
                initialValue={false}
                tooltip="若节点存在多条相同优先级话术，则开启后，流转至该节点时，按序播放；关闭后，每次跨节点流转则均播放第一条话术，连续节点流转则按顺序播放"
                layout="horizontal"
                getValueFromEvent={(checked) => (checked ? 1 : 0)}
                getValueProps={(value) => ({ checked: value === 1 })}
              >
                <Switch size="small" checkedChildren="开" unCheckedChildren="关" />
              </Form.Item>

              <Form.Item
                label={
                  <div
                    className="flex items-center justify-between w-full cursor-pointer"
                    onClick={() => {
                      const newCollapsedState = !scriptsCollapsed
                      setScriptsCollapsed(newCollapsedState)

                      // 批量更新所有脚本项的collapsed状态
                      const scripts = form.getFieldValue("scripts") || []
                      const updatedScripts = scripts.map((script) => ({
                        ...script,
                        collapsed: newCollapsedState
                      }))
                      form.setFieldValue("scripts", updatedScripts)
                    }}
                  >
                    <span className="text-gray-500 text-sm mr-2">
                      {scriptsCollapsed ? <DownOutlined /> : <UpOutlined />}
                    </span>
                    <span>播报话术列表</span>
                  </div>
                }
                // required
              >
                <Form.List name="scripts">
                  {(fields, { add, remove }) => (
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="displayFields">
                        {(provided) => {
                          // 获取所有脚本数据
                          const scripts = form.getFieldValue("scripts") || []

                          // 根据ruleStatus分组
                          const noRuleFields = fields.filter((field) => {
                            const script = scripts[field.name]
                            return (
                              (!script?.ruleStatus || script.ruleStatus == 0) && script?.sampleRate
                            )
                          })

                          // console.log("noRuleFields", scripts, fields, noRuleFields)

                          const withRuleFields = fields.filter((field) => {
                            const script = scripts[field.name]
                            return script?.ruleStatus == 1
                          })

                          return (
                            <div {...provided.droppableProps} ref={provided.innerRef}>
                              {/* 显示有规则话术分隔线和内容 */}
                              {withRuleFields.length > 0 && (
                                <>
                                  {withRuleFields.map((field, index) => {
                                    const scripts = form.getFieldValue("scripts") || []
                                    const isCollapsed = scripts[field.name]?.collapsed
                                    const name = scripts[field.name]?.name
                                    const id = scripts[field.name]?.scriptId

                                    const content = scripts[field.name]?.content
                                    const originalIndex = fields.findIndex(
                                      (f) => f.key === field.key
                                    )

                                    return (
                                      <Draggable
                                        isDragDisabled={isOnlyRead}
                                        key={field?.key}
                                        draggableId={field?.key.toString()}
                                        index={originalIndex}
                                        className="w-[100%]"
                                      >
                                        {(provided, snapshot) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className={
                                              snapshot.isDragging ? "dragging w-[100%]" : "w-[100%]"
                                            }
                                          >
                                            {isCollapsed ? (
                                              <CollapsedScriptItem
                                                provided={provided}
                                                field={field}
                                                form={form}
                                                index={originalIndex}
                                                name={name}
                                                id={id}
                                                content={content}
                                                remove={remove}
                                                playingAudio={playingAudio}
                                                setPlayingAudio={setPlayingAudio}
                                                audioProgress={audioProgress}
                                                setAudioProgress={setAudioProgress}
                                                recordingAudioDuration={recordingAudioDuration}
                                                setRecordingAudioDuration={
                                                  setRecordingAudioDuration
                                                }
                                                recordingAudioRefs={recordingAudioRefs}
                                              />
                                            ) : (
                                              <ExpandedScriptItem
                                                isOnlyRead={isOnlyRead}
                                                provided={provided}
                                                field={field}
                                                form={form}
                                                id={id}
                                                index={originalIndex}
                                                isCollapsed={isCollapsed}
                                                remove={remove}
                                                scriptList={scriptList}
                                                botNo={botNo}
                                                taskId={taskId}
                                                nodeDetailsData={nodeDetailsData}
                                                synthesizingStates={synthesizingStates}
                                                handleSynthesis={handleSynthesis}
                                                audioUrls={audioUrls}
                                                playingStates={playingStates}
                                                togglePlay={togglePlay}
                                                currentTimes={currentTimes}
                                                formatTime={formatTime}
                                                currentPlayingIndex={currentPlayingIndex}
                                                progress={progress}
                                                audioDurations={audioDurations}
                                                audioRef={audioRef}
                                                handleProgressClick={handleProgressClick}
                                                playingAudio={playingAudio}
                                                setPlayingAudio={setPlayingAudio}
                                                audioProgress={audioProgress}
                                                setAudioProgress={setAudioProgress}
                                                recordingAudioDuration={recordingAudioDuration}
                                                setRecordingAudioDuration={
                                                  setRecordingAudioDuration
                                                }
                                                recordingAudioRefs={recordingAudioRefs}
                                                styles={styles}
                                              />
                                            )}
                                          </div>
                                        )}
                                      </Draggable>
                                    )
                                  })}
                                </>
                              )}

                              {/* 显示无规则话术分隔线和内容 */}
                              {noRuleFields.length > 0 && (
                                <>
                                  <Divider className="!my-1 !mt-3">
                                    <span className="text-[14px] text-gray-500">
                                      以下是无规则话术
                                    </span>
                                  </Divider>
                                  {noRuleFields.map((field, index) => {
                                    const scripts = form.getFieldValue("scripts") || []
                                    const isCollapsed = scripts[field.name]?.collapsed
                                    const scriptRuleId = scripts[field.name]?.scriptRuleId
                                    const content = scripts[field.name]?.content
                                    const name = scripts[field.name]?.name
                                    const id = scripts[field.name]?.scriptId

                                    const originalIndex = fields.findIndex(
                                      (f) => f.key === field.key
                                    )

                                    return (
                                      <Draggable
                                        isDragDisabled={isOnlyRead}
                                        key={field?.key}
                                        draggableId={field?.key.toString()}
                                        index={originalIndex}
                                        className="w-[100%]"
                                      >
                                        {(provided, snapshot) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className={
                                              snapshot.isDragging ? "dragging w-[100%]" : "w-[100%]"
                                            }
                                          >
                                            {isCollapsed ? (
                                              <CollapsedScriptItem
                                                provided={provided}
                                                field={field}
                                                scriptRuleId={scriptRuleId}
                                                form={form}
                                                index={originalIndex}
                                                name={name}
                                                id={id}
                                                content={content}
                                                remove={remove}
                                                playingAudio={playingAudio}
                                                audioUrls={audioUrls} // 合成的试听
                                                setPlayingAudio={setPlayingAudio}
                                                audioProgress={audioProgress}
                                                setAudioProgress={setAudioProgress}
                                                recordingAudioDuration={recordingAudioDuration}
                                                setRecordingAudioDuration={
                                                  setRecordingAudioDuration
                                                }
                                                recordingAudioRefs={recordingAudioRefs}
                                              />
                                            ) : (
                                              <ExpandedScriptItem
                                                provided={provided}
                                                field={field}
                                                form={form}
                                                id={id}
                                                index={originalIndex}
                                                isCollapsed={isCollapsed}
                                                remove={remove}
                                                scriptList={scriptList}
                                                botNo={botNo}
                                                taskId={taskId}
                                                nodeDetailsData={nodeDetailsData}
                                                synthesizingStates={synthesizingStates}
                                                handleSynthesis={handleSynthesis}
                                                audioUrls={audioUrls}
                                                playingStates={playingStates}
                                                togglePlay={togglePlay}
                                                currentTimes={currentTimes}
                                                formatTime={formatTime}
                                                currentPlayingIndex={currentPlayingIndex}
                                                progress={progress}
                                                audioDurations={audioDurations}
                                                audioRef={audioRef}
                                                handleProgressClick={handleProgressClick}
                                                playingAudio={playingAudio}
                                                setPlayingAudio={setPlayingAudio}
                                                audioProgress={audioProgress}
                                                setAudioProgress={setAudioProgress}
                                                recordingAudioDuration={recordingAudioDuration}
                                                setRecordingAudioDuration={
                                                  setRecordingAudioDuration
                                                }
                                                recordingAudioRefs={recordingAudioRefs}
                                                styles={styles}
                                              />
                                            )}
                                          </div>
                                        )}
                                      </Draggable>
                                    )
                                  })}
                                </>
                              )}

                              {provided.placeholder}

                              {fields.length === 0 && (
                                <CustomEmpty description="暂无播报话术，请点击下方按钮添加" />
                              )}

                              <Form.Item className="mt-2">
                                <div className="flex justify-start">
                                  <Button
                                    disabled={isOnlyRead}
                                    type="link"
                                    onClick={() =>
                                      add({
                                        scriptId: undefined,
                                        variable: 0, // 默认无变量
                                        name: null,
                                        content: "",
                                        scriptType: 1,
                                        scriptTags: [],
                                        rule: "",
                                        priorityLevel: fields.length + 1,
                                        // 音频相关参数默认值
                                        audioFormat: "wav",
                                        sampleRate: 8000,
                                        volume: 50,
                                        speed: 1.05,
                                        timbreCode: null,
                                        // 录音相关参数
                                        scriptVoices: [],
                                        // 折叠状态字段，默认为false
                                        collapsed: false,
                                        scriptRuleId: new Date().getTime()
                                      })
                                    }
                                    icon={<PlusOutlined />}
                                    className="p-0 mt-1"
                                  >
                                    添加话术
                                  </Button>
                                </div>
                              </Form.Item>
                            </div>
                          )
                        }}
                      </Droppable>
                    </DragDropContext>
                  )}
                </Form.List>
              </Form.Item>

              <Divider className={"-mt-5"} />

              {/* FAQ播报节点递进话术 */}
              <Form.Item label="FAQ播报节点递进话术" name="emptySoundType" initialValue={0}>
                <Select placeholder="请选择FAQ播报节点递进话术">
                  <Option value={0}>不开启</Option>
                  <Option value={1}>开启 0.5秒静音</Option>
                  <Option value={2}>开启 1秒静音</Option>
                  <Option value={3}>开启 1.5秒静音</Option>
                  <Option value={4}>开启 2秒静音</Option>
                  <Option value={5}>开启 2.5秒静音</Option>
                  <Option value={6}>开启 3秒静音</Option>
                  <Option value={9}>开启且不需要静音间隔</Option>
                </Select>
              </Form.Item>

              {/* FAQ话术支持触发节点关联事件，仅在剧本模式时显示 */}
              {flowType === 2 && (
                <Form.Item
                  label="FAQ话术触发关联事件"
                  name="faqEvent"
                  valuePropName="checked"
                  initialValue={false}
                  getValueFromEvent={(checked) => (checked ? 1 : 0)}
                  getValueProps={(value) => ({ checked: value === 1 })}
                  layout="horizontal"
                >
                  <Switch size="small" checkedChildren="打开" unCheckedChildren="关闭" />
                </Form.Item>
              )}

              {/* 打断逻辑选择框，仅在flowType为1或2时显示 */}
              {(flowType === 1 || flowType === 2) && (
                <Form.Item label="打断逻辑" name="nonInterrupt" initialValue={0}>
                  <Select placeholder="请选择打断逻辑">
                    <Option value={0}>不能打断-不校验用户是否在说话</Option>
                    <Option value={5}>不能打断-校验用户是否在说话</Option>
                    <Option value={10}>能打断-不校验用户是否在说话</Option>
                    <Option value={15}>能打断-校验用户是否在说话</Option>
                  </Select>
                </Form.Item>
              )}

              <Form.Item label="话术预生成步骤数" name="stepNo" initialValue={"one"}>
                <Select placeholder="请选择话术预生成步骤数">
                  <Option value={"one"}>第 1 步</Option>
                  <Option value={"two"}>第 2 步</Option>
                  <Option value={"three"}>第 3 步</Option>
                  <Option value={"four"}>第 4 步</Option>
                </Select>
              </Form.Item>

              {/* 状态机模式下的根节点不显示挂机节点选项 */}
              {!(flowType === 2 && node?.type === "stateMachineRoot") && (
                <Form.Item
                  label="节点事件"
                  name="ctiOrder"
                  help={flowType === 1 && isPrologueNode ? "已启用开场白，无法更改节点事件" : ""}
                  validateStatus={flowType === 1 && isPrologueNode ? "warning" : ""}
                  tooltip="转人工：不进行客户回答意图选择，将通话转人工； 挂机：不进行客户回答意图选择，直接挂机"
                >
                  <Select
                    placeholder="请选择节点事件"
                    disabled={isOnlyRead || (flowType === 1 && isPrologueNode)} // 在工作流模式下且开场白开启时禁用
                    onChange={(value) => {
                      // 当切换为挂机节点时，重置客户意图相关字段
                      if (value === "toOver") {
                        setCustomerIntents([])
                        form.setFieldValue("customerIntentsList", [])

                        // 如果开启挂机节点，自动关闭开场白（仅工作流模式）
                        if (flowType === 1 && isPrologueNode) {
                          setIsPrologueNode(false)
                          form.setFieldValue("isPrologueNode", false)
                        }
                      }
                      // 更新挂机节点状态
                      setIsMountedNode(value === "toOver" || value === "toQueue")
                      // 同时设置 isMounted 字段以保持向后兼容
                      form.setFieldValue("isMounted", value === "toOver" || value === "toQueue")
                    }}
                  >
                    <Option value={""}>无</Option>
                    <Option value="toQueue">转人工</Option>
                    <Option value="toOver">挂机</Option>
                  </Select>
                </Form.Item>
              )}
            </div>

            {!isMountedNode && flowType !== 2 && <Divider />}

            {/* 客户回答意图部分，仅在非挂机节点且非状态机模式时显示 */}
            {!isMountedNode && flowType !== 2 && (
              <div>
                <div className="mb-5 text-base font-[500] text-[#181B25]">客户回答意图</div>

                <Form.Item
                  name="customerIntentsList"
                  label="客户回答意图"
                  required
                  rules={[
                    {
                      validator: (_, value) => {
                        // 如果是挂机节点或状态机模式，则不验证客户意图
                        if (isMountedNode || flowType === 2) {
                          return Promise.resolve()
                        }
                        if (customerIntents.length === 0) {
                          return Promise.reject(new Error("请添加至少一个客户回答意图"))
                        }
                        return Promise.resolve()
                      }
                    }
                  ]}
                >
                  <Select
                    disabled={isOnlyRead}
                    className="w-full"
                    placeholder="请搜索或选择意图"
                    mode="multiple"
                    allowClear={true}
                    showSearch
                    optionLabelProp="label"
                    filterOption={(input, option) => {
                      const inputLower = input.toLowerCase()
                      // 支持搜索意图名称和意图编码
                      const nameMatch = option.label.toLowerCase().includes(inputLower)
                      const codeMatch = option.intentionCode.toLowerCase().includes(inputLower)
                      return nameMatch || codeMatch
                    }}
                    onChange={handleIntentionChange}
                    onDropdownVisibleChange={(open) => {
                      if (open) {
                        loadIntentionList()
                      }
                    }}
                    value={getSelectedIntentionValues()}
                    dropdownRender={(menu) => (
                      <>
                        {menu}
                        <div className="p-3">
                          <div className="flex items-center gap-2 mb-3">
                            <Input
                              disabled={isOnlyRead}
                              placeholder="请输入意图名称"
                              allowClear={true}
                              value={searchValue}
                              onChange={(e) => setSearchValue(e.target.value)}
                              onKeyDown={(e) => {
                                // 阻止删除键、方向键等事件冒泡到 Select 组件
                                if (
                                  e.key === "Backspace" ||
                                  e.key === "Delete" ||
                                  e.key === "ArrowUp" ||
                                  e.key === "ArrowDown" ||
                                  e.key === "ArrowLeft" ||
                                  e.key === "ArrowRight" ||
                                  e.key === "Home" ||
                                  e.key === "End"
                                ) {
                                  e.stopPropagation()
                                }
                              }}
                              onPressEnter={async (e) => {
                                e.stopPropagation()
                                if (searchValue.trim() && intentionCodeValue.trim()) {
                                  await handleCreateNewIntention()
                                }
                              }}
                              className="flex-1"
                            />

                            <Input
                              disabled={isOnlyRead}
                              placeholder="请输入意图编码"
                              value={intentionCodeValue}
                              allowClear={true}
                              onChange={(e) => setIntentionCodeValue(e.target.value)}
                              onKeyDown={(e) => {
                                // 阻止删除键、方向键等事件冒泡到 Select 组件
                                if (
                                  e.key === "Backspace" ||
                                  e.key === "Delete" ||
                                  e.key === "ArrowUp" ||
                                  e.key === "ArrowDown" ||
                                  e.key === "ArrowLeft" ||
                                  e.key === "ArrowRight" ||
                                  e.key === "Home" ||
                                  e.key === "End"
                                ) {
                                  e.stopPropagation()
                                }
                              }}
                              onPressEnter={async (e) => {
                                e.stopPropagation()
                                if (searchValue.trim() && intentionCodeValue.trim()) {
                                  await handleCreateNewIntention()
                                }
                              }}
                              className="flex-1"
                            />

                            <Button
                              type="primary"
                              disabled={
                                isOnlyRead || !searchValue.trim() || !intentionCodeValue.trim()
                              }
                              onClick={async (e) => {
                                e.stopPropagation()
                                await handleCreateNewIntention()
                              }}
                              className={`${
                                !searchValue.trim() || !intentionCodeValue.trim()
                                  ? "cursor-not-allowed"
                                  : "bg-[#7F56D9] hover:bg-[#6941C6] border-[#7F56D9]"
                              }`}
                            >
                              + 创建
                            </Button>
                          </div>

                          <div className="text-xs text-gray-500">
                            请填写完整的意图名称和编码信息，支持按 Enter 快速创建
                          </div>
                        </div>
                      </>
                    )}
                    notFoundContent={
                      intentionOptions.length === 0 ? (
                        <div className="p-2 text-center text-gray-500">
                          <span>暂无客户回答意图</span>
                        </div>
                      ) : (
                        <div className="p-2 text-center text-gray-500">
                          <span>未找到匹配结果</span>
                        </div>
                      )
                    }
                  >
                    {intentionOptions.map((option) => (
                      <Select.Option
                        key={option.value}
                        value={option.value}
                        label={option.label}
                        intentionCode={option.intentionCode}
                      >
                        <div className="py-1">
                          <div className="font-medium text-[14px]">{option.label}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            编码: {option.intentionCode}
                          </div>
                        </div>
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>
            )}

            <Divider />

            <div>
              <div className="mb-5 text-base font-[500] text-[#181B25]">事件管理</div>
              <Form.Item label="事件关联" name="eventRelations">
                <Select
                  mode="multiple"
                  placeholder="请选择关联事件（支持多选）"
                  allowClear={true}
                  loading={isLoadingEvents}
                  optionLabelProp="label" // 使用label属性作为选中后显示的内容
                  maxTagCount="responsive" // 响应式显示标签数量
                  showSearch
                  filterOption={(input, option) => {
                    const inputLower = input.toLowerCase()
                    const label = option.label || ""
                    const code = option.intentionCode || ""
                    return (
                      label.toLowerCase().includes(inputLower) ||
                      code.toLowerCase().includes(inputLower)
                    )
                  }}
                >
                  {eventList.map((event) => (
                    <Option
                      key={event.eventId}
                      value={event.eventId.toString()}
                      label={event.eventName} // 这里只使用eventName作为选中后显示的内容
                    >
                      <div>
                        <div className="font-medium">{event.eventName}</div>
                        <div className="text-xs text-gray-500">
                          {event.eventCode} | {event.eventType === "SMS" ? "短信" : "用户行为埋点"}
                        </div>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
          </Form>
        </Spin>
      </Drawer>
    )
  }
)

export default NodeEditDrawer
