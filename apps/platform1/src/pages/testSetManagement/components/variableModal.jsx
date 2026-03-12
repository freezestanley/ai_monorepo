import { CodeEditor } from "@/components/CodeEditor"
import createModal from "@/hooks/createModal"
import VariableTextArea from "@/pages/xflow/CustomFlowchartFormPanel/NodeComponent/components/VariableTextArea"
import { Form, message, Select, Input, Button, Modal, Divider, Spin } from "antd"
import { useState, useCallback } from "react"
import UseGenerateCode from "@/pages/xflow/CustomFlowchartFormPanel/NodeComponent/hooks/useGenerateCode"
import {
  useDebugVariable,
  useAddVariable,
  useEditVariable,
  useVariableEnumeList
} from "@/api/testSet"
import { useEffect } from "react"
// @ts-ignore
import { fetchEventSource, EventStreamContentType } from "@microsoft/fetch-event-source"
// @ts-ignore
import { getTokenAndServiceName } from "@/api/sso"

// @ts-ignore
import { Post } from "@/api/server"
// @ts-ignore
import { botPrefix } from "@/constants"
import { Drawer } from "antd"
import { Row } from "antd"
import { Col } from "antd"
import { Empty } from "antd"

// @ts-ignore
import empty from "@/assets/img/empty.png"

const MyModal = (props) => {
  const { detail, onOk, onCancel, visible } = props
  const [form] = Form.useForm()
  const [methodDesc, setMethodDesc] = useState(undefined)
  const [debugDetail, setDebugDetail] = useState(undefined)
  const [debugErrorDetail, setDebugErrorDetail] = useState(undefined)

  // 方法 handle
  const onMouseBlur = (value) => {
    // @ts-ignore
    const content = form.getFieldValue("methodDesc")
    const str = `${value?.target?.value}`
    setMethodDesc(str)
    form.setFieldsValue({
      methodDesc: str
    })
  }

  // 生成代码
  const { codeContent, setCodeContent, startGenerateCode, loading, stopGenerate } =
    UseGenerateCode()

  const onGenerateCode = () => {
    if (loading) {
      stopGenerate()
      return
    }

    return form
      .validateFields(["variableName", "variableValueType", "description", "methodDesc"])
      .then((values) => {
        const { variableValueType = "string", variableName, description } = values
        const args = [
          {
            name: `tstvar.${variableName?.trim()}`,
            type: variableValueType,
            desc: description
          }
        ]

        const generateCodeParams = {
          args,
          methodDesc: form.getFieldValue("methodDesc") || undefined,
          scriptType: "python"
        }
        setCodeContent("")
        startGenerateCode(`/botWeb/common/script/generate`, generateCodeParams)
      })
  }

  useEffect(() => {
    form.setFieldsValue({
      codeContent: codeContent
    })
  }, [codeContent])

  // 手动更改脚本内容
  const onCodeChange = useCallback((codeContent) => {
    setCodeContent(codeContent)
    form.setFieldValue("codeContent", codeContent)
  }, [])

  // 点击调试
  const { mutate: debugTest, isLoading: debugLoading } = useDebugVariable()
  const debugHandle = async () => {
    const { variableName } = await form.validateFields()
    debugTest(
      {
        botNo: detail?.botNo,
        // variableName: `把风与果`, //`tstvar.${variableName?.trim()}`, // 变量名
        // codeContent: `@tool\ndef generate_random_code():\n    # 生成一个6位数的随机码\n    random_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])\n    return random_code` //codeContent

        variableName: `tstvar.${variableName?.trim()}`, // 变量名
        codeContent: codeContent
      },
      {
        onSuccess: (e) => {
          console.log("eeeeee", e)
          // @ts-ignore
          if (e.success) {
            let result = undefined
            try {
              result = JSON.stringify(e?.data, null, 2)
            } catch {
              result = "调试结果无法显示！"
            }
            setDebugDetail(result)
            setDebugErrorDetail(undefined)
            message.success("调试结果已返回！")
          } else {
            // @ts-ignore
            setDebugErrorDetail(e?.message)
            setDebugDetail(undefined)
            // message.success("调试结果已返回！")
          }
        }
      }
    )
  }

  //提交/编辑
  const { mutate: add, isLoading: addgLoaing } = useAddVariable()
  const { mutate: edit, isLoading: editLoaing } = useEditVariable()
  const submitHandle = async () => {
    const values = await form.validateFields()
    if (detail?.id) {
      edit(
        {
          botNo: detail?.botNo || undefined,
          id: detail?.id,
          ...values,
          variableName: `tstvar.${values?.variableName}`
        },
        {
          onSuccess: (e) => {
            // @ts-ignore
            if (e.success) {
              message.success("修改成功")
              onOk()
              onCancel()
            } else {
              // @ts-ignore
              message.error(e.message)
            }
          }
        }
      )
    } else {
      add(
        {
          botNo: detail?.botNo || undefined,
          ...values,
          variableName: `tstvar.${values?.variableName}`
        },
        {
          onSuccess: (e) => {
            // @ts-ignore
            if (e.success) {
              message.success("新增成功")
              onOk()
              onCancel()
            } else {
              // @ts-ignore
              message.error(e.message)
            }
          }
        }
      )
    }
  }

  // 所有测试集合枚举
  const { data: enumeList = [], mutate: getEnumeList } = useVariableEnumeList()
  useEffect(() => {
    getEnumeList({
      botNo: detail?.botNo
    })
  }, [detail?.botNo])

  // 编辑详情
  useEffect(() => {
    if (detail?.id) {
      form.setFieldsValue({
        ...detail,
        variableName: detail?.variableName?.split("tstvar.")?.[1]
      })
      setMethodDesc(detail?.methodDesc)
      setCodeContent(detail?.codeContent)
    }
  }, [detail?.id])

  return (
    <Drawer
      title={`${detail?.id ? "编辑" : "创建"}测试变量`}
      open={visible}
      width={960}
      maskClosable={false}
      footer={[
        <Button
          disabled={loading}
          loading={addgLoaing || editLoaing}
          key="submit"
          onClick={submitHandle}
          type="primary"
        >
          确定
        </Button>,
        <Button className="mr-[16px]" key="back" onClick={onCancel}>
          取消
        </Button>
      ]}
      onClose={onCancel}
    >
      <div>
        <Form
          initialValues={{
            variableValueType: "string"
          }}
          layout="vertical"
          form={form}
          // labelCol={{ span: 4 }}
        >
          <div className="text-[16px] font-[500] text-[#181B25] w-[100%] mb-[24px]">基本信息</div>
          <Row gutter={25}>
            <Col span={12}>
              <Form.Item
                label="测试变量描述"
                name="description"
                rules={[{ required: true, message: "请输入测试变量描述!" }]}
              >
                <Input placeholder="请输入测试变量描述，如：会话编号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="测试变量名称"
                name="variableName"
                rules={[{ required: true, message: "请输入测试变量名称!" }]}
              >
                <Input
                  addonBefore="tstvar."
                  disabled={detail?.id}
                  placeholder="请输入测试变量名称，如：SessionID"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="variableValueType"
                label="类型"
                rules={[{ required: true, message: "请选择类型!" }]}
              >
                <Select defaultValue={"string"} placeholder="请选择类型" allowClear>
                  <Select.Option value="string">字符串</Select.Option>
                  <Select.Option value="int">整型</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <div className="px-[10px] w-[100%]">
              <Divider className="!my-[16px] !-mt-[5px]" />
            </div>

            <div className="text-[16px] font-[500] text-[#181B25] w-[100%] mb-[25px] pl-[10px]">
              调试
            </div>

            <Col span={10}>
              <Form.Item
                name="methodDesc"
                label="方法描述"
                rules={[{ required: true, message: "请输入描述方法描述!" }]}
              >
                <div className="mt-[5px]">
                  <VariableTextArea
                    // @ts-ignore
                    className="!-mt-[20px]"
                    style={{ height: "212px" }}
                    variables={
                      enumeList?.length
                        ? enumeList?.map((item) => ({
                            variableName: item?.variableName,
                            description: item?.description,
                            valueExpression: item?.variableName
                          }))
                        : []
                    }
                    disabled={false}
                    isModal={true}
                    value={methodDesc}
                    onChange={onMouseBlur}
                    onMouseBlur={() => {}}
                  />
                </div>
              </Form.Item>
            </Col>
            <Col span={4} className="flex justify-center items-center !p-0">
              <Button loading={loading} onClick={onGenerateCode} className="w-[190px]">
                {loading ? "" : <i className="iconfont icon-shengchengjiaoben"></i>}
                生成脚本
              </Button>
            </Col>
            <Col span={10}>
              <Form.Item
                name="codeContent"
                label="脚本内容"
                rules={[{ required: true, message: "请输入脚本内容!" }]}
                // @ts-ignore
                defaultValue={codeContent}
              >
                <div className="-mt-[28px] w-[100%]">
                  <CodeEditor
                    scriptType={"python"}
                    height="210px"
                    codeContent={codeContent}
                    onCodeChange={onCodeChange}
                    editable={true}
                  />
                </div>
              </Form.Item>
            </Col>
          </Row>

          <div className="flex justify-end mb-[30px]">
            <Button
              disabled={loading || debugLoading}
              loading={debugLoading}
              onClick={debugHandle}
              type="default"
            >
              调试
            </Button>
          </div>

          <div className="px-[10px] w-[100%]">
            <Divider className="!my-[16px] !-mt-[10px]" />
          </div>

          <div className="text-[16px] font-[500] text-[#181B25] w-[100%] mb-[25px] pl-[10px]">
            调试结果
          </div>

          {debugDetail || debugErrorDetail ? (
            <Form.Item name="codeContent" label="">
              <Spin spinning={debugLoading}>
                <div className="-mt-[28px]">
                  {debugDetail ? (
                    <CodeEditor
                      scriptType={"python"}
                      codeContent={debugDetail}
                      editable={false}
                      theme={"dark"}
                    />
                  ) : (
                    <p className="text-red-500  rounded-md p-3 mt-[20px]">
                      <div className="font-bold mb-[3px] text-red-600"> 报错：</div>
                      {debugErrorDetail}
                    </p>
                  )}
                </div>
              </Spin>
            </Form.Item>
          ) : (
            <Empty
              className="mt-[4vh] text-center mx-auto"
              image={empty}
              imageStyle={{ width: "64px", height: "64px", margin: "0 auto" }}
              description="暂无调试结果"
            ></Empty>
          )}
        </Form>
      </div>
    </Drawer>
  )
}

export const variableModal = createModal(MyModal)
