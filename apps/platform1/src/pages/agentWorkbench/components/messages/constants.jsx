export const Role = {
  system: "system",
  user: "user",
  ai: "ai",
  assistant: "assistant"
}

export const FormatMessageMode = {
  /** 只处理换行符、空格、html 转义 */
  zero: "zero",
  /** 只处理一部分 md 语法，如 link、image、code 等 */
  partial: "partial"
  /** 完整的 markdown 处理 */
  // full = 'full',
}
