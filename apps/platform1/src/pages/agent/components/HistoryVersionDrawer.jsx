import React, { useEffect, useState } from "react"
import {
  Drawer,
  Table,
  Button,
  Tag,
  message,
  Space,
  Popconfirm,
  Modal,
  Upload,
  Typography
} from "antd"
import { InboxOutlined } from "@ant-design/icons"
import {
  fetchAgentReleaseVersionList,
  deleteAgentReleaseVersion,
  enableAgentReleaseVersion,
  importAgentVersion,
  exportAgentVersion
} from "@/api/agent/api"
import { useStudioPublishData } from "@/hooks/useStudioPublishData"

const HistoryVersionDrawer = ({
  botNo,
  studioenv,
  open,
  onClose,
  agentNo,
  versionNo,
  insetCurrentVersion
}) => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [setCurrentLoading, setSetCurrentLoading] = useState(false)
  const [importModalVisible, setImportModalVisible] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)

  const { isPublishDisabled } = useStudioPublishData()

  const refreshList = () => {
    setLoading(true)
    fetchAgentReleaseVersionList({ agentNo })
      .then((res) => {
        setData(res?.data || [])
      })
      .catch(() => {
        message.error("获取历史版本失败")
      })
      .finally(() => setLoading(false))
  }
  useEffect(() => {
    if (open && agentNo) {
      refreshList()
    }
  }, [open, agentNo])

  // 处理导入新版本
  const handleImport = async () => {
    if (!uploadFile) {
      message.warning("请先选择要导入的文件")
      return
    }

    setImportLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", uploadFile)

      const res = await importAgentVersion({
        agentNo,
        versionNo: versionNo, // 使用固定的versionNo，后端应该能处理
        formData
      })
      if (res?.code == 200) {
        setImportModalVisible(false)
        setUploadFile(null)
        insetCurrentVersion(res?.data?.versionNo)
      } else {
        message.error("导入失败")
      }
      // refreshList() // 刷新列表
    } catch (error) {
      message.error(error?.message || "导入失败")
    } finally {
      setImportLoading(false)
    }
  }

  // 上传文件前的检查
  const beforeUpload = (file) => {
    const isJson = file.type === "application/json" || file.name.endsWith(".json")
    if (!isJson) {
      message.error("只支持JSON文件")
      return Upload.LIST_IGNORE
    }
    setUploadFile(file)
    return false // 阻止自动上传
  }

  // 上传状态变化处理
  const handleUploadChange = (info) => {
    if (info.file.status === "removed") {
      setUploadFile(null)
    }
  }

  // 处理导出版本
  const handleExport = async (record) => {
    try {
      await exportAgentVersion({
        botNo,
        studioenv,
        agentNo,
        versionNo: record.versionNo,
        versionName: record.versionName
      })
      message.success("导出成功")
    } catch (error) {
      message.error(error?.message || "导出失败")
    }
  }

  // 操作列需要用到agentNo，columns需放到组件内
  const columns = [
    {
      title: "Agent版本编号",
      dataIndex: "versionNo",
      key: "versionNo",
      width: 200
    },
    {
      title: "名称",
      dataIndex: "versionName",
      key: "versionName",
      width: 200,
      render: (text) => (
        <Typography.Paragraph style={{ margin: 0 }} ellipsis={{ rows: 1, tooltip: text }}>
          {text || "--"}
        </Typography.Paragraph>
      )
    },
    {
      title: "操作人",
      dataIndex: "modifierDisplayName",
      key: "modifierDisplayName",
      width: 120,
      ellipsis: true
    },
    {
      title: "发布时间",
      dataIndex: "gmtReleased",
      key: "gmtReleased",
      width: 160,
      render: (text) => (text ? new Date(text).toLocaleString() : "-")
    },
    {
      title: "状态",
      dataIndex: "releaseStatus",
      key: "releaseStatus",
      width: 100,
      render: (status, record) => {
        let color = "default"
        let label = status
        if (status === "draft") {
          color = "orange"
          label = "草稿"
        } else if (status === "released") {
          color = "green"
          label = "已发布"
        } else {
          color = "magenta"
          label = "待发布"
        }
        if (!record.inUse) {
          color = "default"
        }
        return <Tag color={color}>{label}</Tag>
      }
    },
    {
      title: "备注",
      dataIndex: "description",
      key: "description",
      width: 180,
      ellipsis: true,
      render: (text) => (
        <Typography.Paragraph style={{ margin: 0 }} ellipsis={{ rows: 1, tooltip: text }}>
          {text || "-"}
        </Typography.Paragraph>
      )
    },

    {
      title: "操作",
      key: "action",
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="确认导出当前版本吗？"
            okText="确定导出"
            cancelText="取消"
            onConfirm={() => handleExport(record)}
          >
            <Button size="small" type="link">
              导出
            </Button>
          </Popconfirm>
          <Popconfirm
            title="确认载入当前版本吗？"
            okText="确定载入"
            cancelText="取消"
            onConfirm={async () => {
              insetCurrentVersion(record.versionNo)
            }}
          >
            <Button size="small" type="link" disabled={isPublishDisabled}>
              载入
            </Button>
          </Popconfirm>

          {/* {record.inUse ? (
            <Button size="small" disabled type="link">
              当前
            </Button>
          ) : (
            <Popconfirm
              title="确定将该版本设为当前版本吗？"
              okText="设为当前"
              cancelText="取消"
              onConfirm={async () => {
                setSetCurrentLoading(true)
                try {
                  await enableAgentReleaseVersion({ agentNo, versionNo: record.versionNo })
                  message.success("设为当前成功")
                  refreshList()
                } catch (e) {
                  message.error(e?.message || "设为当前失败")
                } finally {
                  setSetCurrentLoading(false)
                }
              }}
            >
              <Button size="small" type="link" loading={setCurrentLoading}>
                设为当前
              </Button>
            </Popconfirm>
          )} */}
          {/* <Popconfirm
            title="确定要删除该历史版本吗？"
            okText="删除"
            cancelText="取消"
            onConfirm={async () => {
              setDeleteLoading(true)
              try {
                await deleteAgentReleaseVersion({ agentNo, versionNo: record.versionNo })
                message.success("删除成功")
                refreshList()
              } catch (e) {
                message.error(e?.message || "删除失败")
              } finally {
                setDeleteLoading(false)
              }
            }}
          >
            <Button disabled={record.inUse} size="small" danger type="link" loading={deleteLoading}>
              删除
            </Button>
          </Popconfirm> */}
        </Space>
      )
    }
  ]

  return (
    <Drawer
      title={
        <div className="flex items-center justify-between w-full">
          <span>历史版本记录</span>
          <Button disabled={isPublishDisabled} onClick={() => setImportModalVisible(true)}>
            导入新版本
          </Button>
        </div>
      }
      placement="left"
      width={1000}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      <Table
        rowKey="versionNo"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={false}
        scroll={{ x: 900, y: 520 }}
      />
      {/* 导入新版本Modal */}
      <Modal
        title="导入新版本"
        open={importModalVisible}
        onCancel={() => {
          setImportModalVisible(false)
          setUploadFile(null)
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setImportModalVisible(false)
              setUploadFile(null)
            }}
          >
            取消
          </Button>,
          <Button
            key="import"
            type="primary"
            loading={importLoading}
            onClick={handleImport}
            disabled={!uploadFile}
          >
            导入
          </Button>
        ]}
      >
        <Upload.Dragger
          name="file"
          multiple={false}
          beforeUpload={beforeUpload}
          onChange={handleUploadChange}
          showUploadList={true}
          fileList={uploadFile ? [uploadFile] : []}
          accept=".json"
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
          <p className="ant-upload-hint">支持JSON格式文件</p>
        </Upload.Dragger>
      </Modal>
    </Drawer>
  )
}

export default HistoryVersionDrawer
