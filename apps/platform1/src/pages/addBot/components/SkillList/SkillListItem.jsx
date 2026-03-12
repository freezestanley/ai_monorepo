import { useState, useMemo } from "react"
import { Modal, Button, Switch, Typography, Popconfirm, message, Tag, Space, Table } from "antd"
import { StarOutlined, SettingOutlined, CopyOutlined, DeleteOutlined } from "@ant-design/icons"
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

const SkillTable = ({
  skills,
  currentBotNo,
  iframeStyle,
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

  const queryClient = useQueryClient()
  const { mutate: updateSkill } = useUpdateSkill()
  const { mutate: copySkill } = useCopySkill()
  const querySubscribedSkill = () =>
    queryClient.invalidateQueries([QUERY_KEYS.SUBSCRIBE_SKILL_LIST_BY_PAGE])
  const { mutate: mutateCancelSubscribe } = useCancelSubscribeApi(querySubscribedSkill)
  const { mutate: fetchPublishEntityChangeRecords } = useFetchPublishEntityChangeRecords()

  const { studioenv, isOpenVersion, isPublishDisabled } = useStudioPublishData()

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
    e?.stopPropagation()
    setCurrentSkill(skill)
    setSkillModalVisible(true)
  }

  const handleDelete = async (e, record) => {
    e?.stopPropagation()
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
    e?.stopPropagation()
    return mutateCancelSubscribe({
      botNo: currentBotNo,
      bizType: "SKILL",
      bizNo: skill.bizNo
    })
  }

  const handleCopySkill = (e, skill) => {
    e?.stopPropagation()
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

  const handleStatusChange = (checked, skill) => {
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
    e?.stopPropagation()
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
          handleStatusChange(checked, skill)
        }
      } else {
        res.message && message.error(res.message)
      }
    } else {
      handleStatusChange(checked, skill)
    }
  }

  const columns = useMemo(
    () => [
      {
        title: "工作流信息",
        key: "skillInfo",
        width: "30%",
        render: (_, skill) => (
          <div className="flex items-center">
            <div className="flex items-center justify-center bg-[#EFEBFF] bg-opacity-50 w-[40px] h-[40px] rounded-[6px] flex-shrink-0 mr-3">
              <img
                src={skill.generateMethod === 2 ? difyIcon : skillAvater}
                className="w-6 h-6"
                alt="skill icon"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center mb-1">
                <Tooltip title={skill.skillName}>
                  <Text className="font-medium truncate mr-2" style={{ maxWidth: "180px" }}>
                    {skill.skillName}
                  </Text>
                </Tooltip>
                <CopyToClipboard text={skill.skillNo} onCopy={() => message.success("复制成功")}>
                  <Tooltip title={skill.skillNo}>
                    <Tag onClick={(e) => cancelBubble(e)} className="text-xs cursor-pointer">
                      ID
                    </Tag>
                  </Tooltip>
                </CopyToClipboard>
                {skill.generateMethod === 2 && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded">
                    Beta
                  </span>
                )}
              </div>
              <Text className="text-sm text-gray-500 truncate block" style={{ maxWidth: "250px" }}>
                {skill.description || "这个人很懒，暂未填写描述～"}
              </Text>
            </div>
          </div>
        )
      },
      {
        title: "组别",
        key: "group",
        width: "12%",
        render: (_, skill) => (
          <div className="text-sm">
            {skill.groupTagName ? (
              <Tag color="blue" className="text-xs">
                {skill.groupTagName}
              </Tag>
            ) : (
              <span className="text-gray-400">未分组</span>
            )}
          </div>
        )
      },
      {
        title: "类型",
        key: "type",
        width: "10%",
        render: (_, skill) => (
          <div className="text-sm">
            {skill.generateMethod === 2 ? (
              <span className="text-blue-600">Beta</span>
            ) : (
              SKILL_TYPES.find((type) => type.key === skill.type)?.label || "--"
            )}
          </div>
        )
      },
      {
        title: "最新发布",
        key: "updateTime",
        width: "13%",
        render: (_, skill) => (
          <div className="text-sm">
            {skill?.gmtModified ? skill?.gmtModified?.split(" ")?.[0] : "--"}
          </div>
        )
      },
      {
        title: "订阅数",
        key: "subscribeCount",
        width: "8%",
        render: (_, skill) =>
          skill?.subscribeCount > 0 ? (
            <div className="text-sm">{skill?.subscribeCount}</div>
          ) : (
            <span className="text-gray-400">--</span>
          )
      },
      {
        title: "状态",
        key: "status",
        width: "11%",
        render: (_, skill) => (
          <div onClick={(e) => e.stopPropagation()}>
            {skill.type === "subscribed_skill" ? (
              <span
                className={`px-2 py-1 text-xs rounded ${skill.status === true ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"}`}
              >
                {skill.status === true ? "启用中" : "已停用"}
              </span>
            ) : skill.status === 1 || skill.status === 0 ? (
              <Switch
                size="small"
                checked={skill.status === 1}
                disabled={isPublishDisabled}
                onChange={(checked, e) => handleSwitchChange(checked, skill, e)}
              />
            ) : (
              <span
                className={`px-2 py-1 text-xs rounded ${
                  skill.status === 2 ? "bg-yellow-100 text-yellow-600" : "bg-gray-100 text-gray-600"
                }`}
              >
                {skill.statusDisplayName}
              </span>
            )}
          </div>
        )
      },
      {
        title: "操作",
        key: "actions",
        width: "16%",
        render: (_, skill) => (
          <div onClick={(e) => e.stopPropagation()}>
            <Space size="small">
              {skill.type === "subscribed_skill" ? (
                <>
                  <Tooltip title="使用设置">
                    <Button
                      type="text"
                      size="small"
                      icon={<SettingOutlined />}
                      onClick={(e) => handleSetCurrentSkill(e, skill)}
                    />
                  </Tooltip>
                  <Popconfirm
                    title=""
                    description="【取消订阅】后，将无法调用对应工作流"
                    onConfirm={(e) => onCancelSubscribe(e, skill)}
                    onPopupClick={(e) => cancelBubble(e)}
                    okText="是"
                    cancelText="否"
                  >
                    <Tooltip title="取消订阅">
                      <Button
                        type="text"
                        size="small"
                        icon={<StarOutlined />}
                        onClick={(e) => cancelBubble(e)}
                        disabled={isPublishDisabled}
                        className="text-orange-500 hover:text-orange-600"
                      />
                    </Tooltip>
                  </Popconfirm>
                </>
              ) : (
                <>
                  <Tooltip title="设置">
                    <Button
                      type="text"
                      size="small"
                      icon={<SettingOutlined />}
                      onClick={(e) => handleSetCurrentSkill(e, skill)}
                    />
                  </Tooltip>
                  <Tooltip title="复制">
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      disabled={isPublishDisabled}
                      onClick={(e) => handleCopySkill(e, skill)}
                    />
                  </Tooltip>
                  <Tooltip title="删除">
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      disabled={isPublishDisabled}
                      onClick={(e) => handleDelete(e, skill)}
                      className="text-red-500 hover:text-red-600"
                    />
                  </Tooltip>
                  {!!(isStudio() && skill?.ready2Delete) && (
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
                </>
              )}
            </Space>
          </div>
        )
      }
    ],
    [currentBotNo, iframeStyle, isPublishDisabled, workbenchNo, parentOrigin, saveFilterState]
  )

  // 为每个工作流添加删除状态遮罩的处理
  const enhancedDataSource = useMemo(() => {
    return skills.map((skill) => ({
      ...skill,
      key: skill.skillNo
    }))
  }, [skills])

  const shouldPaginate = skills.length > 50

  return (
    <div className="skill-table-container">
      <Table
        columns={columns}
        dataSource={enhancedDataSource}
        pagination={
          shouldPaginate
            ? {
                pageSize: 50,
                showSizeChanger: false,
                showTotal: (total) => `共 ${total} 条`
              }
            : false
        }
        size="middle"
        className="skill-table"
        rowClassName={(record) => {
          const deactivate = (record.status === 1 || record.status === 0) && record.status !== 1
          return deactivate ? "deactivate" : ""
        }}
        onRow={(record) => ({
          onClick: () => handleEditSkill(record),
          style: { cursor: "pointer" }
        })}
        rowKey={(record, index) => `${record.skillNo}-${index}`}
      />
      {contextHolder}

      {/* 待删除状态遮罩 */}
      {skills.some((skill) => isStudio() && skill?.ready2Delete) && (
        <style jsx>{`
          .skill-table-container .ant-table-tbody > tr[data-row-key] {
            position: relative;
          }
        `}</style>
      )}
    </div>
  )
}

export default SkillTable
