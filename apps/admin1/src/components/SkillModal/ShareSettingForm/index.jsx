import React, { useEffect, useState, useCallback, forwardRef, useImperativeHandle } from "react"
import { Form, Radio, Row, Col, Select, Input, Popconfirm, Button, message } from "antd"
import { PlusCircleOutlined, MinusCircleOutlined } from "@ant-design/icons"
import SharedToMarketSwitch from "../SharedToMarketSwitch"
import { useUpdateShareSettings } from "@/api/skill"
import { fetchShareSettings } from "@/api/skill/api"
import { fetchBotList } from "@/api/bot/api"
import { useBotList } from "@/store"
import { canReadOptions } from "../index"
import "./index.scss"
import { marketCode, marketObject, marketOptions } from "@/constants/market"

function ShareSettingForm(props, ref) {
  const { form, bizType, botNo, skillNo } = props
  const [shareMode, setShareMode] = useState(1)
  const [_, forceUpdate] = useState(null)
  const initialValues = {
    beSharedToMarket: false,
    shareDescription: "",
    canRead: true,
    shareScopes: [{}]
  }
  const { mutate: updateShareSettings } = useUpdateShareSettings()

  const changeBotList = useBotList((state) => state.changeBotList)
  const botList = useBotList((state) => state.botList)
  const botNoList = botList?.map((i) => i.botNo)
  const getBotList = async () => {
    const data = await fetchBotList()
    if (data && data.length) {
      changeBotList(data)
    }
  }

  const getShareSettings = useCallback(
    (options) => {
      const params = {
        botNo: options?.botNo || botNo,
        bizType,
        bizNo: options?.skillNo || skillNo
      }
      fetchShareSettings(params).then(({ data }) => {
        if (data) {
          form?.setFieldsValue({
            ...data
          })
          setShareMode(data.shareMode || 1)
        }
      })
    },
    [bizType, botNo, skillNo, form]
  )

  const changeShareMode = (val) => {
    setShareMode(val)
  }

  const checkBotNo = (rule, value, callback) => {
    if (!value) return callback()
    const shareScopes = form?.getFieldValue("shareScopes")
    if (!botNoList.includes(value)) {
      callback("该空间ID不存在")
    } else if (shareScopes?.filter((v) => v.botNo === value)?.length > 1) {
      callback("存在重复空间ID，请检查")
    } else {
      forceUpdate(1)
      callback()
    }
    // fetchBotList({ botNo: value })
    //   .then((data) => {
    //     if (data && data.length) {
    //       callback()
    //     } else {
    //       callback("该空间ID不存在")
    //     }
    //   })
    //   .catch((err) => {
    //     callback("接口异常，请重试")
    //   })
  }

  const onFinish = (values) => {
    let params = {
      botNo,
      bizType,
      bizNo: skillNo,
      beSharedToMarket: values.beSharedToMarket
    }
    if (values.beSharedToMarket) {
      params = {
        ...params,
        shareMode,
        shareDescription: values.shareDescription,
        canRead: values.canRead,
        shareScopes: values.shareScopes
      }
    }
    updateShareSettings(params, {
      onSuccess: (e) => {
        if (e.success) {
          // message.success("共享设置更新成功")
          // onSuccess()
        } else {
          // @ts-ignore
          message.error(e.message)
        }
      }
    })
  }

  const init = (params) => {
    form?.setFieldsValue(params || initialValues)
    getShareSettings(params)
    getBotList()
  }

  useImperativeHandle(ref, () => ({
    onFinish,
    init
  }))

  const beSharedToMarket = Form.useWatch("beSharedToMarket", form)

  const bizName = marketObject[bizType]
  const showShareScope = bizType !== marketCode.ROBOT
  const [spaceObject, setSpaceObject] = useState({})

  useEffect(() => {
    const shareScopes = form?.getFieldValue("shareScopes")
    if (shareScopes?.length) {
      shareScopes.forEach((item, index) => {
        const bot = botList.find((i) => i.botNo === item.botNo)
        if (bot) {
          setSpaceObject((pre) => {
            return {
              ...pre,
              [index]: bot.botName
            }
          })
        }
      })
    }
  }, [form, botList])

  const handleInputChange = (field, value) => {
    const bot = botList.find((item) => item.botNo === value)
    if (!bot) return
    setSpaceObject((pre) => {
      return {
        ...pre,
        [field]: bot.botName
      }
    })
  }

  return (
    <div className="share-setting-form">
      <Form.Item
        name="beSharedToMarket"
        label={`在灵犀市集中共享该${bizName}`}
        valuePropName="checked"
        labelCol={{ span: bizName === "AI Lab" || bizName === "Agent" ? 7 : 6 }}
        layout="horizontal"
        labelAlign="left"
      >
        <SharedToMarketSwitch form={form} />
      </Form.Item>
      {beSharedToMarket && (
        <>
          <div className="radio-item !pl-0">
            <Radio checked={shareMode === 1} onClick={() => changeShareMode(1)}>
              向所有空间共享
            </Radio>
            <span className="share-tips">所有空间都可在灵犀市集订阅该{bizName}</span>
          </div>

          {shareMode === 1 && showShareScope && (
            <>
              <Form.Item
                className="pr-24"
                name="canRead"
                label="共享范围"
                labelAlign="left"
                labelCol={{ span: 3 }}
                layout="horizontal"
              >
                <Select options={canReadOptions} />
              </Form.Item>
              <Form.Item
                className="mt-2"
                name="shareDescription"
                label={`${bizName}介绍`}
                // layout="horizontal"
                // labelCol={{ span: 4 }}
                // wrapperCol={{ span: 20 }}
              >
                <Input.TextArea
                  placeholder={`请简单描述${bizName}用途，用于在灵犀市集中集中展示`}
                />
              </Form.Item>
            </>
          )}

          <div className="radio-item !pl-0">
            <Radio checked={shareMode === 2} onClick={() => changeShareMode(2)}>
              向指定空间共享
            </Radio>
            <span className="share-tips">仅指定空间可在灵犀市集订阅该{bizName}</span>
          </div>

          {shareMode === 2 && (
            <>
              <Form.List name="shareScopes">
                {(fields, { add, remove }) => (
                  <div className="shared-list-wrap">
                    <Row gutter={6} className="header-row">
                      <Col span={11} className="header-col">
                        指定空间
                      </Col>
                      <Col span={1}></Col>
                      <Col span={11} className="header-col">
                        {showShareScope ? "共享范围" : "空间名称"}
                      </Col>
                      <Col span={1}></Col>
                    </Row>
                    <div className="shared-list-content">
                      {fields.map((field) => (
                        <Row key={field.key} gutter={6}>
                          <Col span={11}>
                            <Form.Item
                              name={[field.name, "botNo"]}
                              validateTrigger="onChange"
                              rules={[
                                { required: true, message: "请输入空间ID" },
                                { validator: checkBotNo }
                              ]}
                            >
                              <Input
                                placeholder="请输入空间ID"
                                onChange={(e) => handleInputChange([field.name], e.target.value)}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={1} className="center-col">
                            <span className="">-</span>
                          </Col>
                          {showShareScope ? (
                            <Col span={11}>
                              <Form.Item name={[field.name, "canRead"]} initialValue={true}>
                                <Select options={canReadOptions} />
                              </Form.Item>
                            </Col>
                          ) : (
                            <Col span={11}>{spaceObject[[field.name].join(",")]}</Col>
                          )}

                          <Col span={1} className="center-col">
                            <Popconfirm
                              title="【删除】后，对应API将停用"
                              okText="确定"
                              cancelText="取消"
                              onConfirm={() => remove(field.name)}
                              overlayInnerStyle={{ maxWidth: "240px" }}
                            >
                              {fields.length > 1 && <MinusCircleOutlined />}
                            </Popconfirm>
                          </Col>
                        </Row>
                      ))}
                    </div>
                    <Button icon={<PlusCircleOutlined />} type="link" onClick={() => add()}>
                      添加共享
                    </Button>
                  </div>
                )}
              </Form.List>
              <Form.Item
                className="mt-2"
                name="shareDescription"
                label={`${bizName}介绍`}
                // labelCol={{ span: 4 }}
                // wrapperCol={{ span: 21 }}
              >
                <Input.TextArea
                  placeholder={`请简单描述${bizName}用途，用于在灵犀市集中集中展示`}
                />
              </Form.Item>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default forwardRef(ShareSettingForm)
