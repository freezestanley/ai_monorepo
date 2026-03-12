import { AVATAR_ICON_TYPE, avatarMode } from "@/constants"
import { Button, Col, Form, Input, message, Row } from "antd"
import React, { useEffect, useLayoutEffect } from "react"
import AvatarSelect from "../addBot/components/AvatarSelect"
import { newAvatarList } from "@/assets/imgUrl"
import { useFetchBotInfo, useUpdateBotBasicSettings } from "@/api/bot"
import { useLocation } from "react-router-dom"
import queryString from "query-string"
import useBotForm from "../addBot/hooks/useBotForm"
import { MessageType } from "@/constants/postMessageType"
import { postMessageForLX } from "@/utils"

function BasicSettings() {
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)
  const { botNo } = queryParams
  const { data: botDetails = {}, refetch } = useFetchBotInfo(botNo)
  const { mutateAsync: updateBotBasicSettings } = useUpdateBotBasicSettings()
  const [form] = Form.useForm()
  const { selectedAvatar, setSelectedAvatar, handleAvatarSelect } = useBotForm({
    form
  })

  useEffect(() => {
    if (botDetails) {
      form.setFieldsValue({
        description: botDetails.description,
        botIconUrl: botDetails.botIconUrl,
        greeting: botDetails.greeting,
        chatPageHeading: botDetails.chatPageHeading
      })
      setSelectedAvatar(botDetails.botIconUrl)
    }
  }, [botDetails, form])

  const onFinish = async () => {
    const values = form.getFieldsValue()
    console.log("Received values of form: ", values)
    try {
      const { success, ...d } = await updateBotBasicSettings({
        botNo,
        ...values,
        icon: {
          iconURL: values.botIconUrl,
          iconType: [...newAvatarList].includes(values.botIconUrl)
            ? AVATAR_ICON_TYPE.SYSTEM
            : AVATAR_ICON_TYPE.CUSTOM
        }
      })
      if (success) {
        refetch()
        postMessageForLX({
          type: MessageType.REFRESH_APP_BOT_LIST
        })
        message.success(d.message)
      }
    } catch (error) {
      console.error("Error:", error)
    }
  }

  return (
    <div className="admin-container">
      <div className="admin-header" style={{ display: "block" }}>
        <div className="flex items-center justify-between w-full mb-2">
          <h2 className="flex items-center">基础设置</h2>
        </div>
      </div>
      <div className="flex justify-end pt-6">
        <Button type="primary" onClick={onFinish}>
          保存
        </Button>
      </div>
      <div className="admin-content">
        <Form
          form={form}
          onFinish={onFinish}
          labelCol={{
            xs: { span: 24 },
            sm: { span: 4 }
          }}
          wrapperCol={{
            xs: { span: 16 },
            sm: { span: 16 }
          }}
        >
          <Form.Item label="空间名称">
            <div>{botDetails.botName}</div>
          </Form.Item>
          <Form.Item label="空间编号">
            <div>{botDetails.botNo}</div>
          </Form.Item>
          <Form.Item label="知识库编号编号">
            <div>{botDetails.knowledgeBaseNo}</div>
          </Form.Item>
          {/* <Form.Item
            label="空间说明"
            name="description"
            rules={[{ max: 200, message: "最多200个字" }]}
            initialValue={botDetails.description}
          >
            <Input.TextArea
              rows={3}
              maxLength={200}
              placeholder="用于首页空间选择列表展示，建议不超过30个字"
            />
          </Form.Item> */}
          <Form.Item
            label="空间头像"
            name="botIconUrl"
            rules={[{ required: true, message: "请选择头像" }]}
          >
            <AvatarSelect
              mode={avatarMode.bot}
              disabled={false}
              selectedAvatar={selectedAvatar}
              handleAvatarSelect={handleAvatarSelect}
            />
          </Form.Item>
          {/* <Form.Item
            label="快速问答标题"
            name="chatPageHeading"
            rules={[
              { max: 20, message: "最多20个字" },
              { required: true, message: "快速问答标题不能为空" }
            ]}
            initialValue={botDetails.chatPageHeading}
          >
            <Input
              defaultValue={"众有灵犀 你的智能伙伴"}
              maxLength={20}
              placeholder="请输入快速问答标题"
            />
          </Form.Item>
          <Form.Item
            label="快速问答欢迎语"
            name="greeting"
            rules={[{ max: 200, message: "最多200个字" }]}
            initialValue={botDetails.greeting}
          >
            <Input.TextArea
              defaultValue={
                "Hi，我是灵犀，你的智能伙伴。无论你想找灵感、写文案，还是需要一个陪伴聊天解闷，我都会全力以赴"
              }
              rows={3}
              maxLength={200}
              placeholder="请输入说明，最多不超过200字。"
            />
          </Form.Item> */}
        </Form>
      </div>
    </div>
  )
}

export default BasicSettings
