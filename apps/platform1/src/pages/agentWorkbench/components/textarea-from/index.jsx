import React, { useCallback, useEffect, useRef, useState } from "react"

import "./index.scss"
import { Role } from "../messages/constants"

function isDomChildren(ancestor, target) {
  if (!ancestor || !target) {
    return false
  }

  let parent = target

  do {
    parent = parent.parentElement

    if (parent === ancestor) {
      return true
    }
  } while (parent !== null)

  return false
}

const TextareaForm = ({ isLoading, sendMessage, textareaRef }) => {
  const [isComposing, setIsComposing] = useState(false)

  const [submitDisabled, setSubmitDisabled] = useState(true)

  const wrapperContainerRef = useRef(null)

  const formContainerRef = useRef(null)

  const placeholderRef = useRef(null)

  useEffect(() => {
    document.addEventListener("touchstart", (e) => {
      const targetElement = e.target

      if (textareaRef.current !== document.activeElement) {
        return
      }

      if (isDomChildren(formContainerRef.current, targetElement)) {
        return
      }

      textareaRef.current?.blur()
    })
  }, [])

  const updateSubmitDisabled = useCallback(() => {
    const value = textareaRef.current?.value?.trim()

    if (value) {
      setSubmitDisabled(false)
    } else {
      setSubmitDisabled(true)
    }
  }, [])

  const updateTextareaHeight = useCallback(() => {
    const textareaElement = textareaRef.current

    if (!textareaElement) {
      return
    }

    textareaElement.style.height = "5px"

    const newHeight = Math.min(textareaElement.scrollHeight, 260)

    textareaElement.style.height = `${newHeight}px`

    if (placeholderRef.current) {
      placeholderRef.current.style.height = `${newHeight}px`
    }
  }, [])

  const onChange = useCallback(() => {
    updateTextareaHeight()

    updateSubmitDisabled()
  }, [updateTextareaHeight, updateSubmitDisabled])

  const onCompositionStart = useCallback(() => setIsComposing(true), [])

  const onCompositionEnd = useCallback(() => {
    setIsComposing(false)

    updateSubmitDisabled()
  }, [updateSubmitDisabled])

  const formOnSubmit = useCallback(
    async (e) => {
      e?.preventDefault()

      const value = textareaRef.current?.value?.trim()

      if (!value) {
        return
      }

      sendMessage(value)

      if (textareaRef.current?.value) {
        textareaRef.current.value = ""
      }

      updateTextareaHeight()

      updateSubmitDisabled()
    },

    [updateTextareaHeight, updateSubmitDisabled]
  )

  const onKeyDone = useCallback(
    (e) => {
      if (isComposing) {
        return
      }

      if (e.key === "Enter" && (e.shiftKey || e.ctrlKey || e.metaKey)) {
        return
      }

      if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()

        formOnSubmit()

        return
      }
    },

    [isComposing, formOnSubmit]
  )

  const submitExtInfo = async (content, extInfo) => {
    updateTextareaHeight()

    updateSubmitDisabled()
  }

  return (
    <div className="form-container-wrapper" ref={wrapperContainerRef}>
      <div className="form-panel-wrapper">
        <div className="form-container" ref={formContainerRef} id="form-container">
          <form className="form" onSubmit={formOnSubmit}>
            <textarea
              className="textarea"
              ref={textareaRef}
              disabled={isLoading}
              placeholder="请输入你的问题……"
              onChange={onChange}
              onKeyDown={onKeyDone}
              onCompositionStart={onCompositionStart}
              onCompositionEnd={onCompositionEnd}
              rows={1}
            />

            <input
              className="submit-button"
              type="submit"
              disabled={isLoading || isComposing}
              value=""
              onClick={formOnSubmit}
            />
          </form>
        </div>
      </div>
    </div>
  )
}

export default TextareaForm
