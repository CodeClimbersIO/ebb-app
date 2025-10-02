import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TideApi, TemplateEdit } from '@/api/ebbApi/tideApi'

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

const useGetTideTemplates = () => {
  return useQuery({
    queryKey: tideKeys.templates(),
    queryFn: () => TideApi.getTideTemplates(),
    staleTime: 300000, // 5 minutes - templates change less frequently
  })
}

// Mutation Hooks

const useUpdateTideTemplates = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (editedTemplates: TemplateEdit[]) =>
      TideApi.updateTideTemplates(editedTemplates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tideKeys.all })
    },
  })
}

export const useTides = {
  useGetTideOverview,
  useGetTideTemplates,
  useUpdateTideTemplates,
}
