// StreamOutput.js
import {
  Form,
  Input,
  Button,
  Space,
  Select,
  Col,
  Slider,
  Tag,
  Row,
  Switch,
  InputNumber,
  Radio
} from "antd"
import {
  useFetchLlmModelType,
  useFetchLlmFilterModelType,
  useFetchLlmReasoningEffort
} from "@/api/common"
import { marks, parseModalTypeTagColor } from "@/constants"
import VariableTextArea from "./VariableTextArea"
import { PromptTips } from "@/constants/tips"
import { useLocation } from "react-router-dom"
import queryString from "query-string"
import { useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import CustomDivider from "@/components/CustomDivider"
import { AddIcon, DeleteIcon, InfoIcon } from "@/components/FormIcon"
import GlobalVariableSelect from "@/components/GlobalVariableSelect"
import AIOptimize from "@/components/AIOptimize"
import AdvanceSetting from "../AdvanceSetting"

export default function StreamOutput({ globalData, disabled, form }) {
  const [isOnlyMultiModal, setIsOnlyMultiModal] = useState(true)
  const [multiModalTypeList, setMultiModalTypeList] = useState([])
  const [supportReasoning, setSupportReasoning] = useState(false)
  const [_, forceUpdate] = useState({})

  // Use Form.useWatch to monitor content field
  const contentValue = Form.useWatch("content", form)

  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)
  const { botNo: botNoFormQuery, skillNo: skillNoFromQuery } = queryParams
  const { botNo: botNoFromParams, skillNo: skillNoFromParams } = useParams()
  const botNo = botNoFromParams || botNoFormQuery
  const skillNo = skillNoFromParams || skillNoFromQuery || ""

  const { data: modelOptions } = useFetchLlmFilterModelType(botNo)
  const { data: reasoningEffortOptions = [] } = useFetchLlmReasoningEffort()

  useEffect(() => {
    onLlmModelTypeChange(form.getFieldValue("modelType"))
  }, [modelOptions, form])

  const onLlmModelTypeChange = (value) => {
    const item = modelOptions?.find((item) => item.code === value)
    if (item) {
      // 如果非文本类型的长度和实际的长度一致，那么就是仅仅是多模态
      const isOnlyMultiModal =
        item.modalType?.filter((m) => {
          return m.code !== "TEXT"
        }).length === item.modalType?.length
      setIsOnlyMultiModal(isOnlyMultiModal)

      const multiModalTypeList = item.modalType?.filter((m) => {
        return m.code !== "TEXT"
      })
      setMultiModalTypeList(multiModalTypeList ?? [])
      if (multiModalTypeList?.length) {
        const inputItems = form.getFieldValue("inputItems")
        if (!inputItems?.length) {
          form.setFieldsValue({
            inputItems: [
              {
                modalType: null,
                variableName: null
              }
            ]
          })
        }
      }

      // 设置是否支持推理
      setSupportReasoning(item.supportReasoning ?? false)
    }
  }

  const onMouseBlur = () => {
    forceUpdate({})
  }

  return (
    <>
      <Col span={24} className="ml-0">
        <Form.Item
          name="modelType"
          label="模型类型"
          rules={[{ required: true }]}
          // initialValue={"GPT_3.5"}
        >
          <Select placeholder="请选择模型类型" onChange={onLlmModelTypeChange} showSearch={true}>
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
            layout="horizontal"
            label="推理程度"
            labelCol={{
              span: 4
            }}
            style={{ marginLeft: -2 }}
            tooltip={{
              icon: <InfoIcon />,
              title:
                "推理程度仅对推理模型生效。对部分国产模型此选项仅作为开关，【低】表示关闭推理，【中】和【高】均为开启推理（效果无差别）"
            }}
          >
            <Form.Item noStyle name="reasoningEffort" initialValue="low">
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

      <Col span={24}>
        <Form.Item
          layout="horizontal"
          labelCol={{
            span: 2
          }}
          name="temperature"
          label="温度"
        >
          <Row gutter={[0, 0]}>
            <Col span={18}>
              <Form.Item noStyle name="temperature" initialValue={0.7}>
                <Slider max={2} step={0.01} marks={marks} defaultValue={0.7} />
              </Form.Item>
            </Col>

            <Col span={5}>
              <Form.Item className="mr-0 pr-0" name="temperature" initialValue={0.7}>
                <InputNumber
                  style={{ marginLeft: "20px", width: "100%" }}
                  min={0}
                  max={2}
                  step={0.01}
                  precision={2}
                  defaultValue={0.7}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form.Item>
      </Col>

      <AdvanceSetting />

      {/* <Col span={24}>
        <Form.Item
          layout="horizontal"
          initialValue={0.7}
          name="temperature"
          label="回答风格"
          labelCol={{
            span: 3
          }}
          wrapperCol={{
            span: 21
          }}
        >
          <Slider max={2} step={0.1} marks={marks} />
        </Form.Item>
      </Col> */}

      {/* <Col className="form-layout-horizontal" span={24}>
        <Form.Item
          layout="horizontal"
          label="是否启用top_p参数"
          labelCol={{
            span: 7
          }}
          style={{ marginLeft: -6 }}
          tooltip={{
            icon: <InfoIcon />,
            title:
              "生成过程中核采样方法概率阈值，例如，取值为0.8时，仅保留概率加起来大于等于0.8的最可能token的最小集合作为候选集。取值范围为 （0-1），取值越大，生成的随机性越高；取值越低，生成的确定性越高"
          }}
        >
          <Form.Item noStyle name="topPEnable" valuePropName="checked" initialValue={false}>
            <Switch
              size="small"
              onChange={() => {
                forceUpdate({})
              }}
            />
          </Form.Item>
          <span className="judge-tip text-[12px] text-gray-500 ml-1">
            取值越低，生成的确定性越高
          </span>
        </Form.Item>
      </Col> */}
      {/* {form.getFieldValue("topPEnable") && (
        <Col span={24}>
          <Form.Item layout="horizontal" labelCol={{ span: 2 }} name="top_p" label="top-p">
            <Row gutter={[16, 0]}>
              <Col span={19}>
                <Form.Item noStyle name="top_p">
                  <Slider
                    max={0.9}
                    min={0.01}
                    step={0.01}
                    defaultValue={0.8}
                    marks={{
                      0.01: "0.01",
                      0.8: "0.8",
                      0.9: "0.9"
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={3}>
                <Form.Item noStyle name="top_p">
                  <InputNumber min={0.1} max={0.9} step={0.01} precision={2} defaultValue={0.8} />
                </Form.Item>
              </Col>
            </Row>
          </Form.Item>
        </Col>
      )} */}
      {!!multiModalTypeList?.length && (
        <>
          <CustomDivider showTopLine={true}>输入项配置</CustomDivider>
          <Form.List name="inputItems">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={8} className="flex">
                    <Col span={5}>
                      <Form.Item
                        name={[name, "modalType"]}
                        labelCol={{
                          span: 9
                        }}
                        rules={[
                          {
                            required: isOnlyMultiModal,
                            message: "请选择模态类型"
                          }
                        ]}
                      >
                        <Select placeholder="模态类型" onChange={onMouseBlur}>
                          {multiModalTypeList.map((modalTypeItem) => (
                            <Select.Option key={modalTypeItem.code} value={modalTypeItem.code}>
                              {modalTypeItem.name}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col className="flex-1">
                      <GlobalVariableSelect
                        span={3}
                        formName={[name, "variableName"]}
                        multiple={false}
                        required={isOnlyMultiModal}
                        onChange={onMouseBlur}
                      />
                    </Col>
                    <Col>
                      <DeleteIcon
                        disabled={fields.length <= 1}
                        onClick={() => {
                          remove(name)
                          onMouseBlur()
                        }}
                      />
                    </Col>
                  </Row>
                ))}
                <Form.Item>
                  <AddIcon text="添加新模态" onClick={() => add()} />
                </Form.Item>
              </>
            )}
          </Form.List>
        </>
      )}
      <Form.Item
        className="global-tips"
        style={{
          marginLeft: 8
        }}
        name="content"
        label={
          <div className="flex items-center">
            <span className="mr-2">提示词 </span>
            {skillNo && (
              <AIOptimize
                originalPrompt={contentValue}
                intelligentAgentType="SKILL"
                intelligentAgentNo={skillNo}
                onSubmit={({ type, content }) => {
                  if (type === "agent") {
                    form.setFieldsValue({ content })
                  }
                }}
              />
            )}
          </div>
        }
        rules={[
          {
            required: true,
            message: "请输入"
          }
        ]}
        labelCol={{
          span: 24,
          offset: 0.3
        }}
        tooltip={{
          title: PromptTips,
          overlayStyle: { maxWidth: 400 }
        }}
      >
        <VariableTextArea variables={globalData} disabled={disabled} />
      </Form.Item>
    </>
  )
}
