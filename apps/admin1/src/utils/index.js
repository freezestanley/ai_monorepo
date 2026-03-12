import { message } from "antd"
import dayjs from "dayjs"
import { downloadFile } from "@/api/tools"

/**
 *
 * @desc: react取消事件冒泡
 * @param {*} e: event
 */
export const cancelBubble = (e) => {
  e.stopPropagation()
  e.nativeEvent.stopImmediatePropagation()
}

/* 
rangeDays 范围内时间禁用
*/
export const disabledDate = (current, rangeDays) => {
  // 获取当前日期
  const today = dayjs()

  // 获取rangeDays天前的日期
  const rangeDaysAgo = dayjs().subtract(rangeDays, "days")

  // 如果当前日期在rangeDays天前的日期之前或者在将来，则禁用
  return current.isBefore(rangeDaysAgo, "day") || current.isAfter(today, "day")
}

/**
 * 生成编号
 * @param {string} prefix 前缀
 * @param {string} suffix 后缀
 * @returns
 */
export const generateNO = (prefix = "", suffix = `${Math.floor(Math.random() * 9000) + 1000}`) => {
  return `${prefix}${dayjs().format("YYYYMMDDHHmm")}${suffix}`
}

export const isInsideIframe = () => {
  try {
    return window.self !== window.top
  } catch (e) {
    return true
  }
}

/**
 * 自定义下载文件，用户可以选择文件夹和命名文件
 */
export const customDownload = async ({
  blob,
  defaultFilename,
  accept = {},
  customDirectory = false
}) => {
  if (customDirectory && window.showSaveFilePicker) {
    const options = {
      types: [
        {
          description: "灵犀平台导出JSON 文件",
          accept: {
            "application/json": [".json"]
          },
          ...accept
        }
      ],
      excludeAcceptAllOption: true,
      suggestedName: defaultFilename
    }
    const fileHandle = await window.showSaveFilePicker(options)

    // 将 Blob 写入选定的文件
    const writableStream = await fileHandle.createWritable()
    await writableStream.write(blob)
    await writableStream.close()
    message.success("下载完成！")
  } else {
    const link = document.createElement("a")
    link.href = window.URL.createObjectURL(blob)
    link.download = defaultFilename
    link.click()
  }
}

/**
 * es类型转换
 */
export const exchangeESType = (type) => {
  switch (type) {
    case "long":
    case "double":
      return "number"
    case "boolean":
      return "boolean"
    default:
      return "string"
  }
}

/**
 * 格式化目录No
 */
export const formatCatalogNos = (catalogNosList = []) => {
  let catalogNos = []
  catalogNosList?.map((item) => {
    if (item.startsWith("parent,")) {
      catalogNos = [...catalogNos].concat(item.split(",").slice(1))
    } else {
      catalogNos.push(item)
    }
  })
  return catalogNos
}

/**
 * 获取随机字符串
 */
export const getRandomString = (len = 8) => {
  let str = ""
  for (let i = 0; i < len; i++) {
    str += Math.floor(Math.random() * 10)
  }
  return str
}

export function postMessageForLX(message) {
  if (window.parent) {
    window.parent.postMessage(message, "*")
  }
}

export function getFileName(url) {
  const urlObj = new URL(url)
  const path = urlObj.pathname
  const segments = path.split("/")
  return segments[segments.length - 1]
}

export const functionDownVoice = async (audioUrl, fileName = null) => {
  const urlObj = new URL(audioUrl)
  const path = "/finVoiceOSSHost" + urlObj.pathname + urlObj.search + urlObj.hash
  const blob = await fetch(path).then((res) => res.blob())
  const blobUrl = window.URL.createObjectURL(blob)
  downloadFile(blobUrl, fileName ? fileName : getFileName(audioUrl))
  window.URL.revokeObjectURL(blobUrl)
}

export const convertToChineseNumber = (number) => {
  const chineseDigits = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"]
  const units = ["", "十", "百", "千", "万", "亿"]

  let result = ""
  let numStr = number.toString()
  let length = numStr.length

  for (let i = 0; i < length; i++) {
    let digit = numStr.charAt(i)
    let chineseDigit = chineseDigits[digit]
    let unit = units[length - i - 1]

    if (chineseDigit !== "零") {
      result += chineseDigit + unit
    } else {
      // Avoid consecutive "零"
      if (result.charAt(result.length - 1) !== "零" && length - i - 1 !== 0) {
        result += chineseDigit
      }
    }
  }

  // Remove trailing "零"
  if (result.charAt(result.length - 1) === "零") {
    result = result.slice(0, -1)
  }

  // Special case for numbers like "10", "20", "30", etc.
  if (number >= 10 && number < 20) {
    result = result.replace(/^一十/, "十")
  }

  return result
}
