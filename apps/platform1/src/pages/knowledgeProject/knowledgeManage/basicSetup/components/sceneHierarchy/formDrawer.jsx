import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button, Drawer, Form, Cascader, message } from "antd"
import { cloneDeep } from "lodash"
import { fetchListByParentAndType } from "@/api/knowledgeManage/api"
import { useFetchAddKnowledgeConfigApi } from "@/api/knowledgeManage"
import HierarchySetting from "@/components/HierarchySetting"
import { getAddTreeData } from "@/pages/knowledgeProject/knowledgeManage/templateDetail/components/levelDrawer"
import { findKnowledgeLayerNodes } from "@/pages/knowledgeProject/utils"
import styles from "./index.module.scss"

const title = {
  add: "新增",
  edit: "编辑",
  view: "查看"
}

const FormDrawer = ({ mode, visiable, setVisiable, recordData, listByParentAndType, botNo }) => {
  const [form] = Form.useForm()
  const _businessScene = Form.useWatch("_businessScene", form)
  const businessSceneId = useMemo(
    () => _businessScene?.[_businessScene?.length - 1],
    [_businessScene]
  )
  const [relationDetailInfo, setRelationDetailInfo] = useState([])
  const hierarchySettingRef = useRef(null)
  const { mutate: addKnowledgeConfig } = useFetchAddKnowledgeConfigApi()

  const handleFetchListByType = useCallback(() => {
    if (!businessSceneId || !botNo) return
    fetchListByParentAndType({
      parentId: businessSceneId,
      parentType: "BUSINESS_SCENE",
      type: "INTENTION_LEVEL",
      botNo
    }).then((res) => {
      setRelationDetailInfo(res || [])
    })
  }, [botNo, businessSceneId])

  useEffect(() => {
    handleFetchListByType()
  }, [handleFetchListByType])

  const onAddData = useCallback(
    ({ resChildList, id, index, parentData }) => {
      resChildList.push({
        id,
        deep: index + 1,
        priority: 0,
        type: "INTENTION_LEVEL",
        parentType:
          index !== 0
            ? parentData?.type || "INTENTION_LEVEL"
            : parentData?.parentType || "BUSINESS_SCENE",
        parentId: (index !== 0 ? parentData?.id : parentData?.parentId || businessSceneId) || "-1",
        childKnowledgeConfigs: []
      })
    },
    [businessSceneId]
  )

  const onSave = useCallback(() => {
    if (hierarchySettingRef.current?.getIsEdit()) {
      message.warning("请先确定当前编辑内容！")
      return
    }
    const list = findKnowledgeLayerNodes(listByParentAndType || [], businessSceneId)
    const params = getAddTreeData(hierarchySettingRef.current?.relationTree)
    addKnowledgeConfig(
      {
        botNo,
        data: [
          {
            id: businessSceneId,
            name: list?.find(({ id }) => id === businessSceneId)?.name,
            type: "BUSINESS_SCENE",
            deep: 1,
            priority: 0,
            childKnowledgeConfigs: params
          }
        ]
      },
      {
        onSuccess: (res) => {
          if (res?.success) {
            message.success("操作成功！")
            setVisiable(false)
          }
        }
      }
    )
  }, [addKnowledgeConfig, botNo, businessSceneId, listByParentAndType, setVisiable])

  useEffect(() => {
    if (recordData && visiable) {
      const { id: businessSceneId, ...otherData } = recordData
      form.setFieldsValue({
        _businessScene: findKnowledgeLayerNodes(listByParentAndType || [], businessSceneId)?.map(
          (item) => item.id
        ),
        ...otherData
      })
    }
  }, [visiable, form, listByParentAndType, recordData])

  useEffect(() => {
    if (visiable) {
      hierarchySettingRef.current?.setRelationTree(cloneDeep(relationDetailInfo || []))
    } else {
      hierarchySettingRef.current?.setEditTypeObj({})
      hierarchySettingRef.current?.setCurrentLevels([])
      form.resetFields()
    }
  }, [relationDetailInfo, visiable, form])

  return (
    <Drawer
      open={visiable}
      size="large"
      title={title[mode]}
      onClose={() => setVisiable(false)}
      destroyOnClose
      footer={[
        <div
          key="footer"
          style={{
            textAlign: "right"
          }}
        >
          <Button onClick={() => setVisiable(false)}>取消</Button>
          {mode !== "view" && (
            <Button type="primary" style={{ marginLeft: "5px" }} onClick={onSave}>
              保存
            </Button>
          )}
        </div>
      ]}
    >
      <Form layout="horizontal" form={form}>
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
            disabled={mode !== "add"}
          />
        </Form.Item>
        <Form.Item label="层级目录" className={styles["hierarchy-form-item"]}>
          <HierarchySetting
            ref={hierarchySettingRef}
            onAdd={onAddData}
            disabled={mode === "view"}
            fieldNames={{
              name: "name",
              value: "id",
              children: "childKnowledgeConfigs"
            }}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}

export default FormDrawer
