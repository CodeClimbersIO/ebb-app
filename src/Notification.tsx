import { useEffect, useState, useRef } from 'react'
import { CheckCircle, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/tailwind.util'

interface NotificationProps {
  duration?: number
  soundUrl?: string
  title?: string
  onDismiss?: () => void
}

export const Notification = ({
  duration = 100000,
  soundUrl,
  title = 'Smart Session Start',
  onDismiss
}: NotificationProps) => {
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Play sound if provided
    if (soundUrl) {
      audioRef.current = new Audio(soundUrl)
      audioRef.current.addEventListener('canplaythrough', () => {
        audioRef.current?.play()
      })
    }

    // Auto-dismiss after duration
    const timer = setTimeout(() => {
      handleExit()
    }, duration)

    return () => {
      clearTimeout(timer)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [duration, soundUrl])

  const handleExit = () => {
    setIsExiting(true)
    // Wait for exit animation to complete before calling onDismiss
    setTimeout(() => {
      onDismiss?.()
      setIsVisible(false)
    }, 500)
  }

  if (!isVisible) return null

  return (
    <div className="min-h-screen font-sans">
      <Card 
        className={cn(
          'group relative flex items-center gap-3 p-4 bg-card/95 backdrop-blur-sm shadow-lg border-border',
          'animate-in slide-in-from-top-4 fade-in duration-300',
          isExiting && 'animate-out slide-out-to-top-4 fade-out duration-500'
        )}
      >
        {/* Icon */}
        <CheckCircle className="h-6 w-6 text-primary shrink-0" />
        
        {/* Content */}
        <div className="flex-1">
          <h3 className="text-card-foreground font-semibold text-base">
            {title}
          </h3>
        </div>

        {/* Dismiss Button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-5 w-5 absolute -top-2 -left-2 rounded-full bg-card shadow-sm',
            'opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity',
            'hover:bg-accent hover:text-accent-foreground'
          )}
          onClick={handleExit}
        >
          <X className="h-3 w-3" />
        </Button>

        {/* Progress Bar */}
        <div 
          className="absolute bottom-0 left-1 right-1 h-0.5 bg-primary/20 rounded-full"
        >
          <div 
            className="h-full bg-primary rounded-full origin-left animate-pulse"
            style={{ 
              animation: `progress-shrink ${duration}ms linear forwards`,
            }}
          />
        </div>
      </Card>

      <style>
        {`
          @keyframes progress-shrink {
            from {
              transform: scaleX(1);
            }
            to {
              transform: scaleX(0);
            }
          }
        `}
      </style>
    </div>
  )
}
