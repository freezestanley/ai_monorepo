import { useState, useEffect, useRef, useMemo } from "react"
import { Modal, Form, Tabs, Tooltip } from "antd"
import { useAddAgent, useUpdateAgentNew } from "@/api/agent"
import { useUpdateFlowType } from "@/api/voiceAgent"
import { generateNO } from "@/utils"
import defaultAgentIcon from "../../assets/img/agentAvater-new.png?url"
import BasicSetup from "./BasicSetup"
import ShareSettingForm from "@/components/SkillModal/ShareSettingForm"
import { useQueryClient } from "@tanstack/react-query"
import { useCheckIsGeneralAdmin } from "@/api/bot"
import { useFetchAgentUserList } from "@/api/skill"
import "./index.scss"
import { message } from "antd"
import { getAgentLatestVersion } from "@/api/agent/api"
import { useStudioPublishData } from "@/hooks/useStudioPublishData"

const defaultImageUrl = defaultAgentIcon
// "http://za-aigc-platform-test.oss-cn-hzjbp-b-internal.aliyuncs.com/ubveafukuibky.png?Expires=http://za-aigc-platform-prd.oss-cn-hzjbp-b-internal.aliyuncs.com/ubvegygocccke.png?Expires=1748055095&OSSAccessKeyId=LTAI5tJDRSw9xTCEV3678AHj&Signature=ZTSv%2BkTiwbs2luTnELKNGLI2GeU%3D&OSSAccessKeyId=LTAI5tMugme8cECmAEPFEd1r&Signature=JYbz9s%2F9wzECvx2SSvpXRgh47W4%3D"

const CreateAgent = ({ visible, onClose, agentModeList, currentBotNo, initialValues }) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState(defaultImageUrl)
  const [tabsActiveKey, setTabsActiveKey] = useState("1")
  const { mutate: addAgent } = useAddAgent()
  const { mutate: updateAgent } = useUpdateAgentNew()
  const updateFlowType = useUpdateFlowType()
  const queryClient = useQueryClient()
  const shareFormRef = useRef(null)

  const { isPublishDisabled: isVersion } = useStudioPublishData()

  const { data: isGeneralAdmin = false } = useCheckIsGeneralAdmin(currentBotNo)

  // 获取工作流用户列表
  const { data: skillUserListData = [], isLoading: userListLoading } = useFetchAgentUserList({
    botNo: currentBotNo,
    agentNo: initialValues?.agentNo,
    enabled: visible && !!currentBotNo && !!initialValues?.agentNo
  })

  // 初始化表单数据
  useEffect(() => {
    if (!visible) {
      form.resetFields()
      setTabsActiveKey("1")
      return
    }
    if (initialValues && currentBotNo) {
      form.setFieldsValue({
        agentName: initialValues.agentName,
        agentNo: initialValues?.agentNo,
        agentMode: initialValues.agentMode,
        description: initialValues.description
      })
      shareFormRef?.current?.init?.({
        ...initialValues,
        skillNo: initialValues.agentNo,
        botNo: currentBotNo
      })
      setImageUrl(initialValues.icon || defaultImageUrl)
    } else {
      setImageUrl(defaultImageUrl)
    }
  }, [visible, currentBotNo, initialValues, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      // 计算nonEditableUserList（不可编辑用户列表）
      // Transfer组件中，左侧是"不可编辑用户"，右侧是"可编辑用户"
      // targetKeys包含的是右侧的用户，即可编辑用户
      const editableUsers = values.editableUsers || [] // 这是targetKeys，即右侧可编辑用户的username列表

      // 从所有用户中获取不可编辑用户列表（即不在editableUsers中的用户）
      const allUsernames = (skillUserListData?.editableUserList || [])
        .concat(skillUserListData?.nonEditableUserList || [])
        .map((user) => user.username)
        .filter((username, index, self) => self.indexOf(username) === index) // 去重

      const nonEditableUserList = allUsernames.filter(
        (username) => !editableUsers.includes(username)
      )

      // 提交数据准备完成

      const submitData = {
        ...values,
        botNo: currentBotNo,
        icon: imageUrl,
        assignEditableUser: values?.isCanEditByCurrentUser || false,
        nonEditableUserList,
        editableUserList: editableUsers
      }

      if (initialValues) {
        // 更新模式
        updateAgent(
          {
            ...submitData,
            agentNo: initialValues.agentNo
          },
          {
            onSettled: () => {
              setLoading(false)
            },
            onSuccess: (res) => {
              if (res.success) {
                onClose()
              }
            }
          }
        )
        shareFormRef?.current?.onFinish?.(values)
      } else {
        // 创建模式
        const agentNo = generateNO("a")
        addAgent(
          {
            ...submitData,
            agentNo
          },
          {
            onSettled: () => {
              setLoading(false)
            },
            onSuccess: async (res) => {
              if (res.success) {
                // 如果是语音类型，更新语音模式
                if (values.agentMode === 2 && values.voiceMode) {
                  try {
                    // 先请求 last 拿到 version
                    const versionRes = await getAgentLatestVersion(res?.data, "")
                    if (!versionRes || !versionRes?.success) {
                      message.error("获取版本详情失败！")
                    } else {
                      const resVoice = await updateFlowType({
                        botNo: currentBotNo,
                        agentNo: agentNo,
                        agentVersionNo: versionRes?.data?.versionNo || undefined, //res.data?.versionNo, // 因为现在拿不到agent 详情的版本, 更新语音模板支持不传agentVersionNo
                        flowType: values.voiceMode ? Number(values.voiceMode) : undefined
                      })
                      if (resVoice?.status == 200) {
                        message.success("Agent 创建成功")
                      } else {
                        message.info(
                          `【注意】当前语音模式：${versionRes?.data?.agentName || res?.data || res?.message}，请进入语音Agent详情内选择模式！`
                        )
                      }
                    }
                  } catch (error) {
                    console.error("更新语音模式失败:", error)
                    // 即使更新失败，也不影响主流程，继续执行
                  }
                } else {
                  message.success("Agent 创建成功")
                }

                form.resetFields()
                setImageUrl(defaultAgentIcon)
                onClose()
              }
            }
          }
        )
      }
    } catch (error) {
      console.log("error:", error)
      setLoading(false)
      const errorFieldsName = error.errorFields.reduce((pre, cur) => {
        return [...pre, ...cur.name]
      }, [])
      if (
        errorFieldsName.includes("agentName") ||
        errorFieldsName.includes("agentMode") ||
        errorFieldsName.includes("agentNo")
      ) {
        setTabsActiveKey("1")
      } else {
        setTabsActiveKey("2")
      }
    }
  }

  return (
    <Modal
      title={initialValues ? "编辑 Agent" : "创建 Agent"}
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={700}
      maskClosable={false}
      okButtonProps={{ disabled: isVersion }}
    >
      <Form
        form={form}
        layout="vertical"
        labelCol={{
          span: tabsActiveKey === "1" ? 6 : 5
        }}
        disabled={isVersion}
        initialValues={{
          agentName: "",
          description: "",
          agentMode: 1,
          voiceMode: "2", // 语音模式
          icon: defaultAgentIcon
        }}
      >
        <Tabs type="card" activeKey={tabsActiveKey} onChange={(val) => setTabsActiveKey(val)}>
          <Tabs.TabPane key="1" tab="基础设置" forceRender>
            <BasicSetup
              initialValues={initialValues}
              agentModeList={agentModeList}
              imageUrl={imageUrl}
              setImageUrl={setImageUrl}
              isGeneralAdmin={isGeneralAdmin}
              form={form}
              userListLoading={userListLoading}
              skillUserListData={skillUserListData}
            />
          </Tabs.TabPane>
          <Tabs.TabPane
            key="2"
            tab={
              initialValues?.agentNo && initialValues?.status !== "released" ? (
                <Tooltip title="该Agent未发布，暂不可共享">共享设置</Tooltip>
              ) : (
                "共享设置"
              )
            }
            forceRender
            disabled={!initialValues?.agentNo || initialValues?.status !== "released"}
          >
            <ShareSettingForm
              ref={shareFormRef}
              form={form}
              bizType="AGENT"
              botNo={currentBotNo}
              skillNo={initialValues?.agentNo}
            />
          </Tabs.TabPane>
        </Tabs>
      </Form>
    </Modal>
  )
}

export default CreateAgent
