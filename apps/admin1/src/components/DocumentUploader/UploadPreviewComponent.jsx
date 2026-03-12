import { DeleteOutlined, MinusSquareOutlined } from "@ant-design/icons"
import {
  Button,
  Col,
  Form,
  Input,
  List,
  Modal,
  Pagination,
  Row,
  Table,
  Tooltip,
  message
} from "antd"
import upload5 from "@/assets/img/upload5.png"
import {
  useAddFaq,
  useConfirmAddFaq,
  useDeleteGenerateResult,
  useFetchGenerateResultListByPage
} from "@/api/knowledgeDocument"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "antd/es/form/Form"
import { useState } from "react"
import Iconfont from "@/components/Icon"
import OverflowTooltip from "../overflowTooltip"

const UploadPreviewComponent = ({
  fileList,
  questions,
  setQuestions,
  catalogNo,
  knowledgeBaseNo,
  resultStatusData
}) => {
  const documentNo = resultStatusData.documentNo
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [currentQuestions, setCurrentQuestions] = useState([])
  const [form] = useForm()
  const queryClient = useQueryClient()
  // 加个分页
  const [pagination, setPagination] = useState({ pageNum: 1, pageSize: 10 })
  const { data: tableData = [] } = useFetchGenerateResultListByPage({
    catalogNo,
    knowledgeBaseNo,
    documentNo,
    pageNum: pagination.pageNum,
    pageSize: pagination.pageSize
  })
  const { mutate: deleteItem, isLoading } = useDeleteGenerateResult()
  const { mutate: addFaqItem } = useAddFaq()
  // 设置当前的再加一题
  const { faqList, pages, total } = tableData

  const showModal = (text) => {
    if (!text || text.length === 0) {
      message.error("暂无相似问题")
      return
    }
    setCurrentQuestions(text)
    setIsModalVisible(true)
  }

  // 关闭Modal
  const handleOk = () => {
    setIsModalVisible(false)
  }

  // 关闭Modal
  const handleCancel = () => {
    setIsModalVisible(false)
  }

  const handleDelete = (record) => {
    deleteItem(
      {
        catalogNo,
        knowledgeBaseNo,
        documentNo: documentNo,
        ids: [record.id]
      },
      {
        onSuccess: (e) => {
          console.log(e)
          const { success, message: msg } = e
          if (success) {
            message.success(msg)
            queryClient.invalidateQueries(QUERY_KEYS.GENERATE_RESULT_LIST)
          } else {
            message.error(msg)
          }
        }
      }
    )
  }

  const handleAdd = (v) => {
    const params = {
      catalogNo,
      knowledgeBaseNo,
      documentNo: documentNo,
      question: v.currentQuestion
    }
    addFaqItem(params, {
      onSuccess: (e) => {
        const { success, message: msg } = e
        if (success) {
          message.success(msg)
          queryClient.invalidateQueries(QUERY_KEYS.GENERATE_RESULT_LIST)
          // 清除数据
          form.resetFields()
        } else {
          message.error(msg)
        }
      }
    })
  }

  const onFinish = (values) => {
    console.log(values, "再加一题提交")
    if (values.currentQuestion) {
      handleAdd(values)
    }
  }

  const columns = [
    {
      title: "标准问题",
      dataIndex: "faqQuestion",
      key: "faqQuestion",
      width: 300
    },
    {
      title: "相似问题",
      dataIndex: "faqSimilarityQuestions",
      key: "faqSimilarityQuestions",
      render: (text) => {
        const count = text ? text.length : 0
        return (
          <Tooltip title="点击查看详情">
            <Button type="link" onClick={() => showModal(text)}>
              <Iconfont type={"icon-icon-14guanlian"} className="text-lg" />
              <span
                style={{
                  color: "#7F56D9",
                  marginLeft: 2
                }}
              >
                {count}
              </span>
            </Button>
          </Tooltip>
        )
      }
    },
    {
      title: "答案",
      dataIndex: "faqAnswer",
      key: "faqAnswer",
      render: (description) => (
        <OverflowTooltip text={description} width={400} singleLine={false} overflowCount={50} />
      )
    },
    {
      title: "操作",
      key: "operation",
      render: (_, record) => (
        <Button icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
          删除
        </Button>
      )
    }
  ]

  return (
    <>
      {fileList.length > 0 && (
        <p className="mb-2 font-semibold text-sm">
          文档: <span style={{ color: "#5E5FF8" }}>{fileList[0].name}</span>{" "}
        </p>
      )}
      <Table
        columns={columns}
        dataSource={faqList}
        className="mt-8"
        pagination={false}
        scroll={{ y: "calc(100vh - 420px)" }}
      />
      <Pagination
        current={pagination.pageNum}
        pageSize={pagination.pageSize}
        total={total}
        onChange={(page, pageSize) => setPagination({ pageNum: page, pageSize })}
        showSizeChanger={true}
        style={{ marginTop: "15px", textAlign: "right" }}
        showTotal={(total) => `共 ${total} 条`}
      />

      <Form className="mt-10" onFinish={onFinish} form={form}>
        <div>
          <Row>
            <Col span={20}>
              <Form.Item
                labelCol={{ span: 4 }}
                name={"currentQuestion"}
                rules={[
                  {
                    required: true,
                    message: "请输入再加一题"
                  }
                ]}
              >
                <Input onChange={(e) => {}} placeholder="请输入再加一题" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Button type="primary" className="ml-2" htmlType="submit">
                再加一题
              </Button>
            </Col>
          </Row>
        </div>
      </Form>

      <Modal
        title="相似问题列表"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <List
          bordered
          dataSource={currentQuestions}
          renderItem={(item) => <List.Item>{item}</List.Item>}
        />
      </Modal>
    </>
  )
}

export default UploadPreviewComponent
