import { useState } from "react"
import { Table, Button, Modal, Form, Input, message, Pagination } from "antd"
import { DeleteOutlined } from "@ant-design/icons"
import {
  useDeleteSkillTemplate,
  useFetchSkillTemplatePage,
  useMoveSkillTemplatePosition,
  useSaveSkillTemplate
} from "@/api/permission"
import SkillTemplateEditModal from "@/components/SkillTemplateEditModal"
import { useSkillTemplateModal } from "@/components/SkillTemplateEditModal/useSkillTemplateModal"

function SkillTemplateManageMent() {
  const [form] = Form.useForm()
  const [params, setParams] = useState({})

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10
  })

  const {
    visible,
    currentRecord,
    selectedAvatar,
    openModal,
    closeModal,
    handleAvatarSelect,
    setVisible
  } = useSkillTemplateModal(form)

  const { data: { data = [], totalCount } = {}, refetch } = useFetchSkillTemplatePage({
    pageNum: pagination.current,
    pageSize: pagination.pageSize,
    ...params
  })

  const { mutate: saveSkillTemplate } = useSaveSkillTemplate()
  const { mutate: deleteSkillTemplate } = useDeleteSkillTemplate()
  const { mutate: moveSkillTemplatePosition } = useMoveSkillTemplatePosition()

  const tableList = data
  const handleDelete = (record) => {
    // 二次确认
    Modal.confirm({
      title: "确认删除该工作流吗？",
      icon: <DeleteOutlined />,
      content: "删除后不可恢复",
      okText: "确认",
      cancelText: "取消",
      onOk: () => {
        deleteSkillTemplate(
          { skillTemplateId: record.id },
          {
            onSuccess: (e) => {
              if (e.success) {
                message.success("删除成功")
                refetch()
              } else {
                message.error(e.message)
              }
            }
          }
        )
      }
    })
  }

  const handleMove = (record, operation) => {
    moveSkillTemplatePosition(
      {
        skillTemplateId: record.id,
        operation
      },
      {
        onSuccess: (e) => {
          if (e.success) {
            message.success("操作成功")
            refetch()
          } else {
            message.error(e.message)
          }
        }
      }
    )
  }

  const columns = [
    { title: "工作流名称", dataIndex: "name" },
    { title: "描述", dataIndex: "description" },
    // {
    //   title: "工作流icon",
    //   render: (record) => {
    //     return <img src={record.iconUrl} width={24} />
    //   }
    // },
    { title: "类型", dataIndex: "skillTypeName" },
    {
      title: "操作",
      render: (record) => (
        <>
          <Button className="p-0" type="link" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" style={{ marginLeft: 8 }} onClick={() => handleDelete(record)}>
            删除
          </Button>
          <Button type="link" style={{ marginLeft: 8 }} onClick={() => handleMove(record, "TOP")}>
            置顶
          </Button>
          <Button
            type="link"
            style={{ marginLeft: 8 }}
            onClick={() => handleMove(record, "BOTTOM")}
          >
            置底
          </Button>
        </>
      )
    }
  ]

  const handleEdit = (record) => {
    openModal(record)
  }

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        console.log("Received values of form:", values)
        const params = {
          ...values,
          id: currentRecord?.id,
          iconType: form.getFieldValue("icon")?.iconType || currentRecord.iconType,
          modifier: currentRecord?.modifier
        }

        saveSkillTemplate(params, {
          onSuccess: (e) => {
            if (e.success) {
              message.success("保存成功")
              // 关闭弹窗
              setVisible(false)
              refetch()
            } else {
              message.error(e.message)
            }
          }
        })

        setVisible(false)
      })
      .catch((info) => {
        console.log("Failed:", info)
      })
  }

  return (
    <div>
      <Table columns={columns} dataSource={tableList} pagination={false} />
      <Pagination
        className="fixed-pagination"
        current={pagination.current}
        pageSize={pagination.pageSize}
        total={totalCount}
        onChange={(page, pageSize) => setPagination({ current: page, pageSize })}
        showSizeChanger={true}
        style={{ marginTop: "15px", textAlign: "right" }}
        showTotal={(total) => `共 ${total} 条`}
      />

      <SkillTemplateEditModal
        visible={visible}
        handleOk={handleOk}
        handleCancel={closeModal}
        form={form}
        selectedAvatar={selectedAvatar}
        handleAvatarSelect={handleAvatarSelect}
      />
    </div>
  )
}

export default SkillTemplateManageMent
