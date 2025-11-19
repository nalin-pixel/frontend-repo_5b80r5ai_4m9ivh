import React, { useState } from 'react'
import { motion } from 'framer-motion'
import CopilotFace from './CopilotFace'
import Controls from './Controls'

const Showcase = () => {
  const [state, setState] = useState('idle')

  return (
    <section className="relative w-full bg-white py-14">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">States</h2>
          <p className="text-sm text-slate-500">12 expressive modes with human micro‑behaviors</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <CopilotFace state={state} />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <h3 className="mb-2 text-lg font-medium text-slate-900">Behavior Details</h3>
            <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
              <li>Humanized: variable timing, asymmetric movements, micro drift</li>
              <li>Emotion: eye shape adapts from excited to sleepy</li>
              <li>Realism: saccades, fixation pauses, natural blink patterns</li>
              <li>Polish: refined springs, smooth transitions, no distortion</li>
            </ul>

            <Controls state={state} setState={setState} />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Showcase
