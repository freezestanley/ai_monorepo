import { getTokenAndServiceName } from "@/api/sso"
import { uploadStructureDatasetUrl } from "@/api/structureKnowledge/api"
import { botPrefix } from "@/constants"
import { DeleteOutlined, InboxOutlined } from "@ant-design/icons"
import { Form, Input, Popconfirm, Table, Tag, Upload } from "antd"
import React from "react"
import { useRef, useState } from "react"

const Dragger = Upload.Dragger
const EditableContext = React.createContext(null)

const EditableRow = ({ form, ...props }) => {
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  )
}

const EditableCell = ({ children, ...restProps }) => {
  return <td {...restProps}>{children}</td>
}

function DataDocUpload({ form, knowledgeBaseNo, catalogNo, setDocInfo, docInfo, onUploadFail }) {
  const uploadFileId = useRef(null)
  const uploadProps = {
    accept: ".xlsx,.xls",
    maxCount: 1,
    headers: {
      "X-Usercenter-Session": `${getTokenAndServiceName().token}`
    },
    action: uploadStructureDatasetUrl({
      knowledgeBaseNo,
      catalogNo
    }),
    beforeUpload: (file) => {
      uploadFileId.current = null
    },
    onChange(info) {
      console.log(info)
      if (info.file.status === "done") {
        // 文件上传成功后的回调函数
        console.log(`${info.file.name} file uploaded successfully`)
        uploadFileId.current = info.file.response.data
        if (info.file.response.success === true) {
          setDocInfo((prev) => {
            return {
              ...prev,
              uploadStatus: "1",
              documentName: info.file.name,
              documentNo: uploadFileId.current,
              size: info.file.size,
              rowId: info.file.uid
            }
          })
        } else {
          onUploadFail?.(info.file.response.message)
          setDocInfo((prev) => {
            return {
              ...prev,
              uploadStatus: "0",
              documentName: "",
              documentNo: "",
              size: 0
            }
          })
        }
      } else if (info.file.status === "error") {
        uploadFileId.current = null
        // 文件上传失败后的回调函数
        console.log(`${info.file.name} file upload failed.`)
        onUploadFail?.(info.file.response?.message || "文件上传失败，请检查网络或联系管理员")
      }
    }
  }

  const handleDelete = (key) => {
    setDocInfo({
      uploadStatus: "0",
      documentName: "",
      documentNo: "",
      size: 0
    })
  }
  const components = {
    body: {
      row: (props) => <EditableRow {...props} form={form} />,
      cell: (props) => <EditableCell {...props} />
    }
  }

  const defaultColumns = [
    {
      title: "数据集名称",
      dataIndex: "documentName",
      width: "250px",
      render: (text, record) => {
        return (
          <Form.Item
            name={[record.rowId, "documentName"]}
            initialValue={text}
            rules={[
              {
                required: true,
                message: `请输入数据集名称`
              }
            ]}
          >
            <Input placeholder="请输入数据集名称" />
          </Form.Item>
        )
      }
    },
    {
      title: "状态",
      dataIndex: "uploadStatus",
      width: "30px",
      render: (text, record) => {
        return (
          <>
            <Tag color="success">success</Tag>
            {/* <Tag color="processing">processing</Tag>
            <Tag color="error">error</Tag> */}
          </>
        )
      }
    },
    {
      title: "文件大小",
      dataIndex: "size",
      width: "30px",
      render: (text, record) => {
        return (text / 1024).toFixed(3) + " kb"
      }
    },
    {
      title: "操作",
      width: "30px",
      dataIndex: "operation",
      render: (_, record) => (
        <Popconfirm title="你确定要删除吗?" onConfirm={() => handleDelete(record.rowId)}>
          <a className=" cursor-pointer">
            <DeleteOutlined />
          </a>
        </Popconfirm>
      )
    }
  ]

  const columns = defaultColumns.map((col) => {
    if (!col.editable) {
      return col
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        rowId: record.rowId,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        message: col.message,
        placeholder: col.placeholder,
        required: col.required
      })
    }
  })

  console.log("docInfo:", docInfo)

  return (
    <div>
      {docInfo.uploadStatus === "0" && (
        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p>
            将文档拖拽到此处，或
            <span style={{ color: "#5E5FF8" }}>本地上传</span>
          </p>
        </Dragger>
      )}
      {docInfo.uploadStatus === "1" && (
        <div style={{ height: "118px" }}>
          <Table
            components={components}
            rowClassName={() => "editable-row"}
            bordered
            pagination={false}
            dataSource={[docInfo]}
            columns={columns}
            rowKey="rowId"
          />
        </div>
      )}
    </div>
  )
}

export default DataDocUpload
