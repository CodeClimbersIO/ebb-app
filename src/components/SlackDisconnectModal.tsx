import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { SlackIcon } from './icons/SlackIcon'
import { slackApi } from '../api/ebbApi/slackApi'
import { logAndToastError } from '../lib/utils/ebbError.util'
import { useSlackStatus } from '../api/hooks/useSlack'

interface SlackDisconnectModalProps {
  isOpen: boolean
  onClose: () => void
  onDisconnectSuccess: () => void
}

export const SlackDisconnectModal = ({ 
  isOpen, 
  onClose, 
  onDisconnectSuccess 
}: SlackDisconnectModalProps) => {
  const { data: slackStatus } = useSlackStatus()
  const workspaces = slackStatus?.workspaces || []
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [disconnectingWorkspace, setDisconnectingWorkspace] = useState<string | null>(null)

  const handleDisconnect = async () => {
    setIsDisconnecting(true)
    try {
      const result = await slackApi.disconnect()
      
      if (result) {
        onDisconnectSuccess()
        onClose()
      } else {
        throw new Error('Failed to disconnect from Slack')
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
      console.log('Disconnecting workspace:', { teamId, teamName })
      const result = await slackApi.disconnect(teamId)
      console.log('Disconnect result:', result)
      
      if (result.success) {
        onDisconnectSuccess()
        // If this was the last workspace, close the modal
        if (workspaces.length === 1) {
          onClose()
        }
      } else {
        throw new Error(`Failed to disconnect from ${teamName}`)
      }
    } catch (error) {
      console.error('Disconnect error:', error)
      logAndToastError(`Failed to disconnect from ${teamName}`, error)
    } finally {
      setDisconnectingWorkspace(null)
    }
  }

  const handleConnectWorkspace = async () => {
    try {
      const result = await slackApi.initiateOAuth()
      if (result?.authUrl) {
        // Use the same pattern as Spotify - external browser for production
        const isDev = import.meta.env.DEV
        if (isDev) {
          window.location.href = result.authUrl
        } else {
          await import('@tauri-apps/api/core').then(({ invoke }) => 
            invoke('plugin:shell|open', { path: result.authUrl })
          )
        }
      } else {
        throw new Error('Failed to get Slack auth URL')
      }
    } catch (error) {
      logAndToastError('Failed to initiate Slack connection', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SlackIcon />
            Configure Slack Integration
          </DialogTitle>
          <DialogDescription>
            Manage your Slack workspace connections and integration settings.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">Connected workspaces:</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleConnectWorkspace}
              disabled={isDisconnecting || disconnectingWorkspace !== null}
              className="text-xs"
            >
              Connect Another
            </Button>
          </div>
          <div className="space-y-2">
            {workspaces.map((workspace) => {
              const workspaceId = workspace.id
              const isDisconnectingThis = disconnectingWorkspace === workspaceId
              console.log('Workspace debug:', { 
                workspaceName: workspace.team_name,
                workspaceId, 
                isDisconnectingThis 
              })
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDisconnectWorkspace(workspace.id, workspace.team_name)}
                    disabled={isDisconnecting || isDisconnectingThis}
                    className="text-xs px-2 py-1 h-6"
                  >
                    {isDisconnectingThis ? 'Disconnecting...' : 'Disconnect'}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDisconnecting || disconnectingWorkspace !== null}>
            Close
          </Button>
          {workspaces.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleDisconnect}
              disabled={isDisconnecting || disconnectingWorkspace !== null}
            >
              {isDisconnecting ? 'Disconnecting...' : 'Disconnect All'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
