import { Form, Input, Modal } from "antd"
import { useState } from "react"

function useDownloaderModal() {
  const [form] = Form.useForm()
  const [showEditFilenameModal, setShowEditFilenameModal] = useState(false)
  const [resolve, setResolve] = useState(undefined)
  const [addonAfter, setAddonAfter] = useState("")
  const showModal = ({ initialFilename, addonAfter = ".json" }) => {
    return new Promise((resolve) => {
      setShowEditFilenameModal(true)
      setResolve(() => resolve)
      setAddonAfter(addonAfter)
      form.setFieldsValue({ filename: initialFilename })
    })
  }

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      setShowEditFilenameModal(false)
      resolve(`${values.filename}${addonAfter}`)
    })
  }
  const EditFilenameModal = () => (
    <Modal
      title="自定义文件名"
      open={showEditFilenameModal}
      onCancel={() => setShowEditFilenameModal(false)}
      onOk={handleModalOk}
      width={600}
    >
      <div className="text-gray-600 pt-8 pb-4">为便于下载后快速识别，您可以自定义文件名</div>
      <Form form={form}>
        <Form.Item name="filename" rules={[{ required: true, message: "请输入文件名" }]}>
          <Input placeholder="请输入文件名" addonAfter={addonAfter} />
        </Form.Item>
      </Form>
    </Modal>
  )

  return { showModal, EditFilenameModal }
}

export default useDownloaderModal
