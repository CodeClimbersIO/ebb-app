import { Layout } from '@/components/Layout'
import { ModeToggle } from '@/components/ModeToggle'
import { useState, useEffect } from 'react'
import { AnalyticsButton } from '@/components/ui/analytics-button'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useNavigate } from 'react-router-dom'
import supabase from '@/lib/integrations/supabase'
import { useAuth } from '@/hooks/useAuth'
import { invoke } from '@tauri-apps/api/core'
import { ShortcutInput } from '@/components/ShortcutInput'
import { Switch } from '@/components/ui/switch'
import { isEnabled } from '@tauri-apps/plugin-autostart'
import { logAndToastError } from '@/lib/utils/ebbError.util'
import { ActiveDevicesSettings } from '@/components/ActiveDevicesSettings'
import { UserProfileSettings } from '@/components/UserProfileSettings'
import { userApi } from '@/api/ebbApi/userApi'
import { usePermissions } from '@/hooks/usePermissions'
import { DeveloperSettings } from '@/components/developer/DeveloperSettings'
import { CommunityCard } from '@/components/CommunityCard'
import { useDeviceProfile, useUpdateDeviceProfilePreferences } from '@/api/hooks/useDeviceProfile'
import { version } from '../../../package.json'
import { IntegrationSettings } from './Integrations/IntegrationSettings'

export function SettingsPage() {
  const [autostartEnabled, setAutostartEnabled] = useState(false)
  const [idleSensitivityChanged, setIdleSensitivityChanged] = useState(false)

  const navigate = useNavigate()
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { user } = useAuth()
  const { maxDevices } = usePermissions()
  const { deviceProfile } = useDeviceProfile()
  const { mutate: updateDeviceProfilePreferences } = useUpdateDeviceProfilePreferences()

  const idleOptions = [
    { value: 30, label: '30 seconds' },
    { value: 60, label: '1 minute' },
    { value: 120, label: '2 minutes' },
    { value: 180, label: '3 minutes' },
    { value: 300, label: '5 minutes' },
    { value: 600, label: '10 minutes' },
  ]


  useEffect(() => {
    const checkAutostart = async () => {
      const enabled = await isEnabled()
      setAutostartEnabled(enabled)
    }
    checkAutostart()
  }, [])

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true)
      await userApi.deleteAccount()

      await supabase.auth.signOut()
      navigate('/')
    } catch (error) {
      logAndToastError(`Error deleting account: ${error}`, error)
    } finally {
      setIsDeleting(false)
      setShowDeleteAccountDialog(false)
    }
  }

  const handleAutostartToggle = async () => {
    try {
      await invoke('change_autostart', { open: !autostartEnabled })
      setAutostartEnabled(!autostartEnabled)
    } catch (error) {
      logAndToastError(`Error toggling autostart: ${error}`, error)
    }
  }

  const handleIdleSensitivityChange = async (value: string) => {
    const newSensitivity = parseInt(value)
    try {
      if (!deviceProfile || !deviceProfile.device_id) return
      updateDeviceProfilePreferences({
        deviceId: deviceProfile?.device_id,
        preferences: {
          ...deviceProfile.preferences_json,
          idle_sensitivity: newSensitivity,
        },
      })
      setIdleSensitivityChanged(true)
    } catch (error) {
      logAndToastError(`Error setting idle sensitivity: ${error}`, error)
    }
  }
  
  const idleSensitivity = deviceProfile?.preferences_json?.idle_sensitivity || 60

  return (
    <Layout>
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-semibold mb-8">Settings</h1>

          <div className="space-y-8">
            <UserProfileSettings user={user} />

            <div className="border rounded-lg p-6">
              <ActiveDevicesSettings 
                user={user} 
                maxDevices={maxDevices} 
              />
            </div>

            <div className="border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">System</h2>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="font-medium">Theme</div>
                  <div className="text-sm text-muted-foreground">
                      Customize how Ebb looks on your device
                  </div>
                </div>
                <div className="relative">
                  <ModeToggle />
                </div>
              </div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="font-medium">Global Shortcut</div>
                  <div className="text-sm text-muted-foreground">
                      Use this shortcut anywhere to start a focus session
                  </div>
                </div>
                <ShortcutInput popoverAlign="end" />
              </div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="font-medium">Idle Sensitivity</div>
                  <div className={`text-sm ${idleSensitivityChanged ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {idleSensitivityChanged 
                      ? 'Please restart Ebb to apply changes'
                      : 'Changes how long you have to be inactive to be considered "idle"'
                    }
                  </div>
                </div>
                <Select value={idleSensitivity.toString()} onValueChange={handleIdleSensitivityChange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {idleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Launch on Startup</div>
                  <div className="text-sm text-muted-foreground">
                      Automatically start Ebb when you log in to your computer
                  </div>
                </div>
                <Switch
                  checked={autostartEnabled}
                  onCheckedChange={handleAutostartToggle}
                />
              </div>
            </div>
            <IntegrationSettings />

            <CommunityCard/>

            <div className="border rounded-lg p-6 mt-8">
              <h2 className="text-lg font-semibold mb-4 text-red-500">Danger Zone</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-8">
                  <div>
                    <div className="font-medium">Delete Account</div>
                    <div className="text-sm text-muted-foreground">
                        Permanently delete your account, Ebb license, and cloud data. Local usage data will not be deleted.
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <AnalyticsButton
                      variant="destructive"
                      onClick={() => setShowDeleteAccountDialog(true)}
                      analyticsEvent="delete_account_clicked"
                      analyticsProperties={{ button_location: 'settings_page' }}
                    >
                        Delete Account
                    </AnalyticsButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DeveloperSettings />
          <div className="mt-12 flex justify-between text-sm text-muted-foreground/50">
            <div>Ebb Version {version}</div>
            <div className="flex items-center gap-2">
              <span>Slop by </span>
              <button 
                onClick={() => invoke('plugin:shell|open', { path: 'https://x.com/PaulHovley' })}
                className="hover:underline"
              >
                  Paul Hovley
              </button>
              <span>&</span>
              <button 
                onClick={() => invoke('plugin:shell|open', { path: 'https://x.com/nathan_covey' })}
                className="hover:underline"
              >
                  Nathan Covey
              </button>
              <span>•</span>
              <button 
                onClick={() => invoke('plugin:shell|open', { path: 'https://ebb.cool/terms' })}
                className="hover:underline"
              >
                  Terms
              </button>
              <span>•</span>
              <button 
                onClick={() => invoke('plugin:shell|open', { path: 'https://ebb.cool/privacy' })}
                className="hover:underline"
              >
                  Privacy
              </button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Warning: Will Also Delete Your Ebb License</DialogTitle>
            <DialogDescription>
                This will permanently delete your account, your Ebb License, and remove all of your scoring and friends data from our servers. This action cannot be undone.  Your local usage data will remain.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <AnalyticsButton
              variant="outline"
              onClick={() => setShowDeleteAccountDialog(false)}
              disabled={isDeleting}
              analyticsEvent="delete_account_clicked_canceled"
              analyticsProperties={{ button_location: 'settings_page' }}
            >
                Cancel
            </AnalyticsButton>
            <AnalyticsButton
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              analyticsEvent="delete_account_clicked_confirmed"
              analyticsProperties={{ button_location: 'settings_page' }}
            >
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </AnalyticsButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  )
} 
