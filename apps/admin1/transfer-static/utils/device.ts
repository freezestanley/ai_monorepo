/**
 * 通过 ua 判断是否为微信，支持传入 ua，这样就可以在 ssr 时运行
 * https://gist.github.com/GiaoGiaoCat/fff34c063cf0cf227d65
 */
export function isWeChat(userAgent?: string) {
  if (userAgent) {
    return /micromessenger/.test(userAgent.toLowerCase())
  }
  if (typeof window !== 'undefined') {
    return /micromessenger/.test(window.navigator.userAgent.toLowerCase())
  }

  return false
}

// 检查是否在企微环境
export const isWeChatEnv = () => /MicroMessenger/i.test(window.navigator.userAgent)

export const getEnvironment = (): { isWeChatEnv: boolean; isMobile: boolean } => {
  // 检查是否是移动设备
  const isMobile = /iphone|ipad|ipod|android/i.test(window.navigator.userAgent)

  return { isWeChatEnv: isWeChatEnv(), isMobile }
}
