import { useState, useEffect } from "react"
import { Modal, Form, Input, Upload, Button, message } from "antd"
import { fetchUploadFile } from "@/api/common/api"
import { useCreateApplication, useUpdateApplication } from "@/api/application"
import iconImg from "@/assets/img/aiLabIcon.png"

const validateUrl = (_, value) => {
  const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/
  if (value && !urlPattern.test(value)) {
    return Promise.reject(new Error("请输入有效的URL地址"))
  }
  return Promise.resolve()
}

const ApplicationFormModal = ({ visible, curData, onCancel }) => {
  const [form] = Form.useForm()
  const [iconUrl, setIconUrl] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const { mutate: createApplication } = useCreateApplication()
  const { mutate: updateApplication } = useUpdateApplication()

  const validateAtLeastOneWebsite = (type, _, value) => {
    const websiteValue = form.getFieldValue("websiteUrl")
    const deploymentUrlValue = form.getFieldValue("deploymentUrl")
    const isCheck = type === "websiteUrl" ? !value && !deploymentUrlValue : !value && !websiteValue
    if (isCheck) return Promise.reject(new Error("应用官网与私有化部署链接至少必填一项"))
    if (type === "websiteUrl" && !deploymentUrlValue) {
      form.validateFields(["deploymentUrl"])
    } else if (type === "deploymentUrl" && !websiteValue) {
      form.validateFields(["websiteUrl"])
    }
    return Promise.resolve()
  }

  useEffect(() => {
    if (!visible) {
      form.resetFields()
      setIconUrl(null)
    } else if (curData) {
      form.setFieldsValue({ ...curData })
      setIconUrl(curData.icon)
    }
  }, [visible, form, curData])

  const beforeUpload = (file) => {
    const isLt2M = file.size / 1024 / 1024 < 2
    if (!isLt2M) {
      message.error("图片大小不能超过 2MB!")
    }
    return isLt2M
  }

  const handleChange = async (info) => {
    if (info.file.status === "uploading") {
      return
    }
    if (info.file.status === "done") {
      try {
        const formData = new FormData()
        formData.append("file", info.file.originFileObj)
        const data = await fetchUploadFile(formData)
        const { temporarySignatureUrl, objectKey } = data || {}
        if (temporarySignatureUrl) {
          setIconUrl({ iconURL: temporarySignatureUrl, objectKey })
          form.setFieldsValue({
            icon: temporarySignatureUrl
          })
        }
      } catch (error) {
        console.error("Error uploading file:", error)
        message.error("上传失败")
      }
    }
  }

  const handleSubmit = (values) => {
    setIsLoading(true)
    ;(curData ? updateApplication : createApplication)(
      {
        ...(curData || {}),
        ...values,
        icon: {
          ...(iconUrl || {}),
          iconType: "CUSTOM"
        }
      },
      {
        onSuccess: (res) => {
          setIsLoading(false)
          if (res?.success) {
            onCancel()
          } else {
            res?.message && message.error(res.message)
          }
        },
        onError: () => {
          setIsLoading(false)
        }
      }
    )
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      handleSubmit(values)
    } catch (errorInfo) {
      if (!errorInfo?.errorFields?.length) {
        handleSubmit(errorInfo?.values)
      }
      console.log("Failed:", errorInfo)
    }
  }

  return (
    <Modal
      open={visible}
      title={curData ? "编辑应用" : "新建应用"}
      onCancel={onCancel}
      onOk={handleSave}
      confirmLoading={isLoading}
      width={550}
    >
      <Form form={form} labelCol={{ span: 5 }} wrapperCol={{ span: 19 }}>
        <Form.Item name="icon" label="图标">
          <div className="flex items-center gap-2">
            <img src={iconUrl?.iconURL || iconImg} className="w-[40px] h-[40px] rounded-lg" />
            <div>
              <Upload
                accept=".jpg,.png"
                maxCount={1}
                showUploadList={false}
                beforeUpload={beforeUpload}
                onChange={handleChange}
                customRequest={({ onSuccess }) => {
                  setTimeout(() => {
                    onSuccess("ok")
                  }, 0)
                }}
              >
                <Button size="small" style={{ fontSize: 12 }} type="default">
                  更换图标
                </Button>
              </Upload>
              <div className="mt-1 text-gray-600 text-[12px]">
                自定义图标支持JPG、PNG格式的图片，建议大于80*80px。
              </div>
            </div>
          </div>
        </Form.Item>
        <Form.Item
          name="appName"
          label="应用名称"
          validateTrigger="onBlur"
          rules={[{ required: true, message: "请输入应用名称" }]}
        >
          <Input placeholder="请输入应用名称" maxLength={30} showCount />
        </Form.Item>
        {!!curData && (
          <Form.Item name="appNo" label="应用编号">
            <Input disabled />
          </Form.Item>
        )}
        <Form.Item
          name="websiteUrl"
          label="应用官网"
          rules={[
            { validator: validateUrl },
            { validator: (...args) => validateAtLeastOneWebsite("websiteUrl", ...args) }
          ]}
        >
          <Input placeholder="请输入应用官网URL链接" />
        </Form.Item>
        <Form.Item
          name="deploymentUrl"
          label="私有化部署"
          rules={[
            { validator: validateUrl },
            { validator: (...args) => validateAtLeastOneWebsite("deploymentUrl", ...args) }
          ]}
        >
          <Input placeholder="请输入私有化部署URL链接" />
        </Form.Item>
        <Form.Item name="appDesc" label="描述">
          <Input.TextArea
            placeholder="请输入应用描述，200字以内，该描述将在灵犀平台-应用中展示"
            maxLength={200}
            showCount
            rows={4}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default ApplicationFormModal
