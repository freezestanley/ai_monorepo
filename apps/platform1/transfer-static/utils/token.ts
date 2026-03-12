import Cookies from "js-cookie"
import { SESSION_ID, TICKET_KEY, UNSAFE_SESSION_ID, WEIXIN_SESSION_ID } from "../constants/cache"

const SESSION_OPTIONS: any = { sameSite: "None", secure: true }

export function getTicket() {
  return Cookies.get(TICKET_KEY)
}

export function removeTicket() {
  localStorage.removeItem(SESSION_ID)
  Cookies.remove(SESSION_ID)
  Cookies.remove(UNSAFE_SESSION_ID)
  return Cookies.remove(TICKET_KEY)
}

export function removeQueryParam(url: string, param: string) {
  const urlObj = new URL(url)
  const searchParams = new URLSearchParams(urlObj.search)

  searchParams.delete(param) // 删除指定参数

  urlObj.search = searchParams.toString() // 更新查询参数部分

  return urlObj.toString() // 返回更新后的 URL 字符串
}

export function removeQueryParams(url: string, params: string[]) {
  let newUrl = url
  params.forEach((param) => {
    newUrl = removeQueryParam(newUrl, param)
  })
  return newUrl
}

export function getQueryParameters(): Record<string, string> {
  const search = window.location.search.substring(1)
  const params: Record<string, string> = {}

  if (!search) {
    return params
  }

  const urlSearchParams = new URLSearchParams(search)

  urlSearchParams.forEach((value, key) => {
    params[key] = value
  })

  return params
}
