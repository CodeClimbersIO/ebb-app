import { useQuery } from '@tanstack/react-query'
import { FlowSessionApi } from '../ebbApi/flowSessionApi'

const flowSessionKeys = {
  all: ['flowSession'] as const,
}

const getMostRecentFlowSession = async () => {
  const data = await FlowSessionApi.getMostRecentFlowSession()
  return data
}

export const useGetMostRecentFlowSession = () => {
  return useQuery({
    queryKey: flowSessionKeys.all,
    queryFn: () => getMostRecentFlowSession(),
  })
}

