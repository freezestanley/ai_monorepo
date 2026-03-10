import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { message } from 'antd'

const instance = axios.create({
  timeout: 30000,
})

// 请求拦截器
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (!config.headers) {
      config.headers = {} as any
    }
    // SSO headers 占位 - 后续按需接入
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    if (response?.config?.responseType === 'blob') {
      return response
    }
    if (response.status !== 200) {
      message.warning(response.data?.message || response.data?.msg)
    }
    return response.data
  },
  (error) => {
    if (axios.isCancel(error)) {
      console.log('Request cancelled', error.message)
    } else if (error.response) {
      switch (error.response.status) {
        case 401:
          message.warning('请重新登录')
          break
        case 403:
          window.location.hash = '#/404'
          message.warning('当前页面暂无权限！')
          break
        case 404:
          break
        default:
          message.error('服务器错误')
          break
      }
    }
    return Promise.reject(error)
  }
)

export const Get = (url: string, params: Record<string, any> = {}, config: AxiosRequestConfig = {}) => {
  return instance({ url, method: 'get', params, ...config })
}

export const Post = (url: string, data?: any, config: AxiosRequestConfig = {}) => {
  return instance.post(url, data, config)
}

export const Put = (url: string, data?: any, config: AxiosRequestConfig = {}) => {
  return instance.put(url, data, config)
}

export const Del = (url: string, params: Record<string, any> = {}) => {
  return instance.delete(url, { params })
}

export const Upload = (url: string, data: any, config: AxiosRequestConfig = {}) => {
  return instance.post(url, data, config)
}

export default instance
