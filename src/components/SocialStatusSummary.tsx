import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ConnectIcon } from '@/components/icons/ConnectIcon'
import { useConnectedStore } from '@/lib/stores/connectedStore'
import { UserStatusCounts, useUserStatusCounts } from '@/api/hooks/useUsers'
import { useProfile, useUpdateProfileLocation } from '@/api/hooks/useProfile'
import { useAuth } from '@/hooks/useAuth'
import { logAndToastError } from '../lib/utils/ebbError.util'

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
            <div className={`absolute inset-0 w-2 h-2 ${colorClass.bg} rounded-full animate-ping opacity-80`} style={{animationDuration: '3s'}}></div>
          </>
        )}
      </div>
      <span className="font-semibold text-sm">
        {count} {statusName}
      </span>
    </div>
  )
}

const getStatusCounts = (userStatusCounts?: UserStatusCounts) => {
  if (!userStatusCounts) return { online: 0, flowing: 0 }
  return {
    online: userStatusCounts.online + userStatusCounts.active,
    flowing: userStatusCounts.flowing,
  }
}

export function SocialStatusSummary() {
  const { connected, setConnected } = useConnectedStore()
  const { data: communityStatuses, isLoading: isLoadingStatuses, refetch: refetchStatusCounts } = useUserStatusCounts()
  const { mutateAsync: updateProfileLocation, isPending: isUpdatingProfileLocation } = useUpdateProfileLocation()
  const { profile, isLoading: isLoadingProfile } = useProfile()
  const { user } = useAuth()

  const navigate = useNavigate()
  const [statusCounts, setStatusCounts] = useState(getStatusCounts(communityStatuses))

  const isLoading = isLoadingStatuses || isLoadingProfile

  useEffect(() => {
    if (communityStatuses) {
      const counts = getStatusCounts(communityStatuses)
      setStatusCounts(counts)
    }
  }, [communityStatuses])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && connected) {
        refetchStatusCounts()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [refetchStatusCounts, connected])

  const handleConnect = async () => {
    if (!user) {
      navigate('/login')
    }
    if (!profile?.latitude || !profile?.longitude) {
      try {
        await updateProfileLocation()
        setConnected(true)
      } catch (error) {
        logAndToastError('Failed to update profile location', error)
      }
    }
  }

  const handleStatusClick = () => {
    navigate('/friends')
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-4 pl-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4 pl-6">
      {!connected && (
        <div className="relative">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleConnect} 
            disabled={isUpdatingProfileLocation}
            className="gap-2 border-primary text-white hover:bg-primary hover:text-primary-foreground relative z-10"
          >
            Connect
            <ConnectIcon size={20} />
          </Button>
          <div className="absolute inset-0 border border-primary/50 rounded-md animate-ping opacity-75" style={{animationDuration: '3s'}}></div>
        </div>
      )}
      <div 
        onClick={connected ? handleStatusClick : undefined}
        className={`flex items-center gap-2 ${connected ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      >
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
    </div>
  )
} 
