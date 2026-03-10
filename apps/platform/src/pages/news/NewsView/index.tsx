import React from 'react'
import { Card, Button, Typography, Tag, Image, Divider, Spin, Empty, Row, Col } from 'antd'
import { ArrowLeftOutlined, CalendarOutlined, UserOutlined, TagOutlined } from '@ant-design/icons'
import { NEWS_STATUS } from '@/constants'
import { useNewsView } from './hooks/useNewsView'
import './styles.scss'

const { Title, Paragraph, Text } = Typography

const statusConfig: Record<string, { color: string; text: string }> = {
  [NEWS_STATUS.WAIT]: { color: 'orange', text: '待发布' },
  [NEWS_STATUS.PUBLISH]: { color: 'green', text: '已发布' },
  [NEWS_STATUS.DOWN]: { color: 'blue', text: '已下线' },
}

const getStatusTag = (status: string) => {
  const config = statusConfig[status] || { color: 'default', text: '未知' }
  return <Tag color={config.color}>{config.text}</Tag>
}

const NewsView: React.FC = () => {
  const { loading, data, handleBack } = useNewsView()

  if (loading) {
    return (
      <div className="news-view-page">
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Spin size="large" tip="加载中..." />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="news-view-page">
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Empty description="未找到新闻详情">
            <Button type="primary" onClick={handleBack}>
              返回列表
            </Button>
          </Empty>
        </div>
      </div>
    )
  }

  return (
    <div className="news-view-page">
      <div className="page-header">
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={handleBack}>
          返回列表
        </Button>
      </div>

      <Card>
        <div className="content-wrapper">
          <div className="info-section">
            <Title level={3}>{data.title}</Title>

            <div className="meta-info">
              <Row gutter={[16, 8]}>
                <Col>
                  <TagOutlined style={{ marginRight: 6, color: '#8c8c8c' }} />
                  <Tag color="blue">{data.categoryName || '未分类'}</Tag>
                </Col>
                <Col>
                  {getStatusTag(data.publishState)}
                </Col>
                {data.publishTime && (
                  <Col>
                    <CalendarOutlined style={{ marginRight: 6, color: '#8c8c8c' }} />
                    <Text type="secondary">{data.publishTime}</Text>
                  </Col>
                )}
                <Col>
                  <UserOutlined style={{ marginRight: 6, color: '#8c8c8c' }} />
                  <Text type="secondary">{data.creator}</Text>
                </Col>
              </Row>
            </div>

            {data.summary && (
              <div className="summary-section">
                <Divider orientation="left">摘要</Divider>
                <Paragraph>{data.summary}</Paragraph>
              </div>
            )}
          </div>

          {data.cover && (
            <div className="cover-section">
              <Divider orientation="left">封面</Divider>
              <Image
                src={data.cover}
                alt={data.title}
                style={{ maxWidth: '100%', borderRadius: 8 }}
                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QY9KN0jD0R9TxCAotSGBzQN4BKIkVSC5JyWpKd0P0IgiDLCyEWEGMPlksuMjp0AHG1A1D9QBbjcfACIVL0khSA3QTgbI+OJgB4bSE8hIQOx3UGBmYOBBcUQR0FZM8PY/hGGFj8YGBgYYRBYlFiXAGIGiM4CcKAL0AAGPB8hCEKcCoRjJBSNRUC6D4jRI0Uy4kYGRgYLjEwMEypTEtIxEzBwMzBwMDAx8LAsPr//x8AAwbI4e0Ls6QAAAAASUVORK5CYII="
              />
            </div>
          )}

          {data.content && (
            <div className="content-section">
              <Divider orientation="left">正文</Divider>
              <div
                className="content-body"
                dangerouslySetInnerHTML={{ __html: data.content }}
              />
            </div>
          )}

          <Divider />

          <Row gutter={[16, 8]}>
            <Col>
              <Text type="secondary">创建时间: {data.gmtCreated}</Text>
            </Col>
            <Col>
              <Text type="secondary">更新时间: {data.gmtModified}</Text>
            </Col>
          </Row>
        </div>
      </Card>
    </div>
  )
}

export default NewsView
