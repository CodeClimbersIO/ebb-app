import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface TopNavProps {
  variant?: 'default' | 'modal'
}

export function TopNav({ variant = 'default' }: TopNavProps) {
  const navigate = useNavigate()

  const handleStartFlowSession = () => {
    navigate('/start-flow')
  }

  return (
    <div className="h-14 border-b w-full flex items-center px-4">
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        {variant === 'default' ? (
          <Button  
            size="sm" 
            onClick={handleStartFlowSession}
          >
            Start Focus
            <kbd className="ml-2 rounded bg-violet-900 px-1.5 font-mono text-xs">
              F6
            </kbd>
          </Button>
        ) : (
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <X className="h-6 w-6" />
          </Button>
        )}
      </div>
    </div>
  )
} 
