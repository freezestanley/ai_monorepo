import { useState, useRef, useEffect, useMemo } from "react"
import { Modal, Button, Row, Col, Select, Table, message, Typography, Tabs } from "antd"
import { CheckOutlined, CloseOutlined } from "@ant-design/icons"
import {
  useFetchTestSetDetail,
  useFetchAgentTestSetDetail,
  useRunTestSetAgain,
  useRunAgentTestSetAgain
} from "@/api/batchTest"
import { exportTestSetExcel, exportAgentTestSetExcel } from "@/api/batchTest/api"
import CallChainComp from "./CallChainComp"

// 计算中英文混合字符串的实际显示宽度
const calculateTextWidth = (text) => {
  if (!text) return 100 // 默认最小宽度
  let width = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i)
    // 中文字符、全角符号等宽字符按40像素计算，英文字符按20像素计算
    if (/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/.test(char)) {
      width += 40
    } else {
      width += 20
    }
  }
  // 添加padding和边距，并设置最小最大宽度限制
  const finalWidth = width + 40 // 40像素作为padding
  return Math.max(100, Math.min(finalWidth, 400)) // 最小100px，最大400px
}

const RenderViewResults = ({
  type,
  agentNo,
  currentId,
  botNo,
  skillNo,
  versionList,
  setCurrentId,
  isView
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState({})
  const [isOpenCallChain, setIsOpenCallChain] = useState(false)
  const [assertType, setAssertType] = useState("clause")
  // 为两个Tab分别维护独立的分页状态
  const [clausePagination, setClausePagination] = useState({ pageNum: 1, pageSize: 10 })
  const [summaryPagination, setSummaryPagination] = useState({ pageNum: 1, pageSize: 10 })
  const currentVersionRef = useRef(null)

  const { mutate: reRunTest } = useRunTestSetAgain()
  const { mutate: reRunAgentTest } = useRunAgentTestSetAgain()
  const {
    data: skillTestDetailData,
    refetch: skillRefetch,
    isLoading: isTestLoading
  } = useFetchTestSetDetail(
    {
      id: currentId,
      botNo,
      skillNo
    },
    {
      enabled: !!(currentId && type === "skill")
    }
  )

  const {
    data: agentTestDetailData,
    refetch: agentRefetch,
    isLoading: isAgentTestLoading
  } = useFetchAgentTestSetDetail(
    {
      id: currentId,
      botNo,
      agentNo
    },
    {
      enabled: !!(currentId && type === "agent")
    }
  )

  const testDetailData = useMemo(() => {
    return type === "skill" ? skillTestDetailData : agentTestDetailData
  }, [type, skillTestDetailData, agentTestDetailData])

  useEffect(() => {
    let timer
    // 定义一个函数来进行数据的重新获取
    const fetchData = () => {
      if (
        testDetailData &&
        testDetailData?.status !== "SUCCESS" &&
        testDetailData?.status !== "CANCEL" &&
        testDetailData?.status !== "FAILED"
      ) {
        type === "skill" ? skillRefetch() : agentRefetch()
      }
    }
    // 设置定时器
    if (
      testDetailData &&
      testDetailData?.status !== "SUCCESS" &&
      testDetailData?.status !== "CANCEL" &&
      testDetailData?.status !== "FAILED"
    ) {
      timer = setInterval(fetchData, 5000) // 每5秒调用一次
    }
    // 清除定时器
    return () => clearInterval(timer)
  }, [testDetailData, type])

  const tabItems = useMemo(() => {
    return [
      {
        label: "分句断言",
        key: "clauseAssertExcelTable"
      },
      {
        label: "总结断言",
        key: "summaryAssertExcelTable"
      }
    ].map((item) => {
      const { columns, dataSource } = testDetailData?.[item.key] || {}
      const allData = dataSource?.map((row, index) => {
        const rowObj = {}
        row.forEach((cell) => {
          rowObj[cell.columnIndex] = cell.data
        })
        return {
          _key: index,
          ...rowObj
        }
      })

      // 根据当前Tab选择对应的分页状态
      const isClauseTab = item.key === "clauseAssertExcelTable"
      const currentPagination = isClauseTab ? clausePagination : summaryPagination
      const setPaginationHandler = isClauseTab ? setClausePagination : setSummaryPagination

      // 前端分页：根据当前页码和页面大小切割数据
      const startIndex = (currentPagination.pageNum - 1) * currentPagination.pageSize
      const endIndex = startIndex + currentPagination.pageSize
      const paginatedData = allData?.slice(startIndex, endIndex) || []

      return {
        ...item,
        children: (
          <Table
            loading={
              (type === "skill" ? isTestLoading : isAgentTestLoading) ||
              (testDetailData?.status &&
                testDetailData?.status !== "SUCCESS" &&
                testDetailData.status !== "CANCEL" &&
                testDetailData.status !== "FAILED")
            }
            scroll={{ x: "max-content" }}
            columns={
              columns?.map((col) => ({
                title: col.columnName,
                dataIndex: col.columnIndex,
                key: col.columnIndex,
                width:
                  col.columnName === "操作链"
                    ? 80
                    : col.columnName === "测试结果"
                      ? 150
                      : calculateTextWidth(col.columnName),
                align: "center",
                sorter:
                  col.columnName === "测试结果"
                    ? (a, b) => {
                        return a[col.columnName].localeCompare(b[col.columnName])
                      }
                    : false,
                fixed: col.columnName === "操作链" ? "right" : false,
                render: (text) => {
                  // 溢出处理
                  return (
                    <>
                      {col.columnName === "操作链" ? (
                        <Button
                          type="link"
                          className="!p-0"
                          onClick={() => {
                            const resData = text?.split("&") || []
                            setCurrentRecord({
                              botNo: resData[0] || botNo,
                              requestId: resData[1] || undefined,
                              requestTime: resData[2] || undefined,
                              skillNo,
                              agentNo,
                              skillName: testDetailData?.bizName
                            })
                            setIsOpenCallChain(true)
                          }}
                        >
                          查看
                        </Button>
                      ) : (
                        <>
                          {["测试结果"].includes(col.columnName) &&
                            (text === "通过" ? (
                              <CheckOutlined style={{ color: "green" }} />
                            ) : text === "不通过" ? (
                              <CloseOutlined style={{ color: "red" }} />
                            ) : null)}
                          {!["测试结果"].includes(col.columnName) && (
                            <Typography.Paragraph
                              style={{ margin: 0 }}
                              ellipsis={{ rows: 3, tooltip: text }}
                            >
                              {text}
                            </Typography.Paragraph>
                          )}
                        </>
                      )}
                    </>
                  )
                }
              })) || []
            }
            rowKey="_key"
            dataSource={paginatedData}
            pagination={{
              pageSize: currentPagination.pageSize,
              current: currentPagination.pageNum,
              showTotal: (total) => `共 ${total} 条`,
              pageSizeOptions: [10, 20],
              showSizeChanger: true,
              total: allData?.length || 0,
              onChange: (page, size) => {
                setPaginationHandler({
                  pageNum: size !== currentPagination.pageSize ? 1 : page,
                  pageSize: size
                })
              }
            }}
          />
        )
      }
    })
  }, [
    testDetailData,
    type,
    isTestLoading,
    isAgentTestLoading,
    botNo,
    skillNo,
    agentNo,
    clausePagination,
    summaryPagination
  ])

  const handleModalOk = () => {
    if (!currentVersionRef.current) {
      message.error("请选择被测试版本")
      return
    }
    ;(type === "skill" ? reRunTest : reRunAgentTest)(
      {
        id: testDetailData.id,
        botNo,
        ...(type === "skill"
          ? {
              skillNo,
              skillVersionNo: currentVersionRef.current
            }
          : {
              agentNo,
              agentVersionNo: currentVersionRef.current
            })
      },
      {
        onSuccess: (e) => {
          console.log(e)
          if (e.success) {
            message.success(e.message)
            setCurrentId(e.data)
            setIsModalVisible(false)
            setClausePagination({ pageNum: 1, pageSize: 10 })
            setSummaryPagination({ pageNum: 1, pageSize: 10 })
          } else {
            message.error(e.message)
          }
        }
      }
    )
  }

  const handleModalCancel = () => {
    setIsModalVisible(false)
    currentVersionRef.current = null
  }

  return (
    <div className="p-4">
      {!isOpenCallChain ? (
        <>
          <h1 className="text-xl font-bold mb-1">查看结果</h1>
          <Row className="mt-2 text-gray-600" gutter={12}>
            <Col span={8}>
              <span className="font-bold text-gray-900">
                {type === "skill" ? "工作流" : "agent"}:
              </span>{" "}
              {testDetailData?.bizName}
            </Col>
            <Col span={8}>
              <span className="font-bold text-gray-900">版本:</span>{" "}
              {testDetailData?.bizVersionName}
            </Col>
            <Col span={8}>
              <span className="font-bold text-gray-900">测试时间:</span>{" "}
              {testDetailData?.gmtModified}
            </Col>
          </Row>
          <Row className="mb-4 mb-2 text-gray-600" gutter={12}>
            <Col span={8} className="mt-4">
              <span className="font-bold text-gray-900">测试人:</span> {testDetailData?.modifier}
            </Col>
            {testDetailData?.status === "SUCCESS" && (
              <>
                <Col span={8} className="mt-4">
                  <span className="font-bold text-gray-900">分句正确率:</span>{" "}
                  {testDetailData?.accuracy === -1
                    ? "-"
                    : testDetailData?.accuracy && testDetailData?.accuracy + "%"}
                </Col>
                <Col span={8} className="mt-4">
                  <span className="font-bold text-gray-900">总结正确率:</span>{" "}
                  {testDetailData?.summaryAccuracy === -1
                    ? "-"
                    : testDetailData?.summaryAccuracy && testDetailData?.summaryAccuracy + "%"}
                </Col>
              </>
            )}
            <Col span={8} className="mt-4">
              <span className="font-bold text-gray-900">完成率:</span>
              {(testDetailData?.progress || 0) + "%"}
            </Col>
          </Row>
          <div className="relative">
            {testDetailData?.status === "SUCCESS" && (
              <Row justify={"end"} className="absolute right-0 top-1 z-10">
                {!isView && (
                  <Button
                    type="primary"
                    className="mr-2"
                    size="small"
                    onClick={() => setIsModalVisible(true)}
                  >
                    再次生成
                  </Button>
                )}
                <Button
                  size="small"
                  type="primary"
                  onClick={() => {
                    if (type === "skill") {
                      exportTestSetExcel({
                        botNo,
                        skillNo,
                        skillVersionNo: testDetailData.bizVersionNo,
                        id: testDetailData.id,
                        assertType
                      })
                    } else {
                      exportAgentTestSetExcel({
                        botNo,
                        agentNo,
                        agentVersionNo: testDetailData.bizVersionNo,
                        id: testDetailData.id,
                        assertType
                      })
                    }
                  }}
                >
                  导出
                </Button>
              </Row>
            )}
            <Tabs
              defaultActiveKey="clauseAssertExcelTable"
              onChange={(activeKey) =>
                setAssertType(activeKey === "clauseAssertExcelTable" ? "clause" : "summary")
              }
              type="card"
              style={{ marginBottom: 32 }}
              items={tabItems}
            />
          </div>
          <Modal
            title="再次生成"
            open={isModalVisible}
            onOk={handleModalOk}
            onCancel={handleModalCancel}
            okText="确定"
            cancelText="取消"
          >
            <div className="p-2">
              <Select
                placeholder="请选择被测试版本"
                style={{ width: "100%" }}
                onChange={(e) => {
                  currentVersionRef.current = e
                }}
                allowClear
              >
                {versionList?.map((item) => (
                  <Select.Option value={item.versionNo} key={item.versionNo}>
                    {item.versionName}
                  </Select.Option>
                ))}
              </Select>
            </div>
          </Modal>
        </>
      ) : (
        <CallChainComp record={currentRecord} onBack={() => setIsOpenCallChain(false)} />
      )}
    </div>
  )
}

export default RenderViewResults
