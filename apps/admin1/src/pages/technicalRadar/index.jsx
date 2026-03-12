import { useState } from "react"
import { Table, Button, Form, Input, Row, Col, Pagination, Tag, Tooltip, message } from "antd"
import { debounce } from "lodash"
import ApprovalModal from "./components/ApprovalModal"
import { ApproveStatus } from "./config"
import {
  useFetchTechnicalRadarListApi,
  useFetchTechnicalRadarApproveApi
} from "@/api/technicalRadar"

const TechnicalRadar = () => {
  const [filterForm] = Form.useForm()
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [params, setParams] = useState({})
  const [visible, setVisible] = useState(false)
  const [curData, setCurData] = useState(null)
  const { data, isLoading, refetch } = useFetchTechnicalRadarListApi({
    pageSize: pagination.pageSize,
    pageNum: pagination.current,
    ...params
  })
  const { mutate: updateApprove } = useFetchTechnicalRadarApproveApi()

  // 通过
  const handleApprove = (props) => {
    updateApprove(
      {
        technologyNo: props?.technologyNo,
        approveStatus: "pass"
      },
      {
        onSuccess: () => {
          setVisible(false)
          refetch()
        }
      }
    )
  }

  // 拒绝
  const handleReject = (props) => {
    updateApprove(
      {
        technologyNo: props?.technologyNo,
        approveStatus: "reject",
        rejectReason: props?.rejectReason
      },
      {
        onSuccess: () => {
          setVisible(false)
          refetch()
        }
      }
    )
  }

  const handleQuery = debounce(() => {
    filterForm.validateFields().then((values) => {
      setPagination((prev) => {
        return {
          ...prev,
          current: 1
        }
      })
      setParams((pre) => {
        return {
          ...pre,
          ...values
        }
      })
    })
  }, 1000)

  const handleSortOrFilterChange = (pagination, _filters = {}, sorter) => {
    const { order, field } = sorter
    let orderField
    if (field === "submitTime") {
      orderField = "submit_time"
    }
    setParams((pre) => ({
      ...pre,
      orderField,
      asc: !order ? undefined : order === "ascend"
    }))
  }

  const columns = [
    {
      title: "技术审批编号",
      width: 120,
      dataIndex: "approveNo",
      key: "approveNo"
    },
    {
      title: "状态",
      width: 120,
      dataIndex: "approveStatus",
      key: "approveStatus",
      render: (status, record) => {
        if (!record?.approveStatus) return
        const tagStyle = { width: 60, textAlign: "center", display: "inline-block" }
        if (record?.approveStatus === "reject") {
          return (
            <Tooltip title={record.rejectReason}>
              <Tag
                color={ApproveStatus[record?.approveStatus]?.color}
                style={{ ...tagStyle, cursor: "pointer" }}
              >
                {record?.approveStatusName}
              </Tag>
            </Tooltip>
          )
        }
        return (
          <Tag color={ApproveStatus[record?.approveStatus]?.color} style={tagStyle}>
            {record?.approveStatusName}
          </Tag>
        )
      }
    },
    {
      title: "技术名称",
      width: 200,
      dataIndex: "name",
      key: "name"
    },
    {
      title: "技术类型",
      dataIndex: "quadrantKeyName",
      key: "quadrantKeyName",
      width: 150
    },
    {
      title: "技术定位",
      dataIndex: "ringKeyName",
      key: "ringKeyName",
      width: 150
    },
    {
      title: "提交人",
      dataIndex: "submitUserName",
      key: "submitUserName",
      width: 150
    },
    {
      title: "提交时间",
      dataIndex: "submitTime",
      key: "submitTime",
      width: 200,
      sorter: true
    },
    {
      title: "操作",
      width: 100,
      key: "operation",
      fixed: "right",
      render: (_, record) => (
        <>
          {record.approveStatus === "approving" && (
            <Button
              type="link"
              onClick={() => {
                setVisible(true)
                setCurData(record)
              }}
              className="p-0"
            >
              审批
            </Button>
          )}
        </>
      )
    }
  ]

  return (
    <>
      <Form form={filterForm} layout="horizontal">
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="name">
              <Input placeholder="请输入技术名称搜索" onChange={handleQuery} allowClear />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="approveNo">
              <Input placeholder="请输入技术审批编号搜索" onChange={handleQuery} allowClear />
            </Form.Item>
          </Col>
        </Row>
      </Form>
      <Table
        rowKey="technologyNo"
        columns={columns}
        dataSource={data?.data}
        loading={isLoading}
        pagination={false}
        className="pb-4"
        scroll={{ x: "max-content" }}
        onChange={handleSortOrFilterChange}
        style={{ marginTop: 16 }}
      />
      <Pagination
        className="fixed-pagination"
        current={pagination.current}
        pageSize={pagination.pageSize}
        total={data?.totalCount ?? 0}
        onChange={(page, pageSize) => setPagination({ current: page, pageSize })}
        showSizeChanger={true}
        style={{ marginTop: "15px", textAlign: "right" }}
        showTotal={(total) => `共 ${total} 条`}
      />
      <ApprovalModal
        visible={visible}
        detailData={curData}
        onCancel={() => {
          setVisible(false)
          setCurData(null)
        }}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </>
  )
}

export default TechnicalRadar
