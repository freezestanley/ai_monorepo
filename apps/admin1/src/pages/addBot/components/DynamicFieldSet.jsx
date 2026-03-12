import React, { useEffect, useMemo } from "react"
import { Form, Input, Button, Select, Switch, Row, Col, Space, Radio, Tooltip } from "antd"
import { MinusCircleOutlined, PlusOutlined, QuestionCircleOutlined } from "@ant-design/icons"
import { useFetchFieldTypes } from "@/api/structureKnowledge"
import CustomSelect from "@/components/CustomSelect"

const customSelectConfig = {
  placeholder: "请选择可见来源",
  allText: "全局可见",
  partialText: "分来源可见",
  emptyTipText: "请选择来源标签"
}

const DynamicFieldSet = ({
  isEdit,
  form,
  hiddenAddBtn = false,
  sourceSwitch = false,
  sceneSwitch = false,
  editStrategies = [],
  onRemoveChange,
  sourceTag = []
}) => {
  const { data: { data } = {} } = useFetchFieldTypes()
  // const [originDataLength, setOriginDataLength] = React.useState(0)
  const dataTypeOptions = data?.filter((item) => item.visible)
  const disabled = isEdit

  const customSelectOptions = useMemo(() => {
    return sourceTag.map((item) => ({
      label: item.tagDesc,
      value: item.code
    }))
  }, [sourceTag])
  // .getFieldValue("strategies")
  const onSwitchChange = (value, i) => {
    const currentValue = form.getFieldValue("strategies") || []

    const newValue = currentValue.map((item, j) => {
      return {
        ...item,
        embeddingModel: value === true ? (i === j ? true : false) : false
      }
    })
    form.setFieldValue("strategies", newValue)
  }

  useEffect(() => {
    const currentValue = form.getFieldValue("strategies") || []
    const indexFristName = currentValue?.[0]?.key || undefined
    const indexFristEditStrategies = editStrategies?.[0] || undefined

    if (indexFristEditStrategies?.key === "sourceTag") {
      if (!sourceSwitch) {
        currentValue.shift()
      } else {
        indexFristName !== "sourceTag" && currentValue.unshift(indexFristEditStrategies)
      }
    } else {
      // 新增一行来源标签
      if (indexFristName && indexFristName === "sourceTag") {
        currentValue.shift()
      } else {
        sourceSwitch &&
          currentValue.unshift({
            name: "来源标签",
            type: "keyword",
            key: "sourceTag",
            operationTypes: null,
            visibleType: null,
            embeddingModel: 0,
            description: "来源标签"
          })
      }
    }

    form.setFieldValue("strategies", currentValue)
  }, [sourceSwitch])

  useEffect(() => {
    const currentValue = form.getFieldValue("strategies") || []

    // 先移除已存在的 sceneTag（如果有的话）
    const filteredValue = currentValue.filter((item) => item.key !== "sceneTag")

    // 如果 sceneSwitch 为 true，准备插入 sceneTag
    if (sceneSwitch) {
      const sceneTagObj = {
        name: "场景标签",
        type: "keyword",
        key: "sceneTag",
        operationTypes: null,
        visibleType: null,
        embeddingModel: 0,
        description: "场景标签"
      }

      // 如果第一项是 sourceTag，插入到第二位
      if (filteredValue[0]?.key === "sourceTag") {
        filteredValue.splice(1, 0, sceneTagObj)
      }
      // 如果第一项不是 sourceTag，插入到第一位
      else {
        filteredValue.unshift(sceneTagObj)
      }
    }

    form.setFieldValue("strategies", filteredValue)
  }, [sceneSwitch])

  useEffect(() => {
    // 编辑时候判断那些是新的，新的可以编辑
    if (isEdit) {
      const currentValue = form.getFieldValue("strategies") || []
      currentValue.map((v) => {
        return (v.isEdit = true)
      })
      form.setFieldValue("strategies", currentValue)
    }
  }, [isEdit])

  return (
    <Form.List name="strategies">
      {(fields, { add, remove }) => (
        <>
          <div className="dynamic-fieldset-header" style={{ marginBottom: 8, marginLeft: 10 }}>
            <Row gutter={24} style={{ background: "#EAEDF3" }} className="p-3">
              <Col className="gutter-row" span={4}>
                <div>字段名称</div>
              </Col>
              <Col className="gutter-row" span={5}>
                <div>
                  数据类型
                  <Tooltip
                    title={
                      <>
                        <p>
                          字符串-关键字：适用于短文本，需要精确匹配的字段。长文本请不要选择此类型，可能导致入库失败，无法召回。
                        </p>
                        <p>字符串-文本：适用于不需要精确匹配的字段，可支持分词搜索。</p>
                      </>
                    }
                  >
                    <QuestionCircleOutlined style={{ marginLeft: 5 }} />
                  </Tooltip>
                </div>
              </Col>
              <Col className="gutter-row" span={3}>
                <div>向量搜索</div>
              </Col>
              <Col className="gutter-row" span={3}>
                <div>分词搜索</div>
              </Col>
              <Col className="gutter-row" span={6}>
                <div>描述</div>
              </Col>
              <Col className="gutter-row" span={3}>
                <div>操作</div>
              </Col>
            </Row>
          </div>
          {fields.map(({ key, name, ...restField }, index) => {
            const currentName = form.getFieldValue("strategies")?.[index]?.key
            const isSourceTagOrSceneTag =
              (index === 0 || index === 1) &&
              (currentName === "sourceTag" || currentName === "sceneTag")
            return (
              <Row
                gutter={24}
                key={key}
                className={`${
                  isSourceTagOrSceneTag
                    ? "bg-red-50 pt-[10px] rounded-md  h-[80px] !mb-[15px] !-ml-[3px]"
                    : "!-ml-[3px]"
                }`}
                style={{ marginBottom: 8 }}
              >
                {isSourceTagOrSceneTag && currentName === "sourceTag" ? (
                  <Col span={24}>
                    <p className="mb-[5px] text-gray-800 font-bold"> 来源标签项：</p>
                  </Col>
                ) : (
                  ""
                )}

                {isSourceTagOrSceneTag && currentName === "sceneTag" ? (
                  <Col span={24}>
                    <p className="mb-[5px] text-gray-800 font-bold"> 场景标签项：</p>
                  </Col>
                ) : (
                  ""
                )}

                <Col span={4}>
                  <Form.Item
                    {...restField}
                    name={[name, "name"]}
                    rules={[
                      { required: true, message: "字段名称是必填的" },
                      {
                        validator: (_, value) => {
                          if (["编号", "创建信息", "更新信息"].includes(value)) {
                            return Promise.reject(new Error(`名称不能为"${value}"`))
                          }
                          return Promise.resolve()
                        }
                      }
                    ]}
                    // noStyle
                  >
                    <Input
                      placeholder="字段名称"
                      className={`${
                        index === 0 && currentName === "sourceTag" ? "disabled:text-red-400" : ""
                      }`}
                      disabled={
                        (disabled && form.getFieldValue("strategies")?.[index]?.isEdit) ||
                        isSourceTagOrSceneTag
                      }
                    />
                  </Form.Item>
                </Col>
                <Col span={5}>
                  <Form.Item
                    {...restField}
                    name={[name, "type"]}
                    rules={[{ required: true, message: "数据类型是必选的" }]}
                  >
                    <Select
                      placeholder="数据类型"
                      disabled={
                        (disabled && form.getFieldValue("strategies")?.[index]?.isEdit) ||
                        isSourceTagOrSceneTag
                      }
                    >
                      {dataTypeOptions?.map((option) => (
                        <Select.Option key={option.code} value={option.code}>
                          <span
                            className={`${
                              index === 0 &&
                              form.getFieldValue("strategies")?.[0]?.name === "sourceTag"
                                ? "text-red-400"
                                : ""
                            }`}
                          >
                            {option.name}
                          </span>
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={2} className="mt-[4px]">
                  <Form.Item
                    {...restField}
                    name={[name, "embeddingModel"]}
                    valuePropName="checked"
                    initialValue={false}
                    noStyle
                  >
                    <Switch
                      disabled={
                        (disabled && form.getFieldValue("strategies")?.[index]?.isEdit) ||
                        isSourceTagOrSceneTag
                      }
                      onChange={(value) => {
                        onSwitchChange(value, index)
                      }}
                    />
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item {...restField} name={[name, "analyzer"]} initialValue="/" noStyle>
                    <Radio.Group
                      size="small"
                      disabled={
                        (disabled && form.getFieldValue("strategies")?.[index]?.isEdit) ||
                        form.getFieldValue("strategies")?.[index]?.type !== "text"
                      }
                      className="!ml-[25px] mt-[5px]"
                    >
                      <Radio.Button value="/">/</Radio.Button>
                      <Radio.Button value="cn">cn</Radio.Button>
                      <Radio.Button value="en">en</Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item {...restField} name={[name, "description"]} noStyle>
                    <Input
                      placeholder="描述"
                      className={`${
                        index === 0 && form.getFieldValue("strategies")?.[0]?.name === "sourceTag"
                          ? "disabled:text-red-400"
                          : ""
                      }`}
                      disabled={isSourceTagOrSceneTag}
                    />
                  </Form.Item>
                </Col>
                {/* <Col span={7}>
                <Form.Item {...restField} name={[name, "tags"]} noStyle>
                  <CustomSelect
                    options={customSelectOptions}
                    config={customSelectConfig}
                    isSingle={true} // false: 多选；true：单选
                    style={{ width: "235px", zIndex: 10 }}
                  />
                </Form.Item>
              </Col> */}

                {/* <Col span={3}>
              {!(
                index === 0 &&
                form.getFieldValue("strategies")?.[0]?.name === "sourceTag"
              ) && (
                <MinusCircleOutlined
                  onClick={() => {
                    remove(name)
                    if (onRemoveChange) {
                      // 记录删除的索引
                      onRemoveChange(name)
                    }
                  }}
                />
              )}
            </Col> */}

                <Col span={3}>
                  {!(disabled && form.getFieldValue("strategies")?.[index]?.isEdit) &&
                    !isSourceTagOrSceneTag && (
                      <MinusCircleOutlined
                        className="!mt-[10px]"
                        onClick={() => {
                          remove(name)
                          if (onRemoveChange) {
                            // 记录删除的索引
                            onRemoveChange(name)
                          }
                        }}
                      />
                    )}
                </Col>
              </Row>
            )
          })}

          {hiddenAddBtn === true ? null : (
            <Form.Item>
              <Button
                type="dashed"
                // disabled={disabled}
                onClick={() => add()}
                icon={<PlusOutlined />}
                style={{ width: "100%" }}
              >
                添加字段
              </Button>
            </Form.Item>
          )}
        </>
      )}
    </Form.List>
  )
}

export default DynamicFieldSet
