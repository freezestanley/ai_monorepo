import { Form, Select, Tooltip } from "antd"
import { useSkillFlowData } from "@/store"
import { useFetchGlobalVariable } from "@/api/skill"

const CustomSelect = ({
  value = [],
  onChange,
  globalData,
  multiple,
  placeholder,
  className,
  isTag = false,
  disabled = false
}) => {
  const triggerChange = (changedValue) => {
    let newValue = changedValue
    // 当不是多选模式且是tags模式时，限制为单个值
    if (!multiple && changedValue?.length >= 1 && isTag) {
      newValue = [changedValue[changedValue.length - 1]][0]
    }
    if (onChange) {
      onChange(newValue, globalData)
    }
  }

  return (
    <Select
      showSearch
      allowClear
      disabled={disabled}
      placeholder={placeholder}
      mode={multiple ? "multiple" : isTag ? "tags" : undefined}
      value={value}
      onChange={triggerChange}
      className={`globalSelect ${className || ""}`}
      dropdownStyle={{
        minWidth: 350
      }}
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
  span,
  label,
  className = "",
  required = true,
  isTag = false,
  onChange,
  style = {},
  initialValue = null,
  layout = "horizontal",
  placeholder = "请选择",
  message = "请选择",
  disabled = false,
  tooltip
}) => {
  const skillFlowData = useSkillFlowData((state) => state.skillFlowData)
  const { data: globalData = [] } = useFetchGlobalVariable(skillFlowData?.versionNo)

  return (
    <Form.Item
      style={style}
      name={formName}
      label={label}
      layout={layout}
      initialValue={initialValue}
      labelCol={{
        span: span ? span : 4
      }}
      rules={[
        {
          required,
          message
        }
      ]}
      tooltip={tooltip}
    >
      <CustomSelect
        isTag={isTag}
        globalData={globalData}
        multiple={multiple}
        placeholder={placeholder}
        className={className}
        onChange={onChange}
        disabled={disabled}
      />
    </Form.Item>
  )
}

export default GlobalVariableSelect
