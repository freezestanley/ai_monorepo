import { useState, useEffect, useRef } from "react"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import Iconfont from "@/components/Icon"
import {
  Drawer,
  Form,
  Input,
  Select,
  Radio,
  Button,
  Space,
  Divider,
  message,
  Spin,
  Switch,
  Slider,
  InputNumber,
  Row,
  Col
} from "antd"
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons"
import {
  createOrUpdateScript,
  getTagConfigList,
  createOrUpdateTagConfig,
  getScriptDetail,
  checkScriptContent
} from "@/api/voiceAgent/api"
import { fetchPersonalTimbreListV2 } from "@/api/timbre/api"
import { Upload as UploadAPI } from "@/api/server"
import { voiceAgentPrefix } from "@/constants"
import RecordingItem from "../RecordingItem/index.jsx"
import MultiSegmentRecordingItem from "../MultiSegmentRecordingItem/index.jsx"

import CustomEmpty from "@/antd-styles/components/CustomEmpty"
import styles from "../../script.module.scss"

const ScriptDrawer = ({ visible, onClose, modalType, currentScript, botNo, onSuccess }) => {
  const [form] = Form.useForm()
  const combinationsValue = Form.useWatch("combinations", form)
  const [submitLoading, setSubmitLoading] = useState(false)

  // 业务类型相关状态
  const [scriptTypeOptions, setScriptTypeOptions] = useState([])
  const [scriptTypeSearchValue, setScriptTypeSearchValue] = useState("")
  const [scriptTypeCodeValue, setScriptTypeCodeValue] = useState("")
  const [scriptTypeLoading, setScriptTypeLoading] = useState(false)

  // 标签相关状态
  const [scriptTagOptions, setScriptTagOptions] = useState([])
  const [scriptTagSearchValue, setScriptTagSearchValue] = useState("")
  const [scriptTagCodeValue, setScriptTagCodeValue] = useState("")
  const [scriptTagLoading, setScriptTagLoading] = useState(false)

  // 音色相关状态
  const [timbreOptions, setTimbreOptions] = useState([])
  const [timbreLoading, setTimbreLoading] = useState(false)

  // 录音播放相关状态
  const [playingAudio, setPlayingAudio] = useState(null)
  const [audioProgress, setAudioProgress] = useState({})
  const [audioDuration, setAudioDuration] = useState({})
  const audioRefs = useRef({})

  // 话术详情加载状态
  const [scriptDetailLoading, setScriptDetailLoading] = useState(false)

  // 监听变量选择状态
  const [variableValue, setVariableValue] = useState(0)

  // 组合类型相关状态（仅在 variable=2 时使用）
  const [fromDialog, setFromDialog] = useState(false) // 是否从对话中获取标量值

  // 话术内容重复检查相关状态
  const [duplicateScriptId, setDuplicateScriptId] = useState(null)
  const [checkingContent, setCheckingContent] = useState(false)

  // 获取已选择的音色列表
  const getSelectedTimbreCodes = () => {
    const pairs = form.getFieldValue("pairs") || []
    return pairs.map((pair) => pair?.code).filter(Boolean)
  }

  // 获取处理后的音色选项（已选择的设为disabled）
  const getProcessedTimbreOptions = (currentIndex) => {
    const selectedCodes = getSelectedTimbreCodes()
    const currentPairs = form.getFieldValue("pairs") || []
    const currentCode = currentPairs[currentIndex]?.code
    const currentFileName = currentPairs[currentIndex]?.fileName

    // 复制原始音色选项并设置disabled状态
    let processedOptions = timbreOptions.map((option) => ({
      ...option,
      disabled: selectedCodes.includes(option.value) && option.value !== currentCode
    }))

    // 检查当前选中的音色是否在选项列表中存在
    if (currentCode && !timbreOptions.find((option) => option.value === currentCode)) {
      // 如果不存在，添加一个新的选项
      const customOption = {
        value: currentCode,
        label: currentFileName || `音色-${currentCode}`,
        disabled: false
      }
      processedOptions.unshift(customOption) // 添加到列表开头
    }
    return processedOptions
  }

  // 获取话术详情
  const loadScriptDetail = async (scriptId) => {
    try {
      setScriptDetailLoading(true)
      const res = await getScriptDetail({
        botNo: botNo,
        scriptId: scriptId
      })

      if (res && res.status === 200 && res.data) {
        const scriptData = res.data

        // 首先解析variable类型
        const originalVariableNum = Number(scriptData.variable)
        let formVariableValue = originalVariableNum
        let fromDialogValue = false

        // 如果variable是3，说明是组合模式且开启了"从对话中获取标量值"
        if (originalVariableNum === 3) {
          formVariableValue = 2 // 表单显示为组合模式
          fromDialogValue = true // 开启开关
        }

        // 处理录音数据，转换为表单需要的格式
        let pairs = []
        // 根据新的数据结构，优先使用 combinations 数据
        if (scriptData.combinations && Array.isArray(scriptData.combinations)) {
          // 新的组合模式数据结构
          const combinationMap = {}
          ;(scriptData.combinationVoiceInfos || []).forEach((info) => {
            combinationMap[info.timbreCode] = {
              code: info.timbreCode,
              segments: info.combinationVoices.map((cv) => ({
                file: cv.voicePlayUrl || cv.ossUrl, // 使用 voicePlayUrl 或 ossUrl 作为已上传文件的URL
                fileName:
                  cv.ossUrl && cv.ossUrl.includes("/")
                    ? cv.ossUrl.split("/").pop()
                    : `录音文件_${cv.seq}.mp3`,
                ossUrl: cv.ossUrl,
                seq: cv.seq
              }))
            }
          })

          // 根据 combinationVoiceInfos 中的音色顺序来构建 pairs
          Object.keys(combinationMap).forEach((timbreCode) => {
            pairs.push(combinationMap[timbreCode])
          })
        } else if (originalVariableNum === 2 || originalVariableNum === 3) {
          // 兼容旧的数据结构 - 组合模式
          const combinationMap = {}
          ;(scriptData.combinationVoiceInfos || []).forEach((info) => {
            combinationMap[info.timbreCode] = {
              code: info.timbreCode,
              segments: info.combinationVoices.map((cv) => ({
                file: cv.voicePlayUrl, // 使用 voicePlayUrl 作为已上传文件的URL
                fileName: cv.ossUrl.includes("/")
                  ? cv.ossUrl.split("/").pop()
                  : cv.voiceName || "录音文件",
                ossUrl: cv.ossUrl,
                seq: cv.seq
              }))
            }
          })

          // 为了保持顺序，需要一个所有音色的列表
          const allTimbreCodesInPairs = (scriptData.scriptVoices || []).map((v) => v.timbreCode)
          allTimbreCodesInPairs.forEach((code) => {
            if (combinationMap[code]) {
              pairs.push(combinationMap[code])
            } else {
              // 如果某个音色在 combinationVoiceInfos 中不存在，则创建一个空的结构
              pairs.push({ code: code, segments: [] })
            }
          })
        } else {
          // 普通模式，转换 scriptVoices
          pairs =
            scriptData.scriptVoices?.map((voice) => ({
              code: voice.timbreCode,
              file: voice.ossUrl,
              fileName: voice.voiceName
            })) || []
        }

        const formValues = {
          scriptId: scriptData.scriptId,
          name: scriptData.name,
          scriptType: scriptData.scriptType,
          scriptTags: scriptData.scriptTags || [],
          variable: formVariableValue,
          content: scriptData.content || "",
          pairs: pairs,
          // 处理新的音频配置字段
          contentVolumeConfig: scriptData.volumeConfig ||
            scriptData.contentVolumeConfig || {
              openVolumeConfig: 0,
              speed: 1.0,
              volume: 55
            }
        }

        // 如果是组合模式，设置 combinations 字段
        if ((originalVariableNum === 2 || originalVariableNum === 3) && scriptData.combinations) {
          formValues.combinations = scriptData.combinations.map((comb, index) => ({
            voiceContent: comb.voiceContent || "",
            variable: comb.variable ?? 0,
            ossUrl: comb.ossUrl || "",
            seq: comb.seq ?? index,
            volumeConfig: comb.volumeConfig || {
              volume: 55,
              speed: 1.0,
              openVolumeConfig: 0
            }
          }))
        }

        form.setFieldsValue(formValues)

        // 同步更新变量状态
        setVariableValue(formVariableValue)
        setFromDialog(fromDialogValue)
      } else {
        message.error(res?.message || "获取话术详情失败")
      }
    } catch (error) {
      console.error("获取话术详情失败:", error)
      message.error("获取话术详情失败")
    } finally {
      setScriptDetailLoading(false)
    }
  }

  // 获取业务类型列表
  const loadScriptTypeList = async () => {
    try {
      setScriptTypeLoading(true)
      const res = await getTagConfigList({
        botNo: botNo,
        type: 1
      })

      if (res && res.status === 200 && res.data) {
        const options = res.data.map((item) => ({
          label: item.name,
          value: item.id
        }))
        setScriptTypeOptions(options)
      }
    } catch (error) {
      console.error("获取业务类型列表失败:", error)
      message.error("获取业务类型列表失败")
    } finally {
      setScriptTypeLoading(false)
    }
  }

  // 创建或更新业务类型
  const createOrUpdateScriptType = async (name) => {
    try {
      const res = await createOrUpdateTagConfig({
        botNo: botNo,
        name,
        type: 1
      })

      if (res.status === "200" || res.status === 200) {
        await loadScriptTypeList()
        return res.data || res
      }
      return null
    } catch (error) {
      console.error("创建业务类型失败:", error)
      message.error("创建业务类型失败")
      return null
    }
  }

  // 创建新的业务类型
  const handleCreateNewScriptType = async () => {
    if (!scriptTypeSearchValue.trim()) {
      message.warning("请输入业务类型名称")
      return
    }

    // 检查是否已存在相同名称的业务类型
    const existingType = scriptTypeOptions.find(
      (option) => option.label === scriptTypeSearchValue.trim()
    )
    if (existingType) {
      message.warning("该业务类型已存在")
      return
    }

    try {
      const result = await createOrUpdateScriptType(scriptTypeSearchValue.trim())
      if (result) {
        message.success("业务类型创建成功")
        // 设置表单字段值为新创建的业务类型ID
        const newTypeId = result.id || result.data?.id
        if (newTypeId) {
          form.setFieldsValue({ scriptType: newTypeId })
        }
        // 清空输入框
        setScriptTypeSearchValue("")
        setScriptTypeCodeValue("")
      }
    } catch (error) {
      console.error("创建业务类型失败:", error)
    }
  }

  // 获取标签列表
  const loadScriptTagList = async () => {
    try {
      setScriptTagLoading(true)
      const res = await getTagConfigList({
        botNo: botNo,
        type: 2
      })

      if (res && res.status === 200 && res.data) {
        const options = res.data.map((item) => ({
          label: item.name,
          value: item.id
        }))
        setScriptTagOptions(options)
      }
    } catch (error) {
      console.error("获取标签列表失败:", error)
      message.error("获取标签列表失败")
    } finally {
      setScriptTagLoading(false)
    }
  }

  // 创建或更新标签
  const createOrUpdateScriptTag = async (name) => {
    try {
      const res = await createOrUpdateTagConfig({
        botNo: botNo,
        name,
        type: 2
      })

      if (res.status === "200" || res.status === 200) {
        await loadScriptTagList()
        return res.data || res
      }
      return null
    } catch (error) {
      console.error("创建标签失败:", error)
      message.error("创建标签失败")
      return null
    }
  }

  // 创建新的标签
  const handleCreateNewScriptTag = async () => {
    if (!scriptTagSearchValue.trim()) {
      message.warning("请输入标签名称")
      return
    }

    // 检查是否已存在相同名称的标签
    const existingTag = scriptTagOptions.find(
      (option) => option.label === scriptTagSearchValue.trim()
    )
    if (existingTag) {
      message.warning("该标签已存在")
      return
    }

    try {
      const result = await createOrUpdateScriptTag(scriptTagSearchValue.trim())
      if (result) {
        message.success("标签创建成功")
        // 获取当前表单的标签值
        const currentTags = form.getFieldValue("scriptTags") || []
        // 添加新创建的标签ID到选中列表
        const newTagId = result.id || result.data?.id
        if (newTagId) {
          form.setFieldsValue({ scriptTags: [...currentTags, newTagId] })
        }
        // 清空输入框
        setScriptTagSearchValue("")
        setScriptTagCodeValue("")
      }
    } catch (error) {
      console.error("创建标签失败:", error)
    }
  }

  // 获取音色列表
  const loadTimbreList = async () => {
    try {
      setTimbreLoading(true)
      const res = await fetchPersonalTimbreListV2({
        botNo: botNo
      })

      if (Array.isArray(res)) {
        const options = res.map((item) => ({
          value: item.timbreCode,
          label: item.timbreName,
          auditionUrl: item.auditionUrl
        }))
        setTimbreOptions(options)
      }
    } catch (error) {
      console.error("获取音色列表失败:", error)
      message.error("获取音色列表失败")
    } finally {
      setTimbreLoading(false)
    }
  }

  // 处理录音文件选择（本地存储）
  const handleRecordingUpload = (info, index) => {
    const { file } = info
    if (file) {
      const pairs = form.getFieldValue("pairs") || []
      pairs[index] = {
        ...pairs[index],
        file: file.originFileObj || file,
        fileName: file.name
      }
      form.setFieldsValue({ pairs })
      message.success("录音文件选择成功")
    }
  }

  // 播放/暂停录音
  const handlePlayPause = (file, index) => {
    const audioKey = `audio_${index}`
    const audio = audioRefs.current[audioKey]

    if (playingAudio === audioKey) {
      // 暂停当前播放
      if (audio) {
        audio.pause()
      }
      setPlayingAudio(null)
    } else {
      // 停止其他音频播放
      Object.keys(audioRefs.current).forEach((key) => {
        if (audioRefs.current[key] && key !== audioKey) {
          audioRefs.current[key].pause()
        }
      })

      // 播放当前音频
      if (audio) {
        audio.play()
        setPlayingAudio(audioKey)
      } else if (file) {
        // 为文件对象创建临时URL
        const fileUrl = typeof file === "string" ? file : URL.createObjectURL(file)
        const newAudio = new Audio(fileUrl)
        audioRefs.current[audioKey] = newAudio

        // 设置音频事件监听器
        newAudio.onloadedmetadata = () => {
          setAudioDuration((prev) => ({
            ...prev,
            [audioKey]: newAudio.duration
          }))
        }

        newAudio.ontimeupdate = () => {
          setAudioProgress((prev) => ({
            ...prev,
            [audioKey]: newAudio.currentTime
          }))
        }

        newAudio.onended = () => {
          setPlayingAudio(null)
          setAudioProgress((prev) => ({
            ...prev,
            [audioKey]: 0
          }))
          // 清理临时URL
          if (typeof file !== "string") {
            URL.revokeObjectURL(fileUrl)
          }
        }

        newAudio.play()
        setPlayingAudio(audioKey)
      }
    }
  }

  // 下载录音文件
  const handleDownload = (fileUrl, fileName) => {
    if (fileUrl && typeof fileUrl === "string") {
      try {
        // 直接创建下载链接，避免CORS问题
        const link = document.createElement("a")
        link.href = fileUrl
        link.download = fileName || "录音文件.mp3"
        link.target = "_blank"
        link.rel = "noopener noreferrer"
        document.body.appendChild(link)
        link.click()

        // 清理
        document.body.removeChild(link)

        message.success("文件下载成功")
      } catch (error) {
        console.error("下载失败:", error)
        message.error("文件下载失败，请稍后重试")
      }
    } else {
      message.warning("该文件暂不支持下载")
    }
  }

  // 检查话术内容是否重复
  const handleCheckScriptContent = async (content) => {
    if (!content || !content.trim()) {
      setDuplicateScriptId(null)
      return
    }

    try {
      setCheckingContent(true)
      const scriptId = form.getFieldValue("scriptId") || 0
      const res = await checkScriptContent({
        botNo: botNo,
        content: content.trim(),
        scriptId: scriptId
      })

      if (res && res.status === 200) {
        // data 返回的是重复的话术ID，0表示不重复
        if (res.data && res.data !== 0) {
          setDuplicateScriptId(res.data)
        } else {
          setDuplicateScriptId(null)
        }
      }
    } catch (error) {
      console.error("检查话术内容失败:", error)
    } finally {
      setCheckingContent(false)
    }
  }

  // 处理话术内容失去焦点
  const handleContentBlur = (e) => {
    const content = e.target.value
    handleCheckScriptContent(content)
  }

  // 处理提交
  const handleSubmit = async () => {
    if (!botNo) {
      message.error("缺少必要参数botNo，无法提交")
      return
    }

    try {
      const values = await form.validateFields()
      setSubmitLoading(true)

      const formData = new FormData()

      // 1. 添加基本字段
      formData.append("botNo", botNo)
      formData.append("name", values.name)

      // 处理variable字段：组合模式下根据开关状态决定值
      let finalVariable = values.variable
      if (values.variable === 2 && fromDialog) {
        finalVariable = 3
      }
      formData.append("variable", finalVariable)

      if (modalType === "edit" && values.scriptId) {
        formData.append("scriptId", values.scriptId)
      }
      ;(values.scriptTags || []).forEach((tag) => {
        formData.append("scriptTags", tag)
      })

      // 2. 根据模式添加特定字段
      if (values.variable === 2 || finalVariable === 3) {
        // 组合模式（包括从对话中获取标量值）
        formData.append("scriptType", 1)
        formData.append("content", "")

        // 添加 combinations
        ;(values.combinations || []).forEach((item, index) => {
          formData.append(`combinations[${index}].voiceContent`, item.voiceContent || "")
          formData.append(`combinations[${index}].variable`, item.variable)
          formData.append(`combinations[${index}].seq`, item.seq ?? index)
          if (item.volumeConfig) {
            formData.append(
              `combinations[${index}].volumeConfig.openVolumeConfig`,
              item.volumeConfig.openVolumeConfig ?? 0
            )
            formData.append(
              `combinations[${index}].volumeConfig.speed`,
              item.volumeConfig.speed ?? 1.0
            )
            formData.append(
              `combinations[${index}].volumeConfig.volume`,
              item.volumeConfig.volume ?? 55
            )
          }
        })

        // 添加 combinationVoiceInfos 和文件
        // 在组合模式下，确保每个 pairs 项都有对应的 combinationVoiceInfos
        // 这样可以保证 combinations 数组和 combinationVoiceInfos 数组的索引对应
        let combinationVoiceInfoIndex = 0
        ;(values.pairs || []).forEach((pair, pairIndex) => {
          // 获取无变量项目的 seq 列表，用于正确映射
          const noVariableSeqList = (combinationsValue || [])
            .filter((c) => c?.variable === 0)
            .map((c) => c?.seq)

          // 立即添加 timbreCode 信息
          formData.append(
            `combinationVoiceInfos[${combinationVoiceInfoIndex}].timbreCode`,
            pair.code || ""
          )

          // 处理每个分段，确保索引对应
          if (pair.segments && Array.isArray(pair.segments)) {
            pair.segments.forEach((segment, segIndex) => {
              // 根据 segIndex 从无变量项目的 seq 列表中获取正确的 seq
              const fixedSeq = noVariableSeqList[segIndex] ?? segIndex

              if (segment.file instanceof File) {
                // 新文件上传
                formData.append(
                  `combinationVoiceInfos[${combinationVoiceInfoIndex}].combinationVoices[${segIndex}].file`,
                  segment.file
                )
                formData.append(
                  `combinationVoiceInfos[${combinationVoiceInfoIndex}].combinationVoices[${segIndex}].seq`,
                  fixedSeq
                )
              } else if (segment.ossUrl) {
                // 已有文件URL
                formData.append(
                  `combinationVoiceInfos[${combinationVoiceInfoIndex}].combinationVoices[${segIndex}].seq`,
                  fixedSeq
                )
                formData.append(
                  `combinationVoiceInfos[${combinationVoiceInfoIndex}].combinationVoices[${segIndex}].ossUrl`,
                  segment.ossUrl
                )
                formData.append(
                  `combinationVoiceInfos[${combinationVoiceInfoIndex}].combinationVoices[${segIndex}].voicePlayUrl`,
                  segment.ossUrl
                )
              }
            })
          }

          combinationVoiceInfoIndex++
        })
      } else {
        // 普通模式
        formData.append("scriptType", 0)
        formData.append("content", values.content || "")

        // 添加音频配置（仅在有变量模式下）
        if (values.variable === 1 && values.contentVolumeConfig) {
          formData.append(
            `contentVolumeConfig.openVolumeConfig`,
            values.contentVolumeConfig.openVolumeConfig ?? 0
          )
          formData.append(`contentVolumeConfig.speed`, values.contentVolumeConfig.speed ?? 1.0)
          formData.append(`contentVolumeConfig.volume`, values.contentVolumeConfig.volume ?? 55)
        }

        // 添加 pairs (scriptVoices)
        ;(values.pairs || []).forEach((pair, index) => {
          if (pair.code) {
            formData.append(`pairs[${index}].code`, pair.code)
          }
          if (pair.file instanceof File) {
            formData.append(`pairs[${index}].file`, pair.file)
          } else if (typeof pair.file === "string") {
            // 如果是已上传的文件，后端可能需要一个不同的字段来接收URL
            // 根据Apifox模型，似乎还是用'file'字段，但值为string
            formData.append(`pairs[${index}].file`, pair.file)
          }
        })
      }

      const res = await createOrUpdateScript(formData)

      if (res && res.status === 200) {
        message.success(modalType === "add" ? "创建成功" : "更新成功")
        onClose()
        onSuccess?.()
      } else {
        message.error(res?.message || (modalType === "add" ? "创建失败" : "更新失败"))
      }
    } catch (error) {
      console.error("表单验证或提交失败:", error)
    } finally {
      setSubmitLoading(false)
    }
  }

  // 初始化时加载业务类型列表、标签列表和音色列表
  useEffect(() => {
    if (visible && botNo) {
      loadScriptTypeList()
      loadScriptTagList()
      loadTimbreList()
    }
  }, [visible, botNo])

  // 当编辑时设置表单初始值
  useEffect(() => {
    if (visible && modalType === "edit" && currentScript) {
      // 编辑模式时调用API获取详情
      loadScriptDetail(currentScript.id)
    } else if (visible && modalType === "add") {
      form.resetFields()
      form.setFieldsValue({
        variable: 0,
        contentVolumeConfig: {
          openVolumeConfig: 0,
          speed: 1.0,
          volume: 55
        }
      })
      setVariableValue(0)
      setFromDialog(false)
    }
  }, [visible, modalType, currentScript, form])

  // 监听表单变量字段变化，同步更新状态
  useEffect(() => {
    if (visible) {
      const variable = form.getFieldValue("variable")
      if (variable !== undefined) {
        setVariableValue(variable)
      }
    }
  }, [visible, form])

  // 监听抽屉关闭，清理音频播放和话术检查状态
  useEffect(() => {
    if (!visible) {
      // 停止所有音频播放
      Object.keys(audioRefs.current).forEach((key) => {
        const audio = audioRefs.current[key]
        if (audio) {
          audio.pause()
          audio.currentTime = 0
          // 清理事件监听器
          audio.onloadedmetadata = null
          audio.ontimeupdate = null
          audio.onended = null
        }
      })

      // 清空音频引用
      audioRefs.current = {}

      // 重置播放状态
      setPlayingAudio(null)
      setAudioProgress({})
      setAudioDuration({})

      // 清理话术检查状态
      setDuplicateScriptId(null)
      setCheckingContent(false)
    }
  }, [visible])

  return (
    <Drawer
      title={modalType === "add" ? "创建话术" : "编辑话术"}
      open={visible}
      onClose={onClose}
      width={500}
      footer={
        <div style={{ textAlign: "right" }}>
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button type="primary" onClick={handleSubmit} loading={submitLoading}>
              保存
            </Button>
          </Space>
        </div>
      }
    >
      <Spin spinning={scriptDetailLoading} tip="加载话术详情中...">
        <Form form={form} layout="vertical" initialValues={{ variable: 0 }}>
          {modalType === "edit" && (
            <Form.Item name="scriptId" label="话术ID" hidden>
              <Input />
            </Form.Item>
          )}

          <Form.Item
            name="name"
            label="话术名称"
            rules={[{ required: true, message: "请输入话术名称" }]}
          >
            <Input placeholder="请输入话术名称" maxLength={50} />
          </Form.Item>

          <Form.Item
            name="scriptType"
            label="业务类型"
            rules={[{ required: true, message: "请选择业务类型" }]}
          >
            <Select
              placeholder="请选择业务类型"
              showSearch
              allowClear
              loading={scriptTypeLoading}
              filterOption={(input, option) =>
                option?.children?.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <Divider style={{ margin: "8px 0" }} />
                  <div style={{ padding: "8px" }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <Input
                        placeholder="类型名称"
                        value={scriptTypeSearchValue}
                        onChange={(e) => setScriptTypeSearchValue(e.target.value)}
                        onKeyDown={(e) => {
                          e.stopPropagation()
                          if (e.key === "Enter") {
                            handleCreateNewScriptType()
                          }
                        }}
                        style={{ flex: 1 }}
                      />
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleCreateNewScriptType}
                        disabled={!scriptTypeSearchValue.trim()}
                      >
                        创建
                      </Button>
                    </div>
                  </div>
                </>
              )}
              notFoundContent={
                scriptTypeLoading ? (
                  <div style={{ textAlign: "center", padding: "8px" }}>加载中...</div>
                ) : (
                  <div style={{ textAlign: "center", padding: "8px" }}>暂无业务类型</div>
                )
              }
            >
              {scriptTypeOptions.map((option) => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="scriptTags"
            label="业务标签"
            rules={[{ required: true, message: "请选择业务标签" }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择标签"
              allowClear
              showSearch
              loading={scriptTagLoading}
              filterOption={(input, option) =>
                option?.children?.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <Divider style={{ margin: "8px 0" }} />
                  <div style={{ padding: "8px" }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <Input
                        placeholder="标签名称"
                        value={scriptTagSearchValue}
                        onChange={(e) => setScriptTagSearchValue(e.target.value)}
                        onKeyDown={(e) => {
                          e.stopPropagation()
                          if (e.key === "Enter") {
                            handleCreateNewScriptTag()
                          }
                        }}
                        style={{ flex: 1 }}
                      />
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleCreateNewScriptTag}
                        disabled={!scriptTagSearchValue.trim()}
                      >
                        创建
                      </Button>
                    </div>
                  </div>
                </>
              )}
              notFoundContent={
                scriptTagLoading ? (
                  <div style={{ textAlign: "center", padding: "8px" }}>加载中...</div>
                ) : (
                  <div style={{ textAlign: "center", padding: "8px" }}>暂无标签</div>
                )
              }
            >
              {scriptTagOptions.map((option) => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="variable"
            label="是否有变量"
            rules={[{ required: true, message: "请选择是否有变量" }]}
            className={styles.customRadioGroup}
          >
            <Radio.Group
              onChange={(e) => {
                const val = e.target.value
                setVariableValue(val)
                if (val === 2) {
                  const current = form.getFieldValue("combinations") || []
                  if (current.length === 0) {
                    form.setFieldsValue({
                      combinations: [
                        {
                          voiceContent: "",
                          variable: 0,
                          ossUrl: "",
                          seq: 0,
                          volumeConfig: {
                            volume: 0,
                            speed: 1.0,
                            openVolumeConfig: 0
                          }
                        }
                      ]
                    })
                  }
                }
              }}
            >
              <Radio value={1}>有</Radio>
              <Radio value={0}>无</Radio>
              <Radio value={2}>组合</Radio>
            </Radio.Group>
          </Form.Item>

          {variableValue !== 2 ? (
            <>
              <Form.Item
                name="content"
                label="话术内容"
                rules={[{ required: true, message: "请输入话术内容" }]}
              >
                <Input.TextArea
                  placeholder="请输入话术内容"
                  autoSize={{ minRows: 9, maxRows: 15 }}
                  showCount
                  onBlur={handleContentBlur}
                />
              </Form.Item>

              {/* 显示重复话术提示 */}
              {duplicateScriptId && (
                <div className="mb-4 !mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-orange-600 text-sm">
                  ⚠️ 该话术内容与【话术 ID：{duplicateScriptId}
                  】内容重复，保存后将直接覆盖，请谨慎操作!
                </div>
              )}

              {/* 有变量模式下显示音频配置 */}
              {variableValue === 1 && (
                <Form.Item shouldUpdate noStyle>
                  {() => (
                    <Form.Item
                      name={["contentVolumeConfig", "openVolumeConfig"]}
                      label="音频配置"
                      layout="horizontal"
                      initialValue={0}
                      getValueProps={(v) => ({ checked: v === 1 })}
                      getValueFromEvent={(checked) => (checked ? 1 : 0)}
                    >
                      <Switch size="small" />
                    </Form.Item>
                  )}
                </Form.Item>
              )}

              {variableValue === 1 && (
                <Form.Item shouldUpdate noStyle>
                  {() => {
                    const open =
                      form.getFieldValue(["contentVolumeConfig", "openVolumeConfig"]) === 1

                    if (!open) return null

                    return (
                      <Row gutter={15}>
                        <Col span={12}>
                          <Form.Item
                            name={["contentVolumeConfig", "speed"]}
                            label="音频速率"
                            initialValue={1.0}
                          >
                            <div className="flex items-center gap-2">
                              <Slider
                                min={0.6}
                                max={2.5}
                                step={0.01}
                                value={form.getFieldValue(["contentVolumeConfig", "speed"]) ?? 1.0}
                                onChange={(v) =>
                                  form.setFieldValue(["contentVolumeConfig", "speed"], v)
                                }
                                style={{ flex: 1 }}
                              />
                              <InputNumber
                                min={0.6}
                                max={2.5}
                                step={0.01}
                                size="small"
                                value={form.getFieldValue(["contentVolumeConfig", "speed"]) ?? 1.0}
                                onChange={(v) =>
                                  form.setFieldValue(["contentVolumeConfig", "speed"], v)
                                }
                                style={{ width: 70 }}
                              />
                            </div>
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name={["contentVolumeConfig", "volume"]}
                            label="音量"
                            initialValue={55}
                          >
                            <div className="flex items-center gap-2">
                              <Slider
                                min={0}
                                max={100}
                                value={form.getFieldValue(["contentVolumeConfig", "volume"]) ?? 55}
                                onChange={(v) =>
                                  form.setFieldValue(["contentVolumeConfig", "volume"], v)
                                }
                                style={{ flex: 1 }}
                              />
                              <InputNumber
                                min={0}
                                max={100}
                                size="small"
                                value={form.getFieldValue(["contentVolumeConfig", "volume"]) ?? 55}
                                onChange={(v) =>
                                  form.setFieldValue(["contentVolumeConfig", "volume"], v)
                                }
                                style={{ width: 70 }}
                              />
                            </div>
                          </Form.Item>
                        </Col>
                      </Row>
                    )
                  }}
                </Form.Item>
              )}
            </>
          ) : (
            <>
              <Form.Item
                label="从对话中获取标量值"
                name="fromDialog"
                tooltip="开启后，将根据对话内容给话术变量赋值"
                layout="horizontal"
              >
                <Switch
                  size="small"
                  checked={fromDialog}
                  onChange={(checked) => setFromDialog(checked)}
                />
              </Form.Item>

              {/* 启用拖拽排序 */}
              <DragDropContext
                onDragEnd={(result) => {
                  if (!result.destination) return
                  const items = Array.from(form.getFieldValue("combinations") || [])
                  const [reorderedItem] = items.splice(result.source.index, 1)
                  items.splice(result.destination.index, 0, reorderedItem)
                  // 关键：拖拽只改变显示顺序，不改变每条的 seq（固定编号）
                  form.setFieldsValue({ combinations: items })
                }}
              >
                <Droppable droppableId="combinations-droppable">
                  {(providedDrop) => (
                    <div {...providedDrop.droppableProps} ref={providedDrop.innerRef}>
                      <Form.List name="combinations">
                        {(fields, { add, remove }) => (
                          <>
                            {fields.map(({ key, name, ...restField }, index) => (
                              <Draggable key={key} draggableId={`comb-${key}`} index={index}>
                                {(providedDrag) => (
                                  <div
                                    ref={providedDrag.innerRef}
                                    {...providedDrag.draggableProps}
                                    className="mb-4 border border-gray-100 rounded-lg p-2"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <div {...providedDrag.dragHandleProps}>
                                          <Iconfont
                                            type="icon-tuodong"
                                            className="text-[#98A2B3] mr-1 cursor-move"
                                          />
                                        </div>
                                        <div
                                          className="flex items-center justify-center -ml-2"
                                          style={{
                                            width: 18,
                                            height: 18,
                                            borderRadius: 18,
                                            background: "#7F56D9",
                                            color: "#fff",
                                            fontSize: 12,
                                            lineHeight: "18px"
                                          }}
                                        >
                                          {(form.getFieldValue(["combinations", name, "seq"]) ??
                                            name) + 1}
                                        </div>

                                        <Form.Item
                                          {...restField}
                                          name={[name, "variable"]}
                                          className="mb-0"
                                          initialValue={1}
                                        >
                                          <Select
                                            size="small"
                                            style={{ width: 96 }}
                                            options={[
                                              { label: "有变量", value: 1 },
                                              { label: "无变量", value: 0 }
                                            ]}
                                          />
                                        </Form.Item>
                                      </div>

                                      {fields.length > 1 && (
                                        <Button
                                          type="text"
                                          danger
                                          onClick={() => remove(name)}
                                          icon={<DeleteOutlined />}
                                        />
                                      )}
                                    </div>

                                    <Form.Item
                                      {...restField}
                                      name={[name, "voiceContent"]}
                                      label="话术内容"
                                      rules={[{ required: true, message: "请输入话术内容" }]}
                                      style={{ marginTop: 8 }}
                                    >
                                      <Input.TextArea rows={3} placeholder="请输入话术内容" />
                                    </Form.Item>

                                    <Form.Item shouldUpdate noStyle>
                                      {() => {
                                        const itemVariable = form.getFieldValue([
                                          "combinations",
                                          name,
                                          "variable"
                                        ])
                                        return itemVariable === 1 ? (
                                          <div>
                                            <Form.Item shouldUpdate noStyle>
                                              {() => {
                                                const open =
                                                  form.getFieldValue([
                                                    "combinations",
                                                    name,
                                                    "volumeConfig",
                                                    "openVolumeConfig"
                                                  ]) === 1

                                                return (
                                                  <Row gutter={15} align="middle">
                                                    <Col span={2}>
                                                      <Form.Item
                                                        {...restField}
                                                        layout="horizontal"
                                                        name={[
                                                          name,
                                                          "volumeConfig",
                                                          "openVolumeConfig"
                                                        ]}
                                                        className="mt-6"
                                                        initialValue={0}
                                                        getValueProps={(v) => ({
                                                          checked: v === 1
                                                        })}
                                                        getValueFromEvent={(checked) =>
                                                          checked ? 1 : 0
                                                        }
                                                      >
                                                        <Switch size="small" />
                                                      </Form.Item>
                                                    </Col>
                                                    <Col span={11}>
                                                      <Form.Item
                                                        {...restField}
                                                        name={[name, "volumeConfig", "speed"]}
                                                        label="音频速率"
                                                        initialValue={1}
                                                      >
                                                        <Form.Item shouldUpdate noStyle>
                                                          {() => {
                                                            const speedValue =
                                                              form.getFieldValue([
                                                                "combinations",
                                                                name,
                                                                "volumeConfig",
                                                                "speed"
                                                              ]) ?? 1

                                                            return (
                                                              <div className="flex items-center gap-2">
                                                                <Slider
                                                                  min={0.6}
                                                                  max={2.5}
                                                                  step={0.01}
                                                                  disabled={!open}
                                                                  value={speedValue}
                                                                  onChange={(v) =>
                                                                    form.setFieldValue(
                                                                      [
                                                                        "combinations",
                                                                        name,
                                                                        "volumeConfig",
                                                                        "speed"
                                                                      ],
                                                                      v
                                                                    )
                                                                  }
                                                                  style={{ flex: 1 }}
                                                                />
                                                                <InputNumber
                                                                  min={0.6}
                                                                  size="small"
                                                                  max={2.5}
                                                                  step={0.01}
                                                                  disabled={!open}
                                                                  value={speedValue}
                                                                  onChange={(v) =>
                                                                    form.setFieldValue(
                                                                      [
                                                                        "combinations",
                                                                        name,
                                                                        "volumeConfig",
                                                                        "speed"
                                                                      ],
                                                                      v
                                                                    )
                                                                  }
                                                                  style={{ width: 70 }}
                                                                />
                                                              </div>
                                                            )
                                                          }}
                                                        </Form.Item>
                                                      </Form.Item>
                                                    </Col>

                                                    <Col span={11}>
                                                      <Form.Item
                                                        {...restField}
                                                        name={[name, "volumeConfig", "volume"]}
                                                        label="音量"
                                                        initialValue={55}
                                                      >
                                                        <Form.Item shouldUpdate noStyle>
                                                          {() => {
                                                            const volumeValue =
                                                              form.getFieldValue([
                                                                "combinations",
                                                                name,
                                                                "volumeConfig",
                                                                "volume"
                                                              ]) ?? 55

                                                            return (
                                                              <div className="flex items-center gap-2">
                                                                <Slider
                                                                  min={0}
                                                                  max={100}
                                                                  disabled={!open}
                                                                  value={volumeValue}
                                                                  onChange={(v) =>
                                                                    form.setFieldValue(
                                                                      [
                                                                        "combinations",
                                                                        name,
                                                                        "volumeConfig",
                                                                        "volume"
                                                                      ],
                                                                      v
                                                                    )
                                                                  }
                                                                  style={{ flex: 1 }}
                                                                />
                                                                <InputNumber
                                                                  min={0}
                                                                  max={100}
                                                                  size="small"
                                                                  disabled={!open}
                                                                  value={volumeValue}
                                                                  onChange={(v) =>
                                                                    form.setFieldValue(
                                                                      [
                                                                        "combinations",
                                                                        name,
                                                                        "volumeConfig",
                                                                        "volume"
                                                                      ],
                                                                      v
                                                                    )
                                                                  }
                                                                  style={{ width: 70 }}
                                                                />
                                                              </div>
                                                            )
                                                          }}
                                                        </Form.Item>
                                                      </Form.Item>
                                                    </Col>
                                                  </Row>
                                                )
                                              }}
                                            </Form.Item>
                                          </div>
                                        ) : null
                                      }}
                                    </Form.Item>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          </>
                        )}
                      </Form.List>
                      {providedDrop.placeholder}
                      <Button
                        type="link"
                        className="mb-3 -mt-2"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          const list = form.getFieldValue("combinations") || []
                          form.setFieldsValue({
                            combinations: [
                              ...list,
                              {
                                voiceContent: "",
                                variable: 0,
                                ossUrl: "",
                                seq: Math.max(-1, ...list.map((it) => Number(it?.seq) || 0)) + 1,
                                volumeConfig: {
                                  volume: 0,
                                  speed: 1.0,
                                  openVolumeConfig: 0
                                }
                              }
                            ]
                          })
                        }}
                      >
                        添加话术段
                      </Button>
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </>
          )}

          {variableValue === 2 && (
            <>
              <Divider className="-mt-2" />
            </>
          )}

          {/* 录音列表 - 只有在选择"无变量"时才显示 */}
          {(variableValue === 0 || variableValue === 2) && (
            <Form.Item label="录音列表" name="pairs">
              <Form.List name="pairs">
                {(fields, { add, remove }) => (
                  <>
                    {fields.length === 0 ? (
                      <div className="mb-4">
                        <CustomEmpty description="暂无录音文件，请点击下方按钮添加" />
                      </div>
                    ) : (
                      fields.map(({ key, name, ...restField }) => {
                        // 检查当前录音项是否为从详情获得的存量数据
                        const pairs = form.getFieldValue("pairs") || []
                        const currentPair = pairs[name]
                        const isExistingData =
                          currentPair?.file && typeof currentPair.file === "string"

                        return (
                          <div key={key} className="relative mb-4">
                            {/* 删除按钮 - 右上角，存量数据不显示删除按钮 */}
                            {!isExistingData && (
                              // <i
                              //   onClick={() => remove(name)}
                              //   className="iconfont icon-shanchu1 absolute top-1 right-2 cursor-pointer text-gray-400 hover:text-red-500 z-10"
                              // ></i>
                              <Button
                                type="text"
                                danger
                                onClick={() => remove(name)}
                                className="absolute top-1 right-2 cursor-pointer text-gray-400 hover:text-red-500 z-10"
                                icon={<DeleteOutlined />}
                              />
                            )}

                            <div className="p-4 pt-6 bg-white border border-gray-100 rounded-lg">
                              {variableValue === 2 ? (
                                <MultiSegmentRecordingItem
                                  form={form}
                                  pairIndex={name}
                                  botNo={botNo}
                                  scriptId={form.getFieldValue("scriptId")}
                                  restField={restField}
                                  timbreOptions={getProcessedTimbreOptions(name)}
                                  timbreLoading={timbreLoading}
                                  playingAudio={playingAudio}
                                  setPlayingAudio={setPlayingAudio}
                                  audioProgress={audioProgress}
                                  setAudioProgress={setAudioProgress}
                                  audioDuration={audioDuration}
                                  setAudioDuration={setAudioDuration}
                                  audioRefs={audioRefs}
                                  segmentSeqList={(combinationsValue || [])
                                    .filter((c) => c?.variable === 0)
                                    .map((c) => c?.seq)}
                                  segmentCount={
                                    (combinationsValue || []).filter((c) => c?.variable === 0)
                                      .length
                                  }
                                />
                              ) : (
                                <RecordingItem
                                  form={form}
                                  botNo={botNo}
                                  fieldName={name}
                                  restField={restField}
                                  timbreOptions={getProcessedTimbreOptions(name)}
                                  timbreLoading={timbreLoading}
                                  playingAudio={playingAudio}
                                  setPlayingAudio={setPlayingAudio}
                                  audioProgress={audioProgress}
                                  setAudioProgress={setAudioProgress}
                                  audioDuration={audioDuration}
                                  setAudioDuration={setAudioDuration}
                                  audioRefs={audioRefs}
                                />
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                    <div className="mt-4">
                      <a
                        type="text"
                        onClick={() => add({ code: undefined, file: "" })}
                        className="!pl-0"
                      >
                        <PlusOutlined />
                        <span className="ml-1">添加录音</span>
                      </a>
                    </div>
                  </>
                )}
              </Form.List>
            </Form.Item>
          )}
        </Form>
      </Spin>
    </Drawer>
  )
}
export default ScriptDrawer
