import React, { useState, useEffect } from "react"
import { Modal, Form, Input, Button, Space, message, Select } from "antd"
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons"
import VariableTextArea from "../xflow/CustomFlowchartFormPanel/NodeComponent/components/VariableTextArea"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { DragIcon } from "@/components/FormIcon"
import {
  useSaveData,
  useVariableEnumeList,
  useIntelligentInput,
  useGetTestSetListByPage
} from "@/api/testSet"

const TestDataEditModal = ({
  visible,
  onCancel,
  onSuccess,
  currentRecord,
  botNo,
  setNo,
  isVoice
}) => {
  const [form] = Form.useForm()
  const [multiRoundRequests, setMultiRoundRequests] = useState([{ key: Date.now() }])
  const [smartInputLoading, setSmartInputLoading] = useState(false)
  const { mutate: saveData } = useSaveData()
  const { mutate: intelligentInput } = useIntelligentInput(botNo)
  const { data: enumeList = [], mutate: getEnumeList } = useVariableEnumeList()

  const { data: { list = [], totalCount } = {}, refetch } = useGetTestSetListByPage({
    botNo,
    pageNum: 1,
    pageSize: 10000
  })

  // 获取测试变量列表
  useEffect(() => {
    if (visible && botNo) {
      getEnumeList({ botNo })
    }
  }, [visible, botNo])

  // 初始化表单数据
  useEffect(() => {
    if (visible && currentRecord) {
      const {
        input,
        expectResult,
        output,
        summaryAssertExceptResult,
        requests: existingRequests = []
      } = currentRecord

      // 设置原响应内容（只读字段）
      form.setFieldsValue({
        output,
        summaryAssertExceptResult: summaryAssertExceptResult || ""
      })

      // 设置多轮请求
      if (existingRequests && existingRequests.length > 0) {
        // 新数据格式：有 requests 数组
        setMultiRoundRequests(
          existingRequests.map((item, index) => ({
            key: index,
            ...item
          }))
        )
        // 设置每个请求的表单值
        existingRequests.forEach((item, index) => {
          form.setFieldsValue({
            [`requestContent_${index}`]: item.input,
            [`expectResponse_${index}`]: item.clauseAssertExpectResult
          })
        })
      } else if (input) {
        // 存量数据格式：只有单个 input、expectResult 字段
        // 将存量数据转换为 requests 数组格式
        setMultiRoundRequests([{ key: 0 }])
        form.setFieldsValue({
          [`requestContent_0`]: input,
          [`expectResponse_0`]: expectResult || ""
        })
      } else {
        // 空数据
        setMultiRoundRequests([{ key: Date.now() }])
      }
    } else if (visible && !currentRecord) {
      form.resetFields()
      setMultiRoundRequests([{ key: Date.now() }])
    }
  }, [visible, currentRecord, form])

  const handleOk = async () => {
    try {
      await form.validateFields()

      // 收集请求列表数据
      const requests = multiRoundRequests
        .map((_, index) => {
          const input = form.getFieldValue(`requestContent_${index}`)
          const clauseAssertExpectResult = form.getFieldValue(`expectResponse_${index}`)
          return {
            input,
            clauseAssertExpectResult,
            order: index + 1
          }
        })
        .filter((item) => item.input) // 过滤掉空的请求

      // 获取总结断言期望响应内容
      const summaryAssertExceptResult = form.getFieldValue("summaryAssertExceptResult")

      // 只提交需要的字段
      const formData = {
        requests,
        summaryAssertExceptResult
      }

      // 如果是编辑模式，保留原有的 dataId 和 modifier
      if (currentRecord?.dataId) {
        formData.dataId = currentRecord.dataId
        formData.modifier = currentRecord.modifier
      }

      // 调用保存接口 - 使用与 dataList.jsx 中相同的 saveData 接口
      saveData(
        { botNo: botNo, setNo: isVoice ? form.getFieldValue("voiceSetNo") : setNo, ...formData },
        {
          onSuccess: (e) => {
            if (e.success) {
              // message.success("保存成功")
              onCancel() // 关闭弹窗
              onSuccess?.() // 调用成功回调刷新列表
            } else {
              message.error(e.message)
            }
          }
        }
      )
    } catch (error) {
      console.log("Validate Failed:", error)
    }
  }

  const addMultiRoundRequest = () => {
    const newKey = Date.now()
    setMultiRoundRequests([...multiRoundRequests, { key: newKey }])
  }

  const handleDragEnd = (result) => {
    if (!result.destination) return

    const newRequests = Array.from(multiRoundRequests)
    const [reorderedItem] = newRequests.splice(result.source.index, 1)
    newRequests.splice(result.destination.index, 0, reorderedItem)

    // 保存当前表单值
    const currentFormValues = {}
    multiRoundRequests.forEach((_, index) => {
      currentFormValues[`requestContent_${index}`] = form.getFieldValue(`requestContent_${index}`)
      currentFormValues[`expectResponse_${index}`] = form.getFieldValue(`expectResponse_${index}`)
    })

    // 更新请求列表
    setMultiRoundRequests(newRequests)

    // 在下一个事件循环中重新设置表单值，确保 React 已经更新了 DOM
    setTimeout(() => {
      const newFormValues = {}
      newRequests.forEach((item, newIndex) => {
        const oldIndex = multiRoundRequests.findIndex((oldItem) => oldItem.key === item.key)
        if (oldIndex !== -1) {
          newFormValues[`requestContent_${newIndex}`] =
            currentFormValues[`requestContent_${oldIndex}`]
          newFormValues[`expectResponse_${newIndex}`] =
            currentFormValues[`expectResponse_${oldIndex}`]
        }
      })
      form.setFieldsValue(newFormValues)
    }, 0)
  }

  const removeMultiRoundRequest = (key) => {
    if (multiRoundRequests.length <= 1) {
      message.warning("至少需要保留一个请求")
      return
    }
    setMultiRoundRequests(multiRoundRequests.filter((item) => item.key !== key))
  }

  const handleSmartInput = () => {
    const inputText = form.getFieldValue("input")
    if (!inputText || inputText.trim() === "") {
      message.warning("请输入要录入的文本内容")
      return
    }

    setSmartInputLoading(true)

    intelligentInput(
      { input: inputText },
      {
        onSuccess: (res) => {
          setSmartInputLoading(false)
          if (res.success && res.data?.requests?.length > 0) {
            // 清空智能录入文本框
            form.setFieldValue("input", "")

            // 更新多轮请求列表
            const newRequests = res.data.requests.map((item, index) => ({
              key: Date.now() + index,
              input: item.input,
              clauseAssertExpectResult: item.clauseAssertExpectResult,
              order: item.order
            }))

            setMultiRoundRequests(newRequests)

            // 设置每个请求的表单值
            newRequests.forEach((item, index) => {
              form.setFieldsValue({
                [`requestContent_${index}`]: item.input,
                [`expectResponse_${index}`]: item.clauseAssertExpectResult
              })
            })

            message.success("智能录入成功")
          } else {
            message.error(res.message || "智能录入失败")
          }
        },
        onError: (error) => {
          setSmartInputLoading(false)
          message.error(error.message || "智能录入失败")
        }
      }
    )
  }

  return (
    <Modal
      title={currentRecord?.dataId ? "编辑测试数据" : "新建测试数据"}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      width={800}
      destroyOnClose
    >
      <div className="p-3 pr-5">
        <Form form={form} labelCol={{ span: 3 }} wrapperCol={{ span: 21 }} className="mt-1">
          {isVoice && (
            <Form.Item
              required
              rules={[{ required: true, message: "请选择数据集" }]}
              layout="vertical"
              name="voiceSetNo"
              label="数据集"
            >
              <Select
                showSearch
                optionFilterProp="label"
                filterOption={(input, option) =>
                  option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
                options={list.map((item) => ({ label: item.setName, value: item.setNo }))}
                placeholder="请选择数据集"
              />
            </Form.Item>
          )}
          {/* 智能录入文本框 */}
          <Form.Item
            className="global-tips"
            name="input"
            label="智能录入"
            rules={[{ required: false, message: "请输入请求内容!" }]}
            layout="vertical"
          >
            <div className="relative">
              <VariableTextArea
                isModal={true}
                placeholder="复制粘贴文本到此处，将自动识别请求内容以及期望内容，例：
用户：你好，有什么事情？
坐席：您好，本次联系您..."
                disabled={false}
                value={undefined}
                onChange={undefined}
                onMouseBlur={undefined}
              />
              <Button
                type="primary"
                size="small"
                className="absolute bottom-2 right-2"
                onClick={handleSmartInput}
                loading={smartInputLoading}
              >
                录入
              </Button>
            </div>
          </Form.Item>

          {/* 多轮请求动态表单 */}
          <div className="mb-6">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="multiRoundRequests">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {multiRoundRequests.map((item, index) => (
                      <Draggable key={item.key} draggableId={String(item.key)} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="mb-4 p-3 py-1 bg-gray-100 rounded-[6px]"
                          >
                            <Space className="w-full" direction="vertical" size="middle">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div {...provided.dragHandleProps} className="mr-2 cursor-move">
                                    <DragIcon />
                                  </div>
                                  <span className="text-sm font-medium">
                                    请求
                                    <span className="inline-block h-[18px] w-[18px] -mt-[1px] ml-1 align-middle leading-[18px] text-center !text-[12px] rounded-full text-[#fff] bg-[#7F56D9]">
                                      {" "}
                                      {index + 1}
                                    </span>
                                  </span>
                                </div>
                                <Button
                                  type="text"
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={() => removeMultiRoundRequest(item.key)}
                                  disabled={multiRoundRequests.length <= 1}
                                />
                              </div>

                              <div className="-mt-2">
                                <Form.Item
                                  name={`requestContent_${index}`}
                                  label="请求内容"
                                  rules={[{ required: true, message: "请输入请求内容!" }]}
                                  labelCol={{ span: 3 }}
                                  wrapperCol={{ span: 21 }}
                                  help='输入 "$" 调用测试变量'
                                  layout="vertical"
                                >
                                  <VariableTextArea
                                    variables={
                                      enumeList?.length
                                        ? enumeList?.map((item) => ({
                                            variableName: item?.variableName,
                                            description: item?.description,
                                            valueExpression: item?.variableName
                                          }))
                                        : []
                                    }
                                    isModal={true}
                                    disabled={false}
                                    value={undefined}
                                    onChange={undefined}
                                    onMouseBlur={undefined}
                                    placeholder="请输入请求内容"
                                  />
                                </Form.Item>

                                <Form.Item
                                  name={`expectResponse_${index}`}
                                  label="期望响应内容"
                                  labelCol={{ span: 3 }}
                                  wrapperCol={{ span: 21 }}
                                  layout="vertical"
                                >
                                  <VariableTextArea
                                    variables={null}
                                    isModal={true}
                                    disabled={false}
                                    value={undefined}
                                    onChange={undefined}
                                    onMouseBlur={undefined}
                                    miniInputStyle={{
                                      height: "120px"
                                    }}
                                    placeholder="请输入期望响应内容"
                                  />
                                  {/* <Input.TextArea placeholder="请输入期望响应内容" rows={3} /> */}
                                </Form.Item>
                              </div>
                            </Space>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            <div>
              <Button type="link" onClick={addMultiRoundRequest} icon={<PlusOutlined />}>
                新增多轮请求
              </Button>
              <span className="text-[12px] text-gray-400">
                {" "}
                若存在多个请求，则按照顺序发起多轮会话，可拖动卡片排序
              </span>
            </div>
          </div>

          {/* 总结断言期望响应内容 */}
          <Form.Item layout="vertical" name="summaryAssertExceptResult" label="总结断言期望响应">
            <VariableTextArea
              variables={null}
              isModal={true}
              disabled={false}
              value={undefined}
              onChange={undefined}
              onMouseBlur={undefined}
              miniInputStyle={{
                height: "120px"
              }}
              placeholder="请输入总结断言期望响应内容"
            />
            {/* <Input.TextArea placeholder="请输入总结断言期望响应内容" rows={3} /> */}
          </Form.Item>

          <div className="text-[12px] text-gray-400 -mt-3 mb-2 ml-[90px]">
            {" "}
            用于总结断言场景效果对比
          </div>

          {/* 原响应内容（只读） */}
          <Form.Item layout="vertical" label="原响应内容" name="output">
            <Input.TextArea rows={3} disabled={true} placeholder="原响应内容" />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}

export default TestDataEditModal
