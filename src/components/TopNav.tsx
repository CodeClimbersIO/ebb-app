import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '@/components/ui/logo'
import { Hotkey } from '@/components/ui/hotkey'
import { useEffect } from 'react'
import { useShortcutStore } from '@/lib/stores/shortcutStore'

interface TopNavProps {
  variant?: 'default' | 'modal'
}

export function TopNav({ variant = 'default' }: TopNavProps) {
  const navigate = useNavigate()
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
          <div className="flex-1" />
          <div className="flex items-center gap-2">
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
