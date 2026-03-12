import { Button, Form, Input } from "antd"
import styles from "./index.module.scss"

const logicOperate = {
  1: "且",
  2: "或",
  3: "非"
}

// 逻辑运算类型切换
const LogicOperateTypeFormItem = ({ name, getTypeValue, onCheckType }) => {
  return (
    <Form.Item noStyle shouldUpdate>
      {({ getFieldValue, setFieldsValue }) => {
        const type = getTypeValue?.(getFieldValue)
        const typeList = Object.keys(logicOperate)
        const curIndex = typeList.findIndex((v) => v === type?.toString())

        return (
          <>
            <Form.Item name={name} noStyle hidden initialValue={1}>
              <Input />
            </Form.Item>
            <div className={styles.optionsBox}>
              <Button
                className={styles.optionBtn}
                onClick={() =>
                  onCheckType?.(
                    { getFieldValue, setFieldsValue },
                    typeList[curIndex === typeList.length - 1 ? 0 : curIndex + 1]
                  )
                }
              >
                {logicOperate[type]}
              </Button>
            </div>
          </>
        )
      }}
    </Form.Item>
  )
}

export default LogicOperateTypeFormItem
