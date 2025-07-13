export const getEnv = (): 'dev' | 'prod' => {
  return import.meta.env.DEV ? 'dev' : 'prod'
}

export const isDev = () => {
  return import.meta.env.DEV
}

export const canaryUsers = ['rphovley@gmail.com', 'paul@ebb.cool', 'djl.hovley@gmail.com', 'tanner@scaddenfamily.com', 'nathancovey23@gmail.com', 'chriszeuch.cz@gmail.com', 'kohouri@gmail.com', 'jacob.f.crockett@gmail.com']

export const isCanaryUser = (email?: string) => {
  return canaryUsers.includes(email || '')
}

export const canUseCategoryDashboard = (email?: string) => {
  return isCanaryUser(email)
}
