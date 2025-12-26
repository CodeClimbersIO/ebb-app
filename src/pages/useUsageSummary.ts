import { useEffect, useState, useRef } from 'react'
import { DateTime } from 'luxon'
import { MonitorApi, GraphableTimeByHourBlock } from '@/api/monitorApi/monitorApi'
import { Tag } from '../db/monitor/tagRepo'
import { useAppUsage, useGetChartData } from '@/api/hooks/useAppUsage'
import { useUsageSummaryStore, type RangeMode } from '@/lib/stores/usageSummaryStore'

const buildTotalTimeTooltip = (rangeMode: RangeMode, showIdleTime: boolean) => {
  let message = 'Total time spent online'
  if (rangeMode === 'day') {
    message += ' today'
  } else if (rangeMode === 'week') {
    message += ' this week'
  } else {
    message += ' this month'
  }
  if (showIdleTime) {
    message += ' (including idle time)'
  } else {
    message += ' (not including idle time)'
  }

  return message
}

const buildTotalTimeLabel = (showIdleTime: boolean) => {
  return showIdleTime ? 'Total Time Online' : 'Total Time Active'
}

export function useUsageSummary() {
  const date = useUsageSummaryStore((state) => state.date)
  const setDate = useUsageSummaryStore((state) => state.setDate)
  const rangeMode = useUsageSummaryStore((state) => state.rangeMode)
  const setRangeMode = useUsageSummaryStore((state) => state.setRangeMode)
  const { data: appUsage, refetch: refetchAppUsage } = useAppUsage({ rangeMode, date })
  const { data: chartData, refetch: refetchChartData } = useGetChartData({ rangeMode, date })
  const [yAxisMax, setYAxisMax] = useState(0)
  const [totalCreating, setTotalCreating] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const refreshIntervalRef = useRef<number | null>(null)
  const [totalCreatingTrend, setTotalCreatingTrend] = useState<{ percent: number, direction: 'up' | 'down' | 'none' }>({ percent: 0, direction: 'none' })
  const [totalTimeTrend, setTotalTimeTrend] = useState<{ percent: number, direction: 'up' | 'down' | 'none' }>({ percent: 0, direction: 'none' })
  const [showIdleTime, setShowIdleTime] = useState(false)
  const [totalTimeTooltip, setTotalTimeTooltip] = useState('Total time spent online today (not including idle time)' )
  const [totalTimeLabel, setTotalTimeLabel] = useState('Total Active Time')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    const tooltip = buildTotalTimeTooltip(rangeMode, showIdleTime)
    const label = buildTotalTimeLabel(showIdleTime)
    setTotalTimeTooltip(tooltip)
    setTotalTimeLabel(label)
  }, [rangeMode, showIdleTime])



  const getPreviousPeriod = () => {
    let prevStart, prevEnd
    if (rangeMode === 'week') {
      // Get Monday of the previous week
      const currentDate = DateTime.fromJSDate(date)
      const thisMonday = currentDate.minus({ days: currentDate.weekday - 1 })
      const prevMonday = thisMonday.minus({ weeks: 1 })
      prevStart = prevMonday.startOf('day')
      prevEnd = prevMonday.plus({ days: 6 }).endOf('day') // Sunday
    } else {
      // Month view - previous 4 weeks before current 4 weeks
      const currentDate = DateTime.fromJSDate(date)
      prevEnd = currentDate.minus({ weeks: 4 }).endOf('day')
      prevStart = currentDate.minus({ weeks: 8 }).startOf('week')
    }
    return { prevStart, prevEnd }
  }

  useEffect(() => {
    const fetchData = async () => {
      if (rangeMode === 'month') setIsLoading(true)
      else setIsLoading(false)

      let start, end
      if (rangeMode === 'day') {
        start = DateTime.fromJSDate(date).startOf('day')
        end = DateTime.fromJSDate(date).endOf('day')
      } else if (rangeMode === 'week') {
        // Get Monday-Sunday of the week containing the selected date
        const currentDate = DateTime.fromJSDate(date)
        const monday = currentDate.minus({ days: currentDate.weekday - 1 })
        start = monday.startOf('day')
        end = monday.plus({ days: 6 }).endOf('day') // Sunday
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
      setTags(tags)
      setTotalCreating(chartData.reduce((acc, curr) => acc + curr.creating, 0))
      const online = chartData.reduce((acc, curr) => acc + curr.creating + curr.neutral + curr.consuming + (showIdleTime ? curr.idle : 0), 0)
      setTotalTime(online)
      setLastUpdated(new Date())
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
      const prevOnline = prevChartData.reduce((acc, curr) => acc + curr.creating + curr.neutral + curr.consuming, 0)

      // Calculate trends
      const calcTrend = (current: number, prev: number): { percent: number, direction: 'up' | 'down' | 'none' } => {
        if (prev === 0 && current === 0) return { percent: 0, direction: 'none' }
        if (prev === 0) return { percent: 100, direction: 'up' }
        const percent = Math.abs(((current - prev) / prev) * 100)
        if (current > prev) return { percent, direction: 'up' }
        if (current < prev) return { percent, direction: 'down' }
        return { percent: 0, direction: 'none' }
      }  
      let yAxisMax: number | undefined = undefined
      if ((rangeMode === 'week' || rangeMode === 'month') && chartData.length > 0) {
        yAxisMax = Math.max(...chartData.map(day => day.creating + day.consuming + day.neutral + day.idle))
      }

      setYAxisMax(yAxisMax || 0)

      if(rangeMode !== 'day') {
        setTotalCreatingTrend(calcTrend(chartData.reduce((acc, curr) => acc + curr.creating, 0), prevCreating))
        setTotalTimeTrend(calcTrend(online, prevOnline))
      } else {
        setTotalCreatingTrend({ percent: 0, direction: 'none' })
        setTotalTimeTrend({ percent: 0, direction: 'none' })
      }
    }
    fetchData()
  }, [date, rangeMode, showIdleTime, chartData])

  useEffect(() => {
    const refetchData = async () => {
      await refetchAppUsage()
      await refetchChartData()
    }
    refetchData()
    refreshIntervalRef.current = window.setInterval(async () => {
      if (rangeMode === 'day' && date.toDateString() === new Date().toDateString()) {
        await refetchData()
      } else if (rangeMode === 'week' || rangeMode === 'month') {
        await refetchData()
      }
    }, 30000)
    const handleFocus = async () => {
      if (rangeMode === 'day' && date.toDateString() === new Date().toDateString()) {
        await refetchData()
      } else if (rangeMode === 'week' || rangeMode === 'month') {
        await refetchData()
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => {
      if (refreshIntervalRef.current !== null) {
        clearInterval(refreshIntervalRef.current)
      }
      window.removeEventListener('focus', handleFocus)
    }
  }, [date, rangeMode, refetchAppUsage, refetchChartData])



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
    yAxisMax,
    showIdleTime,
    setShowIdleTime,
    totalTimeTooltip,
    totalTimeLabel,
    lastUpdated,
  }
} 
