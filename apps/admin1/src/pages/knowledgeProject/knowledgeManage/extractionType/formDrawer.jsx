import { useCallback, useEffect } from "react"
import { Button, Drawer, Form, Input, Select } from "antd"
import { useAddTaskTypeApi, useTaskTypeListSkillApi } from "@/api/knowledgeExtraction"
import { fetchCheckTaskTypeDesc } from "@/api/knowledgeExtraction/api"
import { useFetchBotInfo } from "@/api/bot"
import { skillTypeEnum } from "./index"

const FormDrawer = ({ visiable, setVisiable, botNo }) => {
  const [form] = Form.useForm()
  const { mutate: addTaskTypeApi } = useAddTaskTypeApi()
  const { data: botInfo } = useFetchBotInfo(botNo)
  const { data: taskTypeListSkill } = useTaskTypeListSkillApi({ botNo })

  const onSave = useCallback(async () => {
    const values = await form.validateFields()
    const { skillName } = taskTypeListSkill?.find((item) => item.skillNo === values.skillNo) || {}
    addTaskTypeApi(
      { botName: botInfo?.botName, skillName, ...values },
      {
        onSuccess: (res) => {
          if (res?.success) {
            setVisiable(false)
          }
        }
      }
    )
  }, [addTaskTypeApi, botInfo, form, setVisiable, taskTypeListSkill])

  useEffect(() => {
    if (!visiable) {
      form.resetFields()
    }
  }, [form, visiable])

  return (
    <Drawer
      open={visiable}
      size="large"
      title="新增"
      onClose={() => setVisiable(false)}
      destroyOnClose
      footer={[
        <div
          key="footer"
          style={{
            textAlign: "right"
          }}
        >
          <Button style={{ marginRight: "5px" }} onClick={() => setVisiable(false)}>
            取消
          </Button>
          <Button type="primary" onClick={onSave}>
            保存
          </Button>
        </div>
      ]}
    >
      <Form layout="horizontal" form={form}>
        <Form.Item
          label="任务类型"
          name="desc"
          rules={[
            { required: true, message: "请输入任务类型" },
            {
              validator: async (_, value) => {
                if (!value) return Promise.resolve()
                const res = await fetchCheckTaskTypeDesc({
                  desc: value
                })
                if (res?.data) {
                  return Promise.resolve()
                } else {
                  return Promise.reject("输入值已存在，请重新输入")
                }
              }
            }
          ]}
        >
          <Input placeholder="请输入任务类型" />
        </Form.Item>
        <Form.Item
          label="工作流类型"
          name="skillType"
          rules={[{ required: true, message: "请选择工作流类型" }]}
        >
          <Select
            placeholder="请选择工作流类型"
            options={Object.entries(skillTypeEnum).map(([value, label]) => ({
              value,
              label
            }))}
          />
        </Form.Item>
        <Form.Item
          label="空间"
          name="botNo"
          rules={[{ required: true, message: "请选择空间" }]}
          initialValue={botNo}
        >
          <Select
            placeholder="请选择空间"
            options={[botInfo].filter(Boolean)}
            fieldNames={{
              label: "botName",
              value: "botNo"
            }}
            disabled
          />
        </Form.Item>
        <Form.Item
          label="skillNo."
          name="skillNo"
          rules={[{ required: true, message: "请选择skillNo." }]}
        >
          <Select
            placeholder="请选择skillNo."
            options={taskTypeListSkill}
            fieldNames={{
              label: "skillName",
              value: "skillNo"
            }}
          />
        </Form.Item>
        <Form.Item
          noStyle
          shouldUpdate={(prevValues, curValues) => prevValues.skillNo !== curValues.skillNo}
        >
          {({ getFieldValue, setFieldsValue }) => {
            const skillNo = getFieldValue("skillNo")
            const { skillStatus } =
              taskTypeListSkill?.find((item) => item.skillNo === skillNo) || {}
            setFieldsValue({ skillStatus })
            return (
              <Form.Item label="状态" name="skillStatus">
                <Input disabled />
              </Form.Item>
            )
          }}
        </Form.Item>
      </Form>
    </Drawer>
  )
}

export default FormDrawer
