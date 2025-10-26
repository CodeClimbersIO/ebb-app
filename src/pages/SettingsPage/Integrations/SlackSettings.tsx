import { useState } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SlackIcon } from '@/components/icons/SlackIcon'
import { AnalyticsButton } from '@/components/ui/analytics-button'
import { SlackDisconnectModal } from '@/components/SlackDisconnectModal'
import { Badge } from '@/components/ui/badge'
import { KeyRound } from 'lucide-react'

import { useSlackStatus } from '@/api/hooks/useSlack'
import { initiateSlackOAuth } from '@/lib/utils/slackAuth.util'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { usePaywall } from '@/hooks/usePaywall'

export const SlackSettings = () => {
  const { user } = useAuth()
  const { data: slackStatus, refetch } = useSlackStatus()
  const { canUseSlackIntegration } = usePermissions()
  const { openPaywall } = usePaywall()
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false)

  const handleConnect = async () => {
    if (!canUseSlackIntegration) {
      openPaywall()
      return
    }
    await initiateSlackOAuth()
  }

  const handleDisconnect = async () => {
    if (!canUseSlackIntegration) {
      openPaywall()
      return
    }
    setIsDisconnectModalOpen(true)
  }

  const handleDisconnectSuccess = () => {
    refetch()
  }


  const getSlackWorkspaceMessage = () => {
    if (!user) {
      return 'Please login to use the slack integration'
    }
    if (!slackStatus) {
      return 'No workspaces connected'
    }
    let message = 'No workspaces connected'
    if (slackStatus.workspaces.length === 1) {
      message = `Connected to ${slackStatus.workspaces[0].team_name}`
    } else if (slackStatus.workspaces.length > 1) {
      message = `Connected to ${slackStatus.workspaces.length} workspaces`
    }
    return message
  }

  return (
    <div id="slack-integrations" className="space-y-2">
      <h3 className="text-sm font-semibold">Communication</h3>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SlackIcon   />
          <div>
            <div className="flex items-center gap-2">
              <div className="font-medium">Slack</div>
              <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-0">
                <KeyRound className="h-3 w-3 mr-1" />
                Pro
              </Badge>
              {slackStatus?.workspaces?.length || 0 > 0 ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 cursor-pointer">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <div className="text-sm text-muted-foreground">
                        {getSlackWorkspaceMessage()}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {slackStatus?.workspaces.map((workspace) => (
                      <div key={workspace.team_name}>
                        {workspace.team_name}
                      </div>
                    ))}
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </div>
          </div>
        </div>
        <div>
          {slackStatus?.workspaces?.length || 0 > 0 ? (
            <AnalyticsButton
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              analyticsEvent="slack_configure_clicked"
              analyticsProperties={{
                context: canUseSlackIntegration ? 'slack_configure' : 'slack_configure_locked',
                button_location: 'slack_settings'
              }}
            >
              Configure
            </AnalyticsButton>
          ) : (
            <AnalyticsButton
              variant="outline"
              size="sm"
              onClick={handleConnect}
              analyticsEvent="slack_connect_clicked"
              analyticsProperties={{
                context: canUseSlackIntegration ? 'slack_connect' : 'slack_connect_locked',
                button_location: 'slack_settings'
              }}
            >
              Connect
            </AnalyticsButton>
          )}
        </div>
      </div>

      <SlackDisconnectModal
        isOpen={isDisconnectModalOpen}
        onClose={() => setIsDisconnectModalOpen(false)}
        onDisconnectSuccess={handleDisconnectSuccess}
      />
    </div>
  )
}
