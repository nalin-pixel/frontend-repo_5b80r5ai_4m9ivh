import React from 'react'
import Hero from './components/Hero'
import Showcase from './components/Showcase'

function App() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Hero />
      <Showcase />

      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="text-sm text-slate-500">Built with React, Framer Motion, Tailwind, and Spline. Carefully tuned springs for Apple‑quality feel.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
