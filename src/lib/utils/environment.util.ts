import type { LicenseType } from '@/api/ebbApi/licenseApi'

export const getEnv = (): 'dev' | 'prod' => {
  return import.meta.env.DEV ? 'dev' : 'prod'
}

export const isDev = () => {
  return import.meta.env.DEV
}

export const canaryUsers = ['rphovley@gmail.com', 'paul@ebb.cool', 'djl.hovley@gmail.com', 'tanner@scaddenfamily.com', 'nathancovey23@gmail.com', 'chriszeuch.cz@gmail.com', 'kohouri@gmail.com', 'jacob.f.crockett@gmail.com', 'luiskm7796@gmail.com', 'barnetv7@gmail.com']

export const isEarlyAccessUser = (email?: string, licenseType?: LicenseType) => {
  return canaryUsers.includes(email || '') || licenseType === 'perpetual'
}

export const isTideGoalsFeatureEnabled = (email?: string, licenseType?: LicenseType) => {
  return isDev() || isEarlyAccessUser(email, licenseType)
}
