import React, { useEffect, useState } from "react"
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Pagination,
  TreeSelect,
  message,
  Row,
  Col,
  Tooltip
} from "antd"
import { DeleteOutlined } from "@ant-design/icons"
import {
  useDeleteAuthRole,
  useFetchAuthPermissionGroupList,
  useFetchAuthResourceListBotResource,
  useFetchAuthRoleDetail,
  useGetListAdminRoles,
  useFetchAuthRolePage,
  useGetMenuTree,
  useSaveAuthRole,
  useGetDictionaryRoleType,
  useFetchAuthRoleList
} from "@/api/permission"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"
// import { ROLE_TYPE } from "@/constants/queryKeys"
const ROLE_TYPE = {
  SUPER_ADMIN: "SUPER_ADMIN", //超级管理员
  GENERAL_ADMIN: "GENERAL_ADMIN", //普通管理员
  COMMON: "COMMON" //普通角色
}
import { debounce, uniq, uniqBy } from "lodash"
import { useFetchNamespaceList } from "@/api/bot"
import { formatRoleNames } from "@/api/tools"

function RoleManageMent() {
  const [visible, setVisible] = useState(false)
  const [isSuperAdminRole, setIsSuperAdminRole] = useState(false)
  const [isParentSuperAdmin, setIsParentSuperAdmin] = useState(false)
  const [form] = Form.useForm()
  const [filterForm] = Form.useForm()
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [params, setParams] = useState({})
  const [query, setQuery] = useState({})
  const [sortAndFilterState, setSortAndFilterState] = useState({
    // permissionGroupNo: "",
    roleType: "",
    botNo: "",
    roleName: ""
  })
  // 1. 如果当前角色是超管，则下拉列表不传adminRoleNo字段
  // 2. 如果当前角色不是超管，则下拉列表的adminRoleNo就是所属管理员的角色编号
  const [botParams, setBotParams] = useState({})
  const queryClient = useQueryClient()
  const handleDelete = (record) => {
    // 二次确认
    Modal.confirm({
      title: "确认删除该角色吗？",
      icon: <DeleteOutlined />,
      content: "删除后不可恢复",
      okText: "确认",
      cancelText: "取消",
      onOk() {
        delRole(
          {
            roleNo: record.roleNo
          },
          {
            onSuccess: (e) => {
              if (e.success) {
                message.success("删除成功")
                queryClient.invalidateQueries([QUERY_KEYS.AUTH_ROLE_PAGE, params])
              } else {
                message.error(e.message)
              }
            }
          }
        )
      }
    })
  }

  const { data: nameSpaceList = [] } = useFetchNamespaceList()

  const { data: { list: tableList = [], totalCount } = {} } = useFetchAuthRolePage({
    pageNum: pagination.current,
    pageSize: pagination.pageSize,
    ...sortAndFilterState,
    ...query
  })

  const { data: botList = [] } = useFetchAuthResourceListBotResource(botParams)
  const { data: allBotList = [] } = useFetchAuthResourceListBotResource({})
  const { data: roleList } = useFetchAuthRoleList()
  const { data: groupList = [] } = useFetchAuthPermissionGroupList()
  const { data: currentRole } = useFetchAuthRoleDetail(params)
  const { mutate: saveAuthRoleMutation } = useSaveAuthRole()
  const { mutate: delRole } = useDeleteAuthRole()
  const { data: treeData = [] } = useGetMenuTree()
  const { data: adminRoles = [] } = useGetListAdminRoles()
  const { data: dictionaryRoleTypeList } = useGetDictionaryRoleType()

  /**
   * @description: 获取平级tree
   * @return {*}
   */
  const getTreeSimple = () => {
    const list = []
    const loop = (arr = []) => {
      if (!arr?.length) return
      arr.forEach((v) => {
        list.push(v)
        loop(v.child)
      })
    }
    loop(treeData) //Tree打平
    return list
  }

  /**
   * @description: 回显过滤
   * @param {*} menuOrButtons
   * @return {*}
   */
  const getIntiTree = (menuOrButtons = []) => {
    let filterKeys = []
    const tree = getTreeSimple()
    menuOrButtons.forEach((code) => {
      const match = tree.find((v) => v.resourceNo === code)
      if (match?.child?.length) {
        filterKeys.push(match.resourceNo)
      }
    })
    return menuOrButtons.filter((v) => !filterKeys.includes(v))
  }

  useEffect(() => {
    if (currentRole && visible) {
      console.log(currentRole)
      const bots = currentRole?.botDataResources ?? []
      const menuOrButtons = getIntiTree(currentRole?.menuOrButtons?.map((v) => v.resourceNo) ?? [])
      form.setFieldsValue({
        ...currentRole,
        // 根据你的数据结构为robot字段设置值，如果是一个数组，直接设置即可
        botDataResources: bots?.length ? bots.map((item) => item.resourceNo) : [],
        menuOrButtons
      })
      setBotParamsCallback(currentRole?.parentNo)
    }
  }, [currentRole, form, visible])

  const handleQuery = debounce(() => {
    filterForm.validateFields().then((values) => {
      setPagination({
        current: 1,
        pageSize: pagination.pageSize
      })
      setQuery(values)
    })
  }, 1000)

  const handleSortAndFilterChange = (pagination, filters, sorter) => {
    console.log(filters)
    setSortAndFilterState({
      // permissionGroupNo: (filters?.permissionGroupName || []).join(","),
      roleType: (filters?.roleTypeDisplayName || []).join(","),
      botNo: (filters?.permissionGroupName || []).join(","),
      roleName: (filters?.roleName || []).join(",")
    })
  }

  const columns = [
    { title: "角色code", dataIndex: "roleCode" },
    {
      title: "角色名称",
      dataIndex: "roleName",
      filterSearch: true,
      filters: roleList?.map((item) => ({
        text: item.roleName,
        value: item.roleName
      }))
    },
    {
      title: "角色类型",
      dataIndex: "roleTypeDisplayName",
      filterSearch: true,
      filters: dictionaryRoleTypeList?.map((item) => ({
        text: item.name,
        value: item.code
      }))
    },
    {
      title: "空间名称",
      dataIndex: "permissionGroupName",
      filterSearch: true,
      filters: allBotList.map((item) => ({
        text: item.name,
        value: item.code
      })),
      render: (text, record) => {
        const { botDataResources } = record
        // botDataResources是一个数组, 取里面的name展示
        const names = botDataResources?.map((item) => item.name) ?? []
        const { displayedText, tooltipText } = formatRoleNames(names)
        return (
          <div>
            {tooltipText ? (
              <Tooltip title={tooltipText}>
                <div dangerouslySetInnerHTML={{ __html: displayedText }} />
              </Tooltip>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: displayedText }} />
            )}
          </div>
        )
      }
    },
    {
      title: "操作",
      render: (text, record) => (
        <>
          <Button className="p-0" type="link" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" style={{ marginLeft: 8 }} onClick={() => handleDelete(record)}>
            删除
          </Button>
        </>
      )
    }
  ]

  /**
   * @description:
   * @params parentNo 所属管理员Code
   * @des {*}  如果当前角色是超管，则下拉列表不传adminRoleNo字段
   * @des {*}  如果当前角色不是超管，则下拉列表的adminRoleNo就是所属管理员的角色编号
   * @return {*}
   */
  const setBotParamsCallback = (parentNo) => {
    const roleType = currentRole?.roleType
    const permissionGroupNo = currentRole?.permissionGroupNo
    // 当前角色是否为超管
    const isSuperAdminRole = ROLE_TYPE.SUPER_ADMIN === roleType
    setIsSuperAdminRole(isSuperAdminRole)
    // 所属管理员是否是超管 TODO
    // const isParentSuperAdmin =
    //   parentNo &&
    //   adminRoles.find((v) => v.roleType === ROLE_TYPE.SUPER_ADMIN)?.roleNo ===
    //     parentNo
    // setIsParentSuperAdmin(isParentSuperAdmin)
    const o = isSuperAdminRole ? {} : { adminRoleNo: parentNo }
    setBotParams({
      permissionGroupNo,
      ...o
    })
  }

  const handleEdit = (record) => {
    console.log(record)
    // 设置新的查询参数
    const newParams = {
      permissionGroupNo: record.permissionGroupNo,
      roleNo: record?.roleNo
    }
    setParams(newParams)
    setVisible(true)
  }

  const getAllParentKey = (resourceNo) => {
    let parents = []
    const list = getTreeSimple()
    const loop = (code) => {
      const parentNo = list.find((v) => v.resourceNo === code)?.parentNo
      if (parentNo && parentNo !== "-1") {
        parents.push(parentNo)
        loop(parentNo)
      }
    }
    loop(resourceNo)
    return parents
  }
  const getMenuOrButtons = (menuOrButtons = []) => {
    let cloneMenus = [...menuOrButtons]

    let p = []
    menuOrButtons.forEach((v) => {
      const parents = getAllParentKey(v)
      p.push(...parents)
    })
    cloneMenus = uniq([...cloneMenus, ...p])
    const result = getTreeSimple()
      .filter((v) => {
        const parents = getAllParentKey(v.resourceNo)
        return parents?.includes(v.resourceNo) || cloneMenus.includes(v.resourceNo)
      })
      .map((v) => ({ resourceNo: v.resourceNo, name: v.name }))
    return uniqBy(result, "resourceNo")
  }

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        const params = {
          ...values,
          menuOrButtons: getMenuOrButtons(values?.menuOrButtons),
          automaticAddBotResource: values.botDataResources.find((item) => item === true),
          roleNo: currentRole.roleNo,
          permissionGroupNo: currentRole.permissionGroupNo,
          botDataResources: values.botDataResources
            .map((item) => ({
              resourceNo: item
            }))
            .filter((v) => v.resourceNo !== true)
        }
        saveAuthRoleMutation(params, {
          onSuccess: (e) => {
            if (e?.success) {
              message.success("保存成功")
              queryClient.invalidateQueries([QUERY_KEYS.AUTH_ROLE_PAGE])
              queryClient.invalidateQueries([QUERY_KEYS.AUTH_ROLE_DETAIL])
              queryClient.invalidateQueries([QUERY_KEYS.AUTH_RESOURCE_LIST_BOT_RESOURCE])
            } else {
              message.error(e?.message)
            }
          }
        })
        form.resetFields()
        setVisible(false)
      })
      .catch((info) => {
        console.log("Failed:", info)
      })
  }

  const handleCancel = () => {
    setVisible(false)
    form.resetFields()
  }

  const handleSelectChange = (values) => {
    if (values.includes(true)) {
      form.setFieldsValue({ botDataResources: [true] })
    }
  }

  const tProps = {
    treeData,
    allowClear: true,
    treeCheckable: true,
    multiple: true,
    showCheckedStrategy: TreeSelect.SHOW_ALL,
    maxTagCount: 10,
    fieldNames: {
      label: "name",
      value: "resourceNo",
      children: "child"
    },
    placeholder: "请选择菜单权限",
    style: {
      width: "100%"
    }
  }

  const onChangeAdmin = (value) => {
    try {
      setBotParamsCallback(value)
      form.resetFields(["botDataResources"])
    } catch (e) {
      console.log(e)
    }
  }
  return (
    <div>
      <Form form={filterForm} layout="horizontal">
        <Row gutter={16} justify="space-between">
          <Col span={6}>
            <Form.Item name="query">
              <Input placeholder="请输入角色名称/角色代码" onChange={handleQuery} allowClear />
            </Form.Item>
          </Col>
        </Row>
      </Form>
      <Table
        columns={columns}
        dataSource={tableList}
        pagination={false}
        scroll={{ y: 706 }}
        onChange={handleSortAndFilterChange}
      />
      <Pagination
        className="fixed-pagination"
        current={pagination.current}
        pageSize={pagination.pageSize}
        total={totalCount}
        onChange={(page, pageSize) => setPagination({ current: page, pageSize })}
        showSizeChanger={true}
        style={{ marginTop: "15px", textAlign: "right" }}
        showTotal={(total) => `共 ${total} 条`}
      />

      <Modal title="编辑角色" visible={visible} onOk={handleOk} onCancel={handleCancel}>
        <Form
          form={form}
          labelCol={{
            span: 5
          }}
          wrapperCol={{
            span: 16
          }}
        >
          <Form.Item
            name="roleCode"
            label="角色code"
            rules={[{ required: true, message: "请输入角色code!" }]}
          >
            <Input disabled />
          </Form.Item>
          <Form.Item
            name="roleName"
            label="角色名称"
            rules={[{ required: true, message: "请输入角色名称!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="parentNo" label="所属管理员">
            <Select onChange={onChangeAdmin} disabled>
              {adminRoles.map((item) => {
                return <Select.Option value={item.roleNo}>{item.roleName}</Select.Option>
              })}
            </Select>
          </Form.Item>
          {isSuperAdminRole && (
            <Form.Item name="permissionGroupNo" label="标签">
              <Select>
                {groupList.map((item) => {
                  return <Select.Option value={item.permissionGroupNo}>{item.name}</Select.Option>
                })}
              </Select>
            </Form.Item>
          )}

          <Form.Item name="botDataResources" label="空间">
            <Select
              mode="multiple"
              placeholder="请选择"
              onChange={handleSelectChange}
              maxTagCount={10}
              allowClear
              filterOption={(input, option) =>
                // @ts-ignore
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {/* 内置一个全部,值为true */}
              <Select.Option value={true}>全部</Select.Option>
              {botList.map((item) => {
                return <Select.Option value={item.resourceNo}>{item.name}</Select.Option>
              })}
            </Select>
          </Form.Item>
          <Form.Item name="menuOrButtons" label="菜单权限">
            <TreeSelect {...tProps} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default RoleManageMent
