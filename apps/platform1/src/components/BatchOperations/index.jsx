import React from "react"
import { Button, Dropdown, Modal, message } from "antd"
import { DownOutlined } from "@ant-design/icons"
import PropTypes from "prop-types"

const BatchOperations = ({
  rejectDeleteText = "",
  selectedKeys = [],
  onBatchDelete,
  extraItems = [],
  disabled = false,
  loading = false,
  showDelete = true, // 是否显示批量删除选项
  itemOrder = [] // 自定义菜单项顺序,通过key来排序
}) => {
  // 处理批量删除
  const handleBatchDelete = () => {
    if (!selectedKeys?.length) {
      message.warning("请先选择要删除的项")
      return
    }

    if (rejectDeleteText) {
      Modal.error({
        title: "温馨提示",
        content: rejectDeleteText,
        okText: "确定"
      })
      return
    }

    Modal.confirm({
      title: "是否确认删除",
      content: "删除后不可恢复，请谨慎操作！",
      onOk: () => {
        onBatchDelete?.(selectedKeys)
      }
    })
  }

  // 默认的批量删除菜单项
  const defaultItems = showDelete
    ? [
        {
          key: "delete",
          label: "批量删除",
          onClick: handleBatchDelete
        }
      ]
    : []

  // 合并默认项和额外项
  let items = [...defaultItems, ...extraItems]

  // 如果提供了自定义顺序,按照顺序重新排序
  if (itemOrder.length > 0) {
    const itemMap = new Map(items.map((item) => [item.key, item]))
    items = itemOrder.map((key) => itemMap.get(key)).filter(Boolean) // 过滤掉undefined的项

    // 将未在排序列表中的项添加到末尾
    const orderedKeys = new Set(itemOrder)
    const remainingItems = items.filter((item) => !orderedKeys.has(item.key))
    items = items.concat(remainingItems)
  }

  return (
    <Dropdown
      menu={{
        items: items.map((item) => ({
          ...item,
          disabled: item.key !== "5" && item.key !== "4" && selectedKeys.length === 0
        }))
      }}
    >
      <Button loading={loading} disabled={disabled}>
        批量操作 <DownOutlined />
      </Button>
    </Dropdown>
  )
}

BatchOperations.propTypes = {
  selectedKeys: PropTypes.array, // 选中的行key数组
  onBatchDelete: PropTypes.func, // 批量删除回调
  extraItems: PropTypes.array, // 额外的菜单项
  disabled: PropTypes.bool, // 是否禁用
  showDelete: PropTypes.bool, // 是否显示批量删除选项
  itemOrder: PropTypes.arrayOf(PropTypes.string) // 自定义菜单项顺序
}

export default BatchOperations
