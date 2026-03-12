import { useEffect, useMemo } from "react"
import {
  Modal,
  Empty,
  Form,
  Col,
  Row,
  Input,
  InputNumber,
  Divider,
  Button,
  Typography,
  Popconfirm
} from "antd"
import classNames from "classnames"
import { InfoCircleFilled } from "@ant-design/icons"
import empty from "@/assets/img/empty.png"
import {
  useFetchPublishGrayscale,
  useFetchPublishGrayscaleStop,
  useFetchPublishGrayPlan
} from "@/api/versionRelease"
import { convertToChineseNumber } from "@/utils"
import styles from "./index.module.less"

const GrayscaleDeployModal = ({ data, botNo, parentOrigin, visible, onCancel, isRead }) => {
  const [form] = Form.useForm()
  const { mutate: fetchPublishGrayscale, isLoading: isPublishGrayscaleLoading } =
    useFetchPublishGrayscale()
  const { mutate: fetchPublishGrayscaleStop, isLoading: isPublishGrayscaleStopLoading } =
    useFetchPublishGrayscaleStop()
  const { data: grayPlan } = useFetchPublishGrayPlan(
    {
      publishOrderId: data?.publishOrderId
    },
    {
      enabled: !!(data?.publishOrderId && visible)
    }
  )

  const isGray = useMemo(
    () => data?.currentNode === "PRD_GRAYSCALE_DEPLOY" && !isRead,
    [data?.currentNode, isRead]
  )

  useEffect(() => {
    if (!visible) {
      form.resetFields()
    }
  }, [visible, form])

  const onsubmit = async () => {
    const values = await form.validateFields()
    Modal.confirm({
      title: "确认开始验证计划？",
      content: "若存在先序验证计划，将自动终止",
      icon: <InfoCircleFilled className="text-[#7F56D9]" />,
      okText: "确认",
      cancelText: "取消",
      okButtonProps: {
        loading: isPublishGrayscaleLoading
      },
      onOk: () => {
        fetchPublishGrayscale({
          publishOrderId: data?.publishOrderId,
          planConfig: values
        })
      }
    })
  }

  return (
    <Modal
      title="PRD灰度验证"
      open={visible}
      onCancel={onCancel}
      width={720}
      okText="开始验证"
      onOk={onsubmit}
      okButtonProps={{
        style: !isGray ? { display: "none" } : {}
      }}
    >
      {isGray && (
        <>
          <h1 className="text-[#181B25] text-[16px] font-[500] mb-[16px]">
            验证计划
            <span className="text-[#181B25] text-[14px] font-[400]">（占比总和为100%）</span>
          </h1>
          <Form layout="vertical" form={form}>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  label="对照组"
                  name={["compareGroup", "groupName"]}
                  initialValue={`生产环境${Date.now()}`}
                >
                  <Input
                    className={styles.input}
                    disabled
                    addonAfter={
                      <Form.Item
                        name={["compareGroup", "percentage"]}
                        initialValue={50}
                        rules={[
                          {
                            required: true,
                            message: "请输入"
                          },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              const percent2 = getFieldValue(["targetGroup", "percentage"])
                              if (value && percent2 && value + percent2 !== 100) {
                                return Promise.reject(new Error("占比总和须为100%"))
                              }
                              if (value && percent2 && value + percent2 === 100) {
                                // 延迟执行，避免在当前验证周期中触发
                                setTimeout(() => {
                                  form.validateFields([["targetGroup", "percentage"]])
                                }, 0)
                              }
                              return Promise.resolve()
                            }
                          })
                        ]}
                      >
                        <InputNumber
                          min={1}
                          max={100}
                          precision={0}
                          formatter={(value) => `${value}%`}
                          parser={(value) => value?.replace("%", "")}
                        />
                      </Form.Item>
                    }
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="实验组"
                  name={["targetGroup", "groupName"]}
                  initialValue={`${data?.publishOrderName || ""}${Date.now()}`}
                >
                  <Input
                    className={classNames(styles.input, styles.lastInput)}
                    disabled
                    addonAfter={
                      <Form.Item
                        name={["targetGroup", "percentage"]}
                        initialValue={50}
                        rules={[
                          {
                            required: true,
                            message: "请输入"
                          },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              const percent1 = getFieldValue(["compareGroup", "percentage"])
                              if (value && percent1 && value + percent1 !== 100) {
                                return Promise.reject(new Error("占比总和须为100%"))
                              }
                              if (value && percent1 && value + percent1 === 100) {
                                // 延迟执行，避免在当前验证周期中触发
                                setTimeout(() => {
                                  form.validateFields([["compareGroup", "percentage"]])
                                }, 0)
                              }
                              return Promise.resolve()
                            }
                          })
                        ]}
                      >
                        <InputNumber
                          min={1}
                          max={100}
                          precision={0}
                          formatter={(value) => `${value}%`}
                          parser={(value) => value?.replace("%", "")}
                        />
                      </Form.Item>
                    }
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
          <Divider style={{ borderColor: "#D0D5DD", marginTop: 0 }} />
        </>
      )}
      <h1 className="text-[#181B25] text-[16px] font-[500] mb-[16px]">验证历史</h1>
      {!grayPlan?.data?.length ? (
        <Empty image={empty} description="暂无数据" />
      ) : (
        <>
          {grayPlan?.data?.map((item, index) => (
            <Row gutter={24} className={styles.historyItemRow} key={item.id}>
              <Col span={24} className="flex items-center justify-between mb-[4px] !mt-0">
                <h1 className="text-[#475467] text-[14px] font-[500]">
                  验证计划{convertToChineseNumber(grayPlan?.data?.length - index)}
                </h1>
                {!!(item.startTime && item.endTime) && (
                  <Button
                    className="!p-0 !h-auto border-none"
                    icon={<i className="iconfont icon-lishirizhi" />}
                    type="link"
                    onClick={() => {
                      window.open(
                        `${parentOrigin}/data/call/logs?botNo=${botNo}&workbenchNo=dataStatistic&startTime=${encodeURIComponent(item.startTime)}&endTime=${encodeURIComponent(item.endTime)}`,
                        "_blank"
                      )
                    }}
                  >
                    调用日志
                  </Button>
                )}
              </Col>
              <Col span={8}>
                <h1 className="text-[#475467] mb-[4px]">开始时间</h1>
                <Typography.Paragraph
                  ellipsis={{ rows: 1, tooltip: item.startTime }}
                  className="text-[#181B25]"
                >
                  {item.startTime}
                </Typography.Paragraph>
              </Col>
              <Col span={8}>
                <h1 className="text-[#475467] mb-[4px]">结束时间</h1>
                {item.status === 1 && isGray ? (
                  <Popconfirm
                    title="确认结束验证？"
                    loading={isPublishGrayscaleStopLoading}
                    onConfirm={() =>
                      fetchPublishGrayscaleStop({
                        targetType: "BOT",
                        targetId: botNo,
                        publishOrderId: data?.publishOrderId,
                        planId: item?.id
                      })
                    }
                  >
                    <Button className="!p-0 !h-auto border-none" type="link">
                      结束验证
                    </Button>
                  </Popconfirm>
                ) : (
                  <Typography.Paragraph
                    ellipsis={{ rows: 1, tooltip: item.endTime }}
                    className="text-[#181B25]"
                  >
                    {item.endTime || "-"}
                  </Typography.Paragraph>
                )}
              </Col>
              <Col span={8}>
                <h1 className="text-[#475467] mb-[4px]">操作人</h1>
                <Typography.Paragraph
                  ellipsis={{ rows: 1, tooltip: item.modifier }}
                  className="text-[#181B25]"
                >
                  {item.modifier}
                </Typography.Paragraph>
              </Col>
              <Col span={8}>
                <h1 className="text-[#475467] mb-[4px]">
                  对照组（{item.planConfig?.compareGroup?.percentage ?? 0}%）
                </h1>
                <Typography.Paragraph
                  ellipsis={{ rows: 1, tooltip: item.planConfig?.compareGroup?.groupName }}
                  className="text-[#181B25]"
                >
                  {item.planConfig?.compareGroup?.groupName}
                </Typography.Paragraph>
              </Col>
              <Col span={8}>
                <h1 className="text-[#475467] mb-[4px]">
                  实验组（{item.planConfig?.targetGroup?.percentage ?? 0}%）
                </h1>
                <Typography.Paragraph
                  ellipsis={{ rows: 1, tooltip: item.planConfig?.targetGroup?.groupName }}
                  className="text-[#181B25]"
                >
                  {item.planConfig?.targetGroup?.groupName}
                </Typography.Paragraph>
              </Col>
            </Row>
          ))}
        </>
      )}
    </Modal>
  )
}

export default GrayscaleDeployModal
