import { Form, Select, Tooltip } from "antd"
import { useSkillFlowData } from "@/store"
import { useFetchGlobalVariable } from "@/api/skill"

const CustomSelect = ({
  value = [],
  onChange,
  globalData,
  multiple,
  isTag,
  placeholder,
  className,
  disabled
}) => {
  const triggerChange = (changedValue) => {
    let newValue = changedValue
    // 当isTag为true且不是多选模式时，限制为单个值
    console.log(isTag, changedValue)
    if (isTag && !multiple && changedValue.length >= 1) {
      newValue = [changedValue[changedValue.length - 1]][0]
    }
    if (isTag && changedValue.length === 0) {
      newValue = undefined
    }

    if (onChange) {
      onChange(newValue, globalData)
    }
  }

  return (
    <Select
      // 支持筛选
      showSearch
      disabled={disabled}
      allowClear
      value={value}
      onChange={triggerChange}
      placeholder={placeholder}
      mode={multiple ? "multiple" : isTag ? "tags" : undefined}
      dropdownStyle={{
        minWidth: 350
      }}
      className={`globalSelect ${className || ""}`}
    >
      {globalData?.map((variable, i) => (
        <Select.Option key={variable.globalVariableNo} value={variable.displayName}>
          <Tooltip
            title={
              <>
                {variable.displayName}
                {variable.description ? `(${variable.description})` : ""}
              </>
            }
          >
            {variable.displayName}
            {variable.description ? `(${variable.description})` : ""}
          </Tooltip>
        </Select.Option>
      ))}
    </Select>
  )
}

const GlobalVariableSelect = ({
  formName,
  multiple,
  isTag = false,
  span,
  label,
  className,
  onChange,
  required = true,
  value,
  disabled = false
}) => {
  const skillFlowData = useSkillFlowData((state) => state.skillFlowData)
  const { data: globalData = [] } = useFetchGlobalVariable(skillFlowData?.versionNo)

  return (
    <Form.Item
      name={formName}
      style={{ width: 40 }}
      label={label}
      labelCol={{
        span: span ? span : 4
      }}
      rules={[
        {
          required,
          message: "请选择"
        }
      ]}
    >
      <CustomSelect
        value={value}
        onChange={onChange}
        globalData={globalData}
        multiple={multiple}
        isTag={isTag}
        placeholder="请选择"
        className={className}
        disabled={disabled}
      />
    </Form.Item>
  )
}

export default GlobalVariableSelect
