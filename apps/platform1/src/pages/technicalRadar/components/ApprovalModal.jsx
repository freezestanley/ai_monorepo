import { useState } from "react"
import { Modal, Button, Typography, Form, Input } from "antd"
import { LinkOutlined } from "@ant-design/icons"
import { useFetchTechnicalRadarDetailApi } from "@/api/technicalRadar"

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

export const ApprovalModal = ({ visible, onCancel, onApprove, onReject, detailData }) => {
  const [rejectModalVisible, setRejectModalVisible] = useState(false)
  const [rejectForm] = Form.useForm()
  const { data, isLoading } = useFetchTechnicalRadarDetailApi(detailData?.technologyNo ?? "")

  // if (!data) return null

  // 不通过
  const handleRejectClick = () => {
    setRejectModalVisible(true)
  }

  // 不通过原因提交
  const handleRejectSubmit = () => {
    rejectForm.validateFields().then((values) => {
      onReject({ ...data, rejectReason: values.reason })
      setRejectModalVisible(false)
      rejectForm.resetFields()
    })
  }

  // 不通过原因取消
  const handleRejectCancel = () => {
    setRejectModalVisible(false)
    rejectForm.resetFields()
  }

  return (
    <>
      <Modal
        title={<span style={{ fontWeight: "bold", fontSize: "20px" }}>技术审批</span>}
        open={visible}
        loading={isLoading}
        onCancel={onCancel}
        width={800}
        footer={
          <div>
            <Button key="cancel" onClick={onCancel} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button
              key="reject"
              danger
              onClick={handleRejectClick}
              style={{ marginRight: 8, color: "#ff4d4f", borderColor: "#ff4d4f" }}
            >
              不通过
            </Button>
            <Button
              key="approve"
              type="default"
              style={{ color: "#52c41a", borderColor: "#52c41a" }}
              onClick={() => onApprove(data)}
            >
              通过
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-6 py-4">
          <div>
            <Title level={5} className="mb-4">
              基础信息
            </Title>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <span className="font-medium mr-2 text-gray-600">技术名称:</span>
                <span>{data?.name ?? "--"}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium mr-2 text-gray-600">技术定位:</span>
                <span>{data?.ringKeyName ?? "--"}</span>
              </div>
              <div className="flex items-center col-span-2">
                <span className="font-medium mr-2 text-gray-600">技术类型:</span>
                <span>{data?.quadrantKeyName ?? "--"}</span>
              </div>
            </div>
          </div>

          <div>
            <Title level={5} className="mb-2">
              技术详情
            </Title>
            <div className="border border-gray-200 rounded-lg p-4 h-auto overflow-y-auto bg-gray-50 text-sm leading-relaxed">
              <>
                <Paragraph>{data?.introduction || "--"}</Paragraph>
                <Paragraph>
                  <Text strong>基本特点</Text>
                  <br />
                  {data?.features ?? "--"}
                </Paragraph>
                <Paragraph>
                  <Text strong>主要应用场景</Text>
                  <br />
                  {data?.appScenarios ?? "--"}
                </Paragraph>
                <Paragraph>
                  <Text strong>技术特性</Text>
                  <br />
                  {data?.technicalScenarios ?? "--"}
                </Paragraph>
              </>
            </div>
          </div>

          <div>
            <Title level={5} className="mb-2">
              相关资源
            </Title>
            <div className="flex flex-col gap-2">
              {Array.isArray(data?.resourcesList) &&
                data.resourcesList?.length > 0 &&
                data.resourcesList.map((item) => (
                  <a
                    key={item?.resourcesNo}
                    href={item?.resourcesUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-500 hover:text-blue-600 w-fit"
                  >
                    <LinkOutlined className="mr-1" />
                    {item?.name ?? "--"}
                  </a>
                ))}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        title={<span style={{ fontWeight: "bold", fontSize: "18px" }}>不通过原因</span>}
        open={rejectModalVisible}
        onOk={handleRejectSubmit}
        onCancel={handleRejectCancel}
        okText="确定"
        cancelText="取消"
        width={500}
        okButtonProps={{ style: { backgroundColor: "#722ed1", borderColor: "#722ed1" } }}
      >
        <div className="mt-4">
          <Form form={rejectForm} layout="vertical">
            <Form.Item name="reason" rules={[{ required: true, message: "请输入不通过原因" }]}>
              <TextArea rows={4} placeholder="请输入不通过原因" maxLength={200} showCount />
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </>
  )
}

export default ApprovalModal
