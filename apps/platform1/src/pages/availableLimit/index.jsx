import { useEffect, useState } from "react"
import { Table, Button, Form, Input, Row, Col, Pagination, message, Typography } from "antd"
import { debounce } from "lodash"
import FormModal from "./components/form-modal"
import {
  useFetchAvailableLimitDefaultData,
  useFetchAvailableLimitPage,
  useSaveOrUpdateAvailableLimitData
} from "@/api/availableLimit"
import { useFetchAuthResourceListBotResource } from "@/api/permission"

const { Paragraph } = Typography

function AvailableLimit() {
  const [visible, setVisible] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentRecord, setCurrentRecord] = useState({})
  const [filterForm] = Form.useForm()
  const [form] = Form.useForm()
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [params, setParams] = useState({})
  const [sortField, setSortField] = useState("")
  const [sortOrder, setSortOrder] = useState("")
  const [sortAndFilterState, setSortAndFilterState] = useState({
    botNo: ""
  })

  // 从API获取工作流数据
  const { data: { data: tableList = [], totalCount } = {}, refetch } = useFetchAvailableLimitPage({
    pageNum: pagination.current,
    pageSize: pagination.pageSize,
    ...params,
    sortField,
    sortOrder,
    ...sortAndFilterState
  })

  const { data: defaultData } = useFetchAvailableLimitDefaultData()
  const { data: allBotList = [] } = useFetchAuthResourceListBotResource({})
  const { mutate: saveOrUpdateAvailableLimitData } = useSaveOrUpdateAvailableLimitData()

  const handleSortAndFilterChange = (pagination, filters, sorter) => {
    setSortAndFilterState({
      botNo: filters?.botName?.join(",") || ""
    })
    setPagination({ current: 1, pageSize: 10 })
  }

  const columns = [
    {
      title: "工作流名称",
      dataIndex: "skillName",
      width: 200,
      fixed: "left",
      key: "skillName"
    },
    {
      title: "资源名",
      dataIndex: "resource",
      width: 300,
      key: "resource",
      render: (text) => {
        return (
          <Paragraph
            ellipsis={{
              rows: 2,
              expandable: true
            }}
            title={text}
          >
            {text}
          </Paragraph>
        )
      }
    },
    {
      title: "空间名称",
      dataIndex: "botName",
      key: "botName",
      width: 150,
      filterSearch: true,
      filters: allBotList.map((item) => ({
        text: item.name,
        value: item.code
      }))
    },
    {
      title: "操作",
      key: "operation",
      fixed: "right",
      width: 60,
      render: (_, record) => (
        <Button type="link" onClick={() => handleEdit(record)}>
          编辑
        </Button>
      )
    }
  ]

  // 查询
  const handleQuery = debounce(() => {
    filterForm.validateFields().then((values) => {
      setPagination((prev) => ({
        ...prev,
        current: 1,
        pageSize: pagination.pageSize
      }))
      setParams(values)
    })
  }, 1000)

  // 编辑按钮点击事件处理
  const handleEdit = (record) => {
    setCurrentRecord(record)
    setIsEditing(true)
    setVisible(true)
  }

  // 保存按钮点击事件处理
  const handleSave = () => {
    form.validateFields().then((values) => {
      saveOrUpdateAvailableLimitData(
        {
          resource: values.resource,
          botName: values.botName,
          skillName: values.skillName,
          degradeRule: {
            type: values.degradeRuleType,
            grade: values.degradeRuleGrade,
            maxResponseTime: values.degradeRuleMaxResponseTime,
            slowRatioThreshold: values.degradeRuleSlowRatioThreshold / 100,
            timeWindow: values.degradeRuleTimeWindow,
            minRequestAmount: values.degradeRuleMinRequestAmount,
            statIntervalMs: values.degradeRuleStatIntervalMs
          },
          flowRule: {
            type: values.flowRuleType,
            grade: values.flowRuleGrade,
            count: values.flowRuleCount
          }
        },
        {
          onSuccess: (e) => {
            if (e.success) {
              message.success("保存成功")
              refetch()
              setVisible(false)
              form.resetFields()
            } else {
              message.error(e.message || "保存失败")
            }
          }
        }
      )
    })
  }

  useEffect(() => {
    if (!isEditing) {
      form.resetFields()
    }
  }, [form, visible, isEditing])

  return (
    <div>
      <Form form={filterForm} layout="horizontal">
        <Row gutter={16} justify="space-between">
          <Col span={6}>
            <Form.Item name="skillName">
              <Input
                style={{ width: 400 }}
                placeholder="搜索工作流名称"
                onChange={handleQuery}
                allowClear
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
      <Table
        columns={columns}
        dataSource={tableList}
        pagination={false}
        className="pb-4"
        onChange={handleSortAndFilterChange}
        style={{ marginTop: 16 }}
      />

      <Pagination
        className="fixed-pagination"
        current={pagination.current}
        pageSize={pagination.pageSize}
        total={totalCount}
        onChange={(page, pageSize) => setPagination({ current: page, pageSize })}
        showSizeChanger={true}
        style={{ marginTop: "15px", textAlign: "right" }}
        showTotal={(total) => `共 ${total} 条`}
      />
      <FormModal
        form={form}
        record={currentRecord}
        defaultData={defaultData}
        visible={visible}
        handleSave={handleSave}
        setVisible={setVisible}
      />
    </div>
  )
}

export default AvailableLimit
