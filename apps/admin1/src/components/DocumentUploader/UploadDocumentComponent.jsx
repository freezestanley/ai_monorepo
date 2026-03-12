import { Button, Col, Form, Input, Row, Upload, message } from "antd"
import upload1 from "@/assets/img/upload1.png"
import upload2 from "@/assets/img/upload2.png"
import upload3 from "@/assets/img/upload3.png"
import upload4 from "@/assets/img/upload4.png"
import upload5 from "@/assets/img/upload5.png"
import upload6 from "@/assets/img/upload6.png"
import { MinusSquareOutlined } from "@ant-design/icons"
import { getTokenAndServiceName } from "@/api/sso"

const UploadDocumentComponent = ({
  fileList,
  setIsValidFile,
  setFileList,
  handleUploadChange,
  handleSplitUpload,
  questions,
  setQuestions
}) => {
  return (
    <>
      <div className="flex items-center justify-center flex-col mb-6">
        <img src={upload1} width={64} height={64} alt="" />
        <span className="mt-2 normal-text">上传文档自动生成问答</span>
      </div>
      <Upload.Dragger
        maxCount={1}
        name="file"
        headers={{
          "X-Usercenter-Session": getTokenAndServiceName().token
        }}
        showUploadList={false}
        accept=".pdf,.doc,.docx,.txt,.html" // 限制文件格式
        onChange={handleUploadChange}
        action={handleSplitUpload()}
        beforeUpload={(file) => {
          const isLt10M = file.size / 1024 / 1024 < 10
          const allowedExtensions = [".pdf", ".doc", ".docx", ".txt", ".html"]
          const fileExtension = "." + file.name.split(".").pop().toLowerCase()

          if (!isLt10M) {
            message.error("文件大小超过10MB!")
            setIsValidFile(false)
            return false
          }

          if (!allowedExtensions.includes(fileExtension)) {
            message.error("不支持的文件格式!")
            setIsValidFile(false)
            return false
          }

          setIsValidFile(true)
          return true
        }}
        height={160}
        style={{
          width: 940
        }}
        className="mb-4"
      >
        <p className="ant-upload-text normal-text">
          <img src={upload2} alt="" width={26} height={19} className="mr-2" />
          将文档拖拽到此处，或
          <span style={{ color: "#5E5FF8" }}>本地上传</span>
        </p>
        <p className="ant-upload-hint">
          支持pdf、doc、docx、txt、html 类型的文档，每次支持单个文档上传,最大10M
        </p>
      </Upload.Dragger>
      {fileList.length > 0 && (
        <div className="mb-4 mt-4">
          <p className="mb-2 font-semibold text-sm">
            文档: <span style={{ color: "#5E5FF8" }}>{fileList[0].name}</span>{" "}
          </p>
          <div className="flex flex-col items-center justify-center mt-24">
            <img src={upload3} width={130} height={98} alt="" />
            <p className="my-2 normal-text">系统将根据已上传的文档为您生成问答的文字提示</p>
            <Button
              type="primary"
              onClick={() => setQuestions([...questions, { id: Date.now(), value: "" }])}
              className="mt-2 mb-4"
            >
              添加指定问题
            </Button>
          </div>
          <Form>
            {questions.length > 0 && (
              <div className="tips text-center mb-3 mt-5">
                如需要添加指定问题，可在下方输入问题，系统将自动根据文档内容生成答案
              </div>
            )}

            {questions.map((q, idx) => (
              <div key={q.id} className="mb-2">
                <Row>
                  <Col span={20}>
                    <Form.Item
                      label={
                        <>
                          <img src={upload5} alt="" width={12} height={17} className="mr-2" />
                          {`指定问题${idx + 1}`}
                        </>
                      }
                      labelCol={{ span: 4 }}
                    >
                      <Input
                        value={q.value}
                        onChange={(e) => {
                          const newQuestions = [...questions]
                          newQuestions[idx].value = e.target.value
                          setQuestions(newQuestions)
                        }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <MinusSquareOutlined
                      className="text-lg ml-4 mt-2 cursor-pointer"
                      style={{
                        color: "#5E5FF8"
                      }}
                      onClick={() => {
                        const newQuestions = questions.filter((item) => item.id !== q.id)
                        setQuestions(newQuestions)
                      }}
                    />
                  </Col>
                </Row>
              </div>
            ))}
          </Form>
        </div>
      )}
    </>
  )
}

export default UploadDocumentComponent
