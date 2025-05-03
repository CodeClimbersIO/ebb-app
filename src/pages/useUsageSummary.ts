import { useEffect, useState, useRef, useCallback } from 'react'
import { DateTime } from 'luxon'
import { MonitorApi, GraphableTimeByHourBlock, AppsWithTime } from '../api/monitorApi/monitorApi'
import { Tag } from '../db/monitor/tagRepo'
import { ActivityRating } from '@/lib/app-directory/apps-types'

export function useUsageSummary() {
  const [date, setDate] = useState<Date>(new Date())
  const [rangeMode, setRangeMode] = useState<'day' | 'week' | 'month'>('day')
  const [appUsage, setAppUsage] = useState<AppsWithTime[]>([])
  const [totalCreating, setTotalCreating] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [chartData, setChartData] = useState<GraphableTimeByHourBlock[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const refreshIntervalRef = useRef<number | null>(null)

  const refreshData = useCallback(async () => {
    if (rangeMode === 'month') setIsLoading(true)
    else setIsLoading(false)

    let start, end
    if (rangeMode === 'day') {
      start = DateTime.fromJSDate(date).startOf('day')
      end = DateTime.fromJSDate(date).endOf('day')
    } else if (rangeMode === 'week') {
      start = DateTime.fromJSDate(date).minus({ days: 6 }).startOf('day')
      end = DateTime.fromJSDate(date).endOf('day')
    } else {
      // Month view - show current week and previous 4 weeks
      const currentDate = DateTime.fromJSDate(date)
      end = currentDate.endOf('day')
      start = currentDate.minus({ weeks: 4 }).startOf('week')
    }

    let chartData: GraphableTimeByHourBlock[]
    if (rangeMode === 'week') {
      chartData = await MonitorApi.getTimeCreatingByDay(start, end)
    } else if (rangeMode === 'month') {
      chartData = await MonitorApi.getTimeCreatingByWeek(start, end)
    } else {
      const chartDataRaw = await MonitorApi.getTimeCreatingByHour(start, end)
      chartData = chartDataRaw.slice(6)
    }

    const tags = await MonitorApi.getTagsByType('default')
    const topApps = await MonitorApi.getTopAppsByPeriod(start, end)
    setTags(tags)
    setAppUsage(topApps)
    setTotalCreating(chartData.reduce((acc, curr) => acc + curr.creating, 0))
    const online = chartData.reduce((acc, curr) => acc + curr.creating + curr.neutral + curr.consuming, 0)
    setTotalTime(online)
    setChartData(chartData)
    setIsLoading(false)
  }, [date, rangeMode])

  useEffect(() => {
    refreshData()
    refreshIntervalRef.current = window.setInterval(async () => {
      if (rangeMode === 'day' && date.toDateString() === new Date().toDateString()) {
        await refreshData()
      } else if (rangeMode === 'week' || rangeMode === 'month') {
        await refreshData()
      }
    }, 30000)
    const handleFocus = async () => {
      if (rangeMode === 'day' && date.toDateString() === new Date().toDateString()) {
        await refreshData()
      } else if (rangeMode === 'week' || rangeMode === 'month') {
        await refreshData()
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => {
      if (refreshIntervalRef.current !== null) {
        clearInterval(refreshIntervalRef.current)
      }
      window.removeEventListener('focus', handleFocus)
    }
  }, [date, rangeMode, refreshData])

  const handleRatingChange = (tagId: string, rating: ActivityRating, tags: Tag[]) => {
    MonitorApi.setAppDefaultTag(tagId, rating, tags)
    setAppUsage(prev => prev.map(a => {
      if (a.default_tag?.id === tagId) {
        return { ...a, rating }
      }
      return a
    }))
  }

  // Calculate yAxisMax for week/month view
  let yAxisMax: number | undefined = undefined
  if ((rangeMode === 'week' || rangeMode === 'month') && chartData.length > 0) {
    yAxisMax = Math.max(...chartData.map(day => day.creating + day.consuming + day.neutral))
  }

  return {
    date,
    setDate,
    rangeMode,
    setRangeMode,
    appUsage,
    totalCreating,
    totalTime,
    chartData,
    tags,
    isLoading,
    handleRatingChange,
    yAxisMax,
  }
} 
