import { message } from "antd"

/**
 * @description: 数据异常提醒拦截器（下调位置，用于iframe）
 * @param {*} res
 * @return {*}
 */
export const infoInterceptorsLow = (res) => {
  // 配置 message 的全局样式，将其位置下调
  message.config({
    top: 60,
    duration: 3
  })
  if (res?.code != "200" && res?.status != 200) res?.message && message.warning(res?.message)
  return res
}
