// xflow 改版 常量相关

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

export const NodesV2 = {
  // 输入/工具/调用类型节点
  startNode: {
    width: 240,
    height: 104,
    nodeType: "begin-node_condition-node_skill-node_plugin-node" //parentKeys CONTROL_TOOL_CALL
  },
  // 输出/知识库节点
  endNode: {
    width: 240,
    height: 150,
    nodeType:
      "end-node_search-node_tool-node_webhook-node_identify-language-node_img2-text-node_asr-node_tts-node" //parentKeys  END_SEARCH
  },
  // prompt节点
  promptNode: {
    width: 240,
    height: 312,
    nodeType: "prompt-node_script-node" //parentKeys
  },

  // 常规矩形节点
  rectangleNode: {
    width: 240,
    height: 150,
    nodeType: "" //parentKeys - others
  },

  specialNode: {
    width: 240,
    height: 150,
    nodeType: "search-tool-node"
  }
}
