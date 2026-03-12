import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import {
  Form,
  Input,
  Select,
  InputNumber,
  TimePicker,
  Slider,
  Radio,
  Switch,
  Button,
  Row,
  Col,
  message,
  Tag,
  TreeSelect,
  Popover
} from "antd"
import {
  PlusOutlined,
  SoundOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined
} from "@ant-design/icons"
import {
  getTimbreList,
  synthesisVoice,
  createTemplateSkill,
  getVoiceAgentDetails
} from "@/api/voiceAgent/api"
import { useFetchAvailableSkills } from "@/api/skill"
import { useLocation } from "react-router-dom"
import queryString from "query-string"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"
import { fetchPersonalTimbreListV2 } from "@/api/timbre/api"
import { fetchCatalogList } from "@/api/knowledge/api"
import { formatCatalogNos } from "@/utils"
import { ToolItem } from "../../../agent/components/ToolsTable"
import FaqListDrawer from "./FaqListDrawer"
import { functionDownVoice } from "@/utils"

const { Option } = Select

// 添加自定义样式
const treeSelectStyles = `
  .custom-tree-select-dropdown .ant-select-tree-node-content-wrapper {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 240px;
    display: inline-block;
  }
  
  .custom-tree-select-dropdown .ant-select-tree-checkbox + span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
    display: inline-block;
    vertical-align: middle;
  }
  
  /* 确保title属性能正常工作，形成原生tooltip */
  .custom-tree-select-dropdown .ant-select-tree-node-content-wrapper[title],
  .custom-tree-select-dropdown .ant-select-tree-checkbox + span[title] {
    position: relative;
  }
`

const VoiceTemplateForm = ({
  form,
  botNo,
  showTaskName = true,
  onFormChange,
  initialValues = {},
  hideFlowType = false,
  agentDetail,
  onChangeFaqHandle,
  isOnlyRead = false
}) => {
  const location = useLocation()
  const formListBottomRef = useRef(null)
  const channelConfigRef = useRef(null)

  // 音色相关状态
  const [timbreOptions, setTimbreOptions] = useState([])
  const [timbreLoading, setTimbreLoading] = useState(false)

  // 工作流搜索状态
  const [filterText, setFilterText] = useState("")

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
  const [ccConfigError, setCcConfigError] = useState(false)

  // 创建工作流loading状态
  const [createEventSkillLoading, setCreateEventSkillLoading] = useState(false)
  const [createTagSkillLoading, setCreateTagSkillLoading] = useState(false)

  // 知识库相关状态
  const [knowledgeBases, setKnowledgeBases] = useState([])
  const [selectedQAKnowledges, setSelectedQAKnowledges] = useState([])
  const [knowledgeTreeData, setKnowledgeTreeData] = useState([])
  const [knowledgeLoading, setKnowledgeLoading] = useState(false)
  const [knowledgeSearchKey, setKnowledgeSearchKey] = useState("")
  const [knowledgePopoverVisible, setKnowledgePopoverVisible] = useState(false)
  const [knowledgeCollapsedState, setKnowledgeCollapsedState] = useState(false)
  const [tempSelectedQAKnowledges, setTempSelectedQAKnowledges] = useState([])

  // FAQ抽屉相关状态
  const [faqDrawerVisible, setFaqDrawerVisible] = useState(false)
  const [currentViewKnowledge, setCurrentViewKnowledge] = useState(null)
  const [currentTaskId, setCurrentTaskId] = useState(null)

  // 获取当前botNo
  const searchParams = queryString.parse(location.search) || {}
  const hashParams = queryString.parse(window.location.hash.split("?")[1] || "") || {}
  const currentBotNo = botNo || searchParams.botNo || hashParams.botNo || "20250416001"

  // 获取工作流列表
  const { data: availableSkills = {}, refetch: refetchSkills } = useFetchAvailableSkills({
    botNo: currentBotNo,
    pageSize: 1000,
    pageNum: 1
  })

  // 获取音色列表
  const fetchTimbreList = useCallback(async () => {
    try {
      setTimbreLoading(true)
      const res = await fetchPersonalTimbreListV2({
        botNo: currentBotNo
      })

      if (Array.isArray(res)) {
        const options = res?.map((item) => ({
          value: item.timbreCode && Number(item.timbreCode),
          label: item.timbreName + " - " + item.timbreModel
        }))
        setTimbreOptions(options)
      }
    } catch (error) {
      console.error("获取音色列表异常:", error)
    } finally {
      setTimbreLoading(false)
    }
  }, [currentBotNo])

  useEffect(() => {
    fetchTimbreList()
  }, [fetchTimbreList])

  // 缓存已请求的agentDetail数据，避免重复调用
  const [cachedAgentData, setCachedAgentData] = useState(null)
  const [lastRequestKey, setLastRequestKey] = useState(null)

  // 获取taskId
  useEffect(() => {
    const fetchTaskId = async () => {
      // 首先尝试从表单数据中获取taskId
      const formValues = form.getFieldsValue()
      if (formValues.taskId) {
        setCurrentTaskId(formValues.taskId)
        return
      }

      if (initialValues.taskId) {
        setCurrentTaskId(initialValues.taskId)
        return
      }

      // 如果有agentDetail，通过接口获取taskId
      if (agentDetail?.agentNo && currentBotNo) {
        // 生成请求的唯一标识
        const requestKey = `${agentDetail.agentNo}-${currentBotNo}`

        // 如果已经缓存了相同请求的数据，直接使用缓存
        if (cachedAgentData && lastRequestKey === requestKey && cachedAgentData.taskId) {
          setCurrentTaskId(cachedAgentData.taskId)
          return
        }

        try {
          const res = await getVoiceAgentDetails({
            agentNo: agentDetail.agentNo,
            botNo: currentBotNo
          })

          if (res && res.status === 200 && res.data) {
            // 缓存完整的响应数据
            setCachedAgentData(res.data)
            setLastRequestKey(requestKey)

            if (res.data.taskId) {
              setCurrentTaskId(res.data.taskId)
            }
          }
        } catch (error) {
          console.error("获取taskId失败:", error)
        }
      }
    }

    fetchTaskId()
  }, [agentDetail?.agentNo, currentBotNo, initialValues.taskId, cachedAgentData, lastRequestKey])

  // 检查并设置ccConfigs默认值
  useEffect(() => {
    const checkAndSetCcConfigs = () => {
      const formValues = form.getFieldsValue()
      const ccConfigs = formValues.ccConfigs

      // 如果ccConfigs为null、undefined或空数组，设置默认值
      if (!ccConfigs || ccConfigs.length === 0) {
        form.setFieldValue("ccConfigs", [
          {
            ccPlatform: undefined,
            bizField: undefined,
            bizTypes: undefined,
            rate: 100,
            extraInfo: undefined,
            isSkipWebcall: 0
          }
        ])
      }
    }

    // 延迟执行，确保表单已经初始化完成
    const timer = setTimeout(checkAndSetCcConfigs, 100)
    return () => clearTimeout(timer)
  }, [form, initialValues])

  // 知识库相关工具函数
  const getKnowledgeTreeData = useCallback(async () => {
    try {
      setKnowledgeLoading(true)
      const catalogsTreeList = await fetchCatalogList(currentBotNo)
      if (catalogsTreeList && Array.isArray(catalogsTreeList)) {
        // 递归转换函数，处理任意层级的树形结构
        const convertToTreeData = (nodes) => {
          return nodes.map((node) => ({
            title: node.catalogName,
            value: node.catalogNo,
            key: node.catalogNo,
            type: "faq",
            knowledgeBaseNo: node.knowledgeBaseNo,
            children:
              node.children && node.children.length > 0 ? convertToTreeData(node.children) : []
          }))
        }

        const treeData = convertToTreeData(catalogsTreeList)
        setKnowledgeTreeData(treeData)
      }
    } catch (error) {
      console.error("获取知识库列表失败:", error)
    } finally {
      setKnowledgeLoading(false)
    }
  }, [currentBotNo])

  const getKnowledgeName = useCallback(
    (baseNo) => {
      const findName = (data) => {
        // 确保 data 是数组且不为空
        if (!Array.isArray(data) || data.length === 0) {
          return baseNo
        }

        // 遍历所有项目
        for (const item of data) {
          // 直接匹配
          if (item.value === baseNo) {
            return item.title
          }

          // 如果 item.value 是复合字符串，检查是否包含 baseNo
          if (typeof item.value === "string" && item.value.includes(",")) {
            const itemBaseNos = item.value.split(",")
            if (itemBaseNos.includes(baseNo)) {
              return item.title
            }
          }

          // 递归检查子项
          if (item.children && item.children.length > 0) {
            const name = findName(item.children)
            if (name !== baseNo) {
              return name
            }
          }
        }
        return baseNo
      }

      return findName(knowledgeTreeData)
    },
    [knowledgeTreeData]
  )

  const getKnowledgeBaseNo = useCallback(() => {
    return selectedQAKnowledges?.length || 0
  }, [selectedQAKnowledges])

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

  // 初始化知识库数据
  useEffect(() => {
    if (agentDetail?.knowledgeBases) {
      const qaKnowledges = []

      agentDetail.knowledgeBases.forEach((kb) => {
        if (kb.type === "faq") {
          // 使用baseNo字段，这是接口返回的实际字段名
          qaKnowledges.push(kb.baseNo)
        }
      })

      setSelectedQAKnowledges(qaKnowledges)
      setTempSelectedQAKnowledges(qaKnowledges)
      setKnowledgeBases(agentDetail.knowledgeBases.filter((kb) => kb.type === "faq"))
    }
  }, [agentDetail?.knowledgeBases])

  // 监听知识库选中状态变化，更新折叠状态
  useEffect(() => {
    setKnowledgeCollapsedState(selectedQAKnowledges.length === 0)
  }, [selectedQAKnowledges])

  // 获取知识库树形数据
  useEffect(() => {
    getKnowledgeTreeData()
  }, [getKnowledgeTreeData])

  // 删除知识库
  const handleKnowledgeDelete = useCallback(
    (baseNo) => {
      setSelectedQAKnowledges((prev) => prev.filter((id) => id !== baseNo))

      // 重新构建knowledgeBases数组
      const newKnowledgeBases = knowledgeBases.filter(
        (kb) => !(kb.baseNo === baseNo && kb.type === "faq")
      )

      setKnowledgeBases(newKnowledgeBases)

      // 触发保存
      if (typeof onFormChange === "function") {
        const values = form.getFieldsValue()
        onFormChange({ ...values, knowledgeBases: newKnowledgeBases })
      }
    },
    [knowledgeBases, form, onFormChange]
  )

  // 查看知识库FAQ
  const handleKnowledgeView = useCallback(
    (item) => {
      // 根据baseNo从knowledgeTreeData中找到完整的知识库信息
      const findKnowledgeInfo = (nodes, baseNo) => {
        for (const node of nodes) {
          // 直接匹配
          if (node.value === baseNo) {
            return {
              baseNo: node.value,
              baseName: node.title,
              knowledgeBaseNo: node.knowledgeBaseNo
            }
          }

          // 如果 node.value 是复合字符串，检查是否包含 baseNo
          if (typeof node.value === "string" && node.value.includes(",")) {
            const nodeBaseNos = node.value.split(",")
            if (nodeBaseNos.includes(baseNo)) {
              return {
                baseNo: baseNo,
                baseName: node.title,
                knowledgeBaseNo: node.knowledgeBaseNo
              }
            }
          }

          if (node.children && node.children.length > 0) {
            const found = findKnowledgeInfo(node.children, baseNo)
            if (found) return found
          }
        }
        return null
      }

      // item.name现在是baseNo
      const knowledgeInfo = findKnowledgeInfo(knowledgeTreeData, item.name)
      if (knowledgeInfo) {
        setCurrentViewKnowledge(knowledgeInfo)
        setFaqDrawerVisible(true)
      } else {
        message.error("未找到知识库信息")
      }
    },
    [knowledgeTreeData]
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
        message.warning("请先选择音色")
        return
      }

      if (!synthesisText) {
        message.warning("请输入要合成的文本")
        return
      }
      if (audioFormat === "pcm") {
        message.warning("pcm 录音格式暂时不支持试听")
        return
      }

      if (!audioFormat) {
        message.warning("请先选择录音格式")
        return
      }

      if (!sampleRate) {
        message.warning("请先选择音频采样率")
        return
      }

      if (speed === null || speed === undefined) {
        message.warning("请先设置音频速率")
        return
      }

      if (volume === null || volume === undefined) {
        message.warning("请先设置音量")
        return
      }

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

  // 知识库选择器组件
  const knowledgeSelector = () => {
    const filteredTreeData = knowledgeTreeData.filter((item) => item.type === "faq")

    return (
      <div className="w-80">
        <div className="mb-3 text-sm font-medium">问答知识库</div>
        <TreeSelect
          className="w-full mb-3"
          placeholder="请选择问答知识库"
          multiple
          treeCheckable
          showCheckedStrategy={TreeSelect.SHOW_PARENT}
          value={tempSelectedQAKnowledges}
          onChange={setTempSelectedQAKnowledges}
          treeData={filteredTreeData}
          maxTagCount="responsive"
          searchValue={knowledgeSearchKey}
          onSearch={setKnowledgeSearchKey}
          loading={knowledgeLoading}
          dropdownClassName="custom-tree-select-dropdown"
          treeNodeFilterProp="title"
          fieldNames={{
            label: "title",
            value: "value",
            children: "children"
          }}
          filterTreeNode={(inputValue, treeNode) => {
            const title = treeNode.title || ""
            return title.toLowerCase().includes(inputValue.toLowerCase())
          }}
        />
        <div className="flex justify-end gap-2">
          <Button
            size="small"
            onClick={() => {
              setKnowledgePopoverVisible(false)
              setTempSelectedQAKnowledges(selectedQAKnowledges)
            }}
          >
            取消
          </Button>
          <Button
            type="primary"
            size="small"
            onClick={() => {
              setSelectedQAKnowledges(tempSelectedQAKnowledges)

              // 更新knowledgeBases数组
              const newKnowledgeBases = []

              // 添加新选择的知识库
              tempSelectedQAKnowledges.forEach((baseNo) => {
                const knowledge = knowledgeTreeData.find((item) => item.value === baseNo)
                if (knowledge) {
                  newKnowledgeBases.push({
                    baseNo: baseNo,
                    baseName: knowledge.title,
                    type: "faq",
                    knowledgeBaseNo: knowledge.knowledgeBaseNo
                  })
                }
              })

              setKnowledgeBases(newKnowledgeBases)

              setKnowledgePopoverVisible(false)

              // 触发保存
              if (typeof onFormChange === "function") {
                const values = form.getFieldsValue()
                onFormChange({ ...values, knowledgeBases: newKnowledgeBases })
              }
            }}
          >
            确认
          </Button>
        </div>
      </div>
    )
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

  // 表单验证规则
  const rules = {
    required: [{ required: true, message: "此项为必填项" }],
    positiveInteger: [
      {
        pattern: /^[1-9]\d*$/,
        message: "请输入正整数"
      }
    ],
    nonNegativeInteger: [
      {
        pattern: /^(0|[1-9]\d*)$/,
        message: "请输入非负整数"
      }
    ]
  }

  // 分流比例自动分配和校验逻辑
  // 自动分配分流比例
  const autoDistributeRates = useCallback(() => {
    const ccConfigs = form.getFieldValue("ccConfigs") || []
    const count = ccConfigs.length
    if (count === 0) return
    const base = Math.floor(100 / count)
    const rates = Array(count).fill(base)
    rates[count - 1] = 100 - base * (count - 1)
    const newConfigs = ccConfigs.map((item, idx) => ({ ...item, rate: rates[idx] }))
    form.setFieldsValue({ ccConfigs: newConfigs })
  }, [form])

  // 监听通道数量变化，自动分配分流比例
  useEffect(() => {
    const unsubscribe = form.subscribe?.(() => {
      const ccConfigs = form.getFieldValue("ccConfigs") || []
      if (ccConfigs.length > 1) {
        // 新增/删除时自动分配
        autoDistributeRates()
      }
    })
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [form, autoDistributeRates])

  // 分流比例变动时校验总和
  const handleRateChange = (value, fieldIdx) => {
    const ccConfigs = form.getFieldValue("ccConfigs") || []
    ccConfigs[fieldIdx].rate = value
    const total = ccConfigs.reduce((sum, item) => sum + (Number(item.rate) || 0), 0)
    if (total > 100) {
      setRateError("通道分流比例之和不能超过100%")
    } else {
      setRateError("")
    }
    form.setFieldsValue({ ccConfigs })
  }

  // 删除通道时自动分配分流比例
  const handleRemoveChannel = (fieldName) => {
    const ccConfigs = form.getFieldValue("ccConfigs") || []
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
  }

  // 通道设置区域鼠标离开时自动保存
  const handleChannelMouseLeave = async () => {
    try {
      // 校验表单，ccConfigs必填
      await form.validateFields(["ccConfigs"])
      // 如果有 onSave 或 onSubmit 回调，调用保存
      if (typeof onFormChange === "function") {
        const values = form.getFieldsValue()
        onFormChange(values)
      }
    } catch (err) {
      // 校验不通过时表单会自动红字提示
      return
    }
  }

  useEffect(() => {
    // 递归查找知识库信息的函数
    const findKnowledgeInfo = (nodes, catalogNo) => {
      for (const node of nodes) {
        // 直接匹配
        if (node.value === catalogNo) {
          return {
            type: "faq",
            baseNo: node.value,
            baseName: node.title,
            knowledgeBaseNo: node.knowledgeBaseNo
          }
        }

        // 如果 node.value 是复合字符串，检查是否包含 catalogNo
        if (typeof node.value === "string" && node.value.includes(",")) {
          const nodeBaseNos = node.value.split(",")
          if (nodeBaseNos.includes(catalogNo)) {
            return {
              type: "faq",
              baseNo: catalogNo,
              baseName: node.title,
              knowledgeBaseNo: node.knowledgeBaseNo
            }
          }
        }

        if (node.children && node.children.length > 0) {
          const found = findKnowledgeInfo(node.children, catalogNo)
          if (found) return found
        }
      }
      return null
    }

    // 根据selectedQAKnowledges构建完整的知识库信息列表
    const faqList = selectedQAKnowledges
      .map((catalogNo) => {
        const knowledgeInfo = findKnowledgeInfo(knowledgeTreeData, catalogNo)
        return (
          knowledgeInfo || {
            type: "faq",
            baseNo: catalogNo,
            baseName: catalogNo, // 如果找不到名称，使用catalogNo作为fallback
            knowledgeBaseNo: catalogNo
          }
        )
      })
      .filter(Boolean) // 过滤掉null值

    onChangeFaqHandle(faqList)
  }, [selectedQAKnowledges, knowledgeTreeData])

  return (
    <>
      {/* 注入自定义样式 */}
      <style dangerouslySetInnerHTML={{ __html: treeSelectStyles }} />
      <Form
        form={form}
        disabled={isOnlyRead}
        layout="vertical"
        initialValues={{
          taskProcessRateFlag: false,
          audioFormat: "wav",
          sampleRate: 8000,
          speed: 1.05,
          volume: 50,
          reflectErrOverNum: 2,
          redisExpireTime: 86400,
          variableConfigs: [],
          flowType: 1,
          robotStrategy: "merge",
          ...(initialValues || []),
          crossCallScriptTag:
            !initialValues?.crossCallScriptTag ||
            initialValues?.crossCallScriptTag === "false" ||
            initialValues?.crossCallScriptTag === "0"
              ? "0"
              : "1"
        }}
        onValuesChange={onFormChange}
      >
        {/* 通用设置 */}
        <div className="mb-6">
          <div className="!text-[14px] text-[#475467] font-[400] mb-4">通用设置</div>
          {!hideFlowType && (
            <Row gutter={24}>
              <Col span={24}>
                <Form.Item name="flowType" label="语音类型模式" rules={rules.required}>
                  <Radio.Group>
                    <Radio value={1}>画布模式</Radio>
                    <Radio value={2}>剧本模式</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>
          )}
          <Row gutter={24}>
            {showTaskName && (
              <Col span={6}>
                <Form.Item name="taskName" label="语音模板名称" rules={rules.required}>
                  <Input placeholder="请输入语音模板名称" allowClear />
                </Form.Item>
              </Col>
            )}

            <Col span={12}>
              <Form.Item label="拨打时间控制">
                <Row gutter={8} align="middle">
                  <Col flex="auto">
                    <Form.Item name="allowCallTimeStart" noStyle>
                      <TimePicker
                        format="HH:mm"
                        placeholder="开始时间"
                        className="w-full"
                        allowClear
                      />
                    </Form.Item>
                  </Col>
                  <Col flex="24px" className="text-center">
                    →
                  </Col>
                  <Col flex="auto">
                    <Form.Item
                      name="allowCallTimeEnd"
                      noStyle
                      dependencies={["allowCallTimeStart"]}
                      rules={[
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            const startTime = getFieldValue("allowCallTimeStart")
                            if (!value || !startTime) {
                              return Promise.resolve()
                            }
                            if (startTime.isAfter(value)) {
                              return Promise.reject(new Error("结束时间必须大于开始时间"))
                            }
                            return Promise.resolve()
                          }
                        })
                      ]}
                    >
                      <TimePicker
                        format="HH:mm"
                        placeholder="结束时间"
                        className="w-full"
                        allowClear
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                name="redisExpireTime"
                label="补呼时间间隔"
                tooltip="注意同XC系统补呼事件间隔保持一致"
                rules={[...rules.required, ...rules.positiveInteger]}
              >
                <InputNumber placeholder="请输入" className="w-full" addonAfter="秒" allowClear />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={6}>
              <Form.Item
                name="numberWebCall"
                label="手机防疲劳"
                tooltip="防疲劳显示，每天每个任务每个手机可拨打最大数量"
                rules={rules.positiveInteger}
              >
                <InputNumber
                  placeholder="请输入拨打最大数量"
                  className="w-full"
                  addonAfter="通"
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="robotStrategy"
                label="用户问题边界"
                tooltip="当 AI 回复的时候用户正好说话，是否合并上一轮问题一起处理"
                rules={rules.required}
                initialValue="merge"
              >
                <Select placeholder="请选择处理方式" allowClear>
                  <Option value="merge">合并用户问题</Option>
                  <Option value="default">默认</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="crossCallScriptTag"
                label="跨通话轮询话术"
                tooltip="话术是否跨通话轮询，增加重复触达用户话术体验，节点递进话术多，重复触发大的情况再推荐开启"
                valuePropName="checked"
                initialValue={0}
                getValueFromEvent={(checked) => (checked ? "1" : "0")}
                getValueProps={(value) => ({ checked: value === "1" })}
              >
                <Switch size="small" checkedChildren="开" unCheckedChildren="关" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={8}>
              <div className="flex items-center">
                <Form.Item
                  label="开启拨打限流"
                  name="taskProcessRateFlag"
                  layout="horizontal"
                  valuePropName="checked"
                  tooltip="用于控制权录音或者全 tts 任务拨打速率"
                  className="mb-0"
                  required
                >
                  <Switch size="small" checkedChildren="开" unCheckedChildren="关" />
                </Form.Item>
              </div>
            </Col>
          </Row>
          <Form.Item noStyle dependencies={["taskProcessRateFlag"]}>
            {({ getFieldValue }) =>
              getFieldValue("taskProcessRateFlag") ? (
                <Row gutter={24}>
                  <Col span={6} className="mt-3">
                    <Form.Item
                      label="拨打间隔时长"
                      name="taskProcessRateSleepTime"
                      rules={[...rules.required, ...rules.nonNegativeInteger]}
                      tooltip="当启用拨打速率控制时，拨打睡眠时长"
                    >
                      <InputNumber
                        placeholder="请输入间隔时长"
                        className="w-full"
                        addonAfter="毫秒"
                        allowClear
                      />
                    </Form.Item>
                  </Col>
                </Row>
              ) : null
            }
          </Form.Item>
        </div>

        {/* 通道设置 */}
        <div className="mb-6">
          <div className="!text-[14px] text-[#475467] font-[400] mb-4 flex items-center">
            通道设置
            {ccConfigError && (
              <span style={{ color: "#ff4d4f", fontSize: 14, marginLeft: 8 }}>
                请至少添加一个通道配置
              </span>
            )}
          </div>
          <div ref={channelConfigRef} onMouseLeave={handleChannelMouseLeave}>
            <Form.Item
              shouldUpdate
              name="ccConfigs"
              rules={[
                {
                  validator: (_, value) => {
                    if (!value || value.length === 0) {
                      setCcConfigError(true)
                      return Promise.reject("")
                    }
                    setCcConfigError(false)
                    return Promise.resolve()
                  }
                }
              ]}
            >
              <Form.List name="ccConfigs">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((field, index) => (
                      <div
                        key={field.key}
                        className="mb-4 p-4 pb-8 border border-solid border-gray-200 rounded-md relative"
                      >
                        <h4 className="text-sm font-medium mb-3">通道配置{index + 1}</h4>
                        <Button
                          type="link"
                          onClick={() => handleRemoveChannel(field.name)}
                          className="absolute right-2 top-2 text-xs"
                          icon={<PlusOutlined className="text-gray-500" rotate={45} />}
                        />
                        <Row gutter={24}>
                          <Col span={8}>
                            <Form.Item
                              {...field}
                              name={[field.name, "ccPlatform"]}
                              label="呼叫线路平台"
                              rules={rules.required}
                              className="mb-3"
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
                          </Col>
                          <Col span={8}>
                            <Form.Item
                              {...field}
                              name={[field.name, "bizField"]}
                              label="通道 ID"
                              className="mb-3"
                            >
                              <Input placeholder="请输入通道 ID" maxLength={100} allowClear />
                            </Form.Item>
                          </Col>
                          <Col span={8}>
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
                              className="mb-3"
                            >
                              <Select
                                mode="tags"
                                placeholder="请输入BizTypes"
                                allowClear
                                maxLength={1000}
                                tokenSeparators={[","]}
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row gutter={24}>
                          <Col span={8}>
                            <Form.Item
                              {...field}
                              name={[field.name, "extraInfo"]}
                              label="拓展参数"
                              tooltip="JSON 格式，用来扩展额外配置"
                              className="mb-3"
                            >
                              <Input.TextArea
                                placeholder="请输入拓展参数配置参数"
                                rows={3}
                                allowClear
                              />
                            </Form.Item>
                          </Col>
                          <Col span={8}>
                            <Form.Item
                              {...field}
                              name={[field.name, "rate"]}
                              label="分流比例"
                              tooltip="多通道各自占比"
                              rules={[
                                ...rules.required,
                                {
                                  validator: (_, value) => {
                                    const ccConfigs = form.getFieldValue("ccConfigs") || []
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
                              className="mb-3"
                              initialValue={100}
                            >
                              <div className="flex items-center gap-3">
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
                              </div>
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row gutter={24}>
                          <Col span={8}>
                            <Form.Item
                              {...field}
                              name={[field.name, "isSkipWebcall"]}
                              label="外部发起外呼"
                              valuePropName="checked"
                              className="mb-3"
                              getValueFromEvent={(checked) => (checked ? 1 : 0)}
                              getValueProps={(value) => ({ checked: value === 1 })}
                              initialValue={0}
                              layout="horizontal"
                            >
                              <Switch size="small" checkedChildren="开" unCheckedChildren="关" />
                            </Form.Item>
                          </Col>
                        </Row>
                      </div>
                    ))}
                    {fields.length === 0 && (
                      <CustomEmpty description="暂无通道配置，请点击下方按钮添加" />
                    )}
                    {/* 分流比例总和错误提示 */}
                    {rateError && <div className="text-red-500 text-xs mb-2 mt-1">{rateError}</div>}
                    <Form.Item className="mt-4">
                      <Button
                        type="link"
                        onClick={() => {
                          const ccConfigs = form.getFieldValue("ccConfigs") || []
                          const count = ccConfigs.length + 1
                          const base = Math.floor(100 / count)
                          const rates = Array(count).fill(base)
                          rates[count - 1] = 100 - base * (count - 1)
                          // 新增时自动分配所有通道分流比例
                          const newConfigs = ccConfigs.map((item, idx) => ({
                            ...item,
                            rate: rates[idx]
                          }))
                          newConfigs.push({
                            ccPlatform: undefined,
                            bizField: "",
                            bizTypes: [],
                            rate: rates[count - 1],
                            extraInfo: "",
                            isSkipWebcall: 0
                          })
                          form.setFieldsValue({ ccConfigs: newConfigs })
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
                        }}
                        icon={<PlusOutlined />}
                        className="!text-purple-600 !p-0"
                      >
                        创建通道配置
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            </Form.Item>
          </div>
        </div>

        {/* 声音设置 */}
        <div className="mb-6">
          <div className="!text-[14px] text-[#475467] font-[400] mb-4">声音设置</div>
          {/* 第一行：音色、录音格式、音频采样率 */}
          <Row gutter={24} className="mb-4">
            <Col span={8}>
              <Form.Item name="timbreCode" label="音色" rules={rules.required}>
                <Select
                  placeholder="请选择音色"
                  loading={timbreLoading}
                  showSearch
                  optionFilterProp="label"
                  options={timbreOptions}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="audioFormat" label="录音格式" rules={rules.required}>
                <Select placeholder="请选择" allowClear>
                  <Option value="mp3">mp3</Option>
                  <Option value="wav">wav</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="sampleRate" label="音频采样率" rules={rules.required}>
                <Select placeholder="请选择" allowClear>
                  <Option value={8000}>8000 Hz</Option>
                  <Option value={16000}>16000 Hz</Option>
                  <Option value={32000}>32000 Hz</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          {/* 第二行：音频速率、音量 */}
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item label="音频速率" required>
                <div className="flex items-center">
                  <Form.Item name="speed" noStyle rules={rules.required}>
                    <Slider
                      min={0.6}
                      max={2.5}
                      step={0.01}
                      className="flex-1 mr-4"
                      onChange={(value) => form.setFieldsValue({ speed: value })}
                    />
                  </Form.Item>
                  <Form.Item name="speed" noStyle rules={rules.required}>
                    <InputNumber
                      min={0.6}
                      max={2.5}
                      step={0.01}
                      precision={2}
                      style={{ width: "80px" }}
                      onChange={(value) => form.setFieldsValue({ speed: value })}
                      allowClear
                    />
                  </Form.Item>
                </div>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="音量" required>
                <div className="flex items-center">
                  <Form.Item name="volume" noStyle rules={rules.required}>
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      className="flex-1 mr-4"
                      onChange={(value) => form.setFieldsValue({ volume: value })}
                    />
                  </Form.Item>
                  <Form.Item name="volume" noStyle rules={rules.required}>
                    <InputNumber
                      min={0}
                      max={100}
                      step={1}
                      precision={0}
                      style={{ width: "70px" }}
                      onChange={(value) => form.setFieldsValue({ volume: value })}
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
                <Form.Item name="synthesisText" label="试听">
                  <Input.TextArea
                    placeholder="请输入要合成试听的文本"
                    rows={3}
                    className="flex-1 mr-2"
                  />
                </Form.Item>
                <div className="text-left">
                  <Button
                    icon={<i className="iconfont icon-zhinengyouhua"></i>}
                    onClick={handleSynthesis}
                    loading={synthesizing}
                    style={{
                      background: "linear-gradient(83.59deg, #E9E8FF 6.73%, #EEC7FF 131.73%)",
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
              <div className="mt-3 bg-gray-100 p-3 pr-4 rounded-md">
                <div className="flex items-center mb-2">
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
                  <div className="text-xs text-gray-500 mr-2">{formatTime(currentTime)}</div>
                  <div
                    className="flex-1 bg-gray-200 h-1 rounded cursor-pointer relative overflow-hidden"
                    onClick={handleProgressClick}
                  >
                    <div
                      className="absolute h-full bg-[#7F56D9] rounded-lg"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 ml-2">{formatTime(audioDuration)}</div>
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

        {/* 工作流 */}
        <div className="mb-6">
          <div className="!text-[14px] text-[#475467] font-[400] mb-4">工作流</div>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="reflectAigcSkillNo" label="意图识别工作流" rules={rules.required}>
                <Select
                  showSearch
                  placeholder="请选择工作流"
                  onSearch={handleSearch}
                  filterOption={false}
                  options={skills}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="reflectErrOverNum"
                label="报错兜底次数"
                tooltip="调用灵犀工作流超时或者报错，外呼兜底工作流处理次数，超过这个次数就会直接挂机"
                rules={[...rules.required, ...rules.positiveInteger]}
              >
                <InputNumber placeholder="请输入" className="w-full" addonAfter="次" allowClear />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="reflectAigcEventSkillNo"
                label={
                  <div className="flex items-center justify-between w-[100%]">
                    <span>事件处理工作流</span>
                    <Button
                      size="small"
                      type="link"
                      className="ml-2"
                      loading={createEventSkillLoading}
                      onClick={handleCreateEventSkill}
                    >
                      智能创建
                    </Button>
                  </div>
                }
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
            </Col>
            <Col span={12}>
              <Form.Item
                name="intentTagCallSkillNo"
                label={
                  <div className="flex items-center justify-between w-[100%]">
                    <span>通话打标工作流</span>
                    <Button
                      size="small"
                      type="link"
                      className="ml-2"
                      loading={createTagSkillLoading}
                      onClick={handleCreateTagSkill}
                    >
                      智能创建
                    </Button>
                  </div>
                }
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
            </Col>
          </Row>
        </div>

        {/* 通话详情 */}
        <div className="mb-6">
          <div className="!text-[14px] text-[#475467] font-[400] mb-4">业务自定义字段</div>
          <Form.List name="variableConfigs">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <div
                    key={field.key}
                    className="mb-4 p-4 border border-solid border-gray-200 rounded-md relative"
                  >
                    <h4 className="text-sm font-medium mb-3">自定义字段{index + 1}</h4>
                    <Button
                      type="link"
                      danger
                      onClick={() => remove(field.name)}
                      className="absolute right-2 top-2 text-xs"
                      icon={<PlusOutlined className="text-gray-500" rotate={45} />}
                    />
                    <Row gutter={32}>
                      <Col span={12}>
                        <Form.Item
                          {...field}
                          name={[field.name, "name"]}
                          label="字段中文名称"
                          rules={rules.required}
                          className="mb-0"
                        >
                          <Input placeholder="请输入字段中文名称" allowClear />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          {...field}
                          name={[field.name, "fieldName"]}
                          label="字段Key"
                          rules={rules.required}
                          className="mb-0"
                        >
                          <Input placeholder="请输入字段Key" allowClear />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={32} className="mt-4">
                      <Col span={12}>
                        <Form.Item
                          {...field}
                          name={[field.name, "expression"]}
                          label="字段取值表达式"
                          tooltip="通过 EL表达式构建字段的值"
                          className="mb-0"
                        >
                          <Input.TextArea placeholder="请输入字段取值表达式" rows={3} allowClear />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          {...field}
                          name={[field.name, "isShow"]}
                          label="在通话记录中展示"
                          className="mb-0"
                          getValueFromEvent={(checked) => (checked ? 1 : 0)}
                          getValueProps={(value) => ({ checked: value === 1 })}
                        >
                          <Switch size="small" checkedChildren="开" unCheckedChildren="关" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                ))}
                {fields.length === 0 && (
                  <CustomEmpty description="暂无自定义字段，请点击下方按钮添加" />
                )}
                <Form.Item className="mt-4">
                  <Button
                    type="link"
                    onClick={() => {
                      add({ name: "", fieldName: "", expression: "", isShow: 0 })
                      setTimeout(() => {
                        if (formListBottomRef.current) {
                          formListBottomRef.current.scrollIntoView({ behavior: "smooth" })
                        }
                      }, 100)
                    }}
                    icon={<PlusOutlined />}
                    className="!text-purple-600 !p-0"
                  >
                    创建自定义字段
                  </Button>
                </Form.Item>
                <div ref={formListBottomRef} />
              </>
            )}
          </Form.List>
        </div>

        {/* 知识库 */}
        <div className="mb-6">
          <div className="!text-[14px] text-[#475467] font-[400] mb-4">知识库</div>

          {/* 问答知识库 */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <i
                  className={`text-[16px] text-[#475467] iconfont icon-Up transition-transform duration-300 cursor-pointer hover:text-[#7f56d9] ${
                    knowledgeCollapsedState ? "rotate-90" : "rotate-180"
                  }`}
                  onClick={() => {
                    setKnowledgeCollapsedState(!knowledgeCollapsedState)
                  }}
                ></i>
                <span className="text-sm font-medium text-gray-700">问答知识库</span>
                <span className="text-xs text-gray-500">({getKnowledgeBaseNo()})</span>
              </div>
              <Popover
                content={knowledgeSelector()}
                title={null}
                trigger="click"
                open={knowledgePopoverVisible}
                onOpenChange={(visible) => {
                  setKnowledgePopoverVisible(visible)
                  if (visible) {
                    setTempSelectedQAKnowledges(selectedQAKnowledges)
                    getKnowledgeTreeData()
                  }
                }}
                placement="bottomLeft"
              >
                <Button type="text" size="small" icon={<PlusOutlined />} />
              </Popover>
            </div>
            {!knowledgeCollapsedState && (
              <div className="space-y-2">
                {selectedQAKnowledges.length === 0 ? (
                  <CustomEmpty description="暂无问答知识库" />
                ) : (
                  selectedQAKnowledges.map((baseNo) => (
                    <ToolItem
                      key={baseNo}
                      item={{
                        name: getKnowledgeName(baseNo),
                        description: "问答知识库",
                        type: "qa",
                        baseNo: baseNo // 添加baseNo字段用于查看功能
                      }}
                      idKey="baseNo"
                      onView={(item) => handleKnowledgeView({ name: item.baseNo })}
                      onDelete={() => handleKnowledgeDelete(baseNo)}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </Form>

      {/* FAQ列表抽屉 */}
      <FaqListDrawer
        visible={faqDrawerVisible}
        onClose={() => {
          setFaqDrawerVisible(false)
          setCurrentViewKnowledge(null)
        }}
        knowledgeItem={currentViewKnowledge}
        botNo={currentBotNo}
        taskId={currentTaskId}
        timbreCode={form.getFieldValue("timbreCode")}
        timbreName={(() => {
          const selectedTimbreCode = form.getFieldValue("timbreCode")
          const selectedOption = timbreOptions.find((option) => option.value === selectedTimbreCode)
          return selectedOption ? selectedOption.label : null
        })()}
      />
    </>
  )
}

export default VoiceTemplateForm
