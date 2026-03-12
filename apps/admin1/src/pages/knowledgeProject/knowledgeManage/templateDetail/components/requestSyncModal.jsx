import { useCallback, useState } from "react"
import { Modal, Tabs, Table, message, Spin } from "antd"
import {
  useFetchExecuteKnowledgeTemplateApplyApi,
  useFetchKnowledgeTemplateApplyShowDifferApi
} from "@/api/knowledgeManage"

const { TabPane } = Tabs

const RequestSyncModal = ({ mode, visiable, setVisiable, templateId }) => {
  const [activeKey, setActiveKey] = useState("ADD")
  const [isSubmitLoading, setIsSubmitLoading] = useState(false)
  const { data: showDifferData, isLoading } = useFetchKnowledgeTemplateApplyShowDifferApi({
    templateId: visiable ? templateId : null
  })
  const { mutate: executeKnowledgeTemplateApply } = useFetchExecuteKnowledgeTemplateApplyApi()

  const onSubmit = useCallback(() => {
    setIsSubmitLoading(true)
    executeKnowledgeTemplateApply(
      { templateId },
      {
        onSuccess: (res) => {
          if (res.success) {
            setVisiable(false)
            message.success("操作成功！")
          }
          setIsSubmitLoading(false)
        },
        onError: () => {
          setIsSubmitLoading(false)
        }
      }
    )
  }, [executeKnowledgeTemplateApply, setVisiable, templateId])

  const getColumns = (key) => [
    {
      title: "意图名称",
      dataIndex: "intentionName"
    },
    {
      title: "意图描述",
      dataIndex: "intentionDesc"
    },
    {
      title: "当前层级",
      dataIndex: "intentionLevelName",
      render: (_, record) => {
        const { hisIntentionLevelName, curIntentionLevelName } = record
        if (key === "UPDATE") {
          return `${hisIntentionLevelName} -> ${curIntentionLevelName}`
        }
        return curIntentionLevelName
      }
    },
    {
      title: "关联话术",
      dataIndex: "dialogueName"
    },
    {
      title: "更新信息",
      dataIndex: "modifier",
      render: (text, record) => (
        <>
          {text}
          <br />
          {record.gmtModified}
        </>
      )
    }
  ]

  return (
    <Modal
      title={mode === "view" ? "同步内容" : "待同步内容"}
      width={1000}
      open={visiable}
      onOk={onSubmit}
      okButtonProps={{
        disabled: showDifferData?.every(({ detailList }) => !detailList?.length),
        loading: isSubmitLoading
      }}
      onCancel={() => setVisiable(false)}
      {...(mode === "view" ? { footer: false } : {})}
    >
      <Spin spinning={isLoading}>
        <Tabs activeKey={activeKey} onChange={setActiveKey}>
          {showDifferData?.map(({ typeName, typeCode, detailList, count }) => {
            return (
              <TabPane tab={`${typeName}（${count || 0}）`} key={typeCode}>
                <Table
                  rowKey={"dialogueId"}
                  columns={getColumns(typeCode)}
                  pagination={false}
                  scroll={{ y: "calc(100vh - 300px)" }}
                  dataSource={detailList}
                />
              </TabPane>
            )
          })}
        </Tabs>
      </Spin>
    </Modal>
  )
}

export default RequestSyncModal
