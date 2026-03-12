// 供应商映射（根据实际使用的供应商定义）
export const supplierMap = {
  Azure: { color: "blue", label: "亚马逊" },
  Ali: { color: "orange", label: "阿里云" },
  Baidu: { color: "red", label: "百度" },
  Tencent: { color: "purple", label: "腾讯" },
  Volcengine: { color: "cyan", label: "字节火山" },
  Deepseek: { color: "geekblue", label: "Deepseek" },
  Huawei: { color: "lightBlue", label: "华为" },
  Google: { color: "green", label: "谷歌" }
}

// 模型类型映射
export const modelTypeMap = {
  LLM: { value: "大语言模型", color: "blue" },
  EMBEDDING: { value: "向量化模型", color: "green" },
  IMAGE: { value: "图像模型", color: "orange" },
  AUDIO: { value: "音频模型", color: "purple" },
  VIDEO: { value: "视频模型", color: "red" }
}

// 能力映射
export const capabilityMap = {
  function_calling: "函数调用",
  structured_outputs: "结构化输出",
  reasoning: "推理能力",
  web_search: "网络搜索",
  file_search: "文件搜索",
  mcp: "MCP协议"
}

// 输入输出类型映射
export const ioTypeMap = {
  text: "文本",
  image: "图像",
  video: "视频",
  audio: "音频"
}

// 输入输出类型Tag颜色映射
export const ioTagColorMap = {
  input: {
    text: "geekblue",
    image: "geekblue",
    video: "geekblue",
    audio: "geekblue"
  },
  output: {
    text: "geekblue",
    image: "geekblue",
    video: "geekblue",
    audio: "geekblue"
  }
}

// 获取输入输出类型的Tag颜色
export const getIOTagColor = (type, ioType) => {
  return ioTagColorMap[ioType]?.[type] || (ioType === "input" ? "green" : "purple")
}
