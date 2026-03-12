// @description 意图操作页
/*
 * @Author: hantao
 * @Date: 2024-03-21 11:54:47
 * @Descripttion:
 * @LastEditors:  wb_hantao@zhongan.com
 * @LastEditTime: 2024-04-026 16:40:57
 * @FilePath: /za-aigc-platform-admin-static/src/pages/knowledgeProject/knowledgeExtractor/components/drawerIntention/index.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
import { PlusOutlined, UserOutlined } from "@ant-design/icons"
import {
  Button,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Cascader,
  Table,
  message,
  Empty,
  Pagination,
  Radio,
  Tag,
  Card,
  Tooltip
} from "antd"
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react"
import {
  useFetchBatchExtractorDetail,
  useFetchSaveIntention,
  useFetchIntentionReferencelistByPage,
  useFetchIntentionreFerenceGetVoiceUrl
} from "@/api/InstanceBatchExtractorDetail"
import { useFetchListByParentAndType } from "@/api/knowledgeManage"
import CopyToClipboard from "react-copy-to-clipboard"
import { findKnowledgeLayerNodes } from "@/pages/knowledgeProject/utils"
import styles from "./index.module.scss"

const { TextArea } = Input

// const radioEnum={
//   ACCEPT:'采纳',
// }
// @props:{type:'show'|'edit'} intentionId:string

const Intention = (props, ref) => {
  const [form] = Form.useForm()
  //@params ACCEPT=‘采纳’ REJECT=‘未采纳‘ INIT=’初始化‘ REJECT=弃用
  const [statusIntention, setStatusIntention] = useState("INIT")
  //保存loading
  const [saveLoading, setSaveLoading] = useState(false)
  // 查看会话记录
  const [recordData, setRecordData] = useState([])
  //录音记录
  const [voice, setVoice] = useState("")
  const [sessionId, setSessionId] = useState("")
  // 批次详情查询
  const { data: batchExtractorDetail } = useFetchBatchExtractorDetail(props.intentionId)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [pagination, setPagination] = useState({ pageSize: 1000, pageNum: 1 })
  // 命中时间
  const [hitTime, setHitTime] = useState("")
  const { data: messageList } = useFetchIntentionReferencelistByPage({
    ...pagination,
    intentionId: props.intentionId
  })

  // 意图层级
  const { data: listByParentAndType } = useFetchListByParentAndType({
    type: "INTENTION_LEVEL",
    parentType: "BUSINESS_SCENE",
    parentId: batchExtractorDetail?.businessSceneId,
    botNo: props.botNo
  })

  // batchExtractorDetail结构调整
  const data = useMemo(() => {
    const newBatchExtractorDetail = { ...(batchExtractorDetail || {}) }
    if (newBatchExtractorDetail?.layer && listByParentAndType?.length) {
      newBatchExtractorDetail.layer = findKnowledgeLayerNodes(
        listByParentAndType,
        newBatchExtractorDetail.layer,
        { isToId: true }
      )
    }
    return newBatchExtractorDetail
  }, [batchExtractorDetail, listByParentAndType])

  //保存
  const { mutate: saveIntention } = useFetchSaveIntention()
  const { mutate: getVocieUrl } = useFetchIntentionreFerenceGetVoiceUrl()
  useImperativeHandle(ref, () => ({
    save: () => {
      form.validateFields().then((res) => {
        setSaveLoading(true)
        // 采纳话术是否为空
        let isContent = false
        // 采纳状态集合
        let isStatusArr = []
        res?.suggestDialogueList?.forEach((item) => {
          if (!item.text) {
            isContent = true
          }
          isStatusArr.push(item.status)
        })
        // ”意图“为采纳且“建议话术”的”话术内容“存在空值，
        if (statusIntention === "ACCEPT" && isContent) {
          setSaveLoading(false)
          Modal.confirm({
            content: "采纳建议话术值不正确，请重新输入！",
            footer: (params) => {
              //只要确认按钮
              // @ts-ignore
              return params?.props?.children[1]
            }
          })
          return
        }
        // 意图“为采纳且“建议话术”的”采纳状态“均=“不采纳”
        if (statusIntention === "ACCEPT" && isStatusArr.every((item) => item === "REJECT")) {
          setSaveLoading(false)
          Modal.confirm({
            content: "无采纳的建议话术值，请重新输入!",
            footer: (params) => {
              //只要确认按钮
              // @ts-ignore
              return params?.props?.children[1]
            }
          })
          return
        }
        const params = {
          ...res,
          layer: res?.layer?.[res?.layer?.length - 1],
          status: statusIntention,
          id: data.id,
          botNo: props.botNo
        }
        saveIntention(params, {
          onSuccess: (e) => {
            if (e) {
              message.success("保存成功！")
              setSaveLoading(false)
            }
          },
          onError: () => {
            setSaveLoading(false)
          }
        })
        toParent(false)
        setSaveLoading(false)
      })
    }
  }))
  useEffect(() => {
    if (data) {
      form.setFieldsValue({ ...data })
      setStatusIntention(data?.status)
    }
  }, [data])

  useEffect(() => {
    handleData(0)
  }, [messageList])

  useEffect(() => {
    if (recordData.length === 0) return
    const child = document.getElementById("intentionLocaltion")
    // 滚动到意图
    if (child) {
      document.getElementById("cardbox").scrollTo({
        top: child.offsetTop - 200,
        behavior: "smooth"
      })
    }
  }, [recordData])

  // 点击上下条处理聊天数据
  const handleData = (index) => {
    console.log(messageList)
    if (!messageList || messageList?.records.length === 0) {
      return
    }
    // 第几条
    const record = messageList.records[index]
    // 设置会话id
    setSessionId(record.bizId)
    const v = record.originCorpus
    const { beginTime: recordBeginTime, endTime: recordEndTime } = record
    setHitTime(recordBeginTime)
    // 聊天记录
    const list = v.sessionMessageList || []
    const newarr = []
    list.forEach((item) => {
      const { beginTime } = item
      // 行记录的开始时间和结束时间去比对 聊天记录每条的开始时间，如果在这个范围内 给一个标记视为一个意图对话
      if (
        dateToStr(recordBeginTime) <= dateToStr(beginTime) &&
        dateToStr(recordEndTime) >= dateToStr(beginTime)
      ) {
        item.isIntention = true
        newarr.push(item)
      } else {
        newarr.push(item)
      }
    })
    // 如果isIntention为true，则把聊天总结成一个意图
    const result = newarr.reduce((acc, item) => {
      if (item.isIntention) {
        const foundItem = acc.find((el) => el.IntentionAll)
        if (foundItem) {
          foundItem.IntentionAll.push(item)
        } else {
          acc.push({ IntentionAll: [item] })
        }
      } else {
        acc.push(item)
      }
      return acc
    }, [])
    setRecordData(result)
    getVocieUrl(
      { bizId: record.bizId },
      {
        onSuccess: (v) => {
          setVoice(v)
        }
      }
    )
  }
  const toParent = (v) => {
    props.getChildChange(v)
  }
  // 替换意图 params:string 替换类型
  const replaceIntention = (v) => {
    toParent(true)
    if (statusIntention === "REJECT" || props.type === "show") return
    form.setFieldValue("name", v)
  }
  // 意图是否采纳
  const changeStatus = (v) => {
    toParent(true)
    setStatusIntention(v)
    // 弃用所有的采纳状态改成不采纳
    if (v === "REJECT") {
      const dataSource = form.getFieldValue("suggestDialogueList")
      dataSource.forEach((item) => {
        item.status = "REJECT"
      })
      form.setFieldValue("suggestDialogueList", dataSource)
    }
  }
  // 保存表单
  const saveFn = () => {
    form.validateFields().then((res) => {
      setSaveLoading(true)
      // 采纳话术是否为空
      let isContent = false
      // 采纳状态集合
      let isStatusArr = []
      res?.suggestDialogueList?.forEach((item) => {
        //有空值，并且status不等于reject
        if (!item.text) {
          isContent = true
        }
        isStatusArr.push(item.status)
      })
      // ”意图“为采纳且“建议话术”的”话术内容“存在空值，
      if (statusIntention === "ACCEPT" && isContent) {
        setSaveLoading(false)
        Modal.confirm({
          content: "采纳建议话术值不正确，请重新输入！",
          footer: (params) => {
            //只要确认按钮
            // @ts-ignore
            return params?.props?.children[1]
          }
        })
        return
      }
      // 意图“为采纳且“建议话术”的”采纳状态“均=“不采纳”
      if (statusIntention === "ACCEPT" && isStatusArr.every((item) => item === "REJECT")) {
        setSaveLoading(false)
        Modal.confirm({
          content: "无采纳的建议话术值，请重新输入!",
          footer: (params) => {
            //只要确认按钮
            // @ts-ignore
            return params?.props?.children[1]
          }
        })
        return
      }
      const params = {
        ...res,
        layer: res?.layer?.[res?.layer?.length - 1],
        status: statusIntention,
        id: data.id
      }
      saveIntention(params, {
        onSuccess: (e) => {
          if (e) {
            message.success("保存成功！")
            setSaveLoading(false)
          }
        },
        onError: () => {
          setSaveLoading(false)
        }
      })
      toParent(false)
      setSaveLoading(false)
    })
  }
  //转时间戳
  const dateToStr = (v) => {
    return new Date(v).getTime()
  }
  const statusEnum = {
    INIT: "待确认",
    ACCEPT: "采纳",
    REJECT: "不采纳"
  }

  const editColumns = [
    {
      title: "话术内容",
      dataIndex: "text",
      render(_, field) {
        // 获得每一行的数据
        const name = form.getFieldValue(["suggestDialogueList", field.name, "text"])
        const status = form.getFieldValue(["suggestDialogueList", field.name, "status"])
        return (
          <Form.Item noStyle shouldUpdate>
            {({ getFieldValue }) => {
              const disabled =
                statusIntention === "REJECT" || statusIntention == "INIT" || status === "REJECT"
              const value = getFieldValue("suggestDialogueList")?.[field.name]?.text
              return (
                <Tooltip title={props.type === "show" || disabled ? value : ""}>
                  <div>
                    <Form.Item name={[field?.name, "text"]} noStyle>
                      {props.type !== "show" ? (
                        <Input.TextArea
                          className={styles.textAreaBox}
                          autoSize={{ minRows: 1, maxRows: 4 }}
                          allowClear
                          placeholder="请输入"
                          disabled={disabled}
                        />
                      ) : (
                        name
                      )}
                    </Form.Item>
                  </div>
                </Tooltip>
              )
            }}
          </Form.Item>
        )
      }
    },
    {
      title: "操作",
      width: "28%",
      dataIndex: "action",
      fixed: "right",
      align: "center",
      render(_, field) {
        const status = form.getFieldValue(["suggestDialogueList", field.name, "status"])
        const name = form.getFieldValue(["suggestDialogueList", field.name, "text"])
        // 更改行记录采纳状态
        function changeIsAccept(v) {
          toParent(true)
          form.setFieldValue(["suggestDialogueList", field.name, "status"], v)
        }
        return (
          <Radio.Group
            onChange={(e) => {
              changeIsAccept(e.target.value)
            }}
            value={status}
            disabled={
              statusIntention === "INIT" ||
              statusIntention === "REJECT" ||
              props.type === "show" ||
              !name
            }
          >
            <Radio value="ACCEPT">采纳</Radio>
            <Radio value="REJECT">不采纳</Radio>
          </Radio.Group>
        )
      }
    }
  ]
  // const referenceColumns = [
  //   { dataIndex: "bizId", title: "会话id" },
  //   { dataIndex: "seatText", title: "坐席话术" },
  //   {
  //     dataIndex: "originCorpus",
  //     width: 100,
  //     title: "查看会话",
  //     fixed: 'right',
  //     render: (v, record) => {
  //       return (
  //         <Button type="link" onClick={() => {
  //           const { beginTime: recordBeginTime, endTime: recordEndTime, } = record
  //           setHitTime(recordBeginTime)
  //           // 聊天记录
  //           const list = v.sessionMessageList || []
  //           const newarr = []
  //           list.forEach((item) => {
  //             const { beginTime } = item
  //             // 行记录的开始时间和结束时间去比对 聊天记录每条的开始时间，如果在这个范围内 给一个标记视为一个意图对话
  //             if (dateToStr(recordBeginTime) <= dateToStr(beginTime) && dateToStr(recordEndTime) >= dateToStr(beginTime)) {
  //               item.isIntention = true
  //               newarr.push(item)
  //             } else {
  //               newarr.push(item)
  //             }
  //           })
  //           // 如果isIntention为true，则把聊天总结成一个意图
  //           const result = newarr.reduce((acc, item) => {
  //             if (item.isIntention) {
  //               const foundItem = acc.find((el) => el.IntentionAll);
  //               if (foundItem) {
  //                 foundItem.IntentionAll.push(item);
  //               } else {
  //                 acc.push({ IntentionAll: [item] });
  //               }
  //             } else {
  //               acc.push(item);
  //             }
  //             return acc;
  //           }, []);
  //           setRecordData({ ...v, sessionMessageList: result })
  //           getVocieUrl({ bizId: record.bizId }, {
  //             onSuccess: (v) => {
  //               setVoice(v)
  //             }
  //           })
  //         }}>
  //           查看
  //         </Button>
  //       )
  //     }
  //   }
  // ]
  const htmlContent = (v, index) => {
    if (v.role === "AI" || v.role === "SEAT") {
      return (
        <div className={styles.AI} key={index}>
          <p className={styles.name}>
            <UserOutlined className={styles.usericon} />
            坐席
          </p>
          <div className={styles.flexRight}>
            <div className={styles.history}>{v.text}</div>
          </div>
          <p className={styles.timeStr}>{v.beginTime}</p>
        </div>
      )
    }
    if (v.role === "USER") {
      return (
        <div className={styles.user} key={index}>
          <p className={styles.name}>
            <UserOutlined className={styles.usericon} />
            客户
          </p>
          <div className={styles.flex}>
            <div className={styles.history}>{v.text}</div>
          </div>
          <p className={styles.timeStr}>{v.beginTime}</p>
        </div>
      )
    }
  }
  const batchUpdate = (v) => {
    const arr = form.getFieldValue("suggestDialogueList")
    arr.forEach((item, index) => {
      if (selectedRowKeys.includes(index)) {
        form.setFieldValue(["suggestDialogueList", index, "status"], v)
      }
    })
  }
  return (
    <div className={styles.Intention}>
      <Row gutter={16} style={{ height: "100%" }}>
        <Col span={14}>
          <Card title="意图操作" style={{ height: "100%" }} className={styles.mainleftbox}>
            <div className="edit">
              <Form
                form={form}
                onValuesChange={() => {
                  toParent(true)
                }}
              >
                <Row style={{ alignItems: "center" }} gutter={[5, 5]}>
                  <Col span={12}>
                    <Form.Item
                      style={{ marginBottom: "5px" }}
                      labelCol={{ span: 5 }}
                      label="意图名称"
                      name="name"
                      rules={[{ required: true, message: "请输入意图名称" }]}
                    >
                      <Input
                        disabled={statusIntention === "REJECT" || props.type === "show"}
                        allowClear
                      />
                    </Form.Item>
                  </Col>
                  <Col span={5}>
                    <div style={{ marginBottom: "5px" }}>
                      <Radio.Group
                        disabled={props.type === "show"}
                        value={statusIntention}
                        onChange={(e) => {
                          changeStatus(e.target.value)
                        }}
                      >
                        <Radio value="ACCEPT">采纳</Radio>
                        <Radio value="REJECT">不采纳</Radio>
                      </Radio.Group>
                    </div>
                  </Col>
                  <Col span={7}>
                    <Form.Item
                      style={{ marginBottom: "5px" }}
                      label="意图层级"
                      name="layer"
                      rules={[
                        {
                          required: statusIntention !== "REJECT",
                          message: "请选择意图层级"
                        }
                      ]}
                    >
                      <Cascader
                        disabled={props.type === "show"}
                        placeholder="请选择意图层级"
                        options={listByParentAndType}
                        fieldNames={{
                          label: "name",
                          value: "id",
                          children: "childKnowledgeConfigs"
                        }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row>
                  <Col span={3}></Col>
                  <Col span={21}>
                    <div style={{ marginBottom: "5px" }}>
                      {data?.suggestIntentionList?.map((item, index) => {
                        return (
                          <Tag
                            key={index}
                            style={{ marginBottom: "5px", cursor: "pointer" }}
                            onClick={() => {
                              replaceIntention(item)
                            }}
                          >
                            {item}
                          </Tag>
                        )
                      }) || "-"}
                    </div>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      style={{ marginBottom: "5px" }}
                      label="意图描述"
                      name="description"
                      rules={[{ required: true, message: "请输入意图描述" }]}
                    >
                      <Input.TextArea
                        disabled={props.type === "show"}
                        placeholder="请输入意图描述"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item label="建议话术" shouldUpdate labelCol={{ span: 3 }}>
                  {() => (
                    <Form.List name="suggestDialogueList" initialValue={[{ status: "INIT" }]}>
                      {(fields, { add, remove }) => (
                        <div>
                          <div
                            style={{
                              width: "100%",
                              textAlign: "right",
                              marginBottom: "10px"
                            }}
                          >
                            <Button
                              type="primary"
                              disabled={statusIntention === "REJECT" || props.type === "show"}
                              size="small"
                              style={{ marginRight: "5px" }}
                              onClick={() => {
                                if (selectedRowKeys.length <= 0) {
                                  return message.warning("请先选择建议话术")
                                }
                                batchUpdate("ACCEPT")
                              }}
                            >
                              批量采纳
                            </Button>
                            <Button
                              type="primary"
                              disabled={statusIntention === "REJECT" || props.type === "show"}
                              size="small"
                              onClick={() => {
                                if (selectedRowKeys.length <= 0) {
                                  return message.warning("请先选择建议话术")
                                }
                                batchUpdate("REJECT")
                              }}
                            >
                              批量不采纳
                            </Button>
                          </div>

                          <Table
                            rowSelection={{
                              onChange: (e) => {
                                setSelectedRowKeys(e)
                              },
                              selectedRowKeys,
                              getCheckboxProps: () => {
                                return {
                                  disabled: statusIntention === "REJECT" || props.type === "show"
                                }
                              }
                            }}
                            size="small"
                            id="addtable"
                            key={2}
                            scroll={{ y: 300 }}
                            pagination={false}
                            columns={editColumns}
                            dataSource={fields.map((item) => ({
                              ...item,
                              remove
                            }))}
                          />
                          <Button
                            type="dashed"
                            style={{ width: "100%", marginTop: "10px" }}
                            disabled={
                              fields.length >= 50 ||
                              statusIntention === "REJECT" ||
                              statusIntention === "INIT" ||
                              props.type === "show"
                            }
                            onClick={() => {
                              add({ status: "INIT" })
                            }}
                            icon={<PlusOutlined />}
                          >
                            添加话术
                          </Button>
                        </div>
                      )}
                    </Form.List>
                  )}
                </Form.Item>
              </Form>
            </div>
          </Card>
        </Col>
        <Col span={10} className={styles.messagebox}>
          <Card title="参考会话" style={{ height: "100%" }} className={styles.mainbox}>
            {recordData?.length === 0 ? (
              <Empty description="暂无会话"></Empty>
            ) : (
              <>
                <div className={styles.detailbox}>
                  <div
                    style={{
                      width: "100%",
                      textAlign: "left",
                      marginTop: "10px"
                    }}
                  >
                    <Pagination
                      onChange={(page) => {
                        handleData(page - 1)
                      }}
                      itemRender={(v, type, v2) => {
                        if (type === "prev") {
                          return <span style={{ cursor: "pointer" }}>上一条</span>
                        } else if (type === "next") {
                          return <span style={{ cursor: "pointer" }}>下一条</span>
                        }
                      }}
                      total={messageList?.total}
                      pageSize={1}
                      simple
                    ></Pagination>
                  </div>
                </div>

                <div className={styles.cardboxHead}>
                  <div>
                    <div className={styles.infobox}>
                      <span className={styles.title}>会话id：</span>
                      <span className={styles.value}>{sessionId}</span>
                    </div>
                    <audio controls src={voice} className={styles.audiobox}></audio>
                  </div>
                </div>
                <div className={styles.cardbox} id="cardbox">
                  {recordData?.map((item, index) => {
                    // 意图总结
                    if (item?.IntentionAll?.length > 0) {
                      return (
                        <div key={index}>
                          <p id="intentionLocaltion" className={styles.summarytop}>
                            命中时间：{hitTime}
                          </p>
                          <div className={styles.intentionbox} key={index}>
                            {item.IntentionAll.map((itemIntention, itemIndex) => {
                              return htmlContent(itemIntention, itemIndex + "item")
                            })}
                          </div>
                          <p className={styles.summary} key={index + "p"}>
                            {data?.name}
                          </p>
                        </div>
                      )
                    } else {
                      // 非意图聊天记录
                      return htmlContent(item, index)
                    }
                  })}
                </div>
              </>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default forwardRef(Intention)
