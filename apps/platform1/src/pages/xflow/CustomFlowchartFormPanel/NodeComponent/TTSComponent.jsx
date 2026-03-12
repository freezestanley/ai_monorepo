import { useEffect, useState, useRef, useMemo } from "react"
import {
  Form,
  Input,
  Row,
  Col,
  Button,
  Divider,
  Tabs,
  Select,
  Radio,
  Slider,
  InputNumber,
  message,
  Segmented
} from "antd"
import { PlayCircleOutlined, PauseCircleOutlined } from "@ant-design/icons"
import GlobalVariableSelect from "@/components/GlobalVariableSelect"
import DynamicFormComponent from "./components/DynamicFormComponent"
import { useFormData } from "../../hooks/useInputFormData"
import { useFetchGlobalVariable } from "@/api/skill"
import { useNodeUpdate } from "../../hooks/useNodeUpdate"
import useSaveShortcut from "../../hooks/useSaveShortcut"
import { isFunction } from "lodash"
import { CommonContent } from "../CommonContent"
import { useCurrentSkillLockInfo } from "@/store/index"
import useFormDisabled from "@/pages/xflow/hooks/useFormDisabled"
import { useCustomVariableType } from "../../hooks"
import { formatSessionParams } from "./utils"
import PreJudgment from "./components/PreJudgment"
import DynamicFormList from "./DynamicFormList"
import FallbackHandler from "./FallbackHandler"
import { useFetchTTSAudioFormat } from "@/api/workBench"
import CustomDivider from "@/components/CustomDivider"
import { fetchPersonalTimbreListV2 } from "@/api/timbre/api"
import { synthesisVoice } from "@/api/voiceAgent/api"
import { useNavigate } from "react-router-dom"
import { functionDownVoice } from "@/utils"

const TabPane = Tabs.TabPane

const TTSComponent = ({ targetData, appData, commandService }) => {
  const navigate = useNavigate()
  const { form, formData: baseFormData } = useFormData()
  const [_, forceUpdate] = useState({})
  const [loading, setLoading] = useState(false)

  const { updateNodeComp, skillFlowData, isLoading } = useNodeUpdate(commandService, appData)
  const { data: globalData = [] } = useFetchGlobalVariable(skillFlowData?.versionNo)
  const { isLocked } = useCurrentSkillLockInfo((state) => state.currentSkillLockInfo)
  const [isDisabled] = useFormDisabled()

  // 状态管理 Segmented 切换 - 使用后端定义的字段名
  const [timbreMode, setTimbreMode] = useState("固定值")
  const [speedMode, setSpeedMode] = useState("固定值")
  const [volumeMode, setVolumeMode] = useState("固定值")
  // 保存默认值
  const [defaultSpeed] = useState(1.05)
  const [defaultVolume] = useState(50)

  // 创建包含变量值字段的调试表单数据
  const debugFormData = useMemo(() => {
    const debugData = [...(baseFormData || [])]
    const values = form.getFieldsValue()

    // 添加音色变量值字段
    if (timbreMode === "变量值" && values.timbreId) {
      const timbreVar = globalData?.find((g) => g.displayName === values.timbreId)
      if (timbreVar) {
        debugData.push({
          controlType: "textarea",
          attributeName: "timbreId",
          title: timbreVar.description || timbreVar.displayName,
          placeholder: timbreVar.description,
          valueExpression: timbreVar.valueExpression
        })
      }
    }

    // 添加音频速率变量值字段
    if (speedMode === "变量值" && values.speed) {
      const speedVar = globalData?.find((g) => g.displayName === values.speed)
      if (speedVar) {
        debugData.push({
          controlType: "textarea",
          attributeName: "speed",
          title: speedVar.description || speedVar.displayName,
          placeholder: speedVar.description,
          valueExpression: speedVar.valueExpression
        })
      }
    }

    // 添加音量变量值字段
    if (volumeMode === "变量值" && values.volume) {
      const volumeVar = globalData?.find((g) => g.displayName === values.volume)
      if (volumeVar) {
        debugData.push({
          controlType: "textarea",
          attributeName: "volume",
          title: volumeVar.description || volumeVar.displayName,
          placeholder: volumeVar.description,
          valueExpression: volumeVar.valueExpression
        })
      }
    }

    return debugData
  }, [baseFormData, timbreMode, speedMode, volumeMode, form, globalData])

  const { data: audioFormatOptions, isLoading: isLoadingFormat } = useFetchTTSAudioFormat()

  // 移除mode, timbreCode, timbreId, audioFormat, sampleRate, speed, volume, synthesisText的useState
  // 只保留试听相关的useState
  const [audioUrl, setAudioUrl] = useState("")
  const [synthesizing, setSynthesizing] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioDuration, setAudioDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef(null)

  const [timbreLoading, setTimbreLoading] = useState(false)
  const [timbreList, setTimbreList] = useState([])

  useEffect(() => {
    // 简化：只判断timbreId
    const timbreId = targetData?.timbreId
    const selectSound =
      timbreId && !targetData?.selectSound
        ? false
        : timbreId && targetData?.selectSound
          ? true
          : true
    form.setFieldsValue({
      ...targetData,
      selectSound,
      inputParams: targetData?.inputParams?.[0],
      audioFormat: targetData?.audioFormat || "wav"
    })
    forceUpdate({})
  }, [targetData, form])

  // 替换 fetchTimbreList
  const fetchTimbreList = async (search = "") => {
    setTimbreLoading(true)
    try {
      const list = await fetchPersonalTimbreListV2({
        botNo: skillFlowData?.botNo,
        timbreName: search
      })
      setTimbreList(list)
    } finally {
      setTimbreLoading(false)
    }
  }
  useEffect(() => {
    fetchTimbreList()
  }, [form, skillFlowData?.botNo])

  // 替换试听相关逻辑
  const handleSynthesis = async () => {
    const selectSound = form.getFieldValue("selectSound")
    const timbreId = form.getFieldValue("timbreId")
    const audioFormat = form.getFieldValue("audioFormat")
    const sampleRate = form.getFieldValue("sampleRate")
    const speed = form.getFieldValue("speed")
    const volume = form.getFieldValue("volume")
    const synthesisText = form.getFieldValue("synthesisText")
    const timbreCode = timbreId // 不管哪种模式都用timbreId
    if (!timbreCode) return message.warning("请选择或输入音色")
    if (!synthesisText) return message.warning("请输入要合成的文本")
    if (audioFormat === "pcm") {
      message.warning("pcm 录音格式暂时不支持试听")
      return
    }
    setSynthesizing(true)
    setAudioUrl("")
    try {
      const res = await synthesisVoice({
        botNo: skillFlowData?.botNo,
        content: synthesisText,
        timbreCode,
        audioFormat,
        sampleRate,
        speed,
        volume
      })
      if (res && res.status === 200 && res.data) {
        message.success("语音合成成功")
        setAudioUrl(res.data)
        setProgress(0)
        setCurrentTime(0)
        setIsPlaying(false)
      } else {
        message.error(res?.message || "语音合成失败")
      }
    } catch {
      message.error("语音合成失败")
    } finally {
      setSynthesizing(false)
    }
  }
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying((v) => !v)
    }
  }
  const handleAudioEnded = () => {
    setIsPlaying(false)
    setProgress(100)
  }
  const formatTime = (time) => {
    if (isNaN(time) || time === 0) return "00:00"
    const m = Math.floor(time / 60)
    const s = Math.floor(time % 60)
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }
  const handleProgressClick = (e) => {
    if (audioRef.current && audioDuration) {
      const bar = e.currentTarget
      const rect = bar.getBoundingClientRect()
      const offsetX = e.clientX - rect.left
      const newProgress = (offsetX / bar.offsetWidth) * 100
      const newTime = (newProgress / 100) * audioDuration
      audioRef.current.currentTime = newTime
      setProgress(newProgress)
      setCurrentTime(newTime)
    }
  }
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      setProgress((audio.currentTime / (audioDuration || 1)) * 100)
    }
    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration)
    }
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
    }
  }, [audioRef.current, audioDuration])

  const onFinish = (callback = () => {}, noMessage = false) => {
    return form.validateFields().then((values) => {
      const callbackFunc = isFunction(callback) ? callback : () => {}
      console.log("Received values of form: ", values)
      const session = formatSessionParams(globalData, values.sessions)

      // 处理输入参数，将变量值添加到 inputParams 数组中
      let inputParams = [values.inputParams]

      // 如果音色使用变量值，添加到 inputParams
      if (timbreMode === "变量值" && values.timbreId) {
        inputParams.push(values.timbreId)
      }

      // 如果音频速率使用变量值，添加到 inputParams
      if (speedMode === "变量值" && values.speed) {
        inputParams.push(values.speed)
      }

      // 如果音量使用变量值，添加到 inputParams
      if (volumeMode === "变量值" && values.volume) {
        inputParams.push(values.volume)
      }

      // 处理变量模式 - 使用后端定义的字段名
      const params = {
        ...values,
        inputParams,
        session,
        // 保存模式状态
        isVariableVoiceId: timbreMode === "变量值",
        isVariableSpeed: speedMode === "变量值",
        isVariableVolume: volumeMode === "变量值"
      }

      updateNodeComp(
        {
          ...targetData,
          ...params,
          globalDataOptions: globalData
        },
        callbackFunc,
        noMessage
      )
      forceUpdate({})
    })
  }

  useSaveShortcut(onFinish, isLoading)
  const { data: varOptions = [] } = useCustomVariableType()

  useEffect(() => {
    // 初始化时检查是否有变量值 - 使用后端定义的字段名
    if (targetData?.isVariableVoiceId) {
      setTimbreMode("变量值")
    }
    if (targetData?.isVariableSpeed) {
      setSpeedMode("变量值")
    } else if (targetData?.speed === undefined) {
      // 如果没有速度值，设置默认值
      form.setFieldsValue({ speed: defaultSpeed })
    }
    if (targetData?.isVariableVolume) {
      setVolumeMode("变量值")
    } else if (targetData?.volume === undefined) {
      // 如果没有音量值，设置默认值
      form.setFieldsValue({ volume: defaultVolume })
    }
  }, [targetData])

  return (
    <div className="common-node-wrapper">
      <div className="base-node-comp ">
        <Form
          form={form}
          onFinish={onFinish}
          labelCol={{ span: 24 }}
          disabled={isDisabled}
          layout="vertical"
        >
          <CommonContent
            title={"TTS文转音组件"}
            containerClass="noPadding"
            onFinish={onFinish}
            isLoading={isLoading}
            disabled={isLocked}
          >
            <Tabs defaultActiveKey="1" type="line">
              <TabPane tab="组件设置" key="1" forceRender>
                <PreJudgment form={form} />
                <CustomDivider showTopLine={true}>基础设置</CustomDivider>
                <Row className="mt-3">
                  <Col span={24}>
                    <Form.Item
                      name="label"
                      label="组件名"
                      tooltip="组件名建议由中英文、数字、下划线和短横线组成，且不超过64个字符"
                      rules={[{ required: true, message: "请输入组件名" }]}
                    >
                      <Input placeholder="请输入组件名" />
                    </Form.Item>

                    <Form.Item
                      name="sceneId"
                      label="场景ID"
                      // rules={[{ required: false, message: "请输入场景ID" }]}
                    >
                      <Input placeholder="请输入场景ID" />
                    </Form.Item>
                  </Col>
                  {/* <Col span={24}>
                    <Form.Item
                      name="voiceId"
                      label="音色ID"
                      rules={[{ required: true, message: "请输入音色ID" }]}
                      help={
                        <div className="text-[12px]  bg-gray-100 rounded-md p-2 mt-1">
                          <p className="text-red-500 mb-[5px]">说明：</p>

                          <div>
                            请直接在输入框中填写或前往 maas 平台查看
                            <p>
                              <a
                                href="https://maas-test.zhonganonline.com"
                                target="_blank"
                                rel="noreferrer"
                              >
                                测试环境： https://maas-test.zhonganonline.com
                              </a>
                              <br />
                              <a
                                href="https://maas-pre.zhonganonline.com"
                                target="_blank"
                                rel="noreferrer"
                              >
                                预发环境： https://maas-pre.zhonganonline.com
                              </a>
                              <br />
                              <a
                                href="https://maas.zhonganonline.com"
                                target="_blank"
                                rel="noreferrer"
                              >
                                生产环境： https://maas.zhonganonline.com
                              </a>
                            </p>
                          </div>
                        </div>
                      }
                    >
                      <Input placeholder="请输入音色ID" />
                    </Form.Item>
                  </Col> */}

                  {/* 声音设置 */}
                  <Col span={24}>
                    <CustomDivider showTopLine={true}>声音设置</CustomDivider>
                    <Form.Item label="音色创建方式" name="selectSound" required initialValue={true}>
                      <Radio.Group
                        onChange={(e) => {
                          form.setFieldsValue({
                            timbreId: undefined
                          })
                        }}
                      >
                        <Radio value={true}>选择音色创建</Radio>
                        <Radio value={false}>音色ID创建</Radio>
                      </Radio.Group>
                    </Form.Item>
                    <Form.Item shouldUpdate>
                      {() =>
                        form.getFieldValue("selectSound") ? (
                          // 选择音色创建
                          <>
                            <Form.Item
                              label={
                                <div>
                                  音色
                                  <Segmented
                                    size="small"
                                    className="ml-2"
                                    options={["固定值", "变量值"]}
                                    value={timbreMode}
                                    onChange={(value) => {
                                      setTimbreMode(value)
                                      form.setFieldsValue({ timbreId: undefined })
                                    }}
                                  />
                                </div>
                              }
                              name="timbreId"
                              required
                            >
                              {timbreMode === "固定值" ? (
                                <Select
                                  showSearch
                                  placeholder="请选择音色"
                                  loading={timbreLoading}
                                  filterOption={(input, option) =>
                                    (option?.label ?? "")
                                      .toLowerCase()
                                      .includes(input.toLowerCase())
                                  }
                                  options={timbreList
                                    ?.filter((item) => item.enabled === "Y")
                                    .map((item) => ({
                                      label: item.timbreName + "-" + item.timbreModel,
                                      value: item.timbreCode
                                    }))}
                                  allowClear
                                />
                              ) : (
                                <GlobalVariableSelect
                                  span={3}
                                  formName="timbreId"
                                  multiple={false}
                                  className={undefined}
                                  onChange={undefined}
                                  style={undefined}
                                  initialValue={undefined}
                                  layout="vertical"
                                  disabled={isDisabled}
                                />
                              )}
                            </Form.Item>
                            <Row gutter={16}>
                              <Col span={12}>
                                <Form.Item
                                  name="audioFormat"
                                  label="音频格式"
                                  rules={[{ required: true, message: "请选择音频格式" }]}
                                >
                                  <Select
                                    placeholder="请选择音频格式"
                                    loading={isLoadingFormat}
                                    options={audioFormatOptions?.map((item) => ({
                                      label: item.name,
                                      value: item.code
                                    }))}
                                    showSearch
                                    defaultValue="wav"
                                    filterOption={(input, option) =>
                                      // @ts-ignore
                                      (option?.label ?? "")
                                        ?.toLowerCase()
                                        .includes(input.toLowerCase())
                                    }
                                  />
                                </Form.Item>
                              </Col>
                              <Col span={12}>
                                <Form.Item
                                  label="音频采样率"
                                  name="sampleRate"
                                  required
                                  initialValue={16000}
                                >
                                  <Select
                                    options={[
                                      { label: "8000Hz", value: 8000 },
                                      { label: "16000Hz", value: 16000 },
                                      { label: "32000Hz", value: 32000 }
                                    ]}
                                  />
                                </Form.Item>
                              </Col>
                            </Row>
                            <Row gutter={16}>
                              <Col span={12}>
                                <Form.Item
                                  label={
                                    <div>
                                      音频速率
                                      <Segmented
                                        size="small"
                                        className="ml-2"
                                        options={["固定值", "变量值"]}
                                        value={speedMode}
                                        onChange={(value) => {
                                          setSpeedMode(value)
                                          if (value === "固定值") {
                                            // 切换回固定值时恢复默认值
                                            form.setFieldsValue({ speed: defaultSpeed })
                                          } else {
                                            form.setFieldsValue({ speed: undefined })
                                          }
                                        }}
                                      />
                                    </div>
                                  }
                                  name="speed"
                                  required
                                  initialValue={1.05}
                                >
                                  {speedMode === "固定值" ? (
                                    <div className="flex items-center gap-3">
                                      <div className="flex-1">
                                        <Slider
                                          min={0.6}
                                          max={2.5}
                                          step={0.01}
                                          value={form.getFieldValue("speed")}
                                          onChange={(val) => form.setFieldsValue({ speed: val })}
                                          tooltip={{ formatter: (value) => `${value}` }}
                                        />
                                      </div>
                                      <InputNumber
                                        min={0.6}
                                        max={2.5}
                                        step={0.01}
                                        precision={2}
                                        className="w-20"
                                        value={form.getFieldValue("speed")}
                                        onChange={(val) => form.setFieldsValue({ speed: val })}
                                      />
                                    </div>
                                  ) : (
                                    <GlobalVariableSelect
                                      span={3}
                                      formName="speed"
                                      multiple={false}
                                      className={undefined}
                                      onChange={undefined}
                                      style={undefined}
                                      initialValue={undefined}
                                      layout="vertical"
                                      disabled={isDisabled}
                                    />
                                    // <Input placeholder="请输入变量名" />
                                  )}
                                </Form.Item>
                              </Col>
                              <Col span={12}>
                                <Form.Item
                                  label={
                                    <div>
                                      音量
                                      <Segmented
                                        size="small"
                                        className="ml-2"
                                        options={["固定值", "变量值"]}
                                        value={volumeMode}
                                        onChange={(value) => {
                                          setVolumeMode(value)
                                          if (value === "固定值") {
                                            // 切换回固定值时恢复默认值
                                            form.setFieldsValue({ volume: defaultVolume })
                                          } else {
                                            form.setFieldsValue({ volume: undefined })
                                          }
                                        }}
                                      />
                                    </div>
                                  }
                                  name="volume"
                                  required
                                  initialValue={50}
                                >
                                  {volumeMode === "固定值" ? (
                                    <div className="flex items-center gap-3">
                                      <div className="flex-1">
                                        <Slider
                                          min={0}
                                          max={100}
                                          value={form.getFieldValue("volume")}
                                          onChange={(val) => form.setFieldsValue({ volume: val })}
                                          tooltip={{ formatter: (value) => `${value}%` }}
                                        />
                                      </div>
                                      <InputNumber
                                        min={0}
                                        max={100}
                                        precision={0}
                                        className="w-20"
                                        value={form.getFieldValue("volume")}
                                        onChange={(val) => form.setFieldsValue({ volume: val })}
                                        formatter={(value) => `${value}%`}
                                        parser={(value) => value?.replace("%", "")}
                                      />
                                    </div>
                                  ) : (
                                    // <Input placeholder="请输入变量名" />
                                    <GlobalVariableSelect
                                      span={3}
                                      formName="volume"
                                      multiple={false}
                                      className={undefined}
                                      onChange={undefined}
                                      style={undefined}
                                      initialValue={undefined}
                                      layout="vertical"
                                      disabled={isDisabled}
                                    />
                                  )}
                                </Form.Item>
                              </Col>
                            </Row>
                            <Row gutter={16} className="mt-2">
                              <Col span={24}>
                                <Form.Item label="试听文本" name="synthesisText">
                                  <Input.TextArea placeholder="请输入要合成试听的文本" rows={3} />
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
                            {audioUrl && (
                              <div className="mt-3 p-3 pl-4 rounded-md bg-gray-100">
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
                          </>
                        ) : (
                          // 音色ID创建
                          <>
                            <Form.Item label="音色ID" name="timbreId" required>
                              <Input placeholder="请输入音色ID" />
                            </Form.Item>
                            <Form.Item
                              name="audioFormat"
                              label="音频格式"
                              // rules={[{ required: true, message: "请选择音频格式" }]}
                            >
                              <Select
                                placeholder="请选择音频格式"
                                loading={isLoadingFormat}
                                options={audioFormatOptions?.map((item) => ({
                                  label: item.name,
                                  value: item.code
                                }))}
                                showSearch
                                defaultValue="wav"
                                filterOption={(input, option) =>
                                  // @ts-ignore
                                  (option?.label ?? "")?.toLowerCase().includes(input.toLowerCase())
                                }
                              />
                            </Form.Item>
                          </>
                        )
                      }
                    </Form.Item>
                  </Col>

                  <Col span={24}>
                    <CustomDivider showTopLine={true}>输入参数</CustomDivider>
                  </Col>
                  <Col span={24}>
                    <GlobalVariableSelect
                      label={"输入"}
                      span={3}
                      formName="inputParams"
                      multiple={false}
                      className={undefined}
                      onChange={undefined}
                      style={undefined}
                      initialValue={undefined}
                      layout="vertical"
                      disabled={isDisabled}
                    />
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={24}>
                    <CustomDivider showTopLine={true}>输出参数</CustomDivider>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="输出结果类型">
                      <Input value="字符串" disabled={true} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="outputName"
                      label="输出变量名"
                      rules={[{ required: true, message: "请输入" }]}
                    >
                      <Input placeholder="输出变量名" />
                    </Form.Item>
                  </Col>
                </Row>
              </TabPane>
              <TabPane tab="后置处理" key="2" forceRender>
                <DynamicFormList form={form} varOptions={varOptions} />
              </TabPane>
              <TabPane tab="兜底处理" key="3" forceRender>
                <FallbackHandler
                  form={form}
                  varOptions={varOptions}
                  botNo={skillFlowData?.botNo}
                  skillNo={skillFlowData?.skillNo}
                />
              </TabPane>
            </Tabs>
          </CommonContent>
        </Form>
        <div className="debug-panel">
          <DynamicFormComponent
            nodeId={targetData.id}
            preview={false}
            isProcess={false}
            formData={debugFormData}
            onFinish={onFinish}
          />
        </div>
      </div>
    </div>
  )
}

export default TTSComponent
