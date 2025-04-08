import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PaywallDialog } from '@/components/PaywallDialog'
import { useLicense } from '@/contexts/LicenseContext'
import { BadgeCheck, KeyRound, Laptop2, X } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import supabase from '@/lib/integrations/supabase'
import { useEffect, useState } from 'react'
import { hostname, type } from '@tauri-apps/plugin-os'

interface Device {
  id: string
  name: string
  last_active: string
  device_type: string
  is_current: boolean
}

const cleanupHostname = (name: string): string => {
  return name
    .replace(/\.local$/, '') // Remove .local suffix
    .replace(/-/g, ' ') // Replace dashes with spaces
}

const MAX_DEVICES = 3
const DEVICE_ID_KEY = 'ebb_device_id'

export function EbbProSettings() {
  const { license, isLoading: isLicenseLoading } = useLicense()
  const [devices, setDevices] = useState<Device[]>([])
  const [isLoadingDevices, setIsLoadingDevices] = useState(true)

  const fetchDevices = async () => {
    let deviceName: string | null = null
    let osType: string = 'desktop'

    try {
      setIsLoadingDevices(true)
      
      // Get current device info using Tauri OS plugin
      try {
        const rawHostname = await hostname()
        deviceName = rawHostname ? cleanupHostname(rawHostname) : null
        console.log('Got device name:', deviceName)
      } catch (hostnameErr) {
        console.error('Error getting hostname:', hostnameErr)
      }

      // Get OS type
      try {
        osType = type()
        console.log('Got OS type:', osType)
      } catch (typeErr) {
        console.error('Error getting OS type:', typeErr)
      }

      const deviceId = localStorage.getItem(DEVICE_ID_KEY)
      if (!deviceId) {
        throw new Error('No device ID found')
      }

      if (!license?.id) {
        console.log('No license found, showing only current device')
        setDevices([{
          id: deviceId,
          name: deviceName || 'This Device',
          last_active: new Date().toISOString(),
          device_type: osType,
          is_current: true
        }])
        return
      }

      // Fetch devices list
      const { data: devicesData, error: fetchError } = await supabase
        .from('license_devices')
        .select('*')
        .eq('license_id', license.id)
        .order('last_active', { ascending: false })

      if (fetchError) {
        console.error('Supabase error:', fetchError)
        throw fetchError
      }

      // Transform the data to match our Device interface
      const allDevices = devicesData.map(d => ({
        id: d.device_id,
        name: d.device_name,
        last_active: d.last_active,
        device_type: osType,
        is_current: d.device_id === deviceId
      }))

      setDevices(allDevices)
    } catch (err) {
      console.error('Error in fetchDevices:', err)
      // Set at least the current device even if we fail to fetch from database
      const deviceId = localStorage.getItem(DEVICE_ID_KEY)
      setDevices([{
        id: deviceId || 'unknown',
        name: deviceName || 'This Device',
        last_active: new Date().toISOString(),
        device_type: osType,
        is_current: true
      }])
    } finally {
      setIsLoadingDevices(false)
    }
  }

  useEffect(() => {
    fetchDevices()
  }, [license?.id])

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: { return_url: window.location.href },
      })

      if (error) throw error

      if (data?.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Error creating portal session:', err)
    }
  }

  const handleDeviceLogout = async (deviceId: string) => {
    try {
      // Don't allow logging out the current device
      if (deviceId === localStorage.getItem(DEVICE_ID_KEY)) {
        return
      }

      // Get the device's session ID
      const { data: deviceData, error: deviceError } = await supabase
        .from('license_devices')
        .select('session_id')
        .eq('device_id', deviceId)
        .single()

      if (deviceError || !deviceData?.session_id) {
        console.error('Error getting device session:', deviceError)
        throw deviceError
      }

      // Call the Edge Function to invalidate the session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invalidate-device-session`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            device_id: deviceId,
            license_id: license?.id,
            session_id: deviceData.session_id
          })
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to invalidate session')
      }

      // Remove the device from our devices table
      const { error } = await supabase
        .from('license_devices')
        .delete()
        .eq('device_id', deviceId)

      if (error) throw error

      // Refresh the devices list
      fetchDevices()
    } catch (err) {
      console.error('Error logging out device:', err)
    }
  }

  return (
    <div className="border rounded-lg p-6 space-y-6">
       <div>
         <div className="flex items-center justify-between mb-4">
           <div className="flex items-center justify-between flex-1 gap-4">
             <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-0 text-base px-3 py-1">
               <KeyRound className="h-4 w-4 mr-1.5" />
               Ebb Pro
             </Badge>
             {!isLicenseLoading && license && (license.status === 'active' || license.status === 'trialing') && (
               <div className="flex items-center gap-1.5">
                 <BadgeCheck className="h-4 w-4 text-green-500" />
                 <span className="text-sm text-muted-foreground">
                   License Active
                   {license.expiration_date && (
                     <span className="ml-2">
                       • Updates until {format(new Date(license.expiration_date), 'PP')}
                     </span>
                   )}
                 </span>
               </div>
             )}
           </div>
           {license && license.status === 'active' && license.license_type === 'subscription' && (
             <Button
               variant="outline"
               size="sm"
               onClick={handleManageSubscription}
               className="ml-4"
             >
               Manage Subscription
             </Button>
           )}
         </div>

         {isLicenseLoading ? (
           <div className="text-sm text-muted-foreground">Loading license status...</div>
         ) : !license || (license.status !== 'active' && license.status !== 'trialing') ? (
           <div className="flex items-center justify-between">
             <p className="text-sm text-muted-foreground">
               Unlock premium features and support the development of Ebb.
             </p>
             <div className="flex-shrink-0 ml-8">
               <PaywallDialog>
                 <Button>
                   Get Ebb Pro
                 </Button>
               </PaywallDialog>
             </div>
           </div>
         ) : null}
       </div>

       {/* Active Devices Section */}
       <div>
         <div className="flex items-center justify-between mb-2">
           <h3 className="text-md font-semibold">Active Devices</h3>
           <div className="text-sm text-muted-foreground">
             {devices.length} of {MAX_DEVICES} devices
           </div>
         </div>
         {isLoadingDevices ? (
           <div className="text-sm text-muted-foreground">Loading devices...</div>
         ) : (
           <div className="space-y-3">
             {devices.map((device) => (
               <div 
                 key={device.id}
                 className={`flex items-center justify-between p-3 rounded-lg border ${
                   device.is_current ? 'bg-muted/50 border-muted-foreground/20' : ''
                 }`}
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
                       Current Device
                     </Badge>
                   ) : (
                     <Button
                       variant="ghost"
                       size="sm"
                       className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
                       onClick={() => handleDeviceLogout(device.id)}
                     >
                       <X className="h-4 w-4" />
                     </Button>
                   )}
                 </div>
               </div>
             ))}
           </div>
         )}
       </div>
    </div>
  )
} 
