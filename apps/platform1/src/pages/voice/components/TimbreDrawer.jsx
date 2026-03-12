import { useState, useEffect, useRef } from "react"
import {
  Form,
  Input,
  Select,
  Slider,
  InputNumber,
  Row,
  Col,
  Drawer,
  Button,
  Space,
  Tabs,
  Segmented,
  Switch,
  Radio,
  Upload,
  Spin,
  Divider,
  message
} from "antd"
import {
  PlusOutlined,
  CameraOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined
} from "@ant-design/icons"
import { uploadTimbreAvatar, fetchTimbreDetail } from "@/api/timbre/api"
import { useCreateOrUpdateTimbre, useTimbreModelList } from "@/api/timbre/index"
import { synthesisVoice } from "@/api/voiceAgent/api"
import defaultTimbreGirl from "@/assets/img/defaultTimbreGirl.png"
import defaultTimbreBoy from "@/assets/img/defaultTimbreBoy.png"
import { functionDownVoice } from "@/utils"
import { useFetchBotInfo } from "@/api/bot"

const { Option } = Select
const DEFAULT_AVATAR_GIRL = defaultTimbreGirl
const DEFAULT_AVATAR_BOY = defaultTimbreBoy

const TimbreDrawer = ({
  visible,
  onClose,
  timbreId,
  botNo,
  mode = "edit", // "create" | "edit" | "marketView"
  onSuccess
}) => {
  const [form] = Form.useForm()
  const [synthForm] = Form.useForm()
  const [drawerTab, setDrawerTab] = useState("base")
  const [editDetailLoading, setEditDetailLoading] = useState(false)
  const [currentTimbre, setCurrentTimbre] = useState(null)
  const [avatarUrl, setAvatarUrl] = useState("")
  const [beSharedToMarket, setBeSharedToMarket] = useState(false)
  const [subscriptionMode, setSubscriptionMode] = useState(1)
  const [audioUrl, setAudioUrl] = useState("")
  const [synthesizing, setSynthesizing] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioDuration, setAudioDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef(null)
  const [currentAuditionAudio, setCurrentAuditionAudio] = useState(null)
  const [isPlayingAudition, setIsPlayingAudition] = useState(false)
  const { mutateAsync: createOrUpdateTimbreFunc } = useCreateOrUpdateTimbre()
  const { data: modelListData } = useTimbreModelList({ botNo })
  const { data: botInfo } = useFetchBotInfo(botNo)

  // 详情回显 - 只在编辑和查看模式下加载详情
  useEffect(() => {
    if (visible && timbreId && botNo && (mode === "edit" || mode === "marketView")) {
      setEditDetailLoading(true)
      fetchTimbreDetail({ botNo, timbreId })
        .then((res) => {
          if (res.status === 200 && res.data) {
            setCurrentTimbre(res.data)
            form.setFieldsValue({
              timbreCode: res.data.timbreCode,
              timbreName: res.data.timbreName,
              timbreModelId: res.data.timbreModelId,
              enabled: res.data.enabled === "Y",
              gender: res.data.gender || "female",
              description: res.data.description || "",
              remark: res.data.remark || "",
              timbreId: res.data.timbreId,
              subscribableBotNos: res.data.subscribableBotNos || []
            })
            setAvatarUrl(res.data.avatarUrl || "")
            setBeSharedToMarket(res.data.subscriptionMode !== -1)
            setSubscriptionMode(res.data.subscriptionMode === 0 ? 0 : 1)
          }
        })
        .finally(() => setEditDetailLoading(false))
    } else if (visible && mode === "create") {
      // 创建模式时设置默认值
      form.setFieldsValue({
        enabled: true,
        gender: "female",
        beSharedToMarket: false
      })
      setAvatarUrl("")
      setBeSharedToMarket(false)
      setSubscriptionMode(1)
    } else if (!visible) {
      setDrawerTab("base")
      setCurrentTimbre(null)
      setAvatarUrl("")
      form.resetFields()
      setAudioUrl("")
    }
  }, [visible, timbreId, botNo, mode])

  // 试听相关逻辑
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
    }
    return () => {
      if (audioElement) {
        audioElement.removeEventListener("timeupdate", handleTimeUpdate)
        audioElement.removeEventListener("loadedmetadata", handleLoadedMetadata)
      }
    }
  }, [audioRef.current, audioDuration])

  // 头像上传
  const beforeUpload = (file) => {
    const isValidType = ["image/png", "image/jpg", "image/jpeg", "image/gif"].includes(file.type)
    if (!isValidType) {
      message.error("只支持上传 PNG/JPG/JPEG/GIF 格式的图片!")
    }
    const isLt2M = file.size / 1024 / 1024 < 2
    if (!isLt2M) {
      message.error("图片大小不能超过 2MB!")
    }
    return isValidType && isLt2M
  }
  const handleAvatarChange = async (info) => {
    if (info.file.status === "uploading") return
    if (info.file.status === "done") {
      try {
        const formData = new FormData()
        formData.append("file", info.file.originFileObj)
        const data = await uploadTimbreAvatar(formData)
        const url = data?.data
        if (url) {
          setAvatarUrl(url)
          message.success("上传成功")
        }
      } catch (error) {
        message.error("上传失败")
      }
    }
  }
  const uploadButton = (
    <div
      style={{
        width: 56,
        height: 56,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        background: "#fafafa"
      }}
    >
      <PlusOutlined style={{ fontSize: 20, color: "#999" }} />
      <div style={{ marginTop: 4, fontSize: 12, color: "#999" }}>上传</div>
    </div>
  )
  const gender = Form.useWatch("gender", form)
  const enabled = Form.useWatch("enabled", form)
  useEffect(() => {
    if (!avatarUrl || avatarUrl === DEFAULT_AVATAR_BOY || avatarUrl === DEFAULT_AVATAR_GIRL) {
      setAvatarUrl(gender === "male" ? DEFAULT_AVATAR_BOY : DEFAULT_AVATAR_GIRL)
    }
  }, [gender])

  // 试听功能
  const handleSynthesis = async () => {
    try {
      const values = await synthForm.validateFields()
      const { audioFormat, content, sampleRate, speed, volume } = values
      const timbreCode = form.getFieldValue("timbreCode")
      if (!timbreCode) {
        message.warning("请先填写音色Code")
        return
      }
      if (audioFormat === "pcm") {
        message.warning("pcm 录音格式暂时不支持试听")
        return
      }
      setSynthesizing(true)
      setAudioUrl("")
      const params = {
        botNo,
        timbreCode,
        audioFormat,
        content,
        sampleRate,
        speed,
        volume
      }
      const res = await synthesisVoice(params)
      if (res && res.status === 200 && res.data) {
        message.success("语音合成成功")
        setAudioUrl(res.data)
        setProgress(0)
        setCurrentTime(0)
        setIsPlaying(false)
      } else {
        message.error(res?.message || "语音合成失败")
      }
    } catch (error) {
      if (error?.errorFields) return
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
      setIsPlaying(!isPlaying)
    }
  }
  const handleAudioEnded = () => {
    setIsPlaying(false)
    setProgress(100)
  }

  // 处理音色试听
  const handleTimbreAudition = () => {
    if (!currentTimbre?.auditionUrl) {
      message.warning("该音色暂无试听音频")
      return
    }

    // 如果当前正在播放，则暂停
    if (isPlayingAudition && currentAuditionAudio) {
      currentAuditionAudio.pause()
      currentAuditionAudio.currentTime = 0
      setCurrentAuditionAudio(null)
      setIsPlayingAudition(false)
      return
    }

    // 停止之前可能存在的音频
    if (currentAuditionAudio) {
      currentAuditionAudio.pause()
      currentAuditionAudio.currentTime = 0
    }

    // 创建新的音频实例
    const audio = new Audio(currentTimbre.auditionUrl)
    setCurrentAuditionAudio(audio)
    setIsPlayingAudition(true)

    // 定义播放结束的处理函数
    const handleAuditionEnded = () => {
      setCurrentAuditionAudio(null)
      setIsPlayingAudition(false)
      audio.removeEventListener("ended", handleAuditionEnded)
    }

    audio.addEventListener("ended", handleAuditionEnded)
    audio.play().catch((error) => {
      console.error("播放试听音频失败:", error)
      message.error("试听播放失败")
      setCurrentAuditionAudio(null)
      setIsPlayingAudition(false)
      audio.removeEventListener("ended", handleAuditionEnded)
    })
  }
  const formatTime = (time) => {
    if (isNaN(time) || time === 0) return "00:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }
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

  // 提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      let avatar = avatarUrl
      if (!avatar || avatar === DEFAULT_AVATAR_BOY || avatar === DEFAULT_AVATAR_GIRL) {
        // 只在创建/编辑时自动上传默认头像
        if (mode === "create" || mode === "edit") {
          const defaultImgUrl = values.gender === "male" ? DEFAULT_AVATAR_BOY : DEFAULT_AVATAR_GIRL
          const response = await fetch(defaultImgUrl)
          const blob = await response.blob()
          const file = new File([blob], "avatar.png", { type: blob.type })
          const formData = new FormData()
          formData.append("file", file)
          const uploadRes = await uploadTimbreAvatar(formData)
          if (uploadRes && uploadRes.data) {
            avatar = uploadRes.data
            setAvatarUrl(avatar)
          }
        } else {
          avatar = values.gender === "male" ? DEFAULT_AVATAR_BOY : DEFAULT_AVATAR_GIRL
        }
      }
      const params = {
        botNo,
        timbreName: values.timbreName,
        timbreModelId: values.timbreModelId,
        subscriptionMode: beSharedToMarket ? subscriptionMode : -1,
        subscribableBotNos:
          beSharedToMarket && subscriptionMode === 0 ? values.subscribableBotNos : [],
        enabled: values.enabled ? "Y" : "N",
        gender: values.gender,
        avatarUrl: avatar,
        botName: botInfo?.botName,
        description: values.description || "",
        remark: values.remark || "",
        timbreCode: values.timbreCode
      }
      if ((mode === "edit" || mode === "create") && currentTimbre?.timbreId) {
        params.timbreId = currentTimbre.timbreId
      }
      const res = await createOrUpdateTimbreFunc(params)
      if (res && res.status === 200) {
        message.success(mode === "edit" ? "音色编辑成功" : "音色创建成功")
        onClose?.()
        onSuccess?.()
      } else {
        message.error(res?.message || (mode === "edit" ? "编辑音色失败" : "创建音色失败"))
      }
    } catch (error) {
      if (error.errorFields) return
      message.error(mode === "edit" ? "编辑音色失败" : "创建音色失败")
    }
  }

  // 渲染基础信息表单
  const renderFormItems = (forceDisabled = false) => (
    <>
      <Form.Item layout="horizontal" name="enabled" label="音色状态" valuePropName="checked">
        <Switch
          size="small"
          checkedChildren="启用"
          unCheckedChildren="停用"
          disabled={forceDisabled || mode === "marketView"}
        />
      </Form.Item>
      {!forceDisabled && (
        <Form.Item
          name="timbreCode"
          label="音色 Code"
          rules={[
            { required: true, message: "请输入音色 Code" },
            { pattern: /^\d+$/, message: "只能输入数字" }
          ]}
        >
          <Input
            placeholder="请输入音色 Code（仅数字）"
            maxLength={20}
            disabled={forceDisabled || mode === "marketView" || mode === "edit"}
          />
        </Form.Item>
      )}

      <Form.Item
        name="timbreName"
        label="音色名称"
        rules={[{ required: true, message: "请输入音色名称" }]}
      >
        <Input
          placeholder="请输入音色名称，建议长度≤20字符"
          maxLength={20}
          disabled={forceDisabled || mode === "marketView"}
        />
      </Form.Item>
      <Form.Item
        name="timbreModelId"
        label="音色模型"
        rules={[{ required: true, message: "请选择音色模型" }]}
      >
        <Select
          placeholder="请选择音色模型"
          loading={!modelListData}
          disabled={forceDisabled || mode === "marketView" || mode === "edit"}
        >
          {Array.isArray(modelListData?.data) &&
            modelListData.data.map((model) => (
              <Option key={model.id} value={model.id}>
                {model.name} ({model.provider})
              </Option>
            ))}
        </Select>
        {modelListData && !Array.isArray(modelListData?.data) && (
          <div className="mt-2" style={{ color: "red", fontSize: 12 }}>
            音色模型加载失败
          </div>
        )}
      </Form.Item>
      <Form.Item
        name="gender"
        label="声音标签"
        rules={[{ required: true, message: "请选择声音标签" }]}
      >
        <Radio.Group disabled={forceDisabled || mode === "marketView"}>
          <Radio value="female">女生</Radio>
          <Radio value="male">男生</Radio>
        </Radio.Group>
      </Form.Item>
      <div className="smallUploadCard">
        <Form.Item label="音色头像" required>
          <Upload
            name="file"
            listType="picture-card"
            showUploadList={false}
            beforeUpload={beforeUpload}
            onChange={handleAvatarChange}
            customRequest={({ file, onSuccess }) => {
              setTimeout(() => {
                onSuccess("ok")
              }, 0)
            }}
            style={{
              width: 56,
              height: 56,
              display: "flex",
              flexDirection: "column",
              alignItems: "center"
            }}
            disabled={forceDisabled || mode === "marketView"}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="音色头像"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              uploadButton
            )}
            {!forceDisabled && mode !== "marketView" && (
              <div
                className="absolute bottom-[20px] left-[40px] bg-[#7F56D9] text-white rounded-full w-[24px] h-[24px] flex items-center justify-center"
                style={{ border: "1px solid #fff" }}
              >
                <CameraOutlined />
              </div>
            )}
          </Upload>
          {!forceDisabled && mode !== "marketView" && (
            <div className="upload-tip text-gray-500 text-[12px] mt-2">
              支持格式为JPG、PNG、GIF，2M以内
            </div>
          )}
        </Form.Item>
      </div>
      <Form.Item name="description" label="音色说明">
        <Input.TextArea
          placeholder="请输入音色说明，建议长度≤100字符"
          rows={3}
          maxLength={100}
          showCount
          disabled={forceDisabled || mode === "marketView"}
        />
      </Form.Item>
      {!forceDisabled && (
        <Form.Item name="remark" label="备注">
          <Input.TextArea
            placeholder="请输入备注信息"
            rows={3}
            disabled={forceDisabled || mode === "marketView"}
          />
        </Form.Item>
      )}
    </>
  )

  // 渲染共享设置表单
  const renderShareForm = () => (
    <>
      <Form.Item label="在灵犀市集共享该音色" layout="horizontal">
        <Switch
          size="small"
          checked={beSharedToMarket}
          onChange={setBeSharedToMarket}
          disabled={mode === "marketView"}
        />
      </Form.Item>
      {beSharedToMarket && (
        <>
          <Form.Item label="共享范围">
            <Segmented
              block
              value={subscriptionMode}
              onChange={setSubscriptionMode}
              options={[
                { label: "所有空间共享", value: 1 },
                { label: "指定空间共享", value: 0 }
              ]}
              className="w-[340px]"
              disabled={mode === "marketView"}
            />
          </Form.Item>
          {subscriptionMode === 0 && (
            <Form.Item
              name="subscribableBotNos"
              label="指定可见空间"
              rules={[
                {
                  required: beSharedToMarket && subscriptionMode === 0,
                  message: "请填写可见空间"
                }
              ]}
            >
              <Select
                mode="tags"
                placeholder="请输入可见空间编号，回车分隔，可多个"
                allowClear
                disabled={mode === "marketView"}
              />
            </Form.Item>
          )}
        </>
      )}
    </>
  )

  // 渲染Tabs
  const renderTabs = () => {
    if (mode === "marketView") {
      return (
        <Tabs activeKey={drawerTab} onChange={setDrawerTab} className="mb-4">
          <Tabs.TabPane tab="基础信息" key="base">
            {renderFormItems(true)}
          </Tabs.TabPane>
        </Tabs>
      )
    }
    return (
      <Tabs activeKey={drawerTab} onChange={setDrawerTab} className="mb-4">
        <Tabs.TabPane tab="基础信息" key="base">
          {renderFormItems(false)}
        </Tabs.TabPane>
        <Tabs.TabPane tab="共享设置" key="share">
          {renderShareForm()}
        </Tabs.TabPane>
      </Tabs>
    )
  }

  return (
    <Drawer
      title={
        mode === "create"
          ? "创建音色"
          : mode === "edit"
            ? "编辑音色"
            : mode === "marketView"
              ? "音色详情"
              : "音色详情"
      }
      open={visible}
      onClose={onClose}
      width={600}
      footer={
        (mode === "edit" || mode === "create") && (
          <div style={{ textAlign: "right" }}>
            <Space>
              <Button onClick={onClose}>取消</Button>
              <Button type="primary" onClick={handleSubmit} disabled={editDetailLoading}>
                确认
              </Button>
            </Space>
          </div>
        )
      }
      extra={null}
    >
      <Spin spinning={editDetailLoading} tip="加载中...">
        <div>
          <Form form={form} layout="vertical">
            {renderTabs()}
          </Form>
          {/* 试听模块，只在编辑和查看模式下显示，且音色状态为启用时 */}
          {(mode === "edit" || mode === "marketView") && enabled && (
            <div className="mb-[100px] mt-4">
              <Divider />
              <div className="flex items-center justify-start mb-4">
                <div className="!text-[14px] text-[#475467] font-[400]">试听</div>
                {mode === "marketView" && currentTimbre?.auditionUrl && (
                  <a
                    onClick={handleTimbreAudition}
                    className="text-[#7F56D9] hover:text-[#7F56D9] ml-2"
                  >
                    {isPlayingAudition ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                  </a>
                )}
              </div>
              <Form
                form={synthForm}
                layout="vertical"
                initialValues={{
                  audioFormat: "wav",
                  sampleRate: 8000,
                  speed: 1.05,
                  volume: 50
                }}
              >
                <Row gutter={24} className="mb-4">
                  <Col span={12}>
                    <Form.Item
                      name="audioFormat"
                      label="录音格式"
                      tooltip="仅mp3，wav录音格式支持试听"
                      rules={[{ required: true, message: "请选择录音格式" }]}
                    >
                      <Select placeholder="请选择" allowClear>
                        <Select.Option value="mp3">mp3</Select.Option>
                        <Select.Option value="wav">wav</Select.Option>
                        <Option value="pcm">pcm</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="sampleRate"
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
                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item label="音频速率" required>
                      <div className="flex items-center">
                        <Form.Item
                          name="speed"
                          noStyle
                          rules={[{ required: true, message: "请设置音频速率" }]}
                        >
                          <Slider
                            min={0.6}
                            max={2.5}
                            step={0.01}
                            className="flex-1 mr-4"
                            onChange={(v) => synthForm.setFieldsValue({ speed: v })}
                          />
                        </Form.Item>
                        <Form.Item
                          name="speed"
                          noStyle
                          rules={[{ required: true, message: "请设置音频速率" }]}
                        >
                          <InputNumber
                            min={0.6}
                            max={2.5}
                            step={0.01}
                            precision={2}
                            style={{ width: "80px" }}
                            onChange={(v) => synthForm.setFieldsValue({ speed: v })}
                            allowClear
                          />
                        </Form.Item>
                      </div>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="音量" required>
                      <div className="flex items-center">
                        <Form.Item
                          name="volume"
                          noStyle
                          rules={[{ required: true, message: "请设置音量" }]}
                        >
                          <Slider
                            min={0}
                            max={100}
                            step={1}
                            className="flex-1 mr-4"
                            onChange={(v) => synthForm.setFieldsValue({ volume: v })}
                          />
                        </Form.Item>
                        <Form.Item
                          name="volume"
                          noStyle
                          rules={[{ required: true, message: "请设置音量" }]}
                        >
                          <InputNumber
                            min={0}
                            max={100}
                            step={1}
                            precision={0}
                            style={{ width: "70px" }}
                            onChange={(v) => synthForm.setFieldsValue({ volume: v })}
                            allowClear
                          />
                        </Form.Item>
                      </div>
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      name="content"
                      label="试听文本"
                      rules={[{ required: true, message: "请输入要合成试听的文本" }]}
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
                  <div className="mt-3 bg-gray-100 p-3 pr-4rounded-md">
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
              </Form>
            </div>
          )}
        </div>
      </Spin>
    </Drawer>
  )
}

export default TimbreDrawer
