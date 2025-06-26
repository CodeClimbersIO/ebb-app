import { TrayIcon } from '@tauri-apps/api/tray'
import { Window } from '@tauri-apps/api/window'
import { Menu } from '@tauri-apps/api/menu'
import { resolveResource } from '@tauri-apps/api/path'
import { DateTime, Duration } from 'luxon'
import { useFlowTimer } from './stores/flowTimer'
import { invoke } from '@tauri-apps/api/core'
import { Image } from '@tauri-apps/api/image'
import { logAndToastError } from '@/lib/utils/ebbError.util'
import { isDev } from './utils/environment.util'

async function showAndFocusWindow() {
  const mainWindow = Window.getCurrent()
  await mainWindow.show()
  await mainWindow.unminimize()
  await mainWindow.setFocus()
  return mainWindow
}

const getIconPath = async () => {
  const resolvedIconPath = await resolveResource('icons/tray.png')
  return isDev() ? 'icons/tray.png' : resolvedIconPath
}

function getRemainingDuration(startTime: DateTime, totalDuration: Duration): Duration {
  const elapsedDuration = startTime.diffNow().negate()
  let remainingDuration = totalDuration.minus(elapsedDuration)

  if (remainingDuration.as('milliseconds') < 0) {
    remainingDuration = Duration.fromMillis(0)
  }
  return remainingDuration
}

const addInterval = (interval: NodeJS.Timeout) => {
  const intervals = localStorage.getItem('intervals')
  if (intervals) {
    const parsedIntervals = JSON.parse(intervals)
    parsedIntervals.push(interval)
    localStorage.setItem('intervals', JSON.stringify(parsedIntervals))
  } else {
    localStorage.setItem('intervals', JSON.stringify([interval]))
  }
}

const removeInterval = (interval: NodeJS.Timeout) => {
  const intervals = localStorage.getItem('intervals')
  if (intervals) {
    const parsedIntervals = JSON.parse(intervals)
    parsedIntervals.splice(parsedIntervals.indexOf(interval), 1)
    localStorage.setItem('intervals', JSON.stringify(parsedIntervals))
  }
}

const clearIntervals = () => {
  const intervals = localStorage.getItem('intervals')
  if (intervals) {
    const parsedIntervals = JSON.parse(intervals)
    parsedIntervals.forEach((interval: NodeJS.Timeout) => {
      removeInterval(interval)
      clearInterval(interval)
    })
  }
}

let timerInterval: NodeJS.Timeout | null = null

export const startFlowTimer = async (startTime: DateTime) => {
  const tray = await TrayIcon.getById('main-tray')

  if (!tray) return
  await tray.setTitle('')

  timerInterval = setInterval(async () => {
    const currentTotalDuration = useFlowTimer.getState().totalDuration

    let formattedTime: string
    let elapsedMs: number
    let totalMs: number

    if (currentTotalDuration) {
      const elapsedDuration = startTime.diffNow().negate()
      const remainingDuration = getRemainingDuration(startTime, currentTotalDuration)

      formattedTime = remainingDuration.toFormat('hh:mm:ss')
      elapsedMs = elapsedDuration.as('milliseconds')
      totalMs = currentTotalDuration.as('milliseconds')
      
      if (remainingDuration.as('milliseconds') <= 0) {
        clearIntervals()
        await clearFlowTimer()
        return
      }
    } else {
      const elapsedDuration = startTime.diffNow().negate()
      formattedTime = elapsedDuration.toFormat('hh:mm:ss')
      elapsedMs = elapsedDuration.as('milliseconds')
      totalMs = 0
    }

    try {
      const iconBytes = await invoke<Uint8Array>('generate_timer_icon', {
        timeString: formattedTime,
        currentMs: elapsedMs,
        totalMs: totalMs
      })
      const iconImage = await Image.fromBytes(iconBytes)
      await tray.setIcon(iconImage)
    } catch (error) {
      logAndToastError(`Error generating/setting timer icon: ${error}`, error)
    }
  }, 1000)
  addInterval(timerInterval)
}

export const clearFlowTimer = async () => {
  const tray = await TrayIcon.getById('main-tray')
  if (!tray) return

  const iconPath = await getIconPath()
  await tray.setIcon(iconPath)
  await tray.setIconAsTemplate(true)
  await tray.setTitle('')
}

export const stopFlowTimer = async () => {
  clearIntervals()
  await clearFlowTimer()
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
    iconAsTemplate: true
  })

  const menu = await Menu.new({
    items: [
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
