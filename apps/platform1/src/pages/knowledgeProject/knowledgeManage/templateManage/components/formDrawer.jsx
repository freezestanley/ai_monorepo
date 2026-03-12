import { useCallback, useEffect } from "react"
import { Button, Drawer, Form, Input, Select, Cascader } from "antd"
import {
  useFetchListByType,
  useAddKnowledgeTemplateApi,
  useFetchEditKnowledgeTemplateApi
} from "@/api/knowledgeManage"
import { findKnowledgeLayerNodes } from "@/pages/knowledgeProject/utils"
import styles from "../index.module.scss"

const FormDrawer = ({ visiable, setVisiable, recordData, botNo }) => {
  const [form] = Form.useForm()
  // 业务场景
  const { data: listByParentAndType } = useFetchListByType({
    type: "BUSINESS_SCENE",
    botNo
  })
  const { mutate: addKnowledgeTemplate } = useAddKnowledgeTemplateApi()
  const { mutate: editKnowledgeTemplate } = useFetchEditKnowledgeTemplateApi()

  const onSave = useCallback(async () => {
    const values = await form.validateFields()
    const { _businessScene, ...extratValues } = values
    const _businessSceneList = findKnowledgeLayerNodes(
      listByParentAndType || [],
      _businessScene?.[_businessScene?.length - 1]
    )
    const params = {
      botNo,
      businessSceneId: _businessSceneList?.[_businessSceneList?.length - 1]?.id,
      businessSceneName: _businessSceneList?.[_businessSceneList?.length - 1]?.name,
      ...extratValues,
      ...(recordData?.id && { templateId: recordData.id })
    }
    const fetchFn = recordData?.id ? editKnowledgeTemplate : addKnowledgeTemplate
    fetchFn(params, {
      onSuccess: (res) => res?.success && setVisiable(false)
    })
  }, [
    form,
    listByParentAndType,
    botNo,
    recordData,
    editKnowledgeTemplate,
    addKnowledgeTemplate,
    setVisiable
  ])

  useEffect(() => {
    if (recordData && visiable) {
      const { businessSceneId, ...otherData } = recordData
      form.setFieldsValue({
        _businessScene: findKnowledgeLayerNodes(listByParentAndType || [], businessSceneId)?.map(
          (item) => item.id
        ),
        ...otherData
      })
    } else if (!visiable) {
      form.resetFields()
    }
  }, [form, listByParentAndType, recordData, visiable])

  return (
    <Drawer
      open={visiable}
      size="large"
      title={recordData?.id ? "编辑" : "新增"}
      onClose={() => setVisiable(false)}
      destroyOnClose
      footer={[
        <div
          key="footer"
          style={{
            textAlign: "right"
          }}
        >
          <Button style={{ marginRight: "5px" }} onClick={() => setVisiable(false)}>
            取消
          </Button>
          <Button type="primary" onClick={onSave}>
            保存
          </Button>
        </div>
      ]}
    >
      <Form layout="horizontal" form={form}>
        <h1 className={styles.formDrawerTitle}>通用设置</h1>
        <Form.Item
          label="阶段类型"
          name="stageType"
          rules={[{ required: true, message: "请选择阶段类型" }]}
        >
          <Select
            placeholder="请选择阶段类型"
            options={[
              { label: "正式", value: "正式" },
              { label: "测试", value: "测试" }
            ]}
          />
        </Form.Item>
        <Form.Item
          label="业务场景"
          name="_businessScene"
          rules={[{ required: true, message: "请选择业务场景" }]}
        >
          <Cascader
            placeholder="请选择业务场景"
            options={listByParentAndType}
            fieldNames={{
              label: "name",
              value: "id",
              children: "childKnowledgeConfigs"
            }}
            showSearch
          />
        </Form.Item>
        <Form.Item
          label="模版名称"
          name="templateName"
          rules={[{ required: true, message: "请输入模版名称" }]}
        >
          <Input placeholder="请输入模版名称" />
        </Form.Item>
        <Form.Item label="使用渠道" name="usingChannels">
          <Select
            placeholder="请选择使用渠道"
            options={[
              { label: "NLP", value: "NLP" },
              { label: "LLM", value: "LLM" },
              { label: "人工", value: "人工" }
            ]}
            mode="multiple"
          />
        </Form.Item>
        <Form.Item label="描述" name="templateDescripe">
          <Input.TextArea placeholder="请输入描述" maxLength={500} showCount />
        </Form.Item>
      </Form>
    </Drawer>
  )
}

export default FormDrawer
