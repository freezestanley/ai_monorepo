import KnowledgeBase from "./KnowledgeBaseWrapperItem"
import ImageTextKnowledge from "./ImageTextKnowledge"
import styles from "./index.module.scss"
import queryString from "query-string"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import documentKnowledge from "@/assets/img/documentKnowledge.png"
import chatKnowledge from "@/assets/img/chatKnowledge.png"
import structureKnowledgeImg from "@/assets/img/structureKnowledge.png"
import WithDocAndStructureKnowledge from "./WithDocAndStructureKnowledge"
import DocumentTable from "./DocumentTable"
import StructureTable from "./StructureTable"
import useKnowledgeBaseForm from "../hooks/knowledge/useKnowledgeBaseForm"
import ChatKnowledgeModal from "@/components/ChatKnowledgeModal"
import { useFetchSourceTag } from "@/api/sourceTag"
import { useFetchDesignatedSourceTagList } from "@/api/structureKnowledge"
import { KNOWLEDGE_SCENE_TAG } from "@/constants"

const KNOWLEDGE_TYPE_COMPONENTS = {
  document: WithDocAndStructureKnowledge(DocumentTable),
  imageText: ImageTextKnowledge,
  structure: WithDocAndStructureKnowledge(StructureTable)
}

const KnowledgeBaseWrapper = (props) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { search } = location
  const queryParams = queryString.parse(search)
  const { botNo: botNoFormQuery } = queryParams
  const { botNo: botNoFromParams } = useParams()
  const botNo = botNoFromParams || botNoFormQuery
  const { isIframe } = queryParams

  const [selectedKnowledgeIndex, setSelectedKnowledgeIndex] = useState(0)
  const [knowledgeModalVisible, setKnowledgeModalVisible] = useState(false)

  const {
    treeData,
    setExpandedKeys,
    treeDataLoading,
    onSelect,
    handleMenuClick,
    showEditModal,
    setShowEditModal,
    setInputValue,
    inputValue,
    handleModalOk,
    editFlag,
    tableData,
    handleGenerateSimilarQuestions,
    handleSaveQuestions,
    drawerVisible,
    handleEditFaq,
    handleChangeStatus,
    knowledgeListData,
    setDrawerVisible,
    rowSelected,
    setRowSelected,
    editDetailList,
    setEditDetailList,
    handleUpload,
    setTableData,
    imgUploadAction,
    fetchUploadResultByCatalog
  } = useKnowledgeBaseForm({
    selectedKnowledgeBase: props.selectedKnowledgeBase,
    catalogNo: props.catalogNo,
    botNo
  })

  const { data: designatedSourceTagList } = useFetchDesignatedSourceTagList({
    botNo
  })
  const { mutate: fetchSourceTag } = useFetchSourceTag()
  const [sourceTag, setSourceTag] = useState([])
  const [sceneTags, setSceneTags] = useState([])
  useEffect(() => {
    fetchSourceTag(
      {
        botNo,
        tagType: "knowledgeAnswerSource"
      },
      {
        onSuccess: (res) => {
          if (res.success === true) {
            setSourceTag(res.data || [])
          }
        }
      }
    )
    setTimeout(fetchSceneTagList, 1000)
  }, [botNo])

  const fetchSceneTagList = () => {
    fetchSourceTag(
      {
        botNo,
        tagType: KNOWLEDGE_SCENE_TAG
      },
      {
        onSuccess: (res) => {
          if (res.success === true) {
            const sceneTagList = res.data?.length ? res.data : []
            setSceneTags(sceneTagList)
          }
        }
      }
    )
  }

  const updateKnowledgeTypeInURL = (type) => {
    const updatedSearch = queryString.stringify({
      ...queryParams,
      knowledgeType: type
    })
    navigate({
      ...location,
      search: updatedSearch
    })
  }

  useEffect(() => {
    if (!queryParams.knowledgeType) {
      updateKnowledgeTypeInURL("document")
    } else {
      setSelectedKnowledgeIndex(
        queryParams.knowledgeType === "document"
          ? 0
          : queryParams.knowledgeType === "imageText"
            ? 1
            : 2
      )
    }
  }, [])

  const CurrentKnowledgeComponent = KNOWLEDGE_TYPE_COMPONENTS[queryParams.knowledgeType] || null

  const knowledgeBases = [
    {
      title: "文档知识库",
      description: "支持上传pdf, doc, docx, txt等格式的文档，空间通过学习文档内容开展服务",
      icon: <img src={documentKnowledge} alt="" />,
      background: "#DFF2EE",
      border: "#04C083"
    },
    {
      title: "问答知识库",
      description: "仅支持文本及图片类型问答知识",
      icon: <img src={chatKnowledge} alt="" />,
      background: "#F7F2E3",
      border: "#F6BD17"
      // rightBtnText: "设置"
    },
    {
      title: "结构化知识库",
      description: "适用于表格等结构化字段内容,支持快速查询、比较、计算标准字段内容",
      icon: <img src={structureKnowledgeImg} alt="" />,
      background: "#EAF9FF",
      border: "#81DBFF"
    }
  ]

  return (
    <div className={styles.container}>
      {!isIframe && (
        <div className={styles.knowledgeBaseContainer} style={{ marginTop: -20, marginBottom: 20 }}>
          {knowledgeBases.map((base, index) => (
            <KnowledgeBase
              isActive={selectedKnowledgeIndex === index}
              onClick={() => {
                const type = index === 0 ? "document" : index === 1 ? "imageText" : "structure"
                updateKnowledgeTypeInURL(type)
                setSelectedKnowledgeIndex(index)
              }}
              key={index}
              title={base.title}
              description={base.description}
              icon={base.icon}
              background={base.background}
              border={base.border}
              rightBtnText={base.rightBtnText}
              rightBtnClick={() => {
                if (index === 1) {
                  setKnowledgeModalVisible(true)
                }
              }}
            />
          ))}
        </div>
      )}

      {CurrentKnowledgeComponent && (
        <CurrentKnowledgeComponent
          selectedKnowledgeBase={props.selectedKnowledgeBase}
          {...{
            treeData,
            setExpandedKeys,
            treeDataLoading,
            onSelect,
            handleMenuClick,
            showEditModal,
            setShowEditModal,
            setInputValue,
            inputValue,
            handleModalOk,
            editFlag,
            tableData,
            handleGenerateSimilarQuestions,
            handleSaveQuestions,
            drawerVisible,
            handleEditFaq,
            handleChangeStatus,
            setDrawerVisible,
            rowSelected,
            setRowSelected,
            editDetailList,
            setEditDetailList,
            handleUpload,
            setTableData,
            imgUploadAction,
            fetchUploadResultByCatalog,
            designatedSourceTagList,
            sourceTag,
            sceneTags
          }}
        />
      )}

      <ChatKnowledgeModal
        visible={knowledgeModalVisible}
        knowledgeBaseNo={props.selectedKnowledgeBase}
        initialValues={{
          embeddingType:
            knowledgeListData?.extraInfo?.embedding?.find((i) => i.type === 1)?.embeddingType ||
            "GPT_EMBEDDING"
        }}
        onClose={() => {
          setKnowledgeModalVisible(false)
        }}
        onSuccess={() => {}}
      />
    </div>
  )
}

export default KnowledgeBaseWrapper
