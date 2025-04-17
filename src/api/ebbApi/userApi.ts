import supabase from '@/lib/integrations/supabase'


const deleteDevice = async (userId: string, deviceId: string) => {
  const { error } = await supabase.from('devices').delete().match({
    user_id: userId,
    id: deviceId,
  })
  return { error }
}

export const userApi = {
  deleteDevice,
}

