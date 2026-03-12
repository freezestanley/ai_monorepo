import { useEffect, useState } from "react"
import DataDocUpload from "./DataDocUpload"
import DataHandle from "./DataHandle"
import DataPreview from "./DataPreview"
import TableStructureConfig from "./TableStructureConfig"
import { Button, Form, Modal, Steps, message, notification, Alert } from "antd"
import {
  useStructureDatasetImportDataExtend,
  useStructureDatasetImportDataExtendResult,
  useStructureDatasetParsing
} from "@/api/structureKnowledge"
import { ALL, PARTIAL } from "@/components/CustomSelect"

const items = [
  {
    title: "上传"
  },
  {
    title: "表结构配置"
  },
  {
    title: "预览"
  },
  {
    title: "数据处理"
  }
]
function AddStructureDataFromDoc({
  structureNoRef,
  tableDataRefetch,
  handleAddDataModalCancel,
  isAddDataModalVisible,
  handleAddDataModalOk,
  knowledgeBaseNo,
  catalogNo,
  addDateSet,
  sourceTag
}) {
  const [current, setCurrent] = useState(0)
  const [uploadForm] = Form.useForm()
  const [uploadFormData, setUploadFormData] = useState({})
  const [tableConfigForm] = Form.useForm()
  const [tableConfigData, setTableConfigData] = useState({})
  const [docInfo, setDocInfo] = useState({
    uploadStatus: "0",
    documentNo: "",
    documentName: ""
  })
  const [tableData, setTableData] = useState([{ records: [[]], total: 0, sheetName: "" }])
  const [tableIndexList, setTableIndexList] = useState([0, 0, 1])
  const [tableConfig, setTableConfig] = useState({
    configData: [],
    sheetList: []
  })
  const [removedCells, setRemovedCells] = useState([])

  const [dataPreviewColumns, setDataPreviewColumns] = useState([])
  const [dataPreviewDataSource, setDataPreviewDataSource] = useState([])
  const [importResult, setImportResult] = useState({
    title: "服务器处理中",
    status: "success",
    message: "",
    progress: 0
  })

  const [isParsing, setIsParsing] = useState(false)
  const [parsingFailed, setParsingFailed] = useState(false)
  const [parsingError, setParsingError] = useState("")

  const [continueGetResultStatus, setContinueGetResultStatus] = useState(true)

  const { mutate: structureDatasetParsing } = useStructureDatasetParsing()
  const { mutate: importDataExtend } = useStructureDatasetImportDataExtend()
  const { mutate: fetchImportResultStatus } = useStructureDatasetImportDataExtendResult()

  const handleUploadFail = (errorMessage) => {
    setParsingFailed(true)
    setParsingError(errorMessage || "上传失败，请重试")
  }

  const getImportResultStatus = () => {
    fetchImportResultStatus(
      {
        knowledgeBaseNo,
        catalogNo,
        structureNo: structureNoRef.current,
        documentNo: docInfo.documentNo
      },
      {
        onSuccess: (res) => {
          if (res.success === true) {
            setImportResult({
              title: `服务器处理${res.data < 1 ? "中" : "完成"}`,
              progress: res.data * 100,
              status: res.data < 1 ? "active" : "success",
              message: ""
            })
            if (res.data < 1) {
              setTimeout(() => {
                continueGetResultStatus && getImportResultStatus()
              }, 2000)
            }
          } else {
            setImportResult({
              title: `服务器处理失败`,
              progress: typeof res.data === "number" ? res.data * 100 : 0,
              status: "exception",
              message: res.message
            })
          }
        },
        onError: (error) => {
          setImportResult({
            title: `服务器处理失败`,
            progress: 0,
            status: "exception",
            message: error?.response?.statusText || error?.message || "未知错误"
          })
        }
      }
    )
  }
  useEffect(() => {
    if (tableData?.length > 0 && tableData?.[0].total > 1) {
      const [sheetIndex, headIndex, startLineIndex] = tableIndexList
      const currentCol = tableData[sheetIndex]?.records?.[headIndex]

      const dataPreviewDataSource = tableData[sheetIndex]?.records
        ?.map((record, index) => {
          if (index >= startLineIndex && index < startLineIndex + 10) {
            const recordObject = {}
            record.map((item, itemIndex) => {
              recordObject[itemIndex] = item
            })
            return recordObject
          }
        })
        .filter((d) => d)
      setDataPreviewDataSource(dataPreviewDataSource)

      setTableConfig((prev) => {
        const strategies = currentCol.map((item, index) => {
          return {
            name: item,
            index,
            type: "keyword",
            embeddingModel: false,
            description: ""
          }
        })

        tableConfigForm.setFieldValue("strategies", strategies)

        const sheetList = tableData.map((sheet, index) => {
          return {
            sheetName: sheet.sheetName,
            sheetCode: index
          }
        })
        const headList = (
          tableData[sheetIndex]?.records.map((sheet, index) => {
            return {
              headName: `第${index + 1}行`,
              headCode: index
            }
          }) || []
        ).filter((h, index) => index < 50)

        const startLineList = (
          tableData[sheetIndex]?.records?.map((sheet, index) => {
            return {
              startLineCode: index,
              startLineName: `第${index + 1}行`
            }
          }) || []
        ).filter((h, index) => index < 50)
        return {
          ...prev,
          dataSource: [
            {
              sheetName: sheetIndex,
              head: headIndex,
              startLine: startLineIndex,
              key: Math.random()
            }
          ],
          sheetList,
          headList,
          startLineList
        }
      })
    }
  }, [tableData, tableIndexList, tableConfigForm])

  useEffect(() => {
    setParsingFailed(false)
    setParsingError("")
  }, [docInfo.documentNo])

  const createDataset = (params, successCallback) => {
    addDateSet(params, {
      onSuccess: (res) => {
        if (res.success === true) {
          structureNoRef.current = res.data.structureNo
          successCallback && successCallback()
        } else {
          notification.warning({
            message: "请注意!",
            description: res.message
          })
        }
      }
    })
  }

  const exportData = (retryCurrent) => {
    importDataExtend(
      {
        knowledgeBaseNo,
        catalogNo,
        sheetName: tableData[tableIndexList[0]].sheetName,
        documentNo: docInfo.documentNo,
        structureNo: structureNoRef.current,
        beginRow: tableIndexList[2],
        removedCells
      },
      {
        onSuccess: (res) => {
          if (res.success === true) {
            setCurrent(3)
            if (retryCurrent === 2) {
              getImportResultStatus()
            }
            setContinueGetResultStatus(true)
          }
        }
      }
    )
  }

  const onHandleAddDataModalOk = (retryCurrent) => {
    handleAddDataModalOk()
    if (current === 0) {
      // 上传文件并解析
      if (!docInfo.documentNo) {
        message.error("请先上传文件")
        return
      }
      uploadForm.validateFields().then((values) => {
        const { documentName } = values[Object.keys(values)[0]]
        setUploadFormData({ documentName })
        console.log("documentName:", documentName)
        setIsParsing(true)
        structureDatasetParsing(
          {
            knowledgeBaseNo,
            catalogNo,
            documentName,
            documentNo: docInfo.documentNo
          },
          {
            onSuccess: (res) => {
              console.log("res:", res)
              if (res.success === true) {
                setTableData(res.data)
                setCurrent(1)
                setRemovedCells([])
                setTableIndexList([0, 0, 1])
                setParsingFailed(false)
                setParsingError("")
              } else {
                setParsingFailed(true)
                setParsingError(res.message || "解析服务返回未知错误")
              }
            },
            onError: (err) => {
              console.log("res:", err)
              setParsingFailed(true)
              const serverMessage = err?.response?.data?.message
              setParsingError(serverMessage || err?.message || "网络请求失败")
            },
            onSettled: () => {
              setIsParsing(false)
            }
          }
        )
      })
    } else if (current === 1) {
      tableConfigForm.validateFields().then((values) => {
        console.log("Form values:", values)
        const params = {
          strategies: values.strategies?.map((strategy) => {
            return {
              ...strategy,
              embeddingModel: +strategy.embeddingModel,
              visibleType: strategy?.tags?.type === PARTIAL ? PARTIAL : ALL,
              tagKeys: strategy?.tags?.type === PARTIAL ? strategy.tags.selectedOptions : []
            }
          }),
          knowledgeBaseNo,
          catalogNo,
          name: uploadFormData?.documentName,
          remark: "来自Excel自动上传"
        }
        const headList = params.strategies.map((item) => {
          return {
            title: item.name,
            dataIndex: item.index,
            key: Math.random(),
            width: 100,
            ellipsis: true
          }
        })
        setDataPreviewColumns(headList)
        setTableConfigData(params)
        setCurrent(2)
      })
    } else if (current === 2 || retryCurrent === 2) {
      if (retryCurrent === 2) {
        exportData(2)
      } else {
        createDataset(tableConfigData, () => {
          // 触发发服务器导入数据
          exportData()
        })
      }
    } else if (current === 3) {
      // 回到结构化知识库列表
      handleAddDataModalCancel()
    }
  }

  const onHandleBackStep = () => {
    setCurrent((prev) => {
      return prev - 1
    })
  }

  const resetUploadModal = () => {
    setContinueGetResultStatus(false)
    uploadForm.resetFields()
    setDocInfo({
      uploadStatus: "0",
      documentName: "",
      documentNo: "",
      size: 0
    })
    tableConfigForm.resetFields()
    setCurrent(0)
    tableDataRefetch()
  }

  return (
    <Modal
      title="新增数据集"
      okText="下一步"
      width={window.innerWidth * 0.9}
      open={isAddDataModalVisible}
      onCancel={handleAddDataModalCancel}
      destroyOnClose={true}
      maskClosable={false}
      styles={{
        body: {
          padding: "24px 0"
        }
      }}
      afterClose={resetUploadModal}
      footer={(_, { OkBtn }) => (
        <>
          {current > 0 && current < 3 && <Button onClick={onHandleBackStep}>上一步</Button>}
          {current === 3 && importResult.status === "exception" && (
            <Button
              onClick={() => {
                onHandleAddDataModalOk(2)
              }}
            >
              重试
            </Button>
          )}
          {current === 3 && importResult.status === "success" && (
            <Button onClick={onHandleAddDataModalOk}>完成</Button>
          )}
          {current === 3 && importResult.status === "active" && (
            <Button onClick={onHandleAddDataModalOk}>关闭</Button>
          )}
          {current !== 3 && (
            <Button
              onClick={onHandleAddDataModalOk}
              loading={isParsing}
              disabled={
                current === 0 &&
                (docInfo.uploadStatus === "uploading" ||
                  isParsing ||
                  parsingFailed ||
                  !docInfo.documentNo)
              }
            >
              下一步
            </Button>
          )}
        </>
      )}
    >
      <div className="pd-4">
        <Steps current={current} items={items} />
        <div className="pt-4">
          {current === 0 && (
            <>
              <DataDocUpload
                form={uploadForm}
                setDocInfo={setDocInfo}
                docInfo={docInfo}
                onUploadFail={handleUploadFail}
                {...{ knowledgeBaseNo, catalogNo }}
              />
              {parsingFailed && (
                <Alert
                  message="文件解析失败"
                  description={parsingError}
                  type="error"
                  showIcon
                  className="mt-4"
                />
              )}
            </>
          )}
          {current === 1 && (
            <TableStructureConfig
              tableConfig={tableConfig}
              form={tableConfigForm}
              setTableIndexList={setTableIndexList}
              setRemovedCells={setRemovedCells}
              removedCells={removedCells}
              sourceTag={sourceTag}
            />
          )}
          {current === 2 && (
            <DataPreview
              dataSource={dataPreviewDataSource}
              columns={dataPreviewColumns}
              title={tableData[tableIndexList[0]]?.sheetName}
              footerTip={`总${tableData[tableIndexList[0]]?.total - tableIndexList[2]}条记录，当前预览只展示前10条记录`}
            />
          )}

          {current === 3 && (
            <DataHandle
              title={importResult.title}
              progressName={uploadFormData.documentName}
              status={importResult.status}
              getImportResultStatus={getImportResultStatus}
              progress={importResult.progress}
              message={importResult.message}
            />
          )}
        </div>
      </div>
    </Modal>
  )
}

export default AddStructureDataFromDoc
