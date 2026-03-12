import { useState, useEffect, useMemo } from "react"
import { ArrowRightOutlined } from "@ant-design/icons"
import { Button, Modal, Form, Input, Tabs, Radio, Space, message, Switch } from "antd"
import { PlusCircleOutlined, MinusCircleOutlined } from "@ant-design/icons"
import { usePlginsManage } from "../.."
import styles from "./index.module.scss"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { useQueryClient } from "@tanstack/react-query"
import { fetchBotList } from "@/api/bot/api"
import { useBotList } from "@/store"
import { usePluginEditBase, usePluginEditShare } from "@/api/pluginManage"
import { useStudioPublishData } from "@/hooks/useStudioPublishData"

const { TabPane } = Tabs
const formItemLayout = {
  labelCol: {
    xs: {
      span: 24
    },
    sm: {
      span: 4
    }
  },
  wrapperCol: {
    xs: {
      span: 24
    },
    sm: {
      span: 20
    }
  }
}

export const EditModal = () => {
  const [basisForm] = Form.useForm()
  const [shareForm] = Form.useForm()

  const [shareStatus, setShareStatus] = useState(false)
  const [shareArea, setShareArea] = useState(1)
  const [shareList, setShareList] = useState([{}])
  const [activeKey, setActiveKey] = useState("basisTab")
  const [extraMap, setExtraMap] = useState({})
  // 获取空间列表
  const changeBotList = useBotList((state) => state.changeBotList)
  const botNoList = useBotList((state) => state.botList)?.map((i) => i.botNo)
  const botList = useBotList((state) => state.botList)
  const { isPublishDisabled: isVersion } = useStudioPublishData()

  const getBotList = async () => {
    const data = await fetchBotList()
    if (data && data.length) {
      changeBotList(data)
    }
  }
  // 更新列表
  const queryClient = useQueryClient()
  const updateHome = () => {
    queryClient.invalidateQueries([QUERY_KEYS.PLUGIN_LIST])
    setVisible(false)
  }
  // 修改
  const { mutate: mutateEditBase } = usePluginEditBase(updateHome)
  const { mutate: mutateEditShare } = usePluginEditShare(updateHome)

  const { botNo, visible, currentRecord, setVisible } = usePlginsManage()
  const handleOk = () => {
    if (activeKey === "basisTab") {
      handleSaveBasis()
    } else {
      handleSaveShare()
    }
    // setVisible(false);
  }
  const handleSaveBasis = () => {
    basisForm
      .validateFields()
      .then((values) => {
        console.log("Received values of form:", values)
        const params = {
          botNo: botNo,
          id: currentRecord.id,
          pluginNo: currentRecord.pluginNo,
          extraInfo: currentRecord.extraInfo,
          name: values.name,
          description: values.description
        }
        mutateEditBase(params)
      })
      .catch((info) => {
        console.log("Failed:", info)
      })
  }
  const handleSaveShare = () => {
    shareForm
      .validateFields()
      .then((values) => {
        console.log("Received values of form:", values)
        const params = {
          botNo: botNo,
          id: currentRecord.id,
          pluginNo: currentRecord.pluginNo,
          share: values.share ? 1 : 0,
          shareMode: values.shareMode,
          shareWorkspaces: values.shareWorkspaces,
          skillDescription: values.skillDescription
        }
        mutateEditShare(params)
      })
      .catch((info) => {
        console.log("Failed:", info)
      })
  }
  const handleCancel = () => {
    setVisible(false)
  }
  const onChangeTabs = (key) => {
    setActiveKey(key)
  }
  const onChangeRadio = (e) => {
    setShareArea(e.target.value)
  }
  const handleChangeShare = (checked) => {
    setShareStatus(checked)
  }
  const handleAddShareList = () => {
    const newList = [].concat(shareList, {})
    setShareList(newList)
  }
  const handleDeleteShareList = (index) => {
    if (shareList.length < 2) {
      message.warning("指定空间不能少于一个")
      return
    }
    const newList = shareList.filter((r, i) => i !== index)
    setShareList(newList)
  }

  const setWorkspacesExtraMap = (data) => {
    let newExtraMap = {}
    data.forEach((value, index) => {
      const botInfo = botList.find((r) => r.botNo === value)
      if (botInfo) {
        newExtraMap[index] = `空间名称：${botInfo.botName}`
      } else {
        newExtraMap[index] = ""
      }
    })
    setExtraMap(newExtraMap)
  }

  const handleChangeWorkspaces = (e, field) => {
    const newExtraMap = Object.assign({}, extraMap)
    const value = e.target.value
    const botInfo = botList.find((r) => r.botNo === value)
    if (botInfo) {
      newExtraMap[field.key] = `空间名称：${botInfo.botName}`
      setExtraMap(newExtraMap)
    } else {
      newExtraMap[field.key] = ""
      setExtraMap(newExtraMap)
    }
  }

  const checkBotNo = (rule, value, callback) => {
    if (!value) return callback()
    const shareWorkspaces = shareForm?.getFieldValue("shareWorkspaces")
    if (!botNoList.includes(value)) {
      callback("该空间ID不存在")
    } else if (shareWorkspaces?.filter((v) => v === value)?.length > 1) {
      callback("存在重复空间ID，请检查")
    } else {
      callback()
    }
  }

  const initialValues = useMemo(() => {
    return currentRecord || {}
  }, [currentRecord])
  // const  initialValues = currentRecord || {};
  useEffect(() => {
    basisForm.setFieldsValue(initialValues)
    const shareInitialValues = {
      ...initialValues,
      share: initialValues.share === 1, // switch值为 true\false
      shareMode: initialValues.shareMode === 2 ? 2 : 1 //后端默认值为0
    }
    if (initialValues.share === 1) {
      setShareStatus(true)
    } else {
      setShareStatus(false)
    }
    if (initialValues.shareMode === 2) {
      setShareArea(2)
      setWorkspacesExtraMap(initialValues.shareWorkspaces)
    } else {
      setShareArea(1)
    }
    shareForm.setFieldsValue(shareInitialValues)
  }, [visible, initialValues])

  useEffect(() => {
    getBotList()
  }, [])

  return (
    <div>
      <Modal
        title={"工具基础设置"}
        open={visible}
        destroyOnClose={true}
        width={800}
        onOk={handleOk}
        onCancel={handleCancel}
        closable={false}
        okButtonProps={{ disabled: isVersion }}
      >
        <Tabs
          className="addbot-tabs"
          // activeKey={activeTab}
          type="card"
          onChange={onChangeTabs}
        >
          <TabPane tab="基本信息" key={"basisTab"} forceRender={true} className="tabpane-wrapper">
            <Form
              form={basisForm}
              initialValues={initialValues}
              layout={"vertical"}
              disabled={isVersion}
              labelCol={{
                span: 3
              }}
              wrapperCol={{
                span: 24
              }}
            >
              <Form.Item
                name="name"
                label="工具名称"
                rules={[{ required: true, message: "请输入工具名称" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="description"
                label="描述"
                rules={[{ required: false, message: "请输入描述" }]}
              >
                <Input.TextArea maxLength={200} placeholder="请输入备注，200字以内" />
              </Form.Item>
            </Form>
          </TabPane>
          <TabPane
            tab="共享设置"
            key={"shareTab"}
            forceRender={true}
            className={styles["tabpane-wrapper"]}
          >
            <Form
              form={shareForm}
              disabled={isVersion}
              initialValues={initialValues}
              labelCol={{
                span: 3
              }}
              wrapperCol={{
                span: 16
              }}
            >
              <div className={styles["share-line"]}>
                <span className={styles["share-line-label"]}>在灵犀市集中共享该工具</span>
                <Form.Item name="share" label="" rules={[{ required: true, message: "请选择" }]}>
                  <Switch onChange={handleChangeShare} />
                </Form.Item>
              </div>
              {shareStatus && (
                <div>
                  <Form.Item
                    name="shareMode"
                    label=""
                    rules={[{ required: true, message: "请选择" }]}
                  >
                    <Radio.Group onChange={onChangeRadio}>
                      <Space direction="vertical">
                        <Radio value={1}>
                          <span>向所有空间共享</span>
                          <span className={styles["desc"]}>所有空间都可在灵犀市集订阅该工具</span>
                        </Radio>
                        <Radio value={2}>
                          <span>向指定空间共享</span>
                          <span className={styles["desc"]}>仅指定空间可在灵犀市集订阅该工具</span>
                        </Radio>
                      </Space>
                    </Radio.Group>
                  </Form.Item>
                  {shareArea === 2 && (
                    <div className={styles["workspace"]}>
                      {/* className={styles["workspace-title"]} */}
                      <div className="mb-2">指定空间</div>
                      <Form.List
                        name="shareWorkspaces"
                        rules={[
                          {
                            validator: async (_, names) => {
                              if (!names || names.length < 1) {
                                return Promise.reject(new Error("请至少添加一个空间"))
                              }
                            }
                          }
                        ]}
                      >
                        {(fields, { add, remove }, { errors }) => {
                          return (
                            <>
                              {fields.map((field, index) => (
                                <Form.Item
                                  {...formItemLayout}
                                  label={""}
                                  required={false}
                                  key={field.key}
                                >
                                  <Form.Item
                                    {...field}
                                    validateTrigger={["onChange", "onBlur"]}
                                    rules={[
                                      {
                                        required: true,
                                        message: "请输入空间ID"
                                      },
                                      { validator: checkBotNo }
                                    ]}
                                    noStyle
                                    // extra={extraMap[field.key]}
                                    extra={<span>12313131</span>}
                                    // help={'extraMap[field.key]'}
                                  >
                                    <Input
                                      placeholder="请输入"
                                      style={{
                                        width: "50%"
                                      }}
                                      onChange={(e) => {
                                        handleChangeWorkspaces(e, field)
                                      }}
                                    />
                                  </Form.Item>
                                  <>
                                    <MinusCircleOutlined
                                      className={styles["dynamic-delete-button"]}
                                      onClick={() => remove(field.name)}
                                    />
                                    <span>{extraMap[field.key]}</span>
                                  </>
                                </Form.Item>
                              ))}
                              <Form.Item>
                                <Button
                                  type="link"
                                  onClick={() => add()}
                                  icon={<PlusCircleOutlined />}
                                  className={styles["dynamic-add-button"]}
                                >
                                  添加共享
                                </Button>
                                <Form.ErrorList errors={errors} />
                              </Form.Item>
                            </>
                          )
                        }}
                      </Form.List>
                    </div>
                  )}
                  <Form.Item
                    name="skillDescription"
                    label="工作流介绍"
                    rules={[{ required: false, message: "请输入描述" }]}
                    labelAlign="left"
                  >
                    <Input.TextArea maxLength={200} placeholder="请输入备注，200字以内" />
                  </Form.Item>
                </div>
              )}
            </Form>
          </TabPane>
        </Tabs>
      </Modal>
    </div>
  )
}
