import { useCallback, useEffect, useMemo, useState } from "react"
import { Button, Drawer, Form, Input, Select, Steps, Row, Col, Upload, message } from "antd"
import { InboxOutlined } from "@ant-design/icons"
import {
  useFetchListAllDsInfoApi,
  useFetchSaveDataSetInfoApi,
  useFetchDataSetInfoBindTaskApi,
  useFetchDataSetInfoDetailApi
} from "@/api/dataManagement"
import { fetchDownLoadExcludeTemplate, fetchParsingExcludeTemplate } from "@/api/dataManagement/api"
import { useFetchListByType } from "@/api/knowledgeManage"
import { findKnowledgeLayerNodes } from "@/pages/knowledgeProject/utils"
import KnowledgeExtractionForm from "@/pages/knowledgeProject/knowledgeExtraction/components/KnowledgeExtractionForm"
import LoopRuleFormList from "./loopRuleFormList"
import PortraitDrawer from "./portraitDrawer"
import styles from "../../index.module.scss"
import dayjs from "dayjs"

const titleMap = {
  add: "创建",
  view: "查看",
  edit: "编辑",
  copy: "复制"
}

const convertDateFormat = (dataList, type = "dateString") => {
  return dataList?.map(({ conditionConfigList, logicOperateType, ...otherData }) => ({
    ...otherData,
    logicOperateType: logicOperateType ?? "1",
    conditionConfigList: conditionConfigList?.map(
      ({ childList, logicOperateType: conditionLogicOperateType, ...otherConditionConfig }) => ({
        ...otherConditionConfig,
        logicOperateType: conditionLogicOperateType ?? "1",
        childList: childList?.map(
          ({ labelValue, logicOperateType: childLogicOperateType, ...otherChildData }) => ({
            ...otherChildData,
            logicOperateType: childLogicOperateType ?? "1",
            labelValue:
              type === "dateObject"
                ? /^\d{4}-(0?[1-9]|1[0-2])-(0?[1-9]|[12]\d|3[01])/.test(labelValue) &&
                  dayjs(labelValue)?.isValid()
                  ? dayjs(labelValue)
                  : labelValue
                : dayjs.isDayjs(labelValue)
                  ? dayjs(labelValue).format("YYYY-MM-DD HH:mm:ss")
                  : labelValue
          })
        )
      })
    )
  }))
}

const FormDrawer = ({ visiable, setVisiable, mode = "add", id: recordId, botNo }) => {
  const [form] = Form.useForm()
  const [portraitDrawerOpen, setPortraitDrawerOpen] = useState(false)
  const [current, setCurrent] = useState(0)
  const [downloading, setDownloading] = useState(false)
  const [isParsingLoading, setIsParsingLoading] = useState(false)
  const [recordData, setRecordData] = useState(null)
  const [dataId, setDataId] = useState(null)
  const id = useMemo(() => dataId || recordId, [recordId, dataId])
  const { data: listAllDsInfo } = useFetchListAllDsInfoApi({ botNo })
  const { data: dataSetInfo } = useFetchDataSetInfoDetailApi({
    id: visiable ? id : null
  })
  const { mutate: fetchSaveDataSetInfo, isLoading: isSaveLoading } = useFetchSaveDataSetInfoApi()
  const { mutate: fetchDataSetInfoBindTask, isLoading: isBindLoading } =
    useFetchDataSetInfoBindTaskApi()
  // 业务场景
  const { data: listByParentAndType } = useFetchListByType({
    type: "BUSINESS_SCENE",
    botNo
  })

  const externalVerifyRulesData = useCallback(
    ({ field, maximum }) => {
      return [
        {
          validator: async (_, value) => {
            if (field !== "instanceLimit") return Promise.resolve()
            if (mode === "view" || !value || typeof dataSetInfo?.totalCount !== "number")
              return Promise.resolve()
            const multiple = 1.2
            const num = dataSetInfo?.totalCount * multiple
            if (num < maximum && value <= maximum && value > num) {
              return Promise.reject(
                `样本量过小，无法启动萃取，请重新输入！（p.s.建议输入值≤圈选总数*${multiple}倍）`
              )
            }
            return Promise.resolve()
          }
        }
      ]
    },
    [dataSetInfo?.totalCount, mode]
  )

  const newRecord = useMemo(() => {
    if (!id) return null
    if (dataSetInfo?.excludeCustId || dataSetInfo?.excludePhone || dataSetInfo?.excludeSession) {
      dataSetInfo.file = {
        fileList: [
          {
            uid: "1",
            name: "客户排除模板.xlsx",
            status: "done",
            url: ""
          }
        ]
      }
    }
    // 日期对象处理
    if (dataSetInfo?.maxConditionConfigList) {
      dataSetInfo.maxConditionConfigList = convertDateFormat(
        dataSetInfo.maxConditionConfigList,
        "dateObject"
      )
    }
    if (mode !== "copy") return dataSetInfo || null
    return dataSetInfo
      ? {
          ...dataSetInfo,
          dataSetName: `${dataSetInfo.dataSetName ?? ""}_复制`,
          ...(dataSetInfo.bindTaskInfo
            ? {
                ...dataSetInfo.bindTaskInfo,
                taskName: `${dataSetInfo.taskName ?? ""}_复制`
              }
            : {}),
          id: dataId && dataId === dataSetInfo?.id ? dataId : undefined,
          batchNo: dataId ? dataSetInfo?.batchNo : undefined
        }
      : null
  }, [id, dataSetInfo, mode, dataId])

  const portraitData = useMemo(() => {
    if (!portraitDrawerOpen) return null
    return newRecord?.batchNo ? newRecord : recordData
  }, [newRecord, portraitDrawerOpen, recordData])

  useEffect(() => {
    if (!visiable) {
      setDataId(null)
      form.resetFields()
    }
  }, [form, visiable])

  useEffect(() => {
    setDataId(newRecord?.id)
    setCurrent(mode === "edit" || mode === "view" ? 1 : 0)
  }, [newRecord?.id, mode])

  useEffect(() => {
    form.resetFields()
    if (current === 0) {
      form.setFieldsValue(newRecord || undefined)
    } else if (current === 1) {
      form.setFieldsValue({
        ...(newRecord?.bindTaskInfo || {}),
        _scene: findKnowledgeLayerNodes(listByParentAndType || [], newRecord?.bindTaskInfo?.scene, {
          isToId: true
        })
      })
    }
  }, [current, newRecord, form, listByParentAndType])

  // 处理下载模板的函数
  const handleDownload = useCallback(async () => {
    setDownloading(true)
    try {
      await fetchDownLoadExcludeTemplate()
    } finally {
      setDownloading(false)
    }
  }, [])

  const onStepChange = useCallback((value) => {
    setCurrent(value)
  }, [])

  const onNext = useCallback(async () => {
    ;(mode === "add" || mode === "copy") && (await form.validateFields())
    onStepChange(1)
  }, [form, mode, onStepChange])

  const getSaveParams = useCallback(async () => {
    const values = await form.validateFields()
    const { file, maxConditionConfigList, ...extraValue } = values
    let excludeTemplateData =
      (newRecord?.excludeCustId || newRecord?.excludePhone || newRecord?.excludeSession) &&
      file?.fileList?.[0]?.status === "done"
        ? {
            excludeCustId: newRecord?.excludeCustId,
            excludePhone: newRecord?.excludePhone,
            excludeSession: newRecord?.excludeSession
          }
        : undefined
    if (file?.fileList?.[0]?.originFileObj) {
      const formData = new FormData()
      formData.append("file", file.fileList[0].originFileObj)
      setIsParsingLoading(true)
      excludeTemplateData = await fetchParsingExcludeTemplate(formData)
      setIsParsingLoading(false)
    }
    return {
      ...extraValue,
      maxConditionConfigList: convertDateFormat(maxConditionConfigList), // 日期对象处理
      ...(excludeTemplateData || {})
    }
  }, [form, newRecord])

  const onSave = useCallback(async () => {
    const value = await getSaveParams()
    fetchSaveDataSetInfo(
      { ...value, botNo },
      {
        onSuccess: (res) => res.success && setDataId(res.data?.id)
      }
    )
  }, [botNo, fetchSaveDataSetInfo, getSaveParams])

  const onSubmit = useCallback(async () => {
    const values = await form.validateFields()
    const { _scene, ...otherValue } = values
    fetchDataSetInfoBindTask(
      { ...otherValue, scene: _scene?.[_scene?.length - 1], id, botNo },
      {
        onSuccess: (res) => res?.success && setVisiable(false)
      }
    )
  }, [botNo, fetchDataSetInfoBindTask, form, id, setVisiable])

  return (
    <>
      <Drawer
        open={visiable}
        size="large"
        title={titleMap[mode]}
        onClose={() => setVisiable(false)}
        destroyOnClose
        footer={[
          <div
            key="footer"
            style={{
              textAlign: "right"
            }}
          >
            <Button
              style={{ marginRight: 5 }}
              loading={isParsingLoading}
              onClick={async () => {
                if (!dataId) {
                  const value = await getSaveParams()
                  setRecordData(value)
                }
                setPortraitDrawerOpen(true)
              }}
            >
              查看画像
            </Button>
            {current === 0 && (
              <>
                {mode !== "view" && (
                  <Button
                    type="primary"
                    style={{ marginRight: 5 }}
                    loading={isSaveLoading || isParsingLoading}
                    disabled={dataId}
                    onClick={onSave}
                  >
                    提交
                  </Button>
                )}
                <Button type="primary" disabled={!dataId} onClick={onNext}>
                  下一步
                </Button>
              </>
            )}
            {current === 1 && (
              <>
                <Button type="primary" onClick={() => onStepChange(0)}>
                  上一步
                </Button>
                {mode !== "view" && (
                  <Button
                    type="primary"
                    style={{ marginLeft: 5 }}
                    loading={isBindLoading}
                    onClick={onSubmit}
                  >
                    提交
                  </Button>
                )}
              </>
            )}
          </div>
        ]}
      >
        <Steps
          className={styles["stepsBox"]}
          current={current}
          items={[
            {
              title: "数据圈选",
              description: "设置圈选条件"
            },
            {
              title: "任务绑定",
              description: "创建萃取任务"
            }
          ]}
        />
        {current === 0 && (
          <Form
            layout="horizontal"
            form={form}
            disabled={dataId || mode === "edit" || mode === "view"}
          >
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  label="数据源"
                  name="dsId"
                  rules={[{ required: true, message: "请选择数据源" }]}
                >
                  <Select
                    placeholder="请选择数据源"
                    options={listAllDsInfo}
                    fieldNames={{ label: "dsName", value: "id" }}
                    onChange={() =>
                      form.setFieldsValue({
                        maxConditionConfigList: [
                          {
                            conditionConfigList: [{ childList: [{}] }]
                          }
                        ]
                      })
                    }
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="数据集名称"
                  name="dataSetName"
                  rules={[{ required: true, message: "请输入数据集名称" }]}
                >
                  <Input placeholder="请输入数据集名称" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="用途描述" name="desc">
                  <Input.TextArea placeholder="请输入用途描述" />
                </Form.Item>
              </Col>
              <Col span={24} style={{ marginBottom: 24 }}>
                {/* 圈选规则 */}
                <Form.Item
                  noStyle
                  shouldUpdate={(prevValues, curValues) => prevValues.dsId !== curValues.dsId}
                >
                  {({ getFieldValue }) => <LoopRuleFormList dsId={getFieldValue("dsId")} />}
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="客群排除" colon={false} className={styles.verticalFormItem}>
                  <Form.Item noStyle name="file">
                    <Upload.Dragger
                      defaultFileList={newRecord?.file?.fileList || undefined}
                      maxCount={1}
                      accept=".xls,.xlsx"
                      beforeUpload={(file) => {
                        const isLt10M = file.size / 1024 / 1024 < 10
                        const allowedExtensions = [".xls", ".xlsx"]
                        const fileExtension = "." + file.name.split(".").pop().toLowerCase()
                        if (!isLt10M) {
                          message.error("文件大小超过10MB!")
                          return false
                        }
                        if (!allowedExtensions.includes(fileExtension)) {
                          message.error("不支持的文件格式!")
                          return false
                        }
                        return true
                      }}
                      customRequest={(options) => {
                        options.onSuccess({}, options.file)
                      }}
                    >
                      <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                      </p>
                      <p>
                        将文档拖拽到此处，或
                        <span
                          style={dataId ? { color: "rgba(0, 0, 0, 0.25)" } : { color: "#5E5FF8" }}
                        >
                          本地上传
                        </span>
                      </p>
                    </Upload.Dragger>
                  </Form.Item>
                  <div className="mt-3">
                    点击
                    <Button type="link" loading={downloading} onClick={handleDownload}>
                      下载模板
                    </Button>
                    按格式填写
                  </div>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        )}
        {current === 1 && (
          <KnowledgeExtractionForm
            botNo={botNo}
            form={form}
            hiddenFields={["batchNo"]}
            externalVerifyRulesData={externalVerifyRulesData}
            disabled={mode === "view"}
            listByParentAndType={listByParentAndType}
          />
        )}
      </Drawer>
      <PortraitDrawer
        recordData={portraitData}
        visiable={portraitDrawerOpen}
        setVisiable={setPortraitDrawerOpen}
      />
    </>
  )
}

export default FormDrawer
