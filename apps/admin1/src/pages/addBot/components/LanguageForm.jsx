// @ts-nocheck
import React, { useEffect, useImperativeHandle } from "react"
import {
  Form,
  Switch,
  Select,
  Input,
  Button,
  Tooltip,
  Modal,
  Row,
  Col,
  Tabs,
  message,
  Divider,
  Space,
  TreeSelect,
  Alert
} from "antd"
import QuillEditor from "@/components/QuillEditor"
import queryString from "query-string"
import { useFetchSourceTag } from "@/api/sourceTag"
import { useState } from "react"
import Iconfont from "@/components/Icon"
import ImageUpload from "@/components/ImageUpload"
import RelationData from "@/components/RelationData"
import { useParams, useLocation } from "react-router-dom"
import {
  KNOWLEDGE_DEFAULT_SOURCE_TAG,
  KNOWLEDGE_DEFAULT_SOURCE_TAG_TEXT
} from "@/constants/knowledge"
import { KNOWLEDGE_SCENE_TAG } from "@/constants"

import { useFetchStructureDatasetList } from "@/api/structureKnowledge"

const { TabPane } = Tabs
const { Option } = Select
const { TextArea } = Input

const LanguageForm = React.forwardRef(
  (
    {
      language,
      handleGenerateSimilarQuestions: handleGenerateSimilarQuestionsProps,
      editDetail,
      imgUploadAction,
      knowledgeBaseNo,
      currentSelectedKnowledgeBase,
      disabled,
      source,
      isAntron,
      hasEditPermission,
      hasAnswerEditPermission
    },
    ref
  ) => {
    // disabled = true
    const [form] = Form.useForm()
    const [visible, setVisible] = useState(false)
    const [status, setStatus] = useState(false)
    const [similarQuestions, setSimilarQuestions] = useState([])
    const [magicQuestions, setMagicQuestions] = useState([])
    const [userQuestions, setUserQuestions] = useState([])
    const [loading, setLoading] = useState(false)
    const [isTagsLoaded, setIsTagsLoaded] = useState(false)
    const [retryCount, setRetryCount] = useState(0)
    const MAX_RETRIES = 3
    const TIMEOUT = 10000 // 10秒超时
    // 强制更新
    const [, forceUpdate] = useState(null)

    const [tabList, setTabList] = useState([])
    const [activeKey, setActiveKey] = useState(KNOWLEDGE_DEFAULT_SOURCE_TAG)
    const [selectedTag, setSelectedTag] = useState(null)
    const [availableTags, setAvailableTags] = useState([])
    const [sceneTags, setSceneTags] = useState([])
    const [associatedStructureRawData, setAssociatedStructureRawData] = useState([])

    const location = useLocation()
    const { search } = location
    const queryParams = queryString.parse(search)
    const { botNo: botNoFormQuery } = queryParams
    const { botNo: botNoFromParams } = useParams()
    const botNo = botNoFromParams || botNoFormQuery

    const [choice, setChoice] = useState(undefined)

    const [similarAnswers, setSimilarAnswers] = useState({})
    const [magicAnswers, setMagicAnswers] = useState({})
    const [userAnswers, setUserAnswers] = useState({})
    const [answerVisible, setAnswerVisible] = useState(false)
    const [answerLoading, setAnswerLoading] = useState(false)

    const [currentEditLabel, setCurrentEditLabel] = useState(null)

    useImperativeHandle(ref, () => ({
      validate: async () => {
        try {
          await form.validateFields()
        } catch (error) {
          return form.validateFields()
        }
        const values = form.getFieldsValue()

        for (let i = 0; i < tabList.length; i++) {
          const item = tabList[i]

          if (!(values[item.key].answer || values[item.key].images)) {
            setActiveKey(item.key)
            message.error(`${item.name}来源标签的答案和图片至少要填一个`)
            throw new Error(`${item.key}来源标签答案和图片至少要填一个`)
          }
        }

        for (let i = 0; i < associatedStructureRawData.length; i++) {
          const item = associatedStructureRawData[i]

          if (item?.relationSwitch) {
            if (!item?.rawDataIds?.length || !item?.rawDataIds) {
              const tabIndex = tabList.find((tab) => tab.key === item.key)
              setActiveKey(tabIndex.key)
              message.error(
                `【${tabIndex?.name}】下的关联数据集开关已打开，请至少选择一项数据关联！`
              )
              throw new Error(
                `【${tabIndex?.name}】下的关联数据集开关已打开，请至少选择一项数据关联！`
              )
            }
          }
        }

        if (!choice?.length && Array.isArray(choice)) {
          message.error(`关联数据集开关已打开，请至少选择一项数据关联！`)
          throw new Error(`关联数据集开关已打开，请至少选择一项数据关联！`)
        }

        return true
      },
      getValues: () => {
        const originalValues = form.getFieldsValue()
        const faqAnswerWithTag = availableTags
          .map((tagItem) => {
            const tagKey = tagItem.code
            const associatedStructureRawDataCurrent =
              associatedStructureRawData?.find((a) => a.key === tagKey) || undefined
            return {
              tagKey,
              answer: originalValues[tagKey]?.answer,
              fileIds: (originalValues[tagKey]?.images || []).map((item) => item.id),
              similarAnswer: originalValues[tagKey]?.similarAnswer,
              associatedStructureRawData: associatedStructureRawDataCurrent?.relationSwitch
                ? [
                    {
                      rawDataIds: associatedStructureRawDataCurrent?.rawDataIds,
                      structureNo: associatedStructureRawDataCurrent?.structureNo,
                      catalogNo:
                        associatedStructureRawDataCurrent?.catalogNo || editDetail?.catalogNo
                    }
                  ]
                : null
            }
          })
          .filter((a) => a.answer || a.fileIds.length)

        return {
          ...originalValues,
          faqAnswerWithTag
        }
      }
    }))

    const { mutate: fetchSourceTag } = useFetchSourceTag()

    const fetchData = () => {
      const timeoutId = setTimeout(() => {
        if (!isTagsLoaded) {
          message.warning("获取标签列表超时，正在重试...")
          if (retryCount < MAX_RETRIES) {
            setRetryCount((prev) => prev + 1)
            fetchData()
          } else {
            message.error("获取标签列表失败，请刷新页面重试")
            setIsTagsLoaded(true)
          }
        }
      }, TIMEOUT)

      fetchSourceTag(
        {
          botNo,
          tagType: "knowledgeAnswerSource"
        },
        {
          onSuccess: (res) => {
            clearTimeout(timeoutId)
            if (res.success === true) {
              const sourceTagList = res.data?.length
                ? res.data
                : [
                    {
                      code: KNOWLEDGE_DEFAULT_SOURCE_TAG,
                      tagDesc: KNOWLEDGE_DEFAULT_SOURCE_TAG_TEXT
                    }
                  ]
              setAvailableTags(sourceTagList)
              setIsTagsLoaded(true)
              setRetryCount(0)
            } else {
              message.error("获取标签列表失败")
              setIsTagsLoaded(true)
            }
          },
          onError: () => {
            clearTimeout(timeoutId)
            message.error("获取标签列表失败")
            if (retryCount < MAX_RETRIES) {
              setRetryCount((prev) => prev + 1)
              setTimeout(() => {
                fetchData()
              }, 1000)
            } else {
              setIsTagsLoaded(true)
            }
          }
        }
      )
    }

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

    const LabelAnswer = ({ label }) => {
      const [relationSwitch, setRelationSwitch] = useState(false)
      const [structureNo, setStructureNo] = useState(undefined)
      const [optionDetail, setOptionDetail] = useState(undefined)
      const [showRelationMsg, setShowRelationMsg] = useState(false)
      const [selectCatalogNo, setSelectCatalogNo] = useState(undefined) //editDetail?.catalogNo || undefined
      const [answerText, setAnswerText] = useState("")

      // 所有数据集筛选列表
      const { data: knowledgeListData, mutate: getKnowledgeListData } =
        useFetchStructureDatasetList({
          catalogNo: selectCatalogNo, //|| editDetail?.catalogNo, //editDetail?.catalogNo,
          knowledgeBaseNo: knowledgeBaseNo,
          pageNum: 1,
          pageSize: 10000
        })

      useEffect(() => {
        const currentDetail = editDetail?.faqAnswerWithTag?.find(
          (detail) => detail?.tagKey === label
        )
        //处理编辑
        if (editDetail && editDetail?.id && editDetail?.faqAnswerWithTag) {
          // 编辑

          if (currentDetail?.associatedStructureRawData?.[0]?.structureNo) {
            setRelationSwitch(true)
          } else {
            setRelationSwitch(false)
          }

          setStructureNo(currentDetail?.associatedStructureRawData?.[0]?.structureNo || undefined)

          const copyLists = knowledgeListData?.data?.records?.length
            ? JSON.parse(JSON.stringify(knowledgeListData?.data?.records))
            : []
          const options = copyLists?.find(
            (k) => (k.structureNo = currentDetail?.associatedStructureRawData?.[0]?.structureNo)
          )

          setOptionDetail(options)
        }
      }, [editDetail, knowledgeListData])

      useEffect(() => {
        const currentDetail = editDetail?.faqAnswerWithTag?.find(
          (detail) => detail?.tagKey === label
        )
        if (currentDetail?.associatedStructureRawData?.[0]?.catalogNo) {
          setSelectCatalogNo(currentDetail?.associatedStructureRawData?.[0]?.catalogNo || undefined)
        } else {
          setSelectCatalogNo(editDetail?.catalogNo || undefined)
        }
      }, [editDetail])

      const choiceHandle = (choices) => {
        setChoice(choices || [])
      }

      const disabled = isAntron || !hasAnswerEditPermission

      // 监听答案变化及初始化
      useEffect(() => {
        const currentAnswer = form.getFieldValue([label, "answer"])
        console.log(`${label} 答案初始化:`, currentAnswer)
        setAnswerText(currentAnswer || "")
      }, [label, form])

      return (
        <Row>
          <Col span={24}>
            <Form.Item
              label="答案"
              name={[label, "answer"]}
              rules={[{ required: false, message: "请输入答案" }]}
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
            >
              <TextArea
                rows={4}
                placeholder="请输入答案"
                disabled={disabled}
                onChange={(e) => {
                  const value = e.target.value
                  console.log(`${label} 答案变化:`, value)
                  setAnswerText(value)
                  // 强制更新
                  setTimeout(() => {
                    forceUpdate({})
                  }, 0)
                }}
                value={answerText}
              />
            </Form.Item>
          </Col>

          <Col span={24} className="flex items-center">
            <Form.Item
              label="相似答案"
              name={[label, "similarAnswer"]}
              rules={[{ required: false, message: "请选择或输入相似答案" }]}
              style={{ width: "100%" }}
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
            >
              <Select
                mode="tags"
                style={{ width: "80%", verticalAlign: "middle" }}
                placeholder="请选择或输入相似答案"
                onChange={(value) => {
                  // 直接更新表单值
                  form.setFieldsValue({
                    [label]: {
                      ...form.getFieldValue(label),
                      similarAnswer: value
                    }
                  })
                  setSimilarAnswers((prev) => ({ ...prev, [label]: value }))
                }}
                disabled={!hasAnswerEditPermission}
              />
            </Form.Item>
            <div style={{ marginTop: 20, marginLeft: "-18.5%" }}>
              <Tooltip title={answerText ? "生成相似答案" : "请先填写答案"}>
                <Button
                  disabled={!answerText || !hasAnswerEditPermission}
                  type="primary"
                  icon={<Iconfont type={"icon-moshubang"} />}
                  onClick={() => {
                    if (!answerText) {
                      message.warning("请先填写答案")
                      return
                    }
                    setCurrentEditLabel(label)
                    setAnswerVisible(true)
                    // 从表单中获取当前已有的相似答案
                    const currentSimilarAnswers = form.getFieldValue([label, "similarAnswer"]) || []
                    setUserAnswers((prev) => ({
                      ...prev,
                      [label]: currentSimilarAnswers
                    }))
                    setSimilarAnswers((prev) => ({
                      ...prev,
                      [label]: currentSimilarAnswers
                    }))
                  }}
                  style={{ marginLeft: -5 }}
                >
                  一键生成
                </Button>
              </Tooltip>
            </div>
          </Col>

          <Col span={24}>
            <Form.Item label="相关图片" name={[label, "images"]}>
              <ImageUpload
                imgUploadAction={imgUploadAction}
                disabled={isAntron || !hasAnswerEditPermission}
              />
            </Form.Item>
          </Col>
          {/* 关联数据集 */}
          <Col span={24}>
            <Form.Item label="关联数据集" name={[label, "relationSwitch"]}>
              <Switch
                disabled={!hasAnswerEditPermission}
                value={relationSwitch}
                size="small"
                valuePropName="checked"
                onChange={(checked) => {
                  setRelationSwitch(checked)

                  const values = form.getFieldsValue()
                  values[label]["structureNo"] = undefined
                  values[label]["relationSwitch"] = checked
                  form.setFieldsValue({ ...values })

                  // 打开开关默认给一个默认数据
                  const checkedIndex = associatedStructureRawData.findIndex((a) => a.key === label)
                  let newAssociatedStructureRawData = associatedStructureRawData || []
                  const currentLabel = form.getFieldValue(label)

                  if (checkedIndex > -1) {
                    newAssociatedStructureRawData[checkedIndex].relationSwitch = checked
                  } else {
                    newAssociatedStructureRawData.push({
                      relationSwitch: checked,
                      catalogNo: currentLabel?.catalogNo || editDetail?.catalogNo,
                      structureNo: currentLabel?.structureNo,
                      rawDataIds: [],
                      key: label
                    })
                  }

                  !checked && setChoice(false)
                  setAssociatedStructureRawData(newAssociatedStructureRawData)
                }}
              />
            </Form.Item>

            {/* relationSwitch */}
            {form.getFieldsValue()?.[label]?.relationSwitch ? (
              <>
                <Row gutter={20}>
                  <Col span={12}>
                    <Form.Item
                      label="知识库目录"
                      name={[label, `catalogNo`]}
                      labelCol={{ span: 24 }}
                      wrapperCol={{ span: 24 }}
                      rules={[{ required: true, message: "请选择知识库目录" }]}
                      initialValue={{
                        catalogNo: selectCatalogNo
                      }}
                    >
                      <TreeSelect
                        showSearch
                        value={selectCatalogNo}
                        disabled={!hasAnswerEditPermission}
                        allowClear
                        treeDefaultExpandAll
                        treeNodeFilterProp="catalogName"
                        placeholder="请选择知识库目录"
                        treeData={currentSelectedKnowledgeBase?.catalogsTreeList?.map((item) => ({
                          catalogName: item?.catalogType,
                          catalogNo: item?.knowledgeBaseNo,
                          children: item?.children || []
                        }))}
                        fieldNames={{
                          label: "catalogName",
                          value: "catalogNo"
                        }}
                        onChange={(value) => {
                          setSelectCatalogNo(value)
                          let newAssociatedStructureRawData = associatedStructureRawData

                          const currentIndex = associatedStructureRawData.findIndex(
                            (a) => a.key === label
                          )
                          newAssociatedStructureRawData[currentIndex]["catalogNo"] = value

                          setAssociatedStructureRawData(newAssociatedStructureRawData)

                          const values = form.getFieldsValue()
                          values[label]["structureNo"] = undefined
                          form.setFieldsValue({ ...values })
                          setStructureNo(undefined)
                        }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      rules={[{ required: true, message: "请选择数据集" }]}
                      label="数据集"
                      labelCol={{ span: 24 }}
                      wrapperCol={{ span: 24 }}
                      name={[label, `structureNo`]}
                    >
                      <Select
                        showSearch
                        disabled={!hasAnswerEditPermission}
                        value={structureNo}
                        allowClear
                        filterOption={(input, option) =>
                          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                        }
                        placeholder="请选择数据集，支持数据集搜索！"
                        options={knowledgeListData?.data?.records?.map((item) => ({
                          label: item.name,
                          value: item.structureNo
                        }))}
                        onChange={(value) => {
                          setStructureNo(value || undefined)
                          const copyLists = JSON.parse(
                            JSON.stringify(knowledgeListData?.data?.records)
                          )
                          const options = copyLists?.find((k) => (k.structureNo = value))
                          setOptionDetail(options)

                          const values = form.getFieldsValue()
                          values[label]["structureNo"] = value || undefined
                          form.setFieldsValue({ ...values })
                        }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            ) : (
              ""
            )}
            {/* form.getFieldsValue()?.[label]?.structureNo */}
            {form.getFieldsValue()?.[label]?.structureNo && (
              <Form.Item className="my-[20px]" name={[label, "relationstructureRawDataIdsSwitch"]}>
                <RelationData
                  form={form}
                  relationSwitch={relationSwitch}
                  botNo={botNo}
                  disabled={!hasAnswerEditPermission}
                  activeKey={label}
                  availableTags={availableTags}
                  editDetail={editDetail}
                  relationChoice={structureNo}
                  showRelationMsg={showRelationMsg}
                  optionDetail={optionDetail}
                  choiceHandle={choiceHandle}
                  selectHandle={(values) => {
                    values && values?.length && setShowRelationMsg(false)
                    const currentLabel = form.getFieldValue(label)
                    let newAssociatedStructureRawData = associatedStructureRawData

                    const currentIndex = associatedStructureRawData.findIndex(
                      (a) => a.key === label
                    )
                    if (currentIndex > -1) {
                      newAssociatedStructureRawData[currentIndex] = {
                        structureNo: currentLabel?.structureNo,
                        catalogNo: currentLabel?.catalogNo || editDetail?.catalogNo,
                        rawDataIds: values,
                        key: label,
                        relationSwitch: currentLabel.relationSwitch
                      }
                    } else {
                      newAssociatedStructureRawData.push({
                        structureNo: currentLabel?.structureNo,
                        catalogNo: currentLabel?.catalogNo || editDetail?.catalogNo,
                        rawDataIds: values,
                        key: label,
                        relationSwitch: currentLabel.relationSwitch
                      })
                    }

                    setAssociatedStructureRawData(newAssociatedStructureRawData)
                  }}
                />
              </Form.Item>
            )}
          </Col>
        </Row>
      )
    }

    useEffect(() => {
      if (botNo) {
        fetchData()
        setTimeout(fetchSceneTagList, 1000)
        setTabList([
          {
            name: KNOWLEDGE_DEFAULT_SOURCE_TAG_TEXT,
            key: KNOWLEDGE_DEFAULT_SOURCE_TAG,
            content: <LabelAnswer label={KNOWLEDGE_DEFAULT_SOURCE_TAG} />
          }
        ])
      }
    }, [botNo])

    useEffect(() => {
      console.log("状态更新:", {
        isTagsLoaded,
        availableTags,
        selectedTag,
        tabList,
        retryCount
      })
    }, [isTagsLoaded, availableTags, selectedTag, tabList, retryCount])

    const detailHandle = () => {
      const tabList = []
      const faqAnswerWithTagObj = {}
      const newAssociatedStructureRawData = []
      editDetail.faqAnswerWithTag?.map((item) => {
        const tagKey = item.tagKey
        tabList.push({
          name: availableTags.find((tag) => tag.code === tagKey)?.tagDesc,
          key: tagKey,
          content: <LabelAnswer label={tagKey} />
        })
        if (item.answer || item.fileIds.length) {
          faqAnswerWithTagObj[tagKey] = {
            answer: item.answer,
            images: (item.fileUrls || []).map((url, index) => {
              return { url, id: item.fileIds[index] }
            }),
            relationSwitch: item?.associatedStructureRawData?.[0] ? true : false,
            structureNo: item?.associatedStructureRawData?.[0]?.structureNo,
            catalogNo: item?.associatedStructureRawData?.[0]?.catalogNo || editDetail?.catalogNo,
            similarAnswer: item.similarAnswer || []
          }

          // 将相似答案保存到状态中，方便后续使用
          setSimilarAnswers((prev) => ({
            ...prev,
            [tagKey]: item.similarAnswer || []
          }))
        }

        // 重置AssociatedStructureRawData
        if (
          item?.associatedStructureRawData?.[0]?.structureNo &&
          item?.associatedStructureRawData?.[0]?.rawDataIds?.length
        ) {
          const associatedObj = {
            structureNo: item?.associatedStructureRawData?.[0]?.structureNo,
            catalogNo: item?.associatedStructureRawData?.[0]?.catalogNo || editDetail?.catalogNo,
            rawDataIds: item?.associatedStructureRawData?.[0]?.rawDataIds,
            key: tagKey,
            relationSwitch: true
          }
          newAssociatedStructureRawData.push(associatedObj)
        }
      })
      setTabList(tabList)
      setActiveKey(tabList?.[0]?.key)
      form.setFieldsValue({
        faqSimilarityQuestions: editDetail.faqSimilarityQuestions,
        faqQuestion: editDetail.faqQuestion,
        sceneTags: editDetail.sceneTags,
        status: Boolean(editDetail.status),
        ...faqAnswerWithTagObj,
        faqAnswer: editDetail.faqAnswer
      })
      setSimilarQuestions(editDetail.faqSimilarityQuestions || [])

      setAssociatedStructureRawData(newAssociatedStructureRawData)
    }

    useEffect(() => {
      if (editDetail) {
        detailHandle()
      }
    }, [editDetail, form, availableTags])

    // 修改后的代码
    const handleGenerateSimilarQuestions = async () => {
      setLoading(true)
      const d = await form.getFieldsValue()
      await handleGenerateSimilarQuestionsProps(
        {
          faqQuestion: d[`faqQuestion`],
          faqAnswer: d[`faqQuestion`], // d?.default?.answer || d[`faqQuestion`],
          language: language
        },
        setMagicQuestions
      )
      setLoading(false)
    }

    const handleAddQuestions = () => {
      const newQuestions = Array.from(new Set([...userQuestions, ...magicQuestions]))

      setUserQuestions(newQuestions)
      setMagicQuestions([])
    }

    const handleSaveQuestions = () => {
      //赋值
      form.setFieldsValue({
        [`faqSimilarityQuestions`]: userQuestions
      })

      setSimilarQuestions(userQuestions)
      setVisible(false)
    }

    const handleEnterDown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault()
        // 这里也要去重
        const newQuestions = Array.from(new Set([...similarQuestions, e.target.value]))
        handleSimilarQuestionsChange(newQuestions)
      }
    }

    const handleSimilarQuestionsChange = (newQuestions) => {
      // 需要把值给到Form表单中
      form.setFieldsValue({
        [`faqSimilarityQuestions`]: newQuestions
      })

      setSimilarQuestions(newQuestions)
    }

    const handleTabRemove = (key) => {
      Modal.confirm({
        title: "是否确定要删除？",
        content: "删除后将导致该来源标签不可用！",
        onOk: () => {
          setTabList((prevTabs) => prevTabs.filter((tab) => tab.key !== key))
          setActiveKey(tabList[tabList.length - 2].key)
        },
        onCancel: () => {
          // 如果用户点击取消，不做任何操作
        }
      })
    }
    const handleSelect = (value) => {
      setSelectedTag(value)
      setTabList((prevTabs) => [
        ...prevTabs,
        {
          name: availableTags.find((label) => label.code === value).tagDesc,
          key: value,
          content: <LabelAnswer label={value} />
        }
      ])
      setActiveKey(value)
      setSelectedTag(null)
    }

    const handleGenerateSimilarAnswers = async (label) => {
      setAnswerLoading(true)
      const d = await form.getFieldsValue()
      try {
        await handleGenerateSimilarQuestionsProps(
          {
            faqQuestion: d[label]?.answer, //d[`faqQuestion`],
            faqAnswer: d[label]?.answer || d[`faqQuestion`],
            language: language
          },
          (answers) => {
            // 直接更新magicAnswers状态
            setMagicAnswers((prev) => {
              console.log("生成的相似答案:", answers)
              console.log("当前标签:", label)
              const newState = {
                ...prev,
                [label]: answers || []
              }
              console.log("更新后的状态:", newState)
              return newState
            })

            // 强制更新一下界面
            setTimeout(() => {
              forceUpdate({})
            }, 0)
          }
        )
      } catch (error) {
        console.error("生成相似答案出错:", error)
        message.error("生成相似答案出错")
      } finally {
        setAnswerLoading(false)
      }
    }

    const handleAddAnswers = (label) => {
      console.log("添加答案前:", {
        userAnswers: userAnswers[label] || [],
        magicAnswers: magicAnswers[label] || []
      })

      const newAnswers = Array.from(
        new Set([...(userAnswers[label] || []), ...(magicAnswers[label] || [])])
      )

      console.log("合并后的新答案:", newAnswers)

      setUserAnswers((prev) => {
        const newState = {
          ...prev,
          [label]: newAnswers
        }
        console.log("更新后的用户答案:", newState)
        return newState
      })

      setMagicAnswers((prev) => {
        const newState = {
          ...prev,
          [label]: []
        }
        return newState
      })

      // 强制更新一下界面
      setTimeout(() => {
        forceUpdate({})
      }, 0)
    }

    const handleSaveAnswers = (label) => {
      if (!label) return

      const newAnswers = userAnswers[label] || []

      try {
        // 设置表单值 - 使用两种方式确保更新
        form.setFields([
          {
            name: [label, "similarAnswer"],
            value: newAnswers
          }
        ])

        // 使用setFieldsValue作为备份更新方式
        const currentValues = form.getFieldValue(label) || {}
        form.setFieldsValue({
          [label]: {
            ...currentValues,
            similarAnswer: newAnswers
          }
        })

        // 同步更新状态
        setSimilarAnswers((prev) => ({
          ...prev,
          [label]: newAnswers
        }))

        // 关闭弹窗
        setAnswerVisible(false)

        // 强制更新整个表单
        setTimeout(() => {
          forceUpdate({})
          message.success("相似答案已保存")
        }, 0)
      } catch (error) {
        console.error("保存答案出错:", error)
        message.error("保存相似答案失败")
      }
    }

    const handleAnswerEnterDown = (e, label) => {
      if (e.key === "Enter") {
        e.preventDefault()
        const newAnswers = Array.from(new Set([...(similarAnswers[label] || []), e.target.value]))
        handleSimilarAnswersChange(newAnswers, label)
      }
    }

    const handleSimilarAnswersChange = (newAnswers, label) => {
      form.setFieldsValue({
        [`${label}.similarAnswer`]: newAnswers
      })
      setSimilarAnswers((prev) => ({
        ...prev,
        [label]: newAnswers
      }))
    }

    // 在 useEffect 中添加标签切换时的处理
    useEffect(() => {
      if (activeKey) {
        const currentAnswers = form.getFieldValue([activeKey, "similarAnswer"]) || []
        setSimilarAnswers((prev) => ({
          ...prev,
          [activeKey]: currentAnswers
        }))
        setUserAnswers((prev) => ({
          ...prev,
          [activeKey]: currentAnswers
        }))
        setMagicAnswers((prev) => ({
          ...prev,
          [activeKey]: []
        }))
      }
    }, [activeKey, form])

    return (
      <Form
        form={form}
        // layout="inline"
        disabled={disabled}
        // labelCol={{
        //   xs: { span: 24 },
        //   sm: { span: 2 }
        // }}
        layout="horizontal"
      >
        <Row>
          <div className="text-[#000] font-[500] text-[16px] my-[10px]">基本信息</div>
          <Col span={24}>
            {/* <Form.Item label={`语言 - ${language}`}>
            <Switch checked={status} onChange={setStatus} />
          </Form.Item> */}

            <Form.Item
              label="是否上线"
              name={`status`}
              valuePropName="checked"
              initialValue={{
                faqAnswer: undefined
              }}
              // rules={[{ required: true, message: "请选择" }]}
            >
              <Switch
                size="small"
                checkedChildren="开"
                unCheckedChildren="关"
                disabled={!hasEditPermission}
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Row gutter={20}>
              <Col span={24}>
                <Form.Item
                  label="场景标签"
                  labelCol={{ span: 24 }}
                  wrapperCol={{ span: 24 }}
                  name={`sceneTags`}
                >
                  <Select
                    mode="tags"
                    style={{ width: "100%" }}
                    placeholder="请选择场景标签"
                    disabled={!hasEditPermission || (source === "call-logs" ? false : disabled)}
                  >
                    {sceneTags.map((tag) => (
                      <Option key={tag.code}>{tag.tagDesc}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              {/* <Col span={12}>
                <Form.Item
                  label="相似问题"
                  labelCol={{ span: 24 }}
                  wrapperCol={{ span: 24 }}
                  name={`faqSimilarityQuestions`}
                  rules={[{ required: false, message: "请选择或输入相似问题" }]}
                >
                  <Select
                    mode="tags"
                    style={{ width: "73%", verticalAlign: "middle" }}
                    placeholder="请选择或输入相似问题"
                    onChange={handleSimilarQuestionsChange}
                    value={similarQuestions}
                    onKeyDown={handleEnterDown}
                    disabled={!hasEditPermission || (source === "call-logs" ? false : disabled)}
                  >
                    {similarQuestions.map((question) => (
                      <Option key={question}>{question}</Option>
                    ))}
                  </Select>
                  <Tooltip title="生成相似问题">
                    <Button
                      disabled={
                        !form.getFieldValue(`faqQuestion`) ||
                        !hasEditPermission ||
                        (disabled && source !== "call-logs")
                      }
                      icon={<i className="iconfont icon-zhinengyouhua"></i>}
                      onClick={() => {
                        setVisible(true)
                        setUserQuestions(similarQuestions)
                      }}
                      style={{ marginLeft: 10 }}
                    >
                      一键生成
                    </Button>
                  </Tooltip>
                </Form.Item>
              </Col> */}
            </Row>
          </Col>

          <Col span={24}>
            <Form.Item
              label="标准问题"
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
              name={`faqQuestion`}
              rules={[{ required: true, message: "请输入标准问题" }]}
            >
              <TextArea
                placeholder="请输入标准问题"
                onChange={() => forceUpdate({})}
                disabled={!hasEditPermission}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              label="相似问题"
              name={`faqSimilarityQuestions`}
              rules={[{ required: false, message: "请选择或输入相似问题" }]}
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
            >
              <Select
                mode="tags"
                style={{ width: "80%", verticalAlign: "middle" }}
                placeholder="请选择或输入相似问题"
                onChange={handleSimilarQuestionsChange}
                value={similarQuestions}
                onKeyDown={handleEnterDown}
                disabled={!hasEditPermission || (source === "call-logs" ? false : disabled)}
              >
                {similarQuestions.map((question) => (
                  <Option key={question}>{question}</Option>
                ))}
              </Select>
              <Tooltip title="生成相似问题">
                <Button
                  disabled={
                    !form.getFieldValue(`faqQuestion`) ||
                    !hasEditPermission ||
                    (disabled && source !== "call-logs")
                  }
                  type="primary"
                  icon={<Iconfont type={"icon-moshubang"} />}
                  onClick={() => {
                    setVisible(true)
                    setUserQuestions(similarQuestions)
                  }}
                  style={{ marginTop: 0, marginLeft: 10 }}
                >
                  一键生成
                </Button>
              </Tooltip>
            </Form.Item>
          </Col>
          <Divider className="mt-1" />
          <Col span={24}>
            {!hasAnswerEditPermission && (
              <Alert
                className="mb-[10px]"
                message="您没有标签管理的权限，请联系管理员"
                type="error"
              />
            )}
            <Tabs
              type={disabled ? "card" : "editable-card"}
              activeKey={activeKey}
              hideAdd={true}
              size="small"
              onChange={setActiveKey}
              disabled={disabled}
              onEdit={(targetKey, action) => {
                if (action === "remove") {
                  if (tabList.length === 1) {
                    message.warning("至少要有一个标签来源！")
                    return
                  }
                  handleTabRemove(targetKey)
                }
              }}
            >
              {tabList.map((tab) => (
                <TabPane
                  tab={tab.name}
                  key={tab.key}
                  closable={tab.key !== "add"}
                  forceRender={true}
                  disabled={!hasAnswerEditPermission}
                >
                  {tab.content}
                </TabPane>
              ))}

              <TabPane
                tab="+ 新增标签"
                key="add"
                closeIcon={null}
                disabled={!hasAnswerEditPermission}
              >
                {isTagsLoaded && availableTags?.length > 0 ? (
                  <Select
                    value={selectedTag}
                    onSelect={handleSelect}
                    className="w-40"
                    placeholder="请选择标签"
                    disabled={!hasAnswerEditPermission}
                    allowClear
                    showSearch
                    filterOption={(input, option) =>
                      (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {availableTags.map((label) => {
                      const optionDisabled = tabList.map((item) => item.key).includes(label.code)
                      return (
                        <Option value={label.code} key={label.code} disabled={optionDisabled}>
                          {label.tagDesc}
                        </Option>
                      )
                    })}
                  </Select>
                ) : (
                  <div className="w-40 h-8 flex items-center justify-center">
                    {isTagsLoaded
                      ? "暂无可用标签"
                      : `加载中...${retryCount > 0 ? `(第${retryCount}次重试)` : ""}`}
                  </div>
                )}
              </TabPane>
            </Tabs>
          </Col>
        </Row>

        <Modal
          title="生成相似答案"
          open={answerVisible}
          onOk={() => handleSaveAnswers(currentEditLabel)}
          onCancel={() => setAnswerVisible(false)}
          width={720}
          destroyOnClose={false}
        >
          <Button
            type="primary"
            onClick={() => handleGenerateSimilarAnswers(currentEditLabel)}
            loading={answerLoading}
            disabled={!hasAnswerEditPermission}
          >
            一键生成
          </Button>
          {currentEditLabel && (
            <Row>
              <Col span={9}>
                <Select
                  mode="tags"
                  style={{ width: "100%", marginTop: 16 }}
                  placeholder="生成的相似答案"
                  onDeselect={(answer) => {
                    setMagicAnswers((prev) => ({
                      ...prev,
                      [currentEditLabel]: (prev[currentEditLabel] || []).filter((a) => a !== answer)
                    }))
                    // 强制更新UI
                    forceUpdate({})
                  }}
                  value={magicAnswers[currentEditLabel] || []}
                  disabled={!hasAnswerEditPermission}
                  notFoundContent={
                    magicAnswers[currentEditLabel]?.length === 0 ? "暂无相似答案" : null
                  }
                  dropdownStyle={{ display: "none" }}
                >
                  {(magicAnswers[currentEditLabel] || []).map((answer) => (
                    <Option key={answer} value={answer}>
                      {answer}
                    </Option>
                  ))}
                </Select>
                <div style={{ marginTop: 8 }}>
                  {magicAnswers[currentEditLabel]?.length > 0
                    ? `已生成${magicAnswers[currentEditLabel].length}个答案`
                    : ""}
                </div>
              </Col>
              <Col span={6} className="text-center">
                <Button
                  icon={<Iconfont type={"icon-youjiantou"} />}
                  onClick={() => handleAddAnswers(currentEditLabel)}
                  style={{ marginTop: 16 }}
                  disabled={
                    !hasAnswerEditPermission || magicAnswers[currentEditLabel]?.length === 0
                  }
                >
                  添加
                </Button>
              </Col>
              <Col span={9}>
                <Select
                  mode="tags"
                  style={{ width: "100%", marginTop: 16 }}
                  placeholder="用户的相似答案"
                  value={userAnswers[currentEditLabel] || []}
                  onChange={(value) => {
                    setUserAnswers((prev) => ({
                      ...prev,
                      [currentEditLabel]: value
                    }))
                    // 强制更新UI
                    forceUpdate({})
                  }}
                  disabled={!hasAnswerEditPermission}
                  notFoundContent={
                    userAnswers[currentEditLabel]?.length === 0 ? "暂无相似答案" : null
                  }
                  dropdownStyle={{ display: "none" }}
                >
                  {(userAnswers[currentEditLabel] || []).map((answer) => (
                    <Option key={answer} value={answer}>
                      {answer}
                    </Option>
                  ))}
                </Select>
                <div style={{ marginTop: 8 }}>
                  {userAnswers[currentEditLabel]?.length > 0
                    ? `已添加${userAnswers[currentEditLabel].length}个答案`
                    : ""}
                </div>
              </Col>
            </Row>
          )}
        </Modal>

        <Modal
          title="生成相似问题"
          open={visible}
          onOk={handleSaveQuestions}
          onCancel={() => setVisible(false)}
          width={720}
        >
          <Button
            type="primary"
            onClick={handleGenerateSimilarQuestions}
            loading={loading}
            disabled={!hasEditPermission || (source === "call-logs" ? false : disabled)}
          >
            一键生成
          </Button>
          <Row>
            <Col span={9}>
              <Select
                mode="tags"
                style={{ width: "100%", marginTop: 16 }}
                placeholder="生成的相似问题"
                onDeselect={(question) => {
                  setMagicQuestions((prevQuestions) => prevQuestions.filter((q) => q !== question))
                }}
                value={magicQuestions}
                disabled={!hasEditPermission || (source === "call-logs" ? false : disabled)}
              >
                {magicQuestions.map((question) => (
                  <Option key={question}>{question}</Option>
                ))}
              </Select>
            </Col>
            <Col span={6} className="text-center">
              <Button
                icon={<Iconfont type={"icon-youjiantou"} />}
                onClick={handleAddQuestions}
                style={{ marginTop: 16 }}
                disabled={!hasEditPermission || (source === "call-logs" ? false : disabled)}
              >
                添加
              </Button>
            </Col>
            <Col span={9}>
              <Select
                mode="tags"
                style={{ width: "100%", marginTop: 16 }}
                placeholder="用户的相似问题"
                value={userQuestions}
                onChange={setUserQuestions}
                disabled={!hasEditPermission || (source === "call-logs" ? false : disabled)}
              >
                {userQuestions.map((question) => (
                  <Option key={question}>{question}</Option>
                ))}
              </Select>
            </Col>
          </Row>
        </Modal>
      </Form>
    )
  }
)

export default LanguageForm
