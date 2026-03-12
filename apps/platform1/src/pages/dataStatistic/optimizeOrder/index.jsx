import { useMemo, useRef, useEffect, useState, useCallback } from "react"
import TableRender from "table-render"
import { getSchema, currentDayStartSecond, currentDayEndSecond } from "./schema"
import {
  exportCallRecords,
  exportOptimizationOrder,
  searchApi,
  getSearchParams,
  updateOptimizationStatus,
  updateOptimizationPriority,
  updateOptimizationOrder,
  updateOptimizationFields
} from "./request"
import { useFetchAuthPermissionGroupList } from "@/api/permission"
import {
  useFetchLlmModelType,
  useFetchChannelType,
  useFetchOptimizationPriority,
  useFetchOptimizationStatus
} from "@/api/common"
import dayjs from "dayjs"
import { fetchCallLogsColumns, updateFeedbackColumns } from "@/api/userFeedback/api"
import { useFetchSourceTagList } from "@/api/sourceTag"
import { PAGE_CODE } from "@/constants/pageCode"
import { cloneDeep, initial } from "lodash"
import {
  Tag,
  message,
  Space,
  Button,
  Input,
  Select,
  Typography,
  Image,
  Tooltip,
  Form,
  Badge,
  Spin
} from "antd"

import RangeTimePicker from "@/components/RangeTime"
import { useLocation } from "react-router-dom"
import Highlighter from "react-highlight-words"
import queryString from "query-string"
import ExecuteProcessDrawer from "./ExecuteProcessDrawer"
import TagModal from "./tagModal"
import { TableFilter } from "@/utils/tableFliter"
import { OptimizeSettingModal } from "./OptimizeSettingModal"
import "./index.less"
import LogDetailDrawer from "../callLogs/LogDetailDrawer"
import { useGetOptimizationOption, useGetOptimizationSource } from "@/api/optimize"
import { useCallLogsColumns } from "@/hooks/useCallLogsColumns"

const PriorityCell = ({ priority, priorityList, onPriorityChange, status }) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  const isDisabled = ["REJECT_PROCESS", "HAS_PROCESSED", "REJECT_EXAMINE"].includes(status?.code)

  const options = useMemo(() => {
    return Array.isArray(priorityList)
      ? priorityList.map(({ code, name }) => ({
          value: code,
          label: name
        }))
      : []
  }, [priorityList])

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => !isDisabled && setIsHovered(true)}
      onMouseLeave={() => {
        if (!isOpen) {
          setIsHovered(false)
        }
      }}
      style={{ cursor: isDisabled ? "not-allowed" : "pointer" }}
    >
      {isHovered && !isDisabled ? (
        <div>
          <Select
            value={priority?.code}
            style={{ width: 84 }}
            onChange={(value) => {
              onPriorityChange(value)
              setIsHovered(false)
              setIsOpen(false)
            }}
            options={options}
            onDropdownVisibleChange={(visible) => setIsOpen(visible)}
            dropdownStyle={{
              minWidth: "120px",
              zIndex: 1050,
              marginTop: 0
            }}
            popupMatchSelectWidth={false}
            placement="bottomLeft"
            getPopupContainer={() => document.body}
            popupClassName="priority-select-dropdown"
            dropdownAlign={{
              offset: [0, 4]
            }}
          />
        </div>
      ) : (
        <span style={{ opacity: isDisabled ? 0.5 : 1 }}>{priority?.name || "--"}</span>
      )}
    </div>
  )
}

const StatusCell = ({ status, statusList, statusColorMap, onStatusChange }) => {
  const containerRef = useRef(null)
  const defaultStatus = {
    code: "TO_BE_EXAMINE",
    name: "待审核"
  }
  const currentStatus = status?.code ? status : defaultStatus

  // Map status codes to Badge status types
  const statusTypeMap = {
    TO_BE_EXAMINE: "warning", // 待审核 - orange
    REJECT_EXAMINE: "error", // 未通过 - red
    TO_BE_PROCESS: "warning", // 待接受 - 改为 warning (橙色)
    PROCESSING: "processing", // 优化中 - blue
    HAS_PROCESSED: "success", // 已优化 - green
    REJECT_PROCESS: "default" // 已搁置 - default
  }

  // 检查状态是否应该禁用
  const isDisabled = ["REJECT_PROCESS", "HAS_PROCESSED", "REJECT_EXAMINE"].includes(
    currentStatus.code
  )

  // 根据当前状可选的状态选项
  const getAvailableOptions = (currentStatus) => {
    const code = currentStatus?.code

    switch (code) {
      case "TO_BE_EXAMINE": // 待审核
        return statusList.filter((item) => ["REJECT_EXAMINE", "TO_BE_PROCESS"].includes(item.code))
      case "REJECT_EXAMINE": // 不通过
        return statusList.filter((item) => ["TO_BE_PROCESS"].includes(item.code))
      case "TO_BE_PROCESS": // 待受理
      case "PROCESSING": // 优化中
      case "HAS_PROCESSED": // 已优化
      case "REJECT_PROCESS": // 搁置
        return statusList.filter((item) =>
          ["TO_BE_PROCESS", "PROCESSING", "HAS_PROCESSED", "REJECT_PROCESS"].includes(item.code)
        )
      default:
        return []
    }
  }

  const availableOptions = getAvailableOptions(currentStatus).map(({ code, name }) => ({
    value: code,
    label: name
  }))

  return (
    <div ref={containerRef} style={{ cursor: isDisabled ? "not-allowed" : "pointer" }}>
      <Select
        value={currentStatus.code}
        style={{ width: 120, opacity: isDisabled ? 0.5 : 1 }}
        onChange={onStatusChange}
        disabled={isDisabled}
        labelRender={() => (
          <Tag color={statusColorMap[currentStatus.code]}>
            <Badge status={statusTypeMap[currentStatus.code]} style={{ marginRight: 5 }} />
            {currentStatus.name}
          </Tag>
        )}
        options={availableOptions}
        popupMatchSelectWidth={false}
      />
    </div>
  )
}

export default () => {
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)
  const { botNo, iframeStyle, studioenv } = queryParams

  // @ts-ignore
  const tableRef = useRef()
  const [columnsSettingValue, setColumnsSettingValue] = useState([]) // 列设置
  const [columns, setColumns] = useState([]) // 列

  const [realTotal, setRealTotal] = useState(0)
  const [visible, setVisible] = useState(false)
  const [formData, setFormData] = useState({})

  const [executeProcessVisible, setExecuteProcessVisible] = useState(false)
  const [executeProcessParams, setExecuteProcessParams] = useState({})

  const [tagModalData, setTagModalData] = useState({
    visible: false,
    mode: "manage",
    record: null
  })

  const [optimizeData, setOptimizeData] = useState({
    visible: false,
    record: null
  })

  const searchInput = useRef(null)
  const [searchParams, setSearchParams] = useState({})
  const [form] = Form.useForm()

  const [messageApi, contextHolder] = message.useMessage()

  const { data: groupList = [] } = useFetchAuthPermissionGroupList()
  const { data: modelList = [] } = useFetchLlmModelType()
  const { data: channelList = [] } = useFetchChannelType(botNo)

  const refreshTableData = () => {
    if (tableRef.current) {
      // @ts-ignore
      tableRef.current.refresh({ stay: true }) // 停留在原也买
    }
  }

  const [logDetailVisible, setLogDetailVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [activeTab, setActiveTab] = useState("optimize")

  const handleView = (record) => {
    record._type = "view"
    record._orderNo = record.orderNo
    setCurrentRecord(record)
    if (record.orderNo) {
      setActiveTab("optimize")
    }
    setLogDetailVisible(true)
  }

  const openExecuteProcess = (record) => {
    setExecuteProcessParams(record)
    setExecuteProcessVisible(true)
  }

  // 错误类型
  const { data: { data: errorTypes = [] } = {}, isLoading: errorTypesLoading } =
    useFetchSourceTagList({
      botNo,
      tagType: "optimizationReason"
    })

  const actionRow = {
    title: "操作",
    key: "action",
    dataIndex: "action",
    hidden: false,
    fixed: "right",
    width: 130,
    render: (_, record) => (
      <Space>
        <a onClick={() => handleView(record)}>查看</a>
        <a onClick={() => setTagModalData({ visible: true, record, mode: "setting" })}>测试集</a>
      </Space>
    )
  }

  const onColumnsSettingChange = (setting) => {
    // 先移除操作列
    const removeActionList = initial(setting)

    // 构建要保存的字段配置
    const fields = removeActionList
      .map((item) => {
        // 使用 fieldKey 来匹配列
        const matchedColumn = columns.find((col) => col.fieldKey === item.key)
        if (!matchedColumn) return null
        return {
          ...matchedColumn,
          hidden: item.hidden || false,
          fixed: item.fixed || false
        }
      })
      .filter(Boolean)

    // 更新列设置状态
    setColumnsSettingValue([...setting])

    // 保存到后端
    updateFeedbackColumns({
      fields,
      pageCode: PAGE_CODE.OPTIMIZATION_ORDER
    }).then(getSelectColumns)
  }

  const { data: priorityList = [], isLoading: priorityLoading } = useFetchOptimizationPriority()

  const { data: statusList = [], isLoading: statusLoading } = useFetchOptimizationStatus()

  const statusColorMap = {
    TO_BE_EXAMINE: "orange", // 待审核
    REJECT_EXAMINE: "red", // 未通过
    TO_BE_PROCESS: "volcano", // 待受理
    PROCESSING: "blue", // 优化中
    HAS_PROCESSED: "green", // 已优化
    REJECT_PROCESS: "default" // 已搁置
  }

  const handlePriorityChange = useCallback(
    async (value, record) => {
      try {
        const res = await updateOptimizationFields({
          orderNo: record.orderNo,
          priority: value,
          botNo
        })
        // @ts-ignore
        if (res.code === "200") {
          messageApi.success("优先级更新成功")
          refreshTableData()
        } else {
          // @ts-ignore
          messageApi.error(res.message || "优先级更新失败")
        }
      } catch (error) {
        messageApi.error("优先级更新失败")
      }
    },
    [priorityList, botNo]
  )

  const { data: optimizationOptions = [] } = useGetOptimizationOption()

  const { data: sourceOptions = [] } = useGetOptimizationSource()

  const { data: { data: bizSourceList = [] } = {} } = useFetchSourceTagList({
    botNo,
    tagType: "optimizationBizSource"
  })

  const getRecordRequestTime = (record) => {
    try {
      if (record?.resourceLinks?.length > 0) {
        const extraInfo = record.resourceLinks[0].extraInfo
        if (extraInfo) {
          const parsedExtraInfo = JSON.parse(extraInfo)
          return parsedExtraInfo.requestTime
        }
      }
      return ""
    } catch (error) {
      return ""
    }
  }

  const formatColumns = (columns) => {
    const _columns = cloneDeep(columns)
    const columnsWithKeys = _columns
      .map((col) => {
        if (!col) return null

        // 基础列配置，确保使用 fieldNo 作为唯一标识
        const baseColumn = {
          key: col.fieldKey, // 列的唯一标识
          dataIndex: col.fieldKey,
          title: col.fieldName || col.title,
          width: col.width || 200,
          // fixed: col.fixed || false,
          hidden: col.hidden || false,
          sorter: col.supportSort || false,
          align: "left",
          search: false,
          filters: false,
          ...(col.inputType === "select" && col.enums
            ? {
                enums: col.enums
              }
            : {})
        }

        // 处理特殊列的配置和渲染
        switch (baseColumn.dataIndex) {
          case "orderNo":
            return {
              ...baseColumn,
              width: 200,
              ...TableFilter({
                form,
                searchParams,
                searchInput,
                refresh: refreshTableData,
                dataIndex: "orderNo",
                fieldType: "input"
              })
            }
          case "source":
            return {
              ...baseColumn,
              width: 200,
              render: (text) => {
                return <>{text?.name || "--"}</>
              },
              ...TableFilter({
                form,
                searchParams,
                searchInput,
                refresh: refreshTableData,
                dataIndex: "source",
                fieldType: "select",
                multipleSelect: true,
                enums:
                  sourceOptions?.map(({ code, name }) => ({
                    value: code,
                    desc: name
                  })) || []
              })
            }
          case "reasons":
            return {
              ...baseColumn,
              width: 300,
              fixed: false,
              render: (reasons) => {
                if (!Array.isArray(reasons)) return "--"
                return (
                  <Space wrap size="small">
                    {reasons.map((item, index) => (
                      <Tag key={index} color="purple" style={{ margin: "2px" }}>
                        {item.name || "--"}
                      </Tag>
                    ))}
                  </Space>
                )
              },
              ...TableFilter({
                form,
                searchParams,
                searchInput,
                refresh: refreshTableData,
                dataIndex: "reasons",
                fieldType: "treeSelect",
                multipleSelect: true,
                enums:
                  errorTypes?.length > 0
                    ? errorTypes.map(({ code, tagDesc, children }) => ({
                        value: code,
                        desc: tagDesc,
                        children:
                          children?.map(({ code, tagDesc }) => ({
                            value: code,
                            desc: tagDesc
                          })) || []
                      }))
                    : []
              })
            }
          case "options":
            return {
              ...baseColumn,
              width: 300,
              render: (options) => {
                if (!Array.isArray(options)) return "--"
                return (
                  <Space wrap size="small">
                    {options.map((item, index) => (
                      <Tag key={index} color="cyan" style={{ margin: "2px" }}>
                        {item.name || "--"}
                      </Tag>
                    ))}
                  </Space>
                )
              },
              ...TableFilter({
                form,
                searchParams,
                searchInput,
                refresh: refreshTableData,
                dataIndex: "options",
                fieldType: "select",
                multipleSelect: true,
                enums:
                  optimizationOptions?.map(({ code, name }) => ({
                    value: code,
                    desc: name
                  })) || []
              })
            }
          case "creatorDisplayName":
            return {
              ...baseColumn,
              width: 160,
              render: (text) => text || "--",
              ...TableFilter({
                form,
                searchParams,
                searchInput,
                refresh: refreshTableData,
                dataIndex: "creator",
                fieldType: "input"
              })
            }
          case "processor":
            return {
              ...baseColumn,
              width: 160,
              render: (processor, row) => {
                if (!Array.isArray(row?.processors)) return "--"
                return row?.processors?.map((item) => item.name || "--").join("、")
              },
              ...TableFilter({
                form,
                searchParams,
                searchInput,
                refresh: refreshTableData,
                dataIndex: "processor",
                fieldType: "input"
              })
            }
          case "gmtCreated":
            return {
              ...baseColumn,
              width: 200,
              sorter: true
            }
          case "examineCost":
            return {
              ...baseColumn,
              width: 160,
              render: (text, row) => row?.examineCostDisplay || "--",
              sorter: true
            }
          case "completionDate":
            return {
              ...baseColumn,
              width: 200,
              render: (text, row) => row?.completionDate || "--",
              sorter: true
            }
          case "optimizationCost":
            return {
              ...baseColumn,
              width: 160,
              render: (text, row) => row?.optimizationCostDisplay || "--",
              sorter: true
            }
          case "requestTime":
            return {
              ...baseColumn,
              width: 200,
              fixed: false,
              render: (text, row) => getRecordRequestTime(row),
              sorter: true
            }

          case "bizSources":
            return {
              ...baseColumn,
              width: 200,
              render: (bizSources) => {
                if (!Array.isArray(bizSources)) return "--"
                return (
                  <Space wrap size="small">
                    {bizSources.map((item, index) => (
                      <Tag key={index} style={{ margin: "2px" }}>
                        {item.name || "--"}
                      </Tag>
                    ))}
                  </Space>
                )
              },
              ...TableFilter({
                form,
                searchParams,
                searchInput,
                refresh: refreshTableData,
                dataIndex: "bizSources",
                fieldType: "select",
                multipleSelect: true,
                enums:
                  bizSourceList?.map(({ code, tagDesc }) => ({
                    value: code,
                    desc: tagDesc
                  })) || []
              })
            }
          case "remark":
            return {
              ...baseColumn,
              width: 200,
              render: (text, record) => {
                const hasImages = record.remarkUrls && record.remarkUrls.length > 0
                return (
                  <Space>
                    {text || "--"}
                    {hasImages && <Tag>[图片]</Tag>}
                  </Space>
                )
              },
              ...TableFilter({
                form,
                searchParams,
                searchInput,
                refresh: refreshTableData,
                dataIndex: "remark",
                fieldType: "input"
              })
            }
          case "priority":
            return {
              ...baseColumn,
              fixed: "right",
              width: 140,
              render: (priority, record) => (
                <PriorityCell
                  priority={priority}
                  priorityList={priorityList}
                  onPriorityChange={(value) => handlePriorityChange(value, record)}
                  status={record.status}
                />
              ),
              ...TableFilter({
                form,
                searchParams,
                searchInput,
                refresh: refreshTableData,
                dataIndex: "priority",
                fieldType: "select",
                enums:
                  priorityList?.map(({ code, name }) => ({
                    value: code,
                    desc: name
                  })) || [],
                multipleSelect: true
              })
            }
          case "status":
            return {
              ...baseColumn,
              fixed: "right",
              width: 180,
              render: (status, record) => (
                <StatusCell
                  status={status}
                  statusList={statusList}
                  statusColorMap={statusColorMap}
                  onStatusChange={(value) => {
                    updateOptimizationFields({
                      orderNo: record.orderNo,
                      status: value,
                      botNo
                    })
                      .then((res) => {
                        // @ts-ignore
                        if (res.code === "200") {
                          messageApi.success("状态更新成功")
                          refreshTableData()
                        } else {
                          // @ts-ignore
                          messageApi.error(res.message || "当前状态更新失败！")
                        }
                      })
                      .catch(() => {
                        messageApi.error("当前状态更新失败！")
                      })
                  }}
                />
              ),
              ...TableFilter({
                form,
                searchParams,
                searchInput,
                refresh: refreshTableData,
                dataIndex: "status",
                fieldType: "select",
                enums:
                  statusList?.map(({ code, name }) => ({
                    value: code,
                    desc: name
                  })) || [],
                multipleSelect: true
              })
            }
          default:
            // 对于其他列，如果是 select 类型，添加 TableFilter
            if (col.inputType === "select") {
              return {
                ...baseColumn,
                ...TableFilter({
                  form,
                  searchParams,
                  searchInput,
                  refresh: refreshTableData,
                  dataIndex: col.fieldKey,
                  fieldType: "select",
                  enums: col.enums
                })
              }
            }
            // 对于 input 类型，添加 TableFilter
            if (col.inputType === "input") {
              return {
                ...baseColumn,
                ...TableFilter({
                  form,
                  searchParams,
                  searchInput,
                  refresh: refreshTableData,
                  dataIndex: col.fieldKey,
                  fieldType: "input"
                })
              }
            }
            return {
              ...baseColumn,
              render: (text) => text || "--"
            }
        }
      })
      .filter(Boolean) // 过滤掉空值

    // 修改 action 列的配置
    columnsWithKeys.push({
      ...actionRow,
      key: "action", // 使用简单的 key
      align: "left",
      search: false,
      filters: false
    })

    setColumnsSettingValue(columnsWithKeys)
    return columnsWithKeys
  }

  const getSelectColumns = async () => {
    const res = await fetchCallLogsColumns(PAGE_CODE.OPTIMIZATION_ORDER)
    setColumns(res)
  }

  useEffect(() => {
    getSelectColumns()
  }, [])

  // 从数据飞轮跳转过来时，设置特殊初始查询条件
  useEffect(() => {
    const optimizationId = sessionStorage.getItem("optimizationId")
    if (optimizationId && tableRef.current) {
      const timer = setTimeout(() => {
        if (tableRef.current && tableRef.current.form) {
          tableRef.current.form.setValues({
            orderNo: optimizationId,
            startTime: dayjs().subtract(29, "day").startOf("day"),
            endTime: dayjs().endOf("day")
          })
          tableRef.current.refresh({ stay: true })
          sessionStorage.removeItem("optimizationId")
        }
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [])

  const tableColumns = useMemo(() => {
    if (!columns?.length) return []
    return formatColumns(columns)
  }, [
    columns,
    searchParams,
    JSON.stringify(priorityList),
    JSON.stringify(statusList),
    JSON.stringify(optimizationOptions),
    JSON.stringify(sourceOptions),
    JSON.stringify(errorTypes),
    JSON.stringify(bizSourceList),
    botNo
  ])

  const onExportCallRecords = () => {
    // @ts-ignore
    if (tableRef?.current?.form) {
      // @ts-ignore
      const formValues = tableRef.current.form.getValues()
      const formData = {
        ...formValues,
        ...getSearchParams(searchParams),
        botNo,
        startTime: dayjs(formValues.startTime).format("YYYY-MM-DD HH:mm:ss"),
        endTime: dayjs(formValues.endTime).format("YYYY-MM-DD HH:mm:ss")
      }
      exportOptimizationOrder(formData, studioenv)
        .then((res) => {
          if (res === true) {
            messageApi.destroy()
            messageApi.open({
              type: "success",
              content: "下载完成!",
              duration: 3
            })
          }
        })
        .catch(() => {
          messageApi.destroy()
          messageApi.open({
            type: "success",
            content: "下载失败!",
            duration: 3
          })
        })
      messageApi.open({
        type: "info",
        content: "开始下载，可能需要一段时间，请耐心等待~",
        duration: 10
      })
    }
  }

  const request = async (params, sorter) => {
    const searchParam = form.getFieldsValue()
    setSearchParams(searchParam)

    // 构建排序参数
    const sort = []

    // 字段名映射
    const fieldMapping = {
      gmtCreated: "gmtCreated",
      examineCostDisplay: "examineCost",
      completionDate: "completionDate",
      optimizationCostDisplay: "optimizationCost"
    }

    // 处理多重排序
    if (Array.isArray(sorter)) {
      // 如果是数组，说明是多字段排序
      sorter.forEach((item) => {
        if (item.field && item.order) {
          sort.push({
            field: fieldMapping[item.field] || item.field,
            asc: item.order === "ascend"
          })
        }
      })
    } else if (sorter?.field && sorter?.order) {
      // 单字段排序
      sort.push({
        field: fieldMapping[sorter.field] || sorter.field,
        asc: sorter.order === "ascend"
      })
    }

    const requestParams = {
      ...searchParam,
      ...params,
      sort,
      botNo
    }
    const res = await searchApi(requestParams)
    setRealTotal(res?.total)
    return res
  }

  // if (priorityLoading || statusLoading || errorTypesLoading) {
  //   return <Spin />
  // }

  const { columns: callLogsColumns } = useCallLogsColumns()

  return (
    <>
      <div className="overflow-auto h-full table-xrender-container bg-white">
        <div className="table-xrender-container-insert">
          <Form form={form}>
            <TableRender
              className="call-logs-table call-logs-render-v2"
              ref={tableRef}
              rowKey={Math.random}
              search={{
                schema: getSchema(groupList, {
                  botNo,
                  iframeStyle
                }),
                widgets: { RangeTimePicker },
                props: { botNo },
                mode: "simple",
                retainBtn: [] // ['rest', 'submit']
              }}
              scroll={{ x: 900, y: "77vh" }}
              pagination={{
                showSizeChanger: true,
                size: "default",
                showTotal: () => `共${realTotal || 0}条`
              }}
              request={request}
              columns={tableColumns}
              toolbarAction={{
                enabled: ["refresh", "columnsSetting", "density"],
                // @ts-ignore
                columnsSettingValue: columnsSettingValue?.filter(Boolean) || [],
                onColumnsSettingChange
              }}
              toolbarRender={
                <>
                  <Button onClick={onExportCallRecords}>导出</Button>
                  {/* <Button
                    key="manageLabel"
                    type="primary"
                    onClick={() =>
                      OptimizeSettingModal({
                        detail: {
                          botNo: botNo
                        },
                        onOk: () => {
                          refreshTableData()
                        },
                        onCancel: () => {}
                      })
                    }
                  >
                    优化单设置
                  </Button> */}
                </>
              }
              sortMultiple={true}
            />
          </Form>
        </div>

        <ExecuteProcessDrawer
          visible={executeProcessVisible}
          setVisible={setExecuteProcessVisible}
          executeProcessParams={executeProcessParams}
        />
        <TagModal
          {...tagModalData}
          botNo={botNo}
          refreshTableData={refreshTableData}
          setVisible={(bool) => setTagModalData((preState) => ({ ...preState, visible: bool }))}
        />

        {contextHolder}
      </div>

      <LogDetailDrawer
        visible={logDetailVisible}
        setVisible={setLogDetailVisible}
        record={currentRecord}
        tableColumns={callLogsColumns}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        refreshTableData={refreshTableData}
        from="optimizeOrder"
      />
    </>
  )
}
