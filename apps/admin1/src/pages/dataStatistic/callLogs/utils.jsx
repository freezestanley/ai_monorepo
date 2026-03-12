export const getTagColor = (code) => {
  const tagColorMap = {
    TO_BE_EXAMINE: "orange", // 待审核
    REJECT_EXAMINE: "red", // 未通过
    TO_BE_PROCESS: "volcano", // 待受理
    PROCESSING: "blue", // 优化中
    HAS_PROCESSED: "green", // 已优化
    REJECT_PROCESS: "default" // 已搁置
  }
  return tagColorMap[code] || "#d9d9d9"
}

export const getStatusColor = (code) => {
  const statusColorMap = {
    TO_BE_EXAMINE: "warning", // 待审核 - 黄色
    REJECT_EXAMINE: "error", // 未通过 - 红色
    TO_BE_PROCESS: "warning", // 待受理 - 蓝色
    PROCESSING: "processing", // 优化中 - 蓝色
    HAS_PROCESSED: "success", // 已优化 - 绿色
    REJECT_PROCESS: "default" // 已搁置 - 默认灰色
  }
  return statusColorMap[code] || "default"
}

export const getOptimizationStatusColor = (code) => {
  // ["#73d13d", "#40a9ff", "#ffc53d", "#ff7a45", "#ff4d4f", "#bfbfbf"]
  const optimizationStatusColorMap = {
    HAS_PROCESSED: "#73d13d",
    PROCESSING: "#40a9ff",
    TO_BE_EXAMINE: "#ffc53d",
    TO_BE_PROCESS: "#ff7a45",
    REJECT_EXAMINE: "#ff4d4f",
    REJECT_PROCESS: "#bfbfbf"
  }
  if (!code) {
    return Object.keys(optimizationStatusColorMap).map((key) => optimizationStatusColorMap[key])
  }
  return optimizationStatusColorMap[code] || "#bfbfbf"
}

export const getChartColors = () => {
  return [
    "#4D7EE2",
    "#2EACE2",
    "#E34F6F",
    "#708AF5",
    "#8370EE",
    "#36BA77",
    "#E9A21F",
    "#77B830",
    "#E058B1",
    "#69D0BF",
    "#4E5BA6",
    "#9A7A60"
  ]
}

export const getAvailableOptions = (statusList, currentStatus = {}) => {
  const code = currentStatus?.code

  switch (code) {
    case "TO_BE_EXAMINE": // 待审核
      return statusList.filter((item) => ["REJECT_EXAMINE", "TO_BE_PROCESS"].includes(item.code))
    case "REJECT_EXAMINE": // 不通过
      return statusList.filter((item) => ["TO_BE_PROCESS"].includes(item.code))
    case "TO_BE_PROCESS": // 待受理
    case "PROCESSING": // 优化中
    case "HAS_PROCESSED": // 已优化
    case "REJECT_PROCESS": // 搁置
      return statusList.filter((item) =>
        ["TO_BE_PROCESS", "PROCESSING", "HAS_PROCESSED", "REJECT_PROCESS"].includes(item.code)
      )
    default:
      return []
  }
}
