import { licenseRepo } from '../../db/supabase/licenseRepo'

const getLicense = async (userId: string) => {
  return licenseRepo.getLicense(userId)
}

export const licenseApi = {
  getLicense,
}

