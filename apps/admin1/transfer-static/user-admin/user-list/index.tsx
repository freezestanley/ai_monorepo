/* eslint-disable @typescript-eslint/ban-ts-comment */
import SearchablePagedTable from "../../components/searchable-page-table"
import { Button, Modal, message } from "antd"
import FormRender, { useForm } from "form-render"

import { useEffect, useRef, useState } from "react"
import { IUserInfo, getColumn, getUserInfoSchema } from "./schema"
import { getQueryParameters } from "../../utils/token"
import {
  createUser,
  deleteUser,
  editUser,
  getRoleTypeList,
  getBotRoleList
} from "../../services/userAdmin"
function UserList() {
  const urlState = getQueryParameters()
  const botNo = urlState?.botNo
  const searchPath = `/admin/bot/${botNo}/authUser/page`

  const tableRef = useRef<any>(null)
  const formInstance = useForm()
  const [userInfoModalVisible, setUserInfoModalVisible] = useState(false)
  const [isEdited, setEdited] = useState(false)

  const [botRoleFilter, setBotRoleFilter] = useState<any>({})

  useEffect(() => {
    if (!botNo) return
    Promise.all([getBotRoleList({ botNo }), getRoleTypeList({})]).then((res: any) => {
      const roleList = res[0]
      const roleTypeList = res[1]
      if (!roleList || !roleTypeList) return
      setBotRoleFilter({
        roleNameList: roleList.map((role: any) => {
          return { text: role.roleName, value: role.roleNo }
        }),
        roleTypeList: roleTypeList.map((roleType: any) => {
          return { text: roleType.name, value: roleType.code }
        }),
        roleList: roleList.map((role: any) => {
          return { label: role.roleName, value: role.roleNo }
        })
      })
    })
  }, [])

  const getSorter = (sorter: any) => {
    const { field, order } = sorter
    const currentSorter = {
      asc: order === "ascend" ? true : false,
      orderField: field === "gmtCreated" ? "gmt_created" : field
    }
    return currentSorter
  }

  const formatFilter = (filters: any) => {
    let ret = {}
    try {
      ret = Object.entries(filters).reduce(
        (acc, [key, value]) => ({ ...acc, [key]: Array.isArray(value) ? value.join(",") : value }),
        {}
      )
    } catch (error) {
      console.log(error)
    }
    console.log(ret)
    return ret
  }

  /**
   * 增
   */
  const handleCreate = () => {
    setEdited(false)
    setUserInfoModalVisible(true)
    formInstance.resetFields()
  }

  /**
   * 删
   * @param param0
   */
  const handleDelete = async ({ username }: IUserInfo) => {
    try {
      await deleteUser({ botNo, username })
      tableRef.current?.reloadData()
      message.success("删除成功")
    } catch (error) {
      console.error("Error offline:", error)
    }
  }

  /**
   * 改
   * @param userInfo
   */
  const handleEdit = (userInfo: IUserInfo) => {
    setEdited(true)
    setUserInfoModalVisible(true)
    formInstance.setValues({ ...userInfo, roleNo: userInfo.roles[0]?.roleNo })
  }

  const handleOk = async () => {
    const values = formInstance.getValues()
    try {
      await formInstance.validateFields()
    } catch (error: any) {
      message.error("请按规范填写相关信息")
      console.error("Error validateFields:", error)
      return
    }
    try {
      if (isEdited) {
        await editUser({ ...values, botNo, roles: [{ roleNo: values.roleNo }] })
        message.success("修改成功")
      } else {
        await createUser({ ...values, botNo, roles: [{ roleNo: values.roleNo }] })
        message.success("添加成功")
      }

      setUserInfoModalVisible(false)
      tableRef.current?.reloadData()
    } catch (error: any) {
      console.error("Error createUser:", error)
    }
  }
  const handleCancel = () => {
    formInstance.resetFields()
    setUserInfoModalVisible(false)
  }

  const columns = getColumn({ handleDelete, handleEdit, botRoleFilter })
  const userInfoSchema = getUserInfoSchema({
    isEdited,
    roleList: botRoleFilter.roleList || [],
    formInstance
  })

  return (
    <div style={{ width: "100%" }}>
      <SearchablePagedTable
        ref={tableRef}
        title="用户列表"
        path={searchPath}
        apiMethod="get"
        searchPlaceholder="搜索用户姓名/用户域账号"
        columns={columns}
        searchBtnRender={[
          <Button type="primary" onClick={handleCreate}>
            新增用户
          </Button>
        ]}
        dataKey="list"
        searchKey="query"
        rowKey="username"
        searchParams={{}}
        formatFilter={formatFilter}
        showSelection={false}
        getSorter={getSorter}
      />
      <Modal
        title={isEdited ? "编辑用户" : "新增用户"}
        open={userInfoModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={600}
      >
        <br />
        <br />
        {/* @ts-expect-error */}
        <FormRender form={formInstance} schema={userInfoSchema} />
      </Modal>
    </div>
  )
}

export default UserList
