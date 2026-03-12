import { useState, useCallback } from "react"
import { Button, Modal, Table, Tag } from "antd"
import { useFetchKnowledgeTemplateApplyListApi } from "@/api/knowledgeManage"
import { fetchKnowledgeTemplateApplyGetUrl } from "@/api/knowledgeManage/api"
import { downloadFile } from "@/api/tools"

const applicationStatusEnum = {
  1: "待发布",
  2: "发布中",
  3: "发布成功",
  4: "发布失败"
}

const tagColor = {
  1: "success",
  2: "warning",
  3: "success",
  4: "error"
}

const RequestRecordsModal = ({ visiable, setVisiable, templateId }) => {
  const [downloading, setDownloading] = useState(false)

  const { data: tableData } = useFetchKnowledgeTemplateApplyListApi({
    templateId: visiable ? templateId : null
  })

  // 处理下载模板的函数
  const handleDownload = useCallback(async (record) => {
    setDownloading(true)
    try {
      const url = await fetchKnowledgeTemplateApplyGetUrl({
        applicationNo: record.applicationNo
      })
      downloadFile(url)
    } finally {
      setDownloading(false)
    }
  }, [])

  const columns = [
    {
      title: "申请编号",
      dataIndex: "applicationNo"
    },
    {
      title: "状态",
      dataIndex: "applicationStatus",
      render: (text) => <Tag color={tagColor[text]}>{applicationStatusEnum[text]}</Tag>
    },
    {
      title: "申请人",
      dataIndex: "applicant"
    },
    {
      title: "申请时间",
      dataIndex: "applicationTime"
    },
    {
      title: "完成时间",
      dataIndex: "applicationCompletionTime"
    },
    {
      title: "操作",
      dataIndex: "action",
      render: (_, record) => (
        <Button
          type="link"
          style={{ paddingLeft: 0 }}
          loading={downloading}
          onClick={() => handleDownload(record)}
        >
          下载同步内容
        </Button>
      )
    }
  ]

  return (
    <Modal
      title="申请记录"
      width={1000}
      open={visiable}
      footer={false}
      onCancel={() => setVisiable(false)}
    >
      <Table
        rowKey={"applicationNo"}
        columns={columns}
        pagination={false}
        scroll={{ y: "calc(100vh - 300px)" }}
        dataSource={tableData}
      />
    </Modal>
  )
}

export default RequestRecordsModal
