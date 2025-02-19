import { TrayIcon } from '@tauri-apps/api/tray'
import { Window } from '@tauri-apps/api/window'
import { Menu } from '@tauri-apps/api/menu'

let trayInstance: TrayIcon | null = null

export async function setupTray() {
  try {
    // Clean up existing tray if it exists
    if (trayInstance) {
      await trayInstance.close()
    }

    const menu = await Menu.new({
      items: [
        {
          text: 'Go to Dashboard',
          action: async () => {
            const mainWindow = Window.getCurrent()
            await mainWindow.show()
            await mainWindow.unminimize()
            await mainWindow.setFocus()
          }
        },
        {
          text: 'Quit',
          action: async () => {
            // Close the window first
            await Window.getCurrent().close()
            // Then close the tray
            if (trayInstance) {
              await trayInstance.close()
              trayInstance = null
            }
            // Actually quit the app
            await Window.getCurrent().destroy()
          }
        }
      ]
    })

    trayInstance = await TrayIcon.new({
      id: 'main-tray',
      tooltip: 'Ebb',
      icon: 'icons/tray.png',
      menu,
      menuOnLeftClick: true,
    })

    // Add event listener for app cleanup
    window.addEventListener('unload', async () => {
      if (trayInstance) {
        await trayInstance.close()
        trayInstance = null
      }
    })

    return trayInstance
  } catch (error) {
    console.error('Failed to setup tray:', error)
    throw error
  }
} 
