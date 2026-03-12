import { Popconfirm, Switch } from "antd"
import { useState } from "react"

/**
 *
 * @param {*} record 当前行数据
 * @param {*} handleStatusChange 更改状态的回调函数
 * @param {*} statusCheckProp 状态字段属性
 * @param {*} onlineText 上线文本
 * @param {*} offlineText 下线文本
 * @param {*} enableText 启用文本
 * @param {*} disableText 停用文本
 * @param {*} confirmText 确定文本
 * @param {*} cancelText 取消文本
 * @param {*} popconfirmTitle 自定义Popconfirm标题函数
 * @returns
 */
/** */
const StatusSwitch = ({
  record,
  handleStatusChange,
  statusCheckProp = "statusDisplayName", // 默认为'statusDisplayName'
  onlineText = "已上线", // 默认在线文本
  offlineText = "已下线", // 默认离线文本
  enableText = "启用", // Switch 启用文本
  disableText = "停用", // Switch 停用文本
  confirmText = "确定",
  cancelText = "取消",
  popconfirmTitle // 自定义Popconfirm标题函数
}) => {
  const isOnline = record[statusCheckProp] === onlineText
  const [switchChecked, setSwitchChecked] = useState(isOnline)

  // 自定义点击事件，阻止事件冒泡
  const onSwitchClick = (checked, e) => {
    e.stopPropagation()
  }

  // 使用函数动态生成Popconfirm的标题
  const title = popconfirmTitle
    ? popconfirmTitle(isOnline)
    : `是否【${isOnline ? disableText : enableText}】该项`

  return (
    <Popconfirm
      title={title}
      okText={confirmText}
      cancelText={cancelText}
      onConfirm={async () => {
        const res = await handleStatusChange(record)
        if (res?.success) {
          setSwitchChecked(!switchChecked)
        } else {
          // 可以在这里处理错误，例如弹出通知
        }
      }}
    >
      <Switch
        onClick={onSwitchClick}
        checkedChildren={enableText}
        unCheckedChildren={disableText}
        checked={switchChecked}
      />
    </Popconfirm>
  )
}

export default StatusSwitch
