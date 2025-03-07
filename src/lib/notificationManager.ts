import { Window as WebviewWindow, type WindowOptions } from '@tauri-apps/api/window'
import { trace, error } from '@tauri-apps/plugin-log'
import { Event } from '@tauri-apps/api/event'

interface NotificationOptions {
  title: string
  message?: string
  duration?: number
}

class NotificationManager {
  private static instance: NotificationManager
  private notifications: WebviewWindow[] = []
  private readonly NOTIFICATION_HEIGHT = 80
  private readonly NOTIFICATION_WIDTH = 356

  private constructor() {}

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager()
    }
    return NotificationManager.instance
  }

  public async show(options: NotificationOptions): Promise<void> {
    try {
      trace(`Showing notification: ${JSON.stringify(options)}`)
      console.log('Showing notification:', options)
      const { title, message, duration = 5000 } = options

      // Create a unique label for the notification window
      const label = `notification-${Date.now()}`
      trace(`Creating notification window: ${label}`)
      console.log('Creating notification window:', label)

      // Create a new notification window
      const windowOptions: WindowOptions = {
        width: this.NOTIFICATION_WIDTH,
        height: this.NOTIFICATION_HEIGHT,
        x: Math.round((screen.width - this.NOTIFICATION_WIDTH) / 2),
        y: 20,
        decorations: true,
        alwaysOnTop: true,
        focus: false,
        resizable: false,
        maximizable: false,
        minimizable: false,
        closable: false,
        titleBarStyle: 'transparent',
        hiddenTitle: true,
        backgroundColor: '#FCF8EDCC'
      }

      console.log('Window options:', windowOptions)
      
      // Create the window with the HTML content directly
      const notification = new WebviewWindow(label, {
        ...windowOptions,
        // @ts-expect-error - url is a valid property for WebviewWindow but not in the type definition
        url: '/public/notification.html'
      })
      
      console.log('Notification window created')

      // Wait for the window to be created
      await new Promise<void>((resolve, reject) => {
        notification.once('tauri://created', () => {
          trace('Window created successfully')
          console.log('Window created successfully')
          resolve()
        })
        notification.once('tauri://error', (event: Event<unknown>) => {
          error(`Error creating window: ${event.payload}`)
          console.error('Error creating window:', event.payload)
          reject(new Error(String(event.payload)))
        })
      })

      trace('Adding notification to list')
      console.log('Adding notification to list')
      // Add to our list of active notifications
      this.notifications.push(notification)

      // Wait a moment for the window to be ready
      await new Promise(resolve => setTimeout(resolve, 500))

      trace('Emitting notification data')
      console.log('Emitting notification data')
      // Emit the notification data
      try {
        await notification.emit('notification', {
          title,
          message,
          duration
        })
        console.log('Notification data emitted successfully')
      } catch (emitError) {
        console.error('Error emitting notification data:', emitError)
        throw emitError
      }

      trace('Setting up auto-close timer')
      console.log('Setting up auto-close timer for', duration, 'ms')
      // Set up auto-close
      setTimeout(async () => {
        await this.closeNotification(notification)
      }, duration)

      trace('Notification setup complete')
    } catch (err) {
      error(`Error showing notification: ${err}`)
      console.error('Error showing notification:', err)
      throw err
    }
  }

  private async closeNotification(notification: WebviewWindow): Promise<void> {
    try {
      trace('Closing notification')
      const index = this.notifications.indexOf(notification)
      if (index > -1) {
        this.notifications.splice(index, 1)
        await notification.close()
        trace('Notification closed')
      }
    } catch (err) {
      error(`Error closing notification: ${err}`)
      throw err
    }
  }
}

export default NotificationManager 
