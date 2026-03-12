import MermaidDiagram from "@/components/MermaidDiagram"
import Messages from "@/pages/agentWorkbench/components/messages"
import TextareaForm from "@/pages/agentWorkbench/components/textarea-from"
import { Button, ConfigProvider, Form, message, Space, Splitter } from "antd"
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import { debounce } from "lodash"
import { Role } from "@/pages/agentWorkbench/components/messages/constants"
import { CodeEditor } from "@/components/CodeEditor"
import "./index.scss"
import Addons from "./addons"
import {
  useFetchSessionMessages,
  useFetchSkillDefinition,
  useGenerateCodeChat,
  useSaveGeneratingSkillDef
} from "@/api/AICreate"
import useSaveShortcut from "../hooks/useSaveShortcut"

const msg = [
  {
    sessionMessages: [
      {
        content: "欢迎来到AI构建工作流面板，尽管把你的需求描述清楚，剩下的交给我……",
        role: "ai"
      }
    ]
  }
]
const PREVIEW = "preview"
const CODE = "code"
function AiCreate({ botNo, appData, currentSkillInfo }, ref) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [diagramDefinition, setDiagramDefinition] = useState(null)
  const [messages, setMessages] = useState([])
  const [code, setCode] = useState("")
  const [editMode, setEditMode] = useState(PREVIEW)
  const isCodeMode = editMode === CODE
  const [dimensions, setDimensions] = useState({
    width: "600px",
    height: "600px"
  })
  const [showChatPanel, setShowChatPanel] = useState(true)
  const observedDivRef = useRef(null)

  const codeRef = useRef("")
  const skillDataRef = useRef({})
  const loadingRef = useRef(null)
  const textareaRef = useRef(null)
  const skillNo = currentSkillInfo?.skillNo
  const { data: skillDefinition = {} } = useFetchSkillDefinition({
    skillNo
  })
  const versionNo = skillDefinition?.versionNo
  // 数据初始化
  useEffect(() => {
    if (skillDataRef) {
      skillDataRef.current = {
        skillNo,
        versionNo
      }
    }
    if (codeRef) {
      codeRef.current = skillDefinition?.executableCode
    }
    setCode(skillDefinition?.executableCode)
    setDiagramDefinition(skillDefinition?.executableCodeFlowDef)
  }, [versionNo, skillNo, skillDefinition])

  const { data: historyMessages = [] } = useFetchSessionMessages({
    botNo,
    skillNo,
    skillVersionNo: versionNo
  })

  useEffect(() => {
    if (!historyMessages || historyMessages.length === 0) {
      setMessages(msg)
    } else {
      setMessages(historyMessages)
      // const lastMessage = historyMessages[historyMessages.length - 1] || []
      // const aiMessage = lastMessage.sessionMessages.find((item) => {
      //   return item.role == Role.assistant
      // })
      // // 最后有一条是ai数据，并且没有保存过，就用聊天信息里的
      // if (aiMessage) {
      //   try {
      //     const msg = JSON.parse(aiMessage.content)
      //     if (typeof msg === "object") {
      //       setCode(msg.executableCode)
      //       if (codeRef) {
      //         codeRef.current = msg.executableCode
      //       }
      //       setDiagramDefinition(msg.executableCodeFlowDef)
      //     }
      //   } catch (e) {
      //     console.log("error:", e)
      //   }
      // }
    }
  }, [historyMessages])

  const { mutate: generateCodeChat } = useGenerateCodeChat()
  const { mutate: saveGeneratingSkillDef, isLoading: isSaveLoading } = useSaveGeneratingSkillDef()

  const switchEditMode = (mode) => {
    setEditMode(mode)
  }

  const handleCodeEditorScreen = () => {
    setShowChatPanel((prev) => {
      return !prev
    })
  }

  const save = (callback) => {
    const saveData = {
      executableCode: code,
      executableCodeFlowDef: diagramDefinition
    }
    saveGeneratingSkillDef(
      {
        ...saveData,
        skillNo,
        versionNo
      },
      {
        onSuccess: (e) => {
          if (e?.message) {
            if (callback) {
              const newVersionNo = e?.data?.versionNo
              callback({ skillVersionNo: newVersionNo, skillNo, botNo })
            } else {
              message.success(e?.message)
            }
          }
        }
      }
    )
  }
  // 向父组件暴露保存接口
  useImperativeHandle(ref, () => ({
    save
  }))
  useSaveShortcut(save, isSaveLoading, true)

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      const { width, height } = observedDivRef.current.getBoundingClientRect()
      setDimensions({
        width: `${width - 2}px`,
        height: `${height - 60}px`
      })
    })
    setTimeout(() => {
      if (observedDivRef.current) {
        resizeObserver.observe(observedDivRef.current)
      }
    }, 0)
    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  const onMessageScroll = debounce(() => {
    if (loadingRef?.current) {
      loadingRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, 500)

  useEffect(() => {
    if (!loading && textareaRef.current && messages.length > 0) {
      textareaRef.current.focus()
    }
  }, [loading, messages])

  const sendMessage = (message) => {
    const userMessage = {
      role: Role.user,
      content: message
    }
    setMessages((prev) => [
      ...prev,
      {
        sessionMessages: [userMessage]
      }
    ])
    setLoading(true)
    generateCodeChat(
      {
        botNo,
        skillNo: skillDataRef?.current?.skillNo,
        skillVersionNo: skillDataRef.current?.versionNo,
        executableCode: codeRef?.current,
        message
      },
      {
        onSuccess: (e) => {
          if (e.success !== true) {
            setLoading(false)
            console.error("generateCodeChat error:", e)
            const aiMessage = {
              role: Role.assistant,
              content: `${e.message || "接口返回异常"}`
            }
            setMessages((prev = []) => {
              const len = prev.length
              prev[len - 1].sessionMessages.push(aiMessage)
              return prev
            })
            return
          }
          const { analyticalDescription, executableCode, executableCodeFlowDef } = e.data
          const aiMessage = {
            role: Role.assistant,
            content: analyticalDescription
          }
          setMessages((prev = []) => {
            const len = prev.length
            prev[len - 1].sessionMessages.push(aiMessage)
            return prev
          })
          setLoading(false)
          onMessageScroll()
          setCode(executableCode)
          if (codeRef.current) {
            codeRef.current = executableCode
          }
          setDiagramDefinition(executableCodeFlowDef)
        },
        onError: (e) => {
          setLoading(false)
        }
      }
    )
  }

  return (
    <Form form={form} className="mt-[25px]">
      <Splitter
        style={{
          height: "calc(100vh - 100px)",
          boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)"
        }}
      >
        {showChatPanel && (
          <Splitter.Panel defaultSize={450} min={300} max={600}>
            <div
              style={{
                height: "100%",
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                backgroundColor: "rgb(243, 245, 249)"
              }}
            >
              <Messages messages={messages} isLoading={loading} loadingRef={loadingRef} />
              <Addons
                botNo={botNo}
                skillNo={skillNo}
                appData={appData}
                versionNo={versionNo}
                currentSkillInfo={currentSkillInfo}
              />
              <TextareaForm
                sendMessage={sendMessage}
                isLoading={loading}
                textareaRef={textareaRef}
              />
            </div>
          </Splitter.Panel>
        )}
        <Splitter.Panel>
          <div
            ref={observedDivRef}
            className=" items-center flex h-full w-full justify-center relative"
          >
            <div className="absolute top-4 right-4">
              <ConfigProvider wave={{ disabled: true }}>
                <Button className="button-screen" onClick={handleCodeEditorScreen}>
                  {showChatPanel ? `全屏${isCodeMode ? "代码" : "预览"}` : "退出全屏"}
                </Button>
                <Space.Compact>
                  <Button
                    className="compact-buttons"
                    type={isCodeMode ? "default" : "primary"}
                    onClick={() => {
                      switchEditMode(PREVIEW)
                    }}
                  >
                    预览
                  </Button>
                  <Button
                    className="compact-buttons"
                    type={isCodeMode ? "primary" : "default"}
                    onClick={() => {
                      switchEditMode(CODE)
                    }}
                  >
                    代码
                  </Button>
                </Space.Compact>
              </ConfigProvider>
            </div>

            {editMode === CODE ? (
              <CodeEditor
                codeContent={code}
                width={dimensions.width}
                height={dimensions.height}
                miniStyle={{
                  util: {
                    display: "none"
                  },
                  editor: {
                    borderTop: "none",
                    borderBottom: "none",
                    borderRight: "none",
                    position: "absolute",
                    top: 60,
                    bottom: "0",
                    left: 0,
                    right: 0,
                    zIndex: 1,
                    borderRadius: 0
                  }
                }}
                onCodeChange={(code) => {
                  setCode(code)
                  codeRef.current = code
                }}
              />
            ) : (
              <MermaidDiagram diagramDefinition={diagramDefinition} waitingTip="快去跟AI聊天吧~" />
            )}
          </div>
        </Splitter.Panel>
      </Splitter>
    </Form>
  )
}

export default forwardRef(AiCreate)
