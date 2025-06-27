import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DeviceProfileApi, SmartFocusSettings as SmartFocusSettingsType } from '@/api/ebbApi/deviceProfileApi'
import { WorkflowApi, Workflow } from '@/api/ebbApi/workflowApi'
import { useNavigate } from 'react-router-dom'
import { logAndToastError } from '@/lib/utils/ebbError.util'

export function SmartFocusSettings() {
  const [settings, setSettings] = useState<SmartFocusSettingsType>({
    enabled: false,
    trigger_duration_minutes: 10,
    workflow_id: null
  })
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const navigate = useNavigate()

  const durationOptions = [
    { value: 10, label: '10 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 20, label: '20 minutes' },
    { value: 25, label: '25 minutes' },
    { value: 30, label: '30 minutes' },
  ]

  useEffect(() => {
    const loadData = async () => {
      try {
        const [smartFocusSettings, workflowList] = await Promise.all([
          DeviceProfileApi.getSmartFocusSettings(),
          WorkflowApi.getWorkflows()
        ])
        
        setSettings(smartFocusSettings)
        setWorkflows(workflowList)
      } catch (error) {
        logAndToastError(`Failed to load smart focus settings: ${error}`, error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const handleToggleEnabled = async (enabled: boolean) => {
    setIsSaving(true)
    const newSettings = { ...settings, enabled }
    await DeviceProfileApi.updateSmartFocusSettings(newSettings)
    setSettings(newSettings)
    setIsSaving(false)
  }

  const handleDurationChange = async (value: string) => {
    setIsSaving(true)
    const trigger_duration_minutes = parseInt(value)
    const newSettings = { ...settings, trigger_duration_minutes }
    await DeviceProfileApi.updateSmartFocusSettings(newSettings)
    setSettings(newSettings)
    setIsSaving(false)
  }

  const handleWorkflowChange = async (workflowId: string) => {
    setIsSaving(true)
    const workflow_id = workflowId === 'none' ? null : workflowId
    const newSettings = { ...settings, workflow_id }
    await DeviceProfileApi.updateSmartFocusSettings(newSettings)
    setSettings(newSettings)
    setIsSaving(false)
  }

  const handleManageWorkflows = () => {
    navigate('/start-flow')
  }

  if (isLoading) {
    return (
      <div className="border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Smart Focus</h2>
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="border rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Smart Focus</h2>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Auto-start Focus Sessions</div>
            <div className="text-sm text-muted-foreground">
              Automatically start a focus session when you've been creating for a set amount of time
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
                  How long you need to be creating before a focus session starts
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
              <div className="flex items-center gap-2">
                <Select 
                  value={settings.workflow_id || 'none'} 
                  onValueChange={handleWorkflowChange}
                  disabled={isSaving}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select workflow" />
                  </SelectTrigger>
                  <SelectContent>
                    {workflows.map((workflow) => (
                      <SelectItem key={workflow.id} value={workflow.id!}>
                        {workflow.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManageWorkflows}
                  disabled={isSaving}
                >
                  Manage
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
