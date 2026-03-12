import { Button, Form } from "antd"
import { PlusOutlined, CopyOutlined, DeleteOutlined } from "@ant-design/icons"
import classNames from "classnames"
import LogicOperateTypeFormItem from "./logicOperateTypeFormItem"
import ChildListItem from "./childListItem"
import styles from "./index.module.scss"

const ConditionListItem = ({
  field,
  subFields,
  subField,
  subIndex,
  subAdd,
  subRemove,
  labelOperateList
}) => {
  return (
    <>
      <Form.List name={[subField.name, "childList"]} initialValue={[{}]}>
        {(subChildFields, { add: subChildAdd, remove: subChildRemove }) =>
          subChildFields.map((subChildField, subChildIndex) => (
            // 第三层
            <ChildListItem
              field={field}
              subField={subField}
              subChildFields={subChildFields}
              subChildField={subChildField}
              subChildIndex={subChildIndex}
              subChildAdd={subChildAdd}
              subChildRemove={subChildRemove}
              labelOperateList={labelOperateList}
            />
          ))
        }
      </Form.List>
      {/* 操作区 */}
      <div className={classNames(styles.optionsBox, styles.addButton)}>
        {subIndex == subFields.length - 1 ? (
          <Button type="primary" ghost onClick={() => subAdd()} icon={<PlusOutlined />} />
        ) : (
          <LogicOperateTypeFormItem
            getTypeValue={(getFieldValue) =>
              getFieldValue?.("maxConditionConfigList")?.[field.name]?.conditionConfigList?.[
                subField.name
              ]?.logicOperateType
            }
            onCheckType={({ getFieldValue, setFieldsValue }, value) => {
              const conditionList = getFieldValue("maxConditionConfigList")
              conditionList[field.name].conditionConfigList[subField.name].logicOperateType = value
              setFieldsValue({
                maxConditionConfigList: [...conditionList]
              })
            }}
            name={[subField.name, "logicOperateType"]}
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
                    ]
                  if (!value) return
                  const list = getFieldValue("maxConditionConfigList") || []
                  list?.[field.name]?.conditionConfigList.splice(subIndex, 0, value)
                  setFieldsValue({
                    maxConditionConfigList: [...list]
                  })
                }}
              />
            )
          }}
        </Form.Item>
        {subFields.length > 1 && (
          <Button
            className={styles.optionBtn}
            icon={<DeleteOutlined />}
            onClick={() => subRemove(subField.name)}
          />
        )}
      </div>
    </>
  )
}

export default ConditionListItem
