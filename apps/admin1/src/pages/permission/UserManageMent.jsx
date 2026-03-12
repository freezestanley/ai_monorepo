import { useEffect, useState } from "react"
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  Pagination,
  message,
  Tooltip
} from "antd"
import {
  useFetchAuthRoleList,
  useFetchAuthUserPage,
  useFetchDictionaryUserStatus,
  useUpdateAuthUser,
  useSaveAuthUser,
  useFetchAuthResourceListBotResource,
  useFetchAuthUserWhetherAdmin,
  useGetAuthUserDetail,
  useUpdateAuthUserStatus
} from "@/api/permission"
import { debounce } from "lodash"
import UserFormModal from "./components/UserFormModal"
import StatusSwitch from "./components/StatusSwitch"
import { updateAuthUserStatus } from "@/api/permission/api"

const formatText = (items, maxDisplay = 10) => {
  // 获取所有的名称，并将其展平
  const allNames = items.flatMap((item) => item.botDataResources.map((res) => res.name))

  // 截取前 maxDisplay 个名称
  const displayedNames = allNames.slice(0, maxDisplay)

  // 生成用于显示的文本
  const displayedText = displayedNames.join("<br />")

  // 如果总名称数超过最大显示数量，添加省略号并准备完整的 Tooltip 文本
  if (allNames.length > maxDisplay) {
    return {
      displayedText: displayedText + "...", // 添加省略号
      tooltipText: allNames.join(", ") // Tooltip 显示所有名称
    }
  }

  return { displayedText }
}

const formatRoleNames = (roleNames, maxDisplay = 10) => {
  const displayedRoles = roleNames.slice(0, maxDisplay)
  const displayedText = displayedRoles.join("<br />")

  // 如果角色总数超过最大显示数量，添加省略号并准备完整的 Tooltip 文本
  if (roleNames.length > maxDisplay) {
    return {
      displayedText: displayedText + "...", // 添加省略号
      tooltipText: roleNames.join(",") // Tooltip 显示所有角色名称
    }
  }

  return { displayedText }
}

function UserManager() {
  const [visible, setVisible] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentRecord, setCurrentRecord] = useState({})
  const [filterForm] = Form.useForm()
  const [form] = Form.useForm()
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  // 上传的loading
  const [mulUploadLoading, setMulUploadLoading] = useState(false)

  const [params, setParams] = useState({})
  const [sortAndFilterState, setSortAndFilterState] = useState({
    botNo: "",
    orderField: "",
    asc: "",
    roleNo: "",
    status: ""
  })

  // 从API获取用户数据
  const { data: { list: tableList = [], totalCount } = {}, refetch } = useFetchAuthUserPage({
    pageNum: pagination.current,
    pageSize: pagination.pageSize,
    ...params,
    ...sortAndFilterState
  }) // 你可以传入初始参数

  // 使用保存用户的mutation
  const { mutate: saveUser } = useSaveAuthUser()

  // 使用更新用户角色的mutation
  const { data: roleList } = useFetchAuthRoleList()

  const { data: botList = [] } = useFetchAuthResourceListBotResource({
    permissionGroupNo: true
  })
  const { data: statusList } = useFetchDictionaryUserStatus()
  const { mutate: updateUser, isLoading } = useUpdateAuthUser()
  const { data: whetherAdmin } = useFetchAuthUserWhetherAdmin()
  const { data: allBotList = [] } = useFetchAuthResourceListBotResource({})
  const { data: userDetail = {} } = useGetAuthUserDetail(currentRecord)

  const columns = [
    {
      title: "姓名",
      width: 150,
      dataIndex: "name",
      key: "name"
    },
    {
      title: "域账号",
      width: 200,
      dataIndex: "username",
      key: "username"
    },
    {
      title: "空间名称",
      dataIndex: "botName",
      key: "botName",
      width: 300,
      filterSearch: true,
      filters: allBotList.map((item) => ({
        text: item.name,
        value: item.code
      })),
      render: (_, { roles }) => {
        const { displayedText, tooltipText } = formatText(roles)
        return (
          <div>
            {tooltipText ? (
              <Tooltip title={tooltipText}>
                <div dangerouslySetInnerHTML={{ __html: displayedText + "..." }} />
              </Tooltip>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: displayedText }} />
            )}
          </div>
        )
      }
    },
    {
      title: "角色名称",
      dataIndex: "roles",
      key: "roles",
      width: 300,
      filterSearch: true,
      filters: (roleList || []).map((roleItem) => ({
        text: roleItem.roleName,
        value: roleItem.roleNo
      })),
      render: (roles) => {
        // 判断 roles 是否为数组并进行相应处理
        if (Array.isArray(roles)) {
          const roleNames = roles.map((item) => item.roleName)
          const { displayedText, tooltipText } = formatRoleNames(roleNames)

          return (
            <div>
              {tooltipText ? (
                <Tooltip title={tooltipText}>
                  <div dangerouslySetInnerHTML={{ __html: displayedText + "..." }} />
                </Tooltip>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: displayedText }} />
              )}
            </div>
          )
        }

        return roles
      }
    },

    {
      title: "创建时间",
      width: 200,
      dataIndex: "gmtCreated",
      key: "gmtCreated",
      sorter: true
    },
    {
      title: "操作",
      width: 160,
      key: "operation",
      render: (_, record) => (
        <>
          <StatusSwitch record={record} handleStatusChange={handleStatusChange} />
          <Button type="link" onClick={() => handleEdit(record)} className="p-0 ml-4">
            编辑
          </Button>
        </>
      )
    }
  ]

  // 状态改变的处理
  const handleStatusChange = async (record) => {
    const res = await updateAuthUserStatus({
      username: record.username,
      status: record.status === "inJob" ? "resignation" : "inJob"
    })
    if (res.success) {
      message.success(res.message)
      refetch()
    } else {
      message.error(res.message)
    }
    return res
  }

  const handleQuery = debounce(() => {
    filterForm.validateFields().then((values) => {
      console.log(values)
      setPagination((prev) => {
        return {
          ...prev,
          current: 1,
          pageSize: pagination.pageSize
        }
      })
      setParams(values)
    })
  }, 1000)

  const handleSortOrFilterChange = (pagination, filters, sorter) => {
    const { order, field } = sorter
    setSortAndFilterState({
      botNo: (filters?.botName || []).join(","),
      roleNo: (filters?.roles || []).join(","),
      status: (filters?.statusDisplayname || []).join(","),
      orderField: !order ? "" : field === "gmtCreated" ? "gmt_created" : "",
      asc: order === "ascend" ? "true" : order === "descend" ? "false" : ""
    })
  }

  const handleEdit = (record) => {
    console.log({
      ...record,
      roles: record.roles ? record.roles.map((item) => item.roleNo) : []
    })
    setCurrentRecord(record)
    setIsEditing(true)
    form.setFieldsValue({
      ...record,
      roles: record.roles ? record.roles.map((item) => item.roleNo) : []
    })
    setVisible(true)
  }

  const handleSave = () => {
    form.validateFields().then((values) => {
      console.log(values)
      const api = isEditing ? updateUser : saveUser
      const params = {
        ...values,
        roles: values.botRole.map((item) => ({ roleNo: item["role"] }))
      }
      delete params.botRole
      console.log(params)
      api(params, {
        onSuccess: (e) => {
          if (e.success) {
            message.success("保存成功")
            refetch()
          } else {
            message.error(e.message)
          }
        }
      })
      setVisible(false)
      form.resetFields()
    })
  }

  useEffect(() => {
    if (!isEditing) {
      form.resetFields()
    }
  }, [form, visible, isEditing])

  return (
    <div>
      <Form form={filterForm} layout="horizontal">
        <Row gutter={16} justify="space-between">
          <Col span={6}>
            <Form.Item name="query">
              <Input placeholder="请输入姓名/域账号" onChange={handleQuery} allowClear />
            </Form.Item>
          </Col>
          <Col
            span={12}
            style={{
              display: "flex",
              justifyContent: "flex-end",
              paddingRight: 20
            }}
          >
            <Button
              type="primary"
              onClick={() => {
                setVisible(true)
                setIsEditing(false)
              }}
            >
              新建
            </Button>

            {/* 上传下载 */}
          </Col>

          {/* <Col>
            <Button
              htmlType="submit"
              type="primary"
              onClick={handleQuery}
              style={{ marginRight: 8 }}
            >
              查询
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Col> */}
        </Row>
      </Form>
      <Table
        columns={columns}
        dataSource={tableList}
        pagination={false}
        scroll={{ y: 706 }}
        className="pb-4"
        onChange={handleSortOrFilterChange}
        style={{ marginTop: 16 }}
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

      <UserFormModal
        form={form}
        visible={visible}
        botList={botList}
        isEditing={isEditing}
        currentRecord={userDetail}
        onSave={handleSave}
        onCancel={() => setVisible(false)}
        isLoading={isLoading}
        whetherAdmin={whetherAdmin}
      />
    </div>
  )
}

export default UserManager
