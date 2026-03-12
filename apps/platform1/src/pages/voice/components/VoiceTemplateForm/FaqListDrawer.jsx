import { useState, useEffect } from "react"
import { Drawer, Table, Button, Input, message, Tag, Tooltip } from "antd"
import { SearchOutlined, SettingOutlined } from "@ant-design/icons"
import { fetchFaqListByPage } from "@/api/knowledge/api"
import { DEFAULTNAMESPACE } from "@/constants"
import FaqScriptModal from "./FaqScriptModal"

const FaqListDrawer = ({
  visible,
  onClose,
  knowledgeItem,
  botNo,
  taskId,
  timbreCode,
  timbreName
}) => {
  const [loading, setLoading] = useState(false)
  const [faqList, setFaqList] = useState([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const [searchText, setSearchText] = useState("")

  // 关联话术弹窗状态
  const [scriptModalVisible, setScriptModalVisible] = useState(false)
  const [selectedFaqRecord, setSelectedFaqRecord] = useState(null)

  // 获取FAQ列表
  const fetchFaqList = async (pageNum = 1, pageSize = 10, question = "") => {
    if (!knowledgeItem?.knowledgeBaseNo || !knowledgeItem?.baseNo) {
      return
    }

    try {
      setLoading(true)
      const response = await fetchFaqListByPage({
        knowledgeBaseNo: knowledgeItem.knowledgeBaseNo,
        catalogNo: knowledgeItem.baseNo,
        pageNum,
        pageSize,
        question
      })

      if (response && response.faqList) {
        setFaqList(response.faqList)
        setPagination({
          current: pageNum,
          pageSize,
          total: response.total || 0
        })
      }
    } catch (error) {
      console.error("获取FAQ列表失败:", error)
      message.error("获取FAQ列表失败")
    } finally {
      setLoading(false)
    }
  }

  // 当抽屉打开时获取数据
  useEffect(() => {
    if (visible && knowledgeItem) {
      fetchFaqList(1, 10, searchText)
    }
  }, [visible, knowledgeItem])

  // 搜索处理
  // const handleSearch = (value) => {
  //   setSearchText(value)
  //   fetchFaqList(1, pagination.pageSize, value)
  // }

  // 分页处理
  const handleTableChange = (paginationInfo) => {
    fetchFaqList(paginationInfo.current, paginationInfo.pageSize, searchText)
  }

  // 管理话术按钮处理
  const handleManageScript = (record) => {
    setSelectedFaqRecord(record)
    setScriptModalVisible(true)
  }

  // 关闭关联话术弹窗
  const handleScriptModalClose = () => {
    setScriptModalVisible(false)
    setSelectedFaqRecord(null)
  }

  // 表格列定义
  const columns = [
    {
      title: "知识编号",
      dataIndex: "faqNo",
      key: "faqNo",
      width: 200,
      render: (text) => (
        <Tooltip title={text}>
          <span className="text-xs text-gray-600 font-mono">{text}</span>
        </Tooltip>
      )
    },
    {
      title: "标准问题",
      dataIndex: "faqQuestion",
      key: "faqQuestion",
      ellipsis: {
        showTitle: false
      },
      render: (text) => (
        <Tooltip title={text}>
          <span className="text-sm">{text}</span>
        </Tooltip>
      )
    },
    {
      title: "相似问题",
      dataIndex: "faqSimilarityQuestions",
      key: "faqSimilarityQuestions",
      width: 200,
      render: (questions) => {
        if (!questions || questions.length === 0) {
          return <span className="text-gray-400 text-xs">暂无相似问题</span>
        }
        return (
          <div className="space-y-1">
            {questions.slice(0, 2).map((q, index) => (
              <Tag key={index} className="text-xs">
                {q.length > 20 ? `${q.slice(0, 20)}...` : q}
              </Tag>
            ))}
            {questions.length > 2 && (
              <Tooltip title={questions.slice(2).join(", ")}>
                <Tag className="text-xs cursor-pointer">+{questions.length - 2}个</Tag>
              </Tooltip>
            )}
          </div>
        )
      }
    },
    {
      title: "操作",
      key: "action",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => handleManageScript(record)}
          className="text-purple-600"
        >
          关联话术
        </Button>
      )
    }
  ]

  return (
    <Drawer
      title={`FAQ列表 - ${knowledgeItem?.baseName || ""}`}
      placement="right"
      width={800}
      open={visible}
      onClose={onClose}
      destroyOnClose
    >
      <div className="space-y-4">
        {/* 搜索框 */}
        {/* <div className="flex gap-2">
          <Input.Search
            placeholder="搜索标准问题"
            allowClear
            enterButton={<SearchOutlined />}
            onSearch={handleSearch}
            className="flex-1"
          />
        </div> */}

        {/* 表格 */}
        <Table
          columns={columns}
          dataSource={faqList}
          loading={loading}
          rowKey="faqNo"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `共 ${total} 条`
          }}
          onChange={handleTableChange}
          scroll={{ y: "70vh", x: 700 }}
        />
      </div>

      {/* 关联话术弹窗 */}
      <FaqScriptModal
        visible={scriptModalVisible}
        onClose={handleScriptModalClose}
        faqRecord={selectedFaqRecord}
        botNo={botNo}
        taskId={taskId}
        timbreCode={timbreCode}
        timbreName={timbreName}
      />
    </Drawer>
  )
}

export default FaqListDrawer
