import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'

interface LocationState {
  startTime: number
  objective: string
  sessionId: string
}

export const BreathingExercisePage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isBreathingIn, setIsBreathingIn] = useState(true)
  const [cycleCount, setCycleCount] = useState(0)
  const state = location.state as LocationState

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        navigate('/flow', { 
          state: {
            ...state,
            startTime: Date.now()
          }
        })
      }
    }

    window.addEventListener('keydown', handleEscape)
    
    let timeout: NodeJS.Timeout

    const breathingCycle = () => {
      // If we've completed both cycles, navigate to flow page
      if (cycleCount >= 2) {
        navigate('/flow', { 
          state: {
            ...state,
            startTime: Date.now() // Reset the start time when navigating to flow page
          }
        })
        return
      }

      // Toggle breathing state every 5 seconds
      timeout = setTimeout(() => {
        setIsBreathingIn(prev => {
          const newState = !prev
          if (!prev) { // If switching to breathing in
            setCycleCount(c => c + 1)
          }
          return newState
        })
      }, 5000)
    }

    breathingCycle()

    return () => {
      clearTimeout(timeout)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [navigate, state])

  const getBreathText = () => {
    if (cycleCount === 1 && !isBreathingIn) {
      return 'Get Ready to Lock In'
    }
    return isBreathingIn ? 'Breathe In' : 'Breathe Out'
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={isBreathingIn ? 'in' : 'out'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-2xl font-medium mb-32"
          >
            {getBreathText()}
          </motion.div>
        </AnimatePresence>
        
        <motion.div
          className="w-64 h-64 rounded-full border-2 border-primary"
          animate={{
            scale: isBreathingIn ? 1.5 : 1,
          }}
          transition={{
            duration: 5,
            ease: 'easeInOut'
          }}
        />
      </div>
    </div>
  )
}
