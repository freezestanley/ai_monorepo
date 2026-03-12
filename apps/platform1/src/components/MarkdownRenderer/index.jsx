import { marked } from "marked"
import hljs from "highlight.js"

import { FormatMessageMode, formatMessage, formatMessageWithCopy } from "./formatMessage"
marked.setOptions({
  renderer: new marked.Renderer(),
  highlight: function (code, language) {
    const validLanguage = hljs.getLanguage(language) ? language : "plaintext"
    return hljs.highlight(validLanguage, code).value
  },
  breaks: true
})

const MarkdownRenderer = ({ content, isLoading, className }) => {
  const contentAfterFormat = formatMessageWithCopy(
    formatMessage(content, FormatMessageMode.partial, isLoading)
  )
  const createMarkup = () => {
    return { __html: contentAfterFormat }
  }

  return (
    <div
      className={`prose lg:prose-xl ${className || ""}`}
      dangerouslySetInnerHTML={createMarkup()}
    />
  )
}

export default MarkdownRenderer
