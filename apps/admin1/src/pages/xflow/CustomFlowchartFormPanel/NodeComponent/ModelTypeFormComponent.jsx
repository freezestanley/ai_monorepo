import { useState, useEffect } from "react"
import { Form, Select, Col, Tag, Radio } from "antd"
import { parseModalTypeTagColor } from "@/constants"
import { InfoIcon } from "@/components/FormIcon"

const ModelTypeFormComponent = ({
  noLabel,
  noRequired = false,
  modelOptions,
  reasoningEffortOptions,
  targetData,
  nameKey,
  formKeys
}) => {
  const [supportReasoning, setSupportReasoning] = useState(false)

  useEffect(() => {
    // 初始化处理
    const modelType = formKeys?.length
      ? nameKey
        ? targetData?.[nameKey]?.[formKeys[formKeys.length - 1]]?.modelType
        : targetData?.[formKeys[formKeys.length - 1]]?.modelType
      : targetData.modelType
    if (modelOptions.length > 0 && modelType) {
      const item = modelOptions.find((item) => item.code === modelType)
      if (item) {
        // 设置是否支持推理过程
        setSupportReasoning(item.supportReasoning ?? false)
      }
    }
  }, [modelOptions, targetData.modelType])

  const onLlmModelTypeChange = (value) => {
    const item = modelOptions.find((item) => item.code === value)
    if (item) {
      setSupportReasoning(item.supportReasoning ?? false)
    }
  }

  // 自定义搜索函数，支持 code 和 name 搜索
  const filterOption = (input, option) => {
    const inputValue = input.toLowerCase()
    const optionText = option.children?.toString().toLowerCase() || ""
    const optionValue = option.value?.toString().toLowerCase() || ""

    return optionText.includes(inputValue) || optionValue.includes(inputValue)
  }

  return (
    <>
      <Col span={24}>
        <Form.Item
          name={formKeys?.length ? [...formKeys, "modelType"] : "modelType"}
          label={noLabel ? undefined : "模型类型"}
          rules={[{ required: !noRequired, message: "请选择模型类型" }]}
          // initialValue={"GPT_3.5"}
        >
          <Select
            placeholder="请选择模型类型"
            onChange={onLlmModelTypeChange}
            showSearch={true}
            filterOption={filterOption}
          >
            {modelOptions
              ?.filter((option) => option?.status !== 0)
              ?.map((opt) => (
                <Select.Option key={opt.code} value={opt.code} disabled={opt.status === 0}>
                  {opt.name}{" "}
                  {opt.modalType?.map((m) => {
                    return (
                      <Tag bordered={false} color={parseModalTypeTagColor(m.code)}>
                        {m.name}
                      </Tag>
                    )
                  })}
                  {!!opt.supportReasoning && (
                    <Tag bordered={false} color="orange">
                      推理
                    </Tag>
                  )}
                </Select.Option>
              ))}
          </Select>
        </Form.Item>
      </Col>
      {supportReasoning && (
        <Col span={24}>
          <Form.Item
            layout={noRequired ? "" : "horizontal"}
            label="推理程度"
            labelCol={
              noRequired
                ? {
                    span: 10
                  }
                : { span: 4 }
            }
            style={{ marginLeft: -2 }}
            tooltip={{
              icon: <InfoIcon />,
              title:
                "推理程度仅对推理模型生效。对部分国产模型此选项仅作为开关，【低】表示关闭推理，【中】和【高】均为开启推理（效果无差别）"
            }}
          >
            <Form.Item
              noStyle
              name={formKeys?.length ? [...formKeys, "reasoningEffort"] : "reasoningEffort"}
              initialValue="low"
            >
              <Radio.Group size="small">
                {reasoningEffortOptions.map((option) => (
                  <Radio key={option.code} value={option.code}>
                    {option.name}
                  </Radio>
                ))}
              </Radio.Group>
            </Form.Item>
          </Form.Item>
        </Col>
      )}
    </>
  )
}

export default ModelTypeFormComponent
