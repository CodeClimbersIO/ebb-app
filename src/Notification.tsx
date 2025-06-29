import { useEffect, useState, useRef } from 'react'
import { CheckCircle, X, Shield, AlertTriangle, PartyPopper } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/tailwind.util'
import { invoke } from '@tauri-apps/api/core'
import { info } from '@tauri-apps/plugin-log'

type NotificationType = 'session-start' | 'session-start-smart' | 'blocked-app' | 'session-end' | 'session-warning'

interface NotificationConfig {
  title: string
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  progressColor: string
  defaultDuration: number
  soundFile?: string
  hasButton?: boolean
  buttonText?: string
  buttonAction?: () => void | Promise<void>
}


const NOTIFICATION_CONFIGS: Record<NotificationType, NotificationConfig> = {
  'session-start': {
    title: 'Session Start',
    icon: CheckCircle,
    iconColor: 'text-primary',
    progressColor: 'bg-primary',
    defaultDuration: 5000,
    soundFile: 'session_start.mp3'
  },
  'session-start-smart': {
    title: 'Smart Session Start',
    icon: CheckCircle,
    iconColor: 'text-primary',
    progressColor: 'bg-primary',
    defaultDuration: 5000,
    soundFile: 'session_start.mp3'
  },
  'blocked-app': {
    title: 'App Blocked',
    icon: Shield,
    iconColor: 'text-red-500',
    progressColor: 'bg-red-500',
    defaultDuration: 5000,
    soundFile: 'app_blocked.mp3',
    hasButton: true,
    buttonText: 'Snooze'
  },
  'session-end': {
    title: 'Session Ended',
    icon: PartyPopper,
    iconColor: 'text-green-500',
    progressColor: 'bg-green-500',
    defaultDuration: 10000,
    soundFile: 'session_end.mp3',
    hasButton: true,
    buttonText: 'View Recap'
  },
  'session-warning': {
    title: 'Session Warning',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    progressColor: 'bg-amber-500',
    defaultDuration: 15000,
    soundFile: 'session_warning.mp3',
    hasButton: true,
    buttonText: 'Extend Session'
  }
}

export const Notification = () => {
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)
  const [notificationType, setNotificationType] = useState<NotificationType | null>(null)
  const [config, setConfig] = useState<NotificationConfig | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)



  const notificationDuration = config?.defaultDuration
  const IconComponent = config?.icon

  useEffect(() => {
    // Play sound if available
    if (config?.soundFile) {
      // Use relative path that Tauri can resolve
      const soundPath = `sounds/${config?.soundFile}`
      audioRef.current = new Audio(soundPath)
      audioRef.current.addEventListener('canplaythrough', () => {
        audioRef.current?.play().catch(console.error)
      })
    }

    // Auto-dismiss after duration
    const timer = setTimeout(() => {
      handleExit()
    }, notificationDuration)

    return () => {
      clearTimeout(timer)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [notificationDuration, config?.soundFile])

  useEffect(() => {
    // Get the window type from URL parameters (dev) or hash (production)
    info(`window.location: ${window.location}`)
    const urlParams = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    info(`urlParams: ${urlParams}`)
    info(`hashParams: ${hashParams}`)
    const notificationType = urlParams.get('notification_type') || hashParams.get('notification_type')
    info(`notificationType: ${notificationType}`)

    if(!notificationType) return
    setNotificationType(notificationType as NotificationType)
    // Set body background to transparent for notification windows
    document.body.style.background = 'transparent'
    document.documentElement.style.background = 'transparent'
    
  }, [])
  useEffect(() => {
    if(!notificationType) return
    const config = NOTIFICATION_CONFIGS[notificationType]
    if(!config) {
      info(`Unknown notification type: ${notificationType}`)
      return
    }
    setConfig(config)
  }, [notificationType, config])

  const handleExit = () => {
    setIsExiting(true)
    // Wait for exit animation to complete before calling onDismiss
    info('handleExit')

    setTimeout(() => {
      info('hiding notification')
      setIsVisible(false)
      invoke('hide_notification')
    }, 500)
  }

  const handleButtonClick = async () => {
    if (config?.buttonAction) {
      await config.buttonAction()
    }
    handleExit()
  }

  if (!isVisible) return null

  if(!config) return null

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
        {IconComponent && <IconComponent className={cn('h-6 w-6 shrink-0', config.iconColor)} />}
        
        {/* Content */}
        <div className="flex-1">
          <h3 className="text-card-foreground font-semibold text-base">
            {config.title}
          </h3>
        </div>

        {/* Action Button */}
        {config.hasButton && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs hover:bg-accent hover:text-accent-foreground"
            onClick={handleButtonClick}
          >
            {config.buttonText}
          </Button>
        )}

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
            className={cn('h-full rounded-full origin-left', config.progressColor)}
            style={{ 
              animation: `progress-shrink ${notificationDuration}ms linear forwards`,
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
