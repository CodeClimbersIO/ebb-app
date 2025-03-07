import { Effect, Window } from '@tauri-apps/api/window'
import { Webview } from '@tauri-apps/api/webview'
import { trace, error } from '@tauri-apps/plugin-log'

interface NotificationOptions {
  duration?: number
  type: 'session-start' | 'session-end' | 'session-warning' | 'blocked-app'
}

class NotificationManager {
  private static instance: NotificationManager
  private notifications: Webview[] = []
  private readonly NOTIFICATION_HEIGHT = 100
  private readonly NOTIFICATION_WIDTH = 356

  private constructor() {}

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager()
    }
    return NotificationManager.instance
  }

  private getNotificationUrl(type: NotificationOptions['type'], duration: number, animationDuration: number): string {
    const baseUrl = import.meta.env.DEV ? 'http://localhost:1420' : ''
    const url = new URL(`${baseUrl}/notification-${type}.html`)
    url.searchParams.set('duration', duration.toString())
    url.searchParams.set('animationDuration', animationDuration.toString())
    console.log('Constructed URL:', url.toString())
    console.log('Duration being sent:', duration)
    return url.toString()
  }

  public async show(options: NotificationOptions): Promise<void> {
    try {
      trace(`Showing notification: ${JSON.stringify(options)}`)
      console.log('Showing notification with options:', options)
      
      // Set different durations based on notification type
      let duration = 6000 // default 6s
      switch (options.type) {
        case 'session-warning':
          duration = 15000
          break
        case 'session-end':
          duration = 10000 // 10s for warning and end notifications
          break
        case 'session-start':
          duration = 5000 // 6s for session start
          break
        case 'blocked-app':
          duration = 5000 // 6s for blocked app
          break
      }

      // Only override the duration if explicitly provided in options
      if (options.duration !== undefined) {
        duration = options.duration
      }

      const { type } = options

      // Create a unique label for the notification window
      const label = `notification-${Date.now()}`
      trace(`Creating notification window: ${label}`)
      console.log('Creating notification window:', label)

      // Create the window first
      const window = new Window(label, {
        width: this.NOTIFICATION_WIDTH,
        height: this.NOTIFICATION_HEIGHT,
        x: Math.round((screen.width - this.NOTIFICATION_WIDTH) / 2),
        y: 20,
        decorations: false,
        alwaysOnTop: true,
        focus: true,
        resizable: false,
        maximizable: false,
        minimizable: false,
        closable: false,
        skipTaskbar: true,
        titleBarStyle: 'transparent',
        hiddenTitle: true,
        transparent: true,
        windowEffects: {
          radius: 8,
          effects: [Effect.Blur]
        }
      })

      const ANIMATION_DURATION = 500 // Animation duration in ms

      // Create the webview with the original duration for the progress bar
      const webview = new Webview(window, label, {
        url: this.getNotificationUrl(type, duration, ANIMATION_DURATION),
        x: 0,
        y: 0,
        width: this.NOTIFICATION_WIDTH,
        height: this.NOTIFICATION_HEIGHT,
        transparent: true,
      })

      // Wait for the webview to be created
      await new Promise<void>((resolve, reject) => {
        webview.once('tauri://created', () => {
          console.log('Notification webview created successfully')
          this.notifications.push(webview)
          resolve()
        })
        
        webview.once('tauri://error', (event) => {
          console.error('Error creating notification webview:', event)
          reject(new Error('Failed to create notification webview'))
        })
      })

      // Wait for the full duration plus exit animation
      await new Promise<void>((resolve) => {
        setTimeout(async () => {
          const index = this.notifications.indexOf(webview)
          if (index > -1) {
            this.notifications.splice(index, 1)
          }
          await window.close()
          resolve()
        }, duration + ANIMATION_DURATION)
      })

      trace('Notification complete')
    } catch (err) {
      error(`Error showing notification: ${err}`)
      console.error('Error showing notification:', err)
      throw err
    }
  }
}

export default NotificationManager 
