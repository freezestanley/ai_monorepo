import { useEffect, useState } from "react"
import { Modal, Form, Radio, Button, message, Select } from "antd"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"
import "./index.scss"
import { useUpdateKnowledgeFaqEmbedding } from "@/api/knowledge"

const ChatKnowledgeModal = ({
  visible,
  onClose,
  initialValues,
  knowledgeBaseNo,
  onSuccess = () => {}
}) => {
  const [form] = Form.useForm()
  const queryClient = useQueryClient()
  const { mutate: updateKnowledgeFaqEmbedding } = useUpdateKnowledgeFaqEmbedding()

  const onFinish = (values) => {
    updateKnowledgeFaqEmbedding(
      { knowledgeBaseNo, ...values },
      {
        onSuccess: (e) => {
          console.log(e)
          if (e.success) {
            message.success("更新成功")
            onSuccess()
            queryClient.invalidateQueries([QUERY_KEYS.KNOWLEDGE_LIST])
          } else {
            // @ts-ignore
            message.error(e.message)
          }
        },
        onError: (e) => {
          console.log(e)
        }
      }
    )
    onClose()
  }

  useEffect(() => {
    form.setFieldsValue(initialValues)
  }, [visible])

  return (
    <Modal
      title="问答知识库设置"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="submit" type="primary" onClick={() => form.submit()}>
          确定
        </Button>
      ]}
    >
      <Form
        form={form}
        onFinish={onFinish}
        initialValues={initialValues}
        className="mt-5"
        labelCol={{
          span: 5
        }}
      >
        <Form.Item
          name="embeddingType"
          label="文本向量模型"
          // rules={[{ required: true, message: "文本向量模型是必填的" }]}
        >
          <Radio.Group defaultValue={"GPT_EMBEDDING"}>
            <Radio value={"GPT_EMBEDDING"}>GPT embedding</Radio>
            <Radio value={"SHUKE_1B"}>shuke_1B</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default ChatKnowledgeModal
