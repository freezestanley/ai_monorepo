import { Divider, Modal, Table } from "antd"
import NiceModal, { useModal } from "@ebay/nice-modal-react"
import { errorLogDownload } from "@/api/knowledge/api"

const columns = [
  {
    dataIndex: "firstCatalogName",
    title: "一级目录"
  },
  {
    dataIndex: "secondCatalogName",
    title: "二级目录"
  },
  {
    dataIndex: "thirdCatalogName",
    title: "三级目录"
  },
  {
    dataIndex: "question",
    title: "标准问题"
  },
  {
    dataIndex: "errorMsg",
    title: "错误类型"
  }
]

const DownLoadErrorModal = NiceModal.create((props) => {
  const modal = useModal()

  const { infoList, urlKey, namespace, knowledgeBaseNo, catalogNo } = props
  const handleDown = () => {
    errorLogDownload({
      key: urlKey,
      namespace,
      knowledgeBaseNo,
      catalogNo
    }).then(() => {
      modal.hide()
    })
  }

  return (
    <Modal
      title="上传不成功"
      open={modal.visible}
      width={800}
      onOk={handleDown}
      okText="下载错误报告"
      cancelText="收起"
      onCancel={modal.hide}
      afterClose={modal.remove}
    >
      <p style={{ color: "rgb(117 117 125)" }} className=" mb-2">
        错误问题共计{infoList.length}
        条（默认展示前10条），请根据报错内容提示检查问题并重新上传
      </p>
      <Table
        columns={columns}
        dataSource={infoList.slice(0, 10)}
        scroll={{ y: 500 }}
        pagination={false}
      />
    </Modal>
  )
})

export default DownLoadErrorModal
