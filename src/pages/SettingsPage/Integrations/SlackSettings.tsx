import { useState } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SlackIcon } from '@/components/icons/SlackIcon'
import { Button } from '@/components/ui/button'
import { SlackDisconnectModal } from '@/components/SlackDisconnectModal'

import { useSlackStatus } from '@/api/hooks/useSlack'
import { initiateSlackOAuth } from '@/lib/utils/slackAuth.util'

export const SlackSettings = () => {
  const { data: slackStatus, isLoading: slackStatusLoading, refetch } = useSlackStatus()
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false)

  if (slackStatusLoading) {
    return <div>Loading...</div>
  }

  const handleConnect = async () => {
    await initiateSlackOAuth()
  }

  const handleDisconnect = async () => {
    setIsDisconnectModalOpen(true)
  }

  const handleDisconnectSuccess = () => {
    refetch()
  }

  if (!slackStatus) {
    return <div>Error loading your Slack status. Please try again later.</div>
  }

  const getSlackWorkspaceMessage = () => {
    let message = 'No workspaces connected'
    if (slackStatus.workspaces.length === 1) {
      message = `Connected to ${slackStatus.workspaces[0].team_name}`
    } else if (slackStatus.workspaces.length > 1) {
      message = `Connected to ${slackStatus.workspaces.length} workspaces`
    }
    return message
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Communication</h3>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SlackIcon   />
          <div>
            <div className="flex items-center gap-2">
              <div className="font-medium">Slack</div>
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
                  {slackStatus.workspaces.length > 0 ? slackStatus.workspaces.map((workspace) => (
                    <div key={workspace.team_name}>
                      {workspace.team_name}
                    </div>
                  )) : 'Press "Connect" to begin adding your Slack workspaces'}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
        <div>
          {slackStatus?.workspaces.length > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
            >
              Configure
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleConnect}
                  >
                    Connect
                  </Button>
                </span>
              </TooltipTrigger>
            </Tooltip>
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
