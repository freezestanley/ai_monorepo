import React, { useState, useRef, useEffect, useMemo } from "react"
import {
  Drawer,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Button,
  Tabs,
  Divider,
  TimePicker,
  Row,
  Col,
  Slider,
  Radio
} from "antd"
import { PlusOutlined } from "@ant-design/icons"
import moment from "moment"
import "./index.module.scss"
import CustomEmpty from "@/antd-styles/components/CustomEmpty"
import { useFetchAvailableSkills } from "@/api/skill"
import { useLocation } from "react-router-dom"
import queryString from "query-string"
import { getTimbreList } from "@/api/voiceAgent/api"

const { Option } = Select
const { TabPane } = Tabs
const { TextArea } = Input

// 表单布局配置
const formItemLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 20 }
}

// 表单验证规则
const rules = {
  required: [{ required: true, message: "此字段必填" }],
  number: [{ type: "number", message: "请输入数字" }],
  positiveInteger: [
    {
      validator: (_, value) => {
        if (value === null || value === undefined || value === "") return Promise.resolve() // Allow empty if not explicitly required
        const num = Number(value)
        if (Number.isInteger(num) && num > 0) return Promise.resolve()
        return Promise.reject(new Error("请输入正整数"))
      }
    }
  ],
  nonNegativeInteger: [
    {
      validator: (_, value) => {
        if (value === null || value === undefined || value === "") return Promise.resolve() // Allow empty if not explicitly required
        const num = Number(value)
        if (Number.isInteger(num) && num >= 0) return Promise.resolve()
        return Promise.reject(new Error("请输入非负整数"))
      }
    }
  ]
}

const CreateVoiceModal = ({ visible, onCancel, onSubmit, loading, record, isEditing }) => {
  const [form] = Form.useForm()
  const [activeKey, setActiveKey] = useState("general")
  const [filterText, setFilterText] = useState("")
  const [timbreOptions, setTimbreOptions] = useState([])
  const [timbreLoading, setTimbreLoading] = useState(false)
  const location = useLocation()

  // 从URL获取botNo参数
  const searchParams = queryString.parse(location.search) || {}
  const hashParams = queryString.parse(window.location.hash.split("?")[1] || "") || {}
  const botNo = searchParams.botNo || hashParams.botNo || "20250416001" // 默认值作为回退

  // 获取音色列表
  const fetchTimbreList = async () => {
    try {
      setTimbreLoading(true)
      const res = await getTimbreList({
        botNo,
        pageNum: 1,
        pageSize: 10000 // 获取所有音色
      })

      if (res && res.status === 200 && res.data && Array.isArray(res.data.list)) {
        const options = res.data.list.map((item) => ({
          value: item.timbreCode,
          label: item.timbreName + " - " + item.timbreModel
        }))
        setTimbreOptions(options)
      } else {
        console.error("获取音色列表失败:", res)
      }
    } catch (error) {
      console.error("获取音色列表异常:", error)
    } finally {
      setTimbreLoading(false)
    }
  }

  // 首次加载时获取音色列表
  useEffect(() => {
    if (visible) {
      fetchTimbreList()
    }
  }, [visible, botNo])

  const sectionRefs = {
    general: useRef(null),
    tts: useRef(null),
    skills: useRef(null),
    details: useRef(null)
  }
  const formListBottomRef = useRef(null)

  const containerRef = useRef(null)
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return
      const scrollTop = containerRef.current.scrollTop
      const scrollPosition = scrollTop + 60

      let newActiveKey = ""
      for (const [key, ref] of Object.entries(sectionRefs)) {
        if (ref.current && ref.current.offsetTop <= scrollPosition) {
          newActiveKey = key
        } else {
          if (newActiveKey) break
        }
      }
      if (!newActiveKey && Object.keys(sectionRefs).length > 0) {
        newActiveKey = Object.keys(sectionRefs)[0]
      }

      if (newActiveKey && activeKey !== newActiveKey) {
        setActiveKey(newActiveKey)
      }
    }

    const scrollableContainer = containerRef.current
    if (scrollableContainer) {
      scrollableContainer.addEventListener("scroll", handleScroll, { passive: true })
      return () => scrollableContainer.removeEventListener("scroll", handleScroll)
    }
  }, [activeKey, sectionRefs])

  const scrollToSection = (key) => {
    setActiveKey(key)
    if (key === "general" && containerRef.current) {
      containerRef.current.scrollTo({
        top: 0,
        behavior: "smooth"
      })
      return
    }

    const ref = sectionRefs[key]
    if (ref && ref.current && containerRef.current) {
      containerRef.current.scrollTo({
        top: ref.current.offsetTop - 100,
        behavior: "smooth"
      })
    }
  }

  // 获取可用工作流列表
  const { data: availableSkills = [] } = useFetchAvailableSkills({
    botNo: botNo
  })

  // 当record变化时，设置表单数据
  useEffect(() => {
    if (visible) {
      if (record) {
        form.setFieldsValue(record)
      } else {
        form.resetFields()
      }
    }
  }, [form, record, visible])

  // 处理工作流搜索
  const handleSearch = (val) => {
    setFilterText(val)
  }

  // 构建工作流选项
  const skills = useMemo(() => {
    const selfSkills =
      availableSkills?.selfSkills?.map((skill) => {
        return {
          ...skill,
          label: skill.skillName,
          value: skill.skillNo
        }
      }) || []
    const subscribedSkills =
      availableSkills?.subscribedSkills?.map((skill) => {
        return {
          ...skill,
          label: skill.skillName,
          value: skill.skillNo
        }
      }) || []
    return [
      {
        label: "来自本空间",
        options: selfSkills.filter((o) => o.label.includes(filterText))
      },
      {
        label: "来自其他空间",
        options: subscribedSkills.filter((o) => o.label.includes(filterText))
      }
    ]
  }, [availableSkills, filterText])

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      if (values.allowCallTimeStart) {
        values.allowCallTimeStart = values.allowCallTimeStart.format("HH:mm")
      }
      if (values.allowCallTimeEnd) {
        values.allowCallTimeEnd = values.allowCallTimeEnd.format("HH:mm")
      }
      if (values.taskProcessRateFlag !== undefined) {
        values.taskProcessRateFlag = values.taskProcessRateFlag ? "1" : "0"
      }
      onSubmit(values)
    })
  }

  return (
    <Drawer
      title={isEditing ? "编辑语音模板" : "创建语音模板"}
      placement="right"
      onClose={onCancel}
      visible={visible}
      width={1200}
      destroyOnClose
      footer={
        <div className="text-right pr-6 pb-4">
          <Button onClick={onCancel} className="mr-2" disabled={loading}>
            取消
          </Button>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            保存
          </Button>
        </div>
      }
    >
      <div className="flex h-full createVoiceModal">
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden w-[100%] px-2 pr-4"
          ref={containerRef}
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              taskProcessRateFlag: false,
              audioFormat: "wav",
              sampleRate: 8000,
              speed: 1.05,
              volume: 50,
              reflectErrOverNum: 2,
              redisExpireTime: 86400,
              variableConfigs: [],
              flowType: 1
            }}
          >
            <div ref={sectionRefs.general} className="mb-6">
              <div className="!text-base font-[600] mb-4">通用设置</div>
              <Row gutter={24}>
                <Col span={24}>
                  <Form.Item name="flowType" label="语音类型模式" rules={rules.required}>
                    <Radio.Group>
                      <Radio value={1}>画布模式</Radio>
                      <Radio value={2}>剧本模式</Radio>
                    </Radio.Group>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={24}>
                <Col span={6}>
                  <Form.Item name="taskName" label="语音模板名称" rules={rules.required}>
                    <Input placeholder="请输入语音模板名称" allowClear />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="timbreCode" label="音色" rules={rules.required}>
                    <Select
                      placeholder="请选择音色"
                      loading={timbreLoading}
                      showSearch
                      optionFilterProp="label"
                      options={timbreOptions}
                      allowClear
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="拨打时间控制">
                    <Row gutter={8} align="middle">
                      <Col flex="auto">
                        <Form.Item name="allowCallTimeStart" noStyle>
                          <TimePicker
                            format="HH:mm"
                            placeholder="开始时间"
                            className="w-full"
                            allowClear
                          />
                        </Form.Item>
                      </Col>
                      <Col flex="24px" className="text-center">
                        →
                      </Col>
                      <Col flex="auto">
                        <Form.Item
                          name="allowCallTimeEnd"
                          noStyle
                          dependencies={["allowCallTimeStart"]}
                          rules={[
                            ({ getFieldValue }) => ({
                              validator(_, value) {
                                const startTime = getFieldValue("allowCallTimeStart")
                                if (!value || !startTime) {
                                  return Promise.resolve()
                                }
                                if (startTime.isAfter(value)) {
                                  return Promise.reject(new Error("结束时间必须大于开始时间"))
                                }
                                return Promise.resolve()
                              }
                            })
                          ]}
                        >
                          <TimePicker
                            format="HH:mm"
                            placeholder="结束时间"
                            className="w-full"
                            allowClear
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={24}>
                <Col span={6}>
                  <Form.Item
                    name="redisExpireTime"
                    label="补呼时间间隔"
                    tooltip="注意同XC系统补呼事件间隔保持一致"
                    rules={[...rules.required, ...rules.positiveInteger]}
                  >
                    <InputNumber
                      placeholder="请输入"
                      className="w-full"
                      addonAfter="秒"
                      allowClear
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    name="numberWebCall"
                    label="手机防疲劳"
                    tooltip="防疲劳显示，每天每个任务每个手机可拨打最大数量"
                    rules={rules.positiveInteger}
                  >
                    <InputNumber
                      placeholder="请输入拨打最大数量"
                      className="w-full"
                      addonAfter="通"
                      allowClear
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={24}>
                <Col span={6}>
                  <Form.Item name="webCallPlatform" label="通道平台" rules={rules.required}>
                    <Select placeholder="请选择通道平台" allowClear>
                      <Option value="dt">智齿</Option>
                      <Option value="xc">天润</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Form.Item noStyle dependencies={["webCallPlatform"]}>
                  {({ getFieldValue }) =>
                    getFieldValue("webCallPlatform") === "dt" ? (
                      <>
                        <Col span={6}>
                          <Form.Item name="outTemplateId" label="智齿模板ID" rules={rules.required}>
                            <Input placeholder="请输入智齿模板ID" allowClear />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item name="bizType" label="XC-BizType" rules={rules.required}>
                            <Input placeholder="请输入XC-BizType" allowClear />
                          </Form.Item>
                        </Col>
                      </>
                    ) : null
                  }
                </Form.Item>
              </Row>
              <Row gutter={24}>
                <Col span={8}>
                  <div className="flex items-center mb-3">
                    <Form.Item
                      label="开启拨打限流"
                      name="taskProcessRateFlag"
                      layout="horizontal"
                      valuePropName="checked"
                      tooltip="用于控制权录音或者全 tts 任务拨打速率"
                      className="mb-0"
                      required
                    >
                      <Switch size="small" checkedChildren="开" unCheckedChildren="关" />
                    </Form.Item>
                  </div>
                </Col>
              </Row>
              <Form.Item noStyle dependencies={["taskProcessRateFlag"]}>
                {({ getFieldValue }) =>
                  getFieldValue("taskProcessRateFlag") ? (
                    <Row gutter={24}>
                      <Col span={6}>
                        <Form.Item
                          label="拨打间隔时长"
                          name="taskProcessRateSleepTime"
                          rules={[...rules.required, ...rules.nonNegativeInteger]}
                          tooltip="当启用拨打速率控制时，拨打睡眠时长"
                        >
                          <InputNumber
                            placeholder="请输入间隔时长"
                            className="w-full"
                            addonAfter="毫秒"
                            allowClear
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  ) : null
                }
              </Form.Item>
            </div>

            <div ref={sectionRefs.tts} className="mb-6">
              <div className="!text-base font-[600] mb-4">TTS设置</div>
              <Row gutter={24}>
                <Col span={6}>
                  <Form.Item
                    name="audioFormat"
                    label="录音格式"
                    tooltip="仅mp3，wav录音格式支持试听"
                    rules={rules.required}
                  >
                    <Select placeholder="请选择" allowClear>
                      <Option value="mp3">mp3</Option>
                      <Option value="wav">wav</Option>
                      <Option value="pcm">pcm</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="sampleRate" label="音频采样率" rules={rules.required}>
                    <Select placeholder="请选择" allowClear>
                      <Option value={8000}>8000 Hz</Option>
                      <Option value={16000}>16000 Hz</Option>
                      <Option value={32000}>32000 Hz</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="音频速率" required>
                    <div className="flex items-center">
                      <Form.Item name="speed" noStyle rules={rules.required}>
                        <Slider
                          min={0.6}
                          max={2.5}
                          step={0.01}
                          className="flex-1 mr-4"
                          onChange={(value) => form.setFieldsValue({ speed: value })}
                        />
                      </Form.Item>
                      <Form.Item name="speed" noStyle rules={rules.required}>
                        <InputNumber
                          min={0.6}
                          max={2.5}
                          step={0.01}
                          precision={2}
                          style={{ width: "80px" }}
                          onChange={(value) => form.setFieldsValue({ speed: value })}
                          allowClear
                        />
                      </Form.Item>
                    </div>
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="音量" required>
                    <div className="flex items-center">
                      <Form.Item name="volume" noStyle rules={rules.required}>
                        <Slider
                          min={0}
                          max={100}
                          step={1}
                          className="flex-1 mr-4"
                          onChange={(value) => form.setFieldsValue({ volume: value })}
                        />
                      </Form.Item>
                      <Form.Item name="volume" noStyle rules={rules.required}>
                        <InputNumber
                          min={0}
                          max={100}
                          step={1}
                          precision={0}
                          style={{ width: "70px" }}
                          onChange={(value) => form.setFieldsValue({ volume: value })}
                          allowClear
                        />
                      </Form.Item>
                    </div>
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <div ref={sectionRefs.skills} className="mb-6">
              <div className="!text-base font-[600] mb-4">工作流</div>
              <Row gutter={24}>
                <Col span={6}>
                  <Form.Item name="reflectAigcSkillNo" label="意图识别工作流" rules={rules.required}>
                    <Select
                      showSearch
                      placeholder="请选择工作流"
                      onSearch={handleSearch}
                      filterOption={false}
                      options={skills}
                      allowClear
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="reflectAigcEventSkillNo" label="事件处理工作流">
                    <Select
                      showSearch
                      placeholder="请选择工作流"
                      onSearch={handleSearch}
                      filterOption={false}
                      options={skills}
                      allowClear
                    />
                  </Form.Item>
                </Col>

                <Col span={6}>
                  <Form.Item name="intentTagCallSkillNo" label="通话打标工作流">
                    <Select
                      showSearch
                      placeholder="请选择工作流"
                      onSearch={handleSearch}
                      filterOption={false}
                      options={skills}
                      allowClear
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    name="reflectErrOverNum"
                    label="报错兜底次数"
                    tooltip="调用灵犀工作流超时或者报错，外呼兜底工作流处理次数，超过这个次数就会直接挂机"
                    rules={[...rules.required, ...rules.positiveInteger]}
                  >
                    <InputNumber
                      placeholder="请输入"
                      className="w-full"
                      addonAfter="次"
                      allowClear
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <div ref={sectionRefs.details} className="mb-6">
              <div className="!text-base font-[600] mb-4">业务自定义字段</div>
              <Form.List name="variableConfigs">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((field, index) => (
                      <div
                        key={field.key}
                        className="mb-4 p-4 border border-solid border-gray-200 rounded-md relative"
                      >
                        <h4 className="text-sm font-medium mb-3">自定义字段{index + 1}</h4>
                        <Button
                          type="link"
                          danger
                          onClick={() => remove(field.name)}
                          className="absolute right-2 top-2 text-xs"
                          icon={<PlusOutlined rotate={45} />}
                        />
                        <Row gutter={32}>
                          <Col span={12}>
                            <Form.Item
                              {...field}
                              name={[field.name, "name"]}
                              label="字段名称"
                              rules={rules.required}
                              className="mb-0"
                            >
                              <Input placeholder="请输入字段名称" allowClear />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              {...field}
                              name={[field.name, "key"]}
                              label="字段Key"
                              rules={rules.required}
                              className="mb-0"
                            >
                              <Input placeholder="请输入字段Key" allowClear />
                            </Form.Item>
                          </Col>
                        </Row>
                      </div>
                    ))}
                    {fields.length === 0 && (
                      <CustomEmpty description="暂无自定义字段，请点击下方按钮添加" />
                    )}
                    <Form.Item className="mt-4">
                      <Button
                        type="link"
                        onClick={() => {
                          add({ name: "", key: "" })
                          setTimeout(() => {
                            if (formListBottomRef.current) {
                              formListBottomRef.current.scrollIntoView({ behavior: "smooth" })
                            }
                          }, 100)
                        }}
                        icon={<PlusOutlined />}
                        className="!text-purple-600 !p-0"
                      >
                        创建自定义字段
                      </Button>
                    </Form.Item>
                    <div ref={formListBottomRef} />
                  </>
                )}
              </Form.List>
            </div>
          </Form>
        </div>

        <div className="border-gray-200 -ml-4">
          <Tabs
            activeKey={activeKey}
            onChange={scrollToSection}
            tabPosition="right"
            className="h-full create-voice-drawer-tabs"
          >
            <TabPane tab="通用设置" key="general" />
            <TabPane tab="TTS设置" key="tts" />
            <TabPane tab="工作流" key="skills" />
            <TabPane tab="业务自定义字段" key="details" />
          </Tabs>
        </div>
      </div>
    </Drawer>
  )
}

export default CreateVoiceModal
