import { useEffect, useState, useRef, useCallback } from 'react'
import { CheckCircle, X, Shield, AlertTriangle, PartyPopper, HelpCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Hotkey } from '@/components/ui/hotkey'
import { cn } from '@/lib/utils/tailwind.util'
import { convertFileSrc, invoke } from '@tauri-apps/api/core'
import { error, info } from '@tauri-apps/plugin-log'
import { resolveResource } from '@tauri-apps/api/path'
import { isDev } from '@/lib/utils/environment.util'
import { SmartSessionApi } from '@/api/ebbApi/smartSessionApi'
import { emit, listen } from '@tauri-apps/api/event'
import { SHORTCUT_EVENT } from '@/api/ebbApi/shortcutApi'
import { useShortcutStore } from '@/lib/stores/shortcutStore'

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
    title: 'Start Focus?',
    description: 'Looks like you\'re in a groove!',
    icon: HelpCircle,
    iconColor: 'text-primary',
    progressColor: 'bg-primary',
    defaultDuration: 10*1000,
    buttonText: 'Start',
    buttonAction: async () => { 
      info('starting smart session')
      const session = await SmartSessionApi.startSmartSession()
      info(`session started: ${JSON.stringify(session)}`)
      invoke('notify_app_notification_dismissed')
    }
  },
  'blocked-app': {
    title: 'App Blocked',
    icon: Shield,
    iconColor: 'text-red-500',
    progressColor: 'bg-red-500',
    defaultDuration: 8000,
    soundFile: 'app_blocked.mp3',
    buttonText: 'Snooze',
    buttonAction: async () => {
      info('snoozing blocking')
      await invoke('snooze_blocking', {
        duration: 1000 * 60 // 1 minute snoozer
      })
    }
  },
  'session-end': {
    title: 'Session Ended',
    icon: PartyPopper,
    iconColor: 'text-green-500',
    progressColor: 'bg-green-500',
    defaultDuration: 8000,
    soundFile: 'session_end.mp3',
    buttonText: 'View Recap',
    buttonAction: async () => {
      info('viewing recap')
      await emit('navigate-to-flow-recap')
    }
  },
  'session-warning': {
    title: 'Session Warning',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    progressColor: 'bg-amber-500',
    defaultDuration: 12000,
    soundFile: 'session_warning.mp3',
    buttonText: 'Extend Session',
    buttonAction: async () => {
      info('extending session')
      await emit('add-time-event', {
        action: 'add-time',
        minutes: 15
      })
    }
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
  const [keysPressed, setKeysPressed] = useState(false)
  const [buttonState, setButtonState] = useState<'idle' | 'processing' | 'success'>('idle')
  const { shortcutParts, loadShortcutFromStorage } = useShortcutStore()

  const notificationDuration = config?.defaultDuration
  const IconComponent = config?.icon

  // Map notification colors to hotkey colors
  const getHotkeyColor = (iconColor: string): string => {
    if (iconColor.includes('primary')) return 'primary'
    if (iconColor.includes('red')) return 'red'
    if (iconColor.includes('green')) return 'green'
    if (iconColor.includes('amber')) return 'amber'
    return 'primary' // fallback
  }

  const handleExit = useCallback(() => {
    setIsExiting(true)

    setTimeout(() => {
      setIsVisible(false)
      invoke('hide_notification')
    }, 500)
  }, [])

  const handleButtonClick = useCallback(async () => {
    if (buttonState !== 'idle') return // Prevent multiple clicks
    
    setButtonState('processing')
    
    try {
      if (config?.buttonAction) {
        await config.buttonAction()
      }
      
      setButtonState('success')
      
      // Wait 200ms before dismissing
      setTimeout(() => {
        handleExit()
      }, 1000)
    } catch (error) {
      info(`handleButtonClick: error - ${error}`)
      setButtonState('idle') // Reset on error
    }
  }, [config?.buttonAction, handleExit, buttonState])

  const triggerKeyPressedFeedback = useCallback(() => {
    setKeysPressed(true)
    setTimeout(() => {
      setKeysPressed(false)
    }, 150) // Match the transition duration
  }, [])

  // Load user's configured shortcut
  useEffect(() => {
    loadShortcutFromStorage()
  }, [loadShortcutFromStorage])

  // Listen to global shortcut events when notification has a button action
  useEffect(() => {
    if (!config?.buttonAction) return

    let unlistenShortcut: (() => void) | undefined

    const setupShortcutListener = async () => {
      try {
        unlistenShortcut = await listen(SHORTCUT_EVENT, () => {
          if (buttonState === 'idle') {
            triggerKeyPressedFeedback()
            handleButtonClick()
          }
        })
      } catch (err) {
        error(`Failed to setup shortcut listener: ${err}`)
      }
    }

    if(isVisible) {
      setupShortcutListener()
    } else {
      unlistenShortcut?.()
    }

    return () => {
      if (unlistenShortcut) {
        unlistenShortcut()
      }
    }
  }, [config?.buttonAction, triggerKeyPressedFeedback, handleButtonClick, isVisible, buttonState])

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
  }, [config, audioRef, isVisible, handleExit])

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
    invoke('notify_app_notification_created')
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
            variant="outline"
            size="sm"
            className={cn(
              'h-8 px-3 text-xs flex items-center gap-2 transition-all duration-200',
              buttonState === 'idle' && 'hover:bg-accent hover:text-accent-foreground',
              buttonState === 'success' && 'bg-green-500/20 text-green-400 border-green-500/50'
            )}
            onClick={handleButtonClick}
            disabled={buttonState !== 'idle'}
          >
            <span>
              {buttonState === 'idle' && config.buttonText}
              {buttonState === 'success' && 'Success!'}
            </span>
            {buttonState === 'idle' && shortcutParts.length > 0 && shortcutParts.some(part => part) && (
              <div className="flex items-center gap-1">
                {shortcutParts.map((part, index) => (
                  <Hotkey 
                    key={index} 
                    size="sm" 
                    pressed={keysPressed}
                    color={getHotkeyColor(config.iconColor)}
                  >
                    {part}
                  </Hotkey>
                ))}
              </div>
            )}
          </Button>
        )}

        {/* Dismiss Button */}
        <Button
          variant="outline"
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
