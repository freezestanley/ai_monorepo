import { Switch, Popconfirm } from "antd"
import { useCallback } from "react"

const EnableSwitch = ({
  checked,
  onChange,
  loading = false,
  size = "default",
  disabled = false,
  checkedChildren = "启用",
  unCheckedChildren = "停用",
  showConfirm = true,
  confirmTitle,
  confirmCheckedTitle = "是否停用?",
  confirmUncheckedTitle = "是否启用?",
  okText = "是",
  cancelText = "否",
  popconfirmProps = {},
  ...restProps
}) => {
  const handleChange = useCallback(
    (checked) => {
      onChange?.(checked)
    },
    [onChange]
  )

  const switchNode = (
    <Switch
      checked={checked}
      // onChange={handleChange}
      loading={loading}
      size={size}
      disabled={disabled}
      checkedChildren={checkedChildren}
      unCheckedChildren={unCheckedChildren}
      {...restProps}
    />
  )

  if (!showConfirm) {
    return switchNode
  }

  return (
    <Popconfirm
      title={confirmTitle || (checked ? confirmCheckedTitle : confirmUncheckedTitle)}
      okText={okText}
      cancelText={cancelText}
      onConfirm={() => handleChange(!checked)}
      {...popconfirmProps}
    >
      {switchNode}
    </Popconfirm>
  )
}

export default EnableSwitch
