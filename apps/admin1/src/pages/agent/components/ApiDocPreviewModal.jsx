import React from "react"
import { Modal, Button, Select } from "antd"
import { DownloadOutlined } from "@ant-design/icons"

const ApiDocPreviewModal = ({
  open,
  loading,
  html,
  onClose,
  onDownload,
  skillNos = [],
  selectedSkillNo,
  onSkillChange
}) => {
  return (
    <Modal
      title="Agent API 文档预览"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={onDownload}>
          下载
        </Button>,
        <Button key="close" onClick={onClose}>
          关闭
        </Button>
      ]}
      width={900}
      bodyStyle={{ maxHeight: 600, padding: 0 }}
      destroyOnClose
      centered
      maskClosable={false}
      confirmLoading={loading}
    >
      {loading ? (
        <div className="flex items-center justify-center h-full text-lg">加载中...</div>
      ) : (
        <div className="h-[600px] overflow-y-hidden">
          {Array.isArray(skillNos) && skillNos.length > 0 && (
            <div className="p-4 bg-white">
              请选择工作流：
              <Select
                style={{ width: 300 }}
                value={selectedSkillNo}
                onChange={onSkillChange}
                options={skillNos.map((item) => ({
                  label: item.skillName,
                  value: item.skillNo
                }))}
                placeholder="请选择工作流"
              />
            </div>
          )}
          <iframe
            title="Agent API 文档"
            srcDoc={html}
            style={{ width: "100%", height: "calc(100% - 68px)", border: "none" }}
          />
        </div>
      )}
    </Modal>
  )
}

export default ApiDocPreviewModal
