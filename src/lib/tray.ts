import { TrayIcon } from '@tauri-apps/api/tray'
import { Window } from '@tauri-apps/api/window'
import { Menu } from '@tauri-apps/api/menu'
import { resolveResource } from '@tauri-apps/api/path'
import { DateTime, Duration } from 'luxon'
import { invoke } from '@tauri-apps/api/core'
import { Image } from '@tauri-apps/api/image'
import { logAndToastError } from '@/lib/utils/logAndToastError'
import { isDev } from './utils/environment'
import { FlowSessionApi } from '../api/ebbApi/flowSessionApi'
import { useFlowSession } from './stores/flowSession'

async function showAndFocusWindow() {
  const mainWindow = Window.getCurrent()
  await mainWindow.show()
  await mainWindow.unminimize()
  await mainWindow.setFocus()
  return mainWindow
}

let timerInterval: NodeJS.Timeout | null = null

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

export const startFlowTimer = async (startTime: DateTime) => {
  const tray = await TrayIcon.getById('main-tray')
  if (timerInterval) {
    clearInterval(timerInterval)
  }

  if (!tray) return
  await tray.setTitle('')
  
  timerInterval = setInterval(async () => {
    const currentTotalDuration = useFlowSession.getState().totalDuration
    console.log('currentTotalDuration', currentTotalDuration)

    let formattedTime = startTime.diffNow().negate().toFormat('hh:mm:ss')
    let elapsedMs  = startTime.diffNow().negate().as('milliseconds')
    let totalMs = 0

    if (currentTotalDuration) {
      const elapsedDuration = startTime.diffNow().negate()
      const remainingDuration = getRemainingDuration(startTime, currentTotalDuration)

      formattedTime = remainingDuration.toFormat('hh:mm:ss')
      elapsedMs = elapsedDuration.as('milliseconds')
      totalMs = currentTotalDuration.as('milliseconds')

      if (remainingDuration.as('milliseconds') <= 0) {
        if (timerInterval) {
          clearInterval(timerInterval)
          timerInterval = null
        }
        await stopFlowTimer()
        return
      }
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

  const originalClearInterval = window.clearInterval
  window.clearInterval = (id: string | number | NodeJS.Timeout | undefined) => {
    return originalClearInterval(id)
  }
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

type MenuItem = { text: string, action: () => Promise<void> } | { item: 'Separator' }

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

  const updateMenu = async () => {
    const flowState = useFlowSession.getState()
    const isInFlow = flowState.session?.workflow?.id
    
    console.log('isInFlow', isInFlow)

    const menuItems: MenuItem[] = [
      {
        text: 'Show Dashboard',
        action: async () => {
          await showAndFocusWindow()
        }
      }
    ]

    if (isInFlow) {
      menuItems.push({
        text: 'Stop Flow',
        action: async () => {
          await stopFlowTimer()
        }
      })
      menuItems.push({
        text: 'Add 15 minutes',
        action: async () => {
          console.log('adding 15 minutes')
          const flowSession = await FlowSessionApi.getInProgressFlowSession()
          if (!flowSession) {
            logAndToastError('No flow session found', new Error('No flow session found'))
            return
          }

          const additionalSeconds = 15 * 60
          const newTotalDurationInSeconds = (flowSession.duration || 0) + additionalSeconds
          console.log('newTotalDurationInSeconds', newTotalDurationInSeconds)
          await FlowSessionApi.updateFlowSessionDuration(flowSession.id, newTotalDurationInSeconds)
    
          const newTotalDurationForStore = Duration.fromObject({ seconds: newTotalDurationInSeconds })
          console.log('newTotalDurationForStore', newTotalDurationForStore)
          useFlowSession.getState().setTotalDuration(newTotalDurationForStore)
          console.log('totalDuration', useFlowSession.getState().totalDuration)
        }
      })
    } else {
      menuItems.push({
        text: 'Start Session',
        action: async () => {
          await showAndFocusWindow()
        }
      })
    }

    menuItems.push(
      { item: 'Separator' },
      {
        text: 'Quit',
        action: async () => {
          const window = Window.getCurrent()
          await window.close()
          await window.destroy()
        }
      }
    )

    const menu = await Menu.new({ items: menuItems })
    await tray.setMenu(menu)
  }

  await updateMenu()

  // Subscribe to flow timer state changes
  useFlowSession.subscribe(() => {
    console.log('flow timer state changed')
    updateMenu()
  })

  return tray
}
