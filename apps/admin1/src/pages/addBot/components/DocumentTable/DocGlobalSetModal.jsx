import { useEffect } from "react"
import { Switch, Select, Form, Modal, Slider, InputNumber, Input, Tooltip, Button } from "antd"
import { InfoCircleOutlined } from "@ant-design/icons"
import { useFetchEmbeddingType, useCreateKnowledgeBaseConfig } from "@/api/knowledgeDocument"
import { fetchKnowledgeBaseConfig } from "@/api/knowledgeDocument/api"

const DocGlobalSetModal = ({ visible, onClose, knowledgeBaseNo }) => {
  const [form] = Form.useForm()

  const { data: embeddingTypeList = [] } = useFetchEmbeddingType()
  const { mutate: createKnowledgeBaseConfig, isLoading: createLoading } =
    useCreateKnowledgeBaseConfig()

  useEffect(() => {
    if (!(visible && knowledgeBaseNo)) return
    fetchKnowledgeBaseConfig(knowledgeBaseNo).then((res) => {
      form.setFieldsValue({
        ...(res || {}),
        autoKeywords: res?.autoKeywords ?? 0,
        autoQuestions: res?.autoQuestions ?? 0,
        useRaptor: res?.useRaptor ?? false
      })
    })
  }, [visible, knowledgeBaseNo, form])

  const handleOk = async () => {
    const values = await form.validateFields()
    createKnowledgeBaseConfig(
      {
        knowledgeBaseNo,
        ...values
      },
      {
        onSuccess: () => {
          onClose()
        }
      }
    )
  }

  return (
    <Modal
      title={"设置"}
      open={visible}
      onOk={handleOk}
      onCancel={onClose}
      destroyOnClose
      afterClose={() => form.resetFields()}
      confirmLoading={createLoading}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="layoutRecognition"
          label="PDF解析器"
          tooltip={{
            overlayInnerStyle: { wordBreak: "break-all", maxWidth: "600px" },
            icon: <InfoCircleOutlined />,
            title:
              "使用视觉模型进行 PDF 布局分析以更好地识别文档结构，找到标题文本块、图像和表格的位置。如果选择 Naive 选项，则只能获取PDF 的纯文本。请注意该功能只适用于 PDF文档，对其他文档不生效。"
          }}
          initialValue={"DeepDOC"}
        >
          <Select
            placeholder="请选择PDF解析器"
            options={[{ label: "DeepDoc", value: "DeepDOC" }]}
          />
        </Form.Item>
        <Form.Item
          name="embedding"
          label="Embedding"
          rules={[{ required: true, message: "请选择Embedding" }]}
          tooltip={{
            overlayInnerStyle: { wordBreak: "break-all", maxWidth: "600px" },
            icon: <InfoCircleOutlined />,
            title:
              "用于嵌入块的嵌入模型。一旦知识库有了块，它就无法更改。如果你想改变它，你需要删除所有的块。"
          }}
        >
          <Select
            placeholder="请选择Embedding"
            options={embeddingTypeList}
            fieldNames={{ label: "desc", value: "name" }}
            disabled
          />
        </Form.Item>
        <Form.Item
          label="自动关键词提取"
          tooltip={{
            overlayInnerStyle: { wordBreak: "break-all", maxWidth: "600px" },
            icon: <InfoCircleOutlined />,
            title:
              "自动为每个文本块中提取 N 个关键词，用以提升查询精度。请注意：该功能采用“系统模型设置”中设置的默认聊天模型提取关键词，因此也会产生更多 Token 消耗。另外，你也可以手动更新生成的关键词。"
          }}
        >
          <div className="flex items-center">
            <Form.Item name="autoKeywords" noStyle initialValue={0}>
              <Slider
                min={0}
                max={30}
                step={1}
                className="flex-1 mr-4 ml-2"
                onChange={(value) => form.setFieldsValue({ autoKeywords: value })}
              />
            </Form.Item>
            <Form.Item name="autoKeywords" noStyle initialValue={0}>
              <InputNumber
                min={0}
                max={30}
                step={1}
                precision={0}
                style={{ width: "70px" }}
                onBlur={(e) =>
                  !e.target.value &&
                  e.target.value !== 0 &&
                  form.setFieldsValue({ autoKeywords: 0 })
                }
                onChange={(value) => form.setFieldsValue({ autoKeywords: value })}
              />
            </Form.Item>
          </div>
        </Form.Item>
        <Form.Item
          label="自动问题提取"
          tooltip={{
            overlayInnerStyle: { wordBreak: "break-all", maxWidth: "600px" },
            icon: <InfoCircleOutlined />,
            title:
              "利用“系统模型设置”中设置的 chat model 对知识库的每个文本块提取 N 个问题以提高其排名得分。请注意开启后将消耗额外的 token。您可以在块列表中查看、编辑结果。如果自动问题提取发生错误，不会妨碍整个分块过程，只会将空结果添加到原始文本块。"
          }}
        >
          <div className="flex items-center">
            <Form.Item name="autoQuestions" noStyle initialValue={0}>
              <Slider
                min={0}
                max={10}
                step={1}
                className="flex-1 mr-4 ml-2"
                onChange={(value) => form.setFieldsValue({ autoQuestions: value })}
              />
            </Form.Item>
            <Form.Item name="autoQuestions" noStyle initialValue={0}>
              <InputNumber
                min={0}
                max={10}
                step={1}
                precision={0}
                style={{ width: "70px" }}
                onBlur={(e) =>
                  !e.target.value &&
                  e.target.value !== 0 &&
                  form.setFieldsValue({ autoQuestions: 0 })
                }
                onChange={(value) => form.setFieldsValue({ autoQuestions: value })}
              />
            </Form.Item>
          </div>
        </Form.Item>
        <Form.Item
          name="useRaptor"
          label="使用召回增强RAPTOR策略"
          tooltip={{
            overlayInnerStyle: { wordBreak: "break-all", maxWidth: "600px" },
            icon: <InfoCircleOutlined />,
            title: (
              <>
                {/* 请参考{" "}
                <a
                  className="!text-white !underline"
                  href="https://huggingface.co/papers/2401.18059"
                  target="_blank"
                  rel="noreferrer"
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
          <Switch />
        </Form.Item>
        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) =>
            prevValues.useRaptor !== currentValues.useRaptor
          }
        >
          {({ getFieldValue }) => {
            const bool = getFieldValue("useRaptor")
            return (
              bool && (
                <>
                  <Form.Item
                    name={["raptor", "prompt"]}
                    label="提示词"
                    tooltip={{
                      overlayInnerStyle: { wordBreak: "break-all", maxWidth: "600px" },
                      icon: <InfoCircleOutlined />,
                      title: "系统提示为大模型提供任务描述、规定回复方式，以及设置其他各种要求。"
                    }}
                    rules={[{ required: true, message: "请输入提示词" }]}
                    initialValue={
                      "请总结以下段落。小心数字，不要编造。段落如下：\n｛cluster_content｝\n以上就是你需要总结的内容。"
                    }
                  >
                    <Input.TextArea placeholder="请输入提示词" rows={4} />
                  </Form.Item>
                  <Form.Item
                    label="最大token数"
                    tooltip={{
                      overlayInnerStyle: { wordBreak: "break-all", maxWidth: "600px" },
                      icon: <InfoCircleOutlined />,
                      title: "用于汇总的最大token数。"
                    }}
                  >
                    <div className="flex items-center">
                      <Form.Item name={["raptor", "maxToken"]} noStyle initialValue={256}>
                        <Slider
                          min={0}
                          max={2048}
                          step={1}
                          className="flex-1 mr-4 ml-2"
                          onChange={(value) => form.setFieldValue(["raptor", "maxToken"], value)}
                        />
                      </Form.Item>
                      <Form.Item name={["raptor", "maxToken"]} noStyle initialValue={256}>
                        <InputNumber
                          min={0}
                          max={2048}
                          step={1}
                          precision={0}
                          style={{ width: "70px" }}
                          onBlur={(e) =>
                            !e.target.value &&
                            e.target.value !== 0 &&
                            form.setFieldValue(["raptor", "maxToken"], 256)
                          }
                          onChange={(value) => form.setFieldValue(["raptor", "maxToken"], value)}
                        />
                      </Form.Item>
                    </div>
                  </Form.Item>
                  <Form.Item
                    label="阈值"
                    tooltip={{
                      overlayInnerStyle: { wordBreak: "break-all", maxWidth: "600px" },
                      icon: <InfoCircleOutlined />,
                      title: "阈值越大，聚类越少。"
                    }}
                  >
                    <div className="flex items-center">
                      <Form.Item name={["raptor", "threshold"]} noStyle initialValue={0.1}>
                        <Slider
                          min={0}
                          max={1}
                          step={0.01}
                          className="flex-1 mr-4 ml-2"
                          onChange={(value) => form.setFieldValue(["raptor", "threshold"], value)}
                        />
                      </Form.Item>
                      <Form.Item name={["raptor", "threshold"]} noStyle initialValue={0.1}>
                        <InputNumber
                          min={0}
                          max={1}
                          step={0.01}
                          precision={2}
                          style={{ width: "70px" }}
                          onBlur={(e) =>
                            !e.target.value &&
                            e.target.value !== 0 &&
                            form.setFieldValue(["raptor", "threshold"], 0.1)
                          }
                          onChange={(value) => form.setFieldValue(["raptor", "threshold"], value)}
                        />
                      </Form.Item>
                    </div>
                  </Form.Item>
                  <Form.Item
                    label="最大聚类数"
                    tooltip={{
                      overlayInnerStyle: { wordBreak: "break-all", maxWidth: "600px" },
                      icon: <InfoCircleOutlined />,
                      title: "最大聚类数。"
                    }}
                  >
                    <div className="flex items-center">
                      <Form.Item name={["raptor", "maxCluster"]} noStyle initialValue={64}>
                        <Slider
                          min={1}
                          max={1024}
                          step={1}
                          className="flex-1 mr-4 ml-2"
                          onChange={(value) => form.setFieldValue(["raptor", "maxCluster"], value)}
                        />
                      </Form.Item>
                      <Form.Item name={["raptor", "maxCluster"]} noStyle initialValue={64}>
                        <InputNumber
                          min={1}
                          max={1024}
                          step={1}
                          precision={0}
                          style={{ width: "70px" }}
                          onBlur={(e) =>
                            !e.target.value && form.setFieldValue(["raptor", "maxCluster"], 64)
                          }
                          onChange={(value) => form.setFieldValue(["raptor", "maxCluster"], value)}
                        />
                      </Form.Item>
                    </div>
                  </Form.Item>
                  <div className="flex">
                    <Form.Item
                      name={["raptor", "randomSeed"]}
                      label="随机种子"
                      rules={[{ required: true, message: "请输入随机种子" }]}
                      initialValue={0}
                      className="flex-1"
                    >
                      <InputNumber
                        min={-999999}
                        max={999999}
                        step={1}
                        precision={0}
                        placeholder="请输入随机种子"
                        className="w-[100%]"
                      />
                    </Form.Item>
                    <Tooltip title="点击生成随机数">
                      <Button
                        className="ml-2 mt-[26px] !h-[32px]"
                        type="primary"
                        onClick={() => {
                          const randomNumber =
                            Math.floor(Math.random() * (999999 - -999999 + 1)) + -999999
                          form.setFieldValue(["raptor", "randomSeed"], randomNumber)
                        }}
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
      </Form>
    </Modal>
  )
}

export default DocGlobalSetModal
