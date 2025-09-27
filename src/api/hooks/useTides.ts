import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TideApi, Tide, TideTemplate } from '../ebbApi/tideApi'

const tideKeys = {
  all: ['tides'] as const,
  overview: (metricsType?: string) => [...tideKeys.all, 'overview', metricsType] as const,
  daily: (metricsType?: string) => [...tideKeys.all, 'daily', metricsType] as const,
  weekly: (metricsType?: string) => [...tideKeys.all, 'weekly', metricsType] as const,
  recent: (limit?: number) => [...tideKeys.all, 'recent', limit] as const,
  active: () => [...tideKeys.all, 'active'] as const,
  templates: () => [...tideKeys.all, 'templates'] as const,
  detail: (id: string) => [...tideKeys.all, 'detail', id] as const,
}

// Query Hooks

export const useGetTideOverview = (metricsType = 'creating') => {
  return useQuery({
    queryKey: tideKeys.overview(metricsType),
    queryFn: () => TideApi.getTideOverview(metricsType),
    staleTime: 30000, // 30 seconds - tides update frequently
    refetchInterval: 60000, // Refetch every minute for real-time updates
  })
}

export const useGetCurrentDailyTide = (metricsType = 'creating') => {
  return useQuery({
    queryKey: tideKeys.daily(metricsType),
    queryFn: () => TideApi.getCurrentDailyTide(metricsType),
    staleTime: 30000,
    refetchInterval: 60000,
  })
}

export const useGetCurrentWeeklyTide = (metricsType = 'creating') => {
  return useQuery({
    queryKey: tideKeys.weekly(metricsType),
    queryFn: () => TideApi.getCurrentWeeklyTide(metricsType),
    staleTime: 30000,
    refetchInterval: 60000,
  })
}

export const useGetRecentTides = (limit = 10) => {
  return useQuery({
    queryKey: tideKeys.recent(limit),
    queryFn: () => TideApi.getRecentTides(limit),
    staleTime: 60000, // 1 minute
  })
}

export const useGetActiveTides = () => {
  return useQuery({
    queryKey: tideKeys.active(),
    queryFn: () => TideApi.getActiveTides(),
    staleTime: 30000,
    refetchInterval: 60000,
  })
}

export const useGetTideTemplates = () => {
  return useQuery({
    queryKey: tideKeys.templates(),
    queryFn: () => TideApi.getTideTemplates(),
    staleTime: 300000, // 5 minutes - templates change less frequently
  })
}

export const useGetTideById = (id: string) => {
  return useQuery({
    queryKey: tideKeys.detail(id),
    queryFn: () => TideApi.getTideById(id),
    enabled: !!id,
    staleTime: 60000,
  })
}

// Mutation Hooks

export const useCreateTideTemplate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      metricsType,
      tideFrequency,
      goalAmount,
      firstTide,
      dayOfWeek,
    }: {
      metricsType: string
      tideFrequency: string
      goalAmount: number
      firstTide: string
      dayOfWeek?: string
    }) => TideApi.createTideTemplate(metricsType, tideFrequency, goalAmount, firstTide, dayOfWeek),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tideKeys.templates() })
    },
  })
}

export const useUpdateTideTemplate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TideTemplate> }) =>
      TideApi.updateTideTemplate(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: tideKeys.templates() })
      queryClient.invalidateQueries({ queryKey: tideKeys.detail(id) })
    },
  })
}

export const useCreateTide = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      start,
      end,
      metricsType,
      tideFrequency,
      goalAmount,
      tideTemplateId,
    }: {
      start: string
      end?: string
      metricsType: string
      tideFrequency: string
      goalAmount: number
      tideTemplateId: string
    }) => TideApi.createTide(start, end, metricsType, tideFrequency, goalAmount, tideTemplateId),
    onSuccess: (_, { metricsType }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: tideKeys.overview(metricsType) })
      queryClient.invalidateQueries({ queryKey: tideKeys.daily(metricsType) })
      queryClient.invalidateQueries({ queryKey: tideKeys.weekly(metricsType) })
      queryClient.invalidateQueries({ queryKey: tideKeys.active() })
      queryClient.invalidateQueries({ queryKey: tideKeys.recent() })
    },
  })
}

export const useUpdateTide = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Tide> }) =>
      TideApi.updateTide(id, updates),
    onSuccess: (_, { id, updates }) => {
      const metricsType = updates.metrics_type
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: tideKeys.detail(id) })
      if (metricsType) {
        queryClient.invalidateQueries({ queryKey: tideKeys.overview(metricsType) })
        queryClient.invalidateQueries({ queryKey: tideKeys.daily(metricsType) })
        queryClient.invalidateQueries({ queryKey: tideKeys.weekly(metricsType) })
      }
      queryClient.invalidateQueries({ queryKey: tideKeys.active() })
      queryClient.invalidateQueries({ queryKey: tideKeys.recent() })
    },
  })
}

export const useCompleteTide = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => TideApi.completeTide(id),
    onSuccess: () => {
      // Invalidate all tide-related queries since completion affects overview
      queryClient.invalidateQueries({ queryKey: tideKeys.all })
    },
  })
}

export const useUpdateTideProgress = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, actualAmount }: { id: string; actualAmount: number }) =>
      TideApi.updateTideProgress(id, actualAmount),
    onSuccess: () => {
      // Invalidate all tide-related queries for real-time updates
      queryClient.invalidateQueries({ queryKey: tideKeys.all })
    },
  })
}

// Utility hook for formatting time consistently
export const useFormatTime = () => {
  return (minutes: number) => TideApi.formatTime(minutes)
}

// Hook for refetching tide data manually (useful for pull-to-refresh)
export const useRefreshTides = () => {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: tideKeys.all })
  }
}
