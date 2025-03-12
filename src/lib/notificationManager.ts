import { Effect, Window } from '@tauri-apps/api/window'
import { Webview } from '@tauri-apps/api/webview'
import { error, info } from '@tauri-apps/plugin-log'
import { convertFileSrc } from '@tauri-apps/api/core'
import { resolveResource } from '@tauri-apps/api/path'

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

  private async getNotificationResources(type: NotificationOptions['type']) {
    try {
      const soundMap = {
        'session-start': 'session_start.mp3',
        'session-end': 'session_end.mp3',
        'session-warning': 'session_warning.mp3',
        'blocked-app': 'app_blocked.mp3'
      }

      const isDev = import.meta.env.DEV
      info(`Is development environment: ${isDev}`)

      // HTML path
      let htmlPath
      let soundPath

      if (isDev) {
        // In development, use relative paths
        htmlPath = `/src-tauri/resources/notifications/html/notification-${type}.html`
        soundPath = `/src-tauri/resources/notifications/sounds/${soundMap[type]}`
      } else {
        // In production, resolve the resource paths
        htmlPath = await resolveResource(`resources/notifications/html/notification-${type}.html`)
        soundPath = await resolveResource(`resources/notifications/sounds/${soundMap[type]}`)
        
        // Convert to file URLs
        htmlPath = convertFileSrc(htmlPath)
        soundPath = convertFileSrc(soundPath)
      }
      
      info(`HTML path: ${htmlPath}`)
      info(`Sound path: ${soundPath}`)
      
      return { html: htmlPath, sound: soundPath }
    } catch (err) {
      error(`Error getting notification resources: ${err}`)
      throw err
    }
  }

  private async getNotificationUrl(type: NotificationOptions['type'], duration: number, animationDuration: number): Promise<string> {
    try {
      const resources = await this.getNotificationResources(type)
      const isDev = import.meta.env.DEV
      
      // Construct the URL
      const baseUrl = isDev ? 'http://localhost:1420' : ''
      let fullUrl

      if (isDev) {
        fullUrl = `${baseUrl}${resources.html}`
      } else {
        fullUrl = resources.html
      }
      
      // Create URL object to add parameters
      const url = new URL(fullUrl)
      url.searchParams.set('duration', duration.toString())
      url.searchParams.set('animationDuration', animationDuration.toString())
      
      // Ensure the sound URL is properly encoded
      if (resources.sound) {
        // Log the raw sound URL for debugging
        info(`Raw sound URL before encoding: ${resources.sound}`)
        
        // In production, the sound URL is already a file:// URL from convertFileSrc
        // In development, we need to make it absolute
        const soundUrl = isDev ? `${baseUrl}${resources.sound}` : resources.sound
        url.searchParams.set('sound', soundUrl)
        
        // Log the final sound URL for debugging
        info(`Final sound URL after encoding: ${url.searchParams.get('sound')}`)
      } else {
        error('No sound URL available')
      }
      
      const finalUrl = url.toString()
      info(`Final notification URL: ${finalUrl}`)
      
      return finalUrl
    } catch (err) {
      error(`Error constructing notification URL: ${err}`)
      throw err
    }
  }

  public async show(options: NotificationOptions): Promise<void> {
    try {
      info(`Showing notification: ${JSON.stringify(options)}`)
      
      // Set different durations based on notification type
      let duration = 5000 // default 6s
      switch (options.type) {
        case 'session-warning':
          duration = 10000
          break
        case 'session-end':
          duration = 8000
          break
        case 'session-start':
          duration = 5000
          break
        case 'blocked-app':
          duration = 5000
          break
      }

      // Only override the duration if explicitly provided in options
      if (options.duration !== undefined) {
        duration = options.duration
      }

      const { type } = options

      // Create a unique label for the notification window
      const label = `notification-${Date.now()}`
      info(`Creating notification window: ${label}`)

      // Get screen dimensions for positioning
      const screenWidth = window.innerWidth || 1024 // Fallback width if not available

      info(`Screen width: ${screenWidth}`)

      // Create the window first
      const notificationWindow = new Window(label, {
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
      info(`Using notification URL: ${notificationUrl}`)
      
      const webview = new Webview(notificationWindow, label, {
        url: notificationUrl,
        x: 0,
        y: 0,
        width: this.NOTIFICATION_WIDTH,
        height: this.NOTIFICATION_HEIGHT,
        transparent: true,
      })

      // Add these debug listeners
      webview.once('tauri://load-start', () => {
        info('Webview started loading')
      })

      webview.once('tauri://load-end', () => {
        info('Webview finished loading')
      })

      webview.once('tauri://error', (e) => {
        error(`Webview error: ${JSON.stringify(e)}`)
      })

      // Wait for the webview to be created
      await new Promise<void>((resolve, reject) => {
        webview.once('tauri://created', () => {
          info('Notification webview created successfully')
          this.notifications.push(webview)
          resolve()
        })
        
        webview.once('tauri://error', (event) => {
          error(`Error creating notification webview: ${JSON.stringify(event)}`)
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
          await notificationWindow.close()
          info('Notification window closed')
          resolve()
        }, duration + ANIMATION_DURATION)
      })

      info('Notification complete')
    } catch (err) {
      error(`Error showing notification: ${err}`)
      throw err
    }
  }
}

export default NotificationManager 
