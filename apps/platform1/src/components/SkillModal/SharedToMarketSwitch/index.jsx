import React, { useEffect, useState } from "react"
import { Popconfirm, Switch } from "antd"

const SharedToMarketSwitch = ({ form, checked = false, name = "beSharedToMarket" }) => {
  // 默认为关闭状态
  const [switchChecked, setSwitchChecked] = useState(checked)

  const onSwitchClick = (checked, event) => {
    event.stopPropagation()
    // 防止直接切换，而是通过Popconfirm来控制
  }

  useEffect(() => {
    setSwitchChecked(checked)
  }, [checked])

  const handleConfirm = async () => {
    // 可以在这里添加更多处理逻辑
    setSwitchChecked(!switchChecked)
    form.setFieldsValue({ [name]: !switchChecked })
  }

  return (
    <>
      {/* 停用时，需要加二次确认弹窗 */}
      {switchChecked ? (
        <Popconfirm
          title="【停用】后，已订阅空间将无法使用该工作流"
          okText="确定"
          cancelText="取消"
          onConfirm={handleConfirm}
          overlayInnerStyle={{ maxWidth: "240px" }}
        >
          <Switch onClick={onSwitchClick} checked={switchChecked} />
        </Popconfirm>
      ) : (
        <Switch onClick={handleConfirm} />
      )}
    </>
  )
}

export default SharedToMarketSwitch
