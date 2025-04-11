import { useEffect } from 'react'
import { enable, isEnabled } from '@tauri-apps/plugin-autostart'

export const useAutostart = () => {
  useEffect(() => {
    const initAutostart = async () => {
      const enabled = await isEnabled()
      if (!enabled) {
        await enable()
      }
    }

    initAutostart()
  }, [])
} 
