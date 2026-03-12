import { fileUploadImg, mulUpload } from "@/api/knowledge/api"
import { useSaveAssociateStructures } from "@/api/knowledge"
import { uploadDocument } from "@/api/knowledgeDocument/api"
import { generateRandom64BitNumber } from "@/api/tools"
import { BotStatus, DEFAULTNAMESPACE } from "@/constants"
import { useCurrentKnowledgeAndCatalog } from "@/store"
import { Modal, message, notification } from "antd"
import { useState } from "react"
import { v4 as uuidv4 } from "uuid"

export const useKnowledgeHandlers = ({ api, state, selectedKnowledgeBase, selectedSpace }) => {
  const {
    createCataLog,
    updateCataLog,
    deleteCataLog,
    fetchFaqByfaqNo,
    saveFaq,
    generateSimilarityQuestion,
    changeStatus
  } = api

  const {
    tableData,
    setTableData,
    setShowEditModal,
    inputValue,
    setInputValue,
    editFlag,
    currentCatalog,
    setRowSelected,
    setEditDetailList,
    currentParentCatalogNo,
    setCurrentParentCatalogNo
  } = state

  const { mutate: saveAssociateStructures } = useSaveAssociateStructures()

  const { knowledgeAndCatalog, changeKnowledgeAndCatalog } = useCurrentKnowledgeAndCatalog()
  const selectedKeys = knowledgeAndCatalog.currentSelectedCatalog

  const handleSaveQuestions = async (
    d,
    event,
    faqNo = "",
    isAntron = false,
    targetCatalogNo = null,
    businessNo
  ) => {
    // 确定要使用的catalogNo：优先使用传入的targetCatalogNo，其次使用表单数据中的catalogNo，最后使用selectedKeys[0]
    const useCatalogNo = targetCatalogNo || d[0]?.values?.catalogNo || selectedKeys[0]

    const params = {
      faqs: d.map((item) => ({
        language: item.language,
        status: +item.values.status,
        faqQuestion: item.values.faqQuestion,
        faqSimilarityQuestions: item.values.faqSimilarityQuestions,
        faqAnswer: item.values.faqAnswer,
        fileIds: item.values.fileIds,
        faqAnswerWithTag: item.values.faqAnswerWithTag || [],
        sceneTags: item.values.sceneTags || []
      })),
      faqNo,
      businessNo
    }
    try {
      // 如果没有 faqNo 且不是 Antron，先获取 faqNo
      if (!faqNo && !isAntron) {
        const faqResult = await new Promise((resolve, reject) => {
          saveFaq(
            {
              knowledgeBaseNo: selectedKnowledgeBase,
              catalogNo: useCatalogNo,
              ...params
            },
            {
              onSuccess: (res) => {
                if (res.code !== "200") {
                  message.error(res.message)
                  reject(res.message)
                } else {
                  resolve(res)
                }
              }
            }
          )
        })
        if (faqResult.success === true) {
          params.faqNo = faqResult.data
        } else {
          throw new Error(faqResult.message)
        }
      }
      // 调用 saveAssociateStructures
      const associateResult = await new Promise((resolve) => {
        saveAssociateStructures(
          {
            knowledgeBaseNo: selectedKnowledgeBase,
            catalogNo: useCatalogNo,
            ...params
          },
          {
            onSuccess: (res) => resolve(res)
          }
        )
      })
      if (associateResult.success === false) {
        throw new Error(associateResult.message)
      }

      // 如果有 faqNo 且不是 Antron，调用 saveFaq
      if (faqNo && !isAntron) {
        await new Promise((resolve, reject) => {
          saveFaq(
            {
              knowledgeBaseNo: selectedKnowledgeBase,
              catalogNo: useCatalogNo,
              ...params
            },
            {
              onSuccess: (res) => {
                if (res.code !== "200") {
                  message.error(res.message)
                  reject(res.message)
                } else {
                  resolve(res)
                }
              }
            }
          )
        })
      }

      message.success("保存成功")
      event()
    } catch (error) {
      error.message &&
        notification.warning({
          message: "出错了",
          description: error.message || "保存过程中发生错误"
        })
    }
  }

  // 一键生成相似问题
  const handleGenerateSimilarQuestions = async (data, event) => {
    await generateSimilarityQuestion(
      {
        ...data,
        knowledgeBaseNo: selectedKnowledgeBase,
        catalogNo: selectedKeys[0],
        namespace: DEFAULTNAMESPACE
      },
      {
        onSuccess: (e) => {
          console.log(e)
          if (e.success) {
            event(e.data)
            message.success(e.message)
          } else {
            message.error(e.message)
          }
        }
      }
    )
  }

  const handleMenuClick = async (e, node) => {
    currentCatalog.current = node
    // 在这里实现不同的操作，比如编辑、删除
    console.log(e, node)
    if (e.key === "delete") {
      handleDeleteCategory()
    } else if (e.key === "edit" || e.key === "add") {
      if (e.key === "edit") {
        editFlag.current = true
        setInputValue(node.catalogName)
      } else {
        setInputValue("")
      }

      // 显示模态框，收集用户输入
      setShowEditModal(true)
    } else if (e.key === "addSameLevel") {
      editFlag.current = false
      setInputValue("")
      // 显示模态框，收集用户输入
      setShowEditModal(true)
      // 如果一级目录添加同级，则parent是识库No
      setCurrentParentCatalogNo(node.parentCatalogNo)
    } else if (e.key === "addSubLevel") {
      editFlag.current = false
      // 添加子级
      setCurrentParentCatalogNo(node.catalogNo)
      setInputValue("")
      setShowEditModal(true)
    }
  }

  const onSelect = (selectedKeys, info) => {
    if (Array.isArray(selectedKeys) && selectedKeys.length > 0) {
      changeKnowledgeAndCatalog({
        ...knowledgeAndCatalog,
        currentSelectedCatalog: selectedKeys
      })
      // setSelectedKeys(selectedKeys)
    }
  }

  const handleAddSubCategory = () => {
    editFlag.current = false
    setInputValue("")
  }

  const handleAddSameLevelCategory = async () => {
    await createCataLog(
      {
        parentCatalogNo: currentParentCatalogNo,
        catalogType: knowledgeAndCatalog?.currentSelectedKnowledgeBase.catalogTypeCode,
        catalogName: inputValue,
        knowledgeBaseNo: selectedKnowledgeBase
      },
      {
        onSuccess: (e) => {
          setShowEditModal(false)
          setInputValue("")
          if (e.success) {
            message.success(e.message)
          } else {
            message.error(e.message)
          }
        }
      }
    )
  }

  const handleEditSameLevelCategory = async () => {
    await updateCataLog(
      {
        catalogName: inputValue,
        knowledgeBaseNo: selectedKnowledgeBase,
        catalogNo: currentCatalog.current.key
      },
      {
        onSuccess: (e) => {
          setShowEditModal(false)
          setInputValue("")
          if (e.success) {
            message.success(e.message)
          } else {
            message.error(e.message)
          }
        }
      }
    )
  }

  const handleEditCategoryName = (node) => {
    editFlag.current = true
    console.log(node)
  }

  const handleDeleteCategory = (node) => {
    console.log(node)
    // 需要Antd的Modal 来二次确认
    Modal.confirm({
      title: "提示",
      content: "确定要删除该目录吗？",
      okText: "确认",
      cancelText: "取消",
      onOk: async () => {
        await deleteCataLog(
          {
            catalogNo: currentCatalog.current.key,
            knowledgeBaseNo: selectedKnowledgeBase
          },
          {
            onSuccess: (e) => {
              if (e.success) {
                message.success(e.message)
              } else {
                message.error(e.message)
              }
            }
          }
        )
      }
    })
  }

  const handleEditFaq = async (record) => {
    console.log(record)
    await fetchFaqByfaqNo(
      {
        knowledgeBaseNo: selectedKnowledgeBase,
        catalogNo: record.catalogNo || selectedKeys[0],
        faqNo: record.faqNo,
        namespace: DEFAULTNAMESPACE
      },
      {
        onSuccess: (e) => {
          e.sort((a, b) => {
            if (a.language === "CN") {
              return -1
            } else if (a.language === "HK") {
              return 1
            } else {
              return 0
            }
          })
          const editList = e.map((item, index) => ({
            ...item,
            images: item.fileIds?.map((v, i) => ({
              id: v,
              url: item.fileUrls[i],
              uid: uuidv4()
            }))
          }))
          console.log(editList)
          setEditDetailList(editList)
        }
      }
    )
  }

  const handleUpdateBotStatus = (id) => {
    // TODO: call the API here
    const updatedTableData = tableData.map((item) =>
      item.id === id
        ? {
            ...item,
            status: item.status === BotStatus.ONLINE ? BotStatus.OFFLINE : BotStatus.ONLINE
          }
        : item
    )
    setTableData(updatedTableData)
  }

  const handleModalOk = () => {
    console.log(inputValue, !inputValue || inputValue.length > 15)
    if (!inputValue || inputValue.length > 15) {
      message.error("目录名称不能为空且不能超过15个字符")
      return
    }
    console.log("提交")
    if (editFlag.current) {
      handleEditSameLevelCategory()
    } else {
      handleAddSameLevelCategory()
    }
  }

  // 批量上下线
  const handleChangeStatus = async (record, status) => {
    // record 是一个数组,所以要拼一个数组的faqs
    console.log(record)
    const params = {
      status,
      faqs: record.map((item) => ({
        faqNo: item.faqNo,
        language: item.language,
        catalogNo: item.catalogNo
      }))
    }
    await changeStatus(params, {
      onSuccess: (e) => {
        if (e.success) {
          message.success(e.message)
          setRowSelected([])
        } else {
          message.error(e.message)
        }
      }
    })
  }

  const handleUpload = (specificCatalogNo) => {
    return mulUpload({
      knowledgeBaseNo: selectedKnowledgeBase,
      catalogNo: specificCatalogNo || selectedKeys?.[0],
      namespace: DEFAULTNAMESPACE,
      key: generateRandom64BitNumber().toString()
    })
  }

  // 知识库拆分相关功能
  const imgUploadAction = (specificCatalogNo) => {
    return fileUploadImg({
      knowledgeBaseNo: selectedKnowledgeBase,
      catalogNo: specificCatalogNo || selectedKeys[0],
      namespace: DEFAULTNAMESPACE
    })
  }

  return {
    imgUploadAction,
    handleSaveQuestions,
    handleGenerateSimilarQuestions,
    handleMenuClick,
    onSelect,
    handleAddSubCategory,
    handleAddSameLevelCategory,
    handleEditCategoryName,
    handleDeleteCategory,
    handleEditFaq,
    handleChangeStatus,
    handleUpdateBotStatus,
    handleModalOk,
    handleUpload
  }
}

export default useKnowledgeHandlers
