// 音色管理

import { useState, useEffect, useRef } from "react"
import {
  Table,
  Button,
  Space,
  Modal,
  message,
  Input,
  Form,
  Pagination,
  Select,
  Slider,
  InputNumber,
  Row,
  Col,
  Progress,
  Drawer,
  Popconfirm,
  Switch,
  Radio,
  Upload,
  Tabs,
  Segmented,
  Spin,
  Divider
} from "antd"
import {
  EyeOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  ReloadOutlined,
  SoundOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  FileOutlined,
  QuestionCircleOutlined,
  UserOutlined,
  CameraOutlined
} from "@ant-design/icons"
import { Header } from "@/components/PageHeader"
import styles from "./timbre.module.scss"
import { uploadTimbreAvatar } from "@/api/timbre/api"
import { getTimbreList, deleteTimbre, synthesisVoice } from "@/api/voiceAgent/api"
import {
  fetchPersonalTimbreList,
  updateTimbreEnabledStatus,
  fetchTimbreDetail
} from "@/api/timbre/api"
import { useCreateOrUpdateTimbre, useTimbreModelList, useTimbreDetail } from "@/api/timbre/index"
import { useLocation } from "react-router-dom"
import queryString from "query-string"
import "./timber.scss"
import { fetchBotList } from "@/api/bot/api"
import defaultTimbreGirl from "@/assets/img/defaultTimbreGirl.png"
import defaultTimbreBoy from "@/assets/img/defaultTimbreBoy.png"
import TimbreDrawer from "./components/TimbreDrawer"

const { Option } = Select

const DEFAULT_AVATAR_GIRL = defaultTimbreGirl
const DEFAULT_AVATAR_BOY = defaultTimbreBoy
export default function Timbre() {
  const [currentTimbre, setCurrentTimbre] = useState(null)
  const [loading, setLoading] = useState(false)
  const [timbreList, setTimbreList] = useState([])
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [drawerMode, setDrawerMode] = useState("create") // "create" | "edit" | "marketView"
  const [editTimbreId, setEditTimbreId] = useState(null)
  const location = useLocation()
  const { search } = location
  const urlParams = queryString.parse(search)
  const { botNo } = urlParams
  const [searchText, setSearchText] = useState({})
  const [filteredInfo, setFilteredInfo] = useState({})
  const [queryParams, setQueryParams] = useState({
    pageNum: 1,
    pageSize: 10,
    timbreName: "",
    description: "",
    gender: "",
    source: ""
  })

  // 分页配置
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  // 试听功能状态
  const [currentAuditionAudio, setCurrentAuditionAudio] = useState(null)
  const [playingAuditionId, setPlayingAuditionId] = useState(null)

  // 获取音色列表数据
  const fetchTimbreList = async (params = {}) => {
    if (!botNo) {
      message.error("缺少必要参数，无法获取音色列表")
      return
    }
    try {
      setLoading(true)
      const requestParams = {
        botNo,
        ...queryParams,
        ...params
      }
      const data = await fetchPersonalTimbreList(requestParams)
      if (data && data.list && Array.isArray(data.list)) {
        setTimbreList(data.list)
        setPagination({
          current: data.pageNum || 1,
          pageSize: data.pageSize || 10,
          total: data.total || 0
        })
      } else {
        setTimbreList([])
        message.warning("获取音色列表成功，但数据格式不正确")
      }
    } catch (error) {
      console.error("获取音色列表失败:", error)
      message.error("获取音色列表失败")
    } finally {
      setLoading(false)
    }
  }

  // 首次加载和参数变化时获取数据
  useEffect(() => {
    if (botNo) {
      fetchTimbreList()
    }
  }, [queryParams, botNo])

  // 处理搜索 - 改为服务端搜索
  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm()
    setSearchText({
      ...searchText,
      [dataIndex]: selectedKeys[0]
    })

    // 根据不同的搜索字段设置对应的API请求参数
    const newParams = {
      ...queryParams,
      pageNum: 1 // 重置到第一页
    }

    if (dataIndex === "timbreName") {
      newParams.timbreName = selectedKeys[0]
    } else if (dataIndex === "description") {
      newParams.description = selectedKeys[0]
    } else if (dataIndex === "timbreModel") {
      newParams.timbreModel = selectedKeys[0]
    }

    setQueryParams(newParams)
  }

  // 重置搜索 - 改为服务端搜索
  const handleReset = (clearFilters, confirm, dataIndex) => {
    clearFilters()
    setSearchText({
      ...searchText,
      [dataIndex]: ""
    })

    // 清除特定字段的搜索参数
    const newParams = { ...queryParams }

    if (dataIndex === "timbreName") {
      delete newParams.timbreName
    } else if (dataIndex === "description") {
      delete newParams.description
    } else if (dataIndex === "timbreModel") {
      delete newParams.timbreModel
    }
    confirm({ closeDropdown: false })
    setQueryParams(newParams)
  }

  // 处理音色试听
  const handleTimbreAudition = (auditionUrl, timbreId) => {
    if (!auditionUrl) {
      message.warning("该音色暂无试听音频")
      return
    }

    // 如果当前正在播放这个音频，则暂停
    if (playingAuditionId === timbreId && currentAuditionAudio) {
      currentAuditionAudio.pause()
      currentAuditionAudio.currentTime = 0
      setCurrentAuditionAudio(null)
      setPlayingAuditionId(null)
      return
    }

    // 停止当前正在播放的音频
    if (currentAuditionAudio) {
      currentAuditionAudio.pause()
      currentAuditionAudio.currentTime = 0
    }

    // 创建新的音频实例
    const audio = new Audio(auditionUrl)
    setCurrentAuditionAudio(audio)
    setPlayingAuditionId(timbreId)

    // 定义播放结束的处理函数
    const handleAudioEnded = () => {
      setCurrentAuditionAudio(null)
      setPlayingAuditionId(null)
      audio.removeEventListener("ended", handleAudioEnded)
    }

    audio.addEventListener("ended", handleAudioEnded)
    audio.play().catch((error) => {
      console.error("播放试听音频失败:", error)
      message.error("试听播放失败")
      setCurrentAuditionAudio(null)
      setPlayingAuditionId(null)
      audio.removeEventListener("ended", handleAudioEnded)
    })
  }

  // 处理启用/停用开关
  const handleToggleEnabled = async (record, enabled) => {
    try {
      const params = {
        botNo,
        timbreId: record.timbreId,
        enabled: enabled ? "Y" : "N"
      }

      const res = await updateTimbreEnabledStatus(params)

      if (res && res.status === 200) {
        message.success(`已${enabled ? "启用" : "停用"}音色: ${record.timbreName}`)
        fetchTimbreList()
      } else {
        message.error(res?.message || `${enabled ? "启用" : "停用"}音色失败`)
      }
    } catch (error) {
      console.error(`${enabled ? "启用" : "停用"}音色失败:`, error)
      message.error(`${enabled ? "启用" : "停用"}音色失败`)
    }
  }

  // 表格列定义
  const columns = [
    {
      title: "音色名称",
      dataIndex: "timbreName",
      key: "timbreName",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
        <div style={{ padding: 8 }}>
          <Space className="mb-[8px] w-full justify-between">
            <Space>
              <Button
                type="primary"
                onClick={() => handleSearch(selectedKeys, confirm, "timbreName")}
                icon={<SearchOutlined />}
                size="small"
                style={{ width: 90 }}
              >
                搜索
              </Button>
              <Button
                onClick={() => handleReset(clearFilters, confirm, "timbreName")}
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
            placeholder="搜索音色名称"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => handleSearch(selectedKeys, confirm, "timbreName")}
            style={{ display: "block" }}
          />
        </div>
      ),
      filterIcon: (filtered) => (
        <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
      render: (text) => text || "--"
    },
    {
      title: "音色模型",
      dataIndex: "timbreModel",
      key: "timbreModel",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
        <div style={{ padding: 8 }}>
          <Space className="mb-[8px] w-full justify-between">
            <Space>
              <Button
                type="primary"
                onClick={() => handleSearch(selectedKeys, confirm, "timbreModel")}
                icon={<SearchOutlined />}
                size="small"
                style={{ width: 90 }}
              >
                搜索
              </Button>
              <Button
                onClick={() => handleReset(clearFilters, confirm, "timbreModel")}
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
            placeholder="搜索音色模型"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => handleSearch(selectedKeys, confirm, "timbreModel")}
            style={{ display: "block" }}
          />
        </div>
      ),
      filterIcon: (filtered) => (
        <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
      render: (text) => text || "--"
    },
    {
      title: "标签",
      dataIndex: "gender",
      key: "gender",
      filters: [
        { text: "男声", value: "male" },
        { text: "女声", value: "female" }
      ],
      filterMultiple: false,
      render: (gender) => (gender === "女" || gender === "female" ? "女声" : "男声")
    },
    {
      title: "音色说明",
      dataIndex: "description",
      key: "description",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
        <div style={{ padding: 8 }}>
          <Space className="mb-[8px] w-full justify-between">
            <Space>
              <Button
                type="primary"
                onClick={() => handleSearch(selectedKeys, confirm, "description")}
                icon={<SearchOutlined />}
                size="small"
                style={{ width: 90 }}
              >
                搜索
              </Button>
              <Button
                onClick={() => handleReset(clearFilters, confirm, "description")}
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
            placeholder="搜索音色说明"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => handleSearch(selectedKeys, confirm, "description")}
            style={{ display: "block" }}
          />
        </div>
      ),
      filterIcon: (filtered) => (
        <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
      render: (text) => text || "--"
    },
    {
      title: "来源",
      dataIndex: "source",
      key: "source",
      filters: [
        { text: "创建", value: "CREATED" },
        { text: "订阅", value: "SUBSCRIBED" }
      ],
      filterMultiple: false,
      render: (source) => (source === "CREATED" ? "创建" : "市集订阅")
    },
    {
      title: "操作",
      key: "action",
      width: 200,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="确认操作"
            description={
              <>
                {record.source === "SUBSCRIBED" ? (
                  <div>确定要启用音色{record.timbreName}吗？</div>
                ) : (
                  <div>
                    确定要停用音色{record.timbreName}吗？
                    {record?.subscriptionMode === -1 ? (
                      <p>停用后，对应音色不支持调用</p>
                    ) : (
                      <p>该音色为共享音色，停用后订阅方将无法调用</p>
                    )}
                  </div>
                )}
              </>
            }
            onConfirm={() => handleToggleEnabled(record, record.enabled === "Y" ? false : true)}
            okText="确认"
            cancelText="取消"
            icon={<QuestionCircleOutlined style={{ color: "orange" }} />}
          >
            <Switch
              checked={record.enabled === "Y"}
              checkedChildren="启用"
              unCheckedChildren="停用"
              size="small"
              disabled={record.source === "SUBSCRIBED"} // 市集订阅禁用
            />
          </Popconfirm>

          <Button type="link" onClick={() => handleEditTimbre(record)}>
            查看
          </Button>

          {record.auditionUrl && (
            <Button
              type="link"
              size="small"
              icon={
                playingAuditionId === record.timbreId ? (
                  <PauseCircleOutlined className="-mr-1" />
                ) : (
                  <PlayCircleOutlined className="-mr-1" />
                )
              }
              onClick={() => handleTimbreAudition(record.auditionUrl, record.timbreId)}
              className="text-[#7F56D9]"
            >
              试听
            </Button>
          )}
        </Space>
      )
    }
  ]

  // 编辑音色
  const handleEditTimbre = (record) => {
    setEditTimbreId(record.timbreId)
    // 判断来源，市集订阅用 marketView 模式
    if (record.source === "SUBSCRIBED") {
      setDrawerMode("marketView")
    } else {
      setDrawerMode("edit")
    }
    setDrawerVisible(true)
  }

  // 删除音色
  const handleDeleteTimbre = async (record) => {
    try {
      const params = {
        botNo,
        timbreId: record.timbreId
      }

      const res = await deleteTimbre(params)

      if (res && res.status === 200) {
        message.success(`已删除音色: ${record.timbreName}`)
        fetchTimbreList()
      } else {
        message.error(res?.message || "删除音色失败")
      }
    } catch (error) {
      console.error("删除音色失败:", error)
      message.error("删除音色失败")
    }
  }

  // 创建音色
  const handleCreateTimbre = () => {
    setDrawerMode("create")
    setEditTimbreId(null)
    setDrawerVisible(true)
  }

  // 处理表格分页、筛选等变化
  const handleTableChange = (pagination, filters) => {
    setFilteredInfo(filters)

    const newParams = {
      ...queryParams,
      pageNum: pagination.current,
      pageSize: pagination.pageSize
    }

    // 处理性别筛选
    if (filters.gender && filters.gender.length > 0) {
      newParams.gender = filters.gender[0]
    } else {
      delete newParams.gender
    }

    // 处理来源筛选
    if (filters.source && filters.source.length > 0) {
      newParams.source = filters.source[0]
    } else {
      delete newParams.source
    }

    setQueryParams(newParams)
  }

  // 处理抽屉关闭
  const handleCloseDrawer = () => {
    setDrawerVisible(false)
    setEditTimbreId(null)
    setDrawerMode("create")
  }

  return (
    <div className={styles.container}>
      <div className="mb-3">
        <div className="flex justify-between">
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateTimbre}>
            创建音色
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => fetchTimbreList()}>
            刷新
          </Button>
        </div>
      </div>

      <div className={styles.tableContainer}>
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
          dataSource={timbreList}
          rowKey="timbreId"
          scroll={{ y: "calc(100vh - 220px)", x: 900 }}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          onChange={handleTableChange}
        />
      </div>

      {/* 统一的音色抽屉组件 */}
      <TimbreDrawer
        visible={drawerVisible}
        onClose={handleCloseDrawer}
        timbreId={editTimbreId}
        botNo={botNo}
        mode={drawerMode}
        onSuccess={fetchTimbreList}
      />
    </div>
  )
}
