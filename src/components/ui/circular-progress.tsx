import { type FC } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CircularProgressProps {
  title: string
  currentValue: number // in minutes
  goalValue: number // in minutes
  className?: string
}

export const CircularProgress: FC<CircularProgressProps> = ({
  title,
  currentValue,
  goalValue,
  className = ''
}) => {
  // Calculate progress percentages
  const stretchGoal = goalValue * 1.33 // 133% of base goal for stretch
  const baseProgress = Math.min(currentValue / goalValue, 1) * 100 // 0-100% for base goal
  const totalProgress = Math.min(currentValue / stretchGoal, 1) * 100 // 0-100% for total circle

  // Calculate remaining time to goal
  const remainingToGoal = Math.max(goalValue - currentValue, 0)

  // Format time helper
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = Math.round(minutes % 60)
    if (hours === 0) return `${remainingMinutes}m`
    if (remainingMinutes === 0) return `${hours}h`
    return `${hours}h ${remainingMinutes}m`
  }

  // SVG circle properties
  const size = 120
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center">
          <div className="relative">
            {/* Background circle */}
            <svg width={size} height={size} className="transform -rotate-90">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="hsl(var(--muted))"
                strokeWidth={strokeWidth}
                fill="transparent"
                className="opacity-20"
              />
              {/* Base goal progress (75% of circle when complete) */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="hsl(var(--primary))"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference * 0.75} // Only fill 75% max
                strokeDashoffset={circumference * 0.75 - (baseProgress / 100) * circumference * 0.75}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
              {/* Stretch goal progress (remaining 25% of circle) */}
              {currentValue > goalValue && (
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="hsl(var(--primary))"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={circumference * 0.25} // Only the stretch portion
                  strokeDashoffset={circumference * 0.25 - ((totalProgress - 75) / 25) * circumference * 0.25}
                  strokeLinecap="round"
                  className="transition-all duration-500 ease-out opacity-60"
                  transform={`rotate(270 ${size / 2} ${size / 2})`} // Start after base goal
                />
              )}
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className="text-lg font-bold">
                {formatTime(currentValue)}
              </div>
              {remainingToGoal > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  {formatTime(remainingToGoal)} until target
                </div>
              )}
              {currentValue >= goalValue && remainingToGoal === 0 && (
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Goal reached!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Goal information */}
        <div className="mt-4 text-center">
          <div className="text-xs text-muted-foreground">
            Daily Target: {formatTime(goalValue)}
            {currentValue > goalValue && (
              <span className="block mt-1">
                Stretch Goal: {formatTime(stretchGoal)}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
