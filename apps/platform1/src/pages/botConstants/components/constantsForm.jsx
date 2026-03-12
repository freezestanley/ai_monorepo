import { useEffect } from "react"
import { Modal, Form, Input, Checkbox, Select, message } from "antd"
import { useFetchVariableType } from "@/api/common"
const { TextArea } = Input
const ConstantsForm = ({
  form,
  visible,
  isEditing,
  currentRecord,
  onSave,
  onCancel,
  isLoading,
  isPublishDisabled: isVersion
}) => {
  const { data: variableTypeList = [] } = useFetchVariableType()

  useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        ...currentRecord
      })
    } else {
      form.resetFields()
    }
  }, [currentRecord, form, visible])

  const handleSave = () => {
    form.validateFields().then((values) => {
      onSave(values)
    })
  }

  return (
    <Modal
      open={visible}
      title={isEditing ? "编辑常量" : "新建常量"}
      onCancel={onCancel}
      closeIcon={false}
      onOk={handleSave}
      confirmLoading={isLoading}
      okButtonProps={{ disabled: isVersion }}
    >
      <Form
        form={form}
        disabled={isVersion}
        labelCol={{
          span: 5
        }}
        wrapperCol={{
          span: 24
        }}
        layout={"vertical"}
      >
        <Form.Item
          name="desc"
          label="常量描述"
          rules={[{ required: true, message: "请输入常量描述，如：周期列表" }]}
        >
          <Input placeholder="请输入常量描述，如：周期列表" />
        </Form.Item>
        <Form.Item
          name="key"
          label="常量名称"
          rules={[{ required: true, message: "请输入常量名称，如days_of_week" }]}
        >
          {isEditing ? (
            currentRecord.key
          ) : (
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <Input
                addonBefore="constant."
                disabled={isEditing}
                placeholder="请输入常量名称，如days_of_week"
              />
            </div>
          )}
        </Form.Item>

        <Form.Item
          name="type"
          label="常量类型"
          rules={[{ required: true, message: "请选择常量类型" }]}
        >
          <Select
            showSearch
            placeholder="请选择常量类型"
            optionFilterProp="children"
            filterOption={(input, option) => (option?.label ?? "").includes(input)}
            filterSort={(optionA, optionB) =>
              (optionA?.label ?? "")
                .toLowerCase()
                .localeCompare((optionB?.label ?? "").toLowerCase())
            }
            options={variableTypeList.map((item) => {
              return { value: item.code, label: item.name }
            })}
          />
        </Form.Item>
        <Form.Item
          name="value"
          label="常量值"
          // required={true}
          // rules={[
          //   {
          //     required: true,
          //     message: "请输入常量值"
          //   }
          // ]}
        >
          <TextArea
            rows={4}
            placeholder='请输入常量值，如：[“周一”，“周二”，“周三”，“周
四”，“周五”，“周六”，"周日"]'
            // maxLength={8192}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default ConstantsForm
