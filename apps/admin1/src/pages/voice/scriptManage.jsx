import React, { useState, useEffect, useCallback, useRef, useMemo } from "react"
import {
  Table,
  Button,
  Space,
  Input,
  Form,
  Modal,
  message,
  Popover,
  Popconfirm,
  Select,
  Upload,
  Drawer,
  Checkbox,
  Row,
  Col,
  Tooltip,
  Tag
} from "antd"
import {
  PlusOutlined,
  UploadOutlined,
  LeftOutlined,
  SearchOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined
} from "@ant-design/icons"
import { useNavigate, useLocation } from "react-router-dom"
import styles from "./scriptManage.module.scss"
import { fetchUploadFile } from "@/api/common/api"
import {
  getScriptList,
  getScriptListByPage,
  saveSelectedScripts,
  getTimbreList,
  saveScriptType,
  deleteSelectedScript
} from "@/api/voiceAgent/api"
import mp4 from "@/assets/img/mp4.png"
import { fetchPersonalTimbreListV2 } from "@/api/timbre/api"

const ScriptManage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const taskId = queryParams.get("id")
  const botNo = queryParams.get("botNo")

  // 话术列表
  const [scriptList, setScriptList] = useState([])
  // 加载状态
  const [loading, setLoading] = useState(false)
  // 编辑中的话术
  const [editingScript, setEditingScript] = useState(null)
  // 是否显示编辑弹窗
  const [isModalVisible, setIsModalVisible] = useState(false)
  // 编辑表单
  const [form] = Form.useForm()
  // Popover相关状态
  const [popoverVisibleId, setPopoverVisibleId] = useState(null)
  const [popoverForm] = Form.useForm()
  // 文件上传状态
  const [uploadState, setUploadState] = useState({})
  // 分页配置
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  // 话术选择抽屉状态
  const [drawerVisible, setDrawerVisible] = useState(false)
  // 所有可选话术列表
  const [allScriptList, setAllScriptList] = useState([])
  // 保存所有页面中选中的话术（全局选中状态）
  const [allSelectedScripts, setAllSelectedScripts] = useState(new Set())
  // 当前页面选中的话术ID列表（用于UI显示）
  const [selectedScriptIds, setSelectedScriptIds] = useState([])
  // 话术列表加载状态
  const [scriptListLoading, setScriptListLoading] = useState(false)
  // 话术列表分页
  const [scriptListPagination, setScriptListPagination] = useState({
    pageNum: 1,
    pageSize: 10,
    total: 0
  })
  // 筛选信息状态
  const [filteredInfo, setFilteredInfo] = useState({})
  // 主列表搜索文本状态
  const [mainTableSearchText, setMainTableSearchText] = useState({})
  // 抽屉搜索文本状态
  const [drawerSearchText, setDrawerSearchText] = useState({})
  // 保存选中话术的加载状态
  const [savingSelectedScripts, setSavingSelectedScripts] = useState(false)

  // 使用 ref 来存储最新的搜索状态，避免依赖循环
  const drawerSearchTextRef = useRef(drawerSearchText)

  // 更新 ref 的值
  useEffect(() => {
    drawerSearchTextRef.current = drawerSearchText
  }, [drawerSearchText])

  // 添加一个标志来防止重复调用
  const isSearchingRef = useRef(false)

  // 添加一个标志来记录最后一次搜索的参数
  const lastSearchParamsRef = useRef(null)

  // 添加音色列表状态
  const [timbreList, setTimbreList] = useState([])
  // 音色列表加载状态
  const [timbreLoading, setTimbreLoading] = useState(false)

  // 音频播放相关状态
  const [audioPlaying, setAudioPlaying] = useState({}) // 记录每个音频的播放状态
  const audioRefs = useRef({}) // 存储音频元素的引用

  // 获取话术列表数据
  const fetchScriptList = async () => {
    if (!botNo || !taskId) {
      message.error("缺少必要参数，无法获取话术列表")
      return
    }

    try {
      setLoading(true)
      const res = await getScriptList({
        botNo,
        taskId: Number(taskId) // 确保 taskId 是数字类型
      })
      if (res && res.status === 200 && res.data) {
        // 处理数据，添加必要的显示字段
        const processedData = res.data.map((item) => ({
          id: item.taskScriptId,
          scriptId: item.scriptId,
          name: item.name || "--",
          hasVariables: item.variable === 1 ? "有" : "无",
          content: item.content,
          type: item.variable === 1 ? "TTS" : "录音",
          voice: item.timbreName || item.timbreCode || undefined,
          voiceName: item.voiceName,
          ossUrl: item.ossUrl,
          intentionType: item.intentionType, // 保存原始值
          intentionTypeText: item.intentionType === 1 ? "节点话术" : "FAQ话术", // 显示文本
          faqCode: item.faqCode || "" // 添加faqCode字段
        }))
        setScriptList(processedData)
        setPagination((prev) => ({
          ...prev,
          total: processedData.length
        }))

        // 保存已选中的scriptId列表，用于抽屉中默认选中
        const scriptIds = processedData.map((item) => item.scriptId)
        setSelectedScriptIds(scriptIds)

        // 初始化全局选中状态
        setAllSelectedScripts(new Set(scriptIds))
      } else {
        message.error(res?.message || "获取话术列表失败")
      }
    } catch (error) {
      console.error("获取话术列表失败:", error)
      message.error("获取话术列表失败")
    } finally {
      setLoading(false)
    }
  }

  // 获取所有可选话术列表
  const fetchAllScriptList = async (params = {}) => {
    if (!botNo) {
      message.error("缺少必要参数")
      return
    }

    try {
      setScriptListLoading(true)
      const defaultParams = {
        botNo,
        pageNum: scriptListPagination.pageNum,
        pageSize: scriptListPagination.pageSize,
        orderColumn: "gmt_created",
        orderType: "desc",
        removeTaskScript: 0, // 默认不剔除已选中的话术
        taskId: Number(taskId) // 确保 taskId 是数字类型
      }

      const finalParams = { ...defaultParams, ...params }

      const res = await getScriptListByPage(finalParams)

      if (res && res.status === 200 && res.data) {
        setAllScriptList(res.data.list || [])
        setScriptListPagination({
          pageNum: res.data.pageNum || 1,
          pageSize: res.data.pageSize || 10,
          total: res.data.total || 0
        })
      } else {
        message.error(res?.message || "获取话术列表失败")
      }
    } catch (error) {
      console.error("获取话术列表失败:", error)
      message.error("获取话术列表失败")
    } finally {
      setScriptListLoading(false)
    }
  }

  // 获取音色列表数据
  const fetchTimbreList = async () => {
    if (!botNo) {
      message.error("缺少必要参数，无法获取音色列表")
      return
    }

    try {
      setTimbreLoading(true)
      const res = await fetchPersonalTimbreListV2({
        botNo,
        pageSize: 10000,
        pageNum: 1
      })

      if (res) {
        // 确保数据是数组
        if (res && Array.isArray(res)) {
          setTimbreList(res)
        } else {
          // 数据格式不对，设置为空数组
          setTimbreList([])
          message.warning("获取音色列表成功，但数据格式不正确")
        }
      } else {
        message.error(res?.message || "获取音色列表失败")
        setTimbreList([])
      }
    } catch (error) {
      console.error("获取音色列表失败:", error)
      message.error("获取音色列表失败")
      setTimbreList([])
    } finally {
      setTimbreLoading(false)
    }
  }

  // 初始化话术列表和音色列表
  useEffect(() => {
    fetchScriptList()
  }, [botNo, taskId])

  // 监听主列表搜索条件变化，重置分页到第一页
  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      current: 1
    }))
  }, [mainTableSearchText])

  // 处理表格分页变化
  const handleTableChange = (pagination) => {
    setPagination(pagination)
  }

  // 获取过滤后的数据
  const getFilteredData = () => {
    let filteredData = scriptList

    // 应用搜索条件
    Object.keys(mainTableSearchText).forEach((key) => {
      if (mainTableSearchText[key]) {
        filteredData = filteredData.filter((item) => {
          const fieldValue = item[key]
          if (!fieldValue) return false
          return fieldValue
            .toString()
            .toLowerCase()
            .includes(mainTableSearchText[key].toLowerCase())
        })
      }
    })

    return filteredData
  }

  // 获取当前分页数据（支持本地搜索）
  const getCurrentPageData = () => {
    const filteredData = getFilteredData()

    // 分页
    const { current, pageSize } = pagination
    const start = (current - 1) * pageSize
    const end = start + pageSize
    return filteredData.slice(start, end)
  }

  // 处理抽屉中的表格分页变化
  const handleScriptListTableChange = useCallback(
    (pagination, filters, sorter) => {
      // 检查是否是搜索触发的表格变化（通过检查是否有搜索参数）
      const hasSearchParams = Object.keys(drawerSearchTextRef.current).some(
        (key) => drawerSearchTextRef.current[key] && drawerSearchTextRef.current[key].trim() !== ""
      )

      if (hasSearchParams) {
        return
      }

      const { current, pageSize } = pagination

      // 更新筛选状态
      setFilteredInfo(filters)

      // 构建查询参数
      const searchParams = {
        botNo,
        pageNum: current,
        pageSize,
        taskId,
        orderColumn: "gmt_created",
        orderType: "desc"
      }

      // 添加所有搜索参数
      Object.keys(drawerSearchTextRef.current).forEach((key) => {
        if (drawerSearchTextRef.current[key]) {
          // 处理特殊字段映射
          if (key === "code") {
            searchParams.id = drawerSearchTextRef.current[key] // 话术ID搜索，后端期望参数名是 id
          } else {
            searchParams[key] = drawerSearchTextRef.current[key] // 其他字段直接使用 dataIndex 作为参数名
          }
        }
      })

      // 添加筛选参数
      if (filters.variable && filters.variable.length > 0) {
        searchParams.variable = filters.variable[0]
      }

      // 处理排序
      if (sorter.field && sorter.order) {
        searchParams.orderColumn =
          sorter.field === "gmtCreated"
            ? "gmt_created"
            : sorter.field === "gmtModified"
              ? "gmt_modified"
              : "gmt_created"
        searchParams.orderType = sorter.order === "ascend" ? "asc" : "desc"
      }

      // 检查是否与最后一次搜索参数相同
      const currentParamsStr = JSON.stringify(searchParams)
      if (lastSearchParamsRef.current === currentParamsStr) {
        return
      }

      // 更新分页状态
      setScriptListPagination({
        pageNum: current,
        pageSize,
        total: scriptListPagination.total
      })

      // 重新获取数据
      fetchAllScriptList(searchParams)
    },
    [scriptListPagination.total]
  )

  // 主列表搜索处理函数（本地搜索）
  const handleMainTableSearch = (selectedKeys, confirm, dataIndex) => {
    confirm()

    // 更新搜索文本状态
    const newSearchText = {
      ...mainTableSearchText,
      [dataIndex]: selectedKeys[0]
    }
    setMainTableSearchText(newSearchText)
  }

  // 抽屉搜索处理函数（服务端搜索）
  const handleDrawerSearch = useCallback(
    (selectedKeys, confirm, dataIndex) => {
      confirm()

      // 检查搜索值是否为空
      const searchValue = selectedKeys[0]

      if (!searchValue || searchValue.trim() === "") {
        // 如果搜索值为空，只更新状态，不调用接口
        setDrawerSearchText((prev) => ({
          ...prev,
          [dataIndex]: ""
        }))
        return
      }

      // 构建新的搜索文本状态
      setDrawerSearchText((prev) => {
        const newSearchText = {
          ...prev,
          [dataIndex]: searchValue
        }

        // 构建查询参数
        const searchParams = {
          botNo,
          pageNum: 1,
          pageSize: scriptListPagination.pageSize,
          taskId,
          orderColumn: "gmt_created",
          orderType: "desc"
        }

        // 添加所有搜索参数（使用新的搜索文本状态）
        Object.keys(newSearchText).forEach((key) => {
          if (newSearchText[key]) {
            // 处理特殊字段映射
            if (key === "code") {
              searchParams.id = newSearchText[key] // 话术ID搜索，后端期望参数名是 id
            } else {
              searchParams[key] = newSearchText[key] // 其他字段直接使用 dataIndex 作为参数名
            }
          }
        })

        // 记录搜索参数
        lastSearchParamsRef.current = JSON.stringify(searchParams)

        // 立即调用接口
        fetchAllScriptList(searchParams)

        return newSearchText
      })
    },
    [scriptListPagination.pageSize]
  )

  // 主列表重置搜索（本地搜索）
  const handleMainTableReset = (clearFilters, dataIndex) => {
    clearFilters()

    // 更新搜索文本状态
    const newSearchText = {
      ...mainTableSearchText,
      [dataIndex]: ""
    }
    setMainTableSearchText(newSearchText)
  }

  // 抽屉重置搜索（服务端搜索）
  const handleDrawerReset = useCallback(
    (clearFilters, dataIndex) => {
      clearFilters()

      // 设置搜索标志
      isSearchingRef.current = true

      setDrawerSearchText((prev) => {
        // 构建新的搜索文本状态
        const newSearchText = {
          ...prev,
          [dataIndex]: ""
        }

        // 检查是否还有其他搜索条件
        const hasOtherSearchConditions = Object.keys(newSearchText).some(
          (key) => key !== dataIndex && newSearchText[key] && newSearchText[key].trim() !== ""
        )

        // 构建查询参数，移除当前字段的搜索条件
        const searchParams = {
          botNo,
          pageNum: 1,
          pageSize: scriptListPagination.pageSize,
          taskId,
          orderColumn: "gmt_created",
          orderType: "desc"
        }

        // 保留其他搜索条件（使用新的搜索文本状态）
        Object.keys(newSearchText).forEach((key) => {
          if (key !== dataIndex && newSearchText[key] && newSearchText[key].trim() !== "") {
            // 处理特殊字段映射
            if (key === "code") {
              searchParams.id = newSearchText[key] // 话术ID搜索，后端期望参数名是 id
            } else {
              searchParams[key] = newSearchText[key] // 其他字段直接使用 dataIndex 作为参数名
            }
          }
        })

        // 记录搜索参数
        lastSearchParamsRef.current = JSON.stringify(searchParams)

        // 立即调用接口
        fetchAllScriptList(searchParams)

        // 重置搜索标志
        setTimeout(() => {
          isSearchingRef.current = false
        }, 100)

        return newSearchText
      })
    },
    [scriptListPagination.pageSize]
  )

  // 获取主列表列搜索筛选属性（本地搜索）
  const getMainTableColumnSearchProps = (dataIndex, placeholder) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={placeholder || `搜索${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleMainTableSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleMainTableSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            搜索
          </Button>
          <Button
            onClick={() => handleMainTableReset(clearFilters, dataIndex)}
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
    filteredValue: mainTableSearchText[dataIndex] ? [mainTableSearchText[dataIndex]] : null
  })

  // 获取抽屉列搜索筛选属性（服务端搜索）
  const getDrawerColumnSearchProps = (dataIndex, placeholder) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={placeholder || `搜索${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleDrawerSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleDrawerSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            搜索
          </Button>
          <Button
            onClick={() => handleDrawerReset(clearFilters, dataIndex)}
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
    filteredValue: drawerSearchText[dataIndex] ? [drawerSearchText[dataIndex]] : null
  })

  // 编辑话术部分的表格列配置
  const columns = [
    {
      title: "话术ID",
      dataIndex: "scriptId",
      key: "scriptId",
      width: 100
    },
    {
      title: "话术名称",
      dataIndex: "name",
      key: "name",
      width: 150
    },
    {
      title: "是否有变量",
      dataIndex: "hasVariables",
      key: "hasVariables",
      width: 100,
      render: (hasVariables) => (
        <Tag color={hasVariables === "有" ? "green" : "red"}>{hasVariables}</Tag>
      )
    },

    {
      title: "话术文案",
      dataIndex: "content",
      key: "content",
      width: 300,
      // ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <Tooltip title={text}>
            <div className="line-clamp-4 text-ellipsis overflow-hidden ">{text}</div>
          </Tooltip>
        </Tooltip>
      ),
      ...getMainTableColumnSearchProps("content", "搜索话术文案")
    },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      width: 100,
      render: (type, record) => (
        <div className="flex items-center space-x-1">
          <span>{type}</span>
          {/* 当是录音类型且有ossUrl时显示播放按钮 */}
          {type === "录音" && record.ossUrl && (
            <Button
              type="text"
              size="small"
              className="mt-[3px] !-ml-[0px]"
              icon={
                audioPlaying[record.id] ? (
                  <PauseCircleOutlined style={{ fontSize: "16px", color: "#7F56D9" }} />
                ) : (
                  <PlayCircleOutlined style={{ fontSize: "16px", color: "#7F56D9" }} />
                )
              }
              onClick={() => handleAudioPlay(record.id, record.ossUrl)}
              title={audioPlaying[record.id] ? "暂停播放" : "播放录音"}
            />
          )}
        </div>
      )
    },
    {
      title: "操作",
      key: "action",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <Space size="samll">
          <Popover
            content={renderEditPopoverContent(record)}
            title="编辑话术"
            trigger="click"
            overlayStyle={{ width: "350px" }}
            overlayInnerStyle={{ padding: "12px" }}
            width={320}
            open={popoverVisibleId === record.id}
            destroyTooltipOnHide={true}
            onOpenChange={(visible) => {
              if (visible) {
                handlePopoverOpen(record)
              } else {
                // 关闭时停止播放音频
                if (audioRefs.current[record.id]) {
                  audioRefs.current[record.id].pause()
                  audioRefs.current[record.id].currentTime = 0
                  setAudioPlaying((prev) => ({ ...prev, [record.id]: false }))
                }
                setPopoverVisibleId(null)
              }
            }}
          >
            <Button type="link">编辑</Button>
          </Popover>
          <Popconfirm
            title="确定要删除此条数据？"
            okText="确定"
            cancelText="取消"
            onConfirm={() => handleDelete(record)}
          >
            <Button type="link">删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  // 抽屉内话术列表的列配置
  const scriptListColumns = [
    {
      title: "话术ID",
      dataIndex: "code",
      key: "code",
      width: 160,
      ...getDrawerColumnSearchProps("code", "搜索话术ID")
    },
    {
      title: "话术名称",
      dataIndex: "name",
      key: "name",
      width: 120,
      render: (text) => text || "--",
      ...getDrawerColumnSearchProps("name", "搜索话术名称")
    },
    {
      title: "是否变量",
      dataIndex: "variable",
      key: "variable",
      width: 100,
      render: (variable) => (
        <Tag color={variable === 1 ? "green" : "red"}>{variable === 1 ? "有" : "无"}</Tag>
      ),
      filters: [
        { text: "有变量", value: 1 },
        { text: "无变量", value: 0 }
      ],
      filteredValue: filteredInfo.variable || null
    },
    {
      title: "话术文案",
      dataIndex: "content",
      key: "content",
      width: 300,
      // ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <div className="line-clamp-4 text-ellipsis overflow-hidden">{text}</div>
        </Tooltip>
      ),
      ...getDrawerColumnSearchProps("content", "搜索话术文案")
    },
    {
      title: "创建时间",
      dataIndex: "gmtCreated",
      key: "gmtCreated",
      width: 120,
      sorter: true
    },
    {
      title: "更新时间",
      dataIndex: "gmtModified",
      key: "gmtModified",
      width: 120,
      sorter: true
    }
  ]

  // 处理编辑话术
  const handleEdit = (record) => {
    setEditingScript(record)
    form.setFieldsValue({
      name: record.name,
      content: record.content
    })
    setIsModalVisible(true)
  }

  // 处理删除话术
  const handleDelete = async (record) => {
    try {
      setLoading(true)

      // 停止正在播放的音频（如果有）
      if (audioRefs.current[record.id]) {
        audioRefs.current[record.id].pause()
        audioRefs.current[record.id].currentTime = 0
        delete audioRefs.current[record.id]
        setAudioPlaying((prev) => {
          const newPlaying = { ...prev }
          delete newPlaying[record.id]
          return newPlaying
        })
      }

      const res = await deleteSelectedScript({
        botNo,
        taskId: Number(taskId), // 确保 taskId 是数字类型
        taskScriptId: record.id,
        scriptId: record.scriptId // 添加scriptId作为必填参数
      })

      if (res && res.status === 200) {
        message.success("话术删除成功")
        // 重新获取已选择的话术列表
        fetchScriptList()
      } else {
        message.error(`${res?.message} ${res?.data ? "【" + res?.data + "】" : ""}` || "删除失败")
      }
    } catch (error) {
      console.error("删除话术失败:", error)
      message.error("删除话术失败")
    } finally {
      setLoading(false)
    }
  }

  // 处理添加话术
  const handleAddScript = () => {
    // 打开话术选择抽屉
    setDrawerVisible(true)
    // 获取话术列表
    fetchAllScriptList()
  }

  // 返回语音模板列表
  const handleReturn = () => {
    navigate(-1) // 返回上一页
  }

  // 处理编辑话术保存
  const handleSave = () => {
    form
      .validateFields()
      .then((values) => {
        // 更新scriptList
        const updatedScriptList = scriptList.map((script) => {
          if (script.id === editingScript.id) {
            return {
              ...script,
              name: values.name,
              content: values.content
            }
          }
          return script
        })

        setScriptList(updatedScriptList)
        message.success("保存成功")
        setIsModalVisible(false)
      })
      .catch((errorInfo) => {
        console.log("Validate Failed:", errorInfo)
      })
  }

  // 获取当前页面应该选中的话术ID
  const currentPageSelectedKeys = useMemo(() => {
    return allScriptList.filter((item) => allSelectedScripts.has(item.id)).map((item) => item.id)
  }, [allScriptList, allSelectedScripts])

  // 监听页面数据变化，更新当前页面的选中状态
  useEffect(() => {
    if (allScriptList.length > 0) {
      setSelectedScriptIds(currentPageSelectedKeys)
    }
  }, [allScriptList, currentPageSelectedKeys])

  // 处理保存选中的话术
  const handleSaveSelectedScripts = () => {
    // 检查是否有选中的话术
    if (allSelectedScripts.size === 0) {
      message.warning("请选择话术")
      return
    }

    // 调用保存接口
    setSavingSelectedScripts(true)

    // 将Set转换为数组
    const scriptIds = Array.from(allSelectedScripts)

    saveSelectedScripts({
      botNo,
      taskId: Number(taskId), // 确保 taskId 是数字类型
      scriptIds: scriptIds
    })
      .then((res) => {
        if (res && res.status === 200) {
          message.success("话术保存成功")
          setDrawerVisible(false)
          // 重新获取已选择的话术列表
          fetchScriptList()
        } else {
          message.error(res?.message || "保存失败")
        }
      })
      .catch((error) => {
        console.error("保存话术失败:", error)
        message.error("保存话术失败")
      })
      .finally(() => {
        setSavingSelectedScripts(false)
      })
  }

  // 自定义文件上传组件
  const renderUploadArea = (record) => {
    const file = popoverForm.getFieldValue("file")
    const status = uploadState[record.id]?.status || "default"
    const percent = uploadState[record.id]?.percent || 0

    return (
      <div>
        {!file ? (
          <Upload
            showUploadList={false}
            beforeUpload={async (file) => {
              try {
                // 设置上传状态为上传中
                setUploadState((prev) => ({
                  ...prev,
                  [record.id]: {
                    status: "uploading",
                    percent: 10,
                    file: {
                      ...file,
                      name: file.name,
                      size: file.size,
                      type: file.type,
                      originFileObj: file
                    }
                  }
                }))

                // 调用实际的上传接口
                const formData = new FormData()
                formData.append("file", file)

                // 模拟进度增长，同时进行实际上传
                let p = 10
                const timer = setInterval(() => {
                  p += 15
                  if (p < 90) {
                    setUploadState((prev) => ({
                      ...prev,
                      [record.id]: {
                        status: "uploading",
                        percent: Math.min(p, 90),
                        file: {
                          ...file,
                          name: file.name,
                          size: file.size,
                          type: file.type,
                          originFileObj: file
                        }
                      }
                    }))
                  }
                }, 200)

                // 执行实际上传
                const result = await fetchUploadFile(formData)
                clearInterval(timer)

                // 获取上传结果
                if (result && result.temporarySignatureUrl && result.objectKey) {
                  // 更新状态为完成
                  setUploadState((prev) => ({
                    ...prev,
                    [record.id]: {
                      status: "done",
                      percent: 100,
                      file: {
                        ...file,
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        originFileObj: file,
                        temporarySignatureUrl: result.temporarySignatureUrl,
                        objectKey: result.objectKey
                      }
                    }
                  }))

                  // 设置表单值，包含文件对象和返回的数据
                  popoverForm.setFieldsValue({
                    file: {
                      ...file,
                      name: file.name,
                      size: file.size,
                      type: file.type,
                      temporarySignatureUrl: result.temporarySignatureUrl,
                      objectKey: result.objectKey,
                      originFileObj: file
                    }
                  })

                  message.success("上传成功")
                } else {
                  message.error("上传失败")
                  setUploadState((prev) => ({
                    ...prev,
                    [record.id]: { status: "default", percent: 0 }
                  }))
                }
              } catch (error) {
                console.error("上传失败:", error)
                message.error("上传失败")
                setUploadState((prev) => ({
                  ...prev,
                  [record.id]: { status: "default", percent: 0 }
                }))
              }

              return false // 阻止默认上传行为
            }}
            accept=".wav,.mp3,.wma,.aac"
          >
            <Button icon={<UploadOutlined />}>点击上传</Button>
          </Upload>
        ) : (
          <>
            <div
              className="border border-gray-200 rounded-lg px-3 py-2 mb-2 W-[100%] bg-white"
              style={{ borderWidth: "1px", borderStyle: "solid" }}
            >
              <div className="flex items-center overflow-hidden w-[100%]">
                <div className="mr-2 ">
                  {file.type?.includes("audio") ||
                  (file.name && file.name.match(/\.(mp3|wav|wma|aac)$/i)) ? (
                    <img src={mp4} alt="MP4" className="w-[40px] h-[40px]" />
                  ) : (
                    <div className="w-[40px] h-[40px] flex items-center justify-center text-xs font-bold bg-gray-100 rounded-lg">
                      {file.name
                        ? file.name.split(".").pop().toUpperCase().substring(0, 3)
                        : "FILE"}
                    </div>
                  )}
                </div>

                <div className="flex-1 -mt-1 w-[100%]">
                  <div className="flex items-center justify-between">
                    <div className="w-[100%]">
                      <span className="text-sm font-medium truncate w-[100%] ">
                        {file.name || file.originFileObj?.name || "未命名文件"}
                      </span>
                      <div className="text-xs text-gray-500">
                        {/* 如果是回显的文件且大小为0，显示"已上传"；否则显示文件大小 */}
                        {file.url && file.size === 0
                          ? "已上传"
                          : `${Math.round((file.size || file.originFileObj?.size || 0) / 1024)} KB`}
                      </div>
                    </div>

                    <div className="flex justify-between items-top -mt-2 -mr-2 ">
                      <Button
                        type="text"
                        size="small"
                        icon={<i className="iconfont icon-shanchu text-[20px]"></i>} //<DeleteOutlined />
                        danger
                        className="-ml-2 flex items-center justify-center"
                        onClick={() => {
                          // 停止播放（如果正在播放）
                          if (audioRefs.current[record.id]) {
                            audioRefs.current[record.id].pause()
                            audioRefs.current[record.id].currentTime = 0
                            setAudioPlaying((prev) => ({ ...prev, [record.id]: false }))
                          }

                          popoverForm.setFieldsValue({ file: undefined })
                          setUploadState((prev) => ({
                            ...prev,
                            [record.id]: { status: "default", percent: 0 }
                          }))
                        }}
                      />
                    </div>
                  </div>

                  {status === "uploading" && (
                    <div className="mt-1 w-[100%]">
                      <div className="h-1.5 bg-gray-200 rounded overflow-hidden">
                        <div
                          className="h-full bg-purple-400 rounded"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {(status === "done" || file.url) && (
                    <div className="mt-1">
                      <div className="h-1.5 bg-gray-200 rounded overflow-hidden ">
                        <div className="h-full bg-green-400 rounded" />
                      </div>
                      {/* 如果是回显的文件，显示"已上传"状态 */}
                      {/* {file.url && <div className="text-xs text-green-600 mt-1">已上传</div>} */}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 重新上传按钮 */}
            <div className="mb-2">
              <Upload
                showUploadList={false}
                beforeUpload={async (newFile) => {
                  try {
                    // 设置上传状态为上传中
                    setUploadState((prev) => ({
                      ...prev,
                      [record.id]: {
                        status: "uploading",
                        percent: 10,
                        file: {
                          ...newFile,
                          name: newFile.name,
                          size: newFile.size,
                          type: newFile.type,
                          originFileObj: newFile
                        }
                      }
                    }))

                    // 调用实际的上传接口
                    const formData = new FormData()
                    formData.append("file", newFile)

                    // 模拟进度增长，同时进行实际上传
                    let p = 10
                    const timer = setInterval(() => {
                      p += 15
                      if (p < 90) {
                        setUploadState((prev) => ({
                          ...prev,
                          [record.id]: {
                            status: "uploading",
                            percent: Math.min(p, 90),
                            file: {
                              ...newFile,
                              name: newFile.name,
                              size: newFile.size,
                              type: newFile.type,
                              originFileObj: newFile
                            }
                          }
                        }))
                      }
                    }, 200)

                    // 执行实际上传
                    const result = await fetchUploadFile(formData)
                    clearInterval(timer)

                    // 获取上传结果
                    if (result && result.temporarySignatureUrl && result.objectKey) {
                      // 更新状态为完成
                      setUploadState((prev) => ({
                        ...prev,
                        [record.id]: {
                          status: "done",
                          percent: 100,
                          file: {
                            ...newFile,
                            name: newFile.name,
                            size: newFile.size,
                            type: newFile.type,
                            originFileObj: newFile,
                            temporarySignatureUrl: result.temporarySignatureUrl,
                            objectKey: result.objectKey
                          }
                        }
                      }))

                      // 设置表单值，覆盖原有文件
                      popoverForm.setFieldsValue({
                        file: {
                          ...newFile,
                          name: newFile.name,
                          size: newFile.size,
                          type: newFile.type,
                          temporarySignatureUrl: result.temporarySignatureUrl,
                          objectKey: result.objectKey,
                          originFileObj: newFile
                        }
                      })

                      message.success("重新上传成功")
                    } else {
                      message.error("上传失败")
                      setUploadState((prev) => ({
                        ...prev,
                        [record.id]: { status: "default", percent: 0 }
                      }))
                    }
                  } catch (error) {
                    console.error("上传失败:", error)
                    message.error("上传失败")
                    setUploadState((prev) => ({
                      ...prev,
                      [record.id]: { status: "default", percent: 0 }
                    }))
                  }

                  return false // 阻止默认上传行为
                }}
                accept=".wav,.mp3,.wma,.aac"
              >
                <Button
                  type="dashed"
                  icon={<UploadOutlined />}
                  size="small"
                  style={{ width: "100%" }}
                >
                  重新上传
                </Button>
              </Upload>
            </div>

            <div className="text-xs text-gray-500 mt-1">
              支持上传wav、mp3、wma、aac等格式的录音文件
            </div>
          </>
        )}
      </div>
    )
  }

  // 打开Popover时获取音色列表
  const handlePopoverOpen = (record) => {
    setPopoverVisibleId(record.id)

    // 调试信息
    console.log("handlePopoverOpen record:", record)

    // 处理录音文件回显
    let fileValue = undefined
    if (record.ossUrl) {
      // 从 URL 中提取文件名，如果无法提取则使用默认名称
      const fileName = record.ossUrl.split("/").pop() || "录音文件.mp3"

      // 根据文件扩展名判断文件类型
      const fileExtension = fileName.split(".").pop()?.toLowerCase() || "mp3"
      const audioTypes = {
        mp3: "audio/mp3",
        wav: "audio/wav",
        wma: "audio/x-ms-wma",
        aac: "audio/aac"
      }

      fileValue = {
        name: fileName,
        size: 0, // 已上传的文件大小未知，设为0
        type: audioTypes[fileExtension] || "audio/mp3", // 根据扩展名设置类型
        url: record.ossUrl, // 保存原始URL
        status: "done" // 标记为已上传完成
      }
    }

    // 初始化表单值
    const initialValues = {
      type: record.type || "TTS",
      voice: record.voice,
      file: fileValue, // 使用处理后的文件对象
      intentionType: record.intentionType || 1, // 默认为节点话术
      faqCode: record.faqCode || "" // 添加faqCode字段
    }

    // 需要setTimeout确保表单已渲染
    setTimeout(() => {
      popoverForm.setFieldsValue({
        type: record.type || "TTS",
        voice: record.voice,
        file: fileValue, // 使用处理后的文件对象
        intentionType: record.intentionType || 1, // 默认为节点话术
        faqCode: record.faqCode || "" // 添加faqCode字段
      })
    }, 0)

    // 获取音色列表
    fetchTimbreList()
  }

  // 渲染编辑表单
  const renderEditPopoverContent = (record) => {
    return (
      <div style={{ width: "320px" }}>
        <Form
          form={popoverForm}
          layout="vertical"
          className="w-[100%]"
          onFinish={() => handlePopoverSave(record)}
          initialValues={{
            type: record.type || "TTS",
            voice: record.voice || undefined,
            file: record.file || undefined,
            intentionType: record.intentionType || 1, // 隐藏的话术类型字段
            faqCode: record.faqCode || "" // 添加faqCode初始值
          }}
        >
          <Form.Item
            name="intentionType"
            label="话术类型"
            rules={[{ required: true, message: "请选择话术类型" }]}
          >
            <Select
              placeholder="请选择话术类型"
              options={[
                { label: "节点话术", value: 1 },
                { label: "FAQ话术", value: 2 }
              ]}
            />
          </Form.Item>

          <Form.Item name="type" label="类型" rules={[{ required: true, message: "请选择类型" }]}>
            <Select
              options={[
                { label: "TTS", value: "TTS" },
                { label: "录音", value: "录音" }
              ]}
              onChange={() => {
                // 切换类型时清空相关字段
                popoverForm.setFieldsValue({
                  voice: undefined,
                  file: undefined
                })
              }}
            />
          </Form.Item>

          <Form.Item noStyle dependencies={["type", "intentionType"]}>
            {({ getFieldValue }) => {
              const type = getFieldValue("type")
              const intentionType = getFieldValue("intentionType")

              return (
                <>
                  {type === "TTS" && (
                    <Form.Item name="voice" label="音色" hidden>
                      <Input />
                    </Form.Item>
                  )}

                  {/* 当选择FAQ话术时显示FAQ编码输入框 */}
                  {intentionType === 2 && (
                    <Form.Item
                      name="faqCode"
                      label="FAQ编码"
                      rules={[{ required: true, message: "请输入FAQ编码" }]}
                    >
                      <Input placeholder="请输入FAQ编码" />
                    </Form.Item>
                  )}

                  {type === "录音" && (
                    <Form.Item
                      name="file"
                      label={
                        <div className="flex items-center">
                          <span>录音文件</span>
                          {record.ossUrl && (
                            <Button
                              type="text"
                              size="small"
                              icon={
                                audioPlaying[record.id] ? (
                                  <PauseCircleOutlined
                                    style={{ fontSize: "16px", color: "#7F56D9" }}
                                  />
                                ) : (
                                  <PlayCircleOutlined
                                    style={{ fontSize: "16px", color: "#7F56D9" }}
                                  />
                                )
                              }
                              onClick={() => handleAudioPlay(record.id, record.ossUrl)}
                              title={audioPlaying[record.id] ? "暂停播放" : "播放当前录音"}
                              className=" mt-[2px] flex items-center justify-center hover:bg-purple-50"
                              style={{
                                borderColor: audioPlaying[record.id] ? "#7F56D9" : "transparent",
                                backgroundColor: audioPlaying[record.id] ? "#F3F0FF" : "transparent"
                              }}
                            />
                          )}
                        </div>
                      }
                      rules={[{ required: true, message: "请上传录音文件" }]}
                    >
                      {renderUploadArea(record)}
                    </Form.Item>
                  )}

                  {/* 显示当前音色名称 */}
                  {type === "TTS" && (
                    <Form.Item label="音色" required>
                      <div className="pl-3">{record.voice || "--"}</div>
                    </Form.Item>
                  )}
                </>
              )
            }}
          </Form.Item>

          <div style={{ textAlign: "right", marginTop: "8px" }}>
            <Button onClick={() => setPopoverVisibleId(null)} style={{ marginRight: "8px" }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
          </div>
        </Form>
      </div>
    )
  }

  // 处理Popover表单保存
  const handlePopoverSave = (record) => {
    popoverForm
      .validateFields()
      .then(async (values) => {
        try {
          // 设置保存中状态
          setPopoverVisibleId(null) // 先关闭弹窗，避免重复提交

          // 构建查询参数对象 (URL查询参数)
          const queryParams = {
            botNo,
            taskId: Number(taskId), // 确保 taskId 是数字类型
            taskScriptId: record.id,
            scriptId: record.scriptId,
            intentionType: values.intentionType // 使用表单中的值
          }

          // 处理FAQ话术的faqCode
          if (values.intentionType === 2) {
            // 如果表单中有faqCode就使用表单中的，否则使用记录中的
            queryParams.faqCode = values.faqCode || record.faqCode || ""
          }

          // 保持原有的voice设置
          if (values.type === "TTS") {
            queryParams.voice = record.voice || ""
          }

          // 根据类型决定是否需要传递文件
          if (values.type === "录音" && values.file && values.file.originFileObj) {
            // 录音类型且有新上传的文件
            // 创建FormData对象只包含文件
            const formData = new FormData()
            formData.append("file", values.file.originFileObj)

            // 调用保存接口，queryParams作为URL参数
            const res = await saveScriptType(formData, queryParams)

            if (res && res.status === 200) {
              message.success("保存成功")
              fetchScriptList() // 重新获取话术列表
            } else {
              message.error(res?.message || "保存失败")
            }
          } else if (values.type === "录音" && values.file && values.file.url) {
            // 录音类型且是回显的已有文件（只有url，没有originFileObj）
            // 不需要重新上传文件，直接保存其他信息
            const res = await saveScriptType(null, queryParams)

            if (res && res.status === 200) {
              message.success("保存成功")
              fetchScriptList() // 重新获取话术列表
            } else {
              message.error(res?.message || "保存失败")
            }
          } else if (
            values.type === "录音" &&
            (!values.file || (!values.file.originFileObj && !values.file.url))
          ) {
            // 录音类型但没有选择文件也没有已有文件
            message.warning("请选择要上传的文件")
            return
          } else {
            // TTS类型或其他情况：传递null作为body
            const res = await saveScriptType(null, queryParams)

            if (res && res.status === 200) {
              message.success("保存成功")

              // 更新本地数据，避免重新请求
              const updatedScriptList = scriptList.map((item) => {
                if (item.id === record.id) {
                  return {
                    ...item,
                    ...values,
                    // 保持原有的音色名称
                    voice: item.voice,
                    voiceName: item.voiceName
                  }
                }
                return item
              })
              setScriptList(updatedScriptList)

              // 重新获取话术列表以确保数据同步
              fetchScriptList()
            } else {
              message.error(res?.message || "保存失败")
            }
          }
        } catch (error) {
          console.error("保存失败:", error)
          message.error("保存失败，请稍后重试")
        }
      })
      .catch((err) => {
        console.error("表单验证失败:", err)
      })
  }

  // 处理选中话术变化
  const handleSelectedScriptsChange = useCallback(
    (selectedRowKeys) => {
      // 获取当前页面的所有话术ID
      const currentPageScriptIds = allScriptList.map((item) => item.id)

      // 更新全局选中状态
      setAllSelectedScripts((prevSelected) => {
        const newSelected = new Set(prevSelected)

        // 先移除当前页面的所有选中状态
        currentPageScriptIds.forEach((id) => {
          newSelected.delete(id)
        })

        // 再添加当前页面新选中的
        selectedRowKeys.forEach((id) => {
          newSelected.add(id)
        })

        return newSelected
      })

      // 更新当前页面的选中状态（用于UI显示）
      setSelectedScriptIds(selectedRowKeys)
    },
    [allScriptList]
  )

  // 音频播放控制函数
  const handleAudioPlay = (recordId, audioUrl) => {
    try {
      // 停止其他正在播放的音频
      Object.keys(audioRefs.current).forEach((id) => {
        if (id !== recordId && audioRefs.current[id]) {
          audioRefs.current[id].pause()
          audioRefs.current[id].currentTime = 0
          setAudioPlaying((prev) => ({ ...prev, [id]: false }))
        }
      })

      // 获取或创建当前音频元素
      if (!audioRefs.current[recordId]) {
        audioRefs.current[recordId] = new Audio(audioUrl)

        // 添加事件监听器
        audioRefs.current[recordId].addEventListener("ended", () => {
          setAudioPlaying((prev) => ({ ...prev, [recordId]: false }))
        })

        audioRefs.current[recordId].addEventListener("error", () => {
          message.error("音频播放失败")
          setAudioPlaying((prev) => ({ ...prev, [recordId]: false }))
        })
      }

      const audio = audioRefs.current[recordId]

      if (audioPlaying[recordId]) {
        // 当前正在播放，暂停
        audio.pause()
        setAudioPlaying((prev) => ({ ...prev, [recordId]: false }))
      } else {
        // 当前未播放，开始播放
        audio.play()
        setAudioPlaying((prev) => ({ ...prev, [recordId]: true }))
      }
    } catch (error) {
      console.error("音频播放错误:", error)
      message.error("音频播放失败")
    }
  }

  // 组件卸载时清理音频资源
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        if (audio) {
          audio.pause()
          audio.currentTime = 0
        }
      })
      audioRefs.current = {}
    }
  }, [])

  return (
    <div className={styles.scriptManageContainer}>
      <div className={styles.headerContainer}>
        <Button type="link" icon={<LeftOutlined />} onClick={handleReturn}>
          返回
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddScript}>
          选择话术
        </Button>
      </div>

      <div className={styles.tableContainer}>
        <Table
          className="table-style-v2"
          rowClassName={(record, index) => {
            let className = ""
            if (index % 2 === 0) {
              className = "table-style-v2-even-row"
            } else {
              className = "table-style-v2-odd-row"
            }

            // 如果正在播放录音，添加高亮样式
            if (audioPlaying[record.id]) {
              className += " bg-blue-50"
            }

            return className
          }}
          rowKey="id"
          columns={columns}
          dataSource={getCurrentPageData()}
          loading={loading}
          scroll={{ y: "calc(100vh - 250px)", x: 1000 }}
          pagination={{
            ...pagination,
            total: getFilteredData().length,
            showTotal: (total) => `共 ${total} 条`,
            showSizeChanger: true
          }}
          onChange={handleTableChange}
        />
      </div>

      {/* 编辑话术弹窗 */}
      <Modal
        title="编辑话术"
        open={isModalVisible}
        onOk={handleSave}
        onCancel={() => setIsModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="话术名称"
            rules={[{ required: true, message: "请输入话术名称" }]}
          >
            <Input placeholder="请输入话术名称" />
          </Form.Item>
          <Form.Item
            name="content"
            label="话术内容"
            rules={[{ required: true, message: "请输入话术内容" }]}
          >
            <Input.TextArea rows={4} placeholder="请输入话术内容" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 话术选择抽屉 */}
      <Drawer
        title="选择话术"
        width={1000}
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        footer={
          <div style={{ textAlign: "right" }}>
            <Button style={{ marginRight: 8 }} onClick={() => setDrawerVisible(false)}>
              取消
            </Button>
            <Button
              type="primary"
              onClick={handleSaveSelectedScripts}
              loading={savingSelectedScripts}
            >
              确定
            </Button>
          </div>
        }
      >
        <Table
          rowKey="id"
          rowSelection={{
            type: "checkbox",
            selectedRowKeys: currentPageSelectedKeys,
            onChange: handleSelectedScriptsChange
          }}
          columns={scriptListColumns}
          dataSource={allScriptList}
          loading={scriptListLoading}
          pagination={{
            current: scriptListPagination.pageNum,
            pageSize: scriptListPagination.pageSize,
            total: scriptListPagination.total,
            showTotal: (total) => `共 ${total} 条 `,
            showSizeChanger: true
          }}
          onChange={handleScriptListTableChange}
          scroll={{ y: "calc(100vh - 300px)", x: 1000 }}
          locale={{
            emptyText: (
              <div style={{ padding: "20px", textAlign: "center" }}>
                <p>暂无数据</p>
                {Object.keys(drawerSearchText).some((key) => drawerSearchText[key]) && (
                  <p style={{ color: "#999", fontSize: "12px" }}>
                    搜索条件：
                    {Object.entries(drawerSearchText)
                      .filter(([key, value]) => value)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(", ")}
                  </p>
                )}
              </div>
            )
          }}
        />
      </Drawer>
    </div>
  )
}

export default ScriptManage
