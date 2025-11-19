import React, { useEffect, useMemo, useState } from 'react'
import { motion, useMotionValue, useSpring, AnimatePresence, useTransform } from 'framer-motion'

// Utility: random in range
const rand = (min, max) => Math.random() * (max - min) + min

// Eye component with rich states
const Eye = ({ x, y, blink, mood, offsetX, offsetY }) => {
  // Smooth the incoming motion values
  const pupilX = useSpring(x, { stiffness: 350, damping: 28, mass: 0.25 })
  const pupilY = useSpring(y, { stiffness: 350, damping: 28, mass: 0.25 })

  const lid = useSpring(0, { stiffness: 280, damping: 24 }) // 0 open, 1 closed

  useEffect(() => {
    if (blink) {
      lid.set(1)
      const t = setTimeout(() => lid.set(0), 120)
      return () => clearTimeout(t)
    }
  }, [blink, lid])

  // mood affects eye shape
  const moodScaleY = useMemo(() => ({
    happy: 0.85,
    excited: 0.9,
    neutral: 1,
    sleepy: 0.6,
    worried: 0.95,
  }[mood] || 1), [mood])

  // Use transform for clipPath (FM v11)
  // lid: 0 (open) -> overlay hidden; 1 (closed) -> overlay fully visible
  const clip = useTransform(lid, v => `inset(${(1 - v) * 100}% 0 0 0 round 999px)`) 

  // Combine base position + offsets
  const zero = useMotionValue(0)
  const ox = offsetX || zero
  const oy = offsetY || zero
  const cx = useTransform([pupilX, ox], ([a, b]) => a + b)
  const cy = useTransform([pupilY, oy], ([a, b]) => a + b)

  return (
    <div className="relative h-16 w-16 rounded-full bg-white shadow-inner ring-1 ring-slate-200">
      <motion.div
        className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-900"
        style={{
          x: cx,
          y: cy,
          scaleY: moodScaleY,
        }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      />
      {/* eyelid overlay */}
      <motion.div
        className="absolute inset-0 overflow-hidden rounded-full"
        style={{
          clipPath: clip,
        }}
      >
        <div className="absolute inset-0 bg-white" />
      </motion.div>
    </div>
  )
}

const VoiceWave = ({ speaking }) => {
  const bars = new Array(12).fill(0)
  return (
    <div className="flex h-10 items-end justify-center gap-1">
      {bars.map((_, i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full bg-emerald-500"
          animate={speaking ? { height: [6, rand(12, 36), 8, rand(10, 28), 6] } : { height: 6 }}
          transition={{ duration: rand(0.8, 1.4), repeat: Infinity, ease: 'easeInOut', delay: i * 0.03 }}
          style={{ boxShadow: '0 0 12px rgba(16,185,129,0.35)' }}
        />
      ))}
    </div>
  )
}

const CopilotFace = ({ state }) => {
  const [blinkFlag, setBlinkFlag] = useState(false)
  const [mood, setMood] = useState('neutral')

  // motion values for cursor tracking
  const px = useMotionValue(0)
  const py = useMotionValue(0)

  // state-based offsets (e.g., listening/attention)
  const offsetY = useMotionValue(0)

  // per-eye subtle drift
  const leftDriftX = useMotionValue(0)
  const leftDriftY = useMotionValue(0)
  const rightDriftX = useMotionValue(0)
  const rightDriftY = useMotionValue(0)

  // Blink scheduler with natural variability
  useEffect(() => {
    let mounted = true
    let tid
    const loop = () => {
      const next = rand(2000, 6000) // 2-6s
      tid = setTimeout(() => {
        if (!mounted) return
        setBlinkFlag(true)
        setTimeout(() => setBlinkFlag(false), 10)
        loop()
      }, next)
    }
    loop()
    return () => { mounted = false; if (tid) clearTimeout(tid) }
  }, [])

  // Mouse tracking with natural lag
  useEffect(() => {
    const handleMove = (e) => {
      const { innerWidth, innerHeight } = window
      const nx = (e.clientX / innerWidth - 0.5) * 18
      const ny = (e.clientY / innerHeight - 0.5) * 14
      px.set(nx)
      py.set(ny)
    }
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [px, py])

  // Eye movement patterns
  const eyeSpring = { stiffness: 260, damping: 24, mass: 0.3 }
  const thinkingX = useSpring(0, eyeSpring)
  const thinkingY = useSpring(0, eyeSpring)

  useEffect(() => {
    let timer
    if (state === 'thinking') {
      const saccade = () => {
        thinkingX.set(rand(-10, 10))
        thinkingY.set(rand(-6, 6))
        timer = setTimeout(saccade, rand(220, 600))
      }
      saccade()
    } else {
      thinkingX.set(0)
      thinkingY.set(0)
    }
    return () => { if (timer) clearTimeout(timer) }
  }, [state, thinkingX, thinkingY])

  // Speaking wave
  const speaking = state === 'speaking'

  // Compute final pupil positions depending on state via a single active source
  const finalX = useMotionValue(0)
  const finalY = useMotionValue(0)

  useEffect(() => {
    // clear previous subscriptions by recreating listeners per state
    let unsubX = () => {}
    let unsubY = () => {}

    if (state === 'thinking') {
      unsubX = thinkingX.on('change', v => finalX.set(v))
      unsubY = thinkingY.on('change', v => finalY.set(v))
    } else {
      unsubX = px.on('change', v => finalX.set(v))
      unsubY = py.on('change', v => finalY.set(v))
    }

    return () => { unsubX(); unsubY() }
  }, [state, px, py, thinkingX, thinkingY, finalX, finalY])

  // State-driven mood + offsets
  useEffect(() => {
    switch (state) {
      case 'success':
        setMood('excited')
        offsetY.set(0)
        break
      case 'prompt':
        setMood('happy')
        offsetY.set(0)
        break
      case 'error':
        setMood('worried')
        offsetY.set(0)
        break
      case 'sleeping':
        setMood('sleepy')
        offsetY.set(0)
        break
      case 'listening':
        setMood('neutral')
        offsetY.set(-6)
        break
      case 'attention':
        setMood('neutral')
        offsetY.set(-10)
        break
      default:
        setMood('neutral')
        offsetY.set(0)
    }
  }, [state, offsetY])

  // Subtle, asymmetric micro-drift per eye
  useEffect(() => {
    let raf
    const drift = () => {
      const t = Date.now()
      leftDriftX.set(Math.sin(t / 1200) * 1.1)
      leftDriftY.set(Math.cos(t / 1600) * 0.8)
      rightDriftX.set(Math.cos(t / 1500) * 1.0)
      rightDriftY.set(Math.sin(t / 1300) * 0.7)
      raf = requestAnimationFrame(drift)
    }
    raf = requestAnimationFrame(drift)
    return () => cancelAnimationFrame(raf)
  }, [leftDriftX, leftDriftY, rightDriftX, rightDriftY])

  // Success bounce, error shake, attention bounce, prompt nod, dock bounce
  const containerVariants = {
    initial: { y: 0, rotate: 0 },
    success: { y: [0, -10, 0], rotate: [0, -2, 0], transition: { times: [0, 0.45, 1], duration: 0.9, ease: 'easeOut' } },
    error: { x: [0, -10, 10, -8, 8, -4, 4, 0], transition: { duration: 0.7, ease: 'easeInOut' } },
    attention: { y: [0, -16, 0, -8, 0], transition: { duration: 1.2, ease: 'easeOut' } },
    prompt: { y: [0, -4, 0], transition: { duration: 0.8 } },
    bounce: { y: [0, -22, 0, -10, 0], transition: { duration: 1.3, ease: 'easeOut' } },
  }

  const activeVariant = ['success','error','attention','prompt','bounce'].includes(state) ? state : 'initial'

  // Reduced blink when listening, sleepy closed
  const doBlink = blinkFlag && state !== 'listening' && state !== 'loading' && state !== 'sleeping'

  return (
    <motion.div
      variants={containerVariants}
      animate={activeVariant}
      className="relative mx-auto w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-xl"
    >
      <div className="flex items-center justify-center gap-6">
        <Eye x={finalX} y={finalY} blink={doBlink} mood={mood} offsetX={leftDriftX} offsetY={useTransform([offsetY, leftDriftY], ([a,b]) => a + b)} />
        <Eye x={finalX} y={finalY} blink={doBlink && Math.random() > 0.35} mood={mood} offsetX={rightDriftX} offsetY={useTransform([offsetY, rightDriftY], ([a,b]) => a + b)} />
      </div>

      <div className="mt-6 flex items-center justify-center">
        <AnimatePresence>
          {speaking && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}>
              <VoiceWave speaking />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {state === 'sleeping' && (
        <motion.div
          className="pointer-events-none absolute -right-2 -top-2 select-none text-slate-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0], y: [-4, -16, -28] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        >
          Zz
        </motion.div>
      )}
    </motion.div>
  )
}

export default CopilotFace
