import { useCallback, useEffect, useRef } from "react"
import { cloneDeep } from "lodash"
import { Drawer, Form, TreeSelect, Button, message } from "antd"
import HierarchySetting, { addPrefix } from "@/components/HierarchySetting"
import { useFetchAddKnowledgeConfigApi } from "@/api/knowledgeManage"

export const getAddTreeData = (tree) => {
  return tree?.map(
    (
      {
        id,
        parentId,
        knowledgeTemplateIntentionRelationVOS,
        childIntentionLevelVOS,
        childKnowledgeConfigs,
        ...item
      },
      index
    ) => ({
      ...item,
      priority: index,
      id: id?.startsWith(addPrefix) ? undefined : id,
      parentId: parentId?.startsWith(addPrefix) ? undefined : parentId,
      knowledgeTemplateIntentionRelationVOS,
      childKnowledgeConfigs: getAddTreeData(childIntentionLevelVOS || childKnowledgeConfigs)
    })
  )
}

const LevelDrawer = ({
  visiable,
  setVisiable,
  listByParentAndType,
  knowledgeTemplateVO,
  relationDetailInfo,
  botNo
}) => {
  const hierarchySettingRef = useRef(null)
  const { mutate: addKnowledgeConfig } = useFetchAddKnowledgeConfigApi()

  useEffect(() => {
    if (visiable) {
      hierarchySettingRef.current?.setRelationTree(cloneDeep(relationDetailInfo || []))
    } else {
      hierarchySettingRef.current?.setEditTypeObj({})
      hierarchySettingRef.current?.setCurrentLevels([])
    }
  }, [relationDetailInfo, visiable])

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
        parentId:
          (index !== 0
            ? parentData?.id
            : parentData?.parentId || knowledgeTemplateVO?.businessSceneId) || "-1",
        childIntentionLevelVOS: []
      })
    },
    [knowledgeTemplateVO?.businessSceneId]
  )

  const onSave = useCallback(() => {
    if (hierarchySettingRef.current?.getIsEdit()) {
      message.warning("请先确定当前编辑内容！")
      return
    }
    const params = getAddTreeData(hierarchySettingRef.current?.relationTree)
    addKnowledgeConfig(
      {
        botNo,
        data: [
          {
            id: knowledgeTemplateVO?.businessSceneId,
            name: knowledgeTemplateVO?.businessSceneName,
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
  }, [addKnowledgeConfig, knowledgeTemplateVO, setVisiable, botNo])

  return (
    <Drawer
      open={visiable}
      width={"50%"}
      title="场景层级编辑"
      destroyOnClose
      onClose={() => setVisiable(false)}
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
      <Form layout="vertical">
        <Form.Item>
          <TreeSelect
            className="mb-2 w-100"
            placeholder="请选择业务场景"
            treeData={listByParentAndType}
            value={knowledgeTemplateVO?.businessSceneId}
            fieldNames={{
              label: "name",
              value: "id",
              children: "childKnowledgeConfigs"
            }}
            disabled
            treeDefaultExpandAll
            showSearch
          />
        </Form.Item>
        <Form.Item label="设置场景层级" colon={false}>
          <HierarchySetting ref={hierarchySettingRef} onAdd={onAddData} />
        </Form.Item>
      </Form>
    </Drawer>
  )
}

export default LevelDrawer
