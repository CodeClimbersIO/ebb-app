import { useQuery } from '@tanstack/react-query'
import { slackApi } from '../ebbApi/slackApi'

const slackKeys = {
  all: ['slack'] as const,
  status: () => [...slackKeys.all, 'status'] as const,
}


const getSlackStatus = async () => slackApi.getStatus()

export const useSlackStatus = () => {
  return useQuery({
    queryKey: slackKeys.status(),
    queryFn: getSlackStatus,
  })
}
