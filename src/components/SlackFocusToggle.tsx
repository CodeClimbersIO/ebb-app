import { useState, useEffect } from 'react'
import { SlackIcon } from '@/components/icons/SlackIcon'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useSlackStatus, useUpdateSlackPreferences } from '@/api/hooks/useSlack'
import { logAndToastError } from '@/lib/utils/ebbError.util'
import { initiateSlackOAuth } from '@/lib/utils/slackAuth.util'
import { Skeleton } from '@/components/ui/skeleton'
import { ExternalLink } from 'lucide-react'
import { SlackSettings } from '@/api/ebbApi/workflowApi'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

interface SlackFocusToggleProps {
  slackSettings: SlackSettings
  onSlackSettingsChange: (settings: SlackSettings) => void
}

export function SlackFocusToggle({ slackSettings, onSlackSettingsChange }: SlackFocusToggleProps) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [showDialog, setShowDialog] = useState(false)
  const [customStatusText, setCustomStatusText] = useState('')
  const [customStatusEmoji, setCustomStatusEmoji] = useState('')
  const { data: slackStatus, isLoading: slackStatusLoading } = useSlackStatus()
  const updatePreferencesMutation = useUpdateSlackPreferences()

  // Load current preferences when dialog opens
  useEffect(() => {
    if (showDialog && slackStatus?.preferences) {
      setCustomStatusText(slackStatus.preferences.custom_status_text || '')
      setCustomStatusEmoji(slackStatus.preferences.custom_status_emoji || '')
    }
  }, [showDialog, slackStatus?.preferences])

  const handleSlackToggle = async () => {
    if (!user) {
      toast.error('Must be logged in to use Slack', {
        action: {
          label: 'Login',
          onClick: () => navigate('/login')
        }
      })
      return
    }

    if (!slackStatus?.connected) {
      // Not connected - initiate OAuth flow
      await initiateSlackOAuth()
      onSlackSettingsChange({ ...slackSettings, dndEnabled: true })
    } else {
      // Connected - show configuration dialog
      setShowDialog(true)
    }
  }

  const handleDndToggle = async (enabled: boolean) => {
    try {
      onSlackSettingsChange({ ...slackSettings, dndEnabled: enabled })
    } catch (error) {
      logAndToastError('Failed to toggle Slack DND', error)
    }
  }

  const validateEmoji = (emoji: string): boolean => {
    if (!emoji) return true // Empty is valid
    return emoji.startsWith(':') && emoji.endsWith(':') && emoji.length > 2
  }

  const handleSavePreferences = async () => {
    if (!validateEmoji(customStatusEmoji)) {
      toast.error('Emoji must be in format :emoji_name: (e.g., :brain:)')
      return
    }

    updatePreferencesMutation.mutate({
      custom_status_text: customStatusText,
      custom_status_emoji: customStatusEmoji
    }, {
      onSuccess: () => {
        toast.success('Slack preferences updated')
        setShowDialog(false)
      },
      onError: (error) => {
        logAndToastError('Failed to update Slack preferences', error)
      }
    })
  }

  const navigateToSettings = () => {
    setShowDialog(false)
    // Navigate to settings page - you may need to adjust this based on your routing
    window.location.hash = '#/settings'
  }

  const getTooltipText = () => {
    if (!user) {
      return 'Please login to use the slack integration'
    }
    if (!isConnected) {
      return 'Connect Slack'
    }
    return slackSettings.dndEnabled ? 'Slack DND Active' : 'Slack DND Settings'
  }

  const isConnected = user && slackStatus?.connected && slackStatus?.workspaces?.length > 0
  const isActive = isConnected && slackSettings.dndEnabled

  return (
    <>
      <div className="flex items-center">
        {slackStatusLoading ? (
          <Skeleton className="h-9 w-9 rounded" />
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                onClick={handleSlackToggle}
                className="h-9 w-9 rounded-md flex items-center justify-center hover:bg-accent cursor-pointer relative"
              >
                <SlackIcon fill={isActive ? '' : 'currentColor'} className={`h-5 w-5 transition-colors ${
                  isActive 
                    ? 'text-green-500' 
                    : 'text-muted-foreground'
                }`} />
                {isActive && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>
              {getTooltipText()}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg font-normal mb-4">Slack Focus Settings</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Do Not Disturb</div>
                <div className="text-sm text-muted-foreground">
                  Enable DND mode during focus sessions
                </div>
              </div>
              <Switch
                checked={slackSettings.dndEnabled}
                onCheckedChange={handleDndToggle}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="custom-status-text" className="text-sm font-medium">Custom Status Text</label>
                <Input
                  id="custom-status-text"
                  value={customStatusText}
                  onChange={(e) => setCustomStatusText(e.target.value)}
                  placeholder="e.g., In a focus session"
                  maxLength={100}
                />
                <div className="text-xs text-muted-foreground">
                  Status message shown during focus sessions
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="custom-status-emoji" className="text-sm font-medium">Custom Status Emoji</label>
                <Input
                  id="custom-status-emoji"
                  value={customStatusEmoji}
                  onChange={(e) => setCustomStatusEmoji(e.target.value)}
                  placeholder="e.g., :brain:"
                  maxLength={50}
                  className={!validateEmoji(customStatusEmoji) ? 'border-red-500' : ''}
                />
                <div className="text-xs text-muted-foreground">
                  Emoji in format :emoji_name: (e.g., :brain:, :rocket:)
                </div>
              </div>

              <Button 
                onClick={handleSavePreferences} 
                className="w-full"
                disabled={updatePreferencesMutation.isPending}
              >
                {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>

            <div className="pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={navigateToSettings}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                More Slack Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
