import { Button, Space, Popconfirm } from 'antd'
import { ColumnType } from 'antd/es/table'

export interface IRoleInfo {
  name: string
  username: string
  gmtModified: string
  gmtCreated: string
  creator: string
}

export interface IRoleType {
  roleName: string
  roleType: string
  roleNo: string
  gmtModified: string
  gmtCreated: string
}

interface IColumnParams {
  handleDelete: (record: IRoleType) => void
  handleEdit: (record: IRoleType) => void
}

export const getColumn = ({ handleDelete, handleEdit }: IColumnParams): ColumnType<IRoleInfo>[] => {
  return [
    { title: '角色名称', dataIndex: 'roleName', width: 30, fixed: 'left' },
    {
      title: '角色类型',
      dataIndex: 'roleTypeDisplayName',
      width: 20,
      render: (roleTypeDisplayName: string) => {
        return <div className="">{roleTypeDisplayName ?? ''}</div>
      }
    },
    {
      title: '角色描述',
      dataIndex: 'description',
      width: 80,
      render: (description: string) => {
        return <div className="">{description ?? ''}</div>
      }
    },
    {
      title: '操作',
      width: 40,
      fixed: 'right',
      render: (record: IRoleType) => (
        <Space>
          {record.roleType === 'CUSTOM' ? (
            <>
              <Button type="link" onClick={() => handleEdit(record)}>
                编辑
              </Button>
              <Popconfirm title="【删除】角色后，相关用户将归为“空间普通用户" onConfirm={() => handleDelete(record)}>
                <Button type="link">删除</Button>
              </Popconfirm>
            </>
          ) : (
            <Button type="link" onClick={() => handleEdit(record)}>
              查看
            </Button>
          )}
        </Space>
      )
    }
  ]
}
