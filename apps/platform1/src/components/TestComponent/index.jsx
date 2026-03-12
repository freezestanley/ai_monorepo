import { useEffect, useRef, useState } from "react"
import {
  Button,
  Table,
  Steps,
  Upload,
  message,
  Form,
  Row,
  Col,
  Spin,
  Pagination,
  Modal,
  Typography,
  Select,
  Radio,
  Slider,
  Input,
  Divider,
  Result
} from "antd"
import { useLocation } from "react-router-dom"
import queryString from "query-string"
const { Title } = Typography
import upload2 from "@/assets/img/upload2.png"
import { downloadTestSetTemplate, exportTestSetExcel, uploadTestSetData } from "@/api/batchTest/api"
import {
  useCancelTestSet,
  useContinueTestSet,
  useCreateTestSet,
  useDebugTestSet,
  useDeleteTestSet,
  useFetchSkillVersionList,
  useFetchTestSetDetail,
  useFetchTestSetPage,
  useFetchTestSetSchema,
  useRunTestSetAgain
} from "@/api/batchTest"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { useQueryClient } from "@tanstack/react-query"
import {
  CheckCircleTwoTone,
  CheckOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  CoffeeOutlined,
  QuestionCircleOutlined
} from "@ant-design/icons"
import "./index.scss"
import { getTokenAndServiceName } from "@/api/sso"
import { useFetchLlmModelType, useFetchLlmFilterModelType } from "@/api/common"
import { marks } from "@/constants"
import { PromptTips, TestAssertPromptPlaceholder, TestAssertPromptTips } from "@/constants/tips"
import VariableTextArea from "@/pages/xflow/CustomFlowchartFormPanel/NodeComponent/components/VariableTextArea"
import MarkdownRenderer from "../MarkdownRenderer"
import { useGetTestSetList } from "@/api/testSet"
import AIOptimize from "@/components/AIOptimize"
import { isStudio } from "@/config.env"

const { Step } = Steps
const { Text } = Typography

const TestComponent = ({ skillFlowData }) => {
  const location = useLocation()
  const { studioenv } = queryString.parse(location.search)
  const [state, setState] = useState(1)
  const [currentStep, setCurrentStep] = useState(0)
  const [pagination, setPagination] = useState({ pageNum: 1, pageSize: 10 })
  const [importLoading, setImportLoading] = useState(false)
  const [fileId, setFileId] = useState(null)
  const [currentId, setCurrentId] = useState(null)
  const [testDetailData, setSetDetailData] = useState(null)
  const [currentVersion, setCurrentVersion] = useState(null)
  const [attributeName, setAttributeName] = useState([])
  const [assertType, setAssertType] = useState("0")
  const [debugResult, setDebugResult] = useState(null)
  const [assertConfig, setAssertConfig] = useState({})
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [exportCurrentDisabled, setExportCurrentDisabled] = useState(false)

  const [_, forceUpdate] = useState({})
  const [testSetList, setTestSetList] = useState([])

  const currentVersionRef = useRef(null)
  const [form] = Form.useForm()
  const [importForm] = Form.useForm()

  const {
    data: testSetPageData,
    isLoading,
    refetch: mainRefetch
  } = useFetchTestSetPage({
    botNo: skillFlowData.botNo,
    skillNo: skillFlowData.skillNo,
    pageNum: pagination.pageNum,
    pageSize: pagination.pageSize
  })
  const { mutate: createTestSet } = useCreateTestSet()
  const { mutate: debugTestSet, isLoading: isDebugLoading } = useDebugTestSet()
  const { mutate: deleteTest } = useDeleteTestSet()
  const { mutate: cancelTestSet } = useCancelTestSet()
  const { mutate: continueTestSet } = useContinueTestSet()
  const { mutate: reRunTest } = useRunTestSetAgain()
  const { data: modelOptions } = useFetchLlmModelType()
  const { data: testSetDetailData, refetch } = useFetchTestSetDetail({
    id: currentId,
    botNo: skillFlowData.botNo,
    skillNo: skillFlowData.skillNo
  })
  const { data: versionList } = useFetchSkillVersionList({
    botNo: skillFlowData.botNo,
    skillNo: skillFlowData.skillNo
  })

  const { data: outputData } = useFetchTestSetSchema({
    botNo: skillFlowData.botNo,
    skillNo: skillFlowData.skillNo,
    skillVersionNo: currentVersion
  })

  const { mutate: getTestSetList } = useGetTestSetList()

  const queryClient = useQueryClient()

  // Use Form.useWatch to monitor prompt field
  const promptValue = Form.useWatch("prompt", form)

  useEffect(() => {
    if (versionList) {
      setCurrentVersion(versionList.filter((item) => item.inUse)[0]?.versionNo)
      form.setFieldsValue({
        skillVersionNo: versionList.filter((item) => item.inUse)[0]?.versionNo
      })
    }
  }, [form, versionList])

  useEffect(() => {
    if (testSetDetailData) {
      setSetDetailData(testSetDetailData)
    }
  }, [testDetailData, testSetDetailData])

  useEffect(() => {
    console.log(testSetDetailData)
    let timer
    // 定义一个函数来进行数据的重新获取
    const fetchData = () => {
      if (
        testSetDetailData &&
        testSetDetailData?.status !== "SUCCESS" &&
        testSetDetailData?.status !== "CANCEL" &&
        testSetDetailData?.status !== "FAILED"
      ) {
        refetch() // 重新调用接口
      }
    }
    // 设置定时器
    if (
      testSetDetailData &&
      testSetDetailData?.status !== "SUCCESS" &&
      testSetDetailData?.status !== "CANCEL" &&
      testSetDetailData?.status !== "FAILED"
    ) {
      timer = setInterval(fetchData, 5000) // 每5秒调用一次
    }
    // 清除定时器
    return () => clearTimeout(timer)
  }, [testSetDetailData, refetch])

  useEffect(() => {
    getTestSetList(
      {
        botNo: skillFlowData.botNo
      },
      {
        onSuccess: (res) => {
          if (res.success === true) {
            setTestSetList(res.data)
          }
        }
      }
    )
  }, [skillFlowData.botNo, getTestSetList])

  useEffect(() => {
    if (attributeName && Array.isArray(attributeName) && attributeName.length > 1) {
      importForm.setFieldsValue({
        importType: "1"
      })
    }
  }, [attributeName, importForm])

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

  const onAssertChange = (e) => {
    setAssertType(e.target.value)
  }
  const debugAssert = () => {
    form.validateFields().then((values) => {
      console.log("values:", values)
      const { expectResult, actualResult, temperature, prompt, modelType } = values
      debugTestSet(
        {
          expectResult,
          actualResult,
          temperature,
          prompt,
          modelType,
          botNo: skillFlowData.botNo,
          skillNo: skillFlowData.skillNo
        },
        {
          onSuccess: (res) => {
            setDebugResult(res.data)
          },
          onError: (err) => {
            console.log("err:", err)
            setDebugResult(JSON.stringify(err))
            message.error("断言失败")
          }
        }
      )
    })
  }

  // 切换步骤
  const nextStep = async () => {
    const outputSchema = outputData?.outputList?.filter((item) =>
      attributeName?.includes(item.attributeName)
    )
    importForm.validateFields().then((values) => {
      const submitData = {
        botNo: skillFlowData.botNo,
        skillNo: skillFlowData.skillNo,
        skillVersionNo: currentVersion,
        assertType,
        assertConfig,
        compareColumns: outputSchema.map((item) => {
          return { ...item, assertType }
        })
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

      createTestSet(submitData, {
        onSuccess: (e) => {
          if (e.success) {
            setCurrentStep(currentStep + 1)
            message.success(e.message)
            setCurrentId(e.data)
            // setCurrentVersion(null)
          } else {
            message.error(e.message)
          }
        }
      })
    })
  }

  // 返回状态1
  const backToState1 = () => {
    setState(1)
    setCurrentStep(0)
  }

  const renderState1UI = () => {
    const columns = [
      {
        title: "版本",
        dataIndex: "skillVersionName",
        key: "skillVersionName",
        width: 50
      },
      {
        title: "测试时间",
        dataIndex: "gmtCreated",
        key: "gmtCreated",
        width: 120
      },
      {
        title: "测试结束时间",
        dataIndex: "gmtModified",
        key: "gmtModified",
        width: 120
      },
      {
        title: "测试集",
        dataIndex: "setName",
        key: "setName",
        render: (text) => {
          return <div>{text || "--"}</div>
        }
      },
      { title: "测试数量", dataIndex: "testCount", key: "testCount" },
      { title: "测试人", dataIndex: "modifier", key: "modifier" },
      {
        title: "状态",
        dataIndex: "status",
        key: "status",
        render: (text) => (
          <>
            {text === "RUNNING"
              ? "执行中"
              : text === "SUCCESS"
                ? "已完成"
                : text === "CANCEL"
                  ? "已中止"
                  : "失败"}
          </>
        )
      },
      {
        title: "正确率",
        dataIndex: "accuracy",
        key: "accuracy",
        render: (text) => {
          return text === -1 ? "-" : text + "%"
        }
      },
      {
        title: "操作",
        key: "action",
        render: (_, record) => (
          <span>
            <Button type="link" onClick={() => viewTest(record)} className="p-0">
              查看
            </Button>

            {record.status === "RUNNING" && (
              <Button type="link" onClick={() => handleCancel(record)} className="p-0 pl-3">
                中止
              </Button>
            )}

            {(record.status === "CANCEL" || record.status === "FAILED") && (
              <Button type="link" onClick={() => handleContinue(record)} className="p-0 pl-3">
                续跑
              </Button>
            )}

            <Button type="link" onClick={() => handleDelete(record)}>
              删除
            </Button>
          </span>
        )
      }
    ]

    const viewTest = (record) => {
      console.log(record)
      setState(2)
      setCurrentStep(2)
      // 查询测试详情
      setCurrentId(record.id)
      refetch()
    }

    const handleContinue = (record) => {
      Modal.confirm({
        title: "续跑测试",
        content: "确定续跑该测试吗?",
        okText: "确定",
        cancelText: "取消",
        onOk: () => {
          continueTestSet(
            {
              id: record.id,
              botNo: skillFlowData.botNo,
              skillNo: skillFlowData.skillNo
            },
            {
              onSuccess: (e) => {
                if (e.success) {
                  message.success(e.message)
                  queryClient.invalidateQueries([QUERY_KEYS.TEST_SET_PAGE])
                } else {
                  message.error(e.message)
                }
              }
            }
          )
        }
      })
    }

    const handleCancel = (record) => {
      Modal.confirm({
        title: "中止测试",
        content: "确定中止该测试吗?",
        okText: "确定",
        cancelText: "取消",
        onOk: () => {
          cancelTestSet(
            {
              id: record.id,
              botNo: skillFlowData.botNo,
              skillNo: skillFlowData.skillNo
            },
            {
              onSuccess: (e) => {
                if (e.success) {
                  message.success(e.message)
                  queryClient.invalidateQueries([QUERY_KEYS.TEST_SET_PAGE])
                } else {
                  message.error(e.message)
                }
              }
            }
          )
        }
      })
    }

    const handleDelete = (record) => {
      console.log(record)
      // 删除测试逻辑,需要一个Modal, 接口则为:deleteTest
      Modal.confirm({
        title: "删除测试",
        content: "确定删除该测试吗?",
        okText: "确定",
        cancelText: "取消",
        onOk: () => {
          deleteTest(
            {
              id: record.id,
              botNo: skillFlowData.botNo,
              skillNo: skillFlowData.skillNo
            },
            {
              onSuccess: (e) => {
                if (e.success) {
                  message.success(e.message)
                  queryClient.invalidateQueries([QUERY_KEYS.TEST_SET_PAGE])
                } else {
                  message.error(e.message)
                }
              }
            }
          )
        }
      })
    }

    return (
      <div className="text-right p-4">
        <Button
          onClick={() => {
            setState(2)
            // 清除选择对比字段
            setAttributeName(null)
            form.setFieldValue("attributeName", null)
          }}
          className="mb-4"
        >
          新增批量测试
        </Button>
        <Table columns={columns} dataSource={testSetPageData?.data} pagination={false} />
        <Pagination
          current={pagination.pageNum}
          pageSize={pagination.pageSize}
          total={testSetPageData ? testSetPageData?.totalCount : 0}
          onChange={(page, pageSize) => setPagination({ pageNum: page, pageSize })}
          showSizeChanger={true}
          style={{ marginTop: "15px", textAlign: "right" }}
          showTotal={(total) => `共 ${total} 条`}
        />
      </div>
    )
  }

  // renderState2UI 方法
  const renderState2UI = () => {
    const renderSetStep = () => {
      const passed = debugResult === true
      const failed = debugResult === false

      return (
        <div className="p-6">
          <h1 className="text-xl font-bold">说明</h1>
          <p style={{ lineHeight: 2 }}>
            批量测试功能可批量导入需要测试的数据集，从而測试当前工作流的输出结果，并且可以生成两部分内容：
            <br />
            1. 基于提供的输入值，批量执行后得到测试输出结果
            <br />
            2.（可选)填写预期结果，系统判断是否与输出一致，来判定对错，最终可得出该批次的正确率
          </p>

          <h1 className="text-xl font-bold mt-10">开始设置</h1>
          <Form form={form} labelCol={{ span: 4 }} wrapperCol={{ span: 16 }}>
            {/* 一个select */}
            <Form.Item
              className="mt-2"
              label="工作流测试版本"
              name="skillVersionNo"
              rules={[{ required: true, message: "请选择工作流测试版本" }]}
            >
              <Select placeholder="请选择工作流测试版本" onChange={setCurrentVersion} allowClear>
                {versionList?.map((item) => (
                  <Select.Option value={item.versionNo} key={item.versionNo}>
                    {item.versionName}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <p className="mt-5 mb-5">(非必选）请选择需要进行结果对比的字段，如不需要可不用选择：</p>

            <Form.Item className="mt-2" label="选择对比字段" name="attributeName">
              <Select placeholder="请选择对比字段" onChange={setAttributeName} mode="multiple">
                {outputData?.outputList?.map((item) => (
                  <Select.Option value={item.attributeName} key={item.attributeName}>
                    {item.title}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item className="mt-2" label="断言类型" name="assertType">
              <Radio.Group defaultValue={"0"} onChange={onAssertChange}>
                <Radio value={"0"}>文本对比</Radio>
                <Radio value={"1"}>大模型断言</Radio>
              </Radio.Group>
            </Form.Item>
            {assertType === "1" && (
              <>
                <Form.Item
                  name="modelType"
                  label="模型类型"
                  rules={[{ required: true }]}
                  initialValue={
                    (modelOptions.filter((item) => {
                      return item.status === 1 && item.name === "通义千问"
                    }) || [])?.[0]?.code || ""
                  }
                >
                  <Select
                    placeholder="请选择模型类型"
                    showSearch
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {modelOptions?.map((opt) => (
                      <Select.Option key={opt.code} value={opt.code} disabled={opt.status === 0}>
                        {opt.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item initialValue={0.7} name="temperature" label="回答风格">
                  <Slider max={2} step={0.1} marks={marks} />
                </Form.Item>
                <Form.Item
                  className="global-tips"
                  style={{
                    marginLeft: 8
                  }}
                  name="prompt"
                  label={
                    <div className="flex items-center">
                      <span className="mr-2">提示词</span>
                      {skillFlowData?.skillNo && (
                        <AIOptimize
                          originalPrompt={promptValue}
                          intelligentAgentType="SKILL"
                          intelligentAgentNo={skillFlowData.skillNo}
                          onSubmit={({ type, content }) => {
                            if (type === "agent") {
                              form.setFieldsValue({ prompt: content })
                            }
                          }}
                        />
                      )}
                    </div>
                  }
                  labelCol={{
                    span: 24,
                    push: 1
                  }}
                  wrapperCol={{
                    span: 19,
                    offset: 1
                  }}
                  tooltip={{
                    title: TestAssertPromptTips,
                    overlayStyle: { maxWidth: 400 }
                  }}
                  initialValue={TestAssertPromptPlaceholder}
                >
                  <VariableTextArea
                    variables={[]}
                    miniInputProps={{
                      placeholder: TestAssertPromptPlaceholder
                    }}
                    largeInputProps={{
                      placeholder: TestAssertPromptPlaceholder
                    }}
                  />
                </Form.Item>

                <Row justify="space-around" className="mb-4">
                  <Col span={10}>
                    <Title level={5}>断言调试</Title>
                  </Col>
                  <Col span={10} pull={3} className="text-right">
                    <Button type="primary" onClick={debugAssert}>
                      调试
                    </Button>
                  </Col>
                </Row>
                <Row>
                  <Col span={20}>
                    <Form.Item
                      name="expectResult"
                      labelCol={{ span: 4 }}
                      wrapperCol={{ span: 20 }}
                      label="期望结果"
                      rules={[
                        {
                          required: true,
                          message: "请输入期望结果"
                        }
                      ]}
                    >
                      <Input placeholder="请输入期望结果" />
                    </Form.Item>
                  </Col>
                  <Col span={20}>
                    <Form.Item
                      name="actualResult"
                      labelCol={{ span: 4 }}
                      wrapperCol={{ span: 20 }}
                      label="实际结果"
                      rules={[
                        {
                          required: true,
                          message: "请输入实际结果"
                        }
                      ]}
                    >
                      <Input placeholder="请输入实际结果" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row>
                  <Col span={20} push={1}>
                    <div
                      className="debug-content-wrapper"
                      style={{
                        maxHeight: 600
                      }}
                    >
                      <Result
                        icon={
                          isDebugLoading ? (
                            <Spin spinning={true} />
                          ) : passed ? (
                            <CheckCircleTwoTone twoToneColor="#52c41a" />
                          ) : failed ? (
                            <CloseCircleOutlined />
                          ) : (
                            <CoffeeOutlined />
                          )
                        }
                        title={
                          isDebugLoading
                            ? "正在调试中，请稍后……"
                            : passed
                              ? "调试通过！"
                              : failed
                                ? "调试失败"
                                : "待调试~"
                        }
                        subTitle={
                          isDebugLoading
                            ? "我把服务器资源都给你了，请相信我的速度……"
                            : passed
                              ? "不错不错，这么快就调试通过了，你可以进行下一步咯！"
                              : failed
                                ? `断言未成功哦[${debugResult}]`
                                : "快快来调试我吧~"
                        }
                      />
                    </div>
                  </Col>
                </Row>
              </>
            )}
            <div className="mt-4 mt-12">
              <Button onClick={backToState1}>取消</Button>
              <Button
                onClick={() => {
                  if (assertType === "1") {
                    const { temperature, prompt, modelType } = form.getFieldsValue()
                    setAssertConfig({ temperature, prompt, modelType })
                  } else {
                    setAssertConfig({})
                  }

                  setCurrentStep(currentStep + 1)
                }}
                disabled={!currentVersion}
                type="primary"
                style={{ marginLeft: 8 }}
              >
                下一步
              </Button>
            </div>
          </Form>
        </div>
      )
    }

    const renderImportTestSet = () => {
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
            批量测试功能可批量导入需要测试的数据集,从而测试当前工作流的输出结果,并且可以生成两部分内容:{" "}
            <br />
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
            {importForm.getFieldValue("importType") === "1" ? (
              <>
                <Button
                  type="link"
                  className="p-0 mt-2"
                  onClick={() => {
                    const outputSchema = outputData?.outputList?.filter((item) =>
                      attributeName?.includes(item.attributeName)
                    )
                    downloadTestSetTemplate(
                      {
                        botNo: skillFlowData.botNo,
                        skillNo: skillFlowData.skillNo,
                        skillVersionNo: currentVersion
                      },
                      outputSchema
                    )
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
                        ? { botno: skillFlowData.botNo || undefined, studioenv: studioenv || "prd" }
                        : {})
                    }}
                    accept=".xlsx" // 限制文件格式
                    onChange={handleUploadChange}
                    action={uploadTestSetData({
                      botNo: skillFlowData.botNo,
                      skillNo: skillFlowData.skillNo,
                      skillVersionNo: skillFlowData.versionNo
                    })}
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
          </Form>

          <div className="mt-4 mt-12">
            <Button
              onClick={() => {
                setCurrentStep(currentStep - 1)
                setFileId(null)
              }}
            >
              上一步
            </Button>
            <Button
              disabled={
                (importForm.getFieldValue("importType") === "1" && !fileId) ||
                (importForm.getFieldValue("importType") === "0" &&
                  !importForm.getFieldValue("setNo"))
              }
              type="primary"
              onClick={nextStep}
              style={{ marginLeft: 8 }}
              loading={importLoading}
            >
              下一步
            </Button>
          </div>
        </div>
      )
    }

    const renderViewResults = () => {
      const reGenerator = () => {
        setIsModalVisible(true)
      }

      const handleModalOk = () => {
        if (!currentVersionRef.current) {
          message.error("请选择工作流测试版本")
          return
        }
        reRunTest(
          {
            id: testDetailData.id,
            botNo: skillFlowData.botNo,
            skillNo: skillFlowData.skillNo,
            skillVersionNo: currentVersionRef.current
          },
          {
            onSuccess: (e) => {
              console.log(e)
              if (e.success) {
                message.success(e.message)
                setCurrentId(e.data)
                setIsModalVisible(false)
              } else {
                message.error(e.message)
              }
            }
          }
        )
      }

      const handleModalCancel = () => {
        setIsModalVisible(false)
        currentVersionRef.current = null
      }

      const resultsColumns =
        testDetailData?.excelTable?.columns.map((col) => ({
          title: col.columnName,
          dataIndex: col.columnName,
          key: col.columnName,
          width: col.columnName === "测试结果" ? 120 : 200,
          align: "center",
          sorter:
            col.columnName === "测试结果"
              ? (a, b) => {
                  return a[col.columnName].localeCompare(b[col.columnName])
                }
              : false,
          render: (text) => {
            // 溢出处理
            return (
              <>
                {col.columnName === "测试结果" &&
                  (text === "通过" ? (
                    <CheckOutlined style={{ color: "green" }} />
                  ) : text === "不通过" ? (
                    <CloseOutlined style={{ color: "red" }} />
                  ) : null)}
                {col.columnName !== "测试结果" && (
                  <Typography.Paragraph style={{ margin: 0 }} ellipsis={{ rows: 3, tooltip: text }}>
                    {text}
                  </Typography.Paragraph>
                )}
              </>
            )
          }
        })) || []
      let dataSource = []
      if (testDetailData?.excelTable) {
        dataSource = testDetailData?.excelTable?.dataSource.map((row, index) => {
          const rowObj = { key: index }
          row.forEach((cell) => {
            rowObj[testDetailData.excelTable.columns[cell.columnIndex].columnName] = cell.data
          })
          return rowObj
        })
      }
      return (
        <div className="p-4">
          <h1 className="text-xl font-bold mb-1">查看结果</h1>
          <Row className="mt-2 mb-5 text-gray-600" gutter={12}>
            <Col span={8}>
              <span className="font-bold text-gray-900">工作流:</span> {testDetailData?.skillName}
            </Col>
            <Col span={8}>
              <span className="font-bold text-gray-900">版本:</span>{" "}
              {testDetailData?.skillVersionName}
            </Col>
            <Col span={8}>
              <span className="font-bold text-gray-900">测试时间:</span>{" "}
              {testDetailData?.gmtModified}
            </Col>
          </Row>
          <Row className="mb-4 mb-2 text-gray-600">
            <Col span={8}>
              <span className="font-bold text-gray-900">测试人:</span> {testDetailData?.modifier}
            </Col>
            {testDetailData?.status === "SUCCESS" && (
              <Col span={8}>
                <span className="font-bold text-gray-900">正确率:</span>{" "}
                {testDetailData?.accuracy === -1
                  ? "-"
                  : testDetailData?.accuracy && testDetailData?.accuracy + "%"}
              </Col>
            )}
            <Col span={8}>
              <span className="font-bold text-gray-900">完成率:</span>
              {testDetailData?.progress + "%"}
            </Col>
          </Row>
          {testDetailData?.status === "SUCCESS" && (
            <Row justify={"end"} className="mb-1 mt-6">
              <Button type="primary" className="mr-2" size="small" onClick={reGenerator}>
                再次生成
              </Button>
              <Button
                size="small"
                type="primary"
                onClick={() => {
                  exportTestSetExcel({
                    botNo: skillFlowData.botNo,
                    skillNo: skillFlowData.skillNo,
                    skillVersionNo: testDetailData.skillVersionNo,
                    id: testDetailData.id
                  })
                }}
              >
                导出
              </Button>
            </Row>
          )}

          <Modal
            title="再次生成"
            open={isModalVisible}
            onOk={handleModalOk}
            onCancel={handleModalCancel}
            okText="确定"
            cancelText="取消"
          >
            <div className="p-2">
              <Select
                placeholder="请选择工作流测试版本"
                style={{ width: "100%" }}
                onChange={(e) => {
                  currentVersionRef.current = e
                }}
                allowClear
              >
                {versionList?.map((item) => (
                  <Select.Option value={item.versionNo} key={item.versionNo}>
                    {item.versionName}
                  </Select.Option>
                ))}
              </Select>
            </div>
          </Modal>

          <Table
            loading={
              testDetailData?.status &&
              testDetailData?.status !== "SUCCESS" &&
              testDetailData.status !== "CANCEL" &&
              testDetailData.status !== "FAILED"
            }
            columns={resultsColumns}
            dataSource={dataSource || []}
          />
        </div>
      )
    }

    return (
      <div
        className="flex test-component-wrapper"
        style={
          {
            // height: "calc(100vh - 110px)"
          }
        }
      >
        <Button
          className="absolute back-icon"
          type="primary"
          size="small"
          onClick={() => {
            setState(1)
            setCurrentStep(0)
            mainRefetch()
          }}
        >
          返回
        </Button>
        <Steps
          size="small"
          direction="vertical"
          current={currentStep}
          className="w-72"
          style={{
            padding: 24,
            height: 400,
            minWidth: 180
          }}
        >
          <Step title="设置" />
          <Step title="开始导入" />
          <Step title="查看结果" />
        </Steps>
        <div
          className="flex-grow"
          style={{
            borderLeft: "1px solid #CECECE",
            flex: 1
          }}
        >
          {currentStep === 0 && renderSetStep()}
          {currentStep === 1 && renderImportTestSet()}
          {currentStep === 2 && renderViewResults()}
        </div>
      </div>
    )
  }

  return <>{state === 1 ? renderState1UI() : renderState2UI()}</>
}

export default TestComponent
