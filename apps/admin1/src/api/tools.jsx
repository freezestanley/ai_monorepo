import { message } from "antd"
import { getTokenAndServiceName } from "./sso"

export const handleChangeRequestHeader = (config) => {
  config["xxxx"] = "xxx"
  return config
}

export const handleConfigureAuth = (config) => {
  config.headers["token"] = localStorage.getItem("token") || ""
  return config
}

export const handleNetworkError = (errStatus) => {
  const networkErrMap = {
    400: "错误的请求", // token 失效
    401: "未授权，请重新登录",
    403: "拒绝访问",
    404: "请求错误，未找到该资源",
    405: "请求方法未允许",
    408: "请求超时",
    500: "服务器端出错",
    501: "网络未实现",
    502: "网络错误",
    503: "服务不可用",
    504: "网络超时",
    505: "http版本不支持该请求"
  }
  if (errStatus) {
    message.error(networkErrMap[errStatus] ?? `其他连接错误 --${errStatus}`)
    return
  }

  message.error("无法连接到服务器！")
}

export const handleAuthError = (errno) => {
  const authErrMap = {
    10031: "登录失效，需要重新登录", // token 失效
    10032: "您太久没登录，请重新登录~", // token 过期
    10033: "账户未绑定角色，请联系管理员绑定角色",
    10034: "该用户未注册，请联系管理员注册用户",
    10035: "code 无法获取对应第三方平台用户",
    10036: "该账户未关联员工，请联系管理员做关联",
    10037: "账号已无效",
    10038: "账号未找到"
  }

  if (authErrMap.hasOwnProperty(errno)) {
    message.error(authErrMap[errno])
    // 授权错误，登出账户
    return false
  }

  return true
}

export const handleGeneralError = (errno, errmsg) => {
  if (errno !== "0") {
    message.error(errmsg)
    return false
  }

  return true
}

export function generateRandom64BitNumber() {
  let array = new Uint32Array(2)
  window.crypto.getRandomValues(array)

  // 将两个32位数连结以形成64位整数
  return BigInt(array[0]) + (BigInt(array[1]) << BigInt(32))
}

export function downloadFile(url, filename) {
  const link = document.createElement("a")
  link.href = url
  // @ts-ignore
  link.download = filename || true // This makes it download instead of opening it
  document.body.appendChild(link) // Necessary for Firefox
  link.click()
  document.body.removeChild(link)
}

export function flattenRoutes(routes) {
  return routes.reduce((flattened, route) => {
    flattened.push(route)
    if (route.children) {
      flattened = flattened.concat(flattenRoutes(route.children))
    }
    return flattened
  }, [])
}

// 用于检查侧边栏是否当前有焦点
export function isSidebarFocused() {
  // 获取侧边栏元素
  const sidebarElement = document.querySelector(".xflow-json-schema-form.xflow-workspace-panel")

  // 获取当前页面上的活动元素（即有焦点的元素）
  const activeElement = document.activeElement

  // 检查活动元素是否是侧边栏或侧边栏的子元素
  return (
    sidebarElement && (sidebarElement === activeElement || sidebarElement.contains(activeElement))
  )
}

export function isCanvasFocused() {
  // 获取侧边栏元素
  const sidebarElement = document.querySelector(".xflow-x6-canvas.x6-graph.x6-graph-pannable")
  // 获取当前页面上的活动元素（即有焦点的元素）
  const activeElement = document.activeElement

  // 检查活动元素是否是侧边栏或侧边栏的子元素
  return (
    sidebarElement && (sidebarElement === activeElement || sidebarElement.contains(activeElement))
  )
}

export function downloadFileWithHeaders(
  url,
  name = "importTemplate.xlsx",
  method = "Get",
  body = {}
) {
  const requestOptions = {
    method,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "X-Usercenter-Session": getTokenAndServiceName().token
    }
  }

  if (method !== "Get" && method !== "HEAD") {
    requestOptions.body = JSON.stringify(body)
  }

  return fetch(url, requestOptions)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok")
      }
      return response.blob()
    })
    .then((blob) => {
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)

      // 可以设置下载的文件名
      link.download = name

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => {
        // 最好在完成下载后释放URL，以释放内存
        window.URL.revokeObjectURL(link.href)
      }, 100)
    })
    .catch((error) => {
      console.error("There has been a problem with your fetch operation:", error)
    })
}

export const findItemsInTree = (data, keys) => {
  if (!data || !keys || !Array.isArray(keys) || keys.length === 0) {
    return null
  }

  let result = null

  function traverse(node) {
    if (!node || result) {
      return
    }

    if (keys.includes(node.catalogNo)) {
      result = node
      return
    }

    if (Array.isArray(node.children)) {
      node.children.forEach((child) => {
        traverse(child)
      })
    }
  }

  if (Array.isArray(data.children)) {
    data.children.forEach((item) => {
      traverse(item)
    })
  }

  return result
}

// 递归地根据路径获取或设置数组/对象中的值
export const getByPath = (data, path) => {
  let item = data
  for (let i = 0; i < path.length; i++) {
    item = item[path[i]]
  }
  return item
}

export const setByPath = (data, path, value) => {
  if (path.length === 0) return value

  // 这里我们创建一个新的对象或数组，以确保不会修改原始数据
  const newData = Array.isArray(data) ? [...data] : { ...data }
  let item = newData

  for (let i = 0; i < path.length - 1; i++) {
    item[path[i]] = Array.isArray(item[path[i]]) ? [...item[path[i]]] : { ...item[path[i]] }
    item = item[path[i]]
  }
  item[path[path.length - 1]] = value
  return newData
}

export const removeByPath = (data, path) => {
  if (path.length === 0) return

  const newData = Array.isArray(data) ? [...data] : { ...data }
  let item = newData

  for (let i = 0; i < path.length - 1; i++) {
    item[path[i]] = Array.isArray(item[path[i]]) ? [...item[path[i]]] : { ...item[path[i]] }
    item = item[path[i]]
  }
  if (Array.isArray(item)) {
    item.splice(path[path.length - 1], 1)
  } else {
    delete item[path[path.length - 1]]
  }
  return newData
}

// 移动数组元素的辅助函数
export const moveItem = (arr, from, direction) => {
  if (!arr || arr.length <= 1) return arr

  const newArr = [...arr]
  const targetIndex = direction === "up" ? from - 1 : from + 1
  const item = newArr.splice(from, 1)[0]
  newArr.splice(targetIndex, 0, item)
  return newArr
}

export const formatRoleNames = (roleNames, maxDisplay = 10) => {
  const displayedRoles = roleNames.slice(0, maxDisplay)
  const displayedText = displayedRoles.join("<br />")

  // 如果角色总数超过最大显示数量，添加省略号并准备完整的 Tooltip 文本
  if (roleNames.length > maxDisplay) {
    return {
      displayedText: displayedText + "...", // 添加省略号
      tooltipText: roleNames.join(",") // Tooltip 显示所有角色名称
    }
  }
  return { displayedText }
}

/**
 * @description: 数据异常提醒拦截器
 * @param {*} res
 * @return {*}
 */
export const infoInterceptors = (res) => {
  if (res?.code != "200" && res?.status != 200) res?.message && message.warning(res?.message)
  return res
}

/**
 * @description: mutationCallback
 * @param {*} cb
 * @return {*}
 */
export const mutationCallback = (cb = () => {}) => ({
  onSuccess: (d) => {
    if (d?.code == 200) {
      // @ts-ignore
      d?.message && message.success(d?.message)
      cb(d)
    } else {
      d?.message && message.warning(d?.message)
    }
  },
  onError: (e) => {
    // @ts-ignore
    e?.message && message.error(e?.message)
  }
})
