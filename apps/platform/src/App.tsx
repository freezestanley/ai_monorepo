import { useState } from 'react'
import { Header } from './components/Header'
import { Home } from './components/Home'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header title="Platform App" />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-4xl font-bold mb-4 text-gray-800">Welcome to the Platform</h1>
        <p className="text-lg mb-8 text-gray-600">Your user-friendly experience starts here</p>

        <div className="p-8 bg-white rounded-xl mb-8 shadow-md">
          <button
            onClick={() => setCount((count) => count + 1)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Count is {count}
          </button>
        </div>

        <Home />
      </div>
    </div>
  )
}

export default App