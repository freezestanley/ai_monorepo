// Infocenter Mock 数据入口文件
import Mock from "mockjs"
import { botPrefix } from "@/constants"

// 导入各模块的 mock 数据
import {
  mockInfoTypeList,
  mockInfoTypeDetail,
  mockCreateInfoType,
  mockUpdateInfoType,
  mockDeleteInfoType
} from "./infoType"

import {
  mockInfoList,
  mockInfoDetail,
  mockCreateInfo,
  mockUpdateInfo,
  mockDeleteInfo,
  mockBatchDeleteInfo
} from "./info"

import {
  mockUploadImage,
  mockUploadDocument,
  mockBatchUpload,
  mockDeleteFile,
  mockFileList
} from "./file"

const prefix = botPrefix || "/api"

// 消息类别相关接口 Mock
// 获取消息类别列表
Mock.mock(new RegExp(`${prefix}/admin/bot/chatModel/list`), "get", (options) => {
  console.log("Mock: 获取消息类别列表", options)

  // 模拟分页和搜索
  const url = options.url
  const params = new URLSearchParams(url.split("?")[1] || "")
  const keyword = params.get("keyword") || ""
  const page = parseInt(params.get("page")) || 1
  const pageSize = parseInt(params.get("pageSize")) || 10

  let list = [...mockInfoTypeList.data.list]

  // 搜索过滤
  if (keyword) {
    list = list.filter((item) => item.name.includes(keyword) || item.description.includes(keyword))
  }

  // 分页
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const paginatedList = list.slice(start, end)

  return {
    ...mockInfoTypeList,
    data: {
      ...mockInfoTypeList.data,
      list: paginatedList,
      total: list.length,
      current: page,
      pageSize: pageSize
    }
  }
})

// 创建/更新/删除消息类别（由于API中都使用同一个接口，这里需要根据参数区分）
Mock.mock(new RegExp(`${prefix}/admin/bot/create`), "post", (options) => {
  console.log("Mock: 消息类别操作", options)

  try {
    const body = JSON.parse(options.body)

    // 根据操作类型返回不同响应
    if (body.action === "create") {
      return mockCreateInfoType
    } else if (body.action === "update") {
      return mockUpdateInfoType
    } else if (body.action === "delete") {
      return mockDeleteInfoType
    } else if (body.action === "getDetail") {
      return mockInfoTypeDetail
    } else if (body.action === "getInfoList") {
      // 消息列表查询
      const keyword = body.keyword || ""
      const page = body.page || 1
      const pageSize = body.pageSize || 10
      const typeId = body.typeId

      let list = [...mockInfoList.data.list]

      // 类别过滤
      if (typeId) {
        list = list.filter((item) => item.typeId === parseInt(typeId))
      }

      // 搜索过滤
      if (keyword) {
        list = list.filter(
          (item) =>
            item.title.includes(keyword) ||
            item.summary.includes(keyword) ||
            item.content.includes(keyword)
        )
      }

      // 分页
      const start = (page - 1) * pageSize
      const end = start + pageSize
      const paginatedList = list.slice(start, end)

      return {
        ...mockInfoList,
        data: {
          ...mockInfoList.data,
          list: paginatedList,
          total: list.length,
          current: page,
          pageSize: pageSize
        }
      }
    } else if (body.action === "getInfoDetail") {
      return mockInfoDetail
    } else if (body.action === "createInfo") {
      return mockCreateInfo
    } else if (body.action === "updateInfo") {
      return mockUpdateInfo
    } else if (body.action === "deleteInfo") {
      return mockDeleteInfo
    } else if (body.action === "batchDeleteInfo") {
      return mockBatchDeleteInfo
    }

    // 默认返回成功响应
    return {
      code: "200",
      success: true,
      message: "操作成功",
      data: null
    }
  } catch (error) {
    console.error("Mock 解析错误:", error)
    return {
      code: "500",
      success: false,
      message: "服务器内部错误",
      data: null
    }
  }
})

// 文件上传相关接口 Mock
Mock.mock(new RegExp(`${prefix}/file/upload/image`), "post", (options) => {
  console.log("Mock: 图片上传", options)

  // 模拟上传延时
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockUploadImage)
    }, 1000)
  })
})

Mock.mock(new RegExp(`${prefix}/file/upload/document`), "post", (options) => {
  console.log("Mock: 文档上传", options)

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockUploadDocument)
    }, 1500)
  })
})

Mock.mock(new RegExp(`${prefix}/file/batch-upload`), "post", (options) => {
  console.log("Mock: 批量上传", options)

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockBatchUpload)
    }, 2000)
  })
})

Mock.mock(new RegExp(`${prefix}/file/delete`), "delete", (options) => {
  console.log("Mock: 删除文件", options)
  return mockDeleteFile
})

Mock.mock(new RegExp(`${prefix}/file/list`), "get", (options) => {
  console.log("Mock: 文件列表", options)

  const url = options.url
  const params = new URLSearchParams(url.split("?")[1] || "")
  const keyword = params.get("keyword") || ""
  const fileType = params.get("fileType") || ""
  const page = parseInt(params.get("page")) || 1
  const pageSize = parseInt(params.get("pageSize")) || 10

  let list = [...mockFileList.data.list]

  // 文件类型过滤
  if (fileType) {
    list = list.filter((item) => item.fileType.includes(fileType))
  }

  // 搜索过滤
  if (keyword) {
    list = list.filter((item) => item.fileName.includes(keyword))
  }

  // 分页
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const paginatedList = list.slice(start, end)

  return {
    ...mockFileList,
    data: {
      ...mockFileList.data,
      list: paginatedList,
      total: list.length,
      current: page,
      pageSize: pageSize
    }
  }
})

// 导出所有 mock 数据供其他地方使用
export {
  mockInfoTypeList,
  mockInfoTypeDetail,
  mockCreateInfoType,
  mockUpdateInfoType,
  mockDeleteInfoType,
  mockInfoList,
  mockInfoDetail,
  mockCreateInfo,
  mockUpdateInfo,
  mockDeleteInfo,
  mockBatchDeleteInfo,
  mockUploadImage,
  mockUploadDocument,
  mockBatchUpload,
  mockDeleteFile,
  mockFileList
}

// 默认导出配置对象
export default {
  // 延时配置
  timeout: "200-1000",

  // 启用 Mock
  enable: process.env.NODE_ENV === "development",

  // Mock 数据版本
  version: "1.0.0",

  // 模块描述
  description: "Infocenter module mock data"
}
