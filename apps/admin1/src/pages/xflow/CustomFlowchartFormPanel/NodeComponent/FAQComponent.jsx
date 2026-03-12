import { useEffect, useState } from "react"
import {
  Form,
  Input,
  Select,
  Switch,
  Radio,
  Row,
  Col,
  Button,
  Divider,
  Tabs,
  TreeSelect,
  Checkbox,
  Slider,
  InputNumber
} from "antd"
import GlobalVariableSelect from "@/components/GlobalVariableSelect"
import { MODELS } from "@antv/xflow"
import DynamicFormComponent from "./components/DynamicFormComponent"
import { useComponentAndDebugPanel, useSkillFlowData } from "@/store"
import { useFormData } from "../../hooks/useInputFormData"
import { useFetchGlobalVariable } from "@/api/skill"
import { useNodeUpdate } from "../../hooks/useNodeUpdate"
import useSaveShortcut from "../../hooks/useSaveShortcut"
import useFormDisabled from "@/pages/xflow/hooks/useFormDisabled"
import { isFunction } from "lodash"
import { CommonContent } from "../CommonContent"
import { useFetchCatalogList } from "@/api/knowledge"
import { useCurrentSkillLockInfo } from "@/store/index"
import { useCustomVariableType } from "../../hooks"
import DynamicFormList from "./DynamicFormList"
import PreJudgment from "./components/PreJudgment"
import { formatSessionParams } from "./utils"
import { formatCatalogNos } from "@/utils"
import { isIntl } from "@/api/sso"
import CustomDivider from "@/components/CustomDivider"

// faqNo -> id
// 标准问：question
// 相似问：faqSimilarityQuestions
// 答案：faqAnswer
// 分值：score

// 聚合模式查询字段Map
const aggIncludesMap = [
  { name: "默认答案(faqAnswer)", value: "faqAnswer" },
  { name: "标签答案(faqAnswerWithTag)", value: "faqAnswerWithTag" },
  { name: "相似答案(similarAnswer)", value: "similarAnswer" },
  { name: "标准问(question)", value: "question" },
  { name: "相似问(faqSimilarityQuestions)", value: "faqSimilarityQuestions" },
  { name: "场景标签(sceneTags)", value: "sceneTags" },
  { name: "分值(score)", value: "score" },
  { name: "相关图片(fileUrls)", value: "fileUrls" },
  { name: "语种(language)", value: "language" },
  { name: "ID(faqNo)", value: "faqNo" },
  { name: "关联结构化数据", value: "associatedStructureRecord" }
]

// 原生模式查询字段Map
const nativeIncludesMap = [
  { name: "ID(faqNo)", value: "faqNo" },
  { name: "标准问题(standardQuestion)", value: "standardQuestion" },
  { name: "命中问题(question)", value: "question" },
  { name: "召回的问题类型(questionType)", value: "questionType" },
  { name: "分值(score)", value: "score" },
  { name: "语种(language)", value: "language" },
  { name: "默认答案(faqAnswer)", value: "faqAnswer" },
  { name: "标签答案(faqAnswerWithTag)", value: "faqAnswerWithTag" },
  { name: "场景标签(sceneTags)", value: "sceneTags" },
  { name: "相关图片(fileUrls)", value: "fileUrls" }
]

const TabPane = Tabs.TabPane

const SearchComponent = ({ targetData, appData, commandService }) => {
  const { form, formData } = useFormData()
  const [_, forceUpdate] = useState({})
  const [hasAntron, setHasAntron] = useState(false)
  const [showExactMatch, setShowExactMatch] = useState(true)

  const { updateNodeComp, skillFlowData, isLoading } = useNodeUpdate(commandService, appData)
  const { data: globalData = [] } = useFetchGlobalVariable(skillFlowData?.versionNo)
  const { data: queryRange } = useFetchCatalogList(skillFlowData?.botNo)
  const { isLocked } = useCurrentSkillLockInfo((state) => state.currentSkillLockInfo)
  const [isDisabled] = useFormDisabled()

  useEffect(() => {
    form.setFieldsValue({
      ...targetData,
      inputParams: targetData?.inputParams?.[0],
      catalogSetType: targetData?.catalogSetType || 0,
      searchMode: targetData?.searchMode || "AGG"
    })
    if (targetData?.answerTypes?.length > 0) {
      setHasAntron(true)
    } else {
      setHasAntron(false)
    }
    // 初始化时，根据exactMatch的值决定是否显示
    setShowExactMatch(targetData?.exactMatch !== false)
    forceUpdate({})
  }, [targetData, form])

  const handleCatalogChange = (value) => {
    if (catalogSetType === 0) {
      const hasAntron = isAntronCatalog(value, queryRange)
      if (hasAntron) {
        setHasAntron(true)
      } else {
        setHasAntron(false)
      }
    }
  }

  const onFinish = (callback = () => {}, noMessage = false) => {
    return form.validateFields().then((values) => {
      const callbackFunc = isFunction(callback) ? callback : () => {}
      console.log("Received values of form: ", values)
      const catalogNos = values.catalogSetType === 0 ? formatCatalogNos(values.catalogNos) : null
      const session = formatSessionParams(globalData, values.sessions)
      const params = {
        ...values,
        catalogNos,
        inputParams: [values.inputParams, values.sourceTag],
        session
      }

      if (!values.answerTypes) {
        delete targetData.answerTypes
      }
      if (values.answerTypes?.length === 0) {
        targetData.answerTypes = []
      }

      updateNodeComp(
        {
          ...targetData,
          ...params,
          label: values.componentName,
          globalDataOptions: globalData
        },
        callbackFunc,
        noMessage
      )
      forceUpdate({})
    })
  }

  useSaveShortcut(onFinish, isLoading)
  const { data: varOptions = [] } = useCustomVariableType()
  const languageIntelligentDetector = Form.useWatch("languageIntelligentDetector", form)
  const exactMatch = Form.useWatch("exactMatch", form)
  const componentName = Form.useWatch("componentName", form)
  const inputParams = Form.useWatch("inputParams", form)
  const size = Form.useWatch("size", form)
  const catalogSetType = Form.useWatch("catalogSetType", form)
  const appointCatalogNo = Form.useWatch("appointCatalogNo", form)
  const searchMode = Form.useWatch("searchMode", form)

  // 当catalogSetType或appointCatalogNo变化时，强制更新formData
  useEffect(() => {
    forceUpdate({})
  }, [catalogSetType, appointCatalogNo])

  const handleSearchModeChange = () => {
    form.setFieldsValue({ includes: undefined })
  }

  const handleExactMatchChange = (checked) => {
    if (checked) {
      // 如果开启，则禁用开关
      form.setFieldsValue({ exactMatch: true })
    }
  }

  // 判断是否显示精准匹配
  const shouldShowExactMatch = showExactMatch && componentName && inputParams

  return (
    <div className="common-node-wrapper">
      <div className="base-node-comp ">
        <Form
          form={form}
          onFinish={onFinish}
          labelCol={{ span: 4 }}
          disabled={isDisabled}
          layout="vertical"
        >
          <CommonContent
            title={"查询问答组件"}
            containerClass="noPadding"
            onFinish={onFinish}
            disabled={isLocked}
            isLoading={isLoading}
          >
            <Tabs defaultActiveKey="1" type="line">
              <TabPane tab="组件设置" key="1" forceRender>
                <PreJudgment form={form} />
                <CustomDivider showTopLine={true}>基础设置</CustomDivider>
                <Row className="mt-3">
                  <Col span={24}>
                    <Form.Item
                      labelCol={{
                        span: 4
                      }}
                      name="componentName"
                      label="组件名"
                      tooltip="组件名建议由中英文、数字、下划线和短横线组成，且不超过64个字符"
                      rules={[{ required: true, message: "请输入组件名" }]}
                    >
                      <Input placeholder="请输入组件名" />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <CustomDivider showTopLine={true}>输入参数</CustomDivider>

                    <GlobalVariableSelect
                      label={"输入"}
                      span={3}
                      formName="inputParams"
                      multiple={false}
                      layout="vertical"
                      disabled={isDisabled}
                    />
                  </Col>
                </Row>
                <CustomDivider showTopLine={true}>查询参数</CustomDivider>
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      name="catalogSetType"
                      label="查询方式"
                      labelCol={{
                        span: 4
                      }}
                      initialValue={0}
                    >
                      <Radio.Group>
                        <Radio value={0}>通过目录查询</Radio>
                        <Radio value={1}>通过目录变量查询</Radio>
                      </Radio.Group>
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      noStyle
                      shouldUpdate={(prevValues, currentValues) =>
                        prevValues.catalogSetType !== currentValues.catalogSetType
                      }
                    >
                      {({ getFieldValue }) => {
                        const catalogSetType = getFieldValue("catalogSetType")
                        if (catalogSetType === 0) {
                          return (
                            <Form.Item
                              name="catalogNos"
                              label="查询范围"
                              labelCol={{
                                span: 4
                              }}
                              rules={[{ required: false, message: "请选择" }]}
                              tooltip="默认查询全部"
                            >
                              <TreeSelect
                                showSearch
                                style={{ width: "100%" }}
                                dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
                                placeholder="请选择查询范围"
                                allowClear
                                multiple
                                // treeDefaultExpandAll
                                onChange={handleCatalogChange}
                                treeData={queryRange}
                                treeCheckable={true}
                                showCheckedStrategy={TreeSelect.SHOW_PARENT}
                                fieldNames={{
                                  label: "catalogName",
                                  value: "catalogNo",
                                  children: "children"
                                }}
                              />
                            </Form.Item>
                          )
                        } else {
                          return (
                            <GlobalVariableSelect
                              label={"查询目录变量"}
                              span={5}
                              required={true}
                              formName="appointCatalogNo"
                              multiple={false}
                              layout="vertical"
                              disabled={isDisabled}
                            />
                          )
                        }
                      }}
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      name="matchScore"
                      label="匹配分值"
                      labelCol={{
                        span: 4
                      }}
                      initialValue={0.85}
                      tooltip="分值越高匹配度越高"
                    >
                      <Row gutter={8}>
                        <Col span={18}>
                          <Form.Item noStyle name="matchScore">
                            <Slider
                              min={0}
                              max={1}
                              step={0.01}
                              marks={{
                                0: "0",
                                0.5: "0.5",
                                1: "1"
                              }}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item noStyle name="matchScore">
                            <InputNumber min={0} max={1} step={0.01} style={{ width: "100%" }} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      name="searchMode"
                      label="查询模式"
                      labelCol={{
                        span: 5
                      }}
                      tooltip={
                        <div>
                          <p>
                            【聚合模式】将向量召回的结果按标问进行聚合，即如果召回了同一个标问的不同相似问，会自动对结果进行聚合；
                          </p>
                          <p>【原生模式】直接返回向量召回的结果，不会对结果进行聚合；</p>
                        </div>
                      }
                      initialValue="AGG"
                      rules={[{ required: true, message: "请选择查询模式" }]}
                    >
                      <Radio.Group onChange={handleSearchModeChange}>
                        <Radio value="AGG">聚合模式</Radio>
                        <Radio value="NATIVE">原生模式</Radio>
                      </Radio.Group>
                    </Form.Item>
                    <div className="text-gray-500 text-[12px] ml-0 -mt-4 mb-2">
                      <span className="text-orange-500">提示：</span>
                      切换查询模式会自动清空【查询字段】，请重新选择
                    </div>
                  </Col>
                  <Col span={24}>
                    <GlobalVariableSelect
                      label={"来源标签"}
                      span={4}
                      required={false}
                      formName="sourceTag"
                      multiple={false}
                      layout="vertical"
                      disabled={isDisabled}
                    />
                  </Col>
                  {hasAntron && (
                    <Col span={24}>
                      <Form.Item
                        label="查询类型"
                        name="answerTypes"
                        help="查询类型仅对Antron知识库生效"
                        initialValue={["text", "link", "flow", "customer"]}
                        rules={[{ required: true, message: "请选择查询类型" }]}
                      >
                        <Checkbox.Group>
                          <Checkbox value="text">文本/图片/文件</Checkbox>
                          <Checkbox value="link">链接卡片/视频</Checkbox>
                          <Checkbox value="flow">流程</Checkbox>
                          <Checkbox value="customer">转人工</Checkbox>
                        </Checkbox.Group>
                      </Form.Item>
                    </Col>
                  )}

                  <Col span={24}>
                    <Form.Item
                      name="includes"
                      label="查询字段"
                      labelCol={{
                        span: 24
                      }}
                      rules={[{ required: false, message: "请选择" }]}
                    >
                      <Select mode="multiple" placeholder="请选择查询字段">
                        {(searchMode === "NATIVE" ? nativeIncludesMap : aggIncludesMap).map(
                          (field) => (
                            <Select.Option key={field.value} value={field.value}>
                              {field.name}
                            </Select.Option>
                          )
                        )}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      labelCol={{
                        span: 24
                      }}
                      name="size"
                      label="查询数量"
                      rules={[
                        { required: true, message: "请输入查询数量" },
                        {
                          pattern: /^[1-9][0-9]*$/,
                          message: "请输入一个大于0的整数"
                        },
                        {
                          validator: (_, value) =>
                            !value || value <= 200
                              ? Promise.resolve()
                              : Promise.reject(new Error("查询数量不得超过200"))
                        }
                      ]}
                    >
                      <Input type="number" placeholder="请输入" />
                    </Form.Item>
                  </Col>
                  {searchMode === "AGG" && (
                    <Col span={24}>
                      <Form.Item
                        labelCol={{
                          span: 24
                        }}
                        name="maxStandardQuestionSize"
                        label="最大返回标问数"
                        tooltip="最大返回标问数不得大于查询数量"
                        rules={[
                          {
                            pattern: /^[1-9][0-9]*$/,
                            message: "请输入一个大于0的整数"
                          },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              const size = getFieldValue("size")
                              if (!value || !size) return Promise.resolve()
                              if (parseInt(value) > parseInt(size)) {
                                return Promise.reject(new Error(`数值不得大于查询数量(${size})`))
                              }
                              return Promise.resolve()
                            }
                          })
                        ]}
                        validateTrigger={["onChange", "onBlur"]}
                        dependencies={["size"]}
                      >
                        <Input type="number" placeholder="请输入" />
                      </Form.Item>
                    </Col>
                  )}
                  <Col span={12}>
                    <Form.Item
                      labelCol={{
                        span: 12
                      }}
                      layout="horizontal"
                      name="languageIntelligentDetector"
                      label="智能识别问题语种"
                      valuePropName="checked"
                      initialValue={true}
                    >
                      <Switch />
                    </Form.Item>
                  </Col>

                  {shouldShowExactMatch && (
                    <Col span={12}>
                      <Form.Item
                        labelCol={{
                          span: 8
                        }}
                        layout="horizontal"
                        name="exactMatch"
                        label="精准匹配"
                        valuePropName="checked"
                        initialValue={false}
                      >
                        <Switch onChange={handleExactMatchChange} />
                      </Form.Item>
                    </Col>
                  )}

                  {languageIntelligentDetector === false && (
                    <Col span={24}>
                      <Form.Item
                        labelCol={{
                          span: 6
                        }}
                        name="language"
                        label="按指定语种匹配"
                        initialValue="ALL"
                      >
                        <Radio.Group defaultValue={"ALL"}>
                          <Radio value={"ALL"}>全语种</Radio>
                          <Radio value={"CN"}>简体中文</Radio>
                          <Radio value={"HK"}>繁体中文</Radio>
                          <Radio value={"EN"}>英语</Radio>
                        </Radio.Group>
                      </Form.Item>
                    </Col>
                  )}
                </Row>
                <CustomDivider showTopLine={true}>输出参数</CustomDivider>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      labelCol={{
                        span: 24
                      }}
                      label="输出结果类型"
                      className="mb-2"
                    >
                      <Input value="JSON数组" disabled={true} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      labelCol={{
                        span: 24
                      }}
                      name="outputName"
                      label="输出变量名"
                      rules={[{ required: true, message: "请输入" }]}
                      className="mb-2"
                    >
                      <Input placeholder="输出变量名" />
                    </Form.Item>
                  </Col>
                </Row>
                <div className="bg-[#F5F7FA] p-2 rounded-md">
                  <span className="item-title">数组中每个元素包含的字段：</span>
                  <div className="mt-2">
                    <span className="item-title">faq编号：</span>
                    <span className="item-value">faqNo</span>
                  </div>
                  {searchMode === "NATIVE" ? (
                    <>
                      <div className="mt-2">
                        <span className="item-title">召回问题对应的标准问题：</span>
                        <span className="item-value">standardQuestion</span>
                      </div>
                      <div className="mt-2">
                        <span className="item-title">召回的问题：</span>
                        <span className="item-value">question</span>
                      </div>
                      <div className="mt-2">
                        <span className="item-title">召回的问题类型：</span>
                        <span className="item-value">questionType</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mt-2">
                        <span className="item-title">标准问题：</span>
                        <span className="item-value">question</span>
                      </div>
                      <div className="mt-2">
                        <span className="item-title">相似问题：</span>
                        <span className="item-value">faqSimilarityQuestions</span>
                      </div>
                    </>
                  )}
                  <div className="mt-2">
                    <span className="item-title">召回问题的分数：</span>
                    <span className="item-value">score</span>
                  </div>
                  <div className="mt-2">
                    <span className="item-title">语种：</span>
                    <span className="item-value">language</span>
                  </div>
                  <div className="mt-2">
                    <span className="item-title">默认答案：</span>
                    <span className="item-value">faqAnswer</span>
                  </div>
                  <div className="mt-2">
                    <span className="item-title">标签答案：</span>
                    <span className="item-value">faqAnswerWithTag</span>
                  </div>
                  <div className="mt-2">
                    <span className="item-title">场景标签：</span>
                    <span className="item-value">sceneTags</span>
                  </div>
                  <div className="mt-2">
                    <span className="item-title">相关图片：</span>
                    <span className="item-value">fileUrls</span>
                  </div>
                </div>
              </TabPane>
              <TabPane tab="后置处理" key="2" forceRender>
                <DynamicFormList form={form} varOptions={varOptions} />
              </TabPane>
            </Tabs>
          </CommonContent>
        </Form>
        <div className="debug-panel">
          <DynamicFormComponent
            nodeId={targetData.id}
            preview={false}
            isProcess={false}
            formData={formData}
            onFinish={onFinish}
          />
        </div>
      </div>
    </div>
  )
}

export default SearchComponent
// 判断给定的catalogNo数组是否属于Antron知识库
function isAntronCatalog(catalogNoArr, data) {
  // 遍历所有catalogNo
  for (const catalogNo of catalogNoArr) {
    // 遍历数据查找对应的catalogNo
    for (const item of data) {
      if (findAntronCatalog(catalogNo, item)) {
        return true
      }
    }
  }
  return false
}

// 递归查找对应的catalogNo是否属于Antron知识库
function findAntronCatalog(catalogNo, item) {
  // 找到对应的catalogNo
  if (item.catalogNo === catalogNo) {
    if (item.catalogType === "Antron知识库") {
      return true
    }
  }
  // 递归查找children中是否有Antron知识库
  if (item.children && item.children.length > 0) {
    for (const child of item.children) {
      if (findAntronCatalog(catalogNo, child)) {
        return true
      }
    }
  }
  return false
}
