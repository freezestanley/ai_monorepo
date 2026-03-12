import React, { memo } from "react"
import { Form, Input, Button, Row, Col, Tooltip, message, InputNumber } from "antd"
import {
  CloseOutlined,
  UpOutlined,
  DownOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined
} from "@ant-design/icons"
import { DragIcon } from "@/components/FormIcon"
import RecordingItem from "../../../RecordingItem"
import MultiSegmentRecordingItem from "../../../MultiSegmentRecordingItem"
import ScriptSelector from "@/components/ScriptSelector"
import RuleInputWithSwitch from "./RuleInputWithSwitch"
import { functionDownVoice } from "@/utils"
import ColorGroupBadge from "./ColorGroupBadge"

const ExpandedScriptItem = memo(
  ({
    provided,
    field,
    form,
    id,
    index,
    isCollapsed,
    remove,
    scriptList,
    botNo,
    taskId,
    nodeDetailsData,
    synthesizingStates,
    handleSynthesis,
    audioUrls,
    playingStates,
    togglePlay,
    currentTimes,
    formatTime,
    currentPlayingIndex,
    progress,
    audioDurations,
    audioRef,
    handleProgressClick,
    playingAudio,
    setPlayingAudio,
    audioProgress,
    setAudioProgress,
    recordingAudioDuration,
    setRecordingAudioDuration,
    recordingAudioRefs,
    isOnlyRead,
    styles
  }) => {
    return (
      <div className="flex gap-1 justify-start items-start">
        <div
          {...provided.dragHandleProps}
          className="h-[20px] flex items-center justify-center mt-[25px]"
        >
          <DragIcon />
        </div>
        <div
          key={field.key}
          className="mt-3 p-3 pb-0 border border-gray-300 rounded-lg relative bg-white w-[98%]"
          style={{
            border: "1px solid #E5E7EB"
          }}
        >
          <div
            onClick={() => {
              const scripts = form.getFieldValue("scripts") || []
              scripts[field.name] = {
                ...scripts[field.name],
                collapsed: true
              }
              form.setFieldValue("scripts", scripts)
            }}
            className="flex cursor-pointer"
          >
            <span className="text-gray-500 text-sm mr-2 cursor-pointer hover:text-gray-700">
              {isCollapsed ? <DownOutlined /> : <UpOutlined />}
            </span>
            <ColorGroupBadge
              index={index}
              groupFlag={form.getFieldValue(["scripts", field.name, "groupFlag"])}
              onChange={(color) => {
                form.setFieldValue(["scripts", field.name, "groupFlag"], color)
              }}
            />

            {id && <div className="ml-2 mr-2 max-w-[90px] truncate">话术ID：{id}</div>}
          </div>

          <Button
            type="link"
            danger
            onClick={() => remove(field.name)}
            className="absolute right-2 top-2 text-xs"
            icon={<CloseOutlined className="text-gray-500" />}
          />

          {/* 话术名称、话术规则、话术优先级 - 一行显示 */}
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
                  onChange={(scriptId) => {
                    // 根据选择的话术自动设置variable字段
                    const selectedScript = scriptList.find((s) => s.scriptId === scriptId)
                    if (selectedScript) {
                      form.setFieldValue(
                        ["scripts", field.name, "variable"],
                        selectedScript.variable || 0
                      )
                      // 添加 name
                      form.setFieldValue(
                        ["scripts", field.name, "name"],
                        selectedScript.name || undefined
                      )
                      // 添加 content
                      form.setFieldValue(
                        ["scripts", field.name, "content"],
                        selectedScript.content || undefined
                      )
                    }
                  }}
                  onScriptDetailChange={(scriptDetail) => {
                    if (scriptDetail) {
                      // 获取当前话术的音色信息
                      const currentValues = form.getFieldsValue()
                      const currentScript = currentValues.scripts?.[field.name] || {}
                      const timbreCode =
                        nodeDetailsData?.data?.timbreCode || currentScript.timbreCode || undefined
                      const timbreName = currentScript.timbreName || ""

                      // 处理不同类型的数据
                      let scriptVoices = []

                      if (scriptDetail.variable === 2 || scriptDetail.variable === 3) {
                        // 组合模式：从 combinationVoiceInfos 获取录音数据
                        if (
                          scriptDetail.combinationVoiceInfos &&
                          Array.isArray(scriptDetail.combinationVoiceInfos)
                        ) {
                          scriptVoices = scriptDetail.combinationVoiceInfos.map((voiceInfo) => ({
                            timbreCode: voiceInfo.timbreCode,
                            voiceName: timbreName || `音色-${voiceInfo.timbreCode}`,
                            // 将 combinationVoices 转换为 segments 格式，用于 MultiSegmentRecordingItem
                            segments: voiceInfo.combinationVoices
                              ? voiceInfo.combinationVoices.map((cv, index) => ({
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
                        }
                      } else {
                        // 普通模式：从 scriptVoices 获取录音数据
                        if (scriptDetail.scriptVoices && Array.isArray(scriptDetail.scriptVoices)) {
                          scriptVoices = scriptDetail.scriptVoices
                            .filter((voice) => voice && voice.timbreCode == timbreCode)
                            .map((voice) => ({
                              ...voice,
                              voiceName:
                                voice.voiceName ||
                                timbreName ||
                                voice.ossUrl?.split("/").pop() ||
                                ""
                            }))
                        }
                      }

                      // 设置录音文件到当前话术的scriptVoices字段
                      form.setFieldValue(["scripts", field.name, "scriptVoices"], scriptVoices)

                      // 对于组合模式，还需要设置 combinations 和 pairs 数据
                      if (scriptDetail.variable === 2 || scriptDetail.variable === 3) {
                        // 设置 combinations 数据
                        form.setFieldValue(
                          ["scripts", field.name, "combinations"],
                          scriptDetail.combinations || []
                        )

                        // 设置 pairs 数据供 MultiSegmentRecordingItem 使用
                        const pairs = scriptDetail.combinationVoiceInfos.map((voiceInfo) => ({
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

                        form.setFieldValue(["scripts", field.name, "pairs"], pairs)
                      }

                      // 如果是有变量的话术，设置音色编码
                      const variable = form.getFieldValue(["scripts", field.name, "variable"])
                      if (variable === 1) {
                        form.setFieldValue(["scripts", field.name, "timbreCode"], timbreCode)
                      }
                    }
                  }}
                />
              </Form.Item>
            </Col>

            <Col span={6} className="w-full">
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
                <InputNumber placeholder="请输入优先级" min={1} className="w-full" precision={0} />
              </Form.Item>
            </Col>

            <Col span={24} className="mt-2">
              <RuleInputWithSwitch field={field} form={form} />
            </Col>
          </Row>

          {/* 话术内容展示 */}
          <Form.Item dependencies={[["scripts", field.name, "scriptId"]]}>
            {({ getFieldValue }) => {
              const selectedScriptId = getFieldValue(["scripts", field.name, "scriptId"])

              // 从scriptList中查找话术内容
              const selectedScript = scriptList.find((s) => s.scriptId === selectedScriptId)
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
                  <div className="text-gray-400 text-sm bg-gray-50 p-3 rounded">暂无话术内容</div>
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
                // 暂时隐藏 音色相关的 配置，只显示合成试听
                {
                  /* 试听功能 */
                }
                return (
                  <div>
                    <Row gutter={16}>
                      <Col span={24}>
                        <Form.Item
                          shouldUpdate={(prevValues, currentValues) => {
                            const prevScriptId = prevValues?.scripts?.[field.name]?.scriptId
                            const currentScriptId = currentValues?.scripts?.[field.name]?.scriptId
                            return prevScriptId !== currentScriptId
                          }}
                        >
                          {() => {
                            const selectedScriptId = getFieldValue([
                              "scripts",
                              field.name,
                              "scriptId"
                            ])
                            const selectedScript = scriptList.find(
                              (s) => s.scriptId === selectedScriptId
                            )
                            const scriptContent = selectedScript?.content || ""

                            // 当 scriptContent 有值且当前输入框为空时，自动填充
                            const currentValue = getFieldValue([
                              "scripts",
                              field.name,
                              "synthesisText"
                            ])
                            if (scriptContent && !currentValue) {
                              form.setFieldValue(
                                ["scripts", field.name, "synthesisText"],
                                scriptContent
                              )
                            }

                            return (
                              <Form.Item
                                {...field}
                                name={[field.name, "synthesisText"]}
                                label="试听"
                              >
                                <Input.TextArea
                                  placeholder={scriptContent || "请输入要合成试听的文本"}
                                  rows={3}
                                  className="flex-1 mr-2"
                                />
                              </Form.Item>
                            )
                          }}
                        </Form.Item>
                        <div className="text-left -mt-4">
                          <Button
                            icon={<i className="iconfont icon-zhinengyouhua"></i>}
                            onClick={() => handleSynthesis(field.name, field.name)}
                            loading={synthesizingStates[field.name] || false}
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
                    {audioUrls[field.name] && (
                      <div className="mt-3  bg-gray-100 p-3 pr-4 rounded-md">
                        <div className="flex items-center mb-2">
                          <div className="mr-2 flex items-center justify-center w-9 h-9 bg-orange-500 p-1 text-white rounded-md">
                            <span className="text-xs font-bold">MP3</span>
                          </div>
                          <div className="flex-1 text-sm font-medium text-gray-700 truncate">
                            已生成语音文件
                          </div>

                          {audioUrls[field.name] && (
                            <i
                              className="iconfont icon-xiazai text-[#7F56D9] cursor-pointer text-xl mr-3 -mt-[1px]"
                              onClick={() => {
                                // 尝试强制下载，但需要后端OSS支持Content-Disposition头
                                functionDownVoice(audioUrls[field.name])
                              }}
                            ></i>
                          )}

                          {playingStates[field.name] ? (
                            <PauseCircleOutlined
                              className="text-xl text-[#7F56D9] cursor-pointer"
                              onClick={() => togglePlay(field.name)}
                            />
                          ) : (
                            <PlayCircleOutlined
                              className="text-xl text-[#7F56D9] cursor-pointer"
                              onClick={() => togglePlay(field.name)}
                            />
                          )}
                        </div>

                        <div className="flex items-center">
                          <div className="text-xs text-gray-500 mr-2">
                            {formatTime(currentTimes[field.name] || 0)}
                          </div>
                          <div
                            className="flex-1 bg-gray-200 h-1 rounded cursor-pointer relative overflow-hidden"
                            onClick={(e) => handleProgressClick(e, field.name)}
                          >
                            <div
                              className="absolute h-full bg-[#7F56D9] rounded-lg"
                              style={{
                                width: `${currentPlayingIndex === field.name ? progress : 0}%`
                              }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 ml-2">
                            {formatTime(audioDurations[field.name] || 0)}
                          </div>
                        </div>

                        {/* 隐藏的音频元素 */}
                        <audio ref={audioRef} style={{ display: "none" }} />
                      </div>
                    )}
                  </div>
                )
              } else if (hasVariable === 2 || hasVariable === 0) {
                // 组合模式或无变量时显示录音上传功能
                const currentScript = getFieldValue(["scripts", field.name]) || {}
                const combinationsValue = currentScript.combinations || []
                const segmentSeqList = combinationsValue
                  .filter((c) => c?.variable === 0)
                  .map((c) => c?.seq)

                // 修复：segmentCount 应该基于 combinations 中 variable===0 的项目数量
                const segmentCount = combinationsValue.filter((c) => c?.variable === 0).length

                return (
                  <div className="w-full">
                    {hasVariable === 2 || hasVariable === 3 ? (
                      // 组合模式：使用 pairs 数据，直接渲染 MultiSegmentRecordingItem
                      <Form.List name={[field.name, "pairs"]}>
                        {(pairFields, { add: addPair, remove: removePair }) => {
                          // 如果没有音色对，自动添加一个
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
                                    restField={{ ...pairField, name: field.name }} // 传递 script 的索引而不是 pair 的索引
                                    timbreOptions={[]} // 不再需要音色选项
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
                                    defaultTimbreCode={form.getFieldValue("timbreCode")} // 使用详情接口返回的timbreCode
                                    defaultTimbreName={form.getFieldValue("timbreName")} // 使用详情接口返回的timbreName
                                    defaultTimbreModel={form.getFieldValue("timbreModel")} // 使用详情接口返回的timbreModel
                                    dataPath="nested" // 使用嵌套数据路径：scripts[field.name].pairs
                                    uploadMode="api" // API 上传模式
                                    botNo={botNo}
                                    scriptId={currentScriptId}
                                    onUploadSuccess={(url, segmentIndex) => {
                                      console.log("分段录音上传成功:", url, segmentIndex)
                                      message.success(`分段 ${segmentIndex + 1} 上传成功`)
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
                    ) : (
                      // 无变量模式：使用 scriptVoices 数据
                      <Form.List name={[field.name, "scriptVoices"]}>
                        {(voiceFields, { add: addVoice, remove: removeVoice }) => {
                          // 如果没有录音项，自动添加一个
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
                                    timbreOptions={[]} // 不再需要音色选项
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
                                    defaultTimbreCode={form.getFieldValue("timbreCode")} // 使用详情接口返回的timbreCode
                                    defaultTimbreName={form.getFieldValue("timbreName")} // 使用详情接口返回的timbreName
                                    defaultTimbreModel={form.getFieldValue("timbreModel")} // 使用详情接口返回的timbreModel
                                    disableTimbreSelect={true} // 禁用音色选择
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
                                    isOnlyRead={isOnlyRead}
                                  />
                                </div>
                              ))}
                            </div>
                          )
                        }}
                      </Form.List>
                    )}
                  </div>
                )
              }
              return null
            }}
          </Form.Item>
        </div>
      </div>
    )
  }
)

export default ExpandedScriptItem
