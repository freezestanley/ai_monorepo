import { useRef, useState } from "react"

export const useContentMetrics = (editorRef) => {
  const [textLength, setTextLength] = useState(0) // 用于展示的字符计数

  const handleContentChange = () => {
    if (editorRef.current) {
      const editor = editorRef.current.getEditor()
      const textLength = editor.getLength() - 1 // 减1是为了排除最后的换行符
      // 这里可以设置状态或其他操作来显示字符计数
      setTextLength(textLength)
    }
  }

  return { textLength, handleContentChange }
}
