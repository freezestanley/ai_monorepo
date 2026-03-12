// @ts-nocheck
import { JsonSchemaForm, XFlowNodeCommands, XFlowEdgeCommands } from "@antv/xflow"
import NodeComponent from "./NodeComponent/PromptAndMultiModalComponent"
import AgentComponent from "./NodeComponent/AgentComponent"
import MultimodalComponent from "./NodeComponent/MultimodalComponent"

import EdgeComponent from "./EdgeComponent"
import ConditionNode from "./NodeComponent/ConditionNode"
import "./index.scss"
import { useRef, useState, useEffect, useLayoutEffect } from "react"
import EndNode from "./NodeComponent/EndNode"
import React from "react"
import SearchComponent from "./NodeComponent/FAQComponent"
import ToolComponent from "./NodeComponent/ToolComponent"
import PicGeneratorComponent from "./NodeComponent/PicGeneratorComponent"
import VideoGeneratorComponent from "./NodeComponent/VideoGeneratorComponent"
import WebhookComponent from "./NodeComponent/WebhookComponent"
import ScriptComponent from "./NodeComponent/ScriptComponent"

import { CloseOutlined } from "@ant-design/icons"
import { Button } from "antd"
import useFormDisabled from "@/pages/xflow/hooks/useFormDisabled"
import DocumentSearchComponent from "./NodeComponent/DocumentSearchComponent"
import QueryDatasetComponent from "./NodeComponent/QueryDatasetComponent"
import IdentifyLanguageComponent from "./NodeComponent/IdentifyLanguageComponent"
import Img2TextComponent from "./NodeComponent/OCRComponent"
import SessionVariablesComponent from "./NodeComponent/SessionVariablesComponent"
import StartNode from "./NodeComponent/StartNode"
import SearchToolComponent from "./NodeComponent/SearchToolComponent"
import WebSearchComponent from "./NodeComponent/WebSearchComponent"
import ASRComponent from "./NodeComponent/ASRComponent"
import TTSComponent from "./NodeComponent/TTSComponent"
import SkillComponent from "./NodeComponent/CallSkillComponent"
import PluginComponent from "./NodeComponent/CallPluginToolComponent"
import { useLocation } from "react-router-dom"
import queryString from "query-string"

const hideArr = ["canvas"]
const nodeComponents = {
  "begin-node": StartNode,
  "end-node": EndNode,
  "prompt-node": NodeComponent,
  "agent-node": AgentComponent,
  "multimodal-node": MultimodalComponent,
  "condition-node": ConditionNode,
  "search-node": SearchComponent,
  "tool-node": ToolComponent,
  "pic-generator-node": PicGeneratorComponent,
  "video-generator-node": VideoGeneratorComponent,
  "webhook-node": WebhookComponent,
  "script-node": ScriptComponent,
  "document-search-node": DocumentSearchComponent,
  "query-dataset-node": QueryDatasetComponent,
  "identify-language-node": IdentifyLanguageComponent,
  "img2-text-node": Img2TextComponent,
  "session-variables-node": SessionVariablesComponent,
  "search-tool-node": SearchToolComponent,
  "web-search-node": WebSearchComponent,
  "asr-node": ASRComponent,
  node: NodeComponent,
  "tts-node": TTSComponent,
  "skill-node": SkillComponent,
  "plugin-node": PluginComponent
}

const specialPosNodes = ["begin-node", "end-node", "condition-node"]

const formSchemaService = async (args) => {
  console.log(args)
  return {}
}

const CustomFlowchartFormPanel = (props) => {
  const [currentTargetType, setCurrentTargetType] = useState(null) // 创建一个状态来存储 targetType
  const { currentSkillInfo } = props
  const [isDisabled] = useFormDisabled()

  const getCustomRenderComponent = (targetType, _targetData, _modelService, commandService) => {
    console.log("节点被点击了", targetType, _targetData)

    setCurrentTargetType(targetType) // 更新状态

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const location = useLocation()
    const { skillNo } = queryString.parse(location.search)
    let targetData = _targetData
    try {
      targetData =
        JSON.parse(localStorage.getItem(`graphData_${skillNo}`))?.nodes.find(
          (item) => item.id === _targetData?.id
        ) || _targetData
    } catch (error) {
      console.log("targetData error", error)
    }

    const updateEdge = (edge) => {
      return commandService.executeCommand(XFlowEdgeCommands.UPDATE_EDGE.id, {
        edgeConfig: edge,
        options: {}
      })
    }

    if (targetType === "node" && nodeComponents[targetData.name]) {
      // setPos(specialPosNodes.includes(targetData?.name) ? 0 : 600)
      const Component = nodeComponents[targetData.name]
      return () => (
        <Component
          targetData={targetData}
          _modelService={_modelService}
          appData={props.appData}
          commandService={commandService}
          currentSkillInfo={currentSkillInfo}
        />
      )
    }

    if (targetType === "edge") {
      return () => (
        <EdgeComponent
          updateEdge={updateEdge}
          targetData={targetData}
          _modelService={_modelService}
        />
      )
    }
    if (targetType === "canvas") {
      return () => null
    }
    return () => null
  }
  /**
   * @description: 全局新增关闭
   * @return {*}
   */
  const globalCustomContainer = (targetType, _targetData, _modelService, commandService) => {
    return () => (
      <div className={`custom-components ${isDisabled && "hide-debug-panel"}`}>
        {getCustomRenderComponent(targetType, _targetData, _modelService, commandService)()}
      </div>
    )
  }

  // useLayoutEffect(() => {
  //   if (formPanelVisible) {
  //     const sidebarElement = document.querySelector(".xflow-json-schema-form.xflow-workspace-panel")
  //     sidebarElement?.focus()
  //   }
  // }, [formPanelVisible])

  // TODO: 确认这里是否需要
  // useEffect(() => {
  //   const element = document.querySelector(".xflow-json-schema-form.xflow-workspace-panel")
  //   const needHide = hideArr.includes(currentTargetType)
  //   if (element && needHide) {
  //     element.style.display = "none"
  //   } else if (element) {
  //     element.style.display = "block"
  //   }
  // }, [currentTargetType, formPanelVisible]) // 当 currentTargetType 改变时运行

  return (
    <JsonSchemaForm
      targetType={["node", "edge"]}
      formSchemaService={formSchemaService}
      getCustomRenderComponent={globalCustomContainer}
    />
  )
}

export default React.memo(CustomFlowchartFormPanel)
