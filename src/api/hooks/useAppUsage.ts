// hooks/useAppUsage.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query' // NEW: Import Tanstack Query hooks
import { MonitorApi, AppsWithTime, GraphableTimeByHourBlock } from '@/api/monitorApi/monitorApi' // Adjust path as needed for types
import { ActivityRating } from '@/lib/app-directory/apps-types' // Adjust path as needed for types
import { Tag, TagRepo } from '@/db/monitor/tagRepo' // Adjust path as needed for types
import { DateTime } from 'luxon'

// Define query keys for React Query
const appKanbanKeys = {
  all: ['appKanban'] as const,
  appUsage: () => [...appKanbanKeys.all, 'appUsage'] as const,
  tags: () => [...appKanbanKeys.all, 'tags'] as const,
  chartData: () => [...appKanbanKeys.all, 'chartData'] as const,
}

export const useAppUsage = ({ rangeMode, date }: { rangeMode: 'day' | 'week' | 'month', date: Date }) => {
  return useQuery<AppsWithTime[]>({
    queryKey: appKanbanKeys.appUsage(),
    queryFn: async () => {
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
      const appUsage = await MonitorApi.getTopAppsByPeriod(start, end)
      return appUsage || []
    },
    refetchOnWindowFocus: true, // Prevent refetch on window focus for this data
  })
}

export const useUpdateAppRatingMutation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ tagId, rating }: { tagId: string; rating: ActivityRating }) =>
      MonitorApi.updateAppRating(tagId, rating),
    onSuccess: () => {
      // Invalidate app usage query to refetch updated data or update cache
      queryClient.invalidateQueries({ queryKey: appKanbanKeys.chartData() })
      console.log('App rating updated successfully via mutation!')
    },
    onError: (error) => {
      console.error('Failed to update app rating via mutation:', error)
      // Optionally, revert UI state here if mutation fails
    },
  })
}

export const useTags = () => {
  return useQuery<Tag[]>({
    queryKey: appKanbanKeys.tags(),
    queryFn: () => TagRepo.getTagsByType('default'),
    staleTime: Infinity, 
    refetchOnWindowFocus: false,
  })
}

export const useGetChartData = ({ rangeMode, date }: { rangeMode: 'day' | 'week' | 'month', date: Date }) => {
  return useQuery<GraphableTimeByHourBlock[]>({
    queryKey: appKanbanKeys.chartData(),
    queryFn: async () => {
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
      return chartData
    },
  })
}
