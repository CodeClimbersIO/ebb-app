import { invoke } from '@tauri-apps/api/core'
import { Button } from './ui/button'
import { DiscordIcon } from './icons/DiscordIcon'
import { GithubIcon } from './icons/GithubIcon'

export const CommunityCard = () => {
  return (
    <div className="border rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Community</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-8">
          <div>
            <div className="text-sm text-muted-foreground">
            Ebb is maintained by an open source community called CodeClimbers. Join us on Discord or GitHub to get involved.
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => invoke('plugin:shell|open', { path: 'https://discord.gg/qhST6C5XxV' })}
              className="gap-2"
            >
              <DiscordIcon />
            Discord
            </Button>
            <Button
              variant="outline"
              onClick={() => invoke('plugin:shell|open', { path: 'https://github.com/CodeClimbersIO/ebb-app' })}
              className="gap-2"
            >
              <GithubIcon />
            GitHub
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
