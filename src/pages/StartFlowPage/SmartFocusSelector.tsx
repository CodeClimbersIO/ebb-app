import { useState, useEffect } from 'react'
import { SmartFocusIcon } from '@/components/icons/SmartFocusIcon'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Workflow } from '@/api/ebbApi/workflowApi'
import { logAndToastError } from '@/lib/utils/ebbError.util'
import { SmartFocusSettings as SmartFocusSettingsType } from '@/db/ebb/deviceProfileRepo'
import { useDeviceProfile, useUpdateDeviceProfilePreferences } from '@/api/hooks/useDeviceProfile'
import { Skeleton } from '@/components/ui/skeleton'

interface SmartFocusSelectorProps {
  workflows: Workflow[]
}

export function SmartFocusSelector({ workflows }: SmartFocusSelectorProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [settings, setSettings] = useState<SmartFocusSettingsType>({
    enabled: false,
    trigger_duration_minutes: 10,
    doomscroll_duration_minutes: 30,
    workflow_id: null
  })
  const { deviceId, deviceProfile } = useDeviceProfile()
  const { mutate: updateDeviceProfilePreferences } = useUpdateDeviceProfilePreferences()

  const durationOptions = [
    { value: 10, label: '10 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 20, label: '20 minutes' },
    { value: 25, label: '25 minutes' },
    { value: 30, label: '30 minutes' },
  ]

  useEffect(() => {
    const loadSettings = async () => {
      if (!deviceProfile) return
      try {
        const smartFocusSettings = deviceProfile.preferences_json.smart_focus_settings
        setSettings(smartFocusSettings)
      } catch (error) {
        logAndToastError(`Failed to load smart focus settings: ${error}`, error)
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [deviceProfile])

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 1000) // Animation lasts 0.5 seconds
    }, 5000) // Trigger every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const handleToggleEnabled = async (enabled: boolean) => {
    if (!deviceId || !deviceProfile) return
    setIsSaving(true)
    const newSettings = { ...settings, enabled }
    await updateDeviceProfilePreferences({
      deviceId,
      preferences: {
        ...deviceProfile.preferences_json,
        smart_focus_settings: newSettings
      }
    })
    setSettings(newSettings)
    setIsSaving(false)
  }

  const handleDurationChange = async (value: string) => {
    if (!deviceId || !deviceProfile) return
    setIsSaving(true)
    const trigger_duration_minutes = parseInt(value)
    const newSettings = { ...settings, trigger_duration_minutes }
    await updateDeviceProfilePreferences({
      deviceId,
      preferences: {
        ...deviceProfile.preferences_json,
        smart_focus_settings: newSettings
      }
    })
    setSettings(newSettings)
    setIsSaving(false)
  }

  const handleWorkflowChange = async (workflowId: string) => {
    if (!deviceId || !deviceProfile) return
    setIsSaving(true)
    const workflow_id = workflowId === 'none' ? null : workflowId
    const newSettings = { ...settings, workflow_id }
    await updateDeviceProfilePreferences({
      deviceId,
      preferences: {
        ...deviceProfile.preferences_json,
        smart_focus_settings: newSettings
      }
    })
    setSettings(newSettings)
    setIsSaving(false)
  }

  return (
    <>
      <div className="flex items-center">
        {isLoading ? (
          <Skeleton className="h-9 w-9 rounded" />
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                onClick={() => setShowDialog(true)}
                className="h-9 w-9 rounded-md flex items-center justify-center hover:bg-accent cursor-pointer"
              >
                <SmartFocusIcon 
                  className={`h-5 w-5 transition-all duration-500 ${
                    settings.enabled 
                      ? 'text-violet-500' 
                      : 'text-muted-foreground'
                  } ${
                    isAnimating && !settings.enabled
                      ? 'animate-pulse drop-shadow-lg brightness-250' 
                      : ''
                  }`}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>Smart Focus</TooltipContent>
          </Tooltip>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg font-normal mb-4">Smart Focus Settings</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Auto-start Focus Sessions</div>
                <div className="text-sm text-muted-foreground">
                  Automatically start focus sessions when you've been creating for a set time
                </div>
              </div>
              <Switch
                checked={settings.enabled}
                onCheckedChange={handleToggleEnabled}
                disabled={isSaving}
              />
            </div>

            {settings.enabled && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Trigger Duration</div>
                    <div className="text-sm text-muted-foreground">
                      How long you need to be creating before a session starts
                    </div>
                  </div>
                  <Select 
                    value={settings.trigger_duration_minutes.toString()} 
                    onValueChange={handleDurationChange}
                    disabled={isSaving}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Default Workflow</div>
                    <div className="text-sm text-muted-foreground">
                      Which workflow preset to use for auto-started sessions
                    </div>
                  </div>
                  <Select 
                    value={settings.workflow_id || 'none'} 
                    onValueChange={handleWorkflowChange}
                    disabled={isSaving}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select workflow" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {workflows.map((workflow) => (
                        <SelectItem key={workflow.id} value={workflow.id!}>
                          {workflow.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 
