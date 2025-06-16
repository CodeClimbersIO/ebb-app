import { motion } from 'framer-motion'
import { useState, useMemo, useEffect } from 'react'
import { formatTime } from '@/components/UsageSummary'
import { Trophy, TrendingUp, Users, Clock } from 'lucide-react'
import { cn } from '@/lib/utils/tailwind.util'
import { useConnectedStore } from '@/lib/stores/connectedStore'
import { useNetworkStore } from '@/lib/stores/networkStore'
import { useUpdateProfileLocation, useProfile } from '@/api/hooks/useProfile'
import { logAndToastError } from '@/lib/utils/ebbError.util'
import { ConnectIcon } from '@/components/icons/ConnectIcon'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DateTime } from 'luxon'

interface CreatingStats {
  myAverage: number
  friends: Array<{
    id: string
    name: string
    avatar?: string
    creatingTime: number
  }>
  communityAverage: number
  communityTotal: number
  myTotal: number
}

// Generate mock stats based on range mode
const generateMockStats = (rangeMode: 'day' | 'week' | 'month', friends: Array<{ id: string; name: string; avatar?: string; creatingTime: number }>): CreatingStats => {
  const multiplier = rangeMode === 'day' ? 1 : rangeMode === 'week' ? 7 : 30
  
  return {
    myAverage: 165 * multiplier, // ~2.75h per day
    myTotal: 165 * multiplier,
    friends: friends.map(friend => ({
      ...friend,
      creatingTime: friend.creatingTime * multiplier
    })),
    communityAverage: 135 * multiplier, // ~2.25h per day
    communityTotal: 135 * multiplier * 100, // Mock total for 10k users
  }
}

// Mock data for preview
const mockFriends = [
  { id: '1', name: 'alex@example.com', avatar: undefined, creatingTime: 180 },
  { id: '2', name: 'sarah@example.com', avatar: undefined, creatingTime: 120 },
  { id: '3', name: 'mike@example.com', avatar: undefined, creatingTime: 90 },
]

interface StatCardProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
}

const StatCard = ({ title, icon, children, className }: StatCardProps) => (
  <Card className={cn('relative overflow-hidden', className)}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        {icon}
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      {children}
    </CardContent>
  </Card>
)

const utcMidnight = DateTime.now().toUTC().endOf('day')
const localEndDateTime = utcMidnight.toLocal()

export const FriendsAnalyticsPreview = () => {
  const [timeUntilUTCMidnight, setTimeUntilUTCMidnight] = useState('')
  
  const { setConnected } = useConnectedStore()
  const { isOffline } = useNetworkStore()
  const { mutateAsync: updateProfileLocation, isPending: isUpdatingProfileLocation } = useUpdateProfileLocation()
  const { profile, isLoading: isLoadingProfile } = useProfile()

  // Countdown timer to UTC midnight and calculate local end time
  useEffect(() => {
    const updateCountdown = () => {
      const now = DateTime.now()
      const nextMidnight = DateTime.now().toUTC().endOf('day')
      const timeUntilNextMidnight = nextMidnight.diff(now)

      setTimeUntilUTCMidnight(timeUntilNextMidnight.toFormat('hh:mm:ss'))
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [])

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

  // Use mock data for preview
  const stats = useMemo(() => {
    return generateMockStats('day', mockFriends)
  }, [])

  const getRangeModeText = () => {
    return 'today'
  }

  const topFriend = { email: 'alex@example.com', creatingTime: 180 } // Mock data for preview

  // Calculate percentile based on creating time vs community average
  const calculatePercentile = (myTime: number, communityAvg: number) => {
    // Simple calculation: if you're at community average, you're at 50th percentile
    // Each 30 minutes above/below average roughly equals 10 percentile points
    const difference = myTime - communityAvg
    const percentileShift = (difference / 30) * 10
    const percentile = Math.max(5, Math.min(95, 50 + percentileShift))
    return Math.round(percentile)
  }

  // Use mock percentile for preview
  const myPercentile = calculatePercentile(stats.myAverage, stats.communityAverage)

  // Generate points for a bell curve
  const generateBellCurve = (width: number, height: number, userPercentile: number) => {
    const points = []
    const steps = 100
    
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * width
      // Standard normal distribution approximation
      const normalizedX = (i - steps/2) / (steps/6) // Normalize to ~3 standard deviations
      const y = height - (height * Math.exp(-0.5 * normalizedX * normalizedX))
      points.push(`${x},${y}`)
    }
    
    // Calculate user's position on the curve
    const userX = (userPercentile / 100) * width
    const normalizedUserX = (userPercentile - 50) / 16.67 // Normalize percentile to standard deviations
    const userY = height - (height * Math.exp(-0.5 * normalizedUserX * normalizedUserX))
    
    return { curvePoints: points.join(' '), userPosition: { x: userX, y: userY } }
  }

  const { curvePoints, userPosition } = generateBellCurve(300, 80, myPercentile)

  return (
    <>
      {/* Header */}
      <div className="blur-sm mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Friends</h1>
          <p className="text-muted-foreground">
            See how your creating time compares to your friends and the community
          </p>
          {/* UTC Day Countdown */}
          <div className="relative group">
            <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Day ends in {timeUntilUTCMidnight}</span>
              <div className="absolute bottom-6 left-0 hidden group-hover:block z-10 w-64 p-2 bg-black text-white text-xs rounded shadow-lg">
                To align everyone's timezones, the competition ends daily at {localEndDateTime.toFormat('h:mm a ZZZZ')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with blur */}
      <div className="blur-sm pointer-events-none">
        {/* Personal Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="My Creating Time"
            icon={<Clock className="h-4 w-4" />}
            className="md:col-span-1"
          >
            <div className="text-2xl font-bold text-primary">
              {formatTime(stats.myAverage)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Your time creating {getRangeModeText()}
            </p>
          </StatCard>

          <StatCard
            title="Top Friend"
            icon={<Trophy className="h-4 w-4" />}
          >
            <div className="text-2xl font-bold">
              {topFriend?.email ? 
                `${topFriend.email.slice(0, 12)}...` : 
                'No Friends'
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {topFriend 
                ? `${formatTime(topFriend.creatingTime)} ${getRangeModeText()}` 
                : 'Invite friends to compare'
              }
            </p>
          </StatCard>

          <StatCard
            title="My Percentile"
            icon={<TrendingUp className="h-4 w-4" />}
          >
            <div className="text-2xl font-bold text-primary">
              {myPercentile}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              You create more than {myPercentile}% of users
            </p>
          </StatCard>

          <StatCard
            title="vs Community Avg"
            icon={<Users className="h-4 w-4" />}
          >
            <div className="text-2xl font-bold">
              {formatTime(Math.abs(stats.myAverage - stats.communityAverage))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.myAverage > stats.communityAverage ? 'above' : 'below'} community average
            </p>
          </StatCard>
        </div>

        {/* Detailed Comparisons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Community Insights
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Your position in the broader community
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                {/* Bell curve distribution */}
                <div className="mt-4">
                  <div className="flex justify-center mb-2">
                    <svg width="300" height="100" className="overflow-visible">
                      {/* Bell curve */}
                      <polyline
                        points={curvePoints}
                        fill="none"
                        stroke="hsl(var(--muted-foreground))"
                        strokeWidth="2"
                        opacity="0.6"
                      />
                      {/* Fill under curve */}
                      <polygon
                        points={`0,80 ${curvePoints} 300,80`}
                        fill="hsl(var(--muted-foreground))"
                        opacity="0.1"
                      />
                      {/* User position marker */}
                      <circle
                        cx={userPosition.x}
                        cy={userPosition.y}
                        r="4"
                        fill="hsl(var(--primary))"
                        stroke="white"
                        strokeWidth="2"
                      />
                      {/* User position line */}
                      <line
                        x1={userPosition.x}
                        y1={userPosition.y}
                        x2={userPosition.x}
                        y2="80"
                        stroke="hsl(var(--primary))"
                        strokeWidth="2"
                        strokeDasharray="3,3"
                      />
                      {/* Labels */}
                      <text x="0" y="95" fontSize="10" fill="hsl(var(--muted-foreground))" textAnchor="start">
                        Low
                      </text>
                      <text x="150" y="95" fontSize="10" fill="hsl(var(--muted-foreground))" textAnchor="middle">
                        Average
                      </text>
                      <text x="300" y="95" fontSize="10" fill="hsl(var(--muted-foreground))" textAnchor="end">
                        High
                      </text>
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      You created more than <span className="font-bold text-primary">{myPercentile}%</span> of people {getRangeModeText()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-2 mt-4">
                  <span className="text-sm font-medium">Your Creating Time</span>
                  <span className="text-sm font-bold text-primary">
                    {formatTime(stats.myAverage)}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Community Average</span>
                  <span className="text-sm text-muted-foreground">
                    {formatTime(stats.communityAverage)}
                  </span>
                </div>
              </div>
              {/* Community total creating time */}
              <div className="p-3 bg-muted/50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Total Community Creating Time</span>
                  <span className="text-sm font-bold">
                    {formatTime(stats.communityTotal)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Overlay Modal when not connected */}
      {!isLoadingProfile && (
        <div className="fixed top-16 left-16 right-0 bottom-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
          <motion.div 
            className="bg-card border border-border rounded-lg p-8 shadow-lg max-w-md mx-4 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {isOffline ? (
              <>
                <h2 className="text-xl font-semibold mb-3">You're Offline</h2>
                <p className="text-muted-foreground mb-6">
                  Check your internet connection to connect with friends and see detailed analytics.
                </p>
                <Button 
                  disabled
                  className="gap-2 w-full"
                  size="lg"
                  variant="secondary"
                >
                  Offline
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                </Button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-3">Connect to See Friends Analytics</h2>
                <p className="text-muted-foreground mb-6">
                  Connect with the community to unlock detailed analytics, compare with friends, and track your progress!
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
              </>
            )}
          </motion.div>
        </div>
      )}
    </>
  )
} 
