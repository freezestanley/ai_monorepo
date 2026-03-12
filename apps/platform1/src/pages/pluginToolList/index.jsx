import styles from "./index.module.scss"
import { useState, useMemo } from "react"
import {
  Popconfirm,
  message,
  Table,
  Pagination,
  Tooltip,
  Button,
  Breadcrumb,
  Empty,
  Spin,
  Tag,
  Modal
} from "antd"
import { FormOutlined } from "@ant-design/icons"
import { useLocation, useNavigate, useParams, Link } from "react-router-dom"
import queryString from "query-string"
import { useFetchPluginInfo, useFetchToolList } from "@/api/pluginTool"
import { updateToolStatus, fetchPluginToolReference } from "@/api/pluginTool/api"
import pluginIcon from "@/assets/img/tool.png"
import StatusSwitch from "./components/StatusSwitch"
import PluginEditModal from "@/components/PluginEditModal"
import McpToolModal from "./components/McpToolModal"
import { useInitPublishData, useStudioPublishData } from "@/hooks/useStudioPublishData"

const debugStatusMap = {
  noDebug: "未调试",
  pass: "通过",
  failed: "失败"
}

function PluginToolList(props) {
  const { pluginNo } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)
  const { botNo, studioenv } = queryParams
  console.log("pluginNo: ", pluginNo)
  console.log("botNo: ", botNo)
  const [modal, contextHolder] = Modal.useModal()
  const [pluginModalVisible, setPluginModalVisible] = useState(false)
  const [mcpToolModalVisible, setMcpToolModalVisible] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const { data: pluginInfo = {}, refetch: refetchPluginInfo } = useFetchPluginInfo({
    botNo,
    pluginNo
  })

  // 获取版本发布配置数据
  useInitPublishData()
  const { isPublishDisabled } = useStudioPublishData()

  const {
    data: { records: tableList = [], total } = {},
    isLoading,
    refetch: refetchToolList
  } = useFetchToolList({
    pluginNo: pluginNo,
    pageNum: pagination.current,
    pageSize: pagination.pageSize
  })
  const isEmpty = useMemo(() => {
    return tableList.length === 0
  }, [tableList])

  const columns = [
    {
      title: "工具名称",
      dataIndex: "toolName",
      key: "toolName",
      width: 300
    },
    {
      title: "输入参数",
      dataIndex: "inputVariables",
      key: "inputVariables",
      render: (value) => {
        if (value && value.length) {
          const count = value.length
          const max = 2
          return value.map((v, i) => {
            if (i < max) {
              return (
                <Tag className="my-1" color="default">
                  {v.variableName}
                </Tag>
              )
            } else if (i + 1 === value.length) {
              return (
                <Tooltip title={value.map((item) => item.variableName).join("、")}>
                  <Tag className="my-1" color="default">{`+${count - max}`}</Tag>
                </Tooltip>
              )
            }
          })
        }
        return "--"
      }
    },
    {
      title: "调试状态",
      dataIndex: "debugStatus",
      key: "debugStatus",
      render: (text, record) => (
        <Tag
          bordered={false}
          color={text === "noDebug" ? "processing" : text === "pass" ? "success" : "error"}
        >
          {debugStatusMap[text]}
        </Tag>
      )
    },
    {
      title: "创建时间",
      dataIndex: "gmtCreated",
      key: "gmtCreated"
    },
    {
      title: "启用",
      dataIndex: "enabled",
      key: "enabled",
      render: (_, record) => (
        <StatusSwitch
          record={record}
          handleStatusChange={handleStatusChange}
          disabled={isPublishDisabled}
        />
      )
    },
    {
      title: "操作",
      key: "operation",
      // fixed: "right",
      width: isPublishDisabled ? 200 : 180,
      render: (_, record) => (
        <>
          {!!isPublishDisabled && (
            <Button type="link" size="small" onClick={() => onEditTool(record, true)}>
              查看
            </Button>
          )}
          <Tooltip
            title={record.debugStatus === "configMissing" ? "请先完善工具参数配置" : undefined}
          >
            <Button
              type="link"
              size="small"
              onClick={() => handleDebug(record)}
              disabled={record.debugStatus === "configMissing"}
            >
              调试
            </Button>
          </Tooltip>
          <Button
            type="link"
            size="small"
            onClick={() => onEditTool(record)}
            disabled={isPublishDisabled}
          >
            编辑
          </Button>
          <Popconfirm
            title="删除这个工具？"
            okText="确定"
            cancelText="取消"
            onConfirm={async () => {
              await onDeleteTool(record)
            }}
          >
            <Button type="link" size="small" disabled={isPublishDisabled}>
              删除
            </Button>
          </Popconfirm>
        </>
      )
    }
  ]

  const handleUpdateToolStatus = async ({ toolNo, operateType }) => {
    const res = await updateToolStatus({
      pluginNo,
      toolNo,
      operateType
    })
    if (res.success) {
      message.success(res.message)
      refetchToolList()
    } else {
      message.error(res.message)
    }
    return res
  }

  // 状态改变的处理
  const handleStatusChange = async (record) => {
    console.log("record: ", record)
    if (record.enabled !== true) {
      return await handleUpdateToolStatus({
        toolNo: record.toolNo,
        operateType: record.enabled ? "disable" : "enable"
      })
    }
    const res = await fetchPluginToolReference({
      botNo,
      toolNo: record.toolNo,
      pluginNo: record.pluginNo
    })
    let data
    if (res.success) {
      if (res.data.agentResponse?.length || res.data.skillInfoVOS?.length) {
        modal.warning({
          title: "停用提醒",
          classNames: { content: "custom-modal-content" },
          content: (
            <>
              当前工具已应用于以下Agent/工作流，不可停用！
              {!!res.data.agentResponse?.length && (
                <p className="text-[#7f56d9]">
                  Agent：{res.data.agentResponse?.map((v) => v.agentName)?.join("、")}
                </p>
              )}
              {!!res.data.skillInfoVOS?.length && (
                <p className="text-[#7f56d9]">
                  工作流：{res.data.skillInfoVOS?.map((v) => v.skillName)?.join("、")}
                </p>
              )}
            </>
          ),
          okText: "我知道了"
        })
      } else {
        data = await handleUpdateToolStatus({
          toolNo: record.toolNo,
          operateType: record.enabled ? "disable" : "enable"
        })
      }
    } else {
      res.message && message.error(res.message)
    }
    return data
  }

  const onDeleteTool = async (record) => {
    const res = await fetchPluginToolReference({
      botNo,
      toolNo: record.toolNo,
      pluginNo: record.pluginNo
    })
    if (res.success) {
      if (res.data.agentResponse?.length || res.data.skillInfoVOS?.length) {
        modal.warning({
          title: "删除提醒",
          classNames: { content: "custom-modal-content" },
          content: (
            <>
              当前工具已应用于以下Agent/工作流，不可删除！
              {!!res.data.agentResponse?.length && (
                <p className="text-[#7f56d9]">
                  Agent：{res.data.agentResponse?.map((v) => v.agentName)?.join("、")}
                </p>
              )}
              {!!res.data.skillInfoVOS?.length && (
                <p className="text-[#7f56d9]">
                  工作流：{res.data.skillInfoVOS?.map((v) => v.skillName)?.join("、")}
                </p>
              )}
            </>
          ),
          okText: "我知道了"
        })
      } else {
        await handleUpdateToolStatus({
          toolNo: record.toolNo,
          operateType: "delete"
        })
      }
    } else {
      res.message && message.error(res.message)
    }
  }

  const onEditTool = (record, isView = false) => {
    console.log("编辑工具:", record)

    // 获取工具类型，优先使用工具自身的类型
    // 由于工具没有记录type字段，使用插件的type作为判断依据
    // 真实场景中应该从工具记录中获取实际类型
    const toolType = pluginInfo.type === "MCP" ? "MCP" : "NORMAL"

    // 如果是MCP类型，需要存储工具信息到sessionStorage
    if (toolType === "MCP") {
      try {
        const storageKey = `mcp_tool_${record.toolNo}`

        // 确保工具数据中包含完整信息
        const toolData = {
          ...record,
          type: toolType
        }

        sessionStorage.setItem(storageKey, JSON.stringify(toolData))
        console.log("已保存工具数据到sessionStorage用于编辑", storageKey, toolData)
      } catch (err) {
        console.error("保存工具数据到sessionStorage失败", err)
      }
    }
    let url = `/plugin/tools?pluginNo=${pluginNo}&step=1&toolNo=${record.toolNo}&botNo=${botNo}&type=${toolType}&studioenv=${studioenv || ""}`
    isView && (url += `&isView=${isView}`)
    // 构建URL并导航，添加type参数
    navigate(url)
  }

  const handleDebug = (record) => {
    const toolType = pluginInfo.type === "MCP" ? "MCP" : "NORMAL"

    // 如果是MCP类型，需要存储工具信息到sessionStorage
    if (toolType === "MCP") {
      try {
        const storageKey = `mcp_tool_${record.toolNo}`

        // 确保工具数据中包含完整信息
        const toolData = {
          ...record,
          type: toolType
        }

        sessionStorage.setItem(storageKey, JSON.stringify(toolData))
        console.log("已保存工具数据到sessionStorage用于编辑", storageKey, toolData)
      } catch (err) {
        console.error("保存工具数据到sessionStorage失败", err)
      }
    }
    const url = `/plugin/tools?pluginNo=${pluginNo}&step=4&toolNo=${record.toolNo}&botNo=${botNo}&type=${toolType}&studioenv=${studioenv || ""}&isView=true`
    navigate(url)
  }

  const onCreateTool = () => {
    if (pluginInfo.type === "MCP") {
      setMcpToolModalVisible(true)
    } else {
      navigate(
        `/plugin/tools?pluginNo=${pluginNo}&step=1&botNo=${botNo}&type=NORMAL&studioenv=${studioenv || ""}`
      )
    }
  }

  // 处理MCP工具选择
  const handleMcpToolSelect = (tool) => {
    console.log("选择的MCP工具:", tool)

    // 保存选中的工具数据到sessionStorage
    try {
      const storageKey = `mcp_tool_${tool.toolNo}`
      sessionStorage.setItem(storageKey, JSON.stringify(tool))
      console.log("已保存MCP工具数据到sessionStorage", storageKey)
    } catch (err) {
      console.error("保存MCP工具数据到sessionStorage失败", err)
    }

    setMcpToolModalVisible(false)

    // 构建URL并导航
    const url = `/plugin/tools?pluginNo=${pluginNo}&step=1&botNo=${botNo}&type=MCP&mcpToolNo=${tool.toolNo}&studioenv=${studioenv || ""}`
    console.log("跳转URL:", url)
    navigate(url)
  }

  return (
    <div className={styles["plugin-tool-list"]}>
      <Breadcrumb
        items={[
          {
            title: (
              <Link to={`/plugins-management?botNo=${botNo}&studioenv=${studioenv || ""}`}>
                工具
              </Link>
            )
          },
          {
            title: (
              <Tooltip title={pluginInfo?.name}>
                <span className="overflow-ellipsis" style={{ maxWidth: "300px" }}>
                  {pluginInfo?.name}
                </span>
              </Tooltip>
            )
          }
        ]}
      />
      <div className={styles["header"]}>
        <div className={styles["header-space"]}>
          <img className={styles["plugin-img"]} src={pluginIcon} />
          <div className={styles["plugin-info"]}>
            <div className={styles["info-top"]}>
              <Tooltip title={pluginInfo?.name}>
                <span className={`${styles["plugin-name"]} overflow-ellipsis`}>
                  {pluginInfo?.name}
                </span>
              </Tooltip>
              {!isPublishDisabled && (
                <FormOutlined
                  className={styles["edit-icon"]}
                  onClick={() => setPluginModalVisible(true)}
                />
              )}
            </div>
            <div className={styles["info-bot"]}>
              <Tooltip title={pluginInfo?.description}>
                <span className={`${styles["plugin-desc"]} overflow-ellipsis`}>
                  {pluginInfo?.description}
                </span>
              </Tooltip>
            </div>
          </div>
        </div>
        <div className={styles["header-space"]}>
          {!isEmpty && (
            <Button onClick={onCreateTool} disabled={isPublishDisabled}>
              创建工具
            </Button>
          )}
        </div>
      </div>

      {isEmpty ? (
        <div className={styles["empty-wrap"]}>
          <Empty description="暂无工具" />
          <Button type="primary" onClick={onCreateTool} disabled={isPublishDisabled}>
            创建工具
          </Button>
        </div>
      ) : (
        <Spin spinning={isLoading}>
          <div className={styles["table-title"]}>工具列表</div>
          <Table
            columns={columns}
            dataSource={tableList}
            pagination={false}
            scroll={{ y: 600 }}
            className="pb-4"
          />
          <Pagination
            // className="fixed-pagination"
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={total}
            onChange={(page, pageSize) => setPagination({ current: page, pageSize })}
            showSizeChanger={true}
            style={{ marginTop: "15px", textAlign: "right" }}
            showTotal={(total) => `共 ${total} 条`}
          />
        </Spin>
      )}

      <PluginEditModal
        visible={pluginModalVisible}
        mode="modify"
        botNo={botNo}
        pluginInfo={pluginInfo}
        onClose={() => {
          setPluginModalVisible(false)
        }}
        onSuccess={() => {
          setPluginModalVisible(false)
          refetchPluginInfo()
        }}
      />

      {mcpToolModalVisible && (
        <McpToolModal
          visible={mcpToolModalVisible}
          pluginNo={pluginNo}
          botNo={botNo}
          onClose={() => setMcpToolModalVisible(false)}
          onSelect={handleMcpToolSelect}
        />
      )}
      {contextHolder}
    </div>
  )
}

export default PluginToolList
