import { useEffect, useState, useRef } from "react"
import { Button, Switch, Table, Tag, Popconfirm, Space, Input, Tooltip, Typography } from "antd"
import classNames from "classnames"
import { SearchOutlined } from "@ant-design/icons"
import { useLocation, useNavigate } from "react-router-dom"
import queryString from "query-string"
import {
  useGetPublishConfig,
  useFetchPublishOrderList,
  useOpenPublishConfig,
  useClosePublishConfig,
  useStopPublishOrder
} from "@/api/versionRelease"
import ReleaseNotesModal from "./ReleaseNotesModal"
import PublishProgressModal from "./PublishProgressModal"
import CreateVersionModal from "./CreateVersionModal"
import styles from "./index.module.less"

const NODE_OPTIONS = [
  { text: "创建发布单", value: "PRD_DEV_CREATE" },
  { text: "DEV开发", value: "PRD_DEV_DEPLOY" },
  { text: "PRE测试", value: "PRD_PRE_DEPLOY" },
  { text: "PRD灰度验证", value: "PRD_GRAYSCALE_DEPLOY" },
  { text: "PRD生产", value: "PRD_DEPLOY" }
]

const STATUS_OPTIONS = [
  { text: "待发布", value: "PENDING_EXECUTION", color: "blue" },
  { text: "发布中", value: "EXECUTING", color: "yellow" },
  { text: "成功", value: "SUCCESS", color: "green" },
  { text: "失败", value: "FAILED", color: "red" },
  { text: "终止", value: "STOP", color: "default" },
  { text: "关闭", value: "CLOSED", color: "default" }
]

const VersionRelease = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { search } = location
  const { botNo, parentOrigin, studioenv } = queryString.parse(search) || {}

  const [queryParams, setQueryParams] = useState({
    botNo,
    pageSize: 10,
    pageNum: 1
  })
  const [isNotesModalVisible, setIsNotesModalVisible] = useState(false)
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)
  const isInitRef = useRef(false)

  const { data: publishConfigData } = useGetPublishConfig({
    targetType: "BOT",
    targetId: botNo
  })

  const { data, isLoading } = useFetchPublishOrderList({
    targetIds: [botNo],
    ...queryParams
  })

  const { mutate: openPublishConfig, isLoading: openPublishConfigLoading } = useOpenPublishConfig()
  const { mutate: closePublishConfig, isLoading: closePublishConfigLoading } =
    useClosePublishConfig()
  const { mutate: stopPublishOrder, isLoading: stopPublishOrderLoading } = useStopPublishOrder()

  const switchVersionRelease = (checked) => {
    const api = checked ? openPublishConfig : closePublishConfig
    api(
      {
        targetType: "BOT",
        targetId: botNo
      },
      {
        onSuccess: (res) => {
          res.success && setIsNotesModalVisible(false)
        }
      }
    )
  }

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
      title: "发布单编号",
      dataIndex: "publishOrderId",
      key: "publishOrderId",
      width: 150,
      ...getColumnSearchProps("publishOrderId", "发布单编号")
    },
    {
      title: "发布单名称",
      dataIndex: "publishOrderName",
      key: "publishOrderName",
      width: 150,
      ...getColumnSearchProps("publishOrderName", "发布单名称")
    },
    {
      title: "备注",
      dataIndex: "description",
      key: "description",
      width: 250,
      render: (text) => (
        <Typography.Paragraph ellipsis={{ rows: 2, tooltip: text }}>
          {text || "-"}
        </Typography.Paragraph>
      ),
      ...getColumnSearchProps("description", "备注")
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
      title: "阶段",
      dataIndex: "currentNode",
      key: "currentNode",
      width: 120,
      filters: NODE_OPTIONS,
      onFilter: (value, record) => record.currentNode === value,
      render: (text, record) => record.currentNodeName
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (text) =>
        !!text && (
          <Tag
            className={classNames(
              styles.tag,
              styles[
                `tag-${STATUS_OPTIONS.find((item) => item.value === text)?.color || "default"}`
              ]
            )}
          >
            {STATUS_OPTIONS.find((item) => item.value === text)?.text}
          </Tag>
        ),
      filters: STATUS_OPTIONS,
      onFilter: (value, record) => record.status === value
    },
    {
      title: "操作",
      key: "action",
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <Space size={16}>
          <Button
            type="link"
            className="!p-0"
            onClick={() =>
              navigate(
                `/versionRelease/detail/${record.publishOrderId}?botNo=${botNo}&parentOrigin=${parentOrigin}&studioenv=${studioenv || ""}`
              )
            }
          >
            查看
          </Button>
          {!["STOP", "CLOSED"].includes(record.status) &&
            !(record.status === "SUCCESS" && record.currentNode === "PRD_DEPLOY") && (
              <Popconfirm
                title="确定【终止】该发布单？"
                description="终止后相关物料将被释放"
                onConfirm={() =>
                  stopPublishOrder({
                    publishOrderId: record.publishOrderId
                  })
                }
                okButtonProps={{
                  loading: stopPublishOrderLoading
                }}
                okText="确认"
                cancelText="取消"
              >
                <Button className="!p-0" type="link">
                  终止
                </Button>
              </Popconfirm>
            )}
        </Space>
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
    if (filters.currentNode?.length > 0) {
      newParams.currentNodeList = filters.currentNode
    } else {
      delete newParams.currentNodeList
    }
    if (filters.status?.length > 0) {
      newParams.statusList = filters.status
    } else {
      delete newParams.statusList
    }
    setQueryParams(newParams)
  }

  useEffect(() => {
    if (!publishConfigData?.data?.publishMode) return
    if (
      publishConfigData?.data?.publishMode !== "STANDARD" &&
      publishConfigData?.data?.afterVersion?.dataSyncTaskStatus !== "READY"
    ) {
      !isInitRef.current && setIsNotesModalVisible(true)
    }
    isInitRef.current = true
  }, [
    publishConfigData?.data?.publishMode,
    publishConfigData?.data?.afterVersion?.dataSyncTaskStatus
  ])

  return (
    <div className="admin-container">
      <div className="admin-header" style={{ display: "block" }}>
        <div className="flex items-center w-full mb-2">
          <h2 className="flex items-center">版本发布</h2>
        </div>
      </div>
      <div className="flex items-center justify-between w-full mb-[8px]">
        <Button
          type={publishConfigData?.data?.publishMode !== "STANDARD" ? "default" : "primary"}
          icon={<span className="iconfont icon-chuangjian" />}
          disabled={publishConfigData?.data?.publishMode !== "STANDARD"}
          onClick={() => setIsCreateModalVisible(true)}
        >
          创建
        </Button>
        <div className="flex items-center">
          <span className="flex items-center text-[14px] text-[#181B25] font-[400] mr-[8px]">
            开启版本发布
            <Tooltip
              title={
                <>
                  开启后，当前空间Agent/工作流等
                  <br />
                  能力需要通过“发布”完成上线
                </>
              }
            >
              <i className="ml-[4px] iconfont icon-Info text-[#D0D5DD] text-[16px]" />
            </Tooltip>
          </span>
          <Tooltip
            title="点击开启版本发布"
            {...(publishConfigData?.data?.publishMode === "STANDARD" ? { open: false } : {})}
          >
            <Popconfirm
              title={
                publishConfigData?.data?.publishMode === "STANDARD"
                  ? "【关闭】后，将停用发版发布"
                  : "【开启】后，将启用发版发布"
              }
              onConfirm={() =>
                switchVersionRelease(publishConfigData?.data?.publishMode !== "STANDARD")
              }
            >
              <Switch
                size="small"
                loading={openPublishConfigLoading || closePublishConfigLoading}
                checked={publishConfigData?.data?.publishMode === "STANDARD"}
              />
            </Popconfirm>
          </Tooltip>
        </div>
      </div>
      <Table
        className={classNames("table-style-v2", {
          [styles["table-disbaled"]]: publishConfigData?.data?.publishMode !== "STANDARD"
        })}
        rowClassName={(record, index) =>
          index % 2 === 0 ? "table-style-v2-even-row" : "table-style-v2-odd-row"
        }
        columns={columns}
        dataSource={data?.data?.data || []}
        rowKey="publishOrderId"
        scroll={{ x: "max-content" }}
        loading={isLoading}
        onChange={handleTableChange}
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
      <CreateVersionModal
        botNo={botNo}
        parentOrigin={parentOrigin}
        studioenv={studioenv}
        visible={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
      />
      <ReleaseNotesModal
        visible={isNotesModalVisible}
        onCancel={() => setIsNotesModalVisible(false)}
        onSubmit={() => switchVersionRelease(true)}
        loading={openPublishConfigLoading || closePublishConfigLoading}
      />
      {publishConfigData?.data?.afterVersion?.dataSyncTaskStatus === "READY" && (
        <PublishProgressModal
          visible
          isCompleted={publishConfigData?.data?.afterVersion?.dataSyncTaskStatus !== "READY"}
        />
      )}
    </div>
  )
}

export default VersionRelease
