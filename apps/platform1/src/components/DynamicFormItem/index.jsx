import React from "react"
import { useLocation } from "react-router-dom"
import queryString from "query-string"
import { botPrefix } from "@/constants"
import { Input, Radio, Checkbox, Select, InputNumber, Switch, Upload, Button, Modal } from "antd"
import { UploadOutlined } from "@ant-design/icons"
import { SSOReqHeader, getTokenAndServiceName } from "@/api/sso"
import { isStudio } from "@/config.env"

const { TextArea } = Input
const { Option } = Select

const DynamicFormItem = ({ controlType, placeholder, options, onUploadStatusChange, ...res }) => {
  const location = useLocation()
  const { botNo, studioenv } = queryString.parse(location.search)

  const optionList = options?.filter(Boolean) || []
  switch (controlType) {
    case "input":
      return <Input placeholder={placeholder} {...res} />
    case "textarea":
      return <TextArea placeholder={placeholder} {...res} />
    case "radio":
      return <Radio.Group options={optionList} {...res} />
    case "boxes":
      return (
        <Checkbox.Group
          options={optionList.map((opt) => ({
            label: opt.label,
            value: opt.value
          }))}
          {...res}
        />
      )
    case "switch":
      return <Switch {...res} />
    case "select":
      return (
        <Select placeholder={placeholder} {...res}>
          {optionList.map((opt) => (
            <Option key={opt.value} value={opt.value}>
              {opt.label}
            </Option>
          ))}
        </Select>
      )
    case "multiSelect":
      return (
        <Select mode="multiple" placeholder={placeholder} {...res}>
          {optionList.map((opt) => (
            <Option key={opt.value} value={opt.value}>
              {opt.label}
            </Option>
          ))}
        </Select>
      )
    case "number":
      return <InputNumber placeholder={placeholder} {...res} />
    case "upload":
      // @ts-ignore
      return (
        <UploadFile
          placeholder={placeholder}
          onUploadStatusChange={onUploadStatusChange}
          headers={{
            "X-Usercenter-Session": getTokenAndServiceName().token,
            ...(isStudio() ? { botno: botNo || undefined, studioenv: studioenv || "prd" } : {})
          }}
          {...res}
        />
      )
    default:
      return null
  }
}

const UploadFile = ({ placeholder, onChange: propsonChange, onUploadStatusChange, ...res }) => {
  const [fileUrl, setFileUrl] = React.useState("")
  const [networkType, setNetworkType] = React.useState("INNER")
  const [isModalVisible, setIsModalVisible] = React.useState(false)
  const [tempFile, setTempFile] = React.useState(null)
  const [isUploading, setIsUploading] = React.useState(false)

  const headers = SSOReqHeader({})
  const processedHeaders = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
  )

  const handleBeforeUpload = (file) => {
    setTempFile(file)
    setIsModalVisible(true)
    return false
  }

  const handleModalOk = () => {
    setIsModalVisible(false)
    if (!tempFile) return

    const formData = new FormData()
    formData.append("file", tempFile)

    const xhr = new XMLHttpRequest()
    xhr.open("POST", `${botPrefix}/admin/file/upload?networkType=${networkType}`, true)

    // 设置请求头
    Object.entries(processedHeaders).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value)
    })

    // 开始上传，通知父组件
    setIsUploading(true)
    onUploadStatusChange?.(true)

    xhr.onload = () => {
      // 上传完成，通知父组件
      setIsUploading(false)
      onUploadStatusChange?.(false)

      if (xhr.status === 200) {
        const response = JSON.parse(xhr.response)
        if (response?.code === "200") {
          const { temporarySignatureUrl, objectKey } = response.data

          setFileUrl(temporarySignatureUrl || "")
          propsonChange(temporarySignatureUrl)
        }
      }
    }

    xhr.onerror = () => {
      // 上传失败，通知父组件
      setIsUploading(false)
      onUploadStatusChange?.(false)
    }

    xhr.send(formData)
    setTempFile(null)
  }

  const handleModalCancel = () => {
    setIsModalVisible(false)
    setTempFile(null)
  }

  const handleRemove = () => {
    setFileUrl("")
    propsonChange("")
  }

  return (
    <>
      <Upload
        action={`${botPrefix}/admin/file/upload?networkType=${networkType}`}
        headers={processedHeaders}
        beforeUpload={handleBeforeUpload}
        onChange={(info) => {
          if (info.file.status === "removed") {
            handleRemove()
          }
        }}
        maxCount={1}
        listType="picture"
      >
        <Button icon={<UploadOutlined />} loading={isUploading} disabled={isUploading}>
          {isUploading ? "上传中..." : "点击上传文件"}
        </Button>
      </Upload>

      <Modal
        title="请选择文件调试类型"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
      >
        <Radio.Group value={networkType} onChange={(e) => setNetworkType(e.target.value)}>
          <Radio value="INNER">内网文件调试</Radio>
          <Radio value="OUTER">外网文件调试</Radio>
        </Radio.Group>
      </Modal>

      <Input placeholder={placeholder} {...res} value={fileUrl} type="hidden" />
    </>
  )
}

export default DynamicFormItem
