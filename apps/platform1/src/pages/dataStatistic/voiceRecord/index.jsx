import { useMemo, useRef, useState, useCallback, useEffect } from "react"
import TableRender from "table-render"
import { getSchema } from "./schema"
import { searchApi, exportAudioRecords, fetchEnumStatus } from "./request"
import { cloneDeep, pad } from "lodash"
import { Button, Form, message, Tag } from "antd"
import { useFetchAgentList } from "@/api/agent"
import RangeTimePicker from "@/components/RangeTime"
import { useLocation } from "react-router-dom"
import queryString from "query-string"
import { TableFilter } from "@/utils/tableFliter"
import ConsultRecordDrawer from "../voiceRecordDetail/Drawer"
import dayjs from "dayjs"
import "./index.less"

const maskPhoneNumber = (phoneNumber, start = 3, length = 4, mask = "*") => {
  if (typeof phoneNumber !== "string") return phoneNumber || "-"
  const maskString = pad("", length, mask)
  return phoneNumber.slice(0, start) + maskString + phoneNumber.slice(start + length)
}

const formatDuration = (totalSeconds) => {
  const days = Math.floor(totalSeconds / (3600 * 24))
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (seconds > 0) parts.push(`${seconds}s`)

  return parts.join("") || "0s"
}

const toEnumOptions = (items = [], valueKey = "code") => {
  if (!Array.isArray(items)) return []
  return items.map((item) => ({
    value: item?.[valueKey],
    desc: item?.name,
    code: item?.code,
    name: item?.name
  }))
}

const getEnumLabel = (value, enums = []) => {
  if (!enums.length) return value
  const valueKey = value?.toString()
  const match = enums.find(
    (item) =>
      item?.value?.toString() === valueKey ||
      item?.code?.toString() === valueKey ||
      item?.desc?.toString() === valueKey
  )
  return match?.desc ?? value
}

const renderEnumTags = (value, enums = []) => {
  if (value === undefined || value === null || value === "") return "--"
  const values = Array.isArray(value) ? value : [value]
  if (!values.length) return "--"
  return values.map((item) => (
    <Tag className="m-1" key={`${item}`}>
      {getEnumLabel(item, enums) || "-"}
    </Tag>
  ))
}

const VoiceRecord = () => {
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)
  // console.log("queryParams:", queryParams)
  const { botNo, robotCode, startTime, endTime, stageList } = queryParams
  const [form] = Form.useForm()
  const [columnsSettingValue, setColumnsSettingValue] = useState([]) // 列设置
  const [realTotal, setRealTotal] = useState(0)
  const [searchParams, setSearchParams] = useState({})
  const [drawerData, setDrawerData] = useState({})
  const [stageEnums, setStageEnums] = useState([]) // 挂机业务阶段枚举
  const [connectStatusEnums, setConnectStatusEnums] = useState([]) // 拨打用户状态枚举
  const [endTypeEnums, setEndTypeEnums] = useState([]) // 挂机类型枚举
  const [messageApi, contextHolder] = message.useMessage()
  const searchInput = useRef(null)
  const tableRef = useRef(null)
  const latestSorterRef = useRef(null)
  const latestPaginationRef = useRef({ pageNum: 1, pageSize: 10 })
  const latestParamsRef = useRef({})
  const lastRequestParamsRef = useRef({})

  const { data: agentList = [] } = useFetchAgentList({
    botNo,
    agentMode: 2
  })

  const initializeFormValues = async () => {
    const defaultValues = {}
    const defaultSearchParams = {}

    // 设置 robotCode
    if (robotCode) {
      defaultValues.agentName = robotCode
      defaultSearchParams.agentName = robotCode
    }

    // 设置时间范围 - 将字符串时间转换为 dayjs 对象，使用本地时区
    if (startTime && endTime) {
      // console.log("dadadadadadad", dayjs(endTime).endOf("day"), defaultSearchParams)
      defaultValues.startTime = dayjs(startTime).startOf("day")
      defaultValues.endTime = dayjs(endTime).endOf("day")
      defaultSearchParams.startTime = startTime
      defaultSearchParams.endTime = endTime
    }

    // 设置挂机业务阶段 - 修复 stageList 处理逻辑
    if (stageList) {
      let stages = []
      if (Array.isArray(stageList)) {
        stages = stageList
      } else if (typeof stageList === "string") {
        // 处理 "xxx,xxxx" 格式或单独的 "xxx" 格式
        stages = stageList
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item)
      } else {
        stages = [stageList]
      }

      defaultValues.onHookStage = stages
      defaultSearchParams.onHookStage = stages
    }

    // 直接设置表单值
    form.setFieldsValue(defaultValues)
    setSearchParams(defaultSearchParams)

    // 检查表单值是否设置成功
    setTimeout(() => {
      const currentValues = form.getFieldsValue()

      if (Object.keys(currentValues).length === 0 && Object.keys(defaultValues).length > 0) {
        console.log("表单值设置失败，但不再重试")
      }
    }, 100)
  }

  // 从URL查询参数设置默认值
  useEffect(() => {
    // 确保在组件挂载时初始化表单值
    initializeFormValues()
  }, [robotCode, startTime, endTime, stageList, form])

  useEffect(() => {
    const loadEnums = async () => {
      try {
        const params = botNo ? { botNo } : {}
        const { connectStatus, endType } = await fetchEnumStatus(params)
        setConnectStatusEnums(toEnumOptions(connectStatus))
        setEndTypeEnums(toEnumOptions(endType))
      } catch (error) {
        console.error("获取状态枚举失败:", error)
      }
    }

    loadEnums()
  }, [botNo])

  const refreshTableData = () => {
    tableRef.current?.refresh?.({ stay: false }) // 重置到第一页
  }

  const onExportAudioRecords = async () => {
    try {
      // schema 搜索区参数：来自 TableRender 的内部表单（已在 latestParamsRef.current 缓存）
      const schemaParams = latestParamsRef.current || {}
      // 表头筛选参数：来自外层 antd Form（TableFilter 绑定的就是该 form）
      const headerValues = form.getFieldsValue(true)
      const { waitDuration, totalDuration, agentName, onHookStage, ...otherParams } = headerValues

      // 处理 onHookStage 参数
      let stages = undefined
      if (onHookStage === undefined || onHookStage === null) {
        stages = undefined
      } else if (Array.isArray(onHookStage) && onHookStage.length === 0) {
        stages = undefined
      } else if (onHookStage.length > 0) {
        stages = onHookStage
      }

      const finalAgentName = agentName !== undefined && agentName !== "" ? agentName : undefined

      // 与列表查询入参保持一致：以最新 params 为基准，再叠加表单筛选/派生参数
      const paramsForExport = latestParamsRef.current || {}
      const pageNum = paramsForExport?.pageNum ?? paramsForExport?.current
      const pageSize = paramsForExport?.pageSize
      const stay = paramsForExport?.stay
      const startTimeStr = paramsForExport?.startTime
        ? dayjs(paramsForExport.startTime).format("YYYY-MM-DD HH:mm:ss")
        : undefined
      const endTimeStr = paramsForExport?.endTime
        ? dayjs(paramsForExport.endTime).format("YYYY-MM-DD HH:mm:ss")
        : undefined

      const formData = {
        pageNum,
        startTime: startTimeStr,
        endTime: endTimeStr,
        stay,
        pageSize,
        ...otherParams,
        agentNo: finalAgentName,
        robotCode: botNo,
        onHookStage: stages,
        waitDurationMin: waitDuration?.min,
        waitDurationMax: waitDuration?.max,
        totalDurationMin: totalDuration?.min,
        totalDurationMax: totalDuration?.max,
        orderColumn: latestSorterRef.current?.field,
        orderType: latestSorterRef.current?.field
          ? latestSorterRef.current?.order === "ascend"
            ? "asc"
            : "desc"
          : undefined
      }

      const key = "voiceRecord-exporting"
      messageApi.open({
        type: "loading",
        content: "开始下载，可能需要一段时间，请耐心等待~",
        key,
        duration: 0
      })

      const ok = await exportAudioRecords(formData)

      messageApi.destroy(key)
      if (ok) {
        messageApi.open({ type: "success", content: "下载完成!", duration: 3 })
      } else {
        messageApi.open({ type: "error", content: "下载失败!", duration: 3 })
      }
    } catch (error) {
      const key = "voiceRecord-exporting"
      console.error("导出失败:", error)
      messageApi.destroy(key)
      messageApi.open({ type: "error", content: "导出失败，请重试", duration: 3 })
    }
  }

  const actionRow = useMemo(
    () => ({
      title: "操作",
      key: "action",
      dataIndex: "action",
      hidden: false,
      fixed: "right",
      width: 130,
      render: (_, record) => (
        <Button type="link" onClick={() => setDrawerData({ open: true, id: record.webcallId })}>
          查看
        </Button>
      )
    }),
    []
  )

  const formatColumns = useCallback(
    (columns) => {
      const _columns = cloneDeep(columns)
      const columnsWithKeys = _columns.map((col) => {
        const baseColumn = {
          key: col.fieldKey, // 列的唯一标识
          dataIndex: col.fieldKey,
          title: col.fieldName || col.title,
          width: col.width || 200,
          sorter: col.supportSort || false,
          align: "left",
          search: false,
          filters: false,
          render: col.render,
          ...(col.inputType === "select" && col.enums
            ? {
                enums: col.enums
              }
            : {})
        }
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
        if (col.inputType === "select" || col.inputType === "selectWithCustomInput") {
          const isOnHookStage = col.fieldKey === "onHookStage"
          const isMultipleSelect = isOnHookStage || col.multipleSelect
          const filterKey = col.filterKey || col.fieldKey

          // 为所有 select 字段创建自定义的 TableFilter 实现，确保正确显示默认值
          // 对于 onHookStage 字段，使用 selectWithCustomInput 类型，允许用户自定义输入
          const fieldType = isOnHookStage
            ? "selectWithCustomInput"
            : col.inputType === "selectWithCustomInput"
              ? "selectWithCustomInput"
              : "select"

          return {
            ...baseColumn,
            ...TableFilter({
              form,
              searchParams: () => {
                const val = form.getFieldValue(filterKey)
                return {
                  [filterKey]: val
                }
              }, // 搜索条件,
              searchInput,
              refresh: refreshTableData,
              dataIndex: filterKey,
              fieldType: fieldType,
              enums: isOnHookStage ? [] : col.enums,
              multipleSelect: isMultipleSelect
            })
          }
        }

        if (col.inputType === "inputNumberGroup") {
          return {
            ...baseColumn,
            ...TableFilter({
              form,
              searchParams,
              searchInput,
              refresh: refreshTableData,
              dataIndex: col.fieldKey,
              fieldType: "inputNumberGroup"
            })
          }
        }
        return {
          ...baseColumn,
          render: col.render || ((text) => text || "--")
        }
      })
      columnsWithKeys.push({
        ...actionRow,
        key: "action", // 使用简单的 key
        align: "left",
        search: false,
        filters: false
      })
      setColumnsSettingValue(columnsWithKeys)
      return columnsWithKeys
    },
    [actionRow, form, searchParams]
  )

  const onColumnsSettingChange = (setting) => {
    // 更新列设置状态
    setColumnsSettingValue([...setting])
  }

  const tableColumns = useMemo(() => {
    const columns = [
      {
        fieldKey: "callId",
        fieldName: "通话ID",
        inputType: "input"
      },
      {
        fieldKey: "agentName",
        fieldName: "Agent名称",
        inputType: "select",
        enums: agentList?.map(({ agentName, agentNo }) => ({ value: agentNo, desc: agentName }))
      },
      {
        fieldKey: "startTime",
        fieldName: "拨打时间",
        supportSort: true
      },
      {
        fieldKey: "endTime",
        fieldName: "挂机时间",
        supportSort: true
      },
      {
        fieldKey: "connectStatus",
        fieldName: "拨打状态",
        inputType: "select",
        enums: connectStatusEnums,
        render: (text) => renderEnumTags(text, connectStatusEnums)
      },

      {
        fieldKey: "onHookStage",
        fieldName: "挂机业务阶段",
        inputType: "selectWithCustomInput",
        render: (text) => text || "--",
        enums: stageEnums
      },

      {
        fieldKey: "hungUpRole",
        fieldName: "挂机类型",
        inputType: "select",
        enums: endTypeEnums,
        render: (text) => renderEnumTags(text, endTypeEnums)
      },
      {
        fieldKey: "intentTag",
        fieldName: "通话标签",
        render: (text) =>
          text?.split("，")?.map((tag) => <Tag className="m-1">{tag || "-"}</Tag>) || "--",
        inputType: "input"
      },

      {
        fieldKey: "tag",
        fieldName: "用户ID",
        inputType: "input"
      },
      {
        fieldKey: "number",
        fieldName: "客户手机号",
        inputType: "input"
        // render: (text) => maskPhoneNumber(text)
      },
      {
        fieldKey: "waitDuration",
        fieldName: "响铃时长",
        inputType: "inputNumberGroup",
        render: (text) => formatDuration(text)
      },
      {
        fieldKey: "totalDuration",
        fieldName: "通话时长",
        inputType: "inputNumberGroup",
        render: (text) => formatDuration(text)
      }
    ].map((item, index) => ({
      ...item,
      orderNo: index + 1
    }))
    return formatColumns(columns)
  }, [
    formatColumns,
    JSON.stringify(agentList),
    JSON.stringify(stageEnums),
    JSON.stringify(connectStatusEnums),
    JSON.stringify(endTypeEnums)
  ])

  const request = async (params, sorter) => {
    // 记录最新查询入参，供导出严格对齐
    latestParamsRef.current = params || {}
    // 记录最新排序条件，供导出复用
    latestSorterRef.current = sorter || null
    // 记录最新分页信息，供导出复用
    latestPaginationRef.current = {
      pageNum: params?.current,
      pageSize: params?.pageSize
    }
    // 使用 getFieldsValue(true) 获取所有字段值，包括未设置的
    const searchParam = form.getFieldsValue(true)
    // console.log("表单所有字段:", searchParam)

    setSearchParams(searchParam)
    const { waitDuration, totalDuration, agentName, onHookStage, ...otherParams } = searchParam

    // 处理 onHookStage 参数
    let stages = undefined

    // 如果 onHookStage 是 undefined 或 null，表示用户明确清空了选择，不使用任何值
    if (onHookStage === undefined || onHookStage === null) {
      stages = undefined
    }
    // 如果 onHookStage 是空数组，表示用户明确清空了选择，不使用任何值
    else if (Array.isArray(onHookStage) && onHookStage.length === 0) {
      stages = undefined
    }
    // 如果 onHookStage 有值，使用表单值
    else if (onHookStage.length > 0) {
      stages = onHookStage
    }
    // 只有在组件初始化时，表单值完全不存在时才使用 URL 参数
    else if (stageList && Object.keys(searchParam).length === 0) {
      // 仅在初始化时使用 URL 参数
      if (Array.isArray(stageList)) {
        stages = stageList
      } else if (typeof stageList === "string") {
        stages = stageList
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item)
      } else {
        stages = [stageList]
      }
    }

    // 优先使用表单中的 agentName，只有当 agentName 有明确值时才使用
    // 如果 agentName 是 undefined 或空字符串，则不使用 robotCode 作为回退
    const finalAgentName = agentName !== undefined && agentName !== "" ? agentName : undefined

    const requestParams = {
      ...params,
      ...otherParams,
      agentNo: finalAgentName,
      robotCode: botNo,
      onHookStage: stages,
      waitDurationMin: waitDuration?.min,
      waitDurationMax: waitDuration?.max,
      totalDurationMin: totalDuration?.min,
      totalDurationMax: totalDuration?.max,
      orderColumn: sorter?.field,
      orderType: sorter?.field ? (sorter?.order === "ascend" ? "asc" : "desc") : undefined,
      startTime: params?.startTime,
      endTime: params?.endTime
    }
    const res = await searchApi(requestParams)
    setRealTotal(res?.total)

    // 从列表数据中提取挂机业务阶段枚举值
    if (res?.data && res.data.length > 0) {
      const stages = new Set()
      res.data.forEach((item) => {
        if (item.onHookStage) {
          stages.add(item.onHookStage)
        }
      })
      const stageEnumList = Array.from(stages).map((stage) => ({
        value: stage,
        desc: stage
      }))
      setStageEnums(stageEnumList)
    }

    return res
  }

  return (
    <div className="overflow-auto h-full table-xrender-container bg-white">
      {contextHolder}
      <div className="table-xrender-container-insert">
        <Form form={form}>
          <TableRender
            className="call-logs-table call-logs-render-v2"
            ref={tableRef}
            rowKey={Math.random}
            search={{
              schema: getSchema(startTime, endTime),
              widgets: { RangeTimePicker },
              props: { botNo },
              mode: "simple",
              retainBtn: []
            }}
            scroll={{ x: 900, y: "77vh" }}
            pagination={{
              showSizeChanger: true,
              size: "default",
              showTotal: (total) => `共${total}条`
            }}
            request={request}
            columns={tableColumns}
            toolbarAction={{
              enabled: ["refresh", "columnsSetting", "density"],
              // @ts-ignore
              columnsSettingValue: columnsSettingValue?.filter(Boolean) || [],
              onColumnsSettingChange
            }}
            sortMultiple={true}
            toolbarRender={
              <>
                <Button onClick={onExportAudioRecords}>导出</Button>
              </>
            }
          />
        </Form>
      </div>
      <ConsultRecordDrawer drawerData={drawerData} setDrawerData={setDrawerData} />
    </div>
  )
}

export default VoiceRecord
