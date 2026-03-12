// @ts-nocheck
/*
 * @Author: Dyton
 * @Date: 2024-04-19 15:18:00
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-04-24 18:12:11
 * @FilePath: /za-aigc-platform-admin-static/src/components/TableObjectPro/index.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import { Table, Form, Input, Button, Select, Checkbox, Tooltip } from "antd"
import styles from "./index.module.scss"
import { useEffect, useState } from "react"
import { paramsTypesOptions, arrayTypOptions } from "./constants"
import { Title } from "@/pages/createPluginTools/components/InputParams"
import { outputFieldTypeOptions } from "@/pages/createPluginTools/constants"
import { uuidv4 } from "@antv/xflow"
import { PlusOutlined, CaretDownOutlined } from "@ant-design/icons"
import Iconfont from "@/components/Icon"
const { Item } = Form

/**
 * @description: 可编辑Table  针对"配置输出参数"定制逻辑
 * @param {*} onChangeData 监听数据变化
 * @param {*} dataSource 数结构数据
 * @param {*} editabled 是否可编辑
 * @param {*} submitKey 提交state 用于触发form提交
 * @param {*} onSubmit 提交回调 返回
 * treeData 树形数据
 * formData 表单数据
 * @return {*}
 */

/**
 * @description: 调用示例
 * const [submitKey, setSubmitKey] = useState()
 * ...
 * 
      <TableObjectPro
        onChangeData={(treeData) => {}}
        onSubmit={(treeData, formData) => {
          console.log(treeData)
        }}
        editabled={true}
        submitKey={submitKey}
        dataSource={[
          {
            variableName: "",
            variableDesc: "",
            variableRequire: true,
            variableValueType: "string",
            key: "1-2",
            parentKey: "1"
          }
        ]}
      />
       <Button onClick={() => setSubmitKey(Math.random())}></Button>
 * @return {*}
 */

export const TableObjectPro = ({
  onChangeData = (treeData) => {},
  dataSource = [],
  editabled = true,
  submitKey = null,
  onSubmit = (treeData, formData) => {},
  form,
  toolType
}) => {
  const [data, setData] = useState([])
  const [expandedRowKeys, setExpandedRowKeys] = useState([])
  const isMcpType = toolType === "MCP"

  useEffect(() => {
    setData(dataSource)
    setExpandedRowKeys(getExpandedKeys(dataSource))
  }, [dataSource])
  // 添加一行
  const handlerAdd = () => {
    const clone = [...data]
    const newKey = uuidv4()
    const newData = {
      variableName: "",
      variableDesc: "",
      variableRequire: true,
      variableValueType: "string",
      key: newKey,
      parentKey: null
    }
    clone.push(newData)
    setExpandedRowKeys([...expandedRowKeys, newKey])
    setData([...clone])
  }

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
        if (v.key === activeKey) {
          const newKey = uuidv4()
          if (fieldName === "variableValueType") {
            if (fieldValue === "json" || fieldValue === "array") {
              v.children = [
                {
                  // variableName: `来自${activeKey}的新增`,
                  variableName: ``,
                  variableDesc: "",
                  variableRequire: true,
                  variableValueType: "string",
                  key: newKey,
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
      activeKey: record?.key,
      fieldName,
      fieldValue: value
    }
    changeDataByKey(activeData)
  }
  /**
   * @description: 自定义渲染
   * @params {*} value
   * @params {*} record
   * @params {*} key
   * @return {*}
   */
  const CustomCell = ({ value, record, fieldName }) => {
    if (!editabled) return value
    switch (fieldName) {
      case "variableName":
        return (
          <Item
            name={fieldName + record?.key}
            rules={[{ required: true, message: "请输入参数名称" }]}
            initialValue={value}
          >
            <Input
              placeholder="请输入参数名称，确保名称含义清晰且符合平台规范"
              onChange={(e) => onCustomCellChange(e.target.value, record, fieldName)}
              disabled={!editabled || (isMcpType && !!value)}
            />
          </Item>
        )
      case "variableDesc":
        return (
          <Item
            name={fieldName + record?.key}
            rules={[{ required: true, message: "请输入参数描述" }]}
            initialValue={value}
          >
            <Input
              placeholder="请输入参数描述"
              onChange={(e) => onCustomCellChange(e.target.value, record, fieldName)}
            />
          </Item>
        )
      case "variableRequire":
        return (
          <Item name={fieldName + record?.key}>
            <Checkbox
              name={record?.key}
              defaultChecked={value}
              onChange={(e) => onCustomCellChange(e.target.checked, record, fieldName)}
            />
          </Item>
        )
      case "variableValueType":
        return (
          <Item name={fieldName + record?.key}>
            <Select
              onChange={(e) => {
                onCustomCellChange(e, record, fieldName)
              }}
              options={outputFieldTypeOptions}
              defaultValue={value || outputFieldTypeOptions?.[0]?.value}
            />
          </Item>
        )
      default:
        return (
          <Item name={fieldName + record?.key}>
            <Input
              defaultValue={value}
              placeholder="请输入"
              onChange={(e) => onCustomCellChange(e.target.value, record, fieldName)}
            />
          </Item>
        )
    }
  }

  /**
   * @description: 添加子节点
   * @param {*} record
   * @return {*}
   */
  const addChildNode = (record) => {
    let cloneData = [...data]
    const fn = (list) => {
      if (!list || !list?.length) return
      list.forEach((v) => {
        const { children } = v
        if (v.key === record?.key) {
          const newKey = uuidv4()
          v.children = [
            ...(v.children || []),
            {
              variableName: ``,
              variableDesc: "",
              variableRequire: true,
              variableValueType: "string",
              key: newKey,
              parentKey: record?.key
            }
          ]
          setExpandedRowKeys([...expandedRowKeys, newKey])
        }
        fn(children)
      })
    }
    fn(cloneData)
    setData([...cloneData])
  }
  /**
   * @description: 删除子节点
   * @param {*} record
   * @return {*}
   */
  const handlerDelNode = (record) => {
    const delKey = record?.key

    const deleteNode = (nodes) => {
      return nodes.reduce((acc, node) => {
        if (node.key === delKey) {
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

    const newData = deleteNode(data)
    setData(newData)

    // 更新expandedRowKeys
    const newExpandedRowKeys = expandedRowKeys.filter((key) => key !== delKey)
    setExpandedRowKeys(newExpandedRowKeys)
  }

  /**
   * @description: 自定义曹组
   * @param {*} value
   * @param {*} record
   * @return {*}
   */
  const Opration = (value, record) => {
    const variableValueType = record?.variableValueType
    return (
      <>
        {variableValueType === "json" || variableValueType === "array" ? (
          <Tooltip title={"添加子节点"}>
            <Button
              style={{ marginRight: "10px" }}
              type="link"
              onClick={() => {
                addChildNode(record)
              }}
              icon={<Iconfont style={{ fontSize: "18px" }} type={"icon-zijiedian-"} />}
              disabled={!editabled}
            ></Button>
          </Tooltip>
        ) : null}
        <Tooltip title={"删除"}>
          <Button
            type="link"
            onClick={() => {
              handlerDelNode(record)
            }}
            icon={
              <Iconfont
                style={{
                  fontSize: "18px",
                  color: "#666"
                }}
                type={"icon-shanchu"}
              />
            }
            disabled={!editabled}
          ></Button>
        </Tooltip>
      </>
    )
  }

  const columns = [
    {
      title: <Title text="参数名称" required={true} tip="参数名称不能为空且不能重复" />,
      dataIndex: "variableName",
      render: (value, record) => CustomCell({ value, record, fieldName: "variableName" })
    },
    {
      title: <Title text="参数描述" required={true} tip="参数描述不能为空" />,
      dataIndex: "variableDesc",
      render: (value, record) => CustomCell({ value, record, fieldName: "variableDesc" })
    },

    {
      title: <Title text="参数类型" required={true} tip="参数类型必选" />,
      dataIndex: "variableValueType",
      width: 150,
      render: (value, record) => CustomCell({ value, record, fieldName: "variableValueType" })
    },
    {
      title: "是否必填",
      dataIndex: "variableRequire",
      width: 100,
      align: "center",
      render: (value, record) => CustomCell({ value, record, fieldName: "variableRequire" })
    },
    {
      title: "操作",
      dataIndex: "action",
      width: 110,
      render: Opration
    }
  ]

  /**
   * @description: 获取全部展开
   * @return {*}
   */
  const getExpandedKeys = (data) => {
    let allKeys = []
    const fn = (list) => {
      if (!list || !list?.length) return
      list.forEach((v) => {
        const { children, key } = v
        allKeys.push(key)
        fn(children)
      })
    }
    fn(data)
    return allKeys
  }

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
    console.log("开始检测^")
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
      <Form form={form} disabled={!editabled}>
        <Table
          columns={columns}
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
      <Button
        onClick={handlerAdd}
        className={styles["add-btn"]}
        icon={<PlusOutlined />}
        disabled={!editabled}
      >
        新增参数
      </Button>
    </div>
  )
}
