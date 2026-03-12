import SearchablePagedTable from "../../components/searchable-page-table"
import { Button, message } from "antd"
import { useRef } from "react"
import { IRoleType, getColumn } from "./schema"
import { getQueryParameters } from "../../utils/token"
import useRouter from "../../hooks/useRouter"
import { deleteCustomRole } from "../../services/userAdmin"
function RoleAdmin() {
  const urlState = getQueryParameters()
  const botNo = urlState?.botNo
  const searchPath = `/admin/bot/${botNo}/authRole/page`

  const tableRef = useRef<any>(null)
  const { navigatePush } = useRouter()

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
    return ret
  }

  /**
   * 增
   */
  const handleCreate = () => {
    navigatePush(`/user/admin/role/list/detail`)
  }

  /**
   * 删
   * @param param0
   */
  const handleDelete = async ({ roleNo }: IRoleType) => {
    try {
      await deleteCustomRole({ botNo, roleNo })
      tableRef.current?.reloadData()
      message.success("删除成功")
    } catch (error) {
      console.error("Error offline:", error)
    }
  }

  /**
   * 改
   * @param roleInfo
   */
  const handleEdit = (roleInfo: IRoleType) => {
    navigatePush(`/transfer/user/detail`, { ...urlState, roleNo: roleInfo.roleNo })
  }

  const columns = getColumn({ handleDelete, handleEdit })

  return (
    <div className="w-[100%]">
      <SearchablePagedTable
        ref={tableRef}
        title="角色管理"
        path={searchPath}
        apiMethod="get"
        searchPlaceholder="搜索角色名称"
        columns={columns}
        searchBtnRender={[
          <Button type="primary" onClick={handleCreate}>
            新增角色
          </Button>
        ]}
        dataKey="list"
        searchKey="query"
        rowKey="username"
        searchParams={{
          botNo
        }}
        formatFilter={formatFilter}
        showSelection={false}
        getSorter={getSorter}
      />
    </div>
  )
}

export default RoleAdmin
