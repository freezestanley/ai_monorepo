/**
 * 支持搜索的分页列表
 */
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "../../constants"
import { Table, Input, Button, Space } from "antd"
import { ColumnType, TablePaginationConfig } from "antd/es/table"
import { FilterValue } from "antd/es/table/interface"
import { isEqual, debounce } from "lodash"
import { useEffect, useState, useCallback, forwardRef, useImperativeHandle, ReactNode } from "react"
import style from "./index.module.scss"
import { getQueryParameters } from "../../utils/token"
import { useNavigate } from "react-router-dom"
import useRouter from "../../hooks/useRouter"
import { LeftOutlined } from "@ant-design/icons"

import { Get, Post, Put, Delete, Patch } from "@/api/server"

type ApiMethodType = "get" | "post" | "put" | "delete" | "patch"

interface Props {
  baseURL?: string
  title: string
  path: string
  backUrl?: string
  searchPlaceholder: string
  columns: ColumnType<any>[]
  createLink?: string
  searchKey: string
  createButtonText?: string
  rowKey: string
  showSelection?: boolean
  dataKey?: any // 用于从响应中获取数据的键，默认为 "data"
  totalKey?: string // 用于从响应中获取总数的键，默认为 "totalCount"
  apiMethod?: ApiMethodType
  getSorter?: (sorter: any) => Record<string, any>
  formatFilter?: (filter: any) => Record<string, any>
  exportApiPath?: string
  searchParams?: Record<string, any> // 额外请求的参数
  searchBtnRender?: ReactNode[] // 自定义操作按钮
}

const DEFAULT_INIT_PAGE = 1

const SearchablePagedTable = forwardRef<any, Props>(
  (
    {
      title,
      path,
      searchPlaceholder,
      columns,
      createLink,
      searchKey,
      createButtonText,
      rowKey,
      showSelection = false,
      dataKey = "data",
      totalKey = "totalCount",
      apiMethod = "post",
      getSorter,
      formatFilter,
      exportApiPath,
      searchParams,
      searchBtnRender = [],
      baseURL,
      backUrl = ""
    },
    ref
  ) => {
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [dataSource, setDataSource] = useState<any[]>([])
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[] | number[]>([])
    const [pagination, setPagination] = useState<any>({
      current: DEFAULT_INIT_PAGE,
      pageSize: DEFAULT_PAGE_SIZE,
      total: 0
    })
    const [currentFilters, setCurrentFilters] = useState<any>({})
    const [currentSorter, setCurrentSorter] = useState<any>({})
    const [downLoading, setDownloading] = useState<boolean>(false)
    const navigate = useNavigate()
    const { navigatePush } = useRouter()

    const fetchData = useCallback(
      async (currentPagition = pagination, currentFilters = {}, currentSorter = {}) => {
        try {
          const requestBody = {
            ...(searchTerm && searchTerm.trim() !== "" ? { [searchKey]: searchTerm } : {}),
            pageSize: currentPagition.pageSize,
            pageNum: currentPagition.current,
            ...searchParams,
            ...currentFilters,
            ...currentSorter
          }
          const requestConfig = baseURL ? { baseURL } : {}
          const method = apiMethod || "post"
          const request = {
            get: () => Get(`/botWeb${path}`, requestBody, requestConfig),
            post: () => Post(`/botWeb${path}`, requestBody, {}, requestConfig),
            put: () => Put(`/botWeb${path}`, requestBody, {}, requestConfig),
            delete: () => Delete(`/botWeb${path}`, requestBody),
            patch: () => Patch(`/botWeb${path}`, requestBody, {}, requestConfig)
          }[method]

          const response = request ? await request() : await Post(`/botWeb${path}`, requestBody)
          const payload = response?.data ?? response
          const { [dataKey]: fetchedData, [totalKey]: fetchedTotal } = payload ?? {}
          setDataSource(fetchedData)

          setPagination((prev: any) => ({ ...prev, total: fetchedTotal }))
        } catch (error) {
          console.error("Error fetching data:", error)
        }
      },
      [path, apiMethod, searchKey, searchTerm, pagination, dataKey, totalKey, searchParams]
    )

    const handleTableChange = (
      page: TablePaginationConfig,
      filters: Record<string, FilterValue | null>,
      sorter: any
    ) => {
      let shouldResetPage = false
      // 比较 filters
      if (!isEqual(currentFilters, filters) && Object.keys(currentSorter).length) {
        shouldResetPage = true
        setCurrentFilters(filters)
      }

      // 比较 sorter
      if (!isEqual(currentSorter, sorter) && Object.keys(currentSorter).length) {
        shouldResetPage = true
        setCurrentSorter(sorter)
      }

      const { current = DEFAULT_INIT_PAGE, pageSize = DEFAULT_PAGE_SIZE } = page

      const currentPagition = {
        ...pagination,
        current: shouldResetPage ? DEFAULT_INIT_PAGE : current,
        pageSize
      }
      setPagination(currentPagition)

      const effectiveSorter = getSorter?.(sorter) ?? {}

      fetchData(currentPagition, formatFilter?.(filters) ?? filters, effectiveSorter)
    }

    const rowSelection = {
      selectedRowKeys,
      onChange: (selectedKeys: any[]) => {
        setSelectedRowKeys(selectedKeys ?? [])
      }
    }

    const handleExport = async () => {
      if (!exportApiPath || !selectedRowKeys.length) return

      try {
        setDownloading(true)
        const response = await Get(
          exportApiPath,
          { ids: selectedRowKeys.join(",") },
          { responseType: "blob" }
        )
        const blob = new Blob([response.data], { type: "application/zip" })
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement("a")

        // 为了获取文件名，你可以尝试从响应头部或其他途径获取。此处只是一个示例。
        const filename =
          (response.headers["content-disposition"] || "").split("filename=")[1] || "download.zip"

        a.href = downloadUrl
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(downloadUrl)
      } catch (error) {
        console.error("Error exporting data:", error)
      } finally {
        setDownloading(false)
      }
    }

    const handleCreate = () => {
      const { botNo = "", workbenchNo = "" } = getQueryParameters()
      const queryString = Object.entries({
        botNo,
        workbenchNo
      })
        .map(([key, value]) => `${key}=${value}`)
        .join("&")

      const separator = createLink?.includes("?") ? "&" : "?"
      navigate(`${createLink}${separator}${queryString}`)
    }

    useEffect(() => {
      fetchData()
    }, [searchKey, path])

    useEffect(() => {
      const currentPagition = { ...pagination, current: DEFAULT_INIT_PAGE }
      setPagination(currentPagition)
      fetchData(currentPagition, currentFilters, currentFilters)
    }, [searchTerm])

    useImperativeHandle(ref, () => ({
      reloadData: fetchData
    }))

    const handleInputChange = debounce((value: string) => {
      setSearchTerm(value)
    }, 500)

    const handleInputChangeInstantly = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.trim()
      handleInputChange(value)
    }
    const handleBack = () => {
      backUrl && navigatePush(backUrl)
    }

    return (
      <div className={style["searchable-paged-table"]}>
        <div className={style.header}>
          <Space align="center" onClick={handleBack} className={backUrl ? "cursor-pointer" : ""}>
            {backUrl && <LeftOutlined />}
            <h2 className={style.title}>{title}</h2>
          </Space>
          <div className={style.search}>
            <Input
              placeholder={searchPlaceholder}
              onChange={handleInputChangeInstantly}
              className={style["search-input"]}
              allowClear
            />
            <Space>
              {showSelection && (
                <Button
                  type="primary"
                  ghost
                  onClick={handleExport}
                  disabled={!selectedRowKeys.length} // 如果没有选择任何项，则禁用按钮
                  loading={downLoading}
                >
                  导出
                </Button>
              )}
              {createLink ? (
                <Button type="primary" className={style.button} onClick={handleCreate}>
                  {createButtonText}
                </Button>
              ) : null}
              {...searchBtnRender}
            </Space>
          </div>
        </div>
        <div style={{ width: "100%", padding: "0 20px" }}>
          <Table
            rowKey={rowKey}
            rowSelection={showSelection ? rowSelection : undefined}
            dataSource={dataSource}
            columns={columns}
            pagination={{
              current: pagination.current,
              total: pagination.total,
              showSizeChanger: true,
              pageSizeOptions: PAGE_SIZE_OPTIONS,
              showTotal: (total: number) => `共 ${pagination.total || total} 条`
            }}
            onChange={handleTableChange}
            scroll={{ y: "calc(100vh - 400px)" }}
            // className={style.table}
            // className="table-style-v2"
          />
        </div>
      </div>
    )
  }
)

export default SearchablePagedTable
