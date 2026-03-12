import React, { useEffect, useState } from "react"
import { Form, Popconfirm, Switch } from "antd"

const SecurityPolicySwitch = ({
  form,
  checked = true,
  name = "enableSenseInfoDetect",
  disabled = false
}) => {
  // 默认为启用状态
  const [switchChecked, setSwitchChecked] = useState(checked)

  const onSwitchClick = (checked, event) => {
    event.stopPropagation()
    // 防止直接切换，而是通过Popconfirm来控制
  }

  useEffect(() => {
    setSwitchChecked(checked)
  }, [checked])

  const title = `是否${switchChecked ? "停用" : "启用"}安全策略？`

  const handleConfirm = async () => {
    // 可以在这里添加更多处理逻辑
    setSwitchChecked(!switchChecked)
    form.setFieldsValue({ [name]: !switchChecked })
  }

  return (
    <Popconfirm title={title} okText="确定" cancelText="取消" onConfirm={handleConfirm}>
      <Switch
        onClick={onSwitchClick}
        checkedChildren="已启用"
        unCheckedChildren="未启用"
        checked={switchChecked}
        disabled={disabled}
      />
    </Popconfirm>
  )
}

export default SecurityPolicySwitch
