/*
 * @Description: 价格相关枚举统一配置
 */

/**
 * 价格类型映射
 */
export const PRICE_TYPE_MAP = {
  normal: "统一收费",
  segmented: "分段收费"
}

/**
 * 货币单位映射
 */
export const CURRENCY_MAP = {
  CNY: "元",
  USD: "美元",
  EUR: "欧元",
  GBP: "英镑",
  JPY: "日元",
  KRW: "韩元"
}

/**
 * 计价单位映射
 */
export const UNIT_MAP = {
  token: "Token",
  request: "请求次数",
  minute: "每分钟",
  hour: "每小时",
  day: "每天",
  month: "每月"
}

/**
 * 数量级映射
 */
export const ORDER_OF_MAGNITUDE_MAP = {
  unit: "token",
  thousand: "千token",
  million: "百万token"
}

/**
 * 价格模式映射
 */
export const PRICE_MODE_MAP = {
  general: "通用模式",
  support_thinking: "支持思考"
}

/**
 * 输入类型映射
 */
export const INPUT_TYPE_MAP = {
  write: "缓存存储",
  read: "缓存命中"
}

/**
 * 默认量级配置映射（根据字段含义设置默认值）
 */
export const DEFAULT_MAGNITUDE_MAP = {
  context_window: "thousand", // 上下文窗口默认千级
  max_input_tokens: "thousand", // 最大输入默认千级
  max_output_tokens: "thousand", // 最大输出默认千级
  rpm: "thousand", // 每分钟请求数默认千级
  tpm: "thousand", // 每分钟Token数默认千级
  parallelism: "unit" // 并发数默认个级
}

/**
 * 输出范围默认值
 */
export const DEFAULT_OUTPUT_RANGE = null

/**
 * 生成量级单位选项数组
 */
export const getMagnitudeUnitOptions = () => {
  return [
    { value: "unit", label: "" },
    { value: "thousand", label: "K" },
    { value: "million", label: "M" }
  ]
}

/**
 * 获取默认量级单位
 */
export const getDefaultMagnitude = (fieldName) => {
  return DEFAULT_MAGNITUDE_MAP[fieldName] || "unit"
}

/**
 * 获取价格类型中文显示
 */
export const getPriceTypeLabel = (type) => {
  return PRICE_TYPE_MAP[type] || type
}

/**
 * 获取货币单位中文显示
 */
export const getCurrencyLabel = (currency) => {
  return CURRENCY_MAP[currency] || currency
}

/**
 * 获取计价单位中文显示
 */
export const getUnitLabel = (unit) => {
  return UNIT_MAP[unit] || unit
}

/**
 * 获取数量级中文显示
 */
export const getOrderOfMagnitude = (magnitude) => {
  return ORDER_OF_MAGNITUDE_MAP[magnitude] || magnitude
}

/**
 * 生成价格类型选项数组
 */
export const getPriceTypeOptions = () => {
  return Object.entries(PRICE_TYPE_MAP).map(([value, label]) => ({
    value,
    label
  }))
}

/**
 * 生成货币单位选项数组
 */
export const getCurrencyOptions = () => {
  return Object.entries(CURRENCY_MAP).map(([value, label]) => ({
    value,
    label
  }))
}

/**
 * 生成计价单位选项数组
 */
export const getUnitOptions = () => {
  return Object.entries(UNIT_MAP).map(([value, label]) => ({
    value,
    label
  }))
}

/**
 * 获取价格模式中文显示
 */
export const getPriceModeLabel = (mode) => {
  return PRICE_MODE_MAP[mode] || mode
}

/**
 * 获取输入类型中文显示
 */
export const getInputTypeLabel = (inputType) => {
  return INPUT_TYPE_MAP[inputType] || inputType
}

/**
 * 生成价格模式选项数组
 */
export const getPriceModeOptions = () => {
  return Object.entries(PRICE_MODE_MAP).map(([value, label]) => ({
    value,
    label
  }))
}

/**
 * 生成输入类型选项数组
 */
export const getInputTypeOptions = () => {
  return Object.entries(INPUT_TYPE_MAP).map(([value, label]) => ({
    value,
    label
  }))
}
