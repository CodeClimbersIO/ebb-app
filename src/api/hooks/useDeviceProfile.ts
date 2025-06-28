import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { DeviceProfileApi } from '../ebbApi/deviceProfileApi'
import { DevicePreference } from '../../db/ebb/deviceProfileRepo'

const deviceProfileKeys = {
  all: ['deviceProfile'] as const,
  deviceId: () => [...deviceProfileKeys.all, 'deviceId'] as const,
  profile: (deviceId: string) => [...deviceProfileKeys.all, 'profile', deviceId] as const,
}

const useGetDeviceId = () => {
  return useQuery({
    queryKey: deviceProfileKeys.deviceId(),
    queryFn: () => DeviceProfileApi.getDeviceId(),
  })
}

const useGetDeviceProfile = (deviceId?: string) => {
  return useQuery({
    queryKey: deviceId ? deviceProfileKeys.profile(deviceId) : ['deviceProfile', 'profile', 'disabled'],
    queryFn: () => DeviceProfileApi.getDeviceProfile(deviceId!),
    enabled: !!deviceId,
  })
}

export const useUpdateDeviceProfilePreferences = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({deviceId, preferences}: {deviceId: string, preferences: DevicePreference}) => DeviceProfileApi.updateDeviceProfilePreferences(deviceId, preferences),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: deviceProfileKeys.profile(variables.deviceId) })
    }
  })
}


export const useDeviceProfile = () => {
  const { data: deviceId, isLoading: isLoadingDeviceId } = useGetDeviceId()
  const { data: deviceProfile, isLoading: isLoadingDeviceProfile } = useGetDeviceProfile(deviceId)

  return {
    deviceId,
    deviceProfile,
    isLoading: isLoadingDeviceId || isLoadingDeviceProfile,
    isLoadingDeviceId,
    isLoadingDeviceProfile,
  }
}
