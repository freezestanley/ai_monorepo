import { useState } from 'react'
import { Header } from './components/Header'
import { Dashboard } from './components/Dashboard'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header title="Admin Dashboard" />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-4xl font-bold mb-4">Welcome to the Admin Dashboard</h1>
        <p className="text-lg mb-8">Manage your platform efficiently</p>

        <div className="p-8 bg-gray-800 rounded-xl mb-8">
          <button
            onClick={() => setCount((count) => count + 1)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            Count is {count}
          </button>
        </div>

        <Dashboard />
      </div>
    </div>
  )
}

export default App