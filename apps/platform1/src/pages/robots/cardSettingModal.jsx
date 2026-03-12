import { useRef, useEffect, useState, useMemo } from "react"
import { Modal, Form, Input, Button, message, Select, Tabs, Radio } from "antd"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { skillAvatarList } from "@/assets/imgUrl"
import AvatarSelect from "@/pages/addBot/components/AvatarSelect"
import { AVATAR_ICON_TYPE, avatarMode } from "@/constants"
import ShareSettingForm from "@/components/SkillModal/ShareSettingForm"
import { useUpdateRobotBaseSetting } from "@/api/robots"

const { TabPane } = Tabs

const CardSettingModal = ({
  visible,
  onClose,
  botNo,
  initialValues,
  robotNo,
  onSuccess = () => {}
}) => {
  const shareFormRef = useRef(null)
  const [form] = Form.useForm()
  const queryClient = useQueryClient()
  const [selectedAvatar, setSelectedAvatar] = useState(skillAvatarList[0])
  const [tabsActiveKey, setTabsActiveKey] = useState("1")

  // 空间是否调试中
  const isDebug = useMemo(() => {
    return initialValues.status === 2
  }, [initialValues])

  const handleAvatarSelect = ({ iconURL, objectKey, iconType }) => {
    setSelectedAvatar(iconURL)
    form.setFieldsValue({
      iconUrl: iconURL
    })
    form.setFieldsValue({
      icon: { iconURL, objectKey, iconType }
    })
  }

  const onFinish = (values) => {
    console.log("Form values: ", values)
    updateRobotBaseSetting(
      {
        ...values,
        icon: form.getFieldValue("icon") ?? {
          iconURL: selectedAvatar,
          iconType: [...skillAvatarList].includes(selectedAvatar)
            ? AVATAR_ICON_TYPE.SYSTEM
            : AVATAR_ICON_TYPE.CUSTOM
        },
        robotNo,
        botNo
      },
      {
        onSuccess: (e) => {
          queryClient.invalidateQueries([QUERY_KEYS.ROBOT_LIST])
          if (e.success) {
            message.success("更新成功")
            onSuccess()
          } else {
            // @ts-ignore
            message.error(e.message)
          }
        }
      }
    )
    onClose()
  }

  const handleConfirm = () => {
    form
      .validateFields()
      .then((values) => {
        onFinish(values)
        !isDebug && shareFormRef?.current?.onFinish(values)
      })
      .catch((error) => {
        const errorFieldsName = error.errorFields.reduce((pre, cur) => {
          return [...pre, ...cur.name]
        }, [])
        if (errorFieldsName.includes("name")) {
          setTabsActiveKey("1")
        } else {
          setTabsActiveKey("2")
        }
      })
  }

  const { mutate: updateRobotBaseSetting } = useUpdateRobotBaseSetting()

  useEffect(() => {
    if (initialValues?.iconUrl) {
      setSelectedAvatar(initialValues.iconUrl)
    }
  }, [initialValues])

  useEffect(() => {
    setTabsActiveKey("1")
    console.log("🤖==> ~ initialValues:", initialValues)
    form.setFieldsValue(initialValues)
    // 初始化共享设置表单数据
    visible && !isDebug && shareFormRef?.current?.init()
  }, [visible])

  return (
    <Modal
      title="空间基础设置"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="submit" type="primary" onClick={handleConfirm}>
          确定
        </Button>
      ]}
    >
      <Form
        form={form}
        // onFinish={onFinish}
        initialValues={initialValues}
        className="mt-5 skill-modal-form"
        labelCol={{
          span: 5
        }}
      >
        <Tabs type="card" activeKey={tabsActiveKey} onChange={(val) => setTabsActiveKey(val)}>
          <TabPane tab="基础设置" key="1" forceRender>
            <Form.Item
              name="name"
              label="空间名称"
              rules={[{ required: true, message: "空间名称是必填的" }]}
            >
              <Input placeholder="请输入空间名称" />
            </Form.Item>
            <Form.Item
              name="iconUrl"
              label="空间头像"
              initialValue={selectedAvatar}
              className="avatar-form-item"
              rules={[{ required: true, message: "空间头像是必填的" }]}
            >
              <AvatarSelect
                mode={avatarMode.skill}
                selectedAvatar={selectedAvatar}
                handleAvatarSelect={handleAvatarSelect}
              />
            </Form.Item>
            <Form.Item name="showInChatWnd" label="在快速问答展示快捷入口">
              <Radio.Group defaultValue="1">
                <Radio value="1">展示</Radio>
                <Radio value="2">不展示</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="robotDesc" label="描述">
              <Input.TextArea placeholder="请输入空间描述，建议12字以内" rows={2} />
            </Form.Item>
          </TabPane>
          {!isDebug && (
            <TabPane tab="共享设置" key="2" forceRender>
              <ShareSettingForm
                ref={shareFormRef}
                form={form}
                bizType="ROBOT"
                botNo={botNo}
                skillNo={robotNo}
              />
            </TabPane>
          )}
        </Tabs>
      </Form>
    </Modal>
  )
}

export default CardSettingModal
