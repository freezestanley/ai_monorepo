import React, { useState, useRef, useEffect } from "react"
import ReactQuill, { Quill } from "react-quill"
import "react-quill/dist/quill.snow.css" // 你可能已经有这个，但只是确认
import "quill-emoji/dist/quill-emoji.css" // 导入emoji样式
import "./index.scss"
import { modulesData } from "./config"
import { useActionBar } from "./hooks/useActionBar"
import { useContentMetrics } from "./hooks/useContentMetrics"
import { useSelectionActions } from "./hooks/useSelectionActions"
import AIMenuTrigger from "./components/AIMenu"
import useAIMenuOperations from "./hooks/useAIMenuActions"
import { message } from "antd"
import { getTokenAndServiceName } from "@/api/sso"

function QuillEditor(props) {
  const {
    disabled,
    readOnly,
    className,
    style,
    value,
    onChange,
    placeholder,
    imgUploadAction,
    uploadImageUrl
  } = props
  const quillRef = useRef(null)

  useEffect(() => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor()

      quill.root.addEventListener("paste", async (e) => {
        const clipboardData = e.clipboardData
        const items = clipboardData.items

        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            e.preventDefault()

            const file = items[i].getAsFile()

            // 检查文件类型和大小
            const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png"
            if (!isJpgOrPng) {
              message.error("只能上传 JPG/PNG 文件!")
              return
            }
            const isLt2M = file.size / 1024 / 1024 < 2
            if (!isLt2M) {
              message.error("图像必须小于2MB!")
              return
            }

            const formData = new FormData()
            formData.append("file", file)

            try {
              const uploadUrl = (imgUploadAction && imgUploadAction()) ?? uploadImageUrl
              if (!uploadUrl) {
                message.error("未配置上传地址")
                return
              }
              const response = await fetch(uploadUrl, {
                method: "POST",
                headers: {
                  "X-Usercenter-Session": getTokenAndServiceName().token
                },
                body: formData
              })

              const result = await response.json()

              if (result.code === "200" && result.data) {
                // 在光标位置插入图片
                const range = quill.getSelection(true)
                quill.insertEmbed(range.index, "image", result.data.url)
              } else {
                message.error(result.message || "上传失败")
              }
            } catch (error) {
              console.error("上传图片失败:", error)
              message.error("上传图片失败")
            }
          }
        }
      })
    }
  }, [imgUploadAction])

  return (
    <div className="quill-wrapper relative">
      <ReactQuill
        placeholder={placeholder}
        readOnly={disabled}
        className={`quill-editor-wrapper ${disabled ? "readOnly" : ""}`}
        ref={quillRef}
        theme="snow"
        style={style}
        value={value}
        modules={modulesData}
        onChange={(content, delta, source, editor) => {
          if (onChange) {
            onChange(content, delta, source, editor)
          }
        }}
      />
    </div>
  )
}

export default QuillEditor
