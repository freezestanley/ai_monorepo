// hooks/usePlaceholderLogic.js
import { useEffect, useRef, useState } from "react"

export function usePlaceholderLogic(quillRef) {
  const [showPlaceholder, setShowPlaceholder] = useState(false)
  const [placeholderPosition, setPlaceholderPosition] = useState({
    top: 0,
    left: 0
  })
  const showPlaceholderRef = useRef(showPlaceholder)

  useEffect(() => {
    showPlaceholderRef.current = showPlaceholder
  }, [showPlaceholder])

  const checkCursorAtStartOfLine = () => {
    setTimeout(() => {
      const quill = quillRef.current.getEditor()
      const selection = quill.getSelection()
      if (selection) {
        const [line, offset] = quill.getLine(selection.index)
        if ((offset === 0 && line.length() === 1) || quill.getText().length === 0) {
          const bounds = quill.getBounds(selection.index)
          setPlaceholderPosition({
            ...bounds,
            top: bounds.top + 40,
            left: bounds.left
          })
          setShowPlaceholder(true)
        } else {
          setShowPlaceholder(false)
        }
      }
    }, 0)
  }

  useEffect(() => {
    const quill = quillRef.current.getEditor()
    quill.on("text-change", checkCursorAtStartOfLine)

    return () => {
      quill.off("text-change", checkCursorAtStartOfLine)
    }
  }, [])

  const placeholderPositionStyle = {
    position: "absolute",
    top: placeholderPosition.top + "px",
    left: placeholderPosition.left + "px",
    pointerEvents: "none",
    color: "rgb(55, 53, 47,.5)"
  }

  return {
    showPlaceholder,
    setShowPlaceholder,
    placeholderPosition,
    checkCursorAtStartOfLine,
    placeholderPositionStyle,
    showPlaceholderRef
  }
}

export default usePlaceholderLogic
