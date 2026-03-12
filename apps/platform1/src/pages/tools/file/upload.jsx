import React, { useState } from "react"
import { InboxOutlined, SmileFilled, SmileOutlined, CopyOutlined } from "@ant-design/icons"
import { message, Upload, Image, Card, Typography } from "antd"
import { getTokenAndServiceName } from "@/api/sso"
const { Dragger } = Upload
const { Paragraph, Text } = Typography
function File() {
  const [fileList, setFileList] = useState([])
  const props = {
    name: "file",
    multiple: true,
    action: "/botWeb/admin/file/upload",
    headers: {
      "X-Usercenter-Session": getTokenAndServiceName().token
    },
    onChange(info) {
      const { status, response } = info.file
      if (status !== "uploading") {
        console.log(info.file, info.fileList)
      }
      if (status === "done") {
        setFileList([
          ...fileList,
          {
            url: response.data.temporarySignatureUrl,
            filename: response.data.objectKey
          }
        ])
        message.success(`${info.file.name} file uploaded successfully.`)
      } else if (status === "error") {
        message.error(`${info.file.name} file upload failed.`)
      }
    },
    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files)
    }
  }
  return (
    <div className=" pl-10 pr-10 pt-10 pb-10">
      <div className="pt-10 min-h-96">
        {fileList.map((imgItem) => {
          return (
            <Card title={imgItem.filename} style={{ width: 300 }}>
              <Image width={200} src={imgItem.url} key={imgItem.url} />
              <Paragraph
                ellipsis={true}
                className="mt-2"
                copyable={{
                  icon: [<CopyOutlined key="copy-icon" />, <CopyOutlined key="copied-icon" />],
                  tooltips: ["复制", "您已复制过!!"]
                }}
              >
                {imgItem.url}
              </Paragraph>
            </Card>
          )
        })}
      </div>
      <Dragger {...props}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Click or drag file to this area to upload</p>
        <p className="ant-upload-hint">
          Support for a single or bulk upload. Strictly prohibited from uploading company data or
          other banned files.
        </p>
      </Dragger>
    </div>
  )
}

export default File
