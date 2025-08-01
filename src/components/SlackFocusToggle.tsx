import { useState } from 'react'
import { SlackIcon } from '@/components/icons/SlackIcon'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useSlackStatus } from '@/api/hooks/useSlack'
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
  const { data: slackStatus, isLoading: slackStatusLoading } = useSlackStatus()

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
