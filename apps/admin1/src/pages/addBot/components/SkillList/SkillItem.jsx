import { useState, useEffect } from "react"
import { Modal, Button, Switch, Typography, Popconfirm, Col, message, Divider, Tag } from "antd"
import { StarOutlined } from "@ant-design/icons"
import CopyToClipboard from "react-copy-to-clipboard"
import Tooltip from "antd/lib/tooltip"
import { useNavigate } from "react-router-dom"
import { useUpdateSkill, useCopySkill } from "@/api/skill"
import { fetchAgentReference } from "@/api/skill/api"
import { useCancelSubscribeApi } from "@/api/market"
import { useFetchPublishEntityChangeRecords } from "@/api/versionRelease"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { cancelBubble } from "@/utils"
import difyIcon from "@/assets/img/dify.png"
import skillAvater from "@/assets/img/skillAvater.png"
import { isStudio } from "@/config.env"
import { getDifyToken } from "@/components/CreateSkillStep"
import { useStudioPublishData } from "@/hooks/useStudioPublishData"
import { SKILL_TYPES } from "./index"

import "../SkillList.scss"

const { Text } = Typography

const SkillItem = ({
  currentBotNo,
  iframeStyle,
  skill,
  setSkillModalVisible,
  setCurrentSkill,
  setCurrentItem,
  setOpenDeleteModal,
  saveFilterState,
  parentOrigin,
  workbenchNo
}) => {
  const [modal, contextHolder] = Modal.useModal()
  const navigate = useNavigate()
  const [switchChecked, setSwitchChecked] = useState(skill.status === 1)

  const { studioenv, isOpenVersion, isPublishDisabled } = useStudioPublishData()

  useEffect(() => {
    setSwitchChecked((prev) => {
      if (prev !== skill.status) {
        return skill.status
      }
      return prev
    })
  }, [skill.status])

  const queryClient = useQueryClient()
  const { mutate: updateSkill } = useUpdateSkill()
  const { mutate: copySkill } = useCopySkill()
  const querySubscribedSkill = () =>
    queryClient.invalidateQueries([QUERY_KEYS.SUBSCRIBE_SKILL_LIST_BY_PAGE])
  const { mutate: mutateCancelSubscribe } = useCancelSubscribeApi(querySubscribedSkill)
  const { mutate: fetchPublishEntityChangeRecords } = useFetchPublishEntityChangeRecords()

  const handleEditSkill = async (skill) => {
    // 跳转前保存状态
    saveFilterState && saveFilterState()

    // 判断是否是dify
    if (skill.generateMethod === 2) {
      const difyData = await getDifyToken(currentBotNo)
      if (!difyData) return
      window.location.href = difyData.getDifyUrl(skill.difyWorkFlowId, skill.skillNo, isOpenVersion)
    } else {
      let subscribeSkillQuery = ``
      if (skill.type === "subscribed_skill") {
        subscribeSkillQuery += `&mode=showDetail&skillCanRead=${skill.canRead}`
      }
      const generateMethod = skill.generateMethod === 1 ? "AI" : "manual"
      navigate(
        `/editSkill?skillNo=${skill.skillNo}&isIframe=${iframeStyle}&botNo=${currentBotNo}${subscribeSkillQuery}&createMode=${generateMethod}&workbenchNo=${workbenchNo}&parentOrigin=${parentOrigin}&studioenv=${studioenv || ""}`
      )
    }
  }

  const handleSetCurrentSkill = (e, skill) => {
    cancelBubble(e)
    setCurrentSkill(skill)
    setSkillModalVisible(true)
  }

  const handleDelete = async (e, record) => {
    cancelBubble(e)
    const res = await fetchAgentReference({ skillNo: record.skillNo })
    if (res.success) {
      if (res.data.length) {
        modal.warning({
          title: "删除提醒",
          classNames: { content: "custom-modal-content" },
          content: (
            <>
              当前工作流已应用于以下Agent，不可删除！
              <p className="text-[#7f56d9]">{res.data?.map((v) => v.agentName)?.join("、")}</p>
            </>
          ),
          okText: "我知道了"
        })
      } else {
        setCurrentItem(record)
        setOpenDeleteModal(true)
      }
    } else {
      res.message && message.error(res.message)
    }
  }

  const onCancelSubscribe = async (e, skill) => {
    cancelBubble(e)
    return mutateCancelSubscribe({
      botNo: currentBotNo,
      bizType: "SKILL",
      bizNo: skill.bizNo
    })
  }

  const handleCopySkill = (e, skill) => {
    cancelBubble(e)
    modal.confirm({
      title: "复制工作流",
      content: "确定要复制该工作流吗？",
      okText: "确定",
      cancelText: "取消",
      onOk: () => {
        copySkill({
          skillNo: skill.skillNo
        })
      }
    })
  }

  const handleStatusChange = (checked) => {
    const newStatus = checked ? 1 : 0
    const confirmContent =
      newStatus === 1
        ? "启用后，将在应用端展示该工作流，是否确认？"
        : skill.isShare
          ? "该工作流为共享工作流，停用后订阅方将无法调用"
          : "停用后，应用端将不再展示该工作流，是否确认？"
    modal.confirm({
      title: "提示",
      content: confirmContent,
      onOk: () => {
        updateSkill(
          {
            skillNo: skill.skillNo,
            status: newStatus
          },
          {
            onSuccess: (e) => {
              if (e.success) {
                message.success(e.message)
                setSwitchChecked(checked)
                queryClient.invalidateQueries([QUERY_KEYS.SKILL_LIST_BY_PAGE])
              } else {
                message.error(e.message)
              }
            }
          }
        )
      },
      onCancel: () => {
        // 如果用户点击取消，不做任何操作
      }
    })
  }

  const handleSwitchChange = async (checked, skill, e) => {
    e.stopPropagation()
    if (!checked) {
      const res = await fetchAgentReference({ skillNo: skill.skillNo })
      if (res.success) {
        if (res.data.length) {
          modal.warning({
            title: "停用提醒",
            classNames: { content: "custom-modal-content" },
            content: (
              <>
                当前工作流已应用于以下Agent，不可停用！
                <p className="text-[#7f56d9]">{res.data?.map((v) => v.agentName)?.join("、")}</p>
              </>
            ),
            okText: "我知道了"
          })
        } else {
          handleStatusChange(checked)
        }
      } else {
        res.message && message.error(res.message)
      }
    } else {
      handleStatusChange(checked)
    }
  }

  const deactivate = (skill.status === 1 || skill.status === 0) && !switchChecked

  return (
    <Col xs={24} sm={12} md={12} lg={8} xl={8} xxl={6} key={skill.skillName}>
      <div
        className={`card-item skill-card-item cursor-pointer ${deactivate && "deactivate"}`}
        style={{ marginBottom: "20px" }}
        onClick={() => handleEditSkill(skill)}
      >
        <div className="flex justify-between items-start w-[100%]">
          <div className="flex-1 overflow-hidden">
            <div className="title w-[100%] mr-2 skill-item-text flex !items-start">
              <div className="flex items-center justify-center bg-[#EFEBFF] bg-opacity-50 w-[48px] h-[48px] rounded-[8px]">
                <img
                  src={skill.generateMethod === 2 ? difyIcon : skillAvater}
                  className="text-base-img"
                />
              </div>
              <div className="flex flex-1 flex-col items-start overflow-hidden">
                <div className="flex justify-between w-[100%]">
                  <div className="flex items-center flex-1 overflow-hidden">
                    <Tooltip title={skill.skillName}>
                      <Text className="text-base !text-gray-700">{skill.skillName}</Text>
                    </Tooltip>
                    <CopyToClipboard
                      text={skill.skillNo}
                      onCopy={() => message.success("复制成功")}
                    >
                      <Tooltip title={skill.skillNo}>
                        <Tag onClick={(e) => cancelBubble(e)} className="ml-2 !mr-0">
                          ID
                        </Tag>
                      </Tooltip>
                    </CopyToClipboard>
                  </div>
                  <div>
                    {skill.type === "subscribed_skill" ? (
                      // 兼容订阅工作流的显示
                      <span className={`subscribe-status ${skill.status === true && "using"}`}>
                        {skill.status === true ? "启用中" : "已停用"}
                      </span>
                    ) : skill.status === 1 || skill.status === 0 ? (
                      <Switch
                        size="small"
                        checked={switchChecked}
                        disabled={isPublishDisabled}
                        onChange={(checked, e) => handleSwitchChange(checked, skill, e)}
                        defaultChecked={skill.status === 1}
                      />
                    ) : (
                      <span
                        className={`status ${
                          skill.status === 2 ? "debug" : skill.status === 0 ? "not" : undefined
                        }`}
                      >
                        {skill.statusDisplayName}
                      </span>
                    )}
                  </div>
                </div>
                <Text
                  className="desc"
                  ellipsis={{
                    row: 1,
                    tooltip: skill.description
                  }}
                >
                  {skill.description || "这个人很懒，暂未填写描述～"}
                </Text>
              </div>
            </div>
            <div className="skill-item-text belongTo-botName mt-[12px]">
              <div className="time-tag">
                <span className="title">类型</span>
                <span className="time">
                  {skill.generateMethod === 2 ? (
                    <span className="beta-tag">Beta</span>
                  ) : (
                    SKILL_TYPES.find((type) => type.key === skill.type)?.label || "--"
                  )}
                </span>
              </div>
              <div className="time-tag">
                <span className="title">
                  {/* 最新发布 */}
                  最新发布
                </span>
                <span className="time">
                  {skill?.gmtModified ? skill?.gmtModified?.split(" ")?.[0] : "--"}
                </span>
              </div>
              {skill?.subscribeCount > 0 && (
                <div className="time-tag">
                  <span className="title">订阅</span>
                  <span className="time">{skill?.subscribeCount}</span>
                </div>
              )}
            </div>

            {/* {skill.type === "subscribed_skill" && (
                <div className="skill-item-text belongTo-botName">
                  <Tooltip title={skill.belongToBotName}>
                    来源：{skill.belongToBotName}
                  </Tooltip>
                </div>
              )} */}
          </div>
          {/* <div className="skill-type-badge">
            {typeMap[skill.type] || typeMap[skill.skillType] || skill.type}
          </div> */}
        </div>
        {/* mb-4 flex justify-between items-center absolute bottom-0 w-full */}
        <Divider className="!my-[12px] !mt-[18px]" />
        <div className="bottom-center">
          <div className="remove-btn">
            {/* skill.type === "subscribed_skill" */}
            {skill.type === "subscribed_skill" ? (
              // 订阅工作流
              <div className="remove-btn-insert">
                <div className="px-[12%] w-[100%] remove-btn-insert-sub">
                  {skill.isShare && (
                    <span className="subscribe-count">
                      <StarOutlined />
                      <span className="count-text">{skill.subscribeCount}</span>
                    </span>
                  )}
                  <Button
                    type="link"
                    className="p-0 !text-[#181B25] !hover:text-[#7F56D9] text-[12px]"
                    onClick={(e) => handleSetCurrentSkill(e, skill)}
                  >
                    <i className="iconfont icon-peizhi align-middle -mt-[1px] mr-[3px]"></i>
                    使用设置
                  </Button>
                  <Popconfirm
                    title=""
                    description="【取消订阅】后，将无法调用对应工作流"
                    onConfirm={(e) => onCancelSubscribe(e, skill)}
                    onPopupClick={(e) => cancelBubble(e)}
                    okText="是"
                    cancelText="否"
                  >
                    <Button
                      className="p-0 !text-[#181B25] !hover:text-[#7F56D9] text-[12px]"
                      type="link"
                      onClick={(e) => cancelBubble(e)}
                      disabled={isPublishDisabled}
                    >
                      <i className="iconfont icon-dingyue align-middle -mt-[1px] mr-[3px] text-[#F6B51E]"></i>
                      取消订阅
                    </Button>
                  </Popconfirm>
                </div>
              </div>
            ) : (
              <div className="remove-btn-insert">
                {skill.isShare && (
                  <span className="subscribe-count">
                    <StarOutlined />
                    <span className="count-text">{skill.subscribeCount}</span>
                  </span>
                )}
                <Button
                  type="link"
                  className="p-0 !text-[#181B25] !hover:text-[#7F56D9] text-[12px]"
                >
                  <i className="iconfont icon-bianji1 text-[#98A2B3] align-middle -mt-[1px] mr-[3px]"></i>
                  编辑
                </Button>
                <Button
                  type="link"
                  className="p-0 !text-[#181B25] !hover:text-[#7F56D9]  text-[12px]"
                  onClick={(e) => handleSetCurrentSkill(e, skill)}
                >
                  <i className="iconfont icon-peizhi text-[#98A2B3] align-middle -mt-[1px] mr-[3px]"></i>
                  设置
                </Button>

                <Button
                  type="link"
                  className="p-0 !text-[#181B25] !hover:text-[#7F56D9] text-[12px]"
                  disabled={isPublishDisabled}
                  onClick={(e) => handleCopySkill(e, skill)}
                >
                  <i className="iconfont icon-fuzhi text-[#98A2B3] text-[20px] align-middle mt-[1px] mr-[3px]"></i>
                  复制
                </Button>

                <Button
                  className="p-0  !text-[#181B25]  text-[12px]"
                  type="link"
                  disabled={isPublishDisabled}
                  onClick={(e) => handleDelete(e, skill)}
                >
                  <i className="iconfont icon-shanchu1 text-[#98A2B3] align-middle -mt-[1px] mr-[3px]"></i>
                  删除
                </Button>
              </div>
            )}
          </div>
        </div>
        {!!(isStudio() && skill?.ready2Delete) && (
          <div
            className="absolute w-[100%] h-[100%] bg-black bg-opacity-40 left-0 top-0 rounded-[12px] flex items-center justify-center cursor-auto"
            onClick={cancelBubble}
          >
            <div className="bg-white p-2 pl-[20px] pr-[20px] text-center rounded-[12px]">
              <p>已【删除】待发布</p>
              <Button
                type="link"
                className="!p-0 !h-auto mt-[8px]"
                onClick={() => {
                  fetchPublishEntityChangeRecords({
                    botNo: skill.botNo,
                    entityNo: skill.skillNo,
                    entityType: "SKILL"
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
    </Col>
  )
}

export default SkillItem
