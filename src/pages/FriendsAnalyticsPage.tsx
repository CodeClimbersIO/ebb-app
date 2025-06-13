import { Layout } from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RangeModeSelector, RangeMode } from '@/components/RangeModeSelector'
import { useState, useMemo } from 'react'
import { formatTime } from '@/components/UsageSummary'
import { Trophy, TrendingUp, Users, Clock } from 'lucide-react'
import { cn } from '@/lib/utils/tailwind.util'
import { FriendsComparisonCard, InviteState } from '@/components/FriendsComparisonCard'
import { useFriendsWithInsights } from '@/api/hooks/useFriends'

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
const generateMockStats = (rangeMode: RangeMode, friends: Array<{ id: string; name: string; avatar?: string; creatingTime: number }>): CreatingStats => {
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
  
  // Format date for API call based on range mode
  const apiDate = useMemo(() => {
    const today = new Date()
    
    // For now, we'll use today's date regardless of range mode
    // In the future, you might want to adjust this based on your API's capabilities
    // For example, if the API supports week/month aggregation, you could pass different dates
    return today.toISOString().split('T')[0] // Format as YYYY-MM-DD
  }, [rangeMode])
  
  const { 
    friends = [], 
    sentRequests = [], 
    receivedRequests = [], 
    dashboardInsights,
    isLoading,
    handleInviteFriend,
    handleAcceptInvite,
    handleDeclineInvite 
  } = useFriendsWithInsights(apiDate)

  const inviteState: InviteState = {
    hasFriends: friends.length > 0,
    pendingInvitesSent: sentRequests.length,
    pendingInvitesReceived: receivedRequests.length
  }

  // Use real data when available, fallback to mock data
  const stats = useMemo(() => {
    if (dashboardInsights) {
      return {
        myAverage: dashboardInsights.userActivity.totalMinutes,
        myTotal: dashboardInsights.userActivity.totalMinutes,
        friends: friends.map(friend => ({
          id: friend.id,
          name: friend.friend_email, // Use email as name for now
          avatar: undefined,
          creatingTime: 0 // TODO: Add individual friend creating time from API
        })),
        communityAverage: dashboardInsights.communityComparison.communityAverage,
        communityTotal: dashboardInsights.communityStats.totalCommunityMinutes,
      }
    }
    // Fallback to mock data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return generateMockStats(rangeMode, friends as any)
  }, [dashboardInsights, friends, rangeMode])

  const getRangeModeText = () => {
    switch (rangeMode) {
    case 'day': return 'today'
    case 'week': return 'this week'  
    case 'month': return 'this month'
    }
  }

  const topFriend = dashboardInsights?.topFriend.hasFriends 
    ? {
      email: dashboardInsights.topFriend.topFriendEmail || 'Friend',
      creatingTime: dashboardInsights.topFriend.topFriendMinutes || 0
    }
    : null

  // Calculate percentile based on creating time vs community average
  const calculatePercentile = (myTime: number, communityAvg: number) => {
    // Simple calculation: if you're at community average, you're at 50th percentile
    // Each 30 minutes above/below average roughly equals 10 percentile points
    const difference = myTime - communityAvg
    const percentileShift = (difference / 30) * 10
    const percentile = Math.max(5, Math.min(95, 50 + percentileShift))
    return Math.round(percentile)
  }

  // Use real percentile data when available
  const myPercentile = dashboardInsights?.userPercentile.percentile || 
    calculatePercentile(stats.myAverage, stats.communityAverage)

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

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Loading friends data...</p>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

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
                {dashboardInsights?.userActivity.minutesFormatted || formatTime(stats.myAverage)}
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
                {topFriend?.email || 'No Friends'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {topFriend 
                  ? `${dashboardInsights?.topFriend.topFriendFormatted || formatTime(topFriend.creatingTime)} ${getRangeModeText()}` 
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
                {dashboardInsights?.communityComparison.differenceFormatted || 
                  formatTime(Math.abs(stats.myAverage - stats.communityAverage))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {dashboardInsights?.communityComparison.isAboveAverage ?? (stats.myAverage > stats.communityAverage) 
                  ? 'above' : 'below'} community average
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
              onInviteFriends={handleInviteFriend}
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
                      {dashboardInsights?.communityComparison.userFormatted || formatTime(stats.myAverage)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Community Average</span>
                    <span className="text-sm text-muted-foreground">
                      {dashboardInsights?.communityComparison.communityAverageFormatted || formatTime(stats.communityAverage)}
                    </span>
                  </div>
                </div>
                {/* Community total creating time */}
                <div className="p-3 bg-muted/50 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Total Community Creating Time</span>
                    <span className="text-sm font-bold">
                      {dashboardInsights?.communityStats.totalCommunityFormatted || formatTime(stats.communityTotal)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  )
} 
