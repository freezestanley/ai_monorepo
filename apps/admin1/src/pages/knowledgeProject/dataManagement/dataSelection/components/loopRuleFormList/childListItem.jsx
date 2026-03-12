import { Button, Form, Input, Select, Row, Col, InputNumber, DatePicker } from "antd"
import { PlusOutlined, CopyOutlined } from "@ant-design/icons"
import classNames from "classnames"
import LogicOperateTypeFormItem from "./logicOperateTypeFormItem"
import styles from "./index.module.scss"

const ChildListItem = ({
  field,
  subField,
  subChildFields,
  subChildField,
  subChildIndex,
  subChildAdd,
  subChildRemove,
  labelOperateList
}) => {
  return (
    <Row gutter={24} key={subChildField.key}>
      <Form.Item noStyle shouldUpdate>
        {({ getFieldValue, setFieldsValue }) => {
          const { labelId, operatorType } =
            getFieldValue("maxConditionConfigList")[field.name]?.conditionConfigList?.[
              subField.name
            ]?.childList?.[subChildIndex] || {}
          const { operateTypeList, lableType, lableCodeMappingList, dataFormatType } =
            labelOperateList?.find(({ id }) => id === labelId) || {}
          return (
            <>
              <Col span={6}>
                <Form.Item
                  label=""
                  name={[subChildField.name, "labelId"]}
                  rules={[
                    {
                      required: true,
                      message: "请选择"
                    }
                  ]}
                >
                  <Select
                    placeholder="请选择"
                    options={labelOperateList}
                    fieldNames={{
                      label: "lableName",
                      value: "id"
                    }}
                    onChange={() => {
                      const conditionList = getFieldValue("maxConditionConfigList")
                      conditionList[field.name].conditionConfigList[subField.name].childList[
                        subChildField.name
                      ].operatorType = undefined
                      conditionList[field.name].conditionConfigList[subField.name].childList[
                        subChildField.name
                      ].labelValue = undefined
                      setFieldsValue({
                        maxConditionConfigList: [...conditionList]
                      })
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={5}>
                <Form.Item
                  label=""
                  name={[subChildField.name, "operatorType"]}
                  rules={[
                    {
                      required: true,
                      message: "请选择"
                    }
                  ]}
                >
                  <Select
                    placeholder="请选择"
                    options={operateTypeList}
                    fieldNames={{
                      label: "operatorName",
                      value: "operatorCode"
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                {/* 空值和非空值不显示 */}
                {!["5", "6"].includes(operatorType) && (
                  <Form.Item
                    label=""
                    name={[subChildField.name, "labelValue"]}
                    rules={[
                      {
                        required: true,
                        message: lableType === 1 || lableType === 4 ? "请选择" : "请输入"
                      }
                    ]}
                  >
                    {lableType === 1 && (
                      <Select
                        placeholder="请选择"
                        options={lableCodeMappingList}
                        fieldNames={{
                          label: "value",
                          value: "code"
                        }}
                      />
                    )}
                    {(lableType === 2 || !lableType) && <Input placeholder="请输入" />}
                    {lableType === 3 && (
                      <InputNumber style={{ width: "100%" }} placeholder="请输入" />
                    )}
                    {lableType === 4 && (
                      <DatePicker
                        showTime={dataFormatType === "1"}
                        style={{ width: "100%" }}
                        placeholder="请选择"
                      />
                    )}
                  </Form.Item>
                )}
              </Col>
            </>
          )
        }}
      </Form.Item>
      {/* 操作区 */}
      <Col span={3}>
        {subChildFields.length > 1 && (
          <Button type="link" danger onClick={() => subChildRemove(subChildField.name)}>
            删除
          </Button>
        )}
      </Col>
      <Col span={2}>
        <div className={classNames(styles.optionsBox)}>
          {subChildIndex === subChildFields.length - 1 ? (
            <Button type="primary" ghost onClick={() => subChildAdd()} icon={<PlusOutlined />} />
          ) : (
            <LogicOperateTypeFormItem
              getTypeValue={(getFieldValue) =>
                getFieldValue?.("maxConditionConfigList")?.[field.name]?.conditionConfigList?.[
                  subField.name
                ]?.childList?.[subChildField.name]?.logicOperateType
              }
              onCheckType={({ getFieldValue, setFieldsValue }, value) => {
                const conditionList = getFieldValue("maxConditionConfigList")
                conditionList[field.name].conditionConfigList[subField.name].childList[
                  subChildField.name
                ].logicOperateType = value
                setFieldsValue({
                  maxConditionConfigList: [...conditionList]
                })
              }}
              name={[subChildField.name, "logicOperateType"]}
            />
          )}
          <Form.Item noStyle shouldUpdate>
            {({ getFieldValue, setFieldsValue }) => {
              return (
                <Button
                  className={styles.optionBtn}
                  icon={<CopyOutlined />}
                  onClick={() => {
                    const value =
                      getFieldValue("maxConditionConfigList")?.[field.name]?.conditionConfigList?.[
                        subField.name
                      ]?.childList?.[subChildField.name]
                    if (!value) return
                    const list = getFieldValue("maxConditionConfigList") || []
                    list?.[field.name]?.conditionConfigList?.[subField.name]?.childList?.splice(
                      subChildIndex,
                      0,
                      value
                    )
                    setFieldsValue({
                      maxConditionConfigList: [...list]
                    })
                  }}
                />
              )
            }}
          </Form.Item>
        </div>
      </Col>
    </Row>
  )
}

export default ChildListItem
