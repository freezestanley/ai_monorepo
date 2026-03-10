import {
  Card,
  Table,
  Button,
  Input,
  Typography,
  Space,
  Divider,
  Empty,
  Skeleton,
  Spin,
} from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useNewsDetail } from './hooks/useNewsDetail'
import './styles.scss'

const { Title } = Typography
const { Search } = Input

const NewsDetail = () => {
  const {
    // 数据状态
    loading,
    dataSource,
    pagination,

    // 配置项
    columns,

    // 处理函数
    handleSearch,
    handleTableChange,
    handleAdd,
  } = useNewsDetail()

  const renderEmptyState = () => (
    <div className="empty-state">
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        imageStyle={{ height: 100 }}
        description={
          <div className="empty-description">
            <p style={{ margin: 0, fontSize: '16px', fontWeight: 500, color: '#8c8c8c' }}>
              暂无新闻数据
            </p>
            <p style={{ margin: '8px 0 16px', fontSize: '14px', color: '#bfbfbf' }}>
              还没有发布任何新闻内容
            </p>
            <Button type="primary" onClick={handleAdd} size="large">
              创建第一条新闻
            </Button>
          </div>
        }
      />
    </div>
  )

  const renderTableSkeleton = () => (
    <div className="table-skeleton">
      <Skeleton active paragraph={{ rows: 8 }} />
      <div style={{ marginTop: 16 }}>
        <Skeleton.Button active size="small" style={{ marginRight: 8 }} />
        <Skeleton.Button active size="small" style={{ marginRight: 8 }} />
        <Skeleton.Button active size="small" />
      </div>
    </div>
  )

  return (
    <div className="news-detail-page">
      <Card className="page-card">
        {/* 页面头部 */}
        <div className="page-header">
          <div className="header-left">
            <Title level={3} className="page-title">
              消息中心
            </Title>
            <span className="page-description">管理和发布新闻内容</span>
          </div>

          <div className="header-actions">
            <Space size="middle">
              <Search
                placeholder="搜索标题..."
                allowClear
                style={{ width: 320 }}
                onSearch={handleSearch}
                enterButton={
                  <Button type="primary" icon={<SearchOutlined />}>
                    搜索
                  </Button>
                }
                className="search-input"
              />

              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={handleAdd}
                className="add-btn"
              >
                新增新闻
              </Button>
            </Space>
          </div>
        </div>

        <Divider className="header-divider" />

        {/* 数据表格 */}
        <div className="table-container">
          <Spin spinning={loading} size="large" tip="加载中...">
            {loading && dataSource.length === 0 ? (
              renderTableSkeleton()
            ) : (
              <Table
                columns={columns}
                dataSource={dataSource}
                loading={false}
                rowKey="id"
                pagination={{
                  ...pagination,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total: number, range: [number, number]) =>
                    `共 ${total} 条记录，当前显示第 ${range[0]}-${range[1]} 条`,
                  pageSizeOptions: ['10', '20', '50', '100'],
                  className: 'table-pagination',
                }}
                onChange={handleTableChange}
                scroll={{ x: 1500 }}
                locale={{ emptyText: renderEmptyState() }}
                className="data-table"
                size="middle"
              />
            )}
          </Spin>
        </div>
      </Card>
    </div>
  )
}

export default NewsDetail
