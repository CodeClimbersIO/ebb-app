import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TideApi, Tide, TemplateEdit } from '../ebbApi/tideApi'

const tideKeys = {
  all: ['tides'] as const,
  overview: (date?: Date) => [...tideKeys.all, 'overview', date?.toISOString()] as const,
  recent: (limit?: number) => [...tideKeys.all, 'recent', limit] as const,
  active: () => [...tideKeys.all, 'active'] as const,
  templates: () => [...tideKeys.all, 'templates'] as const,
  detail: (id: string) => [...tideKeys.all, 'detail', id] as const,
}

// Query Hooks

const useGetTideOverview = (date = new Date()) => {
  return useQuery({
    queryKey: tideKeys.overview(date),
    queryFn: () => TideApi.getTideOverview(date),
    staleTime: 30000, // 30 seconds - tides update frequently
    refetchInterval: 60000, // Refetch every minute for real-time updates
  })
}

const useGetRecentTides = (limit = 10) => {
  return useQuery({
    queryKey: tideKeys.recent(limit),
    queryFn: () => TideApi.getRecentTides(limit),
    staleTime: 60000, // 1 minute
  })
}

const useGetActiveTides = () => {
  return useQuery({
    queryKey: tideKeys.active(),
    queryFn: () => TideApi.getActiveTides(),
    staleTime: 30000,
    refetchInterval: 60000,
  })
}

const useGetTideTemplates = () => {
  return useQuery({
    queryKey: tideKeys.templates(),
    queryFn: () => TideApi.getTideTemplates(),
    staleTime: 300000, // 5 minutes - templates change less frequently
  })
}

const useGetTideById = (id: string) => {
  return useQuery({
    queryKey: tideKeys.detail(id),
    queryFn: () => TideApi.getTideById(id),
    enabled: !!id,
    staleTime: 60000,
  })
}

// Mutation Hooks

const useCreateTideTemplate = () => {
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


const useUpdateTideTemplates = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (editedTemplates: TemplateEdit[]) =>
      TideApi.updateTideTemplates(editedTemplates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tideKeys.templates() })
      queryClient.invalidateQueries({ queryKey: tideKeys.active() })
      queryClient.invalidateQueries({ queryKey: tideKeys.overview() })
    },
  })
}

const useCreateTide = () => {
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
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: tideKeys.overview() })
      queryClient.invalidateQueries({ queryKey: tideKeys.active() })
      queryClient.invalidateQueries({ queryKey: tideKeys.recent() })
    },
  })
}

const useUpdateTide = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Tide> }) =>
      TideApi.updateTide(id, updates),
    onSuccess: (_, { id, updates }) => {
      const metricsType = updates.metrics_type
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: tideKeys.detail(id) })
      if (metricsType) {
        queryClient.invalidateQueries({ queryKey: tideKeys.overview() })
      }
      queryClient.invalidateQueries({ queryKey: tideKeys.active() })
      queryClient.invalidateQueries({ queryKey: tideKeys.recent() })
    },
  })
}

const useCompleteTide = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => TideApi.completeTide(id),
    onSuccess: () => {
      // Invalidate all tide-related queries since completion affects overview
      queryClient.invalidateQueries({ queryKey: tideKeys.all })
    },
  })
}

const useUpdateTideProgress = () => {
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
const useFormatTime = () => {
  return (minutes: number) => TideApi.formatTime(minutes)
}

// Hook for refetching tide data manually (useful for pull-to-refresh)
const useRefreshTides = () => {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: tideKeys.all })
  }
}

export const useTides = {
  useGetTideOverview,
  useGetRecentTides,
  useGetActiveTides,
  useGetTideTemplates,
  useGetTideById,
  useCreateTideTemplate,
  useUpdateTideTemplates,
  useCreateTide,
  useUpdateTide,
  useCompleteTide,
  useUpdateTideProgress,
  useFormatTime,
  useRefreshTides,
}
