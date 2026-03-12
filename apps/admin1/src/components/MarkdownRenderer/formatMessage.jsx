import MarkdownIt from "markdown-it"
import iterator from "markdown-it-for-inline"
import hljs from "highlight.js"
import copy from "copy-to-clipboard"
import { message, Modal } from "antd"
import { PreviewCode } from "../AIAgentExecutionProcess"
// import "highlight.js/styles/github.css"
/** 多种 markdown-it 配置 */
const markdownItMap = {
  zero: new MarkdownIt("zero"),
  partial: new MarkdownIt("commonmark", {
    breaks: true,
    linkify: true,
    html: true,
    // 使用 Prism 解析代码
    highlight: (str, l) => {
      let lang = l ?? "plaintext"
      const validLanguage = hljs.getLanguage(lang) ? lang : "plaintext"

      // if (typeof (window as any).Prism.languages[lang] === 'undefined') {
      //   lang = 'plain'
      // }
      // const grammar = (window as any).Prism.languages[lang]
      // // https://github.com/PrismJS/prism/issues/1171#issuecomment-631470253
      // ;(window as any).Prism.hooks.run('before-highlight', { grammar })
      return `<pre class="language-${lang} markdown-code-wrapper"><div class="markdown-code-title-wrapper"><a class="markdown-code-copy"><i class="iconfont icon-fuzhi copy-event"></i></a><a class="markdown-code-expand"><i class="iconfont icon-a-expand expand-event"></i></a></div><code class="language-${lang}">${hljs.highlight(validLanguage, str).value}</code></pre>`
    }
  })
    .enable(["code", "fence"])
    .enable(["autolink", "backticks", "image", "link", "newline", "table"])
    .use(iterator, "url_new_win", "link_open", function (tokens, idx) {
      const aIndex = tokens[idx].attrIndex("target")

      if (aIndex < 0) {
        tokens[idx].attrPush(["target", "_blank"])
      } else {
        tokens[idx].attrs[aIndex][1] = "_blank"
      }
    })
}

// 实现「拷贝代码」功能
if (typeof window !== "undefined") {
  window.document.addEventListener("click", async (e) => {
    if (e.target?.classList?.contains("copy-event")) {
      const text = e.target.parentNode?.parentNode?.nextSibling?.innerText
      copy(text)
      message.success("复制成功")
      // e.target.innerHTML = '<span style="margin-right:3px">拷贝成功</span>✅'
      // await sleep(1000)
      // e.target.innerText = "拷贝代码"
    } else if (e.target?.classList?.contains("copy-result-event")) {
      // 处理复制结果按钮点击事件
      const button = e.target.closest(".copy-result-event")
      const textToCopy = button?.getAttribute("data-content")
      if (textToCopy) {
        copy(textToCopy)
        message.success("复制成功")
      }
    } else if (e.target?.classList?.contains("expand-event")) {
      // 在这里打开宽度为600的放大面板，并传入 code和title预览
      const codeElement = e.target.parentNode?.parentNode?.nextSibling
      const code = codeElement?.innerText || ""
      const title = "放大预览"
      Modal.info({
        icon: null,
        title: "",
        width: 1000,
        content: <PreviewCode code={code} title={title} />,
        okText: "关闭",
        maskClosable: true,
        centered: true
      })
    }
  })
}

export const FormatMessageMode = {
  /** 只处理换行符、空格、html 转义 */
  zero: "zero",
  /** 只处理一部分 md 语法，如 link、image、code 等 */
  partial: "partial",
  /** 完整的 markdown 处理 */
  full: "full"
}

const isHTML = (input) => {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(input, "text/html")
    if (
      doc.documentElement.nodeName === "HTML" &&
      !doc.getElementsByTagName("parsererror")[0] &&
      doc.body.children.length > 0 &&
      doc.body.firstChild?.nodeType === Node.ELEMENT_NODE
    ) {
      return true
      // const treeWalker = document.createTreeWalker(doc)
      // while (treeWalker.nextNode()) {
      //   const node = treeWalker.currentNode
      //   // console.log('node.nodeType:', node.nodeType, node.nodeName)
      //   if (
      //     node.nodeType == Node.TEXT_NODE &&
      //     node.textContent?.trim() &&
      //     /\n/.test(node.textContent)
      //   ) {
      //     node.textContent = node.textContent.replace(/\n/g, ' <br> ')
      //   }
      // }

      // return doc.body.innerHTML
    }
    return false
  } catch {
    return false
  }
}

const replaceNewLineWithBreak = (input) => {
  // return input.replace(/([^>])\n(?!<)/g, "$1<br/>")
  return input
}

/**
 * 格式化消息
 */
export function formatMessage(message, mode = FormatMessageMode.zero, isLoading = false) {
  let result =
    message?.trim() +
    (mode === FormatMessageMode.partial && isLoading
      ? '<span class="typewriter-cursor"></span>'
      : "")
  if (!result) {
    return ""
  }
  // 仅在 zero 模式下保留换行和空格
  if (mode === FormatMessageMode.zero) {
    // 由于多个换行符和空格在 markdown 中会被合并成一个，为了保留内容的格式，这里自行处理
    result = result.replace(/\n/g, "==BREAK=PLACEHOLDER==")

    // 遇到连续的 2个或 2个以上空格时，先替换，但保留第一个空格
    // result = result.replace(/ {2,}/g, (match) => ' ' + '==SPACE=PLACEHOLDER=='.repeat(match.length - 1));
    // 遇到连续的 2个或 2个以上空格时，替换成 nbsp
    result = result.replace(/ {2,}/g, (match) => "==SPACE=PLACEHOLDER==".repeat(match.length))
  } else if (isHTML(result)) {
    console.log("是HTML")
    result = replaceNewLineWithBreak(result)
  }
  result = markdownItMap[mode].render(result).trim()
  if (mode === FormatMessageMode.zero) {
    result = result.replace(/==SPACE=PLACEHOLDER==/g, "&nbsp;")
    result = result.replace(/==BREAK=PLACEHOLDER==/g, "<br/>")
  }

  return result
}

/**
 * 信息格式增加复制按钮
 */
export function formatMessageWithCopy(message) {
  if (!message) return ""
  try {
    // 处理 debug-output-result 结构，在其前面添加复制按钮
    const debugOutputResultRegex = /(<div class="debug-output-result">)([\s\S]*?)(<\/div>)/g
    const processedMessage = message.replace(
      debugOutputResultRegex,
      (match, openTag, content, closeTag) => {
        // 提取纯文本内容（去除HTML标签）
        const textContent = content.replace(/<[^>]*>/g, "").trim()
        return `<div class="flex justify-end">
        <i class="iconfont icon-fuzhi copy-result-event text-[20px] leading-[20px] cursor-pointer hover:text-[#7f56d9]" data-content="${textContent.replace(/"/g, "&quot;")}"></i>
    </div>
    ${openTag}${content}${closeTag}`
      }
    )
    return processedMessage
  } catch (error) {
    console.error("格式化信息时发生错误：", error)
    return message
  }
}

function sleep(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}
