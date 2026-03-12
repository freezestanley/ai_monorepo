import { Button, Space, Popconfirm } from 'antd'
import { ColumnType } from 'antd/es/table'
import { FormInstance } from 'form-render'
import { getUserInfoFromSso } from "../../services/userAdmin"

export interface IUserInfo {
  name: string
  username: string
  gmtModified: string
  gmtCreated: string
  creator: string
  creatorDisplayName: string
  roles: IRoleType[]
}

export interface IRoleType {
  roleName: string
  roleType: string
  roleNo: string
  roleTypeDisplayName: string
  gmtModified: string
  gmtCreated: string
}

interface IColumnParams {
  handleDelete: (record: IUserInfo) => void
  handleEdit: (record: IUserInfo) => void
  botRoleFilter: any
}

export const getColumn = ({ handleDelete, handleEdit, botRoleFilter }: IColumnParams): ColumnType<IUserInfo>[] => {
  console.log('botRoleFilter:', botRoleFilter)
  return [
    { title: '用户姓名', dataIndex: 'name', width: 120, fixed: 'left' },
    { title: '用户域账号', dataIndex: 'username', width: 120, render: (text: string) => <div className="content-text">{text}</div> },
    {
      title: '角色名称',
      dataIndex: 'roleNo',
      width: 200,
      filterSearch: true,
      filters: botRoleFilter.roleNameList,
      render: (_roleNo: string, record: IUserInfo) => {
        return <div className="">{(record.roles || [])[0]?.roleName ?? ''}</div>
      }
    },
    {
      title: '角色类型',
      dataIndex: 'roleType',
      width: 120,
      filters: botRoleFilter.roleTypeList,
      render: (_roleNo: string, record: IUserInfo) => {
        return <div className="">{(record.roles || [])[0]?.roleTypeDisplayName ?? ''}</div>
      }
    },
    {
      title: '创建信息',
      width: 200,
      dataIndex: 'gmtCreated',
      sorter: true,
      sortDirections: ['descend', 'ascend'],
      render: (_: string, row: IUserInfo) => {
        return (
          <>
            <div>{row.creatorDisplayName}</div>
            <div>{row.gmtCreated}</div>
          </>
        )
      }
    },
    {
      title: '操作',
      width: 120,
      fixed: 'right',
      render: (record: IUserInfo) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="【删除】将导致该用户无法访问空间" onConfirm={() => handleDelete(record)}>
            <Button type="link">删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const checkUsername = async (rule: any, value: any) => {
  if (!value) return true
  try {
    const data = await getUserInfoFromSso({ username: value })
    if (data?.username) {
      return true
    } else {
      return { status: false, message: '域账号不存在' }
    }
  } catch (err: any) {
    console.log('err: ', err)
    return { status: false, message: '域账号不存在' }
  }
}

interface UserInfoSchemaParams {
  isEdited: boolean
  roleList: Array<any>
  formInstance: FormInstance
}

export const getUserInfoSchema = ({ isEdited = false, roleList = [], formInstance }: UserInfoSchemaParams) => {
  return {
    displayType: 'row',
    type: 'object',
    span: 24,
    properties: {
      name: {
        span: 20,
        fieldCol: 24,
        labelWidth: 100,
        title: '姓名',
        type: 'string',
        required: true,
        placeholder: '请输入用户真实姓名',
        props: {
          allowClear: true
        }
      },
      username: {
        span: 20,
        fieldCol: 20,
        labelWidth: 100,
        title: '域账号',
        type: 'string',
        // required: true,
        placeholder: '请输入用户域账号，用于登录系统',
        validateTrigger: 'onBlur', // form-render 库有问题，看源码 写了这个属性后 会变为 'onSubmit' 提交时校验
        rules: [{ required: true, message: '域账号必填' }, isEdited ? {} : { validator: checkUsername }],
        props: {
          allowClear: true,
          disabled: isEdited,
          onBlur: () => {
            // 兼容 form-render validateTrigger: 'onBlur' 不生效，在 onBlur 时手动触发表单校验
            formInstance?.validateFields(['username'])
          }
        }
      },
      mobile: {
        span: 20,
        fieldCol: 20,
        labelWidth: 100,
        title: '手机号',
        type: 'string',
        placeholder: '请输入用户手机号，用于紧急联络',
        rules: [{ pattern: /^1(3|4|5|6|7|8|9)\d{9}$/, message: '请输入正确的手机号' }],
        props: {
          allowClear: true
        }
      },
      email: {
        span: 20,
        fieldCol: 20,
        labelWidth: 100,
        title: '邮箱',
        type: 'string',
        format: 'email',
        placeholder: '用户企业内部通讯',
        props: {
          allowClear: true
        }
      },
      roleNo: {
        span: 20,
        fieldCol: 20,
        labelWidth: 100,
        title: '用户角色',
        widget: 'select',
        type: 'string',
        required: true,
        placeholder: '请选择用户角色',
        props: {
          options: roleList
        }
      }
    }
  }
}
