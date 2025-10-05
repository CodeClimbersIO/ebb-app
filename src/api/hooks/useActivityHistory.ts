import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ActivityHistoryApi } from '../monitorApi/activityHistoryApi'

export const useGetRecentlyUsedApps = (limit = 100, offset = 0) => {
  return useQuery({
    queryKey: ['recentlyUsedApps', limit, offset],
    queryFn: () => ActivityHistoryApi.getRecentlyUsedApps(limit, offset),
  })
}

export const useGetAppCount = () => {
  return useQuery({
    queryKey: ['appCount'],
    queryFn: () => ActivityHistoryApi.getAppCount(),
  })
}

export const useDeleteApp = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (appId: string) => ActivityHistoryApi.deleteApp(appId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentlyUsedApps'] })
      queryClient.invalidateQueries({ queryKey: ['appCount'] })
    },
  })
}

export const useDeleteApps = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (appIds: string[]) => ActivityHistoryApi.deleteApps(appIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentlyUsedApps'] })
      queryClient.invalidateQueries({ queryKey: ['appCount'] })
    },
  })
}
