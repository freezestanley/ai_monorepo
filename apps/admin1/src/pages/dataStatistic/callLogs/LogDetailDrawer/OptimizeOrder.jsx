import {
  Form,
  Input,
  Select,
  Space,
  Checkbox,
  Button,
  message,
  Typography,
  Tooltip,
  Popconfirm,
  TreeSelect,
  Tag,
  Badge,
  Upload,
  Divider
} from "antd"
const aiOptimizeAdviceIcon =
  "https://alicdn.zaticdn.com/zaip/zaip-toolweb-file-service/upload/9Nq8yQTFFdE82e69U6YSXt-AI-star.png"
import {
  useFetchOptimizationOrderDetail,
  useUpdateOptimizationOrder,
  useGetOptimizationStatus,
  useGetOptimizationPriority,
  useGetOptimizationOption,
  useFetchAuthUserList,
  useCreateOptimizationOrder,
  useFetchOptimizationOrderSelect
} from "@/api/optimize"
import HistoryRecords from "./HistoryRecords"
import { useFetchSourceTag } from "@/api/sourceTag"
import { useEffect, useMemo, useState } from "react"
import { ClockCircleOutlined, InfoCircleOutlined } from "@ant-design/icons"
import { OptimizeSettingModal } from "./../../optimizeOrder/OptimizeSettingModal"
import { getTagColor, getStatusColor, getAvailableOptions } from "./../utils"
import CustomDivider from "@/components/CustomDivider"
import OverflowTooltip from "@/components/overflowTooltip"
import BusinessSourceModal from "./BusinessSourceModal"
import { batchSaveSourceTag } from "@/api/sourceTag/api"
import { getTokenAndServiceName } from "@/api/sso"
import ImageUpload from "@/components/ImageUpload"
import { botPrefix } from "@/constants"
import ImageUploadForCommon from "@/components/ImageUploadForCommon"
import { CopyOutlined } from "@ant-design/icons"
import copy from "copy-to-clipboard"
const { Text } = Typography
import { fetchSourceTag } from "@/api/sourceTag/api"
import MarkdownRenderer from "@/components/MarkdownRenderer"

export default ({ record = {}, setVisible, disabled, refreshTableData }) => {
  const [form] = Form.useForm()
  const [isEditing, setIsEditing] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [hiddenWhenNoPass, setHiddenWhenNoPass] = useState(false)
  const [reasonTypeList, setReasonTypeList] = useState([])
  const [businessSourceList, setBusinessSourceList] = useState([])
  const [status, setStatus] = useState({ code: "TO_BE_PROCESS", name: "待审核" })
  const [selectedOptimizationOrderId, setSelectedOptimizationOrderId] = useState("")

  // 获取优化单选择列表
  const { data: optimizationOrderSelectList = [] } = useFetchOptimizationOrderSelect(
    record?.requestId
  )

  // 当优化单ID列表数据大于等于1时，默认选中第一个
  useEffect(() => {
    if (optimizationOrderSelectList.length >= 2) {
      //&& record?.optimizationOrderCount >= 2
      const firstOrderId = optimizationOrderSelectList[0]?.code
      if (firstOrderId && !selectedOptimizationOrderId) {
        setSelectedOptimizationOrderId(firstOrderId)
        setOrderNo(firstOrderId)
      }
    }
  }, [optimizationOrderSelectList, record?.optimizationOrderCount, selectedOptimizationOrderId])

  const { data: optionList = [] } = useGetOptimizationOption()
  const { data: statusList = [] } = useGetOptimizationStatus()

  const { data: priorityList = [] } = useGetOptimizationPriority()

  const { data: userList = [] } = useFetchAuthUserList({
    botNo: record.botNo,
    pageNum: 1,
    pageSize: 1000
  })
  const { _type, botNo, _orderNo } = record
  const [orderNo, setOrderNo] = useState(
    _type === "create"
      ? ""
      : record?.optimizationOrderCount < 2 || optimizationOrderSelectList.length < 2
        ? _orderNo || record?.optimizationOrder?.orderNo
        : ""
  )
  const { mutate: createOptimizationOrder } = useCreateOptimizationOrder()
  const { mutate: updateOptimizationOrder } = useUpdateOptimizationOrder()
  const { data: detail = {}, refetch } = useFetchOptimizationOrderDetail(
    { orderNo },
    {
      enabled:
        record?.optimizationOrderCount < 2 || optimizationOrderSelectList.length < 2
          ? !!orderNo
          : !!orderNo && !!selectedOptimizationOrderId
    }
  )
  // const { mutate: fetchSourceTag } = useFetchSourceTag()
  const [businessSourceModalVisible, setBusinessSourceModalVisible] = useState(false)

  useEffect(() => {
    fetchReasonTypeList(botNo)
    fetchBusinessSourceList(botNo)
  }, [botNo])

  const fetchBusinessSourceList = (botNo) => {
    fetchSourceTag({
      botNo: botNo,
      tagType: "optimizationBizSource"
    }).then((res) => {
      if (res.success) {
        setBusinessSourceList(res.data || [])
      }
    })
  }

  const fetchReasonTypeList = (botNo) => {
    fetchSourceTag({
      botNo: botNo,
      tagType: "optimizationReason"
    }).then((res) => {
      if (res.success) {
        setReasonTypeList(res.data || [])
      }
    })
  }

  const afterCreateOrUpdate = (newOrderNo) => {
    setIsEditing(false)
    setOrderNo(newOrderNo)
    setTimeout(refetch, 32)
    refreshTableData && refreshTableData()
    setHasChanges(false)
  }

  // 三种状态：readonly，canEdit，edit
  const panelStatus = useMemo(() => {
    const editStatus = ["TO_BE_EXAMINE", "TO_BE_PROCESS", "PROCESSING"]
    const applyCanEditStatus = ["REJECT_EXAMINE", "HAS_PROCESSED", "REJECT_PROCESS"]
    if (_type === "create" || _type === "edit" || editStatus.includes(detail.status?.code)) {
      return "edit"
    } else if (_type === "view" || applyCanEditStatus.includes(detail.status?.code)) {
      return "canEdit"
    } else {
      return "readonly"
    }
  }, [_type, detail.status])

  useEffect(() => {
    if (detail.orderNo) {
      const { options, priority, status, processors, remark, reasons, remarkUrls } = detail
      form.setFieldsValue({
        status: status?.code,
        priority: priority?.code,
        reasons: reasons?.map((item) => item.code),
        processors: processors?.map((item) => item.username),
        remark,
        remarkUrls: remarkUrls || [], // 确保remarkUrls始终是数组
        options: options?.map((item) => item.code)
      })
      setStatus(status)
    } else {
      // 当detail为空或orderNo不存在时，清空表单
      form.resetFields()
    }
  }, [detail, form])

  const handleUpdateOptimizationOrder = (otherData = {}) => {
    const isOnlyUpdateRemark = otherData.status
    form.validateFields().then((values) => {
      const submitData = {
        ...values,
        ...otherData,
        botNo: record.botNo,
        orderNo,
        source: detail.source?.code,
        linkedRequests: [
          {
            sessionId: record.sessionId,
            requestTime: record.requestTime,
            requestId: record.requestId
          }
        ]
      }
      updateOptimizationOrder(submitData, {
        onSuccess: (res) => {
          if (res.success) {
            const tipText = isOnlyUpdateRemark ? "保存成功" : "更新成功"
            message.success(tipText)
            afterCreateOrUpdate(orderNo)
          } else {
            message.error(res.message)
          }
        }
      })
    })
  }

  const handleCreateOptimizationOrder = () => {
    if (detail.status) {
      handleUpdateOptimizationOrder()
      return
    }
    form.validateFields().then((values) => {
      const submitData = {
        ...values,
        botNo: record.botNo,
        linkedRequests: [
          {
            sessionId: record.sessionId,
            requestTime: record.requestTime,
            requestId: record.requestId
          }
        ]
      }
      createOptimizationOrder(
        { ...submitData, source: "handler_creation" },
        {
          onSuccess: (res) => {
            if (res.success) {
              message.success("创建成功")
              afterCreateOrUpdate(res.data)
            } else {
              message.error(res.message)
            }
          }
        }
      )
    })
  }

  const handleRemarkChange = () => {
    const currentRemark = form.getFieldValue("remark")
    setHasChanges(currentRemark !== detail.remark)
  }
  const updateRemark = () => {
    const { options, priority, status, processors, reasons } = detail

    const otherData = {
      status: status?.code,
      priority: priority?.code,
      reasons: reasons?.map((item) => item.code),
      processors: processors?.map((item) => item.username),
      options: options?.map((item) => item.code)
    }
    handleUpdateOptimizationOrder(otherData)
  }
  const onStatusChange = (value) => {
    const name = statusList.find((item) => item.code === value)?.name
    setStatus({ code: value, name })
    if (value === "REJECT_EXAMINE") {
      setHiddenWhenNoPass(true)
    } else {
      setHiddenWhenNoPass(false)
    }
    if (["HAS_PROCESSED", "REJECT_PROCESS"].includes(value)) {
      form.setFieldsValue({
        remarkUrls: detail.remarkUrls || []
      })
    }
  }

  const handleBusinessSourceModalOk = (sourceList) => {
    // TODO: 调用接口保存业务来源列表
    console.log("sourceList:", sourceList)
    setBusinessSourceModalVisible(false)
  }

  const isImageUploadReadonly = useMemo(() => {
    return ["HAS_PROCESSED", "REJECT_PROCESS"].includes(detail.status?.code)
  }, [detail.status?.code])

  const getRecordRequestTime = (record) => {
    try {
      if (record?.resourceLinks?.length > 0) {
        const extraInfo = record.resourceLinks[0].extraInfo
        if (extraInfo) {
          const parsedExtraInfo = JSON.parse(extraInfo)
          return parsedExtraInfo.requestTime
        }
      }
      return ""
    } catch (error) {
      return ""
    }
  }

  return (
    <div className="h-full">
      {optimizationOrderSelectList.length >= 2 && record?.optimizationOrderCount >= 2 && (
        <div className="mb-4 mt-2 flex items-center">
          <div className="mr-2">
            <Text
              type="secondary"
              style={{ fontSize: "16px", fontWeight: 500, color: "rgb(51, 51, 51)" }}
            >
              选择优化单ID:
            </Text>
          </div>
          <Select
            style={{ width: "40%", marginTop: -3 }}
            placeholder="请选择优化单ID"
            value={selectedOptimizationOrderId}
            onChange={(value) => {
              setSelectedOptimizationOrderId(value)
              setOrderNo(value)
              // 切换时清理表单状态，避免数据残留
              form.resetFields()
              setHasChanges(false)
              // orderNo 状态更新后，useFetchOptimizationOrderDetail hook 会自动重新请求
            }}
            options={optimizationOrderSelectList.map((item) => ({
              label: item.desc,
              value: item.code
            }))}
          />
        </div>
      )}
      {optimizationOrderSelectList.length >= 2 && record?.optimizationOrderCount >= 2 && (
        <Divider />
      )}

      <div className="mb-6">
        <CustomDivider>基本信息</CustomDivider>
        <div className="grid grid-cols-2 gap-4">
          <InfoItem label="优化单ID" value={orderNo || "--"} copyable={true} />
          <InfoItem label="优化单来源" value={detail.source?.name || "人工创建"} />

          {["REJECT_PROCESS", "HAS_PROCESSED"].includes(detail.status?.code) ? (
            <>
              <div className="col-span-2">
                <InfoItem label="优化单审核人" value={detail.examiner?.name} />
              </div>
              <InfoItem label="优化单创建时间" value={detail.gmtCreated} />
              <InfoItem
                label="审核时效"
                tooltip='审核时效为优化单第一次"待审核"状态到最后一次"待受理"或"未通过"状态的时长'
                value={detail.examineCostDisplay}
              />
              <InfoItem label="优化单完成时间" value={detail.completionDate} />
              <InfoItem
                label="优化时效"
                tooltip='优化时效为优化单第一次"待受理"状态到最后一次"已优化"或"搁置"状态的时长'
                value={detail.optimizationCostDisplay}
              />
            </>
          ) : ["TO_BE_PROCESS", "PROCESSING"].includes(detail.status?.code) ? (
            <>
              <div className="col-span-2">
                <InfoItem label="优化单审核人" value={detail.examiner?.name} />
              </div>
              <InfoItem
                label="优化单创建时间"
                value={detail.gmtCreated} //getRecordRequestTime(detail) ||
              />
              <InfoItem
                label="审核时效"
                tooltip='审核时效为优化单第一次"待审核"状态到最后一次"待受理"或"未通过"状态的时长'
                value={detail.examineCostDisplay}
              />
            </>
          ) : (
            <InfoItem label="优化单创建时间" value={detail.gmtCreated} />
          )}
        </div>
      </div>
      <div>
        <CustomDivider showTopLine={true}>详细信息</CustomDivider>
        {(panelStatus === "readonly" || panelStatus === "canEdit") && !isEditing ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem
                label="优化单状态"
                value={
                  <Tag color={getTagColor(detail.status?.code)}>
                    <Badge
                      status={getStatusColor(detail.status?.code)}
                      style={{ marginRight: 5 }}
                    />
                    {detail.status?.name || "未知状态"}
                  </Tag>
                }
              />
              <InfoItem label="优先级" value={detail.priority?.name} />
              <InfoItem
                label="错误类型"
                value={detail.reasons?.map((item) => item.name)?.join("、")}
              />
              <InfoItem
                label="优化方向"
                value={detail.options?.map((item) => item.name)?.join("、")}
              />
              <InfoItem
                label="受理人"
                value={detail.processors?.map((item) => item.name)?.join("、")}
              />
            </div>
            {detail.optimizeAdvice && (
              <div className="mt-4">
                <OptimizeAdvicePanel optimizeAdvice={detail.optimizeAdvice} />
              </div>
            )}
            {panelStatus === "canEdit" ? (
              <Form layout="vertical" form={form} className="mt-4 relative">
                <Form.Item label="备注" name={"remark"}>
                  <Input.TextArea
                    disabled={false}
                    placeholder="请输入"
                    className="w-full"
                    rows={4}
                    onChange={handleRemarkChange}
                  />
                </Form.Item>
                {hasChanges && (
                  <div className="absolute right-[2px] bottom-[1px]">
                    <Button type="link" className="btn-cancel" onClick={updateRemark}>
                      保存
                    </Button>
                  </div>
                )}
                <Form.Item label="备注图片" name={"remarkUrls"}>
                  <ImageUploadForCommon
                    key={`remarkUrls-${orderNo || "empty"}`} // 添加key确保组件重新渲染
                    readonly={isImageUploadReadonly}
                    value={detail.remarkUrls || []}
                    maxCount={5}
                    onChange={(urls) => {
                      form.setFieldsValue({ remarkUrls: urls })
                    }}
                  />
                </Form.Item>
              </Form>
            ) : (
              <div className="mt-4">
                <InfoItem style={{ width: "100%" }} label="备注" value={detail.remark} />
                {detail.remarkUrls && detail.remarkUrls.length > 0 && (
                  <div className="mt-4">
                    <InfoItem
                      style={{ width: "100%" }}
                      label="备注图片"
                      value={
                        <ImageUploadForCommon
                          key={`readonly-remarkUrls-${orderNo || "empty"}`} // 添加key确保组件重新渲染
                          readonly={true}
                          value={detail.remarkUrls || []}
                          maxCount={5}
                        />
                      }
                    />
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <Form layout="vertical" disabled={disabled} form={form}>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                rules={[
                  {
                    required: true,
                    message: "请选择优化单状态"
                  }
                ]}
                initialValue={"TO_BE_PROCESS"}
                name={"status"}
                label="优化单状态"
              >
                <Select
                  onChange={onStatusChange}
                  options={getAvailableOptions(statusList, detail.status || status)}
                  defaultValue={"TO_BE_PROCESS"}
                  fieldNames={{ label: "name", value: "code" }}
                  labelRender={() => (
                    <Tag color={getTagColor(status?.code)}>
                      <Badge status={getStatusColor(status?.code)} style={{ marginRight: 5 }} />
                      {status?.name || "未知状态"}
                    </Tag>
                  )}
                />
              </Form.Item>
              <Form.Item
                label="优先级"
                name={"priority"}
                initialValue={"P1"}
                rules={[{ required: true, message: "请选择优先级" }]}
                hidden={hiddenWhenNoPass}
              >
                <Select
                  options={priorityList}
                  defaultValue={"P1"}
                  fieldNames={{ label: "name", value: "code" }}
                />
              </Form.Item>
              <Form.Item
                hidden={hiddenWhenNoPass}
                label={
                  <Space>
                    <span>业务来源</span>
                    <Button type="link" onClick={() => setBusinessSourceModalVisible(true)}>
                      设置
                    </Button>
                  </Space>
                }
                name={"bizSources"}
                initialValue={detail.bizSources?.map((item) => item.code)}
              >
                <Select
                  showSearch
                  mode="multiple"
                  style={{ width: "100%" }}
                  placeholder="请选择业务来源"
                  allowClear
                  fieldNames={{ label: "tagDesc", value: "code" }}
                  options={businessSourceList}
                  filterOption={(input, option) =>
                    option.tagDesc.toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Form.Item>
              <Form.Item
                hidden={hiddenWhenNoPass}
                label={
                  <Space>
                    <span>错误类型</span>
                    <Button
                      type="link"
                      onClick={() =>
                        OptimizeSettingModal({
                          detail: {
                            botNo: botNo
                          },
                          onOk: () => {
                            fetchReasonTypeList(botNo)
                          },
                          onCancel: () => {}
                        })
                      }
                    >
                      设置
                    </Button>
                  </Space>
                }
                name={"reasons"}
                initialValue={detail.reasons}
              >
                <TreeSelect
                  showSearch
                  fieldNames={{ label: "tagDesc", value: "code" }}
                  style={{ width: "100%" }}
                  dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
                  placeholder="请选择错误类型"
                  allowClear
                  multiple
                  treeDefaultExpandAll
                  treeNodeFilterProp="tagDesc"
                  treeData={reasonTypeList.map((item) => {
                    return { ...item, disabled: item.children.length > 0 }
                  })}
                />
              </Form.Item>
              <Form.Item
                label={
                  <Space style={{ height: "36px" }}>
                    <span>优化方向</span>
                  </Space>
                }
                name={"options"}
                rules={[{ required: !hiddenWhenNoPass, message: "请选择优化方向" }]}
                hidden={hiddenWhenNoPass}
              >
                <Checkbox.Group
                  options={optionList.map((item) => {
                    return { label: item.name, value: item.code }
                  })}
                />
              </Form.Item>
            </div>
            <Form.Item
              label="受理人"
              name={"processors"}
              rules={[{ required: !hiddenWhenNoPass, message: "请选择受理人" }]}
              hidden={hiddenWhenNoPass}
            >
              <Select
                mode="multiple"
                options={userList}
                fieldNames={{ label: "name", value: "username" }}
                filterOption={(input, option) => {
                  const result =
                    option.name.toLowerCase().includes(input.toLowerCase()) ||
                    option.username.toLowerCase().includes(input.toLowerCase())
                  return result
                }}
                showSearch
              />
            </Form.Item>
            {detail.optimizeAdvice && (
              <div className="mb-4">
                <OptimizeAdvicePanel optimizeAdvice={detail.optimizeAdvice} />
              </div>
            )}

            <Form.Item label="备注" name={"remark"}>
              <Input.TextArea disabled={false} placeholder="请输入" className="w-full" rows={4} />
            </Form.Item>

            <Form.Item label="备注图片" name={"remarkUrls"}>
              <ImageUploadForCommon
                readonly={isImageUploadReadonly}
                value={detail.remarkUrls || []}
                maxCount={5}
                onChange={(urls) => {
                  form.setFieldsValue({ remarkUrls: urls })
                }}
              />
            </Form.Item>
          </Form>
        )}

        {detail.operationLogs?.length > 0 && (
          <HistoryRecords detail={detail} historyList={detail.operationLogs} />
        )}
      </div>
      {panelStatus === "canEdit" ? (
        <CanEditFooterButtons
          isEditing={isEditing}
          onCancel={() => setVisible(false)}
          onOK={() => {
            if (isEditing) {
              handleUpdateOptimizationOrder()
            } else {
              setIsEditing(true)
            }
          }}
        />
      ) : (
        <FooterButtons onCancel={() => setVisible(false)} onOK={handleCreateOptimizationOrder} />
      )}

      <BusinessSourceModal
        visible={businessSourceModalVisible}
        detail={{
          botNo: botNo
        }}
        onOk={async (fields) => {
          setBusinessSourceModalVisible(false)
          fetchBusinessSourceList(botNo)
        }}
        onCancel={() => setBusinessSourceModalVisible(false)}
      />
    </div>
  )
}

export function InfoItem({
  label,
  value,
  tooltip = "",
  style = {},
  maxWidth = "300px",
  copyable = false
}) {
  return (
    <Space direction="vertical" size={4} style={{ ...style, width: "100%", lineHeight: "20px" }}>
      <Space>
        <Text type="secondary" style={{ fontSize: "14px", color: "#475467" }}>
          {label}
        </Text>
        {tooltip && (
          <Tooltip title={tooltip}>
            <InfoCircleOutlined style={{ color: "rgba(152, 162, 179, 1)", fontSize: "14px" }} />
          </Tooltip>
        )}
        {copyable && (
          <CopyOutlined
            onClick={() => {
              copy(value)
              message.success("复制成功")
            }}
            className="cursor-pointer"
          />
        )}
      </Space>
      <Space>
        <Tooltip title={value || "- -"} placement="topLeft" overlayStyle={{ maxWidth: "50%" }}>
          <Text
            style={{
              fontSize: "14px",
              color: "#181B25",
              maxWidth,
              display: "inline-block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
          >
            {value || "- -"}
          </Text>
        </Tooltip>
      </Space>
    </Space>
  )
}

function CanEditFooterButtons({ onCancel, onOK, isEditing }) {
  return (
    <div className="flex justify-end fixed" style={{ bottom: 16, right: 24 }}>
      <div className="mr-4">
        <Button type="default" className="btn-cancel" onClick={onCancel}>
          取消
        </Button>
      </div>
      <div>
        {isEditing ? (
          <Button type="primary" className="btn-cancel" onClick={onOK}>
            保存
          </Button>
        ) : (
          <Popconfirm title="【修改】将可能导致优化单审核时间顺延" onConfirm={onOK}>
            <Button type="primary" className="btn-submit">
              修改
            </Button>
          </Popconfirm>
        )}
      </div>
    </div>
  )
}

function FooterButtons({ onCancel, onOK }) {
  return (
    <div className="flex justify-end fixed" style={{ bottom: 16, right: 24 }}>
      <div className="mr-4">
        <Button type="default" className="btn-cancel" onClick={onCancel}>
          取消
        </Button>
      </div>
      <div>
        <Button type="primary" className="btn-submit" onClick={onOK}>
          保存
        </Button>
      </div>
    </div>
  )
}

function OptimizeAdvicePanel({ optimizeAdvice }) {
  return (
    <div className="p-4 bg-[#F5F7FA] rounded-lg optimize-advice-panel">
      <div className="text-lg mb-2 ai-optimize-advice-h">智能优化建议</div>
      <MarkdownRenderer content={optimizeAdvice} isLoading={false} />
    </div>
  )
}
