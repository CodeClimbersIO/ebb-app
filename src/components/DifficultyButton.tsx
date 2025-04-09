import * as React from 'react'
import { Button, ButtonProps } from './ui/button'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/tailwind.util'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface DifficultyButtonProps extends ButtonProps {
  onAction: () => void
  countdownDuration?: number
  loadingText?: string
  actionText: string
  isLoading?: boolean
  difficulty?: Difficulty | null
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
    setCanExecute(difficulty === 'easy')
  }, [difficulty])

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

  if (difficulty === 'hard') {
    return (
      <Button
        {...props}
        className={cn('transition-all duration-300 min-w-[120px] text-center opacity-50', className)}
        disabled
      >
        <span className="mr-2">🔒</span>
        Hard Mode
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
            setTimeout(() => {
              setLastInteraction(null)
              setCountdown(null)
              setCanExecute(false)
            }, 1000)
          } else {
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
