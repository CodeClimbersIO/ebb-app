import { Layout } from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RangeModeSelector, RangeMode } from '@/components/RangeModeSelector'
import { useState, useEffect } from 'react'
import { formatTime } from '@/components/UsageSummary'
import { Trophy, TrendingUp, Users, Clock } from 'lucide-react'
import { cn } from '@/lib/utils/tailwind.util'
import { FriendsComparisonCard, InviteState } from '@/components/FriendsComparisonCard'

// Mock data structure - in real app this would come from API
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

// Mock friends data
const mockFriends = [
  { id: '1', name: 'Alex Chen', creatingTime: 180 }, // 3h
  { id: '2', name: 'Sarah Kim', creatingTime: 240 }, // 4h
  { id: '3', name: 'Mike Johnson', creatingTime: 120 }, // 2h
  { id: '4', name: 'Emma Wilson', creatingTime: 300 }, // 5h
  { id: '5', name: 'David Rodriguez', creatingTime: 90 }, // 1.5h
]

// Generate mock stats based on range mode
const generateMockStats = (rangeMode: RangeMode, hasFriends: boolean = true): CreatingStats => {
  const multiplier = rangeMode === 'day' ? 1 : rangeMode === 'week' ? 7 : 30
  
  return {
    myAverage: 165 * multiplier, // ~2.75h per day
    myTotal: 165 * multiplier,
    friends: hasFriends ? mockFriends.map(friend => ({
      ...friend,
      creatingTime: friend.creatingTime * multiplier
    })) : [],
    communityAverage: 135 * multiplier, // ~2.25h per day
    communityTotal: 135 * multiplier * 100, // Mock total for 10k users
  }
}

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

export const FriendsAnalyticsPage = () => {
  const [rangeMode, setRangeMode] = useState<RangeMode>('day')
  const [inviteState] = useState<InviteState>({
    hasFriends: true, // Set to true to show friends + invite management
    pendingInvitesSent: 2, // Show 2 pending invites sent
    pendingInvitesReceived: 1 // Show 1 pending invite received
  })
  const [stats, setStats] = useState<CreatingStats>(generateMockStats('day', inviteState.hasFriends))

  useEffect(() => {
    setStats(generateMockStats(rangeMode, inviteState.hasFriends))
  }, [rangeMode, inviteState.hasFriends])

  const handleInviteFriends = () => {
    // Placeholder for invite functionality
    console.log('Invite friends clicked')
    // In real implementation, this would open an invite modal or navigate to invite flow
  }

  const handleAcceptInvite = (inviteId: string) => {
    // Placeholder for accept invite functionality
    console.log('Accept invite:', inviteId)
    // In real implementation, this would call an API to accept the invite
  }

  const handleDeclineInvite = (inviteId: string) => {
    // Placeholder for decline invite functionality
    console.log('Decline invite:', inviteId)
    // In real implementation, this would call an API to decline the invite
  }

  const getRangeModeText = () => {
    switch (rangeMode) {
    case 'day': return 'today'
    case 'week': return 'this week'  
    case 'month': return 'this month'
    }
  }

  const topFriend = stats.friends.length > 0 ? stats.friends.reduce((prev, current) => 
    (prev.creatingTime > current.creatingTime) ? prev : current
  ) : null

  // Calculate percentile based on creating time vs community average
  const calculatePercentile = (myTime: number, communityAvg: number) => {
    // Simple calculation: if you're at community average, you're at 50th percentile
    // Each 30 minutes above/below average roughly equals 10 percentile points
    const difference = myTime - communityAvg
    const percentileShift = (difference / 30) * 10
    const percentile = Math.max(5, Math.min(95, 50 + percentileShift))
    return Math.round(percentile)
  }

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
    <Layout>
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold mb-2">Friends</h1>
              <p className="text-muted-foreground">
                See how your creating time compares to your friends and the community
              </p>
            </div>
            <RangeModeSelector value={rangeMode} onChange={setRangeMode} />
          </div>

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
                {topFriend?.name.split(' ')[0] || 'No Friends'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {topFriend ? `${formatTime(topFriend.creatingTime)} ${getRangeModeText()}` : 'Invite friends to compare'}
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
                {stats.myAverage > stats.communityAverage ? '+' : ''}
                {formatTime(Math.abs(stats.myAverage - stats.communityAverage))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.myAverage > stats.communityAverage ? 'above' : 'below'} community average
              </p>
            </StatCard>
          </div>

          {/* Detailed Comparisons */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Friends Comparison */}
            <FriendsComparisonCard 
              friends={stats.friends}
              myTime={stats.myTotal}
              rangeMode={rangeMode}
              inviteState={inviteState}
              onInviteFriends={handleInviteFriends}
              onAcceptInvite={handleAcceptInvite}
              onDeclineInvite={handleDeclineInvite}
              getRangeModeText={getRangeModeText}
            />

            {/* Community Stats */}
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
                {/* Friends total creating time */}
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

          {/* Additional Insights */}
          {/* <Card>
            <CardHeader>
              <CardTitle>Personal Insights</CardTitle>
              <p className="text-sm text-muted-foreground">
                Track your progress over time
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-lg font-bold text-primary mb-1">
                    {formatTime(stats.myAverage)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Your average {getRangeModeText()}
                  </div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-lg font-bold mb-1">
                    {stats.myAverage > stats.communityAverage ? '+' : ''}
                    {Math.round(((stats.myAverage - stats.communityAverage) / stats.communityAverage) * 100)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    vs community average
                  </div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-lg font-bold text-green-600 mb-1">
                    #{myRank}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    among your friends
                  </div>
                </div>
              </div>
            </CardContent>
          </Card> */}
        </div>
      </div>
    </Layout>
  )
} 
