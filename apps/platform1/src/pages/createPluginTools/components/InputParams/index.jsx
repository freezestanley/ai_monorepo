import React, { useEffect, useState, forwardRef, useImperativeHandle } from "react"
import {
  Button,
  Checkbox,
  Col,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Switch,
  Table,
  Tooltip
} from "antd"
import {
  DeleteOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  CaretDownOutlined
} from "@ant-design/icons"
import Iconfont from "@/components/Icon"
import { fieldTypeOptions, inputMethodOptions } from "../../constants"
import { getRandomString } from "@/utils"
import ExpandableTextArea from "../ExpandableTextArea"
import styles from "./index.module.scss"

const EditableContext = React.createContext(null)

const getExpandedKeys = (data) => {
  let allKeys = []
  const fn = (list) => {
    if (!list || !list?.length) return
    list.forEach((v) => {
      const { children, rowId } = v
      allKeys.push(rowId)
      fn(children)
    })
  }
  fn(data)
  return allKeys
}

export const EditableRow = ({ form, disabled, ...props }) => {
  return (
    <Form form={form} component={false} disabled={disabled}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  )
}

export const EditableCell = ({ children, ...restProps }) => {
  return <td {...restProps}>{children}</td>
}

export const Title = ({ text, required = false, tip = "" }) => {
  return (
    <div>
      {text}
      {required && <span className="text-red-500 ml-1">*</span>}
      {tip && (
        <Tooltip title={tip}>
          <InfoCircleOutlined className="ml-1" />
        </Tooltip>
      )}
    </div>
  )
}

const changeChildren = (children, key) => {
  return children?.map((item) => {
    const rowKey = getRandomString()
    return {
      ...item,
      parentKey: key,
      rowId: rowKey,
      children: changeChildren(item.children, rowKey)
    }
  })
}

const InputParams = forwardRef(({ form, formData, toolType, disabled }, ref) => {
  const [dataSource, setDataSource] = useState([])
  const [count, setCount] = useState(2)
  const [_, forceUpdate] = useState({})
  const [expandedRowKeys, setExpandedRowKeys] = useState([])
  const isMcpType = toolType === "MCP"

  useImperativeHandle(ref, () => ({
    getValues: () => {
      return dataSource
    }
  }))

  useEffect(() => {
    if (formData) {
      const newFormData = [...formData].map((item) => {
        const key = `${Math.random()}`
        return {
          rowId: key,
          ...item,
          children: changeChildren(item.children, item.rowId ?? key)
        }
      })
      setDataSource(newFormData)
      setExpandedRowKeys(getExpandedKeys(newFormData))
    }
  }, [formData])

  const handleDelete = (key) => {
    const deleteNode = (nodes) => {
      return nodes.reduce((acc, node) => {
        if (node.rowId === key) {
          return acc // 删除该节点
        }
        const newNode = { ...node }
        if (node.children) {
          newNode.children = deleteNode(node.children)
          if (newNode.children.length === 0) {
            delete newNode.children // 如果子节点为空,删除children属性
          }
        }
        return [...acc, newNode]
      }, [])
    }
    const newData = deleteNode(dataSource)
    setDataSource(newData)
    // 更新expandedRowKeys
    const newExpandedRowKeys = expandedRowKeys.filter((rowId) => rowId !== key)
    setExpandedRowKeys(newExpandedRowKeys)
  }

  const handleAdd = () => {
    const newKey = getRandomString()
    const newData = {
      rowId: newKey,
      variableName: "",
      variableDesc: "",
      variableValueType: "",
      inputMethod: "",
      variableRequire: "",
      defaultValue: "",
      isOpen: true
    }
    setDataSource([...dataSource, newData])
    setExpandedRowKeys([...expandedRowKeys, newKey])
    setCount(count + 1)
  }

  const addChildNode = (record) => {
    let cloneData = [...dataSource]
    const fn = (list) => {
      if (!list || !list?.length) return
      list.forEach((v) => {
        const { children } = v
        if (v.rowId === record?.rowId) {
          const newKey = getRandomString()
          v.children = [
            ...(v.children || []),
            {
              rowId: newKey,
              variableName: "",
              variableDesc: "",
              variableValueType: "",
              inputMethod: "",
              variableRequire: "",
              defaultValue: "",
              isOpen: true,
              parentKey: record?.rowId
            }
          ]
          setExpandedRowKeys([...expandedRowKeys, newKey])
        }
        fn(children)
      })
    }
    fn(cloneData)
    setDataSource([...cloneData])
  }

  const changeDataByKey = (fieldValue, record) => {
    let cloneData = [...dataSource]
    const fn = (list) => {
      if (!list || !list?.length) return
      list.forEach((v) => {
        const { children } = v
        if (v.rowId === record.rowId) {
          const newKey = getRandomString()
          if (fieldValue === "json" || fieldValue === "array") {
            v.children = [
              {
                rowId: newKey,
                variableName: "",
                variableDesc: "",
                variableValueType: "",
                inputMethod: "",
                variableRequire: "",
                defaultValue: "",
                isOpen: true,
                parentKey: record?.rowId
              }
            ]
          } else {
            v.children = null
          }
          v.variableValueType = fieldValue
          setExpandedRowKeys([...expandedRowKeys, newKey])
        }
        fn(children)
      })
    }
    fn(cloneData)
    setDataSource([...cloneData])
  }

  const handleInputParamsTypeChange = (value, pathArray = [], record) => {
    console.log(value, pathArray)
    forceUpdate({})
    changeDataByKey(value, record)
  }

  const components = {
    body: {
      row: (props) => <EditableRow {...props} form={form} disabled={disabled} />,
      cell: (props) => <EditableCell {...props} />
    }
  }

  const defaultColumns = [
    {
      title: <Title text="参数名称" required={true} tip="参数名称不能为空且不能重复" />,
      message: "参数名称不能为空且不能重复",
      placeholder: "请输入参数名称",
      dataIndex: "variableName",
      width: "200px",
      render: (text, record) => {
        return (
          <Form.Item
            name={[record.rowId, "variableName"]}
            initialValue={text}
            rules={[
              {
                required: true,
                message: `请输入参数名称`
              }
            ]}
          >
            <Input placeholder="请输入参数名称" disabled={disabled || (isMcpType && !!text)} />
          </Form.Item>
        )
      }
    },
    {
      title: <Title text="参数描述" required={true} tip="参数描述不能为空" />,
      message: "参数描述不能为空",
      placeholder: "请输入参数描述",
      dataIndex: "variableDesc",
      render: (text, record) => {
        return (
          <Form.Item
            name={[record.rowId, "variableDesc"]}
            initialValue={text}
            rules={[
              {
                required: true,
                message: `请输入参数描述`
              }
            ]}
          >
            <Input placeholder="请输入参数描述" />
          </Form.Item>
        )
      }
    },
    {
      title: <Title text="参数类型" required={true} tip="参数类型不能为空" />,
      dataIndex: "variableValueType",
      width: "173px",
      render: (text, record) => {
        return (
          <Form.Item
            name={[record.rowId, "variableValueType"]}
            initialValue={text || "string"}
            rules={[
              {
                required: true,
                message: "参数类型不能为空"
              }
            ]}
          >
            <Select
              placeholder="请输入请求方法"
              options={fieldTypeOptions}
              onChange={(value) => {
                handleInputParamsTypeChange(value, [record.rowId, "variableValueType"], record)
              }}
            />
          </Form.Item>
        )
      }
    },
    {
      title: <Title text="传入方法" required={true} tip="传入方法不能为空" />,
      dataIndex: "inputMethod",
      width: "173px",
      render: (text, record) => {
        return (
          <Form.Item
            name={[record.rowId, "inputMethod"]}
            initialValue={text || "Body"}
            rules={[
              {
                required: true,
                message: "传入方法不能为空"
              }
            ]}
          >
            <Select placeholder="请输入传入方法" options={inputMethodOptions} />
          </Form.Item>
        )
      }
    },
    {
      title: "是否必填",
      dataIndex: "variableRequire",
      width: "90px",
      render: (text, record) => {
        return (
          <Form.Item
            name={[record.rowId, "variableRequire"]}
            valuePropName="checked"
            initialValue={text === false ? false : true}
          >
            <Checkbox defaultChecked={text} />
          </Form.Item>
        )
      }
    },
    {
      title: "默认值",
      dataIndex: "defaultValue",
      width: "120px",
      render: (text, record) => {
        const variableValueType = form.getFieldValue([record.rowId, "variableValueType"])
        const defaultValue =
          text || variableValueType === "json" ? "{}" : variableValueType === "array" ? "[]" : ""
        return (
          <Form.Item
            name={[record.rowId, "defaultValue"]}
            initialValue={text || defaultValue}
            rules={[
              {
                required: false,
                message: `请输入默认值`
              }
            ]}
          >
            {["json", "array"].includes(variableValueType) ? (
              <ExpandableTextArea
                title="默认值"
                type={variableValueType}
                placeholder={`请输入默认值,${variableValueType}格式`}
              />
            ) : (
              <Input placeholder="请输入默认值" />
            )}
          </Form.Item>
        )
      }
    },
    {
      title: <Title text="开启" tip="关闭后，将向工具订阅者置灰展示该参数" />,
      dataIndex: "isOpen",
      width: "90px",
      render: (text, record) => {
        return (
          <Form.Item name={[record.rowId, "isOpen"]} initialValue={text}>
            <Switch defaultChecked={text} />
          </Form.Item>
        )
      }
    },
    {
      title: "操作",
      width: "90px",
      dataIndex: "operation",
      render: (_, record) => {
        return (
          <>
            {record.variableValueType === "json" || record.variableValueType === "array" ? (
              <Tooltip title={"添加子节点"}>
                <Button
                  style={{ marginRight: "10px" }}
                  type="link"
                  onClick={() => {
                    addChildNode(record)
                  }}
                  disabled={record?.children?.length >= 1 && record?.variableValueType === "array"}
                  icon={<Iconfont style={{ fontSize: "18px" }} type={"icon-zijiedian-"} />}
                ></Button>
              </Tooltip>
            ) : null}
            {dataSource.length >= 1 ? (
              <Popconfirm
                title="你确定要删除吗?"
                onConfirm={() => handleDelete(record.rowId)}
                disabled={disabled}
              >
                <a className=" cursor-pointer">
                  <DeleteOutlined className={disabled ? "cursor-not-allowed" : ""} />
                </a>
              </Popconfirm>
            ) : null}
          </>
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
        rowId: record.rowId,
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
      <h4 className="text-xl font-bold mb-3">配置输入参数</h4>
      <Table
        components={components}
        rowClassName={() => "editable-row"}
        bordered
        pagination={false}
        dataSource={dataSource}
        columns={columns}
        rowKey="rowId"
        expandable={{
          defaultExpandAllRows: true,
          showExpandColumn: true,
          expandedRowKeys,
          onExpandedRowsChange: (expandedRows) => setExpandedRowKeys([...expandedRows]),
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
      />
      <Col span={24}>
        <Button
          icon={<PlusOutlined />}
          className=" mt-2 mb-8"
          onClick={handleAdd}
          disabled={disabled}
        >
          新增参数
        </Button>
      </Col>
    </div>
  )
})

export default InputParams
