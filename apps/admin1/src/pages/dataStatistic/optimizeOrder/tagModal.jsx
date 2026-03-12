import { useCallback, useEffect, useMemo, useState } from "react"
import { Divider, Form, Input, Modal, Select, Space, Table, message, Collapse } from "antd"
import { MinusCircleOutlined, PlusCircleOutlined, DownOutlined } from "@ant-design/icons"
import { useBatchSaveSourceTag, useFetchSourceTag } from "@/api/sourceTag"
import { fetchSetCallLogsMark, fetchCallLogsMarkDetail } from "@/api/userFeedback/api"
import { PAGE_CODE } from "@/constants/pageCode"
import { useGetTestSetList } from "@/api/testSet"
import "./index.less"

const title = {
  manage: "管理标注标签",
  setting: "加入测试集"
}

const dividerTextStyle = {
  fontSize: "14px",
  fontWeight: 400,
  color: "#A9A9A9"
}

const COLLAPSE_CLASS = "custom-collapse"

// const styleSheet = document.createElement("style")
// styleSheet.textContent = `
//   .${COLLAPSE_CLASS} .ant-collapse-content-box {
//     padding: 0 !important;
//   }
//   .${COLLAPSE_CLASS} .ant-collapse>.ant-collapse-item >.ant-collapse-header {
//     padding: 0 !important;
//   }
// `
// document.head.appendChild(styleSheet)

const TagModal = ({
  visible,
  setVisible,
  mode = "manage",
  record,
  refreshTableData,
  botNo: _botNo
}) => {
  const [form] = Form.useForm()
  const [tagList, setTagList] = useState([])
  const [testSetList, setTestSetList] = useState([])
  const { mutate: fetchSourceTag } = useFetchSourceTag()
  const { mutate: saveSourceTag } = useBatchSaveSourceTag()
  const { mutate: getTestSetList } = useGetTestSetList()
  const [isLoading, setIsLoading] = useState(false)
  const [testSetAddRecords, setTestSetAddRecords] = useState([])
  const [isActive, setIsActive] = useState(false)

  const botNo = useMemo(() => record?.botNo || _botNo, [record, _botNo])

  const fetchData = useCallback(() => {
    fetchSourceTag(
      {
        botNo,
        tagType: "callRecordsMark"
      },
      {
        onSuccess: (res) => {
          // @ts-ignore
          if (res.success) {
            if (mode === "manage") {
              form.setFieldsValue({
                sourceTagList: res.data?.length > 0 ? res.data : [{}]
              })
            }
            setTagList(res.data)
          }
        }
      }
    )
    mode === "setting" &&
      getTestSetList(
        {
          botNo
        },
        {
          onSuccess: (res) => {
            // @ts-ignore
            if (res.success === true) {
              setTestSetList(res.data)
            }
          }
        }
      )
  }, [botNo, fetchSourceTag, form, mode, getTestSetList])

  const fetchMarkDetail = useCallback(() => {
    if (mode !== "setting" || !record?.resourceLinks?.[0]?.resourceNo) return
    fetchCallLogsMarkDetail({
      pageCode: PAGE_CODE.CALL_LOGS,
      requestId: record?.resourceLinks?.[0]?.resourceNo,
      botNo: record?.botNo,
      requestTime: record?.requestTime
    }).then((res) => {
      console.log("d", res)
      form.setFieldsValue(res)
      setTestSetAddRecords(res?.testSetAddRecords)
    })
  }, [form, mode, record])

  const onSubmit = useCallback(async () => {
    const values = await form.validateFields()
    if (!(values.tag || values.sourceTagList?.length || values.testSetList)) {
      message.error("请输入必要的内容")
      return
    }

    setIsLoading(true)
    if (mode === "manage") {
      const submitData = {
        botNo,
        tagType: "callRecordsMark",
        tags: values.sourceTagList?.map((item) => {
          const val = tagList?.find(({ tagDesc }) => tagDesc === item.tagDesc)
          return val ? { code: val.code, tagDesc: val.tagDesc } : item
        })
      }
      saveSourceTag(submitData, {
        onSuccess: (res) => {
          if (res.success) {
            message.success("保存成功")
            setVisible(false)
            fetchData()
          }
          setIsLoading(false)
        },
        onError: () => setIsLoading(false)
      })
    } else if (mode === "setting") {
      fetchSetCallLogsMark({
        pageCode: PAGE_CODE.CALL_LOGS,
        requestId: record?.resourceLinks?.[0]?.resourceNo, //record?.requestId,
        ...values,
        tagDesc: tagList?.find(({ code }) => code === values.tag)?.tagDesc,
        testSetList: values.testSetList?.map((setNo) => {
          return {
            setNo,
            setName: testSetList?.find(({ setNo: _setNo }) => _setNo === setNo)?.setName
          }
        }),
        botNo: record?.botNo,
        requestTime: record?.requestTime
      })
        .then((res) => {
          // @ts-ignore
          if (res.success) {
            message.success("保存成功")
            setVisible(false)
            setTimeout(() => {
              refreshTableData()
            }, 600)
          }
          setIsLoading(false)
        })
        .finally(() => setIsLoading(false))
    }
  }, [
    botNo,
    fetchData,
    form,
    mode,
    record,
    saveSourceTag,
    setVisible,
    tagList,
    refreshTableData,
    testSetList
  ])

  useEffect(() => {
    if (!visible) {
      form.resetFields()
    } else {
      fetchData()
      fetchMarkDetail()
    }
  }, [form, visible, fetchData, fetchMarkDetail])

  const testSetListOption = useMemo(
    () =>
      testSetList?.map((item) => ({
        ...item,
        disabled: testSetAddRecords?.find((record) => {
          return item.setNo === record.setNo
        })
      })),
    [testSetList, testSetAddRecords]
  )

  const grayColor = "#a9a9a9"
  const columnsRender = {
    render: (text) => <div style={{ color: grayColor }}>{text}</div>
  }

  return (
    <Modal
      title={title[mode]}
      open={visible}
      onCancel={() => setVisible(false)}
      onOk={onSubmit}
      okButtonProps={{
        // disabled: mode === "setting" && !tagList?.length,
        loading: isLoading
      }}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        {mode === "manage" && (
          <Form.List name="sourceTagList" initialValue={[{}]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ name, key, ...restField }, index) => (
                  <Form.Item key={key} noStyle shouldUpdate>
                    {({ getFieldValue }) => {
                      const curTagDesc = getFieldValue("sourceTagList")?.[name]?.tagDesc
                      const isOld =
                        tagList?.findIndex(({ tagDesc }) => tagDesc === curTagDesc) === name
                      return (
                        <Space align="baseline">
                          <Form.Item
                            {...restField}
                            className="w-96"
                            label={`标签${index + 1}`}
                            name={[name, "tagDesc"]}
                            rules={[
                              {
                                required: true,
                                message: "请输入标签"
                              },
                              {
                                validator: (_, value) => {
                                  if (!value || isOld) return Promise.resolve()
                                  if (tagList?.find(({ tagDesc }) => tagDesc === curTagDesc)) {
                                    return Promise.reject(new Error("该标签名称已存在"))
                                  }
                                  return Promise.resolve()
                                }
                              }
                            ]}
                          >
                            <Input placeholder="请输入标签" disabled={isOld} />
                          </Form.Item>
                          {fields?.length > 1 && !isOld && (
                            <MinusCircleOutlined
                              className="text-[16px]"
                              style={{ color: "#7F56D9" }}
                              onClick={() => remove(name)}
                            />
                          )}
                          {fields?.length === index + 1 && (
                            <PlusCircleOutlined
                              className="text-[16px]"
                              style={{ color: "#7F56D9" }}
                              onClick={() => add()}
                            />
                          )}
                        </Space>
                      )
                    }}
                  </Form.Item>
                ))}
              </>
            )}
          </Form.List>
        )}
        {mode === "setting" && (
          <>
            <Form.Item
              label="添加至测试集"
              rules={[{ required: true, message: "请选择测试集" }]}
              name="testSetList"
            >
              <Select
                mode="multiple"
                allowClear
                style={{ width: "100%" }}
                placeholder="请选择测试集"
                defaultValue={[]}
                fieldNames={{ label: "setName", value: "setNo" }}
                options={testSetListOption}
              />
            </Form.Item>

            <Collapse
              ghost
              className={COLLAPSE_CLASS}
              expandIcon={() => null}
              onChange={(keys) => setIsActive(keys.includes("1"))}
              items={[
                {
                  key: "1",
                  label: (
                    <Divider orientationMargin={0} style={{ margin: "0 0 16px 0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={dividerTextStyle}>最近5条添加记录</span>
                        <DownOutlined
                          style={{
                            fontSize: "12px",
                            color: "#A9A9A9",
                            transform: `rotate(${isActive ? 180 : 0}deg)`,
                            transition: "transform 0.3s"
                          }}
                        />
                      </div>
                    </Divider>
                  ),
                  children: (
                    <Table
                      columns={[
                        {
                          dataIndex: "gmtCreated",
                          width: 180,
                          ...columnsRender
                        },
                        {
                          render: () => columnsRender.render("添加至"),
                          width: 60
                        },
                        {
                          dataIndex: "setName",
                          align: "right",
                          ...columnsRender
                        }
                      ]}
                      dataSource={testSetAddRecords}
                      pagination={false}
                      showHeader={false}
                      size="small"
                      bordered={false}
                    />
                  )
                }
              ]}
            />
          </>
        )}
      </Form>
    </Modal>
  )
}

export default TagModal
