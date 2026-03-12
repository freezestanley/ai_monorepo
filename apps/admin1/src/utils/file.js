/*
 * @Author: Dyton
 * @Date: 2024-04-09 14:04:36
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-04-11 10:09:46
 * @FilePath: /za-aigc-platform-admin-static/src/utils/file.js
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import { getTokenAndServiceName } from "@/api/sso"
import fileDownload from "js-file-download"

export const sftpUrl = "https://static.zhongan.com/website/cs/aigc/static"

const getBlob = (url) => {
  return new Promise((resolve) => {
    // mock 备份的_XMLHttpRequest
    // @ts-ignore
    const cloneXMLHttpRequest = window?._XMLHttpRequest
    const xmlHttpRequest = cloneXMLHttpRequest ?? XMLHttpRequest
    const xhr = new xmlHttpRequest()
    xhr.open("GET", url, true)
    xhr.responseType = "blob"
    // header添加token字段
    xhr.setRequestHeader("X-Service-Name", getTokenAndServiceName().serviceName)
    xhr.setRequestHeader("X-Usercenter-Session", getTokenAndServiceName().token)
    xhr.onload = () => {
      if (xhr.status === 200) resolve(xhr.response)
    }
    xhr.send()
  })
}
/**
 * @description: excel下载
 * @param {*} sftpPath
 * @param {*} fileName
 * @return {*}
 */
export const handleDownloadExcel = (sftpPath, fileName = "模板") => {
  const name = fileName?.includes(".xl") ? fileName : `${fileName}.xlsx`
  getBlob(sftpPath).then((blob) => {
    fileDownload(blob, name)
  })
}
