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

  private async getNotificationUrl(type: NotificationOptions['type'], duration: number, animationDuration: number): Promise<string> {
    try {
      if (import.meta.env.DEV) {
        // In development, use the local file path
        const url = new URL(`http://localhost:1420/src-tauri/resources/notifications/html/notification-${type}.html`)
        url.searchParams.set('duration', duration.toString())
        url.searchParams.set('animationDuration', animationDuration.toString())
        return url.toString()
      } else {
        // In production, use the bundled path
        const url = new URL(`tauri://localhost/resources/notifications/html/notification-${type}.html`)
        url.searchParams.set('duration', duration.toString())
        url.searchParams.set('animationDuration', animationDuration.toString())
        return url.toString()
      }
    } catch (err) {
      console.error('Error constructing notification URL:', err)
      throw err
    }
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

      // Since getNotificationUrl is now async, we need to await it
      const notificationUrl = await this.getNotificationUrl(type, duration, ANIMATION_DURATION)
      
      const webview = new Webview(window, label, {
        url: notificationUrl,
        x: 0,
        y: 0,
        width: this.NOTIFICATION_WIDTH,
        height: this.NOTIFICATION_HEIGHT,
        transparent: true,
      })

      // Add these debug listeners
      webview.once('tauri://load-start', () => {
        console.log('Webview started loading')
      })

      webview.once('tauri://load-end', () => {
        console.log('Webview finished loading')
      })

      webview.once('tauri://error', (e) => {
        console.error('Webview error:', e)
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
