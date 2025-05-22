import { useState } from 'react'
import { Button } from './ui/button'
import { ConnectIcon } from './icons/ConnectIcon'

interface StatusBadgeProps {
  color: 'green' | 'purple'
  count: number | string
  statusName: string
  disabled?: boolean
}

function StatusBadge({ color, count, statusName, disabled = false }: StatusBadgeProps) {
  const colorClasses = {
    green: {
      bg: disabled ? 'bg-muted-foreground/30' : 'bg-green-500',
      shadow: disabled ? 'shadow-muted-foreground/10' : 'shadow-green-500/30'
    },
    purple: {
      bg: disabled ? 'bg-muted-foreground/30' : 'bg-primary',
      shadow: disabled ? 'shadow-muted-foreground/10' : 'shadow-primary/30'
    }
  }

  const colorClass = colorClasses[color]

  return (
    <div className={`flex items-center gap-2 px-1 py-1 bg-secondary/20 rounded-full ${disabled ? 'opacity-50' : ''}`}>
      <div className="relative">
        <div className={`w-2 h-2 ${colorClass.bg} rounded-full`}></div>
        {!disabled && (
          <>
            <div className={`absolute inset-0 w-2 h-2 ${colorClass.bg} rounded-full animate-ping opacity-40`} style={{animationDuration: '3s'}}></div>
            <div className={`absolute inset-0 w-2 h-2 ${colorClass.bg} rounded-full shadow-lg ${colorClass.shadow} animate-pulse opacity-50`} style={{animationDuration: '4s'}}></div>
          </>
        )}
      </div>
      <span className="font-semibold text-sm">
        {count} {statusName}
      </span>
    </div>
  )
}

export function SocialStatusSummary() {
  // Mock state for status counts and connection
  const [connected, setConnected] = useState(false)
  const [statusCounts] = useState({
    online: 42,
    flowing: 17,
  })

  const handleConnect = () => {
    setConnected(true)
  }

  return (
    <div className="flex items-center gap-4 pl-6">
      {!connected && (
        <div className="relative">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleConnect} 
            className="gap-2 border-primary text-white hover:bg-primary hover:text-primary-foreground relative z-10"
          >
            Connect
            <ConnectIcon size={20} />
          </Button>
          <div className="absolute inset-0 border border-primary/50 rounded-md animate-ping opacity-75" style={{animationDuration: '3s'}}></div>
        </div>
      )}
      <StatusBadge 
        color="green" 
        count={connected ? statusCounts.online : ''} 
        statusName="Online" 
        disabled={!connected}
      />
      <StatusBadge 
        color="purple" 
        count={connected ? statusCounts.flowing : ''} 
        statusName="Flowing" 
        disabled={!connected}
      />
    </div>
  )
} 
