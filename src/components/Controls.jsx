import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import StateBadge from './StateBadge'

const STATES = [
  'idle',
  'listening',
  'thinking',
  'speaking',
  'success',
  'error',
  'loading',
  'sleeping',
  'mouse',
  'attention',
  'prompt',
  'bounce',
]

const Controls = ({ state, setState }) => {
  const [auto, setAuto] = useState(true)

  useEffect(() => {
    if (!auto) return
    const seq = ['idle','listening','thinking','speaking','success','error','loading','sleeping','mouse','attention','prompt','bounce']
    let i = 0
    const id = setInterval(() => {
      setState(seq[i % seq.length])
      i++
    }, 2400)
    return () => clearInterval(id)
  }, [auto, setState])

  return (
    <div className="mx-auto mt-6 w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATES.map(s => (
            <button
              key={s}
              onClick={() => { setState(s); setAuto(false) }}
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                state === s ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={auto} onChange={e => setAuto(e.target.checked)} />
          auto cycle
        </label>
      </div>
    </div>
  )
}

export default Controls
