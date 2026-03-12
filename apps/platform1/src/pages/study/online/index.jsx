import { useCallback, useRef, useState } from "react"
import { Button, Form, message, Popconfirm, Space } from "antd"
import EnableSwitch from "@/components/EnableSwitch"
import TableRender from "table-render"
import { useLocation } from "react-router-dom"
import queryString from "query-string"
import StudyDrawer from "./StudyDrawer"
import { deleteStudyTask, getStudyTaskList, updateStudyTaskStatus } from "./request"
import { getSchema } from "./schema"
import { TableFilter } from "@/utils/tableFliter"
import { PlusOutlined } from "@ant-design/icons"
export default () => {
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)
  const { botNo } = queryParams

  const tableRef = useRef()
  const [form] = Form.useForm()
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [searchParams, setSearchParams] = useState({})
  const [realTotal, setRealTotal] = useState(0)

  const refreshTableData = (value) => {
    if (tableRef.current) {
      tableRef.current.refresh({ stay: true })
    }
  }

  const handleDelete = useCallback(
    async (taskNo) => {
      try {
        await deleteStudyTask(botNo, taskNo)
        message.success("删除成功")
        refreshTableData()
      } catch (error) {
        message.error("删除失败")
      }
    },
    [botNo]
  )

  const handleStatusChange = useCallback(
    async (checked, record) => {
      try {
        await updateStudyTaskStatus(botNo, record.taskNo, checked ? 1 : 0)
        message.success(`${checked ? "启用" : "停用"}成功`)
        refreshTableData()
      } catch (error) {
        message.error(`${checked ? "启用" : "停用"}失败`)
      }
    },
    [botNo]
  )

  const columns = [
    {
      title: "在线学习任务编号",
      dataIndex: "taskNo",
      width: 200,
      ...TableFilter({
        form,
        searchParams,
        refresh: refreshTableData,
        dataIndex: "taskNo",
        fieldType: "input"
      })
    },
    {
      title: "在线学习任务名称",
      dataIndex: "name",
      width: 200,
      ...TableFilter({
        form,
        searchParams,
        refresh: refreshTableData,
        dataIndex: "name",
        fieldType: "input"
      })
    },
    {
      title: "创建信息",
      dataIndex: "creator",
      sorter: true,
      width: 200,
      render: (_, record) => (
        <>
          <div>{record.creator}</div>
          <div>{record.gmtCreated}</div>
        </>
      )
    },
    {
      title: "更新信息",
      dataIndex: "modifier",
      sorter: true,
      width: 200,
      render: (_, record) => (
        <>
          <div>{record.modifier}</div>
          <div>{record.gmtModified}</div>
        </>
      )
    },
    {
      title: "操作",
      width: 150,
      fixed: "right",
      render: (_, record) => {
        const status = record.status
        return (
          <Space>
            <EnableSwitch
              checked={status === 1}
              onChange={(checked) => handleStatusChange(checked, record)}
              showConfirm={true}
              checkedChildren="启用"
              unCheckedChildren="停用"
              confirmCheckedTitle="是否停用该在线学习任务?"
              confirmUncheckedTitle="是否启用该在线学习任务?"
              okText="是"
              cancelText="否"
              popconfirmProps={{
                placement: "topRight"
              }}
            />
            <Button
              type="link"
              onClick={() => {
                setCurrentRecord(record)
                setDrawerVisible(true)
              }}
            >
              编辑
            </Button>
            <Popconfirm
              title="是否确认删除该在线学习任务?"
              okText="是"
              cancelText="否"
              onConfirm={() => handleDelete(record.taskNo)}
            >
              <Button type="link">删除</Button>
            </Popconfirm>
          </Space>
        )
      }
    }
  ]

  const request = async ({ current: pageNum, ...params }, sorter) => {
    const searchParam = form.getFieldsValue()
    setSearchParams(searchParam)
    const sort = {
      field: "",
      asc: false
    }
    if (sorter?.field && sorter?.order) {
      sort.field = sorter.field
      sort.asc = sorter.order === "ascend"
    }

    const requestParams = {
      ...searchParam,
      pageNum,
      ...params,
      sort,
      botNo
    }
    const res = await getStudyTaskList(requestParams)
    setRealTotal(res.data.totalCount)
    return {
      data: res.data.list,
      total: res.data.totalCount
    }
  }

  return (
    <div className="overflow-auto h-full table-xrender-container !bg-white">
      <div className="table-xrender-container-insert">
        <Form form={form}>
          <TableRender
            className="call-logs-table call-logs-render-v2"
            ref={tableRef}
            toolbarRender={
              <>
                <Button
                  type="primary"
                  onClick={() => {
                    setCurrentRecord(null)
                    setDrawerVisible(true)
                  }}
                  icon={<PlusOutlined />}
                >
                  创建
                </Button>
              </>
            }
            columns={columns}
            request={request}
            rowKey="taskNo"
            scroll={{ x: 1200 }}
            pagination={{
              showSizeChanger: true,
              showTotal: () => `共${realTotal || 0}条`
            }}
            sortMultiple={true}
          />
        </Form>
      </div>

      <StudyDrawer
        visible={drawerVisible}
        setVisible={setDrawerVisible}
        record={currentRecord}
        botNo={botNo}
        refreshTableData={refreshTableData}
      />
    </div>
  )
}
