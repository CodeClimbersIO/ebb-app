import supabase from '@/lib/integrations/supabase'
import { logAndToastError } from '@/lib/utils/logAndToastError'

const upsertDevice = async (
  userId: string,
  deviceId: string,
  deviceName: string
) => {
  const upsertData = {
    user_id: userId,
    device_id: deviceId,
    device_name: deviceName
  }

  const response = await supabase
    .from('device')
    .upsert(upsertData, { onConflict: 'user_id,device_id' })

  if (response.error) {
    logAndToastError(`[DeviceReg] Error upserting device: ${JSON.stringify(response.error, null, 2)}`)
  }
  return response
}

const getUserDevices = async (userId: string, filter: { active?: boolean } = {}) => {
  let query = supabase
    .from('device')
    .select('device_id, device_name, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (filter.active) {
    query = query.eq('active', filter.active)
  }

  return query
}

const deleteDevice = async (userId: string, deviceId: string) => {
  return supabase
    .from('device')
    .delete()
    .match({ user_id: userId, device_id: deviceId })
}

export const deviceRepo = {
  upsertDevice,
  getUserDevices,
  deleteDevice,
}
