// @ts-nocheck
import { Table, Button, Modal, message, Space, Form, Tooltip, Typography } from "antd"
import {
  useCopySkillVersionNo,
  useDeleteSkillVersion,
  useEnableSkill,
  useFetchSkillInfo,
  useFetchSkillVersionList,
  useSaveAsTemplate
} from "@/api/skill"
import { useSkillFlowData } from "@/store"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { useLocation } from "react-router-dom"
import { exportSkill } from "@/api/skill/api"
import SkillTemplateEditModal from "../SkillTemplateEditModal"
import { useSkillTemplateModal } from "../SkillTemplateEditModal/useSkillTemplateModal"
import useDownloaderModal from "../DownloaderModal"
import { isStudio } from "@/config.env"

const HistoryTable = ({ botNo, studioenv, onClose, isLocked, isPublishDisabled }) => {
  const skillFlowData = useSkillFlowData((state) => state.skillFlowData)
  const { data: historyList, refetch } = useFetchSkillVersionList(skillFlowData?.skillNo)
  const location = useLocation()
  const { mutate: deleteSkillVersion, isLoading } = useDeleteSkillVersion()
  const { mutate: saveAsTemplate } = useSaveAsTemplate()
  const { mutate: copySkillVersionNo } = useCopySkillVersionNo()
  const { mutate: enableSkill } = useEnableSkill()
  const fullPath = location.pathname + location.search
  const queryClient = useQueryClient()

  const [form] = Form.useForm()

  const {
    visible,
    currentRecord,
    selectedAvatar,
    openModal,
    closeModal,
    handleAvatarSelect,
    setVisible
  } = useSkillTemplateModal(form)

  const { data: currentSkillProcessData } = useFetchSkillInfo(skillFlowData?.skillNo)
  const { showModal, EditFilenameModal } = useDownloaderModal()

  const handleSaveAs = (record) => {
    console.log(record, currentSkillProcessData)
    openModal({
      ...currentSkillProcessData,
      name: currentSkillProcessData.skillName,
      skillTypeName: currentSkillProcessData.typeDisplayName,
      versionNo: record.versionNo
    })
  }

  const handleLoad = (record) => {
    // 添加一次二次确认
    Modal.confirm({
      title: "提示",
      content: "当前未发布的配置内容将被覆盖，并无法找回，是否确认载入？",
      onOk: () => {
        copySkillVersionNo(
          {
            versionNo: record.versionNo,
            skillNo: skillFlowData?.skillNo
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
    enableSkill(
      {
        versionNo: record.versionNo,
        skillNo: skillFlowData?.skillNo
      },
      {
        onSuccess: (e) => {
          if (e.success) {
            message.success(e.message)
            queryClient.invalidateQueries([QUERY_KEYS.SKILL_VERSION_LIST])
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
    const { skillNo, versionNo } = record
    const initialFilename = `${skillNo}-${versionNo}-copy`
    const filename = await showModal({ initialFilename, addonAfter: ".json" })
    exportSkill({
      botNo,
      studioenv,
      skillNo,
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
        console.log(record)
        deleteSkillVersion(
          {
            versionNo: record.versionNo,
            skillNo: skillFlowData?.skillNo,
            botNo: skillFlowData?.botNo
          },
          {
            onSuccess: (e) => {
              console.log(e)
              if (e.success) {
                queryClient.invalidateQueries([QUERY_KEYS.SKILL_VERSION_LIST])
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

  const handleOk = (record) => {
    form
      .validateFields()
      .then((values) => {
        console.log("Received values of form:", values)
        const params = {
          ...values,
          iconType: form.getFieldValue("icon")?.iconType || currentRecord.iconType
        }

        saveAsTemplate(
          {
            versionNo: currentRecord.versionNo,
            skillNo: skillFlowData?.skillNo,
            botNo: skillFlowData?.botNo,
            ...params
          },
          {
            onSuccess: (e) => {
              console.log(e)
              if (e.success) {
                queryClient.invalidateQueries([QUERY_KEYS.SKILL_VERSION_LIST])
                message.success("保存成功")
                setVisible(false)
              } else {
                message.error(e.message)
              }
            },
            onError: (e) => {
              message.error(`网络不给力:${e.message}`)
            }
          }
        )
      })
      .catch((info) => {
        console.log("Failed:", info)
      })
  }

  const columns = [
    {
      title: "工作流版本编号",
      dataIndex: "versionNo",
      key: "versionNo"
    },
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
      dataIndex: "releaseStatus",
      key: "releaseStatus",
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
      fixed: "right",
      render: (text, record) => (
        <div className="flex items-center">
          <Space>
            <Button
              disabled={isLocked || isPublishDisabled}
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
              disabled={isStudio() || record.inUse || isLocked}
            >
              {record.inUse ? "当前" : "设为当前"}
            </Button>
            {!isStudio() && (
              <Button
                onClick={() => handleDelete(record)}
                type="link"
                className="p-0"
                disabled={isLocked}
              >
                删除
              </Button>
            )}
            <Button onClick={() => handleSaveAs(record)} type="link" className="p-0">
              另存为模板
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
        scroll={{ x: "max-content" }}
        rowKey="versionNo"
      />
      <SkillTemplateEditModal
        visible={visible}
        handleOk={handleOk}
        handleCancel={closeModal}
        form={form}
        selectedAvatar={selectedAvatar}
        handleAvatarSelect={handleAvatarSelect}
      />
      <EditFilenameModal />
    </>
  )
}

export default HistoryTable
