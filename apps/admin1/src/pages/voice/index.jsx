import React, { useState, useEffect } from "react"
import {
  Table,
  Button,
  Switch,
  Space,
  Popconfirm,
  message,
  Input,
  Select,
  Popover,
  Tag
} from "antd"
import { PlusOutlined, SearchOutlined } from "@ant-design/icons"
import { useNavigate, useLocation } from "react-router-dom"
import queryString from "query-string"
import CreateVoiceModal from "./components/CreateVoiceModal"
import {
  useGetVoiceAgentList,
  useCreateOrUpdateVoiceAgent,
  useGetVoiceAgentDetail,
  useUpdateVoiceAgentStatus,
  useCopyVoiceAgent,
  useDeleteVoiceAgent
} from "@/api/voiceAgent"
import moment from "moment"

const Voice = () => {
  const [dataSource, setDataSource] = useState([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [filteredInfo, setFilteredInfo] = useState({})
  const [searchText, setSearchText] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const location = useLocation()

  // 从URL获取botNo参数
  const searchParams = queryString.parse(location.search) || {}
  const hashParams = queryString.parse(window.location.hash.split("?")[1] || "") || {}
  const botNo = searchParams.botNo || hashParams.botNo || "20250416001" // 默认值作为回退

  const [paginationParams, setPaginationParams] = useState({
    pageSize: 10,
    pageNum: 1,
    botNo: botNo
  })
  const [total, setTotal] = useState(0)
  const navigate = useNavigate()

  // 获取语音模板列表
  const {
    data: voiceAgentData,
    isLoading: isListLoading,
    refetch
  } = useGetVoiceAgentList(paginationParams)

  // API函数
  const createOrUpdateVoiceAgent = useCreateOrUpdateVoiceAgent()
  const getVoiceAgentDetail = useGetVoiceAgentDetail()
  const updateVoiceAgentStatus = useUpdateVoiceAgentStatus()
  const copyVoiceAgent = useCopyVoiceAgent()
  const deleteVoiceAgent = useDeleteVoiceAgent()

  // 当URL参数中的botNo变化时更新paginationParams
  useEffect(() => {
    setPaginationParams((prev) => ({
      ...prev,
      botNo
    }))
  }, [botNo])

  useEffect(() => {
    if (voiceAgentData?.data?.list) {
      setDataSource(voiceAgentData.data.list)
      setTotal(voiceAgentData.data.total)
    }
  }, [voiceAgentData])

  // 处理启用/禁用
  const handleStatusChange = (checked, record) => {
    // 调用后端接口更新状态
    const status = checked ? 2 : 4 // 2表示启用，4表示停用

    setIsLoading(true)
    updateVoiceAgentStatus({
      botNo,
      taskId: record.taskId,
      status
    })
      .then((res) => {
        if (res.status === 200) {
          message.success(`${checked ? "启用" : "停用"}成功`)
          refetch()
        } else {
          message.error(res.message || `${checked ? "启用" : "停用"}失败`)
          // 恢复原来的状态
          refetch()
        }
      })
      .catch((err) => {
        console.error(`${checked ? "启用" : "停用"}失败:`, err)
        message.error(`${checked ? "启用" : "停用"}失败，请稍后重试`)
        // 恢复原来的状态
        refetch()
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  // 处理删除
  const handleDelete = (record) => {
    setIsLoading(true)
    deleteVoiceAgent({
      botNo,
      taskId: record.taskId
    })
      .then((res) => {
        if (res.status === 200) {
          message.success("删除语音模板成功")
          refetch()
        } else {
          message.error(res.message || "删除语音模板失败")
        }
      })
      .catch((err) => {
        console.error("删除语音模板失败:", err)
        message.error("删除语音模板失败，请稍后重试")
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  // 处理跳转到话术页面
  const handleGoToScript = (record) => {
    navigate(`/voice/scriptManage?id=${record.taskId}&botNo=${botNo}`)
  }

  // 打开创建模板弹窗
  const showModal = () => {
    setCurrentRecord(null)
    setIsEditing(false)
    setIsModalVisible(true)
  }

  // 关闭创建模板弹窗
  const handleModalCancel = () => {
    setIsModalVisible(false)
    setCurrentRecord(null)
    setIsEditing(false)
  }

  // 处理表单提交
  const handleModalSubmit = (values) => {
    // 添加botNo参数
    const params = {
      ...values,
      botNo
    }

    // 编辑模式下确保有taskId
    if (isEditing && currentRecord && currentRecord.taskId) {
      params.taskId = currentRecord.taskId
    }

    setIsSubmitting(true)

    // 使用同一个接口处理创建和编辑
    createOrUpdateVoiceAgent(params)
      .then((res) => {
        if (res.status === 200) {
          message.success(isEditing ? "更新语音模板成功" : "创建语音模板成功")
          setIsModalVisible(false)
          setCurrentRecord(null)
          setIsEditing(false)
          // 刷新列表
          refetch()
        } else {
          message.error(res.message || (isEditing ? "更新语音模板失败" : "创建语音模板失败"))
        }
      })
      .catch((err) => {
        console.error(isEditing ? "更新语音模板失败:" : "创建语音模板失败:", err)
        message.error(isEditing ? "更新语音模板失败，请稍后重试" : "创建语音模板失败，请稍后重试")
      })
      .finally(() => {
        setIsSubmitting(false)
      })
  }

  // 处理设置按钮点击
  const handleSettings = (record) => {
    setIsLoading(true)
    getVoiceAgentDetail({
      taskId: record.taskId,
      botNo
    })
      .then((res) => {
        if (res.status === 200 && res.data) {
          // 处理时间格式
          const detail = res.data
          if (detail.allowCallTimeStart) {
            detail.allowCallTimeStart = moment(detail.allowCallTimeStart, "HH:mm")
          }
          if (detail.allowCallTimeEnd) {
            detail.allowCallTimeEnd = moment(detail.allowCallTimeEnd, "HH:mm")
          }
          // 处理开关值
          if (detail.taskProcessRateFlag !== undefined) {
            detail.taskProcessRateFlag = detail.taskProcessRateFlag === "1"
          }

          setCurrentRecord(detail)
          setIsEditing(true)
          setIsModalVisible(true)
        } else {
          message.error("获取语音模板详情失败")
        }
      })
      .catch((err) => {
        console.error("获取语音模板详情失败:", err)
        message.error("获取语音模板详情失败，请稍后重试")
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  // 处理复制
  const handleCopy = (record) => {
    setIsLoading(true)
    copyVoiceAgent({
      botNo,
      taskId: record.taskId
    })
      .then((res) => {
        if (res.status === 200) {
          message.success("复制语音模板成功")
          refetch()
        } else {
          message.error(res.message || "复制语音模板失败")
        }
      })
      .catch((err) => {
        console.error("复制语音模板失败:", err)
        message.error("复制语音模板失败，请稍后重试")
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  // 处理表格分页、排序、筛选变化
  const handleChange = (pagination, filters, sorter) => {
    setFilteredInfo(filters)

    // 处理分页
    const newPaginationParams = {
      ...paginationParams,
      pageNum: pagination.current,
      pageSize: pagination.pageSize
    }

    // 处理排序
    if (sorter.order) {
      // 有排序
      if (sorter.field === "creator") {
        newPaginationParams.orderColumn = "gmt_created"
      } else if (sorter.field === "modifier") {
        newPaginationParams.orderColumn = "gmt_modified"
      } else {
        newPaginationParams.orderColumn = sorter.field
      }
      newPaginationParams.orderType = sorter.order === "ascend" ? "asc" : "desc"
    } else {
      // 取消排序，删除排序参数
      delete newPaginationParams.orderColumn
      delete newPaginationParams.orderType
    }

    setPaginationParams(newPaginationParams)
  }

  // 搜索筛选处理函数
  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm()
    setSearchText({
      ...searchText,
      [dataIndex]: selectedKeys[0]
    })
  }

  // 重置搜索
  const handleReset = (clearFilters, dataIndex) => {
    clearFilters()
    setSearchText({
      ...searchText,
      [dataIndex]: ""
    })
  }

  // 获取列搜索筛选属性
  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`搜索${dataIndex === "taskId" ? "语音模板ID" : "语音模板名称"}`}
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
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
        : "",
    filteredValue: filteredInfo[dataIndex] || null
  })

  // 表格列配置
  const columns = [
    {
      title: "模板ID",
      dataIndex: "taskId",
      key: "taskId",
      width: 100,
      ...getColumnSearchProps("taskId")
    },
    {
      title: "语音模板名称",
      dataIndex: "taskName",
      key: "taskName",
      width: 250,
      render: (text, record) => {
        let tag = null
        if (record.flowType === 1) {
          tag = <Tag color="blue">画布</Tag>
        } else if (record.flowType === 2) {
          tag = <Tag color="magenta">剧本</Tag>
        } else if (record.flowType === 3) {
          tag = <Tag color="green">智能</Tag>
        } else {
          tag = <Tag color="default">未知</Tag>
        }

        return (
          <div>
            {tag}
            {record.taskName}
          </div>
        )
      },
      ...getColumnSearchProps("taskName")
    },
    {
      title: "创建信息",
      dataIndex: "creator",
      key: "creator",
      width: 200,
      render: (text, record) => {
        return (
          <div>
            <div>{record.creator}</div>
            <div>{record.gmtCreated}</div>
          </div>
        )
      },
      sorter: true,
      sortDirections: ["ascend", "descend", null],
      sortOrder:
        paginationParams.orderColumn === "gmt_created" &&
        (paginationParams.orderType === "asc" ? "ascend" : "descend")
    },
    {
      title: "更新信息",
      dataIndex: "modifier",
      key: "modifier",
      width: 200,
      render: (text, record) => {
        return (
          <div>
            <div>{record.modifier}</div>
            <div>{record.gmtModified}</div>
          </div>
        )
      },
      sorter: true,
      sortDirections: ["ascend", "descend", null],
      sortOrder:
        paginationParams.orderColumn === "gmt_modified" &&
        (paginationParams.orderType === "asc" ? "ascend" : "descend")
    },
    {
      title: "是否启用",
      dataIndex: "status",
      key: "status",
      width: 150,
      filters: [
        { text: "启用", value: "2" },
        { text: "停用", value: "4" }
      ],
      filteredValue: filteredInfo.status || null,
      onFilter: (value, record) => record.status.toString() === value,
      render: (status, record) => (
        <Popconfirm
          title={`确定要${status === 2 ? "停用" : "启用"}该语音模板吗？`}
          onConfirm={() => handleStatusChange(status !== 2, record)}
          okText="确定"
          cancelText="取消"
        >
          <Switch
            checked={status === 2}
            checkedChildren="启用"
            unCheckedChildren="停用"
            style={{
              backgroundColor: status === 2 ? "#1FC16B" : "#D0D5DD"
            }}
          />
        </Popconfirm>
      )
    },
    {
      title: "操作",
      key: "action",
      fixed: "right",
      width: 250,
      render: (_, record) => (
        <div className="flex items-center gap-1">
          <Button
            type="link"
            onClick={() => {
              // if (record?.taskId === 210) {
              //   navigate(
              //     `/voice/canvas?id=${record.taskId}&botNo=${botNo}&taskName=${encodeURIComponent(record.taskName)}&status=${record.status}&flowType=${2}`
              //   )
              // } else {
              //   navigate(
              //     `/voice/canvas?id=${record.taskId}&botNo=${botNo}&taskName=${encodeURIComponent(record.taskName)}&status=${record.status}&flowType=${record.flowType || 1}`
              //   )
              // }
              navigate(
                `/voice/canvas?id=${record.taskId}&botNo=${botNo}&taskName=${encodeURIComponent(record.taskName)}&status=${record.status}&flowType=${record.flowType || 1}`
              )
            }}
          >
            画布
          </Button>
          <Button type="link" onClick={() => handleGoToScript(record)}>
            话术
          </Button>
          <Button type="link" onClick={() => handleSettings(record)}>
            设置
          </Button>
          <Popconfirm
            title="确定复制该语音模板吗？"
            onConfirm={() => handleCopy(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link">复制</Button>
          </Popconfirm>
          <Popconfirm
            title="确定要删除这条记录吗？"
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link">删除</Button>
          </Popconfirm>
        </div>
      )
    }
  ]

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between" }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
          创建语音模板
        </Button>
      </div>
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
        dataSource={dataSource}
        rowKey="taskId"
        onChange={handleChange}
        scroll={{ y: "calc(100vh - 220px)", x: 900 }}
        pagination={{
          current: paginationParams.pageNum,
          pageSize: paginationParams.pageSize,
          total: total,
          showTotal: (total) => `共 ${total} 条`,
          showSizeChanger: true,
          showQuickJumper: true
        }}
        loading={isListLoading || isLoading}
      />

      {/* 创建/编辑语音模板弹窗 */}
      <CreateVoiceModal
        visible={isModalVisible}
        onCancel={handleModalCancel}
        onSubmit={handleModalSubmit}
        loading={isSubmitting}
        record={currentRecord}
        isEditing={isEditing}
      />
    </div>
  )
}

export default Voice
