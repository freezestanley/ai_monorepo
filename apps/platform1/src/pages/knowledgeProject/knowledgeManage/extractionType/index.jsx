import { useState } from "react"
import { useLocation } from "react-router-dom"
import queryString from "query-string"
import { Button, Popconfirm, Table, Space, Input, message } from "antd"
import { CheckOutlined, CloseOutlined } from "@ant-design/icons"
import PageContainer from "@/components/PageContainer"
import {
  useTaskTypeListApi,
  useDeleteTaskTypeApi,
  useUpdateTaskTypeDescApi
} from "@/api/knowledgeExtraction"
import FormDrawer from "./formDrawer"

export const skillTypeEnum = {
  0: "萃取",
  1: "打标"
}

const ExtractionType = () => {
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search) ?? {}
  const { botNo } = queryParams
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editableId, setEditableId] = useState(null)
  const { data: taskTypeList } = useTaskTypeListApi({ botNo })
  const { mutate: deleteTaskType } = useDeleteTaskTypeApi()
  const { mutate: updateTaskTypeDesc } = useUpdateTaskTypeDescApi()

  const columns = [
    {
      title: "任务类型",
      dataIndex: "desc",
      render: (v, record) => {
        if (editableId === record.taskType) {
          return (
            <Space>
              <Input
                autoFocus
                defaultValue={v}
                onChange={(e) => {
                  record.reqText = e.target.value
                }}
              />
              <div style={{ width: "100%", textAlign: "right" }}>
                <CheckOutlined
                  style={{ color: "green" }}
                  onClick={() => {
                    if (!record.reqText) {
                      return
                    }
                    updateTaskTypeDesc(
                      {
                        taskType: record.taskType,
                        desc: record.reqText
                      },
                      {
                        onSuccess: (res) => {
                          if (res.success) {
                            setEditableId(null)
                            message.success("编辑成功")
                          }
                        }
                      }
                    )
                  }}
                />
                <CloseOutlined
                  style={{ color: "red", marginLeft: 5 }}
                  onClick={() => setEditableId(null)}
                />
              </div>
            </Space>
          )
        } else {
          return v
        }
      }
    },
    {
      title: "工作流类型",
      dataIndex: "skillType",
      render: (text) => skillTypeEnum[text]
    },
    {
      title: "绑定工作流",
      dataIndex: "skillName"
    },
    {
      title: "工作流状态",
      dataIndex: "skillStatus"
    },
    {
      title: "创建信息",
      dataIndex: "creator",
      render: (text, record) => (
        <>
          {text}
          <br />
          {record.gmtCreated}
        </>
      )
    },
    {
      title: "操作",
      dataIndex: "action",
      fixed: "right",
      render: (_, record) => (
        <>
          <Button
            type="link"
            style={{ paddingLeft: 0, paddingRight: 0 }}
            onClick={() => setEditableId(record.taskType)}
            disabled={!!editableId}
          >
            编辑
          </Button>
          <Popconfirm
            title="是否确认删除？"
            onConfirm={() =>
              deleteTaskType(
                { taskType: record.taskType },
                {
                  onSuccess: () => {
                    message.success("操作成功")
                  }
                }
              )
            }
          >
            <Button type="link" danger disabled={!!editableId}>
              删除
            </Button>
          </Popconfirm>
        </>
      )
    }
  ]

  return (
    <PageContainer
      headerTitle="萃取类型"
      headerCustomeSearch={
        <div className="text-right">
          <Button type="primary" onClick={() => setDrawerOpen(true)}>
            新增
          </Button>
        </div>
      }
    >
      <Table
        rowKey={"taskType"}
        columns={columns}
        dataSource={taskTypeList}
        pagination={false}
        scroll={{ y: "calc(100vh - 250px)" }}
      />
      <FormDrawer botNo={botNo} visiable={drawerOpen} setVisiable={setDrawerOpen} />
    </PageContainer>
  )
}
export default ExtractionType
