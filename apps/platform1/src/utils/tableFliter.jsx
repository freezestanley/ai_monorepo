import { Button, Form, Input, Select, Space, InputNumber } from "antd"
// import { FilterOutlined, SearchOutlined } from "@ant-design/icons"
import { FilterFilled } from "@ant-design/icons"
import { TreeSelect } from "antd"

function isEmpty(obj) {
  if (!obj) return true
  return Object.values(obj).every((value) => (typeof value === "number" ? false : !value))
}

function hasValue(value) {
  if (value === 0) return true
  if (Array.isArray(value)) return value.length > 0
  if (value && typeof value === "object") return !isEmpty(value)
  return value !== undefined && value !== null && value !== ""
}

// 添加一个函数来处理 treeData，给有 children 的节点添加 selectable: false
const processTreeData = (treeData) => {
  return treeData.map((node) => {
    if (node.children && node.children.length > 0) {
      return {
        ...node,
        selectable: false,
        children: processTreeData(node.children)
      }
    }
    return node
  })
}

export function TableFilter(props) {
  const {
    form,
    refresh,
    searchParams,
    searchInput,
    dataIndex,
    fieldType,
    disabled = false,
    multipleSelect = false,
    enums
  } = props

  let inputValue = undefined

  return {
    filterDropdown: ({ close, visible }) => {
      if (!visible) {
        form.setFieldsValue({
          [dataIndex]:
            searchParams instanceof Function ? searchParams()[dataIndex] : searchParams[dataIndex]
        })

        inputValue =
          searchParams instanceof Function ? searchParams()[dataIndex] : searchParams[dataIndex]
      }
      return (
        <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
          <Space className="mb-2">
            <Button
              disabled={disabled}
              type="primary"
              onClick={async () => {
                // 重置输入值
                // inputValue = undefined
                // 重置表单字段
                // const currentValues = form.getFieldsValue()
                // const newCurrentValues = {
                //   ...currentValues,
                //   pageNum: 1
                // }
                // await form.setFieldsValue(newCurrentValues)
                // console.log("currentValues", newCurrentValues, currentValues)
                refresh(inputValue)
                close()
              }}
              size="small"
              style={{ width: 90 }}
            >
              查询
            </Button>

            <Button
              disabled={disabled}
              onClick={() => {
                // 重置输入值
                inputValue = undefined

                if (dataIndex === "startTime" || dataIndex === "endTime") {
                  form.setFieldsValue({ startTime: undefined, endTime: undefined })
                } else {
                  // 重置表单字段
                  form.setFieldsValue({ [dataIndex]: undefined })
                }

                // 调用刷新方法，传入 undefined 表示重置该字段
                refresh(undefined)

                // 关闭下拉框
                close()
              }}
              size="small"
              style={{ width: 90 }}
            >
              重置
            </Button>
            <Button disabled={disabled} type="link" size="small" onClick={() => close()}>
              关闭
            </Button>
          </Space>
          <Form.Item noStyle {...(fieldType === "inputNumberGroup" ? {} : { name: dataIndex })}>
            {fieldType === "inputNumberGroup" ? (
              <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                <Form.Item
                  noStyle
                  shouldUpdate={(prevValues, curValues) =>
                    prevValues[dataIndex]?.max !== curValues[dataIndex]?.max
                  }
                >
                  {({ getFieldValue }) => (
                    <Form.Item
                      noStyle
                      name={[dataIndex, "min"]}
                      rules={[{ required: true, message: "请输入最小值" }]}
                    >
                      <InputNumber
                        style={{ flex: 1 }}
                        placeholder="最小值"
                        min={0}
                        max={getFieldValue([dataIndex, "max"])}
                        precision={0}
                      />
                    </Form.Item>
                  )}
                </Form.Item>
                <span style={{ margin: "0 8px" }}>-</span>
                <Form.Item
                  noStyle
                  shouldUpdate={(prevValues, curValues) =>
                    prevValues[dataIndex]?.min !== curValues[dataIndex]?.min
                  }
                >
                  {({ getFieldValue }) => (
                    <Form.Item
                      noStyle
                      name={[dataIndex, "max"]}
                      rules={[{ required: true, message: "请输入最大值" }]}
                    >
                      <InputNumber
                        style={{ flex: 1 }}
                        placeholder="最大值"
                        min={getFieldValue([dataIndex, "min"]) || 0}
                        precision={0}
                      />
                    </Form.Item>
                  )}
                </Form.Item>
              </div>
            ) : fieldType === "select" ? (
              <Select
                disabled={disabled}
                ref={searchInput}
                mode={multipleSelect ? "multiple" : undefined}
                options={enums}
                fieldNames={{ label: "desc", value: "value" }}
                placeholder="请选择"
                showSearch
                style={{ marginBottom: 8, display: "block" }}
                onChange={(value) => {
                  inputValue = value
                }}
                filterOption={(input, option) => {
                  return (
                    option?.desc?.toLowerCase().indexOf(input.toLowerCase()) >= 0 ||
                    option?.value?.toString().toLowerCase().indexOf(input.toLowerCase()) >= 0
                  )
                }}
              />
            ) : fieldType === "selectWithCustomInput" ? (
              <Select
                disabled={disabled}
                ref={searchInput}
                mode="tags"
                options={enums}
                fieldNames={{ label: "desc", value: "value" }}
                placeholder="请选择，支持手动输入筛选"
                showSearch
                style={{ marginBottom: 8, display: "block" }}
                onChange={(value) => {
                  inputValue = value
                }}
                filterOption={(input, option) => {
                  return (
                    option?.desc?.toLowerCase().indexOf(input.toLowerCase()) >= 0 ||
                    option?.value?.toString().toLowerCase().indexOf(input.toLowerCase()) >= 0
                  )
                }}
              />
            ) : fieldType === "treeSelect" ? (
              <TreeSelect
                disabled={disabled}
                ref={searchInput}
                treeData={processTreeData(enums)}
                multiple={multipleSelect}
                treeDefaultExpandAll
                fieldNames={{ label: "desc", value: "value", children: "children" }}
                placeholder="请选择"
                showSearch
                style={{ marginBottom: 8, display: "block" }}
                onChange={(value) => {
                  inputValue = value
                }}
                filterTreeNode={(input, node) => {
                  return (
                    node?.desc?.toLowerCase().indexOf(input.toLowerCase()) >= 0 ||
                    node?.value?.toString().toLowerCase().indexOf(input.toLowerCase()) >= 0
                  )
                }}
              />
            ) : (
              <Input
                disabled={disabled}
                ref={searchInput}
                placeholder="请输入"
                style={{ marginBottom: 8, display: "block" }}
                onPressEnter={(e) => {
                  // @ts-ignore
                  refresh(e?.target?.value || undefined)
                  close()
                }}
                onChange={(e) => {
                  inputValue = e?.target?.value || undefined
                }}
              />
            )}
          </Form.Item>
        </div>
      )
    },
    filterIcon: () => (
      <>
        {fieldType === "select" ||
        fieldType === "treeSelect" ||
        fieldType === "inputNumberGroup" ? (
          <FilterFilled
            style={{
              color: (
                searchParams instanceof Function
                  ? hasValue(searchParams()[dataIndex])
                  : hasValue(searchParams[dataIndex])
              )
                ? "#7F56D9"
                : "#99A0AE"
            }}
          />
        ) : (
          <i
            className="iconfont icon-sousuo1 text-[14px] font-[300]"
            style={{
              color: (
                searchParams instanceof Function
                  ? hasValue(searchParams()[dataIndex])
                  : hasValue(searchParams[dataIndex])
              )
                ? "#7F56D9"
                : "#99A0AE"
            }}
          />
        )}
      </>
    ),

    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select?.(), 100)
      }
    }
  }
}
