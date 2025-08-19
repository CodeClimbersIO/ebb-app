import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnalyticsButton } from '@/components/ui/analytics-button'
import { Skeleton } from '@/components/ui/skeleton'
import { ConnectIcon } from '@/components/icons/ConnectIcon'
import { useConnectedStore } from '@/lib/stores/connectedStore'
import { UserStatusCounts, useUserStatusCounts } from '@/api/hooks/useUsers'
import { useProfile, useUpdateProfileLocation } from '@/api/hooks/useProfile'
import { useAuth } from '@/hooks/useAuth'
import { logAndToastError } from '../lib/utils/ebbError.util'
import { useNetworkStore } from '../lib/stores/networkStore'

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
    online: userStatusCounts.online + userStatusCounts.active + userStatusCounts.flowing,
    flowing: userStatusCounts.flowing,
  }
}

const StatusButton = ()=> {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { connected, setConnected } = useConnectedStore()
  const { profile } = useProfile()
  const isOffline = useNetworkStore().isOffline
  const { mutateAsync: updateProfileLocation, isPending: isUpdatingProfileLocation } = useUpdateProfileLocation()

  const handleClick = async () => {
    if (!user) {
      navigate('/login')
      return
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

  if(!connected) {
    return (
      <div className="relative">
        <AnalyticsButton 
          analyticsEvent='connect_to_friends_clicked'
          variant="outline" 
          size="sm" 
          onClick={handleClick} 
          disabled={isUpdatingProfileLocation || isOffline}
          className="gap-2 border-primary text-white hover:bg-primary hover:text-primary-foreground relative z-10"
        >
          {isOffline ? 'Offline' : 'Connect '}
          <ConnectIcon size={20} />
        </AnalyticsButton>
        <div className="absolute inset-0 border border-primary/50 rounded-md animate-ping opacity-75" style={{animationDuration: '3s'}}></div>
      </div>
    )
  }

  return <></>
}

export function SocialStatusSummary() {
  const { user } = useAuth()
  const { connected } = useConnectedStore()
  const { data: communityStatuses, isLoading: isLoadingStatuses, refetch: refetchStatusCounts } = useUserStatusCounts(user)
  const { isLoading: isLoadingProfile } = useProfile()

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



  const handleStatusClick = () => {
    navigate('/community')
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
      <StatusButton />
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
          statusName="In Focus"
          disabled={!connected}
        />
      </div>
    </div>
  )
} 
