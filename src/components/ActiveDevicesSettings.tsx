import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import supabase from '@/lib/integrations/supabase'
import { useEffect, useState } from 'react'
import { hostname } from '@tauri-apps/plugin-os'
import { User } from '@supabase/supabase-js'
import { Laptop2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { invoke } from '@tauri-apps/api/core'
import { Skeleton } from '@/components/ui/skeleton'

interface Device {
  id: string
  name: string
  last_active: string
  is_current: boolean
}

interface ActiveDevicesSettingsProps {
  user: User | null
  maxDevicesToShow: number
  onDeviceRemoved?: () => void
}

const cleanupHostname = (name: string): string => {
  return name
    .replace(/\.local$/, '')
    .replace(/-/g, ' ')
}

export function ActiveDevicesSettings({ user, maxDevicesToShow, onDeviceRemoved }: ActiveDevicesSettingsProps) {
  const [devices, setDevices] = useState<Device[]>([])
  const [isLoadingDevices, setIsLoadingDevices] = useState(true)
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null)

  useEffect(() => {
    const getCurrentDeviceId = async () => {
      try {
        const macAddress = await invoke<string>('get_mac_address')
        setCurrentDeviceId(macAddress)
      } catch (error) {
        console.error('Error getting MAC address:', error)
        setCurrentDeviceId(null)
      }
    }
    getCurrentDeviceId()
  }, [])

  const fetchDevices = async () => {
    if (!user) {
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
        console.error('Error getting hostname:', hostnameErr)
        currentDeviceName = 'This Device'
      }
      
      const { data: devicesData, error: fetchError } = await supabase
        .from('active_devices') 
        .select('device_id, device_name, last_active')
        .eq('user_id', user.id) 
        .order('last_active', { ascending: false })

      if (fetchError) {
        console.error('Supabase error fetching devices:', fetchError)
        throw fetchError
      }

      const allDevices = devicesData.map(d => ({
        id: d.device_id,
        name: d.device_name,
        last_active: d.last_active,
        is_current: d.device_id === currentDeviceId
      }))

      const sortedDevices = allDevices.sort((a, b) => {
        if (a.is_current) return -1
        if (b.is_current) return 1
        return new Date(b.last_active).getTime() - new Date(a.last_active).getTime()
      })

      setDevices(sortedDevices)
    } catch (err) {
      console.error('Error in fetchDevices:', err)
      if (currentDeviceId) {
         setDevices([{
            id: currentDeviceId,
            name: currentDeviceName || 'This Device',
            last_active: new Date().toISOString(),
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
  }, [user?.id, currentDeviceId])

  const handleDeviceLogout = async (logoutDeviceId: string) => {
    try {
      if (logoutDeviceId === currentDeviceId) return
      if (!user) throw new Error('No user found')

      const { error: deleteError } = await supabase
        .from('active_devices')
        .delete()
        .match({ user_id: user.id, device_id: logoutDeviceId })

      if (deleteError) {
        console.error('[Settings] Failed to delete device:', deleteError)
        throw deleteError
      }

      if (onDeviceRemoved) {
        window.location.reload()
      } else {
        fetchDevices()
      }

    } catch (err) {
      console.error('Error logging out device:', err)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Active Devices</h2>
        <div className="text-sm text-muted-foreground">
          {devices.length} of {maxDevicesToShow} device{maxDevicesToShow !== 1 ? 's' : ''}
        </div>
      </div>
      {isLoadingDevices ? (
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
                    Last active: {formatDistanceToNow(new Date(device.last_active), { addSuffix: true })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {device.is_current ? (
                  <Badge variant="outline" className="text-xs">
                    This Device
                  </Badge>
                ) : (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeviceLogout(device.id)}
                  >
                    Deactivate
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 
