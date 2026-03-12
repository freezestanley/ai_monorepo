import { Form, Card } from "antd"
import { useFetchListLableOperateByDsIdApi } from "@/api/dataManagement"
import MaxConditionListItem from "./maxConditionListItem"
import styles from "./index.module.scss"

const LoopRuleFormList = ({ dsId }) => {
  const { data: labelOperateList } = useFetchListLableOperateByDsIdApi({
    id: dsId
  })

  return (
    <>
      <Form.Item label="圈选规则" colon={false} style={{ marginBottom: 0 }} />
      <Form.List name="maxConditionConfigList" initialValue={[{}]}>
        {(fields, { add, remove }) => (
          <Card className={styles.cardBox}>
            {fields.map((field, index) => (
              <div className={styles.cardList} key={field.key}>
                {/* 第一层 */}
                <MaxConditionListItem
                  fields={fields}
                  field={field}
                  index={index}
                  add={add}
                  remove={remove}
                  labelOperateList={labelOperateList}
                />
              </div>
            ))}
          </Card>
        )}
      </Form.List>
    </>
  )
}

export default LoopRuleFormList
