import React, { useEffect, useMemo, useRef, useState } from "react"
import {
  Input,
  Card,
  Button,
  Spin,
  Modal,
  Upload,
  message,
  Pagination,
  Select,
  Space,
  Form,
  Radio,
  notification,
  Table,
  Typography
} from "antd"
import styles from "./DatasetView.module.scss"
import { InboxOutlined, LeftOutlined, CloseOutlined } from "@ant-design/icons"
import {
  useDeleteDatasetRecord,
  useBatchDeleteDatasetRecord,
  useEditDatasetRecord,
  useAddDatasetRecord,
  useFetchStructureDatasetImportData,
  useFetchStructureDatasetRecordList,
  useImportStructureDatasetResult,
  useFetchDesignatedSourceTagList,
  useFetchStructureDatasetDetail
} from "@/api/structureKnowledge"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import queryString from "query-string"
import {
  downloadStructureDatasetTemplate,
  uploadStructureDataset,
  exportStructureDataset
} from "@/api/structureKnowledge/api"
import { debounce, set } from "lodash"
import { usePreviousLocation } from "@/router/PreviousLocationProvider"
import { getTokenAndServiceName } from "@/api/sso"
import classNames from "classnames"
import { exchangeESType } from "@/utils"
import { ALL } from "@/components/CustomSelect"
import useRouter from "@/router/useRouter"
import { useFetchSourceTag } from "@/api/sourceTag"
import { Tag } from "antd"
import { TableFilter } from "@/utils/tableFliter"
import { KNOWLEDGE_SCENE_TAG } from "@/constants"
import { fetchSourceTag } from "@/api/sourceTag/api"
import { useAuthResources } from "@/store"
import { DownOutlined } from "@ant-design/icons"
import BatchOperations from "@/components/BatchOperations"

const Dragger = Upload.Dragger

const { Text } = Typography

const editTitle = {
  add: "新增",
  edit: "编辑"
}

const DatasetView = () => {
  const [searchTerm, setSearchTerm] = useState("")
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

  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [currentData, setCurrentData] = useState([])
  const [selectedRowKeys, setSelectedRowKeys] = useState(null)
  const [editForm] = Form.useForm()
  const [searcForm] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()

  const [selectFilter, setSelectFilter] = useState([])

  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)
  const { botNo: botNoFormQuery } = queryParams
  const { botNo: botNoFromParams } = useParams()
  const botNo = botNoFromParams || botNoFormQuery

  const uploadFileId = useRef(null)
  const { setPrevLocation } = usePreviousLocation()
  const { currentLocationParams } = useRouter()
  const { knowledgeBaseNo, catalogNo, structureNo, searchKey, searchValue } =
    currentLocationParams()

  // const { mutate: fetchSourceTag } = useFetchSourceTag()
  const [sourceTag, setSourceTag] = useState([])
  const [sceneTag, setSCeneTag] = useState([])
  // const [sourceTagV2, setSourceTagV2] = useState([])
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

  useEffect(() => {
    setSelectedRowKeys([])
  }, [catalogNo])

  const sourceTagMap = useMemo(() => {
    const map = new Map()
    sourceTag.forEach((tag) => map.set(tag.code, tag.tagDesc))
    forceUpdate({})
    return map
  }, [sourceTag])

  const { data: designatedSourceTagList = [] } = useFetchDesignatedSourceTagList({
    botNo
  })
  const [searchSourceTagValue, setSearchSourceTagValue] = useState("")

  useEffect(() => {
    setSearchSourceTagValue(designatedSourceTagList[0]?.channel)
  }, [designatedSourceTagList])

  const viewAvAlible =
    designatedSourceTagList !== undefined && designatedSourceTagList?.length === 0

  const {
    data: structureDataset,
    isLoading,
    refetch
  } = useFetchStructureDatasetRecordList({
    knowledgeBaseNo,
    catalogNo,
    structureNo,
    pageSize,
    pageNum: currentPage,
    searchText: searchTerm,
    filterFieldKey: searchFieldKey,
    filterFieldValue: searchFieldValue,
    searchSourceTagValue: searchSourceTagValue,
    refreshFlag,
    searchConditions: selectFilter
  })
  const datasetInfo = structureDataset?.data?.structure || {}
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

  const navigate = useNavigate()

  const searchTextChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    setRefreshFlag(Math.random())
  }

  const fieldKeyChange = (value) => {
    setSearchFieldkey(value)
    setRefreshFlag(Math.random())
  }

  const fieldValueChange = (e) => {
    const value = e.target.value
    setSearchFieldValue(value)
    setRefreshFlag(Math.random())
  }

  const records = structureDataset?.data?.records || []
  const handleModalOk = () => {
    setIsModalVisible(false)

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
            setTimeout(() => {
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
  }

  const onHandleEditClick = (record = [], type = "add") => {
    editForm.resetFields()
    setEditMode(type)
    setCurrentData(record)
    setIsEditModalVisible(true)
  }

  const handleExport = () => {
    const data = {
      knowledgeBaseNo,
      catalogNo,
      structureNo,
      pageSize,
      pageNum: currentPage,
      searchText: searchTerm,
      filterFieldKey: searchFieldKey,
      filterFieldValue: searchFieldValue,
      searchConditions: selectFilter
    }
    setExportLoading(true)
    exportStructureDataset(data)
      .then((res) => {
        const successMsg = "导出完成！"
        // structureDataset?.data?.total > 10000 ? "数据量过大，已导出10000条" : "导出完成！"
        messageApi.destroy()
        messageApi.open({
          type: res ? "success" : "error",
          content: res ? successMsg : "导出失败！",
          duration: 3
        })
      })
      .catch(() => {
        messageApi.destroy()
        messageApi.open({
          type: "error",
          content: "导出失败！",
          duration: 3
        })
      })
      .finally(() => {
        setExportLoading(false)
      })
    messageApi.open({
      type: "info",
      content: "开始导出，可能需要一段时间，请耐心等待~",
      duration: 10
    })
  }

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
    beforeUpload: (file) => {
      uploadFileId.current = null
    },
    onChange(info) {
      console.log(info)
      if (info.file.status === "done") {
        // 文件上传成功后的回调函数
        console.log(`${info.file.name} file uploaded successfully`)
        uploadFileId.current = info.file.response.data
      } else if (info.file.status === "error") {
        uploadFileId.current = null
        // 文件上传失败后的回调函数
        console.log(`${info.file.name} file upload failed.`)
      }
    }
  }

  // 处理下载模板的函数
  const handleDownload = () => {
    setDownloading(true)
    downloadStructureDatasetTemplate({
      knowledgeBaseNo,
      catalogNo,
      structureNo
    }).then((res) => {
      setDownloading(false)
    })
  }

  useEffect(() => {
    getResults()
  }, [])

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
    let newSelectFilter = selectFilter
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

    setSelectFilter(newSelectFilter)

    refetch()
  }

  const columns = useMemo(() => {
    const _columns = [
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
          return key === "sourceTag" ? (
            <>{sourceTag?.length > 0 ? sourceTagMap.get(text) || "全局可见" : <div />}</>
          ) : key === "sceneTag" ? (
            <>
              {text?.split(",")?.map((code) => {
                const tagText = sceneTag?.find((source) => source?.code === code)?.tagDesc
                return <Tag>{tagText}</Tag>
              })}
            </>
          ) : (
            <div className={`min-w-28 ${key === "payload" ? "max-w-5xl" : "max-w-xs"}`}>{text}</div>
          )
        }
      })) || []),
      {
        title: "操作",
        dataIndex: "operate",
        key: "operate",
        width: 120,
        fixed: "right",
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
              <Button
                type="link"
                size="small"
                danger
                onClick={() => {
                  onHandleDeleteClick(record.id)
                }}
              >
                删除
              </Button>
            )}
          </>
        )
      }
    ]

    if (!_columns.find(({ key }) => key === "id")) {
      _columns.unshift({
        title: records?.[0]?.find(({ key }) => key === "id")?.name || "编号",
        dataIndex: "id",
        key: "id",
        width: 200
      })
    }
    return _columns
  }, [datasetInfo.strategies, records, sourceTag, sceneTag])

  const dataSource = useMemo(
    () =>
      records?.map((record) => {
        const res = { subRecord: record }
        record.forEach(({ key, value }) => {
          res[key] = (value ?? "") + ""
        })
        return res
      }),
    [records]
  )

  return (
    <Spin spinning={isLoading}>
      <div className="admin-container">
        <div className={styles.header}>
          <div className="flex items-center justify-between w-full">
            <h2 className="flex items-center">
              <LeftOutlined
                onClick={() => {
                  localStorage.setItem("meauCatalogNo", catalogNo)
                  setPrevLocation(`/viewStructureKnowledgeDetail?catalogNo=${catalogNo}`)
                  // 返回
                  navigate(-1)
                }}
                style={{
                  marginRight: 10,
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#000",
                  cursor: "pointer"
                }}
              />
              数据集: {datasetInfo?.name}
            </h2>
            {viewAvAlible && (
              <div>
                {resourceCodeList.includes("structureRecordInsert") && (
                  <Button onClick={() => onHandleEditClick(datasetInfo.strategies)}>新增</Button>
                )}
                {resourceCodeList.includes("structureRecordUploadDownload") && (
                  <>
                    <Button className="ml-2" type="primary" onClick={handleImport}>
                      导入
                    </Button>
                    <Button
                      className="ml-2"
                      type="primary"
                      loading={exportLoading}
                      onClick={handleExport}
                    >
                      导出
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center mb-4 mt-4">
            <Space>
              <Input
                placeholder="搜索编号"
                style={{
                  width: 300
                }}
                onChange={debounce(searchTextChange, 500)}
                onPressEnter={searchTextChange}
              />
              <BatchOperations
                selectedKeys={selectedRowKeys || []}
                onBatchDelete={onHandleDeleteClick}
                showDelete={true}
                extraItems={[]}
                itemOrder={["delete"]}
              />
            </Space>
          </div>
        </div>
        <Form form={searcForm}>
          <div className={styles.content}>
            <div className={styles["leftPane-wrapper"]}>
              <div className={styles.leftPane}>
                <Table
                  rowKey={"id"}
                  columns={columns}
                  dataSource={dataSource}
                  rowSelection={{
                    fixed: true,
                    selectedRowKeys,
                    onChange: (newSelectedRowKeys) => setSelectedRowKeys(newSelectedRowKeys || [])
                  }}
                  scroll={{ y: "calc(100vh - 310px)", x: "max-content" }}
                  pagination={false}
                />
              </div>
              <Pagination
                // className="pagination-v2"
                showSizeChanger={true}
                current={currentPage}
                pageSize={pageSize}
                total={structureDataset?.data?.total} // 假设后端返回的总记录数字段为totalRecords
                onChange={(page, pageSize) => {
                  setCurrentPage(page)
                  setPageSize(pageSize)
                  // 你可能还需要再次调用refetch或相应的数据获取方法，以重新获取数据
                }}
              />
            </div>

            <Card title="基础信息" className={styles.rightPane} bodyStyle={{ padding: 13 }}>
              <p>
                <b>数据集名称：</b>
                {datasetInfo.name}
              </p>
              <p>
                <b>创建时间：</b>
                {datasetInfo.gmtCreated}
              </p>
              <p>
                <b>更新时间：</b>
                {datasetInfo.gmtModified}
              </p>
              <p>
                <b>来源：</b>
                {datasetInfo.sourceDesc}
              </p>
            </Card>
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
          {currentData?.map((item, index) => {
            const { name, type, key, value } = item
            const inputType = exchangeESType(type)
            const { visibleType, tagKeys = [] } = strategyObj[name] || {}
            const disabled = visibleType === ALL && !viewAvAlible

            const textAreaInput = inputType === "string" && key !== "id"
            return name === "sourceTag" ? (
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
            ) : name === "sceneTag" ? (
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
                initialValue={inputType === "boolean" ? (value == "true" ? true : false) : value}
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
