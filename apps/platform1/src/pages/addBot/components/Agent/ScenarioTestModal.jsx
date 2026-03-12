import {
  Modal,
  Form,
  Space,
  Select,
  InputNumber,
  Switch,
  Button,
  Popconfirm,
  Tooltip,
  Input
} from "antd"
import { MinusCircleOutlined, PlusCircleOutlined } from "@ant-design/icons"
import { useEffect, useRef, useCallback, useMemo } from "react"
import {
  useFetchWorkerSkills,
  useBatchSaveABExperiment,
  useFetchABExperimentPage
} from "@/api/agent"
import { useStudioPublishData } from "@/hooks/useStudioPublishData"

const SkillFormItem = ({ name, botNo, agentNo, disabled, otherSkillNos, setInitValue }) => {
  const { data: workerSkills } = useFetchWorkerSkills({ botNo, agentNo })

  const options = useMemo(() => {
    return workerSkills?.map((item) => ({
      ...item,
      disabled: otherSkillNos?.includes(item.skillNo)
    }))
  }, [otherSkillNos, workerSkills])

  useEffect(() => {
    options?.length && setInitValue?.(options)
  }, [options])

  return (
    <Form.Item className="flex-1" name={name} rules={[{ required: true, message: "请选择工作流" }]}>
      <Select
        placeholder="请选择工作流"
        options={options}
        fieldNames={{ label: "skillName", value: "skillNo" }}
        disabled={disabled}
      />
    </Form.Item>
  )
}

const ScenarioTestModal = ({ visible, agentList, onCancel, botNo }) => {
  const [form] = Form.useForm()
  const isValidateRef = useRef({})

  const { mutate: mutateCreateABExperiment, isLoading } = useBatchSaveABExperiment()

  const { data: abExperimentPageData } = useFetchABExperimentPage({
    botNo,
    pageNum: 1,
    pageSize: 99
  })
  const { isPublishDisabled } = useStudioPublishData()

  const onSubmit = useCallback(async () => {
    const hasError = Object.values(isValidateRef.current).some((error) => error === true)
    if (hasError) return
    const values = await form.validateFields()
    const params = values.items.map((item) => ({
      ...item,
      botNo,
      status: item.status ? 1 : 0,
      strategies: item.strategies?.map((strategy, index) => ({
        ...strategy,
        dataType: "AGENT",
        strategyType: index === 0 ? "A" : "B",
        extraInfo: JSON.stringify(strategy.extraInfo || {})
      }))
    }))
    mutateCreateABExperiment(params, {
      onSuccess: (res) => {
        res.success && onCancel()
      }
    })
  }, [form, mutateCreateABExperiment, botNo, onCancel])

  useEffect(() => {
    if (visible) {
      if (abExperimentPageData?.list?.length > 0) {
        form.setFieldsValue({
          items: abExperimentPageData.list.map((item) => ({
            ...item,
            status: item.status === 1,
            strategies: item?.strategies
              ?.map((v) => ({
                ...v,
                extraInfo: JSON.parse(v.extraInfo || "{}")
              }))
              ?.sort((a, b) => {
                if (a.strategyType === "A") return -1
                if (b.strategyType === "A") return 1
                return 0
              })
          }))
        })
      }
    } else {
      form.resetFields()
    }
  }, [visible, form, abExperimentPageData])

  return (
    <Modal
      title="场景测试"
      open={visible}
      onCancel={onCancel}
      onOk={onSubmit}
      width={700}
      confirmLoading={isLoading}
      okButtonProps={{ disabled: isPublishDisabled }}
      okText="保存"
    >
      <Form
        className="scenarioTestForm"
        form={form}
        initialValues={{ items: [{}] }}
        layout="vertical"
        disabled={isPublishDisabled}
      >
        <Form.List name="items">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, i) => (
                <div
                  className="bg-[#F5F5F5] p-[10px] rounded-md"
                  key={field.key}
                  style={i === 0 ? {} : { marginTop: "10px" }}
                >
                  <div className="flex justify-between items-center mb-[10px]">
                    <h1 className="font-semibold">场景组{i + 1}</h1>
                    <Space size={15}>
                      <Form.Item name={[field.name, "experimentNo"]} hidden noStyle>
                        <Input />
                      </Form.Item>
                      <Form.Item noStyle shouldUpdate>
                        {({ getFieldValue, setFieldValue }) => {
                          const isOpen = getFieldValue(["items", field.name, "status"])
                          return (
                            <>
                              <Form.Item
                                name={[field.name, "status"]}
                                valuePropName="checked"
                                noStyle
                              >
                                {isOpen ? (
                                  <Popconfirm
                                    title="确认【停用】该场景组"
                                    okText="确定"
                                    cancelText="取消"
                                    onConfirm={() => {
                                      setFieldValue(["items", field.name, "status"], false)
                                    }}
                                    onCancel={() => {
                                      setFieldValue(["items", field.name, "status"], true)
                                    }}
                                  >
                                    <Switch
                                      size="small"
                                      checkedChildren="启用"
                                      unCheckedChildren="停用"
                                      checked={isOpen}
                                    />
                                  </Popconfirm>
                                ) : (
                                  <Switch
                                    size="small"
                                    checkedChildren="启用"
                                    unCheckedChildren="停用"
                                  />
                                )}
                              </Form.Item>
                            </>
                          )
                        }}
                      </Form.Item>
                      {fields.length > 1 && (
                        <Form.Item
                          noStyle
                          shouldUpdate={(pre, cur) =>
                            pre.items?.[field.name]?.status !== cur.items?.[field.name]?.status
                          }
                        >
                          {({ getFieldValue }) => {
                            const enable = getFieldValue(["items", field.name, "status"])
                            return (
                              <Popconfirm
                                title="确定要删除吗？"
                                okText="确定"
                                cancelText="取消"
                                onConfirm={() => {
                                  delete isValidateRef.current[field.key]
                                  remove(field.name)
                                }}
                              >
                                <Tooltip title="停用后可删除" {...(!enable ? { open: false } : {})}>
                                  <Button
                                    disabled={!!enable || isPublishDisabled}
                                    type="link"
                                    className="!p-0 !h-auto"
                                  >
                                    删除
                                  </Button>
                                </Tooltip>
                              </Popconfirm>
                            )
                          }}
                        </Form.Item>
                      )}
                    </Space>
                  </div>
                  <Form.List name={[field.name, "strategies"]} initialValue={[{}, {}]}>
                    {(subFields, subOpt) => (
                      <div className="w-100">
                        {subFields.map((subField, index) => {
                          return (
                            <div key={subField.key} className="flex w-100">
                              <div className="flex-[1.5]">
                                {index === 0 && <p className="mb-1">Agent</p>}
                                <div className="flex items-start">
                                  <Form.Item noStyle shouldUpdate>
                                    {({ getFieldValue, setFieldValue }) => {
                                      const list = getFieldValue("items")
                                      const options = [...(agentList || [])].map((item) => {
                                        // 不同场景组的第一个必须不同
                                        const first = list?.find(
                                          (v, idx) =>
                                            subField.name.toString() === "0" &&
                                            idx.toString() !== i.toString() &&
                                            v?.strategies?.[0]?.dataNo === item.agentNo
                                        )
                                        // 相同组的不选择已经选过的agent(处理标准工作流)
                                        const other =
                                          list?.[i]?.strategies?.find(
                                            (v, idx) =>
                                              idx.toString() !== subField.name.toString() &&
                                              v?.dataNo === item.agentNo
                                          ) &&
                                          !(
                                            item?.agentMode === 1 &&
                                            item?.type === "single_agent_skill_mode"
                                          )
                                        const disabled = !!(subField.name.toString() === "0"
                                          ? first || other
                                          : other)
                                        return {
                                          ...item,
                                          disabled
                                        }
                                      })
                                      const disabled =
                                        !!(
                                          getFieldValue(["items", field.name, "experimentNo"]) &&
                                          subField.name.toString() === "0"
                                        ) || isPublishDisabled
                                      return (
                                        <Form.Item
                                          className="flex-1"
                                          name={[subField.name, "dataNo"]}
                                          rules={[{ required: true, message: "请选择Agent" }]}
                                        >
                                          <Select
                                            placeholder="请选择Agent"
                                            options={options}
                                            fieldNames={{ label: "agentName", value: "agentNo" }}
                                            disabled={disabled}
                                            onChange={() =>
                                              setFieldValue(
                                                [
                                                  "items",
                                                  field.name,
                                                  "strategies",
                                                  subField.name,
                                                  "extraInfo",
                                                  "workerSkillNo"
                                                ],
                                                undefined
                                              )
                                            }
                                          />
                                        </Form.Item>
                                      )
                                    }}
                                  </Form.Item>
                                  <Form.Item
                                    noStyle
                                    shouldUpdate={(pre, cur) =>
                                      pre?.items?.[field.name] !== cur?.items?.[field.name]
                                    }
                                  >
                                    {({ getFieldValue, setFieldValue }) => {
                                      const otherSkillNos = getFieldValue([
                                        "items",
                                        field.name,
                                        "strategies"
                                      ])
                                        ?.filter(
                                          (_, index) =>
                                            index.toString() !== subField.name.toString()
                                        )
                                        ?.map((item) => item?.extraInfo?.workerSkillNo)
                                        ?.filter(Boolean)
                                      const agentNo = getFieldValue([
                                        "items",
                                        field.name,
                                        "strategies",
                                        subField.name,
                                        "dataNo"
                                      ])
                                      const curData = agentList?.find(
                                        (item) => item.agentNo === agentNo
                                      )
                                      const disabled =
                                        !!(
                                          getFieldValue(["items", field.name, "experimentNo"]) &&
                                          subField.name.toString() === "0"
                                        ) || isPublishDisabled
                                      // 判断agent是否是标准工作流
                                      const isSkillMode =
                                        curData?.agentMode === 1 &&
                                        curData?.type === "single_agent_skill_mode"
                                      return (
                                        isSkillMode && (
                                          <>
                                            <span className="pl-[5px] pr-[5px] mt-[6px]">—</span>
                                            <SkillFormItem
                                              name={[subField.name, "extraInfo", "workerSkillNo"]}
                                              botNo={botNo}
                                              agentNo={agentNo}
                                              disabled={disabled}
                                              otherSkillNos={otherSkillNos}
                                              setInitValue={(options) => {
                                                const val = getFieldValue([
                                                  "items",
                                                  field.name,
                                                  "strategies",
                                                  subField.name,
                                                  "extraInfo",
                                                  "workerSkillNo"
                                                ])
                                                !val &&
                                                  setFieldValue(
                                                    [
                                                      "items",
                                                      field.name,
                                                      "strategies",
                                                      subField.name,
                                                      "extraInfo",
                                                      "workerSkillNo"
                                                    ],
                                                    options?.filter((v) => !v.disabled)?.[0]
                                                      ?.skillNo
                                                  )
                                              }}
                                            />
                                          </>
                                        )
                                      )
                                    }}
                                  </Form.Item>
                                </div>
                              </div>
                              <span
                                className="pl-[5px] pr-[5px]"
                                style={{ marginTop: index === 0 ? "32px" : "6px" }}
                              >
                                —
                              </span>
                              <div className="flex-1 relative">
                                {index === 0 && <p className="mb-1">流量占比</p>}
                                <Form.Item
                                  name={[subField.name, "trafficWeight"]}
                                  rules={[{ required: true, message: "请输入流量占比" }]}
                                >
                                  <InputNumber
                                    className="w-100"
                                    placeholder="请输入流量占比"
                                    min={1}
                                    max={100}
                                    precision={0}
                                    addonAfter="%"
                                  />
                                </Form.Item>
                                {index + 1 === subFields.length && (
                                  <Form.Item
                                    noStyle
                                    shouldUpdate={(pre, cur) =>
                                      pre?.items?.[field.name]?.strategies !==
                                      cur?.items?.[field.name]?.strategies
                                    }
                                  >
                                    {({ getFieldValue }) => {
                                      const vals = getFieldValue([
                                        "items",
                                        field.name,
                                        "strategies"
                                      ])
                                      const hasEmptyValue = vals?.some(
                                        (item) => !item?.trafficWeight && item?.trafficWeight !== 0
                                      )
                                      const sum = vals?.reduce((total, item) => {
                                        return total + (Number(item?.trafficWeight) || 0)
                                      }, 0)
                                      const bool = !hasEmptyValue && sum !== 100
                                      typeof field.key !== "undefined" &&
                                        (isValidateRef.current[field.key] = bool)
                                      if (bool) {
                                        return (
                                          <span
                                            className="text-[#ff4d4f] absolute"
                                            style={{ bottom: -6 }}
                                          >
                                            占比总和须为100%
                                          </span>
                                        )
                                      }
                                      return null
                                    }}
                                  </Form.Item>
                                )}
                              </div>
                              <Space
                                className="ml-2 w-[40px] items-start"
                                style={{ marginTop: index === 0 ? "33px" : "8px" }}
                              >
                                {subFields.length === index + 1 && !isPublishDisabled && (
                                  <PlusCircleOutlined
                                    className="text-[16px] text-[#666666]"
                                    onClick={() => {
                                      subOpt.add()
                                    }}
                                  />
                                )}
                                <Form.Item
                                  noStyle
                                  shouldUpdate={(pre, cur) =>
                                    pre?.items?.[field.name]?.experimentNo?.dataNo !==
                                    cur?.items?.[field.name]?.experimentNo
                                  }
                                >
                                  {({ getFieldValue }) => {
                                    const disabled =
                                      !!(
                                        getFieldValue(["items", field.name, "experimentNo"]) &&
                                        subField.name.toString() === "0"
                                      ) || isPublishDisabled
                                    return (
                                      subFields.length > 2 &&
                                      !disabled && (
                                        <MinusCircleOutlined
                                          className="text-[16px] text-[#666666]"
                                          onClick={() => {
                                            subOpt.remove(subField.name)
                                          }}
                                        />
                                      )
                                    )
                                  }}
                                </Form.Item>
                              </Space>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </Form.List>
                </div>
              ))}
              <div className="flex items-center">
                <Button type="link" onClick={() => add()}>
                  + 创建场景组
                </Button>
                <p className="text-[13px] text-[#999] ml-2">调用场景组第1个Agent时触发测试</p>
              </div>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  )
}

export default ScenarioTestModal
