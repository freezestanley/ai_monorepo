import React, { useState, useMemo } from "react"
import { Table, Button, Tag, Tooltip, Dropdown, Popconfirm, message, Modal, Radio } from "antd"
import { useNavigate } from "react-router-dom"
import CopyToClipboard from "react-copy-to-clipboard"
import { StarOutlined, EllipsisOutlined } from "@ant-design/icons"
import { useCancelSubscribeApi } from "@/api/market"
import { useCopyAgent } from "@/api/agent"
import { useFetchPublishEntityChangeRecords } from "@/api/versionRelease"
import { useQueryClient } from "@tanstack/react-query"
import defaultOldUrl from "@/assets/img/agentAvater.png"
import defaultImg from "@/assets/img/agentAvater-new.png?url"
import { getMaterialUrl, getAgentzUrl, isStudio } from "@/config.env"
import { cancelBubble } from "@/utils"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { deepCopyAgent } from "@/api/agent/api"
import { isAdmin } from "@/api/agent/api"
import { useStudioPublishData } from "@/hooks/useStudioPublishData"
import { getVoiceMode } from "./AgentSection"

const defautOldUrl =
  "http://za-aigc-platform-test.oss-cn-hzjbp-b-internal.aliyuncs.com/txrzvjbtpbiqi.png?Expires=1744448056&OSSAccessKeyId=LTAI5tMugme8cECmAEPFEd1r&Signature=Rpq1ixYX2ulI00Fwjnsc6BTzo7g%3D"

const defaultOldUrl2 =
  "http://za-aigc-platform-test.oss-cn-hzjbp-b-internal.aliyuncs.com/txryvhwxsvhme.jpg?Expires=1744446759&OSSAccessKeyId=LTAI5tMugme8cECmAEPFEd1r&Signature=kGkh96QoJtK3LNXDU%2FBEBTDJnHc%3D"

const defaultOldUrl3 =
  "http://za-aigc-platform-test.oss-cn-hzjbp-b-internal.aliyuncs.com/tyjtezebcyhyu.jpeg?Expires=1745045297&OSSAccessKeyId=LTAI5tMugme8cECmAEPFEd1r&Signature=uWvIqKr6XXzhek%2B5Db7x7NuWRpI%3D"

const COPY_TYPE = {
  NORMAL: "normal",
  DEEP: "deep"
}

const AgentTable = ({
  agentModeList,
  agents,
  tabValue,
  currentBotNo,
  workbenchNo,
  iframeStyle,
  parentOrigin,
  token,
  saveFilterState,
  setCurrentItem,
  setOpenDeleteModal,
  setEditingAgent,
  setCreateAgentVisible
}) => {
  const [modal, contextHolder] = Modal.useModal()
  const [copyLoading, setCopyLoading] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { isPublishDisabled, studioenv } = useStudioPublishData()

  // 改为刷新 Agent 列表
  const queryAgentList = () => queryClient.invalidateQueries([QUERY_KEYS.AGENT_LIST])
  const { mutate: mutateCancelSubscribe } = useCancelSubscribeApi(queryAgentList)
  const { mutate: mutateCopyAgent } = useCopyAgent()
  const { mutate: fetchPublishEntityChangeRecords } = useFetchPublishEntityChangeRecords()

  // 受控复制弹窗相关 state
  const [copyModalVisible, setCopyModalVisible] = useState(false)
  const [copyType, setCopyType] = useState(COPY_TYPE.NORMAL)
  const [copyAgentData, setCopyAgentData] = useState(null)
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [isAdminLoading, setIsAdminLoading] = useState(false)

  const handleEditAgent = (agent) => {
    // 跳转前保存当前筛选状态
    saveFilterState()
    // 材料分类
    if (agent?.agentMode === 3) {
      window.location.href = `${getMaterialUrl()}/agent?botNo=${currentBotNo}&agentNo=${agent.agentNo}&token=${token || ""}`
      return
    }
    // 材料智能采集
    if (agent?.agentMode === 5) {
      window.location.href = `${getMaterialUrl()}/extractAgent?botNo=${currentBotNo}&agentNo=${agent.agentNo}&token=${token || ""}`
      return
    }
    // 数据
    if (agent?.agentMode === 6) {
      window.location.href = `${getAgentzUrl()}/agentz/create/agent?botNo=${currentBotNo}&agentNo=${agent.agentNo}&serviceName=za-open-bot&token=${token || ""}`
      return
    }
    let subscribeSkillQuery = ``
    if (agent.type === "subscribed_agent") {
      subscribeSkillQuery += `&mode=showDetail&agentCanRead=${agent.canRead}`
    }

    // agent2.0
    if (agent?.agentMode === 7) {
      navigate(
        `/agent/detailv2?agentNo=${agent.agentNo}${subscribeSkillQuery}&isIframe=${iframeStyle}&botNo=${currentBotNo}&workbenchNo=${workbenchNo}&parentOrigin=${parentOrigin}&agentMode=${agent?.agentMode || undefined}&originalAgentNo=${agent.originalAgentNo || undefined}&isCanEditByCurrentUser=${agent?.isCanEditByCurrentUser || false}&studioenv=${studioenv || ""}`
      )
      return
    }

    navigate(
      `/agent/detail?agentNo=${agent.agentNo}${subscribeSkillQuery}&isIframe=${iframeStyle}&botNo=${currentBotNo}&workbenchNo=${workbenchNo}&parentOrigin=${parentOrigin}&agentMode=${agent?.agentMode || undefined}&originalAgentNo=${agent.originalAgentNo || undefined}&isCanEditByCurrentUser=${agent?.isCanEditByCurrentUser || false}&studioenv=${studioenv || ""}`
    )
  }

  const handleDelete = (record) => {
    setCurrentItem(record)
    setOpenDeleteModal(true)
  }

  const handleEditClick = (agent) => {
    setEditingAgent(agent)
    setCreateAgentVisible(true)
  }

  const onCancelSubscribe = async (agent) => {
    return mutateCancelSubscribe({
      botNo: currentBotNo,
      bizType: "AGENT",
      bizNo: agent.bizNo
    })
  }

  // Agent复制功能
  const handleCopyAgent = async (agent) => {
    setCopyType(COPY_TYPE.NORMAL)
    setCopyAgentData(agent)
    // 只有在 agentMode === 1 且 type === 'single_agent_skill_mode' 时才请求 isAdmin
    if (agent.agentMode == 1 && agent.type === "single_agent_skill_mode") {
      setIsAdminLoading(true)
      try {
        const res = await isAdmin({ botNo: currentBotNo })
        setIsAdminUser(res?.data === true)
      } catch {
        setIsAdminUser(false)
      } finally {
        setIsAdminLoading(false)
        setCopyModalVisible(true)
      }
    } else {
      setCopyModalVisible(true)
    }
  }

  const handleCopyOk = async () => {
    if (!copyAgentData) return
    const botNo = currentBotNo
    const agentNo = copyAgentData.agentNo
    const showCopyType =
      copyAgentData.agentMode === 1 && copyAgentData.type === "single_agent_skill_mode"
    try {
      setCopyLoading(true)
      if (showCopyType && copyType === COPY_TYPE.DEEP) {
        await deepCopyAgent({ botNo, agentNo })
      } else {
        mutateCopyAgent({ botNo, agentNo })
      }
      queryAgentList()
      message.success("复制成功")
      setCopyModalVisible(false)
    } catch (error) {
      message.error(error.message || "复制失败")
    } finally {
      setCopyLoading(false)
    }
  }

  const isValidHttpUrl = (string) => {
    try {
      return string?.startsWith("http://") || string?.startsWith("https://")
    } catch {
      return false
    }
  }

  const getIconUrl = (iconUrl) => {
    if (iconUrl === defautOldUrl || iconUrl === defaultOldUrl2 || iconUrl === defaultOldUrl3) {
      return defaultImg
    }
    if (isValidHttpUrl(iconUrl)) {
      return iconUrl
    }
    if (iconUrl?.includes("/agentAvater") && !iconUrl?.includes("/agentAvater-new")) {
      return defaultOldUrl
    }
    return defaultImg
  }

  // 语音直接跳转数据报表
  const handleReportClick = (agent) => {
    localStorage.setItem("aigc_voice_agent_report", true)
    handleEditAgent(agent)
  }

  const columns = [
    {
      title: "Agent",
      dataIndex: "agentName",
      key: "agentName",
      width: 300,
      render: (text, record) => (
        <div className="flex items-center">
          <div className="agent-icon-container mr-3">
            <img src={getIconUrl(record.icon)} alt="agent icon" />
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center">
              <Tooltip title={record.agentName}>
                <span className="font-medium text-gray-900 mr-2 truncate">{record.agentName}</span>
              </Tooltip>
              <CopyToClipboard text={record.agentNo} onCopy={() => message.success("复制成功")}>
                <Tooltip title={record.agentNo}>
                  <Tag size="small" className="cursor-pointer">
                    ID
                  </Tag>
                </Tooltip>
              </CopyToClipboard>
            </div>
            <div className="text-gray-500 text-sm mt-1 truncate">
              {record.description || "这个人很懒，暂未填写描述～"}
            </div>
          </div>
        </div>
      )
    },
    {
      title: "类型",
      dataIndex: "agentMode",
      key: "agentMode",
      width: 120,
      render: (agentMode, record) => (
        <span className="text-gray-600">
          {record.type === "subscribed_agent"
            ? "订阅Agent"
            : agentModeList?.find((v) => v.value === agentMode)?.label?.replace("Agent", "") +
                (getVoiceMode(record) ? `-${getVoiceMode(record)}` : "") || "--"}
        </span>
      )
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status, record) =>
        record.type === "subscribed_agent" ? (
          <span
            className={`status-tag ${status === true ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
          >
            {status === true ? "启用中" : "已停用"}
          </span>
        ) : (
          <span className="status-tag bg-blue-100 text-blue-800">正常</span>
        )
    },
    {
      title: "更新时间",
      dataIndex: "gmtModified",
      key: "gmtModified",
      width: 120,
      render: (time) => <span className="text-gray-600">{time ? time.split(" ")?.[0] : "--"}</span>
    },
    {
      title: "订阅数",
      dataIndex: "subscribeCount",
      key: "subscribeCount",
      width: 80,
      render: (count) =>
        count > 0 ? (
          <span className="text-gray-600">{count}</span>
        ) : (
          <span className="text-gray-400">--</span>
        )
    },
    {
      title: "操作",
      key: "action",
      width: 200,
      render: (_, record) => (
        <div className="flex items-center space-x-2">
          {record.type === "subscribed_agent" ? (
            <>
              {record.isShare && (
                <span className="flex items-center text-orange-500 mr-2">
                  <StarOutlined className="mr-1" />
                  <span className="text-xs">{record.subscribeCount}</span>
                </span>
              )}
              <Popconfirm
                title="取消订阅"
                description="【取消订阅】后，将无法调用对应工作流"
                onConfirm={() => onCancelSubscribe(record)}
                okText="是"
                cancelText="否"
              >
                <Button
                  type="link"
                  size="small"
                  className="text-orange-500"
                  disabled={isPublishDisabled}
                >
                  取消订阅
                </Button>
              </Popconfirm>
            </>
          ) : (
            <div className="flex items-center">
              <Button
                type="link"
                size="small"
                onClick={() => handleEditAgent(record)}
                className="text-blue-600"
              >
                编辑
              </Button>

              {![6].includes(record?.agentMode) && (
                <>
                  {record?.agentMode == 2 ? (
                    <Button
                      type="link"
                      size="small"
                      onClick={() => handleReportClick(record)}
                      className="text-blue-600"
                    >
                      数据
                    </Button>
                  ) : (
                    <Button
                      type="link"
                      size="small"
                      onClick={() => handleEditClick(record)}
                      className="text-blue-600"
                    >
                      设置
                    </Button>
                  )}

                  {[1].includes(record?.agentMode) && (
                    <Button
                      type="link"
                      size="small"
                      loading={copyLoading}
                      disabled={isPublishDisabled}
                      onClick={() => handleCopyAgent(record)}
                      className="text-blue-600"
                    >
                      复制
                    </Button>
                  )}

                  {[2].includes(record?.agentMode) && (
                    <Button
                      type="link"
                      size="small"
                      onClick={() => handleEditClick(record)}
                      className="text-blue-600"
                    >
                      设置
                    </Button>
                  )}

                  {record?.agentMode == 2 ? (
                    <Dropdown
                      menu={{
                        items: [
                          {
                            key: "1",
                            label: (
                              <Button
                                type="link"
                                loading={copyLoading}
                                disabled={isPublishDisabled}
                                onClick={() => handleCopyAgent(record)}
                                className="text-blue-600"
                              >
                                复制
                              </Button>
                            )
                          },
                          {
                            key: "2",
                            label: (
                              <Button
                                type="link"
                                disabled={isPublishDisabled}
                                onClick={() => handleDelete(record)}
                                className="text-red-600"
                              >
                                删除
                              </Button>
                            )
                          }
                        ]
                      }}
                      placement="bottomLeft"
                    >
                      <Button type="link" size="small" className="text-gray-600">
                        <EllipsisOutlined />
                      </Button>
                    </Dropdown>
                  ) : (
                    <Button
                      type="link"
                      size="small"
                      disabled={isPublishDisabled}
                      onClick={() => handleDelete(record)}
                      className="text-red-600"
                    >
                      删除
                    </Button>
                  )}
                </>
              )}
              {!!(isStudio() && record?.ready2Delete) && (
                <div
                  className="absolute w-[100%] h-[100%] bg-black bg-opacity-40 left-0 top-0 flex items-center justify-center cursor-auto"
                  onClick={cancelBubble}
                >
                  <div className="bg-white p-2 pl-[50px] pr-[50px] text-center rounded-[12px]">
                    <p>已【删除】待发布</p>
                    <Button
                      type="link"
                      className="!p-0 !h-auto mt-[4px]"
                      onClick={() => {
                        fetchPublishEntityChangeRecords({
                          botNo: record.botNo,
                          entityNo: record.agentNo,
                          entityType: "AGENT"
                        })
                      }}
                    >
                      取消删除
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )
    }
  ]

  return (
    <>
      <Table
        columns={columns}
        dataSource={agents}
        rowKey={(record, index) => `${record.agentNo}-${index}`}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} 共 ${total} 条`
        }}
        scroll={{ x: 1200 }}
        className="agent-table skill-table"
        onRow={(record) => ({
          style: { cursor: "pointer" },
          onClick: (event) => {
            // 如果点击的是操作按钮，不触发行点击事件
            if (event.target.closest(".ant-btn") || event.target.closest(".ant-dropdown")) {
              return
            }
            handleEditAgent(record)
          }
        })}
      />

      {contextHolder}

      {/* 受控复制弹窗 */}
      <Modal
        open={copyModalVisible}
        title="复制确认"
        onOk={handleCopyOk}
        onCancel={() => setCopyModalVisible(false)}
        okText="确认"
        cancelText="取消"
        confirmLoading={copyLoading}
      >
        <div>确定要复制这个Agent吗？</div>
        {copyAgentData &&
          copyAgentData.agentMode == 1 &&
          copyAgentData.type === "single_agent_skill_mode" &&
          isAdminUser && (
            <div className="mt-3 bg-gray-100 px-4 p-2 pb-3 rounded-md">
              <Radio.Group
                value={copyType}
                onChange={(e) => setCopyType(e.target.value)}
                className="flex flex-col gap-4 mt-2"
              >
                <Radio value={COPY_TYPE.NORMAL}>
                  仅复制Agent
                  <Tooltip title="工作流/常量变更，Agent 同步更新">
                    <span className="ml-1 text-gray-500 cursor-pointer">
                      <i className="iconfont icon-yiwen text-gray-500 text-[16px]align-middle mt-1 mr-[3px]"></i>
                    </span>
                  </Tooltip>
                </Radio>
                <Radio value={COPY_TYPE.DEEP}>
                  全链路复制Agent
                  <Tooltip title="仅保存复制当下信息，不随工作流/常量作同步变更">
                    <span className="ml-1 text-gray-500 cursor-pointer">
                      <i className="iconfont icon-yiwen text-gray-500 text-[16px] align-middle mt-1 mr-[3px]"></i>
                    </span>
                  </Tooltip>
                </Radio>
              </Radio.Group>
            </div>
          )}
      </Modal>
    </>
  )
}

export default AgentTable
