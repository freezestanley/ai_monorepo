export interface MenuItem {
  key: string
  label: string
  icon?: React.ReactNode
  children?: MenuItem[]
}

export interface MainLayoutProps {
  className?: string
}
