import { useEffect, useState, useRef } from 'react'
import { CheckCircle, X, Shield, AlertTriangle, PartyPopper, HelpCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/tailwind.util'
import { convertFileSrc, invoke } from '@tauri-apps/api/core'
import { error, info } from '@tauri-apps/plugin-log'
import { resolveResource } from '@tauri-apps/api/path'
import { isDev } from '@/lib/utils/environment.util'
import { SmartSessionApi } from '@/api/ebbApi/smartSessionApi'

type NotificationType = 'session-start' | 'smart-start-suggestion' | 'blocked-app' | 'session-end' | 'session-warning'

interface NotificationConfig {
  title: string
  description?: string
icon: React.ComponentType<{ className?: string }>
  iconColor: string
  progressColor: string
  defaultDuration: number
  soundFile?: string
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
    soundFile: 'session_start.mp3',
  },
  'smart-start-suggestion': {
    title: 'Start a session?',
    description: 'Looks like you\'re in a groove!',
    icon: HelpCircle,
    iconColor: 'text-green-500',
    progressColor: 'bg-green-500',
    defaultDuration: 10*1000,
    soundFile: 'smart_start_suggestion.mp3',
    buttonText: 'Start Session',
    buttonAction: async () => { 
      info('starting smart session')
      const session = await SmartSessionApi.startSmartSession()
      info(`session started: ${JSON.stringify(session)}`)
      invoke('notify_app_to_reload_state')
    }
  },
  'blocked-app': {
    title: 'App Blocked',
    icon: Shield,
    iconColor: 'text-red-500',
    progressColor: 'bg-red-500',
    defaultDuration: 8000,
    soundFile: 'app_blocked.mp3',
    buttonText: 'Snooze'
  },
  'session-end': {
    title: 'Session Ended',
    icon: PartyPopper,
    iconColor: 'text-green-500',
    progressColor: 'bg-green-500',
    defaultDuration: 8000,
    soundFile: 'session_end.mp3',
    buttonText: 'View Recap'
  },
  'session-warning': {
    title: 'Session Warning',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    progressColor: 'bg-amber-500',
    defaultDuration: 12000,
    soundFile: 'session_warning.mp3',
    buttonText: 'Extend Session'
  }
}

const getSoundPath = async (soundFile: string) => {
  if(isDev()) {
    return `/src-tauri/notifications/sounds/${soundFile}`
  }
  const resourcePath = await resolveResource(`notifications/sounds/${soundFile}`)
  return convertFileSrc(resourcePath)
}

export const Notification = () => {
  const [isVisible, setIsVisible] = useState(true) // Start hidden
  const [isExiting, setIsExiting] = useState(false)
  const [notificationType, setNotificationType] = useState<NotificationType | null>(null)
  const [config, setConfig] = useState<NotificationConfig | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)



  const notificationDuration = config?.defaultDuration
  const IconComponent = config?.icon

  useEffect(() => {
    if (!config) return
    const playSound = async () => {
      if (config.soundFile && isVisible) {
        const soundPath = await getSoundPath(config.soundFile)
        audioRef.current = new Audio(soundPath)
        audioRef.current.addEventListener('canplaythrough', () => {
          audioRef.current?.play().catch((err) => {
            error(`error playing sound: ${err}`)
          })
        })
      }
    }
    playSound()

    // Auto-dismiss after duration
    const timer = setTimeout(() => {
      handleExit()
    }, config.defaultDuration)

    return () => {
      clearTimeout(timer)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [config, audioRef, isVisible])

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
    if(notificationType === 'smart-start-suggestion') {
      SmartSessionApi.setLastSessionCheck()
    }
    // Set body background to transparent for notification windows
    document.body.style.background = 'transparent'
    document.documentElement.style.background = 'transparent'
    
  }, [])
  useEffect(() => {
    if(!notificationType) return
    const notificationConfig = NOTIFICATION_CONFIGS[notificationType]
    if(!notificationConfig) {
      info(`Unknown notification type: ${notificationType}`)
      return
    }
    setConfig(notificationConfig)
  }, [notificationType])

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
    <div className="min-h-screen font-sans p-2">
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
          {config.description && <p className="text-card-foreground text-sm">{config.description}</p>}
        </div>

        {/* Action Button */}
        {config.buttonText && (
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
