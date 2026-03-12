import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Table,
  Input,
  Button,
  Switch,
  Pagination,
  message,
  Popconfirm,
  Space,
  Tooltip,
  Popover,
  Form
} from "antd"
import {
  useChangeDocumentStatus,
  useFetchDocumentListByPage,
  useRetryAddDocument,
  useViewDocument,
  useFetchKnowledgeDictionaryList
} from "@/api/knowledge"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { debounce } from "lodash"
import OverflowTooltip from "@/components/overflowTooltip"
import StatusBadge from "@/components/StatusBadge"
import { useBatchDeleteDocument, useDeleteKnowledgeBaseDocument } from "@/api/knowledgeDocument"
import queryString from "query-string"
import BatchOperations from "@/components/BatchOperations"
import EditDocModal from "./EditDocModal"
import RagFlowDrawer from "./RagFlowDrawer"
import DocGlobalSetModal from "./DocGlobalSetModal"
import RetrievalTestDrawer from "./RetrievalTestDrawer"
import ParseStatusPopover from "./ParseStatusPopover"
import { TableFilter } from "@/utils/tableFliter"

const showStatus = [8, 9, 11]

const DocumentTable = ({ docCategories = [], selectNode, selectedKnowledgeBase, isAntron }) => {
  const [form] = Form.useForm()
  const [searchValue, setSearchValue] = useState("")
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const queryClient = useQueryClient()
  const [docAction, setDocAction] = useState("add") // 'add', 'view', 'edit'
  const [currentData, setCurrentData] = useState(null)
  const [filterParams, setFilterParams] = useState({
    sourceDesc: null,
    statusDesc: null,
    documentNoSearch: null,
    titleSearch: null,
    sort: {}
  })
  const [switchStatus, setSwitchStatus] = useState({})
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [selectedRows, setSelectedRows] = useState([])
  const [isDrawerVisibleRagFlow, setIsDrawerVisibleRagFlow] = useState(false)
  const [isGlobalSetModalVisible, setIsGlobalSetModalVisible] = useState(false)
  const [isRetrievalTestVisible, setIsRetrievalTestVisible] = useState(false)

  const searchParams = queryString.parse(window.location.search) || {}
  const hashParams = queryString.parse(window.location.hash.split("?")[1] || "") || {}
  const { token: isIframe } = searchParams.token ? searchParams : hashParams

  useEffect(() => {
    pagination.current = 1
    setSelectedRowKeys([])
    setSelectedRows([])
  }, [selectNode?.catalogNo])

  const { data: tableData, refetch: tableDataRefetch } = useFetchDocumentListByPage({
    knowledgeBaseNo: selectedKnowledgeBase,
    catalogNo: selectNode?.catalogNo,
    pageNum: pagination.current,
    pageSize: pagination.pageSize,
    search: filterParams.documentNoSearch || filterParams.titleSearch || searchValue,
    status: filterParams.statusDesc,
    source: filterParams.sourceDesc,
    sortFields: filterParams.sort?.order && [
      {
        field: filterParams.sort.field,
        sort: filterParams.sort.order === "ascend" ? "ASC" : "DESC"
      }
    ]
  })

  const debounceSetSearch = debounce((value) => {
    setSearchValue(value)
  }, 1000)

  const { mutate: changeStatus } = useChangeDocumentStatus()
  const { mutate: viewDocument } = useViewDocument()
  const { mutate: retryAddDocument } = useRetryAddDocument()
  const { mutate: deleteKnowledgeBaseDocument } = useDeleteKnowledgeBaseDocument()
  const { mutate: batchDeleteDocument } = useBatchDeleteDocument()
  const { data: knowledgeDictionaryList } = useFetchKnowledgeDictionaryList({
    dictionaryType: "RAG_CHUNK_METHOD"
  })

  // 检查是否需要fetch函数 usecallback
  const checkAndFetchData = useCallback(() => {
    const hasSplittingDocument = tableData?.records.some((record) =>
      [1, 2, 3, 4, 5, 12].includes(record.status)
    )
    if (hasSplittingDocument) {
      tableDataRefetch()
    }
  }, [tableData, tableDataRefetch])

  useEffect(() => {
    const interval = setInterval(() => {
      checkAndFetchData()
    }, 5000)

    return () => clearInterval(interval)
  }, [checkAndFetchData, tableData?.records])

  const handleAddDocument = () => {
    if (!selectNode?.catalogNo) {
      message.error("请选择或者新增分类!")
      return
    }
    setCurrentData(null)
    setDocAction("add")
    setIsModalVisible(true)
  }

  const handleSwitchChange = (e, record) => {
    console.log(e, record)
    changeStatus(
      {
        knowledgeBaseNo: selectedKnowledgeBase,
        catalogNo: record.catalogNo,
        documentNo: record.documentNo,
        enable: e ? 1 : 0
      },
      {
        onSuccess: (e) => {
          if (e.success) {
            message.success(e.message)
            queryClient.invalidateQueries([QUERY_KEYS.DOCUMENT_LIST_BY_PAGE])
          } else {
            message.error(e.message)
          }
        }
      }
    )
  }

  const handleTableChange = (pagination, filter, sort) => {
    console.log(filter, sort)
    setFilterParams({
      ...filter,
      sort
    })
  }

  // 查看
  const handleView = (record) => {
    console.log(record)
    setDocAction("view")
    setCurrentData(record)
    setIsDrawerVisibleRagFlow(true)
    // viewDocument(
    //   {
    //     knowledgeBaseNo: selectedKnowledgeBase,
    //     catalogNo: record.catalogNo,
    //     documentNo: record.documentNo
    //   },
    //   {
    //     onSuccess: (e) => {
    //       if (e.success) {
    //         window.open(e.data, "_blank")
    //       }
    //     }
    //   }
    // )
  }

  // 重试
  const handleReTry = (record) => {
    console.log(record)
    retryAddDocument(
      {
        knowledgeBaseNo: selectedKnowledgeBase,
        documentNo: record.documentNo
      },
      {
        onSuccess: (e) => {
          if (e.success) {
            message.success(e.message)
            queryClient.invalidateQueries([QUERY_KEYS.DOCUMENT_LIST_BY_PAGE])
          } else {
            message.error(e.message)
          }
        }
      }
    )
  }

  // 编辑
  const handleEdit = (record) => {
    setDocAction("edit")
    viewDocument(
      {
        knowledgeBaseNo: selectedKnowledgeBase,
        catalogNo: record.catalogNo,
        documentNo: record.documentNo
      },
      {
        onSuccess: (e) => {
          if (e.success) {
            setCurrentData({ ...record, url: e.data })
            setIsModalVisible(true)
          }
        }
      }
    )
  }
  const handleDelete = (record) => {
    const documentTitle = record.title
    try {
      deleteKnowledgeBaseDocument(
        {
          knowledgeBaseNo: selectedKnowledgeBase,
          catalogNo: record.catalogNo,
          documentNo: record.documentNo
        },
        {
          onSuccess: (res) => {
            if (res?.success === true) {
              message.success(`删除 ${documentTitle} 成功`)
            } else {
              message.error(`删除 ${documentTitle} 失败`)
            }
          }
        }
      )
    } catch (error) {
      message.error(`删除 ${documentTitle} 失败`)
      console.log(":===>>>  error:", error)
    }
  }

  const onHandleBatchDeleteClick = (ids) => {
    batchDeleteDocument(
      {
        documents: selectedRows.map((item) => ({
          knowledgeBaseNo: selectedKnowledgeBase,
          documentNo: item.documentNo,
          catalogNo: item.catalogNo
        }))
      },
      {
        onSuccess: (res) => {
          if (res?.success) {
            message.success(res.message)
          } else {
            message.error(res.message)
          }
        }
      }
    )
  }

  const rejectDeleteText = useMemo(() => {
    if (selectedRowKeys?.length === 0) {
      return ""
    }
    const selectedRows = tableData?.records?.filter((record) =>
      selectedRowKeys?.includes(record.documentNo)
    )
    if (selectedRows?.some((record) => record.status === 8)) {
      return "存在已上线知识，无法执行批量删除"
    }
    return ""
  }, [selectedRowKeys, tableData])

  const searchInput = useRef(null)

  const columns = [
    {
      title: "文档编号",
      dataIndex: "documentNo",
      key: "documentNo",
      width: 250,
      render: (description) => <OverflowTooltip text={description} />,
      ...TableFilter({
        form, // 表单 form
        searchParams: {
          documentNoSearch: filterParams.documentNoSearch
        }, // 搜索条件
        searchInput: searchInput, // useRef(null)
        refresh: (value) => {
          setFilterParams((p) => ({
            ...p,
            documentNoSearch: value,
            titleSearch: null // 清除另一个搜索条件，避免冲突
          }))
        }, // 刷新方法
        dataIndex: "documentNoSearch", // index key
        fieldType: "" // fieldType === "select" ： 搜索框，否则 input 输入框
      })
    },
    {
      title: "文档标题",
      dataIndex: "title",
      key: "title",
      width: 250,
      render: (description) => <OverflowTooltip text={description} />,
      ...TableFilter({
        form, // 表单 form
        searchParams: {
          titleSearch: filterParams.titleSearch
        }, // 搜索条件
        searchInput: searchInput, // useRef(null)
        refresh: (value) => {
          setFilterParams((p) => ({
            ...p,
            titleSearch: value,
            documentNoSearch: null // 清除另一个搜索条件，避免冲突
          }))
        }, // 刷新方法
        dataIndex: "titleSearch", // index key
        fieldType: "" // fieldType === "select" ： 搜索框，否则 input 输入框
      })
    },
    {
      title: "摘要说明",
      dataIndex: "summary",
      key: "summary",
      width: 200,
      render: (text) => {
        return text ? <OverflowTooltip text={text} width={150} singleLine={false} /> : "--"
      }
    },
    {
      title: "切片方法",
      dataIndex: "sliceMethodDesc",
      key: "sliceMethodDesc",
      width: 110,
      render: (text, record) => {
        return (
          knowledgeDictionaryList?.find((v) => v.code === record?.splitArg?.splitMethod)
            ?.displayName ?? "--"
        )
      }
    },
    {
      title: "分块数",
      dataIndex: "chunkSize",
      key: "chunkSize",
      width: 110,
      render: (text, record) => {
        return record?.splitArg?.chunkSize ?? "--"
      }
    },
    {
      title: "文档来源",
      dataIndex: "sourceDesc",
      key: "sourceDesc",
      width: 110,
      filters: [
        { text: "本地上传", value: 1 },
        { text: "线上文档", value: 2 }
      ],
      onFilter: (value, record) => {
        // TODO: 调用 API 并更新数据源
        return record.source === value
      }
    },
    {
      title: "解析状态",
      width: 140,
      dataIndex: "statusDesc",
      key: "statusDesc",
      render: (text, record) => {
        return (
          <ParseStatusPopover record={record}>
            <StatusBadge status={text} />
          </ParseStatusPopover>
        )
      }
    },
    {
      title: "文档分类路径",
      width: 200,
      dataIndex: "catalogNoPathDesc",
      key: "catalogNoPathDesc"
    },
    {
      title: "创建信息",
      dataIndex: "gmt_created",
      key: "gmt_created",
      sorter: true,
      width: 180,
      render: (_, record) => (
        <>
          {record.creator}
          <br />
          {record.gmtCreated}
        </>
      )
    },
    {
      title: "更新信息",
      dataIndex: "gmt_modified",
      key: "gmt_modified",
      sorter: true,
      width: 180,
      render: (_, record) => (
        <>
          {record.modifier}
          <br />
          {record.gmtModified}
        </>
      )
    },
    {
      title: "操作",
      key: "action",
      fixed: "right",
      width: 230,
      render: (text, record) => (
        <>
          {record.status === 10 && (
            <Button
              disabled={record.status === 4 || record.status === 2}
              type="link"
              className="!pl-0"
              onClick={() => handleReTry(record)}
            >
              重试
            </Button>
          )}
          {showStatus.includes(record.status) && (
            <Popconfirm
              title={record.status === 8 ? "是否停用该文档?" : "是否启用该文档?"}
              onConfirm={() => {
                handleSwitchChange(record.status !== 8, record)
                setSwitchStatus((prev) => ({
                  ...prev,
                  [record.documentNo]: record.status !== 8
                }))
              }}
              okText="确认"
              cancelText="取消"
            >
              <span className="!mr-2" onClick={(e) => e.stopPropagation()}>
                <Switch
                  checked={record.status === 8}
                  checkedChildren="已启用"
                  unCheckedChildren="已停用"
                  className={`${record.status === 8 ? "!bg-[#1FC16B]" : "!bg-[#D0D5DD]"} [&>.ant-switch-inner-checked]:!text-white [&>.ant-switch-inner-unchecked]:!text-white [&>.ant-switch-inner-checked]:!text-[10px] [&>.ant-switch-inner-unchecked]:!text-[10px]`}
                />
              </span>
            </Popconfirm>
          )}
          <Button
            disabled={record.status === 4 || record.status === 2}
            type="link"
            className="!pl-0"
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            disabled={record.status === 4 || record.status === 2}
            type="link"
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          {record.status !== 8 ? (
            <Popconfirm
              title="是否【删除】该文档"
              onConfirm={() => handleDelete(record)}
              okText="确认"
              cancelText="取消"
            >
              <Button disabled={record.status === 8} type="link">
                删除
              </Button>
            </Popconfirm>
          ) : (
            <Popover content="停用后方可做删除操作" trigger="hover">
              <Button disabled={true} type="link">
                删除
              </Button>
            </Popover>
          )}
        </>
      )
    }
  ]

  return (
    <Form form={form}>
      <div className={"container"}>
        <div className={"flex justify-between mb-5"}>
          <Space>
            <Button
              className={"addButton"}
              type="primary"
              onClick={handleAddDocument}
              disabled={isAntron}
            >
              <i className="iconfont icon-chuangjian"></i>
              添加文档
            </Button>
            <BatchOperations
              rejectDeleteText={rejectDeleteText}
              selectedKeys={selectedRowKeys || []}
              onBatchDelete={onHandleBatchDeleteClick}
              showDelete={true}
              extraItems={[]}
              itemOrder={["delete"]}
            />
            {/* <Tooltip title={"设置"}>
              <Button
                onClick={() => setIsGlobalSetModalVisible(true)}
                type="link"
                className="!p-0"
                icon={<span className="iconfont icon-gerenmoban text-[20px]" />}
              />
            </Tooltip> */}
            <div className="text-gray-500 text-[12px]">
              已选择目录：
              {selectNode
                ? `${selectNode.catalogName || "--"} (ID: ${selectNode.catalogNo || "--"})`
                : "--"}
            </div>
          </Space>

          <Button
            type="primary"
            ghost
            style={{ borderImageSource: "initial" }}
            onClick={() => setIsRetrievalTestVisible(true)}
          >
            检索测试
          </Button>
          {/* <div className={"flex items-center gap-2"}>
            <Input
              style={{ width: 240 }}
              placeholder="搜索数据集编号/数据集名"
              suffix={
                <i
                  className="iconfont icon-sousuo1 text-[14px] font-[300]"
                  style={{ color: "#bfbfbf" }}
                />
              }
              onChange={(e) => {
                if (e.target.value === "") {
                  debounceSetSearch("")
                } else {
                  debounceSetSearch(e.target.value)
                }
              }}
            />
          </div> */}
        </div>
        <Table
          onChange={handleTableChange}
          dataSource={tableData?.records}
          columns={columns}
          rowKey={(record) => record.documentNo}
          rowSelection={{
            fixed: true,
            selectedRowKeys,
            onChange: (newSelectedRowKeys, selectedRows) => {
              setSelectedRowKeys(newSelectedRowKeys || [])
              setSelectedRows(selectedRows || [])
            }
          }}
          pagination={false}
          scroll={{ y: isIframe ? "calc(100vh - 220px)" : "calc(100vh - 550px)", x: 1200 }}
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
          // size="small"
          // className="pr-2 pagination-v2"
          current={pagination.current}
          pageSize={pagination.pageSize}
          total={tableData?.total}
          onChange={(page, pageSize) => setPagination({ current: page, pageSize })}
          showSizeChanger={true}
          style={{ marginTop: "10px", textAlign: "right" }}
          showTotal={(total) => `共 ${total} 条`}
        />
        <EditDocModal
          selectedKnowledgeBase={selectedKnowledgeBase}
          selectNode={selectNode}
          docCategories={docCategories}
          docAction={docAction}
          isModalVisible={isModalVisible}
          setIsModalVisible={setIsModalVisible}
          currentData={currentData}
        />
        <RagFlowDrawer
          currentData={currentData}
          setCurrentData={setCurrentData}
          knowledgeBaseNo={selectedKnowledgeBase}
          visible={isDrawerVisibleRagFlow}
          onClose={() => setIsDrawerVisibleRagFlow(false)}
        />
        <DocGlobalSetModal
          knowledgeBaseNo={selectedKnowledgeBase}
          visible={isGlobalSetModalVisible}
          onClose={() => setIsGlobalSetModalVisible(false)}
        />
        <RetrievalTestDrawer
          open={isRetrievalTestVisible}
          onClose={() => setIsRetrievalTestVisible(false)}
          knowledgeBaseNo={selectedKnowledgeBase}
          catalogNo={selectNode?.catalogNo}
        />
      </div>
    </Form>
  )
}

export default DocumentTable
