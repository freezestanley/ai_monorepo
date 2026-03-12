import { getEnv, isIntl } from "@/api/sso"

const difyUrls = {
  dev: "http://4311884-za-aigc-dify-web.test.za.biz",
  test: "https://aigc-test.zhonganonline.com",
  pre: "https://aigc-pre.zhonganonline.com",
  prd: "https://aigc.zhonganonline.com"
}

const difyIntlUrls = {
  uat: "https://aigc-dify-uat.in.za",
  prd: "https://aigc-dify.in.za"
}

export function getDifyUrl() {
  const currentEnv = getEnv()
  const url = "/dify"
  const res = isIntl()
    ? difyIntlUrls[currentEnv] || difyIntlUrls["uat"]
    : (difyUrls[currentEnv] || difyUrls["test"]) + url
  return res
}

const materialUrls = {
  dev: "https://material-engine-test.zhonganonline.com",
  test: "https://material-engine-test.zhonganonline.com",
  pre: "https://material-engine-pre.zhonganonline.com",
  prd: "https://material-engine.zhonganonline.com"
}

export function getMaterialUrl() {
  const currentEnv = getEnv()
  return materialUrls[currentEnv] || materialUrls["test"]
}

const agentzUrls = {
  dev: "https://agentz-test.zhonganonline.com",
  test: "https://agentz-test.zhonganonline.com",
  pre: "https://agentz-pre.zhonganonline.com",
  prd: "https://agentz.zhonganonline.com"
}

export function getAgentzUrl() {
  const currentEnv = getEnv()
  return agentzUrls[currentEnv] || agentzUrls["test"]
}

const qaUrls = {
  dev: "http://4318994-za-aigc-platform-static.test.za.biz/qa", //"http://localhost:5174",
  test: "http://4318994-za-aigc-platform-static.test.za.biz/qa",
  pre: "https://aigc-pre.zhonganonline.com/qa",
  prd: "https://aigc.zhonganonline.com/qa"
}

export function getQaUrl() {
  const currentEnv = getEnv()
  const envUrl = qaUrls[currentEnv] || qaUrls["test"]
  const overrideUrl = import.meta?.env?.VITE_QA_URL
  const rawUrl = overrideUrl || envUrl
  return rawUrl.replace(/\/$/, "")
}

// 判断是否是灰度发布环境
export function isStudio() {
  if (typeof window === "object") {
    if (import.meta.env.MODE === "studio") {
      return true
    }
    if (/lingxi.*\.zhonganonline\.com$/.test(location.hostname)) {
      return true
    }
    if (location.hostname.includes("studio")) {
      return true
    }
  }
  return false
}
