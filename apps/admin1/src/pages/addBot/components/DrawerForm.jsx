import React, { useCallback, useRef } from "react"
import { Drawer, Button, Tabs, Select, Row, Col, Form, Input } from "antd"
import LanguageForm from "./LanguageForm"
import { useState } from "react"
import { languages } from "@/constants"
import { useEffect } from "react"
import { useAuthResources } from "@/store"
import { Alert } from "antd"

import { PlusOutlined } from "@ant-design/icons"

const { TabPane } = Tabs
const { Option } = Select

const DrawerForm = ({
  visible,
  currentRecord,
  onClose,
  handleGenerateSimilarQuestions,
  handleSaveQuestions,
  knowledgeBaseNo,
  catalogNo,
  editDetailList = [],
  currentSelectedKnowledgeBase = [],
  imgUploadAction,
  disabled,
  isAntron,
  source = null,
  viewAvAlible
}) => {
  const [form] = Form.useForm()
  const [activeKey, setActiveKey] = useState("add")
  const [tabList, setTabList] = useState([])
  const [selectedLanguage, setSelectedLanguage] = useState(null)

  const [availableLanguages, setAvailableLanguages] = useState(languages)
  const formRefs = useRef(new Map())

  const resourceCodeList = useAuthResources((state) => state.resourceCodeList)
  const hasEditPermission = resourceCodeList.includes("faqQuestionEdit")
  const hasAnswerEditPermission = resourceCodeList.includes("faqAnswerEdit")

  // 当editDetailList有值时，说明是编辑，需要初始化tabList
  // 应该放在useEffect里

  useEffect(() => {
    if (currentRecord) {
      form.setFieldsValue(currentRecord)
    }
  }, [currentRecord, form])

  useEffect(() => {
    if (editDetailList.length > 0) {
      const newTabList = editDetailList.map((item) => {
        const formRef = React.createRef()
        formRefs.current.set(item.language, formRef)
        return {
          title: item.language,
          content: (
            <LanguageForm
              // @ts-ignore
              imgUploadAction={imgUploadAction}
              ref={formRef}
              disabled={disabled || !viewAvAlible}
              isAntron={isAntron}
              // @ts-ignore
              language={item.language}
              knowledgeBaseNo={knowledgeBaseNo}
              handleGenerateSimilarQuestions={handleGenerateSimilarQuestions}
              currentSelectedKnowledgeBase={currentSelectedKnowledgeBase}
              editDetail={item}
              source={source}
              hasEditPermission={hasEditPermission}
              hasAnswerEditPermission={hasAnswerEditPermission}
            />
          ),
          key: item.language,
          name: languages.find((lang) => lang.id === item.language).name
        }
      })

      // availableLanguages相关枚举也需要变更
      const availableLanguages = languages.filter(
        (lang) => !editDetailList.find((item) => item.language === lang.id)
      )
      setAvailableLanguages(availableLanguages)
      setTabList(newTabList)
      setActiveKey(currentRecord?.language)
    } else {
      setTabList([])
      setActiveKey("add")
      setAvailableLanguages(languages)
    }
  }, [editDetailList, currentRecord, source])

  const addTab = useCallback(
    (language, item) => {
      const formRef = React.createRef()
      formRefs.current.set(language, formRef)
      const newTab = {
        title: language,
        content: (
          <LanguageForm
            // @ts-ignore
            imgUploadAction={imgUploadAction}
            currentSelectedKnowledgeBase={currentSelectedKnowledgeBase}
            ref={formRef}
            // @ts-ignore
            language={language}
            handleGenerateSimilarQuestions={handleGenerateSimilarQuestions}
            knowledgeBaseNo={knowledgeBaseNo}
            editDetail={{ ...item, catalogNo: catalogNo }}
            hasEditPermission={hasEditPermission}
            hasAnswerEditPermission={hasAnswerEditPermission}
          />
        ),
        key: language,
        name: languages.find((lang) => lang.id === language).name
      }

      setTabList((prevTabList) => [...prevTabList, newTab])
      setActiveKey(language)
      setAvailableLanguages(availableLanguages.filter((lang) => lang.id !== language))
    },
    [
      availableLanguages,
      handleGenerateSimilarQuestions,
      currentSelectedKnowledgeBase,
      hasEditPermission,
      hasAnswerEditPermission
    ]
  )

  const handleSelect = (value) => {
    setSelectedLanguage(value) // Update selectedLanguage when selected
    addTab(value)
    setSelectedLanguage(null) // Reset selectedLanguage after tab is added
  }

  const handleSave = () => {
    let hasError = false
    let firstTabWithError = null

    const validations = Array.from(formRefs.current.entries()).map(([key, ref]) => {
      if (ref.current) {
        return ref.current.validate().catch((error) => {
          if (!hasError) {
            hasError = true
            firstTabWithError = key
          }
        })
      } else {
        return Promise.resolve()
      }
    })

    // @ts-ignore
    Promise.allSettled(validations).then(() => {
      if (hasError) {
        setActiveKey(firstTabWithError)
      } else {
        const allValues = Array.from(formRefs.current.entries())
          .filter(([key, ref]) => ref.current)
          .map(([key, ref]) => ({
            language: key,
            values: {
              ...ref.current.getValues(),
              fileIds: ref.current.getValues()?.images?.map((item) => item.id)
            }
          }))

        // 确定要使用的catalogNo：编辑时使用editDetailList中的catalogNo，新增时使用传入的catalogNo
        const targetCatalogNo = editDetailList.length > 0 ? editDetailList[0]?.catalogNo : catalogNo
        const values = form.getFieldsValue()
        handleSaveQuestions(
          allValues,
          onClose,
          editDetailList[0]?.faqNo,
          isAntron,
          targetCatalogNo,
          values.businessNo
        )
      }
    })
  }

  const handleTabRemove = (targetKey) => {
    setTabList((prevTabList) => {
      const newTabList = prevTabList.filter((tab) => tab.key !== targetKey)
      if (targetKey === activeKey) {
        setActiveKey(newTabList[0]?.key || "add")
      }
      return newTabList
    })

    setAvailableLanguages([...availableLanguages, languages.find((lang) => lang.id === targetKey)])
  }

  return (
    <Drawer
      title={editDetailList.length > 0 ? "编辑知识" : "新增知识"}
      width={1200}
      onClose={onClose}
      open={visible}
      bodyStyle={{ paddingBottom: 40 }}
      footer={
        <Row justify="end">
          <Col>
            <Button
              onClick={handleSave}
              type="primary"
              disabled={
                (!hasEditPermission && !hasAnswerEditPermission) ||
                (disabled && source !== "call-logs")
              }
            >
              保存
              {!hasEditPermission && !hasAnswerEditPermission && (
                <span style={{ marginLeft: 8, fontSize: 12, color: "#999" }}>(无编辑权限)</span>
              )}
            </Button>
          </Col>
        </Row>
      }
    >
      {!hasEditPermission && (
        <Alert className="mb-[10px]" message="您没有当前模块的权限，请联系管理员" type="error" />
      )}
      <Form form={form}>
        <Form.Item label="业务ID" name={`businessNo`} tooltip="业务ID用于知识数据溯源">
          <Input placeholder="请输入业务ID" className="w-[35%]" />
        </Form.Item>
      </Form>
      <Tabs
        type={disabled ? "card" : "editable-card"} //{disabled ? "card" : "editable-card"}
        activeKey={activeKey}
        hideAdd={true}
        onChange={setActiveKey}
        size="small"
        onEdit={(targetKey, action) => {
          if (action === "remove") {
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
            disabled={!viewAvAlible || !hasEditPermission}
          >
            {tab.content}
          </TabPane>
        ))}
        {availableLanguages.length > 0 && hasEditPermission && (
          <TabPane
            tab={
              <div className="text-[#475467] hover:text-[#7f56d9]">
                <PlusOutlined />
                <span className="-ml-[3px]">新增</span>
              </div>
            }
            key="add"
            closeIcon={null}
            disabled={disabled || !viewAvAlible}
          >
            <Select
              value={selectedLanguage}
              onSelect={handleSelect}
              className="w-40"
              placeholder="请选择语言"
            >
              {availableLanguages.map((lang) => (
                <Option value={lang.id} key={lang.id}>
                  {lang.name}
                </Option>
              ))}
            </Select>
          </TabPane>
        )}
      </Tabs>
    </Drawer>
  )
}

export default DrawerForm
