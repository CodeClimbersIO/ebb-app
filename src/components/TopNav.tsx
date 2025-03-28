import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '@/components/ui/logo'

interface TopNavProps {
  variant?: 'default' | 'modal'
}

export function TopNav({ variant = 'default' }: TopNavProps) {
  const navigate = useNavigate()

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
                <div className="ml-2 flex gap-0.5">
                  <kbd className="rounded bg-violet-900 px-1.5 font-mono font-bold flex">
                    <span className="text-sm">⌘</span>
                  </kbd>
                  <kbd className="rounded bg-violet-900 px-1.5 font-mono font-bold flex">
                    <span className="text-xs self-center">E</span>
                  </kbd>
                </div>
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
