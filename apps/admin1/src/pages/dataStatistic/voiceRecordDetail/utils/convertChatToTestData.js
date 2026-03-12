/**
 * 将ChatHistory数据转换为TestDataEditModal所需的格式
 * 规则：
 * - 每一轮对话生成一个动态表单项
 * - 同一轮内，多个用户回答用换行符拼接作为请求内容
 * - 同一轮内，多个客服回答用换行符拼接作为期望响应内容
 */

/**
 * 转换聊天记录为测试数据格式
 * @param {Array} chatList - 聊天记录列表
 * @returns {Array} 转换后的请求列表
 */
export const convertChatToTestData = (chatList = []) => {
  if (!Array.isArray(chatList) || chatList.length === 0) {
    return []
  }

  // 提取文本内容
  const extractText = (content) => {
    const tempDiv = document.createElement("div")
    tempDiv.innerHTML = content || ""
    return tempDiv.textContent || tempDiv.innerText || ""
  }

  // 找到第一条空间消息（开场白）作为"喂"的期望响应
  const firstAssistantMsg = chatList.find((item) => item?.side === 0)
  const firstAssistantText = firstAssistantMsg ? extractText(firstAssistantMsg.content) : ""

  // 轮次分组：
  // 一轮 = 若干条用户消息(+可能为空) + 至少一条客服消息；
  // 当出现"用户 -> 客服(一到多) -> 下一个用户"时，上一轮结束。
  const rounds = []
  let current = { user: [], assistant: [] }

  const pushCurrentIfValid = () => {
    const userInput = current.user
      .map((msg) => extractText(msg.content))
      .filter((t) => t && t.trim())
      .join("\n")
    const assistantOutput = current.assistant
      .map((msg) => extractText(msg.content))
      .filter((t) => t && t.trim())
      .join("\n")

    // 只有存在用户输入时，才生成请求项
    if (userInput) {
      rounds.push({ input: userInput, expect: assistantOutput })
    }
  }

  for (const item of chatList) {
    if (item?.side === 1) {
      // 新的用户消息到了，如果之前已经收集到客服消息，说明上一轮结束
      if (current.assistant.length > 0) {
        pushCurrentIfValid()
        current = { user: [], assistant: [] }
      }
      current.user.push(item)
    } else if (item?.side === 0) {
      // 累积客服消息（同一轮内可能有多条）
      current.assistant.push(item)
    }
  }

  // 推入最后一轮
  pushCurrentIfValid()

  // 转为表单所需结构
  const result = []

  // 第一项：请求内容固定为"喂"，期望响应是对话列表中第一条空间消息（开场白）
  if (firstAssistantText) {
    result.push({
      key: `${Date.now()}_0`,
      input: "喂",
      clauseAssertExpectResult: firstAssistantText,
      order: 1
    })
  }

  // 后续项：按照原有轮次，用户输入和空间回答对应
  for (let i = 0; i < rounds.length; i++) {
    result.push({
      key: `${Date.now()}_${i + 1}`,
      input: rounds[i].input,
      clauseAssertExpectResult: rounds[i].expect,
      order: i + 2
    })
  }

  return result
}

/**
 * 从聊天记录中提取所有客服消息作为总结断言期望响应
 * @param {Array} chatList - 聊天记录列表
 * @returns {string} 所有客服消息的内容，用换行符拼接
 */
export const extractSummaryAssertFromChat = (chatList = []) => {
  if (!Array.isArray(chatList) || chatList.length === 0) {
    return ""
  }

  // 提取文本内容
  const extractText = (content) => {
    const tempDiv = document.createElement("div")
    tempDiv.innerHTML = content || ""
    return tempDiv.textContent || tempDiv.innerText || ""
  }

  // 找到所有客服消息（side === 0）
  const assistantMessages = chatList
    .filter((item) => item.side === 0)
    .map((item) => extractText(item.content))
    .filter((text) => text.trim())

  return assistantMessages.join("\n")
}
