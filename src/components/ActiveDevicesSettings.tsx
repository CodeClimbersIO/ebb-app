import { Badge } from '@/components/ui/badge'
import { AnalyticsButton } from '@/components/ui/analytics-button'
import { useEffect, useState } from 'react'
import { hostname } from '@tauri-apps/plugin-os'
import { User } from '@supabase/supabase-js'
import { Laptop2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetCurrentDeviceId, useGetUserDevices, useLogoutDevice } from '../api/hooks/useDevice'

interface Device {
  id: string
  name: string
  created_at: string
  is_current: boolean
}

interface ActiveDevicesSettingsProps {
  user: User | null
  maxDevices: number
}

const cleanupHostname = (name: string): string => {
  return name
    .replace(/\.local$/, '')
    .replace(/-/g, ' ')
}

export function ActiveDevicesSettings({ user, maxDevices }: ActiveDevicesSettingsProps) {
  const [devices, setDevices] = useState<Device[]>([])
  const [isLoadingDevices, setIsLoadingDevices] = useState(true)

  const { data: currentDeviceId } = useGetCurrentDeviceId()
  const { data: userDevicesData, isLoading: devicesLoading, refetch: refetchDevices } = useGetUserDevices(user?.id || '')
  const { mutate: logoutDeviceMutation } = useLogoutDevice()

  const fetchDevices = async () => {
    if (!user || !userDevicesData || userDevicesData.length === 0) {
      setIsLoadingDevices(false)
      setDevices([])
      return
    }

    let currentDeviceName: string | null = null

    try {
      setIsLoadingDevices(true)
      
      try {
        const rawHostname = await hostname()
        currentDeviceName = rawHostname ? cleanupHostname(rawHostname) : 'This Device'
      } catch (hostnameErr) {
        console.error(`Error getting hostname: ${hostnameErr}`)
        currentDeviceName = 'This Device'
      }
      
      const allDevices = userDevicesData.map((d) => ({
        id: d.device_id,
        name: d.device_name,
        created_at: d.created_at,
        is_current: d.device_id === currentDeviceId
      }))

      const sortedDevices = allDevices.sort((a, b) => {
        if (a.is_current) return -1
        if (b.is_current) return 1
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })

      setDevices(sortedDevices)
    } catch (err) {
      console.error(`Error in fetchDevices: ${err}`)
      if (currentDeviceId) {
        setDevices([{
          id: currentDeviceId,
          name: currentDeviceName || 'This Device',
          created_at: new Date().toISOString(),
          is_current: true
        }])
      } else {
        setDevices([])
      }
    } finally {
      setIsLoadingDevices(false)
    }
  }

  useEffect(() => {
    fetchDevices()
  }, [user?.id, currentDeviceId, userDevicesData])

  const handleDeviceLogout = async (logoutDeviceId: string) => {
    try {
      if (logoutDeviceId === currentDeviceId) return
      if (!user) throw new Error('No user found')

      logoutDeviceMutation({
        userId: user.id,
        deviceId: logoutDeviceId
      }, {
        onSuccess: () => {
          refetchDevices()
        },
        onError: (err) => {
          console.error(`[Settings] Failed to delete device: ${err}`)
        }
      })

    } catch (err) {
      console.error(`[Settings] Error logging out device: ${err}`)
    }
  }

  const isLoading = devicesLoading || isLoadingDevices

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Active Devices</h2>
        <div className="text-sm text-muted-foreground">
          {devices.length} of {maxDevices} device{maxDevices !== 1 ? 's' : ''}
        </div>
      </div>
      {isLoading ? (
        <Skeleton className="h-14 w-full rounded-lg" />
      ) : (
        <div className="space-y-3">
          {devices.map((device) => (
            <div 
              key={device.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${device.is_current ? 'bg-muted/50 border-muted-foreground/20' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="text-muted-foreground">
                  <Laptop2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium text-sm">
                    {device.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Added: {formatDistanceToNow(new Date(device.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {device.is_current ? (
                  <Badge variant="outline" className="text-xs">
                    This Device
                  </Badge>
                ) : (
                  <AnalyticsButton
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeviceLogout(device.id)}
                    analyticsEvent="deactivate_device_clicked"
                    analyticsProperties={{
                      context: 'deactivate_device',
                      button_location: 'active_devices_settings'
                    }}
                  >
                    Deactivate
                  </AnalyticsButton>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 
