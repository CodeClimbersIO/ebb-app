import { useQuery } from '@tanstack/react-query'
import { platformApiRequest } from '../platformRequest'

const communityKeys = {
  all: ['communityKeys'] as const,
}

const getUserStatusCounts = async () => {
  const data = await platformApiRequest({
    url: '/api/users/status-counts',
    method: 'GET',
  })
  
  return data as {
    online: number
    flowing: number
    active: number
    offline: number
  }
}

export const useUserStatusCounts = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: communityKeys.all,
    queryFn: () => getUserStatusCounts(),
  })

  return { data, isLoading, error }
}
