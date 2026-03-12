import React, { useRef, useEffect, useState, useMemo } from "react"
import { Modal, Form, Input, Button, message, Select, Tabs, Switch, Transfer } from "antd"
import { useFetchLlmModelType, useFetchSkillType } from "@/api/common"
import { useUpdateSkill, useUpdateSubscribeSkill, useFetchSkillUserList } from "@/api/skill"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { skillAvatarList } from "@/assets/imgUrl"
import { useFetchAppPlatformList, useCheckIsGeneralAdmin } from "@/api/bot"
import AvatarSelect from "@/pages/addBot/components/AvatarSelect"
import "./index.scss"
import { AVATAR_ICON_TYPE, avatarMode } from "@/constants"
import SecurityPolicySwitch from "../SecurityPolicySwitch"
import ShareSettingForm from "./ShareSettingForm"
import { fetchSourceTag } from "@/api/sourceTag/api"
import { useFetchSourceTagList } from "@/api/sourceTag"
import { getDifyToken } from "@/components/CreateSkillStep"
import { useStudioPublishData } from "@/hooks/useStudioPublishData"

const { TabPane } = Tabs

export const canReadOptions = [
  { label: "可查看详情，不可编辑", value: true },
  { label: "不可查看详情，不可编辑", value: false }
]

const SkillModal = ({
  visible,
  onClose,
  botNo,
  initialValues: initValues,
  skillNo,
  onSuccess = () => {}
}) => {
  const shareFormRef = useRef(null)
  const [form] = Form.useForm()
  const queryClient = useQueryClient()
  const [selectedAvatar, setSelectedAvatar] = useState(skillAvatarList[0])
  const [tabsActiveKey, setTabsActiveKey] = useState("1")
  const [isCanEditByCurrentUser, setIsCanEditByCurrentUser] = useState(false)
  const [targetKeys, setTargetKeys] = useState([])
  const [selectedKeys, setSelectedKeys] = useState([])

  const { data: appPlatformList = [] } = useFetchAppPlatformList()
  const { data: isGeneralAdmin = false } = useCheckIsGeneralAdmin(botNo)

  const { isPublishDisabled: isVersion } = useStudioPublishData()

  // 获取工作流用户列表
  const { data: skillUserListData = [], isLoading: userListLoading } = useFetchSkillUserList({
    botNo,
    skillNo,
    enabled: visible && !!botNo && !!skillNo
  })

  // 生成用户数据，用于Transfer组件
  const userData = useMemo(() => {
    if (!skillUserListData || typeof skillUserListData !== "object") {
      return []
    }
    const {
      editableUserList = [],
      nonEditableUserList = [],
      generalAdminList = [],
      adminList = []
    } = skillUserListData

    // 合并所有用户列表，去重
    const allUsers = [...editableUserList, ...nonEditableUserList]
    const uniqueUsers = allUsers.filter(
      (user, index, self) => index === self.findIndex((u) => u.username === user.username)
    )

    // 提取管理员用户名列表用于判断
    const adminUsernames = adminList.map((admin) => admin.username)
    const generalAdminUsernames = generalAdminList.map((admin) => admin.username)

    return uniqueUsers.map((user) => ({
      key: user.username,
      title: user.name || user.username, // 显示name，如果没有则显示username
      description: generalAdminUsernames.includes(user.username) ? "普通管理员" : "普通用户",
      disabled: adminUsernames.includes(user.username) // 在adminList中的用户禁止移动
    }))
  }, [skillUserListData])

  // 获取普通管理员列表，用于过滤
  const generalAdminList = useMemo(() => {
    if (!skillUserListData || typeof skillUserListData !== "object") {
      return []
    }
    const adminList = skillUserListData.generalAdminList || []
    // 如果是对象数组，提取username；如果是字符串数组，直接返回
    return adminList.map((admin) => admin.username || admin)
  }, [skillUserListData])

  // 设置默认的可编辑用户（targetKeys）
  const defaultTargetKeys = useMemo(() => {
    if (!skillUserListData || typeof skillUserListData !== "object") {
      return []
    }
    const { editableUserList = [], generalAdminList = [] } = skillUserListData
    // 提取用户名
    const editableUsernames = editableUserList.map((user) => user.username || user)
    const generalAdminUsernames = generalAdminList.map((user) => user.username || user)
    // 合并可编辑用户和普通管理员，确保普通管理员始终在可编辑列表中
    return [...new Set([...editableUsernames, ...generalAdminUsernames])]
  }, [skillUserListData])

  // 当用户数据加载完成后，更新targetKeys
  useEffect(() => {
    if (defaultTargetKeys.length > 0) {
      setTargetKeys(defaultTargetKeys)
      form.setFieldsValue({ editableUsers: defaultTargetKeys })
    }
  }, [defaultTargetKeys, form])

  // 是否订阅工作流
  const isSubscribedSkill = useMemo(() => {
    return initValues.type === "subscribed_skill"
  }, [initValues])

  // 工作流是否调试中
  const isDebug = useMemo(() => {
    return initValues.status === 2
  }, [initValues])

  const initialValues = useMemo(() => {
    const { subscribeSettings = {} } = initValues
    // 如果是订阅工作流，则取 subscribeSettings 覆盖原默认值
    return isSubscribedSkill ? { ...initValues, ...subscribeSettings } : { ...initValues }
  }, [initValues, isSubscribedSkill])

  const handleAvatarSelect = ({ iconURL, objectKey, iconType }) => {
    setSelectedAvatar(iconURL)
    form.setFieldsValue({
      iconUrl: iconURL
    })
    form.setFieldsValue({
      icon: { iconURL, objectKey, iconType }
    })
  }

  const onFinish = async (values) => {
    console.log("Form values: ", values)
    if (isSubscribedSkill) {
      return handleUpdateSubscribeSkill(values)
    }
    if (initValues.generateMethod === 2) {
      const difyRes = await getDifyToken(botNo)
      if (!difyRes) return
      values.difyAccessToken = difyRes.difyData?.access_token
    }
    /* 去除未分组 */
    if (!values.groupTagId) {
      delete values.groupTagId
    }

    // 计算用户权限列表
    const allUsers = userData.map((user) => user.key)
    const editableUserList = targetKeys || []
    const nonEditableUserList = allUsers.filter((user) => !editableUserList.includes(user))

    updateSkill(
      {
        ...values,
        icon: form.getFieldValue("icon") ?? {
          iconURL: selectedAvatar,
          iconType: [...skillAvatarList].includes(selectedAvatar)
            ? AVATAR_ICON_TYPE.SYSTEM
            : AVATAR_ICON_TYPE.CUSTOM
        },
        skillNo,
        // 添加用户权限字段
        editableUserList,
        nonEditableUserList,
        assignEditableUser: isCanEditByCurrentUser
      },
      {
        onSuccess: (e) => {
          console.log(e)
          queryClient.invalidateQueries([QUERY_KEYS.SKILL_INFO, skillNo])
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

  const handleUpdateSubscribeSkill = (values) => {
    updateSubscribeSkill(
      {
        botNo,
        skillNo,
        ...values,
        type: initialValues.type
      },
      {
        onSuccess: (e) => {
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
        if (errorFieldsName.includes("skillName")) {
          setTabsActiveKey("1")
        } else {
          setTabsActiveKey("2")
        }
      })
  }

  // const { data: skillType = [] } = useFetchSkillType()
  const { mutate: updateSkill } = useUpdateSkill()
  const { mutate: updateSubscribeSkill } = useUpdateSubscribeSkill()

  const { data: groupData = {} } = useFetchSourceTagList(
    {
      botNo,
      tagType: "skillGroupTag"
    },
    {
      enabled: !!botNo
    }
  )

  const skillGroupList = useMemo(() => {
    // @ts-ignore
    return [{ id: 0, tagDesc: "未分组" }, ...(groupData.data || [])]
  }, [groupData])

  useEffect(() => {
    if (initialValues?.iconUrl) {
      setSelectedAvatar(initialValues.iconUrl)
    }
  }, [initialValues])

  useEffect(() => {
    setTabsActiveKey("1")
    console.log("🤖==> ~ initialValues:", initialValues)

    initialValues.groupTagId = +(initialValues.groupTagId || 0)

    // 初始化指定编辑用户状态
    setIsCanEditByCurrentUser(initialValues.assignEditableUser)

    form.setFieldsValue({
      ...initialValues,
      isCanEditByCurrentUser: initialValues.assignEditableUser
    })
    if (initialValues.editableUsers) {
      setTargetKeys(initialValues.editableUsers)
    }

    // 初始化共享设置表单数据
    visible && !isDebug && shareFormRef?.current?.init()
  }, [visible])

  return (
    <Modal
      title={isSubscribedSkill ? "订阅工作流设置" : "工作流基础设置"}
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="submit" type="primary" disabled={isVersion} onClick={handleConfirm}>
          确定
        </Button>
      ]}
    >
      <Form
        form={form}
        disabled={isVersion}
        // onFinish={onFinish}
        initialValues={initialValues}
        className="mt-5 skill-modal-form pr-2"
        labelCol={{
          span: 4
        }}
      >
        {isSubscribedSkill ? (
          <>
            <Form.Item
              name="name"
              label="显示名称"
              rules={[{ required: true, message: "请输入显示名称" }]}
            >
              <Input placeholder="请输入显示名称" />
            </Form.Item>
            <Form.Item name="description" label="描述">
              <Input.TextArea placeholder="请输入描述" />
            </Form.Item>
            {initialValues.type !== "3" && (
              <Form.Item
                label="可见应用端"
                name="applicationPlatformTypes"
                tooltip={"若本工作流所属空间未配置对应应用端，则本工作流不可见"}
                initialValue={[...appPlatformList.map((item) => item.code)]}
                rules={[{ required: false, message: "请选择应用端" }]}
              >
                <Select
                  allowClear
                  style={{ width: 370 }}
                  placeholder="请选择"
                  mode="multiple"
                  options={appPlatformList}
                  fieldNames={{ label: "name", value: "code" }}
                />
              </Form.Item>
            )}
          </>
        ) : (
          <Tabs type="card" activeKey={tabsActiveKey} onChange={(val) => setTabsActiveKey(val)}>
            <TabPane tab="基础设置" key="1" forceRender>
              <Form.Item name="skillNo" label="工作流编号">
                <Input placeholder="请输入工作流编号" disabled={true} />
              </Form.Item>
              <Form.Item
                name="skillName"
                label="工作流名称"
                rules={[{ required: true, message: "工作流名称是必填的" }]}
              >
                <Input placeholder="请输入工作流名称" />
              </Form.Item>
              <Form.Item name="description" label="描述">
                <Input.TextArea placeholder="请输入描述" />
              </Form.Item>
              <Form.Item
                name="groupTagId"
                label="工作流分组"
                rules={[{ required: true, message: "请选择工作流分组" }]}
              >
                <Select
                  allowClear
                  style={{ width: 370 }}
                  placeholder="请选择"
                  options={skillGroupList}
                  fieldNames={{ label: "tagDesc", value: "id" }}
                />
              </Form.Item>
              {/* 类型只展示当前类型 */}
              <Form.Item name="type" label="类型">
                {initialValues.type === "1"
                  ? "快速问答"
                  : initialValues.type === "2"
                    ? "表单类型"
                    : "API类型"}
                {/* <Radio.Group buttonStyle="solid" disabled>
                    {skillType.map((type) => (
                      <Radio.Button key={type.code} value={type.code}>
                        {type.name}
                      </Radio.Button>
                    ))}
                  </Radio.Group> */}
              </Form.Item>
              {/* <Form.Item
                  name="iconUrl"
                  label="头像"
                  initialValue={selectedAvatar}
                  className="avatar-form-item"
                >
                  <AvatarSelect
                    mode={avatarMode.skill}
                    selectedAvatar={selectedAvatar}
                    handleAvatarSelect={handleAvatarSelect}
                  />
                </Form.Item> */}
              {initialValues.type !== "3" && (
                <Form.Item
                  label="可见应用端"
                  name="applicationPlatformTypes"
                  tooltip={"若本工作流所属空间未配置对应应用端，则本工作流不可见"}
                  initialValue={[...appPlatformList.map((item) => item.code)]}
                  rules={[{ required: false, message: "请选择应用端" }]}
                >
                  <Select
                    allowClear
                    style={{ width: 370 }}
                    placeholder="请选择"
                    mode="multiple"
                    options={appPlatformList}
                    fieldNames={{ label: "name", value: "code" }}
                  />
                </Form.Item>
              )}
              <Form.Item
                tooltip={
                  initialValues.type === "1"
                    ? "快速聊天工作流必须开启安全策略，安全网关将过滤敏感词等风险信息"
                    : "启用后,安全网关将过滤敏感词等风险信息"
                }
                label="安全策略"
                name="enableSenseInfoDetect"
                valuePropName="checked"
                initialValue={true}
              >
                <SecurityPolicySwitch form={form} disabled={true} />
              </Form.Item>
              {/* isGeneralAdmin */}
              {isGeneralAdmin && (
                <Form.Item
                  tooltip="开启后，可指定非普通管理员角色编辑本工作流，请确认该用户角色可访问本模块"
                  label="指定编辑用户"
                  name="isCanEditByCurrentUser"
                  valuePropName="checked"
                >
                  <Switch
                    checked={isCanEditByCurrentUser}
                    checkedChildren="开"
                    unCheckedChildren="关"
                    onChange={(checked) => {
                      setIsCanEditByCurrentUser(checked)
                      form.setFieldsValue({ isCanEditByCurrentUser: checked })
                    }}
                  />
                </Form.Item>
              )}
              {/*  */}
              {isGeneralAdmin && isCanEditByCurrentUser && (
                <Form.Item label="编辑用户" name="editableUsers">
                  <Transfer
                    dataSource={userData}
                    loading={userListLoading}
                    titles={["不可编辑用户", "可编辑用户"]}
                    targetKeys={targetKeys}
                    selectedKeys={selectedKeys}
                    onChange={(nextTargetKeys) => {
                      // 确保普通管理员始终在可编辑列表中
                      const finalTargetKeys = [...new Set([...nextTargetKeys, ...generalAdminList])]
                      setTargetKeys(finalTargetKeys)
                      form.setFieldsValue({ editableUsers: finalTargetKeys })
                    }}
                    onSelectChange={(sourceSelectedKeys, targetSelectedKeys) => {
                      // 获取adminList，过滤掉在adminList中的用户，使其在右侧不可选中
                      const { adminList = [] } = skillUserListData || {}
                      const filteredTargetSelectedKeys = targetSelectedKeys.filter(
                        (key) => !adminList.includes(key)
                      )
                      setSelectedKeys([...sourceSelectedKeys, ...filteredTargetSelectedKeys])
                    }}
                    render={(item) => (
                      <div className="flex items-center justify-between">
                        <span>{item.title}</span>
                        {item.disabled && (
                          <span className="ml-2 px-1 py-0.5 text-[10px] bg-blue-100 text-blue-600 rounded">
                            管理员
                          </span>
                        )}
                      </div>
                    )}
                    showSearch
                    filterOption={(inputValue, option) => option.title.indexOf(inputValue) > -1}
                    style={{
                      marginBottom: 16,
                      width: "100%",
                      minWidth: 500
                    }}
                    listStyle={{
                      width: 250,
                      height: 300
                    }}
                  />
                </Form.Item>
              )}
            </TabPane>
            {!isDebug && !initValues.appId && (
              <TabPane tab="共享设置" key="2" forceRender>
                <ShareSettingForm
                  ref={shareFormRef}
                  form={form}
                  bizType="SKILL"
                  botNo={botNo}
                  skillNo={skillNo}
                />
              </TabPane>
            )}
          </Tabs>
        )}
      </Form>
    </Modal>
  )
}

export default SkillModal
