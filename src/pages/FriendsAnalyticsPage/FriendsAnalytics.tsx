import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useState, useEffect } from 'react'
import { Trophy, TrendingUp, Users, Clock } from 'lucide-react'
import { cn } from '@/lib/utils/tailwind.util'
import { FriendsComparisonCard } from '@/components/FriendsComparisonCard'
import { useFriendsWithInsights } from '@/api/hooks/useFriends'
import { DateTime } from 'luxon'

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

export const FriendsAnalytics = () => {
  const [timeUntilUTCMidnight, setTimeUntilUTCMidnight] = useState('')
  const { 
    dashboardInsights,
  } = useFriendsWithInsights()

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


  const myPercentile = dashboardInsights?.userPercentile.percentile || 50


  const getRangeModeText = () => {
    return 'today'
  }

  const topFriend = dashboardInsights?.topFriend.hasFriends 
    ? {
      email: dashboardInsights.topFriend.topFriendEmail || 'Friend',
      creatingTime: dashboardInsights.topFriend.topFriendMinutes || 0
    }
    : null




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
      <div className="mb-8 flex items-center justify-between">
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

      {/* Personal Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="My Creating Time"
          icon={<Clock className="h-4 w-4" />}
          className="md:col-span-1"
        >
          <div className="text-2xl font-bold text-primary">
            {dashboardInsights?.userActivity.minutesFormatted}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
                    Your time creating {getRangeModeText()}
          </p>
        </StatCard>

        <StatCard
          title="Top Friend"
          icon={<Trophy className="h-4 w-4" />}
        >
          <div className="text-lg font-bold truncate">
            {topFriend?.email ? 
              topFriend.email : 
              'Friend'
            }
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {topFriend 
              ? `${dashboardInsights?.topFriend.topFriendFormatted} ${getRangeModeText()}` 
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
            {dashboardInsights?.communityComparison.differenceFormatted}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {dashboardInsights?.communityComparison.isAboveAverage
              ? 'above' : 'below'} community average
          </p>
        </StatCard>
      </div>

      {/* Detailed Comparisons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Friends Comparison */}
        <FriendsComparisonCard 
          rangeMode={'day'}
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
                  {dashboardInsights?.communityComparison.userFormatted}
                </span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Community Average</span>
                <span className="text-sm text-muted-foreground">
                  {dashboardInsights?.communityComparison.communityAverageFormatted}
                </span>
              </div>
            </div>
            {/* Community total creating time */}
            <div className="p-3 bg-muted/50 rounded-lg border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Total Community Creating Time</span>
                <span className="text-sm font-bold">
                  {dashboardInsights?.communityStats.totalCommunityFormatted}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
} 
