'use client'

import * as React from 'react'
import { Button, ButtonProps } from './ui/button'
import { Loader2, Skull } from 'lucide-react'
import { cn } from '@/lib/utils/tailwind.util'

export type Difficulty = 'easy' | 'medium' | 'hardcore'

export interface DifficultyButtonProps extends ButtonProps {
  onAction: () => void
  countdownDuration?: number
  loadingText?: string
  actionText: string
  isLoading?: boolean
  difficulty?: Difficulty
}

export function DifficultyButton({
  onAction,
  countdownDuration = 3,
  loadingText = 'Loading...',
  actionText,
  isLoading,
  difficulty = 'medium',
  className,
  ...props
}: DifficultyButtonProps) {
  const [lastInteraction, setLastInteraction] = React.useState<number | null>(null)
  const [countdown, setCountdown] = React.useState<number | null>(null)
  const [canExecute, setCanExecute] = React.useState(difficulty === 'easy')

  React.useEffect(() => {
    let timer: NodeJS.Timeout | null = null

    if (lastInteraction && !canExecute && difficulty === 'medium') {
      const tick = () => {
        const elapsed = Date.now() - lastInteraction
        const remaining = countdownDuration - Math.floor(elapsed / 1000)

        if (remaining <= 0) {
          setCountdown(null)
          setCanExecute(true)
          if (timer) clearInterval(timer)
        } else {
          setCountdown(remaining)
        }
      }

      // Start immediately and then every second
      tick()
      timer = setInterval(tick, 1000)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [lastInteraction, canExecute, countdownDuration, difficulty])

  const handleClick = () => {
    if (isLoading || !canExecute) return
    onAction()
  }

  // Show disabled button for hardcore difficulty
  if (difficulty === 'hardcore') {
    return (
      <Button
        {...props}
        className={cn('transition-all duration-300 min-w-[120px] text-center opacity-50', className)}
        disabled
      >
        <Skull className="mr-2 h-4 w-4" />
        Hardcore Mode
      </Button>
    )
  }

  return (
    <Button
      {...props}
      className={cn('transition-all duration-300 min-w-[120px] text-center', className)}
      onClick={handleClick}
      disabled={isLoading}
      onMouseEnter={() => {
        if (!isLoading && !canExecute && difficulty === 'medium') {
          setLastInteraction(Date.now())
        }
      }}
      onMouseLeave={() => {
        if (difficulty === 'medium') {
          if (canExecute) {
            // Give 1 second grace period only if they completed the countdown
            setTimeout(() => {
              setLastInteraction(null)
              setCountdown(null)
              setCanExecute(false)
            }, 1000)
          } else {
            // Reset immediately if they haven't completed the countdown
            setLastInteraction(null)
            setCountdown(null)
            setCanExecute(false)
          }
        }
      }}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : countdown && difficulty === 'medium' ? (
        <span className="inline-block w-full text-center opacity-80">{countdown}</span>
      ) : (
        actionText
      )}
    </Button>
  )
} 
