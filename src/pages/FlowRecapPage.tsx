import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, WandSparkles, Diff } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DateTime } from 'luxon'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from '@/components/ui/chart'
import { TopNav } from '@/components/TopNav'
import { LogoContainer } from '@/components/LogoContainer'
import confetti from 'canvas-confetti'
import { MonitorApi, AppsWithTime, GraphableTimeByHourBlock } from '../api/monitorApi/monitorApi'
import { AppIcon } from '../components/AppIcon'
import { Progress } from '@/components/ui/progress'

interface LocationState {
  sessionId: string
  timeInFlow: string
  contextSwitches: number
  idleTime: string
  objective: string
  startTime: string
  endTime: string
}

const chartConfig = {
  creating: {
    label: 'Creating',
    color: 'rgb(124,58,237)', // Purple
  },
  neutral: {
    label: 'Neutral',
    color: 'hsl(var(--muted-foreground) / 0.5)',
  },
  consuming: {
    label: 'Consuming',
    color: 'rgb(248,113,113)', // Red
  },
} satisfies ChartConfig

const formatDuration = (startTime: string, endTime: string): string => {
  const start = DateTime.fromISO(startTime)
  const end = DateTime.fromISO(endTime)
  const diff = end.diff(start, ['hours', 'minutes', 'seconds'])
  
  if (diff.hours >= 1) {
    return `${Math.floor(diff.hours)}h ${Math.floor(diff.minutes)}m`
  }
  return `${Math.floor(diff.minutes)}m ${Math.floor(diff.seconds)}s`
}

const calculateNetCreationScore = (apps: AppsWithTime[]): number => {
  return Number(apps.reduce((score, app) => {
    const minutes = app.duration
    switch (app.rating) {
      case 5: return score + minutes * 0.1
      case 4: return score + minutes * 0.05
      case 2: return score - minutes * 0.05
      case 1: return score - minutes * 0.1
      default: return score
    }
  }, 0).toFixed(1))
}

const formatTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = Math.round(minutes % 60)
  return `${hours}h ${remainingMinutes}m`
}

const generateTimeBlocks = (start: DateTime, end: DateTime, chartData: GraphableTimeByHourBlock[]) => {
  const duration = end.diff(start, 'minutes').minutes
  const blockSize = duration / 8 // Divide total duration into 8 equal blocks
  const blocks: GraphableTimeByHourBlock[] = []
  
  for (let i = 0; i < 8; i++) {
    const blockStart = start.plus({ minutes: blockSize * i })
    const blockEnd = start.plus({ minutes: blockSize * (i + 1) })
    
    // Find data points that fall within this block
    const blockData = chartData.filter(d => {
      const dataTime = DateTime.fromISO(d.timeRange)
      return dataTime >= blockStart && dataTime < blockEnd
    })
    
    blocks.push({
      time: blockStart.toISO() ?? '',
      timeRange: `${blockStart.toFormat('h:mm')} - ${blockEnd.toFormat('h:mm a')}`,
      xAxisLabel: blockStart.toFormat('h:mm'),
      creating: blockData.reduce((sum, d) => sum + d.creating, 0) || 0,
      consuming: blockData.reduce((sum, d) => sum + d.consuming, 0) || 0,
      neutral: blockData.reduce((sum, d) => sum + (d.neutral || 0), 0) || 0,
      offline: blockData.reduce((sum, d) => sum + d.offline, 0) || 0
    })
  }
  
  return blocks
}

export const FlowRecapPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as LocationState
  const effectRan = useRef(false)
  const [appUsage, setAppUsage] = useState<AppsWithTime[]>([])
  const [totalCreating, setTotalCreating] = useState(0)
  const [chartData, setChartData] = useState<GraphableTimeByHourBlock[]>([])

  useEffect(() => {
    if (effectRan.current) return
    effectRan.current = true

    const init = async () => {
      if (!state?.startTime || !state?.endTime) return

      const start = DateTime.fromISO(state.startTime)
      const end = DateTime.fromISO(state.endTime)
      
      const rawChartData = await MonitorApi.getTimeCreatingByHour(start, end)
      const topApps = await MonitorApi.getTopAppsByPeriod(start, end)

      setAppUsage(topApps)
      setTotalCreating(rawChartData.reduce((acc, curr) => acc + curr.creating, 0))
      
      // Process the chart data into blocks based on session duration
      const processedChartData = generateTimeBlocks(start, end, rawChartData)
      setChartData(processedChartData)

      // Add random 50/50 chance
      const isPositive = Math.random() >= 0.5

      if (isPositive) {
        const duration = 1000
        const animationEnd = Date.now() + duration
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

        const randomInRange = (min: number, max: number) => {
          return Math.random() * (max - min) + min
        }

        const interval = setInterval(() => {
          const timeLeft = animationEnd - Date.now()

          if (timeLeft <= 0) {
            return clearInterval(interval)
          }

          const particleCount = 50 * (timeLeft / duration)

          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            colors: ['#7c3aed', '#4c1d95', '#6d28d9'], // Purple shades
          })
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            colors: ['#7c3aed', '#4c1d95', '#6d28d9'], // Purple shades
          })
        }, 250)
      } else {
        const card = document.querySelector('.recap-card')
        card?.classList.add('negative-score')
        
        setTimeout(() => {
          card?.classList.remove('negative-score')
        }, 1000)
      }
    }
    init()
  }, [state, navigate])

  if (!state) {
    return <div>Loading...</div>
  }

  const formatTimeRange = () => {
    if (!state.startTime || !state.endTime) return ''
    const start = DateTime.fromISO(state.startTime)
    const end = DateTime.fromISO(state.endTime)
    return `${start.toFormat('h:mm a')} - ${end.toFormat('h:mm a')}`
  }

  const sortedAppUsage = [...appUsage].sort((a, b) => b.duration - a.duration)

  return (
    <div className="flex flex-col h-screen">
      <div className="flex">
        <LogoContainer />
        <TopNav variant="modal" />
      </div>
      <div className="flex-1 flex items-center justify-center bg-background/80 backdrop-blur-sm pt-8">
        <Card className="recap-card w-full max-w-3xl transition-all duration-300">
          <CardContent className="p-6 space-y-8">
            <div className="mb-4 flex justify-between items-center">
              <div className="text-sm">
                <span className="font-medium">'{state?.objective}'</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatTimeRange()}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Duration
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="text-2xl font-bold">
                          {formatDuration(state?.startTime, state?.endTime)}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Total duration of your focus session</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Time Creating
                  </CardTitle>
                  <WandSparkles className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="text-2xl font-bold">
                          {formatTime(totalCreating)}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Total time spent creating during session</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Net Creation
                  </CardTitle>
                  <Diff className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="text-2xl font-bold">
                          {calculateNetCreationScore(appUsage) > 0 ? '+' : ''}
                          {calculateNetCreationScore(appUsage)}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Positive = more creation, Negative = more consumption</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Top Apps Used
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    {sortedAppUsage.slice(0, 3).map((app, index) => (
                      <div key={index} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <AppIcon app={app} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="pt-6">
                <ChartContainer config={chartConfig}>
                  <BarChart 
                    height={200} 
                    data={chartData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="creatingGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(124 58 237)" stopOpacity={1} />
                        <stop offset="100%" stopColor="rgb(124 58 237)" stopOpacity={0.8} />
                      </linearGradient>
                      <linearGradient id="neutralGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(82 82 91)" stopOpacity={1} />
                        <stop offset="100%" stopColor="rgb(82 82 91)" stopOpacity={0.8} />
                      </linearGradient>
                      <linearGradient id="consumingGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(239 68 68)" stopOpacity={1} />
                        <stop offset="100%" stopColor="rgb(239 68 68)" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      vertical={false}
                      stroke="hsl(var(--border))"
                      strokeOpacity={0.8}
                    />
                    <XAxis
                      dataKey="xAxisLabel"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      interval={0}
                    />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const data = payload[0].payload
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-md">
                            <div className="mb-2 font-medium">{data.timeRange}</div>
                            <div className="space-y-1">
                              <div className="text-[rgb(124,58,237)]">Creating: {data.creating} min</div>
                              <div className="text-gray-500">Neutral: {data.neutral} min</div>
                              <div className="text-[rgb(239,68,68)]">Consuming: {data.consuming} min</div>
                              <div className="text-gray-600">Offline: {data.offline} min</div>
                            </div>
                          </div>
                        )
                      }}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar
                      dataKey="consuming"
                      stackId="a"
                      fill={chartConfig.consuming.color}
                      radius={[0, 0, 4, 4]}
                      barSize={20}
                    />
                    <Bar
                      dataKey="neutral"
                      stackId="a"
                      fill={chartConfig.neutral.color}
                      radius={[0, 0, 0, 0]}
                      barSize={20}
                    />
                    <Bar
                      dataKey="creating"
                      stackId="a"
                      fill={chartConfig.creating.color}
                      radius={[4, 4, 0, 0]}
                      barSize={20}
                    />
                    <Bar
                      dataKey="offline"
                      stackId="a"
                      fill="transparent"
                      radius={[4, 4, 0, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>App/Website Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {sortedAppUsage
                    .filter(app => app.duration >= 1)
                    .map((app) => (
                    <div key={app.id} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <AppIcon app={app} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{app.is_browser ? app.app_external_id : app.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatTime(app.duration)}
                          </span>
                        </div>
                        <Progress
                          value={(app.duration / (6 * 60)) * 100}
                          className={
                            app.rating >= 4
                              ? 'bg-[rgb(124,58,237)]/20 [&>div]:bg-[rgb(124,58,237)]' :
                            app.rating <= 2
                              ? 'bg-[rgb(239,68,68)]/20 [&>div]:bg-[rgb(239,68,68)]' :
                              'bg-gray-500/20 [&>div]:bg-gray-500'
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}
