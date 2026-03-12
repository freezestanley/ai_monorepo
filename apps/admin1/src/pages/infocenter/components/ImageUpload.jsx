import React, { useState } from "react"
import { Upload, Button, message, Image } from "antd"
import { PlusOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons"
import { fetchUploadFile } from "@/api/common/api"
import { getTokenAndServiceName } from "@/api/sso"

const ImageUpload = ({ value, onChange, onFinish, maxCount = 1, listType = "picture-card" }) => {
  const [fileList, setFileList] = useState(() => {
    if (!value) return []

    // 如果是字符串（单个图片URL）
    if (typeof value === "string") {
      return [
        {
          uid: "-1",
          name: "image",
          status: "done",
          url: value
        }
      ]
    }

    // 如果是对象（包含temporarySignatureUrl和objectKey）
    if (typeof value === "object" && !Array.isArray(value) && value.temporarySignatureUrl) {
      return [
        {
          uid: "-1",
          name: "image",
          status: "done",
          url: value.temporarySignatureUrl,
          response: value
        }
      ]
    }

    // 如果是数组（多个图片URL或响应对象）
    if (Array.isArray(value)) {
      return value.map((item, index) => {
        if (typeof item === "string") {
          return {
            uid: `-${index + 1}`,
            name: `image-${index + 1}`,
            status: "done",
            url: item
          }
        } else if (item && item.temporarySignatureUrl) {
          return {
            uid: `-${index + 1}`,
            name: `image-${index + 1}`,
            status: "done",
            url: item.temporarySignatureUrl,
            response: item
          }
        }
        return {
          uid: `-${index + 1}`,
          name: `image-${index + 1}`,
          status: "done",
          url: item
        }
      })
    }

    return []
  })

  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewImage, setPreviewImage] = useState("")

  // 上传前检查
  const beforeUpload = (file) => {
    const isImage = file.type.startsWith("image/")
    if (!isImage) {
      message.error("只能上传图片文件！")
      return false
    }

    const isLt5M = file.size / 1024 / 1024 < 5
    if (!isLt5M) {
      message.error("图片大小不能超过 5MB！")
      return false
    }

    return true
  }

  // 自定义上传
  const customRequest = async ({ file, onSuccess, onError }) => {
    debugger
    try {
      const formData = new FormData()
      formData.append("file", file)
      const response = await fetchUploadFile(formData)

      // 上传成功后，调用onSuccess并传递响应数据
      // response.data 包含 temporarySignatureUrl 和 objectKey
      if (response && response.temporarySignatureUrl) {
        onSuccess(response.temporarySignatureUrl)
        onFinish(response.temporarySignatureUrl)
        message.success("图片上传成功")
      } else {
        throw new Error("上传响应数据格式错误")
      }
    } catch (error) {
      onError(error)
      message.error(`图片上传失败: ${error.message}`)
    }
  }

  // 文件状态变化
  const handleChange = ({ fileList: newFileList }) => {
    setFileList(newFileList)

    // 过滤出上传成功的文件
    const successFiles = newFileList.filter((file) => file.status === "done")

    if (maxCount === 1) {
      // 单个文件，返回完整的响应数据或URL字符串
      if (successFiles.length > 0) {
        const file = successFiles[0]
        // 如果有response且包含temporarySignatureUrl，返回完整的响应数据
        if (file.response?.temporarySignatureUrl) {
          onChange?.(file.response)
        } else {
          // 否则返回URL字符串（向后兼容）
          const url = file.response?.url || file.url || ""
          onChange?.(url)
        }
      } else {
        onChange?.("")
      }
    } else {
      // 多个文件，返回响应数据数组或URL数组
      const results = successFiles.map((file) => {
        if (file.response?.temporarySignatureUrl) {
          return file.response
        } else {
          return file.response?.url || file.url
        }
      })
      onChange?.(results)
    }
  }

  // 预览图片
  const handlePreview = (file) => {
    const previewUrl = file.url || file.response?.temporarySignatureUrl || file.response?.url
    setPreviewImage(previewUrl)
    setPreviewVisible(true)
  }

  // 删除图片
  const handleRemove = (file) => {
    return true // 允许删除
  }

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>{listType === "picture-card" ? "上传图片" : "点击上传"}</div>
    </div>
  )

  return (
    <>
      <Upload
        headers={{
          "X-Usercenter-Session": getTokenAndServiceName().token
        }}
        accept=".jpg,.png"
        listType={listType}
        fileList={fileList}
        beforeUpload={beforeUpload}
        customRequest={customRequest}
        onChange={handleChange}
        onPreview={handlePreview}
        onRemove={handleRemove}
        maxCount={maxCount}
      >
        {fileList.length >= maxCount ? null : uploadButton}
      </Upload>

      {/* 预览模态框 */}
      <Image
        style={{ display: "none" }}
        preview={{
          visible: previewVisible,
          onVisibleChange: setPreviewVisible,
          src: previewImage
        }}
      />
    </>
  )
}

export default ImageUpload
