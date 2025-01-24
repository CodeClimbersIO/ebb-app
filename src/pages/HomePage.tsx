import { Layout } from '@/components/Layout'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Activity, Flame, Code2, ChevronDown, Palette, Wand2, Pencil } from 'lucide-react'
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
import { Progress } from '@/components/ui/progress'
import { apps } from '@/lib/app-directory/apps-list'
import { categoryEmojis, AppDefinition } from '@/lib/app-directory/apps-types'

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

type AppUsage = {
  name: string
  icon: string // This would be a path to the icon or an emoji as placeholder
  timeSpent: number // in minutes
  category: 'Creating' | 'Consuming' | 'Neutral'
}

// Helper function to get random items from array
const getRandomItems = (array: AppDefinition[], count: number) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

// Get random apps for display
const usageApps = getRandomItems(apps, 6).map(app => ({
  name: app.type === 'application' ? app.name : app.websiteUrl,
  icon: app.icon,
  timeSpent: Math.floor(Math.random() * 180) + 30, // Random time between 30-210 minutes
  category: app.defaultRating
}))

export const HomePage = () => {
  const { showZeroState, userRole } = useSettings()
  const navigate = useNavigate()
  const [hasNoSessions, setHasNoSessions] = useState(true)
  const [streak, setStreak] = useState(0)
  const [date, setDate] = useState<Date>(new Date())
  const [appUsage, setAppUsage] = useState(usageApps)
  const appUsageRef = useRef<HTMLDivElement>(null)
  const [isRoleIconHovered, setIsRoleIconHovered] = useState(false)

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

  const getTimeSpentLabel = () => {
    switch(userRole) {
      case 'developer':
        return 'Time Spent Coding'
      case 'designer':
        return 'Time Spent Designing'
      case 'creator':
        return 'Time Spent Creating'
      default:
        return 'Time Spent Coding'
    }
  }

  const updateAppCategory = (appName: string, newCategory: AppUsage['category']) => {
    setAppUsage(prev => prev.map(app => 
      app.name === appName ? { ...app, category: newCategory } : app
    ))
  }

  const scrollToAppUsage = () => {
    appUsageRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleRoleIconClick = () => {
    navigate('/settings#role')
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

  // Sort app usage in the render section, before mapping
  const sortedAppUsage = [...appUsage].sort((a, b) => b.timeSpent - a.timeSpent)

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
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {getTimeSpentLabel()}
                  </CardTitle>
                  <div
                    className="cursor-pointer"
                    onMouseEnter={() => setIsRoleIconHovered(true)}
                    onMouseLeave={() => setIsRoleIconHovered(false)}
                    onClick={handleRoleIconClick}
                  >
                    {isRoleIconHovered ? (
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    ) : userRole === 'developer' ? (
                      <Code2 className="h-4 w-4 text-muted-foreground" />
                    ) : userRole === 'designer' ? (
                      <Palette className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Wand2 className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="text-2xl font-bold">3h 45m</div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total time spent {userRole === 'developer' ? 'coding' : userRole === 'designer' ? 'designing' : 'creating'} today</p>
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
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                          {app.icon ? (
                            <img 
                              src={`/src/lib/app-directory/icons/${app.icon}`} 
                              alt={app.name}
                              className="h-5 w-5"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                const parent = target.parentElement
                                const appDef = apps.find(a => 
                                  (a.type === 'application' && a.name === app.name) || 
                                  (a.type === 'website' && a.websiteUrl === app.name)
                                )
                                if (parent && appDef) {
                                  parent.textContent = categoryEmojis[appDef.category]
                                }
                              }}
                            />
                          ) : (
                            <span className="text-muted-foreground">❓</span>
                          )}
                        </div>
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

          <Card className="mt-4" ref={appUsageRef}>
            <CardHeader>
              <CardTitle>App/Website Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {sortedAppUsage.map((app) => (
                  <div key={app.name} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      {app.icon ? (
                        <img 
                          src={`/src/lib/app-directory/icons/${app.icon}`} 
                          alt={app.name}
                          className="h-5 w-5"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            const parent = target.parentElement
                            const appDef = apps.find(a => 
                              (a.type === 'application' && a.name === app.name) || 
                              (a.type === 'website' && a.websiteUrl === app.name)
                            )
                            if (parent && appDef) {
                              parent.textContent = categoryEmojis[appDef.category]
                            } else if (parent) {
                              // Fallback to using the app's category that we already have
                              const foundApp = apps.find(a => 
                                (a.type === 'application' && a.name === app.name) || 
                                (a.type === 'website' && a.websiteUrl === app.name)
                              )
                              parent.textContent = foundApp ? categoryEmojis[foundApp.category] : '❓'
                            }
                          }}
                        />
                      ) : (
                        <span className="text-muted-foreground">❓</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{app.name}</span>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button 
                                variant="ghost"
                                size="sm"
                                className={`h-6 px-2 py-0 text-xs font-medium ${
                                  app.category === 'Creating' ? 'text-[rgb(124,58,237)] hover:bg-primary/10' :
                                  app.category === 'Consuming' ? 'text-[rgb(239,68,68)] hover:bg-destructive/10' :
                                  'text-gray-500 hover:bg-muted'
                                }`}
                              >
                                {app.category}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-fit p-1">
                              <div className="flex flex-col gap-1.5">
                                {(['Creating', 'Consuming', 'Neutral'] as const).map((category) => (
                                  <Button
                                    key={category}
                                    variant="ghost"
                                    size="sm"
                                    className={`h-6 px-2 py-0 text-xs font-medium justify-start ${
                                      category === 'Creating' ? 'text-[rgb(124,58,237)] hover:bg-primary/10' :
                                      category === 'Consuming' ? 'text-[rgb(239,68,68)] hover:bg-destructive/10' :
                                      'text-gray-500 hover:bg-muted'
                                    }`}
                                    onClick={() => {
                                      updateAppCategory(app.name, category)
                                      const button = document.activeElement as HTMLElement
                                      button?.blur()
                                    }}
                                  >
                                    {category}
                                  </Button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {Math.floor(app.timeSpent / 60)}h {app.timeSpent % 60}m
                        </span>
                      </div>
                      <Progress 
                        value={(app.timeSpent / (6 * 60)) * 100} 
                        className={
                          app.category === 'Creating' || app.category === 'Neutral'
                            ? 'bg-[rgb(124,58,237)]/20 [&>div]:bg-[rgb(124,58,237)]' :
                          app.category === 'Consuming' 
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
