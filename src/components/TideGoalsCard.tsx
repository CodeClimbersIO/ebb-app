import { type FC, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { TideEditDialog } from '@/components/TideEditDialog'
import { TideProgressBadge } from '@/components/ui/tide-progress-badge'
import { useTides } from '../api/hooks/useTides'
import { DateTime } from 'luxon'
import { TimeUtil } from '../lib/utils/time.util'
interface TideGoalsCardProps {
  date?: Date
  onDateChange?: (date: Date) => void
}

export const TideGoalsCard: FC<TideGoalsCardProps> = ({
  date = new Date(),
  onDateChange
}) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily')
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  // Add timing logs for each network call
  const { data: tideData, isLoading: isTidesLoading, error: tideError } = useTides.useGetTideOverview(date)
  const { data: weeklyHistory, isLoading: isWeeklyHistoryLoading } = useTides.useGetWeeklyDailyHistory(date)
  const { data: monthlyWeeklyHistory, isLoading: isMonthlyWeeklyHistoryLoading } = useTides.useGetMonthlyWeeklyHistory(date)

  const isLoading = isTidesLoading || isWeeklyHistoryLoading || isMonthlyWeeklyHistoryLoading
  const hasError = tideError

  const handleEditClick = () => {
    setEditDialogOpen(true)
  }

  const renderMonthlyWeeklyProgress = () => {
    if (!monthlyWeeklyHistory || monthlyWeeklyHistory.length === 0) return null

    const selectedWeekStart = DateTime.fromJSDate(date).startOf('week')
    const currentWeekStart = DateTime.now().startOf('week')

    return (
      <div className="flex justify-center gap-2 mt-3 px-4">
        {monthlyWeeklyHistory.map((week) => {
          const weekStart = DateTime.fromISO(week.weekStart).startOf('day')
          const isSelected = weekStart.hasSame(selectedWeekStart, 'day')
          const isFuture = weekStart > currentWeekStart

          const fillPercentage = week.progress.goal > 0
            ? Math.min((week.progress.current / week.progress.goal) * 100, 100)
            : 0
          const isCompleted = week.progress.goal > 0 && week.progress.current >= week.progress.goal

          const handleWeekClick = (e: React.MouseEvent) => {
            e.stopPropagation()
            if (isFuture) return
            if (onDateChange) {
              const clickedDate = DateTime.fromISO(week.weekStart).toJSDate()
              onDateChange(clickedDate)
            }
          }

          return (
            <TideProgressBadge
              key={week.weekStart}
              id={week.weekStart}
              label={`W${week.weekNumber}`}
              fillPercentage={fillPercentage}
              isCompleted={isCompleted}
              isSelected={isSelected}
              isFuture={isFuture}
              onClick={handleWeekClick}
              tooltip={isFuture ? 'Future week' : `Week ${week.weekNumber} (${week.weekStart})`}
            />
          )
        })}
      </div>
    )
  }

  const renderWeeklyProgress = () => {
    const dayNames = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa']
    const selectedDay = DateTime.fromJSDate(date).startOf('day')
    const currentDay = DateTime.now().startOf('day')

    // Get the start of the week for the selected date
    const weekStart = selectedDay.startOf('week')

    return (
      <div className="flex justify-center gap-2 mt-3 px-4">
        {Array.from({ length: 7 }, (_, index) => {
          const dayDate = weekStart.plus({ days: index })
          const dayOfWeek = dayDate.weekday % 7 // Convert to 0-6 where 0 is Sunday
          const isSelected = dayDate.hasSame(selectedDay, 'day')
          const isFuture = dayDate > currentDay

          // Find data for this day in weeklyHistory
          const dayData = weeklyHistory?.find(day =>
            DateTime.fromISO(day.date).hasSame(dayDate, 'day')
          )

          const fillPercentage = dayData && dayData.progress.goal > 0
            ? Math.min((dayData.progress.current / dayData.progress.goal) * 100, 100)
            : 0
          const isCompleted = dayData && dayData.progress.goal > 0 && dayData.progress.current >= dayData.progress.goal

          const handleDayClick = (e: React.MouseEvent) => {
            e.stopPropagation()
            if (isFuture) return
            if (onDateChange) {
              onDateChange(dayDate.toJSDate())
            }
          }

          return (
            <TideProgressBadge
              key={dayDate.toISODate() || dayDate.toFormat('yyyy-MM-dd')}
              id={dayDate.toISODate() || dayDate.toFormat('yyyy-MM-dd')}
              label={dayNames[dayOfWeek]}
              fillPercentage={fillPercentage}
              isCompleted={isCompleted || false}
              isSelected={isSelected}
              isFuture={isFuture}
              onClick={handleDayClick}
              tooltip={isFuture ? 'Future date' : `View ${dayNames[dayOfWeek]} (${dayDate.toISODate() || dayDate.toFormat('yyyy-MM-dd')})`}
            />
          )
        })}
      </div>
    )
  }

  // Format time helper
  const formatTime = (minutes: number, options: { overrideShowHours: boolean } = { overrideShowHours: false }) => {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = Math.round(minutes % 60)
    if (hours === 0) return `${remainingMinutes}m`
    if (remainingMinutes === 0 && !options.overrideShowHours) return `${hours}h`
    return `${hours}h ${remainingMinutes}m`
  }

  const renderNoGoalProgress = (current: number) => {
    return (
      <div
        className="flex flex-col items-center justify-center py-4 pb-0 cursor-pointer"
        onClick={handleEditClick}
        title="Click to set a goal"
      >
        <div className="relative mb-3">
          {/* Simple circle background for no-goal state */}
          <div
            className="rounded-full border-4 border-muted flex items-center justify-center transition-all duration-300 hover:opacity-70"
            style={{ width: '160px', height: '160px' }}
          >
            {/* Center content */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="text-2xl font-bold">
                {formatTime(current, { overrideShowHours: true })}
              </div>
              <div className="text-xs text-muted-foreground mt-1 max-w-24 leading-tight">
                Today's creating time
              </div>

            </div>
          </div>
        </div>

        {/* Goal information - fixed height container */}
        <div className="text-center" style={{ minHeight: '60px' }}>
          <div className="text-sm text-muted-foreground">
            Enjoy your day off!
          </div>
          <div>
            {activeTab === 'daily' ? renderWeeklyProgress() : renderMonthlyWeeklyProgress()}
          </div>
        </div>

      </div>
    )
  }

  const renderGoalProgress = (current: number, goal: number) => {
    // Handle the case when there's no goal set (goal = 0)
    if (goal === 0) {
      return renderNoGoalProgress(current)
    }

    const remainingToGoal = Math.max(goal - current, 0)

    // Chart dimensions
    const size = 160  // Increased from 140 to 160 (20px larger)
    const strokeWidth = 12

    // Hour-based segments with stretch goal:
    // 1. Circle divided into hour-long segments
    // 2. Full circle = goal + stretch (133% of goal total)
    // 3. Fill starting from top, counterclockwise
    // 4. Remaining time partially fills next available segment
    // 5. If goal isn't even hours, final segment won't be full sized
    // 6. All segments together = 360 degrees
    // 7. Stretch portion is additional 33% beyond goal

    const goalHours = goal / 60 // Goal in exact hours (can be decimal)
    const stretchGoal = goal * 1.33 // 33% more than goal
    const stretchHours = stretchGoal / 60 // Total hours including stretch
    const currentHours = current / 60 // Current progress in exact hours
    const isGoalComplete = current >= goal // Check if goal is completed

    // Total segments include both goal and stretch portions
    const goalSegments = Math.ceil(goalHours) // Number of goal hour segments
    const totalSegments = Math.ceil(stretchHours) // Total segments including stretch


    const chartData = []

    for (let segmentIndex = 0; segmentIndex < totalSegments; segmentIndex++) {
      const segmentStartHour = segmentIndex
      const segmentEndHour = Math.min(segmentIndex + 1, stretchHours)
      const segmentHours = segmentEndHour - segmentStartHour // Usually 1, but final segment might be partial

      // Determine if this is a stretch segment (beyond the goal)
      const isStretchSegment = segmentIndex >= goalSegments

      // How much of this segment should be filled?
      const segmentProgress = Math.max(0, Math.min(1, (currentHours - segmentStartHour) / segmentHours))

      // Each segment gets proportional value based on its size
      const segmentValue = segmentHours * 100 // Scale up for better precision

      if (segmentProgress > 0) {
        // Filled portion of this segment
        chartData.push({
          name: `segment${segmentIndex}Filled`,
          value: segmentValue * segmentProgress,
          color: 'hsl(var(--primary))',
          isFilled: true,
          isStretch: isStretchSegment
        })
      }

      if (segmentProgress < 1) {
        // Empty portion of this segment
        chartData.push({
          name: `segment${segmentIndex}Empty`,
          value: segmentValue * (1 - segmentProgress),
          color: 'hsl(var(--muted))',
          isFilled: false,
          isStretch: isStretchSegment
        })
      }
    }

    return (
      <div
        className="flex flex-col items-center justify-center py-4 pb-0 cursor-pointer"
        onClick={handleEditClick}
        title="Click to edit goal"
      >
        <div className="relative mb-3 transition-all duration-300 hover:opacity-70">
          <PieChart width={size + 20} height={size + 20}>
            <defs>
              {/* Diagonal stripe pattern for stretch segments */}
              <pattern
                id="stretchPattern"
                patternUnits="userSpaceOnUse"
                width="8"
                height="8"
                patternTransform="rotate(45)"
              >
                <rect width="8" height="8" fill="hsl(var(--primary))" />
                <rect width="4" height="8" fill="hsl(var(--primary))" fillOpacity="0.3" />
              </pattern>

              {/* Dotted pattern for empty stretch segments */}
              <pattern
                id="stretchEmptyPattern"
                patternUnits="userSpaceOnUse"
                width="6"
                height="6"
              >
                <rect width="6" height="6" fill="hsl(var(--muted))" fillOpacity="0.25" />
                <circle cx="3" cy="3" r="1" fill="hsl(var(--muted))" fillOpacity="0.7" />
              </pattern>
            </defs>

            {/* Background track showing goal vs stretch portions */}
            <Pie
              data={[
                { name: 'goalTrack', value: goalHours, color: 'hsl(var(--muted))' },
                { name: 'stretchTrack', value: stretchHours - goalHours, color: 'hsl(var(--muted))' }
              ]}
              cx='50%'
              cy='50%'
              startAngle={90}
              endAngle={-270}
              innerRadius={(size - strokeWidth) / 2 - strokeWidth / 2 - 4}
              outerRadius={(size - strokeWidth) / 2 + strokeWidth / 2 + 4}
              strokeWidth={0}
              paddingAngle={0}
              dataKey="value"
            >
              <Cell
                key="goalTrack"
                fill={isGoalComplete ? 'hsl(var(--primary))' : 'hsl(var(--muted))'}
                style={{ opacity: 0 }}
                className={isGoalComplete ? 'animate-pulse' : ''}

              />
              <Cell key="stretchTrack" fill="hsl(var(--muted))" style={{ opacity: 0 }} />
            </Pie>

            {/* Progress overlay */}
            <Pie
              data={chartData}
              cx='50%'
              cy='50%'
              startAngle={90}
              endAngle={-270}
              innerRadius={(size - strokeWidth) / 2 - strokeWidth / 2}
              outerRadius={(size - strokeWidth) / 2 + strokeWidth / 2}
              strokeWidth={0}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => {
                let fillValue = entry.color
                let opacity = 1

                if (entry.isStretch) {
                  if (entry.isFilled) {
                    // Filled stretch segments get diagonal stripes
                    fillValue = 'url(#stretchPattern)'
                    opacity = 0.8
                  } else {
                    // Empty stretch segments get dotted pattern
                    fillValue = 'url(#stretchEmptyPattern)'
                    opacity = 1
                  }
                } else {
                  // Regular goal segments
                  opacity = entry.isFilled ? 1.0 : 0.9  // Increased from 0.4 to 0.7 for better contrast
                }

                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={fillValue}
                    style={{
                      opacity,
                    }}
                  />
                )
              })}
            </Pie>
          </PieChart>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="text-2xl font-bold">
              {formatTime(current, { overrideShowHours: true })}
            </div>
            {remainingToGoal > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                {formatTime(remainingToGoal)} until target
              </div>
            )}
            {current >= goal && remainingToGoal === 0 && (
              <div className="text-xs mt-1">
                <div>Tide reached!</div>
                <div className="text-primary-600 dark:text-primary-400 pt-1">+{formatTime(current - goal)}</div>
              </div>

            )}
          </div>
        </div>

        {/* Goal information - fixed height container */}
        <div className="text-center" style={{ minHeight: '60px' }}>
          <div className="text-sm text-muted-foreground">
            Creating Time Target: {formatTime(goal)}
          </div>
          {/* Progress badges based on active tab */}
          {activeTab === 'daily' ? renderWeeklyProgress() : renderMonthlyWeeklyProgress()}
        </div>
      </div>
    )
  }

  const luxonDate = DateTime.fromJSDate(date)
  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardTitle
            className="text-lg cursor-pointer hover:text-primary/80 transition-all duration-300 hover:scale-[1.02]"
            onClick={handleEditClick}
            title="Click to edit tide goals"
          >
            Tides
          </CardTitle>
          {/* Compact Chip Style in Header */}
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-2 py-1 text-xs font-medium rounded-full transition-all duration-200 ${activeTab === 'daily'
                ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'}`}
            >
              Daily
            </button>
            <button
              onClick={() => setActiveTab('weekly')}
              className={`px-2 py-1 text-xs font-medium rounded-full transition-all duration-200 ${activeTab === 'weekly'
                ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'}`}
            >
              Weekly
            </button>
          </div>
        </div>
        <div className="text-sm font-normal text-muted-foreground mt-1">
          {activeTab === 'daily'
            ? luxonDate.toFormat('MMMM ') + TimeUtil.ordinal(luxonDate.day)
            : `${luxonDate.toFormat('MMMM ')} ${TimeUtil.ordinal(luxonDate.day)} - ${TimeUtil.ordinal(luxonDate.plus({ weeks: 1 }).day)}`
          }
        </div>
      </CardHeader>
      <CardContent className="px-0 pt-0 pb-2">

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-4">
            <Skeleton className="w-32 h-32 rounded-full mb-3" />
            <Skeleton className="w-20 h-4" />
          </div>
        ) : hasError ? (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <div className="text-sm text-muted-foreground">
              Unable to load tide data
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'daily' && tideData && (
              <div>
                {renderGoalProgress(tideData.daily.progress.current, tideData.daily.progress.goal)}
              </div>
            )}
            {activeTab === 'weekly' && tideData && (
              <div>
                {renderGoalProgress(tideData.weekly.progress.current, tideData.weekly.progress.goal)}
              </div>
            )}
          </>
        )}
      </CardContent>

      <TideEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </Card>
  )
}
