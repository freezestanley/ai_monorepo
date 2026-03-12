import { useCallback, useEffect, useMemo, useState } from "react"
import { debounce } from "lodash"
import { Button, Drawer, Input, Table, Collapse, Empty, Select, message, Spin } from "antd"
import { ArrowLeftOutlined, CloseOutlined } from "@ant-design/icons"
import DrawerForm from "@/pages/addBot/components/DrawerForm"
import { fetchCallLogsFaqRecord, fetchCallLogsOptimize } from "@/api/userFeedback/api"
import { PAGE_CODE } from "@/constants/pageCode"
import useKnowledgeBaseForm from "@/pages/addBot/hooks/knowledge/useKnowledgeBaseForm"
import { useFetchFaqListByPage } from "@/api/knowledge"
import { DEFAULTNAMESPACE } from "@/constants"
import "./index.less"

const title = {
  optimize: "优化",
  searchSort: "优化-查找分类",
  searchQuestion: "优化-查找问题"
}

const OptimizeDrawer = ({ visible, setVisible, record, queryParams, refreshTableData }) => {
  const { knowledgeData: knowledgeBaseNo, ...otherParams } = queryParams || {}
  const [modes, setModes] = useState([])
  const [catalogName, setCatalogName] = useState("")
  const [searchQuestion, setSearchQuestion] = useState("")
  const [fagData, setFagData] = useState([])
  const [question, setQuestion] = useState()
  const [currentRecord, setCurrentRecord] = useState(null)
  const [catalogData, setCatalogData] = useState(null)
  const [pagination, setPagination] = useState({ pageNum: 1, pageSize: 10 })
  const [isLoading, setIsLoading] = useState(false)

  const mode = useMemo(() => modes[modes.length - 1], [modes])

  const debounceSearchCatalogName = debounce(setCatalogName, 1000)
  const debounceSearchQuestion = debounce(setSearchQuestion, 1000)

  const {
    treeData,
    treeDataLoading,
    handleGenerateSimilarQuestions,
    handleSaveQuestions,
    drawerVisible,
    handleEditFaq,
    setDrawerVisible,
    editDetailList,
    imgUploadAction,
    onSelect
  } = useKnowledgeBaseForm({
    selectedKnowledgeBase: knowledgeBaseNo,
    catalogName
  })

  useEffect(() => {
    onSelect([editDetailList?.[0]?.catalogNo])
  }, [editDetailList?.[0]?.catalogNo])

  const onSaveQuestions = useCallback(
    (d, event, faqNo) => {
      console.log("ddd", d, record)
      handleSaveQuestions(
        d,
        () => {
          fetchCallLogsOptimize({
            pageCode: PAGE_CODE.CALL_LOGS,
            requestId: record?.requestId,
            optimizeType: "问答",
            optimizeContent: currentRecord?.faqQuestion || d?.[0]?.values?.faqQuestion,
            botNo: record?.botNo,
            requestTime: record?.requestTime
          }).then((res) => {
            if (res.success) {
              event?.()
              setVisible(false)
              setTimeout(() => {
                refreshTableData()
              }, 600)
            } else {
              res?.message && message.warning(res?.message)
            }
          })
        },
        faqNo
      )
    },
    [handleSaveQuestions, record, refreshTableData, currentRecord, setVisible]
  )

  const { data: faqListData, isLoading: faqListLoading } = useFetchFaqListByPage({
    namespace: DEFAULTNAMESPACE,
    knowledgeBaseNo,
    ...pagination,
    catalogNo: catalogData?.catalogNo,
    question: searchQuestion,
    ...otherParams
  })

  const fetchFaqRecord = useCallback(async () => {
    if (!record?.requestId) return
    try {
      setIsLoading(true)
      const res = await fetchCallLogsFaqRecord({
        pageCode: PAGE_CODE.CALL_LOGS,
        requestId: record.requestId,
        botNo: record?.botNo,
        requestTime: record?.requestTime
      })
      setModes(res?.some(({ answers }) => answers?.length > 0) ? ["optimize"] : ["searchSort"])
      setQuestion(res?.[0]?.question)
      setFagData(res)
    } catch {
      setModes(["optimize"])
    } finally {
      setIsLoading(false)
    }
  }, [record])

  useEffect(() => {
    if (mode !== "searchQuestion") {
      debounceSearchQuestion(undefined)
    }
    if (mode === "optimize") {
      debounceSearchCatalogName(undefined)
    }
  }, [mode])

  useEffect(() => {
    if (!visible) {
      setModes([])
    } else {
      fetchFaqRecord()
    }
  }, [fetchFaqRecord, visible])

  const getCatalogsTree = useCallback((items, isChild) => {
    return (
      <Collapse
        className={`catalogs-collapse`}
        bordered={!isChild}
        items={items?.map(({ catalogName, children, id, catalogNo: cNo }) => ({
          className: !children?.length ? "catalogs-collapse-item" : "",
          key: id,
          label: catalogName,
          children: children?.length && getCatalogsTree(children, true),
          showArrow: !!children?.length,
          collapsible: !children?.length && "disabled",
          extra: !children?.length && (
            <Button
              type="link"
              className="p-0 pl-[20px] h-auto"
              onClick={() => {
                setCatalogData((preState) => ({
                  catalogNo: cNo,
                  catalogNames: isChild
                    ? [...(preState?.catalogNames || []), catalogName]
                    : [catalogName]
                }))
                setModes((preState) => [...preState, "searchQuestion"])
              }}
            >
              选择
            </Button>
          )
        }))}
        expandIconPosition="end"
        collapsible="header"
      />
    )
  }, [])

  return (
    <>
      <Drawer
        title={
          <div className="flex">
            <div className="flex-1">
              {modes.length > 1 ? (
                <>
                  <ArrowLeftOutlined
                    className="mr-[10px]"
                    onClick={() => setModes((preState) => preState.slice(0, -1))}
                  />
                  {title[mode]}
                </>
              ) : (
                title[mode] || "优化"
              )}
            </div>
            <CloseOutlined onClick={() => setVisible(false)} />
          </div>
        }
        width={800}
        open={visible}
        closeIcon={false}
        destroyOnClose
        onClose={() => setVisible(false)}
        footer={false}
        zIndex={999}
      >
        <Spin spinning={isLoading}>
          {mode === "optimize" && (
            <>
              <Select
                options={fagData}
                fieldNames={{ label: "question", value: "question" }}
                allowClear={false}
                className="w-1/2 mb-[10px]"
                placeholder="请选择"
                value={question}
                onChange={(v) => setQuestion(v)}
              />
              <Table
                rowKey={"faqNo"}
                columns={[
                  { title: "已召回以下问题供参考", dataIndex: "question" },
                  {
                    title: "操作",
                    dataIndex: "action",
                    width: 100,
                    render: (_, data) => (
                      <Button
                        type="link"
                        onClick={() => {
                          handleEditFaq(data)
                          setCurrentRecord(data)
                          setDrawerVisible(true)
                        }}
                      >
                        选择
                      </Button>
                    )
                  }
                ]}
                pagination={false}
                dataSource={fagData?.find((item) => item.question === question)?.answers}
              />
              <Button
                type="link"
                className="px-0 mt-[10px]"
                onClick={() => setModes((preState) => [...preState, "searchSort"])}
              >
                以上都不是，去列表查询
              </Button>
            </>
          )}
          {mode === "searchSort" && (
            <>
              <Input
                placeholder="请输入分类名称"
                className="mb-[10px] w-1/2"
                value={catalogName}
                onChange={(e) => debounceSearchCatalogName(e.target.value)}
              />
              {!treeData?.catalogs?.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
              <Spin spinning={treeDataLoading}>{getCatalogsTree(treeData?.catalogs || [])}</Spin>
            </>
          )}
          {mode === "searchQuestion" && (
            <>
              <h1 style={{ color: "#5e5ff8" }} className="mb-[10px]">
                分类：{catalogData?.catalogNames?.join("/")}
              </h1>
              <Input
                placeholder="请输入关键字搜寻问答"
                className="mb-[10px] w-1/2"
                value={searchQuestion}
                onChange={(e) => debounceSearchQuestion(e.target.value)}
              />
              <Table
                columns={[
                  { title: "标准问题", dataIndex: "faqQuestion" },
                  {
                    title: "操作",
                    dataIndex: "action",
                    width: 100,
                    render: (_, data) => (
                      <Button
                        type="link"
                        onClick={() => {
                          handleEditFaq(data)
                          setCurrentRecord(data)
                          setDrawerVisible(true)
                        }}
                      >
                        选择
                      </Button>
                    )
                  }
                ]}
                loading={faqListLoading}
                dataSource={faqListData?.faqList}
                showHeader={false}
                pagination={{
                  className: "pr-2",
                  current: pagination.pageNum,
                  pageSize: pagination.pageSize,
                  total: faqListData?.total,
                  onChange: (page, pageSize) => setPagination({ pageNum: page, pageSize }),
                  showSizeChanger: true,
                  style: { marginTop: "15px", textAlign: "right" },
                  showTotal: (total) => `共 ${total} 条`
                }}
              />
            </>
          )}
        </Spin>
      </Drawer>
      <DrawerForm
        imgUploadAction={imgUploadAction}
        currentRecord={currentRecord}
        editDetailList={editDetailList}
        handleGenerateSimilarQuestions={handleGenerateSimilarQuestions}
        handleSaveQuestions={onSaveQuestions}
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        disabled
        source="call-logs"
      />
    </>
  )
}

export default OptimizeDrawer
