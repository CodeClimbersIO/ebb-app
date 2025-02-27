import { Layout } from '@/components/Layout'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'
import { FlowSessionApi } from '../api/ebbApi/flowSessionApi'
import { DateTime } from 'luxon'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { ActivityRating } from '@/lib/app-directory/apps-types'
import { useAuth } from '../hooks/useAuth'
import { GraphableTimeByHourBlock, MonitorApi, AppsWithTime } from '../api/monitorApi/monitorApi'
import { Tag } from '../db/monitor/tagRepo'
import { UsageSummary } from '@/components/UsageSummary'

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
  const [isLoading, setIsLoading] = useState(false)
  const refreshIntervalRef = useRef<number | null>(null)

  // Get first name from user metadata
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.user_metadata?.name?.split(' ')[0] ||
    user?.email?.split('@')[0]

  const refreshData = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    try {
      const { chartData, tags, topApps } = await fetchData(date)
      setTags(tags)
      setAppUsage(topApps)
      setTotalCreating(chartData.reduce((acc, curr) => acc + curr.creating, 0))
      
      // Calculate total online time (creating + neutral + consuming)
      const online = chartData.reduce((acc, curr) => 
        acc + curr.creating + curr.neutral + curr.consuming, 0)
      setTotalOnline(online)
      
      setChartData(chartData.slice(6))
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      const flowSession = await FlowSessionApi.getInProgressFlowSession()
      if (flowSession) {
        navigate('/flow')
      }

      await refreshData()
    }
    
    init()
    
    // Set up auto-refresh interval (every 30 seconds)
    refreshIntervalRef.current = window.setInterval(() => {
      // Only auto-refresh if the selected date is today
      if (date.toDateString() === new Date().toDateString()) {
        refreshData()
      }
    }, 30000) // 30 seconds
    
    // Also refresh when window regains focus
    const handleFocus = () => {
      if (date.toDateString() === new Date().toDateString()) {
        refreshData()
      }
    }
    
    window.addEventListener('focus', handleFocus)
    
    // Clean up interval and event listener on unmount
    return () => {
      if (refreshIntervalRef.current !== null) {
        clearInterval(refreshIntervalRef.current)
      }
      window.removeEventListener('focus', handleFocus)
    }
  }, [date])

  const handleRatingChange = (tagId: string, rating: ActivityRating, tags: Tag[]) => {
    MonitorApi.setAppDefaultTag(tagId, rating, tags)
    setAppUsage(prev => prev.map(a => {
      if (a.default_tag?.id === tagId) {
        return { ...a, rating }
      }
      return a
    }))
  }

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
                      refreshData()
                    }
                  }}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <UsageSummary
            totalTimeLabel="Total Time"
            totalOnline={totalOnline}
            totalCreating={totalCreating}
            chartData={chartData}
            appUsage={appUsage}
            showTopAppsButton={true}
            showAppRatingControls={true}
            onRatingChange={handleRatingChange}
            tags={tags}
            isLoading={isLoading}
          />
        </div>
      </div>
    </Layout>
  )
}
