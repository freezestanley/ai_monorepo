import { useEffect, useMemo, useRef, useState } from "react"
import {
  Input,
  Button,
  Spin,
  Modal,
  Upload,
  message,
  Select,
  Form,
  Radio,
  notification,
  Typography,
  Popconfirm,
  Tooltip
} from "antd"
import TableRender from "table-render"
import styles from "./DatasetView.module.scss"
import { InboxOutlined } from "@ant-design/icons"
import {
  useDeleteDatasetRecord,
  useBatchDeleteDatasetRecord,
  useEditDatasetRecord,
  useAddDatasetRecord,
  useFetchStructureDatasetImportData,
  useImportStructureDatasetResult,
  useFetchDesignatedSourceTagList,
  useFetchStructureDatasetFieldLayout,
  useCreateStructureDatasetFieldLayout,
  useUpdateStructureDatasetFieldLayout
} from "@/api/structureKnowledge"
import {
  downloadStructureDatasetTemplate,
  uploadStructureDataset,
  exportStructureDataset,
  getExportResult,
  fetchStructureDatasetRecordList
} from "@/api/structureKnowledge/api"
import { debounce, initial } from "lodash"
import { getTokenAndServiceName } from "@/api/sso"
import { exchangeESType } from "@/utils"
import { ALL } from "@/components/CustomSelect"
import { Tag } from "antd"
import { TableFilter } from "@/utils/tableFliter"
import { KNOWLEDGE_SCENE_TAG } from "@/constants"
import { fetchSourceTag } from "@/api/sourceTag/api"
import { useAuthResources } from "@/store"
import BatchOperations from "@/components/BatchOperations"

const Dragger = Upload.Dragger

const { Text } = Typography

const editTitle = {
  add: "新增",
  edit: "编辑"
}

const DatasetView = (props) => {
  const [_, forceUpdate] = useState({})
  const [searchFieldKey, setSearchFieldkey] = useState("")
  const [searchFieldValue, setSearchFieldValue] = useState("")
  const [fieldKeyOptions, setFieldKeyOptions] = useState([])
  const [refreshFlag, setRefreshFlag] = useState(0)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [editMode, setEditMode] = useState("add")
  const [columnsSettingValue, setColumnsSettingValue] = useState([]) // 列设置

  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [currentData, setCurrentData] = useState([])
  const [selectedRowKeys, setSelectedRowKeys] = useState(null)
  const [datasetInfo, setDatasetInfo] = useState({})
  const [records, setRecords] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [editForm] = Form.useForm()
  const [searcForm] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()

  const [fileList, setFileList] = useState([])

  const selectFilterRef = useRef([])
  const searchTermRef = useRef("")
  const tableRef = useRef()

  const resultTimerRef = useRef(null)
  const uploadFileId = useRef(null)
  const { knowledgeBaseNo, catalogNo, structureNo, searchKey, searchValue, botNo } = props

  const [sourceTag, setSourceTag] = useState([])
  const [sceneTag, setSCeneTag] = useState([])
  const resourceCodeList = useAuthResources((state) => state.resourceCodeList)

  useEffect(() => {
    Promise.all([
      fetchSourceTag({
        botNo,
        tagType: "knowledgeAnswerSource"
      }),
      fetchSourceTag({
        botNo,
        tagType: KNOWLEDGE_SCENE_TAG
      })
    ]).then(([res1, res2]) => {
      setSourceTag(res1.data || [])
      setSCeneTag(res2.data || [])
      forceUpdate({})
    })
  }, [botNo])

  const sourceTagMap = useMemo(() => {
    const map = new Map()
    sourceTag.forEach((tag) => map.set(tag.code, tag.tagDesc))
    forceUpdate({})
    return map
  }, [sourceTag])

  const { data: designatedSourceTagList = [] } = useFetchDesignatedSourceTagList({
    botNo
  })

  const viewAvAlible =
    designatedSourceTagList !== undefined && designatedSourceTagList?.length === 0

  const { data: fieldLayout, refetch: refetchFieldLayout } = useFetchStructureDatasetFieldLayout({
    knowledgeBaseNo,
    structureNo
  })

  const strategyObj = useMemo(() => {
    const obj = {}
    datasetInfo.strategies?.forEach((strategy) => {
      obj[strategy["name"]] = {
        visibleType: strategy.visibleType,
        tagKeys: strategy.tagKeys
      }
    })
    return obj
  }, [datasetInfo?.strategies])
  const { mutate: importStructureDataset } = useFetchStructureDatasetImportData()
  const { mutate: importStructureDatasetResult } = useImportStructureDatasetResult()

  const { mutate: addDatasetRecord } = useAddDatasetRecord()
  const { mutate: editDatasetRecord } = useEditDatasetRecord()
  const { mutate: deleteDatasetRecord } = useDeleteDatasetRecord()
  const { mutate: batchDeleteDatasetRecord } = useBatchDeleteDatasetRecord()
  const { mutate: createStructureDatasetFieldLayout } = useCreateStructureDatasetFieldLayout()
  const { mutate: updateStructureDatasetFieldLayout } = useUpdateStructureDatasetFieldLayout()

  const refetch = () => tableRef.current?.refresh({ stay: false }) // 页码停留在原页

  const request = async (params, sorter) => {
    try {
      setIsLoading(true)
      const res = await fetchStructureDatasetRecordList({
        knowledgeBaseNo,
        catalogNo,
        structureNo,
        pageSize: params.pageSize,
        pageNum: params.current,
        searchText: searchTermRef.current,
        filterFieldKey: searchFieldKey,
        filterFieldValue: searchFieldValue,
        searchSourceTagValue: designatedSourceTagList[0]?.channel,
        refreshFlag,
        searchConditions: selectFilterRef.current,
        sortFields: sorter?.order && [
          {
            field: sorter.field,
            sort: sorter.order === "ascend" ? "ASC" : "DESC"
          }
        ],
        ...params
      })
      setCurrentPage(params.current)
      setPageSize(params.pageSize)
      setDatasetInfo(res?.data?.structure || {})
      setRecords(res?.data?.records || [])
      return {
        data:
          res?.data?.records?.map((record) => {
            const res = { subRecord: record }
            record.forEach(({ key, value }) => {
              res[key] = (value ?? "") + ""
            })
            return res
          }) || [],
        total: res?.data?.total
      }
    } catch (error) {
      return {
        data: [],
        total: 0
      }
    } finally {
      setIsLoading(false)
    }
  }

  const searchTextChange = (e) => {
    const value = e.target.value
    searchTermRef.current = value
    setRefreshFlag(Math.random())
    refetch()
  }

  const handleModalOk = () => {
    setIsModalVisible(false)
    setFileList([])

    importStructureDataset(
      {
        knowledgeBaseNo,
        catalogNo,
        structureNo,
        documentNo: uploadFileId.current
      },
      {
        onSuccess: (e) => {
          if (e.success) {
            notification.success({
              message: e.message,
              description:
                "文档上传成功，数据导入中，需要一定时间才能完成，请耐心等待结果，或者离开本页面服务器也会正常导入"
            })
            getResults()
          } else {
            notification.warning({
              message: "出错了",
              description: e.message
            })
          }
        }
      }
    )
  }

  // 检测上传结果
  const getResults = () => {
    importStructureDatasetResult(
      {
        knowledgeBaseNo,
        catalogNo,
        structureNo
      },
      {
        onSuccess: (e) => {
          console.log(e)
          if (e.data.status === 0 || e.data.status === 1) {
            resultTimerRef.current = setTimeout(() => {
              getResults()
            }, 1500)
          } else if (e.data.status === 2) {
            message.success(e.data.message)
            refetch()
          } else if (e.data.status === 3) {
            message.error(e.data.message)
          }
        }
      }
    )
  }

  // 显示Modal
  const handleImport = () => {
    setIsModalVisible(true)
  }

  // 处理Modal的取消操作
  const handleCancel = () => {
    setIsModalVisible(false)
    setFileList([])
  }

  const onHandleEditClick = (record = [], type = "add") => {
    editForm.resetFields()
    setEditMode(type)
    setCurrentData(record)
    setIsEditModalVisible(true)
  }

  const [exportPolling, setExportPolling] = useState(false)
  const exportTimerRef = useRef(null)

  const handleExport = () => {
    const data = {
      knowledgeBaseNo,
      catalogNo,
      structureNo,
      pageSize,
      pageNum: currentPage,
      searchText: searchTermRef.current,
      filterFieldKey: searchFieldKey,
      filterFieldValue: searchFieldValue,
      searchConditions: selectFilterRef.current
    }
    setExportLoading(true)
    exportStructureDataset(data)
      .then((res) => {
        if (res.success) {
          messageApi.open({
            type: "info",
            content: "正在导出中，请不要关闭页面...",
            duration: 0
          })
          setExportPolling(true)
          // 开始轮询
          exportTimerRef.current = setInterval(() => {
            getExportResult({ knowledgeBaseNo, catalogNo, structureNo })
              .then((result) => {
                if (result.success) {
                  const { status, message } = result.data
                  if (status === 0) {
                    // 继续轮询
                    return
                  } else if (status === 1) {
                    // 导出完成，下载文件
                    clearInterval(exportTimerRef.current)
                    setExportPolling(false)
                    messageApi.destroy()
                    window.open(message, "_blank")
                    messageApi.open({
                      type: "success",
                      content: "导出完成！",
                      duration: 3
                    })
                  } else if (status === 2) {
                    // 导出异常
                    clearInterval(exportTimerRef.current)
                    setExportPolling(false)
                    messageApi.destroy()
                    messageApi.open({
                      type: "error",
                      content: message || "导出失败！",
                      duration: 3
                    })
                  } else if (status === 3) {
                    // 不存在导出结果
                    clearInterval(exportTimerRef.current)
                    setExportPolling(false)
                    messageApi.destroy()
                    messageApi.open({
                      type: "error",
                      content: "导出失败，请重试！",
                      duration: 3
                    })
                  }
                }
              })
              .catch(() => {
                clearInterval(exportTimerRef.current)
                setExportPolling(false)
                messageApi.destroy()
                messageApi.open({
                  type: "error",
                  content: "导出失败！",
                  duration: 3
                })
              })
          }, 2000)
        } else {
          messageApi.open({
            type: "error",
            content: res.message || "导出失败！",
            duration: 3
          })
        }
      })
      .catch(() => {
        messageApi.open({
          type: "error",
          content: "导出失败！",
          duration: 3
        })
      })
      .finally(() => {
        setExportLoading(false)
      })
  }

  useEffect(() => {
    getResults()
    // 组件卸载时清除定时器
    return () => {
      if (exportTimerRef.current) {
        clearInterval(exportTimerRef.current)
      }
      if (resultTimerRef.current) {
        clearTimeout(resultTimerRef.current)
      }
    }
  }, [])

  /**
   * 新增/编辑完成
   */
  const onHandleEditOk = () => {
    editForm.validateFields().then((values) => {
      const submitData = values
      // 如果有来源标签，并且sourceTag === 'all' ，sourceTag 重新赋值 undefind
      if (submitData?.sourceTag && submitData?.sourceTag === "all") {
        submitData.sourceTag = undefined
      }
      const fetchFn = editMode === "add" ? addDatasetRecord : editDatasetRecord
      fetchFn(
        {
          knowledgeBaseNo,
          structureNo,
          structureRecord: submitData,
          ...(editMode === "add" ? {} : { structureRecordId: submitData.id })
        },
        {
          onSuccess: (e) => {
            if (e.success) {
              message.success(e.message)
              setTimeout(() => {
                refetch()
              }, 1000)
              setIsEditModalVisible(false)
            } else {
              notification.warning({
                message: "出错了",
                description: e.message
              })
            }
          }
        }
      )
    })
  }

  /**
   * 处理删除点击
   */
  const onHandleDeleteClick = (id) => {
    const fetchFn = Array.isArray(id) ? batchDeleteDatasetRecord : deleteDatasetRecord
    fetchFn(
      {
        knowledgeBaseNo,
        structureNo,
        [Array.isArray(id) ? "structureRecordIds" : "structureRecordId"]: id
      },
      {
        onSuccess: (e) => {
          if (e.success) {
            message.success(e.message)
            setSelectedRowKeys((preState) => {
              return (preState || []).filter((v) =>
                Array.isArray(id) ? !id.includes(v) : v !== id
              )
            })
            refetch()
          } else {
            message.error(e.message)
          }
        },
        onError: (err) => {
          err.message && message.error(err.message)
        }
      }
    )
  }

  /**
   * 取消编辑
   */
  const onHandleEditCancel = () => {
    setIsEditModalVisible(false)
  }

  // 上传文件的props
  const uploadProps = {
    // 这里可以定义上传文件的处理逻辑，例如上传到后端服务器
    maxCount: 1,
    headers: {
      "X-Usercenter-Session": getTokenAndServiceName().token
    },
    action: uploadStructureDataset({
      knowledgeBaseNo,
      catalogNo,
      structureNo
    }),
    beforeUpload: () => {
      uploadFileId.current = null
    },
    fileList,
    onChange(info) {
      console.log(info)
      const newFileList = [...(info.fileList || [])]
      if (info.file.status === "done") {
        // 文件上传成功后的回调函数
        console.log(`${info.file.name} file uploaded successfully`)
        if (info.file.response && info.file.response.success === false) {
          message.error(info.file.response.message || "上传失败")
          // 可以在这里重置上传状态或执行其他操作
          uploadFileId.current = null
          const targetFile = newFileList.find((item) => item.uid === info.file.uid)
          if (targetFile) {
            targetFile.status = "error"
            targetFile.error = new Error(info.file.response.message || "上传失败")
          }
        } else {
          // 真正成功的情况
          message.success(`${info.file.name} 上传成功`)
          uploadFileId.current = info.file.response.data
        }
      } else if (info.file.status === "error") {
        uploadFileId.current = null
        // 文件上传失败后的回调函数
        console.log(`${info.file.name} file upload failed.`)
      }
      setFileList(newFileList)
    }
  }

  // 处理下载模板的函数
  const handleDownload = () => {
    setDownloading(true)
    downloadStructureDatasetTemplate({
      knowledgeBaseNo,
      catalogNo,
      structureNo
    }).then(() => {
      setDownloading(false)
    })
  }

  const searchRelationInput = useRef(null)

  useEffect(() => {
    const strategies = datasetInfo?.strategies?.filter((i) => i.type === "keyword") || [] // 只显示字符串类型的字段
    fieldKeyOptions.length === 0 && strategies.length > 0 && setFieldKeyOptions(strategies)
    // 第一次加载完成后，默认选中第一个字段
    const key = searchKey && searchKey !== "undefined" ? searchKey : strategies?.[0]?.key
    searchFieldKey === "" && key && setSearchFieldkey(key)
    searchFieldValue === "" &&
      searchValue &&
      searchValue !== "undefined" &&
      setSearchFieldValue(searchValue)
  }, [datasetInfo, searchFieldKey, fieldKeyOptions, searchKey, searchValue, searchFieldValue])

  const filterHandle = (value, key) => {
    // 如果 value 是空或者 undefined，直接 return
    if (value === undefined || value === null || value === "") {
      selectFilterRef.current = []
      refetch()
      return
    }

    // 如果 value 是对象，检查对象中是否有 undefined 的值
    if (typeof value === "object" && value !== null) {
      // 检查对象是否为空
      if (Object.keys(value).length === 0) {
        selectFilterRef.current = []
        refetch()
        return
      }

      // 检查对象中是否有 undefined 的值
      const hasUndefinedValue = Object.values(value).some((val) => val === undefined)
      if (hasUndefinedValue) {
        selectFilterRef.current = []
        refetch()
        return
      }
    }

    let newSelectFilter = selectFilterRef.current
    const filterIndex = newSelectFilter.findIndex((s) => s.key === key)
    if (filterIndex > -1) {
      value
        ? (newSelectFilter[filterIndex]["value"] = value)
        : newSelectFilter.splice(filterIndex, 1)
    } else {
      newSelectFilter.push({
        key: key,
        value: value,
        operation: "match"
      })
    }

    selectFilterRef.current = newSelectFilter

    refetch()
  }

  useEffect(() => {
    setSelectedRowKeys([])
  }, [catalogNo])

  const actionRow = useMemo(() => {
    return {
      title: "操作",
      dataIndex: "operate",
      key: "operate",
      minWidth: 120,
      fixed: "right",
      hidden: false,
      render: (_, record) => (
        <>
          {resourceCodeList.includes("structureEdit") && (
            <Button
              type="link"
              size="small"
              onClick={() => onHandleEditClick(record?.subRecord, "edit")}
            >
              编辑
            </Button>
          )}
          {viewAvAlible && (
            <Popconfirm
              title="确定要删除该条记录吗?"
              okText="确定"
              cancelText="取消"
              onConfirm={() => onHandleDeleteClick(record.id)}
            >
              <Button type="link" size="small" danger>
                删除
              </Button>
            </Popconfirm>
          )}
        </>
      )
    }
  }, [resourceCodeList, viewAvAlible])

  const columns = useMemo(() => {
    let _columns = [
      ...(datasetInfo.strategies?.map(({ name, key, tagKeys = [] }) => ({
        title: (
          <div>
            <Text strong>{name}</Text>
            {/* <br /> */}
            {/* {tagKeys?.map((item) => {
              const tag =
                sourceTag.find((tag) => {
                  return tag.code === item
                }) || {}
              return tag.tagDesc ? <Text code>{tag.tagDesc}</Text> : null
            })} */}
          </div>
        ),
        dataIndex: key,
        key: key,
        minWidth: 200,
        ...TableFilter({
          form: searcForm, // 表单 form
          searchParams: () => {
            const val = searcForm.getFieldValue(key)
            return {
              [key]: val
            }
          }, // 搜索条件
          searchInput: searchRelationInput, // useRef(null)
          refresh: (value) => {
            console.log("value", value)
            filterHandle(value, key)
          }, // 刷新方法
          dataIndex: key, //item.fieldKey, // index key
          multipleSelect: key === "sceneTag",
          fieldType: key == "sourceTag" || key === "sceneTag" ? "select" : "", //item.inputType, // fieldType === "select" ： 搜索框，否则 input 输入框
          enums:
            key == "sourceTag"
              ? sourceTag?.map((item) => ({
                  desc: item?.tagDesc,
                  value: item?.code
                }))
              : key === "sceneTag"
                ? sceneTag?.map((item) => ({
                    desc: item?.tagDesc,
                    value: item?.code
                  }))
                : ""
        }),
        render: (text) => {
          const renderSourceTag = () => (
            <div>{sourceTag?.length > 0 ? sourceTagMap.get(text) || "全局可见" : ""}</div>
          )

          const renderSceneTag = () => (
            <div className="flex flex-wrap gap-1">
              {text?.split(",")?.map((code) => {
                const tagText = sceneTag?.find((source) => source?.code === code)?.tagDesc
                return <Tag key={code}>{tagText}</Tag>
              })}
            </div>
          )

          const renderDefault = () => (
            <div className={`min-w-28 ${key === "payload" ? "max-w-5xl" : "max-w-xs"}`}>{text}</div>
          )

          const renderers = {
            sourceTag: renderSourceTag,
            sceneTag: renderSceneTag,
            default: renderDefault
          }
          return renderers[key] ? renderers[key]() : renderers.default()
        }
      })) || []),
      {
        title: "创建信息",
        dataIndex: "gmtCreated",
        key: "gmtCreated",
        minWidth: 180,
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
        sorter: true,
        minWidth: 180,
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
      actionRow
    ]

    if (!_columns.find(({ key }) => key === "id")) {
      _columns.unshift({
        title: records?.[0]?.find(({ key }) => key === "id")?.name || "编号",
        dataIndex: "id",
        key: "id",
        minWidth: 200
      })
    }
    if (fieldLayout?.data?.layouts?.length > 0) {
      _columns = _columns
        .map((item) => {
          const fieldLayoutItem = fieldLayout?.data?.layouts?.find(
            (layout) => layout.fieldKey === item.dataIndex
          )
          return {
            ...item,
            ...(fieldLayoutItem || {})
          }
        })
        .sort((a, b) => a.order - b.order)
    }
    setColumnsSettingValue(_columns)
    return _columns
  }, [
    datasetInfo.strategies,
    records,
    sourceTag,
    sceneTag,
    sourceTagMap,
    searcForm,
    fieldLayout?.data?.layouts,
    actionRow
  ])

  const handleSaveStructureDatasetFieldLayout = (fields) => {
    const fetchApi = !fieldLayout?.data?.id
      ? createStructureDatasetFieldLayout
      : updateStructureDatasetFieldLayout
    fetchApi(
      {
        knowledgeBaseNo,
        structureNo,
        layouts: fields,
        id: fieldLayout?.data?.id || undefined
      },
      {
        onSuccess: (res) => {
          console.log("res", res)
          if (res.success) {
            refetchFieldLayout()
          } else {
            res.message && message.error(res.message)
          }
        }
      }
    )
  }

  const onColumnsSettingChange = (setting) => {
    const removeActionList = initial(setting)
    setColumnsSettingValue([...removeActionList, actionRow])
    const fields = []
    console.log(removeActionList, "removeActionList")
    removeActionList.forEach((item, index) => {
      columns.forEach((column) => {
        if (item.key === column.key) {
          fields.push({
            fieldKey: column.key,
            hidden: item.hidden,
            fixed: item.fixed,
            order: index + 1
          })
        }
      })
    })
    handleSaveStructureDatasetFieldLayout(fields)
  }

  return (
    <Spin spinning={isLoading || exportPolling}>
      <div>
        <div className={styles.header}>
          <div className="flex items-center justify-between w-full ">
            <div></div>
          </div>
        </div>
        <Form form={searcForm}>
          <div className={styles.content}>
            <div className={`table-xrender-container ${styles["leftPane-wrapper"]}`}>
              <div className={styles.leftPane1}>
                <TableRender
                  rowKey={"id"}
                  ref={tableRef}
                  toolbarAction={{
                    enabled: ["columnsSetting"],
                    columnsSettingValue,
                    onColumnsSettingChange
                  }}
                  title={
                    <>
                      {viewAvAlible && (
                        <div>
                          {resourceCodeList.includes("structureRecordInsert") && (
                            <Button onClick={() => onHandleEditClick(datasetInfo.strategies)}>
                              新增
                            </Button>
                          )}
                          {resourceCodeList.includes("structureRecordUploadDownload") && (
                            <>
                              <Button className="ml-2" type="primary" onClick={handleImport}>
                                导入
                              </Button>
                              <Button
                                className="ml-2 mr-2"
                                type="primary"
                                loading={exportLoading}
                                onClick={handleExport}
                              >
                                导出
                              </Button>
                            </>
                          )}
                          <BatchOperations
                            selectedKeys={selectedRowKeys || []}
                            onBatchDelete={onHandleDeleteClick}
                            showDelete={true}
                            extraItems={[]}
                            itemOrder={["delete"]}
                          />
                        </div>
                      )}
                    </>
                  }
                  toolbarRender={
                    <Input
                      placeholder="搜索编号"
                      style={{
                        width: 300
                      }}
                      onChange={debounce(searchTextChange, 500)}
                      onPressEnter={searchTextChange}
                    />
                  }
                  size="small"
                  tableLayout="auto"
                  columns={columns}
                  request={request}
                  rowSelection={{
                    fixed: true,
                    selectedRowKeys,
                    onChange: (newSelectedRowKeys) => setSelectedRowKeys(newSelectedRowKeys || [])
                  }}
                  scroll={{ y: "calc(100vh - 310px)", x: 1000 }} // x: "max-content"
                  pagination={{
                    showSizeChanger: true,
                    size: "default",
                    showTotal: (total) => `共${total || 0}条`
                  }}
                />
              </div>
            </div>

            {/* <Card title="基础信息" className={styles.rightPane} bodyStyle={{ padding: 13 }}>
              <p className="text-sm">
                <b>数据集名称：</b>
                {datasetInfo.name}
              </p>
              <p className="text-sm">
                <b>创建时间：</b>
                {datasetInfo.gmtCreated}
              </p>
              <p className="text-sm">
                <b>更新时间：</b>
                {datasetInfo.gmtModified}
              </p>
              <p className="text-sm">
                <b>来源：</b>
                {datasetInfo.sourceDesc}
              </p>
            </Card> */}
          </div>
        </Form>
      </div>
      <Modal
        title={editTitle[editMode]}
        open={isEditModalVisible}
        onOk={onHandleEditOk}
        onCancel={onHandleEditCancel}
        key={currentData?.[0]?.value}
        destroyOnClose
        width={700}
      >
        <Form
          form={editForm}
          labelCol={{
            span: 4
          }}
          wrapperCol={{
            span: 19
          }}
          className={styles["structure-data-modal-form"]}
        >
          {currentData
            ?.filter(
              (item) =>
                ![
                  "gmtCreated",
                  "gmtModified",
                  "creator",
                  "creatorName",
                  "modifier",
                  "modifierName"
                ].includes(item.name)
            )
            ?.map((item) => {
              const { name, type, key, value } = item
              const inputType = exchangeESType(type)
              const { visibleType, tagKeys = [] } = strategyObj[name] || {}
              const disabled = visibleType === ALL && !viewAvAlible
              const textAreaInput = inputType === "string" && key !== "id"
              return key === "sourceTag" ? (
                <Form.Item
                  key={key}
                  name={"sourceTag"}
                  label={"来源标签"}
                  rules={[{ required: false, message: `请选择来源标签!` }]}
                  initialValue={value || "default"}
                >
                  <Select
                    defaultValue={value || "default"}
                    disabled={!viewAvAlible}
                    // sourceTagV2
                    options={sourceTag?.map((item) => ({
                      label: item?.tagDesc,
                      value: item?.code
                    }))}
                  />
                </Form.Item>
              ) : key === "sceneTag" ? (
                <Form.Item
                  key={key}
                  name={"sceneTag"}
                  label={"场景标签"}
                  rules={[{ required: false, message: `请选择场景标签!` }]}
                  initialValue={value}
                >
                  <Select
                    mode="multiple"
                    defaultValue={value}
                    disabled={!viewAvAlible}
                    options={sceneTag?.map((item) => ({
                      label: item?.tagDesc,
                      value: item?.code
                    }))}
                  />
                </Form.Item>
              ) : (
                <Form.Item
                  key={key}
                  name={key}
                  label={
                    <div className={textAreaInput && tagKeys?.length > 0 ? "pt-5" : ""}>
                      <Text strong>{name}</Text>
                      {/* <br />

                    {tagKeys?.map((item) => {
                      const tag = sourceTag.find((tag) => {
                        return tag.code === item
                      })
                      return <Text code>{tag.tagDesc}</Text>
                    })} */}
                    </div>
                  }
                  rules={[{ required: false, message: `请输入${name}!` }]}
                  initialValue={
                    inputType === "boolean" ? (value === "true" || value ? true : false) : value
                  }
                >
                  {inputType === "boolean" ? (
                    <Radio.Group style={{ minHeight: 44 }} disabled={disabled}>
                      <Radio value={true}>true</Radio>
                      <Radio value={false}>false</Radio>
                    </Radio.Group>
                  ) : textAreaInput ? (
                    <Input.TextArea
                      disabled={disabled}
                      autoSize={{ minRows: 1, maxRows: 12 }}
                      style={{ minHeight: "44px", maxHeight: "300px" }}
                    />
                  ) : (
                    <Input
                      style={{ minHeight: 44 }}
                      disabled={key === "id" || disabled}
                      type={inputType}
                    />
                  )}
                </Form.Item>
              )
            })}
        </Form>
      </Modal>
      <Modal title="添加文档" open={isModalVisible} onOk={handleModalOk} onCancel={handleCancel}>
        <Dragger {...uploadProps}>
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
    </Spin>
  )
}

export default DatasetView
