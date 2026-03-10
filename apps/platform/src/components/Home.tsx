import { useState } from 'react'

export const Home = () => {
  const [features] = useState([
    { title: 'Easy to Use', desc: 'Simple and intuitive interface' },
    { title: 'Fast Performance', desc: 'Optimized for speed and efficiency' },
    { title: 'Secure', desc: 'Enterprise-grade security' },
  ])

  return (
    <section className="mt-8">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Platform Features</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
            <h3 className="text-lg font-medium text-gray-800 mb-2">{feature.title}</h3>
            <p className="text-gray-600">{feature.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}