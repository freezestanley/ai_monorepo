import { useState, useEffect } from "react"
import { Form, Upload, Button, message, Spin, Radio, Select, Typography, Table } from "antd"
import {
  downloadTestSetTemplate,
  downloadAgentTestSetTemplate,
  uploadTestSetData,
  uploadAgentTestSetData
} from "@/api/batchTest/api"
import { useCreateTestSet, useCreateAgentTestSet } from "@/api/batchTest"
import { useGetTestSetList } from "@/api/testSet"
import { getTokenAndServiceName } from "@/api/sso"
import { isStudio } from "@/config.env"
import upload2 from "@/assets/img/upload2.png"

const { Text } = Typography

const testSetColumns = [
  { title: "输入 (必填)", dataIndex: "input", key: "input" },
  { title: "输出 (系统返回值)", dataIndex: "output", key: "output" },
  { title: "预期结果 (选填)", dataIndex: "expected", key: "expected" },
  { title: "测试结果 (系统返回值)", dataIndex: "result", key: "result" }
]
const testSetData = [
  {
    key: "1",
    input: "对话内容",
    output: "系统输出",
    expected: "预期输出",
    result: "正确"
  }
]

const RenderImportTestSet = ({
  type,
  botNo,
  skillNo,
  agentNo,
  studioenv,
  currentVersion,
  outputData,
  attributeName,
  setCurrentStep,
  setCurrentId,
  formData
}) => {
  const [importForm] = Form.useForm()
  const [_, forceUpdate] = useState({})
  const [importLoading, setImportLoading] = useState(false)
  const [testSetList, setTestSetList] = useState([])
  const [fileId, setFileId] = useState(null)

  const { mutate: createTestSet } = useCreateTestSet()
  const { mutate: createAgentTestSet } = useCreateAgentTestSet()
  const { mutate: getTestSetList } = useGetTestSetList()

  useEffect(() => {
    if (attributeName && Array.isArray(attributeName) && attributeName.length > 1) {
      importForm.setFieldsValue({
        importType: "1"
      })
    }
  }, [attributeName, importForm])

  useEffect(() => {
    getTestSetList(
      {
        botNo
      },
      {
        onSuccess: (res) => {
          if (res.success === true) {
            setTestSetList(res.data)
          }
        }
      }
    )
  }, [botNo, getTestSetList])

  const handleUploadChange = (info, e) => {
    console.log(info, e)
    if (info.file.status === "uploading") {
      setImportLoading(true)
    }

    if (info.file.status === "done") {
      if (info.file.response.success) {
        setFileId(info.file.response.data)
        setImportLoading(false)
      } else {
        message.error(info.file.response.message)
        setImportLoading(false)
      }
    }
  }

  // 切换步骤
  const nextStep = async () => {
    const outputSchema = outputData?.outputList?.filter((item) =>
      attributeName?.includes(item.attributeName)
    )
    importForm.validateFields().then((values) => {
      const { assertType, summaryAssertType, assertConfig, summaryAssertConfig, ...rest } =
        formData || {}
      const submitData = {
        botNo,
        assertType,
        ...rest,
        compareColumns:
          outputSchema?.map((item) => {
            return {
              ...item,
              assertType,
              assertConfig: assertType === "1" ? assertConfig : undefined
            }
          }) || undefined
      }
      assertType === "1" && (submitData.assertConfig = assertConfig)
      summaryAssertType === "1" && (submitData.summaryAssertConfig = summaryAssertConfig)
      if (type === "skill") {
        submitData.skillNo = skillNo
        submitData.skillVersionNo = currentVersion
      } else {
        submitData.agentNo = agentNo
        submitData.agentVersionNo = currentVersion
      }
      const { importType, setNo } = values
      if (importType === "1") {
        if (!fileId) {
          message.error("请先上传文件")
          return
        } else {
          submitData.fileId = fileId
        }
      }
      if (importType === "0") {
        if (!setNo) {
          message.error("请选择测试集")
          return
        } else {
          submitData.setNo = setNo
        }
      }

      ;(type === "skill" ? createTestSet : createAgentTestSet)(submitData, {
        onSuccess: (e) => {
          if (e.success) {
            setCurrentStep((currentStep) => currentStep + 1)
            message.success(e.message)
            setCurrentId(e.data)
          } else {
            message.error(e.message)
          }
        }
      })
    })
  }

  return (
    <div className="p-6">
      {/* 需要有一个说明的title 用Tailwindcss添加样式 */}
      <h1 className="text-xl font-bold mb-1">说明</h1>
      <p
        className="mb-4"
        style={{
          lineHeight: "1.8"
        }}
      >
        批量测试功能可批量导入需要测试的数据集,从而测试当前{type === "skill" ? "工作流" : "Agent"}
        的输出结果,并且可以生成两部分内容: <br />
        1.基于提供的输入值,批量执行后得到测试输出结果; <br />
        2.(可选)填写预期结果,系统判断是否与输出一致,来判定对错,最终可得出该批次的正确率
      </p>
      <Table columns={testSetColumns} dataSource={testSetData} pagination={false} />
      <h1 className="text-lg font-bold mb-1 mt-12">开始导入</h1>
      <Form form={importForm}>
        <Form.Item
          className="mt-2"
          label="导入方式"
          name="importType"
          initialValue={"0"}
          rules={[
            {
              required: true,
              message: "请选择导入方式"
            }
          ]}
        >
          <Radio.Group
            onChange={() => {
              forceUpdate({})
            }}
            disabled={attributeName?.length > 1}
          >
            <Radio value={"0"}>测试集导入</Radio>
            <Radio value={"1"}>模板导入</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) =>
            prevValues.importType !== currentValues.importType
          }
        >
          {({ getFieldValue }) => {
            return (
              <>
                {getFieldValue("importType") === "1" ? (
                  <>
                    <Button
                      type="link"
                      className="p-0 mt-2"
                      onClick={() => {
                        const outputSchema = outputData?.outputList?.filter((item) =>
                          attributeName?.includes(item.attributeName)
                        )
                        if (type === "skill") {
                          downloadTestSetTemplate(
                            {
                              botNo,
                              skillNo,
                              skillVersionNo: currentVersion
                            },
                            outputSchema
                          )
                        } else {
                          downloadAgentTestSetTemplate(
                            {
                              botNo,
                              agentNo,
                              agentVersionNo: currentVersion
                            },
                            outputSchema
                          )
                        }
                      }}
                    >
                      下载模板
                    </Button>
                    <Spin spinning={importLoading}>
                      <Upload.Dragger
                        maxCount={1}
                        name="file"
                        headers={{
                          "X-Usercenter-Session": getTokenAndServiceName().token,
                          ...(isStudio()
                            ? { botno: botNo || undefined, studioenv: studioenv || "prd" }
                            : {})
                        }}
                        accept=".xlsx" // 限制文件格式
                        onChange={handleUploadChange}
                        action={
                          type === "skill"
                            ? uploadTestSetData({
                                botNo,
                                skillNo,
                                skillVersionNo: currentVersion
                              })
                            : uploadAgentTestSetData({
                                botNo,
                                agentNo,
                                agentVersionNo: currentVersion
                              })
                        }
                        beforeUpload={(file) => {
                          const isLt10M = file.size / 1024 / 1024 < 10
                          const allowedExtensions = [".xlsx"]
                          const fileExtension = "." + file.name.split(".").pop().toLowerCase()

                          if (!isLt10M) {
                            message.error("文件大小超过10MB!")
                            return false
                          }

                          if (!allowedExtensions.includes(fileExtension)) {
                            message.error("不支持的文件格式!")
                            return false
                          }

                          return true
                        }}
                        height={160}
                        className="mb-4"
                      >
                        <p className="ant-upload-text normal-text">
                          <img src={upload2} alt="" width={26} height={19} className="mr-2" />
                          将文档拖拽到此处，或
                          <span style={{ color: "#5E5FF8" }}>本地上传</span>
                        </p>

                        <p className="ant-upload-hint">请使用模板格式,每次支持单个文档上传</p>
                      </Upload.Dragger>
                    </Spin>
                  </>
                ) : (
                  <>
                    <Form.Item
                      className="mt-2"
                      label="测试集"
                      name="setNo"
                      rules={[{ required: true, message: "请选择测试集" }]}
                    >
                      <Select
                        placeholder="请选择测试集"
                        onChange={() => {
                          forceUpdate({})
                        }}
                      >
                        {testSetList?.map((item) => (
                          <Select.Option value={item.setNo} key={item.setNo}>
                            {item.setName}（{item.count}条）
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Text type="secondary" className="pb-4">
                      可前往【Agents-测试集管理】创建、管理测试集
                    </Text>
                    <div></div>
                    <Text type="secondary" className="pb-4">
                      语音Agent现在已支持自动将请求文本转换为JSON参数格式，请勿重复手动封装！
                    </Text>
                  </>
                )}
              </>
            )
          }}
        </Form.Item>
      </Form>

      <div className="mt-4 mt-12">
        <Button
          onClick={() => {
            setCurrentStep((currentStep) => currentStep - 1)
            setFileId(null)
          }}
        >
          上一步
        </Button>
        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) =>
            prevValues.importType !== currentValues.importType ||
            prevValues.setNo !== currentValues.setNo
          }
        >
          {({ getFieldValue }) => {
            return (
              <Button
                disabled={
                  (getFieldValue("importType") === "1" && !fileId) ||
                  (getFieldValue("importType") === "0" && !getFieldValue("setNo"))
                }
                type="primary"
                onClick={nextStep}
                style={{ marginLeft: 8 }}
                loading={importLoading}
              >
                下一步
              </Button>
            )
          }}
        </Form.Item>
      </div>
    </div>
  )
}

export default RenderImportTestSet
