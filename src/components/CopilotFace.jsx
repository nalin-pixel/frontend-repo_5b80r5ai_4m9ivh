import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, AnimatePresence, useTransform } from 'framer-motion'

// Utility: random in range
const rand = (min, max) => Math.random() * (max - min) + min

// Eye component with rich states
const Eye = ({ x, y, blink, mood, tracking, delay = 0 }) => {
  const pupilX = useSpring(x, { stiffness: 350, damping: 28, mass: 0.25 })
  const pupilY = useSpring(y, { stiffness: 350, damping: 28, mass: 0.25 })

  const lid = useSpring(0, { stiffness: 280, damping: 24 }) // 0 open, 1 closed

  useEffect(() => {
    if (blink) {
      lid.set(1)
      const t = setTimeout(() => lid.set(0), 120)
      return () => clearTimeout(t)
    }
  }, [blink])

  // mood affects eye shape
  const moodScaleY = useMemo(() => ({
    happy: 0.85,
    excited: 0.9,
    neutral: 1,
    sleepy: 0.6,
    worried: 0.95,
  }[mood] || 1), [mood])

  // Use transform for clipPath (FM v11)
  const clip = useTransform(lid, v => `inset(${v * 50}% 0 0 0 round 999px)`)

  return (
    <div className="relative h-16 w-16 rounded-full bg-white shadow-inner ring-1 ring-slate-200">
      <motion.div
        className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-900"
        style={{
          x: pupilX,
          y: pupilY,
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
  const [cursor, setCursor] = useState({ x: 0, y: 0 })
  const [sleepiness, setSleepiness] = useState(0) // 0-1

  // motion values for pupils
  const px = useMotionValue(0)
  const py = useMotionValue(0)

  const leftOffset = useMotionValue(0)
  const rightOffset = useMotionValue(0)

  // Blink scheduler with natural variability
  useEffect(() => {
    let mounted = true
    const loop = () => {
      const next = rand(2000, 6000) // 2-6s
      const t = setTimeout(() => {
        if (!mounted) return
        setBlinkFlag(true)
        setTimeout(() => setBlinkFlag(false), 10)
        loop()
      }, next)
      return () => clearTimeout(t)
    }
    const stop = loop()
    return () => { mounted = false; stop && stop() }
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
  }, [])

  // State-driven behaviors
  useEffect(() => {
    if (state === 'sleeping') {
      setSleepiness(1)
    } else {
      setSleepiness(0)
    }

    switch (state) {
      case 'success':
        setMood('excited')
        break
      case 'prompt':
        setMood('happy')
        break
      case 'error':
        setMood('worried')
        break
      case 'sleeping':
        setMood('sleepy')
        break
      default:
        setMood('neutral')
    }
  }, [state])

  // Asymmetric micro drift
  useEffect(() => {
    let raf
    const drift = () => {
      leftOffset.set(Math.sin(Date.now() / 1200) * 1.1)
      rightOffset.set(Math.cos(Date.now() / 1500) * 1.0)
      raf = requestAnimationFrame(drift)
    }
    raf = requestAnimationFrame(drift)
    return () => cancelAnimationFrame(raf)
  }, [])

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
    return () => clearTimeout(timer)
  }, [state])

  // Speaking wave
  const speaking = state === 'speaking'

  // Compute final pupil positions depending on state
  const finalX = useSpring(0, eyeSpring)
  const finalY = useSpring(0, eyeSpring)

  useEffect(() => {
    const unsubX = px.on('change', (v) => finalX.set(v))
    const unsubY = py.on('change', (v) => finalY.set(v))
    return () => { unsubX(); unsubY() }
  }, [])

  useEffect(() => {
    if (state === 'thinking') {
      const unX = thinkingX.on('change', v => finalX.set(v))
      const unY = thinkingY.on('change', v => finalY.set(v))
      return () => { unX(); unY() }
    }
  }, [state])

  // Special states adjustments
  useEffect(() => {
    if (state === 'listening') {
      finalY.set(-6)
    }
    if (state === 'attention') {
      finalY.set(-10)
    }
    if (state === 'loading') {
      // alternating pulses via offsets
      const id = setInterval(() => setBlinkFlag(b => !b), 1200)
      return () => clearInterval(id)
    }
  }, [state])

  // Success bounce, error shake, attention bounce, prompt nod, dock bounce
  const containerVariants = {
    initial: { y: 0, rotate: 0 },
    success: { y: [0, -10, 0], rotate: [0, -2, 0], transition: { times: [0, 0.45, 1], duration: 0.9, ease: 'easeOut' } },
    error: { x: [0, -10, 10, -8, 8, -4, 4, 0], transition: { duration: 0.7, ease: 'easeInOut' } },
    attention: { y: [0, -16, 0, -8, 0], transition: { duration: 1.2, ease: 'easeOut' } },
    prompt: { rotateX: [0, 10, 0], transition: { duration: 0.8 } },
    bounce: { y: [0, -22, 0, -10, 0], transition: { duration: 1.3, ease: 'easeOut' } },
  }

  const activeVariant = ['success','error','attention','prompt','bounce'].includes(state) ? state : 'initial'

  // Reduced blink when listening, sleepy closed
  const doBlink = blinkFlag && state !== 'listening' && state !== 'loading' && state !== 'sleeping'

  return (
    <motion.div
      variants={containerVariants}
      animate={activeVariant}
      className="mx-auto w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-xl"
    >
      <div className="flex items-center justify-center gap-6">
        <Eye x={finalX} y={finalY} blink={doBlink} mood={mood} />
        <Eye x={finalX} y={finalY} blink={doBlink && Math.random() > 0.35} mood={mood} />
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
