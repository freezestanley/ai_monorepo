import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Form,
  Tree,
  Menu,
  Table,
  Button,
  List,
  Modal,
  Input,
  Spin,
  Tag,
  Tooltip,
  Dropdown,
  message,
  notification,
  Upload,
  Pagination,
  Select,
  Switch,
  Popconfirm,
  Popover
} from "antd"
import { DownOutlined, FolderOutlined, PlusOutlined } from "@ant-design/icons"
import ReactDOM from "react-dom/client"
import DrawerForm from "./DrawerForm"
import "./KnowledgeBase.scss"
import useKnowledgeBaseForm from "../hooks/knowledge/useKnowledgeBaseForm"
import { DEFAULTNAMESPACE, knowledgePrefix, languages } from "@/constants"
import { getUploadTemplate, mulDownload, downloadAllCategories } from "@/api/knowledge/api"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"
import {
  useBatchDeleteFAQ,
  useDeleteKnowledgeBaseFAQ,
  useFetchFaqListByPage,
  useGetUploadTemplate,
  useDownloadAllCategories,
  useGetDownloadAllCategoriesResult
} from "@/api/knowledge"
import OverflowTooltip from "@/components/overflowTooltip"
import Iconfont from "@/components/Icon"
import { debounce, get, set } from "lodash"
import queryString from "query-string"
import { useLocation } from "react-router-dom"
import DocumentUploader from "@/components/DocumentUploader"
import { useAuthResources, useCurrentKnowledgeAndCatalog } from "@/store"
import { RESOURCE_CODE } from "@/constants/resourceCode"
import { getTokenAndServiceName } from "@/api/sso"
import { handleDownloadExcel, sftpUrl } from "@/utils/file"
import NiceModal from "@ebay/nice-modal-react"
import DownLoadErrorModal from "./downErrorList"
import { TableFilter } from "@/utils/tableFliter"
import { useRef } from "react"
import { CaretDownFilled } from "@ant-design/icons"
import { EyeOutlined } from "@ant-design/icons"
import BatchOperations from "@/components/BatchOperations"
import StatusBadge from "@/components/StatusBadge"

const KnowledgeBase = ({
  selectedKnowledgeBase,
  treeData,
  setExpandedKeys,
  treeDataLoading,
  tableData,
  onSelect,
  handleMenuClick,
  showEditModal,
  setShowEditModal,
  setInputValue,
  inputValue,
  handleModalOk,
  editFlag,
  handleGenerateSimilarQuestions,
  handleSaveQuestions,
  drawerVisible,
  handleEditFaq,
  handleChangeStatus,
  setDrawerVisible,
  rowSelected,
  setRowSelected,
  editDetailList,
  setEditDetailList,
  handleUpload,
  setTableData,
  imgUploadAction,
  fetchUploadResultByCatalog,
  designatedSourceTagList,
  sourceTag,
  sceneTags = []
}) => {
  const [form] = Form.useForm()

  const { knowledgeAndCatalog, changeKnowledgeAndCatalog } = useCurrentKnowledgeAndCatalog()
  const selectedKeys = useMemo(() => {
    return knowledgeAndCatalog.currentSelectedCatalog || []
  }, [knowledgeAndCatalog.currentSelectedCatalog])

  const currentSelectedKnowledgeBase = knowledgeAndCatalog.currentSelectedKnowledgeBase || {}

  const [contextMenuVisible, setContextMenuVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [mulUploadLoading, setMulUploadLoading] = useState(false)
  const [uploadDocumentVisible, setUploadDocumentVisible] = useState(false)
  const [currentQuestions, setCurrentQuestions] = useState([])
  const [question, setQuesTion] = useState("")
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [sortAndFilterState, setSortAndFilterState] = useState({
    sort: {
      orderField: "",
      asc: false
    }
  })
  const [downloadAllLoading, setDownloadAllLoading] = useState(false)

  const tagsFilterList = useMemo(() => {
    return sourceTag.map((item) => {
      return { text: item.tagDesc, value: item.code }
    })
  }, [sourceTag])

  const sceneTagsFilterList = useMemo(() => {
    return sceneTags?.map((item) => {
      return { text: item.tagDesc, value: item.code }
    })
  }, [sceneTags])

  const statusList = [
    { desc: "已上线", value: 1 },
    { desc: "未上线", value: 0 }
  ]

  const { mutate: deleteKnowledgeBaseFAQ } = useDeleteKnowledgeBaseFAQ()
  const { mutate: batchDeleteFAQ } = useBatchDeleteFAQ()
  const [resultStatusData, setResultStatusData] = useState(null)

  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const { mutate: getResult } = useGetUploadTemplate()
  const { mutate: downloadAllCategoriesMutate } = useDownloadAllCategories()
  const { mutate: getDownloadResultMutate } = useGetDownloadAllCategoriesResult()
  const queryClient = useQueryClient()

  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)

  const searchInput = useRef(null)

  const onHandleBatchDeleteClick = () => {
    deleteBySelectedRows(rowSelected)
  }

  const deleteBySelectedRows = (rowSelected) => {
    batchDeleteFAQ(
      {
        faqs: rowSelected.map((item) => ({
          knowledgeBaseNo: selectedKnowledgeBase,
          catalogNo: item.catalogNo,
          faqNo: item.faqNo,
          language: item.language
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
    if (rowSelected?.length === 0) {
      return ""
    }
    const selectedRows = rowSelected?.filter((record) => record.status === 1)
    if (selectedRows?.some((record) => record.status === 1)) {
      return "存在已上线知识，无法执行批量删除"
    }
    return ""
  }, [rowSelected])

  const { data: faqListData, isLoading: faqListLoading } = useFetchFaqListByPage({
    namespace: DEFAULTNAMESPACE,
    knowledgeBaseNo: selectedKnowledgeBase,
    pageNum: pagination.current,
    pageSize: pagination.pageSize,
    // question,
    ...queryParams,
    ...sortAndFilterState,
    catalogNo: selectedKeys && selectedKeys[0]
  })

  const onKnowledgeSelectChange = (catalogTypeCode) => {
    const currentSelectedKnowledgeBase = treeData?.catalogsTreeList?.find(
      (item) => item.catalogTypeCode === catalogTypeCode
    )
    const currentSelectedCatalog =
      currentSelectedKnowledgeBase?.children?.length > 0
        ? [currentSelectedKnowledgeBase?.children[0].catalogNo]
        : []
    changeKnowledgeAndCatalog({
      currentSelectedKnowledgeBase,
      currentSelectedCatalog
    })
  }
  const handleGetResult = useCallback(
    (timer = 2000, specificCatalogNo = null) => {
      setTimeout(() => {
        fetchUploadResultByCatalog(
          {
            knowledgeBaseNo: selectedKnowledgeBase,
            namespace: DEFAULTNAMESPACE,
            catalogNo: specificCatalogNo || selectedKeys[0]
          },
          {
            onSuccess: (e) => {
              console.log(e)
              setResultStatusData(e.data.result)
              if (e.data.result === 0) {
                handleGetResult(2000, specificCatalogNo)
              } else if (e.data.result === 2) {
                message.success("上传成功")
                setMulUploadLoading(false)
                queryClient.invalidateQueries([QUERY_KEYS.FAQ_LIST_BY_PAGE])
              } else if (e.data.result === 1) {
                notification.warning({
                  message: "上传不成功，请检查",
                  description: e.data.msg,
                  duration: 6
                })
                setMulUploadLoading(false)
              }
            }
          }
        )
      }, timer)
    },
    [fetchUploadResultByCatalog, queryClient, selectedKeys, selectedKnowledgeBase]
  )

  // 弹出Modal，显示相似问题的列表
  const showModal = (text) => {
    if (!text || text.length === 0) {
      message.error("暂无相似问题")
      return
    }
    setCurrentQuestions(text)
    setIsModalVisible(true)
  }

  const handleOk = () => {
    setIsModalVisible(false)
  }

  const handleCancel = () => {
    setIsModalVisible(false)
  }

  const handleDelete = (record) => {
    deleteBySelectedRows([record])
  }

  useEffect(() => {
    if (selectedKeys.length > 0) {
      handleGetResult(0)
    }
  }, [handleGetResult, selectedKeys, selectedKnowledgeBase])

  useEffect(() => {
    if (selectedKeys.length > 0 && faqListData) {
      setTableData(
        faqListData.faqList.map((item) => ({
          ...item,
          key: item.faqNo + item.language
        }))
      )
    }
  }, [selectedKeys, faqListData, setTableData])

  const handleSortOrFilterChange = (pagination, filters = {}, sorter) => {
    const { order, field } = sorter
    if (filters?.status) {
      filters.statusList = filters.status
      delete filters.status
    }
    if (filters?.faqAnswerWithTag) {
      filters.tagKeys = filters.faqAnswerWithTag
      delete filters.faqAnswerWithTag
    }
    setSortAndFilterState({
      sort: {
        orderField: !order ? "" : field === "gmtModified" ? "gmtModified" : "gmtCreated",
        asc: order === "ascend" ? true : order === "descend" ? false : ""
      },
      ...filters
    })
  }

  const columns = [
    {
      title: "知识编号",
      dataIndex: "faqNo",
      key: "faqNo",
      width: 200,
      // fixed: "left",
      render: (description) => <OverflowTooltip text={description} />,
      ...TableFilter({
        form, // 表单 form
        searchParams: {
          faqNo: form.getFieldValue("faqNo")
        }, // 搜索条件
        searchInput: searchInput, // useRef(null)
        refresh: (value) => {
          setSortAndFilterState((p) => ({
            ...p,
            faqNo: value
          }))
        }, // 刷新方法
        dataIndex: "faqNo", //item.fieldKey, // index key
        fieldType: "" //item.inputType, // fieldType === "select" ： 搜索框，否则 input 输入框
        // enums: item.enums // select 枚举
      })
    },
    {
      title: "标准问题",
      dataIndex: "faqQuestion",
      key: "faqQuestion",
      // fixed: "left",
      width: 220,
      render: (description, record) => (
        <OverflowTooltip
          width={200}
          text={
            <span
              className="cursor-pointer"
              style={{
                color: selectedKeys.length === 0 ? "rgba(0, 0, 0, 0.25)" : "#1677ff"
              }}
              onClick={() => {
                if (selectedKeys.length === 0) return
                handleEditFaq(record)
                setCurrentRecord(record)
                setDrawerVisible(true)
              }}
            >
              {description}
            </span>
          }
          overflowCount={15}
        />
      ),
      ...TableFilter({
        form, // 表单 form
        searchParams: {
          question: form.getFieldValue("question")
        }, // 搜索条件
        searchInput: searchInput, // useRef(null)
        refresh: (value) => {
          setSortAndFilterState((p) => ({
            ...p,
            question: value
          }))
        }, // 刷新方法
        dataIndex: "question", //item.fieldKey, // index key
        fieldType: "" //item.inputType, // fieldType === "select" ： 搜索框，否则 input 输入框
        // enums: item.enums // select 枚举
      })
    },
    {
      title: "相似问题",
      dataIndex: "faqSimilarityQuestions",
      key: "faqSimilarityQuestions",
      width: 200,
      ...TableFilter({
        form, // 表单 form
        searchParams: {
          faqSimilarityQuestion: form.getFieldValue("faqSimilarityQuestion")
        }, // 搜索条件
        searchInput: searchInput, // useRef(null)
        refresh: (value) => {
          setSortAndFilterState((p) => ({
            ...p,
            faqSimilarityQuestion: value
          }))
        }, // 刷新方法
        dataIndex: "faqSimilarityQuestion", //item.fieldKey, // index key
        fieldType: "" //item.inputType, // fieldType === "select" ： 搜索框，否则 input 输入框
        // enums: item.enums // select 枚举
      }),
      render: (text) => {
        const count = text ? text.length : 0

        return (
          <Tooltip title="点击查看详情">
            <Button type="link" onClick={() => showModal(text)}>
              {/* <Iconfont type={"icon-icon-14guanlian"} className="text-lg" /> */}
              <EyeOutlined />
              <span
                style={{
                  color: "#7F56D9",
                  marginLeft: -2
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
      title: "语言",
      dataIndex: "language",
      key: "language",
      width: 100,
      render: (text) => <span>{languages.find((item) => item.id === text)?.name}</span>
    },
    {
      title: "来源标签",
      dataIndex: "faqAnswerWithTag",
      key: "faqAnswerWithTag",
      width: 300,
      filters: tagsFilterList,
      render: (faqAnswerWithTagList) => {
        return (
          <>
            {faqAnswerWithTagList.map((item) => {
              return (
                <Tag color="purple" className="my-1">
                  {item.tagDesc}
                </Tag>
              )
            })}
          </>
        )
      }
    },
    {
      title: "场景标签",
      dataIndex: "sceneTags",
      key: "sceneTags",
      width: 200,
      filters: sceneTagsFilterList,
      render: (faqAnswerWithTagList) => {
        return (
          <>
            {faqAnswerWithTagList?.map((code) => {
              return (
                <Tag color="gold" className="my-1">
                  {sceneTags && sceneTags?.length
                    ? sceneTags?.find((item) => {
                        return item.code === code
                      })?.tagDesc || "--"
                    : "--"}
                </Tag>
              )
            }) || "--"}
          </>
        )
      }
    },
    {
      title: "创建信息",
      dataIndex: "gmtCreator",
      key: "gmtCreator",
      width: 180,
      sorter: true,
      render: (gmtCreator, record) => {
        return (
          <Tooltip
            title={
              <>
                <div>{record.creatorName}</div>
                <div>{gmtCreator}</div>
              </>
            }
          >
            <div>{record.creatorName}</div>
            <div>{gmtCreator}</div>
          </Tooltip>
        )
      }
    },
    {
      title: "更新信息",
      dataIndex: "gmtModified",
      key: "gmtModified",
      width: 180,
      sorter: true,
      render: (gmtModified, record) => {
        return (
          <Tooltip
            title={
              <>
                <div>{record.modifierName}</div>
                <div>{gmtModified}</div>
              </>
            }
          >
            <div>{record.modifierName}</div>
            <div>{gmtModified}</div>
          </Tooltip>
        )
      }
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 120,
      filters: statusList,
      render: (status, record) => {
        return <StatusBadge status={status === 1 ? "已上线" : "未上线"} />
      },
      ...TableFilter({
        form,
        searchParams: {
          status: form.getFieldValue("status")
        },
        searchInput: searchInput,
        refresh: (value) => {
          setSortAndFilterState((p) => ({
            ...p,
            status: value
          }))
        },
        dataIndex: "status",
        fieldType: "select",
        enums: statusList
      })
    },
    {
      title: "操作",
      key: "action",
      width: 220,
      fixed: "right",
      render: (text, record) => (
        <>
          {isAntron ? (
            <span>
              <Button
                type="link"
                className="!ml-0"
                onClick={() => {
                  handleEditFaq(record)
                  setCurrentRecord(record)
                  setDrawerVisible(true)
                }}
              >
                查看
              </Button>
            </span>
          ) : (
            <span>
              <Popconfirm
                title={`确认${record.status === 1 ? "下线" : "上线"}该问答吗？`}
                onConfirm={() => handleChangeStatus([record], record.status === 1 ? 0 : 1)}
                okText="确认"
                cancelText="取消"
              >
                <Switch
                  checked={record.status === 1}
                  checkedChildren="已上线"
                  unCheckedChildren="未上线"
                  className={`${record.status === 1 ? "!bg-[#1FC16B]" : "!bg-[#D0D5DD]"} [&>.ant-switch-inner-checked]:!text-white [&>.ant-switch-inner-unchecked]:!text-white [&>.ant-switch-inner-checked]:!text-[10px] [&>.ant-switch-inner-unchecked]:!text-[10px]`}
                />
              </Popconfirm>
              <Button
                type="link"
                className="!ml-2 !pl-0"
                onClick={() => {
                  handleEditFaq(record)
                  setCurrentRecord(record)
                  setDrawerVisible(true)
                }}
              >
                编辑
              </Button>
              {viewAvAlible && (
                <>
                  {record.status !== 1 ? (
                    <Popconfirm
                      title="是否【删除】该问答"
                      onConfirm={() => handleDelete(record)}
                      okText="确认"
                      cancelText="取消"
                    >
                      <Button type="link">删除</Button>
                    </Popconfirm>
                  ) : (
                    <Popover content="下线后方可做删除操作" trigger="hover">
                      <Button disabled={true} type="link">
                        删除
                      </Button>
                    </Popover>
                  )}
                </>
              )}
            </span>
          )}
        </>
      )
    }
  ]

  const resourceCodeList = useAuthResources((state) => state.resourceCodeList)

  const hasEditAuth = resourceCodeList.includes(RESOURCE_CODE.BTN_KNOW_EDIT)
  // 控制FAQ知识库的批量上传下载按钮权限，包含faqUploadDownload权限的用户可见
  const hasUploadDownloadAuth = resourceCodeList.includes(RESOURCE_CODE.BTN_FAQ_UPLOAD_DOWNLOAD)
  // 控制FAQ知识库的新增按钮权限，包含faqInsert权限的用户可见
  const hasInsertAuth = resourceCodeList.includes(RESOURCE_CODE.BTN_FAQ_INSERT)
  const isAntron = currentSelectedKnowledgeBase?.catalogTypeCode === "2"
  const viewAvAlible =
    designatedSourceTagList !== undefined && designatedSourceTagList?.length === 0
  const onRightClick = ({ event, node }) => {
    if (isAntron || !hasEditAuth || !viewAvAlible) {
      return
    }
    const { pageX, pageY } = event
    const existingMenu = document.getElementById("context-menu")
    if (existingMenu) {
      document.body.removeChild(existingMenu)
    }
    const depth = node.pos?.split("-") || []
    const isLessThanMax = depth.length < 4
    const menu = (
      <Menu
        style={{
          position: "absolute",
          left: pageX,
          top: pageY,
          border: "1px solid #efefef",
          borderRadius: "0 6px 6px 6px"
        }}
        onClick={(e) => handleMenuClick(e, node)}
      >
        <Menu.Item key="addSameLevel">添加同级</Menu.Item>
        {isLessThanMax && <Menu.Item key="addSubLevel">添加子级</Menu.Item>}
        <Menu.Item key="edit">编辑名称</Menu.Item>
        <Menu.Item key="delete">删除</Menu.Item>
      </Menu>
    )

    const container = document.createElement("div")
    container.setAttribute("id", "context-menu")
    document.body.appendChild(container)
    ReactDOM.createRoot(container).render(menu)

    setContextMenuVisible(true)
    event.preventDefault()
  }

  useEffect(() => {
    const hideContextMenu = () => {
      const menu = document.getElementById("context-menu")
      if (menu) {
        document.body.removeChild(menu)
      }
      setContextMenuVisible(false)
    }
    if (contextMenuVisible) {
      document.addEventListener("click", hideContextMenu)
    }
    return () => {
      document.removeEventListener("click", hideContextMenu)
    }
  }, [contextMenuVisible])

  const rowSelection = {
    selectedRowKeys: rowSelected.map((item) => item.faqNo + item.language),
    onChange: (selectedRowKeys, selectedRows) => {
      setRowSelected(selectedRows)
      setSelectedRowKeys(selectedRowKeys)
    },
    getCheckboxProps: (record) => ({
      disabled: record.name === "Disabled User",
      name: record.name
    })
  }

  // 获取分类的完整路径（一级/二级/三级）
  const getCatalogFullPath = (catalogNo) => {
    if (!catalogNo || !currentSelectedKnowledgeBase?.children) {
      return "未知分类"
    }

    const findPath = (nodes, targetNo, path = []) => {
      for (const node of nodes) {
        const currentPath = [...path, node.catalogName]
        if (node.catalogNo === targetNo) {
          return currentPath
        }
        if (node.children && node.children.length > 0) {
          const found = findPath(node.children, targetNo, currentPath)
          if (found) return found
        }
      }
      return null
    }

    const path = findPath(currentSelectedKnowledgeBase.children, catalogNo)
    return path ? path.join("/") : "未知分类"
  }

  // 批量下载
  const hadnleMulDownload = (tag) => {
    const catalogNo =
      tag && tag === "all" ? selectedKeys[0] : rowSelected[0]?.catalogNo || selectedKeys[0]
    const fileName = getCatalogFullPath(catalogNo) + ".xlsx"

    mulDownload({
      knowledgeBaseNo: selectedKnowledgeBase,
      catalogNo: catalogNo,
      ids: tag && tag === "all" ? [] : rowSelected.map((item) => item.id).join(","),
      fileName: fileName
    })
    message.success("下载成功")
  }

  // 轮询下载结果
  const pollDownloadResult = () => {
    getDownloadResultMutate(
      { knowledgeBaseNo: selectedKnowledgeBase },
      {
        onSuccess: (response) => {
          if (response?.success && response?.data) {
            const { status, result, errorMessage } = response.data

            if (status === 1) {
              // 导出中，继续轮询
              // message.loading("下载中...", 1)
              setTimeout(() => {
                pollDownloadResult()
              }, 2000) // 2秒后再次轮询
            } else if (status === 2) {
              // 导出出错
              message.error(errorMessage || "导出失败")
              setDownloadAllLoading(false)
            } else if (status === 3) {
              // 导出成功，下载文件
              try {
                const link = document.createElement("a")
                link.href = result
                link.download = ""
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                message.success("下载成功")
              } catch (error) {
                console.error("下载文件失败:", error)
                message.error("下载失败")
              }
              setDownloadAllLoading(false)
            }
          } else {
            message.error(response?.message || "获取下载结果失败")
            setDownloadAllLoading(false)
          }
        },
        onError: (error) => {
          console.error("获取下载结果失败:", error)
          message.error("获取下载结果失败")
          setDownloadAllLoading(false)
        }
      }
    )
  }

  // 下载全部分类
  const handleDownloadAllCategories = () => {
    setDownloadAllLoading(true)
    downloadAllCategoriesMutate(
      { knowledgeBaseNo: selectedKnowledgeBase },
      {
        onSuccess: (response) => {
          if (response?.success) {
            // 开始轮询下载结果
            pollDownloadResult()
          } else {
            message.error(response?.message || "启动下载失败")
            setDownloadAllLoading(false)
          }
        },
        onError: (error) => {
          console.error("下载全部分类失败:", error)
          message.error("下载全部分类失败")
          setDownloadAllLoading(false)
        }
      }
    )
  }
  const handlerDownload = () => {
    const file = `${knowledgePrefix}/admin/knowledge/${selectedKnowledgeBase}/faq/templateDownload`
    handleDownloadExcel(file, "问答知识库模板")
  }

  const searchParams = queryString.parse(window.location.search) || {}
  const hashParams = queryString.parse(window.location.hash.split("?")[1] || "") || {}
  const { token: isIframe } = searchParams.token ? searchParams : hashParams

  useEffect(() => {
    setSelectedRowKeys([])
    setRowSelected([])
  }, [selectedKeys[0]])

  return (
    <>
      <Form form={form}>
        <div className="knowledge-base-wrapper">
          <div
            // className={`${!isIframe ? "tree-wrapper-noiframe" : "tree-wrapper"}`}
            className="tree-wrapper"
            style={{
              maxHeight:
                // @ts-ignore
                treeData?.children?.length > 10 ? "calc(100vh - 210px)" : ""
            }}
          >
            <Select
              style={{ width: "100%", marginBottom: 12 }}
              placeholder="请选择知识库"
              value={currentSelectedKnowledgeBase?.catalogTypeCode}
              onChange={onKnowledgeSelectChange}
              options={treeData.catalogsTreeList}
              fieldNames={{ label: "catalogType", value: "catalogTypeCode" }}
            />
            <Spin spinning={treeDataLoading}>
              {(!currentSelectedKnowledgeBase?.children ||
                currentSelectedKnowledgeBase?.children?.length < 1) &&
              hasEditAuth &&
              viewAvAlible &&
              !isAntron ? (
                <Button
                  className={`-ml-[5px]  ${isIframe ? "mt-[68px]" : ""}`}
                  icon={<PlusOutlined />}
                  style={{
                    color: "var(--main-1, #7F56D9)"
                  }}
                  type="link"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    editFlag.current = false
                    handleMenuClick(
                      { key: "addSameLevel" },
                      {
                        parentCatalogNo: currentSelectedKnowledgeBase.knowledgeBaseNo
                      }
                    )
                  }}
                >
                  新增分类
                </Button>
              ) : (
                <Tree
                  showLine={{ showLeafIcon: false }}
                  switcherIcon={
                    <CaretDownFilled
                      style={{
                        fontSize: "13px",
                        color: "#475467",
                        verticalAlign: "middle",
                        marginLeft: "-4px"
                      }}
                    />
                  }
                  onSelect={(...args) => {
                    onSelect(...args)
                    setPagination({
                      current: 1,
                      pageSize: pagination.pageSize
                    })
                  }}
                  className="tree-knowledge-style"
                  selectedKeys={selectedKeys}
                  defaultExpandAll={true}
                  autoExpandParent={true}
                  defaultExpandParent={true}
                  treeData={currentSelectedKnowledgeBase?.children || []}
                  fieldNames={{
                    title: "catalogName",
                    key: "catalogNo"
                  }}
                  titleRender={(nodeData) => (
                    <Tooltip title={nodeData.catalogName}>
                      <div
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          width: "100%"
                        }}
                      >
                        {nodeData.catalogName}
                      </div>
                    </Tooltip>
                  )}
                  onRightClick={onRightClick}
                  onExpand={setExpandedKeys}
                />
              )}
            </Spin>
          </div>
          <div className="table-wrapper">
            <Spin spinning={mulUploadLoading}>
              <div className={`flex justify-between items-center ${viewAvAlible ? "mb-4" : ""}`}>
                {isAntron ? (
                  <div className="pl-2">若需编辑问答，请前往Antron平台</div>
                ) : (
                  viewAvAlible && (
                    <div className="flex justify-between w-[100%] items-center">
                      <div className="flex items-center gap-2">
                        {hasInsertAuth && (
                          <Button
                            disabled={selectedKeys.length === 0}
                            type="primary"
                            onClick={() => {
                              setDrawerVisible(true)
                              setCurrentRecord(null)
                              setEditDetailList([])
                            }}
                          >
                            <i className="iconfont icon-chuangjian"></i>
                            新增知识
                          </Button>
                        )}

                        <BatchOperations
                          rejectDeleteText={rejectDeleteText}
                          selectedKeys={selectedRowKeys || []}
                          onBatchDelete={onHandleBatchDeleteClick}
                          showDelete={true}
                          loading={resultStatusData === 0}
                          extraItems={[
                            {
                              key: "1",
                              label: "批量上线",
                              onClick: () => handleChangeStatus(rowSelected, 1),
                              disabled: rowSelected.length === 0
                            },
                            {
                              key: "2",
                              label: "批量下线",
                              onClick: () => handleChangeStatus(rowSelected, 0),
                              disabled: rowSelected.length === 0
                            },
                            hasUploadDownloadAuth && {
                              key: "3",
                              label: rowSelected.length === 0 ? "全部下载" : "批量下载",
                              onClick: hadnleMulDownload
                            },
                            hasUploadDownloadAuth && {
                              key: "4",
                              label: "下载模板",
                              onClick: handlerDownload
                            },
                            hasUploadDownloadAuth && {
                              key: "5",
                              label: (
                                <Upload
                                  accept=".xlsx,.xls"
                                  name="file"
                                  action={handleUpload(rowSelected[0]?.catalogNo)}
                                  headers={{
                                    "X-Usercenter-Session": getTokenAndServiceName().token
                                  }}
                                  beforeUpload={(file) => {
                                    const isExcel =
                                      file.type ===
                                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
                                      file.type === "application/vnd.ms-excel"
                                    if (!isExcel) {
                                      message.error("请上传Excel文件")
                                    }
                                    return isExcel
                                  }}
                                  onSuccess={(res) => {
                                    const specificCatalogNo = rowSelected[0]?.catalogNo
                                    handleGetResult(0, specificCatalogNo)
                                    const infoList = get(res, ["data", "checkResult"], [])
                                    const urlKey = get(res, ["data", "key"], "")
                                    if (infoList.length) {
                                      NiceModal.show(DownLoadErrorModal, {
                                        infoList,
                                        urlKey,
                                        knowledgeBaseNo: selectedKnowledgeBase,
                                        catalogNo: specificCatalogNo || selectedKeys[0],
                                        namespace: DEFAULTNAMESPACE
                                      })
                                    }
                                  }}
                                  showUploadList={false}
                                  onChange={(info) => {
                                    if (info.file.status === "uploading") {
                                      setMulUploadLoading(true)
                                      return
                                    }
                                    handleGetResult()
                                    if (info.file.status === "done") {
                                      queryClient.invalidateQueries([QUERY_KEYS.FAQ_LIST_BY_PAGE])
                                      return
                                    }
                                  }}
                                >
                                  <Button
                                    className="!p-[0px] !h-[20px] !w-[80px] !text-left !align-baseline text-[#7F56D9]"
                                    disabled={resultStatusData === 0}
                                    size="small"
                                    type="link"
                                  >
                                    <div className="text-left w-[100%]"> 上传</div>
                                  </Button>
                                </Upload>
                              )
                            }
                          ]}
                          itemOrder={["delete", "1", "2", "3", "4", "5"]}
                        />

                        <Dropdown
                          menu={{
                            items: [
                              {
                                key: "download-current",
                                label: "下载当前分类",
                                onClick: () => hadnleMulDownload("all")
                              },
                              {
                                key: "download-all",
                                label: "下载全部分类",
                                onClick: handleDownloadAllCategories
                              }
                            ]
                          }}
                          disabled={selectedKeys.length === 0 || downloadAllLoading}
                        >
                          <Button
                            type="dashed"
                            loading={downloadAllLoading}
                            disabled={selectedKeys.length === 0}
                          >
                            全部下载
                            <DownOutlined />
                          </Button>
                        </Dropdown>

                        <Button
                          disabled={selectedKeys.length === 0}
                          onClick={() => setUploadDocumentVisible(true)}
                        >
                          文档拆分
                        </Button>
                      </div>
                      <div className="text-gray-500 text-[12px]">
                        已选择目录：
                        {selectedKeys && selectedKeys.length > 0
                          ? `${currentSelectedKnowledgeBase?.children?.find((cat) => cat.catalogNo === selectedKeys[0])?.catalogName || "--"} (ID: ${selectedKeys[0] || "--"})`
                          : "--"}
                      </div>
                    </div>
                  )
                )}

                {/* <Input
                  placeholder="请输入问题"
                  className="mr-4 w-60"
                  onChange={(e) => {
                    if (e.target.value === "") {
                      debounceSetQuesTion("")
                    } else {
                      debounceSetQuesTion(e.target.value)
                    }
                  }}
                /> */}
              </div>

              <Table
                loading={selectedKeys.length === 0 ? false : faqListLoading}
                columns={columns}
                dataSource={tableData}
                className="table-style-v2"
                rowClassName={(record, index) => {
                  if (index % 2 === 0) {
                    return "table-style-v2-even-row"
                  } else {
                    return "table-style-v2-odd-row"
                  }
                }}
                rowSelection={
                  isAntron
                    ? null
                    : {
                        type: "checkbox",
                        ...rowSelection
                      }
                }
                onChange={handleSortOrFilterChange}
                // 设置一下高度溢出滚动
                scroll={{
                  y: isIframe ? "calc(100vh - 220px)" : "calc(100vh - 550px)",
                  x: 1200
                }}
                pagination={false}
              />

              <Pagination
                // className="pr-2 pagination-v2"
                // size="small"
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={faqListData?.total}
                onChange={(page, pageSize) => setPagination({ current: page, pageSize })}
                showSizeChanger={true}
                style={{ marginTop: "10px", textAlign: "right" }}
                showTotal={(total) => `共 ${total} 条`}
              />
            </Spin>
          </div>
        </div>
      </Form>
      <Modal
        title={editFlag.current ? "编辑" : "添加"}
        open={showEditModal}
        onCancel={() => setShowEditModal(false)}
        onOk={handleModalOk}
      >
        <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
      </Modal>
      <DrawerForm
        imgUploadAction={() => imgUploadAction(currentRecord?.catalogNo)}
        currentRecord={currentRecord}
        currentSelectedKnowledgeBase={treeData}
        editDetailList={editDetailList}
        catalogNo={currentRecord?.catalogNo || (selectedKeys && selectedKeys[0])}
        handleGenerateSimilarQuestions={handleGenerateSimilarQuestions}
        handleSaveQuestions={handleSaveQuestions}
        visible={drawerVisible}
        knowledgeBaseNo={selectedKnowledgeBase}
        onClose={() => setDrawerVisible(false)}
        disabled={isAntron}
        isAntron={isAntron}
        viewAvAlible={viewAvAlible}
      />
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
      <DocumentUploader
        visible={uploadDocumentVisible}
        onVisibilityChange={setUploadDocumentVisible}
        selectedKnowledgeBase={selectedKnowledgeBase}
        selectedKeys={selectedKeys}
      />
    </>
  )
}

export default KnowledgeBase
