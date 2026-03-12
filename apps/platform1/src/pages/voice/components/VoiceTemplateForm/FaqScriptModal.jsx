import React, { useState, useEffect, useRef, useCallback } from "react"
import {
  Modal,
  Form,
  Button,
  Space,
  Row,
  Col,
  Tooltip,
  message,
  InputNumber,
  Radio,
  Select,
  Input,
  Slider
} from "antd"
import {
  PlusOutlined,
  CloseOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined
} from "@ant-design/icons"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"
import { getFaqScriptInfo, saveFaqScript, synthesisVoice } from "@/api/voiceAgent/api"
import { useGetScriptListByPage } from "@/api/voiceAgent"
import RecordingItem from "../RecordingItem"
import MultiSegmentRecordingItem from "../MultiSegmentRecordingItem"
import ScriptSelector from "@/components/ScriptSelector"
import styles from "../../script.module.scss"
import { functionDownVoice } from "@/utils"

const { Option } = Select
const { TextArea } = Input

const FaqScriptModal = ({ visible, onClose, faqRecord, botNo, taskId, timbreCode, timbreName }) => {
  console.log("关联话术：", faqRecord, botNo, taskId, timbreCode)
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [scriptList, setScriptList] = useState([])

  // 试听功能状态
  const [synthesizing, setSynthesizing] = useState(false)
  const [audioUrl, setAudioUrl] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioDuration, setAudioDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef(null)

  // 录音播放相关状态
  const [playingAudio, setPlayingAudio] = useState(null)
  const [audioProgress, setAudioProgress] = useState({})
  const [recordingAudioDuration, setRecordingAudioDuration] = useState({})
  const recordingAudioRefs = useRef({})

  // 获取话术列表
  const { data: scriptData, isLoading: scriptLoading } = useGetScriptListByPage(
    {
      pageSize: 10000,
      pageNum: 1,
      botNo,
      taskId
    },
    {
      enabled: visible && !!botNo && !!taskId
    }
  )

  // 处理话术列表数据
  useEffect(() => {
    if (
      scriptData?.data?.list &&
      Array.isArray(scriptData?.data?.list) &&
      scriptData?.data?.list.length > 0
    ) {
      const formattedScripts = scriptData?.data?.list.map((script) => ({
        scriptId: script.id,
        name: script.name || `话术${script.id}`,
        content: script.content || "",
        variable: script.variable || 0
      }))
      setScriptList(formattedScripts)
    }
  }, [scriptData])

  // 加载FAQ关联话术详情
  const loadFaqScriptInfo = useCallback(async () => {
    if (!faqRecord?.faqNo || !botNo || !taskId) {
      return
    }

    try {
      setLoading(true)
      const response = await getFaqScriptInfo({
        botNo,
        faqCode: faqRecord.faqNo,
        taskId
      })

      if (response && response.status === 200 && response.data) {
        // 处理返回的话术数据
        const scripts = response.data.map((script, index) => ({
          scriptId: script.scriptId,
          variable: script.variable || 0,
          name: script.name || null,
          content: script.content || "",
          scriptType: script.scriptType || 1,
          scriptTags: script.scriptTags || [],
          rule: script.rule || "",
          priorityLevel: script.priorityLevel || index + 1,
          // 音频相关参数
          audioFormat: script.audioFormat || "wav",
          sampleRate: script.sampleRate || 8000,
          volume: script.volume || 50,
          speed: script.speed || 1.05,
          timbreCode: script.timbreCode || null,
          // 录音相关参数
          scriptVoices: script.scriptVoices || []
        }))

        form.setFieldsValue({
          scripts
        })
      } else {
        // 如果没有数据，初始化一个空的话术
        form.setFieldsValue({
          scripts: []
        })
      }
    } catch (error) {
      console.error("获取FAQ关联话术详情失败:", error)
      message.error("获取FAQ关联话术详情失败")
      // 出错时也初始化空数据
      form.setFieldsValue({
        scripts: []
      })
    } finally {
      setLoading(false)
    }
  }, [faqRecord, botNo, taskId, form])

  // 当弹窗打开时加载数据
  useEffect(() => {
    if (visible && faqRecord && botNo && taskId) {
      // 重置表单
      form.resetFields()
      // 加载FAQ关联话术详情
      loadFaqScriptInfo()
    }
  }, [visible, faqRecord, botNo, taskId, loadFaqScriptInfo, form])

  // 处理语音合成
  const handleSynthesis = useCallback(
    async (fieldName, scriptIndex) => {
      try {
        const values = form.getFieldsValue()
        const scriptValues = values.scripts?.[scriptIndex] || {}
        const { synthesisText, audioFormat, sampleRate, speed, volume } = scriptValues

        // 验证必填参数 - 使用父组件传递的timbreCode
        if (!timbreCode) {
          message.warning("请先选择音色")
          return
        }

        // if (!synthesisText) {
        //   message.warning("请输入要合成的文本")
        //   return
        // }

        if (audioFormat === "pcm") {
          message.warning("pcm 录音格式暂时不支持试听")
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

        setSynthesizing(true)
        setAudioUrl("")

        const params = {
          botNo,
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
            setAudioUrl(res.data)
            setProgress(0)
            setCurrentTime(0)
            setIsPlaying(false)
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
    },
    [form, botNo, timbreCode]
  )

  // 播放或暂停音频
  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }, [isPlaying])

  // 格式化时间为 mm:ss 格式
  const formatTime = useCallback((time) => {
    if (isNaN(time) || time === 0) return "00:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }, [])

  // 处理进度条点击事件
  const handleProgressClick = useCallback(
    (e) => {
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
    },
    [audioDuration]
  )

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

    const handleAudioEnded = () => {
      setIsPlaying(false)
      setProgress(100)
    }

    const audioElement = audioRef.current
    if (audioElement) {
      audioElement.addEventListener("timeupdate", handleTimeUpdate)
      audioElement.addEventListener("loadedmetadata", handleLoadedMetadata)
      audioElement.addEventListener("ended", handleAudioEnded)
      return () => {
        audioElement.removeEventListener("timeupdate", handleTimeUpdate)
        audioElement.removeEventListener("loadedmetadata", handleLoadedMetadata)
        audioElement.removeEventListener("ended", handleAudioEnded)
      }
    }
  }, [audioRef.current, audioDuration])

  // 保存FAQ关联话术
  const handleSave = async () => {
    try {
      const values = await form.validateFields()

      // 验证至少有一个话术
      if (!values.scripts || values.scripts.length === 0) {
        message.error("请至少添加一个话术")
        return
      }

      // 验证话术优先级
      for (let i = 0; i < values.scripts.length; i++) {
        const script = values.scripts[i]
        if (!script.priorityLevel || script.priorityLevel < 1) {
          message.error(`第${i + 1}个话术的优先级必须是大于0的正整数`)
          return
        }
      }

      setSaveLoading(true)

      // 构建保存参数
      const params = {
        botNo,
        faqCode: faqRecord?.faqNo,
        faqName: faqRecord?.faqQuestion,
        taskId,
        scriptFiles: values?.scripts?.map((script) => {
          // 只有当话术没有变量时才需要录音文件
          let file = ""
          if (script?.variable === 0 && script?.scriptVoices && script?.scriptVoices?.length > 0) {
            file = script?.scriptVoices[0]?.ossUrl || ""
          }

          return {
            file: file, // 录音文件 URL（有变量时为空字符串）
            scriptId: script.scriptId,
            priorityLevel: script.priorityLevel,
            rule: script.rule || ""
          }
        })
      }

      const response = await saveFaqScript(params)

      if (response && response.status === 200) {
        message.success("FAQ关联话术保存成功")
        onClose()
      } else {
        message.error(response?.message || "保存失败")
      }
    } catch (error) {
      console.error("保存FAQ关联话术失败:", error)
      message.error("保存失败")
    } finally {
      setSaveLoading(false)
    }
  }

  // 弹窗关闭时重置表单
  const handleClose = () => {
    form.resetFields()
    setAudioUrl("")
    setIsPlaying(false)
    onClose()
  }

  return (
    <Modal
      title={`关联话术 - ${faqRecord?.faqQuestion || ""}`}
      open={visible}
      onCancel={handleClose}
      width={800}
      destroyOnClose
      footer={
        <div className="text-right">
          <Space>
            <Button onClick={handleClose}>取消</Button>
            <Button type="primary" loading={saveLoading} onClick={handleSave}>
              保存
            </Button>
          </Space>
        </div>
      }
    >
      <div className="max-h-[65vh] overflow-y-auto">
        <Form form={form} layout="vertical">
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-600">
              <div>
                <strong>知识编号:</strong> {faqRecord?.faqNo}
              </div>
              <div>
                <strong>业务ID:</strong> {faqRecord?.businessNo}
              </div>
              <div>
                <strong>标准问题:</strong> {faqRecord?.faqQuestion}
              </div>
            </div>
          </div>

          <Form.Item label="话术配置">
            <Form.List name="scripts">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field, index) => (
                    <div
                      key={field.key}
                      className="mt-3 p-4 pb-0 border border-gray-300 rounded-lg relative bg-white"
                      style={{
                        border: "1px solid #E5E7EB"
                      }}
                    >
                      <h4 className="text-sm font-medium mb-3 text-gray-700">
                        话术配置 {index + 1}
                      </h4>
                      <Button
                        type="link"
                        danger
                        onClick={() => remove(field.name)}
                        className="absolute right-2 top-2 text-xs"
                        icon={<CloseOutlined className="text-gray-500" />}
                      />

                      {/* 话术名称和话术优先级 */}
                      <Row gutter={16} className="mb-3">
                        <Col span={18}>
                          <Form.Item
                            {...field}
                            name={[field.name, "scriptId"]}
                            label="话术名称"
                            rules={[{ required: true, message: "请选择话术名称" }]}
                            className="mb-0"
                          >
                            <ScriptSelector
                              placeholder="请选择话术"
                              botNo={botNo}
                              taskId={taskId}
                              timbreCode={timbreCode}
                              onChange={(scriptId) => {
                                const selectedScript = scriptList.find(
                                  (s) => s.scriptId === scriptId
                                )
                                if (selectedScript) {
                                  form.setFieldValue(
                                    ["scripts", field.name, "variable"],
                                    selectedScript.variable || 0
                                  )
                                }
                              }}
                              onScriptDetailChange={(scriptDetail) => {
                                if (scriptDetail) {
                                  // 处理不同类型的数据
                                  let scriptVoices = []

                                  if (scriptDetail.variable === 2 || scriptDetail.variable === 3) {
                                    // 组合模式：从 combinationVoiceInfos 获取录音数据
                                    if (
                                      scriptDetail.combinationVoiceInfos &&
                                      Array.isArray(scriptDetail.combinationVoiceInfos)
                                    ) {
                                      scriptVoices = scriptDetail.combinationVoiceInfos.map(
                                        (voiceInfo) => ({
                                          timbreCode: voiceInfo.timbreCode,
                                          voiceName: timbreName || `音色-${voiceInfo.timbreCode}`,
                                          // 将 combinationVoices 转换为 segments 格式
                                          segments: voiceInfo.combinationVoices
                                            ? voiceInfo.combinationVoices.map((cv) => ({
                                                file: cv.voicePlayUrl || cv.ossUrl,
                                                fileName:
                                                  cv.voicePlayUrl && cv.voicePlayUrl.includes("/")
                                                    ? cv.voicePlayUrl.split("?")[0].split("/").pop()
                                                    : cv.ossUrl && cv.ossUrl.includes("/")
                                                      ? cv.ossUrl.split("/").pop()
                                                      : `录音文件_${cv.seq}.wav`,
                                                ossUrl: cv.ossUrl,
                                                voicePlayUrl: cv.voicePlayUrl,
                                                seq: cv.seq
                                              }))
                                            : []
                                        })
                                      )
                                    }

                                    // 设置 pairs 数据供 MultiSegmentRecordingItem 使用
                                    const pairs = scriptDetail.combinationVoiceInfos
                                      ? scriptDetail.combinationVoiceInfos.map((voiceInfo) => ({
                                          code: voiceInfo.timbreCode,
                                          segments: voiceInfo.combinationVoices
                                            ? voiceInfo.combinationVoices.map((cv) => ({
                                                file: cv.voicePlayUrl || cv.ossUrl,
                                                fileName:
                                                  cv.voicePlayUrl && cv.voicePlayUrl.includes("/")
                                                    ? cv.voicePlayUrl.split("?")[0].split("/").pop()
                                                    : cv.ossUrl && cv.ossUrl.includes("/")
                                                      ? cv.ossUrl.split("/").pop()
                                                      : `录音文件_${cv.seq}.wav`,
                                                ossUrl: cv.ossUrl,
                                                voicePlayUrl: cv.voicePlayUrl,
                                                seq: cv.seq
                                              }))
                                            : []
                                        }))
                                      : []

                                    // 一次性设置 combinations 和 pairs，确保同步更新
                                    const currentScripts = form.getFieldValue("scripts") || []
                                    currentScripts[field.name] = {
                                      ...currentScripts[field.name],
                                      combinations: scriptDetail.combinations || [],
                                      pairs: pairs
                                    }
                                    form.setFieldsValue({ scripts: currentScripts })
                                  } else {
                                    // 普通模式：从 scriptVoices 获取录音数据
                                    if (
                                      scriptDetail.scriptVoices &&
                                      Array.isArray(scriptDetail.scriptVoices) &&
                                      timbreCode
                                    ) {
                                      // 查找匹配的录音文件
                                      const matchedVoice = scriptDetail.scriptVoices.find(
                                        (voice) => voice.timbreCode == timbreCode
                                      )

                                      if (matchedVoice) {
                                        scriptVoices = [matchedVoice]
                                      }
                                    }

                                    // 设置录音文件到当前话术的 scriptVoices 字段
                                    form.setFieldValue(
                                      ["scripts", field.name, "scriptVoices"],
                                      scriptVoices
                                    )
                                  }

                                  // 如果话术有变量，设置音色信息
                                  if (scriptDetail.variable === 1) {
                                    form.setFieldValue(
                                      ["scripts", field.name, "timbreCode"],
                                      timbreCode
                                    )
                                  }
                                }
                              }}
                            />
                          </Form.Item>
                        </Col>

                        <Col span={6}>
                          <Form.Item
                            {...field}
                            name={[field.name, "priorityLevel"]}
                            label="话术优先级"
                            initialValue={field.name + 1}
                            rules={[
                              {
                                validator: (_, value) => {
                                  if (value === undefined || value === null || value === "") {
                                    return Promise.reject(new Error("请输入话术优先级"))
                                  }
                                  const num = Number(value)
                                  if (isNaN(num) || num < 1 || !Number.isInteger(num)) {
                                    return Promise.reject(new Error("优先级必须是大于0的正整数"))
                                  }
                                  return Promise.resolve()
                                }
                              }
                            ]}
                            className="mb-0 !w-full"
                            tooltip="数字越小优先级越高，最小是1"
                          >
                            <InputNumber
                              placeholder="请输入优先级"
                              min={1}
                              className="w-full"
                              precision={0}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      {/* 话术规则 */}
                      <Row className="mb-3">
                        <Col span={24}>
                          <Form.Item
                            {...field}
                            name={[field.name, "rule"]}
                            label="话术规则"
                            className="mb-0"
                          >
                            <Input.TextArea placeholder="请输入话术规则" allowClear />
                          </Form.Item>
                        </Col>
                      </Row>

                      {/* 话术内容展示 */}
                      <Form.Item dependencies={[["scripts", field.name, "scriptId"]]}>
                        {({ getFieldValue }) => {
                          const selectedScriptId = getFieldValue([
                            "scripts",
                            field.name,
                            "scriptId"
                          ])

                          const selectedScript = scriptList.find(
                            (s) => s.scriptId === selectedScriptId
                          )
                          const scriptContent = selectedScript?.content

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
                            <div className="bg-gray-50 p-3 rounded">
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

                      {/* <Form.Item
                        {...field}
                        name={[field.name, "variable"]}
                        label="是否有变量1"
                        rules={[{ required: true, message: "请选择是否有变量" }]}
                        className={`${styles.customRadioGroup}`}
                        initialValue={0}
                      >
                        <Radio.Group disabled>
                          <Radio value={1}>有</Radio>
                          <Radio value={0}>无</Radio>
                        </Radio.Group>
                      </Form.Item> */}

                      {/* 条件渲染：当选择"有变量"时显示声音设置 */}
                      <Form.Item
                        dependencies={[
                          ["scripts", field.name, "variable"],
                          ["scripts", field.name, "scriptId"],
                          ["scripts", field.name, "combinations"],
                          ["scripts", field.name, "pairs"]
                        ]}
                      >
                        {({ getFieldValue }) => {
                          const hasVariable = getFieldValue(["scripts", field.name, "variable"])
                          const currentScriptId = getFieldValue(["scripts", field.name, "scriptId"])

                          if (hasVariable === 1) {
                            return (
                              <div>
                                <Row gutter={16}>
                                  <Col span={24}>
                                    <Form.Item dependencies={[["scripts", field.name, "scriptId"]]}>
                                      {({ getFieldValue }) => {
                                        const selectedScriptId = getFieldValue([
                                          "scripts",
                                          field.name,
                                          "scriptId"
                                        ])

                                        const selectedScript = scriptList.find(
                                          (s) => s.scriptId === selectedScriptId
                                        )
                                        const scriptContent = selectedScript?.content

                                        return (
                                          <Form.Item
                                            {...field}
                                            name={[field.name, "synthesisText"]}
                                            label="试听"
                                            initialValue={scriptContent || ""}
                                          >
                                            <Input.TextArea
                                              placeholder={
                                                scriptContent
                                                  ? scriptContent
                                                  : "请输入要合成试听的文本"
                                              }
                                              rows={3}
                                              className="flex-1 mr-2"
                                            />
                                          </Form.Item>
                                        )
                                      }}
                                    </Form.Item>
                                    <div className="text-left">
                                      <Button
                                        icon={<i className="iconfont icon-zhinengyouhua"></i>}
                                        onClick={() => handleSynthesis(field.name, field.name)}
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
                                  <div className="mt-3 bg-gray-100 p-3 rounded-md">
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

                                    {/* 隐藏的音频元素 */}
                                    <audio
                                      ref={audioRef}
                                      src={audioUrl}
                                      style={{ display: "none" }}
                                    />
                                  </div>
                                )}
                              </div>
                            )
                          } else if (hasVariable === 2 || hasVariable === 3) {
                            // 组合模式：显示分段录音上传
                            const currentScript = getFieldValue(["scripts", field.name]) || {}
                            const combinationsValue = currentScript.combinations || []

                            const segmentSeqList = combinationsValue
                              .filter((c) => c?.variable === 0)
                              .map((c) => c?.seq)

                            const segmentCount = combinationsValue.filter(
                              (c) => c?.variable === 0
                            ).length

                            return (
                              <div className="w-full mt-4">
                                <Form.List name={[field.name, "pairs"]}>
                                  {(pairFields, { add: addPair, remove: removePair }) => {
                                    if (pairFields.length === 0) {
                                      addPair()
                                    }

                                    return (
                                      <div className="recordingItem">
                                        {pairFields.map((pairField, pairIndex) => (
                                          <div
                                            key={pairField.key}
                                            className="border p-2 pr-4 border-gray-100 rounded-md mb-2"
                                          >
                                            <MultiSegmentRecordingItem
                                              form={form}
                                              pairIndex={pairField.name}
                                              restField={{ ...pairField, name: field.name }}
                                              timbreOptions={[]}
                                              timbreLoading={false}
                                              playingAudio={playingAudio}
                                              setPlayingAudio={setPlayingAudio}
                                              audioProgress={audioProgress}
                                              setAudioProgress={setAudioProgress}
                                              audioDuration={recordingAudioDuration}
                                              setAudioDuration={setRecordingAudioDuration}
                                              audioRefs={recordingAudioRefs}
                                              segmentSeqList={segmentSeqList}
                                              segmentCount={segmentCount}
                                              disableTimbreSelect={true}
                                              defaultTimbreCode={timbreCode}
                                              defaultTimbreName={timbreName}
                                              defaultTimbreModel={""}
                                              dataPath="nested"
                                              uploadMode="api"
                                              botNo={botNo}
                                              scriptId={currentScriptId}
                                              onUploadSuccess={(url, segmentIndex) => {
                                                console.log("分段录音上传成功:", url, segmentIndex)
                                              }}
                                              onUploadError={(error) => {
                                                console.error("分段录音上传失败:", error)
                                              }}
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    )
                                  }}
                                </Form.List>
                              </div>
                            )
                          } else if (hasVariable === 0) {
                            // 无变量时显示录音上传功能
                            return (
                              <div className="w-full mt-4">
                                <Form.List name={[field.name, "scriptVoices"]}>
                                  {(voiceFields, { add: addVoice, remove: removeVoice }) => {
                                    if (voiceFields.length === 0) {
                                      addVoice()
                                    }

                                    return (
                                      <div>
                                        {voiceFields.map((voiceField, voiceIndex) => (
                                          <div
                                            key={voiceField.key}
                                            className="border p-2 pr-4 border-gray-100 rounded-md mb-2"
                                          >
                                            {/* 音色提示 */}
                                            {!timbreCode && (
                                              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                                                您还未选择音色，请去【声音设置】选择音色
                                              </div>
                                            )}
                                            <RecordingItem
                                              key={`recording-${field.key}-${voiceField.key}-${currentScriptId}`}
                                              form={form}
                                              fieldName={[
                                                "scripts",
                                                field.name,
                                                "scriptVoices",
                                                voiceField.name
                                              ]}
                                              restField={voiceField}
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
                                              botNo={botNo}
                                              scriptId={currentScriptId}
                                              defaultTimbreCode={timbreCode}
                                              defaultTimbreName={timbreName}
                                              defaultTimbreModel={""}
                                              disableTimbreSelect={true}
                                              onRemove={() => removeVoice(voiceField.name)}
                                              showRemove={voiceFields.length > 1}
                                              onUploadSuccess={(url, fieldName) => {
                                                console.log("语音上传成功:", url, fieldName)
                                                message.success("语音文件上传成功")
                                              }}
                                              onUploadError={(error) => {
                                                console.error("语音上传失败:", error)
                                                message.error("语音文件上传失败")
                                              }}
                                            />
                                          </div>
                                        ))}
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
                  ))}

                  {fields.length === 0 && (
                    <CustomEmpty description="暂无话术配置，请点击下方按钮添加" />
                  )}

                  <Form.Item className="mt-2">
                    <div className="flex justify-start">
                      <Button
                        type="link"
                        onClick={() =>
                          add({
                            scriptId: undefined,
                            variable: 0,
                            name: null,
                            content: "",
                            scriptType: 1,
                            scriptTags: [],
                            rule: "",
                            priorityLevel: fields.length + 1,
                            audioFormat: "wav",
                            sampleRate: 8000,
                            volume: 50,
                            speed: 1.05,
                            timbreCode: null,
                            scriptVoices: []
                          })
                        }
                        icon={<PlusOutlined />}
                        className="p-0"
                      >
                        添加话术
                      </Button>
                    </div>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}

export default FaqScriptModal
