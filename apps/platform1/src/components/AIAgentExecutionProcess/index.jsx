import { useMemo, useState, useCallback } from "react"
import "./index.scss"
import copy from "copy-to-clipboard"
import Iconfont from "../Icon"
import { Input, message, Modal } from "antd"
// import textData from "./text"
import CodeMirror from "@uiw/react-codemirror"
import { json } from "@codemirror/lang-json"
import { EditorView } from "@codemirror/view"
import { indentationMarkers } from "@replit/codemirror-indentation-markers"
import { codemirrorThemeGray } from "@/utils/codeMirrorTheme"

const formatJSON = (jsonString) => {
  try {
    const parsed = typeof jsonString === "string" ? JSON.parse(jsonString) : jsonString
    return JSON.stringify(parsed, null, 2)
  } catch (error) {
    return jsonString
  }
}

const CodeBlock = ({ code, className = "" }) => {
  return (
    <pre className={"code-block io-content " + className}>
      <code>{formatJSON(code)}</code>
    </pre>
  )
}

const handleCopyContent = (text) => {
  copy(formatJSON(text))
  message.success("复制成功")
}

const HighlightText = ({ text, searchValue }) => {
  if (!searchValue?.trim()) return text

  const parts = text.split(new RegExp(`(${searchValue})`, "gi"))

  return (
    <span>
      {parts.map((part, index) =>
        part.toLowerCase() === searchValue.toLowerCase() ? (
          <span key={index} style={{ backgroundColor: "#ffd54f" }}>
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  )
}

const ExecutionStep = ({ component, style = {}, searchValue = "" }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  return (
    <div className="execution-step" style={style}>
      <div className="step-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className={`step-status`}>
          {component.success ? (
            <Iconfont
              onClick={(e) => {
                e.stopPropagation()
                handleCopyContent(component.input)
              }}
              type="icon-a-CheckCircleFillon"
              className="success"
            />
          ) : (
            <Iconfont
              onClick={(e) => {
                e.stopPropagation()
                handleCopyContent(component.input)
              }}
              type="icon-a-ErrorFillon"
              className="error"
            />
          )}
        </div>
        <div className="step-info">
          <span className="step-name">
            <HighlightText text={component.componentName} searchValue={searchValue} />
          </span>
          <span className="step-type">
            <HighlightText text={component.componentType} searchValue={searchValue} />
          </span>
          {component.skillNo && (
            <span className="text-gray-400 text-[11px]"> - {component.skillNo}</span>
          )}
        </div>

        <span className="step-time">{component.cost || 0} ms</span>
        <span className={`expand-icon ${isExpanded ? "expanded" : ""}`}>
          <Iconfont type="icon-Down" />
        </span>
      </div>
      <ExecutionStepItem
        component={component}
        style={style}
        isExpanded={isExpanded}
        searchValue={searchValue}
      />
      {isExpanded &&
        component.children?.map((child, index) => {
          return (
            <ExecutionStep
              key={index}
              component={child}
              style={{ marginLeft: 32 }}
              searchValue={searchValue}
            />
          )
        })}
    </div>
  )
}

function IOHeader({ component, type, contentIsExpanded = false, onToggleExpand }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [fullContent, setFullContent] = useState({
    title: "",
    content: ""
  })
  const handleOk = () => {
    setIsModalOpen(false)
  }
  const handleCancel = () => {
    setIsModalOpen(false)
  }
  const title = type === "input" ? "输入" : "输出"
  return (
    <>
      <div className="io-header flex justify-between">
        <span className="header-title">{title}</span>
        <div className="flex items-center">
          <Iconfont
            onClick={() => handleCopyContent(component[type])}
            type="icon-fuzhi"
            className="operate-icon mr-2"
          />
          <Iconfont
            type="icon-a-expand"
            className="operate-icon"
            onClick={() => {
              setFullContent({
                title: `${component.componentName}${component.componentType}【${title}】`,
                content: component[type]
              })
              setIsModalOpen(true)
            }}
          />
          <Iconfont
            type="icon-Down"
            className={`ml-2 operate-icon content-expand-icon ${contentIsExpanded ? "expanded" : ""}`}
            onClick={onToggleExpand}
          />
        </div>
      </div>
      <Modal
        title={fullContent.title}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        width={1000}
        footer={null}
      >
        {/* <CodeBlock code={fullContent.content} /> */}
        <div>
          <div className="absolute top-[80px] right-8">
            <Iconfont
              onClick={() => handleCopyContent(component[type])}
              type="icon-fuzhi"
              className="operate-icon mr-2"
            />
          </div>

          <div className="section-content mt-3" style={{ textAlign: "left" }}>
            <CodeMirror
              value={fullContent.content}
              height="auto"
              minHeight={"150px"}
              // maxHeight="400px"
              readOnly={true}
              extensions={[
                json(),
                EditorView.lineWrapping, // 启用换行
                indentationMarkers({
                  hideFirstIndent: false,
                  markerType: "fullScope",
                  thickness: 1,
                  colors: {
                    light: "#E8E8E8",
                    dark: "#404040",
                    activeLight: "#C0C0C0",
                    activeDark: "#606060"
                  }
                })
              ]}
              theme={codemirrorThemeGray}
              basicSetup={{
                lineNumbers: false,
                foldGutter: false,
                highlightActiveLine: false,
                searchKeymap: false
              }}
              className="metadata-code-mirror"
              style={{ textAlign: "left" }}
            />
          </div>
        </div>
      </Modal>
    </>
  )
}

const ExecutionStepItem = ({ component, style = {}, isExpanded = false, searchValue = "" }) => {
  const [inputExpanded, setInputExpanded] = useState(true)
  const [outputExpanded, setOutputExpanded] = useState(true)

  const highlightJsonContent = useMemo(
    () => (content) => {
      try {
        const jsonStr = formatJSON(content)
        if (!searchValue?.trim()) return jsonStr

        const lines = jsonStr.split("\n")
        return lines.map((line, lineIndex) => {
          const parts = line.split(new RegExp(`(${searchValue})`, "gi"))
          return (
            <span key={lineIndex}>
              {parts.map((part, partIndex) =>
                part.toLowerCase() === searchValue.toLowerCase() ? (
                  <span key={partIndex} style={{ backgroundColor: "#ffd54f" }}>
                    {part}
                  </span>
                ) : (
                  part
                )
              )}
              {lineIndex < lines.length - 1 ? "\n" : ""}
            </span>
          )
        })
      } catch (error) {
        return content
      }
    },
    [searchValue]
  )

  const renderIOSection = (type, content, isContentExpanded, setContentExpanded) => (
    <div className="io-section">
      <IOHeader
        component={component}
        type={type}
        contentIsExpanded={isContentExpanded}
        onToggleExpand={() => setContentExpanded(!isContentExpanded)}
      />
      <div className={`code-block-wrapper ${isContentExpanded ? "expanded" : ""}`}>
        <pre className="code-block io-content">
          {/* <code>{highlightJsonContent(content)}</code> */}
          <div className="section-content" style={{ textAlign: "left" }}>
            <CodeMirror
              value={content}
              height="auto"
              minHeight={"150px"}
              maxHeight="400px"
              readOnly={true}
              extensions={[
                json(),
                EditorView.lineWrapping, // 启用换行
                indentationMarkers({
                  hideFirstIndent: false,
                  markerType: "fullScope",
                  thickness: 1,
                  colors: {
                    light: "#E8E8E8",
                    dark: "#404040",
                    activeLight: "#C0C0C0",
                    activeDark: "#606060"
                  }
                })
              ]}
              theme={codemirrorThemeGray}
              basicSetup={{
                lineNumbers: false,
                foldGutter: false,
                highlightActiveLine: false,
                searchKeymap: false
              }}
              className="metadata-code-mirror"
              style={{ textAlign: "left" }}
            />
          </div>
        </pre>
      </div>
    </div>
  )

  return (
    <>
      {isExpanded && (
        <div className="step-details" style={style}>
          {renderIOSection("input", component.input, inputExpanded, setInputExpanded)}
          {component.componentType !== "INPUT" &&
            renderIOSection(
              "output",
              component.success ? component.output : component.errorMessage || "未知错误",
              outputExpanded,
              setOutputExpanded
            )}
        </div>
      )}
    </>
  )
}

const AIAgentExecutionProcess = ({ data: { componentExecuteProcess = [] }, showSearch = true }) => {
  const [searchValue, setSearchValue] = useState("")

  const onSearch = useCallback((e) => {
    setSearchValue(e.target.value.toLowerCase())
  }, [])

  const reg = new RegExp(searchValue, "i")

  const searchInComponent = useCallback(
    (component) => {
      const isMatch =
        component.componentName.match(reg) ||
        component.componentType.match(reg) ||
        String(component?.input).match(reg) ||
        String(component?.output).match(reg) ||
        String(component?.errorMessage).match(reg)

      if (isMatch) return true

      if (component.children?.length > 0) {
        return component.children.some((child) => searchInComponent(child))
      }

      return false
    },
    [searchValue]
  )

  const filteredExecutionSteps = useMemo(() => {
    if (!searchValue.trim()) return componentExecuteProcess
    return componentExecuteProcess.filter(searchInComponent)
  }, [componentExecuteProcess, searchValue, searchInComponent])

  return (
    <div className="ai-agent-execution-process">
      {showSearch && <Input className="mb-2" placeholder="请输入搜索关键词" onChange={onSearch} />}
      {filteredExecutionSteps.map((component, index) => {
        return (
          <ExecutionStep
            key={`${component.componentNo}-${index}`}
            component={component}
            searchValue={searchValue}
          />
        )
      })}
    </div>
  )
}

export const PreviewCode = ({ code, title }) => {
  return (
    <>
      <div className="io-header flex justify-between">
        <span>{title || "放大预览"}</span>
        <div className="flex items-center">
          <Iconfont
            onClick={() => handleCopyContent(code)}
            type="icon-fuzhi"
            className="operate-icon mr-2"
          />
        </div>
      </div>
      <CodeBlock code={code} />
    </>
  )
}

export default AIAgentExecutionProcess
