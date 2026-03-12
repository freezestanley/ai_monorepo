import { Post, Get } from "@/api/server"

// API前缀 - 使用统一的代理方式
const API_PREFIX = "/gateway/api"

/**
 * 模型响应DTO接口（用于返回解析后的结构化信息）
 */
export const ModelResponseDTO = {
  /** ID */
  id: 0,
  /** 模型名称 */
  name: "",
  /** 类型: LLM,EMBEDDING */
  type: "",
  /** 映射 */
  mapping: 0,
  /** 解析后的模型配置信息 */
  info: {},
  /** 创建时间 */
  gmtCreated: "",
  /** 修改时间 */
  gmtModified: "",
  /** 创建人 */
  creator: "",
  /** 修改人 */
  modifier: "",
  /** 是否逻辑删除 */
  isDeleted: ""
}

/**
 * 模型系列数据接口
 */
export const ModelSeriesDTO = {
  /** ID */
  id: 0,
  /** 模型系列名字 */
  name: "",
  /** 提供方 */
  supplier: "",
  /** 可访问规则 */
  accessRule: "",
  /** 主干模型id */
  mainId: 0,
  /** 描述 */
  description: "",
  /** 创建时间 */
  gmtCreated: "",
  /** 修改时间 */
  gmtModified: "",
  /** 创建人 */
  creator: "",
  /** 修改人 */
  modifier: "",
  /** 是否逻辑删除 */
  isDeleted: ""
}

/**
 * 分页查询模型系列列表
 */
export function queryPage(data) {
  return Post(`${API_PREFIX}/api/modelSeries/retrieveByPage`, data)
}

/**
 * 获取模型系列详情
 */
export function queryDetail(id) {
  return Post(`${API_PREFIX}/api/modelSeries/retrieveById`, { id })
}

/**
 * 获取全量模型系列列表
 */
export function retrieve() {
  return Post(`${API_PREFIX}/api/modelSeries/retrieve`)
}

/**
 * 获取模型系列的相关模型列表
 */
export function queryModels(seriesId) {
  return Post(`${API_PREFIX}/ops/model/retrieve`, { seriesId })
}

/**
 * 搜索模型（用于模型广场下拉选择）
 */
export function querySearch(params) {
  return Post(`${API_PREFIX}/ops/model/retrieve`, params)
}

/**
 * 模型详细信息接口（包含解析后的配置信息）
 */
export const ModelDetailDTO = {
  /** ID */
  id: 0,
  /** 模型名称 */
  name: "",
  /** 类型: LLM,EMBEDDING */
  type: "",
  /** 映射 */
  mapping: 0,
  /** 模型系列id */
  seriesId: 0,
  /** 解析后的模型配置信息（旧格式） */
  info: {},
  /** 解析后的属性配置信息（新格式） */
  attribute: {},
  /** 创建时间 */
  gmtCreated: "",
  /** 修改时间 */
  gmtModified: "",
  /** 创建人 */
  creator: "",
  /** 修改人 */
  modifier: "",
  /** 是否逻辑删除 */
  isDeleted: ""
}

/**
 * 模型系列详情接口（包含主干模型和相关模型列表）
 */
export const ModelSeriesDetailDTO = {
  /** ID */
  id: 0,
  /** 模型系列名字 */
  name: "",
  /** 提供方 */
  supplier: "",
  /** 可访问规则 */
  accessRule: "",
  /** 主干模型id */
  mainId: 0,
  /** 描述 */
  description: "",
  /** 创建时间 */
  gmtCreated: "",
  /** 修改时间 */
  gmtModified: "",
  /** 创建人 */
  creator: "",
  /** 修改人 */
  modifier: "",
  /** 是否逻辑删除 */
  isDeleted: "",
  /** 主干模型信息（包含解析后的配置信息） */
  mainModel: ModelDetailDTO,
  /** 相关模型列表 */
  relatedModels: []
}

export const ModelSeriesService = {
  queryPage,
  queryDetail,
  retrieve,
  queryModels
}

/**
 * React Query Hooks
 */
import { useInfiniteQuery } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"

/**
 * 获取模型系列市集列表（无限滚动）
 * @param {Object} params - 查询参数
 * @param {number} params.pageSize - 每页数量
 * @param {Object} params.params - 其他查询参数（如 name）
 * @returns {Object} useInfiniteQuery 返回对象
 */
export const useInfiniteModelSeriesMarketListApi = (params) => {
  return useInfiniteQuery(
    [QUERY_KEYS.MODEL_SERIES_MARKET, params],
    ({ pageParam = 1 }) => {
      return Post(`${API_PREFIX}/api/modelSeries/retrieveByPage`, {
        pageNum: pageParam,
        pageSize: params.pageSize,
        param: params.param
      }).then((res) => {
        if (res?.success) {
          return {
            list: res.data?.value || [],
            total: res.data?.totalCount || 0
          }
        }
        return { list: [], total: 0 }
      })
    },
    {
      getNextPageParam: (lastPage, pages) => {
        if (lastPage?.list?.length < params.pageSize) {
          return undefined // 没有更多数据了
        }
        return pages.length + 1 // 返回下一页的页码
      }
    }
  )
}
