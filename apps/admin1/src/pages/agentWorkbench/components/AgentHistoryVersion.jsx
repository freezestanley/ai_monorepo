import { Button, Modal, Space, Table, Tooltip, Typography, message } from "antd"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"
import {
  useCopyAgentVersionNo,
  useDeleteAgentVersion,
  useEnableAgentVersion,
  useFetchAgentVersionList
} from "@/api/agent"
import { exportAgent } from "@/api/agent/api"
import useDownloaderModal from "@/components/DownloaderModal"

function AgentHistoryVersion({ agentData }) {
  const queryClient = useQueryClient()
  const { mutate: deleteAgentVersion, isLoading } = useDeleteAgentVersion()
  const { mutate: copyAgentVersionNo } = useCopyAgentVersionNo()
  const { mutate: enableAgentVersion } = useEnableAgentVersion()
  const { showModal, EditFilenameModal } = useDownloaderModal()

  const isLocked = false
  const { data: historyList, refetch } = useFetchAgentVersionList({
    agentNo: agentData?.agentNo
  })

  const handleLoad = (record) => {
    // 添加一次二次确认
    Modal.confirm({
      title: "提示",
      content: "当前未发布的配置内容将被覆盖，并无法找回，是否确认载入？",
      onOk: () => {
        copyAgentVersionNo(
          {
            agentNo: agentData?.agentNo,
            versionNo: record.versionNo
          },
          {
            onSuccess: (e) => {
              if (e.success) {
                window.location.reload()
                message.success(e.message)
              } else {
                message.error(e.message)
              }
            }
          }
        )
      }
    })
  }

  const handleEnable = (record) => {
    enableAgentVersion(
      {
        versionNo: record.versionNo,
        agentNo: agentData?.agentNo
      },
      {
        onSuccess: (e) => {
          if (e.success) {
            message.success(e.message)
            queryClient.invalidateQueries([QUERY_KEYS.AGENT_VERSION_LIST])
          } else {
            message.error(e.message)
          }
        }
      }
    )
  }

  const handleSetCurrent = (record) => {
    console.log("Set as current", record)
    // 添加二次确认
    Modal.confirm({
      title: "提示",
      content: "是否切换为默认版本？",
      onOk: () => {
        console.log(record)
        handleEnable(record)
      }
    })
  }

  const handleExport = async (record) => {
    const { agentNo, versionNo } = record
    const initialFilename = `${agentNo}-${versionNo}-copy`
    const filename = await showModal({ initialFilename, addonAfter: ".json" })
    exportAgent({
      agentNo,
      versionNo,
      defaultFilename: filename
    }).then((res) => {
      console.log(res)
    })
  }

  const handleDelete = (record) => {
    Modal.confirm({
      title: "确定删除?",
      content: "此操作不可逆，请确保您要删除此版本。",
      onOk: () => {
        deleteAgentVersion(
          {
            versionNo: record.versionNo,
            agentNo: agentData?.agentNo
          },
          {
            onSuccess: (e) => {
              if (e.success) {
                refetch()
                message.success("删除成功")
              } else {
                message.error(e.message)
              }
            }
          }
        )
      }
    })
  }

  const columns = [
    {
      title: "名称",
      dataIndex: "versionName",
      key: "versionName"
    },
    {
      title: "操作人",
      dataIndex: "modifier",
      key: "modifier"
    },
    {
      title: "更新时间",
      dataIndex: "gmtModified",
      key: "gmtModified"
    },
    {
      title: "状态",
      dataIndex: "releaseStatusDisplayName",
      key: "releaseStatusDisplayName",
      width: 80
    },
    {
      title: "备注",
      dataIndex: "description",
      key: "description",
      width: 80,
      render: (text, record) => {
        return (
          <Tooltip title={text}>
            <Typography.Paragraph style={{ whiteSpace: "normal" }} ellipsis={{ rows: 1 }}>
              {text}
            </Typography.Paragraph>
          </Tooltip>
        )
      }
    },
    {
      title: "操作",
      key: "action",
      render: (text, record) => (
        <div className="flex items-center">
          <Space>
            <Button
              disabled={isLocked}
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                handleLoad(record)
              }}
              type="link"
              className="p-0"
            >
              载入
            </Button>
            <Button onClick={() => handleExport(record)} type="link" className="p-0">
              导出
            </Button>
            <Button
              className="p-0"
              type="link"
              onClick={() => handleSetCurrent(record)}
              disabled={record.isCurrent || isLocked}
            >
              {record.isCurrent ? "当前" : "设为当前"}
            </Button>
            <Button
              onClick={() => handleDelete(record)}
              type="link"
              className="p-0"
              disabled={record.isCurrent}
            >
              删除
            </Button>
          </Space>
        </div>
      )
    }
  ]
  return (
    <>
      <Table
        columns={columns}
        dataSource={Array.isArray(historyList) ? historyList : []}
        rowKey="versionNo"
      />
      <EditFilenameModal />
    </>
  )
}

export default AgentHistoryVersion
