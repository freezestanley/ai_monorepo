import { useBatchSaveSourceTag, useFetchSourceTag } from "@/api/sourceTag"
import { useFetchChannelList } from "@/api/structureKnowledge"
import {
  KNOWLEDGE_DEFAULT_SOURCE_TAG,
  KNOWLEDGE_DEFAULT_SOURCE_TAG_TEXT
} from "@/constants/knowledge"
import { Button, Form, message, Tabs } from "antd"
import queryString from "query-string"
import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import SourceTagForm from "./components/SourceTagForm"
import SceneTagForm from "./components/SceneTagForm"
import { KNOWLEDGE_SCENE_TAG } from "@/constants"

function KnowledgeSourceTag() {
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)
  const { botNo } = queryParams
  const [severSourceTagList, setSeverSourceTagList] = useState([])
  const [severSceneTagList, setSeverSceneTagList] = useState([])
  const [activeTab, setActiveTab] = useState("source")
  const [form] = Form.useForm()
  const [sceneForm] = Form.useForm()

  const { mutate: saveSourceTag } = useBatchSaveSourceTag()
  const { mutate: fetchSourceTag } = useFetchSourceTag()
  const { data: channel = [] } = useFetchChannelList({ botNo })

  const onFinish = (values) => {
    console.log("Received values of form:", values)
    form.validateFields().then((values) => {
      const submitData = {
        botNo,
        tagType: "knowledgeAnswerSource",
        tags: values.sourceTagList
      }
      saveSourceTag(submitData, {
        onSuccess: (res) => {
          fetchData("knowledgeAnswerSource")
          if (res.success === true) {
            message.success("保存成功")
          }
        }
      })
    })
  }

  const onSceneFinish = (values) => {
    console.log("Scene form values:", values)
    sceneForm.validateFields().then((values) => {
      const submitData = {
        botNo,
        tagType: KNOWLEDGE_SCENE_TAG,
        tags: values.sceneTagList
      }
      saveSourceTag(submitData, {
        onSuccess: (res) => {
          fetchData(KNOWLEDGE_SCENE_TAG)
          if (res.success === true) {
            message.success("保存成功")
          }
        }
      })
    })
  }

  const fetchData = (tagType) => {
    fetchSourceTag(
      {
        botNo,
        tagType
      },
      {
        onSuccess: (res) => {
          if (res.success === true) {
            if (tagType === "knowledgeAnswerSource") {
              const sourceTagList = res.data?.length
                ? res.data
                : [
                    {
                      code: KNOWLEDGE_DEFAULT_SOURCE_TAG,
                      tagDesc: KNOWLEDGE_DEFAULT_SOURCE_TAG_TEXT
                    }
                  ]
              sourceTagList[0].channel = sourceTagList?.[0].code || "default"
              form.setFieldsValue({
                sourceTagList
              })
              setSeverSourceTagList(sourceTagList)
            } else if (tagType === KNOWLEDGE_SCENE_TAG) {
              const sceneTagList = res.data?.length
                ? res.data
                : [
                    {
                      code: "1",
                      tagDesc: ""
                    }
                  ]
              sceneTagList[0].channel = sceneTagList?.[0].code || "default"
              sceneForm.setFieldsValue({
                sceneTagList
              })
              setSeverSceneTagList(res.data)
            }
          }
        }
      }
    )
  }

  useEffect(() => {
    fetchData("knowledgeAnswerSource")
    setTimeout(() => {
      fetchData(KNOWLEDGE_SCENE_TAG)
    }, 1000)
  }, [])

  const severSourceTagListLen = severSourceTagList.length
  const severSceneTagListLen = severSceneTagList.length

  return (
    <div className="relative pt-8 pl-8 pr-8 h-[100vh] overflow-y-auto">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "source",
            label: "来源标签",
            children: (
              <SourceTagForm
                form={form}
                onFinish={onFinish}
                channel={channel}
                FooterButtons={FooterButtons}
                severSourceTagListLen={severSourceTagListLen}
              />
            )
          },
          {
            key: "scene",
            label: "场景标签",
            children: (
              <SceneTagForm
                form={sceneForm}
                onFinish={onSceneFinish}
                FooterButtons={FooterButtons}
                severSceneTagListLen={severSceneTagListLen}
              />
            )
          }
        ]}
      />
    </div>
  )
}

export default KnowledgeSourceTag

function FooterButtons() {
  return (
    <div
      className="flex justify-end fixed bg-white"
      style={{
        width: "100%",
        padding: "16px 24px",
        bottom: 0,
        right: 0,
        borderTop: "1px solid #e8e8e8"
      }}
    >
      <div>
        <Button type="primary" htmlType="submit">
          保存
        </Button>
      </div>
    </div>
  )
}
