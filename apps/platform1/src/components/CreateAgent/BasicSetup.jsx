import { useState, useMemo, useEffect, useRef } from "react"
import { Form, Input, Select, Upload, message, Switch, Transfer } from "antd"
import { PlusOutlined } from "@ant-design/icons"
import { fetchUploadFile } from "@/api/common/api"
import { CameraOutlined } from "@ant-design/icons"
import { useStudioPublishData } from "@/hooks/useStudioPublishData"
import { isStudio } from "@/config.env"
import "./index.scss"

export const voiceModeList = [
  { value: "2", label: "剧本模式" },
  { value: "3", label: "智能模式" },
  { value: "1", label: "画布模式" }
]

const BasicSetup = ({
  initialValues,
  agentModeList,
  imageUrl,
  setImageUrl,
  isGeneralAdmin,
  form,
  userListLoading,
  skillUserListData
}) => {
  const [isCanEditByCurrentUser, setIsCanEditByCurrentUser] = useState(
    initialValues?.assignEditableUser || false
  )
  const { isOpenVersion } = useStudioPublishData()
  const [currentAgentMode, setCurrentAgentMode] = useState(initialValues?.agentMode)
  const [targetKeys, setTargetKeys] = useState([])
  const [selectedKeys, setSelectedKeys] = useState([])

  // 初始化targetKeys，将editableUserList中的用户设置为可编辑用户
  useEffect(() => {
    if (skillUserListData && skillUserListData.editableUserList) {
      const editableUsernames = skillUserListData.editableUserList.map((user) => user.username)
      const generalAdminUsernames = (skillUserListData.generalAdminList || []).map(
        (admin) => admin.username || admin
      )
      // 合并可编辑用户和普通管理员
      const initialTargetKeys = [...new Set([...editableUsernames, ...generalAdminUsernames])]
      setTargetKeys(initialTargetKeys)
    }
  }, [skillUserListData])

  // 监听initialValues变化，同步更新isCanEditByCurrentUser状态
  useEffect(() => {
    if (initialValues?.isCanEditByCurrentUser !== undefined) {
      form.setFieldsValue({ isCanEditByCurrentUser: initialValues.assignEditableUser })
      setIsCanEditByCurrentUser(initialValues.assignEditableUser)
    }
  }, [initialValues])

  // 监听agentMode字段变化，更新当前选择的Agent类型
  // useEffect(() => {
  //   if (initialValues?.agentMode !== undefined) {
  //     setCurrentAgentMode(initialValues.agentMode)
  //   }
  // }, [initialValues?.agentMode])

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

  // 监听targetKeys变化，同步更新nonEditableUserList
  useEffect(() => {
    if (userData.length > 0 && targetKeys.length > 0) {
      // 计算不可编辑用户列表 - 只包含不在targetKeys中的用户
      const allUsernames = userData.map((user) => user.key)
      const nonEditableUsers = allUsernames.filter((username) => !targetKeys.includes(username))

      // 直接设置nonEditableUserList，确保它只包含不可编辑的用户
      form.setFieldsValue({
        nonEditableUserList: nonEditableUsers
      })
    }
  }, [targetKeys, userData, form])

  const handleChange = async (info) => {
    if (info.file.status === "uploading") {
      return
    }

    if (info.file.status === "done") {
      try {
        const formData = new FormData()
        formData.append("file", info.file.originFileObj)
        const data = await fetchUploadFile(formData)
        const { temporarySignatureUrl } = data || {}
        if (temporarySignatureUrl) {
          setImageUrl(temporarySignatureUrl)
        }
      } catch (error) {
        console.error("Error uploading file:", error)
        message.error("上传失败")
      }
    }
  }

  const beforeUpload = (file) => {
    const isValidType = ["image/png", "image/jpg", "image/jpeg", "image/gif"].includes(file.type)
    if (!isValidType) {
      message.error("只支持上传 PNG/JPG/JPEG/GIF 格式的图片!")
    }

    const isLt2M = file.size / 1024 / 1024 < 2
    if (!isLt2M) {
      message.error("图片大小不能超过 2MB!")
    }
    return isValidType && isLt2M
  }

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 4, fontSize: "12px" }}>上传</div>
    </div>
  )
  return (
    <>
      <Form.Item
        label="Agent 名称"
        name="agentName"
        rules={[{ required: true, message: "请输入Agent名称" }]}
      >
        <Input placeholder="请输入Agent名称" maxLength={50} />
      </Form.Item>

      {initialValues && (
        <Form.Item
          label="Agent 编号"
          name="agentNo"
          rules={[{ required: true, message: "请输入Agent 编号" }]}
        >
          <Input disabled={true} placeholder="请输入Agent 编号" maxLength={50} />
        </Form.Item>
      )}
      <Form.Item
        label="Agent 类型"
        name="agentMode"
        rules={[{ required: true, message: "请选择Agent类型" }]}
      >
        <Select
          disabled={!!initialValues}
          placeholder="请选择Agent类型"
          options={
            isStudio() && isOpenVersion
              ? agentModeList?.map((item) => ({
                  ...item,
                  disabled: [2].includes(item.value)
                }))
              : agentModeList
          }
          onChange={(value) => setCurrentAgentMode(value)}
        />
      </Form.Item>

      {/* 语音模式选择框 - 当选择语音类型时显示 */}
      {form.getFieldValue("agentMode") == 2 && !initialValues && (
        <Form.Item
          label="语音模式"
          name="voiceMode"
          rules={[{ required: true, message: "请选择语音模式" }]}
          tooltip={{
            title: (
              <div className="max-w-xs">
                <div className="text-red-500 mb-2">
                  【注意】选择后将无法更改，请仔细考虑您的需求；
                </div>
                <div className="mb-1">【智能模式】基于AI智能对话的语音交互模式，自动理解意图；</div>
                <div className="mb-1">【画布模式】通过可视化画布设计对话流程，拖拽式编辑体验；</div>
                <div>【剧本模式】基于预设剧本的结构化对话，精确控制对话流程；</div>
              </div>
            ),
            placement: "topLeft"
          }}
        >
          <Select placeholder="请选择语音模式" defaultValue="2" options={voiceModeList} />
        </Form.Item>
      )}

      <Form.Item label="描述" name="description">
        <Input.TextArea
          placeholder="请输入描述"
          maxLength={200}
          autoSize={{ minRows: 3, maxRows: 5 }}
        />
      </Form.Item>

      <Form.Item
        label="图标"
        name="icon"
        className="small-upload-card"
        rules={[{ required: true, message: "请上传图标" }]}
      >
        <Upload
          name="file"
          listType="picture-card"
          showUploadList={false}
          beforeUpload={beforeUpload}
          onChange={handleChange}
          customRequest={({ file, onSuccess }) => {
            setTimeout(() => {
              onSuccess("ok")
            }, 0)
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="avatar"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover"
              }}
            />
          ) : (
            uploadButton
          )}
          <div
            className="absolute -bottom-[5px] left-[40px] bg-[#7F56D9] text-white rounded-full w-[24px] h-[24px] flex items-center justify-center"
            style={{ border: "1px solid #fff" }}
          >
            <CameraOutlined />
          </div>
        </Upload>
      </Form.Item>

      {/* isGeneralAdmin */}
      {isGeneralAdmin && initialValues && initialValues.agentMode === 1 && (
        <Form.Item
          tooltip="开启后，可指定非普通管理员角色编辑本工作流，请确认该用户角色可访问本模块"
          label="指定编辑用户"
          name="isCanEditByCurrentUser"
          valuePropName="checked"
          // initialValue={initialValues?.assignEditableUser || false}
          labelCol={{ span: 5 }}
          layout="horizontal"
          className="-ml-4"
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
      {isGeneralAdmin &&
        isCanEditByCurrentUser &&
        initialValues &&
        initialValues.agentMode === 1 && (
          <Form.Item label="编辑用户" name="editableUsers">
            <Transfer
              dataSource={userData}
              titles={["不可编辑用户", "可编辑用户"]}
              targetKeys={targetKeys}
              loading={userListLoading}
              selectedKeys={selectedKeys}
              onChange={(nextTargetKeys) => {
                // 只确保必要的普通管理员在可编辑列表中，而不是所有的普通管理员
                // 获取用户明确想要移除的用户（从右侧移到左侧的）
                const removedKeys = targetKeys.filter((key) => !nextTargetKeys.includes(key))

                // 过滤掉用户明确想要移除的普通管理员
                const necessaryAdmins = generalAdminList.filter(
                  (admin) => !removedKeys.includes(admin)
                )

                // 合并用户选择的和必要的管理员
                const finalTargetKeys = [...new Set([...nextTargetKeys, ...necessaryAdmins])]
                setTargetKeys(finalTargetKeys)

                // 计算不可编辑用户列表 - 只包含用户明确移动到左侧的用户
                // 从所有用户中获取用户名列表
                const allUsernames = userData.map((user) => user.key)

                // 不可编辑用户是所有用户减去可编辑用户
                const nonEditableUsers = allUsernames.filter(
                  (username) => !finalTargetKeys.includes(username)
                )

                // 同时设置 editableUsers 和 nonEditableUserList
                form.setFieldsValue({
                  editableUsers: finalTargetKeys,

                  nonEditableUserList: nonEditableUsers
                })
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
    </>
  )
}

export default BasicSetup
