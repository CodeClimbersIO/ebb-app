import { Layout } from '@/components/Layout'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Activity, Flame, Code2, ChevronDown } from 'lucide-react'
import { FlowSessionApi } from '../api/ebbApi/flowSessionApi'
import { useSettings } from '../hooks/useSettings'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DateTime } from 'luxon'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from '@/components/ui/chart'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

const generateHourlyData = () => {
  const data = []
  const currentHour = DateTime.now().hour
  
  // Always show structure from 6 AM to midnight
  for (let hour = 6; hour < 24; hour++) {
    const time = `${hour}:00`
    const displayTime = DateTime.now().set({ hour, minute: 0 }).toFormat('h:mm a')
    const nextHour = DateTime.now().set({ hour: hour + 1, minute: 0 }).toFormat('h:mm a')
    const timeRange = `${displayTime} - ${nextHour}`
    
    const showLabel = [6, 10, 14, 18, 22].includes(hour)
    const xAxisLabel = showLabel ? DateTime.now().set({ hour }).toFormat('h a') : ''
    
    // Only generate data for hours up to current hour
    let creating = 0
    let consuming = 0
    let offline = 0
    
    if (hour <= currentHour) {
      creating = Math.floor(Math.random() * 40)
      consuming = Math.floor(Math.random() * (60 - creating))
      offline = 60 - creating - consuming
    }
    
    data.push({
      time,
      timeRange,
      xAxisLabel,
      creating,
      consuming,
      offline,
    })
  }
  return data
}

const chartData = generateHourlyData()

const chartConfig = {
  consuming: {
    label: 'Consuming',
    color: 'rgb(248, 113, 113)',
  },
  creating: {
    label: 'Creating',
    color: 'rgb(124,58,237)',
  },
} satisfies ChartConfig

const calculateFlowScore = (creating: number, consuming: number, offline: number) => {
  const total = creating + consuming + offline
  return total > 0 ? Math.round(((creating + offline) / total) * 100) : 0
}

export const HomePage = () => {
  const { showZeroState } = useSettings()
  const navigate = useNavigate()
  const [hasNoSessions, setHasNoSessions] = useState(true)
  const [streak, setStreak] = useState(0)
  const [date, setDate] = useState<Date>(new Date())

  useEffect(() => {
    const init = async () => {
      const flowSession = await FlowSessionApi.getInProgressFlowSession()
      if (flowSession) {
        navigate('/flow')
      }
      const sessions = await FlowSessionApi.getFlowSessions()
      setHasNoSessions(sessions.length === 0)
      
      // Get streak data
      const flowSessionPeriodComparisons = await FlowSessionApi.getFlowSessionPeriodComparisons('week')
      let currentStreak = 0
      let currentDate = DateTime.now().startOf('day')
      let daysToCheck = 30
      
      while (daysToCheck > 0) {
        if (currentDate.weekday >= 6) {
          currentDate = currentDate.minus({ days: 1 })
          continue
        }

        const hasSessionOnDay = flowSessionPeriodComparisons.current.sessions.some(session => {
          const sessionDate = DateTime.fromISO(session.start).startOf('day')
          return sessionDate.hasSame(currentDate, 'day')
        })

        if (!hasSessionOnDay) break
        currentStreak++
        currentDate = currentDate.minus({ days: 1 })
        daysToCheck--
      }

      setStreak(currentStreak)
    }
    init()
  }, [])

  const handleStartFlowSession = () => {
    navigate('/start-flow')
  }

  if (showZeroState || hasNoSessions) {
    return (
      <Layout>
        <div className="p-8">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-semibold mb-8">Welcome, Nathan</h1>
            <div className="border rounded-lg p-8 text-center">
              <h2 className="text-xl font-medium mb-4">Ready to start your flow journey?</h2>
              <p className="text-muted-foreground mb-6">
                It's time to lock in and improve your focus
              </p>
              <Button size="lg" onClick={handleStartFlowSession}>
                <Activity className="mr-2 h-5 w-5" />
                Start Focus Session
              </Button>
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
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-semibold">Welcome, Nathan</h1>
              {streak > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center gap-1 text-orange-500">
                        <Flame className="h-5 w-5" />
                        <span className="font-medium">{streak}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Number of consecutive days with a focus session, excluding weekends</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-start text-left font-normal"
                >
                  <div className="flex items-center gap-2">
                    {date.toLocaleDateString() === new Date().toLocaleDateString() 
                      ? 'Today'
                      : DateTime.fromJSDate(date).toFormat('LLL dd, yyyy')}
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <TooltipProvider>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Time Spent Coding</CardTitle>
                  <Code2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="text-2xl font-bold">3h 45m</div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total time spent coding today</p>
                    </TooltipContent>
                  </Tooltip>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Flow Score</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="text-2xl font-bold">
                        {calculateFlowScore(25, 15, 20)}%
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Percentage of time spent creating today (including offline time)</p>
                    </TooltipContent>
                  </Tooltip>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Top Used Apps</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <div className="h-6 w-6 rounded bg-muted">VS</div>
                    <div className="h-6 w-6 rounded bg-muted">Fi</div>
                    <div className="h-6 w-6 rounded bg-muted">Sl</div>
                  </div>
                </CardContent>
              </Card>
            </TooltipProvider>
          </div>

          <Card>
            <CardContent className="pt-6">
              <ChartContainer config={chartConfig}>
                <BarChart height={300} data={chartData}>
                  <defs>
                    <linearGradient id="creatingGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(124 58 237)" stopOpacity={1} />
                      <stop offset="100%" stopColor="rgb(124 58 237)" stopOpacity={0.8} />
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
                            <div className="text-[rgb(239,68,68)]">Consuming: {data.consuming} min</div>
                            <div className="text-gray-500">Offline: {data.offline} min</div>
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
                    dataKey="creating"
                    stackId="a"
                    fill={chartConfig.creating.color}
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
