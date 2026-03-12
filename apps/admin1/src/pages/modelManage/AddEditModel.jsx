/*
 * @Author: Dyton
 * @Date: 2024-05-22 11:32:29
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-05-27 18:17:41
 * @FilePath: /za-aigc-platform-admin-static/src/pages/modelManage/AddEditModel.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */

import { useSaveModelApi } from "@/api/modelManage"
import { CodeEditor } from "@/components/CodeEditor"
import { EXECUTEMODE } from "@/constants/modelManage"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { useQueryClient } from "@tanstack/react-query"
import { ControlOutlined } from "@ant-design/icons"
import { Form, Input, InputNumber, Radio, Select, Checkbox, Modal, Switch } from "antd"
import { useEffect } from "react"
import styles from "./index.module.scss"
import { useFetchBotListByPage } from "@/api/bot"

const { Item } = Form
const scriptOptions = [
  { label: "Chat", value: "CHAT" },
  { label: "StreamChat", value: "STREAM_CHAT" }
]

// 修改可见范围选项的值为数字类型
const visibilityOptions = [
  { label: "全部空间可见", value: 1 },
  { label: "指定空间可见", value: 2 }
]

const AddEditModel = ({ record = null, openModal, setOpenModal, modelTypeOptions = [] }) => {
  const [form] = Form.useForm()
  const queryClient = useQueryClient()
  const rules = [{ required: true, message: "请输入${label}" }]
  // 同步代码，避免重新渲染为空
  const onChangeScript = (e, props) => {
    const clone = { scriptChecked: e }
    clone.scriptChecked = e

    e?.forEach((code) => {
      clone[`${code}_CODE`] = props[`${code}_CODE_CLONE`] //form.getFieldValue(`${code}_CODE_CLONE`)
    })

    console.log("form.getFieldsValue()", e, props, { ...props, ...clone })

    form.setFieldsValue({ ...props, ...clone })

    return e
  }
  // 脚本配置
  const ScriptSettings = () => {
    // 使用Form.useWatch来监听表单值的变化
    const scriptChecked = Form.useWatch("scriptChecked", form) || []
    const formValues = form.getFieldsValue()

    return (
      <Checkbox.Group
        style={{ display: "block" }}
        value={scriptChecked}
        onChange={(e) => {
          onChangeScript(e, formValues)
        }}
      >
        {scriptOptions.map((v) => {
          const checked = scriptChecked?.includes(v?.value)
          const codeContent = formValues[`${v.value}_CODE`]

          return (
            <div key={v.value} style={{ margin: "5px 0" }}>
              <Checkbox value={v.value}>{v.label}</Checkbox>
              <Item hidden name={`${v.value}_CODE_CLONE`} />
              {checked ? (
                <Item
                  rules={[{ required: true, message: "请输入代码!" }]}
                  name={`${v.value}_CODE`}
                  valuePropName="codeContent"
                  style={{ marginTop: "-25px" }}
                >
                  <CodeEditor
                    placeholder="请输入代码..."
                    height="100px"
                    codeContent={codeContent}
                    onChange={(e) => {
                      let obj = {}
                      obj[`${v.value}_CODE_CLONE`] = e
                      form.setFieldsValue({ ...formValues, ...form.getFieldsValue(), ...obj })
                    }}
                  />
                </Item>
              ) : null}
            </div>
          )
        })}
      </Checkbox.Group>
    )
  }
  // 客户端类型
  const AppOptions = () => {
    const executeMode = Form.useWatch("executeMode", form)

    const handleModeChange = (e) => {
      form.setFieldsValue({ executeMode: e.target.value })
    }

    return (
      <div style={{ margin: "5px 0" }}>
        <Radio.Group value={executeMode} onChange={handleModeChange}>
          <Radio value={EXECUTEMODE.LOCAL} disabled>
            原生
          </Radio>
          <Radio value={EXECUTEMODE.SCRIPT}>脚本</Radio>
        </Radio.Group>
        {executeMode === EXECUTEMODE.SCRIPT ? (
          <Item
            rules={[{ required: true, message: "请选择客户端配置项" }]}
            name="scriptChecked"
            noStyle
          >
            <ScriptSettings />
          </Item>
        ) : null}
      </div>
    )
  }
  const updateMutate = () => queryClient.invalidateQueries([QUERY_KEYS.MODELS_LIST])
  // 保存/编辑
  const { mutate, isLoading } = useSaveModelApi(updateMutate)
  // 数据重组
  const getSaveData = () => {
    const values = form.getFieldsValue()
    const script = (values?.scriptChecked ?? []).map((code) => {
      let obj = {}
      obj.scriptCode = code
      obj.scriptContent = values?.[`${code}_CODE`]
      delete values?.[`${code}_CODE`]
      return obj
    })
    values.script = script

    // 重组可见性设置数据
    const visibilitySetting = {
      visibilityType: values.visibilityType,
      bots: values.visibilityType === 2 ? values.bots.map((botNo) => ({ botNo })) : []
    }

    delete values.scriptChecked
    delete values.visibilityType
    delete values.bots

    return { ...record, ...values, visibilitySetting }
  }
  // 保存/编辑
  const handlerSave = async () => {
    await form.validateFields()
    mutate(
      {
        ...getSaveData()
      },
      {
        onSuccess: (e) => {
          if (e?.success) {
            setOpenModal(false)
          }
        }
      }
    )
  }
  // 初始化编辑
  useEffect(() => {
    if (record) {
      const clone = { ...record }
      // 从script数组中提取scriptCode
      clone.scriptChecked = record?.script?.map((v) => v.scriptCode) || []

      // 设置每个脚本的代码内容
      record?.script?.forEach((v) => {
        clone[`${v.scriptCode}_CODE`] = v.scriptContent
        clone[`${v.scriptCode}_CODE_CLONE`] = v.scriptContent
      })

      // 处理可见性设置的回显
      if (record.visibilitySetting) {
        clone.visibilityType = record.visibilitySetting.visibilityType || 1
        clone.bots = record.visibilitySetting.bots?.map((bot) => bot.botNo) || []
      }

      // 如果没有script字段，默认设置为脚本模式
      if (!record.script) {
        clone.executeMode = EXECUTEMODE.SCRIPT
      } else {
        clone.executeMode = record.executeMode || EXECUTEMODE.SCRIPT
      }

      console.log("初始化表单值:", clone)
      form.setFieldsValue(clone)
    }
  }, [record])
  const filterOption = (input, option) => {
    return (option?.name ?? "").toLowerCase().includes(input.toLowerCase())
  }

  // 监听可见范围变化
  const visibilityType = Form.useWatch("visibilityType", form)
  // 监听AI网关新协议开关
  const useAiGateway = Form.useWatch("useAiGateway", form)

  const { data: botInfo } = useFetchBotListByPage({
    pageNum: 1,
    pageSize: 1000
  })

  return (
    <Modal
      title={record ? "编辑模型" : "新增模型"}
      open={openModal}
      onOk={handlerSave}
      width={800}
      destroyOnClose={true}
      confirmLoading={isLoading}
      onCancel={() => setOpenModal(false)}
    >
      <div className={styles.container}>
        <Form
          form={form}
          initialValues={{ visibilityType: 1 }}
          labelCol={{ span: 5 }}
          preserve={false}
          scrollToFirstError={true}
        >
          <Item name="name" label="模型名称" rules={rules}>
            <Input placeholder="请输入模型名称" allowClear />
          </Item>
          <Item name="code" label="模型Code" rules={rules}>
            <Input placeholder="请输入模型Code" disabled={record} allowClear />
          </Item>

          {/* 添加网关侧模型code输入框 */}
          <Item name="gatewayModelCode" label="网关模型Code">
            <Input placeholder="请输入网关侧模型Code" disabled={record} allowClear />
          </Item>

          <Item name="channel" label="模型渠道" rules={rules}>
            <Input placeholder="请输入模型渠道" disabled={record} allowClear />
          </Item>

          {/* 添加是否支持工具调用开关 */}
          <Item name="supportToolCall" label="支持工具调用" valuePropName="checked">
            <Switch />
          </Item>

          {/* 添加是否支持推理开关 */}
          <Item name="supportReasoning" label="支持推理" valuePropName="checked">
            <Switch />
          </Item>

          {/* 添加是否支持 AI 网关新协议开关 */}
          <Item name="useAiGateway" label="支持 AI 网关新协议" valuePropName="checked">
            <Switch />
          </Item>
          {!useAiGateway ? (
            <Item
              name="executeMode"
              label="客户端类型"
              initialValue={EXECUTEMODE.SCRIPT}
              rules={rules}
            >
              <AppOptions />
            </Item>
          ) : null}

          <Item name="maxToken" label="MaxToken" rules={rules}>
            <InputNumber
              addonBefore={<ControlOutlined />}
              placeholder="请输入maxToken"
              style={{ width: "100%" }}
            />
          </Item>
          <Item name="modal" label="模态" rules={[{ required: true, message: "请选择${label}" }]}>
            <Select
              placeholder="请选择模态"
              options={modelTypeOptions}
              filterOption={filterOption}
              showSearch
              optionFilterProp="children"
              mode="multiple"
              fieldNames={{ label: "name", value: "code" }}
              allowClear
            />
          </Item>

          {/* 添加可见范围单选框 */}
          <Item name="visibilityType" label="可见范围" initialValue={1}>
            <Radio.Group options={visibilityOptions} />
          </Item>

          {/* 当选择指定空间可见时显示空间选择框 */}
          {visibilityType === 2 && (
            <Item
              name="bots"
              label="选择空间"
              rules={[{ required: true, message: "请选择空间" }]}
            >
              <Select
                mode="multiple"
                placeholder="请选择空间"
                allowClear
                style={{ width: "100%" }}
                options={botInfo?.botList?.map((bot) => ({
                  value: bot.botNo,
                  label: bot.botName
                }))}
                showSearch
                filterOption={(input, option) =>
                  // @ts-ignore
                  (option?.label ?? "")?.toLowerCase().includes(input.toLowerCase())
                }
                optionFilterProp="children"
              />
            </Item>
          )}
        </Form>
      </div>
    </Modal>
  )
}

export default AddEditModel
