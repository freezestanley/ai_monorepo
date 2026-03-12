import { useState, useEffect, useMemo } from "react"
import { message, Modal, Tag, Tooltip, Button, Space, Image, Popconfirm, Table, Badge, Switch } from "antd"
import { EyeOutlined, EditOutlined, DeleteOutlined, FileImageOutlined } from "@ant-design/icons"
import { useNavigate } from "react-router-dom"
import { InfoAPI, InfoTypeAPI, InfoDetailAPI, InfoEditAPI } from "../../api"
import { mockInfoList, mockDeleteInfo } from "../../mock/info"
import React from "react"

interface FetchDataParams {
  pageNum?: number;
  page?: number;
  pageSize?: number;
  title?: string;
}

export const useInfoDetail = () => {
  const navigate = useNavigate()

  // 状态管理
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState([])
  const [typeList, setTypeList] = useState([])
  const [activeTab, setActiveTab] = useState("all")
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    sortColumn: 'desc',
    total: 0
  })
  const [searchValue, setSearchValue] = useState("")
  const [selectedRowKeys, setSelectedRowKeys] = useState([])

  // 获取消息类别列表
  const fetchTypeList = async () => {
    try {
      // const response = await InfoDetailAPI.getList({ 
      //   title: ' ' || null,
      //   categoryNo: '' || null,
      //   publishState: ''|| null,
      //   creatorName: '' || null,
      //   pageNum: pagination.current || null,
      //   pageSize: pagination.pageSize || null,
      //   sortColumn: null,
      //   sortType: 'desc' || 'asc'
      // })
      // if (response.success) {
      //   setTypeList(response.data.list || [])
      // }
    } catch (error) {
      console.error("获取类别列表失败:", error)
    }
  }

  // 获取消息列表
  const fetchData = async (params: FetchDataParams = {}) => {
    setLoading(true)
    try {
      const queryParams = {
        pageNum: params?.pageNum || params?.page || pagination.current,
        pageSize: params?.pageSize || pagination.pageSize,
        title: params?.title !== undefined ? params?.title : searchValue,
        typeId: activeTab === "all" ? undefined : activeTab,
      }
      const response = await InfoDetailAPI.getList(queryParams)
      // const response = mockInfoList

      if (response.success) {
        setDataSource(response.data.data || [])
        setPagination((prev) => ({
          ...prev,
          total: response.data.totalCount || 0,
          current: response.data.pageNum || 1
        }))
      } else {
        message.error(response.message)
      }
    } catch (error) {
      message.error("获取数据失败")
    } finally {
      setLoading(false)
    }
  }

  // 搜索处理
  const handleSearch = (value: string) => {
    setSearchValue(value)
    setPagination((prev) => ({ ...prev, current: 1 }))
    fetchData({ pageNum: 1, title: value })
  }

  // 分页变化处理
  const handleTableChange = (paginationConfig: any) => {
    setPagination((prev) => ({
      ...prev,
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize
    }))

    fetchData({
      page: paginationConfig.current,
      pageSize: paginationConfig.pageSize
    })
  }

  // 切换tab处理
  const handleTabChange = (key: string) => {
    setActiveTab(key)
    setPagination((prev) => ({ ...prev, current: 1 }))
    setSelectedRowKeys([])
  }

  // 操作处理函数
  const handleView = (record: any) => {
    navigate(`/infocenter/detail/${record.newsNo}`, {
      state: { record }
    })
  }

  const handleEdit = (record: any) => {
    navigate(`/infocenter/edit/${record.newsNo}`, {
      state: { record, mode: "edit" }
    })
  }

  const handleAdd = () => {
    navigate("/infocenter/createnews/", {
      state: { mode: "create", typeId: activeTab === "all" ? undefined : activeTab }
    })
  }

  const handleDelete = async (newsNo: any) => {
    try {
      const response = await InfoAPI.delete(newsNo)
      // const response = mockDeleteInfo
      if (response?.success) {
        message.success("删除成功")
        fetchData()
      }
    } catch (error) {
      message.error("删除失败")
    }
  }

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("请选择要删除的消息")
      return
    }

    Modal.confirm({
      title: "确认删除",
      content: `确定要删除选中的 ${selectedRowKeys.length} 条消息吗？`,
      onOk: async () => {
        try {
          const response = await InfoAPI.batchDelete(selectedRowKeys)
          if (response.success) {
            message.success("批量删除成功")
            setSelectedRowKeys([])
            fetchData()
          }
        } catch (error) {
          message.error("批量删除失败")
        }
      }
    })
  }

  // 工具函数
  const getStatusTag = (status: any) => {
    const statusMap = {
      wait: { color: "orange", text: "待发布", className: "status-draft" },
      publish: { color: "green", text: "已发布", className: "status-published" },
      down: { color: "blue", text: "已下线", className: "status-pending" },
      // 3: { color: "red", text: "已下线", className: "status-offline" }
    }
    const config = statusMap[status] || statusMap[0]
    return React.createElement(Tag, {
      color: config.color,
      className: config.className
    }, config.text)
  }

  const getTypeName = (typeId: any) => {
    const type = typeList.find((item: any) => item.id === typeId)
    return type ? type.name : "未知类别"
  }
  const SwitchChangeHandle = async (checked: boolean, record:any) => {
    setLoading(true)
    try {
      const data = {
        title: record?.title,
        newsNo: record?.newsNo,
        summary: record?.summary,
        cover: record?.cover,
        content: record?.content,
        categoryNo: record?.categoryNo,
        publishStateEdit: checked ? 'publish' : 'wait',
      }
      const response = await InfoEditAPI.publish(data)
      if (response?.success) {
        fetchData()
      } else {
        message.error(response?.message)
      }
    } catch (error) {
      message.error("获取数据失败")
    } finally {
      setLoading(false)
    }
    return
  }

  // 表格列配置
  const columns = useMemo(() => [
    {
      title: "编号",
      dataIndex: "newsNo",
      key: "newsNo",
      width: 80,
      render: (newsNo: any) =>
        React.createElement("span", {
          style: { fontFamily: "monospace", color: "#666", fontSize: "12px" }
        }, `#${newsNo}`)
    },
    {
      title: "标题",
      dataIndex: "title",
      key: "title",
      width: 200,
      ellipsis: {
        showTitle: false
      },
      render: (title: any) =>
        React.createElement(Tooltip, {
          placement: "topLeft",
          title: title
        }, React.createElement("div", {
          style: { fontWeight: 500, color: "#262626", lineHeight: "20px" }
        }, title))
    },
    {
      title: "类别",
      dataIndex: "categoryName",
      key: "categoryName",
      width: 120,
      render: (categoryName: any) =>
        React.createElement(Tag, {
          color: "blue",
          style: { margin: 0 }
        }, categoryName || "未分类")
    },
    {
      title: "封面图",
      dataIndex: "cover",
      key: "cover",
      width: 100,
      align: "center",
      render: (coverImage: any) =>
        coverImage
          ? React.createElement(Image, {
              width: 50,
              height: 35,
              src: coverImage,
              style: { objectFit: "cover", borderRadius: 6 },
              fallback: "/placeholder-image.png",
              preview: {
                mask: React.createElement("div", {
                  style: { fontSize: "12px", color: "white" }
                }, "预览")
              }
            })
          : React.createElement("div", { className: "no-image" },
              React.createElement(FileImageOutlined)
            )
    },
    {
      title: "摘要",
      dataIndex: "summary",
      key: "summary",
      width: 250,
      ellipsis: {
        showTitle: false
      },
      render: (summary: any) =>
        React.createElement(Tooltip, {
          placement: "topLeft",
          title: summary
        }, React.createElement("div", {
          style: {
            color: "#666",
            fontSize: "13px",
            lineHeight: "18px",
            maxHeight: "36px",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical"
          }
        }, summary || React.createElement("span", {
          style: { fontStyle: "italic", color: "#bfbfbf" }
        }, "暂无摘要")))
    },
    {
      title: "状态",
      dataIndex: "publishState",
      key: "publishState",
      width: 100,
      align: "center",
      render: getStatusTag,
      // filters: [
      //   { text: "待发布", value: 0 },
      //   { text: "已发布", value: 1 },
      //   { text: "待审核", value: 2 },
      //   { text: "已下线", value: 3 }
      // ]
    },
    {
      title: "发布时间",
      dataIndex: "publishTime",
      key: "publishTime",
      width: 160,
      render: (publishTime: any) =>
        publishTime
          ? React.createElement("div", {
              style: { fontSize: "13px", color: "#666" }
            }, publishTime)
          : React.createElement("span", {
              style: { color: "#bfbfbf", fontStyle: "italic" }
            }, "未发布")
    },
    {
      title: "创建人名称",
      dataIndex: "creator",
      key: "creator",
      width: 160,
      render: (creator: any) =>
        React.createElement("div", {
          // style: { fontSize: "13px", color: "#666" }
        }, creator)
    },
    {
      title: "创建时间",
      dataIndex: "gmtCreated",
      key: "gmtCreated",
      width: 160,
      render: (gmtCreated: any) =>
        React.createElement("div", {
          style: { fontSize: "13px", color: "#666" }
        }, gmtCreated)
    },
    {
      title: "更新时间",
      dataIndex: "gmtModified",
      key: "gmtModified",
      width: 160,
      render: (gmtModified: any) =>
        React.createElement("div", {
          style: { fontSize: "13px", color: "#666" }
        }, gmtModified)
    },
    {
      title: "操作",
      key: "action",
      width: 180,
      fixed: "right",
      render: (_: any, record: any) =>
        React.createElement(Space, { size: 4 },
          // React.createElement(Tooltip, { title: "查看详情" },
          //   React.createElement(Button, {
          //     type: "link",
          //     size: "small",
          //     icon: React.createElement(EyeOutlined),
          //     onClick: () => handleView(record),
          //     style: { padding: "4px 8px" }
          //   })
          // ),
          React.createElement(Switch, { 
            title: "发布上线", 
            size: 'small', 
            defaultChecked: false, 
            checked: record?.publishState === 'publish',
            onChange: (checked,event) =>SwitchChangeHandle(checked,record), 
          }),
          React.createElement(Tooltip, { title: "编辑新闻" },
            React.createElement(Button, {
              type: "link",
              size: "small",
              icon: React.createElement(EditOutlined),
              onClick: () => handleEdit(record),
              style: { padding: "4px 8px" }
            })
          ),
          React.createElement(Popconfirm, {
            title: "删除确认",
            description: "确定要删除这条新闻吗？删除后无法恢复。",
            onConfirm: () => handleDelete(record.newsNo),
            okText: "确定删除",
            cancelText: "取消",
            okButtonProps: { danger: true }
          },
            React.createElement(Tooltip, { title: "删除新闻" },
              React.createElement(Button, {
                type: "link",
                size: "small",
                danger: true,
                icon: React.createElement(DeleteOutlined),
                style: { padding: "4px 8px" }
              })
            )
          )
        )
    }
  ], [typeList])

  // Tabs配置
  const tabItems = useMemo(() => {
    const allCount = dataSource.length
    const baseItems = [
      {
        key: "all",
        label: React.createElement("span", { className: "tab-label" }, [
          "全部新闻",
          React.createElement(Badge, {
            key: "badge",
            count: allCount,
            size: "small",
            style: {
              backgroundColor: "#52c41a",
              marginLeft: "8px"
            }
          })
        ]),
        children: null
      }
    ]

    const typeItems = typeList.map((type: any) => {
      const typeCount = dataSource.filter((item: any) => item.categoryId === type.id).length
      return {
        key: type.id.toString(),
        label: React.createElement("span", { className: "tab-label" }, [
          type.name,
          typeCount > 0 && React.createElement(Badge, {
            key: "badge",
            count: typeCount,
            size: "small",
            style: {
              backgroundColor: "#1890ff",
              marginLeft: "8px"
            }
          })
        ]),
        children: null
      }
    })

    return [...baseItems, ...typeItems]
  }, [typeList, dataSource])

  // 行选择配置
  const rowSelection = useMemo(() => ({
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE
    ]
  }), [selectedRowKeys])

  // 初始化数据
  useEffect(() => {
    fetchTypeList()
  }, [])

  useEffect(() => {
    fetchData()
  }, [activeTab])

  return {
    // 数据状态
    loading,
    dataSource,
    typeList,
    activeTab,
    pagination,
    searchValue,
    selectedRowKeys,

    // 配置项
    columns,
    tabItems,
    rowSelection,

    // 处理函数
    handleSearch,
    handleTableChange,
    handleTabChange,
    handleView,
    handleEdit,
    handleAdd,
    handleDelete,
    handleBatchDelete,

    // 工具函数
    getStatusTag,
    getTypeName,

    // 数据获取函数
    fetchData,
    fetchTypeList
  }
}