import { type FC, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell } from 'recharts'

interface TideGoalsCardProps {
  className?: string
}

// Mock tide data - replace with actual API calls later
const getMockTideData = () => {
  return {
    dailyGoal: {
      current: 194, // 3h 14m current progress
      goal: 180,    // 3h goal (will show as complete + stretch progress)
    },
    weeklyGoal: {
      current: 420, // 7h current progress
      goal: 600,    // 10h goal
    }
  }
}

export const TideGoalsCard: FC<TideGoalsCardProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily')
  const tideData = getMockTideData()

  // Format time helper
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = Math.round(minutes % 60)
    if (hours === 0) return `${remainingMinutes}m`
    if (remainingMinutes === 0) return `${hours}h`
    return `${hours}h ${remainingMinutes}m`
  }

  const renderGoalProgress = (current: number, goal: number) => {
    // Calculate progress percentages
    const stretchGoal = goal * 1.33 // 133% of base goal for stretch
    const baseProgress = Math.min(current / goal, 1) // 0-1 for base goal
    const remainingToGoal = Math.max(goal - current, 0)

    // Chart dimensions
    const size = 140
    const strokeWidth = 12

    // Prepare data for pie chart
    const baseGoalPortion = 75 // Base goal takes 75% of circle
    const stretchPortion = 25 // Stretch goal takes 25% of circle

    // Calculate filled portions
    const baseFilledPortion = baseProgress * baseGoalPortion
    const baseEmptyPortion = baseGoalPortion - baseFilledPortion

    let stretchFilledPortion = 0
    let stretchEmptyPortion = stretchPortion

    if (current > goal) {
      const stretchProgress = Math.min((current - goal) / (stretchGoal - goal), 1)
      stretchFilledPortion = stretchProgress * stretchPortion
      stretchEmptyPortion = stretchPortion - stretchFilledPortion
    }

    const chartData = [
      // Base goal progress (filled)
      { name: 'baseFilled', value: baseFilledPortion, color: 'hsl(var(--primary))' },
      // Stretch goal progress (filled) - only if there's progress beyond base goal
      ...(stretchFilledPortion > 0 ? [{ name: 'stretchFilled', value: stretchFilledPortion, color: 'hsl(var(--primary))' }] : []),
      // Empty base goal portion
      ...(baseEmptyPortion > 0 ? [{ name: 'baseEmpty', value: baseEmptyPortion, color: 'hsl(var(--muted))' }] : []),
      // Empty stretch portion
      ...(stretchEmptyPortion > 0 ? [{ name: 'stretchEmpty', value: stretchEmptyPortion, color: 'hsl(var(--muted))' }] : []),
    ]

    return (
      <div className="flex flex-col items-center justify-center py-4 pb-0">
        <div className="relative mb-3">
          <PieChart width={size} height={size}>
            <Pie
              data={chartData}
              cx={size / 2}
              cy={size / 2}
              startAngle={90}
              endAngle={450}
              innerRadius={(size - strokeWidth) / 2 - strokeWidth / 2}
              outerRadius={(size - strokeWidth) / 2 + strokeWidth / 2}
              strokeWidth={0}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  className={entry.name === 'stretchFilled' ? 'opacity-60' : 'opacity-100'}
                  style={{
                    filter: entry.name.includes('Empty') ? 'opacity(0.2)' : 'none'
                  }}
                />
              ))}
            </Pie>
          </PieChart>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="text-2xl font-bold">
              {formatTime(current)}
            </div>
            {remainingToGoal > 0 && (
              <div className="text-sm text-muted-foreground mt-1">
                {formatTime(remainingToGoal)} until target
              </div>
            )}
            {current >= goal && remainingToGoal === 0 && (
              <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                Tide reached!
              </div>
            )}
          </div>
        </div>

        {/* Goal information - fixed height container */}
        <div className="text-center" style={{ minHeight: '60px' }}>
          <div className="text-sm text-muted-foreground">
            Target: {formatTime(goal)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Tides</CardTitle>
          {/* Compact Chip Style in Header */}
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-2 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
                activeTab === 'daily'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setActiveTab('weekly')}
              className={`px-2 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
                activeTab === 'weekly'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              Weekly
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pt-0 pb-2">

        {/* Content */}
        {activeTab === 'daily' && (
          <div>
            {renderGoalProgress(tideData.dailyGoal.current, tideData.dailyGoal.goal)}
          </div>
        )}
        {activeTab === 'weekly' && (
          <div>
            {renderGoalProgress(tideData.weeklyGoal.current, tideData.weeklyGoal.goal)}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
