import React, { useState, useEffect, useCallback, useRef } from "react"
import { Table, Button, Typography, message, Form } from "antd"
import { DownloadOutlined } from "@ant-design/icons"
import { fetchDashboardTable, exportDashboardView } from "@/api/dashboard"
import { TableFilter } from "@/utils/tableFliter"
import dayjs from "dayjs"

const { Text } = Typography

const DEFAULT_PAGE_SIZE = 10

function ModelCallsTables({ startTime, endTime, botNoList }) {
  const [botForm] = Form.useForm()
  const [modelForm] = Form.useForm()
  const botSearchInput = useRef(null)
  const modelSearchInput = useRef(null)
  const [botSearchParams, setBotSearchParams] = useState({})
  const [modelSearchParams, setModelSearchParams] = useState({})
  // 空间维度表格状态
  const [botState, setBotState] = useState({
    loading: false,
    columns: [],
    dataSource: [],
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
    sortField: "callCount",
    sortOrder: "desc"
  })

  // 模型维度表格状态
  const [modelState, setModelState] = useState({
    loading: false,
    columns: [],
    dataSource: [],
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
    sortField: "callCount",
    sortOrder: "desc"
  })

  const buildDataSourceFromApi = useCallback((apiRows = []) => {
    if (!Array.isArray(apiRows) || apiRows.length === 0) return []

    // 检查是否是旧格式: [[{key:"",value:""}, ...], ...]
    const isOldFormat =
      Array.isArray(apiRows[0]) &&
      apiRows[0].length > 0 &&
      typeof apiRows[0][0] === "object" &&
      "key" in apiRows[0][0] &&
      "value" in apiRows[0][0]

    if (isOldFormat) {
      // 旧格式转换
      return apiRows.map((row, idx) => {
        const obj = { key: `row_${idx}` }
        ;(row || []).forEach((cell) => {
          if (cell && cell.key) {
            obj[cell.key] = cell.value
          }
        })
        return obj
      })
    }

    // 新格式: [{"modelName": "..."}]
    return apiRows.map((row, idx) => ({
      ...row,
      key: row.key || row.id || `row_${idx}`
    }))
  }, [])

  const buildColumnsFromApi = useCallback(
    (apiColumns = [], tableType = "bot", refreshFn, currentSearchParams = null) => {
      const form = tableType === "bot" ? botForm : modelForm
      // 优先使用传入的 currentSearchParams，否则使用状态中的 searchParams
      const searchParams =
        currentSearchParams !== null
          ? currentSearchParams
          : tableType === "bot"
            ? botSearchParams
            : modelSearchParams
      const searchInput = tableType === "bot" ? botSearchInput : modelSearchInput

      return (apiColumns || []).map((col) => {
        const dataIndex = col.key
        const sortableFields = ["callCount", "totalToken", "promptToken", "completionToken"]
        const sorter = sortableFields.includes(dataIndex)

        // 为 botName 和 modelName 添加搜索功能
        const needSearch =
          (tableType === "bot" && dataIndex === "botName") ||
          (tableType === "model" && (dataIndex === "modelName" || dataIndex === "modelCode"))

        return {
          title: col.description || col.key,
          dataIndex,
          key: dataIndex,
          sorter,
          render: (text) => text || "--",
          ...(needSearch
            ? TableFilter({
                form,
                searchParams,
                searchInput,
                refresh: refreshFn,
                dataIndex,
                fieldType: "input"
              })
            : {})
        }
      })
    },
    [botForm, modelForm, botSearchParams, modelSearchParams]
  )

  // 空间表格刷新函数
  const refreshBotTable = useCallback(
    (value) => {
      // 获取所有表单值
      const allFormValues = botForm.getFieldsValue()

      // 构建搜索参数：只包含有值的字段
      const searchParams = {}

      Object.keys(allFormValues).forEach((key) => {
        if (
          allFormValues[key] !== undefined &&
          allFormValues[key] !== null &&
          allFormValues[key] !== ""
        ) {
          searchParams[key] = allFormValues[key]
        }
      })

      // 先更新搜索参数状态，然后在回调中构建列
      setBotSearchParams(searchParams)

      setBotState((prev) => ({ ...prev, loading: true, page: 1 }))
      fetchDashboardTable({
        startTime: dayjs(startTime).format("YYYY-MM-DD"),
        endTime: dayjs(endTime).format("YYYY-MM-DD"),
        pageNum: 1,
        pageSize: botState.pageSize >= 10 ? botState.pageSize : 10,
        sortField: botState.sortField,
        sortOrder: botState.sortOrder,
        queryType: "bot_invo_token_count",
        botNoList: botNoList,
        ...searchParams
      })
        .then((res) => {
          // 使用最新的 searchParams 构建列，而不是依赖状态
          const columns = buildColumnsFromApi(res?.columns, "bot", refreshBotTable, searchParams)
          const dataSource = buildDataSourceFromApi(res?.data)
          setBotState((prev) => ({
            ...prev,
            loading: false,
            columns,
            dataSource,
            total: Number(res?.totalCount ?? 0),
            page: 1
          }))
        })
        .catch((e) => {
          console.error("获取表格数据失败:", e)
          message.error("获取表格数据失败")
          setBotState((prev) => ({ ...prev, loading: false }))
        })
    },
    [
      startTime,
      endTime,
      botNoList,
      botState.pageSize,
      botState.sortField,
      botState.sortOrder,
      botForm,
      buildColumnsFromApi,
      buildDataSourceFromApi
    ]
  )

  // 模型表格刷新函数
  const refreshModelTable = useCallback(
    (value) => {
      // 获取所有表单值
      const allFormValues = modelForm.getFieldsValue()

      // 构建搜索参数：只包含有值的字段
      const searchParams = {}
      Object.keys(allFormValues).forEach((key) => {
        if (
          allFormValues[key] !== undefined &&
          allFormValues[key] !== null &&
          allFormValues[key] !== ""
        ) {
          searchParams[key] = allFormValues[key]
        }
      })

      // 先更新搜索参数状态，然后在回调中构建列
      setModelSearchParams(searchParams)

      setModelState((prev) => ({ ...prev, loading: true, page: 1 }))
      fetchDashboardTable({
        startTime: dayjs(startTime).format("YYYY-MM-DD"),
        endTime: dayjs(endTime).format("YYYY-MM-DD"),
        botNoList: botNoList,
        pageNum: 1,
        pageSize: modelState.pageSize >= 10 ? modelState.pageSize : 10,
        sortField: modelState.sortField,
        sortOrder: modelState.sortOrder,
        queryType: "model_invo_token_count",
        ...searchParams
      })
        .then((res) => {
          // 使用最新的 searchParams 构建列，而不是依赖状态
          const columns = buildColumnsFromApi(
            res?.columns,
            "model",
            refreshModelTable,
            searchParams
          )
          const dataSource = buildDataSourceFromApi(res?.data)
          setModelState((prev) => ({
            ...prev,
            loading: false,
            columns,
            dataSource,
            total: Number(res?.totalCount ?? 0),
            page: 1
          }))
        })
        .catch((e) => {
          console.error("获取表格数据失败:", e)
          message.error("获取表格数据失败")
          setModelState((prev) => ({ ...prev, loading: false }))
        })
    },
    [
      startTime,
      endTime,
      botNoList,
      modelState.pageSize,
      modelState.sortField,
      modelState.sortOrder,
      modelForm,
      buildColumnsFromApi,
      buildDataSourceFromApi
    ]
  )

  // 初始化加载和重新加载 - 只依赖 startTime 和 endTime
  useEffect(() => {
    console.log("ModelCallsTables: 时间变化，重新请求数据", {
      startTime,
      endTime
    })
    if (!startTime || !endTime) return

    const fetchTable = async ({ queryType, pageNum, pageSize, sortField, sortOrder, setState }) => {
      setState((prev) => ({ ...prev, loading: true }))
      try {
        const res = await fetchDashboardTable({
          startTime: dayjs(startTime).format("YYYY-MM-DD"),
          endTime: dayjs(endTime).format("YYYY-MM-DD"),
          botNoList: botNoList,
          pageNum,
          pageSize,
          sortField,
          sortOrder,
          queryType
        })

        // res 就是完整的响应对象，包含 title, pageSize, pageNum, totalCount, data, columns
        const payload = res

        // 直接从 payload 中提取数据
        // 注意：后端返回的 pageSize 和 pageNum 字段名是反的
        const apiData = payload?.data
        const apiColumns = payload?.columns
        const totalCount = payload?.totalCount
        const currentPageNum = payload?.pageSize // 实际是当前页码
        const currentPageSize = payload?.pageNum // 实际是每页大小
        // 根据 queryType 决定使用哪个 refresh 函数
        const isBot = queryType === "bot_invo_token_count"
        const tableType = isBot ? "bot" : "model"
        const refreshFn = isBot ? refreshBotTable : refreshModelTable

        // 初始化时，searchParams 为空对象
        const columns = buildColumnsFromApi(apiColumns, tableType, refreshFn, {})
        const dataSource = buildDataSourceFromApi(apiData)

        setState((prev) => ({
          ...prev,
          loading: false,
          columns,
          dataSource,
          total: Number(totalCount ?? 0),
          page: Number(currentPageNum ?? 1),
          pageSize: Number(currentPageSize ?? prev.pageSize),
          sortField,
          sortOrder
        }))
      } catch (e) {
        console.error("获取表格数据失败:", e)
        message.error("获取表格数据失败")
        setState((prev) => ({ ...prev, loading: false }))
      }
    }

    const fetchData = async () => {
      await fetchTable({
        queryType: "bot_invo_token_count",
        pageNum: 1,
        botNoList,
        pageSize: DEFAULT_PAGE_SIZE,
        sortField: "callCount",
        sortOrder: "desc",
        setState: setBotState
      })

      await fetchTable({
        queryType: "model_invo_token_count",
        pageNum: 1,
        botNoList,
        pageSize: DEFAULT_PAGE_SIZE,
        sortField: "callCount",
        sortOrder: "desc",
        setState: setModelState
      })
    }

    fetchData()
  }, [startTime, endTime, botNoList])

  const handleChange = useCallback(
    (type) => (pagination, filters, sorter) => {
      const isBot = type === "bot"
      const state = isBot ? botState : modelState
      const setState = isBot ? setBotState : setModelState
      const queryType = isBot ? "bot_invo_token_count" : "model_invo_token_count"

      const pageNum = pagination?.current ?? 1
      const pageSize = pagination?.pageSize ?? state.pageSize

      const sortField = sorter?.field || state.sortField
      const sortOrder = sorter?.order === "ascend" ? "asc" : "desc"

      // 获取当前表格的搜索参数
      const currentSearchParams = isBot ? botSearchParams : modelSearchParams

      // 重新定义 fetchTable 函数用于表格变化时的调用
      const fetchTableForChange = async () => {
        setState((prev) => ({ ...prev, loading: true }))
        try {
          const res = await fetchDashboardTable({
            startTime: dayjs(startTime).format("YYYY-MM-DD"),
            endTime: dayjs(endTime).format("YYYY-MM-DD"),
            pageNum,
            pageSize,
            sortField,
            sortOrder,
            queryType,
            ...currentSearchParams // 保持搜索参数
          })

          const payload = res

          const tableType = isBot ? "bot" : "model"
          const refreshFn = isBot ? refreshBotTable : refreshModelTable
          // 表格变化时，使用当前的 searchParams
          const columns = buildColumnsFromApi(
            payload?.columns,
            tableType,
            refreshFn,
            currentSearchParams
          )
          const dataSource = buildDataSourceFromApi(payload?.data)

          // 注意：后端返回的 pageSize 和 pageNum 字段名是反的
          setState((prev) => ({
            ...prev,
            loading: false,
            columns,
            dataSource,
            total: Number(payload?.totalCount ?? 0),
            page: Number(payload?.pageSize ?? 1), // 实际是当前页码
            pageSize: Number(payload?.pageNum ?? prev.pageSize), // 实际是每页大小
            sortField,
            sortOrder
          }))
        } catch (e) {
          console.error("获取表格数据失败:", e)
          message.error("获取表格数据失败")
          setState((prev) => ({ ...prev, loading: false }))
        }
      }

      fetchTableForChange()
    },
    [
      botState,
      modelState,
      startTime,
      endTime,
      buildColumnsFromApi,
      buildDataSourceFromApi,
      refreshBotTable,
      refreshModelTable,
      botSearchParams,
      modelSearchParams
    ]
  )

  const downloadCsv = useCallback(
    async (type) => {
      const isBot = type === "bot"
      const state = isBot ? botState : modelState
      const queryType = isBot ? "bot_invo_token_count" : "model_invo_token_count"

      // 获取当前表格的搜索参数
      const currentSearchParams = isBot ? botSearchParams : modelSearchParams

      try {
        const success = await exportDashboardView({
          viewType: "table",
          queryParams: {
            startTime: dayjs(startTime).format("YYYY-MM-DD"),
            endTime: dayjs(endTime).format("YYYY-MM-DD"),
            sortField: state.sortField,
            sortOrder: state.sortOrder,
            queryType,
            ...currentSearchParams
          },
          title: type === "bot" ? "空间维度调用次数/token量" : "模型维度调用次数/token量"
        })

        if (success) {
          message.success("导出成功")
        } else {
          message.error("导出失败")
        }
      } catch (e) {
        console.error("导出失败:", e)
        message.error("导出失败")
      }
    },
    [botState, modelState, startTime, endTime, botSearchParams, modelSearchParams]
  )

  return (
    <div className="space-y-5 mt-5">
      {/* 空间维度调用次数/token量表格 */}
      <div className="bg-white rounded-xl p-4" style={{ border: "1px solid #E5E7EB" }}>
        <div className="flex justify-between items-center mb-4">
          <Text style={{ fontSize: "14px", fontWeight: "500", color: "#1F2937" }}>
            空间维度调用次数/token量
          </Text>
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => downloadCsv("bot")}
            loading={botState.loading}
          />
        </div>
        <Form form={botForm}>
          <Table
            columns={botState.columns}
            dataSource={botState.dataSource}
            loading={botState.loading}
            size="small"
            pagination={{
              current: botState.page,
              pageSize: botState.pageSize,
              total: botState.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`
            }}
            scroll={{ x: 600 }}
            onChange={handleChange("bot")}
          />
        </Form>
      </div>

      {/* 模型维度调用次数/token量表格 */}
      <div className="bg-white rounded-xl p-4" style={{ border: "1px solid #E5E7EB" }}>
        <div className="flex justify-between items-center mb-4">
          <Text style={{ fontSize: "14px", fontWeight: "500", color: "#1F2937" }}>
            模型维度调用次数/token量
          </Text>
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => downloadCsv("model")}
            loading={modelState.loading}
          />
        </div>
        <Form form={modelForm}>
          <Table
            columns={modelState.columns}
            dataSource={modelState.dataSource}
            loading={modelState.loading}
            size="small"
            pagination={{
              current: modelState.page,
              pageSize: modelState.pageSize,
              total: modelState.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`
            }}
            scroll={{ x: 600 }}
            onChange={handleChange("model")}
          />
        </Form>
      </div>
    </div>
  )
}

export default ModelCallsTables
