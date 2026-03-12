// @ts-nocheck
import {
  Button,
  Divider,
  Form,
  Input,
  Select,
  InputNumber,
  Space,
  TreeSelect,
  Tooltip,
  AutoComplete,
  Cascader
} from "antd"
import { Fragment, useMemo } from "react"
import { isEqual, flatMap } from "lodash"
import { DeleteOutlined } from "@ant-design/icons"
import { useTaskTypeListApi } from "@/api/knowledgeExtraction"
import { fetchBatchNoValid, fetchTaskNameValid } from "@/api/knowledgeExtraction/api"
import { skillTypeEnum } from "@/pages/knowledgeProject/knowledgeManage/extractionType"
import styles from "./index.module.scss"

const { List, Item, ErrorList, useWatch } = Form

const rules = [{ required: true }]

const verifyErrData = {
  batchNo: "输入值不存在，请重新输入！",
  taskName: "已有重复值，请重新输入！"
}

const KnowledgeExtractionForm = ({
  botNo,
  form,
  hiddenFields = [],
  disabled = false,
  externalVerifyRulesData = null,
  listByParentAndType
}) => {
  const taskType = useWatch("taskType", form)
  const skillType = useWatch("skillType", form)

  // 任务类型选项获取
  const { data: taskTypeList = [] } = useTaskTypeListApi({ botNo, skillType })

  // form自定义校验
  const verifyRulesData = (field) => {
    return [
      {
        validator: async (_, value) => {
          if (disabled || !value) return Promise.resolve()
          if (!(field === "batchNo" || field === "taskName")) return Promise.resolve()
          let res
          if (field === "batchNo") {
            res = await fetchBatchNoValid({
              botNo,
              taskType,
              batchNo: value
            })
          } else if (field === "taskName") {
            res = await fetchTaskNameValid({ botNo, taskName: value })
          }
          if (res?.data) {
            return Promise.resolve()
          } else {
            return Promise.reject(verifyErrData[field])
          }
        }
      }
    ]
  }

  // 当前选中的萃取任务类型对应的数据
  const { intention: intentionList, dynamicFields } = useMemo(
    () => taskTypeList?.find(({ taskType: tType }) => tType === taskType) || {},
    [taskTypeList, taskType]
  )

  // 将intentionList平铺，方便查找options
  const flatIntentionList = useMemo(
    () =>
      flatMap([...(intentionList || [])], (obj) => {
        const options = obj.options?.map(({ label, value }) => ({
          label,
          value
        }))
        if (obj.children) {
          return [
            { ...obj, options },
            ...flatMap(obj.children, (child) =>
              child.children ? [child, ...child.children] : child
            )
          ]
        }
        return { ...obj, options }
      }),
    [intentionList]
  )

  // form动态字段数据
  const formDynamicFields = useMemo(() => {
    const defaultFields = [
      {
        field: "taskName",
        fieldName: "萃取任务名称",
        require: true
      },
      {
        field: "skillType",
        fieldName: "工作流类型",
        require: true,
        selectProps: {
          options: Object.entries(skillTypeEnum).map(([value, label]) => ({
            label,
            value
          })),
          onChange: (value) => {
            const taskName = form.getFieldValue("taskName")
            form.resetFields()
            form.setFieldsValue({ taskName, skillType: value })
          }
        }
      },
      {
        field: "taskType",
        fieldName: "萃取任务类型",
        require: true,
        selectProps: {
          options: skillType ? taskTypeList : [],
          fieldNames: { label: "desc", value: "taskType" },
          onChange: (value) => {
            const { taskName, skillType: type, scene } = form.getFieldsValue()
            form.resetFields()
            form.setFieldsValue({
              taskName,
              skillType: type,
              scene,
              taskType: value
            })
          }
        }
      }
    ]
    if (skillType === "0") {
      defaultFields.push({
        field: "_scene",
        fieldName: "业务场景",
        require: true,
        selectProps: {
          options: listByParentAndType,
          fieldNames: {
            label: "name",
            value: "id",
            children: "childKnowledgeConfigs"
          }
        }
      })
    }
    if (dynamicFields?.length) {
      if (
        dynamicFields[0].fields.filter(({ field }) => field === "taskName" || field === "taskType")
          .length !== 2
      ) {
        dynamicFields[0].fields = [...defaultFields, ...(dynamicFields[0]?.fields || [])]
      }
      return dynamicFields
    }
    // 未选择萃取任务类型时的form字段
    const defaultDynamicFields = taskTypeList?.[0]?.dynamicFields?.[0] || {
      area: "萃取任务设置"
    }
    return [
      {
        ...defaultDynamicFields,
        fields: defaultFields
      }
    ]
  }, [dynamicFields, form, listByParentAndType, skillType, taskTypeList])

  const onValuesChange = (changedValues) => {
    console.log("onValuesChange", changedValues)
  }

  return (
    <Form
      className={styles["knowledge-extraction-add"]}
      form={form}
      onValuesChange={onValuesChange}
      disabled={disabled}
    >
      <div className={styles["add-box"]}>
        {formDynamicFields.map(({ area, fields }) => {
          return (
            <Fragment key={area}>
              <Divider orientation="left" orientationMargin="0">
                {area}
              </Divider>
              <div className={styles["item-box"]}>
                {fields
                  // 隐藏某个field值
                  .filter(({ field }) => !hiddenFields?.includes(field))
                  .map(
                    ({
                      field,
                      fieldName,
                      require,
                      selectProps,
                      tips,
                      valueType,
                      maximum,
                      children: fieldChildren
                    }) => (
                      <Fragment key={field}>
                        {/* 判断是否form-list */}
                        {valueType === "array" && (
                          <Item label={fieldName}>
                            <List
                              name={field}
                              rules={[
                                {
                                  validator: async (_, names) => {
                                    if (require && (!names || names.length < 1)) {
                                      return Promise.reject(new Error(`请添加至少一个${fieldName}`))
                                    }
                                    return Promise.resolve()
                                  }
                                }
                              ]}
                            >
                              {(fields, { add, remove }, { errors }) => (
                                <div className={styles["form-list"]}>
                                  {fields.map(({ key, name, ...restField }) => (
                                    <Space key={key}>
                                      {fieldChildren?.map(
                                        ({
                                          field: childField,
                                          fieldName: childFieldName,
                                          require: childRequire
                                        }) => (
                                          <Item
                                            noStyle
                                            shouldUpdate={(prevValues, curValues) =>
                                              !isEqual(prevValues[field], curValues[field])
                                            }
                                          >
                                            {({ getFieldValue }) => {
                                              const fieldValue = getFieldValue(field)
                                              const { layer: layerData, ...rest } =
                                                fieldValue?.[key] || {}
                                              // 获取意图列表选项
                                              const { options } =
                                                flatIntentionList?.find(
                                                  ({ value }) => value === layerData
                                                ) || {}
                                              return (
                                                <Item
                                                  {...restField}
                                                  key={childField}
                                                  rules={childRequire ? rules : []}
                                                  name={[name, childField]}
                                                >
                                                  {/* 判断是否是层级 */}
                                                  {childField === "layer" ? (
                                                    <TreeSelect
                                                      showSearch
                                                      placeholder={`请选择${childFieldName}`}
                                                      allowClear
                                                      showCheckedStrategy={TreeSelect.SHOW_PARENT}
                                                      treeData={intentionList}
                                                    />
                                                  ) : (
                                                    <AutoComplete
                                                      placeholder={`请输入${childFieldName}`}
                                                      options={rest?.[childField] ? options : []}
                                                      filterOption={(inputValue, option) =>
                                                        option.value
                                                          .toUpperCase()
                                                          .indexOf(inputValue.toUpperCase()) !== -1
                                                      }
                                                    />
                                                  )}
                                                </Item>
                                              )
                                            }}
                                          </Item>
                                        )
                                      )}
                                      <Item>
                                        <Tooltip title="删除">
                                          <Button
                                            type="link"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => {
                                              remove(name)
                                            }}
                                          ></Button>
                                        </Tooltip>
                                      </Item>
                                    </Space>
                                  ))}
                                  <Item noStyle>
                                    <Button type="dashed" onClick={() => add()} block>
                                      + 添加{fieldName}
                                    </Button>
                                  </Item>
                                  <ErrorList errors={errors} />
                                </div>
                              )}
                            </List>
                          </Item>
                        )}
                        {valueType !== "array" && (
                          <Item
                            name={field}
                            rules={[
                              ...(require ? rules : []),
                              {
                                validator: async (_, value) => {
                                  if (disabled || !value) return Promise.resolve()
                                  if (valueType === "number" && value > maximum) {
                                    return Promise.reject(
                                      `${fieldName}的值不能大于${maximum}，请重新输入！`
                                    )
                                  }
                                  return Promise.resolve()
                                }
                              },
                              ...(verifyRulesData(field) || []),
                              ...(externalVerifyRulesData?.({
                                field,
                                maximum
                              }) || [])
                            ]}
                            label={fieldName}
                          >
                            {/* 判断是否是下拉选择 */}
                            {!!selectProps && (
                              <>
                                {selectProps?.fieldNames?.children ? (
                                  <Cascader
                                    showSearch
                                    placeholder={tips || `请选择${fieldName}`}
                                    {...selectProps}
                                  />
                                ) : (
                                  <Select
                                    allowClear
                                    placeholder={tips || `请选择${fieldName}`}
                                    {...selectProps}
                                  />
                                )}
                              </>
                            )}
                            {!selectProps && (
                              <>
                                {/* 判断是否是数字框 */}
                                {valueType === "number" ? (
                                  <InputNumber
                                    allowClear
                                    placeholder={tips || `请输入${fieldName}`}
                                  />
                                ) : (
                                  <Input allowClear placeholder={tips || `请输入${fieldName}`} />
                                )}
                              </>
                            )}
                          </Item>
                        )}
                      </Fragment>
                    )
                  )}
              </div>
            </Fragment>
          )
        })}
      </div>
    </Form>
  )
}

export default KnowledgeExtractionForm
