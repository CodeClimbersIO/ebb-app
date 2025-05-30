import { useQuery } from '@tanstack/react-query'
import { platformApiRequest } from '../platformRequest'
import { EbbStatus } from './useProfile'
import { getRandomPoint } from '../../lib/utils/location.util'

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
  const data: EbbLocation[] = await platformApiRequest({
    url: '/api/users/locations',
    method: 'GET',
  })

  const locations = data.map(location => { 
    let markerLocation: [number, number] = [location.latitude, location.longitude]
    if(!location.latitude && !location.longitude) {
      markerLocation = getRandomPoint()
    }
    return {
      online_status: location.online_status,
      latitude: markerLocation[0],
      longitude: markerLocation[1],
    }
  })
  return locations
}

export const useUserStatusCounts = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: communityKeys.all,
    queryFn: () => getUserStatusCounts(),
  })

  return { data, isLoading, error, refetch }
}

export const useUserLocations = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['userLocations'],
    queryFn: () => getLocations(),
  })

  return { data, isLoading, error }
}
