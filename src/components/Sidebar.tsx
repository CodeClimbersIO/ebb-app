import { Button } from '@/components/ui/button'
import { Link, useLocation } from 'react-router-dom'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SettingsGearIcon } from '@/components/icons/GearIcon'
import { HomeIcon } from '@/components/icons/HomeIcon'
import { UsersIcon } from '@/components/icons/UsersIcon'
import { KeyIcon } from '@/components/icons/KeyIcon'
import { ChartIcon } from '@/components/icons/ChartIcon'
import { PaywallDialog } from '@/components/PaywallDialog'
import { usePermissions } from '@/hooks/usePermissions'
import { canaryUsers } from '../lib/utils/environment.util'
import { useAuth } from '../hooks/useAuth'

export function Sidebar() {
  const location = useLocation()
  const { hasProAccess } = usePermissions()
  const { user } = useAuth()

  const canSeeNewFriendsPage = canaryUsers.includes(user?.email || '')

  return (
    
    <div className="w-16 h-full flex flex-col">
      <div className="flex-1 border-r flex flex-col">
        <nav className="px-1 pt-4 space-y-2 flex-1 flex flex-col items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                iconSize={5}
                className={`w-9 h-9 p-2 ${location.pathname === '/' ? 'text-foreground [&>svg]:text-foreground' : 'text-muted-foreground [&>svg]:text-muted-foreground'}`}
                asChild
              >
                <Link to="/">
                  <HomeIcon size={20} />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>Today</TooltipContent>
          </Tooltip>

          {canSeeNewFriendsPage && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  iconSize={5}
                  className={`w-9 h-9 p-2 ${location.pathname === '/friends-analytics' ? 'text-foreground [&>svg]:text-foreground' : 'text-muted-foreground [&>svg]:text-muted-foreground'}`}
                  asChild
                >
                  <Link to="/friends-analytics">
                    <ChartIcon size={20} />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10}>Friends</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                iconSize={5}
                className={`w-9 h-9 p-2 ${location.pathname === '/community' ? 'text-foreground [&>svg]:text-foreground' : 'text-muted-foreground [&>svg]:text-muted-foreground'}`}
                asChild
              >
                <Link to="/community">
                  <UsersIcon size={20} />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>Community</TooltipContent>
          </Tooltip>
        </nav>

        {!hasProAccess && (
          <div className="p-2 border-t flex justify-center">
            <PaywallDialog>
              <Button variant="ghost" iconSize={5} className="w-9 h-9 p-2">
                <KeyIcon size={20} className="text-yellow-500" />
              </Button>
            </PaywallDialog>
          </div>
        )}

        <div className="p-2 border-t flex justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                iconSize={5}
                className={`w-9 h-9 p-2 ${location.pathname === '/settings' ? 'text-foreground [&>svg]:text-foreground' : 'text-muted-foreground [&>svg]:text-muted-foreground'}`}
                asChild
              >
                <Link to="/settings">
                  <SettingsGearIcon size={20} />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>Settings</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}
