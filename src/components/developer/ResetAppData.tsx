import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { invoke } from '@tauri-apps/api/core'
import { StorageUtils } from '@/lib/utils/storage'

export const ResetAppData = () => {
  const [isResetting, setIsResetting] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)

  // Handle resetting app data
  const handleResetAppData = async () => {
    try {
      setIsResetting(true)

      // Clear localStorage data
      StorageUtils.clearAllAppData()

      // Reset databases with backup
      await invoke('reset_app_data_for_testing', { backup: true })
      // Wait a moment before reloading
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error('Error resetting app data:', error)
    } finally {
      setIsResetting(false)
    }
  }

  // Handle restoring app data
  const handleRestoreAppData = async () => {
    try {
      setIsRestoring(true)

      // Call the Rust function to restore the most recent backup
      await invoke('restore_app_data_from_backup')


      // Wait a moment before reloading
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error('Error restoring app data:', error)

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
        <Button
          variant="destructive"
          onClick={handleResetAppData}
          disabled={isResetting}
        >
          {isResetting ? 'Resetting...' : 'Reset App Data'}
        </Button>

        <Button
          variant="outline"
          onClick={handleRestoreAppData}
          disabled={isRestoring}
        >
          {isRestoring ? 'Restoring...' : 'Restore Last Backup'}
        </Button>
      </div>
    </div>
  )
} 
