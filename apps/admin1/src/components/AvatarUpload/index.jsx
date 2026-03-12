/**
 * 上传头像
 */
import { fetchUploadFile } from "@/api/common/api"
import upload2 from "@/assets/img/upload2.png"
import { message } from "antd"
import { Button, Modal, Upload } from "antd"
import { useState, useRef } from "react"
import ReactCrop from "react-image-crop"
import "react-image-crop/src/ReactCrop.scss"
import "./index.scss"
import { getTokenAndServiceName } from "@/api/sso"

const defaultWidth = 320
const minWidth = 80
const defaultCrop = {
  unit: "px",
  aspect: 1,
  width: defaultWidth,
  height: defaultWidth,
  x: 0,
  y: 0
}

// 将base64图片转成文件流
function base64ToBlob(base64, mimeType) {
  const byteString = window.atob(base64.split(",")[1])
  const arrayBuffer = new ArrayBuffer(byteString.length)
  const uint8Array = new Uint8Array(arrayBuffer)
  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i)
  }
  const blob = new Blob([uint8Array], { type: mimeType })

  return blob
}

export default ({ onChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const parentRef = useRef(null)
  const [src, setSrc] = useState(null)
  const [imageWidth, setImageWidth] = useState(0)
  const [imageHeight, setImageHeight] = useState(0)
  const [imageType, setImageType] = useState("")
  const [crop, setCrop] = useState(defaultCrop)
  const [croppedImageUrl, setCroppedImageUrl] = useState("")
  const [confirmLoading, setConfirmLoading] = useState(false)

  const resetData = () => {
    setImageWidth(0)
    setImageHeight(0)
    setImageType("")
    setCrop(defaultCrop)
    setCrop(defaultCrop)
    setCroppedImageUrl("")
  }

  const showModal = () => {
    resetData()
    setIsModalOpen(true)
  }

  const handleOk = async () => {
    if (croppedImageUrl) {
      try {
        setConfirmLoading(true)
        const formData = new FormData()
        formData.append("file", base64ToBlob(croppedImageUrl, imageType))
        const data = await fetchUploadFile(formData)
        const { temporarySignatureUrl: iconURL, objectKey } = data ?? {}
        if (iconURL) {
          onChange?.({ iconURL, objectKey })
          setIsModalOpen(false)
          message.success("上传成功")
        }
      } catch (error) {
        console.error("Error upload the file:", error)
      } finally {
        setConfirmLoading(false)
      }
    } else {
      message.error("请选择图片")
    }
  }

  const handleCancel = () => {
    setIsModalOpen(false)
    resetData()
  }

  const onImageLoaded = (image) => {
    // 设置默认的crop值，并确保它位于图片的中心
    const { innerWidth, innerHeight } = window
    const _imageWidth = Math.min(innerWidth, imageWidth)
    const _imageHeight = Math.min(innerHeight, imageHeight)

    // 计算裁剪框的大小
    const size = Math.min(_imageWidth, _imageHeight, defaultWidth)

    const x = (_imageWidth - size) / 2
    const y = (_imageHeight - size) / 2

    const newCrop = {
      ...defaultCrop,
      x,
      y,
      width: size,
      height: size
    }

    onCropChange(newCrop)
  }

  const onCropComplete = () => {
    // 上传图片
    if (src && crop.width > minWidth && crop.height > minWidth) {
      const img = new Image()
      img.onload = async function () {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        canvas.width = crop.width
        canvas.height = crop.height
        ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height)
        const base64Image = canvas.toDataURL(imageType)
        setCroppedImageUrl(base64Image)
        setSrc("")
      }
      img.src = src
    } else {
      message.error("请裁剪图片")
    }
  }

  const onCropChange = (crop) => {
    // 确保始终是正方形
    const { width, height } = crop
    const size = Math.min(width, height)
    setCrop({
      ...crop,
      width: size,
      height: size,
      aspect: 1
    })
  }

  // 检查图片是否符合要求
  const checkImageDimensions = (file) =>
    new Promise((resolve, reject) => {
      const img = new Image()
      img.src = URL.createObjectURL(file)
      img.onload = () => {
        if (img.width >= minWidth && img.height >= minWidth) {
          setImageWidth(img.width)
          setImageHeight(img.height)
          resolve(true)
        } else {
          reject("Image dimensions should be at least 80*80px")
        }
      }
      img.onerror = reject
    })

  const onChangeFile = async (file) => {
    setImageType(file.type)
    try {
      await checkImageDimensions(file)
    } catch (error) {
      message.error("要求图片大小至少为80*80px")
      return false
    }

    const reader = new FileReader()
    reader.onload = () => {
      setSrc(reader.result)
    }
    reader.onerror = (error) => {
      console.error("Error reading the file:", error)
    }
    reader.readAsDataURL(file)
    // Prevent upload
    return false
  }

  return (
    <div ref={parentRef} className="uploadAvatar">
      <div onClick={showModal} className={`open-btn ${isModalOpen ? "selected" : ""}`}></div>
      {!src && (
        <Modal
          title="上传自定义头像"
          open={isModalOpen}
          onOk={handleOk}
          onCancel={handleCancel}
          confirmLoading={confirmLoading}
          okText={confirmLoading ? "正在上传..." : "确认"}
          getContainer={() => parentRef.current}
          className={src ? "hidden" : ""}
        >
          <div className="content">
            <Upload
              headers={{
                "X-Usercenter-Session": getTokenAndServiceName().token
              }}
              accept=".jpg,.png"
              showUploadList={false}
              beforeUpload={onChangeFile}
            >
              <Button className="upload-button">
                <img src={upload2} alt="" width={26} height={19} />
                <span className="upload-label">选择本地文件</span>
              </Button>
            </Upload>
            <p className="upload-tip">支持格式为JPG、PNG的图片上传，需大于80*80px。</p>
            {croppedImageUrl && (
              <>
                <p className="preview-title">预览头像</p>
                <img src={croppedImageUrl} className="avator-preview" />
              </>
            )}
          </div>
        </Modal>
      )}
      {src && (
        <div
          className="crop-wrap"
          style={{
            width: imageWidth,
            height: imageHeight,
            minHeight: "auto",
            minWidth: "auto"
          }}
        >
          <ReactCrop
            crop={crop}
            onChange={onCropChange}
            minWidth={minWidth}
            minHeight={minWidth}
            circularCrop={true}
          >
            <img src={src} onLoad={onImageLoaded} />
          </ReactCrop>
          <Button type="primary" className="button" onClick={onCropComplete}>
            确定
          </Button>
        </div>
      )}
    </div>
  )
}
