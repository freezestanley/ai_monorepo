import { useState, useEffect } from "react"
import {
  Drawer,
  Alert,
  Radio,
  Slider,
  Select,
  Input,
  Button,
  Card,
  Typography,
  Space,
  Divider,
  Popover,
  Form,
  InputNumber,
  Checkbox,
  Row,
  Col
} from "antd"
import { InfoCircleOutlined, DownOutlined } from "@ant-design/icons"
import {
  useFetchRetrievalDocuments,
  useViewDocument,
  useFetchRetrievalSetting,
  useFetchKnowledgeDictionaryList
} from "@/api/knowledge"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"

const { TextArea } = Input
const { Text } = Typography

const RetrievalTestDrawer = ({ open, knowledgeBaseNo, catalogNo, onClose }) => {
  const [form] = Form.useForm()
  const [results, setResults] = useState()
  const [loading, setLoading] = useState(false)
  const [checkedList, setCheckedList] = useState([])
  const { mutate: fetchRetrievalDocuments } = useFetchRetrievalDocuments()
  const { mutate: viewDocument } = useViewDocument()
  const { data: retrievalSetting } = useFetchRetrievalSetting({ knowledgeBaseNo, catalogNo })
  const { data: knowledgeDictionaryList } = useFetchKnowledgeDictionaryList({
    dictionaryType: "RAG_RERANK_MODEL"
  })

  const handleTest = async () => {
    const values = await form.validateFields()
    setLoading(true)
    fetchRetrievalDocuments(
      {
        ...values,
        knowledgeBaseNo,
        catalogNos: [catalogNo]
      },
      {
        onSuccess: (data) => {
          setResults(data.data)
          setCheckedList(data.data?.hitDocuments?.map((item) => item.documentNo))
          setLoading(false)
        },
        onError: () => {
          setLoading(false)
        }
      }
    )
  }

  useEffect(() => {
    if (!open) {
      setResults(undefined)
      setCheckedList([])
      form.resetFields()
    }
  }, [open, form])

  return (
    <Drawer title="检索测试" width={"80%"} open={open} onClose={onClose} destroyOnClose>
      <div className="flex h-full overflow-hidden">
        <Space direction="vertical" size="middle" className="flex-1 overflow-y-auto">
          {/* 提示信息 */}
          <Alert
            className="p-[12px]"
            description="请完成召回测试：确保你的配置可以从数据库召回正确的文本块。如果你调整了这里的默认设置，比如文本相似度权重，请注意这里的改动不会被自动保存。请务必在聊天助手设置或者召回算子设置处同步更新相关设置。"
            type="error"
          />
          <Form form={form} layout="vertical">
            <Form.Item
              label="检索方式"
              name={"retrievalStrategy"}
              layout="horizontal"
              initialValue={retrievalSetting?.enableRetrievalStrategies?.[0]}
            >
              <Radio.Group
                options={retrievalSetting?.enableRetrievalStrategies?.map((item) => ({
                  value: item,
                  label: item === "vector" ? "向量检索" : "向量+文本混合检索"
                }))}
              />
            </Form.Item>
            <Form.Item label="召回数量" layout="horizontal">
              <div className="flex items-center">
                <Form.Item name={"limit"} noStyle initialValue={1}>
                  <Slider
                    min={1}
                    max={100}
                    step={1}
                    className="flex-1 mr-4 ml-2"
                    onChange={(value) => form.setFieldValue("limit", value)}
                  />
                </Form.Item>
                <Form.Item name={"limit"} noStyle initialValue={1}>
                  <InputNumber
                    min={1}
                    max={100}
                    step={1}
                    precision={0}
                    style={{ width: "70px" }}
                    onBlur={(e) =>
                      !e.target.value && e.target.value !== 0 && form.setFieldValue("limit", 1)
                    }
                    onChange={(value) => form.setFieldValue("limit", value)}
                  />
                </Form.Item>
              </div>
            </Form.Item>
            <Form.Item
              noStyle
              shouldUpdate={(prevValues, curValues) =>
                prevValues.retrievalStrategy !== curValues.retrievalStrategy
              }
            >
              {({ getFieldValue }) => {
                return (
                  getFieldValue("retrievalStrategy") === "multi_channel" && (
                    <Form.Item label="文本相似度权重" layout="horizontal">
                      <div className="flex items-center">
                        <Form.Item name={"queryBoost"} noStyle initialValue={0.5}>
                          <Slider
                            min={0}
                            max={1}
                            step={0.1}
                            className="flex-1 mr-4 ml-2"
                            onChange={(value) => form.setFieldValue("queryBoost", value)}
                          />
                        </Form.Item>
                        <Form.Item name={"queryBoost"} noStyle initialValue={0.5}>
                          <InputNumber
                            min={0}
                            max={1}
                            step={0.5}
                            precision={1}
                            style={{ width: "70px" }}
                            onBlur={(e) =>
                              !e.target.value &&
                              e.target.value !== 0 &&
                              form.setFieldValue("queryBoost", 0.5)
                            }
                            onChange={(value) => form.setFieldValue("queryBoost", value)}
                          />
                        </Form.Item>
                      </div>
                    </Form.Item>
                  )
                )
              }}
            </Form.Item>
            {!!retrievalSetting?.enableRerank && (
              <Form.Item
                label="Rerank模型"
                layout="horizontal"
                name={"rerankModel"}
                tooltip={{
                  overlayInnerStyle: { wordBreak: "break-all", maxWidth: "600px" },
                  icon: <InfoCircleOutlined />,
                  title:
                    "非必选项：若不选择rerank 模型，系统将默认采用关键词相似度与向量余弦相似度相结合的混合查询方式；如果设置了 rerank 模型，则混合查询中的向量相似度部分将被 rerank 打分替代。请注意：采用rerank 模型会非常耗时。"
                }}
              >
                <Select
                  placeholder="请选择Rerank模型"
                  allowClear
                  options={knowledgeDictionaryList}
                  fieldNames={{ label: "displayName", value: "code" }}
                />
              </Form.Item>
            )}
            <Form.Item
              label="测试文本"
              name={"question"}
              rules={[{ required: true, message: "请输入测试文本" }]}
            >
              <TextArea rows={4} placeholder="请输入测试文本" />
            </Form.Item>
          </Form>
          <div className="text-right">
            <Button type="primary" loading={loading} onClick={handleTest}>
              测试
            </Button>
          </div>
        </Space>
        {/* 结果显示 */}
        <Divider type="vertical" className="h-full mx-4" />
        <div className="overflow-y-auto" style={{ width: "60%", minWidth: "350px" }}>
          {!!results?.hitDocuments?.length && (
            <Popover
              arrow={false}
              trigger="click"
              getPopupContainer={(trigger) => trigger.parentElement}
              styles={{
                root: { width: "calc(60% - 30px)", minWidth: "350px" }
              }}
              content={
                <>
                  <Checkbox
                    indeterminate={
                      checkedList.length > 0 && checkedList.length < results?.hitDocuments.length
                    }
                    onChange={(e) =>
                      setCheckedList(
                        e.target.checked
                          ? results?.hitDocuments?.map((item) => item.documentNo)
                          : []
                      )
                    }
                    checked={results?.hitDocuments.length === checkedList.length}
                  >
                    全选
                  </Checkbox>
                  <Divider className="!my-2" />
                  <Checkbox.Group
                    value={checkedList}
                    onChange={(list) => setCheckedList(list)}
                    className="w-full checkbox-group"
                    options={results.hitDocuments.map((item, index) => ({
                      label: (
                        <Row gutter={24} className="w-full">
                          <Col span={18}>
                            <Text>{item.name}</Text>
                          </Col>
                          <Col span={4}>
                            <Text>{item.hitCount || 0}</Text>
                          </Col>
                          <Col span={2}>
                            <span
                              className="iconfont icon-xiazai cursor-pointer"
                              onClick={() => {
                                viewDocument(
                                  {
                                    knowledgeBaseNo,
                                    catalogNo: item.catalogNo,
                                    documentNo: item.documentNo
                                  },
                                  {
                                    onSuccess: (e) => {
                                      if (e.success) {
                                        window.open(e.data)
                                      }
                                    }
                                  }
                                )
                              }}
                            />
                          </Col>
                        </Row>
                      ),
                      value: item.documentNo ?? index
                    }))}
                  />
                </>
              }
              placement="bottomLeft"
            >
              <div className="flex border-solid border-gray-200 items-center px-4 py-2 rounded-lg cursor-pointer mb-[20px]">
                <DownOutlined className="mr-2" />
                命中文档（{checkedList?.length}/{results?.hitDocuments?.length}）
              </div>
            </Popover>
          )}
          {results?.hitShardingContents?.length ? (
            <Space direction="vertical" style={{ width: "100%" }}>
              {results?.hitShardingContents
                ?.filter((v) => checkedList.includes(v.documentNo))
                ?.map((result, index) => (
                  <Card
                    key={index}
                    title={
                      <Space>
                        <Text strong>相似度 {result.score}</Text>
                      </Space>
                    }
                  >
                    <Text style={{ lineHeight: 1.6, wordWrap: "break-word", whiteSpace: "pre" }}>
                      {result.shardingContent}
                    </Text>
                  </Card>
                ))}
            </Space>
          ) : (
            <div className="mt-[20%]">
              <CustomEmpty description={results ? "暂无结果" : "请先输入测试文本..."} />
            </div>
          )}
        </div>
      </div>
    </Drawer>
  )
}

export default RetrievalTestDrawer
