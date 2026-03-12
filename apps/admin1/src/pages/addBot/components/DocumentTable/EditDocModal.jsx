import { useEffect, useRef, useMemo } from "react"
import {
  Input,
  Select,
  Form,
  Modal,
  Radio,
  Upload,
  message,
  TreeSelect,
  notification,
  Slider,
  InputNumber,
  Switch,
  Tooltip,
  Button,
  Row,
  Col
} from "antd"
import { InfoCircleOutlined, CloseOutlined } from "@ant-design/icons"
import { useAddDocument, useEditDocument, useFetchKnowledgeDictionaryList } from "@/api/knowledge"
import { uploadDocumentKnowledgeUrl, analyzeDocumentUrl } from "@/api/knowledge/api"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { isIntl } from "@/api/sso"
import UploadFile from "@/components/UploadFile"
import docIcon from "@/assets/img/doc.png"
import docxIcon from "@/assets/img/docx.png"
import pdfIcon from "@/assets/img/pdf.png"
import txtIcon from "@/assets/img/txt.png"

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

const getFileIcon = (file) => {
  const extension = file?.name?.split(".")?.pop()?.toLowerCase()
  switch (extension) {
    case "doc":
      return docIcon
    case "docx":
      return docxIcon
    case "pdf":
      return pdfIcon
    case "txt":
      return txtIcon
    default:
      return null
  }
}

// MIME类型映射
const MIME_TYPE_MAP = {
  DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  DOC: "application/msword",
  XLSX: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  XLS: "application/vnd.ms-excel",
  PPT: "application/vnd.ms-powerpoint",
  PDF: "application/pdf",
  TXT: "text/plain",
  JPEG: "image/jpeg",
  JPG: "image/jpeg",
  PNG: "image/png",
  TIF: "image/tiff",
  GIF: "image/gif",
  BMP: "image/bmp",
  CSV: "text/csv",
  JSON: "application/json",
  EML: "message/rfc822",
  HTML: "text/html",
  MD: "text/markdown"
}

// 默认MIME类型
const DEFAULT_MIME_TYPES = [
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/pdf",
  "text/plain",
  "text/markdown"
]

const DEFAULT_MINE_ACCEPTS = ".doc,.docx,.pdf,.txt,.md"

// 将文件扩展名转换为accept属性需要的格式
function getAcceptTypes(extraInfoStr) {
  try {
    const extensions = JSON.parse(extraInfoStr)
    return extensions.map((ext) => `.${ext.toLowerCase()}`).join(",")
  } catch (e) {
    // 如果解析失败，返回默认值
    return DEFAULT_MINE_ACCEPTS
  }
}

// 获取允许的MIME类型列表
function getAllowedMimeTypes(extraInfoStr) {
  try {
    const extensions = JSON.parse(extraInfoStr)
    return extensions.map((ext) => MIME_TYPE_MAP[ext.toUpperCase()]).filter(Boolean)
  } catch (e) {
    // 如果解析失败，返回默认值
    return DEFAULT_MIME_TYPES
  }
}

const EditDocModal = ({
  selectedKnowledgeBase,
  selectNode,
  docCategories,
  docAction,
  isModalVisible,
  setIsModalVisible,
  currentData
}) => {
  const currentRecordRef = useRef(null)
  const documentNoRef = useRef(null)
  const hasFileImgData = useRef({})

  const [form] = Form.useForm()
  const queryClient = useQueryClient()
  const { mutate: addDocument } = useAddDocument()
  const { mutate: editDocument } = useEditDocument()
  const { data: knowledgeDictionaryList } = useFetchKnowledgeDictionaryList({
    dictionaryType: "RAG_CHUNK_METHOD"
  })
  const splitMethodCode = Form.useWatch("splitMethodCode", form)
  const splitMethod = Form.useWatch(["splitArg", "splitMethod"], form)
  const filesList = Form.useWatch("files", form)

  const fileType = useMemo(() => {
    if (currentData) {
      return (
        currentData?.name?.split(".")?.pop()?.toLowerCase() ||
        currentData?.path?.split("?")?.[0]?.split(".")?.pop()?.toLowerCase()
      )
    }
    const file = filesList?.[0]
    return file?.type
      ? Object.keys(MIME_TYPE_MAP)
          .find((key) => MIME_TYPE_MAP[key] === file.type)
          ?.toLowerCase()
      : file?.name?.split(".")?.pop()?.toLowerCase()
  }, [currentData, filesList])

  const allImg = useMemo(() => {
    return filesList?.every((file) =>
      [
        MIME_TYPE_MAP.JPEG,
        MIME_TYPE_MAP.JPG,
        MIME_TYPE_MAP.PNG,
        MIME_TYPE_MAP.GIF,
        MIME_TYPE_MAP.BMP
      ].includes(file.type)
    )
  }, [filesList])

  const hasImages = useMemo(() => {
    return filesList?.some((file) => hasFileImgData.current[file.uid]?.hasImages)
  }, [filesList])

  useEffect(() => {
    if (isIntl() || docAction === "view" || docAction === "edit") return
    if (filesList?.length === 0) {
      form.setFieldValue(["splitArg", "splitMethod"], "NAIVE")
      return
    }
    if (allImg) {
      form.setFieldValue(["splitArg", "splitMethod"], "PICTURE")
    } else if (
      filesList?.some((file) =>
        [
          MIME_TYPE_MAP.JPEG,
          MIME_TYPE_MAP.JPG,
          MIME_TYPE_MAP.PNG,
          MIME_TYPE_MAP.GIF,
          MIME_TYPE_MAP.BMP
        ].includes(file.type)
      ) ||
      hasImages
    ) {
      form.setFieldValue(["splitArg", "splitMethod"], "NAIVE")
    } else {
      form.setFieldValue(
        ["splitArg", "splitMethod"],
        knowledgeDictionaryList?.filter((item) => !["PICTURE", "NAIVE"].includes(item.code))?.[0]
          ?.code
      )
    }
  }, [form, allImg, hasImages, filesList])

  const allExtraInfo = useMemo(() => {
    const set = new Set()
    knowledgeDictionaryList?.forEach((item) => {
      const extraInfo = JSON.parse(item.extraInfo || "[]")
      extraInfo.forEach((info) => {
        info && set.add(info?.toUpperCase())
      })
    })
    return JSON.stringify([...set])
  }, [knowledgeDictionaryList])

  const allExtraInfoText = useMemo(
    () =>
      JSON.parse(allExtraInfo || "[]")
        .map((ext) => ext.toLowerCase())
        .join("，"),
    [allExtraInfo]
  )

  const isInstruction = useMemo(
    () => splitMethodCode === "SPLIT_BY_RAG_FOR_INSURANCE_PRODUCT",
    [splitMethodCode]
  )

  useEffect(() => {
    if (isModalVisible) {
      documentNoRef.current = currentData?.documentNo || null
      currentRecordRef.current = currentData || null
      currentData &&
        form.setFieldsValue({
          catalogNo: currentData.catalogNo,
          title: currentData.title,
          splitMethodCode: currentData.splitMethodCode,
          summary: currentData.summary,
          files: [{ path: currentData.url, title: currentData.title }],
          splitArg: currentData.splitArg
        })
    }
  }, [currentData, isModalVisible, form])

  const handleOk = () => {
    console.log(form.getFieldsValue())
    form
      .validateFields()
      .then((values) => {
        // 使用正则表达式替换，确保将 "\\n" 字符串强制转换为真正的换行符 "\n"
        if (typeof values.splitArg?.delimiter === "string") {
          values.splitArg.delimiter = values.splitArg.delimiter.replace(/\\n/g, "\n")
        }

        const params = {
          ...values,
          knowledgeBaseNo: selectedKnowledgeBase,
          files:
            docAction === "edit"
              ? values.files
              : values?.files.map((path) => ({
                  title:
                    !isInstruction && values.title
                      ? values.title
                      : path.name.split(".").slice(0, -1).join("."),
                  path: path.response.data
                })),
          // path: docAction === "edit" ? values.path : values?.path[0].response.data,
          documentNo: documentNoRef.current
        }
        // 如果是编辑
        const isEdit = docAction === "edit"
        if (isEdit) {
          // 目标路径就是当前输入框的路径
          params.targetCatalogNo = values.catalogNo
          // 知识库路径是原来的路径
          params.catalogNo = currentRecordRef.current.catalogNo
        }

        const fetch = isEdit ? editDocument : addDocument
        fetch(params, {
          onSuccess: (e) => {
            if (e.success) {
              message.success(e.message)
              queryClient.invalidateQueries([QUERY_KEYS.DOCUMENT_LIST_BY_PAGE])
            } else {
              notification.warning({
                message: "出错了",
                description: e.message
              })
            }
          }
        })

        setIsModalVisible(false)
        form.resetFields()
      })
      .catch((info) => {
        console.log("Validate Failed:", info)
      })
  }

  const handleUploadChange = (info) => {
    if (info.file.status === "done") {
      const response = info.file.response
      if (response) {
        if (response.success) {
          // Success case
          if (!form.getFieldValue("title")) {
            form.setFieldsValue({
              title: info.file.name.split(".").slice(0, -1).join(".")
            })
          }
          const fileData = new FormData()
          fileData.append("file", info.file.originFileObj)
          !hasFileImgData.current[info.file.uid] &&
            analyzeDocumentUrl(fileData).then((res) => {
              hasFileImgData.current[info.file.uid] = res
            })
        } else {
          // Business error from server
          message.error(response.message || "服务器返回未知错误。")
        }
      }
    } else if (info.file.status === "error") {
      // Network error
      message.error(info.file.response?.message || "请检查网络或联系管理员")
    }
  }

  const handleCancel = () => {
    setIsModalVisible(false)
  }

  return (
    <Modal
      title={docAction === "add" ? "添加文档" : docAction === "edit" ? "编辑文档" : "查看文档"}
      open={isModalVisible}
      onOk={handleOk}
      onCancel={handleCancel}
      destroyOnClose
      afterClose={() => {
        form.resetFields()
      }}
    >
      <Form form={form} initialValues={{}} layout="vertical">
        <Form.Item
          name="catalogNo"
          label="文档目录"
          rules={[{ required: true, message: "请选择文档目录!" }]}
          initialValue={selectNode?.catalogNo}
        >
          <TreeSelect
            showSearch
            style={{
              width: "100%"
            }}
            dropdownStyle={{
              maxHeight: 400,
              overflow: "auto"
            }}
            placeholder="请选择文档目录"
            allowClear
            treeDefaultExpandAll
            fieldNames={{ label: "catalogName", value: "catalogNo" }}
            treeData={docCategories}
          />
        </Form.Item>
        <Form.Item
          name="splitMethodCode"
          label="拆分方式"
          initialValue={isIntl() ? "SPLIT_BY_BLOCK" : "SPLIT_BY_RAG_FOR_INSURANCE_PRODUCT"}
          rules={[{ required: true, message: "请选择拆分方式!" }]}
          hidden={!isIntl()}
        >
          <Radio.Group disabled={docAction === "edit"}>
            <Radio value="SPLIT_BY_BLOCK">通用拆分</Radio>
            <Radio value="SPLIT_BY_TITLE">按标题拆分</Radio>
            {!isIntl() && <Radio value="SPLIT_BY_RAG_FOR_INSURANCE_PRODUCT">保险产品说明书</Radio>}
          </Radio.Group>
        </Form.Item>
        {isInstruction && (
          <>
            <Form.Item
              name="files"
              label="选择文件"
              tooltip={{
                title: "PICTURE切分支持的文件格式为JPG、JPEG、PNG、BMP格式",
                icon: <InfoCircleOutlined />,
                overlayInnerStyle: { wordBreak: "break-all", maxWidth: "500px" }
              }}
              valuePropName="fileList"
              getValueFromEvent={(e) => {
                const fileList = Array.isArray(e) ? e : e?.fileList
                if (!fileList) return []
                // Only return files that have a success response or are not done yet.
                return fileList.filter((file) =>
                  file.response ? file.response.success === true : true
                )
              }}
              rules={[
                {
                  required: !(docAction === "view" || docAction === "edit"),
                  message: "请选择文件!"
                }
              ]}
            >
              {/* 当是查看或者编辑状态的时候,只展示一个文件icon以及文件名字 */}
              {docAction === "view" || docAction === "edit" ? (
                <div
                  className="flex items-start justify-start align-middle mt-[10px] mb-[10px] rounded-md px-2 py-4"
                  style={{ border: "1px solid #E4E7EC" }}
                >
                  <img
                    src={getFileIcon({ name: currentData?.name })}
                    alt=""
                    className="w-[40px] h-[40px] mr-2"
                  />
                  <div className="flex flex-col">
                    <div className="mt-[10px]">
                      <a
                        className="ml-1"
                        type="link"
                        href={currentData?.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {currentData?.name}
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <UploadFile
                  isDragger
                  multiple
                  promptText={
                    !!allExtraInfoText && `支持上传${allExtraInfoText}等格式的文档，可批量上传`
                  }
                  onChange={handleUploadChange}
                  action={uploadDocumentKnowledgeUrl(selectedKnowledgeBase)}
                  accept={getAcceptTypes(allExtraInfo || "[]")}
                  beforeUpload={async (file) => {
                    const allowedTypes = getAllowedMimeTypes(allExtraInfo || "")
                    // 上传类型限制
                    const isTypeAllowed = allowedTypes.includes(file.type)
                    if (!isTypeAllowed) {
                      message.error("请上传正确的文件类型")
                      return Upload.LIST_IGNORE
                    }
                  }}
                />
              )}
            </Form.Item>
            <Form.Item
              name={["splitArg", "splitMethod"]}
              label="切片方法"
              rules={[
                {
                  required: !(docAction === "view" || docAction === "edit"),
                  message: "请选择切片方式!"
                }
              ]}
              initialValue="NAIVE"
              tooltip={{
                overlayInnerStyle: { wordBreak: "break-all", maxWidth: "600px" },
                icon: <InfoCircleOutlined />,
                title: (
                  <>
                    &quot;GENERAL&quot;分块方法说明
                    <br />
                    支持的文件格式为DOCX、XLSX、XLS(Excel97~2003)、PPT、PDF、TXT、JPEG、JPG、PNG、TIF、GIF、CSV、JSON、EML、HTML。
                    <br />
                    此方法将简单的方法应用于块文件：系统将使用视觉检测模型将连续文本分割成多个片段；接下来，这些连续的片段被合并成Token数不超过&quot;Token数&quot;的块。
                    <br />
                    <br />
                    &quot;Q&A&quot;分块方法说明
                    <br />
                    此块方法支持 excel和 csv/txt 文件格式。
                    <br />
                    如果文件是
                    excel格式，则应由两个列组成，没有标题：一个提出问题，另一个用于答案，答案列之前的问题列。多张纸只要列是正确结构，就可以接受；如果文件是
                    csv/txt 格式，以 UTF-8 编码且用 TAB 作分开问题和答案的定界符。
                    <br />
                    未能遵循上述规则的文本行将被忽略，并且每个问答对将被认为是一个独特的部分。
                    <br />
                    <br />
                    &quot;RESUME&quot;分块方法说明
                    <br />
                    支持的文件格式为 DOCX、PDF、TXT。
                    <br />
                    简历有多种格式，就像一个人的个性一样，但我们经常必须将它们组织成结构化数据，以便于搜索。我们不是将简历分块，而是将简历解析为结构化数据。作为HR、你可以扔掉所有的简历，您只需与&quot;RAGFIow&quot;交谈即可列出所有符合资格的候选人。
                    <br />
                    <br />
                    &quot;MANUAL&quot;分块方法说明
                    <br />
                    仅支持PDF。
                    <br />
                    我们假设手册具有分层部分结构。我们使用最低的部分标题作为对文档进行切片的枢轴。因此，同一部分中的图和表不会被分割，并且块大小可能会很大。
                    <br />
                    <br />
                    &quot;TABLE&quot;分块方法说明
                    <br />
                    支持XLSX和CSV/TXT格式文件。
                    <br />
                    以下是一些提示:对于 csv 或 txt 文件，列之间的分隔符为
                    TAB。第一行必须是列标题。列标题必须是有意义的术语，以便我们的大语言模型能够理解。列举一些同义词时最好使用斜杠&quot;/&quot;来分隔，甚至更好使用方括号枚举值，例如&quot;qender/sex(male,female)&quot;。
                    <br />
                    以下是标题的一些示例:
                    供应商/供货商&quot;TAB&quot;颜色(黄色、红色、棕色)&quot;TAB&quot;性别(男、女)&quot;TAB&quot;尺码(M、L、XL、XXL)；姓名/名字&quot;TAB&quot;电话/手机/微信&quot;TAB&quot;最高学历(高中，职高，硕士，本科，博士，初中，中技，中专，专科，专升本，MPA，MBA，EMBA)
                    <br />
                    表中的每一行都将被视为一个块。
                    <br />
                    <br />
                    &quot;PAPER&quot;分块方法说明
                    <br />
                    仅支持PDF文件。
                    <br />
                    如果我们的模型运行良好，论文将按其部分进行切片，例如摘要、1.1、1.2等。这样做的好处是
                    LLM
                    可以更好的概括论文中相关章节的内容，产生更全面的答案，帮助读者更好地理解论文。
                    缺点是它增加了 LLM
                    对话的背景并增加了计算成本，所以在对话过程中，你可以考虑减少&quot;topN&quot;的设置。
                    <br />
                    <br />
                    &quot;BOOK&quot;分块方法说明
                    <br />
                    支持的文件格式为 DOCX、PDF、TXT。
                    <br />
                    由于一本书很长，并不是所有部分都有用，如果是 PDF
                    ，请为每本书设置页面范围，以消除负面影响并节省分析计算时间。
                    <br />
                    <br />
                    &quot;LAWS&quot;分块方法说明
                    <br />
                    支持的文件格式为 DOCX、PDF、TXT。
                    <br />
                    法律文件有非常严格的书写格式。我们使用文本特征来检测分割点。Chunk
                    的粒度与&quot;ARTICLE&quot;一致，所有上层文本都会包含在 Chunk 中。
                    <br />
                    <br />
                    &quot;PRESENTATION&quot;分块方法说明
                    <br />
                    演示稿分块，支持的文件格式为PDF、PPTX。
                    <br />
                    每个页面都将被视为一个块。
                    并且每个页面的缩略图都会被存储。您上传的所有PPT文件都会使用此方法自动分块，无需为每个PPT文件进行设置。
                    <br />
                    <br />
                    &quot;ONE&quot;分块方法说明
                    <br />
                    单一文档，支持的文件格式为DOCX、EXCEL、PDF、TXT。
                    <br />
                    对于一个文档，它将被视为一个完整的块，根本不会被分割。如果你要总结的东西需要一篇文章的全部上下文，并且所选
                    LLM 的上下文长度覆盖了文档长度，你可以尝试这种方法。
                  </>
                )
              }}
            >
              <Select
                disabled={docAction === "edit"}
                placeholder="请选择切片方式"
                options={[...(knowledgeDictionaryList || [])].map((item) => ({
                  ...item,
                  disabled:
                    splitMethod === "NAIVE"
                      ? item.code !== "NAIVE"
                      : splitMethod === "PICTURE"
                        ? item.code !== "PICTURE"
                        : item.code === "PICTURE" || splitMethod === "NAIVE"
                }))}
                fieldNames={{ label: "displayName", value: "code" }}
              />
            </Form.Item>
            {splitMethod === "NAIVE" &&
              ["doc", "docx", "md", "pdf", "xlsx", "xls"].includes(fileType) && (
                <>
                  {["pdf"].includes(fileType) && (
                    <>
                      <Form.Item
                        label="页码范围"
                        rules={[{ required: !(docAction === "view" || docAction === "edit") }]}
                        name={["splitArg", "pageRanges"]}
                      >
                        <Form.List
                          tooltip={{
                            overlayInnerStyle: { wordBreak: "break-all", maxWidth: "600px" },
                            icon: <InfoCircleOutlined />,
                            title:
                              "定义需要解析的页面范围，不包含在这些范围内的页面将被忽略”；支持添加多组页面，支持删除，但最少保留一组。"
                          }}
                          name={["splitArg", "pageRanges"]}
                          initialValue={[[]]}
                        >
                          {(fields, { add, remove }) => (
                            <>
                              {fields.map((field) => (
                                <div className="flex">
                                  <Row gutter={24} key={field.key} className="flex-1">
                                    <Col span={12}>
                                      <Form.Item
                                        name={[field.name, 0]}
                                        rules={[
                                          {
                                            required: !(
                                              docAction === "view" || docAction === "edit"
                                            ),
                                            message: "请输入"
                                          }
                                        ]}
                                      >
                                        <InputNumber
                                          className="w-full"
                                          placeholder="从"
                                          disabled={docAction === "edit"}
                                        />
                                      </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                      <Form.Item
                                        name={[field.name, 1]}
                                        rules={[
                                          {
                                            required: !(
                                              docAction === "view" || docAction === "edit"
                                            ),
                                            message: "请输入"
                                          }
                                        ]}
                                      >
                                        <InputNumber
                                          className="w-full"
                                          placeholder="到"
                                          disabled={docAction === "edit"}
                                        />
                                      </Form.Item>
                                    </Col>
                                  </Row>
                                  {docAction !== "edit" && (
                                    <CloseOutlined
                                      className="ml-2 mt-[-14px]"
                                      style={fields.length > 1 ? {} : { visibility: "hidden" }}
                                      onClick={() => remove(field.name)}
                                    />
                                  )}
                                </div>
                              ))}
                              {docAction !== "edit" && (
                                <Button type="dashed" onClick={() => add()} block>
                                  + 新增页面
                                </Button>
                              )}
                            </>
                          )}
                        </Form.List>
                      </Form.Item>
                      <Form.Item
                        label="任务页面大小"
                        tooltip={{
                          overlayInnerStyle: { wordBreak: "break-all", maxWidth: "600px" },
                          icon: <InfoCircleOutlined />,
                          title:
                            "如果使用布局识别，PDF 文件将被分成连续的组。布局分析将在组之间并行执行，以提高处理速度。“任务页面大小”决定组的大小。页面大小越大，将页面之间的连续文本分割成不同块的机会就越低。”"
                        }}
                        layout="horizontal"
                        name={["splitArg", "taskPageSize"]}
                        initialValue={12}
                        rules={[
                          {
                            required: !(docAction === "view" || docAction === "edit"),
                            message: "请输入任务页面大小"
                          }
                        ]}
                      >
                        <InputNumber
                          min={1}
                          max={128}
                          precision={0}
                          placeholder="请输入任务页面大小"
                          disabled={docAction === "edit"}
                        />
                      </Form.Item>
                      <Form.Item
                        label="PDF解析器"
                        tooltip={{
                          overlayInnerStyle: { wordBreak: "break-all", maxWidth: "600px" },
                          icon: <InfoCircleOutlined />,
                          title:
                            "使用视觉模型进行 PDF 布局分析，以更好地识别文档结构，找到标题、文本块、图像和表格的位置。如果选择 Naive 选项，则只能获取PDF的纯文本。请注意该功能只适用于 PDF 文档，对其他文档不生效。"
                        }}
                        layout="horizontal"
                        name={["splitArg", "layoutRecognition"]}
                        initialValue={"DeepDOC"}
                      >
                        <Select
                          placeholder="请选择PDF解析器"
                          options={[{ label: "DeepDoc", value: "DeepDOC" }]}
                          disabled={docAction === "edit"}
                        />
                      </Form.Item>
                    </>
                  )}
                </>
              )}
            <Form.Item
              label="建议文本块大小"
              tooltip={{
                overlayInnerStyle: { wordBreak: "break-all", maxWidth: "600px" },
                icon: <InfoCircleOutlined />,
                title:
                  "建议的生成文本块的 token 数阈值。如果切分得到的小文本段 token 数达不到这一阈值就会不断与之后的文本段合并，直至再合并下一个文本段会超过这一阈值为止，此时产生一个最终文本块。如果系统在切分文本段时始终没有遇到文本分段标识符，即便文本段 token 数已经超过这一阈值，系统也不会生成新文本块。"
              }}
              layout="horizontal"
            >
              <div className="flex items-center">
                <Form.Item name={["splitArg", "chunkSize"]} noStyle initialValue={512}>
                  <Slider
                    min={0}
                    max={2048}
                    step={1}
                    className="flex-1 mr-4 ml-2"
                    onChange={(value) => form.setFieldValue(["splitArg", "chunkSize"], value)}
                    disabled={docAction === "edit"}
                  />
                </Form.Item>
                <Form.Item name={["splitArg", "chunkSize"]} noStyle initialValue={512}>
                  <InputNumber
                    min={0}
                    max={2048}
                    step={1}
                    precision={0}
                    style={{ width: "70px" }}
                    onBlur={(e) =>
                      !e.target.value &&
                      e.target.value !== 0 &&
                      form.setFieldValue(["splitArg", "chunkSize"], 512)
                    }
                    onChange={(value) => form.setFieldValue(["splitArg", "chunkSize"], value)}
                    disabled={docAction === "edit"}
                  />
                </Form.Item>
              </div>
            </Form.Item>
            <Form.Item
              label="文本分段标识符"
              layout="horizontal"
              rules={[
                {
                  required: !(docAction === "view" || docAction === "edit"),
                  message: "请输入文本分段标识符"
                }
              ]}
              name={["splitArg", "delimiter"]}
              initialValue={"\\n"}
              tooltip={{
                overlayInnerStyle: { wordBreak: "break-all", maxWidth: "600px" },
                icon: <InfoCircleOutlined />,
                title:
                  "支持多字符作为分隔符，多字符用``分隔符包裹。若配置成：\\n`##`；系统将首先使用换行符、两个#号以及分号先对文本进行分割，随后再对分得的小文本块按照「建议文本块大小」设定的大小进行拼装。在设置文本分段标识符前请确保理解上述文本分段切片机制。"
              }}
            >
              <Input placeholder="请输入文本分段标识符" disabled={docAction === "edit"} />
            </Form.Item>
            {(splitMethod === "PICTURE" ||
              (splitMethod === "NAIVE" &&
                ["doc", "docx", "md", "pdf", "xlsx", "xls"].includes(fileType))) && (
              <>
                <Form.Item
                  label="自动关键词提取"
                  layout="horizontal"
                  tooltip={{
                    overlayInnerStyle: { wordBreak: "break-all", maxWidth: "600px" },
                    icon: <InfoCircleOutlined />,
                    title:
                      "自动为每个文本块中提取 N个关键词，用以提升查询精度。请注意：该功能采用“系统模型设置“中设置的默认聊天模型提取关键词，因此也会产生更多 Token 消耗。另外，你也可以手动更新生成的关键词。"
                  }}
                >
                  <div className="flex items-center">
                    <Form.Item name={["splitArg", "autoKeywords"]} noStyle initialValue={0}>
                      <Slider
                        min={0}
                        max={30}
                        step={1}
                        className="flex-1 mr-4 ml-2"
                        onChange={(value) =>
                          form.setFieldValue(["splitArg", "autoKeywords"], value)
                        }
                        disabled={docAction === "edit"}
                      />
                    </Form.Item>
                    <Form.Item name={["splitArg", "autoKeywords"]} noStyle initialValue={0}>
                      <InputNumber
                        min={0}
                        max={30}
                        step={1}
                        precision={0}
                        style={{ width: "70px" }}
                        onBlur={(e) =>
                          !e.target.value &&
                          e.target.value !== 0 &&
                          form.setFieldValue(["splitArg", "autoKeywords"], 0)
                        }
                        onChange={(value) =>
                          form.setFieldValue(["splitArg", "autoKeywords"], value)
                        }
                        disabled={docAction === "edit"}
                      />
                    </Form.Item>
                  </div>
                </Form.Item>
                <Form.Item
                  label="自动问题提取"
                  layout="horizontal"
                  tooltip={{
                    overlayInnerStyle: { wordBreak: "break-all", maxWidth: "600px" },
                    icon: <InfoCircleOutlined />,
                    title:
                      "利用“系统模型设置”中设置的 chat model 对知识库的每个文本块提取 N个问题以提高其排名得分。请注意，开启后将消耗额外的 token。您可以在块列表中查看、编辑结果。如果自动问题提取发生错误，不会妨碍整个分块过程，只会将空结果添加到原始文本块。"
                  }}
                >
                  <div className="flex items-center">
                    <Form.Item name={["splitArg", "autoQuestions"]} noStyle initialValue={0}>
                      <Slider
                        min={0}
                        max={10}
                        step={1}
                        className="flex-1 mr-4 ml-2"
                        onChange={(value) =>
                          form.setFieldValue(["splitArg", "autoQuestions"], value)
                        }
                        disabled={docAction === "edit"}
                      />
                    </Form.Item>
                    <Form.Item name={["splitArg", "autoQuestions"]} noStyle initialValue={0}>
                      <InputNumber
                        min={0}
                        max={10}
                        step={1}
                        precision={0}
                        style={{ width: "70px" }}
                        onBlur={(e) =>
                          !e.target.value &&
                          e.target.value !== 0 &&
                          form.setFieldValue(["splitArg", "autoQuestions"], 0)
                        }
                        onChange={(value) =>
                          form.setFieldValue(["splitArg", "autoQuestions"], value)
                        }
                        disabled={docAction === "edit"}
                      />
                    </Form.Item>
                  </div>
                </Form.Item>
              </>
            )}
            {splitMethod === "NAIVE" &&
              ["doc", "docx", "md", "pdf", "xlsx", "xls"].includes(fileType) && (
                <>
                  <Form.Item
                    label="使用召回增强RAPTOR策略"
                    name={["splitArg", "useRaptor"]}
                    layout="horizontal"
                    tooltip={{
                      overlayInnerStyle: { wordBreak: "break-all", maxWidth: "600px" },
                      icon: <InfoCircleOutlined />,
                      title: (
                        <>
                          {/* 请参考
                          <a
                            href="https://huggingface.co/papers/2401.18059"
                            target="_blank"
                            rel="noreferrer"
                            className="!text-white !underline"
                          >
                            https://huggingface.co/papers/2401.18059
                          </a> */}
                          RAPTOR策略是一种以较高的构建成本和索引维护复杂度为代价，通过递归聚类与摘要生成构建树状层次结构的检索增强方法，它能实现对宏观概括与微观细节的同步检索，从而显著提升大模型对长文档的全局理解能力。
                          开启后模型调用费用和时间将会增加
                        </>
                      )
                    }}
                    valuePropName="checked"
                  >
                    <Switch disabled={docAction === "edit"} />
                  </Form.Item>
                  <Form.Item
                    noStyle
                    shouldUpdate={(prev, curr) =>
                      prev.splitArg?.useRaptor !== curr.splitArg?.useRaptor
                    }
                  >
                    {({ getFieldValue }) => {
                      const useRaptor = getFieldValue(["splitArg", "useRaptor"])
                      return (
                        !!useRaptor && (
                          <>
                            <Form.Item
                              label="提示词"
                              name={["splitArg", "raptor", "prompt"]}
                              layout="horizontal"
                              rules={[
                                {
                                  required: !(docAction === "view" || docAction === "edit"),
                                  message: "请输入提示词"
                                }
                              ]}
                              tooltip={{
                                overlayInnerStyle: { wordBreak: "break-all", maxWidth: "600px" },
                                icon: <InfoCircleOutlined />,
                                title:
                                  "系统提示为大模型提供任务描述、规定回复方式，以及设置其他各种要求。系统提示通常与 key（变量）合用，通过变量设置大模型的输入数据。你可以通过斜杠或者（x）按钮显示可用的key。"
                              }}
                            >
                              <Input.TextArea
                                placeholder="请输入提示词"
                                disabled={docAction === "edit"}
                              />
                            </Form.Item>
                            <Form.Item
                              label="最大token数"
                              layout="horizontal"
                              tooltip={{
                                overlayInnerStyle: { wordBreak: "break-all", maxWidth: "600px" },
                                icon: <InfoCircleOutlined />,
                                title: "用于汇总的最大token数"
                              }}
                            >
                              <div className="flex items-center">
                                <Form.Item
                                  name={["splitArg", "raptor", "maxToken"]}
                                  noStyle
                                  initialValue={256}
                                >
                                  <Slider
                                    min={0}
                                    max={2048}
                                    step={1}
                                    className="flex-1 mr-4 ml-2"
                                    onChange={(value) =>
                                      form.setFieldValue(["splitArg", "raptor", "maxToken"], value)
                                    }
                                    disabled={docAction === "edit"}
                                  />
                                </Form.Item>
                                <Form.Item
                                  name={["splitArg", "raptor", "maxToken"]}
                                  noStyle
                                  initialValue={256}
                                >
                                  <InputNumber
                                    min={0}
                                    max={2048}
                                    step={1}
                                    precision={0}
                                    style={{ width: "70px" }}
                                    onBlur={(e) =>
                                      !e.target.value &&
                                      e.target.value !== 0 &&
                                      form.setFieldValue(["splitArg", "raptor", "maxToken"], 256)
                                    }
                                    onChange={(value) =>
                                      form.setFieldValue(["splitArg", "raptor", "maxToken"], value)
                                    }
                                    disabled={docAction === "edit"}
                                  />
                                </Form.Item>
                              </div>
                            </Form.Item>
                            <Form.Item
                              label="阈值"
                              layout="horizontal"
                              tooltip={{
                                overlayInnerStyle: { wordBreak: "break-all", maxWidth: "600px" },
                                icon: <InfoCircleOutlined />,
                                title: "阈值越大，聚类越少"
                              }}
                            >
                              <div className="flex items-center">
                                <Form.Item
                                  name={["splitArg", "raptor", "threshold"]}
                                  noStyle
                                  initialValue={0.1}
                                >
                                  <Slider
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    className="flex-1 mr-4 ml-2"
                                    onChange={(value) =>
                                      form.setFieldValue(["splitArg", "raptor", "threshold"], value)
                                    }
                                    disabled={docAction === "edit"}
                                  />
                                </Form.Item>
                                <Form.Item
                                  name={["splitArg", "raptor", "threshold"]}
                                  noStyle
                                  initialValue={0.1}
                                >
                                  <InputNumber
                                    min={0}
                                    max={1}
                                    step={1}
                                    precision={2}
                                    style={{ width: "70px" }}
                                    onBlur={(e) =>
                                      !e.target.value &&
                                      e.target.value !== 0 &&
                                      form.setFieldValue(["splitArg", "raptor", "threshold"], 0.1)
                                    }
                                    onChange={(value) =>
                                      form.setFieldValue(["splitArg", "raptor", "threshold"], value)
                                    }
                                    disabled={docAction === "edit"}
                                  />
                                </Form.Item>
                              </div>
                            </Form.Item>
                            <Form.Item
                              label="最大聚类数"
                              layout="horizontal"
                              tooltip={{
                                overlayInnerStyle: { wordBreak: "break-all", maxWidth: "600px" },
                                icon: <InfoCircleOutlined />,
                                title: "最大聚类数"
                              }}
                            >
                              <div className="flex items-center">
                                <Form.Item
                                  name={["splitArg", "raptor", "maxCluster"]}
                                  noStyle
                                  initialValue={64}
                                >
                                  <Slider
                                    min={1}
                                    max={1024}
                                    step={1}
                                    className="flex-1 mr-4 ml-2"
                                    onChange={(value) =>
                                      form.setFieldValue(
                                        ["splitArg", "raptor", "maxCluster"],
                                        value
                                      )
                                    }
                                    disabled={docAction === "edit"}
                                  />
                                </Form.Item>
                                <Form.Item
                                  name={["splitArg", "raptor", "maxCluster"]}
                                  noStyle
                                  initialValue={64}
                                >
                                  <InputNumber
                                    min={1}
                                    max={1024}
                                    step={1}
                                    precision={0}
                                    style={{ width: "70px" }}
                                    onBlur={(e) =>
                                      !e.target.value &&
                                      e.target.value !== 0 &&
                                      form.setFieldValue(["splitArg", "raptor", "maxCluster"], 64)
                                    }
                                    onChange={(value) =>
                                      form.setFieldValue(
                                        ["splitArg", "raptor", "maxCluster"],
                                        value
                                      )
                                    }
                                    disabled={docAction === "edit"}
                                  />
                                </Form.Item>
                              </div>
                            </Form.Item>
                            <div className="flex">
                              <Form.Item
                                name={["splitArg", "raptor", "randomSeed"]}
                                label="随机种子"
                                rules={[
                                  {
                                    required: !(docAction === "view" || docAction === "edit"),
                                    message: "请输入随机种子"
                                  }
                                ]}
                                initialValue={0}
                                layout="horizontal"
                                className="flex-1"
                              >
                                <InputNumber
                                  min={-999999}
                                  max={999999}
                                  step={1}
                                  precision={0}
                                  placeholder="请输入随机种子"
                                  className="w-[100%]"
                                  disabled={docAction === "edit"}
                                />
                              </Form.Item>
                              <Tooltip title="点击生成随机数">
                                <Button
                                  className="ml-2 !h-[36px]"
                                  type="primary"
                                  onClick={() => {
                                    const randomNumber =
                                      Math.floor(Math.random() * (999999 - -999999 + 1)) + -999999
                                    form.setFieldValue(
                                      ["splitArg", "raptor", "randomSeed"],
                                      randomNumber
                                    )
                                  }}
                                  disabled={docAction === "edit"}
                                >
                                  <span className="iconfont icon-a-4 text-[28px]" />
                                </Button>
                              </Tooltip>
                            </div>
                          </>
                        )
                      )
                    }}
                  </Form.Item>
                </>
              )}
          </>
        )}
        {!isInstruction && (
          <>
            <Form.Item
              name="title"
              label="文档标题"
              rules={[{ required: true, message: "请输入文档标题!" }]}
            >
              <Input placeholder="请输入文档标题" />
            </Form.Item>
            <Form.Item
              name="files"
              label="选择文件"
              valuePropName="fileList"
              getValueFromEvent={(e) => {
                const fileList = Array.isArray(e) ? e : e?.fileList
                if (!fileList) return []
                // Only return files that have a success response or are not done yet.
                return fileList.filter((file) =>
                  file.response ? file.response.success === true : true
                )
              }}
              rules={[
                {
                  required: !(docAction === "view" || docAction === "edit"),
                  message: "请选择文件!"
                }
              ]}
            >
              {/* 当是查看或者编辑状态的时候,只展示一个文件icon以及文件名字 */}
              {docAction === "view" || docAction === "edit" ? (
                <div
                  className="flex items-start justify-start align-middle mt-[10px] mb-[10px] rounded-md px-2 py-4"
                  style={{ border: "1px solid #E4E7EC" }}
                >
                  <img
                    src={getFileIcon({ name: currentData?.name })}
                    alt=""
                    className="w-[40px] h-[40px] mr-2"
                  />
                  <div className="flex flex-col">
                    <div className="mt-[10px]">
                      <a
                        className="ml-1"
                        type="link"
                        href={currentData?.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {currentData?.name}
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <UploadFile
                    onChange={handleUploadChange}
                    action={uploadDocumentKnowledgeUrl(selectedKnowledgeBase)}
                    accept={DEFAULT_MINE_ACCEPTS}
                    beforeUpload={(file) => {
                      const isTypeAllowed = DEFAULT_MIME_TYPES.includes(file.type)
                      if (!isTypeAllowed) {
                        message.error("请上传正确的文件类型")
                        return Upload.LIST_IGNORE
                      }
                    }}
                  />
                  {/* <div className="text-[12px] text-gray-400">支持上传PDF、DOC、DOCX、TXT 等格式</div> */}
                </>
              )}
            </Form.Item>
            <div className="text-[12px] font-[400] text-[#475467] -mt-[10px] mb-[15px]">
              支持上传pdf, doc, docx, txt等格式的文档
            </div>
          </>
        )}
        <Form.Item name="summary" label="摘要说明">
          <Input.TextArea placeholder="请输入摘要说明" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default EditDocModal
