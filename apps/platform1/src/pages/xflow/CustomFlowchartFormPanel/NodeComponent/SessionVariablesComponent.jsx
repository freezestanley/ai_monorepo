import { useEffect, useState } from "react"
import { Form, Input, Row, Col, Button, Divider, Select, Space } from "antd"
import DynamicFormComponent from "./components/DynamicFormComponent"
import { useCustomVariableType } from "../../hooks"
import { useFormData } from "../../hooks/useInputFormData"
import { useFetchGlobalVariable } from "@/api/skill"
import { useNodeUpdate } from "../../hooks/useNodeUpdate"
import useSaveShortcut from "../../hooks/useSaveShortcut"
import { isFunction } from "lodash"
import { CommonContent } from "../CommonContent"
import { useCurrentSkillLockInfo } from "@/store/index"
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons"
import GlobalVariableSelect from "@/components/GlobalVariableSelect"
import DynamicFormList from "./DynamicFormList"

const SessionVariablesComponent = ({ targetData, appData, commandService }) => {
  const { form, formData } = useFormData()
  const [_, forceUpdate] = useState({})

  const { updateNodeComp, skillFlowData, isLoading } = useNodeUpdate(commandService, appData)

  const { data: globalData = [] } = useFetchGlobalVariable(skillFlowData?.versionNo)
  const { isLocked } = useCurrentSkillLockInfo((state) => state.currentSkillLockInfo)
  useEffect(() => {
    form.setFieldsValue(targetData)
    forceUpdate({})
  }, [targetData, form])

  const onFinish = (callback = () => {}, noMessage = false) => {
    return form.validateFields().then((values) => {
      const callbackFunc = isFunction(callback) ? callback : () => {}
      updateNodeComp(
        {
          ...targetData,
          ...values,
          label: values.componentName,
          globalDataOptions: globalData,
          ext: values.toolCode === "table_doc_save" ? values.ext : undefined,
          headers: values.toolCode === "table_doc_save" ? values.headers : undefined,
          pictureModelType:
            values.toolCode === "pic_generator" ? values.pictureModelType : undefined
        },
        callbackFunc,
        noMessage
      )
      forceUpdate({})
    })
  }
  useSaveShortcut(onFinish, isLoading)
  const { data: varOptions = [] } = useCustomVariableType()

  // options数组，用于Select组件
  const options = [
    { label: "变量1", value: "变量1" },
    { label: "变量2", value: "变量2" },
    { label: "变量3", value: "变量3" }
  ]

  // 全局变量选项（此处为示例，您可以根据实际需要修改）
  const globalOptions = [
    { label: "全局变量1", value: "全局变量1" },
    { label: "全局变量2", value: "全局变量2" },
    { label: "全局变量3", value: "全局变量3" }
  ]

  return (
    <div className="tool-node-wrapper">
      <div className="base-node-comp">
        <Form form={form} onFinish={onFinish} labelCol={{ span: 4 }}>
          <CommonContent
            title={"会话变量组件"}
            extraRender={() => (
              <Button type="primary" htmlType="submit" loading={isLoading} disabled={isLocked}>
                保存
              </Button>
            )}
          >
            <Row>
              <Col span={24}>
                <Form.Item
                  name="componentName"
                  label="组件名"
                  tooltip="组件名建议由中英文、数字、下划线和短横线组成，且不超过64个字符"
                  rules={[{ required: true, message: "请输入组件名" }]}
                >
                  <Input placeholder="请输入组件名" />
                </Form.Item>
              </Col>
              <Divider>输入参数</Divider>
              <Col span={24}></Col>
            </Row>

            <DynamicFormList form={form} varOptions={varOptions} />
          </CommonContent>
        </Form>
        <div className="absolute debug-panel">
          <DynamicFormComponent
            onFinish={onFinish}
            preview={false}
            formData={formData || []}
            isProcess={false}
            nodeId={targetData.id}
          />
        </div>
      </div>
    </div>
  )
}

export default SessionVariablesComponent
