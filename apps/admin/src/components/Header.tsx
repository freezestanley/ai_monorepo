interface HeaderProps {
  title: string
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="bg-gray-800 py-4 px-8 border-b border-gray-700">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{title}</h1>
        <nav>
          <ul className="flex space-x-6">
            <li><a href="/" className="text-gray-300 hover:text-white transition-colors">Home</a></li>
            <li><a href="/users" className="text-gray-300 hover:text-white transition-colors">Users</a></li>
            <li><a href="/settings" className="text-gray-300 hover:text-white transition-colors">Settings</a></li>
          </ul>
        </nav>
      </div>
    </header>
  )
}