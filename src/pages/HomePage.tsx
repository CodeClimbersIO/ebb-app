import { Layout } from '@/components/Layout'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { WandSparkles, ChevronDown } from 'lucide-react'
import { FlowSessionApi } from '../api/ebbApi/flowSessionApi'
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
import { Progress } from '@/components/ui/progress'
import { ActivityRating } from '@/lib/app-directory/apps-types'
import { Slider } from '@/components/ui/slider'
import { useAuth } from '../hooks/useAuth'
import { GraphableTimeByHourBlock, MonitorApi, AppsWithTime } from '../api/monitorApi/monitorApi'
import { AppIcon } from '../components/AppIcon'
import { Tag } from '../db/monitor/tagRepo'

const chartConfig = {
  creating: {
    label: 'Creating',
    color: 'rgb(124,58,237)', // Purple
  },
  neutral: {
    label: 'Neutral',
    color: 'hsl(var(--muted-foreground) / 0.5)', // Using the muted foreground color with 50% opacity
  },
  consuming: {
    label: 'Consuming',
    color: 'rgb(248,113,113)', // Red
  },
} satisfies ChartConfig

const formatTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = Math.round(minutes % 60)
  
  if (remainingMinutes === 60) {
    return `${hours + 1}h 0m`
  }
  
  return `${hours}h ${remainingMinutes}m`
}

const fetchData = async (selectedDate: Date) => {
  const start = DateTime.fromJSDate(selectedDate).startOf('day')
  const end = DateTime.fromJSDate(selectedDate).endOf('day')
  
  const chartData = await MonitorApi.getTimeCreatingByHour(start, end)
  const tags = await MonitorApi.getTagsByType('default')
  const topApps = await MonitorApi.getTopAppsByPeriod(start, end)

  return { chartData, tags, topApps }
}

export const HomePage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [date, setDate] = useState<Date>(new Date())
  const [appUsage, setAppUsage] = useState<AppsWithTime[]>([])
  const [totalCreating, setTotalCreating] = useState(0)
  const [totalOnline, setTotalOnline] = useState(0)
  const [chartData, setChartData] = useState<GraphableTimeByHourBlock[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const appUsageRef = useRef<HTMLDivElement>(null)

  // Get first name from user metadata
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.user_metadata?.name?.split(' ')[0] ||
    user?.email?.split('@')[0]

  useEffect(() => {
    const init = async () => {
      const flowSession = await FlowSessionApi.getInProgressFlowSession()
      if (flowSession) {
        navigate('/flow')
      }

      const { chartData, tags, topApps } = await fetchData(date)
      setTags(tags)
      setAppUsage(topApps)
      setTotalCreating(chartData.reduce((acc, curr) => acc + curr.creating, 0))
      
      // Calculate total online time (creating + neutral + consuming)
      const online = chartData.reduce((acc, curr) => 
        acc + curr.creating + curr.neutral + curr.consuming, 0)
      setTotalOnline(online)
      
      setChartData(chartData.slice(6))
    }
    init()
    const handleFocus = () => {
      fetchData(date)
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [date])

  const scrollToAppUsage = () => {
    appUsageRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Sort app usage in the render section, before mapping
  const sortedAppUsage = [...appUsage].sort((a, b) => b.duration - a.duration)

  return (
    <Layout>
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">
                {firstName ? `Welcome, ${firstName}` : 'Welcome'}
              </h1>
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
                  onSelect={(newDate) => {
                    if (newDate) {
                      setDate(newDate)
                      fetchData(newDate)
                    }
                  }}
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
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Time</CardTitle>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <line x1="8" x2="16" y1="21" y2="21" />
                    <line x1="12" x2="12" y1="17" y2="21" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="text-2xl font-bold">{formatTime(totalOnline)}</div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total time spent online today</p>
                    </TooltipContent>
                  </Tooltip>
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
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="text-2xl font-bold">{formatTime(totalCreating)}</div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total time spent creating today</p>
                    </TooltipContent>
                  </Tooltip>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Top Apps/Websites</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    {sortedAppUsage.slice(0, 3).map((app, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        className="w-8 h-8 p-0"
                        onClick={scrollToAppUsage}
                      >
                        <AppIcon app={app} />
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TooltipProvider>
          </div>

          <Card>
            <CardContent className="pt-6">
              <ChartContainer config={chartConfig}>
                <BarChart height={200} data={chartData}>
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

          <Card className="mt-4" ref={appUsageRef}>
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
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{app.is_browser ? app.app_external_id : app.name}</span>
                            <Popover>
                              <PopoverTrigger asChild>
                                <div className="w-[80px]">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`h-6 px-2 py-0 text-xs font-medium justify-start ${app.rating >= 4 ? 'text-[rgb(124,58,237)] hover:bg-primary/10' :
                                      app.rating <= 2 ? 'text-[rgb(239,68,68)] hover:bg-destructive/10' :
                                        'text-gray-500 hover:bg-muted'
                                      }`}
                                  >
                                    {app.rating === 5 ? 'High Creation' :
                                      app.rating === 4 ? 'Creation' :
                                        app.rating === 3 ? 'Neutral' :
                                          app.rating === 2 ? 'Consumption' :
                                            'High Consumption'}
                                  </Button>
                                </div>
                              </PopoverTrigger>
                              <PopoverContent className="w-[280px] p-4">
                                <div className="space-y-4">
                                  <div className="relative">
                                    <Slider
                                      defaultValue={[app.rating]}
                                      max={5}
                                      min={1}
                                      step={1}
                                      trackColor={
                                        app.rating >= 4
                                          ? 'bg-[rgb(124,58,237)]/20'
                                          : app.rating <= 2
                                            ? 'bg-[rgb(239,68,68)]/20'
                                            : 'bg-gray-500/20'
                                      }
                                      rangeColor={
                                        app.rating >= 4
                                          ? 'bg-[rgb(124,58,237)]'
                                          : app.rating <= 2
                                            ? 'bg-[rgb(239,68,68)]'
                                            : 'bg-gray-500'
                                      }
                                      thumbBorderColor={
                                        app.rating >= 4
                                          ? 'border-[rgb(124,58,237)]'
                                          : app.rating <= 2
                                            ? 'border-[rgb(239,68,68)]'
                                            : 'border-gray-500'
                                      }
                                      onValueChange={([value]) => {
                                        if (!app.default_tag) return
                                        MonitorApi.setAppDefaultTag(app.default_tag.id, value as ActivityRating, tags)
                                        setAppUsage(prev => prev.map(a => {
                                          if (!app.is_browser && a.name === app.name) {
                                            return { ...a, rating: value as ActivityRating }
                                          } else if (app.is_browser && a.app_external_id === app.app_external_id) {
                                            return { ...a, rating: value as ActivityRating }
                                          }
                                          return a
                                        }))
                                      }}
                                      className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:bg-background"
                                    />
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
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
        </div>
      </div>
    </Layout>
  )
}
