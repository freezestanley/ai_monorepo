import React, { memo } from "react"
import { Form, Button, Tooltip, InputNumber } from "antd"
import {
  CloseOutlined,
  DownOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined
} from "@ant-design/icons"
import { DragIcon } from "@/components/FormIcon"
import ColorGroupBadge from "./ColorGroupBadge"

const CollapsedScriptItem = memo(
  ({
    provided,
    field,
    scriptRuleId,
    form,
    index,
    id,
    name,
    content,
    remove,
    playingAudio,
    setPlayingAudio,
    audioProgress,
    audioUrls,
    setAudioProgress,
    recordingAudioDuration,
    setRecordingAudioDuration,
    recordingAudioRefs
  }) => {
    // 检查是否有录音文件
    const scriptVoices = form.getFieldValue(["scripts", field.name, "scriptVoices"]) || []
    const hasRecording =
      scriptVoices.length > 0 &&
      scriptVoices[0]?.ossUrl?.trim() !== "" &&
      scriptVoices[0] !== undefined // ||  audioUrls[field.name]

    // 处理播放/暂停录音
    const handlePlayPause = () => {
      const audioKey = `audio_${field.name}`

      const audio = recordingAudioRefs.current[audioKey]

      if (playingAudio === audioKey) {
        // 暂停当前播放
        if (audio) {
          audio.pause()
        }
        setPlayingAudio(null)
      } else {
        // 停止其他音频播放
        Object.keys(recordingAudioRefs.current).forEach((key) => {
          if (recordingAudioRefs.current[key] && key !== audioKey) {
            recordingAudioRefs.current[key].pause()
          }
        })

        // 播放当前音频
        const fileUrl = scriptVoices[0]?.ossUrl
        console.log("fileUrl", audio, fileUrl)
        if (audio) {
          audio.play()
          setPlayingAudio(audioKey)
        } else if (fileUrl) {
          // 创建新的音频元素
          const newAudio = new Audio(fileUrl)
          recordingAudioRefs.current[audioKey] = newAudio

          // 设置音频事件监听器
          newAudio.onloadedmetadata = () => {
            setRecordingAudioDuration((prev) => ({
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
          }

          newAudio.play()
          setPlayingAudio(audioKey)
        }
      }
    }

    return (
      <div className="flex gap-1 justify-start items-start w-[100%]">
        {/* 折叠样式 */}
        <div
          {...provided.dragHandleProps}
          className="h-[20px] flex items-center justify-center mt-[25px]"
        >
          <DragIcon />
        </div>
        <div className="mt-3  w-[100%] border border-[#E5E7EB] rounded-md flex justify-between items-center px-3 py-3 pb-0">
          <div
            onClick={() => {
              const scripts = form.getFieldValue("scripts") || []
              scripts[field.name] = {
                ...scripts[field.name],
                collapsed: false
              }
              form.setFieldValue("scripts", scripts)
            }}
            className="flex cursor-pointer"
          >
            <span className="text-gray-500 text-sm mr-2 cursor-pointer hover:text-gray-700">
              <DownOutlined />
            </span>
            <ColorGroupBadge
              index={index}
              groupFlag={form.getFieldValue(["scripts", field.name, "groupFlag"])}
              onChange={(color) => {
                form.setFieldValue(["scripts", field.name, "groupFlag"], color)
              }}
            />
            {id && <div className="ml-2 mr-2 max-w-[90px] truncate">{id}</div>}
            {name && (
              <Tooltip title={name}>
                <div className="ml-2 mr-2 max-w-[90px] truncate">{name}</div>
              </Tooltip>
            )}

            <Tooltip title={content}>
              <div className="ml-2 max-w-[150px] truncate text-gray-500">{content}</div>
            </Tooltip>
          </div>

          <div className="flex items-center justify-end gap-1 -mt-3">
            <div className="flex items-center">
              <span>优先级：</span>
              <Form.Item name={[field.name, "priorityLevel"]} className="mb-0">
                <InputNumber size="small" placeholder="优先级" min={1} max={999} className="w-20" />
              </Form.Item>
            </div>
            {/* TODO--折叠处理播放按钮 */}
            {/* 
            <div className="flex items-center">
              {hasRecording && (
                <div className="relative inline-flex items-center justify-center w-8 h-8">
                  {playingAudio === `audio_${field.name}` && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full border-2 border-[#7F56D9] border-t-transparent animate-spin"></div>
                    </div>
                  )}
                  <Button
                    type="text"
                    size="small"
                    icon={
                      playingAudio === `audio_${field.name}` ? (
                        <PauseCircleOutlined className="text-[#7F56D9]" />
                      ) : (
                        <PlayCircleOutlined className="text-[#7F56D9]" />
                      )
                    }
                    className="!border-0 !shadow-none !bg-transparent hover:!bg-transparent"
                    onClick={handlePlayPause}
                  />
                </div>
              )}
            </div> */}

            <Button
              type="link"
              onClick={() => remove(field.name)}
              className="text-xs -mr-2"
              icon={<CloseOutlined className="text-gray-500" />}
            />
          </div>
        </div>
      </div>
    )
  }
)

export default CollapsedScriptItem
