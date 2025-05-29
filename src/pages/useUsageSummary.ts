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
  const [totalCreatingTrend, setTotalCreatingTrend] = useState<{ percent: number, direction: 'up' | 'down' | 'none' }>({ percent: 0, direction: 'none' })
  const [totalTimeTrend, setTotalTimeTrend] = useState<{ percent: number, direction: 'up' | 'down' | 'none' }>({ percent: 0, direction: 'none' })

  const getPreviousPeriod = () => {
    let prevStart, prevEnd
    if (rangeMode === 'week') {
      prevStart = DateTime.fromJSDate(date).minus({ days: 13 }).startOf('day')
      prevEnd = DateTime.fromJSDate(date).minus({ days: 7 }).endOf('day')
    } else {
      // Month view - previous 4 weeks before current 4 weeks
      const currentDate = DateTime.fromJSDate(date)
      prevEnd = currentDate.minus({ weeks: 4 }).endOf('day')
      prevStart = currentDate.minus({ weeks: 8 }).startOf('week')
    }
    return { prevStart, prevEnd }
  }

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
    const online = chartData.reduce((acc, curr) => acc + curr.creating + curr.neutral + curr.consuming + curr.idle, 0)
    setTotalTime(online)
    setChartData(chartData)
    setIsLoading(false)

    // --- Trend Calculation ---
    const { prevStart, prevEnd } = getPreviousPeriod()
    let prevChartData: GraphableTimeByHourBlock[]
    if (rangeMode === 'week') {
      prevChartData = await MonitorApi.getTimeCreatingByDay(prevStart, prevEnd)
    } else if (rangeMode === 'month') {
      prevChartData = await MonitorApi.getTimeCreatingByWeek(prevStart, prevEnd)
    } else {
      prevChartData = []
    }

    const prevCreating = prevChartData.reduce((acc, curr) => acc + curr.creating, 0)
    const prevOnline = prevChartData.reduce((acc, curr) => acc + curr.creating + curr.neutral + curr.consuming + curr.idle, 0)

    // Calculate trends
    const calcTrend = (current: number, prev: number): { percent: number, direction: 'up' | 'down' | 'none' } => {
      if (prev === 0 && current === 0) return { percent: 0, direction: 'none' }
      if (prev === 0) return { percent: 100, direction: 'up' }
      const percent = Math.abs(((current - prev) / prev) * 100)
      if (current > prev) return { percent, direction: 'up' }
      if (current < prev) return { percent, direction: 'down' }
      return { percent: 0, direction: 'none' }
    }
    if(rangeMode !== 'day') {
      setTotalCreatingTrend(calcTrend(chartData.reduce((acc, curr) => acc + curr.creating, 0), prevCreating))
      setTotalTimeTrend(calcTrend(online, prevOnline))
    } else {
      setTotalCreatingTrend({ percent: 0, direction: 'none' })
      setTotalTimeTrend({ percent: 0, direction: 'none' })
    }
    
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
    yAxisMax = Math.max(...chartData.map(day => day.creating + day.consuming + day.neutral + day.idle))
  }

  return {
    date,
    setDate,
    rangeMode,
    setRangeMode,
    appUsage,
    totalCreating: { value: totalCreating, trend: totalCreatingTrend },
    totalTime: { value: totalTime, trend: totalTimeTrend },
    chartData,
    tags,
    isLoading,
    handleRatingChange,
    yAxisMax,
  }
} 
