/*
 * @Author: dyton
 * @Date: 2023-10-16 14:52:58
 * @Descripttion: 文件描述
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2023-10-24 16:20:23
 * @FilePath: /za-aigc-platform-admin-static/src/pages/xflow/custom-nodes.jsx
 * Copyright (c) 2023 by ZA-智能中台, All Rights Reserved.
 */
import Iconfont from "@/components/Icon"
import { NodeContent } from "./react-node/content"
import "./index.less"

// @ts-ignore
import icon1 from "./xflowV2/images/icon-1.png"
// @ts-ignore
import icon2 from "./xflowV2/images/icon-2.png"
// @ts-ignore
import icon3 from "./xflowV2/images/icon-3.png"
// @ts-ignore
import icon4 from "./xflowV2/images/icon-4.png"
// @ts-ignore
import icon5 from "./xflowV2/images/icon-5.png"
export const customNodes = []
export const customNodesMap = {
  "begin-node": {
    nodeType: "START",
    nodeClassification: "CONTROL"
  },
  "end-node": {
    nodeType: "END",
    nodeClassification: "CONTROL"
  },
  "condition-node": {
    nodeType: "SWITCH",
    nodeClassification: "CONTROL"
  },
  "prompt-node": {
    nodeType: "PROMPT_TEMPLATE",
    nodeClassification: "LLM"
  },
  "agent-node": {
    nodeType: "AGENT",
    nodeClassification: "LLM"
  },
  "multimodal-node": {
    nodeType: "MULTI_MODAL",
    nodeClassification: "LLM"
  },
  "search-node": {
    nodeType: "SEARCH_KNOWLEDGE",
    nodeClassification: "SEARCH"
  },
  "document-search-node": {
    nodeType: "SEARCH_DOCUMENT",
    nodeClassification: "SEARCH"
  },
  "query-dataset-node": {
    nodeType: "SEARCH_STRUCTURE",
    nodeClassification: "SEARCH"
  },
  "tool-node": {
    nodeType: "TOOL",
    nodeClassification: "TOOL"
  },
  "pic-generator-node": {
    nodeType: "TTI",
    nodeClassification: "TOOL"
  },
  "video-generator-node": {
    nodeType: "ITV",
    nodeClassification: "TOOL"
  },
  "script-node": {
    nodeType: "SCRIPT",
    nodeClassification: "TOOL"
  },
  "webhook-node": {
    nodeType: "API_AGENT",
    nodeClassification: "TOOL"
  },
  "identify-language-node": {
    nodeType: "LANGUAGE_DETECTOR",
    nodeClassification: "TOOL"
  },
  "img2-text-node": {
    nodeType: "OCR",
    nodeClassification: "TOOL"
  },
  "session-variables-node": {
    nodeType: "SESSION_VARIABLES",
    nodeClassification: "TOOL"
  },
  "search-tool-node": {
    nodeType: "NET_SEARCH",
    nodeClassification: "TOOL"
  },
  "web-search-node": {
    nodeType: "WEB_SEARCH",
    nodeClassification: "TOOL"
  },
  "asr-node": {
    nodeType: "ASR",
    nodeClassification: "TOOL"
  },
  "tts-node": {
    nodeType: "TTS",
    nodeClassification: "TOOL"
  },
  "skill-node": {
    nodeType: "SKILL",
    nodeClassification: "CALL"
  },
  "plugin-node": {
    nodeType: "PLUGIN_TOOL",
    nodeClassification: "CALL"
  }
}
/**
 * @description: 分类ICON
 * @return {*}
 */
export const customNodeIcon = {
  CONTROL: <img className="w-[24px] h-[24px] !align-bottom -mt-[2px] block" src={icon1} alt="" />, //<Iconfont type={"icon-kongzhi"} />,
  TOOL: (
    <img className="w-[21px] h-[21px] !align-bottom -mt-[2px] mr-[4px] block" src={icon5} alt="" />
  ), //<Iconfont type={"icon-TOOL"} />,
  LLM: <img className="w-[24px] h-[24px] !align-bottom -mt-[2px] block  " src={icon2} alt="" />, //<Iconfont type={"icon-LLM"} />,
  AGENT: <img className="w-[24px] h-[24px] !align-bottom -mt-[2px] block" src={icon4} alt="" />, //<Iconfont type={"icon-Agent1"} />,
  CALL: <img className="w-[24px] h-[24px] !align-bottom -mt-[2px] block" src={icon4} alt="" />, // <Iconfont type={"icon-lingxishiji"} />,
  KNOWLEDGE_BASE: (
    <img className="w-[24px] h-[24px] !align-bottom -mt-[2px] block" src={icon3} alt="" />
  ) //<Iconfont type={"icon-Search"} />
}

/**
 * @description: 画布组件默认大小
 * @title  nodeClassificationName
 * @key  nodeClassification
 * @return {*}
 */
const defaultStyle = {
  width: 110,
  height: 60
}
const defaultStyleV2_1 = {
  width: 240,
  height: 104
}
const defaultStyleV2_2 = {
  width: 240,
  height: 150
}
const defaultStyleV2_3 = {
  width: 240,
  height: 312
}
const defaultStyleV2_4 = {
  width: 240,
  height: 200
}
/**
 * @description: 画布分类主题色号
 * @return {*}
 */
const nodeTheme = {
  // CONTROL: "#999",
  // TOOL: "#EAAB0A",
  // LLM: "#7F56D9",
  // AGENT: "#06C268",
  // CALL: "#096dd9",
  // KNOWLEDGE_BASE: "#56C2FF"

  CONTROL: "#F5F7FA",
  TOOL: "#F5F7FA",
  LLM: "#F5F7FA",
  AGENT: "#F5F7FA",
  CALL: "#F5F7FA",
  KNOWLEDGE_BASE: "#F5F7FA"
}
const NodeClassIcon = (key, title) => (
  <div className="node-class-header">
    <span className="node-class-icons" style={{ color: nodeTheme[key] }}>
      {customNodeIcon?.[key]}
    </span>
    <span>{title}</span>
  </div>
)
/**
 * @description: 分类基础属性
 * @param {*} key
 * @param {*} title
 * @return {*}
 */
const nodeClassInfo = (key, title) => ({
  key,
  title: NodeClassIcon(key, title)
})
/**
 * @description: 画布分类
 * @return {*}
 */

export const customNodesClass = [
  {
    ...nodeClassInfo("CONTROL", "控制"),
    nodes: [
      {
        component: (p) => <NodeContent {...p} type={"circle"} theme={nodeTheme.CONTROL} />,
        popover: () => <div>输入节点</div>,
        name: "begin-node",
        label: "输入",
        // width: 240, //70,
        // height: 104 //40
        ...defaultStyleV2_1
      },
      {
        component: (p) => <NodeContent {...p} type={"circle"} theme={nodeTheme.CONTROL} />,
        popover: () => <div>输出节点</div>,
        name: "end-node",
        label: "输出",
        // width: 240, //70,
        // height: 150//40
        ...defaultStyleV2_2
      },
      {
        component: (p) => <NodeContent {...p} type="circle" theme={nodeTheme.CONTROL} />, //type = condition
        popover: () => <div>条件节点</div>,
        name: "condition-node",
        label: "条件",
        // width: 240, //100,
        // height: 104 //55
        ...defaultStyleV2_1
      }
    ]
  },
  {
    ...nodeClassInfo("LLM", "大模型"),
    nodes: [
      {
        component: (p) => <NodeContent {...p} type="circle" theme={nodeTheme.LLM} />,
        popover: () => <div>Prompt节点</div>,
        name: "prompt-node",
        label: "Prompt",
        // ...defaultStyle
        ...defaultStyleV2_3
      },
      {
        component: (p) => <NodeContent {...p} type="circle" theme={nodeTheme.LLM} />,
        popover: () => <div>Agent</div>,
        name: "agent-node",
        label: "Agent",
        // ...defaultStyle,
        ...defaultStyleV2_3,
        visible: false
      },
      {
        component: (p) => <NodeContent {...p} type="circle" theme={nodeTheme.LLM} />,
        popover: () => <div>多模态组件</div>,
        name: "multimodal-node",
        label: "多模态",
        // ...defaultStyle,
        ...defaultStyleV2_3,
        visible: false
      }
    ]
  },
  {
    ...nodeClassInfo("KNOWLEDGE_BASE", "知识库"),
    nodes: [
      {
        component: (p) => <NodeContent {...p} type="circle" theme={nodeTheme.KNOWLEDGE_BASE} />,
        popover: () => <div>查询问答</div>,
        name: "search-node",
        label: "查询问答",
        // ...defaultStyle,
        ...defaultStyleV2_4
      },
      {
        component: (p) => <NodeContent {...p} type="circle" theme={nodeTheme.KNOWLEDGE_BASE} />,
        popover: () => <div>查询文档</div>,
        name: "document-search-node",
        label: "查询文档",
        // ...defaultStyle,
        ...defaultStyleV2_4
      },
      {
        component: (p) => <NodeContent {...p} type="circle" theme={nodeTheme.KNOWLEDGE_BASE} />,
        popover: () => <div>查询数据集</div>,
        name: "query-dataset-node",
        label: "查询数据集",
        // ...defaultStyle,
        ...defaultStyleV2_2
      }
    ]
  },
  {
    ...nodeClassInfo("CALL", "调用"),
    nodes: [
      {
        component: (p) => <NodeContent {...p} type="circle" theme={nodeTheme.CALL} />,
        popover: () => <div>调用工作流节点</div>,
        name: "skill-node",
        label: "调用工作流",
        // ...defaultStyle,
        ...defaultStyleV2_1
      },
      {
        component: (p) => <NodeContent {...p} type="circle" theme={nodeTheme.CALL} />,
        popover: () => <div>调用工具节点</div>,
        name: "plugin-node",
        label: "调用工具",
        // ...defaultStyle,
        ...defaultStyleV2_1
      }
    ]
  },
  {
    ...nodeClassInfo("TOOL", "工具"),
    nodes: [
      {
        component: (p) => <NodeContent {...p} type="circle" theme={nodeTheme.TOOL} />,
        popover: () => <div>Tool节点</div>,
        name: "tool-node",
        label: "Toolkit",
        // ...defaultStyle,
        ...defaultStyleV2_1
      },
      {
        component: (p) => <NodeContent {...p} type="circle" theme={nodeTheme.TOOL} />,
        popover: () => <div>文生图</div>,
        name: "pic-generator-node",
        label: "文生图",
        // ...defaultStyle,
        ...defaultStyleV2_2
      },
      {
        component: (p) => <NodeContent {...p} type="circle" theme={nodeTheme.TOOL} />,
        popover: () => <div>视频生成</div>,
        name: "video-generator-node",
        label: "视频生成",
        // ...defaultStyle,
        ...defaultStyleV2_2
      },
      {
        component: (p) => <NodeContent {...p} type="circle" theme={nodeTheme.TOOL} />,
        popover: () => <div>Webhook节点</div>,
        name: "webhook-node",
        label: "Webhook",
        // ...defaultStyle,
        ...defaultStyleV2_2
      },
      {
        component: (p) => <NodeContent {...p} type="circle" theme={nodeTheme.TOOL} />,
        popover: () => <div>Script节点</div>,
        name: "script-node",
        label: "Script",
        // ...defaultStyle,
        ...defaultStyleV2_3
      },
      {
        component: (p) => <NodeContent {...p} type="circle" theme={nodeTheme.TOOL} />,
        popover: () => <div>识别语种</div>,
        name: "identify-language-node",
        label: "识别语种",
        // ...defaultStyle,
        ...defaultStyleV2_2
      },
      // {
      //   component: (p) => <NodeContent {...p} theme={nodeTheme.TOOL} />,
      //   popover: () => <div>会话变量</div>,
      //   name: "session-variables-node",
      //   label: "会话变量",
      //   ...defaultStyle
      // },
      {
        component: (p) => <NodeContent {...p} type="circle" theme={nodeTheme.TOOL} />,
        popover: () => <div>OCR</div>,
        name: "img2-text-node",
        label: "OCR",
        // ...defaultStyle
        ...defaultStyleV2_2
      },
      {
        component: (p) => <NodeContent {...p} type="circle" theme={nodeTheme.TOOL} />,
        popover: () => <div>搜索</div>,
        name: "search-tool-node",
        label: "搜索",
        // ...defaultStyle
        ...defaultStyleV2_2,
        visible: false
      },
      {
        component: (p) => <NodeContent {...p} type="circle" theme={nodeTheme.TOOL} />,
        popover: () => <div>Web搜索</div>,
        name: "web-search-node",
        label: "Web搜索",
        // ...defaultStyle,
        ...defaultStyleV2_2
      },
      {
        component: (p) => (
          <NodeContent {...p} type="circle" theme={nodeTheme.TOOL} originTitle="ASR音转文" />
        ),
        popover: () => <div>ASR音转文</div>,
        name: "asr-node",
        label: "ASR音转文",
        // ...defaultStyle
        ...defaultStyleV2_2
      },
      {
        component: (p) => (
          <NodeContent {...p} type="circle" theme={nodeTheme.TOOL} originTitle="TTS文转音" />
        ),
        popover: () => <div>TTS文转音</div>,
        name: "tts-node",
        label: "TTS文转音",
        // ...defaultStyle
        ...defaultStyleV2_2
      }
    ]
  },
  {
    ...nodeClassInfo("AGENT", "工作流"),
    nodes: []
  }
]
