import { useState, useCallback, useEffect } from "react"
import { Drawer, Button, Modal, Form, Input, message } from "antd"
import { ArrowLeftOutlined } from "@ant-design/icons"
import ResizableLayout from "@/components/ResizableLayout"
import { useEditDocument, useRetryAddDocument } from "@/api/knowledge"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"
import DocSplitList from "./DocSplitList"
import FilePreview from "./FilePreview"
import "./index.scss"

const RagFlowDrawer = ({ currentData, setCurrentData, knowledgeBaseNo, visible, onClose }) => {
  const [modalForm] = Form.useForm()
  const [modalVisible, setModalVisible] = useState(false)
  const [resizeLayoutWidth, setResizeLayoutWidth] = useState(0)
  const { mutate: editDocument, isLoading } = useEditDocument()
  const { mutate: retryAddDocument, isLoading: retryLoading } = useRetryAddDocument()
  const queryClient = useQueryClient()

  const handleResize = useCallback(() => {
    if (!visible) return
    if (document.body) {
      setResizeLayoutWidth(document.body.offsetWidth)
    } else {
      handleResize()
    }
  }, [visible])

  useEffect(() => {
    handleResize()
  }, [handleResize])

  const handleOk = useCallback(async () => {
    const values = await modalForm.validateFields()
    editDocument(
      {
        knowledgeBaseNo,
        targetCatalogNo: currentData?.catalogNo,
        ...currentData,
        title: values.title
      },
      {
        onSuccess: () => {
          setModalVisible(false)
          setCurrentData((preState) => ({ ...preState, title: values.title }))
        }
      }
    )
  }, [currentData, setCurrentData, editDocument, knowledgeBaseNo, modalForm])

  return (
    <Drawer
      title={
        <div className="flex justify-between">
          <div className="flex items-center">
            {currentData?.title}
            <span
              className="iconfont icon-Edit ml-[4px] cursor-pointer"
              onClick={() => {
                modalForm.setFieldsValue({
                  title: currentData?.title
                })
                setModalVisible(true)
              }}
            />
          </div>
          <Button
            type="primary"
            loading={retryLoading}
            disabled={currentData?.status === 8}
            onClick={() => {
              retryAddDocument(
                {
                  knowledgeBaseNo,
                  documentNo: currentData?.documentNo
                },
                {
                  onSuccess: (e) => {
                    if (e.success) {
                      message.success(e.message)
                      onClose()
                      queryClient.invalidateQueries([QUERY_KEYS.DOCUMENT_LIST_BY_PAGE])
                    } else {
                      message.error(e.message)
                    }
                  }
                }
              )
            }}
          >
            重新解析
          </Button>
        </div>
      }
      width={"100vw"}
      closeIcon={<ArrowLeftOutlined className="text-[#181B25]" />}
      onClose={onClose}
      classNames={{
        body: "rag-flow-body-drawer"
      }}
      open={visible}
      footer={null}
    >
      <ResizableLayout
        sideVisible
        defaultMainWidth={resizeLayoutWidth * 0.7}
        defaultSideWidth={resizeLayoutWidth * 0.3}
        minMainWidth={resizeLayoutWidth * 0.4}
        minSideWidth={resizeLayoutWidth * 0.3}
        maxSideWidth={resizeLayoutWidth * 0.7}
        mainContent={
          <DocSplitList
            visible={visible}
            knowledgeBaseNo={knowledgeBaseNo}
            currentData={currentData}
          />
        }
        sideContent={<FilePreview knowledgeBaseNo={knowledgeBaseNo} currentData={currentData} />}
      />
      <Modal
        title={"重命名"}
        open={modalVisible}
        okText="确认"
        onOk={handleOk}
        onCancel={() => setModalVisible(false)}
        closable={false}
        confirmLoading={isLoading}
      >
        <Form form={modalForm}>
          <Form.Item name="title" rules={[{ required: true, message: "请输入文档标题" }]}>
            <Input placeholder="请输入" />
          </Form.Item>
        </Form>
      </Modal>
    </Drawer>
  )
}

export default RagFlowDrawer
