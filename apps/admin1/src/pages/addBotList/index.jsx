import React, { useCallback, useEffect, useMemo, useState } from "react"
import {
  Table,
  Tag,
  Button,
  message,
  Pagination,
  Tooltip,
  Space,
  Input,
  Modal,
  Switch,
  Typography
} from "antd"
const { Paragraph } = Typography
import CountUp from "react-countup"
import { DeleteOutlined, EditOutlined } from "@ant-design/icons"
import {
  useFetchBotListByPage,
  useUpdateBotStatus,
  useDeleteBot,
  useFetchNamespaceList
} from "@/api/bot"
import { useNavigate } from "react-router-dom"
import OverflowTooltip from "@/components/overflowTooltip"
import "./index.scss"
import { debounce } from "lodash"
import DeleteModal from "../../components/DeleteModal/DeleteModal"
import { useAuthResources } from "@/store"
import { RESOURCE_CODE } from "@/constants/resourceCode"
import StatusSwitch from "./components/StatusSwitch"

// 2. 创建组件
export default function BotPage() {
  const navigate = useNavigate()

  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [sortAndFilterState, setSortAndFilterState] = useState({
    orderField: "",
    asc: "",
    tags: ""
  })

  const [query, setQuery] = useState("") //检索

  const [openDeleteModal, setOpenDeleteModal] = useState(false)
  const [currentItem, setCurrentItem] = useState({ botName: "", botNo: "" })
  const resourceCodeList = useAuthResources((state) => state.resourceCodeList)
  const { mutate: delBot } = useDeleteBot()
  const { data: nameSpaceList = [] } = useFetchNamespaceList()

  // 添加一个状态来存储表格高度
  const [tableHeight, setTableHeight] = useState(window.innerHeight - 300)

  // 添加窗口大小变化的监听器
  useEffect(() => {
    const handleResize = () => {
      const h = window.innerHeight - 300
      setTableHeight(h)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // debounce一下setQuesTion,返回新函数
  const debounceSetName = debounce((value) => {
    setPagination({
      current: 1,
      pageSize: 10
    })
    setQuery(value)
  }, 1000)

  // 使用查询 bots 列表的 hook
  const { isLoading, error, data } = useFetchBotListByPage({
    pageNum: pagination.current,
    pageSize: pagination.pageSize,
    namespace: sortAndFilterState.tags,
    orderField: sortAndFilterState.orderField,
    asc: sortAndFilterState.asc,
    query
  })

  // 使用更新 bot 状态的 hook
  const updateBotStatusMutation = useUpdateBotStatus()

  const handleDelete = (record) => {
    setCurrentItem(record)
    setOpenDeleteModal(true)
  }

  const confirmCallback = useCallback(async () => {
    try {
      await delBot(currentItem.botNo)
    } catch (error) {
      console.log(":===>>>  error:", error)
    }
  }, [currentItem])

  const dataSource = data ? data.botList : []

  //
  // 列表列的定义
  const columns = [
    {
      title: "空间编号",
      dataIndex: "botNo",
      width: 200,
      render: (description, { botNo }) => (
        <Space
          onClick={() => navigate(`/addBot/${botNo}`)}
          style={{ color: "#1677ff" }}
          className="cursor-pointer"
        >
          {description.length >= 20 ? (
            <OverflowTooltip text={description} width={200} />
          ) : (
            description
          )}
        </Space>
      )
    },
    {
      title: "标签",
      dataIndex: "tags",
      filterSearch: true,
      filters: nameSpaceList.map((item) => ({
        text: item.name,
        value: item.permissionGroupNo
      })),
      render: (tags) => <div>{tags.map((tag) => tag.value).join("、")}</div>
    },
    {
      title: "空间名称",
      dataIndex: "botName",
      width: 200,
      render: (botName, { botIconUrl, botNo }) => (
        <Space
          onClick={() => navigate(`/addBot/${botNo}`)}
          style={{ color: "#1677ff" }}
          className="cursor-pointer"
        >
          <img
            src={botIconUrl}
            style={{
              width: "20px",
              marginRight: "5px",
              borderRadius: "100%"
            }}
          />
          <OverflowTooltip text={botName} width={140} />
        </Space>
      )
    },
    {
      title: "说明",
      dataIndex: "description",
      width: 200,
      render: (description) => <OverflowTooltip text={description} />
    },
    {
      title: "创建信息",
      dataIndex: "gmtCreated",
      sorter: true,
      render: (gmtCreated, record) => {
        return (
          <>
            {record.creatorDisplayName}
            <br />
            {gmtCreated}
          </>
        )
      }
    },
    {
      title: "更新信息",
      dataIndex: "gmtModified",
      sorter: true,
      render: (gmtModified, record) => {
        return (
          <>
            {record.modifierDisplayName}
            <br />
            {gmtModified}
          </>
        )
      }
    },
    {
      title: "操作",
      key: Math.random(),
      width: 240,
      render: (record) => (
        <Space>
          {resourceCodeList.includes(RESOURCE_CODE.BTN_BOT_LINE) && (
            <StatusSwitch record={record} handleStatusChange={handleStatusChange} />
          )}
          {resourceCodeList.includes(RESOURCE_CODE.BTN_BOT_EDIT) && (
            <Button type="link" onClick={() => navigate(`/addBot/${record.botNo}`)}>
              编辑
            </Button>
          )}
          {resourceCodeList.includes(RESOURCE_CODE.BTN_BOT_DELETE) && (
            <Button type="link" onClick={() => handleDelete(record)}>
              删除
            </Button>
          )}
        </Space>
      )
    }
  ]
  // 状态改变的处理
  const handleStatusChange = async (record) => {
    const res = await updateBotStatusMutation.mutateAsync({
      botNo: record.botNo,
      status: record.status === 1 ? 0 : 1
    })
    return res
  }

  // 页面跳转
  const handleCreateBot = () => {
    navigate("/addBot")
  }

  const handleSortChange = (pagination, filters, sorter) => {
    // @ts-ignore
    const { order, field } = sorter
    setSortAndFilterState({
      tags: (filters?.tags || []).join(","),
      orderField:
        field === "gmtModified" ? "gmt_modified" : field === "gmtCreated" ? "gmt_created" : "",
      asc: order === "ascend" ? "true" : order === "descend" ? "false" : ""
    })
  }
  return (
    <div className="relative">
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: "20px", paddingRight: 30 }}
      >
        <Input
          placeholder="请输入空间名称/空间编号"
          className="mr-4 w-60"
          style={{ width: "260px" }}
          allowClear
          onChange={(e) => {
            if (e.target.value === "") {
              debounceSetName("")
            } else {
              debounceSetName(e.target.value.trim())
            }
          }}
        />
        {resourceCodeList.includes(RESOURCE_CODE.BTN_BOT_CREATE) && (
          <Button type="primary" icon={<EditOutlined />} onClick={handleCreateBot}>
            新建空间
          </Button>
        )}
      </div>
      <Table
        columns={columns}
        dataSource={dataSource}
        loading={isLoading}
        pagination={false}
        scroll={{ y: tableHeight }}
        onChange={handleSortChange}
      />
      <Pagination
        className="fixed-pagination w-auto"
        current={pagination.current}
        pageSize={pagination.pageSize}
        total={data ? data.totalCount : 0}
        onChange={(page, pageSize) => setPagination({ current: page, pageSize })}
        showSizeChanger={true}
        style={{ marginTop: "15px", textAlign: "right" }}
        showTotal={(total) => `共 ${total} 条`}
      />
      {data?.totalCount > 0 && (
        <Paragraph
          className="fixed-pagination fixed-pagination-pb-20px"
          style={{
            position: "absolute",
            width: 500,
            left: 0,
            bottom: "0 !important",
            padding: "6px 0 20px 20px",
            margin: "0"
          }}
        >
          当前已创建
          <CountUp end={data?.totalCount || 0} /> 个空间，
          <CountUp end={data?.enableCount || 0} />
          个空间已启用
        </Paragraph>
      )}
      <DeleteModal
        title="删除空间可能导致应用端无法使用,是否确定删除"
        desc={
          <p>
            请输入空间名称 <b style={{ color: "red" }}>{currentItem.botName} </b>以确认
          </p>
        }
        placeholder="请输入空间名称"
        confirmText={currentItem.botName}
        openDeleteModal={openDeleteModal}
        setOpenDeleteModal={setOpenDeleteModal}
        confirmCallback={confirmCallback}
      />
    </div>
  )
}
