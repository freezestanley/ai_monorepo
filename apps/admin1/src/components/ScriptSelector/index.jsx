import React, { useState, useEffect, useCallback, useRef } from "react"
import {
  Select,
  Input,
  Checkbox,
  Spin,
  Empty,
  message,
  Card,
  Row,
  Col,
  Button,
  Divider,
  Tooltip,
  Radio
} from "antd"
import List from "rc-virtual-list"
import { getTagConfigList, getScriptDetail } from "@/api/voiceAgent/api"
import { useGetScriptListByPage } from "@/api/voiceAgent"
import { MessageType } from "@/constants/postMessageType"
import "./style.scss"

// 移除Search的解构，直接使用Input

const ScriptSelector = ({
  value,
  onChange,
  onScriptDetailChange,
  placeholder = "请选择话术",
  botNo,
  taskId,
  timbreCode,
  disabled = false,
  className = ""
}) => {
  const [open, setOpen] = useState(false)
  const [businessTypes, setBusinessTypes] = useState([])
  const [tags, setTags] = useState([])
  const [scripts, setScripts] = useState([])

  // 搜索状态
  const [businessTypeSearch, setBusinessTypeSearch] = useState("")
  const [tagSearch, setTagSearch] = useState("")
  const [scriptSearch, setScriptSearch] = useState("")

  // 选择状态
  const [selectedBusinessType, setSelectedBusinessType] = useState(null)
  const [selectedTags, setSelectedTags] = useState([])
  const [selectedScript, setSelectedScript] = useState(null)

  // 加载状态
  const [businessTypesLoading, setBusinessTypesLoading] = useState(false)
  const [tagsLoading, setTagsLoading] = useState(false)
  const [scriptsLoading, setScriptsLoading] = useState(false)

  // 使用 ref 保存最新的 onScriptDetailChange 回调
  const onScriptDetailChangeRef = useRef(onScriptDetailChange)

  // 更新 ref 的值
  useEffect(() => {
    onScriptDetailChangeRef.current = onScriptDetailChange
  }, [onScriptDetailChange])

  // 获取业务类型列表
  const fetchBusinessTypes = useCallback(async () => {
    try {
      setBusinessTypesLoading(true)
      const res = await getTagConfigList({
        type: 1,
        botNo
      })

      if (res?.data && Array.isArray(res.data)) {
        setBusinessTypes(res.data)
      }
    } catch (error) {
      console.error("获取业务类型失败:", error)
      message.error("获取业务类型失败")
    } finally {
      setBusinessTypesLoading(false)
    }
  }, [botNo])

  // 获取标签列表
  const fetchTags = useCallback(async () => {
    try {
      setTagsLoading(true)
      const res = await getTagConfigList({
        type: 2,
        botNo
      })

      if (res?.data && Array.isArray(res.data)) {
        setTags(res.data)
      }
    } catch (error) {
      console.error("获取标签失败:", error)
      message.error("获取标签失败")
    } finally {
      setTagsLoading(false)
    }
  }, [botNo])

  // 获取话术列表的查询参数
  const getScriptQueryParams = useCallback(() => {
    const params = {
      pageSize: 10000,
      pageNum: 1,
      botNo,
      taskId
    }

    // 添加业务类型筛选
    if (selectedBusinessType) {
      params.scriptType = selectedBusinessType
    }

    // 添加标签筛选
    if (selectedTags.length > 0) {
      params.scriptTags = selectedTags
    }

    return params
  }, [botNo, taskId, selectedBusinessType, selectedTags])

  // 使用React Query获取话术列表
  const { data: scriptData, isLoading: scriptLoading } = useGetScriptListByPage(
    getScriptQueryParams(),
    {
      enabled: open && !!botNo && !!taskId
    }
  )

  // 处理话术数据
  useEffect(() => {
    if (scriptData?.data?.list && Array.isArray(scriptData.data.list)) {
      const formattedScripts = scriptData.data.list.map((script) => ({
        scriptId: script.id,
        name: script.name || `话术${script.id}`,
        content: script.content || ""
      }))
      setScripts(formattedScripts)
    }
    setScriptsLoading(scriptLoading)
  }, [scriptData, scriptLoading])

  // 获取话术详情的通用方法
  const fetchScriptDetail = useCallback(
    async (scriptId) => {
      try {
        const params = { scriptId, botNo }
        // 如果有taskId，传递 taskId
        if (taskId) {
          params.taskId = taskId
        }
        // 如果有选择的音色，传递 timbreCode
        if (timbreCode) {
          params.timbreCode = timbreCode
        }

        const res = await getScriptDetail(params)
        if (res?.data) {
          // 将话术详情传递给父组件，特别是 scriptVoices 数据
          onScriptDetailChangeRef.current?.(res.data)
        }
      } catch (error) {
        console.error("获取话术详情失败:", error)
        message.error("获取话术详情失败")
      }
    },
    [botNo, taskId, timbreCode]
  )

  // 初始化数据
  useEffect(() => {
    if (open && botNo) {
      fetchBusinessTypes()
      fetchTags()
    }
  }, [open, botNo, fetchBusinessTypes, fetchTags])

  // 当有默认值时，自动请求话术详情
  useEffect(() => {
    if (value && botNo && onScriptDetailChangeRef.current) {
      const fetchDetail = async () => {
        try {
          const params = { scriptId: value, botNo }
          // 如果有taskId，传递 taskId
          if (taskId) {
            params.taskId = taskId
          }
          // 如果有选择的音色，传递 timbreCode
          if (timbreCode) {
            params.timbreCode = timbreCode
          }

          const res = await getScriptDetail(params)
          if (res?.data) {
            // 将话术详情传递给父组件，特别是 scriptVoices 数据
            onScriptDetailChangeRef.current?.(res.data)
          }
        } catch (error) {
          console.error("获取话术详情失败:", error)
          message.error("获取话术详情失败")
        }
      }
      fetchDetail()
    }
  }, [value, botNo, taskId, timbreCode])

  // 过滤业务类型
  const filteredBusinessTypes = businessTypes.filter((item) =>
    item.name?.toLowerCase().includes(businessTypeSearch.toLowerCase())
  )

  // 过滤标签
  const filteredTags = tags.filter((item) =>
    item.name?.toLowerCase().includes(tagSearch.toLowerCase())
  )

  // 过滤话术
  const filteredScripts = scripts.filter(
    (item) =>
      item.name?.toLowerCase().includes(scriptSearch.toLowerCase()) ||
      item.content?.toLowerCase().includes(scriptSearch.toLowerCase())
  )

  // 处理业务类型选择
  const handleBusinessTypeSelect = (businessType) => {
    setSelectedBusinessType(businessType.id)
  }

  // 处理标签选择
  const handleTagSelect = (tag, checked) => {
    if (checked) {
      setSelectedTags((prev) => [...prev, tag.id])
    } else {
      setSelectedTags((prev) => prev.filter((id) => id !== tag.id))
    }
  }

  // 处理话术选择
  const handleScriptSelect = async (script) => {
    setSelectedScript(script)
    onChange?.(script.scriptId)
    setOpen(false)

    // 获取话术详情
    await fetchScriptDetail(script.scriptId)
  }

  // 获取显示的文本
  const getDisplayText = () => {
    if (selectedScript) {
      return selectedScript.name
    }
    if (value && scripts.length > 0) {
      const script = scripts.find((s) => s.scriptId === value)
      return script?.name || placeholder
    }
    return placeholder
  }

  // 清空选择
  const handleClear = () => {
    setSelectedBusinessType(null)
    setSelectedTags([])
    setSelectedScript(null)
    setBusinessTypeSearch("")
    setTagSearch("")
    setScriptSearch("")
  }

  const dropdownRender = () => (
    <div>
      <Row gutter={5}>
        {/* 业务类型列 */}
        <Col span={7}>
          <div style={{ marginBottom: 8 }}>
            <strong>业务类型</strong>
          </div>
          <Input
            placeholder="搜索业务类型"
            value={businessTypeSearch}
            onChange={(e) => setBusinessTypeSearch(e.target.value)}
            prefix={<i className="iconfont icon-sousuo text-gray-400"></i>}
            style={{ marginBottom: 8 }}
          />
          <div style={{ maxHeight: 250, overflowY: "auto" }}>
            {businessTypesLoading ? (
              <div style={{ textAlign: "center", padding: 20 }}>
                <Spin size="small" />
              </div>
            ) : filteredBusinessTypes.length > 0 ? (
              filteredBusinessTypes.map((businessType) => (
                <Tooltip key={businessType.id} title={businessType.name} placement="top">
                  <div
                    style={{
                      padding: "6px 8px",
                      cursor: "pointer",
                      borderRadius: 8,
                      marginBottom: 4,
                      border:
                        selectedBusinessType === businessType.id
                          ? "1px solid #722ed1"
                          : "1px solid #d9d9d9",
                      backgroundColor:
                        selectedBusinessType === businessType.id ? "#f9f0ff" : "#fff",
                      color: selectedBusinessType === businessType.id ? "#722ed1" : "#000",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "all 0.2s"
                    }}
                    onClick={() => {
                      if (selectedBusinessType === businessType.id) {
                        // 点击已选中的项目，取消选择
                        setSelectedBusinessType(null)
                      } else {
                        handleBusinessTypeSelect(businessType)
                      }
                    }}
                  >
                    <Radio
                      checked={selectedBusinessType === businessType.id}
                      style={{ marginRight: 8, pointerEvents: "none" }}
                    />
                    <span
                      style={{
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {businessType.name}
                    </span>
                  </div>
                </Tooltip>
              ))
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />
            )}
          </div>
        </Col>

        <Col span={1}>
          <Divider type="vertical" style={{ height: "100%" }} />
        </Col>

        {/* 标签列 */}
        <Col span={7}>
          <div
            style={{
              marginBottom: 8,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <strong>标签</strong>
            <Checkbox
              checked={filteredTags.length > 0 && selectedTags.length === filteredTags.length}
              indeterminate={selectedTags.length > 0 && selectedTags.length < filteredTags.length}
              onChange={(e) => {
                if (e.target.checked) {
                  // 全选
                  const allTagIds = filteredTags.map((tag) => tag.id)
                  setSelectedTags(allTagIds)
                } else {
                  // 取消全选
                  setSelectedTags([])
                }
              }}
            >
              全选
            </Checkbox>
          </div>
          <Input
            placeholder="搜索标签"
            value={tagSearch}
            onChange={(e) => setTagSearch(e.target.value)}
            prefix={<i className="iconfont icon-sousuo text-gray-400"></i>}
            style={{ marginBottom: 8 }}
          />
          <div style={{ maxHeight: 250, overflowY: "auto" }}>
            {tagsLoading ? (
              <div style={{ textAlign: "center", padding: 20 }}>
                <Spin size="small" />
              </div>
            ) : filteredTags.length > 0 ? (
              filteredTags.map((tag) => (
                <div key={tag.id} style={{ marginBottom: 8 }}>
                  <Checkbox
                    checked={selectedTags.includes(tag.id)}
                    onChange={(e) => handleTagSelect(tag, e.target.checked)}
                  >
                    <Tooltip title={tag.name}>
                      <div className="w-[120px] truncate overflow-hidden">{tag.name}</div>
                    </Tooltip>
                  </Checkbox>
                </div>
              ))
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />
            )}
          </div>
        </Col>

        <Col span={1}>
          <Divider type="vertical" style={{ height: "100%" }} />
        </Col>

        {/* 话术名称列 */}
        <Col span={8}>
          <div
            style={{
              marginBottom: 8,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <strong>话术名称</strong>
            <span style={{ fontSize: 12, color: "#999", fontWeight: "normal" }}>
              已筛选 {filteredScripts.length} 条话术
            </span>
          </div>
          <Input
            placeholder="搜索话术名称/话术内容"
            value={scriptSearch}
            onChange={(e) => setScriptSearch(e.target.value)}
            prefix={<i className="iconfont icon-sousuo text-gray-400"></i>}
            style={{ marginBottom: 8 }}
          />
          <div style={{ maxHeight: 250 }}>
            {scriptsLoading ? (
              <div style={{ textAlign: "center", padding: 20 }}>
                <Spin size="small" />
              </div>
            ) : filteredScripts.length > 0 ? (
              <List data={filteredScripts} height={250} itemHeight={40} itemKey="scriptId">
                {(script) => (
                  <Tooltip
                    title={
                      <div className="w-[200px]">
                        <h4 className="text-white font-bold">{script.name}</h4>
                        <div className="text-[12px]">{script.content}</div>
                      </div>
                    }
                    placement="left"
                    style={{ left: "100px" }}
                  >
                    <div
                      style={{
                        padding: "8px 12px",
                        cursor: "pointer",
                        backgroundColor:
                          selectedScript?.scriptId === script.scriptId ? "#f9f0ff" : "",
                        borderRadius: 4,
                        marginBottom: 4,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}
                      className="hover:bg-[#f9f0ff]"
                      onClick={() => handleScriptSelect(script)}
                    >
                      {script.name}
                    </div>
                  </Tooltip>
                )}
              </List>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />
            )}
          </div>
        </Col>
      </Row>

      <Divider style={{ margin: "12px 0" }} />

      <div className="flex justify-between">
        <Button
          size="small"
          color="primary"
          variant="outlined"
          onClick={() => {
            window.parent.postMessage(
              {
                type: MessageType.NAVIGATE_TO_VOICE_SCRIPT
              },
              "*"
            )
          }}
        >
          创建话术
        </Button>
        <Button size="small" onClick={handleClear}>
          清空
        </Button>
      </div>
    </div>
  )

  return (
    <div>
      <Select
        dropdownClassName={`script-selector-dropdown ${className}`.trim()}
        placeholder={placeholder}
        value={
          selectedScript?.name ||
          (value ? filteredScripts.find((s) => s.scriptId === value)?.name : undefined)
        }
        open={open}
        onDropdownVisibleChange={setOpen}
        disabled={disabled}
        dropdownRender={dropdownRender}
      >
        {/* 这里不需要Option，因为使用了dropdownRender */}
      </Select>
    </div>
  )
}

export default ScriptSelector
