import { useQuery } from '@tanstack/react-query'
import { platformApiRequest } from '../platformRequest'
import { EbbStatus } from './useProfile'

const communityKeys = {
  all: ['communityKeys'] as const,
}

export interface UserStatusCounts {
  online: number
  flowing: number
  active: number
  offline: number
}

export interface EbbLocation {
  latitude: number
  longitude: number
  online_status: EbbStatus
}

const getUserStatusCounts = async () => {
  const data = await platformApiRequest({
    url: '/api/users/status-counts',
    method: 'GET',
  })
  
  return data as UserStatusCounts
}

const getLocations = async () => {
  const data = await platformApiRequest({
    url: '/api/users/locations',
    method: 'GET',
  })

  return data as EbbLocation[]
}

export const useUserStatusCounts = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: communityKeys.all,
    queryFn: () => getUserStatusCounts(),
  })

  return { data, isLoading, error }
}

export const useUserLocations = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['userLocations'],
    queryFn: () => getLocations(),
  })

  return { data, isLoading, error }
}
