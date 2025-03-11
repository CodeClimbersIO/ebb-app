import { TrayIcon } from '@tauri-apps/api/tray'
import { Window } from '@tauri-apps/api/window'
import { Menu } from '@tauri-apps/api/menu'
import { resolveResource } from '@tauri-apps/api/path'

async function showAndFocusWindow() {
  const mainWindow = Window.getCurrent()
  await mainWindow.show()
  await mainWindow.unminimize()
  await mainWindow.setFocus()
  return mainWindow
}

export async function setupTray() {
    const existingTray = await TrayIcon.getById('main-tray')
    if (existingTray) {
      return existingTray
    }

    
    const isDev = import.meta.env.DEV
    const resolvedIconPath = await resolveResource('icons/tray.png')
    const iconPath = isDev ? 'icons/tray.png' : resolvedIconPath
    
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
