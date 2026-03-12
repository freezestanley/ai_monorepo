// @ts-ignore
import { useState, useRef } from "react"
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Row,
  Col,
  message,
  Pagination,
  Space,
  Select,
  notification,
  Upload,
  Spin,
  Tag
} from "antd"
import { DeleteOutlined, InboxOutlined, LeftOutlined } from "@ant-design/icons"
import { useDeleteDataById, useGetDataListByPage, useImportTestSetData } from "@/api/testSet"
import { useLocation, useNavigate } from "react-router-dom"
import queryString from "query-string"
import { debounce } from "lodash"
import { exportTestSetData, importTestDataUrl } from "@/api/testSet/api"
import { getTokenAndServiceName } from "@/api/sso"
import OverflowTooltip from "@/components/overflowTooltip"
import TestDataEditModal from "./TestDataEditModal"
const Dragger = Upload.Dragger
function TestSetDataList() {
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)
  const { botNo, setNo, studioenv, setName } = queryParams
  const navigate = useNavigate()

  const [messageApi, contextHolder] = message.useMessage()
  const [exportLoading, setExportLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [isImportModalVisible, setIsImportModalVisible] = useState(false)
  const uploadFileId = useRef(null)
  const [_, forceUpdate] = useState("")

  const [visible, setVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [filterForm] = Form.useForm()
  const [params, setParams] = useState({})
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10
  })

  const { data: { list = [], totalCount } = {}, refetch } = useGetDataListByPage(botNo, setNo, {
    pageNum: pagination.current,
    pageSize: pagination.pageSize,
    ...params
  })

  const { mutate: deleteDataById } = useDeleteDataById(botNo, setNo)
  const { mutate: importTestSetData, isLoading: importTestSetLoading } = useImportTestSetData()

  const handleImport = () => {
    setIsImportModalVisible(true)
  }

  const handleDelete = (record) => {
    Modal.confirm({
      title: "确认【删除】该测试数据吗？",
      icon: <DeleteOutlined />,
      // content: "删除后不可恢复",
      okText: "确认",
      cancelText: "取消",
      onOk: () => {
        deleteDataById(record.dataId, {
          onSuccess: (e) => {
            // @ts-ignore
            if (e.success) {
              message.success("删除成功")
              refetch()
            } else {
              // @ts-ignore
              message.error(e.message)
            }
          }
        })
      }
    })
  }

  const handleEdit = (record) => {
    setCurrentRecord(record)
    setVisible(true)
  }

  const handleCreate = () => {
    setCurrentRecord(null)
    setVisible(true)
  }

  const handleSuccess = () => {
    refetch()
  }

  const handleCancel = () => {
    setVisible(false)
  }

  const handleImportCancel = () => {
    setIsImportModalVisible(false)
  }

  const columns = [
    {
      title: "测试数据编号",
      dataIndex: "dataId",
      width: 150,
      render: (text) => <OverflowTooltip text={text} overflowCount={86} singleLine={false} />
    },
    {
      title: "请求内容",
      dataIndex: "input",
      render: (text, record) => {
        // 兼容新旧数据格式
        if (text) {
          return <OverflowTooltip text={text} overflowCount={86} singleLine={false} />
        } else if (record.requests && record.requests.length > 0) {
          // 新格式：使用 Tag 显示所有请求内容
          return (
            <Space size={4} direction="vertical">
              {record.requests?.slice(0, 2)?.map((request, index) => (
                <Tag key={index} color="blue">
                  <OverflowTooltip
                    text={request.input || "-"}
                    overflowCount={86}
                    singleLine={false}
                  />
                </Tag>
              ))}
              {record.requests?.length > 2 && (
                <Tag color="blue">+ {record.requests?.length - 2}条</Tag>
              )}
            </Space>
          )
        }
        return "-"
      }
    },
    {
      title: "期望响应内容",
      dataIndex: "expectResult",
      render: (text, record) => {
        // 兼容新旧数据格式
        if (text) {
          return <OverflowTooltip text={text} overflowCount={86} singleLine={false} />
        } else if (record.requests && record.requests.length > 0) {
          // 新格式：使用 Tag 显示所有期望响应内容
          return (
            <Space size={4} direction="vertical">
              {record.requests?.slice(0, 2)?.map((request, index) => (
                <Tag key={index} color="green">
                  <OverflowTooltip
                    text={request.clauseAssertExpectResult || "-"}
                    overflowCount={86}
                    singleLine={false}
                  />
                </Tag>
              ))}
              {record.requests?.length > 2 && (
                <Tag color="green">+ {record.requests?.length - 2}条</Tag>
              )}
            </Space>
          )
        }
        return "-"
      }
    },
    {
      title: "原响应内容",
      dataIndex: "output",
      render: (text) => (
        <>{text ? <OverflowTooltip text={text} overflowCount={86} singleLine={false} /> : "-"}</>
      )
    },
    {
      title: "原请求ID",
      dataIndex: "requestId",
      width: 200,
      render: (text) => (
        <>{text ? <OverflowTooltip text={text} overflowCount={86} singleLine={false} /> : "-"}</>
      )
    },
    {
      title: "操作",
      width: 140,
      fixed: "right",
      render: (_, record) => (
        <>
          <Button className="p-0" type="link" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" style={{ marginLeft: 8 }} onClick={() => handleDelete(record)}>
            删除
          </Button>
        </>
      )
    }
  ]

  const fieldKeyOptions = columns
    .filter((item) => {
      return item.dataIndex
    })
    .map((col) => {
      return { label: col.title, value: col.dataIndex }
    })

  const fieldKeyChange = () => {}

  const handleQuery = debounce(() => {
    filterForm
      .validateFields()
      .then((values) => {
        setParams({
          [values.searchFieldKey]: values["content"]
        })
        setPagination({ pageSize: pagination.pageSize, current: 1 })
      })
      .catch((errorInfo) => {
        console.log("Failed:", errorInfo)
      })
  }, 1000)
  const handleExport = () => {
    const data = {
      botNo,
      setNo,
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
      studioenv,
      ...params
    }
    setExportLoading(true)
    // @ts-ignore
    exportTestSetData(data)
      .then((res) => {
        const successMsg = "导出完成！"
        messageApi.destroy()
        messageApi.open({
          type: res ? "success" : "error",
          content: res ? successMsg : "导出失败！",
          duration: 3
        })
      })
      .catch(() => {
        messageApi.destroy()
        messageApi.open({
          type: "error",
          content: "导出失败！",
          duration: 3
        })
      })
      .finally(() => {
        setExportLoading(false)
      })
    messageApi.open({
      type: "info",
      content: "开始导出，可能需要一段时间，请耐心等待~",
      duration: 10
    })
  }

  const handleModalOk = () => {
    const formData = new FormData()
    formData.append("file", uploadFileId.current)
    importTestSetData(
      {
        botNo,
        setNo,
        body: formData
      },
      {
        onSuccess: (e) => {
          // @ts-ignore
          if (e.success) {
            refetch()
            setIsImportModalVisible(false)
            notification.success({
              // @ts-ignore
              message: e.message,
              description: "上传成功"
            })
          } else {
            notification.warning({
              message: "出错了",
              // @ts-ignore
              description: e.message
            })
          }
        }
      }
    )
  }
  const uploadProps = {
    // 这里可以定义上传文件的处理逻辑，例如上传到后端服务器
    maxCount: 1,
    headers: {
      "X-Usercenter-Session": getTokenAndServiceName().token
    },
    action: importTestDataUrl({
      botNo,
      setNo
    }),
    beforeUpload: (file) => {
      uploadFileId.current = file
      forceUpdate("beforeUpload")
      return false
    },
    onRemove: () => {
      uploadFileId.current = null
      forceUpdate("onRemove")
    }
  }
  const handleDownload = () => {
    setDownloading(true)
    const url =
      "https://cdn.zaticdn.com/if/ipage/prd/data/image/8f53b5c0-fd6d-41c2-8165-4b54f7ae5622/89e1a06c-2655-4413-82f9-9cd438ed0b7b/LX-Test-set-template.xlsx"
    fetch(url)
      .then((response) => {
        if (response.ok) {
          return response.blob()
        } else {
          throw new Error("下载失败")
        }
      })
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = blobUrl
        link.download = "灵犀平台测试数据上传模板.xlsx"
        document.body.appendChild(link)
        link.click()
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl)
          document.body.removeChild(link)
        }, 100)
      })
      .catch((error) => {
        console.error(error)
      })
      .finally(() => {
        setDownloading(false)
      })
  }

  return (
    <div className="admin-container">
      <Form form={filterForm} layout="horizontal">
        <div className="admin-header">
          <div className="flex items-center justify-between w-full">
            <h2 className="flex items-center">
              <LeftOutlined
                onClick={() => {
                  navigate(-1)
                }}
                style={{
                  marginRight: 10,
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#000",
                  cursor: "pointer"
                }}
              />
              {setName}
            </h2>
          </div>
          <Row justify="space-between" className="mt-[20px]">
            <Col>
              <Space.Compact style={{ marginRight: 20 }}>
                <Form.Item name="searchFieldKey" initialValue="dataId">
                  <Select
                    style={{ width: 130 }}
                    options={fieldKeyOptions}
                    onChange={fieldKeyChange}
                  />
                </Form.Item>
                <Form.Item name="content">
                  <Input
                    placeholder="请输入搜索字段内容"
                    style={{ width: 420 }}
                    onChange={handleQuery}
                    onPressEnter={handleQuery}
                    allowClear={true}
                  />
                </Form.Item>
              </Space.Compact>
            </Col>
            <Col>
              <div>
                <Space.Compact>
                  <Button onClick={handleImport}>导入</Button>
                  <Button loading={exportLoading} onClick={handleExport}>
                    导出
                  </Button>
                </Space.Compact>

                <Button type="primary" className="ml-2" onClick={handleCreate}>
                  新增测试数据
                </Button>
              </div>
            </Col>
          </Row>
        </div>
      </Form>
      <div className="admin-content ">
        <Table
          columns={columns}
          dataSource={list}
          pagination={false}
          scroll={{ y: 650, x: 900 }}
          className="table-style-v2"
          rowClassName={(record, index) => {
            if (index % 2 === 0) {
              return "table-style-v2-even-row"
            } else {
              return "table-style-v2-odd-row"
            }
          }}
        />
        <Pagination
          size="small"
          current={pagination.current}
          pageSize={pagination.pageSize}
          total={totalCount}
          showTotal={(total) => `共${total}条`}
          onChange={(page, pageSize) => setPagination({ current: page, pageSize })}
          showSizeChanger={true}
          style={{ marginTop: "15px", textAlign: "right" }}
        />
      </div>

      <TestDataEditModal
        visible={visible}
        onCancel={handleCancel}
        onSuccess={handleSuccess}
        currentRecord={currentRecord}
        botNo={botNo}
        setNo={setNo}
      />
      <Modal
        title="添加文档"
        open={isImportModalVisible}
        onOk={handleModalOk}
        onCancel={handleImportCancel}
        okButtonProps={{
          loading: importTestSetLoading,
          disabled: !uploadFileId.current
        }}
      >
        <Dragger
          // @ts-ignore
          Dragger
          {...uploadProps}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p>
            将文档拖拽到此处，或
            <span style={{ color: "#5E5FF8" }}>本地上传</span>
          </p>
        </Dragger>
        <Button type="link" onClick={handleDownload} loading={downloading}>
          下载模板
        </Button>
      </Modal>
      {contextHolder}
      <Spin spinning={importTestSetLoading} />
    </div>
  )
}

export default TestSetDataList
