import React, { useEffect, useState, useMemo } from "react"
import { Upload, message, Modal } from "antd"
import { PlusOutlined } from "@ant-design/icons"
import { isEqual } from "lodash"
import { getTokenAndServiceName } from "@/api/sso"

const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = (error) => reject(error)
  })

const ImageUpload = React.memo(
  // @ts-ignore
  ({ value = [], onChange, imgUploadAction, disabled }) => {
    const [previewOpen, setPreviewOpen] = useState(false)
    const [previewImage, setPreviewImage] = useState("")
    // @ts-ignore
    const [previewTitle, setPreviewTitle] = useState("")
    const [fileList, setFileList] = useState([])

    const transformedFileList = useMemo(
      () =>
        value?.map((file) => ({
          uid: file.uid,
          status: "done",
          url: file.url,
          thumbUrl: file.url,
          id: file.id,
          name: file.url
        })),
      [value]
    )

    useEffect(() => {
      if (!isEqual(fileList, transformedFileList)) {
        setFileList(transformedFileList)
      }
    }, [fileList, transformedFileList])

    const handleCancel = () => setPreviewOpen(false)

    const handlePreview = async (file) => {
      if (!file.url && !file.preview) {
        file.preview = await getBase64(file.originFileObj)
      }
      setPreviewImage(file.url || file.preview)
      setPreviewOpen(true)
      setPreviewTitle(file.name || file.url.substring(file.url.lastIndexOf("/") + 1))
    }

    const handleRemove = (file) => {
      const newFileList = fileList.filter((item) => item.uid !== file.uid)
      const newValue = newFileList.map((file) => ({
        uid: file.uid,
        url: file.url,
        id: file.id
      }))
      if (!isEqual(value, newValue)) {
        onChange(newValue)
      }
    }

    const handleChange = ({ fileList }) => {
      const newValue = fileList.map((file) => ({
        uid: file.uid,
        url: file.response ? file.response.data.url : file.url,
        id: file.response ? file.response.data.id : file.id
      }))
      if (!isEqual(value, newValue)) {
        onChange(newValue)
      }
      if (!isEqual(fileList, transformedFileList)) {
        setFileList(fileList)
      }
    }

    // @ts-ignore
    const beforeUpload = (file) => {
      const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png"
      if (!isJpgOrPng) {
        message.error("只能上传 JPG/PNG 文件!")
      }
      const isLt2M = file.size / 1024 / 1024 < 2
      if (!isLt2M) {
        message.error("图像必须小于2MB!")
      }
      return isJpgOrPng && isLt2M
    }

    const uploadButton = (
      <div>
        <PlusOutlined />
        <div style={{ marginTop: 8 }}>Upload</div>
      </div>
    )

    return (
      <>
        <Upload
          accept="image/*"
          action={imgUploadAction && imgUploadAction()}
          listType="picture-card"
          headers={{
            // @ts-ignore
            "X-Usercenter-Session": getTokenAndServiceName().token
          }}
          fileList={fileList}
          onPreview={handlePreview}
          onChange={handleChange}
          onRemove={handleRemove}
          disabled={disabled}
        >
          {fileList?.length >= 3 ? null : uploadButton}
        </Upload>
        <Modal open={previewOpen} footer={null} onCancel={handleCancel}>
          <img alt="example" style={{ width: "100%" }} src={previewImage} />
        </Modal>
      </>
    )
  }
)

export default ImageUpload
