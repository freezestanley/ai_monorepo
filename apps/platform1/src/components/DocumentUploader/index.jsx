import { useEffect, useState } from "react"
import { Drawer, Button, Spin, message, Modal } from "antd"
import "./index.scss"
import { DrawerStates } from "@/constants"
import {
  useCancelGenerateFaq,
  useConfirmAddFaq,
  useFetchUploadResult,
  useGenerateFaq
} from "@/api/knowledgeDocument"
import UploadProgressComponent from "./UploadProgressComponent"
import UploadPreviewComponent from "./UploadPreviewComponent"
import UploadDocumentComponent from "./UploadDocumentComponent"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { useQueryClient } from "@tanstack/react-query"
import { uploadDocument } from "@/api/knowledgeDocument/api"

/**
 * 写一个映射
 * stauts: 0 , 3 展示 DrawerStates.UPLOAD_DOCUMENT
 * stauts:5 展示 DrawerStates.UPLOAD_PREVIEW
 */
const STATUSMAP = {
  0: DrawerStates.UPLOAD_DOCUMENT,
  3: DrawerStates.UPLOAD_DOCUMENT,
  4: DrawerStates.UPLOAD_PROGRESS,
  5: DrawerStates.UPLOAD_PREVIEW
}

const DocumentUploader = ({ visible, onVisibilityChange, selectedKnowledgeBase, selectedKeys }) => {
  const handleSplitUpload = () => {
    return uploadDocument({
      knowledgeBaseNo: selectedKnowledgeBase,
      catalogNo: selectedKeys[0]
    })
  }

  const {
    data: resultStatusData,
    isLoading,
    isSuccess,
    refetch
  } = useFetchUploadResult({
    knowledgeBaseNo: selectedKnowledgeBase,
    catalogNo: selectedKeys[0],
    enabled: false // 默认情况下禁用自动查询
  })

  const { mutate: createFaq } = useGenerateFaq()

  const [fileList, setFileList] = useState([])
  const [questions, setQuestions] = useState([])
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [tableData, setTableData] = useState([])
  const [step1Loading, setStep1Loading] = useState(false)
  const [drawerState, setDrawerState] = useState(DrawerStates.UPLOAD_DOCUMENT)
  const queryClient = useQueryClient()
  const { mutate: cancelFaq, isLoading: cancelLoading } = useCancelGenerateFaq()
  const { mutate: confirmFaq } = useConfirmAddFaq()

  const [isValidFile, setIsValidFile] = useState(true)

  const handleAddFaqConfirm = () => {
    confirmFaq(
      {
        knowledgeBaseNo: selectedKnowledgeBase,
        catalogNo: selectedKeys[0],
        documentNo: resultStatusData.documentNo
      },
      {
        onSuccess: (e) => {
          const { success, message: msg } = e
          if (success) {
            message.success(msg)
            onVisibilityChange(false)
            queryClient.invalidateQueries([QUERY_KEYS.FAQ_LIST_BY_PAGE])
          } else {
            message.error(msg)
          }
        }
      }
    )
  }

  /**
   * resultStatusData.status
   *  分为:0 未上传;
   *      1 待分片;
   *
   */

  useEffect(() => {
    if (resultStatusData) {
      console.log(resultStatusData)
      const { progressPercent, status } = resultStatusData
      setDrawerState(STATUSMAP[status] ? STATUSMAP[status] : DrawerStates.UPLOAD_DOCUMENT)
      if (status !== 0) {
        console.log(resultStatusData)
        const file = [
          {
            name: resultStatusData.name
          }
        ]
        setFileList(file)
      }
      if (status === 0) {
        setFileList([])
      }
      if (status === 4) {
        setLoadingProgress(+progressPercent)
      }
    }
  }, [resultStatusData])

  const handleUploadChange = (info, e) => {
    console.log(info, e)
    if (info.file.status === "uploading") {
      setStep1Loading(true)
    }

    if (info.file.status === "done") {
      setStep1Loading(false)
      message.success("上传成功")
      queryClient.invalidateQueries([QUERY_KEYS.UPLOAD_RESULT])
    }

    const fileList = info.fileList
    if (isValidFile) {
      setFileList(fileList)
    }
  }

  const handleGenerate = async () => {
    if (drawerState === DrawerStates.UPLOAD_DOCUMENT) {
      // 当没有文件的时候，不允许生成
      if (fileList.length === 0) {
        message.error("请先上传文件")
        return
      }

      createFaq(
        {
          knowledgeBaseNo: selectedKnowledgeBase,
          catalogNo: selectedKeys[0],
          questions: questions.map((item) => item.value)
        },
        {
          onSuccess: (e) => {
            const { message: msg } = e
            if (e.success) {
              message.success(msg)
              queryClient.invalidateQueries([QUERY_KEYS.UPLOAD_RESULT])
            } else {
              message.error(msg)
            }
          }
        }
      )
      setDrawerState(DrawerStates.UPLOAD_PROGRESS)
    } else if (drawerState === DrawerStates.UPLOAD_PROGRESS) {
      setDrawerState(DrawerStates.UPLOAD_PREVIEW)
    } else if (drawerState === DrawerStates.UPLOAD_PREVIEW) {
      handleAddFaqConfirm()
    }
  }

  // 终止生成
  const handleCancelGen = () => {
    cancelFaq(
      {
        knowledgeBaseNo: selectedKnowledgeBase,
        catalogNo: selectedKeys[0],
        documentNo: resultStatusData.documentNo
      },
      {
        onSuccess: (e) => {
          const { success, message: msg } = e
          if (success) {
            message.success(msg)
            onVisibilityChange(false)
            setFileList([])
            queryClient.invalidateQueries([QUERY_KEYS.FAQ_LIST_BY_PAGE])
          } else {
            message.error(msg)
          }
        }
      }
    )
  }
  useEffect(() => {
    if (visible) {
      queryClient.invalidateQueries([QUERY_KEYS.UPLOAD_RESULT])
    }
  }, [queryClient, visible])

  useEffect(() => {
    let polling

    if (drawerState === DrawerStates.UPLOAD_PROGRESS && visible) {
      // 轮询时的逻辑
      polling = setInterval(() => {
        refetch()
      }, 5000) // 每10秒触发一次
    } else if (visible) {
      // 非轮询时，只触发一次
      refetch()
    }

    return () => {
      if (polling) {
        clearInterval(polling) // 组件卸载或状态改变时清除轮询
      }
    }
  }, [drawerState, refetch, visible])

  return (
    <div>
      <Drawer
        destroyOnClose
        rootClassName={"upload-document-wrapper"}
        title="文档拆分"
        placement="right"
        open={visible}
        onClose={() => {
          onVisibilityChange(false)
        }}
        width={1000}
        // 底部有靠右侧的确认以及取消按钮
        footer={
          <div
            style={{
              textAlign: "right"
            }}
          >
            <Button
              onClick={() => onVisibilityChange(false)}
              style={{
                marginRight: 8
              }}
            >
              取消
            </Button>
            <Button
              onClick={() => {
                Modal.confirm({
                  title: "提示",
                  content: "确认终止生成吗？",
                  okText: "确认",
                  cancelText: "取消",
                  onOk: handleCancelGen
                })
              }}
              style={{
                marginRight: 8
              }}
            >
              终止
            </Button>
            {(drawerState === DrawerStates.UPLOAD_PREVIEW ||
              drawerState === DrawerStates.UPLOAD_DOCUMENT) && (
              <Button
                onClick={() => {
                  handleGenerate()
                }}
                type="primary"
              >
                {drawerState === DrawerStates.UPLOAD_PREVIEW ? "确认添加" : "生成"}
              </Button>
            )}
          </div>
        }
      >
        <Spin spinning={step1Loading}>
          {drawerState === DrawerStates.UPLOAD_DOCUMENT && (
            <UploadDocumentComponent
              setIsValidFile={setIsValidFile}
              fileList={fileList}
              setFileList={setFileList}
              handleUploadChange={handleUploadChange}
              handleSplitUpload={handleSplitUpload}
              questions={questions}
              setQuestions={setQuestions}
            />
          )}
          {drawerState === DrawerStates.UPLOAD_PROGRESS && (
            <UploadProgressComponent fileList={fileList} loadingProgress={loadingProgress} />
          )}

          {drawerState === DrawerStates.UPLOAD_PREVIEW && (
            <UploadPreviewComponent
              resultStatusData={resultStatusData}
              catalogNo={selectedKeys.length > 0 ? selectedKeys[0] : undefined}
              knowledgeBaseNo={selectedKnowledgeBase ? selectedKnowledgeBase : undefined}
              fileList={fileList}
              questions={questions}
              setQuestions={setQuestions}
            />
          )}
        </Spin>
      </Drawer>
    </div>
  )
}

export default DocumentUploader
