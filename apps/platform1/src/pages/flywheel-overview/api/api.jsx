import { Get, Post, Put, Delete, Upload } from "@/api/server"
import { botPrefix } from "@/constants"
import { message } from "antd"
const prefix = botPrefix

const flywheel = "/flywheel"
/**
 * 【增C】创建agent
 */
export const createAgent = ({ botNo, ...data }) => {
  return Post(`${prefix}/admin/${botNo}/agents`, data).then((res) => res)
}
/**
 * 业务总览 total-busine
 */

// export const totalbusine = ({ ...data }) => {
//   return Post(`${prefix}/api/total-business/overview`, data).then((res) => res)
// }
export const totalbusine = async ({ ...data }) => {
  return await Post(`${flywheel}/api/total-business/overview`, data)
}

/**
 * 问题分布接口文档
 */
export const problemdistribution = ({ botNo, ...data }) => {
  return Post(`${flywheel}/api/total-business/problem-distribution`, data).then((res) => res)
}

/**
 * 问题集群接口文档
 */
export const problemclusters = ({ botNo, ...data }) => {
  return Post(`${flywheel}/api/total-business/problem-clusters`, data).then((res) => res)
}

/**
 * 流失率趋势接口文档
 */
export const lossratetrend = ({ botNo, ...data }) => {
  return Post(`${flywheel}/api/total-business/loss-rate-trend`, data).then((res) => res)
}
