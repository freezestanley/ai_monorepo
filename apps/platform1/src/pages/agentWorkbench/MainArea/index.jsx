import "./index.scss"
import { useFetchCatalogList } from "@/api/knowledge"
import VariableTextArea from "@/pages/xflow/CustomFlowchartFormPanel/NodeComponent/components/VariableTextArea"
import { Button, Col, Form, Input, Row, Select, Slider, Switch, TreeSelect } from "antd"
import { RedoOutlined } from "@ant-design/icons"
import { forwardRef, useEffect, useImperativeHandle, useState } from "react"
import Commands from "../components/Commands"
import { useFetchLlmModelType } from "@/api/common"
import agentPlaceholder from "../components/agentPlaceholder"
import BehaviorOptimizeModal from "../components/BehaviorOptimizeModal"

function MainArea({ form, agentData, botNo, onSave }, ref) {
  const [commandForm] = Form.useForm()
  const [commandList, setCommandList] = useState([])
  const [showRelatedKnowledge, setShowRelatedKnowledge] = useState(false)
  const [optimizeVisible, setOptimizeVisible] = useState(false)
  const onEnableRelatedKnowledgeChange = (value) => {
    setShowRelatedKnowledge(value)
  }
  const onCommandListChange = (list, { isDelete = false } = {}) => {
    try {
      setCommandList(list)
      if (!isDelete) {
        onSave({ isSilent: true })
      }
    } catch (error) {
      console.error(error)
    }
  }
  useImperativeHandle(ref, () => ({
    setFormData: (formData) => {
      form.setFieldsValue(formData)
    },
    getFormData: () => {
      return form.getFieldsValue()
    }
  }))

  const systemMsgTooltip = () => {
    return (
      <div className="system-msg-tooltip">
        <div className="mb-10">示例：</div>
        <div># 角色</div>
        <div className="mb-10">
          你是一位专业的保险客户服务人员，能够通过客户提供的保单号或相关信息，迅速查询到保险保单详情，涵盖保险的种类、金额、期限等内容，还可按客户要求开具保险发票。
        </div>
        <div>## 工作流</div>
        <div className="mb-10">### 工作流1：查询保险保单</div>
        <div className="mb-10">1.能依据客户给出的保单号码或有关信息，查找客户的保险保单资料</div>
        <div className="mb-10">2.若客户提供的信息不准确，需及时告知客户并请其提供正确信息</div>
        <div className="mb-10">### 工作流2：开具保险发票</div>
        <div className="mb-10">1.根据客户的需求，为其开具保险发票</div>
        <div>## 限制</div>
      </div>
    )
  }

  useEffect(() => {
    const commands =
      agentData?.commands?.map((item) => {
        return {
          ...item,
          params: [item.params],
          response: [item.response]
        }
      }) || []
    form.setFieldsValue({
      commands
    })
    setCommandList(commands)
    const show = agentData?.relatedKnowledge?.enableRelatedKnowledge
    if (show) {
      setShowRelatedKnowledge(true)
    }
  }, [agentData])

  const { data: queryRange } = useFetchCatalogList(botNo)
  const { data: modelList = [] } = useFetchLlmModelType()

  return (
    <div className="flex w-screen justify-center h-screen pt-10 agent-header-drawer-wrapper">
      <Form
        form={form}
        initialValues={{}}
        className="mt-5 w-screen agent-workbench-form"
        size="large"
        labelCol={{
          span: 5
        }}
        wrapperCol={{ span: 16 }}
      >
        <Row>
          <Col span={12}>
            <Form.Item
              name="agentName"
              label="Agent名称"
              rules={[{ required: true, message: "Agent名称是必填的" }]}
            >
              <Input disabled={true} placeholder="请输入Agent名称" />
            </Form.Item>
            <Form.Item
              label="模型"
              name="model"
              initialValue="GPT_4"
              rules={[{ required: true, message: "请选择模型" }]}
            >
              <Select
                allowClear
                placeholder="请选择"
                options={modelList.filter((item) => item.code === "GPT_4")}
                fieldNames={{ label: "name", value: "code" }}
              />
            </Form.Item>
            <Form.Item
              name="systemMessage"
              label="行为定义"
              className="form-item_system-message"
              tooltip={{
                // title: "您认为这个Agent应该怎么做",
                title: systemMsgTooltip(),
                placement: "rightTop",
                overlayInnerStyle: { maxWidth: "320px" }
              }}
              extra={
                <Button
                  className="system-msg-optimize-btn"
                  type="link"
                  icon={<RedoOutlined />}
                  size="small"
                  onClick={() => setOptimizeVisible(true)}
                >
                  优化
                </Button>
              }
              rules={[{ required: true, message: "请填写行为定义" }]}
              labelCol={{
                span: 5,
                offset: 0
              }}
            >
              <VariableTextArea
                disableSuggestion={true}
                miniInputStyle={{ padding: 16 }}
                miniInputProps={{
                  placeholder: agentPlaceholder
                }}
                largeInputProps={{
                  placeholder: agentPlaceholder
                }}
              />
            </Form.Item>
            <Form.Item
              name="commands"
              label="指令"
              initialValue={[]}
              labelCol={{
                span: 5,
                offset: 0
              }}
            >
              <Commands
                title="指令配置"
                form={commandForm}
                commandList={commandList}
                onChange={onCommandListChange}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="关联知识库"
              name={["relatedKnowledge", "enableRelatedKnowledge"]}
              initialValue={false}
              valuePropName="checked"
            >
              <Switch onChange={onEnableRelatedKnowledgeChange} />
            </Form.Item>
            {showRelatedKnowledge && (
              <Form.Item label="选择知识库" name={["relatedKnowledge", "relatedKnowledgeCatalogs"]}>
                <TreeSelect
                  showSearch
                  style={{ width: "100%" }}
                  dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
                  placeholder="请选择查询范围"
                  allowClear
                  multiple
                  // treeDefaultExpandAll
                  treeData={queryRange}
                  treeCheckable={true}
                  showCheckedStrategy={TreeSelect.SHOW_PARENT}
                  fieldNames={{
                    label: "catalogName",
                    value: "catalogNo",
                    children: "children"
                  }}
                />
              </Form.Item>
            )}

            <Form.Item name="isActiveCommunicate" label="是否主动问询" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item
              name="maxIterationTimes"
              label="连续迭代次数上限"
              key={Math.random()}
              valuePropName="value"
            >
              <Slider
                min={1}
                max={30}
                tooltip={{ open: true, color: "#7F56D9", zIndex: 1 }}
                defaultValue={8}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>

      <BehaviorOptimizeModal
        visible={optimizeVisible}
        form={form}
        fieldProp="systemMessage"
        onClose={() => {
          setOptimizeVisible(false)
        }}
        onSuccess={(value) => {
          setOptimizeVisible(false)
          form.setFieldsValue({
            systemMessage: value
          })
        }}
      />
    </div>
  )
}

export default forwardRef(MainArea)
