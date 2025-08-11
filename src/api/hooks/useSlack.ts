import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { slackApi, SlackPreferences } from '../ebbApi/slackApi'

const slackKeys = {
  all: ['slack'] as const,
  status: () => [...slackKeys.all, 'status'] as const,
}


const getSlackStatus = async () => slackApi.getStatus()

export const useSlackStatus = () => {
  return useQuery({
    queryKey: slackKeys.status(),
    queryFn: getSlackStatus,
    retry: false,
  })
}

export const useUpdateSlackPreferences = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (preferences: SlackPreferences) => slackApi.updatePreferences(preferences),
    onSuccess: () => {
      // Invalidate and refetch slack status to get updated preferences
      queryClient.invalidateQueries({ queryKey: slackKeys.status() })
    },
  })
}
