import React, { useState, useRef, useEffect } from "react"
import { Form, Select, Button, Upload, message, Progress, Tooltip, Popconfirm, Popover } from "antd"
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined
} from "@ant-design/icons"
import { uploadVoiceFile, checkSkillDelete } from "@/api/voiceAgent/api"
import "./index.scss"
import mp4Icon from "@/assets/img/mp4.png"
import { functionDownVoice } from "@/utils"

const RecordingItem = ({
  form,
  fieldName,
  restField,
  timbreOptions = [],
  timbreLoading = false,
  playingAudio,
  setPlayingAudio,
  audioProgress,
  setAudioProgress,
  audioDuration,
  setAudioDuration,
  audioRefs,
  onFileUpload,
  onDownload,
  uploadMode = "local",
  botNo,
  scriptId,
  onUploadSuccess,
  onUploadError,
  defaultTimbreCode,
  defaultTimbreName,
  defaultTimbreModel,
  disableTimbreSelect = false,
  onRemove,
  showRemove = false,
  isOnlyRead
}) => {
  const [uploading, setUploading] = useState(false)
  const [timbreValue, setTimbreValue] = useState(null)
  const [deletePopoverOpen, setDeletePopoverOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // 试听功能状态
  const [currentAuditionAudio, setCurrentAuditionAudio] = useState(null)
  const [playingAuditionUrl, setPlayingAuditionUrl] = useState(null)
  const selectRef = useRef(null)

  useEffect(() => {
    if (uploadMode === "api") {
      if (disableTimbreSelect && defaultTimbreCode) {
        setTimbreValue(defaultTimbreCode)
        form.setFieldValue(["scripts", fieldName, "code"], defaultTimbreCode)
      } else {
        const scriptVoices = form.getFieldValue(["scripts", fieldName, "scriptVoices"])
        if (scriptVoices && scriptVoices.length > 0 && scriptVoices[0].timbreCode) {
          const timbreCode = Number(scriptVoices[0].timbreCode)
          setTimbreValue(timbreCode)
          form.setFieldValue(["scripts", fieldName, "code"], timbreCode)
        }
      }
    }
  }, [form, fieldName, uploadMode, disableTimbreSelect, defaultTimbreCode])

  const isUploadDisabled =
    isOnlyRead ||
    (uploadMode === "api"
      ? !scriptId || (!timbreValue && !defaultTimbreCode) || uploading
      : uploading)

  const hasUploadedFile = (() => {
    if (uploadMode === "api") {
      let scriptVoicesPath = Array.isArray(fieldName)
        ? fieldName
        : ["scripts", fieldName, "scriptVoices"]
      const scriptVoices = form.getFieldValue(scriptVoicesPath)

      // scriptVoices 可能是数组或对象
      if (Array.isArray(scriptVoices)) {
        return (
          scriptVoices.length > 0 && scriptVoices[0]?.ossUrl && scriptVoices[0].ossUrl.trim() !== ""
        )
      }
      return scriptVoices?.ossUrl && scriptVoices?.ossUrl.trim() !== ""
    } else {
      const pairs = form.getFieldValue("pairs") || []
      const currentPair = pairs[fieldName]
      return (
        currentPair?.file &&
        (typeof currentPair.file === "string" || currentPair.file instanceof File)
      )
    }
  })()

  const handleRecordingUpload = async (info) => {
    const { file } = info
    if (!file) return

    if (uploadMode === "local") {
      const pairs = form.getFieldValue("pairs") || []
      pairs[fieldName] = {
        ...pairs[fieldName],
        file: file.originFileObj || file,
        fileName: file.name
      }
      form.setFieldsValue({ pairs })
      message.success("录音文件选择成功")
      onFileUpload?.(info, fieldName)
    } else if (uploadMode === "api") {
      if (!botNo || !scriptId) {
        message.error("缺少必要参数，无法上传")
        onUploadError?.("缺少参数")
        return
      }

      try {
        setUploading(true)
        const formData = new FormData()
        formData.append("file", file.originFileObj || file)
        formData.append("botNo", botNo)
        formData.append("scriptId", scriptId)
        formData.append("timbreCode", timbreValue || defaultTimbreCode)

        const response = await uploadVoiceFile(formData)

        if (response && response.status === 200 && response.data) {
          // 处理接口返回的数据：可能是字符串或对象
          let ossUrl = ""
          if (typeof response.data === "string") {
            ossUrl = response.data.trim()
          } else if (typeof response.data === "object" && response.data.ossUrl) {
            ossUrl = response.data.ossUrl
          }

          const newVoice = {
            timbreCode: (timbreValue || defaultTimbreCode)?.toString() || "",
            voiceName: file.name.replace(/\.[^/.]+$/, ""),
            ossUrl: ossUrl
          }

          if (Array.isArray(fieldName)) {
            form.setFieldValue(fieldName, newVoice)
          } else {
            const scripts = form.getFieldValue("scripts") || []
            if (scripts[fieldName]) {
              scripts[fieldName].scriptVoices = [newVoice]
              form.setFieldsValue({ scripts })
            }
          }
          onUploadSuccess?.(response.data, fieldName)

          const audioKey = `audio_${fieldName}`
          if (audioRefs.current[audioKey]) {
            audioRefs.current[audioKey].pause()
            delete audioRefs.current[audioKey]
          }
          if (playingAudio === audioKey) {
            setPlayingAudio(null)
          }
        } else {
          throw new Error(response?.message || "上传失败")
        }
      } catch (error) {
        message.error(error.message || "录音文件上传失败")
        onUploadError?.(error.message || "上传失败")
      } finally {
        setUploading(false)
      }
    }
  }

  const handlePlayPause = (file) => {
    const audioKey = `audio_${fieldName}`
    const audio = audioRefs.current[audioKey]

    if (playingAudio === audioKey) {
      if (audio) audio.pause()
      setPlayingAudio(null)
    } else {
      Object.values(audioRefs.current).forEach((a) => a && a.pause())
      if (audio) {
        audio.play()
        setPlayingAudio(audioKey)
      } else if (file) {
        const fileUrl = typeof file === "string" ? file : URL.createObjectURL(file)
        const newAudio = new Audio(fileUrl)
        audioRefs.current[audioKey] = newAudio

        newAudio.onloadedmetadata = () =>
          setAudioDuration((p) => ({ ...p, [audioKey]: newAudio.duration }))
        newAudio.ontimeupdate = () =>
          setAudioProgress((p) => ({ ...p, [audioKey]: newAudio.currentTime }))
        newAudio.onended = () => {
          setPlayingAudio(null)
          if (typeof file !== "string") URL.revokeObjectURL(fileUrl)
        }
        newAudio.play()
        setPlayingAudio(audioKey)
      }
    }
  }

  const handleDownload = (fileUrl, fileName) => {
    if (fileUrl && typeof fileUrl === "string") {
      functionDownVoice(fileUrl, fileName)
    } else {
      message.warning("该文件暂不支持下载")
    }
  }

  const handleDeleteRecording = async () => {
    try {
      setDeleting(true)
      const delScriptId = scriptId || form.getFieldsValue()?.scriptId
      const delTimbreValue = timbreValue || (form.getFieldValue("pairs") || [])[fieldName]?.code

      if (!botNo || !delTimbreValue || !delScriptId) {
        message.error("缺少必要参数，无法删除")
        return
      }

      const res = await checkSkillDelete({
        botNo,
        timbreCode: delTimbreValue,
        scriptId: delScriptId
      })

      if (res?.status != 200) {
        message.error(`删除失败：${res?.data || res?.message}`)
        return
      }

      message.success("删除成功")
      setDeletePopoverOpen(false)

      if (uploadMode === "api") {
        const path = Array.isArray(fieldName) ? fieldName : ["scripts", fieldName, "scriptVoices"]
        form.setFieldValue(path, { timbreCode: "", voiceName: "", ossUrl: "" })
      } else {
        const pairs = form.getFieldValue("pairs") || []
        if (pairs[fieldName]) {
          pairs[fieldName] = { ...pairs[fieldName], file: null, fileName: "", uploadUrl: "" }
          form.setFieldsValue({ pairs })
        }
      }

      const audioKey = `audio_${fieldName}`
      if (audioRefs.current[audioKey]) {
        audioRefs.current[audioKey].pause()
        delete audioRefs.current[audioKey]
      }
      if (playingAudio === audioKey) {
        setPlayingAudio(null)
      }
    } catch (error) {
      message.error(error.message || "删除失败")
    } finally {
      setDeleting(false)
    }
  }

  // 处理音色试听
  const handleTimbreAudition = (auditionUrl) => {
    if (!auditionUrl) {
      message.warning("该音色暂无试听音频")
      return
    }

    // 如果当前正在播放这个音频，则暂停
    if (playingAuditionUrl === auditionUrl && currentAuditionAudio) {
      currentAuditionAudio.pause()
      currentAuditionAudio.currentTime = 0
      setCurrentAuditionAudio(null)
      setPlayingAuditionUrl(null)
      return
    }

    // 定义播放结束的处理函数
    const handleAudioEnded = () => {
      setCurrentAuditionAudio(null)
      setPlayingAuditionUrl(null)
      audio.removeEventListener("ended", handleAudioEnded)
    }

    // 停止当前正在播放的音频
    if (currentAuditionAudio) {
      currentAuditionAudio.pause()
      currentAuditionAudio.currentTime = 0
      // 移除之前的事件监听器
      currentAuditionAudio.removeEventListener("ended", handleAudioEnded)
    }

    // 创建新的音频实例
    const audio = new Audio(auditionUrl)
    setCurrentAuditionAudio(audio)
    setPlayingAuditionUrl(auditionUrl)

    audio.addEventListener("ended", handleAudioEnded)
    audio.play().catch((error) => {
      console.error("播放试听音频失败:", error)
      message.error("试听播放失败")
      setCurrentAuditionAudio(null)
      setPlayingAuditionUrl(null)
      audio.removeEventListener("ended", handleAudioEnded)
    })
  }

  return (
    <div className="relative">
      {showRemove && (
        <i
          onClick={onRemove}
          className="iconfont icon-shanchu1 cursor-pointer absolute -top-1 -right-2 z-10 text-gray-400 hover:text-red-500"
        />
      )}
      <div className="flex items-start gap-2 mb-4 recordingItem">
        <div className="flex-1 min-w-0">
          <Form.Item {...restField} name={[fieldName, "code"]} label="音色选择" className="mb-0">
            {disableTimbreSelect ? (
              <Tooltip title={defaultTimbreName || "默认音色"}>
                <div className="px-3 h-[37px] pt-[6px] bg-gray-50 border border-gray-200 rounded-[6px] text-gray-600 truncate cursor-default">
                  {defaultTimbreName || "默认音色"}
                </div>
              </Tooltip>
            ) : (
              <Select
                ref={selectRef}
                placeholder="请选择音色"
                loading={timbreLoading}
                showSearch
                optionFilterProp="children"
                optionLabelProp="label"
                allowClear
                onChange={(value) => {
                  setTimbreValue(value)
                }}
              >
                {timbreOptions?.map((option) => {
                  return (
                    <Select.Option key={option?.value} value={option?.value} label={option?.label}>
                      <div
                        className="flex justify-between w-full"
                        onClick={(e) => {
                          // 阻止播放按钮事件冒泡到选项
                          if (e.target.tagName === "A" || e.target.closest("a")) {
                            e.stopPropagation()
                          }
                        }}
                      >
                        <span>{option?.label}</span>
                        {option.auditionUrl && (
                          <a
                            onClick={(e) => {
                              e.stopPropagation()
                              handleTimbreAudition(option.auditionUrl)
                            }}
                            className="text-[#7F56D9] hover:text-[#7F56D9]"
                            style={{ minWidth: "auto", padding: "2px 4px" }}
                          >
                            {playingAuditionUrl === option.auditionUrl ? (
                              <PauseCircleOutlined />
                            ) : (
                              <PlayCircleOutlined />
                            )}
                          </a>
                        )}
                      </div>
                    </Select.Option>
                  )
                })}
              </Select>
            )}
          </Form.Item>
        </div>
        <div className="flex-shrink-0 pt-[25px] mr-2">
          <Form.Item {...restField} name={[fieldName, "file"]} className="mb-0">
            {hasUploadedFile ? (
              <Popconfirm
                title="确认覆盖"
                description="当前音色已存在录音文件，是否覆盖？"
                onConfirm={() => {
                  const input = document.createElement("input")
                  input.type = "file"
                  input.accept = ".mp3,.wav,.m4a"
                  input.onchange = (e) => {
                    const file = e.target.files[0]
                    if (file) handleRecordingUpload({ file })
                  }
                  input.click()
                }}
                okText="确认覆盖"
                cancelText="取消"
              >
                <Button
                  icon={<UploadOutlined />}
                  type="primary"
                  loading={uploading}
                  disabled={isUploadDisabled}
                >
                  {uploading ? "上传中..." : "重新上传"}
                </Button>
              </Popconfirm>
            ) : (
              <Upload
                accept=".mp3,.wav,.m4a"
                showUploadList={false}
                onChange={handleRecordingUpload}
                beforeUpload={() => false}
                disabled={isUploadDisabled}
              >
                <Button
                  icon={<UploadOutlined />}
                  type="primary"
                  loading={uploading}
                  disabled={isUploadDisabled}
                >
                  {uploading ? "上传中..." : "上传录音"}
                </Button>
              </Upload>
            )}
          </Form.Item>
        </div>
      </div>

      {hasUploadedFile && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <img src={mp4Icon} alt="音频文件" className="w-10 h-10" />
            <div>
              <div className="text-sm font-medium text-gray-900 truncate max-w-[130px]">
                {(() => {
                  if (uploadMode === "api") {
                    // API 模式：从 scriptVoices 读取
                    let scriptVoicesPath = Array.isArray(fieldName)
                      ? fieldName
                      : ["scripts", fieldName, "scriptVoices"]
                    const scriptVoices = form.getFieldValue(scriptVoicesPath)

                    if (Array.isArray(scriptVoices) && scriptVoices.length > 0) {
                      return scriptVoices[0].voiceName || `录音文件_${fieldName + 1}`
                    }
                    return scriptVoices?.voiceName || `录音文件_${fieldName + 1}`
                  } else {
                    // 本地模式：从 pairs 读取
                    const pairs = form.getFieldValue("pairs") || []
                    return pairs[fieldName]?.fileName || `录音文件_${fieldName + 1}`
                  }
                })()}
              </div>
              <div className="text-xs text-gray-500">已选择</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="relative inline-flex items-center justify-center w-8 h-8">
              {playingAudio === `audio_${fieldName}` && (
                <Progress
                  type="circle"
                  size={32}
                  percent={
                    (audioProgress[`audio_${fieldName}`] / audioDuration[`audio_${fieldName}`]) *
                      100 || 0
                  }
                  strokeWidth={6}
                  showInfo={false}
                  strokeColor="#7F56D9"
                  trailColor="transparent"
                  className="absolute inset-0"
                />
              )}
              <Button
                type="text"
                size="small"
                icon={
                  playingAudio === `audio_${fieldName}` ? (
                    <PauseCircleOutlined />
                  ) : (
                    <PlayCircleOutlined />
                  )
                }
                onClick={() => {
                  if (uploadMode === "api") {
                    // API 模式：从 scriptVoices 读取 ossUrl
                    let scriptVoicesPath = Array.isArray(fieldName)
                      ? fieldName
                      : ["scripts", fieldName, "scriptVoices"]
                    const scriptVoices = form.getFieldValue(scriptVoicesPath)

                    let fileUrl = null
                    if (Array.isArray(scriptVoices) && scriptVoices.length > 0) {
                      fileUrl = scriptVoices[0].ossUrl
                    } else {
                      fileUrl = scriptVoices?.ossUrl
                    }

                    if (fileUrl) handlePlayPause(fileUrl)
                  } else {
                    // 本地模式：从 pairs 读取
                    const pairs = form.getFieldValue("pairs") || []
                    const fileUrl = pairs[fieldName]?.file
                    if (fileUrl) handlePlayPause(fileUrl)
                  }
                }}
              />
            </div>
            {(() => {
              if (uploadMode === "api") {
                // API 模式：从 scriptVoices 读取
                let scriptVoicesPath = Array.isArray(fieldName)
                  ? fieldName
                  : ["scripts", fieldName, "scriptVoices"]
                const scriptVoices = form.getFieldValue(scriptVoicesPath)

                let fileUrl = null
                let fileName = null

                if (Array.isArray(scriptVoices) && scriptVoices.length > 0) {
                  fileUrl = scriptVoices[0].ossUrl
                  fileName = scriptVoices[0].voiceName
                } else {
                  fileUrl = scriptVoices?.ossUrl
                  fileName = scriptVoices?.voiceName
                }

                return (
                  typeof fileUrl === "string" &&
                  fileUrl.trim() !== "" && (
                    <Button
                      type="text"
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={() =>
                        handleDownload(fileUrl, fileName || `录音文件_${fieldName + 1}`)
                      }
                    />
                  )
                )
              } else {
                // 本地模式：从 pairs 读取
                const pairs = form.getFieldValue("pairs") || []
                const fileUrl = pairs[fieldName]?.file
                const fileName = pairs[fieldName]?.fileName
                return (
                  typeof fileUrl === "string" &&
                  fileUrl.trim() !== "" && (
                    <Button
                      type="text"
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={() =>
                        handleDownload(fileUrl, fileName || `录音文件_${fieldName + 1}`)
                      }
                    />
                  )
                )
              }
            })()}
            <Popover
              open={deletePopoverOpen}
              onOpenChange={setDeletePopoverOpen}
              content={
                <div className="flex flex-col gap-2">
                  <div className="text-sm">确定要删除这条录音吗？</div>
                  <div className="flex justify-end gap-2">
                    <Button size="small" onClick={() => setDeletePopoverOpen(false)}>
                      取消
                    </Button>
                    <Button
                      type="primary"
                      size="small"
                      danger
                      loading={deleting}
                      onClick={handleDeleteRecording}
                    >
                      确定
                    </Button>
                  </div>
                </div>
              }
              trigger="click"
              placement="bottomRight"
            >
              <Button
                type="text"
                size="small"
                icon={<i className="text-gray-500 text-[13px] iconfont icon-shanchu1" />}
              />
            </Popover>
          </div>
        </div>
      )}
    </div>
  )
}

export default RecordingItem
