import { AppRepo, AppWithLastUsed } from '@/db/monitor/appRepo'

const getRecentlyUsedApps = async (limit = 100, offset = 0): Promise<AppWithLastUsed[]> => {
  const apps = await AppRepo.getRecentlyUsedApps(limit, offset)
  return apps
}

const deleteApp = async (appId: string): Promise<void> => {
  await AppRepo.deleteApp(appId)
}

const deleteApps = async (appIds: string[]): Promise<void> => {
  await AppRepo.deleteApps(appIds)
}

const getAppCount = async (): Promise<number> => {
  return await AppRepo.getAppCount()
}

export const ActivityHistoryApi = {
  getRecentlyUsedApps,
  deleteApp,
  deleteApps,
  getAppCount,
}
