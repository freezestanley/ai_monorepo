import { Post, Put, Delete } from "@/api/server"
import { botPrefix } from "@/constants"
const prefix = botPrefix

export const createApplication = (data) => {
  return Post(`${prefix}/admin/application/add`, data).then((res) => res)
}

export const fetchApplicationList = (params) => {
  return Post(`${prefix}/admin/application/page`, params).then((res) => res.data)
}

export const updateApplication = (data) => {
  return Put(`${prefix}/admin/application/update`, data).then((res) => res)
}

export const updateApplicationStatus = ({ appNo, status }) => {
  return Put(`${prefix}/admin/application/status/${appNo}`, { status }).then((res) => res)
}

export const deleteApplication = (appNo) => {
  return Delete(`${prefix}/admin/application/${appNo}`).then((res) => res)
}
