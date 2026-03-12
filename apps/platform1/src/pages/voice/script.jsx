// 话术管理
import { useState, useEffect } from "react"
import {
  Table,
  Button,
  Space,
  message,
  Input,
  Tooltip,
  Modal,
  Tag,
  Popconfirm,
  Dropdown,
  Upload,
  Select
} from "antd"
import {
  SearchOutlined,
  PlusOutlined,
  UploadOutlined,
  DownloadOutlined,
  ReloadOutlined,
  EditOutlined,
  MoreOutlined,
  DownOutlined
} from "@ant-design/icons"
import styles from "./script.module.scss"
import { useGetScriptListByPage } from "@/api/voiceAgent/index"
import {
  deleteScript,
  exportScripts,
  downloadScriptTemplate,
  importScripts,
  getTagConfigList,
  checkImportScript
} from "@/api/voiceAgent/api"
import { useLocation } from "react-router-dom"
import ScriptDrawer from "./components/ScriptDrawer"
import DuplicateScriptModal from "./components/DuplicateScriptModal"

export default function Script() {
  // 获取URL查询参数
  const location = useLocation()
  const queryString = new URLSearchParams(location.search)
  const botNoFromUrl = queryString.get("botNo")
  const isOpenEdit = queryString.get("isOpenEdit")

  // 状态定义

  // 新增/编辑话术状态
  const [scriptDrawerVisible, setScriptDrawerVisible] = useState(false)
  const [scriptModalType, setScriptModalType] = useState("add") // 'add' 或 'edit'
  const [currentScript, setCurrentScript] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // 导入相关状态
  const [importModalVisible, setImportModalVisible] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fileList, setFileList] = useState([])

  // 重复话术检查相关状态
  const [duplicateModalVisible, setDuplicateModalVisible] = useState(false)
  const [duplicateList, setDuplicateList] = useState([])
  const [ignoreList, setIgnoreList] = useState([])
  const [currentUploadFile, setCurrentUploadFile] = useState(null)

  // 业务分类和标签选项状态
  const [scriptTypeOptions, setScriptTypeOptions] = useState([])
  const [scriptTagOptions, setScriptTagOptions] = useState([])
  const [scriptTypeLoading, setScriptTypeLoading] = useState(false)
  const [scriptTagLoading, setScriptTagLoading] = useState(false)

  // 分页和搜索参数
  const [queryParams, setQueryParams] = useState({
    botNo: botNoFromUrl || "", // 从URL获取botNo
    pageSize: 10,
    pageNum: 1,
    orderColumn: "gmt_created",
    orderType: "desc"
  })

  // 当URL中的botNo变化时更新查询参数并加载选项数据
  useEffect(() => {
    if (botNoFromUrl) {
      setQueryParams((prev) => ({
        ...prev,
        botNo: botNoFromUrl
      }))
      // 加载业务分类和标签选项
      loadScriptTypeList()
      loadScriptTagList()

      // if (isOpenEdit === "true") {
      //   setScriptDrawerVisible(true)
      // }
    } else {
      message.error("缺少必要参数botNo，请检查URL")
    }
  }, [botNoFromUrl])

  // 获取业务分类列表
  const loadScriptTypeList = async () => {
    if (!botNoFromUrl) return
    try {
      setScriptTypeLoading(true)
      const res = await getTagConfigList({
        botNo: botNoFromUrl,
        type: 1
      })

      if (res && res.status === 200 && res.data) {
        const options = res.data.map((item) => ({
          label: item.name,
          value: item.id // 使用id作为筛选值
        }))
        setScriptTypeOptions(options)
      }
    } catch (error) {
      console.error("获取业务类型列表失败:", error)
    } finally {
      setScriptTypeLoading(false)
    }
  }

  // 获取标签列表
  const loadScriptTagList = async () => {
    if (!botNoFromUrl) return
    try {
      setScriptTagLoading(true)
      const res = await getTagConfigList({
        botNo: botNoFromUrl,
        type: 2
      })

      if (res && res.status === 200 && res.data) {
        const options = res.data.map((item) => ({
          label: item.name,
          value: item.id // 使用id作为筛选值
        }))
        setScriptTagOptions(options)
      }
    } catch (error) {
      console.error("获取标签列表失败:", error)
    } finally {
      setScriptTagLoading(false)
    }
  }

  // 使用自定义钩子获取话术列表数据
  const { data, isLoading, refetch } = useGetScriptListByPage(queryParams, {
    enabled: !!botNoFromUrl // 只有当有botNo时才发起请求
  })

  const dataSource = data?.data?.list || []
  const total = data?.data?.total || 0

  // 表格列定义
  const columns = [
    {
      title: "话术ID",
      dataIndex: "id",
      key: "id",
      width: 100,
      ...getColumnSearchProps("scriptId", "话术ID")
    },
    {
      title: "话术code",
      dataIndex: "code",
      key: "code",
      width: 180,
      render: (text) => text || "--",
      ...getColumnSearchProps("code", "话术名称")
    },
    {
      title: "话术名称",
      dataIndex: "name",
      key: "name",
      width: 180,
      render: (text) => text || "--",
      ...getColumnSearchProps("name", "话术名称")
    },

    {
      title: "业务分类",
      dataIndex: "scriptTypeName",
      key: "scriptTypeName",
      width: 120,
      render: (text) => text || "--",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
        <div className="p-2 w-64">
          <Space className="mb-2 w-full justify-between">
            <Space>
              <Button
                type="primary"
                onClick={() => {
                  confirm()
                  handleSearch(selectedKeys, confirm, "scriptTypeName")
                }}
                icon={<SearchOutlined />}
                size="small"
                className="w-20"
              >
                搜索
              </Button>
              <Button
                onClick={() => {
                  clearFilters()
                  confirm({ closeDropdown: false })
                  handleReset(clearFilters, "scriptTypeName")
                }}
                size="small"
                className="w-20"
              >
                重置
              </Button>
            </Space>
            <Button size="small" type="link" onClick={close} className="!border-0 !p-0">
              关闭
            </Button>
          </Space>
          <Select
            placeholder="请选择业务分类"
            value={selectedKeys[0]}
            onChange={(value) => setSelectedKeys(value ? [value] : [])}
            onPressEnter={() => confirm()}
            className="w-full"
            allowClear
            showSearch
            loading={scriptTypeLoading}
            filterOption={(input, option) =>
              option?.label?.toLowerCase().includes(input.toLowerCase())
            }
            options={scriptTypeOptions}
          />
        </div>
      ),
      filterIcon: (filtered) => (
        <SearchOutlined style={{ color: filtered ? "#7f56d9" : undefined }} />
      ),
      onFilterDropdownOpenChange: (visible) => {
        if (visible) {
          // 每次展开时重新加载业务分类数据
          loadScriptTypeList()
        }
      }
    },
    {
      title: "标签",
      dataIndex: "scriptTagNames",
      key: "scriptTagNames",
      width: 150,
      render: (tags) => {
        if (!tags || !Array.isArray(tags) || tags.length === 0) {
          return "--"
        }
        return (
          <Tooltip
            title={<span className="whitespace-pre-line">{tags.join("\n")}</span>}
            className="overflow-hidden block"
          >
            {tags.map((tag, index) => (
              <Tag
                key={index}
                color="blue"
                style={{ marginBottom: 4 }}
                className="whitespace-pre-line inline-block"
              >
                {tag}
              </Tag>
            ))}
          </Tooltip>
        )
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
        <div className="p-2 w-64">
          <Space className="w-full mb-2 justify-between">
            <Space>
              <Button
                type="primary"
                onClick={() => {
                  confirm()
                  handleSearch(selectedKeys, confirm, "scriptTagNames")
                }}
                icon={<SearchOutlined />}
                size="small"
                className="w-20"
              >
                搜索
              </Button>
              <Button
                onClick={() => {
                  clearFilters()
                  confirm({ closeDropdown: false })
                  handleReset(clearFilters, "scriptTagNames")
                }}
                size="small"
                className="w-20"
              >
                重置
              </Button>
            </Space>
            <Button size="small" type="link" onClick={close} className="!border-0 !p-0">
              关闭
            </Button>
          </Space>
          <Select
            mode="multiple"
            placeholder="请选择标签"
            value={selectedKeys}
            onChange={(value) => setSelectedKeys(value || [])}
            onPressEnter={() => confirm()}
            className="w-full"
            allowClear
            showSearch
            loading={scriptTagLoading}
            filterOption={(input, option) =>
              option?.label?.toLowerCase().includes(input.toLowerCase())
            }
            options={scriptTagOptions}
          />
        </div>
      ),
      filterIcon: (filtered) => (
        <SearchOutlined style={{ color: filtered ? "#7f56d9" : undefined }} />
      ),
      onFilterDropdownOpenChange: (visible) => {
        if (visible) {
          // 每次展开时重新加载标签数据
          loadScriptTagList()
        }
      },
      onFilter: (value, record) => {
        if (!record.scriptTagNames || !Array.isArray(record.scriptTagNames)) {
          return false
        }
        // 由于 value 现在是 ID，需要根据 ID 匹配标签
        const tagOption = scriptTagOptions.find((option) => option.value === value)
        if (!tagOption) return false

        return record.scriptTagNames.some((tag) =>
          tag.toString().toLowerCase().includes(tagOption.label.toLowerCase())
        )
      }
    },
    {
      title: "是否有变量",
      dataIndex: "variable",
      key: "variable",
      width: 120,
      render: (variable) => (
        <Tag color={variable === 1 ? "green" : "red"}>{variable === 1 ? "有" : "无"}</Tag>
      ),
      filters: [
        { text: "有", value: 1 },
        { text: "无", value: 0 }
      ],
      onFilter: (value, record) => record.variable === value
    },
    {
      title: "话术文案",
      dataIndex: "content",
      key: "content",
      width: 300,
      render: (text) => (
        <Tooltip title={text}>
          <div className={styles.ellipsisText}>{text}</div>
        </Tooltip>
      ),
      ...getColumnSearchProps("content", "话术文案")
    },
    {
      title: "创建信息",
      dataIndex: "gmtCreated",
      key: "gmtCreated",
      width: 200,
      sorter: true, // 添加排序功能
      defaultSortOrder: "descend", // 默认降序排列（最新的在前）
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
      width: 200,
      sorter: true, // 添加排序功能
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
          <Button type="link" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="是否删除该条数据？"
            onConfirm={() => handleDelete(record)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link">删除</Button>
          </Popconfirm>
        </div>
      )
    }
  ]

  // 搜索字段处理函数
  function getColumnSearchProps(dataIndex, placeholder) {
    return {
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
        <div style={{ padding: 8 }}>
          <Space className="w-full mb-[8px] justify-between">
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
            </Space>
            <Button size="small" type="link" onClick={close} className="!border-0 !p-0">
              关闭
            </Button>
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
      onFilterDropdownOpenChange: (visible) => {
        if (visible) {
          setTimeout(() => {
            document.querySelector("input")?.focus()
          }, 100)
        }
      }
    }
  }

  // 搜索处理函数
  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm()

    // 更新查询参数
    const newParams = {
      ...queryParams,
      pageNum: 1 // 重置到第一页
    }

    // 处理业务分类筛选参数名映射
    if (dataIndex === "scriptTypeName") {
      newParams.scriptType = selectedKeys[0] // 后端期望的参数名是scriptType
    } else if (dataIndex === "scriptTagNames") {
      newParams.scriptTags = selectedKeys // 后端期望的参数名是scriptTags，传递数组
    } else {
      newParams[dataIndex] = selectedKeys[0]
    }

    setQueryParams(newParams)
  }

  // 重置搜索
  const handleReset = (clearFilters, confirm, dataIndex) => {
    clearFilters()

    // 重置特定字段的查询参数
    const newParams = { ...queryParams }

    // 处理业务分类和标签筛选参数名映射
    if (dataIndex === "scriptTypeName") {
      delete newParams.scriptType // 删除后端对应的参数名
    } else if (dataIndex === "scriptTagNames") {
      delete newParams.scriptTags // 删除后端对应的参数名
    } else {
      delete newParams[dataIndex]
    }
    confirm({ closeDropdown: false })
    setQueryParams(newParams)
  }

  // 表格分页变化处理
  const handleTableChange = (pagination, filters, sorter) => {
    const newParams = {
      ...queryParams,
      pageNum: pagination.current,
      pageSize: pagination.pageSize
    }

    // 处理排序
    if (sorter.field && sorter.order) {
      // 根据排序字段设置对应的接口参数
      if (sorter.field === "gmtCreated") {
        newParams.orderColumn = "gmt_created" // 创建时间
      } else if (sorter.field === "gmtModified") {
        newParams.orderColumn = "gmt_modified" // 修改时间
      } else {
        newParams.orderColumn = "gmt_created" // 默认按创建时间
      }

      // 设置排序方向
      newParams.orderType = sorter.order === "ascend" ? "asc" : "desc"
    }

    // 处理筛选
    if (filters.variable && filters.variable.length > 0) {
      newParams.variable = filters.variable[0]
    } else {
      delete newParams.variable
    }

    setQueryParams(newParams)
  }

  // 处理编辑话术
  const handleEdit = (record) => {
    setScriptModalType("edit")
    setCurrentScript(record)
    setScriptDrawerVisible(true)
  }

  // 删除话术
  const handleDelete = async (record) => {
    // 检查是否有botNo
    if (!botNoFromUrl) {
      message.error("缺少必要参数botNo，无法删除")
      return
    }

    try {
      const params = {
        botNo: botNoFromUrl,
        scriptId: record.id
      }

      // 调用删除接口
      const res = await deleteScript(params)

      if (res && res.status === 200) {
        message.success("删除成功")
        // 刷新列表
        refetch()
      } else {
        message.error(res?.message || "删除失败")
      }
    } catch (error) {
      console.error("删除失败:", error)
      message.error("删除失败，请稍后重试")
    }
  }

  // 创建话术
  const handleCreate = () => {
    if (!botNoFromUrl) {
      message.error("缺少必要参数botNo，无法创建话术")
      return
    }

    setScriptModalType("add")
    setCurrentScript(null)
    setScriptDrawerVisible(true)
  }

  // 导入话术
  const handleImport = () => {
    message.info("导入话术功能待实现")
  }

  // 导出话术
  const handleExport = () => {
    message.info("导出话术功能待实现")
  }

  // 批量导入
  const handleBatchImport = () => {
    if (!botNoFromUrl) {
      message.error("缺少必要参数botNo，无法导入")
      return
    }
    setImportModalVisible(true)
  }

  // 处理文件上传 - 先检查重复
  const handleFileUpload = async () => {
    if (fileList.length === 0) {
      message.error("请选择要导入的文件")
      return
    }

    try {
      setUploading(true)

      // 先调用检查接口
      const checkFormData = new FormData()
      checkFormData.append("botNo", botNoFromUrl)
      checkFormData.append("file", fileList[0].originFileObj)

      const checkResult = await checkImportScript(checkFormData)

      // 检查是否有重复话术
      if (
        checkResult &&
        checkResult.status === 200 &&
        checkResult.data &&
        checkResult.data.length > 0
      ) {
        // 有重复话术，显示重复话术弹窗
        setDuplicateList(checkResult.data)
        setCurrentUploadFile(fileList[0].originFileObj)
        setImportModalVisible(false)
        setDuplicateModalVisible(true)
        setUploading(false)
        return
      }

      // 没有重复，直接导入
      await performImport({
        isIgnore: 0,
        ignoreList: []
      })
    } catch (error) {
      console.error("检查或导入失败:", error)
      message.error(error.message || "操作失败，请稍后重试")
      setUploading(false)
    }
  }

  // 执行实际导入操作
  const performImport = async ({ isIgnore, ignoreList }) => {
    try {
      setUploading(true)

      // 使用FormData格式，保持file字段
      const formData = new FormData()
      formData.append("botNo", botNoFromUrl)
      formData.append("file", currentUploadFile || fileList[0].originFileObj)
      formData.append("isIgnore", isIgnore)

      // 添加ignoreList为JSON字符串
      if (ignoreList && ignoreList.length > 0) {
        formData.append("ignoreList", JSON.stringify(ignoreList))
      } else {
        formData.append("ignoreList", JSON.stringify([]))
      }

      const result = await importScripts(formData)

      // 检查导入结果状态
      if (result.status === 0) {
        // status 为 0 表示失败
        throw new Error(result.data || result.message || "导入失败")
      }

      message.success("话术导入成功")
      setImportModalVisible(false)
      setDuplicateModalVisible(false)
      setFileList([])
      setDuplicateList([])
      setCurrentUploadFile(null)

      // 刷新列表
      refetch()
    } catch (error) {
      console.error("导入失败:", error)
      message.error(error.message || "导入失败，请稍后重试")
    } finally {
      setUploading(false)
    }
  }

  // 处理重复话术弹窗确认
  const handleDuplicateConfirm = (options) => {
    performImport(options)
  }

  // 处理重复话术弹窗取消
  const handleDuplicateCancel = () => {
    setDuplicateModalVisible(false)
    setDuplicateList([])
    setCurrentUploadFile(null)
    // 重新打开导入弹窗
    setImportModalVisible(true)
  }

  // 处理文件选择变化
  const handleFileChange = ({ fileList: newFileList }) => {
    setFileList(newFileList)
  }

  // 文件上传前的校验
  const beforeUpload = (file) => {
    const isExcel =
      file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.type === "application/vnd.ms-excel"
    if (!isExcel) {
      message.error("只能上传Excel文件！")
      return false
    }
    const isLt10M = file.size / 1024 / 1024 < 10
    if (!isLt10M) {
      message.error("文件大小不能超过10MB！")
      return false
    }
    return false // 阻止自动上传
  }

  // 批量导出
  const handleBatchExport = async () => {
    try {
      // 检查是否有botNo
      if (!botNoFromUrl) {
        message.error("缺少必要参数botNo，无法导出")
        return
      }

      if (total === 0) {
        message.warning("当前没有数据可以导出，请先添加话术数据")
        return
      }

      // 构建导出参数
      const exportParams = {
        botNo: botNoFromUrl,
        orderColumn: queryParams.orderColumn || "gmt_created",
        orderType: queryParams.orderType || "desc"
      }

      // 添加搜索条件到导出参数
      if (queryParams.id) exportParams.id = queryParams.id
      if (queryParams.name) exportParams.name = queryParams.name
      if (queryParams.scriptType) exportParams.scriptType = queryParams.scriptType
      if (queryParams.variable !== undefined) exportParams.variable = queryParams.variable
      if (queryParams.scriptTags) exportParams.scriptTags = queryParams.scriptTags

      message.loading("正在导出话术数据...", 0)

      const blob = await exportScripts(exportParams)
      message.destroy()

      // 创建下载链接
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `话术导出_${new Date().getTime()}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // 释放URL对象
      setTimeout(() => {
        window.URL.revokeObjectURL(link.href)
      }, 100)

      message.success("导出成功")
    } catch (error) {
      message.destroy()
      console.error("导出失败:", error)
      message.error("导出失败，请稍后重试")
    }
  }

  // 下载模版
  const handleDownloadTemplate = async () => {
    try {
      message.loading("正在下载话术模板...", 0)

      const blob = await downloadScriptTemplate()
      console.log("模板下载成功，文件大小:", blob.size, "字节")
      message.destroy()

      // 创建下载链接
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `话术导入模板_${new Date().getTime()}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // 释放URL对象
      setTimeout(() => {
        window.URL.revokeObjectURL(link.href)
      }, 100)

      message.success("模板下载成功")
    } catch (error) {
      message.destroy()
      console.error("模板下载失败:", error)
      message.error(error.message || "模板下载失败，请稍后重试")
    }
  }

  // 下拉菜单项
  const dropdownItems = [
    {
      key: "batchImport",
      label: "批量导入",
      icon: <UploadOutlined />,
      onClick: handleBatchImport
    },
    {
      key: "batchExport",
      label: "批量导出",
      icon: <DownloadOutlined />,
      onClick: handleBatchExport
    },
    {
      key: "downloadTemplate",
      label: "下载模版",
      icon: <DownloadOutlined />,
      onClick: handleDownloadTemplate
    }
  ]

  return (
    <div className={styles.scriptContainer}>
      <div className={styles.header}>
        <div className={styles.leftButtons}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            创建话术
          </Button>
          <Dropdown
            menu={{ items: dropdownItems }}
            placement="bottomLeft"
            trigger={["click"]}
            open={dropdownOpen}
            onOpenChange={setDropdownOpen}
          >
            <Button>
              批量操作
              <DownOutlined
                style={{
                  marginLeft: 8,
                  transition: "transform 0.3s ease",
                  transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)"
                }}
              />
            </Button>
          </Dropdown>
        </div>
        <div className={styles.rightButtons}>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            刷新
          </Button>
        </div>
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
        rowKey="id"
        scroll={{ y: "calc(100vh - 220px)", x: 1200 }}
        loading={isLoading}
        onChange={handleTableChange}
        pagination={{
          current: queryParams.pageNum,
          pageSize: queryParams.pageSize,
          total: total,
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

      {/* 新增/编辑话术抽屉 */}
      <ScriptDrawer
        visible={scriptDrawerVisible}
        onClose={() => setScriptDrawerVisible(false)}
        modalType={scriptModalType}
        currentScript={currentScript}
        botNo={botNoFromUrl}
        onSuccess={() => {
          setScriptDrawerVisible(false)
          refetch()
        }}
      />

      {/* 导入话术Modal */}
      <Modal
        title="批量导入话术"
        open={importModalVisible}
        onOk={handleFileUpload}
        onCancel={() => {
          setImportModalVisible(false)
          setFileList([])
        }}
        confirmLoading={uploading}
        okText="开始导入"
        cancelText="取消"
        width={600}
      >
        <div className="mb-4">
          <p className="text-gray-600 mb-2">请选择要导入的Excel文件：</p>
          <Upload.Dragger
            fileList={fileList}
            onChange={handleFileChange}
            beforeUpload={beforeUpload}
            accept=".xlsx,.xls"
            maxCount={1}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">支持Excel格式文件(.xlsx, .xls)，文件大小不超过10MB</p>
          </Upload.Dragger>
        </div>
        <div className="text-sm text-gray-500">
          <p>导入说明：</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>请使用标准的话术导入模板</li>
            <li>确保Excel文件格式正确</li>
            <li>导入成功后将自动刷新话术列表</li>
          </ul>
        </div>
      </Modal>

      {/* 重复话术处理Modal */}
      <DuplicateScriptModal
        visible={duplicateModalVisible}
        duplicateList={duplicateList}
        onConfirm={handleDuplicateConfirm}
        onCancel={handleDuplicateCancel}
        loading={uploading}
      />
    </div>
  )
}
