// api.js
import { Get, Post } from "@/api/server"
import { botPrefix } from "@/constants"

// Prompt-查询详情
// GET /admin/prompt/debug/{skillNo}/{componentNo}/detail
export const fetchPromptDetail = (params) => {
  return Get(`${botPrefix}/admin/prompt/debug/${params.skillNo}/${params.componentNo}/detail`).then(
    (res) => res.data
  )
}

// Prompt-修改详情
// POST /admin/prompt/debug/{skillNo}/{componentNo}/save
export const savePromptDetail = (params) => {
  return Post(
    `${botPrefix}/admin/prompt/debug/${params.skillNo}/${params.componentNo}/save`,
    params
  ).then((res) => res)
}
