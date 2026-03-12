import React, { useState, useEffect, useRef } from "react"
import { message } from "antd"
import { FileAPI } from "../api"
import "./RichTextEditor.scss"

// 这里假设已经安装了一个富文本编辑器，如果没有，可以使用 textarea 作为简单版本
// 常用的富文本编辑器：react-quill, @wangeditor/editor-for-react, react-draft-wysiwyg

const RichTextEditor = ({ value, onChange, placeholder, height = 400 }) => {
  const [content, setContent] = useState(value || "")
  const editorRef = useRef(null)

  useEffect(() => {
    setContent(value || "")
  }, [value])

  // 内容变化处理
  const handleContentChange = (newContent) => {
    setContent(newContent)
    onChange?.(newContent)
  }

  // 图片上传处理
  const handleImageUpload = async (file) => {
    try {
      const response = await FileAPI.uploadImage(file)
      if (response.success) {
        return response.data.url
      } else {
        throw new Error(response.message || "上传失败")
      }
    } catch (error) {
      message.error(`图片上传失败: ${error.message}`)
      throw error
    }
  }

  // 由于没有具体的富文本编辑器库，这里使用简单的 textarea 作为示例
  // 实际项目中应该替换为真正的富文本编辑器
  return (
    <div className="rich-text-editor">
      <div className="editor-toolbar">
        <div className="toolbar-group">
          <button
            type="button"
            className="toolbar-btn"
            title="加粗"
            onClick={() => {
              // 这里应该实现富文本编辑器的格式化功能
              console.log("Bold clicked")
            }}
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            className="toolbar-btn"
            title="斜体"
            onClick={() => {
              console.log("Italic clicked")
            }}
          >
            <em>I</em>
          </button>
          <button
            type="button"
            className="toolbar-btn"
            title="下划线"
            onClick={() => {
              console.log("Underline clicked")
            }}
          >
            <u>U</u>
          </button>
        </div>

        <div className="toolbar-group">
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            ref={editorRef}
            onChange={async (e) => {
              const file = e.target.files[0]
              if (file) {
                try {
                  const imageUrl = await handleImageUpload(file)
                  // 插入图片到编辑器
                  const imageHtml = `<img src="${imageUrl}" alt="image" style="max-width: 100%; height: auto;" />`
                  handleContentChange(content + imageHtml)
                } catch (error) {
                  console.error("Image upload failed:", error)
                }
              }
            }}
          />
          <button
            type="button"
            className="toolbar-btn"
            title="插入图片"
            onClick={() => {
              editorRef.current?.click()
            }}
          >
            📷
          </button>
        </div>
      </div>

      <div className="editor-content">
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder={placeholder || "请输入内容..."}
          style={{
            width: "100%",
            height: height,
            border: "1px solid #d9d9d9",
            borderRadius: "6px",
            padding: "12px",
            fontSize: "14px",
            lineHeight: "1.5",
            resize: "vertical",
            fontFamily: "inherit"
          }}
        />
      </div>

      <div className="editor-tips">
        <span style={{ color: "#999", fontSize: "12px" }}>
          支持 HTML 格式，可以直接输入 HTML 标签
        </span>
      </div>
    </div>
  )
}

// 如果要使用真正的富文本编辑器，可以使用 react-quill
// 这里提供一个 react-quill 的示例代码（需要安装 react-quill）

/*
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

const RichTextEditor = ({ value, onChange, placeholder, height = 400 }) => {
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ],
  }

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'align', 'list', 'bullet',
    'blockquote', 'code-block', 'link', 'image'
  ]

  return (
    <div className="rich-text-editor">
      <ReactQuill
        value={value || ''}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder || '请输入内容...'}
        style={{ height: height }}
        theme="snow"
      />
    </div>
  )
}
*/

export default RichTextEditor
