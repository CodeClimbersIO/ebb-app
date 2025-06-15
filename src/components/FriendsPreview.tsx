import { motion } from 'framer-motion'
import { Globe } from '@/components/ui/globe'
import { useState } from 'react'
import { cn } from '@/lib/utils/tailwind.util'
import { useTheme } from '@/components/ThemeProvider'
import { useUpdateProfileLocation , useProfile } from '../api/hooks/useProfile'
import { useConnectedStore } from '../lib/stores/connectedStore'
import { logAndToastError } from '../lib/utils/ebbError.util'
import { ConnectIcon } from './icons/ConnectIcon'
import { Button } from './ui/button'

const friends = [
  { 
    id: 1, 
    name: 'Alex', 
    status: 'focus' as const, 
    location: [37.7749, -122.4194] as [number, number] 
  }, // San Francisco
  { 
    id: 2, 
    name: 'Sarah', 
    status: 'online' as const, 
    location: [51.5074, -0.1278] as [number, number] 
  }, // London
  { 
    id: 3, 
    name: 'Mike', 
    status: 'offline' as const, 
    location: [35.6762, 139.6503] as [number, number] 
  }, // Tokyo
]

export const FriendsPreview = () => {
  const [selectedFriend, setSelectedFriend] = useState<[number, number]>([0, 0])
  const { theme } = useTheme()
  const { connected, setConnected } = useConnectedStore()
  const { mutateAsync: updateProfileLocation, isPending: isUpdatingProfileLocation } = useUpdateProfileLocation()
  const { profile, isLoading: isLoadingProfile } = useProfile()

  const isSelected = (location: [number, number]) => 
    location[0] === selectedFriend[0] && location[1] === selectedFriend[1]

  const getStatusColor = (status: 'focus' | 'online' | 'offline') => {
    switch (status) {
    case 'focus':
      return 'bg-primary'
    case 'online':
      return 'bg-green-500'
    case 'offline':
      return 'bg-muted-foreground/50'
    }
  }

  const handleConnect = async () => {
    if (!profile?.latitude || !profile?.longitude) {
      try {
        await updateProfileLocation()
        setConnected(true)
      } catch (error) {
        logAndToastError('Failed to update profile location', error)
      }
    } else {
      setConnected(true)
    }
  }

  if(connected) {
    return <></>
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-semibold">Friends</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_250px] items-center">
        {/* Left column: Globe */}
        <div className="relative w-full aspect-square max-w-[500px] justify-self-center">
          <Globe 
            focusLocation={selectedFriend} 
            config={{
              dark: theme === 'dark' ? 1 : 0,
              baseColor: [0.42, 0.3, 0.9], // Primary color from theme
              glowColor: [0.42, 0.15, 0.85], // Primary color
              markerColor: [0.42, 0.15, 0.85], // Primary color
              markers: friends.map(f => ({ location: f.location, size: 0.1 })),
              mapBrightness: 3,
              diffuse: 1.2
            }}
          />
        </div>

        <div className="flex flex-col gap-2 md:max-w-[200px] self-center opacity-30">
          {friends.map((friend) => (
            <motion.button
              key={friend.id}
              onClick={connected ? () => setSelectedFriend(friend.location) : undefined}
              className={cn(
                'bg-card text-card-foreground p-2.5 rounded-lg shadow-sm w-full text-left transition-colors border',
                connected && isSelected(friend.location) 
                  ? 'border-primary' 
                  : 'border-border',
                connected ? 'hover:border-primary/50 cursor-pointer' : 'cursor-default'
              )}
              whileTap={connected ? { scale: 0.98 } : {}}
            >
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-medium">{friend.name}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className={cn('h-2 w-2 rounded-full', getStatusColor(friend.status))} />
                  <span>
                    {friend.status === 'focus' ? 'In focus' : 
                      friend.status === 'online' ? 'Online' : 
                        'Offline'}
                  </span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
        { !isLoadingProfile && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
            <motion.div 
              className="bg-card border border-border rounded-lg p-8 shadow-lg max-w-md mx-4 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-semibold mb-3">Connect to See Your Friends</h2>
              <p className="text-muted-foreground mb-6">
                Connect to with the community for a live look at all the creating going on in the world!
              </p>
              <Button 
                onClick={handleConnect}
                disabled={isUpdatingProfileLocation}
                className="gap-2 w-full"
                size="lg"
              >
                {isUpdatingProfileLocation ? 'Connecting...' : 'Connect'}
                <ConnectIcon size={20} />
              </Button>
            </motion.div>
          </div>
        )}
      </div>
    </>
  )
} 
