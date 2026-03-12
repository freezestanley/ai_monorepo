import React, { useState, useEffect } from "react"
import {
  Card,
  Button,
  Space,
  Typography,
  Tag,
  Image,
  Divider,
  Spin,
  message,
  Breadcrumb,
  Row,
  Col
} from "antd"
import {
  ArrowLeftOutlined,
  EditOutlined,
  CalendarOutlined,
  UserOutlined,
  TagOutlined
} from "@ant-design/icons"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { InfoAPI, InfoTypeAPI } from "../../api"
import "./styles.scss"

const { Title, Paragraph, Text } = Typography

const InfoView = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [typeList, setTypeList] = useState([])

  // 获取消息类别列表
  const fetchTypeList = async () => {
    try {
      const response = await InfoTypeAPI.getList({ pageSize: 1000 })
      if (response.success) {
        setTypeList(response.data.list || [])
      }
    } catch (error) {
      console.error("获取类别列表失败:", error)
    }
  }

  // 获取消息详情
  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await InfoAPI.getDetail(id)

      if (response.success) {
        setData(response.data)
      } else {
        message.error("获取消息详情失败")
        navigate("/infocenter/detail")
      }
    } catch (error) {
      message.error("获取消息详情失败")
      navigate("/infocenter/detail")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTypeList()
  }, [])

  useEffect(() => {
    if (id && id !== "new") {
      fetchData()
    } else {
      // 从路由状态中获取数据（从列表页传递过来的）
      if (location.state?.record) {
        setData(location.state.record)
      } else {
        navigate("/infocenter/detail")
      }
    }
  }, [id])

  // 返回列表
  const handleBack = () => {
    navigate("/news-list")
  }

  // 编辑
  const handleEdit = () => {
    navigate(`/infocenter/edit/${id}`, {
      state: { record: data, mode: "edit" }
    })
  }

  // 获取状态标签
  const getStatusTag = (status) => {
    const statusMap = {
      0: { color: "default", text: "草稿" },
      1: { color: "success", text: "已发布" },
      2: { color: "warning", text: "待审核" },
      3: { color: "error", text: "已下线" }
    }
    const config = statusMap[status] || statusMap[0]
    return <Tag color={config.color}>{config.text}</Tag>
  }

  // 获取类别名称
  const getTypeName = (typeId) => {
    const type = typeList.find((item) => item.id === typeId)
    return type ? type.name : "未知类别"
  }

  if (loading) {
    return (
      <div className="info-view-page">
        <Card>
          <div style={{ textAlign: "center", padding: "50px 0" }}>
            <Spin size="large" />
          </div>
        </Card>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="info-view-page">
        <Card>
          <div style={{ textAlign: "center", padding: "50px 0" }}>
            <Text type="secondary">消息不存在或已被删除</Text>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="info-view-page">
      <Card>
        <div className="page-header">
          <Breadcrumb className="vhcenter">
            <Breadcrumb.Item>消息详情</Breadcrumb.Item>
            <Breadcrumb.Item>
              <Button
                type="link"
                // icon={<ArrowLeftOutlined />}
                onClick={handleBack}
                style={{ padding: 0 }}
              >
                返回列表
              </Button>
            </Breadcrumb.Item>
          </Breadcrumb>

          <Space>
            <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
              编辑
            </Button>
          </Space>
        </div>

        <div className="content-wrapper">
          {/* 基础信息 */}
          <div className="info-section">
            <Title level={3}>{data.title}</Title>

            <div className="meta-info">
              <Row gutter={[16, 8]}>
                <Col>
                  <Space>
                    <TagOutlined />
                    <Text type="secondary">类别：</Text>
                    <Tag color="blue">{getTypeName(data.typeId)}</Tag>
                  </Space>
                </Col>
                <Col>
                  <Space>
                    <Text type="secondary">状态：</Text>
                    {getStatusTag(data.status)}
                  </Space>
                </Col>
                <Col>
                  <Space>
                    <CalendarOutlined />
                    <Text type="secondary">创建时间：</Text>
                    <Text>{data.createTime}</Text>
                  </Space>
                </Col>
                {data.updateTime && (
                  <Col>
                    <Space>
                      <CalendarOutlined />
                      <Text type="secondary">更新时间：</Text>
                      <Text>{data.updateTime}</Text>
                    </Space>
                  </Col>
                )}
                {data.author && (
                  <Col>
                    <Space>
                      <UserOutlined />
                      <Text type="secondary">作者：</Text>
                      <Text>{data.author}</Text>
                    </Space>
                  </Col>
                )}
              </Row>
            </div>

            {/* 摘要 */}
            {data.summary && (
              <div className="summary-section">
                <Text type="secondary" strong>
                  摘要：
                </Text>
                <Paragraph style={{ marginTop: 8 }}>{data.summary}</Paragraph>
              </div>
            )}

            <Divider />
          </div>

          {/* 封面图 */}
          {data.coverImage && (
            <div className="cover-section">
              <Text type="secondary" strong>
                封面图：
              </Text>
              <div style={{ marginTop: 8 }}>
                <Image
                  src={data.coverImage}
                  alt="封面图"
                  style={{ maxWidth: "100%", maxHeight: 300 }}
                  fallback="/placeholder-image.png"
                />
              </div>
              <Divider />
            </div>
          )}

          {/* 正文内容 */}
          <div className="content-section">
            <Text type="secondary" strong>
              正文内容：
            </Text>
            <div
              className="content-body"
              dangerouslySetInnerHTML={{ __html: data.content || "暂无内容" }}
            />
          </div>

          {/* 附件信息 */}
          {data.attachments && data.attachments.length > 0 && (
            <>
              <Divider />
              <div className="attachments-section">
                <Text type="secondary" strong>
                  附件：
                </Text>
                <div style={{ marginTop: 8 }}>
                  {data.attachments.map((file, index) => (
                    <div key={index} className="attachment-item">
                      <a href={file.url} target="_blank" rel="noopener noreferrer">
                        {file.name}
                      </a>
                      <Text type="secondary" style={{ marginLeft: 8 }}>
                        ({file.size})
                      </Text>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}

export default InfoView
