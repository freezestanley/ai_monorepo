import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export const useMainLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const selectedKey = location.pathname.split('/')[1] || 'news-list'

  const handleMenuClick = (key: string) => {
    navigate(`/${key}`)
  }

  return { collapsed, setCollapsed, selectedKey, handleMenuClick }
}
