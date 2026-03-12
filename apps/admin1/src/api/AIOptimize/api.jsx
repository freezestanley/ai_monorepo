import { Get, Post, Put } from "@/api/server"
import { botPrefix } from "@/constants"

const prefix = botPrefix

/**
 * 提示词优化
 * POST /admin/prompt/{intelligentAgentType}/{intelligentAgentNo}/optimize
 * @param {*} params
 */
export const optimizePrompt = ({ intelligentAgentType, intelligentAgentNo, ...data }) => {
  return Post(
    `${prefix}/admin/prompt/${intelligentAgentType}/${intelligentAgentNo}/optimize`,
    data
  ).then((res) => res)
}
