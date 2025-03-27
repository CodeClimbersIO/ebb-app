import { TrayIcon } from '@tauri-apps/api/tray'
import { Window } from '@tauri-apps/api/window'
import { Menu } from '@tauri-apps/api/menu'
import { resolveResource } from '@tauri-apps/api/path'
import { DateTime, Duration } from 'luxon'

async function showAndFocusWindow() {
  const mainWindow = Window.getCurrent()
  await mainWindow.show()
  await mainWindow.unminimize()
  await mainWindow.setFocus()
  return mainWindow
}

let timerInterval: NodeJS.Timeout | null = null

const getIconPath = async () => {
  const isDev = import.meta.env.DEV
  const resolvedIconPath = await resolveResource('icons/tray.png')
  return isDev ? 'icons/tray.png' : resolvedIconPath
}

export const startFlowTimer = async (startTime: DateTime, duration?: Duration) => {
  const tray = await TrayIcon.getById('main-tray')
  if (timerInterval) {
    clearInterval(timerInterval)
  }

  if (!tray) return
  await tray.setIcon(null)
  
  timerInterval = setInterval(async () => {
    let timerDuration: Duration
    if(!duration) {
      timerDuration = startTime.diffNow().negate()
    } else {
      const timeSinceStart = startTime.diffNow()
      timerDuration = duration.plus(timeSinceStart) // timeSinceStart is negative
    }
    const formattedTime = timerDuration.as('hours') >= 1 
      ? timerDuration.toFormat('hh:mm:ss')
      : timerDuration.toFormat('mm:ss')
    await tray.setTitle(formattedTime)
  }, 1000)
}
  
  export const stopFlowTimer = async () => {
    const tray = await TrayIcon.getById('main-tray')
    if (!tray) return
    
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
    
    const iconPath = await getIconPath()
    await tray.setIcon(iconPath)
    await tray.setIconAsTemplate(true)
    await tray.setTitle('')
}

export async function setupTray() {
    const existingTray = await TrayIcon.getById('main-tray')
    if (existingTray) {
      return existingTray
    }
    
    const iconPath = await getIconPath()
    const tray = await TrayIcon.new({
      id: 'main-tray',
      tooltip: 'Ebb',
      icon: iconPath,
      iconAsTemplate: true // For better macOS dark mode support
    })

    const menu = await Menu.new({
      items: [
        {
          text: 'Start Focus Session',
          accelerator: 'CommandOrControl+E',
          action: async () => {
            const window = await showAndFocusWindow()
            await window.emit('navigate', '/start-flow')
          }
        },
        {
          text: 'Show Dashboard',
          action: async () => {
            await showAndFocusWindow()
          }
        },
        { item: 'Separator' },
        {
          text: 'Quit',
          action: async () => {
            const window = Window.getCurrent()
            await window.close()
            await window.destroy()
          }
        }
      ]
    })

    await tray.setMenu(menu)
    return tray
}
