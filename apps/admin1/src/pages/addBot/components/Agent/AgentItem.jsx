import {
  Button,
  Typography,
  Col,
  Tag,
  Modal,
  Popconfirm,
  message,
  Radio,
  Tooltip,
  Dropdown
} from "antd"
import { useNavigate } from "react-router-dom"
import CopyToClipboard from "react-copy-to-clipboard"
import { StarOutlined, EllipsisOutlined, LoadingOutlined } from "@ant-design/icons"
import { useCancelSubscribeApi } from "@/api/market"
import { useCopyAgent } from "@/api/agent"
import { useFetchPublishEntityChangeRecords } from "@/api/versionRelease"
import { useQueryClient } from "@tanstack/react-query"
import defaultOldUrl from "@/assets/img/agentAvater.png"
import defaultImg from "@/assets/img/agentAvater-new.png?url"
import { getMaterialUrl, getAgentzUrl, isStudio } from "@/config.env"
import { cancelBubble } from "@/utils"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { useState } from "react"
import { useMemo } from "react"
import { deepCopyAgent } from "@/api/agent/api"
import { isAdmin } from "@/api/agent/api"
import { useStudioPublishData } from "@/hooks/useStudioPublishData"
import { getVoiceMode } from "./AgentSection"

const { Text } = Typography

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

const AgentItem = ({
  agentModeList,
  agent,
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

  const { isPublishDisabled, studioenv } = useStudioPublishData()

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

    // 标准 agent
    // if (agent?.agentMode === 1) {
    //   navigate(
    //     `/agent/detail?agentNo=${agent.agentNo}${subscribeSkillQuery}&isIframe=${iframeStyle}&botNo=${currentBotNo}&workbenchNo=${workbenchNo}&parentOrigin=${parentOrigin}&agentMode=${agent?.agentMode || undefined}&originalAgentNo=${agent.originalAgentNo || undefined}&isCanEditByCurrentUser=${agent?.isCanEditByCurrentUser || false}&studioenv=${studioenv || ""}`
    //   )
    //   return
    // }

    navigate(
      `/agent/detail?agentNo=${agent.agentNo}${subscribeSkillQuery}&isIframe=${iframeStyle}&botNo=${currentBotNo}&workbenchNo=${workbenchNo}&parentOrigin=${parentOrigin}&agentMode=${agent?.agentMode || undefined}&originalAgentNo=${agent.originalAgentNo || undefined}&isCanEditByCurrentUser=${agent?.isCanEditByCurrentUser || false}&studioenv=${studioenv || ""}`
    )
  }

  const handleDelete = (e, record) => {
    cancelBubble(e)
    setCurrentItem(record)
    setOpenDeleteModal(true)
  }
  // 语音直接跳转数据报表
  const handleReportClick = (e, agent) => {
    localStorage.setItem("aigc_voice_agent_report", true)
    handleEditAgent(agent)
  }

  const handleEditClick = (e, agent) => {
    cancelBubble(e)
    setEditingAgent(agent)
    setCreateAgentVisible(true)
  }

  const onCancelSubscribe = async (e, agent) => {
    cancelBubble(e)
    return mutateCancelSubscribe({
      botNo: currentBotNo,
      bizType: "AGENT",
      bizNo: agent.bizNo
    })
  }

  // Agent复制功能
  const handleCopyAgent = async (e, agent) => {
    cancelBubble(e)
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

  const iconUrlData = useMemo(() => {
    const url =
      agent.icon === defautOldUrl || agent.icon === defaultOldUrl2 || agent.icon === defaultOldUrl3
        ? defaultImg
        : isValidHttpUrl(agent.icon)
          ? agent.icon
          : agent.icon?.includes("/agentAvater") && !agent.icon?.includes("/agentAvater-new")
            ? defaultOldUrl
            : defaultImg
    return {
      icon: url,
      styles: url === defaultOldUrl ? { width: "30px" } : {}
    }
  }, [agent.icon])

  const deactivate = false
  const agentTypeLabel =
    agent.type === "subscribed_agent"
      ? "订阅Agent"
      : agentModeList?.find((v) => v.value === agent.agentMode)?.label?.replace("Agent", "") +
          (getVoiceMode(agent) ? `-${getVoiceMode(agent)}` : "") || "--"
  const updateDate = agent?.gmtModified ? agent.gmtModified.split(" ")?.[0] : "--"
  const actionButtonClass =
    "flex h-8 w-8 items-center justify-center rounded-lg text-[#98A2B3] " +
    "transition-colors hover:bg-[#F3F0FF] hover:text-[#8C55EC]"

  return (
    <Col xs={24} sm={12} md={12} lg={8} xl={8} xxl={8} key={agent.agentName}>
      <div
        className={[
          "card-item agent-card-item group cursor-pointer relative",
          deactivate && "deactivate",
          "!h-full !rounded-[20px] !border !border-[#f1f2f4] !bg-white !p-6 shadow-sm",
          "transition-all duration-200 hover:!border-[#8c55ec]/40 hover:!shadow-md"
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={() => handleEditAgent(agent)} //() => agent?.agentMode !== 2 &&
      >
        <div className="mb-5 flex items-start gap-5 w-[100%]">
          <div className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-2xl bg-[#f4f7ff] shadow-sm">
            <img
              style={iconUrlData.styles}
              src={iconUrlData.icon}
              alt="agent icon"
              className="w-12"
            />
          </div>
          <div className="min-w-0 flex-1">
            {agent?.belongToBotName && (
              <div className="mb-2">
                <span className="inline-flex rounded-md bg-[#EBF5FF] px-2 py-0.5 text-[11px] font-bold text-[#1E8EFE]">
                  {agent.belongToBotName}
                </span>
              </div>
            )}
            <div className="mb-3 flex items-center gap-2 truncate w-[100%]">
              <CopyToClipboard text={agent.agentNo} onCopy={() => message.success("复制成功")}>
                <Tooltip title={agent.agentNo}>
                  <Tag
                    onClick={(e) => cancelBubble(e)}
                    className="!m-0 !rounded !border-[#DEE0E3] !px-1 !py-0 !text-[10px] !font-bold !text-[#8F959E]"
                  >
                    ID
                  </Tag>
                </Tooltip>
              </CopyToClipboard>
              <Tooltip title={agent.agentName}>
                <div className="!m-0 min-w-0 flex-1 truncate text-[18px] font-bold leading-tight w-[300px] text-[#1A1C1E]">
                  {agent.agentName}
                </div>
              </Tooltip>
              {agent.type === "subscribed_agent" && (
                <span className={`subscribe-status ml-auto ${agent.status === true && "using"}`}>
                  {agent.status === true ? "启用中" : "已停用"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-[#BBBFC4] -ml-2">
              {agent.type === "subscribed_agent" ? (
                <>
                  {agent.isShare && (
                    <span className="inline-flex items-center gap-1 text-sm text-[#7f56d9]">
                      <StarOutlined />
                      {agent.subscribeCount}
                    </span>
                  )}
                  <Popconfirm
                    title=""
                    description="【取消订阅】后，将无法调用对应工作流"
                    onConfirm={(e) => onCancelSubscribe(e, agent)}
                    onPopupClick={(e) => cancelBubble(e)}
                    okText="是"
                    cancelText="否"
                  >
                    <Button
                      className="!h-8 !rounded-lg !px-3 !text-xs !font-semibold !text-[#181B25] hover:!text-[#7F56D9]"
                      type="link"
                      onClick={(e) => cancelBubble(e)}
                      disabled={isPublishDisabled}
                    >
                      <i className="iconfont icon-dingyue mr-1 text-[#F6B51E]"></i>
                      取消订阅
                    </Button>
                  </Popconfirm>
                </>
              ) : (
                <>
                  <div
                    className={actionButtonClass}
                    onClick={(e) => {
                      cancelBubble(e)
                      handleEditAgent(agent)
                    }}
                  >
                    <i className="iconfont icon-bianji1 text-base leading-none"></i>
                  </div>
                  {![6].includes(agent?.agentMode) && (
                    <>
                      {agent?.agentMode == 2 ? (
                        <div
                          className={actionButtonClass}
                          onClick={(e) => handleReportClick(e, agent)}
                        >
                          <i className="iconfont icon-shujubaobiao text-base leading-none"></i>
                        </div>
                      ) : (
                        <div
                          className={actionButtonClass}
                          onClick={(e) => handleEditClick(e, agent)}
                        >
                          <i className="iconfont icon-shezhi text-base leading-none !text-[14px]"></i>
                        </div>
                      )}

                      {agent?.agentMode == 2 && (
                        <div
                          className={actionButtonClass}
                          onClick={(e) => handleEditClick(e, agent)}
                        >
                          <i className="iconfont icon-shezhi text-base leading-none !text-[14px]"></i>
                        </div>
                      )}

                      {[1, 2].includes(agent?.agentMode) && (
                        <div
                          className={`${actionButtonClass} ${
                            copyLoading || isPublishDisabled ? "pointer-events-none opacity-50" : ""
                          }`}
                          onClick={(e) => handleCopyAgent(e, agent)}
                        >
                          {copyLoading ? (
                            <LoadingOutlined className="text-base leading-none" />
                          ) : (
                            <i className="iconfont icon-fuzhi text-base leading-none !text-[18px]"></i>
                          )}
                        </div>
                      )}

                      <div
                        className={`${actionButtonClass} ${
                          isPublishDisabled ? "pointer-events-none opacity-50" : ""
                        } hover:!bg-red-50 hover:!text-[#F54A45]`}
                        onClick={(e) => handleDelete(e, agent)}
                      >
                        <i className="iconfont icon-shanchu1 text-base leading-none"></i>
                      </div>

                      {agent?.agentMode == 2 && (
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
                                    onClick={(e) => handleCopyAgent(e, agent)}
                                    className="p-0 !text-[#181B25] !hover:text-[#7F56D9] text-[12px]"
                                  >
                                    <i className="iconfont icon-fuzhi text-[#98A2B3] text-[22px] align-middle -mt-[0px] mr-[1px]"></i>
                                    复制
                                  </Button>
                                )
                              }
                            ]
                          }}
                          placement="bottomLeft"
                        >
                          <div
                            className={actionButtonClass}
                            onClick={(e) => {
                              cancelBubble(e)
                              return false
                            }}
                          >
                            <EllipsisOutlined className="text-base leading-none" />
                          </div>
                        </Dropdown>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
            <div className="mt-4 text-[13px] text-[#8F959E]">更新时间：{updateDate}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex rounded-full bg-[#FFF0F6] px-3 py-1 text-[11px] font-bold text-[#FF4D94]">
                类型：{agentTypeLabel}
              </span>
              {agent?.subscribeCount > 0 && (
                <span className="inline-flex rounded-full bg-[#F3F0FF] px-3 py-1 text-[11px] font-bold text-[#8C55EC]">
                  订阅：{agent.subscribeCount}
                </span>
              )}
            </div>
          </div>
        </div>

        <div
          className="mt-auto flex items-center justify-between  w-[100%] border-[#F5F6F7] pt-5"
          style={{ borderTop: "1px solid #F5F6F7" }}
        >
          <span className="text-[15px] font-bold text-[#333538]">查看Agent</span>
          <i className="iconfont icon-youjiantou text-[14px] text-[#8C55EC] opacity-0 -translate-x-1 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
        </div>
        {!!(isStudio() && agent?.ready2Delete) && (
          <div
            className="absolute left-0 top-0 flex h-full w-full cursor-auto items-center justify-center rounded-[20px] bg-black/40"
            onClick={cancelBubble}
          >
            <div className="bg-white p-2 pl-[20px] pr-[20px] text-center rounded-[12px]">
              <p>已【删除】待发布</p>
              <Button
                type="link"
                className="!p-0 !h-auto mt-[8px]"
                onClick={() => {
                  fetchPublishEntityChangeRecords({
                    botNo: agent.botNo,
                    entityNo: agent.agentNo,
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
    </Col>
  )
}

export default AgentItem
