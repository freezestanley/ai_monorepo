import React from "react"
import { Form, Row, Col, Switch, Slider, InputNumber, Select, Tooltip } from "antd"
import { InfoIcon } from "@/components/FormIcon"
import { ExclamationCircleOutlined } from "@ant-design/icons"
import GlobalVariableSelect from "@/components/GlobalVariableSelect"
import { useFetchLlmResponseFormat } from "@/api/common"
import "./index.less"

function generateRandomNumber() {
  // 生成1到9999999之间的随机整数
  return Math.floor(Math.random() * 9999999) + 1
}

const AdvanceSetting = () => {
  const { data: llmResponseFormatList } = useFetchLlmResponseFormat()

  return (
    <>
      <Col span={24}>
        <Form.Item
          name="advancedSettingEnable"
          label="高级设置"
          valuePropName="checked"
          initialValue={false}
          layout="horizontal"
        >
          <Switch size="small" />
        </Form.Item>
      </Col>

      <Form.Item
        noStyle
        shouldUpdate={(prev, curr) => prev.advancedSettingEnable !== curr.advancedSettingEnable}
      >
        {({ getFieldValue }) => {
          const advancedSettingEnable = getFieldValue("advancedSettingEnable")

          if (!advancedSettingEnable) return null

          return (
            <div className="bg-gray-100 p-2 rounded-md w-full mb-4">
              {/* Top K 设置 */}
              <Row gutter={25} align="middle">
                <Col span={2}>
                  <Form.Item
                    name="topKEnable"
                    valuePropName="checked"
                    initialValue={false}
                    style={{ margin: 0 }}
                  >
                    <Switch size="small" />
                  </Form.Item>
                </Col>
                <Col span={5} className="text-right">
                  <span>
                    Top K
                    <Tooltip title="生成时，采样候选集的大小。例如，取值为 50 时，仅将单词生成中得分最高的 50 个 token 组成随机采样的候选集。取值越大，生成的随机性越高；取值越小，生成的确定性越高">
                      <InfoIcon className="ml-1" />
                    </Tooltip>
                  </span>
                </Col>
                <Col span={12}>
                  <Form.Item
                    noStyle
                    shouldUpdate={(prev, curr) => prev.topKEnable !== curr.topKEnable}
                  >
                    {({ getFieldValue, getFieldError }) => {
                      const topKEnable = getFieldValue("topKEnable")
                      const fieldError = getFieldError("topK")
                      const hasError = topKEnable && fieldError?.length > 0

                      return (
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <Form.Item
                            name="topK"
                            initialValue={0}
                            style={{ margin: 0, flex: 1 }}
                            help={false}
                            hasFeedback={false}
                            rules={[
                              {
                                required: topKEnable,
                                message: "请设置Top K值"
                              }
                            ]}
                          >
                            <Slider
                              max={99}
                              min={0}
                              step={1}
                              disabled={!topKEnable}
                              marks={{
                                0: "0",
                                50: "50",
                                99: "99"
                              }}
                            />
                          </Form.Item>
                          {hasError && (
                            <Tooltip title={fieldError[0]} placement="top">
                              <ExclamationCircleOutlined
                                style={{
                                  color: "#ff4d4f",
                                  marginLeft: "8px",
                                  cursor: "pointer"
                                }}
                              />
                            </Tooltip>
                          )}
                        </div>
                      )
                    }}
                  </Form.Item>
                </Col>
                <Col span={5}>
                  <Form.Item
                    noStyle
                    shouldUpdate={(prev, curr) => prev.topKEnable !== curr.topKEnable}
                  >
                    {({ getFieldValue, getFieldError }) => {
                      const topKEnable = getFieldValue("topKEnable")
                      const fieldError = getFieldError("topK")
                      const hasError = topKEnable && fieldError?.length > 0

                      return (
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <Form.Item
                            name="topK"
                            initialValue={0}
                            style={{ margin: 0, flex: 1 }}
                            help={false}
                            hasFeedback={false}
                            rules={[
                              {
                                required: topKEnable,
                                message: "请设置Top K值"
                              }
                            ]}
                          >
                            <InputNumber
                              min={0}
                              max={99}
                              step={1}
                              precision={0}
                              disabled={!topKEnable}
                              style={{ width: "100%" }}
                            />
                          </Form.Item>
                          {hasError && (
                            <Tooltip title={fieldError[0]} placement="top">
                              <ExclamationCircleOutlined
                                style={{
                                  color: "#ff4d4f",
                                  marginLeft: "8px",
                                  cursor: "pointer"
                                }}
                              />
                            </Tooltip>
                          )}
                        </div>
                      )
                    }}
                  </Form.Item>
                </Col>
              </Row>

              {/* Top P 设置 */}
              <Row gutter={25} align="middle" style={{ marginBottom: "10px" }}>
                <Col span={2}>
                  <Form.Item
                    name="topPEnable"
                    valuePropName="checked"
                    initialValue={false}
                    style={{ margin: 0 }}
                  >
                    <Switch size="small" />
                  </Form.Item>
                </Col>
                <Col span={5} className="text-right">
                  <span>
                    Top P
                    <Tooltip title="生成过程中核采样方法概率阈值，例如，取值为0.8时，仅保留概率加起来大于等于0.8的最可能token的最小集合作为候选集。取值越大，生成的随机性越高；取值越低，生成的确定性越高">
                      <InfoIcon className="ml-1" />
                    </Tooltip>
                  </span>
                </Col>
                <Col span={12}>
                  <Form.Item
                    noStyle
                    shouldUpdate={(prev, curr) => prev.topPEnable !== curr.topPEnable}
                  >
                    {({ getFieldValue, getFieldError }) => {
                      const topPEnable = getFieldValue("topPEnable")
                      const fieldError = getFieldError("topP")
                      const hasError = topPEnable && fieldError?.length > 0

                      return (
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <Form.Item
                            name="topP"
                            initialValue={0.7}
                            style={{ margin: 0, flex: 1 }}
                            help={false}
                            hasFeedback={false}
                            rules={[
                              {
                                required: topPEnable,
                                message: "请设置Top P值"
                              }
                            ]}
                          >
                            <Slider
                              max={0.9}
                              min={0.01}
                              step={0.01}
                              disabled={!topPEnable}
                              marks={{
                                0.01: "0.01",
                                0.7: "0.7",
                                0.9: "0.9"
                              }}
                            />
                          </Form.Item>
                          {hasError && (
                            <Tooltip title={fieldError[0]} placement="top">
                              <ExclamationCircleOutlined
                                style={{
                                  color: "#ff4d4f",
                                  marginLeft: "8px",
                                  cursor: "pointer"
                                }}
                              />
                            </Tooltip>
                          )}
                        </div>
                      )
                    }}
                  </Form.Item>
                </Col>
                <Col span={5}>
                  <Form.Item
                    noStyle
                    shouldUpdate={(prev, curr) => prev.topPEnable !== curr.topPEnable}
                  >
                    {({ getFieldValue, getFieldError }) => {
                      const topPEnable = getFieldValue("topPEnable")
                      const fieldError = getFieldError("topP")
                      const hasError = topPEnable && fieldError?.length > 0

                      return (
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <Form.Item
                            name="topP"
                            initialValue={0.7}
                            style={{ margin: 0, flex: 1 }}
                            help={false}
                            hasFeedback={false}
                            rules={[
                              {
                                required: topPEnable,
                                message: "请设置Top P值"
                              }
                            ]}
                          >
                            <InputNumber
                              min={0.01}
                              max={0.9}
                              step={0.01}
                              precision={2}
                              disabled={!topPEnable}
                              style={{ width: "100%" }}
                            />
                          </Form.Item>
                          {hasError && (
                            <Tooltip title={fieldError[0]} placement="top">
                              <ExclamationCircleOutlined
                                style={{
                                  color: "#ff4d4f",
                                  marginLeft: "8px",
                                  cursor: "pointer"
                                }}
                              />
                            </Tooltip>
                          )}
                        </div>
                      )
                    }}
                  </Form.Item>
                </Col>
              </Row>

              {/* Max Token 设置 */}
              <Row gutter={25} align="middle" style={{ marginBottom: "10px" }}>
                <Col span={2}>
                  <Form.Item
                    name="maxTokenEnable"
                    valuePropName="checked"
                    initialValue={false}
                    style={{ margin: 0 }}
                  >
                    <Switch size="small" />
                  </Form.Item>
                </Col>
                <Col span={5} className="text-right">
                  <span>
                    Max Token
                    <Tooltip title="用于指定模型在生成内容时token的最大数量，它定义了生成的上限，但不保证每次都会生成到这个数量">
                      <InfoIcon className="ml-1" />
                    </Tooltip>
                  </span>
                </Col>
                <Col span={17}>
                  <Form.Item
                    noStyle
                    shouldUpdate={(prev, curr) => prev.maxTokenEnable !== curr.maxTokenEnable}
                  >
                    {({ getFieldValue, getFieldError }) => {
                      const maxTokenEnable = getFieldValue("maxTokenEnable")
                      const fieldError = getFieldError("maxToken")
                      const hasError = maxTokenEnable && fieldError?.length > 0

                      return (
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <Form.Item
                            name="maxToken"
                            initialValue={undefined}
                            style={{ margin: 0, flex: 1 }}
                            help={false}
                            hasFeedback={false}
                            rules={[
                              {
                                required: maxTokenEnable,
                                message: "请设置Max Token值"
                              },
                              {
                                validator: (_, value) => {
                                  if (maxTokenEnable && (!value || value <= 0)) {
                                    return Promise.reject(new Error("Max Token值必须大于0"))
                                  }
                                  return Promise.resolve()
                                }
                              }
                            ]}
                          >
                            <InputNumber
                              min={1}
                              step={1}
                              disabled={!maxTokenEnable}
                              style={{ width: "100%" }}
                              placeholder="请输入最大标记数"
                            />
                          </Form.Item>
                          {hasError && (
                            <Tooltip title={fieldError[0]} placement="top">
                              <ExclamationCircleOutlined
                                style={{
                                  color: "#ff4d4f",
                                  marginLeft: "8px",
                                  cursor: "pointer"
                                }}
                              />
                            </Tooltip>
                          )}
                        </div>
                      )
                    }}
                  </Form.Item>
                </Col>
              </Row>

              {/* Seed 设置 */}
              <Row gutter={25} align="middle" style={{ marginBottom: "10px" }}>
                <Col span={2}>
                  <Form.Item noStyle shouldUpdate={() => false}>
                    {({ setFieldsValue }) => (
                      <Form.Item
                        name="seedEnable"
                        valuePropName="checked"
                        initialValue={false}
                        style={{ margin: 0 }}
                      >
                        <Switch
                          size="small"
                          onChange={(checked) =>
                            setFieldsValue({ seed: checked ? generateRandomNumber() : undefined })
                          }
                        />
                      </Form.Item>
                    )}
                  </Form.Item>
                </Col>
                <Col span={5} className="text-right">
                  <span>
                    Seed
                    <Tooltip title="生成时使用的随机数种子，用于控制模型生成内容的随机性。在使用seed时，模型将尽可能生成相同或相似的结果，但目前不保证每次生成的结果完全相同">
                      <InfoIcon className="ml-1" />
                    </Tooltip>
                  </span>
                </Col>
                <Col span={17}>
                  <Form.Item
                    noStyle
                    shouldUpdate={(prev, curr) => prev.seedEnable !== curr.seedEnable}
                  >
                    {({ getFieldValue, getFieldError }) => {
                      const seedEnable = getFieldValue("seedEnable")
                      const fieldError = getFieldError("seed")
                      const hasError = seedEnable && fieldError?.length > 0

                      return (
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <div style={{ flex: 1 }}>
                            {/* <GlobalVariableSelect
                              formName="seed"
                              multiple={false}
                              disabled={!seedEnable}
                              placeholder="请选择流程变量"
                              required={seedEnable}
                              message="请设置Seed值"
                              style={{ marginBottom: 0 }}
                              layout="vertical"
                              span={false}
                              label=""
                              initialValue={undefined}
                            /> */}
                            <Form.Item
                              name="seed"
                              rules={[{ required: !!seedEnable, message: "请输入Seed值" }]}
                              style={{ marginBottom: 0 }}
                            >
                              <InputNumber
                                disabled={!seedEnable}
                                placeholder="请输入Seed值"
                                style={{ width: "100%" }}
                                precision={0}
                                min={1}
                                max={9999999}
                                step={1}
                              />
                            </Form.Item>
                          </div>
                          {hasError && (
                            <Tooltip title={fieldError[0]} placement="top">
                              <ExclamationCircleOutlined
                                style={{
                                  color: "#ff4d4f",
                                  marginLeft: "8px",
                                  cursor: "pointer"
                                }}
                              />
                            </Tooltip>
                          )}
                        </div>
                      )
                    }}
                  </Form.Item>
                </Col>
              </Row>

              {/* response_format 设置 */}
              <Row gutter={25} align="middle" style={{ marginBottom: "10px" }}>
                <Col span={2}>
                  <Form.Item noStyle shouldUpdate={() => false}>
                    {({ setFieldsValue }) => (
                      <Form.Item
                        name="responseFormatEnable"
                        valuePropName="checked"
                        initialValue={false}
                        style={{ margin: 0 }}
                      >
                        <Switch
                          size="small"
                          onChange={(checked) =>
                            !checked && setFieldsValue({ responseFormat: undefined })
                          }
                        />
                      </Form.Item>
                    )}
                  </Form.Item>
                </Col>
                <Col span={7} className="text-right">
                  <span>Response Format</span>
                  <Tooltip title="返回内容的格式，选择json_object时，会输出标准格式的JSON字符串">
                    <InfoIcon className="ml-1" />
                  </Tooltip>
                </Col>
                <Col span={15}>
                  <Form.Item
                    noStyle
                    shouldUpdate={(prev, curr) =>
                      prev.responseFormatEnable !== curr.responseFormatEnable
                    }
                  >
                    {({ getFieldValue, getFieldError }) => {
                      const responseFormatEnable = getFieldValue("responseFormatEnable")
                      const fieldError = getFieldError("responseFormat")
                      const hasError = responseFormatEnable && fieldError?.length > 0

                      return (
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <Form.Item
                            name="responseFormat"
                            initialValue={undefined}
                            style={{ margin: 0, flex: 1 }}
                            help={false}
                            hasFeedback={false}
                            rules={[
                              {
                                required: responseFormatEnable,
                                message: "请选择Response Format值"
                              }
                            ]}
                          >
                            <Select
                              disabled={!responseFormatEnable}
                              className="responseFormatSelect"
                              placeholder="请选择Response Format"
                              options={llmResponseFormatList}
                              fieldNames={{ label: "name", value: "code" }}
                            />
                          </Form.Item>
                          {hasError && (
                            <Tooltip title={fieldError[0]} placement="top">
                              <ExclamationCircleOutlined
                                style={{
                                  color: "#ff4d4f",
                                  marginLeft: "8px",
                                  cursor: "pointer"
                                }}
                              />
                            </Tooltip>
                          )}
                        </div>
                      )
                    }}
                  </Form.Item>
                </Col>
              </Row>
            </div>
          )
        }}
      </Form.Item>
    </>
  )
}

export default AdvanceSetting
