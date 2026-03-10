import React from 'react'
import { Card, Typography, Input, Tag, Space, Spin, Empty, Pagination } from 'antd'
import { FileImageOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useNewsList } from './hooks/useNewsList'
import type { NewsItem } from './types'
import './styles.scss'

const { Title } = Typography
const { Search } = Input

const NewsList: React.FC = () => {
  const navigate = useNavigate()
  const { loading, dataSource, pagination, handleSearch, handlePageChange } = useNewsList()

  const handleCardClick = (newsNo: string) => {
    navigate(`/news/${newsNo}`)
  }

  const renderCover = (item: NewsItem) => {
    if (item.cover) {
      return (
        <div className="news-cover">
          <img src={item.cover} alt={item.title} />
        </div>
      )
    }
    return (
      <div className="news-cover">
        <div className="no-cover">
          <FileImageOutlined />
        </div>
      </div>
    )
  }

  const renderNewsCard = (item: NewsItem) => (
    <Card
      key={item.newsNo}
      className="news-card-item"
      hoverable
      onClick={() => handleCardClick(item.newsNo)}
    >
      <div className="news-card-content">
        {renderCover(item)}
        <div className="news-info">
          <div>
            <div className="news-title">{item.title}</div>
            <div className="news-summary">{item.summary || '暂无摘要'}</div>
          </div>
          <div className="news-meta">
            <Space size={16}>
              <Tag color="blue">{item.categoryName || '未分类'}</Tag>
              {item.publishTime && (
                <span>
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  {item.publishTime}
                </span>
              )}
              <span>
                <UserOutlined style={{ marginRight: 4 }} />
                {item.creator}
              </span>
            </Space>
          </div>
        </div>
      </div>
    </Card>
  )

  const renderContent = () => {
    if (loading) {
      return (
        <div className="empty-wrapper">
          <Spin size="large" tip="加载中..." />
        </div>
      )
    }

    if (dataSource.length === 0) {
      return (
        <div className="empty-wrapper">
          <Empty description="暂无新闻资讯" />
        </div>
      )
    }

    return (
      <>
        <div className="news-card-list">
          {dataSource.map((item) => renderNewsCard(item))}
        </div>
        {pagination.total > pagination.pageSize && (
          <div className="pagination-wrapper">
            <Pagination
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={pagination.total}
              showSizeChanger
              showQuickJumper
              showTotal={(total) => `共 ${total} 条`}
              onChange={handlePageChange}
            />
          </div>
        )}
      </>
    )
  }

  return (
    <div className="news-list-page">
      <div className="page-header">
        <Title level={4}>新闻资讯</Title>
        <Search
          placeholder="搜索新闻标题"
          allowClear
          onSearch={handleSearch}
          style={{ width: 300 }}
        />
      </div>
      {renderContent()}
    </div>
  )
}

export default NewsList
