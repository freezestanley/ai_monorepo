import { Get, Post, Put, Delete, Patch } from "@/api/server"
import { botPrefix } from "@/constants"
const prefix = botPrefix
export const fetchRobotsList = ({ botNo, searchText }) => {
  return Post(`${prefix}/admin/${botNo}/robot/list`, { searchText }).then((res) => res.data)
}

export const updateRobotStatus = ({ botNo, robotNo, status }) => {
  return Put(`${prefix}/admin/${botNo}/robot/${robotNo}/updateStatus/${status}`).then((res) => res)
}

export const updateRobotBaseSetting = ({ botNo, robotNo, ...data }) => {
  return Put(`${prefix}/admin/${botNo}/robot/${robotNo}/base/update`, data).then((res) => res)
}
export const updateRobotUsingSetting = ({ botNo, robotNo, status }) => {
  return Put(`${prefix}/admin/${botNo}/robot/${robotNo}/showUpdate/${status}`).then((res) => res)
}
