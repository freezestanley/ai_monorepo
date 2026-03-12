import { Get, Post, Put, Delete, Patch, Upload } from "@/api/server"
import { botPrefix, news } from "@/constants"
// import { Upload } from "antd"

const prefix = news

export const InfoDetailAPI = {
  getList: (params) => {
    // 构建查询参数
    const queryParams = new URLSearchParams()
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          queryParams.append(key, params[key])
        }
      })
    }
    const queryString = queryParams.toString()
    const url = `${prefix}/admin/newsCenter/page${queryString ? `?${queryString}` : ''}`
    return Get(url).then((res) => res)
  },

  // 创建消息类别
  create: (data) => {
    return Post(`${prefix}/admin/newsCategory/create`, data).then((res) => res)
  },

  // 更新消息类别
  update: (categoryNo, data) => {
    return Put(`${prefix}/admin/newsCategory/update`, {...data,categoryNo}).then((res) => res)
  },

  // 删除消息类别
  delete: (categoryNo) => {
    return Delete(`${prefix}/admin/newsCategory/${categoryNo}`).then((res) => res)
  },

  // 获取消息类别详情
  getDetail: (id, data) => {
    return Post(`${prefix}/admin/bot/create`, data).then((res) => res)
  }

}

// 消息类别相关API
export const InfoTypeAPI = {
  // 获取消息类别列表
  getList: (params) => {
    // 构建查询参数
    const queryParams = new URLSearchParams()
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          queryParams.append(key, params[key])
        }
      })
    }
    debugger
    const queryString = queryParams.toString()
    const url = `${prefix}/admin/newsCategory/page${queryString ? `?${queryString}` : ''}`
    return Get(url).then((res) => res)
  },

  // 创建消息类别
  create: (data) => {
    return Post(`${prefix}/admin/newsCategory/create`, data).then((res) => res)
  },

  // 更新消息类别
  update: (categoryNo, data) => {
    return Put(`${prefix}/admin/newsCategory/update`, {...data,categoryNo}).then((res) => res)
  },

  // 删除消息类别
  delete: (categoryNo) => {
    return Delete(`${prefix}/admin/newsCategory/${categoryNo}`).then((res) => res)
  },

  // 获取消息类别详情
  getDetail: (id, data) => {
    return Post(`${prefix}/admin/bot/create`, data).then((res) => res)
  }
}

export const InfoEditAPI = {
  detail: (newsNo) => {
    return Get(`${prefix}/admin/newsCenter/detail`, {newsNo}).then((res) => res)
  },
  publish: (params) => {
    
    return Post(`${prefix}/admin/newsCenter/publish/${params?.newsNo}/${params?.publishStateEdit}`, params).then((res) => res)
  },
  getListCategory: (params) => {
    return Get(`${prefix}/admin/newsCategory/page`, params).then((res) => res)
  },
  create: (params) => {
    return Post(`${prefix}/admin/newsCenter/create`, params).then((res) => res)
  },

  // 更新消息
  update: (data) => {
    return Put(`${prefix}/admin/newsCenter/update`, data).then((res) => res)
  },

  // 删除消息
  delete: (newsNo) => {
    return Post(`${prefix}/admin/newsCenter/${newsNo}`).then((res) => res)
  },
}

// 消息相关API
export const InfoAPI = {
  // 获取消息列表
  getList: (params) => {
    return Post(`${prefix}/admin/bot/create`, params).then((res) => res)
  },

  // 创建消息
  create: (params) => {
    return Post(`${prefix}/admin/bot/create`, params).then((res) => res)
  },

  // 更新消息
  update: (id, data) => {
    return Post(`${prefix}/admin/bot/create`, data).then((res) => res)
  },

  // 删除消息
  delete: (newsNo) => {
    return Delete(`${prefix}/admin/newsCenter/${newsNo}`).then((res) => res)
  },

  // 获取消息详情
  getDetail: (id, data) => {
    return Post(`${prefix}/admin/bot/create`, data).then((res) => res)
  },

  // 批量删除消息
  batchDelete: (id, data) => {
    return Post(`${prefix}/admin/bot/create`, data).then((res) => res)
  }
}

// 文件上传API
export const FileAPI = {
  // 上传图片
  uploadImage: async (file) => {
    // const formData = new FormData()
    // formData.append("file", file)
    // return request({
    //   url: "/api/file/upload/image",
    //   method: "post",
    //   data: formData,
    //   headers: {
    //     "Content-Type": "multipart/form-data"
    //   }
    // })

    const result = await Upload(`${prefix}/admin/file/upload`, file, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    })
    return result
  }
}
// export const fetchUploadFile = (formData) => {
//   return Upload(`${prefix}/admin/file/upload`, formData, {
//     headers: {
//       "Content-Type": "multipart/form-data"
//     }
//   }).then((res) => res.data)}
