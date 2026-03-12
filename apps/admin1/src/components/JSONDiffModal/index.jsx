import React, { useState, useEffect } from "react"
import { Modal, Select, message, Button, Tooltip } from "antd"
import { EditOutlined, CloseOutlined } from "@ant-design/icons"
import ReactDiffViewer from "react-diff-viewer"
import {
  fetchSkillVersionCompare,
  fetchVersionContent,
  fetchSkillVersionContent
} from "@/api/skill/api"
import { Post } from "@/api/server"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"
import VariableTextArea from "@/pages/xflow/CustomFlowchartFormPanel/NodeComponent/components/VariableTextArea"
import { CodeEditor } from "@/components/CodeEditor"

const { Option } = Select

const JSONDiffModal = ({
  visible,
  onCancel,
  currentSkill,
  globalData,
  variables,
  skillNo,
  bizNo,
  onEnableVersion
}) => {
  const [selectedVersionName, setSelectedVersionName] = useState(null)
  const [selectedComponentName, setSelectedComponentName] = useState(null)
  const [selectedVersion, setSelectedVersion] = useState(null)
  const [historyVersions, setHistoryVersions] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentContent, setCurrentContent] = useState("")
  const [historyContent, setHistoryContent] = useState("")
  const [contentLoading, setContentLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingContent, setEditingContent] = useState("")

  // console.log("currentSkill", bizNo, skillNo, currentSkill)

  // 根据 skillComponentDefinitions 获取组件名称
  const getComponentName = () => {
    const skillComponentDefinitions = currentSkill?.skillInfo?.skillComponentDefinitions || []

    // 如果传入了bizNo，优先根据bizNo匹配对应的组件
    if (bizNo) {
      const matchedComponent = skillComponentDefinitions.find(
        (component) => component.bizNo === bizNo
      )
      if (matchedComponent) {
        return matchedComponent.componentName
      }
    }

    // 如果没有bizNo或没有匹配到，优先查找 PROMPT_TEMPLATE 类型的组件
    const promptComponent = skillComponentDefinitions.find(
      (component) => component.componentType === "PROMPT_TEMPLATE"
    )

    if (promptComponent) {
      return promptComponent.componentName
    }

    // 如果没有找到 PROMPT_TEMPLATE，查找 SCRIPT 类型的组件
    const scriptComponent = skillComponentDefinitions.find(
      (component) => component.componentType === "SCRIPT"
    )

    if (scriptComponent) {
      return scriptComponent.componentName
    }

    // 如果都没有找到，取第一个组件
    if (skillComponentDefinitions.length > 0) {
      return skillComponentDefinitions[0].componentName
    }

    // 兜底方案
    return currentSkill?.componentName || currentSkill?.label || "Script组件"
  }

  useEffect(() => {
    if (visible && skillNo) {
      loadVersionCompareData()
    }
  }, [visible, skillNo, bizNo])

  // 获取历史版本内容
  const fetchHistoryVersionContent = async (extraInfo) => {
    try {
      setContentLoading(true)
      const currentComponentType = getCurrentComponentType()
      const response = await fetchSkillVersionContent(extraInfo, currentComponentType)
      return response
    } catch (error) {
      message.error("获取历史版本内容失败：" + (error.message || "未知错误"))
      return null
    } finally {
      setContentLoading(false)
    }
  }

  // 获botNo取唯一版本数据
  const getUniqueVersions = () => {
    const versionNames = [...new Set(historyVersions.map((v) => v.versionName))]
    const componentNames = [...new Set(historyVersions.map((v) => v.componentName))]
    return { versionNames, componentNames }
  }

  // 根据筛选条件获取匹配的版本
  const getMatchedVersion = () => {
    if (!selectedVersionName || !selectedComponentName) return null
    return historyVersions.find(
      (v) => v.versionName === selectedVersionName && v.componentName === selectedComponentName
    )
  }

  // 处理版本名称选择
  const handleVersionNameChange = async (versionName) => {
    setSelectedVersionName(versionName)
    if (selectedComponentName) {
      const matchedVersion = historyVersions.find(
        (v) => v.versionName === versionName && v.componentName === selectedComponentName
      )
      if (matchedVersion) {
        setSelectedVersion(matchedVersion)
        const content = await fetchHistoryVersionContent(matchedVersion.extraInfo)
        if (content) {
          setHistoryContent(formatJSON(content))
        }
      }
    }
  }

  // 处理组件名称选择
  const handleComponentNameChange = async (componentName) => {
    setSelectedComponentName(componentName)
    if (selectedVersionName) {
      const matchedVersion = historyVersions.find(
        (v) => v.versionName === selectedVersionName && v.componentName === componentName
      )
      if (matchedVersion) {
        setSelectedVersion(matchedVersion)
        const content = await fetchHistoryVersionContent(matchedVersion.extraInfo)
        if (content) {
          setHistoryContent(formatJSON(content))
        }
      }
    }
  }

  // 获取当前组件的bizNo
  const getCurrentComponentBizNo = () => {
    // 如果传入了bizNo，直接使用传入的bizNo
    if (bizNo) {
      return bizNo
    }

    const skillComponentDefinitions = currentSkill?.skillInfo?.skillComponentDefinitions || []

    // 如果没有传入bizNo，优先查找 PROMPT_TEMPLATE 类型的组件
    const promptComponent = skillComponentDefinitions.find(
      (component) => component.componentType === "PROMPT_TEMPLATE"
    )

    if (promptComponent) {
      return promptComponent.bizNo
    }

    // 如果没有找到 PROMPT_TEMPLATE，查找 SCRIPT 类型的组件
    const scriptComponent = skillComponentDefinitions.find(
      (component) => component.componentType === "SCRIPT"
    )

    if (scriptComponent) {
      return scriptComponent.bizNo
    }

    // 如果都没有找到，取第一个组件的bizNo
    if (skillComponentDefinitions.length > 0) {
      return skillComponentDefinitions[0].bizNo
    }

    // 兜底方案
    return undefined
  }

  // 获取当前组件的类型
  const getCurrentComponentType = () => {
    const skillComponentDefinitions = currentSkill?.skillInfo?.skillComponentDefinitions || []

    // 如果传入了bizNo，根据bizNo查找对应组件的类型
    if (bizNo) {
      const matchedComponent = skillComponentDefinitions.find(
        (component) => component.bizNo === bizNo
      )
      if (matchedComponent) {
        return matchedComponent.componentType
      }
    }

    // 如果没有传入bizNo，优先查找 PROMPT_TEMPLATE 类型的组件
    const promptComponent = skillComponentDefinitions.find(
      (component) => component.componentType === "PROMPT_TEMPLATE"
    )

    if (promptComponent) {
      return "PROMPT_TEMPLATE"
    }

    // 如果没有找到 PROMPT_TEMPLATE，查找 SCRIPT 类型的组件
    const scriptComponent = skillComponentDefinitions.find(
      (component) => component.componentType === "SCRIPT"
    )

    if (scriptComponent) {
      return "SCRIPT"
    }

    // 如果都没有找到，取第一个组件的类型
    if (skillComponentDefinitions.length > 0) {
      return skillComponentDefinitions[0].componentType
    }

    // 兜底方案
    return "PROMPT_TEMPLATE"
  }

  // 加载版本对比数据
  const loadVersionCompareData = async () => {
    try {
      setLoading(true)
      const currentBizNo = getCurrentComponentBizNo()
      const currentComponentType = getCurrentComponentType()
      const data = await fetchSkillVersionCompare(skillNo, currentBizNo, currentComponentType)

      // 设置所有历史版本列表
      const allComponents = data?.allComponents || []
      setHistoryVersions(allComponents)

      // 重置筛选状态
      setSelectedVersionName(null)
      setSelectedComponentName(null)
      setSelectedVersion(null)
      setHistoryContent("")

      // 加载当前版本内容
      if (globalData) {
        setCurrentContent(formatJSON(globalData))
      }

      // 处理serviceSpeculation自动选中逻辑
      if (data?.serviceSpeculation) {
        const { versionName, componentName, extraInfo } = data.serviceSpeculation

        // 自动选中版本名和组件名
        setSelectedVersionName(versionName)
        setSelectedComponentName(componentName)

        // 查找匹配的版本
        const matchedVersion = allComponents.find(
          (version) =>
            version.versionName === versionName && version.componentName === componentName
        )

        if (matchedVersion) {
          setSelectedVersion(matchedVersion)

          // 自动请求版本详情
          try {
            setContentLoading(true)
            const versionContent = await fetchSkillVersionContent(extraInfo, currentComponentType)
            if (versionContent) {
              setHistoryContent(formatJSON(versionContent))
            }
          } catch (error) {
            message.error("加载版本内容失败：" + (error.message || "未知错误"))
          } finally {
            setContentLoading(false)
          }
        }
      }
    } catch (error) {
      message.error("加载版本对比数据失败：" + (error.message || "未知错误"))
    } finally {
      setLoading(false)
    }
  }

  // 启用指定版本
  const handleEnableVersion = () => {
    if (!historyContent) {
      message.warning("请先选择要启用的历史版本")
      return
    }

    try {
      // 将历史版本内容传递给父组件
      if (onEnableVersion) {
        onEnableVersion(historyContent)
      }
      message.success("版本内容已应用")
      setIsEditing(false)
      onCancel() // 关闭弹窗
    } catch (error) {
      message.error("应用版本内容失败：" + (error.message || "未知错误"))
    }
  }

  // 开始编辑
  const handleStartEdit = () => {
    const componentType = getCurrentComponentType()
    let editContent = currentContent

    // 对于SCRIPT类型，需要从globalData中提取原始脚本内容
    if (componentType === "SCRIPT" && globalData) {
      // 如果globalData是字符串，直接使用
      if (typeof globalData === "string") {
        editContent = globalData
      }
      // 如果globalData是对象，尝试提取脚本内容
      else if (typeof globalData === "object" && globalData !== null) {
        // 常见的脚本内容字段名
        editContent =
          globalData.script ||
          globalData.content ||
          globalData.code ||
          JSON.stringify(globalData, null, 2)
      }
    }

    setEditingContent(editContent)
    setIsEditing(true)
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditingContent("")
  }

  // 保存编辑
  // 应用编辑内容
  const handleApplyEditedContent = () => {
    try {
      if (onEnableVersion) {
        onEnableVersion(editingContent)
      }
      message.success("编辑内容已应用")
      setIsEditing(false)
      onCancel() // 关闭弹窗
    } catch (error) {
      message.error("应用编辑内容失败：" + (error.message || "未知错误"))
    }
  }

  const formatJSON = (obj) => {
    // 如果是字符串，直接返回
    if (typeof obj === "string") {
      return obj
    }
    // 如果是对象或数组，进行 JSON 格式化
    if (typeof obj === "object" && obj !== null) {
      return JSON.stringify(obj, null, 2)
    }
    // 其他类型转为字符串
    return String(obj)
  }

  const { versionNames, componentNames } = getUniqueVersions()
  const matchedVersion = getMatchedVersion()

  return (
    <Modal
      title="版本对比"
      open={visible}
      onCancel={onCancel}
      width={1000}
      style={{ minWidth: "1000px" }}
      footer={
        isEditing ? (
          <div className="flex justify-start">
            <Button type="primary" onClick={handleApplyEditedContent}>
              应用编辑内容
            </Button>
          </div>
        ) : null
      }
      className="json-diff-modal"
    >
      {!loading && historyVersions.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <CustomEmpty description="暂无历史版本数据" />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between absolute h-[100px] w-[96%] z-20 top-[70px] bg-white">
            <div className="flex w-[50%]">
              <div>
                <div className="mb-2 text-[#000] font-bold">
                  <span>当前工作流版本</span>
                </div>
                <Tooltip title={currentSkill?.skillInfo?.versionName || "未知版本"}>
                  <div className="border text-[#98A2B3] border-[#D0D5DD] bg-[#F5F7FA] rounded-md p-2 py-1 w-[200px] text-ellipsis overflow-hidden whitespace-nowrap">
                    {currentSkill?.skillInfo?.versionName || "未知版本"}
                  </div>
                </Tooltip>
              </div>

              <div className="ml-4">
                <div className="mb-2 text-[#000] font-bold">
                  {getCurrentComponentType() === "SCRIPT" ? "Script" : "Prompt"}
                  组件名
                </div>
                <Tooltip title={getComponentName()}>
                  <div className="border text-[#98A2B3] border-[#D0D5DD] bg-[#F5F7FA] rounded-md p-2 py-1 w-[200px] text-ellipsis overflow-hidden whitespace-nowrap">
                    {getComponentName()}
                  </div>
                </Tooltip>
              </div>
            </div>

            <div className="flex justify-between items-end w-[50%] ml-[30px]">
              <div className="flex">
                <div>
                  <div className="mb-2 text-[#000] font-bold">历史工作流版本</div>
                  <Select
                    placeholder="选择版本名称"
                    style={{ width: 200 }}
                    onChange={handleVersionNameChange}
                    loading={loading}
                    value={selectedVersionName}
                    allowClear
                  >
                    {versionNames.map((versionName) => (
                      <Option key={versionName} value={versionName}>
                        {versionName}
                      </Option>
                    ))}
                  </Select>
                </div>
                <div className="ml-4">
                  <div className="mb-2 text-[#000] font-bold">
                    {getCurrentComponentType() === "SCRIPT" ? "Script" : "Prompt"}组件名
                  </div>
                  <Select
                    placeholder="选择组件名称"
                    style={{ width: 200 }}
                    onChange={handleComponentNameChange}
                    loading={loading}
                    value={selectedComponentName}
                    allowClear
                  >
                    {componentNames.map((componentName) => (
                      <Option key={componentName} value={componentName}>
                        {componentName}
                      </Option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-lg overflow-hidden relative pt-[80px]">
            {isEditing && (
              <div
                className={`absolute top-[135px]  h-[calc(100%-50px)] bg-white z-10 overflow-y-auto ${getCurrentComponentType() === "SCRIPT" ? "w-[50%]" : "w-[52.2%]"}`}
              >
                <div className="h-full">
                  {getCurrentComponentType() === "SCRIPT" ? (
                    <CodeEditor
                      // value={editingContent}
                      codeContent={editingContent}
                      onChange={setEditingContent}
                      height="100%"
                      language="python"
                      showPanel={false}
                      miniStyle={{
                        util: {
                          padding: 0
                        },
                        editor: {
                          border: "none",
                          background: "#fff",
                          width: "100%",
                          borderRadius: 0,
                          height: "99%"
                        }
                      }}
                    />
                  ) : (
                    <VariableTextArea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      variables={variables || []}
                      miniInputStyle={{
                        height: "100%",
                        border: "none",
                        width: "100%",
                        borderRadius: 0
                      }}
                      placeholder="请输入内容..."
                    />
                  )}
                </div>
              </div>
            )}
            <ReactDiffViewer
              oldValue={currentContent}
              newValue={matchedVersion ? historyContent : ""}
              splitView={true}
              leftTitle={
                <div className="flex items-center h-[30px]  justify-between">
                  <span>当前版本</span>
                  <Button
                    type="text"
                    size="small"
                    icon={isEditing ? <CloseOutlined /> : <EditOutlined />}
                    onClick={isEditing ? handleCancelEdit : handleStartEdit}
                    className="!p-0 !hover:bg-[#fff]"
                  >
                    {isEditing ? "取消编辑" : "编辑"}
                  </Button>
                </div>
              }
              rightTitle={
                <div className="flex items-center  h-[30px]  justify-between">
                  {/* <Tooltip
                    title={
                      matchedVersion
                        ? `历史版本 (${matchedVersion.componentName} - ${matchedVersion.versionName})`
                        : "请选择历史版本进行对比"
                    }
                  >
                    <span className="truncate">
                      `历史版本 (${matchedVersion.componentName} - ${matchedVersion.versionName})`
                    </span>
                  </Tooltip> */}
                  <span></span>
                  <Button
                    type="link"
                    onClick={handleEnableVersion}
                    disabled={!historyContent}
                    className="p-0 h-auto flex-shrink-0"
                  >
                    启用此版本
                  </Button>
                </div>
              }
              showDiffOnly={false}
              useDarkTheme={false}
              styles={{
                diffContainer: {
                  display: "block"
                },
                titleBlock: {
                  height: "40px"
                }
              }}
            />
          </div>
        </div>
      )}

      {loading && <div className="text-center py-8 text-gray-500">正在加载历史版本...</div>}
      {contentLoading && <div className="text-center py-8 text-gray-500">正在加载版本内容...</div>}
    </Modal>
  )
}

export default JSONDiffModal
