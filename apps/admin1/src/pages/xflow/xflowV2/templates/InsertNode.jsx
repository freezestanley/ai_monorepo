import { CommonNode } from "./Common"
import { Fragment } from "react"
import { Tag, Button } from "antd"
import { FileSearchOutlined } from "@ant-design/icons"

// @ts-ignore
import icon1 from "../images/icon-1.png"
// @ts-ignore
import icon2 from "../images/icon-2.png"
// @ts-ignore
import icon3 from "../images/icon-3.png"
// @ts-ignore
import icon4 from "../images/icon-4.png"
// @ts-ignore
import icon5 from "../images/icon-5.png"
import { pluginTools } from "../untils"

const matchQueryRange = (queryRange = [], selectedCatalogs = []) => {
  if (!queryRange?.length || !selectedCatalogs?.length) return "--"

  const matchedNames = []

  // 遍历已选择的目录编号
  selectedCatalogs.forEach((catalogNo) => {
    // 在queryRange中查找匹配的目录
    for (const category of queryRange) {
      // 在 category.children 中查找匹配项
      const found = category.children?.find((item) => item.catalogNo === catalogNo)
      if (found) {
        matchedNames.push(`${category.catalogName} / ${found.catalogName}`)
        break
      }
    }
  })

  return matchedNames.join("；") || "--"
}

const findPluginCode = (tools, toolCode) => {
  // 遍历查找匹配的工具
  const findTool = (tools, type) => {
    for (const item of tools) {
      // 如果是插件层级
      if (item.pluginCode) {
        const foundInChildren = item.children?.find((child) => child.toolCode === toolCode)
        if (foundInChildren) {
          return { pluginNo: item.pluginCode, type }
        }
        // 如果有 tools 数组
        const foundInTools = item.tools?.find((tool) => tool.toolCode === toolCode)
        if (foundInTools) {
          return { pluginNo: item.pluginCode, type }
        }
      }
      // 如果是分类层级且有子项
      if (item.children?.length) {
        const found = findTool(item.children, item.value)
        if (found) return found
      }
    }
    return null
  }
  return findTool(tools)
}

const findToolPath = (tools, toolCode) => {
  // 遍历查找匹配的工具
  const findTool = (tools, parentNames = []) => {
    for (const item of tools) {
      // 如果是插件层级
      if (item.pluginCode) {
        const foundInChildren = item.children?.find((child) => child.toolCode === toolCode)
        if (foundInChildren) {
          return [...parentNames, item.title, foundInChildren.toolName].join(" / ")
        }
        // 如果有 tools 数组
        const foundInTools = item.tools?.find((tool) => tool.toolCode === toolCode)
        if (foundInTools) {
          return [...parentNames, item.title, foundInTools.toolName].join(" / ")
        }
      }
      // 如果是分类层级且有子项
      if (item.children?.length) {
        const found = findTool(item.children, [...parentNames, item.title])
        if (found) return found
      }
    }
    return null
  }

  return findTool(tools) || "--"
}

export const InsertNode = (
  name,
  data,
  queryRange,
  availableSkills,
  availablePluginTools,
  toolOptions,
  dataSetList,
  currentInfos,
  botNo,
  parentOrigin,
  workbenchNo
) => {
  // queryRange FAQ 查询范围 知识库目录
  const currentNode = currentInfos?.skillComponentDefinitions?.find(
    (item) => item.nodeId === data?.id
  )
  // console.log(
  // "currentInfos888888",
  // currentInfos,
  // data,
  // currentNode,
  // queryRange,
  // availableSkills
  // pluginTools(availablePluginTools),
  // toolOptions,
  // dataSetList,
  // availablePluginTools
  // )
  switch (name) {
    case "begin-node": // 输入
      return (
        <CommonNode
          topDescription={{
            title: "输入描述",
            description: () => {
              if (
                currentInfos?.releaseStatus === "released" &&
                !currentInfos?.formControlDefinitions?.length
              ) {
                return "msg"
              }
              return `包含字段：${
                currentInfos?.formControlDefinitions
                  ?.map((item) => item.attributeName)
                  .join("；") || "--"
              }`
            }
          }}
          subDescription={null}
        />
      )
    case "end-node": //输出
      return (
        <CommonNode
          topDescription={{
            title: "输出方式",
            description: () => {
              return `${currentNode?.extraInfo?.stream ? "流式输出" : "普通输出" || "--"}`
            }
          }}
          subDescription={{
            title: "解析方式",
            description: () => {
              return `${currentNode?.outputType === "JSON" ? "JSON" : currentNode?.outputType === "MARKDOWN" ? "模板输出" : "文本" || "--"}`
            }
          }}
        />
      )
    case "condition-node": //条件
      return (
        <CommonNode
          topDescription={{
            title: "条件表达式",
            description: () => {
              return `${data?.expressions?.map((item) => item.expression).join("；") || "--"}`
            }
          }}
          subDescription={null}
        />
      )
    case "prompt-node": //大模型-prompt
      return (
        <CommonNode
          topDescription={{
            title: "模型名称",
            description: () => {
              return currentNode?.extraInfo?.enableMultiModel ? (
                <>
                  {currentNode?.extraInfo?.modelList?.map((item, index) => {
                    return (
                      <Fragment key={index}>
                        {item.expression ? (index === 0 ? "IF " : "ELIF ") : " ELSE"}
                        {item.expression || ""} {item.modelType || "--"}
                      </Fragment>
                    )
                  })}
                </>
              ) : (
                `${currentNode?.extraInfo?.modelType || "--"}`
              )
            }
          }}
          maxSubLines={10}
          subDescription={{
            title: () => {
              const promptMode = currentNode?.extraInfo?.promptMode
              let modeText = "快速模式"
              let tagColor = "blue"

              if (promptMode === "PROFESSIONAL") {
                modeText = "专业模式"
                tagColor = "green"
              } else if (promptMode === "CODE") {
                modeText = "代码模式"
                tagColor = "purple"
              }

              return (
                <span>
                  提示词 <Tag color={tagColor}>{modeText}</Tag>
                </span>
              )
            },
            description: () => {
              const promptMode = currentNode?.extraInfo?.promptMode

              if (promptMode === "PROFESSIONAL") {
                // 专业模式：查找 role 为 "system" 的消息内容
                const professionalContents = currentNode?.extraInfo?.professionalContents
                if (Array.isArray(professionalContents)) {
                  const systemMessage = professionalContents.find((msg) => msg.role === "system")
                  return systemMessage?.content || "--"
                }
                return "--"
              } else if (promptMode === "CODE") {
                // 代码模式：显示 script 内容
                const script = currentNode?.extraInfo?.script
                if (!script) return "--"

                return script
              } else {
                // 快速模式：显示原来的 content
                return `${currentNode?.extraInfo?.content || "--"}`
              }
            }
          }}
        />
      )
    case "search-node": //查询 FQA
      return (
        <CommonNode
          topDescription={{
            title: "查询范围",
            descriptionList:
              (matchQueryRange(queryRange, currentNode?.extraInfo?.catalogNos) !== "--" &&
                matchQueryRange(queryRange, currentNode?.extraInfo?.catalogNos)
                  ?.split("；")
                  ?.map((item, index) => {
                    return {
                      descriptionTooltipText: () => item?.replace(/ \/ /g, "-"),
                      description: () => item?.split(" / ")?.[item?.split(" / ")?.length - 1],
                      extraDescriptionRender: () => {
                        const catalogNo = currentNode?.extraInfo?.catalogNos?.[index]
                        const knowledgeBaseNo = queryRange?.find((item) =>
                          item.children?.find((item) => item.catalogNo === catalogNo)
                        )?.knowledgeBaseNo
                        return (
                          !!catalogNo && (
                            <Button
                              type="link"
                              className="!p-0 !text-[12px] !leading-auto !h-auto ml-2"
                              onClick={() => {
                                window.open(
                                  `${parentOrigin}/knowledge/questions?botNo=${botNo}&workbenchNo=appKnowledgeList&knowledgeData=${knowledgeBaseNo || ""}&catalogNo=${catalogNo || ""}`,
                                  "_blank"
                                )
                              }}
                            >
                              <FileSearchOutlined />
                            </Button>
                          )
                        )
                      }
                    }
                  })) ||
              [],
            description: () => {
              return (
                matchQueryRange(queryRange, currentNode?.extraInfo?.catalogNos) === "--" &&
                matchQueryRange(queryRange, currentNode?.extraInfo?.catalogNos)
              )
            }
          }}
          subDescription={{
            title: "查询数量",
            description: () => {
              return `${currentNode?.extraInfo?.size || "--"}`
            }
          }}
        />
      )
    case "document-search-node": //查询文档
      return (
        <CommonNode
          topDescription={{
            title: "查询范围",
            descriptionList:
              (matchQueryRange(queryRange, currentNode?.extraInfo?.catalogNos) !== "--" &&
                matchQueryRange(queryRange, currentNode?.extraInfo?.catalogNos)
                  ?.split("；")
                  ?.map((item, index) => {
                    return {
                      descriptionTooltipText: () => item?.replace(/ \/ /g, "-"),
                      description: () => item?.split(" / ")?.[item?.split(" / ")?.length - 1],
                      extraDescriptionRender: () => {
                        const catalogNo = currentNode?.extraInfo?.catalogNos?.[index]
                        const { knowledgeBaseNo, catalogTypeCode } =
                          queryRange?.find((item) =>
                            item.children?.find((item) => item.catalogNo === catalogNo)
                          ) || {}
                        return (
                          !!catalogNo &&
                          // antron知识库不能点击
                          catalogTypeCode !== "2" && (
                            <Button
                              type="link"
                              className="!p-0 !text-[12px] !leading-auto !h-auto ml-2"
                              onClick={() => {
                                window.open(
                                  `${parentOrigin}/knowledge/list?botNo=${botNo}&workbenchNo=appKnowledgeList&knowledgeData=${knowledgeBaseNo || ""}&catalogNo=${catalogNo || ""}`,
                                  "_blank"
                                )
                              }}
                            >
                              <FileSearchOutlined />
                            </Button>
                          )
                        )
                      }
                    }
                  })) ||
              [],
            description: () => {
              return (
                matchQueryRange(queryRange, currentNode?.extraInfo?.catalogNos) === "--" &&
                matchQueryRange(queryRange, currentNode?.extraInfo?.catalogNos)
              )
            }
          }}
          subDescription={{
            title: "查询数量",
            description: () => {
              return `${currentNode?.extraInfo?.size || "--"}`
            }
          }}
        />
      )
    case "query-dataset-node": //查询数据集
      return (
        <CommonNode
          topDescription={{
            title: "查询范围",
            description: () => {
              // 获取结构编号
              const structureNo = currentNode?.extraInfo?.structureNo
              // 从 dataSetList 中查找匹配的数据集
              const matchedDataSet = dataSetList?.find((item) => item.value === structureNo)
              return matchedDataSet?.label || "--"
            },
            extraDescriptionRender: () => {
              const structureNo = currentNode?.extraInfo?.structureNo
              const matchedDataSet = dataSetList?.find((item) => item.value === structureNo)
              return (
                !!structureNo && (
                  <Button
                    type="link"
                    className="!p-0 !text-[12px] !leading-auto !h-auto ml-2"
                    onClick={() => {
                      window.open(
                        `${parentOrigin}/knowledge/structure?botNo=${botNo}&workbenchNo=appKnowledgeList&structureNo=${structureNo}&catalogNo=${matchedDataSet?.catalogNo || ""}`,
                        "_blank"
                      )
                    }}
                  >
                    <FileSearchOutlined />
                  </Button>
                )
              )
            }
          }}
          subDescription={{
            title: "查询数量",
            description: () => {
              return `${currentNode?.extraInfo?.size || "--"}`
            }
          }}
        />
      )

    case "skill-node": // 调用工作流
      return (
        <CommonNode
          topDescription={{
            title: "调用工作流",
            description: () => {
              // 从 availableSkills 中查找匹配的工作流
              const skillNo = currentNode?.extraInfo?.skillNo
              const allSkills = [
                ...(availableSkills?.subscribedSkills || []),
                ...(availableSkills?.selfSkills || [])
              ]
              const matchedSkill = allSkills.find((skill) => skill.skillNo === skillNo)
              return matchedSkill?.skillName || "--"
            },
            extraDescriptionRender: () => {
              return (
                !!availableSkills?.selfSkills?.find(
                  (item) => item.skillNo === currentNode?.extraInfo?.skillNo
                ) && (
                  <Button
                    type="link"
                    className="!p-0 !text-[12px] !leading-auto !h-auto ml-2"
                    onClick={() => {
                      window.open(
                        `${parentOrigin}/prompt/skillList?botNo=${botNo}&workbenchNo=${workbenchNo}&skillNo=${currentNode?.extraInfo?.skillNo}&isTools=true`,
                        "_blank"
                      )
                    }}
                  >
                    <FileSearchOutlined />
                  </Button>
                )
              )
            }
          }}
          subDescription={null}
        />
      )
    case "plugin-node": // 调用工具
      return (
        <CommonNode
          topDescription={{
            title: "调用工具",
            descriptionTooltipText: () => {
              const toolCode = currentNode?.extraInfo?.toolCode
              return findToolPath(pluginTools(availablePluginTools), toolCode)?.replace(
                / \/ /g,
                "-"
              )
            },
            description: () => {
              const toolCode = currentNode?.extraInfo?.toolCode
              const data = findToolPath(pluginTools(availablePluginTools), toolCode)?.split(" / ")
              return data?.[data?.length - 1]?.trim()
            },
            extraDescriptionRender: () => {
              const { pluginNo, type } =
                findPluginCode(
                  pluginTools(availablePluginTools),
                  currentNode?.extraInfo?.toolCode
                ) || {}
              return (
                !!pluginNo && (
                  <Button
                    type="link"
                    className="!p-0 !text-[12px] !leading-auto !h-auto ml-2"
                    onClick={() => {
                      window.open(
                        `${parentOrigin}/prompt/pluginList?botNo=${botNo}&workbenchNo=${workbenchNo}&pluginNo=${pluginNo}&isTools=true&pluginType=${type}`,
                        "_blank"
                      )
                    }}
                  >
                    <FileSearchOutlined />
                  </Button>
                )
              )
            }
          }}
          subDescription={null}
        />
      )
    case "tool-node": // 工具-Toolkit
      return (
        <CommonNode
          topDescription={{
            title: "工具类型",
            description: () => {
              // 根据 toolCode 匹配工具名称
              const toolCode = currentNode?.extraInfo?.toolCode
              const matchedTool = toolOptions?.find((tool) => tool.code === toolCode)
              return matchedTool?.name || "--"
            }
          }}
          subDescription={null}
        />
      )
    case "pic-generator-node": // 工具-文生图
      return (
        <CommonNode
          topDescription={{
            title: "输入参数",
            description: () => {
              // 获取变量定义列表
              const variables = currentNode?.variableDefinitions || []
              return (
                variables
                  .map((variable) => {
                    // 如果有描述，则添加括号说明
                    const description = variable.description ? ` (${variable.description})` : ""
                    return `${variable.valueExpression}${description}`
                  })
                  .join("；") || "--"
              )
            }
          }}
          subDescription={{
            title: "输出变量名",
            description: () => {
              return `${currentNode?.outputName || "--"}`
            }
          }}
        />
      )
    case "video-generator-node": // 工具-视频生成
      return (
        <CommonNode
          topDescription={{
            title: "输入参数",
            description: () => {
              // 获取变量定义列表
              if (currentNode?.extraInfo?.generateMode === "jmVividMode") {
                return `视频URL：${currentNode?.extraInfo?.vividModeConfig?.videoUrlExpression || "--"}；图片URL：${currentNode?.extraInfo.vividModeConfig?.imageUrlExpression || "--"}`
              }
              return `提示词：${currentNode?.extraInfo.prompt || "--"}；场景图：${currentNode?.extraInfo.fileUrl || "--"}`
            }
          }}
          subDescription={{
            title: "输出变量名",
            description: () => {
              return `${currentNode?.outputName || "--"}`
            }
          }}
        />
      )
    case "webhook-node": //工具-Webhook
      return (
        <CommonNode
          topDescription={{
            title: "调用地址",
            description: () => {
              return `${currentNode?.extraInfo?.callUrl || "--"}`
            }
          }}
          subDescription={{
            title: "调用方式",
            description: () => {
              return `${currentNode?.extraInfo?.httpMethodName || "--"}`
            }
          }}
        />
      )
    case "script-node": //工具-Script
      return (
        <CommonNode
          topDescription={{
            title: "脚本类型",
            description: () => {
              return `${currentNode?.extraInfo?.scriptType || "--"}`
            }
          }}
          maxSubLines={10}
          subDescription={{
            title: "脚本内容",
            description: () => {
              return `${currentNode?.extraInfo?.script || "--"}`
            }
          }}
        />
      )

    case "identify-language-node": //工具-识别语种
      return (
        <CommonNode
          topDescription={{
            title: "输入参数",
            description: () => {
              // 获取变量定义列表
              const variables = currentNode?.variableDefinitions || []
              return (
                variables
                  .map((variable) => {
                    // 如果有描述，则添加括号说明
                    const description = variable.description ? ` (${variable.description})` : ""
                    return `${variable.valueExpression}${description}`
                  })
                  .join("；") || "--"
              )
            }
          }}
          subDescription={{
            title: "输出变量名",
            description: () => {
              return `${currentNode?.outputName || "--"}`
            }
          }}
        />
      )
    case "img2-text-node": //工具-OCR
      return (
        <CommonNode
          topDescription={{
            title: "输入参数",
            description: () => {
              // 获取变量定义列表
              const variables = currentNode?.variableDefinitions || []
              return (
                variables
                  .map((variable) => {
                    // 如果有描述，则添加括号说明
                    const description = variable.description ? ` (${variable.description})` : ""
                    return `${variable.valueExpression}${description}`
                  })
                  .join("；") || "--"
              )
            }
          }}
          subDescription={{
            title: "输出变量名",
            description: () => {
              return `${currentNode?.outputName || "--"}`
            }
          }}
        />
      )
    case "search-tool-node": //工具-搜索
      return (
        <CommonNode
          topDescription={{
            title: "输入参数",
            description: () => {
              // 获取变量定义列表
              const variables = currentNode?.variableDefinitions || []
              return (
                variables
                  .map((variable) => {
                    // 如果有描述，则添加括号说明
                    const description = variable.description ? ` (${variable.description})` : ""
                    return `${variable.valueExpression}${description}`
                  })
                  .join("；") || "--"
              )
            }
          }}
          subDescription={{
            title: "输出变量名",
            description: () => {
              return `${currentNode?.outputName || "--"}`
            }
          }}
        />
      )
    case "web-search-node": // 工具-web搜索
      return (
        <CommonNode
          topDescription={{
            title: "输入参数",
            description: () => {
              // 获取变量定义列表
              const variables = currentNode?.variableDefinitions || []
              return (
                variables
                  .map((variable) => {
                    // 如果有描述，则添加括号说明
                    const description = variable.description ? ` (${variable.description})` : ""
                    return `${variable.valueExpression}${description}`
                  })
                  .join("；") || "--"
              )
            }
          }}
          subDescription={{
            title: "输出变量名",
            description: () => {
              return `${currentNode?.outputName || "--"}`
            }
          }}
        />
      )
    case "asr-node": //工具-ASR
      return (
        <CommonNode
          topDescription={{
            title: "输入参数",
            description: () => {
              // 获取变量定义列表
              const variables = currentNode?.variableDefinitions || []
              return (
                variables
                  .map((variable) => {
                    // 如果有描述，则添加括号说明
                    const description = variable.description ? ` (${variable.description})` : ""
                    return `${variable.valueExpression}${description}`
                  })
                  .join("；") || "--"
              )
            }
          }}
          subDescription={{
            title: "输出变量名",
            description: () => {
              return `${currentNode?.outputName || "--"}`
            }
          }}
        />
      )
    case "tts-node": //工具-TTS
      return (
        <CommonNode
          topDescription={{
            title: "输入参数",
            description: () => {
              // 获取变量定义列表
              const variables = currentNode?.variableDefinitions || []
              return (
                variables
                  .map((variable) => {
                    // 如果有描述，则添加括号说明
                    const description = variable.description ? ` (${variable.description})` : ""
                    return `${variable.valueExpression}${description}`
                  })
                  .join("；") || "--"
              )
            }
          }}
          subDescription={{
            title: "输出变量名",
            description: () => {
              return `${currentNode?.outputName || "--"}`
            }
          }}
        />
      )
    default:
      return null
  }
}

export const InsertIcon = (data) => {
  switch (data?.name) {
    case "begin-node":
    case "end-node": // 开始-输入-条件
    case "condition-node":
      return icon1

    case "prompt-node":
      return icon2
    case "search-node":
    case "document-search-node":
    case "query-dataset-node":
      return icon3
    case "skill-node":
    case "plugin-node":
      return icon4
    default:
      return icon5
  }
}
