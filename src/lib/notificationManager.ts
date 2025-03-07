import { Window } from '@tauri-apps/api/window'
import { Webview } from '@tauri-apps/api/webview'
import { trace, error } from '@tauri-apps/plugin-log'

interface NotificationOptions {
  duration?: number
  type: 'session-start' | 'session-end' | 'session-warning' | 'blocked-app'
}

class NotificationManager {
  private static instance: NotificationManager
  private notifications: Webview[] = []
  private readonly NOTIFICATION_HEIGHT = 80
  private readonly NOTIFICATION_WIDTH = 356

  private constructor() {}

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager()
    }
    return NotificationManager.instance
  }

  private getNotificationUrl(type: NotificationOptions['type']): string {
    const baseUrl = import.meta.env.DEV ? 'http://localhost:1420' : ''
    switch (type) {
      case 'session-start':
        return `${baseUrl}/notification-session-start.html`
      case 'session-end':
        return `${baseUrl}/notification-session-end.html`
      case 'session-warning':
        return `${baseUrl}/notification-session-warning.html`
      case 'blocked-app':
        return `${baseUrl}/notification-blocked-app.html`
    }
  }

  public async show(options: NotificationOptions): Promise<void> {
    try {
      trace(`Showing notification: ${JSON.stringify(options)}`)
      console.log('Showing notification with options:', options)
      const { duration = 5000, type } = options

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
        focus: false,
        resizable: false,
        maximizable: false,
        minimizable: false,
        closable: false,
        skipTaskbar: true,
        titleBarStyle: 'transparent',
        hiddenTitle: true,
        transparent: true
      })

      // Then create the webview in that window
      const webview = new Webview(window, label, {
        url: this.getNotificationUrl(type),
        x: 0,
        y: 0,
        width: this.NOTIFICATION_WIDTH,
        height: this.NOTIFICATION_HEIGHT,
        transparent: true
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

      // Set up auto-close with proper Promise handling
      await new Promise<void>((resolve) => {
        setTimeout(async () => {
          const index = this.notifications.indexOf(webview)
          if (index > -1) {
            this.notifications.splice(index, 1)
          }
          await window.close()
          resolve()
        }, duration)
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
