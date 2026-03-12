// 事件管理

import React, { useState, useEffect } from "react"
import {
  Table,
  Button,
  Modal,
  Space,
  Input,
  Tooltip,
  message,
  Pagination,
  Form,
  Select,
  Popconfirm,
  Drawer
} from "antd"
import {
  PlusOutlined,
  EyeOutlined,
  DeleteOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  EditOutlined
} from "@ant-design/icons"
import styles from "./event.module.scss"
import { getEventList, createOrUpdateEvent, deleteEvent } from "@/api/voiceAgent/api"
import { useLocation } from "react-router-dom"
import queryString from "query-string"
import { useCreateOrUpdateEvent, useDeleteEvent } from "@/api/voiceAgent/index"

export default function Event() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [detailsModalVisible, setDetailsModalVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [isEdit, setIsEdit] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const [queryParams, setQueryParams] = useState({
    pageNum: 1,
    pageSize: 10,
    orderColumn: "gmt_created",
    orderType: "desc"
  })
  const [searchText, setSearchText] = useState({})
  const [filteredInfo, setFilteredInfo] = useState({})

  // 获取API方法
  const createOrUpdateEventFunc = useCreateOrUpdateEvent()
  const deleteEventFunc = useDeleteEvent()

  // 获取URL中的botNo参数
  const location = useLocation()
  const { search } = location
  const urlParams = queryString.parse(search)
  const { botNo } = urlParams

  // 当URL中的botNo变化时更新查询参数
  useEffect(() => {
    if (botNo) {
      setQueryParams((prev) => ({
        ...prev,
        botNo: botNo
      }))
    } else {
      message.error("缺少必要参数botNo，请检查URL")
    }
  }, [botNo])

  // 获取事件列表数据
  const fetchEventList = async (params = {}) => {
    if (!botNo) {
      message.error("缺少必要参数，无法获取事件列表")
      return
    }

    try {
      setLoading(true)
      const requestParams = {
        botNo,
        ...queryParams,
        ...params
      }

      const res = await getEventList(requestParams)

      if (res && res.status === 200) {
        if (res.data && res.data.list && Array.isArray(res.data.list)) {
          setData(res.data.list)
          setPagination({
            current: res.data.pageNum || 1,
            pageSize: res.data.pageSize || 10,
            total: res.data.total || 0
          })
        } else {
          setData([])
          message.warning("获取事件列表成功，但数据格式不正确")
        }
      } else {
        message.error(res?.message || "获取事件列表失败")
      }
    } catch (error) {
      console.error("获取事件列表失败:", error)
      message.error("获取事件列表失败")
    } finally {
      setLoading(false)
    }
  }

  // 首次加载和参数变化时获取数据
  useEffect(() => {
    if (botNo) {
      fetchEventList()
    }
  }, [queryParams, botNo])

  // 搜索输入框配置
  const getColumnSearchProps = (dataIndex, placeholder) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
      <div style={{ padding: 8 }}>
        <Space className="mb-[8px] w-full justify-between">
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
              onClick={() => handleReset(clearFilters, confirm, dataIndex)}
              size="small"
              style={{ width: 90 }}
            >
              重置
            </Button>
            <Button size="small" type="link" onClick={close} className="!border-0 !p-0">
              关闭
            </Button>
          </Space>
        </Space>
        <Input
          placeholder={`搜索${placeholder}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ display: "block" }}
        />
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
    ),
    onFilter: (value, record) => {
      return record[dataIndex]
        ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
        : ""
    },
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => document.querySelector(".ant-table-filter-dropdown input")?.select(), 100)
      }
    }
  })

  // 处理搜索
  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm()

    // 更新搜索文本状态
    setSearchText({
      ...searchText,
      [dataIndex]: selectedKeys[0]
    })

    // 根据不同的搜索字段设置对应的API请求参数
    const newParams = {
      ...queryParams,
      pageNum: 1 // 重置到第一页
    }

    if (dataIndex === "eventName") {
      newParams.eventName = selectedKeys[0]
    } else if (dataIndex === "eventCode") {
      newParams.eventCode = selectedKeys[0]
    }

    setQueryParams(newParams)
  }

  // 重置搜索
  const handleReset = (clearFilters, confirm, dataIndex) => {
    clearFilters()

    setSearchText({
      ...searchText,
      [dataIndex]: ""
    })

    // 清除特定字段的搜索参数
    const newParams = { ...queryParams }

    if (dataIndex === "eventName") {
      delete newParams.eventName
    } else if (dataIndex === "eventCode") {
      delete newParams.eventCode
    }
    confirm({ closeDropdown: false })
    setQueryParams(newParams)
  }

  // 创建事件
  const handleCreateEvent = () => {
    setIsEdit(false)
    setCurrentRecord(null)
    form.resetFields()
    setDrawerVisible(true)
  }

  // 编辑事件
  const handleEditEvent = (record) => {
    setIsEdit(true)
    setCurrentRecord(record)
    form.setFieldsValue({
      eventName: record.eventName,
      eventCode: record.eventCode,
      eventType: record.eventType
    })
    setDrawerVisible(true)
  }

  // 删除事件
  const handleDeleteEvent = async (record) => {
    if (!botNo) {
      message.error("缺少必要参数，无法删除事件")
      return
    }

    try {
      const params = {
        botNo,
        eventId: record.eventId
      }

      const res = await deleteEventFunc(params)

      if (res && res.status === 200) {
        message.success("删除成功")
        fetchEventList() // 刷新列表
      } else {
        message.error(res?.message || "删除失败")
      }
    } catch (error) {
      console.error("删除事件失败:", error)
      message.error("删除失败，请稍后重试")
    }
  }

  // 处理表格分页、排序等变化
  const handleTableChange = (pagination, filters, sorter) => {
    setFilteredInfo(filters)

    const newParams = {
      ...queryParams,
      pageNum: pagination.current,
      pageSize: pagination.pageSize
    }

    // 处理排序
    if (sorter.field) {
      // 根据排序字段设置对应的API参数
      if (sorter.field === "gmtCreated") {
        newParams.orderColumn = "gmt_created"
      } else if (sorter.field === "gmtModified") {
        newParams.orderColumn = "gmt_modified"
      }

      // 设置排序方向
      newParams.orderType = sorter.order === "ascend" ? "asc" : "desc"
    }

    // 处理事件类型筛选
    if (filters.eventType && filters.eventType.length > 0) {
      newParams.eventType = filters.eventType[0]
    } else {
      delete newParams.eventType
    }

    setQueryParams(newParams)
  }

  // 抽屉确认
  const handleSubmit = async () => {
    if (!botNo) {
      message.error("缺少必要参数botNo，无法提交")
      return
    }

    try {
      // 表单验证
      const values = await form.validateFields()
      setSubmitLoading(true)

      // 构建请求参数（使用解构赋值简化代码）
      const params = {
        botNo,
        ...values,
        ...(isEdit && currentRecord?.eventId ? { eventId: currentRecord.eventId } : {})
      }

      // 调用创建或更新API
      const res = await createOrUpdateEventFunc(params)

      if (res?.status === 200) {
        message.success(isEdit ? "更新成功" : "创建成功")
        setDrawerVisible(false)
        form.resetFields()
        fetchEventList() // 刷新列表
      } else {
        message.error(res?.message || `${isEdit ? "更新" : "创建"}失败`)
      }
    } catch (error) {
      console.error(`${isEdit ? "更新" : "创建"}事件失败:`, error)
      // 区分表单验证错误和API调用错误
      if (error instanceof Error) {
        message.error(`${isEdit ? "更新" : "创建"}失败: ${error.message}`)
      }
    } finally {
      setSubmitLoading(false)
    }
  }

  // 抽屉取消
  const handleCancel = () => {
    setDrawerVisible(false)
    form.resetFields()
  }

  // 刷新列表
  const handleRefresh = () => {
    fetchEventList()
  }

  const columns = [
    {
      title: "事件名称",
      dataIndex: "eventName",
      key: "eventName",
      render: (text) => text || "--",
      ...getColumnSearchProps("eventName", "事件名称")
    },
    {
      title: "事件Code",
      dataIndex: "eventCode",
      key: "eventCode",
      render: (text) => text || "--",
      ...getColumnSearchProps("eventCode", "事件Code")
    },
    {
      title: "事件类型",
      dataIndex: "eventType",
      key: "eventType",
      render: (text) => {
        if (text === "SMS" || text === "sms") return "短信"
        if (text === "CUSTOMER_EVENT" || text === "customer_event") return "用户埋点查询"
        return text || "--"
      },
      filters: [
        { text: "短信", value: "SMS" },
        { text: "用户埋点查询", value: "CUSTOMER_EVENT" }
      ],
      filteredValue: filteredInfo.eventType || null
    },
    {
      title: "创建信息",
      dataIndex: "gmtCreated",
      key: "gmtCreated",
      sorter: true,
      defaultSortOrder: "descend",
      render: (_, record) => (
        <div>
          {record.creator || "--"}
          <br />
          {record.gmtCreated || "--"}
        </div>
      )
    },
    {
      title: "更新信息",
      dataIndex: "gmtModified",
      key: "gmtModified",
      sorter: true,
      render: (_, record) => (
        <div>
          {record.modifier || "--"}
          <br />
          {record.gmtModified || "--"}
        </div>
      )
    },
    {
      title: "操作",
      key: "action",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <div>
          <Button type="link" onClick={() => handleEditEvent(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除事件"${record.eventName}"吗？`}
            onConfirm={() => handleDeleteEvent(record)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" danger>
              删除
            </Button>
          </Popconfirm>
        </div>
      )
    }
  ]

  return (
    <div className={styles.eventContainer}>
      <div className={styles.header}>
        <div className={styles.operations}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateEvent}>
            创建事件
          </Button>
        </div>
        <div className={styles.rightButtons}>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            刷新
          </Button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <Table
          className="table-style-v2"
          rowClassName={(record, index) => {
            if (index % 2 === 0) {
              return "table-style-v2-even-row"
            } else {
              return "table-style-v2-odd-row"
            }
          }}
          columns={columns}
          dataSource={data}
          rowKey="eventId"
          scroll={{ x: 1000 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setQueryParams({
                ...queryParams,
                pageNum: page,
                pageSize
              })
            }
          }}
          loading={loading}
          onChange={handleTableChange}
        />
      </div>

      {/* 创建/编辑事件抽屉 */}
      <Drawer
        title={isEdit ? "编辑事件" : "创建事件"}
        width={500}
        open={drawerVisible}
        onClose={handleCancel}
        maskClosable={false}
        footer={
          <div style={{ textAlign: "right" }}>
            <Space>
              <Button onClick={handleCancel}>取消</Button>
              <Button type="primary" loading={submitLoading} onClick={handleSubmit}>
                确认
              </Button>
            </Space>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="eventName"
            label="事件名称"
            rules={[{ required: true, message: "请输入事件名称" }]}
          >
            <Input placeholder="请输入事件名称" />
          </Form.Item>
          <Form.Item
            name="eventCode"
            label="事件Code"
            rules={[{ required: true, message: "请输入事件Code" }]}
          >
            <Input placeholder="请输入事件Code" disabled={isEdit} />
          </Form.Item>
          <Form.Item
            name="eventType"
            label="事件类型"
            rules={[{ required: true, message: "请选择事件类型" }]}
          >
            <Select
              placeholder="请选择事件类型"
              options={[
                { value: "SMS", label: "短信" },
                { value: "CUSTOMER_EVENT", label: "用户埋点查询" }
              ]}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}
