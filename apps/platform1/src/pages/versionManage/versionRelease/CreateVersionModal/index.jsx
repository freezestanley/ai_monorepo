import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Modal, Form, Input, Row, Col, Table, Button, Space, message, Divider } from "antd"
import { SearchOutlined } from "@ant-design/icons"
import classNames from "classnames"
import { useFetchPublishEntityChangeList, useCreatePublishOrder } from "@/api/versionRelease"
import { fetchPublishOrderList } from "@/api/versionRelease/api"
import { fetchAgentList } from "@/api/agent/api"
import { getMaterialUrl, getAgentzUrl } from "@/config.env"
import ExpandedTable from "./ExpandedTable"
import styles from "./index.module.less"

export const ENTITY_OPTIONS = [
  {
    text: "Agent",
    value: "AGENT"
  },
  {
    text: "工作流",
    value: "SKILL"
  },
  {
    text: "工具",
    value: "PLUGIN_TOOL"
  },
  {
    text: "工具箱",
    value: "PLUGIN"
  },
  {
    text: "全局常量",
    value: "GLOBAL_CONSTANTS"
  }
]

export const getEntityDetail = async (record, parentOrigin, botNo) => {
  if (record.entityType === "SKILL") {
    window.open(
      `${parentOrigin}/prompt/skillList?botNo=${botNo}&workbenchNo=promptEngineering&skillNo=${record.entityNo}&isTools=true`,
      "_blank"
    )
  } else if (record.entityType === "AGENT") {
    const res = await fetchAgentList({ botNo, agentNo: record.entityNo })
    const { agentMode } = res?.find((item) => item.agentNo === record.entityNo) || {}
    if (typeof agentMode === "undefined" || agentMode === null) {
      message.warning("该agent不存在")
      return
    }
    let url = `${parentOrigin}/prompt/agent?botNo=${botNo}&workbenchNo=promptEngineering&agentNo=${record.entityNo}&agentMode=${agentMode}&isTools=true`
    if ([3, 5].includes(agentMode)) {
      url += `&materialUrl=${encodeURIComponent(getMaterialUrl())}`
    } else if (agentMode === 6) {
      url += `&agentzUrl=${encodeURIComponent(getAgentzUrl())}`
    }
    window.open(url, "_blank")
  }
}

const CreateVersionModal = ({ botNo, parentOrigin, studioenv, visible, onCancel }) => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [queryParams, setQueryParams] = useState({
    pageSize: 10,
    pageNum: 1
  })
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const { data, isLoading } = useFetchPublishEntityChangeList(
    {
      targetId: botNo,
      ...queryParams,
      entityTypeList: queryParams.entityType,
      entityType: undefined
    },
    {
      enabled: visible && !!botNo
    }
  )
  const { mutate: createPublishOrder, isLoading: createPublishOrderLoading } =
    useCreatePublishOrder()

  useEffect(() => {
    if (!visible) {
      form.resetFields()
      setQueryParams({
        pageSize: 10,
        pageNum: 1
      })
      setSelectedRowKeys([])
    }
  }, [visible, form])

  // 重置搜索
  const handleReset = (clearFilters, dataIndex) => {
    clearFilters()
    // 重置特定字段的查询参数
    const newParams = { ...queryParams }
    delete newParams[dataIndex]
    setQueryParams(newParams)
  }

  // 搜索处理函数
  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm()
    // 更新查询参数
    const newParams = {
      ...queryParams,
      pageNum: 1 // 重置到第一页
    }
    newParams[dataIndex] = selectedKeys[0]
    setQueryParams(newParams)
  }

  function getColumnSearchProps(dataIndex, placeholder) {
    return {
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            className={`search-input-${dataIndex}`}
            placeholder={`搜索${placeholder}`}
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
            style={{ marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
              icon={<SearchOutlined />}
              size="small"
              style={{ width: 90 }}
            >
              搜索
            </Button>
            <Button
              onClick={() => handleReset(clearFilters, dataIndex)}
              size="small"
              style={{ width: 90 }}
            >
              重置
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered) => (
        <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
      ),
      onFilterDropdownOpenChange: (visible) => {
        if (visible) {
          setTimeout(() => {
            document.querySelector(`.search-input-${dataIndex}`)?.focus()
          }, 100)
        }
      }
    }
  }

  const columns = [
    {
      title: "类型",
      dataIndex: "entityType",
      key: "entityType",
      width: 100,
      filters: ENTITY_OPTIONS,
      onFilter: (value, record) => record.entityType === value,
      render: (text) => !!text && ENTITY_OPTIONS.find((item) => item.value === text)?.text
    },
    {
      title: "名称",
      dataIndex: "entityName",
      key: "entityName",
      width: 200,
      ...getColumnSearchProps("entityName", "名称")
    },
    {
      title: "Agent/工作流编号",
      dataIndex: "entityNo",
      key: "entityNo",
      width: 150,
      ...getColumnSearchProps("entityNo", "Agent/工作流编号")
    },
    {
      title: "创建信息",
      dataIndex: "gmtCreated",
      key: "gmtCreated",
      width: 200,
      sorter: true, // 添加排序功能
      render: (text, record) => (
        <>
          {record.creator || "--"}
          <br />
          {text || "--"}
        </>
      )
    },
    {
      title: "更新信息",
      dataIndex: "gmtModified",
      key: "gmtModified",
      width: 200,
      sorter: true, // 添加排序功能
      render: (text, record) => (
        <>
          {record.modifier || "--"}
          <br />
          {text || "--"}
        </>
      )
    },
    {
      title: "操作",
      key: "action",
      width: 80,
      render: (_, record) => (
        <Button
          type="link"
          className="!p-0"
          onClick={() => getEntityDetail(record, parentOrigin, botNo)}
        >
          查看
        </Button>
      )
    }
  ]

  const handleTableChange = (pagination, filters, sorter) => {
    const newParams = {
      ...queryParams,
      pageNum: pagination.current,
      pageSize: pagination.pageSize
    }
    // 处理排序
    newParams.sortField = sorter.field
    newParams.sortOrder = sorter.order ? (sorter.order === "ascend" ? "ASC" : "DESC") : undefined
    // 处理筛选
    if (filters.entityType?.length > 0) {
      newParams.entityType = filters.entityType
    } else {
      delete newParams.entityType
    }
    setQueryParams(newParams)
  }

  // 多选配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys) => {
      setSelectedRowKeys(selectedRowKeys)
    }
  }

  const onSubmit = async () => {
    const values = await form.validateFields()
    if (!selectedRowKeys.length) {
      message.error("请选择要发布的实体")
      return
    }

    // 对所有字符串字段去除前后空格
    const trimmedValues = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [
        key,
        typeof value === "string" ? value.trim() : value
      ])
    )

    createPublishOrder(
      {
        targetType: "BOT",
        targetId: botNo,
        ...trimmedValues,
        materials: selectedRowKeys.map((id) => ({ changeRecordId: id }))
      },
      {
        onSuccess: (res) => {
          if (res.success) {
            message.success("创建发布单成功")
            onCancel()
            navigate(
              `/versionRelease/detail/${res.data}?botNo=${botNo}&parentOrigin=${parentOrigin}&studioenv=${studioenv || ""}`
            )
          }
        }
      }
    )
  }

  const verifyValue = useMemo(() => {
    return [
      {
        validator: async (_, value) => {
          if (!value) return Promise.resolve()
          const res = await fetchPublishOrderList({
            targetIds: [botNo],
            pageSize: 1,
            pageNum: 1,
            publishOrderName: value?.trim()
          })
          if (!res?.data?.data?.length) {
            return Promise.resolve()
          } else {
            return Promise.reject("发布单名称已存在")
          }
        }
      }
    ]
  }, [botNo])

  return (
    <Modal
      title="创建发布单"
      visible={visible}
      onCancel={onCancel}
      onOk={onSubmit}
      confirmLoading={createPublishOrderLoading}
      okText="确认"
      cancelText="取消"
      width={1000}
      destroyOnClose
    >
      <Form form={form}>
        <h1 className="text-[#181B25] text-[16px] font-[500] mb-[16px]">基本信息</h1>
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              label="发布单名称"
              name="publishOrderName"
              rules={[{ required: true, message: "请输入发布单名称" }, ...verifyValue]}
            >
              <Input placeholder="请输入" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="备注" name="description">
              <Input placeholder="请输入" />
            </Form.Item>
          </Col>
        </Row>
        <Divider className="mt-0 mb-[30px]" style={{ borderBlockStart: "0.5px solid #D0D5DD" }} />
        <h1 className="text-[#181B25] text-[16px] font-[500] mb-[16px]">发布清单</h1>
        <Table
          className={classNames("table-style-v2", styles.table)}
          rowSelection={rowSelection}
          rowClassName={(record, index) =>
            index % 2 === 0 ? "table-style-v2-even-row" : "table-style-v2-odd-row"
          }
          columns={columns}
          dataSource={data?.data?.data || []}
          rowKey="recordId"
          loading={isLoading}
          onChange={handleTableChange}
          expandedRowRender={(record) => {
            if (record.childrenList?.length > 0) {
              return <ExpandedTable dataSource={record.childrenList} />
            }
            return null
          }}
          rowExpandable={(record) => record.childrenList && record.childrenList.length > 0}
          pagination={{
            current: queryParams.pageNum,
            pageSize: queryParams.pageSize,
            total: data?.data?.totalCount || 0,
            showTotal: (total) => `共${total}条`,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            onChange: (page, pageSize) => {
              setQueryParams({
                ...queryParams,
                pageNum: page,
                pageSize
              })
            }
          }}
        />
      </Form>
    </Modal>
  )
}

export default CreateVersionModal
