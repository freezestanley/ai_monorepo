import { Modal, Form, Input, Button, Space, message } from "antd"
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons"
import { useState, useEffect } from "react"
import { useFetchSourceTag } from "@/api/sourceTag"
import { batchSaveSourceTag } from "@/api/sourceTag/api"

const BusinessSourceModal = ({ visible, onCancel, onOk, detail }) => {
  const [form] = Form.useForm()
  const [sources, setSources] = useState([{ id: 0, value: "" }])
  const { mutate: fetchSourceTag } = useFetchSourceTag()
  const [addLoading, setAddLoading] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)

  useEffect(() => {
    if (visible && detail?.botNo) {
      form.resetFields()
      fetchSourceTag(
        {
          botNo: detail.botNo,
          tagType: "optimizationBizSource"
        },
        {
          onSuccess: (res) => {
            if (res.success === true) {
              const existingSources = res.data || []
              if (existingSources.length > 0) {
                setSources(
                  existingSources.map((item, index) => ({
                    displayId: index,
                    id: item.id,
                    value: item.tagDesc,
                    code: item.code
                  }))
                )
                existingSources.forEach((item, index) => {
                  form.setFieldValue(`source_${index}`, item.tagDesc)
                })
              } else {
                setSources([{ displayId: 0, id: undefined, value: "" }])
              }
            }
          }
        }
      )
    }
  }, [visible, detail?.botNo])

  const handleAddSource = () => {
    setAddLoading(true)
    const displayId = sources.length > 0 ? Math.max(...sources.map((s) => s.displayId ?? 0)) + 1 : 0
    setSources([...sources, { displayId, id: undefined, value: "" }])

    // 等待 DOM 更新后滚动到新增的输入框
    setTimeout(() => {
      const scrollContainer = document.querySelector(".max-h-\\[300px\\]")
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: "smooth"
        })
      }
      setAddLoading(false)
    }, 100)
  }

  const handleDeleteSource = (displayId) => {
    if (sources.length === 1) return
    setSources(sources.filter((item) => item.displayId !== displayId))
  }

  const handleOk = async () => {
    try {
      setConfirmLoading(true)
      const values = await form.validateFields()
      const sourceList = sources
        .map((item) => ({
          tagDesc: values[`source_${item.displayId}`],
          code: values[`source_${item.displayId}`],
          ...(item.id && { id: item.id })
        }))
        .filter((item) => item.tagDesc)

      const res = await batchSaveSourceTag({
        botNo: detail.botNo,
        tagType: "optimizationBizSource",
        tags: sourceList
      })

      if (res.success) {
        message.success("保存成功")
        onOk(sourceList)
      } else {
        message.error(res.message || "保存失败")
      }
    } catch (error) {
      console.error("Save business source error:", error)
      message.error("保存失败")
    } finally {
      setConfirmLoading(false)
    }
  }

  return (
    <Modal
      title="业务来源管理"
      open={visible}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={confirmLoading}
      width={520}
      destroyOnClose
    >
      <div className="flex flex-col">
        <div className="max-h-[300px] overflow-y-auto px-2">
          <Form form={form} layout="vertical">
            {sources.map((source) => (
              <Form.Item key={source.displayId} style={{ marginBottom: 16 }}>
                <Space>
                  <Form.Item
                    name={`source_${source.displayId}`}
                    style={{ marginBottom: 0 }}
                    rules={[{ required: true, message: "请输入业务来源" }]}
                  >
                    <Input placeholder="请输入业务来源" style={{ width: 400 }} />
                  </Form.Item>
                  {sources.length > 1 && !source.id && (
                    <DeleteOutlined
                      className="cursor-pointer text-[#ff4d4f]"
                      onClick={() => handleDeleteSource(source.displayId)}
                    />
                  )}
                </Space>
              </Form.Item>
            ))}
          </Form>
        </div>
        <div className="flex justify-start">
          <Button
            type="link"
            icon={<PlusOutlined />}
            onClick={handleAddSource}
            style={{ padding: 0 }}
            loading={addLoading}
          >
            新增业务来源
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default BusinessSourceModal
