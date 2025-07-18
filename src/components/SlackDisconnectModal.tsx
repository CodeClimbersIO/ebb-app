import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { SlackIcon } from './icons/SlackIcon'
import { slackApi } from '../api/ebbApi/slackApi'
import { logAndToastError } from '../lib/utils/ebbError.util'

interface SlackWorkspace {
  team_name: string
  team_domain: string
  team_id?: string
  created_at: string
}

interface SlackDisconnectModalProps {
  isOpen: boolean
  onClose: () => void
  workspaces: SlackWorkspace[]
  onDisconnectSuccess: () => void
}

export const SlackDisconnectModal = ({ 
  isOpen, 
  onClose, 
  workspaces, 
  onDisconnectSuccess 
}: SlackDisconnectModalProps) => {
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [disconnectingWorkspace, setDisconnectingWorkspace] = useState<string | null>(null)

  const handleDisconnect = async () => {
    setIsDisconnecting(true)
    try {
      const result = await slackApi.disconnect()
      
      if (result.success) {
        onDisconnectSuccess()
        onClose()
      } else {
        throw new Error(result.error || 'Failed to disconnect from Slack')
      }
    } catch (error) {
      logAndToastError('Failed to disconnect from Slack', error)
    } finally {
      setIsDisconnecting(false)
    }
  }

  const handleDisconnectWorkspace = async (teamId: string, teamName: string) => {
    setDisconnectingWorkspace(teamId)
    try {
      const result = await slackApi.disconnect(teamId)
      
      if (result.success) {
        onDisconnectSuccess()
        // If this was the last workspace, close the modal
        if (workspaces.length === 1) {
          onClose()
        }
      } else {
        throw new Error(result.error || `Failed to disconnect from ${teamName}`)
      }
    } catch (error) {
      logAndToastError(`Failed to disconnect from ${teamName}`, error)
    } finally {
      setDisconnectingWorkspace(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SlackIcon />
            Disconnect Slack Integration
          </DialogTitle>
          <DialogDescription>
            You are about to disconnect from all Slack workspaces. This will disable all Slack integration features.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm font-medium mb-2">Connected workspaces:</p>
          <div className="space-y-2">
            {workspaces.map((workspace) => {
              const isDisconnectingThis = disconnectingWorkspace === workspace.team_id
              return (
                <div 
                  key={workspace.team_name}
                  className="flex items-center gap-2 p-2 bg-muted rounded-md"
                >
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{workspace.team_name}</div>
                    <div className="text-xs text-muted-foreground">{workspace.team_domain}</div>
                  </div>
                  {workspace.team_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisconnectWorkspace(workspace.team_id!, workspace.team_name)}
                      disabled={isDisconnecting || isDisconnectingThis}
                      className="text-xs px-2 py-1 h-6"
                    >
                      {isDisconnectingThis ? 'Disconnecting...' : 'Disconnect'}
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDisconnecting || disconnectingWorkspace !== null}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDisconnect}
            disabled={isDisconnecting || disconnectingWorkspace !== null}
          >
            {isDisconnecting ? 'Disconnecting...' : 'Disconnect All'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}