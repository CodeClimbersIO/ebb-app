import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { StorageUtils } from '@/lib/utils/storage.util'
import { logAndToastError } from '@/lib/utils/ebbError.util'
import { useAuth } from '../../hooks/useAuth'
import { NoAnalyticsButton } from '../ui/no-analytics-button'

export const ResetAppData = () => {
  const [isResetting, setIsResetting] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const { logout } = useAuth()

  const handleResetAppData = async () => {
    try {
      setIsResetting(true)

      StorageUtils.clearAllAppData()

      await invoke('reset_app_data_for_testing', { backup: true })
      await logout()
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      logAndToastError(`Error resetting app data: ${error}`, error)
    } finally {
      setIsResetting(false)
    }
  }

  const handleRestoreAppData = async () => {
    try {
      setIsRestoring(true)

      await invoke('restore_app_data_from_backup')

      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      logAndToastError(`Error restoring app data: ${error}`, error)

    } finally {
      setIsRestoring(false)
    }
  }

  return (
    <div className="bg-red-950 border border-red-900 rounded-md p-4 mb-6">
      <h3 className="text-lg font-medium text-red-400 mb-2">Reset App Data</h3>
      <p className="text-red-400 mb-4">
        This will reset all app data to simulate a first-time experience. Your existing data will be backed up.
      </p>
      <div className="flex space-x-4">
        <NoAnalyticsButton
          variant="destructive"
          onClick={handleResetAppData}
          disabled={isResetting}
        >
          {isResetting ? 'Resetting...' : 'Reset App Data'}
        </NoAnalyticsButton>

        <NoAnalyticsButton
          variant="outline"
          onClick={handleRestoreAppData}
          disabled={isRestoring}
        >
          {isRestoring ? 'Restoring...' : 'Restore Last Backup'}
        </NoAnalyticsButton>
      </div>
    </div>
  )
} 
