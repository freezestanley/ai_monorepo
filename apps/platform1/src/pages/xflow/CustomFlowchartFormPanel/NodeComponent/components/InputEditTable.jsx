import { Table, Form, Input, Select, Checkbox } from "antd"
import styles from "@/components/TableObjectPro/index.module.scss"
import { useEffect, useState } from "react"
import { paramsTypesOptions, arrayTypOptions } from "@/components/TableObjectPro/constants"
import { uuidv4 } from "@antv/xflow"
import { CaretDownOutlined } from "@ant-design/icons"
import GlobalVariableSelect from "@/components/GlobalVariableSelect"
import OverflowTooltip from "@/components/overflowTooltip"
const { Item } = Form
const arrayTypes = arrayTypOptions.map((v) => v.value)

export const InputEditTable = ({
  onChangeData = (treeData) => {},
  dataSource = [],
  submitKey = null,
  customColumns = [],
  onSubmit = (treeData, formData) => {},
  disabled = false
}) => {
  const [data, setData] = useState([])
  const [form] = Form.useForm()
  const [expandedRowKeys, setExpandedRowKeys] = useState([])
  useEffect(() => {
    setData([...dataSource])
  }, [dataSource])
  /**
   * @description: 通过数据变更，更新View
   * @params {*} activeKey
   * @params {*} fieldName
   * @params {*} fieldValue
   * @return {*}
   */
  const changeDataByKey = ({ activeKey, fieldName, fieldValue }) => {
    let cloneData = [...data]
    const fn = (list) => {
      if (!list || !list?.length) return
      list.forEach((v) => {
        const { children } = v
        if (v.rowId === activeKey) {
          const newKey = uuidv4()
          if (fieldName === "variableValueType") {
            if (fieldValue.includes("Object") || fieldValue === "Array") {
              const variableDisabled =
                !fieldValue.includes("Object") && fieldValue !== "Array<Object>"
              v.children = [
                {
                  // variableName: `来自${activeKey}的新增`,
                  variableName: variableDisabled ? "[Array Item]" : ``,
                  variableDisabled,
                  variableDesc: "",
                  variableRequire: true,
                  variableValueType: fieldValue.includes("Object") ? "String" : "Array<String>",
                  rowId: newKey,
                  parentKey: activeKey
                }
              ]
            } else {
              v.children = null
            }
          }
          v[fieldName] = fieldValue
          setExpandedRowKeys([...expandedRowKeys, newKey])
        }
        fn(children)
      })
    }
    fn(cloneData)
    setData([...cloneData])
  }
  /**
   * @description: 自定义组件数据同步
   * @params {*} value
   * @params {*} record
   * @params {*} fieldName
   * @return {*}
   */
  const onCustomCellChange = (value, record, fieldName) => {
    const activeData = {
      activeKey: record?.rowId,
      fieldName,
      fieldValue: value
    }
    changeDataByKey(activeData)
  }
  /**
   * @description: 自定义渲染
   * @params {*} value
   * @params {*} record
   * @params {*} rowId
   * @return {*}
   */
  const CustomCell = ({ value, record, fieldName, editable }) => {
    if (!editable) {
      return <OverflowTooltip text={value} width={140} />
    }
    const options = arrayTypes.includes(value) ? arrayTypOptions : paramsTypesOptions
    switch (fieldName) {
      case "variableName":
        return (
          <Item
            name={fieldName + record?.rowId}
            rules={[{ required: true, message: "请输入参数名称" }]}
          >
            <Input
              placeholder="请输入参数名称，确保名称含义清晰且符合平台规范"
              defaultValue={value}
              disabled={record?.variableDisabled}
              onChange={(e) => onCustomCellChange(e.target.value, record, fieldName)}
            />
          </Item>
        )
      case "variableDesc":
        return (
          <Item name={fieldName + record?.rowId}>
            <Input
              defaultValue={value}
              placeholder="请输入参数描述"
              onChange={(e) => onCustomCellChange(e.target.value, record, fieldName)}
            />
          </Item>
        )
      case "variableRequire":
        return (
          <Item name={fieldName + record?.rowId}>
            <Checkbox
              name={record?.rowId}
              defaultChecked={value}
              onChange={(e) => onCustomCellChange(e.target.checked, record, fieldName)}
            />
          </Item>
        )
      case "variableValueType":
        return (
          <Item name={fieldName + record?.rowId}>
            <Select
              onChange={(e) => {
                onCustomCellChange(e, record, fieldName)
              }}
              options={options}
              defaultValue={options?.[0]?.value}
            />
          </Item>
        )
      default:
        return (
          <GlobalVariableSelect
            initialValue={value}
            span={false}
            label={""}
            isTag={true}
            formName={fieldName + record?.rowId}
            multiple={false}
            onChange={(v) => {
              onCustomCellChange(v, record, fieldName)
            }}
            style={{
              maxWidth: "200px"
            }}
          />
        )
    }
  }

  const ColumnsTitle = ({ title, required = false }) => {
    return (
      <>
        {title} {required && <span className={styles["required-icon"]}>*</span>}
      </>
    )
  }
  const columns = [
    {
      title: <ColumnsTitle title="参数" />,
      dataIndex: "variableName",
      width: "80px",
      render: (value, record) =>
        CustomCell({
          value,
          record,
          fieldName: "variableName",
          editable: false
        })
    },
    {
      title: "参数描述",
      dataIndex: "description",
      render: (value, record) =>
        CustomCell({
          value,
          record,
          fieldName: "description",
          editable: false
        })
    },

    {
      title: <ColumnsTitle title="类型" />,
      dataIndex: "variableValueType",
      width: "80px",
      render: (value, record) =>
        CustomCell({
          value,
          record,
          fieldName: "variableValueType",
          editable: false
        })
    },
    {
      title: <ColumnsTitle title="参数值" />,
      dataIndex: "inputParams",
      width: "120px",
      render: (value, record) =>
        CustomCell({
          value,
          record,
          fieldName: "inputParams",
          editable: true
        })
    }
  ]

  /**
   * @description: 获取全部展开
   * @return {*}
   */
  const getExpandedKeys = () => {
    let cloneData = data
    let allKeys = []
    const fn = (list) => {
      if (!list || !list?.length) return
      list.forEach((v) => {
        const { children, rowId } = v
        allKeys.push(rowId)
        fn(children)
      })
    }
    fn(cloneData)
    return allKeys
  }
  useEffect(() => {
    setExpandedRowKeys(getExpandedKeys())
  }, [])
  const onExpandedRowsChange = (expandedRows) => {
    setExpandedRowKeys([...expandedRows])
  }
  /**
   * @description: 监听数据变化，通过onChangeData返回给父组件
   * @return {*}
   */
  useEffect(() => {
    console.log("updateTableData=>", data)
    onChangeData && onChangeData([...data])
  }, [data])

  const onSubmitCapture = async (e) => {
    await form.validateFields()
    onSubmit && onSubmit([...data], form.getFieldsValue())
  }
  /**
   * @description: 监听提交
   * @return {*}
   */
  useEffect(() => {
    if (submitKey) onSubmitCapture()
  }, [submitKey])
  return (
    <div className={styles["tabel-object-pro"]}>
      <Form form={form} disabled={disabled}>
        <Table
          columns={customColumns.length ? customColumns : columns}
          expandable={{
            defaultExpandAllRows: true,
            showExpandColumn: true,
            expandedRowKeys,
            onExpandedRowsChange,
            expandIcon: ({ expanded, onExpand, record }) => {
              return record?.children?.length ? (
                expanded ? (
                  <CaretDownOutlined
                    className={styles["expanded-icon"]}
                    onClick={(e) => onExpand(record, e)}
                  />
                ) : (
                  <CaretDownOutlined
                    className={`${styles["expanded-icon"]} ${styles["expanded-cre"]}`}
                    onClick={(e) => onExpand(record, e)}
                  />
                )
              ) : null
            }
          }}
          dataSource={[...data]}
          pagination={false}
        />
      </Form>
    </div>
  )
}

export default InputEditTable
