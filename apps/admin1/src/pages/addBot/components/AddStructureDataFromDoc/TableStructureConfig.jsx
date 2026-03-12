import { Form, Select, Table } from "antd"
import DynamicFieldSet from "../DynamicFieldSet"
import React from "react"

const EditableContext = React.createContext(null)

const EditableRow = ({ form, ...props }) => {
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  )
}

const EditableCell = ({ children, ...restProps }) => {
  return <td {...restProps}>{children}</td>
}
function TableStructureConfig({
  form,
  tableConfig,
  setTableIndexList,
  setRemovedCells,
  removedCells,
  sourceTag = []
}) {
  const components = {
    body: {
      row: (props) => <EditableRow {...props} form={form} />,
      cell: (props) => <EditableCell {...props} />
    }
  }

  const onChange = (field, value) => {
    setTableIndexList(([sheetIndex, headIndex, startLineIndex]) => {
      if (field === "sheetName") {
        setRemovedCells([])
        return [value, headIndex, startLineIndex]
      } else if (field === "head") {
        setRemovedCells([])
        return [sheetIndex, value, startLineIndex]
      } else if (field === "startLine") {
        return [sheetIndex, headIndex, value]
      }
    })
  }

  const onRemoveChange = (index) => {
    let originalIndex = index
    removedCells.forEach((deletedIndex) => {
      if (deletedIndex <= originalIndex) {
        originalIndex++
      }
    })
    setRemovedCells((prev) => {
      return [...prev, originalIndex].sort((a, b) => a - b)
    })
  }

  const defaultColumns = [
    {
      title: "数据表",
      dataIndex: "sheetName",
      width: "300px",
      render: (text, record) => {
        return (
          <Form.Item
            name={[record.key, "sheetName"]}
            initialValue={text}
            rules={[
              {
                required: true,
                message: `请选择数据表`
              }
            ]}
          >
            <Select
              placeholder="请选择"
              options={tableConfig.sheetList || []}
              fieldNames={{ label: "sheetName", value: "sheetCode" }}
              onChange={(value) => {
                onChange("sheetName", value)
              }}
            />
          </Form.Item>
        )
      }
    },
    {
      title: "表头",
      dataIndex: "head",
      width: "180px",
      render: (text, record) => {
        return (
          <Form.Item
            name={[record.key, "head"]}
            initialValue={text}
            rules={[
              {
                required: true,
                message: `请选择数据表`
              }
            ]}
          >
            <Select
              placeholder="请选择"
              options={tableConfig.headList || []}
              fieldNames={{ label: "headName", value: "headCode" }}
              onChange={(value) => {
                onChange("head", value)
              }}
            />
          </Form.Item>
        )
      }
    },
    {
      title: "数据起始行",
      width: "180px",
      dataIndex: "startLine",
      render: (text, record) => {
        return (
          <Form.Item
            name={[record.key, "startLine"]}
            initialValue={text}
            rules={[
              {
                required: true,
                message: `请选择数据起始行`
              }
            ]}
          >
            <Select
              placeholder="请选择数据起始行"
              options={tableConfig.startLineList || []}
              fieldNames={{ label: "startLineName", value: "startLineCode" }}
              onChange={(value) => {
                onChange("startLine", value)
              }}
            />
          </Form.Item>
        )
      }
    }
  ]

  const columns = defaultColumns.map((col) => {
    if (!col.editable) {
      return col
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        key: record.key,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        message: col.message,
        placeholder: col.placeholder,
        required: col.required
      })
    }
  })
  return (
    <div>
      <Form form={form}>
        <Table
          components={components}
          rowClassName={() => "editable-row"}
          bordered
          pagination={false}
          dataSource={tableConfig.dataSource}
          columns={columns}
        />
        <div className=" pr-3">
          <Form.Item name="strategies">
            <DynamicFieldSet
              isEdit={false}
              form={form}
              hiddenAddBtn={true}
              sourceTag={sourceTag}
              onRemoveChange={onRemoveChange}
            />
          </Form.Item>
        </div>
      </Form>
    </div>
  )
}

export default TableStructureConfig
