import React, { useEffect, useState, useMemo } from "react"
import { Upload, Image, Modal, Dropdown, Button, Space } from "antd"
import { PlusOutlined, DownloadOutlined, EllipsisOutlined } from "@ant-design/icons"
import { isEqual } from "lodash"
import { useLocation } from "react-router-dom"
import queryString from "query-string"
import { getTokenAndServiceName } from "@/api/sso"
import { botPrefix } from "@/constants"
import {
  SwapOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  ZoomOutOutlined,
  ZoomInOutlined,
  UndoOutlined
} from "@ant-design/icons"
import { isStudio } from "@/config.env"

const url = `${botPrefix}/admin/file/upload`
const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = (error) => reject(error)
  })
const ImageUploadForCommon = ({
  accept = "image/*",
  action = url,
  value = [],
  detail = {},
  maxCount = 5,
  onChange = (fileList = []) => {},
  readonly = false,
  uploadText = "上传图片",
  style = {}
}) => {
  const location = useLocation()
  const { botNo, studioenv } = queryString.parse(location.search)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState("")
  const [fileList, setFileList] = useState([])

  useEffect(() => {
    const valueUrls = value.map((url) => url)
    let fileListUrls = fileList.map((file) => file.url)

    if (!isEqual(valueUrls, fileListUrls) && value.length > 0) {
      let valueAfterTransform = value.map((item) => ({
        url: item,
        status: "done"
      }))

      setFileList(valueAfterTransform)
    }
  }, [value])

  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj)
    }
    setPreviewImage(file.url || file.preview)
    setPreviewOpen(true)
  }
  const handleChange = ({ fileList: newFileList }) => {
    const newList = newFileList.map((file = {}) => {
      if (file.status === "done") {
        return {
          uid: file.uid,
          url: file.response?.data?.temporarySignatureUrl ?? file.url,
          id: file.response?.data?.objectKey ?? file.id,
          status: "done"
        }
      } else {
        return {
          uid: file.uid,
          url: file.url,
          id: file.id,
          status: file.status
        }
      }
    })

    setFileList(newList)

    const doneFiles = newList.filter((item) => item.status === "done")
    if (doneFiles.length === newList.length) {
      onChange(doneFiles.map((item) => item.url))
    }
  }
  const uploadButton = (
    <button
      style={{
        border: 0,
        background: "none"
      }}
      type="button"
    >
      <PlusOutlined />
      <div
        style={{
          marginTop: 8
        }}
      >
        {uploadText}
      </div>
    </button>
  )

  const handleDownload = (url) => {
    const link = document.createElement("a")
    link.href = url
    const fileName = url.split("/").pop() || "image.png"
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      {readonly ? (
        <div className="image-preview-list w-full" style={style}>
          {fileList?.map((file) => (
            <div
              key={file.uid}
              className="image-preview-item"
              style={{
                position: "relative",
                display: "inline-block",
                margin: "4px",
                padding: "8px",
                border: "1px solid #D0D5DD",
                borderRadius: "8px",
                cursor: "pointer"
              }}
            >
              <img
                src={file.url}
                alt=""
                style={{ width: "94px", height: "94px", objectFit: "cover" }}
                onClick={() => handlePreview(file)}
              />
            </div>
          ))}
        </div>
      ) : (
        <Upload
          accept={accept}
          action={action}
          listType="picture-card"
          fileList={fileList}
          headers={{
            "X-Usercenter-Session": getTokenAndServiceName().token,
            ...(isStudio() ? { botno: botNo || undefined, studioenv: studioenv || "prd" } : {})
          }}
          onPreview={handlePreview}
          onChange={handleChange}
        >
          {fileList.length >= maxCount ? null : uploadButton}
        </Upload>
      )}

      <Image
        style={{ display: "none" }}
        preview={{
          visible: previewOpen,
          src: previewImage,
          onVisibleChange: (visible) => setPreviewOpen(visible),
          toolbarRender: (
            originalToolbar,
            {
              transform: { scale },
              actions: {
                onFlipY,
                onFlipX,
                onRotateLeft,
                onRotateRight,
                onZoomOut,
                onZoomIn,
                onReset
              }
            }
          ) => {
            return (
              <Space size={16} className="text-lg">
                <DownloadOutlined onClick={() => handleDownload(previewImage)} />
                <SwapOutlined rotate={90} onClick={onFlipY} />
                <SwapOutlined onClick={onFlipX} />
                <RotateLeftOutlined onClick={onRotateLeft} />
                <RotateRightOutlined onClick={onRotateRight} />
                <ZoomOutOutlined disabled={scale === 1} onClick={onZoomOut} />
                <ZoomInOutlined disabled={scale === 50} onClick={onZoomIn} />
                <UndoOutlined onClick={onReset} />
              </Space>
            )
          }
        }}
      />
    </>
  )
}

export default ImageUploadForCommon
