import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '@/components/ui/logo'
import { Hotkey } from '@/components/ui/hotkey'
import { useEffect } from 'react'
import { useShortcutStore } from '@/lib/stores/shortcutStore'
import { CircleHelpIcon } from './icons/CircleHelpIcon'
import { Tooltip, TooltipContent , TooltipTrigger } from './ui/tooltip'
import { SocialStatusSummary } from './SocialStatusSummary'
import { useAuthStore } from '../lib/stores/authStore'
import { hasAccessToSocial } from '../lib/utils/environment.util'

interface TopNavProps {
  variant?: 'default' | 'modal'
}

export function TopNav({ variant = 'default' }: TopNavProps) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { shortcutParts, loadShortcutFromStorage } = useShortcutStore()

  useEffect(() => {
    loadShortcutFromStorage()
  }, [loadShortcutFromStorage])

  const handleStartFlowSession = () => {
    navigate('/start-flow')
  }

  return (
    <div className="flex">
      <div className="w-16 shrink-0">
        <div className="h-14 border-b flex items-center pl-4">
          <div 
            className="cursor-pointer relative z-10" 
            onClick={() => navigate('/')}
          >
            <Logo width={32} height={32} />
          </div>
        </div>
      </div>
      <div className="-ml-16 flex-1">
        <div className="h-14 border-b w-full flex items-center pl-16 pr-4">
          {hasAccessToSocial(user?.email) && <SocialStatusSummary />}
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  iconSize={5}
                  className={`w-9 h-9 p-2 ${location.pathname === '/feedback' ? 'text-foreground [&>svg]:text-foreground' : 'text-muted-foreground [&>svg]:text-muted-foreground'}`}
                  asChild
                >
                  <Link to="/feedback">
                    <CircleHelpIcon size={20} />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={10}>Feedback</TooltipContent>
            </Tooltip>
            {variant === 'default' ? (
              <Button  
                size="sm" 
                onClick={handleStartFlowSession}
              >
                Start Focus
                {shortcutParts.length > 0 && shortcutParts.some(part => part) && (
                  <div className="ml-2 flex gap-1.5">
                    {shortcutParts.map((part, i) => (
                      <Hotkey key={i} size="sm">{part}</Hotkey>
                    ))}
                  </div>
                )}
              </Button>
            ) : (
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <X className="h-6 w-6" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 
