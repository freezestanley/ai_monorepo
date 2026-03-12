import { Button, Form, Card } from "antd"
import { PlusOutlined, CopyOutlined, DeleteOutlined } from "@ant-design/icons"
import classNames from "classnames"
import LogicOperateTypeFormItem from "./logicOperateTypeFormItem"
import ConditionListItem from "./conditionListItem"
import styles from "./index.module.scss"

const MaxConditionListItem = ({ fields, field, index, add, remove, labelOperateList }) => {
  return (
    <>
      <Form.List name={[field.name, "conditionConfigList"]} initialValue={[{}]}>
        {(subFields, { add: subAdd, remove: subRemove }) => (
          <Card className={classNames(styles.cardBox, styles.childCardBox)}>
            {subFields.map((subField, subIndex) => (
              <div className={styles.cardList} key={subField.key}>
                {/* 第二层 */}
                <ConditionListItem
                  field={field}
                  subFields={subFields}
                  subField={subField}
                  subIndex={subIndex}
                  subAdd={subAdd}
                  subRemove={subRemove}
                  labelOperateList={labelOperateList}
                />
              </div>
            ))}
          </Card>
        )}
      </Form.List>
      {/* 操作区 */}
      <div className={classNames(styles.optionsBox, styles.addButton)}>
        {index === fields.length - 1 ? (
          <Button type="primary" ghost onClick={() => add()} icon={<PlusOutlined />} />
        ) : (
          <LogicOperateTypeFormItem
            getTypeValue={(getFieldValue) =>
              getFieldValue?.("maxConditionConfigList")?.[field.name]?.logicOperateType
            }
            onCheckType={({ getFieldValue, setFieldsValue }, value) => {
              const conditionList = getFieldValue("maxConditionConfigList")
              conditionList[field.name].logicOperateType = value
              setFieldsValue({
                maxConditionConfigList: [...conditionList]
              })
            }}
            name={[field.name, "logicOperateType"]}
          />
        )}
        <Form.Item noStyle shouldUpdate>
          {({ getFieldValue, setFieldsValue }) => {
            return (
              <Button
                className={styles.optionBtn}
                icon={<CopyOutlined />}
                onClick={() => {
                  const value = getFieldValue("maxConditionConfigList")?.[field.name]
                  if (!value) return
                  const list = getFieldValue("maxConditionConfigList") || []
                  list.splice(index, 0, value)
                  setFieldsValue({
                    maxConditionConfigList: [...list]
                  })
                }}
              />
            )
          }}
        </Form.Item>
        {fields.length > 1 && (
          <Button
            className={styles.optionBtn}
            icon={<DeleteOutlined />}
            onClick={() => remove(field.name)}
          />
        )}
      </div>
    </>
  )
}

export default MaxConditionListItem
