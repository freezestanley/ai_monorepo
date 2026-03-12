import { useState } from "react"
import { Button, Table, Pagination, Modal, message } from "antd"
import { useLocation, useNavigate } from "react-router-dom"
import { ArrowLeftOutlined } from "@ant-design/icons"
import queryString from "query-string"
import { useQueryClient } from "@tanstack/react-query"
import {
  useFetchTestSetPage,
  useFetchAgentTestSetPage,
  useDeleteTestSet,
  useDeleteAgentTestSet,
  useCancelTestSet,
  useCancelAgentTestSet,
  useContinueTestSet,
  useContinueAgentTestSet
} from "@/api/batchTest"
import { QUERY_KEYS } from "@/constants/queryKeys"
import BatchTestDrawer from "./components/BatchTestDrawer"

const BatchTesting = () => {
  const location = useLocation()
  const { search } = location
  const { type, botNo, skillNo, agentNo, name, view } = queryString.parse(search)
  const [pagination, setPagination] = useState({ pageNum: 1, pageSize: 10 })
  const [visible, setVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [currentId, setCurrentId] = useState(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { mutate: deleteTest } = useDeleteTestSet()
  const { mutate: deleteAgentTest } = useDeleteAgentTestSet()
  const { mutate: cancelTestSet } = useCancelTestSet()
  const { mutate: cancelAgentTestSet } = useCancelAgentTestSet()
  const { mutate: continueTestSet } = useContinueTestSet()
  const { mutate: continueAgentTestSet } = useContinueAgentTestSet()

  const { data: testSetPageData, isLoading } = useFetchTestSetPage(
    {
      botNo,
      skillNo,
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize
    },
    {
      enabled: type === "skill"
    }
  )

  const { data: agentTestSetPageData, isLoading: agentIsLoading } = useFetchAgentTestSetPage(
    {
      botNo,
      agentNo,
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize
    },
    {
      enabled: type === "agent"
    }
  )

  const handleContinue = (record) => {
    Modal.confirm({
      title: "续跑测试",
      content: "确定续跑该测试吗?",
      okText: "确定",
      cancelText: "取消",
      onOk: () => {
        ;(type === "skill" ? continueTestSet : continueAgentTestSet)(
          {
            id: record.id,
            botNo,
            ...(type === "skill" ? { skillNo } : { agentNo })
          },
          {
            onSuccess: (e) => {
              if (e.success) {
                message.success(e.message)
                queryClient.invalidateQueries([
                  QUERY_KEYS[type === "skill" ? "TEST_SET_PAGE" : "AGENT_TEST_SET_PAGE"]
                ])
              } else {
                message.error(e.message)
              }
            }
          }
        )
      }
    })
  }

  const handleCancel = (record) => {
    Modal.confirm({
      title: "中止测试",
      content: "确定中止该测试吗?",
      okText: "确定",
      cancelText: "取消",
      onOk: () => {
        ;(type === "skill" ? cancelTestSet : cancelAgentTestSet)(
          {
            id: record.id,
            botNo,
            ...(type === "skill" ? { skillNo } : { agentNo })
          },
          {
            onSuccess: (e) => {
              if (e.success) {
                message.success(e.message)
                queryClient.invalidateQueries([
                  QUERY_KEYS[type === "skill" ? "TEST_SET_PAGE" : "AGENT_TEST_SET_PAGE"]
                ])
              } else {
                message.error(e.message)
              }
            }
          }
        )
      }
    })
  }

  const handleDelete = (record) => {
    Modal.confirm({
      title: "删除测试",
      content: "确定删除该测试吗?",
      okText: "确定",
      cancelText: "取消",
      onOk: () => {
        ;(type === "skill" ? deleteTest : deleteAgentTest)(
          {
            id: record.id,
            botNo,
            ...(type === "skill" ? { skillNo } : { agentNo })
          },
          {
            onSuccess: (e) => {
              if (e.success) {
                message.success(e.message)
                queryClient.invalidateQueries([
                  QUERY_KEYS[type === "skill" ? "TEST_SET_PAGE" : "AGENT_TEST_SET_PAGE"]
                ])
              } else {
                message.error(e.message)
              }
            }
          }
        )
      }
    })
  }

  const viewTest = (record) => {
    setCurrentStep(2)
    setCurrentId(record.id)
    setVisible(true)
    // refetch()
  }

  const columns = [
    {
      title: "版本",
      dataIndex: "bizVersionName",
      key: "bizVersionName",
      width: 80
    },
    {
      title: "测试开始时间",
      dataIndex: "gmtCreated",
      key: "gmtCreated",
      width: 120
    },
    {
      title: "测试结束时间",
      dataIndex: "gmtModified",
      key: "gmtModified",
      width: 120
    },
    {
      title: "测试集",
      dataIndex: "setName",
      key: "setName",
      render: (text) => {
        return <div>{text || "--"}</div>
      }
    },
    { title: "测试数据量", dataIndex: "testCount", key: "testCount" },
    { title: "测试人", dataIndex: "modifier", key: "modifier" },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (text) => (
        <>
          {text === "RUNNING"
            ? "执行中"
            : text === "SUCCESS"
              ? "已完成"
              : text === "CANCEL"
                ? "已中止"
                : "失败"}
        </>
      )
    },
    {
      title: "分句正确率",
      dataIndex: "accuracy",
      key: "accuracy",
      render: (text) => {
        return text === -1 ? "-" : (text ?? 0) + "%"
      }
    },
    {
      title: "总结正确率",
      dataIndex: "summaryAccuracy",
      key: "summaryAccuracy",
      render: (text) => {
        return text === -1 ? "-" : (text ?? 0) + "%"
      }
    },
    {
      title: "操作",
      key: "action",
      render: (_, record) => (
        <span>
          <Button type="link" onClick={() => viewTest(record)} className="p-0">
            查看
          </Button>
          {record.status === "RUNNING" && (
            <Button type="link" onClick={() => handleCancel(record)} className="p-0 pl-3">
              中止
            </Button>
          )}
          {(record.status === "CANCEL" || record.status === "FAILED") && (
            <Button type="link" onClick={() => handleContinue(record)} className="p-0 pl-3">
              续跑
            </Button>
          )}
          <Button type="link" onClick={() => handleDelete(record)}>
            删除
          </Button>
        </span>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-[#EFF1F4]">
      <div className="flex items-center justify-between px-[20px] py-[12px] h-[60px] bg-white mb-[8px]">
        <div className="flex items-center min-w-[450px]">
          <div
            className="text-[16px] text-[#181B25] font-[600] flex items-center cursor-pointer"
            onClick={() => {
              navigate(-1)
            }}
          >
            <ArrowLeftOutlined className="mr-[8px] text-[14px] hover:text-[#7f56d9]" />
            {name ? decodeURIComponent(name) : "批量测试"}
          </div>
        </div>
      </div>
      <div className="bg-white h-[calc(100vh-68px)] overflow-y-auto rounded-[8px] p-[20px]">
        <div className="mb-4 text-right">
          {view !== "true" && (
            <Button
              onClick={() => {
                setVisible(true)
              }}
            >
              新增批量测试
            </Button>
          )}
        </div>
        <Table
          loading={type === "skill" ? isLoading : agentIsLoading}
          columns={columns}
          dataSource={(type === "skill" ? testSetPageData : agentTestSetPageData)?.data}
          pagination={false}
        />
        <Pagination
          current={pagination.pageNum}
          pageSize={pagination.pageSize}
          total={(type === "skill" ? testSetPageData : agentTestSetPageData)?.totalCount || 0}
          onChange={(page, pageSize) => setPagination({ pageNum: page, pageSize })}
          showSizeChanger={true}
          style={{ marginTop: "15px", textAlign: "right" }}
          showTotal={(total) => `共 ${total} 条`}
        />
        <BatchTestDrawer
          visible={visible}
          onClose={() => {
            setVisible(false)
            queryClient.invalidateQueries([
              QUERY_KEYS[type === "skill" ? "TEST_SET_PAGE" : "AGENT_TEST_SET_PAGE"]
            ])
            setCurrentStep(1)
            setCurrentId(null)
          }}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          currentId={currentId}
          setCurrentId={setCurrentId}
        />
      </div>
    </div>
  )
}

export default BatchTesting
