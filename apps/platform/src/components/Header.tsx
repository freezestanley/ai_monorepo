interface HeaderProps {
  title: string
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="bg-gray-100 py-4 px-8 border-b border-gray-200">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        <nav>
          <ul className="flex space-x-6">
            <li><a href="/" className="text-gray-600 hover:text-blue-600 transition-colors">Home</a></li>
            <li><a href="/about" className="text-gray-600 hover:text-blue-600 transition-colors">About</a></li>
            <li><a href="/contact" className="text-gray-600 hover:text-blue-600 transition-colors">Contact</a></li>
          </ul>
        </nav>
      </div>
    </header>
  )
}