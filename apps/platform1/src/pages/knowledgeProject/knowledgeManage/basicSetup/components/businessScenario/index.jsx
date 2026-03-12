// @ts-nocheck
import { useState, useCallback, useEffect } from "react"
import { useLocation } from "react-router-dom"
import queryString from "query-string"
import { Button, Table, Form, Input, message } from "antd"
import { cloneDeep } from "lodash"
import { v4 as uuidv4 } from "uuid"
import Iconfont from "@/components/Icon"
import { useFetchListByType, useFetchAddKnowledgeConfigApi } from "@/api/knowledgeManage"

const addPrefix = "add_key_"

const getAddTreeData = (tree) => {
  return tree?.map(({ id, parentId, childKnowledgeConfigs, ...item }, index) => ({
    ...item,
    priority: index,
    id: id?.startsWith(addPrefix) ? undefined : id,
    parentId: parentId?.startsWith(addPrefix) ? undefined : parentId,
    childKnowledgeConfigs: getAddTreeData(childKnowledgeConfigs)
  }))
}

const tableData = { name: "" }

const EditableCell = ({ editing, dataIndex, title, children, ...restProps }) => {
  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          rules={[
            {
              required: true,
              message: `请输入${title}`
            }
          ]}
        >
          <Input placeholder={`请输入${title}`} />
        </Form.Item>
      ) : (
        children
      )}
    </td>
  )
}

const expandedRowRender = (record, getMergedColumns, isEditing, editingKey, save, cancel, edit) => {
  const columns = [
    {
      title: "业务场景名称",
      dataIndex: "name",
      editable: true
    },
    {
      title: "操作",
      dataIndex: "action",
      fixed: "right",
      width: 300,
      render: (_, records) => {
        const editable = isEditing(records)
        return editable ? (
          <>
            <Button
              type="link"
              onClick={() => save(record.id, records.id)}
              style={{ paddingLeft: 0, paddingRight: 0 }}
            >
              保存
            </Button>
            <Button type="link" onClick={() => cancel(record.id, records.id)}>
              取消
            </Button>
          </>
        ) : (
          <Button
            type="link"
            disabled={editingKey !== ""}
            onClick={() => edit(records)}
            style={{ paddingLeft: 0 }}
          >
            编辑
          </Button>
        )
      }
    }
  ]

  return (
    <Table
      rowKey={"id"}
      columns={getMergedColumns(columns)}
      components={{
        body: {
          cell: EditableCell
        }
      }}
      dataSource={record.childKnowledgeConfigs}
      pagination={false}
    />
  )
}

const BusinessScenario = () => {
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search) ?? {}
  const { botNo } = queryParams
  const [form] = Form.useForm()
  const [data, setData] = useState([{}])
  const [editingKey, setEditingKey] = useState("")
  const [expandedRowKeys, setExpandedRowKeys] = useState([])
  const { mutate: addKnowledgeConfig } = useFetchAddKnowledgeConfigApi()

  // 业务场景
  const {
    data: listByParentAndType,
    isLoading: listLoading,
    refetch: refetchList
  } = useFetchListByType({
    type: "BUSINESS_SCENE",
    botNo
  })

  useEffect(() => {
    setData([...(listByParentAndType || [])])
  }, [listByParentAndType])

  const isEditing = useCallback((record) => record.id === editingKey, [editingKey])

  const add = useCallback(() => {
    const key = addPrefix + uuidv4()
    form.setFieldsValue(tableData)
    setEditingKey(key)
    setData((preState) => [
      ...preState,
      {
        id: key,
        deep: 1,
        priority: 0,
        type: "BUSINESS_SCENE",
        parentType: "-1",
        parentId: "-1"
      }
    ])
  }, [form])

  const addChildren = useCallback(
    (key) => {
      const k = addPrefix + uuidv4()
      form.setFieldsValue(tableData)
      setEditingKey(k)
      setData((preState) => {
        const index = preState.findIndex((item) => item.id === key)
        preState[index].childKnowledgeConfigs = preState[index]?.childKnowledgeConfigs || []
        preState[index].childKnowledgeConfigs.push({
          id: k,
          deep: 2,
          priority: 0,
          type: "BUSINESS_SCENE",
          parentType: preState[index]?.type,
          parentId: preState[index]?.id,
          childIntentionLevelVOS: []
        })
        return cloneDeep(preState)
      })
    },
    [form]
  )

  const edit = useCallback(
    (record) => {
      form.setFieldsValue({ ...tableData, ...record })
      setEditingKey(record.id)
    },
    [form]
  )

  const deleteData = useCallback((key) => {
    setData((preState) => preState.filter((item) => item.id !== key))
  }, [])

  const cancel = useCallback(
    (key) => {
      const keyData = data.find((item) => item.id === key)
      if (!keyData.name) {
        deleteData(key)
      }
      setEditingKey("")
    },
    [data, deleteData]
  )

  const cancelChiildren = useCallback(
    (parentId, id) => {
      const parentData = data.find((item) => item.id === parentId)
      const index = data.findIndex((item) => item.id === parentId)
      const keyData = parentData.childKnowledgeConfigs.find((item) => item.id === id)
      if (!keyData.name) {
        setData((preState) => {
          preState[index].childKnowledgeConfigs = parentData.childKnowledgeConfigs.filter(
            (item) => item.id !== id
          )
          return [...preState]
        })
      }
      setEditingKey("")
    },
    [data]
  )

  const save = useCallback(
    async (key) => {
      const row = await form.validateFields()
      const newData = [...data]
      const index = newData.findIndex((item) => key === item.id)
      if (index > -1) {
        const item = newData[index]
        newData.splice(index, 1, {
          ...item,
          ...row
        })
        setData(newData)
        setEditingKey("")
      } else {
        newData.push(row)
        setData(newData)
        setEditingKey("")
      }
    },
    [data, form]
  )

  const saveChildren = useCallback(
    async (parentId, id) => {
      const row = await form.validateFields()
      const parentData = data.find((item) => item.id === parentId)
      const index = parentData.childKnowledgeConfigs?.findIndex((item) => item.id === id)
      if (index > -1) {
        const item = parentData.childKnowledgeConfigs[index]
        parentData.childKnowledgeConfigs.splice(index, 1, {
          ...item,
          ...row
        })
      } else {
        parentData.childKnowledgeConfigs.push(row)
      }
      setData(cloneDeep(data))
      setEditingKey("")
    },
    [data, form]
  )

  const onSubmit = useCallback(() => {
    if (editingKey !== "") {
      message.warning("请先确定当前编辑内容！")
      return
    }
    addKnowledgeConfig(
      { botNo, data: getAddTreeData(data) },
      {
        onSuccess: (res) => {
          if (res?.success) {
            message.success("操作成功！")
            refetchList()
          }
        }
      }
    )
  }, [addKnowledgeConfig, botNo, data, editingKey, refetchList])

  const columns = [
    {
      title: "业务场景名称",
      dataIndex: "name",
      editable: true
    },
    {
      title: "操作",
      dataIndex: "action",
      fixed: "right",
      width: 300,
      render: (_, record) => {
        const editable = isEditing(record)
        return editable ? (
          <>
            <Button
              type="link"
              onClick={() => save(record.id)}
              style={{ paddingLeft: 0, paddingRight: 0 }}
            >
              保存
            </Button>
            <Button type="link" onClick={() => cancel(record.id)}>
              取消
            </Button>
          </>
        ) : (
          <>
            <Button
              type="link"
              disabled={editingKey !== ""}
              onClick={() => edit(record)}
              style={{ paddingLeft: 0, paddingRight: 0 }}
            >
              编辑
            </Button>
            <Button
              type="link"
              disabled={editingKey !== ""}
              onClick={() => {
                addChildren(record.id)
                setExpandedRowKeys((preState) => [...new Set([...preState, record.id])])
              }}
            >
              新增子场景
            </Button>
          </>
        )
      }
    }
  ]

  const getMergedColumns = (column) => {
    return column.map((col) => {
      if (!col.editable) {
        return col
      }
      return {
        ...col,
        onCell: (record) => ({
          record,
          dataIndex: col.dataIndex,
          title: col.title,
          editing: isEditing(record)
        })
      }
    })
  }

  return (
    <>
      <div className="text-right" style={{ marginBottom: 10 }}>
        <Button type="primary" onClick={onSubmit}>
          保存
        </Button>
      </div>
      <Form form={form} component={false}>
        <Table
          rowKey={"id"}
          loading={listLoading}
          columns={getMergedColumns(columns)}
          components={{
            body: {
              cell: EditableCell
            }
          }}
          expandable={{
            expandedRowRender: (record) =>
              expandedRowRender(
                record,
                getMergedColumns,
                isEditing,
                editingKey,
                saveChildren,
                cancelChiildren,
                edit
              ),
            expandedRowKeys,
            onExpandedRowsChange: (expandedRows) => setExpandedRowKeys(expandedRows)
          }}
          dataSource={data}
          pagination={false}
          scroll={{ y: "calc(100vh - 270px)" }}
        />
        <Button
          type="link"
          icon={<Iconfont type="icon-tianjia" />}
          onClick={add}
          disabled={editingKey !== ""}
          style={{ marginTop: 10 }}
        >
          新增
        </Button>
      </Form>
    </>
  )
}

export default BusinessScenario
