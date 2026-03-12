/**
 * 监听父级 iframe 传入的 postMessage 消息
 * @param {Function} callback - 回调函数，接收消息数据
 * @returns {Function} - 返回清理函数，用于移除事件监听
 */
export const listenParentIframeMessage = (callback) => {
  const handleMessage = (event) => {
    // 验证消息来源
    if (event.source !== window.parent) return

    const message = event.data

    // 验证消息类型
    if (message?.type === "SEND_AGENT_CLIENT_CE") {
      const { data } = message

      // 验证数据类型
      if (data?.type && ["save", "reference"].includes(data.type)) {
        callback({
          type: data.type,
          id: data.id,
          fileName: data.fileName
        })
      }
    }

    // 处理文件状态消息
    if (message?.type === "FILE_STATUS_UPDATE") {
      const data = message.data
      console.log("接收到文件状态更新:", data)
      if (Array.isArray(data)) {
        callback({
          type: "fileStatus",
          files: data.map((file) => ({
            id: file.dataSetId,
            status: Number(file.status), // 状态: 1-处理中, 2-已完成, 3-失败
            runNum: file.runNum || "100", // 当前处理进度
            totalNum: file.totalNum || "100", // 总进度
            fileName: file.fileName,
            // 添加原始数据，方便调试
            originalData: { ...file }
          }))
        })
      }
    }

    // 处理 SEND_AGENT_IFRAME 类型的消息，初始化时接收
    if (message?.type === "SEND_AGENT_IFRAME") {
      callback({
        type: "initData",
        data: message.data
      })
    }

    // ... existing cases ...
  }

  // 添加消息监听
  window.addEventListener("message", handleMessage)

  // 返回清理函数
  return () => {
    window.removeEventListener("message", handleMessage)
  }
}

/**
 * 文件状态管理，将消息中的文件状态信息转换为组件可以使用的格式
 * @param {Array} files - 消息中的文件状态数组
 * @param {Array} currentFiles - 当前组件中的文件数组
 * @returns {Array} - 更新后的文件数组
 */
export const updateFilesStatus = (statusFiles, currentFiles) => {
  if (!statusFiles || !currentFiles) return currentFiles

  // 创建一个新的文件数组，保持原有引用不变
  return currentFiles.map((file) => {
    // 查找对应的状态更新
    const statusFile = statusFiles.find((statusFile) => statusFile.id === file.uid)

    if (statusFile) {
      // 将 status 转换为数字，确保处理一致性
      const statusNum =
        typeof statusFile.status === "string"
          ? parseInt(statusFile.status, 10)
          : Number(statusFile.status || 1)

      // 如果状态为2，表示已完成
      if (statusNum === 2) {
        return {
          ...file,
          status: "done", // 文件已上传完成
          loading: false, // 不再处理中
          success: true, // 处理成功
          runNum: statusFile.totalNum || 100, // 使用总数作为当前进度
          totalNum: statusFile.totalNum || 100,
          actionType: "click", // 成功后可点击
          progress: 100 // 直接设置为100%
        }
      }

      // 如果状态为3，表示失败
      if (statusNum === 3) {
        return {
          ...file,
          status: "error", // 文件处理失败
          loading: false, // 不再处理中
          success: false, // 处理失败
          runNum: statusFile.runNum,
          totalNum: statusFile.totalNum,
          actionType: "error", // 显示错误状态
          progress: statusFile.totalNum
            ? Math.floor((statusFile.runNum / statusFile.totalNum) * 100)
            : 0
        }
      }

      // 状态为1或其他，表示处理中
      return {
        ...file,
        status: "done", // 文件已上传完成
        loading: true, // 正在处理中
        success: false, // 尚未成功
        runNum: statusFile.runNum, // 当前处理进度
        totalNum: statusFile.totalNum, // 总进度
        actionType: "loading", // 显示加载中
        progress: statusFile.totalNum
          ? Math.floor((statusFile.runNum / statusFile.totalNum) * 100)
          : 0 // 计算百分比进度
      }
    }

    return file
  })
}

/**
 * 计算文件处理进度
 * @param {number|string} runNum - 当前处理的数量
 * @param {number|string} totalNum - 总数量
 * @param {number|string} status - 文件状态: 1-处理中, 2-已完成, 3-失败
 * @returns {number} - 进度百分比，0-100
 */
export const calculateFileProgress = (runNum, totalNum, status) => {
  // 确保转换为数字类型
  const statusNum = typeof status === "string" ? parseInt(status, 10) : Number(status || 1)

  // 如果状态为2(已完成)，直接返回100%
  if (statusNum === 2) {
    return 100
  }

  // 确保转换为数字类型
  const run = typeof runNum === "string" ? parseInt(runNum, 10) : Number(runNum || 0)
  const total = typeof totalNum === "string" ? parseInt(totalNum, 10) : Number(totalNum || 1)

  if (!total || total <= 0) return 0
  const progress = Math.floor((run / total) * 100)
  return Math.min(progress, 100) // 确保不超过100%
}

export const handleFileClick = (file) => {
  console.log("点击文件:", file)

  // 首先检查文件的status属性，如果是2（已完成）则允许点击
  if (file.status === 2) {
    // 文件已完成，允许点击
    // 向父窗口发送消息
    // 解析uid，如果包含时间戳，则提取出原始id
    const originalId = extractOriginalId(file.uid)

    window.parent.postMessage(
      {
        type: "SEND_AGENT_IFRAME",
        data: {
          id: originalId,
          fileName: file.name || "数据文件",
          url: file.url || "",
          defaultIconType: file.type && file.type.includes("image") ? "IMAGE" : "FILE"
        }
      },
      "*"
    )
    return
  }

  // 如果文件仍在处理中，则不允许点击
  if (file.loading || file.actionType === "loading" || file.status === 1) {
    console.log("文件正在处理中，暂不可查看")
    // 可以在这里添加提示，比如使用antd的message组件
    try {
      // 尝试使用全局的messageAnt，如果可用的话
      if (window.messageAnt) {
        window.messageAnt.info("文件正在处理中，请稍候...")
      }
    } catch (e) {
      console.error("无法显示消息提示", e)
    }
    return
  }

  // 如果文件处理失败，显示错误提示
  if (file.actionType === "error" || file.status === 3) {
    console.log("文件处理失败，无法查看")
    try {
      if (window.messageAnt) {
        window.messageAnt.error("文件处理失败，无法查看")
      }
    } catch (e) {
      console.error("无法显示消息提示", e)
    }
    return
  }

  // 如果没有文件或文件URL，则不执行任何操作
  if (!file || (!file.url && !file.uid)) return

  // 默认情况下，向父窗口发送消息
  // 解析uid，如果包含时间戳，则提取出原始id
  const originalId = extractOriginalId(file.uid)

  window.parent.postMessage(
    {
      type: "SEND_AGENT_IFRAME",
      data: {
        id: originalId,
        fileName: file.name || "数据文件",
        url: file.url || "",
        defaultIconType: file.type && file.type.includes("image") ? "IMAGE" : "FILE"
      }
    },
    "*"
  )
}

/**
 * 从文件uid中提取原始ID
 * 原始格式可能是: "659-0-1745823812954"，我们只需要"659"部分
 */
function extractOriginalId(uid) {
  if (!uid) return uid

  // 简化处理: 直接拆分字符串并获取第一部分
  const parts = String(uid).split("-")
  return parts[0] || uid // 如果拆分失败，返回原始uid
}
