import { useState, useEffect } from "react"
import { message } from "antd"
import { InfoTypeAPI } from "../../api"
import { mockInfoTypeList, mockCreateInfoType } from "../../mock/infoType"

/**
 * 信息类别表格数据管理 Hook
 * @returns {Object} 包含表格所需的状态和方法
 */
const useInfoTypeTable = () => {
  // 表格基础状态
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const [searchValue, setSearchValue] = useState("")
  const [sortInfo, setSortInfo] = useState({
    field: null,
    order: null
  })

  // 获取表格数据
  const fetchData = async (params = {}) => {
    setLoading(true)
    try {
      const queryParams = {
        pageNum: pagination.current,   // 与 mock 数据结构中的 pageNum 保持一致
        pageSize: pagination.pageSize,
        name: searchValue,
        sortType: 'desc',
        // sortField: sortInfo.field,     // 排序字段
        // sortOrder: sortInfo.order,     // 排序顺序 (ascend/descend)
        ...params
      }
      debugger
      const response = await InfoTypeAPI.getList(queryParams)
      // const response = mockInfoTypeList  // 注释掉 mock 数据

      if (response.success) {
        // 适配 mock 数据结构：data.data 是实际的列表数据
        setDataSource(response.data.data || [])
        setPagination((prev) => ({
          ...prev,
          // 适配 mock 数据结构的字段名称
          total: parseInt(response.data.totalCount || 0, 10),
          current: parseInt(response.data.pageNum || 1, 10)
        }))
      } else {
        message.error(response.message || "获取数据失败")
        setDataSource([])
      }
    } catch (error) {
      console.error("获取信息类别数据失败:", error)
      message.error(`获取数据失败: ${error.message || "网络错误"}`)
      setDataSource([])
    } finally {
      setLoading(false)
    }
  }

  // 处理分页、排序变化
  const handleTableChange = async (paginationConfig, filters, sorter) => {
    // 更新分页状态
    setPagination((prev) => ({
      ...prev,
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize
    }))

    // 更新排序状态
    if (sorter) {
      setSortInfo({
        field: sorter.field,
        order: sorter.order
      })
    }

    try {
      const params = {
        pageNum: paginationConfig.current,  // 改为 pageNum 与 API 保持一致
        pageSize: paginationConfig.pageSize
      }

      // 添加排序参数
      if (sorter && sorter.field && sorter.order) {
        params.sortField = sorter.field
        params.sortOrder = sorter.order
      }

      await fetchData(params)
    } catch (error) {
      console.error("表格数据获取失败:", error)
    }
  }

  // 处理搜索
  const handleSearch = async (value) => {
    debugger
    setSearchValue(value)
    setPagination((prev) => ({ ...prev, current: 1 }))

    try {
      await fetchData({ pageNum: 1, keyword: value, name: value.trim() })  // 改为 pageNum 与 API 保持一致
    } catch (error) {
      console.error("搜索数据获取失败:", error)
    }
  }

  // 删除记录
  const handleDelete = async (id) => {
    try {
      const response = await InfoTypeAPI.delete(id)
      if (response.success) {
        message.success("删除成功")
        await fetchData()
      } else {
        message.error(response.message || "删除失败")
      }
    } catch (error) {
      console.error("删除操作失败:", error)
      message.error(`删除失败: ${error.message || "网络错误"}`)
    }
  }

  // 刷新数据
  const refreshData = async () => {
    try {
      await fetchData()
    } catch (error) {
      console.error("刷新数据失败:", error)
    }
  }

  // 新增类型
const addNewType = async (params = {}) => {
    setLoading(true)
    try {
      const queryParams = {
        name: '11',
        description:'11',
        categorySort:1,
        enabledStatus:1,
      }
      debugger
      // const response = await InfoTypeAPI.create(queryParams)
      const response = mockCreateInfoType  // 注释掉 mock 数据

      if (response.success) {
        // 适配 mock 数据结构：data.data 是实际的列表数据
        setDataSource(response.data.data || [])
        setPagination((prev) => ({
          ...prev,
          // 适配 mock 数据结构的字段名称
          total: parseInt(response.data.totalCount || 0, 10),
          current: parseInt(response.data.pageNum || 1, 10)
        }))
      } else {
        message.error(response.message || "获取数据失败")
        setDataSource([])
      }
    } catch (error) {
      console.error("获取信息类别数据失败:", error)
      message.error(`获取数据失败: ${error.message || "网络错误"}`)
      setDataSource([])
    } finally {
      setLoading(false)
    }
  }

  // 重置搜索
  const resetSearch = async () => {
    setSearchValue("")
    setPagination((prev) => ({ ...prev, current: 1 }))

    try {
      await fetchData({ pageNum: 1, keyword: "" })  // 改为 pageNum 与 API 保持一致
    } catch (error) {
      console.error("重置搜索失败:", error)
    }
  }

  // 初始化数据
  useEffect(() => {
    let isMounted = true 
    

    const initializeData = async () => {
      try {
        if (isMounted) {
          await fetchData()
        }
      } catch (error) {
        if (isMounted) {
          console.error("初始化数据失败:", error)
        }
      }
    }

    initializeData()

    // 清理函数，防止组件卸载后更新状态
    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    // 状态
    loading,
    dataSource,
    pagination,
    searchValue,
    sortInfo,

    // 方法
    fetchData,
    handleTableChange,
    handleSearch,
    handleDelete,
    refreshData,
    resetSearch,
    addNewType
  }
}

export default useInfoTypeTable
