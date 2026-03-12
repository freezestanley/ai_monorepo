import { useState, useEffect, useCallback, useRef } from "react"
import { Form, Select, InputNumber, Slider, Button, Row, Col, Input } from "antd"
import { PlayCircleOutlined, PauseCircleOutlined } from "@ant-design/icons"
import { fetchPersonalTimbreListV2 } from "@/api/timbre/api"
import { synthesisVoice } from "@/api/voiceAgent/api"
import { message } from "antd"
import { functionDownVoice } from "@/utils"

const { Option } = Select

const VoiceSettingsTab = ({ form, botNo, agentDetail, onFormChange, loading }) => {
  // 音色相关状态
  const [timbreOptions, setTimbreOptions] = useState([])
  const [timbreLoading, setTimbreLoading] = useState(false)
  const [currentAuditionAudio, setCurrentAuditionAudio] = useState(null)
  const [playingAuditionUrl, setPlayingAuditionUrl] = useState(null)
  const [playingAuditionCode, setPlayingAuditionCode] = useState(null)

  // 试听功能状态
  const [synthesizing, setSynthesizing] = useState(false)
  const [audioUrl, setAudioUrl] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioDuration, setAudioDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef(null)
  const selectRef = useRef(null)
  const auditionEndedHandlerRef = useRef(null)

  // 获取音色列表
  const fetchTimbreList = useCallback(async () => {
    try {
      setTimbreLoading(true)
      const res = await fetchPersonalTimbreListV2({
        botNo: botNo
      })

      if (Array.isArray(res)) {
        const options = res?.map((item) => ({
          value: item.timbreCode && Number(item.timbreCode),
          label: item.timbreName + " - " + item.timbreModel,
          auditionUrl: item.auditionUrl
        }))
        setTimbreOptions(options)
      }
    } catch (error) {
      console.error("获取音色列表异常:", error)
    } finally {
      setTimbreLoading(false)
    }
  }, [botNo])

  useEffect(() => {
    fetchTimbreList()
  }, [fetchTimbreList])

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

      if (audioFormat === "pcm") {
        message.warning("pcm 录音格式暂时不支持试听")
        return
      }

      setSynthesizing(true)
      setAudioUrl("") // 重置之前的音频

      const params = {
        botNo: botNo,
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

  // 处理音色试听
  const handleTimbreAudition = (auditionUrl, timbreCode) => {
    if (!auditionUrl) {
      message.warning("该音色暂无试听音频")
      return
    }

    // 如果当前正在播放这个音频，则暂停
    const isSameAudition = playingAuditionCode === timbreCode && playingAuditionUrl === auditionUrl
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
    required: [{ required: true, message: "此项为必填项" }]
  }

  return (
    <div className="p-0">
      <div className="my-5">
        {/* 第一行：音色、录音格式、音频采样率 */}
        <Row gutter={24} className="mb-4">
          <Col span={12}>
            <Form.Item name="timbreCode" label="音色" rules={rules.required}>
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
                          onFormChange?.()
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
          </Col>
          <Col span={12}>
            <Form.Item
              name="audioFormat"
              label="录音格式"
              tooltip="仅mp3，wav录音格式支持试听"
              rules={rules.required}
            >
              <Select placeholder="请选择" allowClear>
                <Option value="mp3">mp3</Option>
                <Option value="wav">wav</Option>
                <Option value="pcm">pcm</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* 第二行：音频速率、音量 */}
        <Row gutter={24}>
          <Col span={8}>
            <Form.Item name="sampleRate" label="音频采样率" rules={rules.required}>
              <Select placeholder="请选择" allowClear>
                <Option value={8000}>8000 Hz</Option>
                <Option value={16000}>16000 Hz</Option>
                <Option value={32000}>32000 Hz</Option>
              </Select>
            </Form.Item>
          </Col>
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
            <div className="mt-3  bg-gray-100 p-3 pr-4 rounded-md">
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
    </div>
  )
}

export default VoiceSettingsTab
