import { Popconfirm, Switch } from "antd"
import { useState } from "react"

const StatusSwitch = ({ record, handleStatusChange }) => {
  const isOnline = record.status === 1
  const [switchChecked, setSwitchChecked] = useState(isOnline)
  const onSwitchClick = (checked, e) => {
    e.stopPropagation()
  }
  const title = `是否【${isOnline ? "停用" : "启用"}】该应用？`
  return (
    <Popconfirm
      title={title}
      okText="确定"
      cancelText="取消"
      onConfirm={() => {
        handleStatusChange(record, () => {
          setSwitchChecked(!switchChecked)
        })
      }}
    >
      <Switch
        onClick={onSwitchClick}
        checkedChildren="启用"
        unCheckedChildren="停用"
        checked={switchChecked}
      />
    </Popconfirm>
  )
}

export default StatusSwitch
