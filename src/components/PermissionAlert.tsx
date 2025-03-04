import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { error as errorLog } from '@tauri-apps/plugin-log'
export const PermissionAlert = () => {
  const [permissionStatus, setPermissionStatus] = useState<boolean | null>(null)

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const hasPermissions = await invoke<boolean>('check_accessibility_permissions')
        setPermissionStatus(hasPermissions)
        if (hasPermissions) {
          const isMonitoringRunning = await invoke<boolean>('is_monitoring_running')
          if (!isMonitoringRunning) {
            await invoke('start_system_monitoring')
          }
        }
      } catch (error) {
        errorLog(`Error checking permissions: ${error}`)
        setPermissionStatus(false)
      }
    }

    checkPermissions()

    const intervalTime = permissionStatus === false ? 1000 : 30000
    const permissionInterval = setInterval(checkPermissions, intervalTime)

    return () => {
      clearInterval(permissionInterval)
    }
  }, [permissionStatus])

  const handleRequestPermissions = async () => {
    try {
      await invoke('request_system_permissions')
    } catch (error) {
      errorLog(`Failed to request permissions: ${error}`)
    }
  }

  if (permissionStatus !== false) {
    return null
  }

  return (
    <Alert variant="destructive" className="mb-6 bg-red-950 border-red-900">
      <AlertCircle className="h-4 w-4 text-red-400" />
      <AlertDescription className="text-red-400">
        Ebb needs accessibility permissions to support blocking, time tracking, and shortcuts.{' '}
        <button
          onClick={handleRequestPermissions}
          className="underline hover:text-red-300 font-medium"
        >
          Enable permissions
        </button>
      </AlertDescription>
    </Alert>
  )
} 
