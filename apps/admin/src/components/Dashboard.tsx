import { useState } from 'react'

export const Dashboard = () => {
  const [stats] = useState([
    { name: 'Total Users', value: '12,402' },
    { name: 'Active Sessions', value: '1,284' },
    { name: 'Revenue', value: '$24,569' },
  ])

  return (
    <section className="mt-8">
      <h2 className="text-2xl font-semibold mb-6">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-gray-800 p-6 rounded-xl text-center">
            <h3 className="text-gray-400 text-sm font-medium mb-2">{stat.name}</h3>
            <p className="text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>
    </section>
  )
}