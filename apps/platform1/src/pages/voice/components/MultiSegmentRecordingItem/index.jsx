import { Form, Select, Button, Upload, message, Tooltip, Popconfirm } from "antd"
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined
} from "@ant-design/icons"
import { useEffect, useState, useRef } from "react"
import "../RecordingItem/index.scss" // 复用样式
import mp4Icon from "@/assets/img/mp4.png"
import { functionDownVoice } from "@/utils"
import { uploadVoiceFile, checkSkillDelete } from "@/api/voiceAgent/api"

const MultiSegmentRecordingItem = ({
  form,
  pairIndex,
  segmentSeqList,
  restField,
  timbreOptions = [],
  timbreLoading = false,
  playingAudio,
  setPlayingAudio,
  audioRefs,
  segmentCount = 0,
  disableTimbreSelect = false,
  defaultTimbreCode,
  defaultTimbreName,
  defaultTimbreModel,
  dataPath = "root", // 数据路径：'root' 表示直接从 pairs 读取，'nested' 表示从 scripts[field.name].pairs 读取
  uploadMode = "local", // 上传模式：'local' 本地模式，'api' API模式
  botNo,
  scriptId,
  onUploadSuccess,
  onUploadError
}) => {
  const [uploadingSegments, setUploadingSegments] = useState({}) // 记录每个分段的上传状态

  // 试听功能状态
  const [currentAuditionAudio, setCurrentAuditionAudio] = useState(null)
  const [playingAuditionUrl, setPlayingAuditionUrl] = useState(null)
  const selectRef = useRef(null)

  // 只有当明确传入 disableTimbreSelect=true 时才禁用音色选择
  // timbreOptions.length > 0 不应该导致禁用，因为有些场景需要传入选项但仍然可选择
  const shouldDisableTimbreSelect = disableTimbreSelect

  // 获取数据路径
  const getDataPath = () => {
    if (dataPath === "nested") {
      return ["scripts", restField.name, "pairs"]
    }
    return ["pairs"]
  }

  // 设置默认音色代码和初始化分段数据
  useEffect(() => {
    const dataPathArray = getDataPath()
    const codePath = [...dataPathArray, pairIndex, "code"]
    const pairPath = [...dataPathArray, pairIndex]

    if (disableTimbreSelect && defaultTimbreCode) {
      const currentCode = form.getFieldValue(codePath)
      if (!currentCode) {
        form.setFieldValue(codePath, defaultTimbreCode)
      }
    }

    // 如果传入了默认音色信息，检查是否需要初始化 segments
    const currentPair = form.getFieldValue(pairPath) || {}
    if (defaultTimbreCode && currentPair.code === defaultTimbreCode && !currentPair.segments) {
      // 从现有的 scriptVoices 数据中查找对应的 segments 信息
      const scriptVoices = form.getFieldValue("scriptVoices")
      if (scriptVoices && Array.isArray(scriptVoices)) {
        const matchingVoice = scriptVoices.find((voice) => voice.timbreCode === defaultTimbreCode)
        if (matchingVoice && matchingVoice.segments) {
          form.setFieldValue([...pairPath, "segments"], matchingVoice.segments)
        }
      }
    }
  }, [form, pairIndex, disableTimbreSelect, defaultTimbreCode, dataPath])
  const handleRecordingUpload = async (file, segmentIndex) => {
    if (!file) return

    const dataPathArray = getDataPath()
    const codePath = [...dataPathArray, pairIndex, "code"]
    const timbreCode = form.getFieldValue(codePath) || defaultTimbreCode

    if (uploadMode === "local") {
      // 本地模式：只保存文件到 form
      const pairs = form.getFieldValue(dataPathArray) || []
      const currentPair = pairs[pairIndex] || { segments: [] }
      currentPair.segments = currentPair.segments || []

      // 确保数组长度足够
      while (currentPair.segments.length <= segmentIndex) {
        currentPair.segments.push({
          file: null,
          fileName: "",
          ossUrl: "",
          seq: currentPair.segments.length
        })
      }

      currentPair.segments[segmentIndex] = {
        ...currentPair.segments[segmentIndex],
        file: file,
        fileName: file.name,
        ossUrl: "" // 清空旧的ossUrl，等待上传
      }

      pairs[pairIndex] = currentPair
      if (dataPath === "nested") {
        form.setFieldValue(dataPathArray, [...pairs])
      } else {
        form.setFieldsValue({ pairs: [...pairs] }) // 使用新数组触发更新
      }
      message.success(`录音文件已选择`)
    } else if (uploadMode === "api") {
      // API 模式：调用上传接口
      if (!botNo || !scriptId) {
        message.error("缺少必要参数，无法上传")
        onUploadError?.("缺少参数")
        return
      }

      if (!timbreCode) {
        message.error("请先选择音色")
        return
      }

      try {
        // 设置当前分段为上传中
        setUploadingSegments((prev) => ({ ...prev, [segmentIndex]: true }))

        const formData = new FormData()
        formData.append("file", file)
        formData.append("botNo", botNo)
        formData.append("scriptId", scriptId)
        formData.append("timbreCode", timbreCode)
        // 多传 seq 参数：使用 segmentSeqList 中的值，如果没有则使用 segmentIndex
        const seq = segmentSeqList?.[segmentIndex] ?? segmentIndex
        formData.append("seq", seq)

        const response = await uploadVoiceFile(formData)

        if (response && response.status === 200 && response.data) {
          // 处理接口返回的数据：可能是字符串或对象
          let ossUrl = ""
          if (typeof response.data === "string") {
            ossUrl = response.data.trim()
          } else if (typeof response.data === "object" && response.data.ossUrl) {
            ossUrl = response.data.ossUrl
          }

          // 更新 form 中的数据
          const pairs = form.getFieldValue(dataPathArray) || []
          const currentPair = pairs[pairIndex] || { segments: [] }
          currentPair.segments = currentPair.segments || []

          // 确保数组长度足够
          while (currentPair.segments.length <= segmentIndex) {
            currentPair.segments.push({
              file: null,
              fileName: "",
              ossUrl: "",
              voicePlayUrl: "",
              seq: currentPair.segments.length
            })
          }

          currentPair.segments[segmentIndex] = {
            ...currentPair.segments[segmentIndex],
            file: null, // API 模式不保存 file 对象
            fileName: file.name.replace(/\.[^/.]+$/, ""),
            ossUrl: ossUrl,
            voicePlayUrl: ossUrl,
            seq: seq
          }

          pairs[pairIndex] = currentPair
          if (dataPath === "nested") {
            form.setFieldValue(dataPathArray, [...pairs])
          } else {
            form.setFieldsValue({ pairs: [...pairs] })
          }

          message.success(`分段录音上传成功`)
          onUploadSuccess?.(response.data, segmentIndex)

          // 停止当前播放的音频
          const audioKey = `audio_${pairIndex}_${segmentIndex}`
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
        // 清除上传状态
        setUploadingSegments((prev) => {
          const newState = { ...prev }
          delete newState[segmentIndex]
          return newState
        })
      }
    }
  }

  const handlePlayPause = (file, segmentIndex) => {
    const audioKey = `audio_${pairIndex}_${segmentIndex}`
    const audio = audioRefs.current[audioKey]

    // 如果正在播放试听音频，先停止它
    if (currentAuditionAudio) {
      currentAuditionAudio.pause()
      currentAuditionAudio.currentTime = 0
      setCurrentAuditionAudio(null)
      setPlayingAuditionUrl(null)
    }

    if (playingAudio === audioKey) {
      if (audio) audio.pause()
      setPlayingAudio(null)
    } else {
      // 停止其他音频播放
      Object.values(audioRefs.current).forEach((a) => a && a.pause())

      if (audio) {
        audio.play()
        setPlayingAudio(audioKey)
      } else if (file) {
        const fileUrl = typeof file === "string" ? file : URL.createObjectURL(file)
        const newAudio = new Audio(fileUrl)
        audioRefs.current[audioKey] = newAudio

        newAudio.onloadedmetadata = () => {
          /* ... */
        }
        newAudio.ontimeupdate = () => {
          /* ... */
        }
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

  const handleDeleteSegment = async (segmentIndex) => {
    try {
      // 获取当前分段信息
      const dataPathArray = getDataPath()
      const pairs = form.getFieldValue(dataPathArray) || []
      const currentPair = pairs[pairIndex]

      if (currentPair && currentPair.segments && currentPair.segments[segmentIndex]) {
        // 获取seq值
        const seq = segmentSeqList?.[segmentIndex] ?? segmentIndex

        // 获取当前音色代码
        const codePath = [...dataPathArray, pairIndex, "code"]
        const timbreCode = form.getFieldValue(codePath) || defaultTimbreCode

        // 调用API接口删除
        await checkSkillDelete({
          botNo: botNo,
          scriptId: scriptId || "",
          seq: seq,
          timbreCode: timbreCode
        })

        // 成功后更新表单数据
        currentPair.segments[segmentIndex] = {
          file: null,
          fileName: "",
          ossUrl: "",
          seq: segmentIndex
        }
        if (dataPath === "nested") {
          form.setFieldValue(dataPathArray, [...pairs])
        } else {
          form.setFieldsValue({ pairs: [...pairs] })
        }
        message.success(`分段录音已删除`)
      }
    } catch (error) {
      console.error("删除分段录音失败:", error)
      message.error(error.message || "删除分段录音失败")
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

    // 停止所有正在播放的音频（包括分段录音和试听音频）
    const stopAllAudios = () => {
      // 停止分段录音
      Object.values(audioRefs.current).forEach((audio) => {
        if (audio) {
          audio.pause()
          audio.currentTime = 0
        }
      })

      // 停止试听音频
      if (currentAuditionAudio) {
        currentAuditionAudio.pause()
        currentAuditionAudio.currentTime = 0
        // 移除之前的事件监听器
        currentAuditionAudio.removeEventListener("ended", handleAudioEnded)
      }

      // 重置分段音频播放状态
      if (playingAudio) {
        setPlayingAudio(null)
      }
    }

    // 停止所有音频并清理状态
    stopAllAudios()

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

  // 获取当前选中的音色信息
  const getCurrentTimbreName = () => {
    // 如果有默认音色名称，优先使用
    if (defaultTimbreName) {
      return defaultTimbreName
    }

    const dataPathArray = getDataPath()
    const codePath = [...dataPathArray, pairIndex, "code"]
    const currentCode = form.getFieldValue(codePath)

    // 如果没有选择音色，显示未选择
    if (!currentCode) return "未选择音色"

    // 优先从 timbreOptions 中查找
    const selectedTimbre = timbreOptions.find((option) => option.value === currentCode)
    if (selectedTimbre) return selectedTimbre.label

    // 如果 timbreOptions 为空，尝试从 form 中获取音色名称
    const pairPath = [...dataPathArray, pairIndex]
    const currentPair = form.getFieldValue(pairPath) || {}
    if (currentPair.fileName) {
      return currentPair.fileName
    }

    return `音色-${currentCode}`
  }

  return (
    <div className="flex flex-col gap-4 ">
      <div className="mb-0">
        <div className="mb-2 text-sm font-medium text-gray-700">音色选择</div>
        {shouldDisableTimbreSelect ? (
          // 当音色被固定时，显示当前选中的音色
          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
            {getCurrentTimbreName()}
          </div>
        ) : (
          // 当可以选择音色时，显示下拉框
          <Form.Item {...restField} name={[pairIndex, "code"]} className="mb-0">
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
                        form.setFieldValue([...getDataPath(), pairIndex, "code"], option.value)
                        // 手动关闭下拉框
                        selectRef.current?.blur()
                      }}
                    >
                      <span className="truncate flex-1 pr-2">{option.label}</span>
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
                  ))}
                </>
              )}
            />
          </Form.Item>
        )}
      </div>

      <div className="flex flex-col gap-2 recordingItem">
        {[...Array(segmentCount)].map((_, index) => (
          <Form.Item
            key={index}
            shouldUpdate={(prevValues, curValues) => {
              const dataPathArray = getDataPath()

              // 根据 dataPath 获取正确的数据
              let prevSegments, curSegments
              if (dataPath === "nested") {
                // nested 路径: scripts[restField.name].pairs[pairIndex].segments
                prevSegments = prevValues?.scripts?.[restField.name]?.pairs?.[pairIndex]?.segments
                curSegments = curValues?.scripts?.[restField.name]?.pairs?.[pairIndex]?.segments
              } else {
                // root 路径: pairs[pairIndex].segments
                prevSegments = prevValues?.pairs?.[pairIndex]?.segments
                curSegments = curValues?.pairs?.[pairIndex]?.segments
              }

              const prev = prevSegments?.[index]
              const curr = curSegments?.[index]
              return prev !== curr
            }}
            noStyle
          >
            {() => {
              const dataPathArray = getDataPath()
              const segmentPath = [...dataPathArray, pairIndex, "segments"]
              const segments = form.getFieldValue(segmentPath) || []

              const segment = segments[index] || {}
              const hasFile = segment.file || segment.ossUrl || segment.voicePlayUrl
              const audioKey = `audio_${pairIndex}_${index}`

              return (
                <div className="flex items-center gap-2 text-sm">
                  <div className="text-gray-500">
                    <span className="text-white bg-[#7F56D9]  text-sm rounded-full w-[18px] h-[18px] flex items-center justify-center">
                      {" "}
                      {(segmentSeqList?.[index] ?? index) + 1}
                    </span>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    {hasFile && <img src={mp4Icon} alt="音频文件" className="w-5 h-5" />}
                    <div className="flex-1 truncate font-medium">
                      {hasFile ? (
                        segment.fileName || `分段录音_${index + 1}.wav`
                      ) : (
                        <span className="text-gray-400 text-sm text-[12px] font-[400]">
                          请上传分段录音文件
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center text-gray-500">
                    {hasFile && (
                      <Tooltip title="播放/暂停">
                        <Button
                          type="text"
                          size="small"
                          className="!p-0 -mr-2"
                          icon={
                            playingAudio === audioKey ? (
                              <PauseCircleOutlined />
                            ) : (
                              <PlayCircleOutlined />
                            )
                          }
                          onClick={() =>
                            handlePlayPause(
                              segment.file || segment.voicePlayUrl || segment.ossUrl,
                              index
                            )
                          }
                        />
                      </Tooltip>
                    )}
                    <Upload
                      accept=".mp3,.wav,.m4a"
                      showUploadList={false}
                      beforeUpload={(file) => {
                        handleRecordingUpload(file, index)
                        return false
                      }}
                      className="inline-block "
                      disabled={uploadingSegments[index]}
                    >
                      <Tooltip
                        title={
                          uploadingSegments[index] ? "上传中..." : hasFile ? "重新上传" : "上传"
                        }
                      >
                        <Button
                          className="!p-0 -mr-2"
                          type="text"
                          size="small"
                          icon={<UploadOutlined />}
                          loading={uploadingSegments[index]}
                          disabled={uploadingSegments[index]}
                        />
                      </Tooltip>
                    </Upload>
                    {hasFile && (
                      <>
                        <Tooltip title="下载">
                          <Button
                            className="!p-0 -mr-2"
                            type="text"
                            size="small"
                            icon={<DownloadOutlined />}
                            onClick={() =>
                              handleDownload(
                                segment.voicePlayUrl || segment.ossUrl,
                                segment.fileName
                              )
                            }
                          />
                        </Tooltip>
                        <Tooltip title="删除">
                          <Popconfirm
                            title="确定删除此分段录音吗？"
                            onConfirm={() => handleDeleteSegment(index)}
                            okText="确定"
                            cancelText="取消"
                          >
                            <Button
                              className="!p-0 -mr-2"
                              type="text"
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                            />
                          </Popconfirm>
                        </Tooltip>
                      </>
                    )}
                  </div>
                </div>
              )
            }}
          </Form.Item>
        ))}
      </div>
    </div>
  )
}

export default MultiSegmentRecordingItem
