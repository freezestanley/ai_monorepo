import useRouter from "../../hooks/useRouter"
import { LeftOutlined } from '@ant-design/icons'
import { Space } from 'antd'

interface IProps {
  url?: string
  title?: string
  rightSection?: any
  onClick?: () => void
}
const BackNav = ({ url = '', title = '返回', rightSection = '', onClick }: IProps) => {
  const { navigatePush } = useRouter()

  const handleBack = () => {
    if (onClick) {
      onClick()
      return
    }
    navigatePush(url)
  }
  return (
    <header>
      <Space
        style={{
          justifyContent: 'space-between',
          width: '100%',
          border: '1px solid #f0f0f0',
          borderLeft: 'none',
          borderRight: 'none',
          backgroundColor: '#f7f8fa',
          padding: '24px 20px',
          borderRadius: 10
        }}
      >
        <Space onClick={handleBack} className="cursor-pointer">
          {(onClick || url) && <LeftOutlined />}
          <h2 style={{ fontSize: '20px' }}>{title}</h2>
        </Space>
        {rightSection}
      </Space>
    </header>
  )
}

export default BackNav
